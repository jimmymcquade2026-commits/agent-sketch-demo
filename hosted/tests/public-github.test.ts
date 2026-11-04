import {test} from 'node:test';import assert from 'node:assert/strict';
import {publicGithubContext} from '../lib/public-github.ts';
test('public source is opt-in and cannot fetch an arbitrary origin',async()=>{
 let calls=0;const fetcher=(async()=>{calls++;throw Error('Unexpected request')}) as typeof fetch;
 assert.equal(await publicGithubContext(['files'],'https://github.com/acme/project',fetcher),'');
 assert.equal(await publicGithubContext(['github'],'https://github.com.evil.test/acme/project',fetcher),'');assert.equal(calls,0);
});
test('public source uses fixed read-only requests without authorization and bounds issue bodies',async()=>{
 const paths:string[]=[];
 const fetcher=(async(url,options)=>{paths.push(String(url));assert.equal(options?.redirect,'error');assert.equal((options?.headers as Record<string,string>).Authorization,undefined);return Response.json(String(url).includes('/issues?')?[{title:'Launch task',html_url:'https://github.com/acme/project/issues/1',body:'a'.repeat(3000)}]:{full_name:'acme/project',description:'Fixture repository',language:'TypeScript',stargazers_count:1})}) as typeof fetch;
 const result=await publicGithubContext(['github'],'Summarize https://github.com/acme/project',fetcher);assert.equal(paths.length,2);assert.ok(paths.every(p=>p.startsWith('https://api.github.com/repos/acme/project')));assert.match(result,/Launch task/);assert.ok(!result.includes('a'.repeat(1001)));
});
