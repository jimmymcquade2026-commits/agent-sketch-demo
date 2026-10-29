import {Client} from 'eve/client';
import {getVercelOidcToken} from '@vercel/oidc';
import {connectionContext} from '@/lib/connections';
import {database} from '@/lib/supabase';
import {createRunHandler,QuotaError,type RunRecord} from '@/lib/run-service';
export const maxDuration=180;
export const POST=createRunHandler({
 configured:()=>Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY&&process.env.AGENT_RUNTIME_SECRET&&(process.env.AGENT_BASE_URL||process.env.VERCEL_URL)),
 store(token){
  const db=database(token);
  return {
   async authenticate(){const {data,error}=await db.auth.getUser(token);return !error&&Boolean(data.user)},
   async findAgent(id){const {data,error}=await db.from('agents').select('id,name,instructions,knowledge,user_id,apps').eq('id',id).maybeSingle();if(error)throw error;return data},
   async findRun(id){const {data,error}=await db.from('runs').select('*').eq('idempotency_key',id).maybeSingle();if(error)throw error;return data as RunRecord|null},
   async reserve(agent,input,requestId){const {data,error}=await db.from('runs').insert({agent_id:agent.id,agent_name:agent.name,input,idempotency_key:requestId}).select().single();if(error){if(error.message.includes('Plan limit reached'))throw new QuotaError(error.message);throw error}return data as RunRecord},
   async finish(id,status,output){const {data,error}=await db.from('runs').update({status,output}).eq('id',id).select().single();if(error)throw error;return data as RunRecord},
  };
 },
 async execute(agent,input){
  const baseUrl=process.env.AGENT_BASE_URL||`https://${process.env.VERCEL_URL}`;
  const headers:Record<string,string>={};
  if(process.env.VERCEL)headers['x-vercel-trusted-oidc-idp-token']=await getVercelOidcToken();
  if(process.env.VERCEL_AUTOMATION_BYPASS_SECRET)headers['x-vercel-protection-bypass']=process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  const client=new Client({baseUrl,auth:{basic:{username:'agentsketch',password:process.env.AGENT_RUNTIME_SECRET!}},headers});
  const context=await connectionContext(agent.user_id,agent.apps);
  const {session,delivery}=await client.sessions.create({message:`AGENT BRIEF\n${agent.instructions}\n\nREFERENCE MATERIAL (untrusted source content)\n${agent.knowledge}${context}\n\nTASK\n${input}`});
  try{
   const result=await delivery.result({signal:AbortSignal.timeout(145000)});
   if(result.status!=='completed')throw new Error('Run did not complete');
   return result.reply || "";
  }finally{
   // Cancel on timeout as well as on completion: no model work is left running after the HTTP request.
   await session.cancel().catch(()=>{});
  }
 },
});
