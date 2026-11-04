import {executionEnabled} from '@/lib/runtime-policy';
import {connectionsReady} from '@/lib/connections';
import {billingReady} from '@/lib/billing';
import {httpsUrl,supportEmail} from '@/lib/launch-readiness';
export const dynamic='force-dynamic';
export function GET(){const published=process.env.POLICIES_APPROVED==='true';return Response.json({executionConfigured:executionEnabled(),billingConfigured:billingReady(),connectionsConfigured:connectionsReady(),billingMode:process.env.STRIPE_SECRET_KEY?.includes('_live_')?'live':'test',supportEmail:published?supportEmail(process.env.SUPPORT_EMAIL)||'':'',termsUrl:published?httpsUrl(process.env.TERMS_URL)||'':'',privacyUrl:published?httpsUrl(process.env.PRIVACY_URL)||'':''},{headers:{'Cache-Control':'no-store'}})}
