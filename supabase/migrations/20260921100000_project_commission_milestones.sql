-- Structured commission payment plans per project.
-- Each project can define multiple payment milestones that describe when and
-- how the broker commission is disbursed. This replaces the free-text
-- `commission_terms` with a queryable, per-project schedule that auto-fills
-- into agreements and renders in the PDF contract.

create table public.project_commission_milestones (
  id bigint generated always as identity primary key,
  project_id bigint not null references public.projects(id) on delete cascade,
  milestone_order smallint not null default 1 check (milestone_order between 1 and 10),
  commission_pct numeric(5,2) not null check (commission_pct > 0 and commission_pct <= 100),
  trigger_type text not null default 'client_payment_pct' check (trigger_type in (
    'client_payment_pct',
    'contract_signed',
    'unit_delivery',
    'final_settlement',
    'custom'
  )),
  trigger_value numeric(5,2) check (
    (trigger_type = 'client_payment_pct' and trigger_value is not null and trigger_value > 0 and trigger_value <= 100)
    or (trigger_type != 'client_payment_pct')
  ),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, milestone_order)
);
create index project_commission_milestones_project_idx on public.project_commission_milestones (project_id);

create trigger project_commission_milestones_set_updated_at before update on public.project_commission_milestones
  for each row execute function private.set_updated_at();

alter table public.project_commission_milestones enable row level security;

create policy project_commission_milestones_select on public.project_commission_milestones
  for select to authenticated
  using (exists (
    select 1 from public.projects p
    where p.id = project_id
      and (select private.has_org_role(p.organization_id, null))
  ) or exists (
    select 1 from public.agreements a
    where a.project_id = project_commission_milestones.project_id
      and a.status in ('draft', 'pending_signature', 'signed')
      and (select private.has_org_role(a.broker_organization_id, null))
  ));

create policy project_commission_milestones_manage on public.project_commission_milestones
  for all to authenticated
  using (exists (
    select 1 from public.projects p
    where p.id = project_id
      and (select private.has_org_role(p.organization_id, array['super_admin','master_broker_admin','master_broker_operations']::text[]))
  ))
  with check (exists (
    select 1 from public.projects p
    where p.id = project_id
      and (select private.has_org_role(p.organization_id, array['super_admin','master_broker_admin','master_broker_operations']::text[]))
  ));

-- Allow manual upload of pre-signed agreement PDFs (paper-based agencies).
-- When an agreement has manual_upload_path set, the platform treats it as
-- already signed without requiring the digital signature flow.
alter table public.agreements
  add column if not exists manual_upload_path text,
  add column if not exists manual_upload_bucket text default 'private-documents',
  add column if not exists is_manual boolean not null default false;
