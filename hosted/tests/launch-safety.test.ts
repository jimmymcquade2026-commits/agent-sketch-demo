import {test} from 'node:test';import assert from 'node:assert/strict';
import {launchChecklist,liveCheckoutApproved,isOwner,httpsUrl} from '../lib/launch-readiness.ts';
import {billingRiskAlert} from '../lib/billing-risk.ts';
import {billingReady,billingBackendReady,stripeClient} from '../lib/billing.ts';
const ready={BILLING_LIVE_ENABLED:'true',LAUNCH_APPROVED:'true',COMMERCIAL_HOSTING_CONFIRMED:'true',PUBLIC_EMAIL_VERIFIED:'true',PRIVATE_CONNECTIONS_VERIFIED:'true',BILLING_LIFECYCLE_VERIFIED:'true',TERMS_URL:'https://example.com/terms',PRIVACY_URL:'https://example.com/privacy',SUPPORT_EMAIL:'help@example.com',POLICIES_APPROVED:'true',BILLING_RISK_REVIEW_CONFIRMED:'true',SPEND_CONTROLS_CONFIRMED:'true',RECOVERY_VERIFIED:'true',PRODUCTION_SECURITY_CONFIRMED:'true'};
test('live checkout requires explicit approval and every prerequisite',()=>{
 assert.equal(liveCheckoutApproved({}),false);assert.equal(liveCheckoutApproved(ready),true);
 for(const key of Object.keys(ready)){assert.equal(liveCheckoutApproved({...ready,[key]:''}),false,key)}
 assert.ok(launchChecklist({}).every(c=>!c.done));assert.equal(httpsUrl('javascript:alert(1)'),null);assert.equal(httpsUrl('https://user:pass@example.com'),null);
});
test('owner access fails closed without a matching server-configured identity',()=>{assert.equal(isOwner('owner',{}),false);assert.equal(isOwner('other',{OWNER_USER_ID:'owner'}),false);assert.equal(isOwner('owner',{OWNER_USER_ID:'owner'}),true)});
test('blocking new live checkout does not disable subscription management or webhook clients',()=>{
 const fixture={STRIPE_SECRET_KEY:'rk_live_local_fixture',STRIPE_WEBHOOK_SECRET:'fixture',STRIPE_LAUNCH_PRICE_ID:'launch',STRIPE_STARTER_PRICE_ID:'starter',STRIPE_PLUS_PRICE_ID:'plus',STRIPE_SCALE_PRICE_ID:'scale',SUPABASE_SECRET_KEY:'fixture',NEXT_PUBLIC_SUPABASE_URL:'https://example.com',APP_URL:'https://example.com',BILLING_LIVE_ENABLED:'false',LAUNCH_APPROVED:'false'};
 const before=Object.fromEntries(Object.keys(fixture).map(key=>[key,process.env[key]]));
 try{Object.assign(process.env,fixture);assert.equal(billingBackendReady(),true);assert.equal(billingReady(),false);assert.doesNotThrow(()=>stripeClient())}finally{for(const [key,value] of Object.entries(before)){if(value===undefined)delete process.env[key];else process.env[key]=value}}
});
test('refund review excludes payment details and credentials',()=>{
 const result=billingRiskAlert({id:'evt_refund',type:'charge.refunded',created:100,data:{object:{id:'ch_test',customer:'cus_test',billing_details:{email:'private@example.com'},metadata:{token:'secret'}}}});
 assert.deepEqual(result,{id:'evt_refund',event_type:'charge.refunded',source_id:'ch_test',charge_id:'ch_test',customer_id:'cus_test',event_created:100});
 assert.ok(!JSON.stringify(result).includes('private'));assert.ok(!JSON.stringify(result).includes('secret'));
});
test('dispute and fraud alerts preserve resolvable charge IDs without guessing customers',()=>{
 for(const type of ['charge.dispute.created','radar.early_fraud_warning.created']){const r=billingRiskAlert({id:'evt',type,created:1,data:{object:{id:'risk',charge:'ch_test'}}});assert.equal(r?.charge_id,'ch_test');assert.equal(r?.customer_id,null)}
 assert.equal(billingRiskAlert({id:'evt',type:'invoice.paid',created:1,data:{object:{}}}),null);
});
