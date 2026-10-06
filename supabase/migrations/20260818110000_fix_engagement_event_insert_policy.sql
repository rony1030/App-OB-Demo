-- The previous engagement_events INSERT policy's WITH CHECK ran a 3-table
-- join directly, re-evaluated under the inserting role's own RLS view of
-- shared_links/presentation_versions/presentations — verified via direct
-- PostgREST call (not the privileged CLI, which bypasses RLS and gave a
-- false positive) to actually fail with 42501 for anon. Route it through a
-- single SECURITY DEFINER function instead, same pattern as the other
-- fixes in this session.
create or replace function private.engagement_event_allowed(target_shared_link_id bigint, target_organization_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.shared_links sl
    join public.presentation_versions pv on pv.id = sl.presentation_version_id
    join public.presentations p on p.id = pv.presentation_id
    where sl.id = target_shared_link_id
      and p.organization_id = target_organization_id
      and sl.status = 'active'
      and (sl.expires_at is null or sl.expires_at > now())
  );
$$;

drop policy if exists engagement_events_public_insert on engagement_events;
create policy engagement_events_public_insert on engagement_events for insert to anon, authenticated
with check (private.engagement_event_allowed(engagement_events.shared_link_id, engagement_events.organization_id));
