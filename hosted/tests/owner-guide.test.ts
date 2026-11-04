import {test} from 'node:test';
import assert from 'node:assert/strict';
import {launchSetupSummary} from '../lib/launch-guide.ts';
test('owner setup download excludes completed work and arbitrary account fields',()=>{
 const checklist=[{id:'email',done:false,token:'secret-fixture',customer:'private-fixture'},{id:'sources',done:true},{id:'unknown-secret-fixture',done:false}];
 const summary=launchSetupSummary(checklist);
 assert.match(summary,/PUBLIC_EMAIL_VERIFIED=true/);
 assert.ok(!summary.includes('PRIVATE_CONNECTIONS_VERIFIED'));
 assert.ok(!summary.includes('secret-fixture'));
 assert.ok(!summary.includes('private-fixture'));
 assert.match(summary,/BILLING_LIVE_ENABLED and LAUNCH_APPROVED stay false/);
});
