-- Fix: has_org_slug_role lacked the super_admin global bypass that has_org_role
-- already has (added in 20260817010000). Without it, a super_admin who is not a
-- direct member of the target org cannot upload to that org's storage folder.

create or replace function private.has_org_slug_role(target_slug text, allowed_roles text[] default null)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and (
      -- Global bypass: platform super_admin only.
      exists (
        select 1 from public.memberships m
        where m.user_id = (select auth.uid())
          and m.status = 'active'
          and m.role = 'super_admin'
      )
      -- Or member of the org identified by slug, with an allowed role.
      or exists (
        select 1
        from public.organizations o
        join public.memberships m on m.organization_id = o.id
        where o.slug = target_slug
          and m.user_id = (select auth.uid())
          and m.status = 'active'
          and (allowed_roles is null or m.role = any (allowed_roles))
      )
    );
$$;
