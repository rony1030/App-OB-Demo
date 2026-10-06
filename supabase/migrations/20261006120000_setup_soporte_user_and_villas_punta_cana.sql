-- Migration: Create Agency "Agentes Inmobiliarios", User "Soporte", Setup "Villas en Punta Cana" with 3 typologies & test units
-- Purpose: Controlled test & video tutorial account for Soporte (soporte@osvaldobello.com)

DO $$
DECLARE
  v_master_org_id BIGINT;
  v_developer_org_id BIGINT;
  v_agency_org_id BIGINT;
  v_project_id BIGINT;
  v_user_id UUID;
  v_membership_id BIGINT;
  v_typology_a_id BIGINT;
  v_typology_b_id BIGINT;
  v_typology_c_id BIGINT;
BEGIN
  -- 1. Identificar Master Broker y Desarrollador
  SELECT id INTO v_master_org_id FROM public.organizations WHERE slug = 'bello-valdez-enterprise' LIMIT 1;
  IF v_master_org_id IS NULL THEN
    SELECT id INTO v_master_org_id FROM public.organizations WHERE kind = 'master_broker' ORDER BY id LIMIT 1;
  END IF;

  SELECT id INTO v_developer_org_id FROM public.organizations WHERE slug = 'paridera-investors' LIMIT 1;
  IF v_developer_org_id IS NULL THEN
    SELECT id INTO v_developer_org_id FROM public.organizations WHERE kind = 'developer' ORDER BY id LIMIT 1;
  END IF;

  -- 2. Crear o actualizar Organización de Agencia: "Agentes Inmobiliarios"
  INSERT INTO public.organizations (
    slug,
    name,
    kind,
    status,
    legal_name,
    contact_email
  ) VALUES (
    'agentes-inmobiliarios',
    'Agentes Inmobiliarios',
    'agency',
    'active',
    'Agentes Inmobiliarios SRL',
    'soporte@osvaldobello.com'
  )
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    kind = EXCLUDED.kind,
    status = EXCLUDED.status,
    updated_at = NOW()
  RETURNING id INTO v_agency_org_id;

  -- 3. Crear o actualizar Proyecto "Villas en Punta Cana"
  -- Si existe proyecto 39 ("Villas Bonita Beach"), lo adaptamos a "Villas en Punta Cana", de lo contrario lo insertamos.
  SELECT id INTO v_project_id FROM public.projects WHERE id = 39 LIMIT 1;

  IF v_project_id IS NOT NULL THEN
    UPDATE public.projects
    SET name = 'Villas en Punta Cana',
        slug = 'villas-en-punta-cana',
        location = 'Punta Cana, República Dominicana',
        zone = 'Punta Cana',
        description = 'Exclusivo complejo residencial de villas de lujo en Punta Cana con piscina privada, amplias terrazas, áreas verdes y acabados de primera.',
        short_description = 'Exclusivas villas residenciales en Punta Cana con piscina privada y amenidades de resort.',
        starting_price = 450000.00,
        currency = 'USD',
        publication_status = 'published',
        inventory_total_declared = 19,
        inventory_available_declared = 3,
        updated_at = NOW()
    WHERE id = v_project_id;
  ELSE
    INSERT INTO public.projects (
      name,
      slug,
      organization_id,
      developer_organization_id,
      location,
      zone,
      lifecycle_status,
      publication_status,
      project_type,
      delivery_date,
      description,
      short_description,
      starting_price,
      currency,
      commission_rate,
      inventory_total_declared,
      inventory_available_declared,
      inventory_is_complete
    ) VALUES (
      'Villas en Punta Cana',
      'villas-en-punta-cana',
      v_master_org_id,
      v_developer_org_id,
      'Punta Cana, República Dominicana',
      'Punta Cana',
      'construction',
      'published',
      'building',
      '2026-12-31',
      'Exclusivo complejo residencial de villas de lujo en Punta Cana con piscina privada, amplias terrazas, áreas verdes y acabados de primera.',
      'Exclusivas villas residenciales en Punta Cana con piscina privada y amenidades de resort.',
      450000.00,
      'USD',
      5.0,
      19,
      3,
      true
    )
    RETURNING id INTO v_project_id;
  END IF;

  -- 4. Tipologías (3 tipologías)
  -- Tipología A: Villa Coral (3 Habitaciones)
  SELECT id INTO v_typology_a_id FROM public.typologies WHERE project_id = v_project_id AND name ILIKE '%Villa Coral%' LIMIT 1;
  IF v_typology_a_id IS NULL THEN
    -- Reutilizamos la tipología 121 si existe o creamos nueva
    SELECT id INTO v_typology_a_id FROM public.typologies WHERE project_id = v_project_id ORDER BY id LIMIT 1;
    IF v_typology_a_id IS NOT NULL THEN
      UPDATE public.typologies
      SET name = 'Villa Coral (3H)',
          bedrooms = 3,
          bathrooms = 3.5,
          indoor_sqm = 240.00,
          terrace_sqm = 60.00,
          total_sqm = 300.00,
          updated_at = NOW()
      WHERE id = v_typology_a_id;
    ELSE
      INSERT INTO public.typologies (
        organization_id, project_id, name, bedrooms, bathrooms, indoor_sqm, terrace_sqm, total_sqm
      ) VALUES (
        v_developer_org_id, v_project_id, 'Villa Coral (3H)', 3, 3.5, 240.00, 60.00, 300.00
      ) RETURNING id INTO v_typology_a_id;
    END IF;
  END IF;

  -- Tipología B: Villa Palma (4 Habitaciones)
  SELECT id INTO v_typology_b_id FROM public.typologies WHERE project_id = v_project_id AND name ILIKE '%Villa Palma%' LIMIT 1;
  IF v_typology_b_id IS NULL THEN
    -- Buscamos si existe una segunda tipología en el proyecto
    SELECT id INTO v_typology_b_id FROM public.typologies WHERE project_id = v_project_id AND id != v_typology_a_id ORDER BY id LIMIT 1;
    IF v_typology_b_id IS NOT NULL THEN
      UPDATE public.typologies
      SET name = 'Villa Palma (4H)',
          bedrooms = 4,
          bathrooms = 4.5,
          indoor_sqm = 320.00,
          terrace_sqm = 80.00,
          total_sqm = 400.00,
          updated_at = NOW()
      WHERE id = v_typology_b_id;
    ELSE
      INSERT INTO public.typologies (
        organization_id, project_id, name, bedrooms, bathrooms, indoor_sqm, terrace_sqm, total_sqm
      ) VALUES (
        v_developer_org_id, v_project_id, 'Villa Palma (4H)', 4, 4.5, 320.00, 80.00, 400.00
      ) RETURNING id INTO v_typology_b_id;
    END IF;
  END IF;

  -- Tipología C: Villa Esmeralda Royal (5 Habitaciones)
  SELECT id INTO v_typology_c_id FROM public.typologies WHERE project_id = v_project_id AND name ILIKE '%Villa Esmeralda%' LIMIT 1;
  IF v_typology_c_id IS NULL THEN
    INSERT INTO public.typologies (
      organization_id, project_id, name, bedrooms, bathrooms, indoor_sqm, terrace_sqm, total_sqm
    ) VALUES (
      v_developer_org_id, v_project_id, 'Villa Esmeralda Royal (5H)', 5, 5.5, 450.00, 110.00, 560.00
    ) RETURNING id INTO v_typology_c_id;
  END IF;

  -- 5. Disponibilidad ficticia (19 unidades: 3 disponibles, 2 reservadas, 14 vendidas)
  -- Primero actualizar todas a vendidas
  UPDATE public.units
  SET status = 'sold',
      is_public = false,
      list_price = 0.00
  WHERE project_id = v_project_id;

  -- Unidad 1 Disponible (Villa Coral - 3H): Villa 01
  UPDATE public.units
  SET typology_id = v_typology_a_id,
      status = 'available',
      is_public = true,
      list_price = 450000.00,
      currency = 'USD',
      notes = 'Villa de 3H con piscina privada y solar de 400 m².'
  WHERE project_id = v_project_id AND unit_code = 'Villa 1';

  -- Unidad 2 Disponible (Villa Palma - 4H): Villa 02
  UPDATE public.units
  SET typology_id = v_typology_b_id,
      status = 'available',
      is_public = true,
      list_price = 580000.00,
      currency = 'USD',
      notes = 'Villa de 4H con vista a áreas verdes y terraza techada.'
  WHERE project_id = v_project_id AND unit_code = 'Villa 2';

  -- Unidad 3 Disponible (Villa Esmeralda Royal - 5H): Villa 18
  UPDATE public.units
  SET typology_id = v_typology_c_id,
      status = 'available',
      is_public = true,
      list_price = 820000.00,
      currency = 'USD',
      notes = 'Villa de 5H de lujo con piscina infinity y marquesina doble.'
  WHERE project_id = v_project_id AND unit_code = 'Villa 18';

  -- Unidad 4 Reservada (Villa Palma): Villa 03
  UPDATE public.units
  SET typology_id = v_typology_b_id,
      status = 'reserved',
      is_public = true,
      list_price = 590000.00,
      currency = 'USD',
      notes = 'En proceso de firma de contrato.'
  WHERE project_id = v_project_id AND unit_code = 'Villa 3';

  -- Unidad 5 Reservada (Villa Coral): Villa 04
  UPDATE public.units
  SET typology_id = v_typology_a_id,
      status = 'reserved',
      is_public = true,
      list_price = 460000.00,
      currency = 'USD',
      notes = 'Reserva confirmada con comprobante recibido.'
  WHERE project_id = v_project_id AND unit_code = 'Villa 4';

  -- 6. Crear o actualizar Usuario en auth.users: soporte@osvaldobello.com
  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = 'soporte@osvaldobello.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      'soporte@osvaldobello.com',
      crypt('Soporte2026*', gen_salt('bf')),
      NOW(),
      jsonb_build_object('provider', 'email', 'providers', array['email']),
      jsonb_build_object('display_name', 'Soporte'),
      false,
      NOW(),
      NOW()
    );
  ELSE
    UPDATE auth.users
    SET encrypted_password = crypt('Soporte2026*', gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        raw_user_meta_data = jsonb_build_object('display_name', 'Soporte'),
        updated_at = NOW()
    WHERE id = v_user_id;
  END IF;

  -- 7. Crear o actualizar Perfil público en public.profiles
  INSERT INTO public.profiles (
    user_id,
    display_name,
    email,
    professional_title,
    must_change_password
  ) VALUES (
    v_user_id,
    'Soporte',
    'soporte@osvaldobello.com',
    'Administrador de Agencia · Agentes Inmobiliarios',
    false
  )
  ON CONFLICT (user_id) DO UPDATE SET
    display_name = 'Soporte',
    email = 'soporte@osvaldobello.com',
    professional_title = 'Administrador de Agencia · Agentes Inmobiliarios',
    updated_at = NOW();

  -- 8. Crear o actualizar Membresía como 'agency_admin' en 'Agentes Inmobiliarios'
  SELECT id INTO v_membership_id FROM public.memberships WHERE user_id = v_user_id LIMIT 1;

  IF v_membership_id IS NULL THEN
    INSERT INTO public.memberships (
      organization_id,
      user_id,
      role,
      status,
      is_primary
    ) VALUES (
      v_agency_org_id,
      v_user_id,
      'agency_admin',
      'active',
      true
    ) RETURNING id INTO v_membership_id;
  ELSE
    UPDATE public.memberships
    SET organization_id = v_agency_org_id,
        role = 'agency_admin',
        status = 'active',
        is_primary = true,
        updated_at = NOW()
    WHERE id = v_membership_id;
  END IF;

  -- 9. Aislar los proyectos para este usuario / membresía:
  -- Eliminar cualquier acceso previo a otros proyectos
  DELETE FROM public.project_access
  WHERE grantee_membership_id = v_membership_id
     OR grantee_organization_id = v_agency_org_id;

  -- Otorgar acceso ÚNICAMENTE al proyecto "Villas en Punta Cana" (v_project_id)
  INSERT INTO public.project_access (
    organization_id,
    project_id,
    grantee_membership_id,
    access_level
  ) VALUES (
    (SELECT organization_id FROM public.projects WHERE id = v_project_id),
    v_project_id,
    v_membership_id,
    'manage'
  );

  RAISE NOTICE 'Usuario Soporte configurado con éxito. Proyecto ID: %, Agencia ID: %, Membresía ID: %',
    v_project_id, v_agency_org_id, v_membership_id;
END;
$$;
