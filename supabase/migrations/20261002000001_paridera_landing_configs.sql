-- Landing configuration for the five Paridera projects.
-- Stored like every other project landing: one project_media row of kind
-- 'landing_config' whose alt_text holds the JSON read by lib/data/landing-config.ts.
-- The experience preset routes /proyectos/<slug> to ParideraProjectLanding; the
-- page content itself lives in the component and lib/data/paridera-portfolio.ts.
-- Only creates the initial config: once it exists it is edited from the CRM
-- (contact WhatsApp/email, colours…), so re-running never overwrites those edits.

insert into public.project_media (
  organization_id, project_id, kind, storage_bucket, storage_path, alt_text, sort_order
)
select
  project.organization_id,
  project.id,
  'landing_config',
  'public-assets',
  'projects/' || project.slug || '/landing_config.json',
  jsonb_build_object(
    'projectId', project.id,
    'projectSlug', project.slug,
    'isPublished', true,
    'theme', jsonb_build_object(
      'primaryColor', '#0A2A3B',
      'accentColor', '#F5C85B',
      'fontPreset', 'luxury',
      'logoUrl', case when project.slug = 'bonita-golf'
        then '/paridera/golf/logo-blue.png'
        else '/paridera/hub/logo-h-blue.png' end,
      'heroMediaUrl', case project.slug
        when 'sunrise-bonita-beach' then '/paridera/hub/sunrise-hero.jpg'
        when 'sunset-bonita-beach' then '/paridera/sunset/sunset-01.jpg'
        when 'beach-bonita-beach' then '/paridera/beach/fachada.jpg'
        when 'villas-bonita-beach' then '/paridera/villas/villa-01.jpg'
        else '/paridera/golf/exterior.jpg' end,
      'heroMediaType', 'image',
      -- Initial commercial contact (same as Cana Rock); change it in the CRM.
      'contactWhatsapp', '18097828828',
      'contactEmail', 'ventas@ob-brokers.com',
      'experiencePreset', 'paridera-bonita-beach'
    ),
    'hero', jsonb_build_object(
      'headline', project.name,
      'subheadline', project.short_description,
      'badgeText', '',
      'ctaText', 'Ver disponibilidad',
      'startingPriceText', 'Desde USD $' || trim(to_char(project.starting_price, 'FM999,999,999'))
    )
  )::text,
  0
from public.projects project
join public.organizations owner on owner.id = project.organization_id
where owner.slug = 'paridera-osvaldo-bello'
  and project.slug in (
    'sunrise-bonita-beach', 'sunset-bonita-beach', 'beach-bonita-beach',
    'villas-bonita-beach', 'bonita-golf'
  )
  and not exists (
    select 1 from public.project_media existing
    where existing.project_id = project.id and existing.kind = 'landing_config'
  )
on conflict (storage_bucket, storage_path) do nothing;
