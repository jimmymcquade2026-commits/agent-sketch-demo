import {z} from 'zod';
import {agentInput} from './validation.ts';
const portable=z.object({format:z.literal('agentsketch-agent'),version:z.literal(1),agent:agentInput});
export function exportAgent(agent:unknown){return JSON.stringify({format:'agentsketch-agent',version:1,agent:agentInput.parse(agent)},null,2)}
export function importAgent(text:string){
 if(text.length>100000)throw new Error('Choose an agent file under 100 KB.');
 const data=portable.parse(JSON.parse(text));
 // Connections are account-specific. Never silently enable private data sources on import.
 return {...data.agent,apps:data.agent.apps.filter(app=>app==='files'||app==='github')};
}
