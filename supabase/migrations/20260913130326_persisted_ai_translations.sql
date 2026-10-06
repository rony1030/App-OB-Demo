-- Persistent translation memory. Gemini creates a draft only when a current
-- translation is absent or the source text has changed; the reviewed copy is
-- always served from Supabase afterwards.
create table public.content_translations (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  entity_type text not null check (entity_type in ('project', 'landing', 'proposal', 'dossier')),
  entity_id text not null,
  field_path text not null,
  source_locale text not null check (source_locale in ('es', 'en', 'fr')),
  target_locale text not null check (target_locale in ('es', 'en', 'fr')),
  source_text text not null,
  source_hash text not null,
  translated_text text,
  status text not null default 'pending' check (status in ('pending', 'machine_translated', 'reviewed', 'failed')),
  provider text,
  model text,
  error_message text,
  generated_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_translations_distinct_locales check (source_locale <> target_locale),
  constraint content_translations_unique_field unique (organization_id, entity_type, entity_id, field_path, target_locale)
);

create index content_translations_lookup_idx
  on public.content_translations (organization_id, entity_type, entity_id, target_locale, status);

create table public.content_translation_reviews (
  id bigint generated always as identity primary key,
  translation_id bigint not null references public.content_translations(id) on delete cascade,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  status text not null check (status in ('passed', 'needs_review', 'failed')),
  score smallint check (score between 1 and 5),
  findings jsonb not null default '[]'::jsonb,
  suggested_text text,
  provider text,
  model text,
  error_message text,
  created_at timestamptz not null default now()
);

create index content_translation_reviews_lookup_idx
  on public.content_translation_reviews (translation_id, created_at desc);

create trigger content_translations_set_updated_at
before update on public.content_translations
for each row execute function private.set_updated_at();

alter table public.content_translations enable row level security;
alter table public.content_translation_reviews enable row level security;

create policy "Organization members can read their translations"
on public.content_translations
for select to authenticated
using (
  exists (
    select 1
    from public.memberships membership
    where membership.organization_id = content_translations.organization_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
  )
);

create policy "Organization members can create translations"
on public.content_translations
for insert to authenticated
with check (
  exists (
    select 1
    from public.memberships membership
    where membership.organization_id = content_translations.organization_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
  )
);

create policy "Organization members can update translations"
on public.content_translations
for update to authenticated
using (
  exists (
    select 1
    from public.memberships membership
    where membership.organization_id = content_translations.organization_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
  )
)
with check (
  exists (
    select 1
    from public.memberships membership
    where membership.organization_id = content_translations.organization_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
  )
);

create policy "Organization members can read translation reviews"
on public.content_translation_reviews
for select to authenticated
using (
  exists (
    select 1
    from public.memberships membership
    where membership.organization_id = content_translation_reviews.organization_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
  )
);

create policy "Organization members can create translation reviews"
on public.content_translation_reviews
for insert to authenticated
with check (
  exists (
    select 1
    from public.memberships membership
    where membership.organization_id = content_translation_reviews.organization_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
  )
);

grant select, insert, update on public.content_translations to authenticated;
grant usage, select on sequence public.content_translations_id_seq to authenticated;
grant select, insert on public.content_translation_reviews to authenticated;
grant usage, select on sequence public.content_translation_reviews_id_seq to authenticated;
