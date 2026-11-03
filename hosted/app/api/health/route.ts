import {adminDatabase} from '@/lib/billing';
export const dynamic='force-dynamic';
export const maxDuration=10;
export async function GET(){
 const headers={'Cache-Control':'no-store'};
 try{
  if(!process.env.SUPABASE_SECRET_KEY||!process.env.NEXT_PUBLIC_SUPABASE_URL)throw Error();
  const {error}=await adminDatabase().from('agents').select('id',{head:true}).limit(1).abortSignal(AbortSignal.timeout(4000));
  if(error)throw error;
  return Response.json({status:'ok',workspace:'reachable'},{headers});
 }catch{return Response.json({status:'degraded',workspace:'unavailable'},{status:503,headers})}
}
