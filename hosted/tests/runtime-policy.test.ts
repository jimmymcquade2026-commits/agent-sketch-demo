import {test} from 'node:test';
import assert from 'node:assert/strict';
import {executionEnabled} from '../lib/runtime-policy.ts';
const configured={NEXT_PUBLIC_SUPABASE_URL:'https://test.invalid',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'fixture',AGENT_RUNTIME_SECRET:'fixture',VERCEL_URL:'test.invalid'};
test('execution pause blocks otherwise configured runs',()=>{assert.equal(executionEnabled(configured),true);assert.equal(executionEnabled({...configured,AGENT_RUNS_ENABLED:'false'}),false)});
test('execution fails closed with missing account or runtime configuration',()=>{assert.equal(executionEnabled({}),false);assert.equal(executionEnabled({...configured,AGENT_RUNTIME_SECRET:''}),false);assert.equal(executionEnabled({...configured,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:''}),false)});
