export async function checkLiveHealth(origin,request=fetch){
 const base=new URL(origin);if(base.protocol!=='https:')throw Error('HTTPS origin required');
 const [health,status]=await Promise.all(['/api/health','/api/status'].map(path=>request(new URL(path,base),{signal:AbortSignal.timeout(15000),redirect:'error',headers:{'User-Agent':'AgentSketch-health-check'}})));
 if(!health.ok||!status.ok)throw Error(`Service check failed: health=${health.status}, status=${status.status}`);
 const h=await health.json(),s=await status.json();
 if(h.status!=='ok'||h.workspace!=='reachable'||typeof s.executionConfigured!=='boolean'||!['test','live'].includes(s.billingMode))throw Error('Unexpected service response');
 if(health.headers.get('cache-control')!=='no-store')throw Error('Health response must not be cached');
 return {workspace:h.workspace,executionConfigured:s.executionConfigured,billingMode:s.billingMode};
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){try{console.log(JSON.stringify(await checkLiveHealth(process.env.AGENTSKETCH_HEALTH_ORIGIN||'https://agentsketch-jimmyhmcquade-7436.vercel.app')))}catch(error){console.error(error.message);process.exitCode=1}}
