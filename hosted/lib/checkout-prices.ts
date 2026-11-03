import {checkoutItems,plans,LAUNCH_PRICE,type PaidPlan} from './plans.ts';
type Item={quantity:number|null;price:{id:string;active:boolean;currency:string;unit_amount:number|null;type:string;recurring:{interval:string;interval_count:number}|null}|null};
export function verifyCheckoutPrices(items:Item[],tier:PaidPlan,launched:boolean,env:Record<string,string|undefined>=process.env){
 const expected=checkoutItems(tier,launched,env);
 if(items.length!==expected.length)throw Error('Unexpected checkout items');
 for(const item of items){const price=item.price,launch=price?.id===env.STRIPE_LAUNCH_PRICE_ID;
  if(!price||!expected.some(e=>e.price===price.id)||items.filter(i=>i.price?.id===price.id).length!==1||item.quantity!==1||!price.active||price.currency!=='usd'||price.unit_amount!==(launch?LAUNCH_PRICE:plans[tier].monthlyPrice)*100||(launch?price.type!=='one_time':price.recurring?.interval!=='month'||price.recurring.interval_count!==1))throw Error('Configured price does not match displayed offer');
 }
}
