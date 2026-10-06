-- Fix: the universal cross-organization bypass introduced in
-- 20260817000000_fix_admin_and_orgs_rls.sql applied to BOTH super_admin and
-- master_broker_admin. That breaks tenant isolation between competing master
-- brokers (any master_broker_admin could read/write any other organization's
-- data). The bypass should only exist for platform staff (super_admin).
-- master_broker_admin goes back to being scoped to its own organization via
-- the normal membership check below.

create or replace function private.has_org_role(target_organization_id bigint, allowed_roles text[] default null)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and (
      -- Global bypass: platform staff only.
      exists (
        select 1
        from public.memberships m
        where m.user_id = (select auth.uid())
          and m.status = 'active'
          and m.role = 'super_admin'
      )
      -- Or member of target org with allowed role.
      or exists (
        select 1
        from public.memberships m
        where m.organization_id = target_organization_id
          and m.user_id = (select auth.uid())
          and m.status = 'active'
          and (allowed_roles is null or m.role = any (allowed_roles))
      )
    );
$$;
