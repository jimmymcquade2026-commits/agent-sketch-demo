-- Transactional integration test. All fixture data is rolled back.
begin;
insert into auth.users(id,email) values ('a0000000-0000-4000-8000-000000000001','agentsketch-test-a@example.invalid'),('a0000000-0000-4000-8000-000000000002','agentsketch-test-b@example.invalid');
insert into public.connections(user_id,provider,resource,encrypted_token) values('a0000000-0000-4000-8000-000000000001','slack','C0123456789','encrypted-fixture');
set local role authenticated;
select set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000001',true);
insert into public.agents(name,instructions) values('Test agent','Produce a complete useful answer');
do $$ begin
 begin insert into public.agents(name,instructions) values('Over quota','Produce another useful answer'); raise exception 'TEST FAILED quota accepted'; exception when raise_exception then if sqlerrm not like 'Plan limit reached%' then raise; end if; end;
 begin perform encrypted_token from public.connections; raise exception 'TEST FAILED credential exposed'; exception when insufficient_privilege then null; end;
 begin perform public.apply_subscription_event('fake',100,auth.uid(),'cus_fake','sub_fake','pro'); raise exception 'TEST FAILED webhook bypass'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000002',true);
do $$ begin if exists(select 1 from public.agents) then raise exception 'TEST FAILED cross-user read'; end if; if exists(select provider from public.connections) then raise exception 'TEST FAILED cross-user connection'; end if; end $$;
select set_config('request.jwt.claim.sub','a0000000-0000-4000-8000-000000000001',true);
insert into public.runs(agent_id,agent_name,input,idempotency_key) select a.id,a.name,'Test task',gen_random_uuid() from public.agents a cross join generate_series(1,10);
do $$ begin
 begin insert into public.runs(agent_id,agent_name,input,idempotency_key) select id,name,'Over limit',gen_random_uuid() from public.agents; raise exception 'TEST FAILED run quota'; exception when raise_exception then if sqlerrm not like 'Plan limit reached%' then raise; end if; end;
 begin update public.runs set created_at=now()-interval '1 day'; raise exception 'TEST FAILED tampering allowed'; exception when insufficient_privilege then null; end;
 begin insert into public.entitlements(user_id,plan) values(auth.uid(),'pro'); raise exception 'TEST FAILED self upgrade'; exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role service_role;
select public.apply_subscription_event('test_paid',200,'a0000000-0000-4000-8000-000000000001','cus_test','sub_test','pro');
select public.apply_subscription_event('test_paid',200,'a0000000-0000-4000-8000-000000000001','cus_test','sub_test','pro');
select public.apply_subscription_event('test_old',100,'a0000000-0000-4000-8000-000000000001','cus_test','sub_test','free');
do $$ begin if (select plan from public.entitlements where user_id='a0000000-0000-4000-8000-000000000001')<>'pro' then raise exception 'TEST FAILED stale webhook'; end if; end $$;
select public.apply_subscription_event('test_cancelled',300,'a0000000-0000-4000-8000-000000000001','cus_test','sub_test','free');
do $$ begin if (select plan from public.entitlements where user_id='a0000000-0000-4000-8000-000000000001')<>'free' then raise exception 'TEST FAILED cancellation'; end if; end $$;
select 'PASS: account isolation, quotas, credential secrecy, plan protection, duplicate/out-of-order billing events, cancellation' as result;
rollback;
