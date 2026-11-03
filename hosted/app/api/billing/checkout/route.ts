import {database} from '@/lib/supabase';
import {billingReady,stripeClient,adminDatabase,billingOrigin} from '@/lib/billing';
import {checkoutItems,isPaidPlan,plans,LAUNCH_PRICE} from '@/lib/plans';
import {readLimitedJson} from '@/lib/run-service';
export const maxDuration=60;
export async function POST(request:Request){
 const token=request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
 if(!token)return Response.json({error:'Sign in before upgrading.'},{status:401});
 if(!billingReady())return Response.json({error:'Checkout is awaiting billing configuration. No payment has been taken.'},{status:503});
 const {data:{user},error}=await database(token).auth.getUser(token);
 if(error||!user)return Response.json({error:'Sign in again.'},{status:401});
 let selected:unknown;try{selected=(await readLimitedJson(request,1000) as {plan?:unknown}).plan}catch{return Response.json({error:'Choose a monthly plan.'},{status:400})}
 if(!isPaidPlan(selected))return Response.json({error:'Choose Starter, Plus, or Pro.'},{status:400});
 const lockKey=crypto.randomUUID();let locked=false;
 try{
  const stripe=stripeClient(),db=adminDatabase();
  let {data:entitlement,error:readError}=await db.from('entitlements').select('*').eq('user_id',user.id).maybeSingle();
  if(readError)throw readError;
  if(entitlement?.plan&&entitlement.plan!=='free')return Response.json({error:'You already have a subscription. Use Manage subscription.'},{status:409});
  const {data:agent,error:agentError}=await db.from('runs').select('id').eq('user_id',user.id).eq('status','completed').limit(1);
  if(agentError)throw agentError;
  if(!agent?.length)return Response.json({error:'Complete a successful free preview task before launching your workspace.'},{status:409});
  if(!entitlement){const {error}=await db.from('entitlements').upsert({user_id:user.id},{onConflict:'user_id',ignoreDuplicates:true});if(error)throw error}
  const lease=await db.rpc('acquire_checkout_lock',{p_user_id:user.id,p_key:lockKey});if(lease.error)throw lease.error;
  if(!lease.data)return Response.json({error:'Another checkout is starting. Wait a moment and try again.'},{status:409});locked=true;
  const latest=await db.from('entitlements').select('*').eq('user_id',user.id).single();if(latest.error)throw latest.error;entitlement=latest.data;
  if(entitlement.plan!=='free')return Response.json({error:'Your subscription was updated. Refresh your plan.'},{status:409});
  let customer=entitlement?.stripe_customer_id as string|undefined;
  if(!customer){const created=await stripe.customers.create({email:user.email,metadata:{user_id:user.id}},{idempotencyKey:`agentsketch-customer-${user.id}`});customer=created.id;const {error}=await db.from('entitlements').upsert({user_id:user.id,stripe_customer_id:customer},{onConflict:'user_id'});if(error)throw error}
  const subscriptions=await stripe.subscriptions.list({customer,status:'all',limit:100});
  if(subscriptions.has_more||subscriptions.data.some(s=>['active','trialing','past_due','unpaid','incomplete','paused'].includes(s.status)))return Response.json({error:'An existing subscription needs attention. Use Manage subscription.'},{status:409});
  const launched=Boolean(entitlement?.launch_paid);
  const lineItems=checkoutItems(selected,launched);
  for(const item of lineItems){const price=await stripe.prices.retrieve(item.price);const launch=price.id===process.env.STRIPE_LAUNCH_PRICE_ID;if(!price.active||price.currency!=='usd'||price.unit_amount!==(launch?LAUNCH_PRICE:plans[selected].monthlyPrice)*100||(launch?price.type!=='one_time':price.recurring?.interval!=='month'||price.recurring.interval_count!==1))throw Error('Configured price does not match the displayed offer.')}
  // Reuse any open session, including one for another tier: only one first-launch fee can be paid.
  const open=await stripe.checkout.sessions.list({customer,status:'open',limit:100});
  if(open.has_more)return Response.json({error:'Checkout needs review. Please try later.'},{status:409});
  const existing=open.data.find(s=>s.mode==='subscription'&&s.metadata?.pricing_version==='launch_v1');
  if(existing?.metadata?.plan===selected&&existing.url)return Response.json({url:existing.url});
  for(const session of open.data.filter(s=>s.mode==='subscription'))await stripe.checkout.sessions.expire(session.id);
  const checkout=await stripe.checkout.sessions.create({mode:'subscription',customer,line_items:lineItems,client_reference_id:user.id,metadata:{user_id:user.id,plan:selected,pricing_version:'launch_v1'},subscription_data:{metadata:{user_id:user.id,plan:selected,pricing_version:'launch_v1'}},custom_text:{submit:{message:launched?'Your launch fee is already covered. This checkout starts a monthly subscription.':'Includes a one-time $69 workspace launch fee plus your first month. Only the monthly plan renews. No automatic usage overages.'}},success_url:`${billingOrigin()}/?billing=success`,cancel_url:`${billingOrigin()}/?billing=cancelled`,integration_identifier:'agentsketch_launch_fhwkbrpa'},{idempotencyKey:`agentsketch-launch-v1-${user.id}-${selected}-${launched}-${existing?.id||'new'}-${Math.floor(Date.now()/1800000)}`});
  return Response.json({url:checkout.url});
 }catch(error){const failure=error as {type?:string;code?:string;param?:string;statusCode?:number};console.error('Checkout failed',{type:failure.type,code:failure.code,param:failure.param,statusCode:failure.statusCode});return Response.json({error:'Checkout could not be started. Please try again later.'},{status:502})}
 finally{if(locked)await adminDatabase().rpc('release_checkout_lock',{p_user_id:user.id,p_key:lockKey})}
}
