create schema if not exists private;
revoke all on schema private from public;
create table public.agents (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
 name text not null check(length(name) between 1 and 100), instructions text not null check(length(instructions) between 10 and 12000),
 template text not null default 'custom', knowledge text not null default '' check(length(knowledge)<=30000),
 apps text[] not null default '{}', created_at timestamptz not null default now()
);
create table public.entitlements (user_id uuid primary key references auth.users(id) on delete cascade, plan text not null default 'free' check(plan in ('free','pro')), stripe_customer_id text unique, updated_at timestamptz not null default now());
create table public.runs (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
 agent_id uuid references public.agents(id) on delete set null, agent_name text not null,
 input text not null check(length(input) between 1 and 20000), output text not null default '' check(length(output)<=100000),
 status text not null default 'running' check(status in ('running','completed','failed')),
 idempotency_key uuid not null, created_at timestamptz not null default now(), unique(user_id,idempotency_key)
);
create index agents_owner on public.agents(user_id);
create index runs_owner_date on public.runs(user_id,created_at desc);
create index runs_agent on public.runs(agent_id);
alter table public.agents enable row level security;
alter table public.runs enable row level security;
alter table public.entitlements enable row level security;
create policy agents_owner on public.agents for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy runs_read on public.runs for select to authenticated using(user_id=(select auth.uid()));
create policy runs_create on public.runs for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.agents a where a.id=agent_id and a.user_id=(select auth.uid())));
create policy runs_finish on public.runs for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy entitlement_read on public.entitlements for select to authenticated using(user_id=(select auth.uid()));
revoke all on public.agents, public.runs, public.entitlements from anon,authenticated;
grant select,delete on public.agents to authenticated;
grant insert(name,instructions,template,knowledge,apps),update(name,instructions,template,knowledge,apps) on public.agents to authenticated;
grant select on public.runs,public.entitlements to authenticated;
grant insert(agent_id,agent_name,input,idempotency_key),update(output,status) on public.runs to authenticated;
create function private.enforce_quota() returns trigger language plpgsql security definer set search_path='' as $$
declare tier text; used integer; cap integer;
begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,0));
 select plan into tier from public.entitlements where user_id=auth.uid();
 if TG_TABLE_NAME='agents' then
  cap:=case when tier='pro' then 20 else 1 end;
  select count(*) into used from public.agents where user_id=auth.uid();
 else
  cap:=case when tier='pro' then 100 else 10 end;
  select count(*) into used from public.runs where user_id=auth.uid() and created_at>=date_trunc('day',now() at time zone 'UTC') at time zone 'UTC';
 end if;
 if used>=cap then raise exception 'Plan limit reached: % %',cap,case when TG_TABLE_NAME='agents' then 'saved agents' else 'runs per UTC day' end; end if;
 NEW.user_id:=auth.uid(); NEW.created_at:=now();
 return NEW;
end $$;
revoke all on function private.enforce_quota() from public;
create trigger agents_quota before insert on public.agents for each row execute function private.enforce_quota();
create trigger runs_quota before insert on public.runs for each row execute function private.enforce_quota();
