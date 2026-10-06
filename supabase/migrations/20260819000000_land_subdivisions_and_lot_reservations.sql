-- Visor Territorial: land-subdivision projects (lots) with polygon geometry,
-- plus a formal lot reservation flow reusing reservation_requests/reservations.

-- 1. Distinguish project type. Existing rows default to 'building' (no-op for
--    the current catalog of unit-based projects).
alter table public.projects
  add column project_type text not null default 'building'
    check (project_type in ('building', 'land_subdivision'));

-- 2. Lots: modeled on public.units, but with polygon geometry (no PostGIS in
--    this project -- jsonb array of {lat,lng} points, closed ring) and a
--    "block" (manzana) instead of tower/floor.
create table public.lots (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  project_id bigint not null references public.projects(id) on delete cascade,
  lot_code text not null,
  block text,
  area_sqm numeric(10,2) not null check (area_sqm > 0),
  list_price numeric(14,2) not null check (list_price >= 0),
  currency text not null default 'USD' check (currency in ('USD', 'DOP', 'EUR')),
  status text not null default 'available' check (status in ('available', 'blocked', 'separated', 'reserved', 'sold', 'withdrawn')),
  polygon jsonb not null,
  is_public boolean not null default true,
  reservation_expires_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, lot_code)
);
create index lots_organization_id_idx on public.lots (organization_id);
create index lots_project_id_idx on public.lots (project_id);
create index lots_inventory_idx on public.lots (project_id, status, list_price) where is_public;

create trigger lots_set_updated_at before update on public.lots
  for each row execute function private.set_updated_at();

alter table public.lots enable row level security;

-- Same anon/authenticated split as units: anon sees the published catalog,
-- authenticated sees anything can_view_project() allows.
create policy lots_anon_catalog on public.lots for select to anon
  using (is_public and exists (
    select 1 from public.projects p where p.id = project_id and p.publication_status = 'published'
  ));
create policy lots_authenticated_select on public.lots for select to authenticated
  using ((select private.can_view_project(project_id)));

-- Writes stay restricted to the same privileged roles units/typologies use.
-- (Brokers reserve lots through reserve_lot() below, not direct writes.)
create policy lots_privileged_insert on public.lots for insert to authenticated
  with check ((select private.has_org_role(organization_id, array['super_admin','master_broker_admin','master_broker_operations','agency_admin','developer_admin']::text[])));
create policy lots_privileged_update on public.lots for update to authenticated
  using ((select private.has_org_role(organization_id, array['super_admin','master_broker_admin','master_broker_operations','agency_admin','developer_admin']::text[])))
  with check ((select private.has_org_role(organization_id, array['super_admin','master_broker_admin','master_broker_operations','agency_admin','developer_admin']::text[])));
create policy lots_privileged_delete on public.lots for delete to authenticated
  using ((select private.has_org_role(organization_id, array['super_admin','master_broker_admin','master_broker_operations','agency_admin','developer_admin']::text[])));

-- Defensive explicit grants (new tables created after the initial migration
-- have not needed explicit grants in this schema, implying Supabase platform
-- default privileges cover them -- these statements are a safety net in case
-- that assumption is wrong; harmless if redundant).
grant select on public.lots to anon;
grant select, insert, update, delete on public.lots to authenticated;
grant usage, select on public.lots_id_seq to authenticated;

-- 3. reservation_requests / reservations: allow targeting a lot instead of a
--    unit. Existing rows (if any) all have unit_id set, so dropping NOT NULL
--    and adding the num_nonnulls check is safe.
alter table public.reservation_requests
  alter column unit_id drop not null,
  add column lot_id bigint references public.lots(id) on delete restrict,
  add constraint reservation_requests_unit_or_lot_chk check (num_nonnulls(unit_id, lot_id) = 1);
create index reservation_requests_lot_status_idx on public.reservation_requests (lot_id, status) where lot_id is not null;

alter table public.reservations
  alter column unit_id drop not null,
  add column lot_id bigint references public.lots(id) on delete restrict,
  add constraint reservations_unit_or_lot_chk check (num_nonnulls(unit_id, lot_id) = 1);
create index reservations_lot_id_idx on public.reservations (lot_id) where lot_id is not null;
create unique index reservations_one_active_per_lot_idx on public.reservations (lot_id) where status = 'active' and lot_id is not null;

-- 4. Atomic, self-authorizing RPC for the formal reservation flow. Runs as
--    the function owner (bypasses RLS like private.can_view_project /
--    private.has_org_role already do) but performs its own authorization --
--    this avoids widening reservation_requests/reservations/lots write
--    policies to broker_agent, which would otherwise be required since the
--    existing writer_roles array on those tables excludes broker_agent.
create or replace function public.reserve_lot(
  target_lot_id bigint,
  target_opportunity_id bigint default null,
  reservation_notes text default null,
  hold_days integer default 15
)
returns table (reservation_request_id bigint, reservation_id bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_membership_id bigint;
  v_org_id bigint;
  v_lot_status text;
  v_lot_project_id bigint;
  v_request_id bigint;
  v_reservation_id bigint;
  v_hold_days integer := greatest(coalesce(hold_days, 15), 1);
begin
  select m.id, m.organization_id into v_membership_id, v_org_id
  from public.memberships m
  where m.user_id = (select auth.uid()) and m.status = 'active'
  order by m.is_primary desc
  limit 1;

  if v_membership_id is null then
    raise exception 'No active membership for current user.' using errcode = '42501';
  end if;

  select l.status, l.project_id into v_lot_status, v_lot_project_id
  from public.lots l
  where l.id = target_lot_id
  for update;

  if v_lot_project_id is null then
    raise exception 'Lot % not found.', target_lot_id using errcode = 'P0002';
  end if;

  if not (select private.can_view_project(v_lot_project_id)) then
    raise exception 'Not authorized to view this project.' using errcode = '42501';
  end if;

  if v_lot_status <> 'available' then
    raise exception 'Lot is not available (status=%).', v_lot_status using errcode = 'P0001';
  end if;

  insert into public.reservation_requests (organization_id, opportunity_id, lot_id, requested_by_membership_id, status, notes, expires_at)
  values (v_org_id, target_opportunity_id, target_lot_id, v_membership_id, 'approved', reservation_notes, now() + make_interval(days => v_hold_days))
  returning id into v_request_id;

  insert into public.reservations (organization_id, reservation_request_id, lot_id, status, reserved_at, expires_at)
  values (v_org_id, v_request_id, target_lot_id, 'active', now(), now() + make_interval(days => v_hold_days))
  returning id into v_reservation_id;

  update public.lots
  set status = 'reserved', reservation_expires_at = now() + make_interval(days => v_hold_days)
  where id = target_lot_id;

  return query select v_request_id, v_reservation_id;
end;
$$;

revoke all on function public.reserve_lot(bigint, bigint, text, integer) from public;
grant execute on function public.reserve_lot(bigint, bigint, text, integer) to authenticated;

comment on function public.reserve_lot is 'Atomic broker-facing lot reservation: creates reservation_requests + reservations and flips lots.status, bypassing the admin-only write policies on those tables via internal authorization checks.';

-- 5. Demo data: one land_subdivision project with a 4x4 lot grid. Defensive
--    against seed.sql never having run on this database (db push does not
--    execute seed.sql) -- resolves the master-broker org by slug, falls back
--    to any org with kind='master_broker', and skips the seed entirely
--    (raise notice, no failure) if none exists.
do $$
declare
  ob_org_id bigint;
  developer_org_id bigint;
  land_project_id bigint;
  plan_id bigint;
  center_lat numeric := 18.4515;
  center_lng numeric := -69.6081;
  lot_w_deg numeric := 0.00028;  -- ~30m of longitude at this latitude
  lot_h_deg numeric := 0.00018;  -- ~20m of latitude
  gap_deg numeric := 0.00006;    -- ~6-7m street gap between lots
  lot_area_sqm numeric := 600;
  cols integer := 4;
  rows_ integer := 4;
  r integer;
  c integer;
  idx integer := 0;
  base_lat numeric;
  base_lng numeric;
  lot_status text;
  polygon_json jsonb;
begin
  select id into ob_org_id from public.organizations where slug = 'ob-brokers-team';
  if ob_org_id is null then
    select id into ob_org_id from public.organizations where kind = 'master_broker' order by id limit 1;
  end if;

  if ob_org_id is null then
    raise notice 'Skipping land_subdivision demo seed: no master_broker organization found.';
    return;
  end if;

  select id into developer_org_id from public.organizations where slug = 'urbania-desarrollo';

  insert into public.projects (
    organization_id, developer_organization_id, slug, name, location, zone,
    project_type, lifecycle_status, publication_status, description, short_description,
    starting_price, currency, commission_rate,
    inventory_total_declared, inventory_available_declared, inventory_is_complete,
    inventory_updated_at, published_at
  ) values (
    ob_org_id, developer_org_id, 'residencial-las-palmas', 'Residencial Las Palmas', 'Boca Chica, Santo Domingo Este', 'Este',
    'land_subdivision', 'pre_construction', 'published',
    'Proyecto de solares residenciales de demostracion con visor territorial interactivo sobre imagenes satelitales.',
    'Solares urbanizados listos para construir, a minutos de la autopista Las Americas.',
    38000, 'USD', 5,
    16, 16, true, now(), now()
  )
  on conflict (organization_id, slug) do update set
    project_type = excluded.project_type,
    lifecycle_status = excluded.lifecycle_status,
    publication_status = excluded.publication_status,
    updated_at = now()
  returning id into land_project_id;

  insert into public.project_highlights (project_id, content, sort_order)
  values
    (land_project_id, 'Solares con titulos individuales listos para transferencia', 0),
    (land_project_id, 'Calles asfaltadas y tendido electrico subterraneo', 1),
    (land_project_id, 'A 10 minutos del Aeropuerto Internacional de Las Americas', 2)
  on conflict (project_id, sort_order) do update set content = excluded.content;

  insert into public.payment_plans (organization_id, project_id, name, currency, is_active)
  values (ob_org_id, land_project_id, 'Plan estandar', 'USD', true)
  on conflict (project_id, name) do update set is_active = excluded.is_active
  returning id into plan_id;

  insert into public.payment_plan_steps (payment_plan_id, label, fixed_amount, percentage, milestone, sort_order)
  values
    (plan_id, 'Reserva', 1000, null, 'Al reservar', 0),
    (plan_id, 'A la firma', null, 30, 'Firma del contrato', 1),
    (plan_id, 'Contra entrega de titulo', null, 70, 'Entrega de titulo', 2)
  on conflict (payment_plan_id, sort_order) do update set label = excluded.label;

  for r in 0..(rows_ - 1) loop
    for c in 0..(cols - 1) loop
      idx := idx + 1;
      base_lat := center_lat + r * (lot_h_deg + gap_deg);
      base_lng := center_lng + c * (lot_w_deg + gap_deg);
      polygon_json := jsonb_build_array(
        jsonb_build_object('lat', base_lat, 'lng', base_lng),
        jsonb_build_object('lat', base_lat, 'lng', base_lng + lot_w_deg),
        jsonb_build_object('lat', base_lat + lot_h_deg, 'lng', base_lng + lot_w_deg),
        jsonb_build_object('lat', base_lat + lot_h_deg, 'lng', base_lng),
        jsonb_build_object('lat', base_lat, 'lng', base_lng)
      );
      lot_status := case when idx in (3, 9, 14) then 'sold' when idx in (5, 11) then 'reserved' else 'available' end;

      insert into public.lots (organization_id, project_id, lot_code, block, area_sqm, list_price, currency, status, polygon, is_public)
      values (
        ob_org_id, land_project_id, format('L-%s', lpad(idx::text, 2, '0')), format('Manzana %s', chr(65 + r)),
        lot_area_sqm, 38000 + (idx * 1250), 'USD', lot_status, polygon_json, true
      )
      on conflict (project_id, lot_code) do update set
        block = excluded.block, area_sqm = excluded.area_sqm, list_price = excluded.list_price,
        status = excluded.status, polygon = excluded.polygon, updated_at = now();
    end loop;
  end loop;
end $$;
