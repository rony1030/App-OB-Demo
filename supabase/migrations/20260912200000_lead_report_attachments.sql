create table if not exists public.lead_report_attachments (
  id bigint generated always as identity primary key,
  lead_report_id bigint not null references public.lead_reports(id) on delete cascade,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  mime_type text not null,
  size_bytes bigint not null default 0,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index lead_report_attachments_report_idx on public.lead_report_attachments (lead_report_id);

alter table public.lead_report_attachments enable row level security;

create policy lead_report_attachments_org_select on public.lead_report_attachments
  for select to authenticated
  using ((select private.has_org_role(organization_id, array['super_admin','master_broker_admin','master_broker_operations','agency_admin','agency_support','broker_agent']::text[])));

create policy lead_report_attachments_org_insert on public.lead_report_attachments
  for insert to authenticated
  with check ((select private.has_org_role(organization_id, array['super_admin','master_broker_admin','master_broker_operations','agency_admin','broker_agent']::text[])));
