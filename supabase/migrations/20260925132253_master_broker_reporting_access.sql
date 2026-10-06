-- Read-only reporting access is independent from an organization's operational
-- membership. An observer must not inherit CRM, document, or write policies.
create table public.master_broker_reporting_access (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  master_broker_organization_id bigint not null references public.organizations(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'revoked')),
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, master_broker_organization_id)
);

create index master_broker_reporting_access_org_idx
  on public.master_broker_reporting_access (master_broker_organization_id, status);

alter table public.master_broker_reporting_access enable row level security;
revoke all on table public.master_broker_reporting_access from anon, authenticated;
grant select on table public.master_broker_reporting_access to authenticated;

create policy master_broker_reporting_access_self_select
  on public.master_broker_reporting_access for select to authenticated
  using (user_id = (select auth.uid()));

comment on table public.master_broker_reporting_access is
  'Read-only project reporting assignments; does not grant an operational membership.';
