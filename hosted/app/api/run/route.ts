import {generateText} from 'ai';
import {buildPrompt,MODEL,MAX_OUTPUT_TOKENS} from '@/lib/cost-policy';
import {executionEnabled} from '@/lib/runtime-policy';
import {connectionContext} from '@/lib/connections';
import {database} from '@/lib/supabase';
import {createRunHandler,QuotaError,type RunRecord} from '@/lib/run-service';
export const maxDuration=180;
export const POST=createRunHandler({
 configured:()=>executionEnabled(),
 observe:event=>console.info(JSON.stringify({service:'agentsketch',...event})),
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
  const context=await connectionContext(agent.user_id,agent.apps);
  // One bounded Gateway generation; no tools, loops, or SDK retries that multiply spend.
  const result=await generateText({model:MODEL,prompt:buildPrompt(agent,input,context),maxOutputTokens:MAX_OUTPUT_TOKENS,maxRetries:0,abortSignal:AbortSignal.timeout(60000)});
  console.info(JSON.stringify({service:'agentsketch',event:'model_usage',inputTokens:result.usage.inputTokens,outputTokens:result.usage.outputTokens}));
  return result.text+(result.finishReason==='length'?'\n\n[Output reached the 2,000-token limit. Ask a narrower follow-up for more detail.]':'');
 },
});
