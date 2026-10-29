alter table public.entitlements add column stripe_subscription_id text, add column last_event_created bigint not null default 0;
create table public.billing_events(id text primary key, created_at timestamptz not null default now());
alter table public.billing_events enable row level security;
revoke all on public.billing_events from anon,authenticated;
grant select,insert on public.billing_events to service_role;
create function public.apply_subscription_event(p_event_id text,p_event_created bigint,p_user_id uuid,p_customer_id text,p_subscription_id text,p_plan text) returns boolean language plpgsql security invoker set search_path='' as $$
declare current_row public.entitlements; inserted integer;
begin
 if p_plan not in ('free','pro') then raise exception 'Invalid plan'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user_id::text,0));
 insert into public.billing_events(id) values(p_event_id) on conflict do nothing;
 get diagnostics inserted=row_count;
 if inserted=0 then return false; end if;
 select * into current_row from public.entitlements where user_id=p_user_id;
 if current_row.user_id is not null then
  if current_row.stripe_customer_id is distinct from p_customer_id then raise exception 'Customer mismatch'; end if;
  if current_row.last_event_created>p_event_created then return false; end if;
  if current_row.plan='pro' and current_row.stripe_subscription_id is distinct from p_subscription_id then return false; end if;
 end if;
 insert into public.entitlements(user_id,plan,stripe_customer_id,stripe_subscription_id,last_event_created,updated_at)
 values(p_user_id,p_plan,p_customer_id,p_subscription_id,p_event_created,now())
 on conflict(user_id) do update set plan=excluded.plan,stripe_subscription_id=excluded.stripe_subscription_id,last_event_created=excluded.last_event_created,updated_at=now();
 return true;
end $$;
revoke all on function public.apply_subscription_event(text,bigint,uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.apply_subscription_event(text,bigint,uuid,text,text,text) to service_role;
