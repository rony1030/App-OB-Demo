-- Shared presentations are resolved server-side after validating the full
-- random token. Anonymous Data API clients must not enumerate active links,
-- proposals, contacts, or author profiles.
drop policy if exists shared_links_public_select on public.shared_links;
drop policy if exists presentation_versions_public_select on public.presentation_versions;
drop policy if exists presentations_public_select on public.presentations;
drop policy if exists contacts_public_select_via_shared_link on public.contacts;
drop policy if exists brand_profiles_public_select_via_shared_link on public.brand_profiles;
drop policy if exists memberships_public_select_via_shared_link on public.memberships;
drop policy if exists profiles_public_select_via_shared_link on public.profiles;
drop policy if exists engagement_events_public_insert on public.engagement_events;

revoke select on public.shared_links from anon;
revoke select on public.presentation_versions from anon;
revoke select on public.presentations from anon;
revoke select on public.contacts from anon;
revoke select on public.memberships from anon;
revoke select on public.profiles from anon;
revoke insert on public.engagement_events from anon;
