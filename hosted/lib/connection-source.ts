import {z} from 'zod';
import {readLimitedJson} from './run-service.ts';
export const connectionInput=z.object({provider:z.enum(['github_private','slack','airtable']),resource:z.string().trim().min(1).max(200),token:z.string().trim().min(10).max(2000)});
export type ConnectionInput=z.infer<typeof connectionInput>;
export async function readConnection(input:ConnectionInput,fetcher:typeof fetch=fetch){
 let url:string;
 const headers:Record<string,string>={Authorization:`Bearer ${input.token}`};
 if(input.provider==='github_private'){
  if(!/^[A-Za-z0-9-]{1,39}\/[A-Za-z0-9_.-]{1,100}$/.test(input.resource))throw new Error('Enter a GitHub owner/repository.');
  url=`https://api.github.com/repos/${input.resource}/issues?state=open&per_page=15`;
  headers.Accept='application/vnd.github+json';headers['X-GitHub-Api-Version']='2026-03-10';headers['User-Agent']='AgentSketch';
 }else if(input.provider==='slack'){
  if(!/^[CGD][A-Z0-9]{7,30}$/.test(input.resource))throw new Error('Enter a valid Slack channel ID.');
  url=`https://slack.com/api/conversations.history?channel=${input.resource}&limit=15`;
 }else{
  if(!/^app[A-Za-z0-9]+\/tbl[A-Za-z0-9]+$/.test(input.resource))throw new Error('Enter an Airtable base ID/table ID.');
  url=`https://api.airtable.com/v0/${input.resource}?pageSize=25&maxRecords=25`;
 }
 const response=await fetcher(url,{headers,redirect:'error',signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw new Error(`Connection returned ${response.status}. Check its permissions, resource, and rate limit.`);
 const data=await readLimitedJson(response,1000000);
 if(input.provider==='github_private'){
  const rows=z.array(z.object({title:z.string(),html_url:z.string(),body:z.string().nullable().optional()})).parse(data);
  return {source:input.resource,scope:'Up to 15 recent open GitHub issues and pull requests',items:rows.map(row=>({...row,body:row.body?.slice(0,1500)}))};
 }
 if(input.provider==='slack'){
  const value=z.object({ok:z.boolean(),messages:z.array(z.object({text:z.string().optional(),ts:z.string()})).optional()}).parse(data);
  if(!value.ok)throw new Error('Slack could not read this channel. Check the bot token, channel membership, and history scope.');
  return {source:input.resource,scope:'Up to 15 recent Slack channel messages; threads are not expanded',items:value.messages?.map(m=>({text:m.text?.slice(0,2000),timestamp:m.ts}))||[]};
 }
 const value=z.object({records:z.array(z.object({id:z.string(),fields:z.record(z.string(),z.unknown())}))}).parse(data);
 return {source:input.resource,scope:'First 25 Airtable records; not the complete table',items:value.records};
}
