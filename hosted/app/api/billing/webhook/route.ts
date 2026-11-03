import type Stripe from 'stripe';
import {z} from 'zod';
import {billingReady,stripeClient,adminDatabase} from '@/lib/billing';
import {planForPrice} from '@/lib/plans';
export async function POST(request:Request){
 if(!billingReady())return Response.json({error:'Webhook is not configured.'},{status:503});
 const signature=request.headers.get('stripe-signature');if(!signature)return Response.json({error:'Signature required.'},{status:400});
 const stripe=stripeClient();let event:Stripe.Event;
 try{event=stripe.webhooks.constructEvent(await request.text(),signature,process.env.STRIPE_WEBHOOK_SECRET!)}catch{return Response.json({error:'Invalid signature.'},{status:400})}
 const live=Boolean(process.env.STRIPE_SECRET_KEY?.includes('_live_'));
 if(event.livemode!==live)return Response.json({error:'Billing mode mismatch.'},{status:400});
 let subscriptionId:string|null=null;
 let paidCheckout:Stripe.Checkout.Session|null=null;
 if(event.type==='checkout.session.completed'||event.type==='checkout.session.async_payment_succeeded'){
  const session=event.data.object;
  if(session.payment_status!=='paid')return Response.json({received:true});
  paidCheckout=session;
  subscriptionId=typeof session.subscription==='string'?session.subscription:session.subscription?.id||null;
 }else if(['customer.subscription.created','customer.subscription.updated','customer.subscription.deleted'].includes(event.type))subscriptionId=(event.data.object as Stripe.Subscription).id;
 else if(event.type==='invoice.paid'||event.type==='invoice.payment_failed'){
  const invoice=event.data.object as Stripe.Invoice;
  const ref=invoice.parent?.subscription_details?.subscription;
  subscriptionId=typeof ref==='string'?ref:ref?.id||null;
 }
 if(!subscriptionId)return Response.json({received:true});
 try{
  // Retrieve authoritative current state; delayed webhooks must not restore a cancelled subscription.
  const subscription=await stripe.subscriptions.retrieve(subscriptionId);
  const userId=subscription.metadata.user_id;
  const tier=subscription.items.data.map(i=>planForPrice(i.price.id)).find(Boolean);
  if(!z.uuid().safeParse(userId).success||!tier)return Response.json({received:true});
  const customer=typeof subscription.customer==='string'?subscription.customer:subscription.customer.id;
  const db=adminDatabase();
  if(paidCheckout){
   if(paidCheckout.client_reference_id!==userId||paidCheckout.customer!==customer)return Response.json({error:'Checkout ownership mismatch.'},{status:400});
   const items=await stripe.checkout.sessions.listLineItems(paidCheckout.id,{limit:100});
   if(items.data.some(item=>item.price?.id===process.env.STRIPE_LAUNCH_PRICE_ID&&item.quantity===1)){
    const {error}=await db.rpc('record_workspace_launch',{p_user_id:userId,p_customer_id:customer,p_session_id:paidCheckout.id});if(error)throw error;
   }
  }
  const {data:ent,error:entError}=await db.from('entitlements').select('launch_paid').eq('user_id',userId).eq('stripe_customer_id',customer).maybeSingle();
  if(entError)throw entError;
  // The initial active event can arrive before Checkout. Never grant a new tier without its launch payment.
  if(tier!=='pro'&&subscription.status==='active'&&!ent?.launch_paid)return Response.json({received:true});
  const plan=subscription.status==='active'?tier:'free';
  const {error}=await db.rpc('apply_subscription_event',{p_event_id:event.id,p_event_created:event.created,p_user_id:userId,p_customer_id:customer,p_subscription_id:subscription.id,p_plan:plan});
  if(error)throw error;
  return Response.json({received:true});
 }catch{return Response.json({error:'Event processing failed; retry this event.'},{status:500})}
}
