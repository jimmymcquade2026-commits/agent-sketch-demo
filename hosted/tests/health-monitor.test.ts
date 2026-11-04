import {test} from 'node:test';import assert from 'node:assert/strict';
import {checkLiveHealth} from '../scripts/check-live-health.mjs';
test('monitor checks database health and status without auth or a model call',async()=>{
 const paths:string[]=[];const request:typeof fetch=async(input)=>{const url=new URL(String(input));paths.push(url.pathname);return Response.json(url.pathname==='/api/health'?{status:'ok',workspace:'reachable'}:{executionConfigured:true,billingMode:'test'},{headers:{'Cache-Control':'no-store'}})};
 assert.deepEqual(await checkLiveHealth('https://example.com',request),{workspace:'reachable',executionConfigured:true,billingMode:'test'});assert.deepEqual(paths.sort(),['/api/health','/api/status']);
});
test('monitor fails on an outage or misleading cached health',async()=>{
 await assert.rejects(()=>checkLiveHealth('https://example.com',async()=>new Response('',{status:503})));
 await assert.rejects(()=>checkLiveHealth('https://example.com',async()=>Response.json({status:'ok',workspace:'reachable'})));
 await assert.rejects(()=>checkLiveHealth('http://example.com'));
});
