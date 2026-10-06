-- The apparent RLS rejection chased across the previous two migrations was
-- a false positive of curl-based testing that requested `return=representation`
-- (anon has no SELECT policy on engagement_events, so Postgres couldn't read
-- the row back to return it). The real app code never requests a
-- representation back, so the original organization_id-checked version is
-- safe to restore; the actual failure was an invalid event_type value
-- ('view' is not in the allowed CHECK constraint list), fixed in app code.
drop policy if exists engagement_events_public_insert on engagement_events;
create policy engagement_events_public_insert on engagement_events for insert to anon, authenticated
with check (
  exists (
    select 1 from public.shared_links sl
    join public.presentation_versions pv on pv.id = sl.presentation_version_id
    join public.presentations p on p.id = pv.presentation_id
    where sl.id = engagement_events.shared_link_id
      and p.organization_id = engagement_events.organization_id
      and sl.status = 'active'
      and (sl.expires_at is null or sl.expires_at > now())
  )
);
