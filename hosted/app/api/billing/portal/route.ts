import {database} from '@/lib/supabase';
import {billingReady,stripeClient,billingOrigin} from '@/lib/billing';
export async function POST(request:Request){
 const token=request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
 if(!token)return Response.json({error:'Sign in first.'},{status:401});
 if(!billingReady())return Response.json({error:'Billing is not configured.'},{status:503});
 const db=database(token);const {data:{user},error}=await db.auth.getUser(token);
 if(error||!user)return Response.json({error:'Sign in again.'},{status:401});
 const {data}=await db.from('entitlements').select('stripe_customer_id').eq('user_id',user.id).maybeSingle();
 if(!data?.stripe_customer_id)return Response.json({error:'No subscription account exists yet.'},{status:404});
 try{const portal=await stripeClient().billingPortal.sessions.create({customer:data.stripe_customer_id,return_url:`${billingOrigin()}/?billing=returned`});return Response.json({url:portal.url})}catch{return Response.json({error:'The subscription portal is unavailable. Please try again later.'},{status:502})}
}
