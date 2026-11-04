import {database} from '@/lib/supabase';
import {adminDatabase,billingBackendReady} from '@/lib/billing';
import {isOwner,launchChecklist,liveCheckoutApproved} from '@/lib/launch-readiness';
import {readLimitedJson} from '@/lib/run-service';
import {z} from 'zod';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store'};
async function owner(request:Request){
 const token=request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];if(!token)return {status:401};
 const {data,error}=await database(token).auth.getUser(token);if(error||!data.user)return {status:401};
 return isOwner(data.user.id)?{status:200}:{status:403};
}
export async function GET(request:Request){
 try{const auth=await owner(request);if(auth.status!==200)return Response.json({error:'Owner access required.'},{status:auth.status,headers});
  const db=adminDatabase();const [alerts,health]=await Promise.all([db.from('billing_alerts').select('id,event_type,source_id,charge_id,customer_id,event_created,state').eq('state','open').order('event_created',{ascending:false}).limit(50),db.from('agents').select('id',{head:true}).limit(1)]);
  if(alerts.error||health.error)throw Error();
  return Response.json({owner:true,checklist:launchChecklist(),approved:liveCheckoutApproved(),billingMode:process.env.STRIPE_SECRET_KEY?.includes('_live_')?'live':'test',billingConfigured:billingBackendReady(),alerts:alerts.data,alertsLimit:50,gitDeployConfirmed:process.env.GIT_DEPLOY_VERIFIED==='true'},{headers});
 }catch{return Response.json({error:'Launch status could not be loaded.'},{status:503,headers})}
}
export async function POST(request:Request){
 try{const auth=await owner(request);if(auth.status!==200)return Response.json({error:'Owner access required.'},{status:auth.status,headers});
  let body;try{body=z.object({id:z.string().min(1).max(255),state:z.enum(['open','reviewed'])}).parse(await readLimitedJson(request,1000))}catch{return Response.json({error:'Choose an alert and review state.'},{status:400,headers})}
  const {data,error}=await adminDatabase().from('billing_alerts').update({state:body.state,reviewed_at:body.state==='reviewed'?new Date().toISOString():null}).eq('id',body.id).select('id').maybeSingle();
  if(error)throw error;return Response.json(data?{updated:true}:{error:'Alert not found.'},{status:data?200:404,headers});
 }catch{return Response.json({error:'Alert could not be updated.'},{status:503,headers})}
}
