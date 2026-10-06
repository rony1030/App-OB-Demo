-- Initial Cana Rock portfolio onboarding.
-- Idempotent by organization/project/unit natural keys; safe to re-run.

insert into public.organizations (slug, name, kind, status)
values
  ('cana-rock-osvaldo-bello', 'Cana Rock / Osvaldo Bello', 'master_broker', 'active'),
  ('grupo-cana-rock', 'Grupo Cana Rock', 'developer', 'active')
on conflict (slug) do update
set name = excluded.name,
    kind = excluded.kind,
    status = excluded.status,
    updated_at = now();

insert into public.brand_profiles (
  organization_id, name, is_default, primary_color, secondary_color, accent_color, surface_color
)
select id, 'Cana Rock', true, '#0A1140', '#172052', '#D4AF37', '#F8F7F2'
from public.organizations
where slug = 'cana-rock-osvaldo-bello'
on conflict (organization_id, name) do update
set primary_color = excluded.primary_color,
    secondary_color = excluded.secondary_color,
    accent_color = excluded.accent_color,
    surface_color = excluded.surface_color,
    is_default = true,
    updated_at = now();

insert into public.organization_relationships (
  source_organization_id, target_organization_id, relationship_type, status, starts_at,
  metadata
)
select
  master_broker.id,
  developer.id,
  'master_broker_for',
  'active',
  now(),
  '{"source":"cana-rock-migration","scope":"commercial_management"}'::jsonb
from public.organizations master_broker
cross join public.organizations developer
where master_broker.slug = 'cana-rock-osvaldo-bello'
  and developer.slug = 'grupo-cana-rock'
on conflict (source_organization_id, target_organization_id, relationship_type)
do update set
  status = excluded.status,
  metadata = excluded.metadata,
  updated_at = now();

insert into public.projects (
  organization_id,
  developer_organization_id,
  brand_profile_id,
  slug,
  name,
  location,
  zone,
  lifecycle_status,
  publication_status,
  delivery_date,
  description,
  short_description,
  starting_price,
  currency,
  master_broker_exclusive,
  inventory_total_declared,
  inventory_available_declared,
  inventory_is_complete,
  inventory_updated_at,
  published_at
)
select
  master_broker.id,
  developer.id,
  brand.id,
  source.slug,
  source.name,
  'Cana Bay, Punta Cana',
  'Punta Cana',
  source.lifecycle_status,
  'published',
  source.delivery_date,
  source.description,
  source.short_description,
  source.starting_price,
  'USD',
  true,
  source.inventory_total,
  source.inventory_available,
  false,
  now(),
  now()
from (
  values
    (
      'cana-rock-star',
      'Cana Rock Star',
      'ready_to_deliver',
      null::date,
      'Residencial de arquitectura moderna e innovadora en Cana Bay, junto al Hard Rock Golf Club, con unidades listas para entrega.',
      'Unidades listas para entrega en Cana Bay.',
      165000::numeric,
      623,
      44
    ),
    (
      'cana-rock-universe',
      'Cana Rock Universe',
      'under_construction',
      '2027-05-01'::date,
      'Una combinación de diseño ecológico tropical y estilo de vida de resort dentro de Cana Bay.',
      'Diseño tropical y vida de resort en Cana Bay.',
      190000::numeric,
      310,
      12
    ),
    (
      'cana-rock-galaxy',
      'Cana Rock Galaxy',
      'under_construction',
      '2026-08-01'::date,
      'Proyecto residencial vanguardista con apartamentos inteligentes y vistas privilegiadas al campo de golf.',
      'Apartamentos inteligentes con vistas al golf.',
      220000::numeric,
      180,
      17
    ),
    (
      'cana-rock-stelar',
      'Cana Rock Cosmos Stelar',
      'under_construction',
      '2027-12-01'::date,
      'Propuesta residencial contemporánea integrada con la naturaleza y el Hard Rock Golf Club de Cana Bay.',
      'Residencias contemporáneas integradas con la naturaleza.',
      175000::numeric,
      400,
      44
    )
) as source(
  slug, name, lifecycle_status, delivery_date, description, short_description,
  starting_price, inventory_total, inventory_available
)
cross join public.organizations master_broker
cross join public.organizations developer
left join public.brand_profiles brand
  on brand.organization_id = master_broker.id and brand.name = 'Cana Rock'
where master_broker.slug = 'cana-rock-osvaldo-bello'
  and developer.slug = 'grupo-cana-rock'
on conflict (organization_id, slug) do update
set developer_organization_id = excluded.developer_organization_id,
    brand_profile_id = excluded.brand_profile_id,
    name = excluded.name,
    location = excluded.location,
    zone = excluded.zone,
    lifecycle_status = excluded.lifecycle_status,
    publication_status = excluded.publication_status,
    delivery_date = excluded.delivery_date,
    description = excluded.description,
    short_description = excluded.short_description,
    starting_price = excluded.starting_price,
    currency = excluded.currency,
    master_broker_exclusive = excluded.master_broker_exclusive,
    inventory_total_declared = excluded.inventory_total_declared,
    inventory_available_declared = excluded.inventory_available_declared,
    inventory_is_complete = excluded.inventory_is_complete,
    inventory_updated_at = excluded.inventory_updated_at,
    published_at = coalesce(public.projects.published_at, excluded.published_at),
    updated_at = now();

insert into public.project_media (
  organization_id, project_id, kind, storage_bucket, storage_path, alt_text, sort_order
)
select organization_id, project_id, kind, 'external', storage_path, alt_text, sort_order
from (
  select p.organization_id, p.id as project_id, media.kind, media.storage_path, media.alt_text, media.sort_order
  from public.projects p
  cross join lateral (
    values
      ('hero', 'https://canarock.info/wp-content/uploads/2022/06/web01-scaled.jpg', 'Cana Rock Star', 0)
  ) media(kind, storage_path, alt_text, sort_order)
  where p.slug = 'cana-rock-star'
  union all
  select p.organization_id, p.id, media.kind, media.storage_path, media.alt_text, media.sort_order
  from public.projects p
  cross join lateral (
    values
      ('hero', 'https://canarock.info/wp-content/uploads/2021/09/004-2.jpg', 'Cana Rock Universe', 0)
  ) media(kind, storage_path, alt_text, sort_order)
  where p.slug = 'cana-rock-universe'
  union all
  select p.organization_id, p.id, media.kind, media.storage_path, media.alt_text, media.sort_order
  from public.projects p
  cross join lateral (
    values
      ('hero', 'https://canarock.info/wp-content/uploads/2021/09/001-1.jpg', 'Cana Rock Galaxy', 0)
  ) media(kind, storage_path, alt_text, sort_order)
  where p.slug = 'cana-rock-galaxy'
  union all
  select p.organization_id, p.id, media.kind, media.storage_path, media.alt_text, media.sort_order
  from public.projects p
  cross join lateral (
    values
      ('hero', 'https://canarock.info/wp-content/uploads/2023/05/230426_Cosmos_Aerea-01_Final-scaled.jpg', 'Cana Rock Cosmos Stelar', 0)
  ) media(kind, storage_path, alt_text, sort_order)
  where p.slug = 'cana-rock-stelar'
) source
on conflict (storage_bucket, storage_path) do update
set organization_id = excluded.organization_id,
    project_id = excluded.project_id,
    kind = excluded.kind,
    alt_text = excluded.alt_text,
    sort_order = excluded.sort_order;

insert into public.project_highlights (project_id, content, sort_order)
select p.id, source.content, source.sort_order
from public.projects p
cross join (
  values
    ('Inventario conectado con la disponibilidad oficial de Cana Rock', 0),
    ('Gestión comercial a cargo de Cana Rock / Osvaldo Bello', 1)
) source(content, sort_order)
where p.slug in ('cana-rock-star', 'cana-rock-universe', 'cana-rock-galaxy', 'cana-rock-stelar')
on conflict (project_id, sort_order) do update
set content = excluded.content;

insert into public.integration_connections (
  project_id,
  provider,
  display_name,
  external_project_id,
  base_url,
  credentials_secret_name,
  status,
  sync_interval_seconds,
  config,
  last_success_at
)
select
  p.id,
  'cana_rock_portal',
  'Disponibilidad oficial de Cana Rock',
  p.slug,
  'https://portal.canarock.info',
  'CANA_ROCK_AVAILABILITY_API_KEY',
  'paused',
  300,
  '{"mode":"shadow","onboarding":"initial_import"}'::jsonb,
  now()
from public.projects p
where p.slug in ('cana-rock-star', 'cana-rock-universe', 'cana-rock-galaxy', 'cana-rock-stelar')
on conflict (project_id, provider, external_project_id) do update
set display_name = excluded.display_name,
    base_url = excluded.base_url,
    credentials_secret_name = excluded.credentials_secret_name,
    status = excluded.status,
    sync_interval_seconds = excluded.sync_interval_seconds,
    config = excluded.config,
    last_success_at = excluded.last_success_at,
    updated_at = now();

insert into public.project_responsibilities (
  project_id, responsible_organization_id, responsibility, is_primary, notes
)
select p.id, p.organization_id, 'commercial.master_broker', true, 'Responsable comercial principal.'
from public.projects p
where p.slug in ('cana-rock-star', 'cana-rock-universe', 'cana-rock-galaxy', 'cana-rock-stelar')
  and not exists (
    select 1 from public.project_responsibilities r
    where r.project_id = p.id
      and r.responsible_organization_id = p.organization_id
      and r.responsibility = 'commercial.master_broker'
  );

insert into public.project_responsibilities (
  project_id, responsible_organization_id, responsibility, is_primary, notes
)
select p.id, p.developer_organization_id, 'development.owner', true, 'Desarrollador titular del proyecto.'
from public.projects p
where p.slug in ('cana-rock-star', 'cana-rock-universe', 'cana-rock-galaxy', 'cana-rock-stelar')
  and p.developer_organization_id is not null
  and not exists (
    select 1 from public.project_responsibilities r
    where r.project_id = p.id
      and r.responsible_organization_id = p.developer_organization_id
      and r.responsibility = 'development.owner'
  );

create temporary table seed_cana_rock_units (
  project_slug text not null,
  external_id text not null,
  unit_code text not null,
  typology text not null,
  tower text,
  floor_level integer,
  bedrooms smallint,
  bathrooms numeric(4,1),
  area_sqm numeric(10,2) not null,
  list_price numeric(14,2) not null,
  currency text not null,
  status text not null,
  parking_spaces integer
) on commit drop;

insert into seed_cana_rock_units (
  project_slug, external_id, unit_code, typology, tower, floor_level,
  bedrooms, bathrooms, area_sqm, list_price, currency, status, parking_spaces
)
values
  ('cana-rock-star', 'CRS-Star D112', 'D112', 'Swim Out;Esquinas', 'Bloque D', 1, 2, 2, 142.41, 473399, 'USD', 'available', 0),
  ('cana-rock-star', 'CRS-Star D201', 'D201', 'Apartamentos;Esquinas', 'Bloque D', 2, 3, 2, 145.46, 466599, 'USD', 'available', 0),
  ('cana-rock-star', 'CRS-Star D212', 'D212', 'Esquinas', 'Bloque D', 2, 2, 2, 145.46, 466599, 'USD', 'available', 0),
  ('cana-rock-star', 'CRS-Star D301', 'D301', 'Apartamentos;Esquinas', 'Bloque D', 3, 3, 2, 156.31, 490399, 'USD', 'available', 0),
  ('cana-rock-star', 'CRS-Star D309', 'D309', 'Apartamentos', 'Bloque D', 3, 2, 2, 96.54, 315299, 'USD', 'available', 0),
  ('cana-rock-star', 'CRS-Star D312', 'D312', 'Esquinas', 'Bloque D', 3, 2, 2, 156.31, 490399, 'USD', 'available', 0),
  ('cana-rock-star', 'CRS-Star D401', 'D401', 'Apartamentos;Esquinas', 'Bloque D', 4, 3, 2, 145.39, 501599, 'USD', 'available', 0),
  ('cana-rock-star', 'CRS-Star D402', 'D402', 'Apartamentos', 'Bloque D', 4, 2, 2, 93.13, 319599, 'USD', 'available', 0),
  ('cana-rock-star', 'CRS-Star D405', 'D405', 'Apartamentos', 'Bloque D', 4, 2, 2, 93.13, 319599, 'USD', 'available', 0),
  ('cana-rock-star', 'CRS-Star D406', 'D406', 'Apartamentos', 'Bloque D', 4, 2, 2, 93.27, 319599, 'USD', 'available', 0),
  ('cana-rock-star', 'CRS-Star D408', 'D408', 'Apartamentos', 'Bloque D', 4, 2, 2, 93.13, 319599, 'USD', 'available', 0),
  ('cana-rock-star', 'CRS-Star D409', 'D409', 'Apartamentos', 'Bloque D', 4, 2, 2, 93.13, 319599, 'USD', 'available', 0),
  ('cana-rock-star', 'CRS-Star D412', 'D412', 'Esquinas', 'Bloque D', 4, 2, 2, 145.39, 501599, 'USD', 'available', 0),
  ('cana-rock-star', 'CRS-Star D502', 'D502', 'Penthouses', 'Bloque D', 5, 2, 2, 167.75, 406299, 'USD', 'available', 0),
  ('cana-rock-star', 'CRS-Star D503', 'D503', 'Penthouses', 'Bloque D', 5, 2, 2, 167.75, 406299, 'USD', 'available', 0),
  ('cana-rock-star', 'CRS-Star D505', 'D505', 'Penthouses', 'Bloque D', 5, 2, 2, 185.75, 406299, 'USD', 'available', 1),
  ('cana-rock-star', 'CRS-Star F101', 'F101', 'Swim Out;Esquinas', 'Bloque F', 1, 2, 2, 142.4, 473399, 'USD', 'available', 0),
  ('cana-rock-star', 'CRS-Star F110', 'F110', 'Swim Out', 'Bloque F', 1, 2, 2, 107.27, 426299, 'USD', 'available', 0),
  ('cana-rock-star', 'CRS-Star F113', 'F113', 'Swim Out', 'Bloque F', 1, 2, 2, 142.4, 473399, 'USD', 'available', 0),
  ('cana-rock-star', 'CRS-Star F201', 'F201', 'Apartamentos;Esquinas', 'Bloque F', 2, 2, 2, 145.46, 466599, 'USD', 'available', 0),
  ('cana-rock-star', 'CRS-Star F301', 'F301', 'Apartamentos;Esquinas', 'Bloque F', 3, 2, 2, 156.47, 490399, 'USD', 'available', 0),
  ('cana-rock-star', 'CRS-Star F302', 'F302', 'Apartamentos', 'Bloque F', 3, 2, 2, 96.48, 315299, 'USD', 'available', 0),
  ('cana-rock-star', 'CRS-Star F308', 'F308', 'Apartamentos', 'Bloque F', 3, 2, 2, 96.72, 315299, 'USD', 'available', 0),
  ('cana-rock-star', 'CRS-Star F309', 'F309', 'Apartamentos', 'Bloque F', 3, 2, 2, 96.58, 315299, 'USD', 'available', 0),
  ('cana-rock-star', 'CRS-Star F310', 'F310', 'Apartamentos', 'Bloque F', 3, 2, 2, 96.58, 315299, 'USD', 'available', 0),
  ('cana-rock-star', 'CRS-Star F312', 'F312', 'Apartamentos', 'Bloque F', 3, 2, 2, 96.58, 315299, 'USD', 'available', 0),
  ('cana-rock-star', 'CRS-Star F313', 'F313', 'Apartamentos', 'Bloque F', 3, 2, 2, 156.47, 490399, 'USD', 'available', 0),
  ('cana-rock-star', 'CRS-Star F401', 'F401', 'Apartamentos;Esquinas', 'Bloque F', 4, 2, 2, 145.45, 501599, 'USD', 'available', 0),
  ('cana-rock-star', 'CRS-Star F404', 'F404', 'Apartamentos', 'Bloque F', 4, 2, 2, 93.13, 319599, 'USD', 'available', 0),
  ('cana-rock-star', 'CRS-Star F405', 'F405', 'Apartamentos', 'Bloque F', 4, 2, 2, 93.13, 319599, 'USD', 'available', 0),
  ('cana-rock-star', 'CRS-Star F406', 'F406', 'Apartamentos', 'Bloque F', 4, 2, 2, 93.13, 319599, 'USD', 'available', 0),
  ('cana-rock-star', 'CRS-Star F407', 'F407', 'Apartamentos', 'Bloque F', 4, 2, 2, 93.35, 319599, 'USD', 'available', 0),
  ('cana-rock-star', 'CRS-Star F409', 'F409', 'Apartamentos', 'Bloque F', 4, 2, 2, 93.22, 319599, 'USD', 'available', 0),
  ('cana-rock-star', 'CRS-Star F410', 'F410', 'Apartamentos', 'Bloque F', 4, 2, 2, 93.22, 319599, 'USD', 'available', 0),
  ('cana-rock-star', 'CRS-Star F411', 'F411', 'Apartamentos', 'Bloque F', 4, 2, 2, 93.22, 319599, 'USD', 'available', 0),
  ('cana-rock-star', 'CRS-Star F413', 'F413', 'Apartamentos', 'Bloque F', 4, 2, 2, 145.45, 501599, 'USD', 'available', 0),
  ('cana-rock-star', 'CRS-Star F502', 'F502', 'Penthouses', 'Bloque F', 5, 2, 2, 168.07, 406299, 'USD', 'available', 0),
  ('cana-rock-star', 'CRS-Star F503', 'F503', 'Penthouses', 'Bloque F', 5, 2, 2, 168.07, 406299, 'USD', 'available', 0),
  ('cana-rock-star', 'CRS-Star F505', 'F505', 'Penthouses', 'Bloque F', 5, 2, 2, 168.07, 406299, 'USD', 'available', 0),
  ('cana-rock-star', 'CRS-Star F508', 'F508', 'Penthouses', 'Bloque F', 5, 2, 2, 167.74, 406299, 'USD', 'available', 0),
  ('cana-rock-star', 'CRS-Star F509', 'F509', 'Penthouses', 'Bloque F', 5, 2, 2, 167.92, 406299, 'USD', 'available', 0),
  ('cana-rock-star', 'CRS-Star F510', 'F510', 'Penthouses', 'Bloque F', 5, 2, 2, 167.92, 406299, 'USD', 'available', 0),
  ('cana-rock-star', 'CRS-Star F512', 'F512', 'Penthouses', 'Bloque F', 5, 2, 2, 167.92, 406299, 'USD', 'available', 0),
  ('cana-rock-star', 'CRS-Star G501', 'G501', 'Penthouses;Esquinas', 'Bloque G', 5, 2, 2, 203.23, 416399, 'USD', 'available', 0),
  ('cana-rock-universe', 'CRU-Universe A201', 'A201', 'Apartamentos;Esquinas', 'Bloque A', 2, 1, 1, 79.46, 233570, 'USD', 'available', 1),
  ('cana-rock-universe', 'CRU-Universe A226', 'A226', 'Apartamentos;Esquinas', 'Bloque A', 2, 1, 1, 79.46, 233570, 'USD', 'available', 1),
  ('cana-rock-universe', 'CRU-Universe A301', 'A301', 'Apartamentos;Esquinas', 'Bloque A', 3, 1, 1, 79.46, 257695, 'USD', 'available', 1),
  ('cana-rock-universe', 'CRU-Universe A323', 'A323', 'Apartamentos', 'Bloque A', 3, 1, 1, 64.28, 207695, 'USD', 'available', 1),
  ('cana-rock-universe', 'CRU-Universe A425', 'A425', 'Apartamentos', 'Bloque A', 4, 1, 1, 64.28, 226230, 'USD', 'available', 1),
  ('cana-rock-universe', 'CRU-Universe A501', 'A501', 'Penthouses;Esquinas', 'Bloque A', 5, 1, 2, 130.22, 347850, 'USD', 'available', 1),
  ('cana-rock-universe', 'CRU-Universe A504', 'A504', 'Penthouses', 'Bloque A', 5, 1, 2, 103.11, 287225, 'USD', 'available', 1),
  ('cana-rock-universe', 'CRU-Universe A505', 'A505', 'Penthouses', 'Bloque A', 5, 1, 2, 103.11, 285890, 'USD', 'available', 1),
  ('cana-rock-universe', 'CRU-Universe A506', 'A506', 'Penthouses', 'Bloque A', 5, 1, 2, 105.77, 287225, 'USD', 'available', 1),
  ('cana-rock-universe', 'CRU-Universe A521', 'A521', 'Penthouses', 'Bloque A', 5, 1, 2, 106.43, 287225, 'USD', 'available', 1),
  ('cana-rock-universe', 'CRU-Universe A522', 'A522', 'Penthouses', 'Bloque A', 5, 1, 2, 103.71, 287225, 'USD', 'available', 1),
  ('cana-rock-universe', 'CRU-Universe B340', 'B340', 'Apartamentos', 'Bloque B', 3, 1, 1, 53.99, 189360, 'USD', 'available', 1),
  ('cana-rock-galaxy', 'CRG-Galaxy A215', 'A215', 'Apartamentos', 'Bloque A', 2, 2, 2, 122.27, 439299, 'USD', 'available', 1),
  ('cana-rock-galaxy', 'CRG-Galaxy A315', 'A315', 'Apartamentos', 'Bloque A', 3, 2, 2, 128.62, 553499, 'USD', 'available', 1),
  ('cana-rock-galaxy', 'CRG-Galaxy A401', 'A401', 'Apartamentos;Esquinas', 'Bloque A', 4, 2, 2, 172.7, 646799, 'USD', 'available', 1),
  ('cana-rock-galaxy', 'CRG-Galaxy B118', 'B118', 'Swim Out', 'Bloque B', 1, 2, 2, 129.8, 439399, 'USD', 'available', 1),
  ('cana-rock-galaxy', 'CRG-Galaxy B121', 'B121', 'Swim Out', 'Bloque B', 1, 2, 2, 128.6, 439399, 'USD', 'available', 1),
  ('cana-rock-galaxy', 'CRG-Galaxy B230', 'B230', 'Apartamentos;Esquinas', 'Bloque B', 2, 2, 2, 147.27, 590299, 'USD', 'available', 1),
  ('cana-rock-galaxy', 'CRG-Galaxy B238', 'B238', 'Apartamentos', 'Bloque B', 2, 2, 2, 107, 412299, 'USD', 'available', 1),
  ('cana-rock-galaxy', 'CRG-Galaxy B330', 'B330', 'Apartamentos;Esquinas', 'Bloque B', 3, 2, 2, 162.72, 652030, 'USD', 'available', 1),
  ('cana-rock-galaxy', 'CRG-Galaxy B416', 'B416', 'Apartamentos;Esquinas', 'Bloque B', 4, 2, 2, 162.72, 694399, 'USD', 'available', 1),
  ('cana-rock-galaxy', 'CRG-Galaxy B430', 'B430', 'Apartamentos;Esquinas', 'Bloque B', 4, 2, 2, 167.62, 694399, 'USD', 'available', 1),
  ('cana-rock-galaxy', 'CRG-Galaxy B517', 'B517', 'Penthouses', 'Bloque B', 5, 2, 2, 210.27, 285890, 'USD', 'available', 1),
  ('cana-rock-galaxy', 'CRG-Galaxy B518', 'B518', 'Penthouses', 'Bloque B', 5, 2, 2, 202.73, 585699, 'USD', 'available', 1),
  ('cana-rock-galaxy', 'CRG-Galaxy B519', 'B519', 'Penthouses', 'Bloque B', 5, 2, 2, 202.73, 585699, 'USD', 'available', 1),
  ('cana-rock-galaxy', 'CRG-Galaxy B520', 'B520', 'Penthouses', 'Bloque B', 5, 2, 2, 202.73, 585699, 'USD', 'available', 1),
  ('cana-rock-galaxy', 'CRG-Galaxy B523', 'B523', 'Penthouses', 'Bloque B', 5, 2, 2, 260.47, 743399, 'USD', 'available', 1),
  ('cana-rock-galaxy', 'CRG-Galaxy B526', 'B526', 'Penthouses', 'Bloque B', 5, 2, 2, 202.73, 585699, 'USD', 'available', 1),
  ('cana-rock-galaxy', 'CRG-Galaxy B527', 'B527', 'Penthouses', 'Bloque B', 5, 2, 2, 202.73, 585699, 'USD', 'available', 1),
  ('cana-rock-stelar', 'CRC-Cosmos A504', 'A504', 'Penthouses', 'Bloque A', 5, 1, 2, 91.25, 301199, 'USD', 'available', 1),
  ('cana-rock-stelar', 'CRC-Cosmos A505', 'A505', 'Penthouses', 'Bloque A', 5, 1, 2, 91.25, 301199, 'USD', 'available', 1),
  ('cana-rock-stelar', 'CRC-Cosmos A506', 'A506', 'Penthouses', 'Bloque A', 5, 1, 2, 91.25, 301199, 'USD', 'available', 1),
  ('cana-rock-stelar', 'CRC-Cosmos A508', 'A508', 'Penthouses', 'Bloque A', 5, 1, 2, 91.25, 301199, 'USD', 'available', 1),
  ('cana-rock-stelar', 'CRC-Cosmos A509', 'A509', 'Penthouses', 'Bloque A', 5, 1, 2, 91.25, 301199, 'USD', 'available', 1),
  ('cana-rock-stelar', 'CRC-Cosmos A512', 'A512', 'Penthouses', 'Bloque A', 5, 1, 2, 91.25, 301199, 'USD', 'available', 1),
  ('cana-rock-stelar', 'CRC-Cosmos A513', 'A513', 'Penthouses', 'Bloque A', 5, 1, 2, 91.25, 301199, 'USD', 'available', 1),
  ('cana-rock-stelar', 'CRC-Cosmos A514', 'A514', 'Penthouses', 'Bloque A', 5, 1, 2, 91.25, 301199, 'USD', 'available', 1),
  ('cana-rock-stelar', 'CRC-Cosmos A515', 'A515', 'Penthouses', 'Bloque A', 5, 1, 2, 91.25, 301199, 'USD', 'available', 1),
  ('cana-rock-stelar', 'CRC-Cosmos A516', 'A516', 'Penthouses', 'Bloque A', 5, 1, 2, 91.25, 301199, 'USD', 'available', 1),
  ('cana-rock-stelar', 'CRC-Cosmos B504', 'B504', 'Penthouses', 'Bloque B', 5, 1, 2, 91.25, 301199, 'USD', 'available', 0),
  ('cana-rock-stelar', 'CRC-Cosmos B505', 'B505', 'Penthouses', 'Bloque B', 5, 1, 2, 78.75, 260099, 'USD', 'available', 0),
  ('cana-rock-stelar', 'CRC-Cosmos B506', 'B506', 'Penthouses', 'Bloque B', 5, 1, 2, 91.25, 301199, 'USD', 'available', 0),
  ('cana-rock-stelar', 'CRC-Cosmos B508', 'B508', 'Penthouses', 'Bloque B', 5, 1, 2, 91.25, 301199, 'USD', 'available', 1),
  ('cana-rock-stelar', 'CRC-Cosmos B509', 'B509', 'Penthouses', 'Bloque B', 5, 1, 2, 91.25, 301199, 'USD', 'available', 1),
  ('cana-rock-stelar', 'CRC-Cosmos B510', 'B510', 'Penthouses', 'Bloque B', 5, 1, 2, 91.25, 301199, 'USD', 'available', 1),
  ('cana-rock-stelar', 'CRC-Cosmos B511', 'B511', 'Penthouses', 'Bloque B', 5, 1, 2, 91.25, 301199, 'USD', 'available', 1),
  ('cana-rock-stelar', 'CRC-Cosmos B512', 'B512', 'Penthouses', 'Bloque B', 5, 1, 2, 91.25, 301199, 'USD', 'available', 1),
  ('cana-rock-stelar', 'CRC-Cosmos B513', 'B513', 'Penthouses', 'Bloque B', 5, 1, 2, 91.25, 301199, 'USD', 'available', 1),
  ('cana-rock-stelar', 'CRC-Cosmos B515', 'B515', 'Penthouses', 'Bloque B', 5, 1, 2, 91.25, 301199, 'USD', 'available', 1),
  ('cana-rock-stelar', 'CRC-Cosmos B516', 'B516', 'Penthouses', 'Bloque B', 5, 1, 2, 91.25, 301199, 'USD', 'available', 1),
  ('cana-rock-stelar', 'CRC-Stelar C505', 'C505', 'Penthouses', 'Bloque C', 5, 1, 2, 91.27, 301199, 'USD', 'available', 1),
  ('cana-rock-stelar', 'CRC-Stelar C507', 'C507', 'Penthouses', 'Bloque C', 5, 1, 2, 91.27, 301199, 'USD', 'available', 1),
  ('cana-rock-stelar', 'CRC-Stelar C508', 'C508', 'Penthouses', 'Bloque C', 5, 1, 2, 91.27, 301199, 'USD', 'available', 1),
  ('cana-rock-stelar', 'CRC-Stelar C509', 'C509', 'Penthouses', 'Bloque C', 5, 1, 2, 91.27, 301199, 'USD', 'available', 1),
  ('cana-rock-stelar', 'CRC-Stelar C510', 'C510', 'Penthouses', 'Bloque C', 5, 1, 2, 91.27, 301199, 'USD', 'available', 1),
  ('cana-rock-stelar', 'CRC-Stelar C511', 'C511', 'Penthouses', 'Bloque C', 5, 1, 2, 91.27, 301199, 'USD', 'available', 1),
  ('cana-rock-stelar', 'CRC-Stelar C512', 'C512', 'Penthouses', 'Bloque C', 5, 1, 2, 91.27, 301199, 'USD', 'available', 1),
  ('cana-rock-stelar', 'CRC-Stelar C522', 'C522', 'Penthouses', 'Bloque C', 5, 1, 2, 91.27, 301199, 'USD', 'available', 1),
  ('cana-rock-stelar', 'CRC-Stelar C523', 'C523', 'Penthouses', 'Bloque C', 5, 1, 2, 91.27, 301199, 'USD', 'available', 1),
  ('cana-rock-stelar', 'CRC-Stelar C525', 'C525', 'Penthouses', 'Bloque C', 5, 1, 2, 91.27, 301199, 'USD', 'available', 1),
  ('cana-rock-stelar', 'CRC-Stelar C526', 'C526', 'Penthouses', 'Bloque C', 5, 1, 2, 91.27, 301199, 'USD', 'available', 1),
  ('cana-rock-stelar', 'CRC-Stelar C527', 'C527', 'Penthouses', 'Bloque C', 5, 1, 2, 91.27, 301199, 'USD', 'available', 1),
  ('cana-rock-stelar', 'CRC-Stelar C528', 'C528', 'Penthouses', 'Bloque C', 5, 1, 2, 91.27, 301199, 'USD', 'available', 1),
  ('cana-rock-stelar', 'CRC-Stelar C529', 'C529', 'Penthouses', 'Bloque C', 5, 1, 2, 91.27, 301199, 'USD', 'available', 1),
  ('cana-rock-stelar', 'CRC-Stelar C530', 'C530', 'Penthouses', 'Bloque C', 5, 1, 2, 91.27, 301199, 'USD', 'available', 1),
  ('cana-rock-stelar', 'CRC-Stelar C531', 'C531', 'Penthouses', 'Bloque C', 5, 1, 2, 91.27, 301199, 'USD', 'available', 1),
  ('cana-rock-stelar', 'CRC-Stelar C532', 'C532', 'Penthouses', 'Bloque C', 5, 1, 2, 91.27, 301199, 'USD', 'available', 1),
  ('cana-rock-stelar', 'CRC-Stelar C533', 'C533', 'Penthouses', 'Bloque C', 5, 1, 2, 91.27, 301199, 'USD', 'available', 1),
  ('cana-rock-stelar', 'CRC-Stelar C535', 'C535', 'Penthouses', 'Bloque C', 5, 1, 2, 91.27, 301199, 'USD', 'available', 1),
  ('cana-rock-stelar', 'CRC-Stelar C536', 'C536', 'Penthouses', 'Bloque C', 5, 1, 2, 91.27, 301199, 'USD', 'available', 1),
  ('cana-rock-stelar', 'CRC-Stelar C537', 'C537', 'Penthouses', 'Bloque C', 5, 1, 2, 91.27, 301199, 'USD', 'available', 1),
  ('cana-rock-stelar', 'CRC-Stelar C538', 'C538', 'Penthouses', 'Bloque C', 5, 1, 2, 91.27, 301199, 'USD', 'available', 1);

insert into public.typologies (
  organization_id, project_id, name, bedrooms, bathrooms, total_sqm
)
select distinct on (candidate.project_id, candidate.name)
  candidate.organization_id,
  candidate.project_id,
  candidate.name,
  candidate.bedrooms,
  candidate.bathrooms,
  candidate.area_sqm
from (
  select
    p.organization_id,
    p.id as project_id,
    source.typology || ' · ' || trim(to_char(source.area_sqm, 'FM999999990.##')) || ' m²' as name,
    source.bedrooms,
    source.bathrooms,
    source.area_sqm
  from seed_cana_rock_units source
  join public.projects p on p.slug = source.project_slug
  where source.area_sqm > 0
) candidate
order by candidate.project_id, candidate.name, candidate.bedrooms desc, candidate.bathrooms desc
on conflict (project_id, name) do update
set bedrooms = excluded.bedrooms,
    bathrooms = excluded.bathrooms,
    total_sqm = excluded.total_sqm,
    updated_at = now();

insert into public.units (
  organization_id, project_id, typology_id, unit_code, tower, floor_level,
  list_price, currency, status, is_public, notes
)
select
  p.organization_id,
  p.id,
  typology.id,
  source.unit_code,
  source.tower,
  source.floor_level,
  source.list_price,
  source.currency,
  source.status,
  true,
  jsonb_strip_nulls(jsonb_build_object(
    'external_id', source.external_id,
    'parking', source.parking_spaces
  ))::text
from seed_cana_rock_units source
join public.projects p on p.slug = source.project_slug
left join public.typologies typology
  on typology.project_id = p.id
  and typology.name = source.typology || ' · ' || trim(to_char(source.area_sqm, 'FM999999990.##')) || ' m²'
on conflict (project_id, unit_code) do update
set typology_id = excluded.typology_id,
    tower = excluded.tower,
    floor_level = excluded.floor_level,
    list_price = excluded.list_price,
    currency = excluded.currency,
    status = excluded.status,
    is_public = excluded.is_public,
    notes = excluded.notes,
    updated_at = now();

insert into public.external_unit_mappings (
  connection_id, project_id, unit_id, external_unit_id, external_unit_code,
  is_active, last_seen_at
)
select
  connection.id,
  p.id,
  unit.id,
  source.external_id,
  source.unit_code,
  true,
  now()
from seed_cana_rock_units source
join public.projects p on p.slug = source.project_slug
join public.integration_connections connection
  on connection.project_id = p.id
  and connection.provider = 'cana_rock_portal'
  and connection.external_project_id = p.slug
join public.units unit
  on unit.project_id = p.id
  and unit.unit_code = source.unit_code
on conflict (connection_id, external_unit_id) do update
set project_id = excluded.project_id,
    unit_id = excluded.unit_id,
    external_unit_code = excluded.external_unit_code,
    is_active = true,
    last_seen_at = now(),
    updated_at = now();

update public.projects p
set inventory_available_declared = source.available_count,
    inventory_updated_at = now(),
    updated_at = now()
from (
  select project_slug, count(*) filter (where status = 'available')::integer as available_count
  from seed_cana_rock_units
  group by project_slug
) source
where p.slug = source.project_slug;
