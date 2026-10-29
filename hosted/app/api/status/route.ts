import {connectionsReady} from '@/lib/connections';
import {billingReady} from '@/lib/billing';
export const dynamic='force-dynamic';
export function GET(){return Response.json({executionConfigured:Boolean(process.env.AGENT_RUNTIME_SECRET&&(process.env.AGENT_BASE_URL||process.env.VERCEL_URL)),billingConfigured:billingReady(),connectionsConfigured:connectionsReady(),billingMode:process.env.STRIPE_SECRET_KEY?.includes('_live_')?'live':'test'},{headers:{'Cache-Control':'no-store'}})}
