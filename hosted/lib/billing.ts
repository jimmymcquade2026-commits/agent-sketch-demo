import Stripe from 'stripe';
import {createClient} from '@supabase/supabase-js';
import {liveCheckoutApproved} from './launch-readiness.ts';
export function billingBackendReady(){
 const key=process.env.STRIPE_SECRET_KEY||'';
 return Boolean(key&&process.env.STRIPE_WEBHOOK_SECRET&&process.env.STRIPE_LAUNCH_PRICE_ID&&process.env.STRIPE_STARTER_PRICE_ID&&process.env.STRIPE_PLUS_PRICE_ID&&process.env.STRIPE_SCALE_PRICE_ID&&process.env.SUPABASE_SECRET_KEY&&process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.APP_URL);
}
export function billingReady(){return billingBackendReady()&&(!process.env.STRIPE_SECRET_KEY?.includes('_live_')||liveCheckoutApproved())}
export function stripeClient(){if(!billingBackendReady())throw new Error('Billing setup incomplete');return new Stripe(process.env.STRIPE_SECRET_KEY!)}
export function adminDatabase(){return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SECRET_KEY!,{auth:{persistSession:false,autoRefreshToken:false}})}
export function billingOrigin(){const url=new URL(process.env.APP_URL!);if(url.protocol!=='https:'&&url.hostname!=='localhost')throw new Error('Invalid application URL');return url.origin}
