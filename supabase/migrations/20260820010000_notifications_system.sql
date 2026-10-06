-- Real notifications system: one row per recipient membership, created via
-- a single security-definer entry point (notify_org_admins) rather than
-- direct table writes, so both anon (public "Solicitar Acceso" form) and
-- authenticated server actions can safely trigger a notification without
-- needing broad INSERT policies on the table itself.

create table public.notifications (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  membership_id bigint not null references public.memberships(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null default '',
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_org_idx on public.notifications (organization_id);
create index notifications_membership_unread_idx on public.notifications (membership_id, read_at, created_at desc);

alter table public.notifications enable row level security;

create policy notifications_own_select on public.notifications for select to authenticated
  using (exists (
    select 1 from public.memberships m where m.id = membership_id and m.user_id = (select auth.uid())
  ));

create policy notifications_own_update on public.notifications for update to authenticated
  using (exists (
    select 1 from public.memberships m where m.id = membership_id and m.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.memberships m where m.id = membership_id and m.user_id = (select auth.uid())
  ));

grant select, update on public.notifications to authenticated;
grant usage, select on public.notifications_id_seq to authenticated;

-- Fans a notification out to every active admin-role membership (super_admin,
-- master_broker_admin, master_broker_operations) of the given organization.
-- Runs as owner (bypasses RLS) so it can be the *only* write path into
-- notifications — no direct INSERT policy is granted to anon/authenticated.
create or replace function public.notify_org_admins(
  target_organization_id bigint,
  notif_type text,
  notif_title text,
  notif_body text default '',
  notif_link text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications (organization_id, membership_id, type, title, body, link)
  select target_organization_id, m.id, notif_type, notif_title, notif_body, notif_link
  from public.memberships m
  where m.organization_id = target_organization_id
    and m.status = 'active'
    and m.role in ('super_admin', 'master_broker_admin', 'master_broker_operations');
end;
$$;

revoke all on function public.notify_org_admins(bigint, text, text, text, text) from public;
grant execute on function public.notify_org_admins(bigint, text, text, text, text) to anon, authenticated;

comment on function public.notify_org_admins is 'Sole write path into notifications: fans a notification out to every active admin-role membership of an organization.';

-- Extend the existing lot-reservation RPC to notify org admins when a lot is
-- reserved, instead of adding a second round-trip call from the client.
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
  v_lot_code text;
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

  select l.status, l.project_id, l.lot_code into v_lot_status, v_lot_project_id, v_lot_code
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

  perform public.notify_org_admins(
    v_org_id,
    'lot_reserved',
    format('Lote %s reservado', v_lot_code),
    format('Se reservó el lote %s por %s días.', v_lot_code, v_hold_days),
    null
  );

  return query select v_request_id, v_reservation_id;
end;
$$;
