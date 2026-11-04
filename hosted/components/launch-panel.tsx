'use client';
import {useState} from 'react';
export type LaunchData={checklist:{id:string;label:string;done:boolean;detail:string}[];approved:boolean;billingMode:string;billingConfigured:boolean;gitDeployConfirmed:boolean;alerts:{id:string;event_type:string;charge_id:string|null;customer_id:string|null}[]};
export function LaunchPanel({data,onRefresh,onReview}:{data:LaunchData|null;onRefresh:()=>Promise<void>;onReview:(id:string)=>Promise<void>}){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState('');
 async function action(fn:()=>Promise<void>){setBusy(true);setMessage('');try{await fn()}catch{setMessage('Could not update launch status. Try again.')}finally{setBusy(false)}}
 return <><div className="pagehead"><div><span className="eyebrow">OWNER WORKSPACE</span><h1>Your launch checklist.</h1><p>Finish the remaining account and business setup, then approve live checkout.</p></div><button className="secondary" disabled={busy} onClick={()=>void action(onRefresh)}>Refresh status</button></div>{message&&<p role="status" className="notice">{message}</p>}
 {!data?<div className="notice">Launch status is unavailable. Refresh to try again.</div>:<>
 <div className="notice">{data.billingMode==='test'?'Stripe sandbox is active. No real payments are collected.':data.approved?'Live checkout prerequisites are approved.':'Live checkout is blocked until all prerequisites are confirmed.'} Checklist confirmations are owner attestations; they do not independently test external accounts.</div>
 <div className="helpgrid">{data.checklist.map(item=><section className="panel" key={item.id}><span className="pill">{item.done?'Confirmed':'Needs your input'}</span><h2>{item.label}</h2><p>{item.detail}</p></section>)}</div>
 <section className="panel dangerzone"><h2>Billing review queue</h2><p>Refunds, disputes, and early fraud warnings appear here. Review each event in Stripe, record your action there, then mark it reviewed. This control does not refund, cancel, or change customer access.</p>{data.alerts.length===0?<p>No open billing alerts.</p>:<ul>{data.alerts.map(a=><li key={a.id}><strong>{a.event_type}</strong><p>Charge: {a.charge_id||'Look up the Stripe event'} · Customer: {a.customer_id||'Resolve through the charge in Stripe'}</p><small>{a.id}</small><button className="secondary" disabled={busy} onClick={()=>void action(()=>onReview(a.id))}>Mark reviewed</button></li>)}</ul>}<p className="small">Shows up to 50 open alerts. Detailed payment information stays in Stripe.</p></section>
 <section className="panel"><h2>Deployments and monitoring</h2><p>{data.gitDeployConfirmed?'Automatic Git deployments confirmed.':'Connect the existing Vercel project to GitHub with root directory hosted. Automated repository checks are already configured.'}</p><p>Repository health checks run about every 30 minutes and after changes to the monitor. Review failures in GitHub Actions and set your notification preferences there.</p></section>
 </>}
 </>;
}
