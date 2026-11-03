export const LAUNCH_PRICE=69;
export const plans={
 free:{name:'Free preview',monthlyPrice:0,agents:1,monthlyRuns:5,dailyRuns:3,connections:false},
 starter:{name:'Starter',monthlyPrice:9,agents:1,monthlyRuns:100,dailyRuns:10,connections:false},
 plus:{name:'Plus',monthlyPrice:19,agents:5,monthlyRuns:400,dailyRuns:40,connections:true},
 scale:{name:'Pro',monthlyPrice:39,agents:20,monthlyRuns:1000,dailyRuns:100,connections:true},
 // Existing subscriptions retain their original limits and price.
 pro:{name:'Pro (legacy)',monthlyPrice:19,agents:20,monthlyRuns:null,dailyRuns:100,connections:true},
} as const;
export type PaidPlan='starter'|'plus'|'scale';
export function planDetails(plan:string){return plans[plan as keyof typeof plans]||plans.free}
export function isPaidPlan(plan:unknown):plan is PaidPlan{return plan==='starter'||plan==='plus'||plan==='scale'}
export function planPriceId(plan:PaidPlan,env:Record<string,string|undefined>=process.env){return env[`STRIPE_${plan.toUpperCase()}_PRICE_ID`]}
export function planForPrice(id:string,env:Record<string,string|undefined>=process.env){
 for(const plan of ['starter','plus','scale'] as const)if(id&&id===planPriceId(plan,env))return plan;
 return id&&id===env.STRIPE_PRO_PRICE_ID?'pro':null;
}
export function checkoutItems(plan:PaidPlan,launched:boolean,env:Record<string,string|undefined>=process.env){
 const price=planPriceId(plan,env),launch=env.STRIPE_LAUNCH_PRICE_ID;
 if(!price||(!launched&&!launch))throw Error('This plan is not configured.');
 return [...(!launched?[{price:launch!,quantity:1}]:[]),{price:price!,quantity:1}];
}
