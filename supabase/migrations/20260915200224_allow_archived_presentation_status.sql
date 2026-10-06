-- The portal archives old proposals instead of physically deleting them so
-- shared links, audit history, and reporting remain recoverable.
alter table public.presentations
  drop constraint if exists presentations_status_check;

alter table public.presentations
  add constraint presentations_status_check check (
    status in ('draft', 'ready', 'sent', 'viewed', 'negotiation', 'accepted', 'rejected', 'expired', 'revoked', 'archived')
  );
