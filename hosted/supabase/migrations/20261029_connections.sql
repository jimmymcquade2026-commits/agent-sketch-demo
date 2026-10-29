create table public.connections (
 user_id uuid not null references auth.users(id) on delete cascade,
 provider text not null check(provider in ('github_private','slack','airtable')),
 resource text not null check(length(resource)<=200),
 encrypted_token text not null,
 updated_at timestamptz not null default now(),
 primary key(user_id,provider)
);
alter table public.connections enable row level security;
create policy connection_metadata_read on public.connections for select to authenticated using(user_id=(select auth.uid()));
revoke all on public.connections from anon,authenticated;
grant select(user_id,provider,resource,updated_at) on public.connections to authenticated;
grant all on public.connections to service_role;
