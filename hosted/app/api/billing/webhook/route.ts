import type Stripe from 'stripe';
import {z} from 'zod';
import {billingReady,stripeClient,adminDatabase} from '@/lib/billing';
export async function POST(request:Request){
 if(!billingReady())return Response.json({error:'Webhook is not configured.'},{status:503});
 const signature=request.headers.get('stripe-signature');if(!signature)return Response.json({error:'Signature required.'},{status:400});
 const stripe=stripeClient();let event:Stripe.Event;
 try{event=stripe.webhooks.constructEvent(await request.text(),signature,process.env.STRIPE_WEBHOOK_SECRET!)}catch{return Response.json({error:'Invalid signature.'},{status:400})}
 const live=Boolean(process.env.STRIPE_SECRET_KEY?.includes('_live_'));
 if(event.livemode!==live)return Response.json({error:'Billing mode mismatch.'},{status:400});
 let subscriptionId:string|null=null;
 if(event.type==='checkout.session.completed'||event.type==='checkout.session.async_payment_succeeded'){
  const session=event.data.object;
  if(session.payment_status!=='paid')return Response.json({received:true});
  subscriptionId=typeof session.subscription==='string'?session.subscription:session.subscription?.id||null;
 }else if(['customer.subscription.created','customer.subscription.updated','customer.subscription.deleted'].includes(event.type))subscriptionId=(event.data.object as Stripe.Subscription).id;
 if(!subscriptionId)return Response.json({received:true});
 try{
  // Retrieve authoritative current state; delayed webhooks must not restore a cancelled subscription.
  const subscription=await stripe.subscriptions.retrieve(subscriptionId);
  const userId=subscription.metadata.user_id;
  if(!z.uuid().safeParse(userId).success||!subscription.items.data.some(i=>i.price.id===process.env.STRIPE_PRO_PRICE_ID))return Response.json({received:true});
  const customer=typeof subscription.customer==='string'?subscription.customer:subscription.customer.id;
  const plan=subscription.status==='active'?'pro':'free';
  const {error}=await adminDatabase().rpc('apply_subscription_event',{p_event_id:event.id,p_event_created:event.created,p_user_id:userId,p_customer_id:customer,p_subscription_id:subscription.id,p_plan:plan});
  if(error)throw error;
  return Response.json({received:true});
 }catch{return Response.json({error:'Event processing failed; retry this event.'},{status:500})}
}
