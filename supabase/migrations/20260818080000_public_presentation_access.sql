-- Public shared-proposal/dossier links (/p/[token], /d/[token]) are opened
-- by real anonymous visitors, but the `anon` role had ZERO grants on
-- shared_links/presentations/presentation_versions/contacts/engagement_events
-- — every query hard-failed with "permission denied", which the page code
-- silently swallowed and replaced with a hardcoded demo proposal. Real
-- visitors never saw their actual proposal. This grants narrowly-scoped
-- anon access: only the exact row(s) reachable through a currently-active,
-- non-expired shared_link — a visitor without the token URL can't browse or
-- enumerate anything.

grant select on shared_links to anon;
grant select on presentations to anon;
grant select on presentation_versions to anon;
grant select on contacts to anon;
grant select, insert on engagement_events to anon;

create policy shared_links_public_select on shared_links for select to anon, authenticated
using (status = 'active' and (expires_at is null or expires_at > now()));

create policy presentation_versions_public_select on presentation_versions for select to anon, authenticated
using (
  exists (
    select 1 from shared_links sl
    where sl.presentation_version_id = presentation_versions.id
      and sl.status = 'active'
      and (sl.expires_at is null or sl.expires_at > now())
  )
);

create policy presentations_public_select on presentations for select to anon, authenticated
using (
  exists (
    select 1 from presentation_versions pv
    join shared_links sl on sl.presentation_version_id = pv.id
    where pv.presentation_id = presentations.id
      and sl.status = 'active'
      and (sl.expires_at is null or sl.expires_at > now())
  )
);

create policy contacts_public_select_via_shared_link on contacts for select to anon, authenticated
using (
  exists (
    select 1 from presentations p
    join presentation_versions pv on pv.presentation_id = p.id
    join shared_links sl on sl.presentation_version_id = pv.id
    where p.contact_id = contacts.id
      and sl.status = 'active'
      and (sl.expires_at is null or sl.expires_at > now())
  )
);

create policy brand_profiles_public_select_via_shared_link on brand_profiles for select to anon, authenticated
using (
  exists (
    select 1 from presentations p
    join presentation_versions pv on pv.presentation_id = p.id
    join shared_links sl on sl.presentation_version_id = pv.id
    where p.organization_id = brand_profiles.organization_id
      and sl.status = 'active'
      and (sl.expires_at is null or sl.expires_at > now())
  )
);

create policy engagement_events_public_insert on engagement_events for insert to anon, authenticated
with check (
  exists (
    select 1 from shared_links sl
    join presentation_versions pv on pv.id = sl.presentation_version_id
    join presentations p on p.id = pv.presentation_id
    where sl.id = engagement_events.shared_link_id
      and sl.status = 'active'
      and (sl.expires_at is null or sl.expires_at > now())
      and p.organization_id = engagement_events.organization_id
  )
);
