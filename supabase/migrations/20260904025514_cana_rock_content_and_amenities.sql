-- Complete the Cana Rock public catalog with owned media, editable amenities,
-- and a project-specific landing experience. The migration is idempotent.

alter table public.project_media drop constraint if exists project_media_kind_check;
alter table public.project_media
  add constraint project_media_kind_check check (
    kind in (
      'hero', 'gallery', 'floor_plan', 'logo', 'document_preview',
      'google_sheet', 'landing_config', 'landing_custom_domain'
    )
  );

create or replace function private.can_manage_project_content(target_project_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.projects p
      where p.id = target_project_id
        and (
          (select private.has_org_role(
            p.organization_id,
            array['super_admin', 'master_broker_admin', 'master_broker_operations']::text[]
          ))
          or (
            p.developer_organization_id is not null
            and (select private.has_org_role(
              p.developer_organization_id,
              array['super_admin', 'developer_admin']::text[]
            ))
          )
        )
    );
$$;

revoke all on function private.can_manage_project_content(bigint) from public;
grant execute on function private.can_manage_project_content(bigint) to authenticated;

create or replace function public.replace_project_amenities(
  target_project_id bigint,
  amenity_items jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  item jsonb;
  amenity_name text;
  amenity_icon text;
  amenity_slug text;
  amenity_id bigint;
begin
  if not (select private.can_manage_project_content(target_project_id)) then
    raise exception 'Not authorized to manage project amenities';
  end if;

  if jsonb_typeof(coalesce(amenity_items, '[]'::jsonb)) <> 'array' then
    raise exception 'amenity_items must be a JSON array';
  end if;

  delete from public.project_amenities
  where project_id = target_project_id;

  for item in select value from jsonb_array_elements(coalesce(amenity_items, '[]'::jsonb))
  loop
    amenity_name := trim(item ->> 'name');
    amenity_icon := nullif(trim(item ->> 'icon'), '');

    if amenity_name is null or amenity_name = '' then
      continue;
    end if;

    select id into amenity_id
    from public.amenities
    where lower(name) = lower(amenity_name)
    order by id
    limit 1;

    if amenity_id is null then
      amenity_slug := trim(both '-' from lower(
        regexp_replace(
          translate(amenity_name, 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN'),
          '[^a-zA-Z0-9]+',
          '-',
          'g'
        )
      ));

      if amenity_slug = '' then
        amenity_slug := 'amenidad-' || substr(md5(amenity_name), 1, 8);
      elsif exists (select 1 from public.amenities where slug = amenity_slug) then
        amenity_slug := amenity_slug || '-' || substr(md5(amenity_name), 1, 8);
      end if;

      insert into public.amenities (slug, name, icon)
      values (amenity_slug, amenity_name, amenity_icon)
      returning id into amenity_id;
    elsif amenity_icon is not null then
      update public.amenities
      set icon = amenity_icon
      where id = amenity_id;
    end if;

    insert into public.project_amenities (project_id, amenity_id)
    values (target_project_id, amenity_id)
    on conflict do nothing;
  end loop;
end;
$$;

revoke all on function public.replace_project_amenities(bigint, jsonb) from public;
grant execute on function public.replace_project_amenities(bigint, jsonb) to authenticated;

comment on function public.replace_project_amenities(bigint, jsonb) is
  'Atomically replaces one project amenity list after verifying project-scoped content permissions.';

update public.projects
set
  name = source.name,
  description = source.description,
  short_description = source.short_description,
  updated_at = now()
from (
  values
    (
      'cana-rock-star',
      'Cana Rock Star',
      'Es un exclusivo residencial de arquitectura moderna e innovadora ubicado en la prestigiosa comunidad privada de Cana Bay, Punta Cana. Estratégicamente ubicado bordeando los hoyos 3, 4 y 5 del Hard Rock Golf Club y a solo 30 minutos del Aeropuerto Internacional de Punta Cana, ofrece unidades listas para entrega de 1, 2 y 3 habitaciones, equipadas con línea blanca completa y preinstalación de jacuzzi en balcones. Sus residentes disfrutan de piscina con bar, gimnasio, área infantil y acceso exclusivo al Club de Playa Cana Bay frente al Mar Caribe.',
      'Apartamentos listos para entrega junto al Hard Rock Golf Club y el Club de Playa Cana Bay.'
    ),
    (
      'cana-rock-universe',
      'Cana Rock Universe',
      'Cana Rock Universe es el lugar ideal para abrazar la espléndida mezcla entre el diseño ecológico tropical y el estilo de vida del resort, dentro de la comunidad privada de Cana Bay en Punta Cana.',
      'Diseño ecológico tropical y estilo de vida de resort en Cana Bay.'
    ),
    (
      'cana-rock-galaxy',
      'Cana Rock Galaxy',
      'Un proyecto vanguardista, con ubicación privilegiada y vistas excepcionales. Cana Rock Galaxy combina tecnología y lujo residencial mediante apartamentos inteligentes con sistema Smart Home y vistas ininterrumpidas al campo de golf.',
      'Apartamentos inteligentes con tecnología Smart Home y vistas al golf.'
    ),
    (
      'cana-rock-stelar',
      'Cana Rock Cosmos Stelar',
      'Cosmos Stelar es una relajante combinación de arquitectura contemporánea y naturaleza, situada en medio del reconocido Hard Rock Golf Club de Cana Bay.',
      'Arquitectura contemporánea integrada con la naturaleza, el lago y el campo de golf.'
    )
) as source(slug, name, description, short_description)
where public.projects.slug = source.slug;

create temporary table seed_cana_rock_media (
  project_slug text not null,
  kind text not null,
  storage_path text not null,
  alt_text text not null,
  sort_order integer not null
) on commit drop;

insert into seed_cana_rock_media (project_slug, kind, storage_path, alt_text, sort_order)
values
  ('cana-rock-star', 'hero', 'cana-rock/star/hero.jpg', 'Vista principal de Cana Rock Star', 0),
  ('cana-rock-star', 'logo', 'cana-rock/star/logo.png', 'Logo de Cana Rock Star', 0),
  ('cana-rock-star', 'gallery', 'cana-rock/star/gallery/01.jpg', 'Cana Rock Star · Vista exterior', 1),
  ('cana-rock-star', 'gallery', 'cana-rock/star/gallery/02.jpg', 'Cana Rock Star · Sala', 2),
  ('cana-rock-star', 'gallery', 'cana-rock/star/gallery/03.jpg', 'Cana Rock Star · Sala, comedor y cocina', 3),
  ('cana-rock-star', 'gallery', 'cana-rock/star/gallery/04.jpg', 'Cana Rock Star · Interior', 4),
  ('cana-rock-star', 'gallery', 'cana-rock/star/gallery/05.jpg', 'Cana Rock Star · Exterior nocturno', 5),
  ('cana-rock-star', 'gallery', 'cana-rock/star/gallery/06.jpg', 'Cana Rock Star · Bar de piscina', 6),
  ('cana-rock-star', 'gallery', 'cana-rock/star/gallery/07.jpg', 'Cana Rock Star · Escalera de penthouse', 7),
  ('cana-rock-star', 'gallery', 'cana-rock/star/gallery/08.jpg', 'Cana Rock Star · Penthouse segundo nivel', 8),
  ('cana-rock-star', 'gallery', 'cana-rock/star/gallery/09.jpg', 'Cana Rock Star · Lobby exterior', 9),
  ('cana-rock-star', 'gallery', 'cana-rock/star/gallery/10.jpg', 'Cana Rock Star · Lobby interior', 10),
  ('cana-rock-universe', 'hero', 'cana-rock/universe/hero.jpg', 'Vista principal de Cana Rock Universe', 0),
  ('cana-rock-universe', 'logo', 'cana-rock/universe/logo.png', 'Logo de Cana Rock Universe', 0),
  ('cana-rock-universe', 'gallery', 'cana-rock/universe/gallery/01.jpg', 'Cana Rock Universe · Vista exterior', 1),
  ('cana-rock-universe', 'gallery', 'cana-rock/universe/gallery/02.jpg', 'Cana Rock Universe · Vista del conjunto', 2),
  ('cana-rock-universe', 'gallery', 'cana-rock/universe/gallery/03.jpg', 'Cana Rock Universe · Penthouse', 3),
  ('cana-rock-universe', 'gallery', 'cana-rock/universe/gallery/04.jpg', 'Cana Rock Universe · Apartamento', 4),
  ('cana-rock-universe', 'gallery', 'cana-rock/universe/gallery/05.jpg', 'Cana Rock Universe · Arquitectura', 5),
  ('cana-rock-universe', 'gallery', 'cana-rock/universe/gallery/06.jpg', 'Cana Rock Universe · Áreas sociales', 6),
  ('cana-rock-universe', 'gallery', 'cana-rock/universe/gallery/07.jpg', 'Cana Rock Universe · Exterior', 7),
  ('cana-rock-universe', 'gallery', 'cana-rock/universe/gallery/08.jpg', 'Cana Rock Universe · Piscina', 8),
  ('cana-rock-universe', 'gallery', 'cana-rock/universe/gallery/09.jpg', 'Cana Rock Universe · Jardines', 9),
  ('cana-rock-universe', 'gallery', 'cana-rock/universe/gallery/10.jpg', 'Cana Rock Universe · Amenidades', 10),
  ('cana-rock-universe', 'gallery', 'cana-rock/universe/gallery/11.jpg', 'Cana Rock Universe · Apartamento nivel uno', 11),
  ('cana-rock-galaxy', 'hero', 'cana-rock/galaxy/hero.jpg', 'Vista principal de Cana Rock Galaxy', 0),
  ('cana-rock-galaxy', 'logo', 'cana-rock/galaxy/logo.png', 'Logo de Cana Rock Galaxy', 0),
  ('cana-rock-galaxy', 'gallery', 'cana-rock/galaxy/gallery/01.jpg', 'Cana Rock Galaxy · Vista exterior', 1),
  ('cana-rock-galaxy', 'gallery', 'cana-rock/galaxy/gallery/02.jpg', 'Cana Rock Galaxy · Vista del conjunto', 2),
  ('cana-rock-galaxy', 'gallery', 'cana-rock/galaxy/gallery/03.jpg', 'Cana Rock Galaxy · Arquitectura', 3),
  ('cana-rock-galaxy', 'gallery', 'cana-rock/galaxy/gallery/04.jpg', 'Cana Rock Galaxy · Exterior', 4),
  ('cana-rock-galaxy', 'gallery', 'cana-rock/galaxy/gallery/05.jpg', 'Cana Rock Galaxy · Área social', 5),
  ('cana-rock-galaxy', 'gallery', 'cana-rock/galaxy/gallery/06.jpg', 'Cana Rock Galaxy · Vista al golf', 6),
  ('cana-rock-stelar', 'hero', 'cana-rock/stelar/hero.jpg', 'Vista principal de Cana Rock Cosmos Stelar', 0),
  ('cana-rock-stelar', 'logo', 'cana-rock/stelar/logo.png', 'Logo de Cana Rock Cosmos Stelar', 0),
  ('cana-rock-stelar', 'gallery', 'cana-rock/stelar/gallery/01.jpg', 'Cana Rock Cosmos Stelar · Vista aérea', 1),
  ('cana-rock-stelar', 'gallery', 'cana-rock/stelar/gallery/02.jpg', 'Cana Rock Cosmos Stelar · Vista exterior', 2),
  ('cana-rock-stelar', 'gallery', 'cana-rock/stelar/gallery/03.jpg', 'Cana Rock Cosmos Stelar · Área social', 3),
  ('cana-rock-stelar', 'gallery', 'cana-rock/stelar/gallery/04.jpg', 'Cana Rock Cosmos Stelar · Piscina', 4),
  ('cana-rock-stelar', 'gallery', 'cana-rock/stelar/gallery/05.jpg', 'Cana Rock Cosmos Stelar · Amenidades', 5),
  ('cana-rock-stelar', 'gallery', 'cana-rock/stelar/gallery/06.jpeg', 'Cana Rock Cosmos Stelar · Sala', 6),
  ('cana-rock-stelar', 'gallery', 'cana-rock/stelar/gallery/07.jpeg', 'Cana Rock Cosmos Stelar · Habitación', 7),
  ('cana-rock-stelar', 'gallery', 'cana-rock/stelar/gallery/08.jpg', 'Cana Rock Cosmos Stelar · Master plan', 8);

delete from public.project_media media
using public.projects project
where media.project_id = project.id
  and project.slug in ('cana-rock-star', 'cana-rock-universe', 'cana-rock-galaxy', 'cana-rock-stelar')
  and media.kind in ('hero', 'gallery', 'logo');

insert into public.project_media (
  organization_id, project_id, kind, storage_bucket, storage_path, alt_text, sort_order
)
select
  project.organization_id,
  project.id,
  media.kind,
  'public-assets',
  media.storage_path,
  media.alt_text,
  media.sort_order
from seed_cana_rock_media media
join public.projects project on project.slug = media.project_slug
on conflict (storage_bucket, storage_path) do update
set organization_id = excluded.organization_id,
    project_id = excluded.project_id,
    kind = excluded.kind,
    alt_text = excluded.alt_text,
    sort_order = excluded.sort_order;

create temporary table seed_cana_rock_amenities (
  project_slug text not null,
  amenity_name text not null,
  amenity_icon text
) on commit drop;

insert into seed_cana_rock_amenities (project_slug, amenity_name, amenity_icon)
values
  ('cana-rock-star', 'GYM', 'gym'),
  ('cana-rock-star', 'Vistas al campo de golf', 'golf'),
  ('cana-rock-star', 'Aparcamiento al aire libre', 'car'),
  ('cana-rock-star', 'Aparcamiento para carros de golf', 'golf-cart-parking'),
  ('cana-rock-star', 'Seguridad 24 horas', 'security'),
  ('cana-rock-star', 'Ascensores', 'elevators'),
  ('cana-rock-star', 'Vestíbulo', 'main-lobby'),
  ('cana-rock-star', 'Zona infantil', 'kids'),
  ('cana-rock-star', 'Sport bar', 'bar'),
  ('cana-rock-star', 'Piscina', 'pool'),
  ('cana-rock-star', 'Bar de la piscina', 'pool-bar'),
  ('cana-rock-universe', 'GYM', 'gym'),
  ('cana-rock-universe', 'Vistas al campo de golf', 'golf'),
  ('cana-rock-universe', 'Aparcamiento para carros de golf', 'golf-cart-parking'),
  ('cana-rock-universe', 'Seguridad 24 horas', 'security'),
  ('cana-rock-universe', 'Ascensores', 'elevators'),
  ('cana-rock-universe', 'Vestíbulo', 'main-lobby'),
  ('cana-rock-universe', 'Restaurante de autor', 'bar'),
  ('cana-rock-universe', 'Aparcamiento subterráneo', 'car'),
  ('cana-rock-universe', 'Piscina', 'pool'),
  ('cana-rock-galaxy', 'GYM', 'gym'),
  ('cana-rock-galaxy', 'Aparcamiento para carros de golf', 'golf-cart-parking'),
  ('cana-rock-galaxy', 'Seguridad 24 horas', 'security'),
  ('cana-rock-galaxy', 'Ascensores', 'elevators'),
  ('cana-rock-galaxy', 'Vestíbulo', 'main-lobby'),
  ('cana-rock-galaxy', 'Restaurante de autor', 'bar'),
  ('cana-rock-galaxy', 'Piscina infinita', 'pool'),
  ('cana-rock-galaxy', 'Bar de natación', 'pool-bar'),
  ('cana-rock-galaxy', 'Vistas al mar y al campo de golf', 'golf'),
  ('cana-rock-galaxy', 'Aparcamiento subterráneo', 'car'),
  ('cana-rock-stelar', 'GYM', 'gym'),
  ('cana-rock-stelar', 'Seguridad 24 horas', 'security'),
  ('cana-rock-stelar', 'Ascensores', 'elevators'),
  ('cana-rock-stelar', 'Vestíbulo', 'main-lobby'),
  ('cana-rock-stelar', 'Lugar para el yoga', 'yoga'),
  ('cana-rock-stelar', 'Minigolf', 'golf'),
  ('cana-rock-stelar', 'Zona infantil', 'kids'),
  ('cana-rock-stelar', 'Bar', 'bar'),
  ('cana-rock-stelar', 'Restaurante de autor', 'bar'),
  ('cana-rock-stelar', 'Aparcamiento subterráneo', 'car'),
  ('cana-rock-stelar', 'Piscina', 'pool'),
  ('cana-rock-stelar', 'Vistas al lago y al campo de golf', 'golf');

insert into public.amenities (slug, name, icon)
select distinct on (lower(amenity_name))
  trim(both '-' from lower(regexp_replace(
    translate(amenity_name, 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN'),
    '[^a-zA-Z0-9]+', '-', 'g'
  ))),
  amenity_name,
  amenity_icon
from seed_cana_rock_amenities
order by lower(amenity_name), amenity_name
on conflict (name) do update
set icon = excluded.icon;

delete from public.project_amenities relation
using public.projects project
where relation.project_id = project.id
  and project.slug in ('cana-rock-star', 'cana-rock-universe', 'cana-rock-galaxy', 'cana-rock-stelar');

insert into public.project_amenities (project_id, amenity_id)
select distinct project.id, amenity.id
from seed_cana_rock_amenities source
join public.projects project on project.slug = source.project_slug
join public.amenities amenity on lower(amenity.name) = lower(source.amenity_name)
on conflict do nothing;

insert into public.payment_plans (
  organization_id, project_id, name, currency, is_active, valid_from
)
select organization_id, id, 'Plan estándar Cana Rock', 'USD', true, current_date
from public.projects project
where slug in ('cana-rock-star', 'cana-rock-universe', 'cana-rock-galaxy', 'cana-rock-stelar')
  and not exists (
    select 1 from public.payment_plans plan
    where plan.project_id = project.id and plan.name = 'Plan estándar Cana Rock'
  );

insert into public.payment_plan_steps (payment_plan_id, label, percentage, fixed_amount, milestone, sort_order)
select plan.id, source.label, source.percentage, source.fixed_amount, source.milestone, source.sort_order
from public.payment_plans plan
cross join (
  values
    ('Reserva', null::numeric, 3000::numeric, 'Al seleccionar la unidad', 0),
    ('Inicial', 20::numeric, null::numeric, 'Según contrato', 1),
    ('Durante construcción', 40::numeric, null::numeric, 'Cuotas durante la construcción', 2),
    ('Contra entrega', 40::numeric, null::numeric, 'A la entrega de la unidad', 3)
) source(label, percentage, fixed_amount, milestone, sort_order)
join public.projects project on project.id = plan.project_id
where plan.name = 'Plan estándar Cana Rock'
  and project.slug in ('cana-rock-star', 'cana-rock-universe', 'cana-rock-galaxy', 'cana-rock-stelar')
on conflict (payment_plan_id, sort_order) do update
set label = excluded.label,
    percentage = excluded.percentage,
    fixed_amount = excluded.fixed_amount,
    milestone = excluded.milestone;

delete from public.project_media media
using public.projects project
where media.project_id = project.id
  and project.slug in ('cana-rock-star', 'cana-rock-universe', 'cana-rock-galaxy', 'cana-rock-stelar')
  and media.kind = 'landing_config';

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
      'primaryColor', '#081339',
      'accentColor', '#D4AF37',
      'fontPreset', 'luxury',
      'logoUrl', 'https://whrimmszdeghblbktivp.supabase.co/storage/v1/object/public/public-assets/' || logo.storage_path,
      'heroMediaUrl', 'https://whrimmszdeghblbktivp.supabase.co/storage/v1/object/public/public-assets/' || hero.storage_path,
      'heroMediaType', 'image',
      'contactWhatsapp', '18097828828',
      'contactEmail', 'ventas@ob-brokers.com',
      'experiencePreset', 'cana-rock-resort'
    ),
    'visibility', jsonb_build_object(
      'hero', true,
      'concept', true,
      'typologies', true,
      'availability', true,
      'gallery', true,
      'amenities', true,
      'paymentPlan', true,
      'location', true,
      'contactForm', true
    ),
    'hero', jsonb_build_object(
      'headline', project.name,
      'subheadline', project.short_description,
      'badgeText', 'Grupo Cana Rock · Cana Bay',
      'ctaText', 'Ver disponibilidad',
      'startingPriceText', 'Desde USD $' || trim(to_char(project.starting_price, 'FM999,999,999'))
    ),
    'concept', jsonb_build_object(
      'title', 'Resort living dentro de Cana Bay',
      'description', project.description,
      'bullet1', 'Ubicación dentro de la comunidad privada Cana Bay',
      'bullet2', 'Acceso a amenidades y entorno de golf',
      'bullet3', 'Inventario comercial centralizado y actualizado'
    ),
    'paymentSteps', jsonb_build_array(
      jsonb_build_object('title', 'Reserva', 'percentage', 'US$ 3,000', 'description', 'Bloqueo de la unidad seleccionada.'),
      jsonb_build_object('title', 'Inicial', 'percentage', '20%', 'description', 'Completa el inicial según las condiciones del contrato.'),
      jsonb_build_object('title', 'Durante construcción', 'percentage', '40%', 'description', 'Cuotas durante el periodo de construcción.'),
      jsonb_build_object('title', 'Contra entrega', 'percentage', '40%', 'description', 'Balance al recibir la unidad.')
    ),
    'heroSlides', gallery.urls,
    'customGallery', gallery.urls,
    'dns', jsonb_build_object(
      'customDomain', '',
      'cnameTarget', 'cname.vercel-dns.com',
      'isVerified', false
    )
  )::text,
  999
from public.projects project
join seed_cana_rock_media hero
  on hero.project_slug = project.slug and hero.kind = 'hero'
join seed_cana_rock_media logo
  on logo.project_slug = project.slug and logo.kind = 'logo'
join lateral (
  select jsonb_agg(
    to_jsonb('https://whrimmszdeghblbktivp.supabase.co/storage/v1/object/public/public-assets/' || media.storage_path)
    order by media.sort_order
  ) as urls
  from seed_cana_rock_media media
  where media.project_slug = project.slug and media.kind = 'gallery'
) gallery on true
where project.slug in ('cana-rock-star', 'cana-rock-universe', 'cana-rock-galaxy', 'cana-rock-stelar')
on conflict (storage_bucket, storage_path) do update
set organization_id = excluded.organization_id,
    project_id = excluded.project_id,
    kind = excluded.kind,
    alt_text = excluded.alt_text,
    sort_order = excluded.sort_order;
