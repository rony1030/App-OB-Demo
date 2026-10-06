-- Migration: 20260904193000_invitations_and_access_control.sql
-- Ciclo 012: Roles, Acceso y CRM Multiempresa

create table if not exists public.invitations (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  email text not null,
  role text not null check (role in (
    'super_admin', 'master_broker_admin', 'master_broker_operations',
    'agency_admin', 'broker_agent', 'developer_admin',
    'developer_viewer', 'support_auditor'
  )),
  invited_by uuid references auth.users(id) on delete set null,
  token text not null unique,
  project_ids bigint[] not null default '{}'::bigint[],
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  email_sent_at timestamptz,
  email_last_sent_at timestamptz,
  opened_at timestamptz,
  accepted_at timestamptz
);

create index if not exists invitations_token_idx on public.invitations (token) where status = 'pending';
create index if not exists invitations_org_status_idx on public.invitations (organization_id, status);

alter table public.invitations enable row level security;

-- Grants
grant select, insert, update on table public.invitations to authenticated;
grant select on table public.invitations to anon;
grant usage, select on sequence public.invitations_id_seq to authenticated;

-- Helper to check if caller can manage invitations in organization
create or replace function private.can_manage_invitations(target_org_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and (
      -- Platform super admin can manage all
      exists (
        select 1 from public.memberships m
        where m.user_id = (select auth.uid())
          and m.status = 'active'
          and m.role = 'super_admin'
      )
      or
      -- Organization / Agency admin can manage within their org
      exists (
        select 1 from public.memberships m
        where m.organization_id = target_org_id
          and m.user_id = (select auth.uid())
          and m.status = 'active'
          and m.role in ('master_broker_admin', 'agency_admin')
      )
    );
$$;

-- RLS Policies for invitations
create policy invitations_manager_select
  on public.invitations for select to authenticated
  using ((select private.can_manage_invitations(organization_id)));

create policy invitations_manager_insert
  on public.invitations for insert to authenticated
  with check ((select private.can_manage_invitations(organization_id)));

create policy invitations_manager_update
  on public.invitations for update to authenticated
  using ((select private.can_manage_invitations(organization_id)))
  with check ((select private.can_manage_invitations(organization_id)));

-- Public / invited token lookup: allows validating invite by token
create policy invitations_token_lookup
  on public.invitations for select to anon, authenticated
  using (status = 'pending' and expires_at > now());
