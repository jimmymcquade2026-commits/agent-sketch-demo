import {eveChannel} from 'eve/channels/eve';
import {httpBasic} from 'eve/channels/auth';
// Only our authenticated, quota-checked server route may start or read sessions.
export default eveChannel({auth:async request=>{
 const secret=process.env.AGENT_RUNTIME_SECRET;
 if(!secret) return null;
 return httpBasic({username:'agentsketch',password:secret})(request);
}});
