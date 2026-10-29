import Stripe from 'stripe';
import {createClient} from '@supabase/supabase-js';
export function billingReady(){
 const key=process.env.STRIPE_SECRET_KEY||'';
 return Boolean(key&&process.env.STRIPE_WEBHOOK_SECRET&&process.env.STRIPE_PRO_PRICE_ID&&process.env.SUPABASE_SECRET_KEY&&process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.APP_URL&&(!key.includes('_live_')||process.env.BILLING_LIVE_ENABLED==='true'));
}
export function stripeClient(){if(!billingReady())throw new Error('Billing setup incomplete');return new Stripe(process.env.STRIPE_SECRET_KEY!)}
export function adminDatabase(){return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SECRET_KEY!,{auth:{persistSession:false,autoRefreshToken:false}})}
export function billingOrigin(){const url=new URL(process.env.APP_URL!);if(url.protocol!=='https:'&&url.hostname!=='localhost')throw new Error('Invalid application URL');return url.origin}
