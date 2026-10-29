import {defineTool} from 'eve/tools';
import {z} from 'zod';
export default defineTool({
 description:'Read metadata and the latest 10 issues from a public GitHub repository. No private account access or write actions.',
 inputSchema:z.object({owner:z.string().regex(/^[a-zA-Z0-9-]{1,39}$/),repo:z.string().regex(/^[a-zA-Z0-9_.-]{1,100}$/)}),
 async execute({owner,repo}){
  const base=`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
  const headers={'Accept':'application/vnd.github+json','User-Agent':'AgentSketch'};
  const [metadata,issues]=await Promise.all([fetch(base,{headers,signal:AbortSignal.timeout(12000),redirect:'error'}),fetch(`${base}/issues?state=open&per_page=10`,{headers,signal:AbortSignal.timeout(12000),redirect:'error'})]);
  if(!metadata.ok) return {error:`GitHub returned ${metadata.status}. Public repositories only.`};
  const m=await metadata.json();
  const rows=issues.ok?await issues.json():[];
  return {name:m.full_name,description:m.description,url:m.html_url,language:m.language,stars:m.stargazers_count,issues:rows.map((i:{title:string;html_url:string;body:string})=>({title:i.title,url:i.html_url,body:i.body?.slice(0,1500)}))};
 }
});
