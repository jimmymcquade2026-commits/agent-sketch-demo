import {test} from 'node:test';import assert from 'node:assert/strict';
import {verifyCheckoutPrices} from '../lib/checkout-prices.ts';
const env={STRIPE_LAUNCH_PRICE_ID:'launch',STRIPE_STARTER_PRICE_ID:'starter'};
const launch={quantity:1,price:{id:'launch',active:true,currency:'usd',unit_amount:6900,type:'one_time',recurring:null}};
const monthly={quantity:1,price:{id:'starter',active:true,currency:'usd',unit_amount:900,type:'recurring',recurring:{interval:'month',interval_count:1}}};
test('Checkout-expanded prices validate first payment and renewal without catalog permission',()=>{verifyCheckoutPrices([launch,monthly],'starter',false,env);verifyCheckoutPrices([monthly],'starter',true,env)});
test('wrong amount, currency, interval, quantity, missing or duplicate items fail closed',()=>{
 for(const price of [{...monthly.price,unit_amount:1900},{...monthly.price,currency:'eur'},{...monthly.price,recurring:{interval:'year',interval_count:1}}])assert.throws(()=>verifyCheckoutPrices([launch,{quantity:1,price}],'starter',false,env));
 for(const items of [[monthly],[launch,monthly,monthly],[launch,{...monthly,quantity:2}],[{...launch,price:null},monthly]])assert.throws(()=>verifyCheckoutPrices(items,'starter',false,env));
});
