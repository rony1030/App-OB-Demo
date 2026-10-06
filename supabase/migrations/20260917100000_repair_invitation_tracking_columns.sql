-- Production repair: invitation pages and the admin list both use these
-- tracking fields. Keep this idempotent so it is safe on existing installs.
alter table public.invitations
  add column if not exists email_sent_at timestamptz,
  add column if not exists email_last_sent_at timestamptz,
  add column if not exists opened_at timestamptz;
