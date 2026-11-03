alter table public.entitlements drop constraint entitlements_plan_check;
alter table public.entitlements add constraint entitlements_plan_check check(plan in ('free','pro','starter','plus','scale'));
alter table public.entitlements add column launch_paid boolean not null default false,
 add column launch_session_id text unique, add column checkout_lock_key uuid, add column checkout_lock_until timestamptz;
-- Existing subscribers are grandfathered; never retroactively charge a launch fee.
update public.entitlements set launch_paid=true where plan='pro';

create or replace function private.enforce_quota() returns trigger language plpgsql security definer set search_path='' as $$
declare tier text; used integer; cap integer; monthly_cap integer; launched boolean;
begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 select plan,launch_paid into tier,launched from public.entitlements where user_id=auth.uid();
 tier:=coalesce(tier,'free');
 if tier in ('starter','plus','scale') and not coalesce(launched,false) then tier:='free'; end if;
 if TG_TABLE_NAME='agents' then
  cap:=case tier when 'pro' then 20 when 'scale' then 20 when 'plus' then 5 else 1 end;
  select count(*) into used from public.agents where user_id=auth.uid();
  if used>=cap then raise exception 'Plan limit reached: % saved agents',cap; end if;
 else
  cap:=case tier when 'pro' then 100 when 'scale' then 100 when 'plus' then 40 when 'starter' then 10 else 3 end;
  select count(*) into used from public.runs where user_id=auth.uid() and created_at>=date_trunc('day',now() at time zone 'UTC') at time zone 'UTC';
  if used>=cap then raise exception 'Plan limit reached: % attempts per UTC day',cap; end if;
  monthly_cap:=case tier when 'pro' then null when 'scale' then 1000 when 'plus' then 400 when 'starter' then 100 else 5 end;
  if monthly_cap is not null then
   select count(*) into used from public.runs where user_id=auth.uid() and created_at>=date_trunc('month',now() at time zone 'UTC') at time zone 'UTC';
   if used>=monthly_cap then raise exception 'Plan limit reached: % attempts per UTC calendar month',monthly_cap; end if;
  end if;
 end if;
 NEW.user_id:=auth.uid(); NEW.created_at:=now(); return NEW;
end $$;

create or replace function public.apply_subscription_event(p_event_id text,p_event_created bigint,p_user_id uuid,p_customer_id text,p_subscription_id text,p_plan text) returns boolean language plpgsql security invoker set search_path='' as $$
declare current_row public.entitlements; inserted integer;
begin
 if p_plan not in ('free','pro','starter','plus','scale') then raise exception 'Invalid plan'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,0));
 select * into current_row from public.entitlements where user_id=p_user_id;
 if current_row.user_id is not null then
  if current_row.stripe_customer_id is distinct from p_customer_id then raise exception 'Customer mismatch'; end if;
  if current_row.last_event_created>p_event_created then return false; end if;
  if current_row.plan<>'free' and current_row.stripe_subscription_id is distinct from p_subscription_id then return false; end if;
 end if;
 if p_plan in ('starter','plus','scale') and not coalesce(current_row.launch_paid,false) then raise exception 'Launch payment required'; end if;
 insert into public.billing_events(id) values(p_event_id) on conflict do nothing;
 get diagnostics inserted=row_count; if inserted=0 then return false; end if;
 insert into public.entitlements(user_id,plan,stripe_customer_id,stripe_subscription_id,last_event_created,updated_at)
 values(p_user_id,p_plan,p_customer_id,p_subscription_id,p_event_created,now())
 on conflict(user_id) do update set plan=excluded.plan,stripe_subscription_id=excluded.stripe_subscription_id,last_event_created=excluded.last_event_created,updated_at=now();
 return true;
end $$;

create function public.record_workspace_launch(p_user_id uuid,p_customer_id text,p_session_id text) returns boolean language plpgsql security invoker set search_path='' as $$
begin
 update public.entitlements set launch_paid=true,launch_session_id=coalesce(launch_session_id,p_session_id),updated_at=now() where user_id=p_user_id and stripe_customer_id=p_customer_id;
 if not found then raise exception 'Launch ownership mismatch'; end if;
 return true;
end $$;
revoke all on function public.record_workspace_launch(uuid,text,text) from public,anon,authenticated;
grant execute on function public.record_workspace_launch(uuid,text,text) to service_role;

create function public.acquire_checkout_lock(p_user_id uuid,p_key uuid) returns boolean language plpgsql security invoker set search_path='' as $$
begin
 update public.entitlements set checkout_lock_key=p_key,checkout_lock_until=now()+interval '90 seconds' where user_id=p_user_id and (checkout_lock_until is null or checkout_lock_until<now());
 return found;
end $$;
create function public.release_checkout_lock(p_user_id uuid,p_key uuid) returns void language sql security invoker set search_path='' as $$
 update public.entitlements set checkout_lock_key=null,checkout_lock_until=null where user_id=p_user_id and checkout_lock_key=p_key;
$$;
revoke all on function public.acquire_checkout_lock(uuid,uuid),public.release_checkout_lock(uuid,uuid) from public,anon,authenticated;
grant execute on function public.acquire_checkout_lock(uuid,uuid),public.release_checkout_lock(uuid,uuid) to service_role;
