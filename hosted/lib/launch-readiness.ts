type Env=Record<string,string|undefined>;
export function httpsUrl(value:string|undefined){try{const u=new URL(value||'');return u.protocol==='https:'&&!u.username&&!u.password?u.href:null}catch{return null}}
export function supportEmail(value:string|undefined){return value&&/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value)?value:null}
export function launchChecklist(env:Env=process.env){return [
 {id:'hosting',label:'Commercial hosting',done:env.COMMERCIAL_HOSTING_CONFIRMED==='true',detail:'Confirm a hosting plan suitable for commercial sales.'},
 {id:'email',label:'Public signup email',done:env.PUBLIC_EMAIL_VERIFIED==='true',detail:'Verify signup and password recovery with a non-team customer using your sender domain.'},
 {id:'sources',label:'Private app acceptance',done:env.PRIVATE_CONNECTIONS_VERIFIED==='true',detail:'Test dedicated GitHub, Slack and Airtable credentials, results, and disconnection.'},
 {id:'billing',label:'Renewal and payment failure',done:env.BILLING_LIFECYCLE_VERIFIED==='true',detail:'Verify renewal, failed renewal, and scheduled changes with a Stripe sandbox test clock.'},
 {id:'policies',label:'Published policies and support',done:Boolean(httpsUrl(env.TERMS_URL)&&httpsUrl(env.PRIVACY_URL)&&supportEmail(env.SUPPORT_EMAIL)&&env.POLICIES_APPROVED==='true'),detail:'Supply your business identity, approved terms/privacy/refund rules, and a monitored support address.'},
 {id:'risk',label:'Billing risk review',done:env.BILLING_RISK_REVIEW_CONFIRMED==='true',detail:'Test the refund/dispute/fraud review queue and approve the response process.'},
 {id:'spending',label:'AI funding and spending controls',done:env.SPEND_CONTROLS_CONFIRMED==='true',detail:'Confirm model funding, spending alerts/limits, and who receives alerts.'},
 {id:'recovery',label:'Backup and restore',done:env.RECOVERY_VERIFIED==='true',detail:'Choose backup retention and complete a restore rehearsal in a separate project.'},
 {id:'security',label:'Production account security',done:env.PRODUCTION_SECURITY_CONFIRMED==='true',detail:'Review leaked-password protection and replace credentials previously shared in chat.'},
 ];}
export function liveCheckoutApproved(env:Env=process.env){return env.BILLING_LIVE_ENABLED==='true'&&env.LAUNCH_APPROVED==='true'&&launchChecklist(env).every(item=>item.done)}
export function isOwner(userId:string,env:Env=process.env){return Boolean(env.OWNER_USER_ID&&userId===env.OWNER_USER_ID)}
