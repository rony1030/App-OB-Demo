-- Prevent authenticated users from enumerating profiles and memberships
-- outside their own organization. Cross-company agreement pickers use a
-- server-side, minimal data access path instead.
create or replace function private.can_view_organization_members(target_organization_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.memberships current_membership
      where current_membership.user_id = (select auth.uid())
        and current_membership.status = 'active'
        and (
          current_membership.organization_id = target_organization_id
          or current_membership.role = 'super_admin'
        )
    );
$$;

revoke all on function private.can_view_organization_members(bigint) from public, anon, authenticated;
grant execute on function private.can_view_organization_members(bigint) to authenticated, service_role;

drop policy if exists memberships_directory_select on public.memberships;
drop policy if exists memberships_same_organization_select on public.memberships;
create policy memberships_same_organization_select
on public.memberships for select to authenticated
using ((select private.can_view_organization_members(organization_id)));

drop policy if exists profiles_directory_select on public.profiles;
drop policy if exists profiles_same_organization_select on public.profiles;
create policy profiles_same_organization_select
on public.profiles for select to authenticated
using (
  exists (
    select 1
    from public.memberships target_membership
    where target_membership.user_id = profiles.user_id
      and target_membership.status = 'active'
      and (select private.can_view_organization_members(target_membership.organization_id))
  )
);
