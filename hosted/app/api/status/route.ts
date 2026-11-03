import {executionEnabled} from '@/lib/runtime-policy';
import {connectionsReady} from '@/lib/connections';
import {billingReady} from '@/lib/billing';
export const dynamic='force-dynamic';
export function GET(){return Response.json({executionConfigured:executionEnabled(),billingConfigured:billingReady(),connectionsConfigured:connectionsReady(),billingMode:process.env.STRIPE_SECRET_KEY?.includes('_live_')?'live':'test'},{headers:{'Cache-Control':'no-store'}})}
