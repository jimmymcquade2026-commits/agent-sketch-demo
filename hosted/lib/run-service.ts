import {runInput} from './validation.ts';
export type AgentRecord={id:string;name:string;instructions:string;knowledge:string;user_id?:string;apps?:string[]};
export type RunRecord={id:string;agent_name:string;input:string;output:string;status:'running'|'completed'|'failed';created_at:string};
export type RunStore={
 authenticate:(token:string)=>Promise<boolean>;
 findAgent:(id:string)=>Promise<AgentRecord|null>;
 findRun:(requestId:string)=>Promise<RunRecord|null>;
 reserve:(agent:AgentRecord,input:string,requestId:string)=>Promise<RunRecord>;
 finish:(id:string,status:'completed'|'failed',output:string)=>Promise<RunRecord>;
};
export class QuotaError extends Error{}
export class InputTooLargeError extends Error{}
export async function readLimitedJson(request:Pick<Request,'body'>,limit=100000):Promise<unknown>{
 const reader=request.body?.getReader();if(!reader)throw new Error('Missing body');
 const chunks:Uint8Array[]=[];let total=0;
 try{for(;;){const {value,done}=await reader.read();if(done)break;total+=value.byteLength;if(total>limit){await reader.cancel();throw new InputTooLargeError()}chunks.push(value)}}finally{reader.releaseLock()}
 const all=new Uint8Array(total);let offset=0;for(const chunk of chunks){all.set(chunk,offset);offset+=chunk.length}
 return JSON.parse(new TextDecoder().decode(all));
}
export function createRunHandler(deps:{configured:()=>boolean;store:(token:string)=>RunStore;execute:(agent:AgentRecord,input:string)=>Promise<string>}){
 return async function POST(request:Request){
  const token=request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
  if(!token)return Response.json({error:'Sign in to run your agent.'},{status:401});
  if(!deps.configured())return Response.json({error:'Hosted execution is awaiting deployment configuration. Your saved agent is ready; no run was charged.'},{status:503});
  const store=deps.store(token);
  try{if(!await store.authenticate(token))return Response.json({error:'Your session expired. Sign in again.'},{status:401})}catch{return Response.json({error:'Account verification is temporarily unavailable.'},{status:503})}
  let body;
  try{body=runInput.parse(await readLimitedJson(request))}catch(e){return Response.json({error:e instanceof InputTooLargeError?'Input too large.':'Choose an agent and enter a task of 1–20,000 characters.'},{status:e instanceof InputTooLargeError?413:400})}
  let run:RunRecord;
  let agent:AgentRecord;
  try{
   const prior=await store.findRun(body.requestId);
   if(prior)return Response.json({run:prior},{status:prior.status==='running'?202:200});
   const found=await store.findAgent(body.agentId);
   if(!found)return Response.json({error:'Agent not found.'},{status:404});
   agent=found;
   run=await store.reserve(agent,body.input,body.requestId);
  }catch(e){
   // Another request can win the unique idempotency key while this one waits for the quota lock.
   const prior=await store.findRun(body.requestId).catch(()=>null);
   if(prior)return Response.json({run:prior},{status:prior.status==='running'?202:200});
   return Response.json({error:e instanceof QuotaError?e.message:'This run could not be reserved. Refresh your history before retrying.'},{status:e instanceof QuotaError?429:503});
  }
  let output:string;
  try{output=await deps.execute(agent,body.input);if(!output.trim())throw new Error('Empty result')}
  catch{
   const output='Execution could not complete. Review run history before trying again.';
   const failed=await store.finish(run.id,'failed',output).catch(()=>({...run,status:'failed' as const,output}));
   return Response.json({error:output,run:failed},{status:502});
  }
  if(output.length>100000)output=output.slice(0,99920)+'\n\n[Result truncated to the workspace storage limit.]';
  try{return Response.json({run:await store.finish(run.id,'completed',output)})}
  catch{return Response.json({run:{...run,status:'completed',output},warning:'Your result is ready, but history could not be updated. Download it now; do not rerun the task.'})}
 }
}
