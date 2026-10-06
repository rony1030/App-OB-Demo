-- Fixes infinite recursion introduced by the previous two migrations:
-- presentation_versions' new policy queried shared_links directly, and
-- shared_links' pre-existing `shared_links_org_access` policy queries
-- presentation_versions/presentations directly — a mutual-recursion cycle
-- that broke every query touching either table, not just anon/public ones.
--
-- Fix: route the cross-table "is this reachable via a currently-active
-- shared link" checks through SECURITY DEFINER helper functions (same
-- pattern as private.has_org_role/can_view_project), which bypass RLS on
-- their own internal lookups and so cannot recurse back into the calling
-- table's policy.

create or replace function private.presentation_version_has_active_share(target_version_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.shared_links sl
    where sl.presentation_version_id = target_version_id
      and sl.status = 'active'
      and (sl.expires_at is null or sl.expires_at > now())
  );
$$;

create or replace function private.presentation_has_active_share(target_presentation_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.presentation_versions pv
    where pv.presentation_id = target_presentation_id
      and private.presentation_version_has_active_share(pv.id)
  );
$$;

create or replace function private.membership_authors_active_share(target_membership_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.presentations p
    where p.author_membership_id = target_membership_id
      and private.presentation_has_active_share(p.id)
  );
$$;

drop policy if exists presentation_versions_public_select on presentation_versions;
create policy presentation_versions_public_select on presentation_versions for select to anon, authenticated
using (private.presentation_version_has_active_share(presentation_versions.id));

drop policy if exists presentations_public_select on presentations;
create policy presentations_public_select on presentations for select to anon, authenticated
using (private.presentation_has_active_share(presentations.id));

drop policy if exists contacts_public_select_via_shared_link on contacts;
create policy contacts_public_select_via_shared_link on contacts for select to anon, authenticated
using (
  exists (
    select 1 from public.presentations p
    where p.contact_id = contacts.id
      and private.presentation_has_active_share(p.id)
  )
);

drop policy if exists brand_profiles_public_select_via_shared_link on brand_profiles;
create policy brand_profiles_public_select_via_shared_link on brand_profiles for select to anon, authenticated
using (
  exists (
    select 1 from public.presentations p
    where p.organization_id = brand_profiles.organization_id
      and private.presentation_has_active_share(p.id)
  )
);

drop policy if exists engagement_events_public_insert on engagement_events;
create policy engagement_events_public_insert on engagement_events for insert to anon, authenticated
with check (
  exists (
    select 1 from public.shared_links sl
    join public.presentation_versions pv on pv.id = sl.presentation_version_id
    join public.presentations p on p.id = pv.presentation_id
    where sl.id = engagement_events.shared_link_id
      and p.organization_id = engagement_events.organization_id
      and private.presentation_version_has_active_share(pv.id)
  )
);

drop policy if exists memberships_public_select_via_shared_link on memberships;
create policy memberships_public_select_via_shared_link on memberships for select to anon, authenticated
using (private.membership_authors_active_share(memberships.id));

drop policy if exists profiles_public_select_via_shared_link on profiles;
create policy profiles_public_select_via_shared_link on profiles for select to anon, authenticated
using (
  exists (
    select 1 from public.memberships m
    where m.user_id = profiles.user_id
      and private.membership_authors_active_share(m.id)
  )
);
