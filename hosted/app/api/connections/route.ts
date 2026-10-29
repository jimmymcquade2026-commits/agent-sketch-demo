import {database} from '@/lib/supabase';
import {adminDatabase} from '@/lib/billing';
import {connectionsReady} from '@/lib/connections';
import {connectionInput,readConnection} from '@/lib/connection-source';
import {encryptToken} from '@/lib/credential-vault';
import {readLimitedJson} from '@/lib/run-service';
async function caller(request:Request){const token=request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];if(!token)return null;const {data,error}=await database(token).auth.getUser(token);return error?null:data.user}
export async function GET(request:Request){const user=await caller(request);if(!user)return Response.json({error:'Sign in first.'},{status:401});if(!connectionsReady())return Response.json({connections:[],configured:false});const {data,error}=await adminDatabase().from('connections').select('provider,resource,updated_at').eq('user_id',user.id);return error?Response.json({error:'Connections unavailable.'},{status:503}):Response.json({connections:data,configured:true})}
export async function POST(request:Request){
 const user=await caller(request);if(!user)return Response.json({error:'Sign in first.'},{status:401});
 if(!connectionsReady())return Response.json({error:'Secure app connections are awaiting server configuration.'},{status:503});
 const db=adminDatabase();const {data:plan}=await db.from('entitlements').select('plan').eq('user_id',user.id).maybeSingle();
 if(plan?.plan!=='pro')return Response.json({error:'Private app connections are included in Pro.'},{status:403});
 let input;try{input=connectionInput.parse(await readLimitedJson(request,6000))}catch{return Response.json({error:'Enter the provider, resource, and token.'},{status:400})}
 try{await readConnection(input)}catch{return Response.json({error:'Could not verify this connection. Check the token, resource ID, permissions, and provider rate limits.'},{status:400})}
 const {error}=await db.from('connections').upsert({user_id:user.id,provider:input.provider,resource:input.resource,encrypted_token:encryptToken(input.token,user.id,input.provider,process.env.AGENT_RUNTIME_SECRET!),updated_at:new Date().toISOString()},{onConflict:'user_id,provider'});
 return error?Response.json({error:'Could not save this connection.'},{status:503}):Response.json({connected:true});
}
export async function DELETE(request:Request){const user=await caller(request);if(!user)return Response.json({error:'Sign in first.'},{status:401});if(!connectionsReady())return Response.json({error:'Connection management unavailable.'},{status:503});const provider=new URL(request.url).searchParams.get('provider');if(!provider)return Response.json({error:'Choose a connection.'},{status:400});const {error}=await adminDatabase().from('connections').delete().eq('user_id',user.id).eq('provider',provider);return error?Response.json({error:'Could not disconnect.'},{status:503}):Response.json({disconnected:true})}
