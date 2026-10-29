import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRunHandler,QuotaError,readLimitedJson,type RunStore,type RunRecord} from '../lib/run-service.ts';
const body={agentId:'a0000000-0000-4000-8000-000000000001',input:'Write a useful reply.',requestId:'a0000000-0000-4000-8000-000000000002'};
const run:RunRecord={id:'r1',agent_name:'Test agent',input:body.input,output:'',status:'running',created_at:'2026-10-29T00:00:00Z'};
function fixture(overrides:Partial<RunStore>={},execute=async()=> 'Finished deliverable'){
 let calls=0;
 const store:RunStore={authenticate:async()=>true,findAgent:async()=>({id:body.agentId,name:'Test agent',instructions:'Return the finished work',knowledge:''}),findRun:async()=>null,reserve:async()=>run,finish:async(id,status,output)=>({...run,id,status,output}),...overrides};
 const handler=createRunHandler({configured:()=>true,store:()=>store,execute:async(...args)=>{calls++;return execute()}});
 const request=(value:unknown=body,auth=true)=>new Request('https://test.invalid/api/run',{method:'POST',headers:auth?{authorization:'Bearer token'}:{},body:JSON.stringify(value)});
 return {handler,request,calls:()=>calls};
}
test('missing authentication never executes',async()=>{const f=fixture();assert.equal((await f.handler(f.request(body,false))).status,401);assert.equal(f.calls(),0)});
test('invalid account never executes',async()=>{const f=fixture({authenticate:async()=>false});assert.equal((await f.handler(f.request())).status,401);assert.equal(f.calls(),0)});
test('an agent owned by someone else is not available',async()=>{const f=fixture({findAgent:async()=>null});assert.equal((await f.handler(f.request())).status,404);assert.equal(f.calls(),0)});
test('invalid input never reserves or executes',async()=>{const f=fixture({reserve:async()=>assert.fail('must not reserve')});assert.equal((await f.handler(f.request({...body,input:' '}))).status,400);assert.equal(f.calls(),0)});
test('quota rejection never executes',async()=>{const f=fixture({reserve:async()=>{throw new QuotaError('Plan limit reached')}});assert.equal((await f.handler(f.request())).status,429);assert.equal(f.calls(),0)});
test('duplicate completed request returns existing output',async()=>{const f=fixture({findRun:async()=>({...run,status:'completed',output:'Saved result'})});const response=await f.handler(f.request());assert.equal((await response.json()).run.output,'Saved result');assert.equal(f.calls(),0)});
test('duplicate in-flight request does not start another run',async()=>{const f=fixture({findRun:async()=>run});assert.equal((await f.handler(f.request())).status,202);assert.equal(f.calls(),0)});
test('successful result is persisted',async()=>{const f=fixture();const response=await f.handler(f.request());assert.equal(response.status,200);assert.equal((await response.json()).run.status,'completed');assert.equal(f.calls(),1)});
test('provider failures are marked failed and not automatically retried',async()=>{const f=fixture({},async()=>{throw new Error('provider secret must not leak')});const response=await f.handler(f.request());assert.equal(response.status,502);const payload=await response.json();assert.equal(payload.run.status,'failed');assert.ok(!JSON.stringify(payload).includes('provider secret'));assert.equal(f.calls(),1)});
test('empty provider output is not a success',async()=>{const f=fixture({},async()=>'');assert.equal((await f.handler(f.request())).status,502)});
test('history failure preserves the finished output and warns',async()=>{const f=fixture({finish:async()=>{throw new Error('db unavailable')}});const data=await (await f.handler(f.request())).json();assert.equal(data.run.output,'Finished deliverable');assert.ok(data.warning)});
test('chunked bodies cannot bypass the payload limit',async()=>{await assert.rejects(()=>readLimitedJson(new Request('https://test.invalid',{method:'POST',body:'x'.repeat(101)}),100))});
