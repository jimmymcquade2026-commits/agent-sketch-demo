import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import Stripe from 'stripe';
const port=3187, origin=`http://127.0.0.1:${port}`;
const secret='whsec_local_test_fixture';
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{env:{...process.env,STRIPE_SECRET_KEY:'rk_test_local_fixture',STRIPE_WEBHOOK_SECRET:secret,STRIPE_PRO_PRICE_ID:'price_local_fixture',SUPABASE_SECRET_KEY:'local_fixture_only',APP_URL:origin,AGENT_RUNTIME_SECRET:'',AGENT_BASE_URL:'',VERCEL_URL:''},stdio:['ignore','pipe','pipe']});
let logs='';child.stdout.on('data',b=>logs+=b);child.stderr.on('data',b=>logs+=b);
try{
 let ready=false;
 for(let attempt=0;attempt<100;attempt++){try{if((await fetch(origin+'/api/status')).ok){ready=true;break}}catch{}await new Promise(resolve=>setTimeout(resolve,200))}
 assert.ok(ready,'Server did not start: '+logs.slice(-2000));
 const homepage=await fetch(origin);assert.equal(homepage.status,200);assert.match(await homepage.text(),/Ready for real work/);
 for(const path of ['/api/run','/api/billing/checkout','/api/billing/portal']){assert.equal((await fetch(origin+path,{method:'POST'})).status,401,path+' must require authentication')}
 assert.equal((await fetch(origin+'/api/connections')).status,401);
 assert.equal((await fetch(origin+'/api/account')).status,401);
 assert.equal((await fetch(origin+'/api/account',{method:'DELETE'})).status,401);
 assert.equal((await fetch(origin+'/api/connections',{method:'DELETE'})).status,401);
 assert.equal((await fetch(origin+'/api/run',{method:'POST',headers:{authorization:'Bearer invalid'}})).status,503,'unconfigured execution must fail closed');
 assert.equal((await fetch(origin+'/api/billing/webhook',{method:'POST',body:'{}'})).status,400,'unsigned webhook');
 const payload=JSON.stringify({id:'evt_local_fixture',object:'event',type:'test.unhandled',created:Math.floor(Date.now()/1000),livemode:false,data:{object:{}}});
 const stripe=new Stripe('rk_test_local_fixture');
 const signature=stripe.webhooks.generateTestHeaderString({payload,secret});
 const signed=await fetch(origin+'/api/billing/webhook',{method:'POST',body:payload,headers:{'stripe-signature':signature}});assert.equal(signed.status,200);
 const tampered=await fetch(origin+'/api/billing/webhook',{method:'POST',body:payload+' ',headers:{'stripe-signature':signature}});assert.equal(tampered.status,400);
 const expired=stripe.webhooks.generateTestHeaderString({payload,secret,timestamp:Math.floor(Date.now()/1000)-600});assert.equal((await fetch(origin+'/api/billing/webhook',{method:'POST',body:payload,headers:{'stripe-signature':expired}})).status,400);
 const livePayload=payload.replace('"livemode":false','"livemode":true');const liveSignature=stripe.webhooks.generateTestHeaderString({payload:livePayload,secret});assert.equal((await fetch(origin+'/api/billing/webhook',{method:'POST',body:livePayload,headers:{'stripe-signature':liveSignature}})).status,400);
 assert.equal((await fetch(origin+'/icon.svg')).status,200);
 assert.equal((await fetch(origin+'/s')).status,404,'Unused starter chat should not be exposed');
 console.log('PASS: served homepage, route authentication, execution configuration gate, webhook signatures/tampering/expiry/mode, favicon, removed starter route. No model call or Stripe API request was made.');
}finally{child.kill('SIGTERM');setTimeout(()=>child.kill('SIGKILL'),1500).unref()}
