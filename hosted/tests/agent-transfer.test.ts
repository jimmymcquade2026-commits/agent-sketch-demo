import {test} from 'node:test';import assert from 'node:assert/strict';
import {exportAgent,importAgent} from '../lib/agent-transfer.ts';
const agent={name:'Notes',instructions:'Extract decisions and owners.',knowledge:'Private sample',template:'custom',apps:['files','github','slack'],id:'private-id',user_id:'owner',token:'never-export'};
test('portable export contains config only; import disables private sources',()=>{const text=exportAgent(agent);assert.ok(!text.includes('never-export'));assert.ok(!text.includes('private-id'));assert.deepEqual(importAgent(text).apps,['files','github']);assert.equal(importAgent(text).knowledge,'Private sample')});
test('invalid or oversized imports fail closed',()=>{assert.throws(()=>importAgent('{}'));assert.throws(()=>importAgent('x'.repeat(100001)));assert.throws(()=>importAgent(JSON.stringify({format:'agentsketch-agent',version:2,agent}))) });
