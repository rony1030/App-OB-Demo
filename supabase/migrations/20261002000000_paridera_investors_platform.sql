-- Paridera Investors SRL portfolio onboarding (Bonita Beach & Bonita Golf, Cap Cana).
-- Same structure as the Cana Rock onboarding: developer + master broker
-- organizations, brand profile, the five projects, highlights, responsibilities
-- and payment plans. Units are loaded by the inventory migration generated with
-- scripts/paridera/import-availability.py --sql.
-- Idempotent by organization/project natural keys; safe to re-run.
--
-- Figures come from the developer's brochures, "Planes de pago", "Hoja de
-- reserva", Bonita Golf's FAQ and the availability PDFs dated 01.10.2026.
-- Delivery dates are managed from the CRM project settings: they start null and
-- this migration never overwrites them. Plan discounts are deliberately omitted
-- (they are used in negotiations, not published).

insert into public.organizations (slug, name, kind, status)
values
  ('paridera-osvaldo-bello', 'Paridera / Osvaldo Bello', 'master_broker', 'active'),
  ('paridera-investors', 'Paridera Investors SRL', 'developer', 'active')
on conflict (slug) do update
set name = excluded.name,
    kind = excluded.kind,
    status = excluded.status,
    updated_at = now();

insert into public.brand_profiles (
  organization_id, name, is_default, primary_color, secondary_color, accent_color, surface_color
)
select id, 'Bonita Beach', true, '#0A2A3B', '#004F73', '#F5C85B', '#FFFFFF'
from public.organizations
where slug = 'paridera-osvaldo-bello'
on conflict (organization_id, name) do update
set primary_color = excluded.primary_color,
    secondary_color = excluded.secondary_color,
    accent_color = excluded.accent_color,
    surface_color = excluded.surface_color,
    is_default = true,
    updated_at = now();

-- Sub-broker commission is 5% + ITBIS (internal: never shown on public pages).
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
  '{"source":"paridera-migration","scope":"commercial_management","sub_broker_commission_pct":5,"commission_plus_itbis":true}'::jsonb
from public.organizations master_broker
cross join public.organizations developer
where master_broker.slug = 'paridera-osvaldo-bello'
  and developer.slug = 'paridera-investors'
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
  commission_rate,
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
  'Campo de Golf Las Iguanas, Cap Cana, República Dominicana',
  'Cap Cana',
  source.lifecycle_status,
  'published',
  source.delivery_date,
  source.description,
  source.short_description,
  source.starting_price,
  'USD',
  5,
  true,
  source.inventory_total,
  source.inventory_available,
  true,
  '2026-10-01'::timestamptz,
  now()
from (
  values
    (
      'sunrise-bonita-beach',
      'Sunrise Fase 1 — Bonita Beach',
      'pre_construction',
      null::date,
      'Primer edificio de Bonita Beach Residences, diseñado por GVA Arquitectura y dirigido por TLDI sobre el campo de golf Las Iguanas. Ocho niveles de residencias de 1 a 4 habitaciones con terraza, frente a una playa privada de 15,000 m², con rooftop & lounge 360° en la novena planta, gym 360, wellness spa y beach club.',
      'Ocho niveles frente a la playa privada y el campo de golf Las Iguanas.',
      456000::numeric,
      282,
      25
    ),
    (
      'sunset-bonita-beach',
      'Sunset Fase 2 — Bonita Beach',
      'pre_construction',
      null::date,
      'Segunda fase de Bonita Beach Residences: residencias de 1 y 2 habitaciones con terraza frente a la playa Crystal Lagoons y el campo de golf Las Iguanas, con acceso al rooftop, gym, spa y beach club del complejo.',
      'Segunda fase de Bonita Beach frente a la playa Crystal Lagoons.',
      356000::numeric,
      127,
      23
    ),
    (
      'beach-bonita-beach',
      'Beach Fase 3 — Bonita Beach',
      'pre_construction',
      null::date,
      'Tercera fase de Bonita Beach Residences, frente a la Crystal Lagoon, con lobby, restaurante y palapa de playa propios. Residencias de 1 y 2 habitaciones con terraza.',
      'Tercera fase de Bonita Beach, con lobby, restaurante y palapa.',
      370000::numeric,
      156,
      74
    ),
    (
      'villas-bonita-beach',
      'Villas Bonita Beach',
      'pre_construction',
      null::date,
      'Diecinueve villas de dos niveles sobre vía privada con buffer verde de paisajismo, con piscina propia, terraza techada, estudio y vista al campo de golf o a la playa. Villa de 4 habitaciones + family y opción premium de 5 habitaciones + family.',
      'Diecinueve villas con piscina privada sobre vía privada.',
      1970000::numeric,
      19,
      1
    ),
    (
      'bonita-golf',
      'Bonita Golf Residences',
      'under_construction',
      null::date,
      'Apartamentos de lujo diseñados por GVA en el campo de golf Las Iguanas, a pocos pasos de Playa Juanillo. Residencias de 1 a 4 habitaciones con terraza, dos piscinas de adultos, coworking, pádel, gym, parqueo soterrado y beneficios de propietario en Cap Cana.',
      'Apartamentos de lujo en el campo de golf Las Iguanas.',
      625000::numeric,
      159,
      10
    )
) as source(
  slug, name, lifecycle_status, delivery_date, description, short_description,
  starting_price, inventory_total, inventory_available
)
cross join public.organizations master_broker
cross join public.organizations developer
left join public.brand_profiles brand
  on brand.organization_id = master_broker.id and brand.name = 'Bonita Beach'
where master_broker.slug = 'paridera-osvaldo-bello'
  and developer.slug = 'paridera-investors'
on conflict (organization_id, slug) do update
set developer_organization_id = excluded.developer_organization_id,
    brand_profile_id = excluded.brand_profile_id,
    name = excluded.name,
    location = excluded.location,
    zone = excluded.zone,
    lifecycle_status = excluded.lifecycle_status,
    publication_status = excluded.publication_status,
    description = excluded.description,
    short_description = excluded.short_description,
    starting_price = excluded.starting_price,
    currency = excluded.currency,
    commission_rate = excluded.commission_rate,
    master_broker_exclusive = excluded.master_broker_exclusive,
    inventory_total_declared = excluded.inventory_total_declared,
    inventory_available_declared = excluded.inventory_available_declared,
    inventory_is_complete = excluded.inventory_is_complete,
    inventory_updated_at = excluded.inventory_updated_at,
    published_at = coalesce(public.projects.published_at, excluded.published_at),
    updated_at = now();

insert into public.project_highlights (project_id, content, sort_order)
select p.id, source.content, source.sort_order
from public.projects p
join (
  values
    ('sunrise-bonita-beach', 'Playa privada artificial de 15,000 m²', 0),
    ('sunrise-bonita-beach', 'Rooftop & Lounge 360° en la novena planta', 1),
    ('sunrise-bonita-beach', 'Diseño de GVA Arquitectura, dirección de TLDI', 2),
    ('sunrise-bonita-beach', 'Gestión integral de alquileres', 3),
    ('sunset-bonita-beach', 'Frente a la playa Crystal Lagoons', 0),
    ('sunset-bonita-beach', 'Rooftop 360°, gym y wellness spa', 1),
    ('sunset-bonita-beach', 'Gestión integral de alquileres', 2),
    ('beach-bonita-beach', 'Frente a la Crystal Lagoon', 0),
    ('beach-bonita-beach', 'Lobby, restaurante y palapa de playa', 1),
    ('beach-bonita-beach', 'Gestión integral de alquileres', 2),
    ('villas-bonita-beach', 'Piscina privada en cada villa', 0),
    ('villas-bonita-beach', 'Vía privada con paisajismo', 1),
    ('villas-bonita-beach', 'Vista al campo de golf o a la playa', 2),
    ('bonita-golf', 'Dos piscinas de adultos y coworking', 0),
    ('bonita-golf', 'Parqueo soterrado bajo vigilancia', 1),
    ('bonita-golf', 'Beneficios de propietario en Cap Cana', 2)
) as source(project_slug, content, sort_order) on source.project_slug = p.slug
join public.organizations owner on owner.id = p.organization_id and owner.slug = 'paridera-osvaldo-bello'
on conflict (project_id, sort_order) do update
set content = excluded.content;

insert into public.project_responsibilities (
  project_id, responsible_organization_id, responsibility, is_primary, notes
)
select p.id, p.organization_id, 'commercial.master_broker', true,
       'Master broker comercial de los proyectos Paridera.'
from public.projects p
join public.organizations owner on owner.id = p.organization_id and owner.slug = 'paridera-osvaldo-bello'
where not exists (
  select 1 from public.project_responsibilities r
  where r.project_id = p.id
    and r.responsible_organization_id = p.organization_id
    and r.responsibility = 'commercial.master_broker'
);

insert into public.project_responsibilities (
  project_id, responsible_organization_id, responsibility, is_primary, notes
)
select p.id, p.developer_organization_id, 'development.owner', true,
       'Paridera Investors SRL es el desarrollador titular.'
from public.projects p
join public.organizations owner on owner.id = p.organization_id and owner.slug = 'paridera-osvaldo-bello'
where p.developer_organization_id is not null
  and not exists (
    select 1 from public.project_responsibilities r
    where r.project_id = p.id
      and r.responsible_organization_id = p.developer_organization_id
      and r.responsibility = 'development.owner'
  );

-- Payment plans ("13. PLANES DE PAGO" of each phase). Bonita Beach phases share
-- three plans; Bonita Golf has two. The reservation (US$15,000 for Villas,
-- US$5,000 for the rest) is the first step of every plan.
insert into public.payment_plans (organization_id, project_id, name, currency, is_active, valid_from)
select p.organization_id, p.id, source.plan_name, 'USD', true, '2026-10-01'::date
from public.projects p
join public.organizations owner on owner.id = p.organization_id and owner.slug = 'paridera-osvaldo-bello'
join (
  values
    ('bonita-beach', 'Plan 1 · 80/20'),
    ('bonita-beach', 'Plan 2 · 50/30/20'),
    ('bonita-beach', 'Plan 3 · 30/40/30'),
    ('bonita-golf', 'Plan 1 · 80/20'),
    ('bonita-golf', 'Plan 2 · 30/40/30')
) as source(plan_family, plan_name)
  on source.plan_family = case when p.slug = 'bonita-golf' then 'bonita-golf' else 'bonita-beach' end
on conflict (project_id, name) do update
set is_active = true,
    updated_at = now();

insert into public.payment_plan_steps (payment_plan_id, label, percentage, fixed_amount, milestone, sort_order)
select plan.id, step.label, step.percentage, null::numeric, step.milestone, step.sort_order
from public.payment_plans plan
join public.projects p on p.id = plan.project_id
join public.organizations owner on owner.id = p.organization_id and owner.slug = 'paridera-osvaldo-bello'
join (
  values
    ('bonita-beach', 'Plan 1 · 80/20', 'Inicial', 80::numeric, 'A la firma', 1),
    ('bonita-beach', 'Plan 1 · 80/20', 'Contra entrega', 20::numeric, 'A la entrega de la unidad', 2),
    ('bonita-beach', 'Plan 2 · 50/30/20', 'Inicial', 50::numeric, 'A la firma', 1),
    ('bonita-beach', 'Plan 2 · 50/30/20', 'Durante construcción', 30::numeric, 'Cuotas mensuales, trimestrales o semestrales hasta la entrega', 2),
    ('bonita-beach', 'Plan 2 · 50/30/20', 'Contra entrega', 20::numeric, 'A la entrega de la unidad', 3),
    ('bonita-beach', 'Plan 3 · 30/40/30', 'Inicial', 30::numeric, 'A la firma', 1),
    ('bonita-beach', 'Plan 3 · 30/40/30', 'Durante construcción', 40::numeric, 'Cuotas mensuales, trimestrales o semestrales hasta la entrega', 2),
    ('bonita-beach', 'Plan 3 · 30/40/30', 'Contra entrega', 30::numeric, 'A la entrega de la unidad', 3),
    ('bonita-golf', 'Plan 1 · 80/20', 'Inicial', 80::numeric, 'A la firma', 1),
    ('bonita-golf', 'Plan 1 · 80/20', 'Contra entrega', 20::numeric, 'A la entrega de la unidad', 2),
    ('bonita-golf', 'Plan 2 · 30/40/30', 'Inicial', 30::numeric, 'A la firma', 1),
    ('bonita-golf', 'Plan 2 · 30/40/30', 'Durante construcción', 40::numeric, 'Cuotas mensuales, trimestrales o semestrales hasta la entrega', 2),
    ('bonita-golf', 'Plan 2 · 30/40/30', 'Contra entrega', 30::numeric, 'A la entrega de la unidad', 3)
) as step(plan_family, plan_name, label, percentage, milestone, sort_order)
  on step.plan_name = plan.name
 and step.plan_family = case when p.slug = 'bonita-golf' then 'bonita-golf' else 'bonita-beach' end
on conflict (payment_plan_id, sort_order) do update
set label = excluded.label,
    percentage = excluded.percentage,
    fixed_amount = excluded.fixed_amount,
    milestone = excluded.milestone;

insert into public.payment_plan_steps (payment_plan_id, label, percentage, fixed_amount, milestone, sort_order)
select plan.id, 'Reserva', null, case when p.slug = 'villas-bonita-beach' then 15000 else 5000 end,
       'No reembolsable', 0
from public.payment_plans plan
join public.projects p on p.id = plan.project_id
join public.organizations owner on owner.id = p.organization_id and owner.slug = 'paridera-osvaldo-bello'
on conflict (payment_plan_id, sort_order) do update
set label = excluded.label,
    percentage = excluded.percentage,
    fixed_amount = excluded.fixed_amount,
    milestone = excluded.milestone;
