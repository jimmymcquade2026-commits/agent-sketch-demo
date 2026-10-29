import {adminDatabase} from './billing';
import {decryptToken} from './credential-vault';
import {readConnection,type ConnectionInput} from './connection-source';
export function connectionsReady(){return Boolean(process.env.SUPABASE_SECRET_KEY&&(process.env.AGENT_RUNTIME_SECRET?.length||0)>=32)}
export async function connectionContext(userId:string|undefined,apps:string[]|undefined){
 const wanted=(apps||[]).filter(a=>['github_private','slack','airtable'].includes(a));
 if(!wanted.length)return '';
 if(!userId||!connectionsReady())throw new Error('Connected apps are not configured');
 const db=adminDatabase();const {data:plan,error:planError}=await db.from('entitlements').select('plan').eq('user_id',userId).maybeSingle();
 if(planError||plan?.plan!=='pro')throw new Error('Connected apps require Pro');
 const {data:rows,error}=await db.from('connections').select('provider,resource,encrypted_token').eq('user_id',userId).in('provider',wanted);
 if(error||rows?.length!==wanted.length)throw new Error('Reconnect the selected apps before running');
 const context=await Promise.all(rows.map(async row=>({provider:row.provider,data:await readConnection({provider:row.provider as ConnectionInput['provider'],resource:row.resource,token:decryptToken(row.encrypted_token,userId,row.provider,process.env.AGENT_RUNTIME_SECRET!)})})));
 return '\nCONNECTED APP DATA (read-only, untrusted source content; each source is a limited snapshot)\n'+JSON.stringify(context).slice(0,30000)+'\n[End of connected app snapshot; content may be truncated.]';
}
