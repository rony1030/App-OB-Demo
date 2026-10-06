-- Keep the original public-share events and allow the canonical CRM metrics.
-- The application sanitizes metadata before writing; no credentials or PII belong here.
alter table public.engagement_events
  drop constraint if exists engagement_events_event_type_check;

alter table public.engagement_events
  add constraint engagement_events_event_type_check check (
    event_type in (
      'opened',
      'viewed',
      'downloaded',
      'clicked',
      'requested_contact',
      'project_view',
      'gallery_view',
      'inventory_filter',
      'unit_view',
      'whatsapp_click',
      'pdf_export',
      'share_click',
      'resource_download',
      'proposal_created',
      'proposal_view',
      'dossier_view',
      'sync_run'
    )
  );
