-- Translation memory now also supports editorial content and CRM labels. The
-- source text itself remains the cache key, so a changed Spanish source gets a
-- fresh translation while unchanged text never calls the provider again.
alter table public.content_translations
  drop constraint if exists content_translations_entity_type_check;

alter table public.content_translations
  add constraint content_translations_entity_type_check
  check (entity_type in ('project', 'landing', 'proposal', 'dossier', 'blog', 'crm'));

alter table public.content_translations
  add column if not exists last_reviewed_at timestamptz;

create index if not exists content_translations_audit_due_idx
  on public.content_translations (status, last_reviewed_at, generated_at)
  where status = 'machine_translated';
