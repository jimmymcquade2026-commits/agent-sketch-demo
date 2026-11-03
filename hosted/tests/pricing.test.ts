import {test} from 'node:test';
import assert from 'node:assert/strict';
import {checkoutItems,isPaidPlan,planForPrice,planDetails} from '../lib/plans.ts';
import {buildPrompt,MAX_PROMPT_BYTES,PromptBudgetError} from '../lib/cost-policy.ts';
const env={STRIPE_LAUNCH_PRICE_ID:'launch',STRIPE_STARTER_PRICE_ID:'starter',STRIPE_PLUS_PRICE_ID:'plus',STRIPE_SCALE_PRICE_ID:'scale',STRIPE_PRO_PRICE_ID:'legacy'};
test('first checkout charges launch once; returning workspace pays monthly only',()=>{
 for(const tier of ['starter','plus','scale'] as const){assert.deepEqual(checkoutItems(tier,false,env),[{price:'launch',quantity:1},{price:tier,quantity:1}]);assert.deepEqual(checkoutItems(tier,true,env),[{price:tier,quantity:1}])}
 assert.throws(()=>checkoutItems('starter',false,{}));
});
test('only configured prices and supported tiers grant a plan',()=>{assert.equal(planForPrice('other',env),null);assert.equal(planForPrice('legacy',env),'pro');assert.equal(planForPrice('plus',env),'plus');assert.equal(isPaidPlan('pro'),false);assert.equal(isPaidPlan('scale'),true);assert.equal(planDetails('unknown').monthlyRuns,5);assert.equal(planDetails('starter').connections,false);assert.equal(planDetails('plus').connections,true);assert.equal(planDetails('pro').dailyRuns,100);assert.equal(planDetails('pro').monthlyRuns,null)});
test('prompt budget preserves task and instructions and bounds multilingual reference bytes',()=>{
 const agent={instructions:'Summarize accurately.',knowledge:'猫'.repeat(30000)};
 const prompt=buildPrompt(agent,'What happened?','🌎'.repeat(10000));assert.ok(new TextEncoder().encode(prompt).length<=MAX_PROMPT_BYTES);assert.ok(prompt.includes(agent.instructions));assert.ok(prompt.includes('What happened?'));assert.match(prompt,/snapshot shortened/);
 assert.throws(()=>buildPrompt({instructions:'a'.repeat(12000),knowledge:''},'b'.repeat(20000)),PromptBudgetError);
 assert.ok(buildPrompt({instructions:'Follow the task.',knowledge:'Short reference'},'Summarize.').endsWith('Short reference'));
});
