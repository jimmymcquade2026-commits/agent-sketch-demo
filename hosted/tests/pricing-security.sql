begin;
insert into auth.users(id,email) values ('b0000000-0000-4000-8000-000000000001','pricing-test@example.invalid');
insert into public.entitlements(user_id,stripe_customer_id) values('b0000000-0000-4000-8000-000000000001','cus_pricing_test');
set local role authenticated;
select set_config('request.jwt.claim.sub','b0000000-0000-4000-8000-000000000001',true);
insert into public.agents(name,instructions) values('Pricing fixture','Summarize accurately without inventing facts.');
do $$ begin
 begin update public.entitlements set launch_paid=true; raise exception 'TEST FAILED self launch'; exception when insufficient_privilege then null; end;
 begin perform public.record_workspace_launch(auth.uid(),'cus_pricing_test','cs_test'); raise exception 'TEST FAILED launch RPC bypass'; exception when insufficient_privilege then null; end;
 begin perform public.acquire_checkout_lock(auth.uid(),gen_random_uuid()); raise exception 'TEST FAILED checkout lease bypass'; exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role service_role;
do $$ begin
 begin perform public.apply_subscription_event('pricing_unpaid',100,'b0000000-0000-4000-8000-000000000001','cus_pricing_test','sub_pricing','starter'); raise exception 'TEST FAILED unpaid tier'; exception when raise_exception then if sqlerrm<>'Launch payment required' then raise; end if; end;
 if not public.acquire_checkout_lock('b0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000002') then raise exception 'TEST FAILED first lease'; end if;
 if public.acquire_checkout_lock('b0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000003') then raise exception 'TEST FAILED concurrent checkout'; end if;
end $$;
select public.record_workspace_launch('b0000000-0000-4000-8000-000000000001','cus_pricing_test','cs_pricing');
select public.record_workspace_launch('b0000000-0000-4000-8000-000000000001','cus_pricing_test','cs_pricing');
select public.apply_subscription_event('pricing_paid',200,'b0000000-0000-4000-8000-000000000001','cus_pricing_test','sub_pricing','starter');
reset role;
-- Administrator-only fixture setup, confined to this transaction and restored before assertions.
alter table public.runs disable trigger runs_quota;
insert into public.runs(user_id,agent_id,agent_name,input,idempotency_key,created_at)
 select a.user_id,a.id,a.name,'Fixture attempt',gen_random_uuid(),date_trunc('month',now() at time zone 'UTC') at time zone 'UTC' from public.agents a cross join generate_series(1,100) where a.user_id='b0000000-0000-4000-8000-000000000001';
alter table public.runs enable trigger runs_quota;
set local role authenticated;
do $$ begin
 begin insert into public.runs(agent_id,agent_name,input,idempotency_key) select id,name,'Must fail',gen_random_uuid() from public.agents; raise exception 'TEST FAILED monthly quota'; exception when raise_exception then if sqlerrm not like 'Plan limit reached:%' then raise; end if; end;
end $$;
reset role;
set local role service_role;
select public.apply_subscription_event('pricing_upgrade',300,'b0000000-0000-4000-8000-000000000001','cus_pricing_test','sub_pricing','plus');
select public.apply_subscription_event('pricing_cancel',400,'b0000000-0000-4000-8000-000000000001','cus_pricing_test','sub_pricing','free');
do $$ begin
 if (select not launch_paid or plan<>'free' from public.entitlements where user_id='b0000000-0000-4000-8000-000000000001') then raise exception 'TEST FAILED cancellation erased paid launch'; end if;
end $$;
select public.apply_subscription_event('pricing_return',500,'b0000000-0000-4000-8000-000000000001','cus_pricing_test','sub_pricing_return','scale');
select 'PASS: protected launch, checkout lease, monthly quota, tier change, cancellation, returning workspace' as result;
rollback;
