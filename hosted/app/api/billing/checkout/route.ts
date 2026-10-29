import {database} from '@/lib/supabase';
import {billingReady,stripeClient,adminDatabase,billingOrigin} from '@/lib/billing';
export async function POST(request:Request){
 const token=request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
 if(!token)return Response.json({error:'Sign in before upgrading.'},{status:401});
 if(!billingReady())return Response.json({error:'Checkout is awaiting billing configuration. No payment has been taken.'},{status:503});
 const {data:{user},error}=await database(token).auth.getUser(token);
 if(error||!user)return Response.json({error:'Sign in again.'},{status:401});
 try{
  const stripe=stripeClient(),db=adminDatabase();
  const {data:entitlement,error:readError}=await db.from('entitlements').select('*').eq('user_id',user.id).maybeSingle();
  if(readError)throw readError;
  if(entitlement?.plan==='pro')return Response.json({error:'You already have Pro. Use Manage subscription.'},{status:409});
  let customer=entitlement?.stripe_customer_id as string|undefined;
  if(!customer){const created=await stripe.customers.create({email:user.email,metadata:{user_id:user.id}},{idempotencyKey:`agentsketch-customer-${user.id}`});customer=created.id;const {error}=await db.from('entitlements').upsert({user_id:user.id,stripe_customer_id:customer},{onConflict:'user_id'});if(error)throw error}
  const subscriptions=await stripe.subscriptions.list({customer,status:'all',limit:100});
  if(subscriptions.data.some(s=>['active','trialing','past_due','unpaid','incomplete','paused'].includes(s.status)))return Response.json({error:'An existing subscription needs attention. Use Manage subscription.'},{status:409});
  const checkout=await stripe.checkout.sessions.create({mode:'subscription',customer,line_items:[{price:process.env.STRIPE_PRO_PRICE_ID!,quantity:1}],client_reference_id:user.id,metadata:{user_id:user.id},subscription_data:{metadata:{user_id:user.id}},success_url:`${billingOrigin()}/?billing=success`,cancel_url:`${billingOrigin()}/?billing=cancelled`,integration_identifier:'agentsketch_checkout_qmbvtrsa'},{idempotencyKey:`agentsketch-checkout-${user.id}-${Math.floor(Date.now()/1800000)}`});
  return Response.json({url:checkout.url});
 }catch{return Response.json({error:'Checkout could not be started. Please try again later.'},{status:502})}
}
