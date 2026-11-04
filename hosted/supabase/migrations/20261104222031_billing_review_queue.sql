create table public.billing_alerts (
 id text primary key,
 event_type text not null check(event_type in ('charge.refunded','charge.dispute.created','radar.early_fraud_warning.created')),
 source_id text, charge_id text, customer_id text, event_created bigint not null,
 state text not null default 'open' check(state in ('open','reviewed')),
 created_at timestamptz not null default now(), reviewed_at timestamptz
);
alter table public.billing_alerts enable row level security;
revoke all on public.billing_alerts from anon,authenticated;
grant select,insert,update on public.billing_alerts to service_role;
create index billing_alerts_open on public.billing_alerts(event_created desc) where state='open';
