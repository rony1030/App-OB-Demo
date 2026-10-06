-- Adds agency-level support as a distinct operational role.
-- Support can manage sellers, agency/project documents and dossiers, but not
-- agreements, commissions, proformas, fiscal invoices or platform settings.

alter table public.memberships
  drop constraint if exists memberships_role_check;

alter table public.memberships
  add constraint memberships_role_check check (role in (
    'super_admin',
    'master_broker_admin',
    'master_broker_operations',
    'agency_admin',
    'agency_support',
    'broker_agent',
    'developer_admin',
    'developer_viewer',
    'support_auditor'
  ));

alter table public.invitations
  drop constraint if exists invitations_role_check;

alter table public.invitations
  add constraint invitations_role_check check (role in (
    'super_admin',
    'master_broker_admin',
    'master_broker_operations',
    'agency_admin',
    'agency_support',
    'broker_agent',
    'developer_admin',
    'developer_viewer',
    'support_auditor'
  ));

create or replace function private.can_manage_invitations(target_org_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and (
      exists (
        select 1 from public.memberships m
        where m.user_id = (select auth.uid())
          and m.status = 'active'
          and m.role = 'super_admin'
      )
      or exists (
        select 1 from public.memberships m
        where m.organization_id = target_org_id
          and m.user_id = (select auth.uid())
          and m.status = 'active'
          and m.role in ('master_broker_admin', 'agency_admin', 'agency_support')
      )
    );
$$;

drop policy if exists project_documents_privileged_insert on public.project_documents;
drop policy if exists project_documents_privileged_update on public.project_documents;
drop policy if exists project_documents_privileged_delete on public.project_documents;

create policy project_documents_privileged_insert on public.project_documents
  for insert to authenticated
  with check ((select private.has_org_role(organization_id, array[
    'super_admin',
    'master_broker_admin',
    'master_broker_operations',
    'agency_admin',
    'agency_support',
    'developer_admin'
  ]::text[])));

create policy project_documents_privileged_update on public.project_documents
  for update to authenticated
  using ((select private.has_org_role(organization_id, array[
    'super_admin',
    'master_broker_admin',
    'master_broker_operations',
    'agency_admin',
    'agency_support',
    'developer_admin'
  ]::text[])))
  with check ((select private.has_org_role(organization_id, array[
    'super_admin',
    'master_broker_admin',
    'master_broker_operations',
    'agency_admin',
    'agency_support',
    'developer_admin'
  ]::text[])));

create policy project_documents_privileged_delete on public.project_documents
  for delete to authenticated
  using ((select private.has_org_role(organization_id, array[
    'super_admin',
    'master_broker_admin',
    'master_broker_operations',
    'agency_admin',
    'agency_support',
    'developer_admin'
  ]::text[])));

drop policy if exists document_versions_org_insert on public.document_versions;
drop policy if exists document_versions_org_update on public.document_versions;
drop policy if exists document_versions_org_delete on public.document_versions;

create policy document_versions_org_insert on public.document_versions
  for insert to authenticated
  with check (exists (
    select 1
    from public.project_documents d
    where d.id = document_id
      and (select private.has_org_role(d.organization_id, array[
        'super_admin',
        'master_broker_admin',
        'master_broker_operations',
        'agency_admin',
        'agency_support',
        'developer_admin'
      ]::text[]))
  ));

create policy document_versions_org_update on public.document_versions
  for update to authenticated
  using (exists (
    select 1
    from public.project_documents d
    where d.id = document_id
      and (select private.has_org_role(d.organization_id, array[
        'super_admin',
        'master_broker_admin',
        'master_broker_operations',
        'agency_admin',
        'agency_support',
        'developer_admin'
      ]::text[]))
  ))
  with check (exists (
    select 1
    from public.project_documents d
    where d.id = document_id
      and (select private.has_org_role(d.organization_id, array[
        'super_admin',
        'master_broker_admin',
        'master_broker_operations',
        'agency_admin',
        'agency_support',
        'developer_admin'
      ]::text[]))
  ));

create policy document_versions_org_delete on public.document_versions
  for delete to authenticated
  using (exists (
    select 1
    from public.project_documents d
    where d.id = document_id
      and (select private.has_org_role(d.organization_id, array[
        'super_admin',
        'master_broker_admin',
        'master_broker_operations',
        'agency_admin',
        'agency_support',
        'developer_admin'
      ]::text[]))
  ));

create table if not exists public.organization_documents (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  document_type text not null default 'other' check (document_type in ('rnc', 'mercantile_registry', 'tax_certificate', 'legal_representative_id', 'banking', 'other')),
  title text not null,
  status text not null default 'submitted' check (status in ('requested', 'submitted', 'approved', 'rejected', 'expired')),
  storage_bucket text not null default 'private-documents',
  storage_path text,
  mime_type text,
  size_bytes bigint,
  issued_at date,
  expires_at date,
  created_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists organization_documents_org_status_idx
  on public.organization_documents (organization_id, status, expires_at);

drop trigger if exists organization_documents_set_updated_at on public.organization_documents;
create trigger organization_documents_set_updated_at
before update on public.organization_documents
for each row execute function private.set_updated_at();

alter table public.organization_documents enable row level security;
grant select, insert, update, delete on table public.organization_documents to authenticated;
grant usage, select on sequence public.organization_documents_id_seq to authenticated;

create policy organization_documents_member_select on public.organization_documents
  for select to authenticated
  using ((select private.has_org_role(organization_id, null)));

create policy organization_documents_manager_insert on public.organization_documents
  for insert to authenticated
  with check ((select private.has_org_role(organization_id, array[
    'super_admin',
    'master_broker_admin',
    'master_broker_operations',
    'agency_admin',
    'agency_support'
  ]::text[])));

create policy organization_documents_manager_update on public.organization_documents
  for update to authenticated
  using ((select private.has_org_role(organization_id, array[
    'super_admin',
    'master_broker_admin',
    'master_broker_operations',
    'agency_admin',
    'agency_support'
  ]::text[])))
  with check ((select private.has_org_role(organization_id, array[
    'super_admin',
    'master_broker_admin',
    'master_broker_operations',
    'agency_admin',
    'agency_support'
  ]::text[])));

create policy organization_documents_manager_delete on public.organization_documents
  for delete to authenticated
  using ((select private.has_org_role(organization_id, array[
    'super_admin',
    'master_broker_admin',
    'master_broker_operations',
    'agency_admin',
    'agency_support'
  ]::text[])));

drop policy if exists private_documents_member_insert on storage.objects;
create policy private_documents_member_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'private-documents' and (select private.has_org_slug_role((storage.foldername(name))[1], array[
    'super_admin',
    'master_broker_admin',
    'master_broker_operations',
    'agency_admin',
    'agency_support',
    'developer_admin'
  ]::text[])));

alter table public.profiles add column if not exists instagram_url text;
alter table public.profiles add column if not exists facebook_url text;
alter table public.profiles add column if not exists linkedin_url text;
alter table public.profiles add column if not exists tiktok_url text;
alter table public.profiles add column if not exists website_url text;
