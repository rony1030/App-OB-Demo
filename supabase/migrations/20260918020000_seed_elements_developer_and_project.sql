-- Seed Elements Developer, Project Elements, Eco Suite Typology, 12 Units, Payment Plans, and Osvaldo Bello responsible assignment.
-- Idempotent and safe to run multiple times.

do $$
declare
  v_bello_id bigint;
  v_developer_id bigint;
  v_brand_id bigint;
  v_project_id bigint;
  v_typology_id bigint;
  v_plan_a_id bigint;
  v_plan_b_id bigint;
  v_osvaldo_user_id uuid;
  v_osvaldo_membership_id bigint;
begin
  -- 1. Master Broker Organization (Bello Valdez Enterprise)
  select id into v_bello_id
  from public.organizations
  where slug in ('bello-valdez-enterprise', 'ob-brokers-team')
  order by case when slug = 'bello-valdez-enterprise' then 1 else 2 end
  limit 1;

  if v_bello_id is null then
    select id into v_bello_id from public.organizations where kind = 'master_broker' order by id limit 1;
  end if;

  -- 2. Developer Organization: Elements Developer
  insert into public.organizations (slug, name, kind, status, legal_name, contact_email, contact_phone)
  values (
    'elements-developer',
    'Elements Developer',
    'developer',
    'active',
    'ELEMENTS RESIDENCES & RESORT, SRL',
    'ventas@elements.com.do',
    '+1 849 451 6083'
  )
  on conflict (slug) do update
  set name = excluded.name,
      kind = excluded.kind,
      status = excluded.status,
      legal_name = excluded.legal_name,
      contact_email = excluded.contact_email,
      contact_phone = excluded.contact_phone,
      updated_at = now()
  returning id into v_developer_id;

  -- 3. Developer Brand Profile
  insert into public.brand_profiles (
    organization_id, name, is_default, primary_color, secondary_color, accent_color, surface_color, logo_path
  )
  values (
    v_developer_id,
    'Elements',
    true,
    '#1A2530',
    '#2C3E50',
    '#C5A880',
    '#F8FAFC',
    '/images/projects/elements/logo-horizontal.png'
  )
  on conflict (organization_id, name) do update
  set primary_color = excluded.primary_color,
      secondary_color = excluded.secondary_color,
      accent_color = excluded.accent_color,
      surface_color = excluded.surface_color,
      logo_path = excluded.logo_path,
      is_default = true,
      updated_at = now()
  returning id into v_brand_id;

  -- 4. Organization Relationship
  if v_bello_id is not null then
    insert into public.organization_relationships (
      source_organization_id, target_organization_id, relationship_type, status, starts_at, metadata
    )
    values (
      v_bello_id,
      v_developer_id,
      'master_broker_for',
      'active',
      now(),
      '{"scope":"commercial_exclusive","developer":"Elements Developer"}'::jsonb
    )
    on conflict (source_organization_id, target_organization_id, relationship_type) do update
    set status = excluded.status,
        metadata = excluded.metadata,
        updated_at = now();
  end if;

  -- 5. Project: Elements Residences & Resort
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
  values (
    coalesce(v_bello_id, v_developer_id),
    v_developer_id,
    v_brand_id,
    'elements',
    'Elements Residences & Resort',
    'Nisibón, La Altagracia',
    'Nisibón',
    'pre_construction',
    'published',
    '2027-12-01'::date,
    'Elements Residences & Resort es un exclusivo santuario residencial boutique en Nisibón, La Altagracia. Una propuesta de arquitectura biofílica contemporánea que conecta el lujo orgánico con el entorno natural del Caribe virgen. Diseñado para quienes buscan serenidad, sustentabilidad y alto rendimiento inmobiliario.',
    'Santuario residencial boutique de arquitectura biofílica en Nisibón, La Altagracia.',
    95000,
    'USD',
    true,
    12,
    12,
    true,
    now(),
    now()
  )
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
      inventory_updated_at = now(),
      published_at = coalesce(public.projects.published_at, excluded.published_at),
      updated_at = now()
  returning id into v_project_id;

  -- 6. Project Responsibilities & Exclusive Commercial Access for Osvaldo Bello
  select id into v_osvaldo_user_id
  from auth.users
  where lower(email) in ('info@osvaldobello.com', 'osvaldo@obbrokers.com')
  limit 1;

  if v_osvaldo_user_id is not null and v_bello_id is not null then
    select id into v_osvaldo_membership_id
    from public.memberships
    where user_id = v_osvaldo_user_id
      and organization_id = v_bello_id
    order by case when status = 'active' then 1 else 2 end, id asc
    limit 1;
  end if;

  -- Responsibility: Developer
  if not exists (
    select 1 from public.project_responsibilities
    where project_id = v_project_id and responsible_organization_id = v_developer_id and responsibility = 'development.owner'
  ) then
    insert into public.project_responsibilities (
      project_id, responsible_organization_id, responsibility, is_primary, notes
    ) values (
      v_project_id, v_developer_id, 'development.owner', true, 'Desarrollador titular del proyecto Elements'
    );
  end if;

  -- Responsibility: Master Broker
  if v_bello_id is not null and not exists (
    select 1 from public.project_responsibilities
    where project_id = v_project_id and responsible_organization_id = v_bello_id and responsibility = 'commercial.master_broker'
  ) then
    insert into public.project_responsibilities (
      project_id, responsible_organization_id, responsibility, is_primary, notes
    ) values (
      v_project_id, v_bello_id, 'commercial.master_broker', true, 'Master Broker comercializador principal'
    );
  end if;

  -- Responsibility & Access: Osvaldo Bello exclusive
  if v_osvaldo_membership_id is not null then
    if not exists (
      select 1 from public.project_responsibilities
      where project_id = v_project_id and responsible_membership_id = v_osvaldo_membership_id and responsibility = 'commercial.lead_agent'
    ) then
      insert into public.project_responsibilities (
        project_id, responsible_membership_id, responsibility, is_primary, notes
      ) values (
        v_project_id, v_osvaldo_membership_id, 'commercial.lead_agent', true, 'Responsable comercial exclusivo: Osvaldo Bello (+1 849 451 6083 / info@osvaldobello.com)'
      );
    end if;

    if not exists (
      select 1 from public.project_access
      where project_id = v_project_id and grantee_membership_id = v_osvaldo_membership_id
    ) then
      insert into public.project_access (
        organization_id, project_id, grantee_membership_id, access_level
      ) values (
        coalesce(v_bello_id, v_developer_id), v_project_id, v_osvaldo_membership_id, 'manage'
      );
    else
      update public.project_access
      set access_level = 'manage'
      where project_id = v_project_id and grantee_membership_id = v_osvaldo_membership_id;
    end if;
  end if;

  -- 7. Media
  insert into public.project_media (organization_id, project_id, kind, storage_bucket, storage_path, alt_text, sort_order)
  values
    (coalesce(v_bello_id, v_developer_id), v_project_id, 'hero', 'local', '/images/projects/elements/exterior.jpg', 'Elements Residences & Resort Fachada Principal', 0),
    (coalesce(v_bello_id, v_developer_id), v_project_id, 'gallery', 'local', '/images/projects/elements/ext-2.jpg', 'Exterior y Entorno Natural Biofílico', 1),
    (coalesce(v_bello_id, v_developer_id), v_project_id, 'gallery', 'local', '/images/projects/elements/elements-3.jpg', 'Terraza y Piscina Privada', 2),
    (coalesce(v_bello_id, v_developer_id), v_project_id, 'gallery', 'local', '/images/projects/elements/elements-5.jpg', 'Vista Aérea del Complejo', 3),
    (coalesce(v_bello_id, v_developer_id), v_project_id, 'gallery', 'local', '/images/projects/elements/sala-comedor.jpg', 'Interior Sala y Comedor Integrados', 4),
    (coalesce(v_bello_id, v_developer_id), v_project_id, 'gallery', 'local', '/images/projects/elements/hab-2.jpg', 'Suite Principal de Lujo Biofílico', 5),
    (coalesce(v_bello_id, v_developer_id), v_project_id, 'gallery', 'local', '/images/projects/elements/bano-2.jpg', 'Baño Estilo Spa con Luz Cenital', 6),
    (coalesce(v_bello_id, v_developer_id), v_project_id, 'gallery', 'local', '/images/projects/elements/garita.jpg', 'Entrada Principal y Garita de Seguridad', 7),
    (coalesce(v_bello_id, v_developer_id), v_project_id, 'gallery', 'local', '/images/projects/elements/master-plan-3d.jpg', 'Master Plan 3D Elements', 8),
    (coalesce(v_bello_id, v_developer_id), v_project_id, 'gallery', 'local', '/images/projects/elements/master-plan-2d.jpg', 'Master Plan 2D y Distribución de Solares', 9),
    (coalesce(v_bello_id, v_developer_id), v_project_id, 'gallery', 'local', '/images/projects/elements/plano-tipologia-3d.jpg', 'Plano Isométrico 3D Eco Suite', 10)
  on conflict (storage_bucket, storage_path) do update
  set project_id = excluded.project_id,
      kind = excluded.kind,
      alt_text = excluded.alt_text,
      sort_order = excluded.sort_order;

  -- 8. Highlights
  delete from public.project_highlights where project_id = v_project_id;
  insert into public.project_highlights (project_id, content, sort_order)
  values
    (v_project_id, 'Arquitectura biofílica contemporánea y diseño ecológico de bajo impacto', 0),
    (v_project_id, 'Santuario privado boutique de solo 12 exclusivas Eco Suites', 1),
    (v_project_id, 'Amplios solares individuales desde 138 m² hasta 200 m²', 2),
    (v_project_id, 'Piscina privada incluida y paquetes de personalización Deluxe y Royal', 3),
    (v_project_id, 'A minutos de las playas vírgenes y lagunas de Nisibón', 4),
    (v_project_id, 'Comercialización exclusiva bajo la dirección de Osvaldo Bello', 5);

  -- 9. Amenities
  insert into public.amenities (slug, name, icon)
  values
    ('piscina-privada', 'Piscina privada en cada unidad', 'Waves'),
    ('seguridad-24-7', 'Seguridad 24/7 y control de acceso', 'ShieldCheck'),
    ('senderos-ecologicos', 'Senderos ecológicos', 'TreePine'),
    ('jardin-botanico', 'Jardín botánico biofílico', 'Flower2'),
    ('area-social-bbq', 'Área social & BBQ', 'Flame'),
    ('playas-virgenes', 'Acceso a playas vírgenes de Nisibón', 'Compass'),
    ('energia-solar', 'Energía solar & diseño sustentable', 'Sun'),
    ('parqueo-privado', 'Parqueo privado asignado', 'Car'),
    ('gimnasio-yoga', 'Gimnasio al aire libre & Yoga deck', 'Activity'),
    ('pet-friendly', 'Pet friendly', 'Heart')
  on conflict (slug) do update
  set name = excluded.name,
      icon = excluded.icon;

  delete from public.project_amenities where project_id = v_project_id;
  insert into public.project_amenities (project_id, amenity_id)
  select v_project_id, a.id
  from public.amenities a
  where a.slug in (
    'piscina-privada', 'seguridad-24-7', 'senderos-ecologicos', 'jardin-botanico',
    'area-social-bbq', 'playas-virgenes', 'energia-solar', 'parqueo-privado',
    'gimnasio-yoga', 'pet-friendly'
  );

  -- 10. Payment Plans
  -- Plan A: Estándar (20/30/50)
  insert into public.payment_plans (organization_id, project_id, name, is_active)
  values (coalesce(v_bello_id, v_developer_id), v_project_id, 'Plan Estándar (20/30/50)', true)
  on conflict (project_id, name) do update
  set is_active = true
  returning id into v_plan_a_id;

  delete from public.payment_plan_steps where payment_plan_id = v_plan_a_id;
  insert into public.payment_plan_steps (payment_plan_id, label, percentage, fixed_amount, milestone, sort_order)
  values
    (v_plan_a_id, 'Reserva', null, 500, 'Reembolsable por 15 días', 0),
    (v_plan_a_id, 'Firma de Contrato', 20, null, '20% a la firma del contrato de opción a compra', 1),
    (v_plan_a_id, 'Durante Construcción', 30, null, '30% en cómodas cuotas durante la obra', 2),
    (v_plan_a_id, 'Contra Entrega', 50, null, '50% restante contra entrega física de la unidad', 3);

  -- Plan B: Inversionista (10/50/40)
  insert into public.payment_plans (organization_id, project_id, name, is_active)
  values (coalesce(v_bello_id, v_developer_id), v_project_id, 'Plan Inversionista (10/50/40)', false)
  on conflict (project_id, name) do update
  set is_active = false
  returning id into v_plan_b_id;

  delete from public.payment_plan_steps where payment_plan_id = v_plan_b_id;
  insert into public.payment_plan_steps (payment_plan_id, label, percentage, fixed_amount, milestone, sort_order)
  values
    (v_plan_b_id, 'Reserva', null, 500, 'Reembolsable por 15 días', 0),
    (v_plan_b_id, 'Firma de Contrato', 10, null, '10% a la firma del contrato', 1),
    (v_plan_b_id, 'Durante Construcción', 50, null, '50% durante el proceso de construcción', 2),
    (v_plan_b_id, 'Contra Entrega', 40, null, '40% contra entrega final', 3);

  -- 11. Typology: Eco Suite
  insert into public.typologies (
    organization_id, project_id, name, bedrooms, bathrooms, total_sqm
  )
  values (
    coalesce(v_bello_id, v_developer_id),
    v_project_id,
    'Eco Suite',
    1,
    1,
    67.50
  )
  on conflict (project_id, name) do update
  set bedrooms = excluded.bedrooms,
      bathrooms = excluded.bathrooms,
      total_sqm = excluded.total_sqm,
      updated_at = now()
  returning id into v_typology_id;

  -- 12. Units (101 to 112)
  insert into public.units (
    organization_id, project_id, typology_id, unit_code, tower, floor_level,
    list_price, currency, status, is_public, notes
  )
  values
    (coalesce(v_bello_id, v_developer_id), v_project_id, v_typology_id, '101', 'Eco Villa 1', 1, 97000, 'USD', 'available', true, '{"base_price": 97000, "lot_sqm": 176.47, "construction_sqm": 67.50, "habitable_sqm": 35.00, "terrace_sqm": 20.00, "parking_sqm": 12.50, "deluxe_price": 112000, "royal_price": 127000}'),
    (coalesce(v_bello_id, v_developer_id), v_project_id, v_typology_id, '102', 'Eco Villa 1', 1, 98500, 'USD', 'available', true, '{"base_price": 98500, "lot_sqm": 169.58, "construction_sqm": 67.50, "habitable_sqm": 35.00, "terrace_sqm": 20.00, "parking_sqm": 12.50, "deluxe_price": 113500, "royal_price": 128500}'),
    (coalesce(v_bello_id, v_developer_id), v_project_id, v_typology_id, '103', 'Eco Villa 1', 1, 98000, 'USD', 'available', true, '{"base_price": 98000, "lot_sqm": 167.61, "construction_sqm": 67.50, "habitable_sqm": 35.00, "terrace_sqm": 20.00, "parking_sqm": 12.50, "deluxe_price": 113000, "royal_price": 128000}'),
    (coalesce(v_bello_id, v_developer_id), v_project_id, v_typology_id, '104', 'Eco Villa 1', 1, 99000, 'USD', 'available', true, '{"base_price": 99000, "lot_sqm": 171.79, "construction_sqm": 67.50, "habitable_sqm": 35.00, "terrace_sqm": 20.00, "parking_sqm": 12.50, "deluxe_price": 114000, "royal_price": 129000}'),
    (coalesce(v_bello_id, v_developer_id), v_project_id, v_typology_id, '105', 'Eco Villa 1', 1, 102000, 'USD', 'available', true, '{"base_price": 102000, "lot_sqm": 182.40, "construction_sqm": 67.50, "habitable_sqm": 35.00, "terrace_sqm": 20.00, "parking_sqm": 12.50, "deluxe_price": 117000, "royal_price": 132000}'),
    (coalesce(v_bello_id, v_developer_id), v_project_id, v_typology_id, '106', 'Eco Villa 1', 1, 104000, 'USD', 'available', true, '{"base_price": 104000, "lot_sqm": 206.30, "construction_sqm": 67.50, "habitable_sqm": 35.00, "terrace_sqm": 20.00, "parking_sqm": 12.50, "deluxe_price": 119000, "royal_price": 134000}'),
    (coalesce(v_bello_id, v_developer_id), v_project_id, v_typology_id, '107', 'Eco Villa 1', 1, 103500, 'USD', 'available', true, '{"base_price": 103500, "lot_sqm": 215.76, "construction_sqm": 67.50, "habitable_sqm": 35.00, "terrace_sqm": 20.00, "parking_sqm": 12.50, "deluxe_price": 118500, "royal_price": 133500}'),
    (coalesce(v_bello_id, v_developer_id), v_project_id, v_typology_id, '108', 'Eco Villa 1', 1, 108000, 'USD', 'available', true, '{"base_price": 108000, "lot_sqm": 165.50, "construction_sqm": 67.50, "habitable_sqm": 35.00, "terrace_sqm": 20.00, "parking_sqm": 12.50, "deluxe_price": 123000, "royal_price": 138000}'),
    (coalesce(v_bello_id, v_developer_id), v_project_id, v_typology_id, '109', 'Eco Villa 1', 1, 95000, 'USD', 'available', true, '{"base_price": 95000, "lot_sqm": 138.60, "construction_sqm": 67.50, "habitable_sqm": 35.00, "terrace_sqm": 20.00, "parking_sqm": 12.50, "deluxe_price": 110000, "royal_price": 125000}'),
    (coalesce(v_bello_id, v_developer_id), v_project_id, v_typology_id, '110', 'Eco Villa 1', 1, 95000, 'USD', 'available', true, '{"base_price": 95000, "lot_sqm": 138.58, "construction_sqm": 67.50, "habitable_sqm": 35.00, "terrace_sqm": 20.00, "parking_sqm": 12.50, "deluxe_price": 110000, "royal_price": 125000}'),
    (coalesce(v_bello_id, v_developer_id), v_project_id, v_typology_id, '111', 'Eco Villa 1', 1, 104999, 'USD', 'available', true, '{"base_price": 104999, "lot_sqm": 194.21, "construction_sqm": 67.50, "habitable_sqm": 35.00, "terrace_sqm": 20.00, "parking_sqm": 12.50, "deluxe_price": 119999, "royal_price": 134999}'),
    (coalesce(v_bello_id, v_developer_id), v_project_id, v_typology_id, '112', 'Eco Villa 1', 1, 104500, 'USD', 'available', true, '{"base_price": 104500, "lot_sqm": 165.45, "construction_sqm": 67.50, "habitable_sqm": 35.00, "terrace_sqm": 20.00, "parking_sqm": 12.50, "deluxe_price": 119500, "royal_price": 134500}')
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

  -- 13. Update project inventory summary
  update public.projects
  set inventory_total_declared = 12,
      inventory_available_declared = 12,
      inventory_is_complete = true,
      starting_price = 95000,
      inventory_updated_at = now(),
      updated_at = now()
  where id = v_project_id;

end $$;
