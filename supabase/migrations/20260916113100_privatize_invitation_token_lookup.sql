-- Invitation tokens are secrets. RLS cannot require callers to know a token;
-- a SELECT policy only filters rows and therefore exposed every pending invite
-- to anonymous Data API clients. Public invite pages now resolve tokens only
-- through the server-side service client.
drop policy if exists invitations_token_lookup on public.invitations;

revoke select on table public.invitations from anon;
