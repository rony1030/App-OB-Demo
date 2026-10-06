-- Simplify the engagement_events INSERT check to a direct subquery against
-- shared_links only (which has its own simple, non-function anon SELECT
-- policy), dropping the function-call indirection and the organization_id
-- cross-check, to isolate a persistent RLS rejection under the anon role.
drop policy if exists engagement_events_public_insert on engagement_events;
create policy engagement_events_public_insert on engagement_events for insert to anon, authenticated
with check (
  exists (
    select 1 from public.shared_links sl
    where sl.id = engagement_events.shared_link_id
      and sl.status = 'active'
      and (sl.expires_at is null or sl.expires_at > now())
  )
);
