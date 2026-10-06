-- Public project inquiries are intentionally separate from CRM contacts/leads.
-- A master-broker operator reviews the inquiry before deciding whether it
-- should become a contact or opportunity.
create table public.project_inquiries (
  id bigint generated always as identity primary key,
  submission_id uuid not null unique,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  project_id bigint not null references public.projects(id) on delete cascade,
  request_type text not null check (request_type in ('information', 'site_visit')),
  full_name text not null check (char_length(trim(full_name)) between 3 and 160),
  phone text not null check (char_length(trim(phone)) between 8 and 40),
  email extensions.citext not null,
  profile_type text not null check (profile_type in ('agency', 'independent_broker')),
  agency_name text check (agency_name is null or char_length(trim(agency_name)) between 2 and 180),
  typology text check (typology is null or char_length(trim(typology)) <= 180),
  message text check (message is null or char_length(trim(message)) <= 3000),
  locale text not null default 'es' check (locale in ('es', 'en', 'fr')),
  terms_version text not null,
  terms_accepted_at timestamptz not null,
  source_url text,
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'closed', 'spam')),
  assigned_to_membership_id bigint references public.memberships(id) on delete set null,
  email_status text not null default 'pending' check (email_status in ('pending', 'sent', 'failed')),
  emailed_at timestamptz,
  email_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index project_inquiries_org_status_idx
  on public.project_inquiries (organization_id, status, created_at desc);
create index project_inquiries_project_created_idx
  on public.project_inquiries (project_id, created_at desc);
create index project_inquiries_email_created_idx
  on public.project_inquiries (email, created_at desc);

alter table public.project_inquiries enable row level security;

-- The public form writes through a server-only route using the service key.
-- Neither anonymous visitors nor ordinary authenticated users get direct
-- Data API access to the table.
revoke all on table public.project_inquiries from anon, authenticated;
grant select, update on table public.project_inquiries to authenticated;

create policy project_inquiries_staff_select on public.project_inquiries
  for select to authenticated
  using ((select private.has_org_role(
    organization_id,
    array['super_admin','master_broker_admin','master_broker_operations']::text[]
  )));

create policy project_inquiries_staff_update on public.project_inquiries
  for update to authenticated
  using ((select private.has_org_role(
    organization_id,
    array['super_admin','master_broker_admin','master_broker_operations']::text[]
  )))
  with check ((select private.has_org_role(
    organization_id,
    array['super_admin','master_broker_admin','master_broker_operations']::text[]
  )));

create trigger project_inquiries_set_updated_at
  before update on public.project_inquiries
  for each row execute function private.set_updated_at();

comment on table public.project_inquiries is
  'Project-specific information and site-visit requests awaiting master-broker review; not CRM leads.';
