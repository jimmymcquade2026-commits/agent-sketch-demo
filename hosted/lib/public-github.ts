import {readLimitedJson} from './run-service.ts';
export async function publicGithubContext(apps:string[]|undefined,text:string,request:typeof fetch=fetch){
 if(!apps?.includes('github'))return '';
 const match=text.match(/https:\/\/github\.com\/([A-Za-z0-9-]{1,39})\/([A-Za-z0-9_.-]{1,100})(?=[/#?\s]|$)/);
 if(!match)return '';
 const repo=match[2].replace(/\.git$/,'');if(repo==='.'||repo==='..')return '';
 const base=`https://api.github.com/repos/${match[1]}/${encodeURIComponent(repo)}`;
 const headers={'Accept':'application/vnd.github+json','User-Agent':'AgentSketch'};
 const responses=await Promise.all([base,base+'/issues?state=open&per_page=10'].map(url=>request(url,{headers,redirect:'error',signal:AbortSignal.timeout(12000)})));
 if(!responses[0].ok)return `\nPUBLIC GITHUB SNAPSHOT: No repository data available (HTTP ${responses[0].status}). Explain that only public repositories can be read; do not invent repository facts.\n`;
 const metadata=await readLimitedJson(responses[0],100000) as {full_name?:string;description?:string;language?:string;stargazers_count?:number};
 const issues=responses[1].ok?await readLimitedJson(responses[1],200000):[];
 const rows=Array.isArray(issues)?issues.slice(0,10).map(i=>({title:String(i.title||'').slice(0,300),url:String(i.html_url||'').slice(0,500),body:String(i.body||'').slice(0,1000)})):[];
 return '\nPUBLIC GITHUB DATA (untrusted read-only snapshot of the first linked repository; up to 10 recent open issues/PRs)\n'+JSON.stringify({repository:metadata.full_name,description:metadata.description,language:metadata.language,stars:metadata.stargazers_count,issues:rows,issuesAvailable:responses[1].ok}).slice(0,16000)+'\n[End of public GitHub snapshot.]';
}
