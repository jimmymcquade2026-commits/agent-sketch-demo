export const riskEventTypes=['charge.refunded','charge.dispute.created','radar.early_fraud_warning.created'] as const;
type Event={id:string;type:string;created:number;data:{object:unknown}};
const id=(value:unknown):string|null=>typeof value==='string'?value:typeof value==='object'&&value!==null&&'id'in value&&typeof value.id==='string'?value.id:null;
export function billingRiskAlert(event:Event){
 if(!(riskEventTypes as readonly string[]).includes(event.type))return null;
 const value=event.data.object&&typeof event.data.object==='object'?event.data.object as Record<string,unknown>:{};
 const charge=event.type==='charge.refunded'?value:typeof value.charge==='object'&&value.charge!==null?value.charge as Record<string,unknown>:null;
 return {id:event.id,event_type:event.type,source_id:id(value),charge_id:charge?id(charge):id(value.charge),customer_id:charge?id(charge.customer):null,event_created:event.created};
}
