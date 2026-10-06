-- Separate user companies from developers. Developer access is granted per
-- project so future administrators cannot inherit another developer's data.
do $$
declare
  bello_id bigint;
  hp_id bigint;
  kyser_id bigint;
  cana_rock_id bigint;
  anna_user_id uuid;
  osvaldo_user_id uuid;
  osvaldo_membership_id bigint;
  obsolete_osvaldo_membership_id bigint;
begin
  select id into bello_id
  from public.organizations
  where slug in ('ob-brokers-team', 'bello-valdez-enterprise')
  order by id
  limit 1;

  if bello_id is null then
    raise exception 'No se encontro la organizacion principal de Bello Valdez';
  end if;

  update public.organizations
  set slug = 'bello-valdez-enterprise',
      name = 'Bello Valdez Enterprise',
      legal_name = 'BELLO VALDEZ ENTERPRISE, SRL',
      tax_id = '132558871',
      contact_email = 'info@osvaldobello.com',
      updated_at = now()
  where id = bello_id;

  insert into public.organizations (
    slug, name, kind, status, legal_name, tax_id, contact_email
  ) values (
    'hp-brokers-caribe-real-estate',
    'HP Brokers Caribe Real Estate',
    'master_broker',
    'active',
    'HP BROKERS CARIBE REAL ESTATE, SRL',
    '132385642',
    'hanna@hpbrokerscaribe.com'
  )
  on conflict (slug) do update set
    name = excluded.name,
    kind = excluded.kind,
    status = excluded.status,
    legal_name = excluded.legal_name,
    tax_id = excluded.tax_id,
    contact_email = excluded.contact_email,
    updated_at = now()
  returning id into hp_id;

  select id into kyser_id
  from public.organizations
  where name = 'KYSER' or slug like 'kyser%'
  order by id
  limit 1;

  if kyser_id is null then
    raise exception 'No se encontro la desarrolladora KYSER';
  end if;

  update public.organizations
  set slug = 'kyser',
      name = 'KYSER',
      kind = 'developer',
      legal_name = null,
      tax_id = null,
      contact_email = null,
      updated_at = now()
  where id = kyser_id;

  select id into cana_rock_id
  from public.organizations
  where slug = 'grupo-cana-rock';

  select id into anna_user_id
  from auth.users
  where lower(email) = 'hanna@hpbrokerscaribe.com'
  limit 1;

  select id into osvaldo_user_id
  from auth.users
  where lower(email) = 'info@osvaldobello.com'
  limit 1;

  if anna_user_id is null or osvaldo_user_id is null then
    raise exception 'No se encontraron las cuentas existentes de Anna y Osvaldo';
  end if;

  update public.profiles
  set display_name = 'Anna Glubenko',
      email = 'hanna@hpbrokerscaribe.com',
      updated_at = now()
  where user_id = anna_user_id;

  update public.profiles
  set display_name = 'Gleivys Osvaldo Bello Rodriguez',
      email = 'info@osvaldobello.com',
      updated_at = now()
  where user_id = osvaldo_user_id;

  update public.memberships
  set organization_id = hp_id,
      role = 'master_broker_admin',
      status = 'active',
      is_primary = true,
      updated_at = now()
  where user_id = anna_user_id
    and organization_id = kyser_id;

  select id into osvaldo_membership_id
  from public.memberships
  where user_id = osvaldo_user_id
    and organization_id = bello_id;

  select id into obsolete_osvaldo_membership_id
  from public.memberships
  where user_id = osvaldo_user_id
    and organization_id = kyser_id;

  if osvaldo_membership_id is null then
    raise exception 'No se encontro la membresia principal de Osvaldo';
  end if;

  update public.memberships
  set role = 'master_broker_admin',
      status = 'active',
      is_primary = true,
      updated_at = now()
  where id = osvaldo_membership_id;

  if obsolete_osvaldo_membership_id is not null then
    update public.memberships
    set status = 'revoked',
        is_primary = false,
        updated_at = now()
    where id = obsolete_osvaldo_membership_id;
  end if;

  insert into public.project_access (
    organization_id, project_id, grantee_membership_id, access_level
  )
  select p.organization_id, p.id, osvaldo_membership_id, 'manage'
  from public.projects p
  where p.developer_organization_id in (kyser_id, cana_rock_id)
    and not exists (
      select 1
      from public.project_access pa
      where pa.project_id = p.id
        and pa.grantee_membership_id = osvaldo_membership_id
    );

  insert into public.organization_relationships (
    source_organization_id,
    target_organization_id,
    relationship_type,
    status,
    starts_at,
    metadata
  )
  select source_id, target_id, 'master_broker_for', 'active', now(), metadata
  from (
    values
      (bello_id, kyser_id, jsonb_build_object('scope', 'assigned_projects')),
      (bello_id, cana_rock_id, jsonb_build_object('scope', 'assigned_projects')),
      (hp_id, kyser_id, jsonb_build_object('scope', 'cipres_residences'))
  ) as relationships(source_id, target_id, metadata)
  where target_id is not null
  on conflict (source_organization_id, target_organization_id, relationship_type)
  do update set
    status = 'active',
    starts_at = coalesce(public.organization_relationships.starts_at, excluded.starts_at),
    ends_at = null,
    metadata = excluded.metadata,
    updated_at = now();
end
$$;
