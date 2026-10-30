import {createClient} from '@supabase/supabase-js';
import {database} from '@/lib/supabase';
import {adminDatabase,billingReady,stripeClient} from '@/lib/billing';
import {readLimitedJson} from '@/lib/run-service';
import {z} from 'zod';
export const maxDuration=60;
async function caller(request:Request){const token=request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];if(!token)return null;const db=database(token);const {data,error}=await db.auth.getUser(token);return error||!data.user?null:{db,user:data.user,token}}
export async function GET(request:Request){
 const auth=await caller(request);if(!auth)return Response.json({error:'Sign in first.'},{status:401});
 try{
  const [agents,plan,connections]=await Promise.all([auth.db.from('agents').select('name,instructions,knowledge,template,apps,created_at'),auth.db.from('entitlements').select('plan').maybeSingle(),auth.db.from('connections').select('provider,resource,updated_at')]);
  if(agents.error||plan.error||connections.error)throw Error('Export failed');
  const runs:unknown[]=[];let truncated=false;let exportBytes=JSON.stringify(agents.data).length*3;
  exportLoop:for(let start=0;start<10000;start+=50){const r=await auth.db.from('runs').select('agent_name,input,output,status,created_at').order('created_at',{ascending:false}).order('id',{ascending:false}).range(start,start+49);if(r.error)throw r.error;for(const run of r.data){const bytes=new TextEncoder().encode(JSON.stringify(run)).length;if(exportBytes+bytes>3000000){truncated=true;break exportLoop;}runs.push(run);exportBytes+=bytes;}if(r.data.length<50)break;if(start===9950)truncated=true;}
  return Response.json({format:'agentsketch-workspace',version:1,exportedAt:new Date().toISOString(),email:auth.user.email,plan:plan.data?.plan||'free',agents:agents.data,runs,connections:connections.data,runLimit:10000,exportByteLimit:3000000,runsMayBeTruncated:truncated},{headers:{'Cache-Control':'no-store','Content-Disposition':'attachment; filename="agentsketch-workspace.json"'}});
 }catch{return Response.json({error:'Export could not be completed. Please try again.'},{status:503})}
}
export async function DELETE(request:Request){
 const auth=await caller(request);if(!auth)return Response.json({error:'Sign in first.'},{status:401});
 let body;try{body=z.object({confirmation:z.literal('DELETE'),password:z.string().min(1).max(200)}).parse(await readLimitedJson(request,2000))}catch{return Response.json({error:'Type DELETE and enter your current password.'},{status:400})}
 if(!auth.user.email)return Response.json({error:'Email verification is required.'},{status:400});
 const verifier=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});const verified=await verifier.auth.signInWithPassword({email:auth.user.email,password:body.password});
 if(verified.error||verified.data.user?.id!==auth.user.id)return Response.json({error:'The password was not accepted.'},{status:403});
 await verifier.auth.signOut({scope:'local'});
 try{
  const db=adminDatabase();const {data:ent,error}=await db.from('entitlements').select('stripe_customer_id').eq('user_id',auth.user.id).maybeSingle();if(error)throw error;
  if(ent?.stripe_customer_id){if(!billingReady())return Response.json({error:'Billing verification is unavailable. Please try later.'},{status:503});const subs=await stripeClient().subscriptions.list({customer:ent.stripe_customer_id,status:'all',limit:100});if(subs.has_more||subs.data.some(s=>!['canceled','incomplete_expired'].includes(s.status)))return Response.json({error:'Cancel your subscription and wait until it has ended before deleting your account. You can manage it under Plans & usage.'},{status:409});}
  const {error:revokeError}=await db.auth.admin.signOut(auth.token,'global');if(revokeError)throw revokeError;
  const {error:deleteError}=await db.auth.admin.deleteUser(auth.user.id);if(deleteError)throw deleteError;
  return Response.json({deleted:true});
 }catch{return Response.json({error:'Account deletion could not be completed. Please try again.'},{status:503})}
}
