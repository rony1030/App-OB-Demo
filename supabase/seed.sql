-- Synthetic development catalog migrated from the original UI prototype.
-- No real client or authentication data is seeded.

insert into public.organizations (slug, name, kind, legal_name, contact_email, contact_phone)
values
  ('ob-brokers-team', 'OB Brokers Team', 'master_broker', 'OB Brokers Team', 'info@obmasterbrokers.com', '+1 (809) 555-0199'),
  ('grupo-horizonte-caribe', 'Grupo Horizonte Caribe', 'developer', 'Grupo Horizonte Caribe', null, null),
  ('urbania-desarrollo', 'Urbania Desarrollo', 'developer', 'Urbania Desarrollo', null, null),
  ('luma-developments', 'Luma Developments', 'developer', 'Luma Developments', null, null)
on conflict (slug) do update set
  name = excluded.name,
  kind = excluded.kind,
  legal_name = excluded.legal_name,
  contact_email = excluded.contact_email,
  contact_phone = excluded.contact_phone,
  updated_at = now();

insert into public.amenities (slug, name)
values
  ('piscina', 'Piscina'), ('lobby-recepcion', 'Lobby con recepción'),
  ('gimnasio', 'Gimnasio'), ('coworking', 'Coworking'),
  ('area-infantil', 'Área infantil'), ('seguridad-24-7', 'Seguridad 24/7'),
  ('shuttle-playa', 'Shuttle a la playa'), ('estacionamiento', 'Estacionamiento'),
  ('rooftop', 'Rooftop'), ('salon-social', 'Salón social'),
  ('valet-parking', 'Valet parking'), ('carga-vehiculos-electricos', 'Carga para vehículos eléctricos'),
  ('senderos', 'Senderos'), ('salon-multiuso', 'Salón multiuso'),
  ('area-mascotas', 'Área de mascotas'), ('parqueos-techados', 'Parqueos techados')
on conflict (slug) do update set name = excluded.name;

do $$
declare
  ob_org_id bigint;
  horizonte_org_id bigint;
  urbania_org_id bigint;
  luma_org_id bigint;
  brand_id bigint;
  mar_azul_id bigint;
  distrito_coral_id bigint;
  luma_towers_id bigint;
  plan_id bigint;
  typology_id bigint;
begin
  select id into ob_org_id from public.organizations where slug = 'ob-brokers-team';
  select id into horizonte_org_id from public.organizations where slug = 'grupo-horizonte-caribe';
  select id into urbania_org_id from public.organizations where slug = 'urbania-desarrollo';
  select id into luma_org_id from public.organizations where slug = 'luma-developments';

  insert into public.brand_profiles (
    organization_id, name, is_default, logo_path, logo_dark_path, favicon_path,
    primary_color, secondary_color, accent_color, surface_color,
    contact_email, contact_phone, whatsapp_number
  ) values (
    ob_org_id, 'OB Brokers Team', true,
    'ob-brokers-team/brand/ob-brokers-team-horizontal-blue.png',
    'ob-brokers-team/brand/ob-brokers-team-horizontal-white.png',
    'ob-brokers-team/brand/ob-brokers-team-isotype-blue.png',
    '#0C094E', '#24207A', '#E8E8F7', '#F8F9FD',
    'info@obmasterbrokers.com', '+1 (809) 555-0199', '18095550199'
  )
  on conflict (organization_id, name) do update set
    is_default = excluded.is_default,
    logo_path = excluded.logo_path,
    logo_dark_path = excluded.logo_dark_path,
    favicon_path = excluded.favicon_path,
    primary_color = excluded.primary_color,
    secondary_color = excluded.secondary_color,
    accent_color = excluded.accent_color,
    surface_color = excluded.surface_color,
    updated_at = now()
  returning id into brand_id;

  insert into public.projects (
    organization_id, developer_organization_id, brand_profile_id, slug, name,
    location, zone, lifecycle_status, publication_status, delivery_date,
    description, short_description, starting_price, currency, commission_rate,
    master_broker_exclusive, inventory_total_declared, inventory_available_declared,
    inventory_is_complete, inventory_updated_at, published_at
  ) values (
    ob_org_id, horizonte_org_id, brand_id, 'mar-azul-residences', 'Mar Azul Residences',
    'Cap Cana, La Altagracia', 'Cap Cana', 'under_construction', 'published', '2027-12-01',
    'Residencias contemporáneas dentro de Cap Cana con acceso controlado, cercanía a la marina y un programa de rentas administradas para propietarios que buscan combinar uso personal e inversión.',
    'Residencias de inversión con acceso a marina, playa y programa de rentas.',
    185000, 'USD', 6, true, 88, 34, false, now(), now()
  )
  on conflict (organization_id, slug) do update set
    developer_organization_id = excluded.developer_organization_id,
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
    commission_rate = excluded.commission_rate,
    inventory_total_declared = excluded.inventory_total_declared,
    inventory_available_declared = excluded.inventory_available_declared,
    inventory_is_complete = excluded.inventory_is_complete,
    inventory_updated_at = excluded.inventory_updated_at,
    updated_at = now()
  returning id into mar_azul_id;

  insert into public.projects (
    organization_id, developer_organization_id, brand_profile_id, slug, name,
    location, zone, lifecycle_status, publication_status, delivery_date,
    description, short_description, starting_price, currency, commission_rate,
    master_broker_exclusive, inventory_total_declared, inventory_available_declared,
    inventory_is_complete, inventory_updated_at, published_at
  ) values (
    ob_org_id, urbania_org_id, brand_id, 'distrito-coral', 'Distrito Coral',
    'Piantini, Santo Domingo', 'Santo Domingo', 'pre_construction', 'published', '2028-06-01',
    'Proyecto urbano de apartamentos y penthouses diseñado para profesionales e inversionistas que valoran una ubicación céntrica, servicios completos y alta demanda de alquiler corporativo.',
    'Apartamentos urbanos con alta demanda de alquiler corporativo.',
    225000, 'USD', 5, true, 64, 21, false, now(), now()
  )
  on conflict (organization_id, slug) do update set
    developer_organization_id = excluded.developer_organization_id,
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
    commission_rate = excluded.commission_rate,
    inventory_total_declared = excluded.inventory_total_declared,
    inventory_available_declared = excluded.inventory_available_declared,
    inventory_is_complete = excluded.inventory_is_complete,
    inventory_updated_at = excluded.inventory_updated_at,
    updated_at = now()
  returning id into distrito_coral_id;

  insert into public.projects (
    organization_id, developer_organization_id, brand_profile_id, slug, name,
    location, zone, lifecycle_status, publication_status, delivery_date,
    description, short_description, starting_price, currency, commission_rate,
    master_broker_exclusive, inventory_total_declared, inventory_available_declared,
    inventory_is_complete, inventory_updated_at, published_at
  ) values (
    ob_org_id, luma_org_id, brand_id, 'luma-towers', 'Luma Towers',
    'Punta Cana Village', 'Punta Cana', 'under_construction', 'published', '2027-03-01',
    'Conjunto residencial de diseño liviano y tropical en Punta Cana Village, con tipologías eficientes para primera vivienda, estadías prolongadas y renta ejecutiva.',
    'Unidades eficientes para vivienda y renta ejecutiva en Punta Cana Village.',
    149000, 'USD', 5.5, true, 120, 47, false, now(), now()
  )
  on conflict (organization_id, slug) do update set
    developer_organization_id = excluded.developer_organization_id,
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
    commission_rate = excluded.commission_rate,
    inventory_total_declared = excluded.inventory_total_declared,
    inventory_available_declared = excluded.inventory_available_declared,
    inventory_is_complete = excluded.inventory_is_complete,
    inventory_updated_at = excluded.inventory_updated_at,
    updated_at = now()
  returning id into luma_towers_id;

  insert into public.project_media (organization_id, project_id, kind, storage_path, alt_text, sort_order)
  values
    (ob_org_id, mar_azul_id, 'hero', 'ob-brokers-team/projects/mar-azul-residences/exterior.jpg', 'Exterior de Mar Azul Residences', 0),
    (ob_org_id, mar_azul_id, 'gallery', 'ob-brokers-team/projects/mar-azul-residences/amenities.jpg', 'Amenidades de Mar Azul Residences', 1),
    (ob_org_id, mar_azul_id, 'gallery', 'ob-brokers-team/projects/mar-azul-residences/kids.jpg', 'Área infantil de Mar Azul Residences', 2),
    (ob_org_id, distrito_coral_id, 'hero', 'ob-brokers-team/projects/distrito-coral/lounge.jpg', 'Salón de Distrito Coral', 0),
    (ob_org_id, distrito_coral_id, 'gallery', 'ob-brokers-team/projects/distrito-coral/bedroom.jpg', 'Habitación de Distrito Coral', 1),
    (ob_org_id, luma_towers_id, 'hero', 'ob-brokers-team/projects/luma-towers/amenities.jpg', 'Amenidades de Luma Towers', 0),
    (ob_org_id, luma_towers_id, 'gallery', 'ob-brokers-team/projects/luma-towers/padel.jpg', 'Cancha de pádel de Luma Towers', 1),
    (ob_org_id, luma_towers_id, 'gallery', 'ob-brokers-team/projects/luma-towers/exterior.jpg', 'Exterior de Luma Towers', 2)
  on conflict (storage_bucket, storage_path) do update set
    project_id = excluded.project_id,
    kind = excluded.kind,
    alt_text = excluded.alt_text,
    sort_order = excluded.sort_order;

  insert into public.project_highlights (project_id, content, sort_order)
  values
    (mar_azul_id, 'Ubicación consolidada en Cap Cana', 0),
    (mar_azul_id, 'Beneficios CONFOTUR', 1),
    (mar_azul_id, 'Renta corta permitida', 2),
    (mar_azul_id, 'Administración hotelera opcional', 3),
    (distrito_coral_id, 'Piantini a pocos pasos', 0),
    (distrito_coral_id, 'Lobby de doble altura', 1),
    (distrito_coral_id, 'Renta corporativa', 2),
    (distrito_coral_id, 'Terminaciones premium', 3),
    (luma_towers_id, 'Cerca del aeropuerto', 0),
    (luma_towers_id, 'Comunidad consolidada', 1),
    (luma_towers_id, 'Baja densidad', 2),
    (luma_towers_id, 'Plan de pago flexible', 3)
  on conflict (project_id, sort_order) do update set content = excluded.content;

  insert into public.project_amenities (project_id, amenity_id)
  select mar_azul_id, id from public.amenities where slug in ('piscina','lobby-recepcion','gimnasio','coworking','area-infantil','seguridad-24-7','shuttle-playa','estacionamiento')
  on conflict do nothing;
  insert into public.project_amenities (project_id, amenity_id)
  select distrito_coral_id, id from public.amenities where slug in ('rooftop','piscina','salon-social','gimnasio','valet-parking','carga-vehiculos-electricos','seguridad-24-7')
  on conflict do nothing;
  insert into public.project_amenities (project_id, amenity_id)
  select luma_towers_id, id from public.amenities where slug in ('piscina','senderos','gimnasio','salon-multiuso','area-mascotas','seguridad-24-7','parqueos-techados')
  on conflict do nothing;

  insert into public.payment_plans (organization_id, project_id, name, currency)
  values (ob_org_id, mar_azul_id, 'Plan estándar', 'USD')
  on conflict (project_id, name) do update set is_active = true, updated_at = now()
  returning id into plan_id;
  delete from public.payment_plan_steps where payment_plan_id = plan_id;
  insert into public.payment_plan_steps (payment_plan_id, label, fixed_amount, percentage, milestone, sort_order) values
    (plan_id, 'Reserva (abonable al inicial)', 5000, null, 'Al reservar', 0),
    (plan_id, 'A la firma', null, 20, 'Firma del contrato', 1),
    (plan_id, 'Durante construcción', null, 40, 'Cuotas durante obra', 2),
    (plan_id, 'Contra entrega', null, 40, 'Entrega de la unidad', 3);

  insert into public.payment_plans (organization_id, project_id, name, currency)
  values (ob_org_id, distrito_coral_id, 'Plan estándar', 'USD')
  on conflict (project_id, name) do update set is_active = true, updated_at = now()
  returning id into plan_id;
  delete from public.payment_plan_steps where payment_plan_id = plan_id;
  insert into public.payment_plan_steps (payment_plan_id, label, fixed_amount, percentage, milestone, sort_order) values
    (plan_id, 'Reserva (abonable al inicial)', 10000, null, 'Al reservar', 0),
    (plan_id, 'A la firma', null, 20, 'Firma del contrato', 1),
    (plan_id, 'Durante construcción', null, 50, 'Cuotas durante obra', 2),
    (plan_id, 'Contra entrega', null, 30, 'Entrega de la unidad', 3);

  insert into public.payment_plans (organization_id, project_id, name, currency)
  values (ob_org_id, luma_towers_id, 'Plan estándar', 'USD')
  on conflict (project_id, name) do update set is_active = true, updated_at = now()
  returning id into plan_id;
  delete from public.payment_plan_steps where payment_plan_id = plan_id;
  insert into public.payment_plan_steps (payment_plan_id, label, fixed_amount, percentage, milestone, sort_order) values
    (plan_id, 'Reserva (abonable al inicial)', 3000, null, 'Al reservar', 0),
    (plan_id, 'A la firma', null, 15, 'Firma del contrato', 1),
    (plan_id, 'Durante construcción', null, 45, 'Cuotas durante obra', 2),
    (plan_id, 'Contra entrega', null, 40, 'Entrega de la unidad', 3);

  insert into public.typologies (organization_id, project_id, name, bedrooms, bathrooms, total_sqm)
  values
    (ob_org_id, mar_azul_id, '1 habitación', 1, 1, 68),
    (ob_org_id, mar_azul_id, '2 habitaciones', 2, 2, 112),
    (ob_org_id, mar_azul_id, '2 habitaciones + jardín', 2, 2, 128),
    (ob_org_id, mar_azul_id, 'Penthouse', 3, 3.5, 210),
    (ob_org_id, distrito_coral_id, '2 habitaciones', 2, 2, 102),
    (ob_org_id, distrito_coral_id, '2 habitaciones + estudio', 2, 2.5, 126),
    (ob_org_id, distrito_coral_id, '3 habitaciones', 3, 3.5, 148),
    (ob_org_id, distrito_coral_id, 'Penthouse', 4, 4.5, 286),
    (ob_org_id, luma_towers_id, '1 habitación', 1, 1, 67),
    (ob_org_id, luma_towers_id, '2 habitaciones 94 m²', 2, 2, 94),
    (ob_org_id, luma_towers_id, '2 habitaciones 96 m²', 2, 2, 96),
    (ob_org_id, luma_towers_id, '3 habitaciones', 3, 2.5, 132)
  on conflict (project_id, name) do update set
    bedrooms = excluded.bedrooms,
    bathrooms = excluded.bathrooms,
    total_sqm = excluded.total_sqm,
    updated_at = now();

  select id into typology_id from public.typologies where project_id = mar_azul_id and name = '2 habitaciones';
  insert into public.units (organization_id, project_id, typology_id, unit_code, tower, floor_level, list_price, status)
  values (ob_org_id, mar_azul_id, typology_id, 'A-301', 'Torre A', 3, 245000, 'available')
  on conflict (project_id, unit_code) do update set typology_id = excluded.typology_id, list_price = excluded.list_price, status = excluded.status, updated_at = now();
  select id into typology_id from public.typologies where project_id = mar_azul_id and name = '1 habitación';
  insert into public.units (organization_id, project_id, typology_id, unit_code, tower, floor_level, list_price, status)
  values (ob_org_id, mar_azul_id, typology_id, 'A-302', 'Torre A', 3, 185000, 'available')
  on conflict (project_id, unit_code) do update set typology_id = excluded.typology_id, list_price = excluded.list_price, status = excluded.status, updated_at = now();
  select id into typology_id from public.typologies where project_id = mar_azul_id and name = '2 habitaciones';
  insert into public.units (organization_id, project_id, typology_id, unit_code, tower, floor_level, list_price, status)
  values (ob_org_id, mar_azul_id, typology_id, 'B-201', 'Torre B', 2, 232000, 'separated')
  on conflict (project_id, unit_code) do update set typology_id = excluded.typology_id, list_price = excluded.list_price, status = excluded.status, updated_at = now();
  select id into typology_id from public.typologies where project_id = mar_azul_id and name = 'Penthouse';
  insert into public.units (organization_id, project_id, typology_id, unit_code, tower, floor_level, list_price, status)
  values (ob_org_id, mar_azul_id, typology_id, 'PH-02', 'Torre B', 6, 485000, 'available')
  on conflict (project_id, unit_code) do update set typology_id = excluded.typology_id, list_price = excluded.list_price, status = excluded.status, updated_at = now();
  select id into typology_id from public.typologies where project_id = mar_azul_id and name = '2 habitaciones + jardín';
  insert into public.units (organization_id, project_id, typology_id, unit_code, tower, floor_level, list_price, status)
  values (ob_org_id, mar_azul_id, typology_id, 'C-104', 'Torre C', 1, 268000, 'blocked')
  on conflict (project_id, unit_code) do update set typology_id = excluded.typology_id, list_price = excluded.list_price, status = excluded.status, updated_at = now();

  select id into typology_id from public.typologies where project_id = distrito_coral_id and name = '3 habitaciones';
  insert into public.units (organization_id, project_id, typology_id, unit_code, tower, floor_level, list_price, status)
  values (ob_org_id, distrito_coral_id, typology_id, 'B-402', 'Torre Única', 4, 318000, 'separated')
  on conflict (project_id, unit_code) do update set typology_id = excluded.typology_id, list_price = excluded.list_price, status = excluded.status, updated_at = now();
  select id into typology_id from public.typologies where project_id = distrito_coral_id and name = '2 habitaciones';
  insert into public.units (organization_id, project_id, typology_id, unit_code, tower, floor_level, list_price, status)
  values (ob_org_id, distrito_coral_id, typology_id, 'A-201', 'Torre Única', 2, 225000, 'available')
  on conflict (project_id, unit_code) do update set typology_id = excluded.typology_id, list_price = excluded.list_price, status = excluded.status, updated_at = now();
  select id into typology_id from public.typologies where project_id = distrito_coral_id and name = '2 habitaciones + estudio';
  insert into public.units (organization_id, project_id, typology_id, unit_code, tower, floor_level, list_price, status)
  values (ob_org_id, distrito_coral_id, typology_id, 'A-505', 'Torre Única', 5, 276000, 'available')
  on conflict (project_id, unit_code) do update set typology_id = excluded.typology_id, list_price = excluded.list_price, status = excluded.status, updated_at = now();
  select id into typology_id from public.typologies where project_id = distrito_coral_id and name = 'Penthouse';
  insert into public.units (organization_id, project_id, typology_id, unit_code, tower, floor_level, list_price, status)
  values (ob_org_id, distrito_coral_id, typology_id, 'PH-01', 'Torre Única', 12, 625000, 'available')
  on conflict (project_id, unit_code) do update set typology_id = excluded.typology_id, list_price = excluded.list_price, status = excluded.status, updated_at = now();

  select id into typology_id from public.typologies where project_id = luma_towers_id and name = '1 habitación';
  insert into public.units (organization_id, project_id, typology_id, unit_code, tower, floor_level, list_price, status)
  values (ob_org_id, luma_towers_id, typology_id, 'C-110', 'Torre C', 1, 149000, 'available')
  on conflict (project_id, unit_code) do update set typology_id = excluded.typology_id, list_price = excluded.list_price, status = excluded.status, updated_at = now();
  select id into typology_id from public.typologies where project_id = luma_towers_id and name = '2 habitaciones 96 m²';
  insert into public.units (organization_id, project_id, typology_id, unit_code, tower, floor_level, list_price, status)
  values (ob_org_id, luma_towers_id, typology_id, 'A-212', 'Torre A', 2, 198500, 'blocked')
  on conflict (project_id, unit_code) do update set typology_id = excluded.typology_id, list_price = excluded.list_price, status = excluded.status, updated_at = now();
  select id into typology_id from public.typologies where project_id = luma_towers_id and name = '2 habitaciones 94 m²';
  insert into public.units (organization_id, project_id, typology_id, unit_code, tower, floor_level, list_price, status)
  values (ob_org_id, luma_towers_id, typology_id, 'B-305', 'Torre B', 3, 195000, 'available')
  on conflict (project_id, unit_code) do update set typology_id = excluded.typology_id, list_price = excluded.list_price, status = excluded.status, updated_at = now();
  select id into typology_id from public.typologies where project_id = luma_towers_id and name = '3 habitaciones';
  insert into public.units (organization_id, project_id, typology_id, unit_code, tower, floor_level, list_price, status)
  values (ob_org_id, luma_towers_id, typology_id, 'C-408', 'Torre C', 4, 264000, 'available')
  on conflict (project_id, unit_code) do update set typology_id = excluded.typology_id, list_price = excluded.list_price, status = excluded.status, updated_at = now();

  insert into public.project_documents (organization_id, project_id, title, category, visibility, status)
  values
    (ob_org_id, mar_azul_id, 'Brochure comercial', 'commercial', 'public', 'draft'),
    (ob_org_id, mar_azul_id, 'Lista de precios', 'commercial', 'authorized', 'draft'),
    (ob_org_id, mar_azul_id, 'Planos y tipologías', 'technical', 'authorized', 'draft'),
    (ob_org_id, mar_azul_id, 'Resolución CONFOTUR', 'legal', 'private', 'draft'),
    (ob_org_id, distrito_coral_id, 'Brochure comercial', 'commercial', 'public', 'draft'),
    (ob_org_id, distrito_coral_id, 'Lista de precios', 'commercial', 'authorized', 'draft'),
    (ob_org_id, distrito_coral_id, 'Planos arquitectónicos', 'technical', 'authorized', 'draft'),
    (ob_org_id, distrito_coral_id, 'Documentación fiduciaria', 'legal', 'private', 'draft'),
    (ob_org_id, luma_towers_id, 'Brochure comercial', 'commercial', 'public', 'draft'),
    (ob_org_id, luma_towers_id, 'Disponibilidad y precios', 'commercial', 'authorized', 'draft'),
    (ob_org_id, luma_towers_id, 'Catálogo de tipologías', 'technical', 'authorized', 'draft')
  on conflict (project_id, title) do update set
    category = excluded.category,
    visibility = excluded.visibility,
    status = excluded.status,
    updated_at = now();
end $$;
