import { createClient } from '@supabase/supabase-js';
export function database(token?: string) {
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key) throw new Error('Workspace connection is not configured.');
 return createClient(url,key,token?{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false}}:undefined);
}
