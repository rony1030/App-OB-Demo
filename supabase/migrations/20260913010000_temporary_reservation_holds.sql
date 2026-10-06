-- Reservations have two business states: a temporary operational hold and a
-- confirmed reservation backed by the required payment/documents.
create extension if not exists pg_cron;

alter table public.reservation_requests
  add column if not exists reservation_type text not null default 'temporary_hold'
  check (reservation_type in ('temporary_hold', 'payment_confirmed'));
alter table public.reservations
  add column if not exists reservation_type text not null default 'temporary_hold'
  check (reservation_type in ('temporary_hold', 'payment_confirmed'));

create index if not exists reservations_active_expiry_idx
  on public.reservations (status, expires_at)
  where status = 'active';

-- Replace the approval workflow with a 24-hour temporary hold. A request is
-- still only a request until an administrator accepts it.
create or replace function public.review_reservation_request(
  target_request_id bigint,
  target_decision text,
  target_reason text default null
)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  request_row record;
  actor uuid := auth.uid();
  hold_until timestamptz := now() + interval '24 hours';
begin
  if actor is null then raise exception 'Debes iniciar sesión.'; end if;
  if target_decision not in ('approve', 'reject') then raise exception 'Decisión inválida.'; end if;
  select rr.id, rr.organization_id, rr.unit_id, rr.requested_by_membership_id, rr.status, u.status as unit_status
    into request_row
    from public.reservation_requests rr join public.units u on u.id = rr.unit_id
   where rr.id = target_request_id for update of rr, u;
  if not found then raise exception 'Solicitud no encontrada.'; end if;
  if request_row.status <> 'pending' then raise exception 'La solicitud ya fue procesada.'; end if;
  if not (select private.has_org_role(request_row.organization_id, array['super_admin','master_broker_admin']::text[])) then
    raise exception 'No tienes permisos para revisar esta solicitud.';
  end if;

  if target_decision = 'reject' then
    update public.reservation_requests set status = 'rejected', notes = coalesce(nullif(btrim(target_reason), ''), notes) where id = target_request_id;
    return jsonb_build_object('request_id', target_request_id, 'status', 'rejected');
  end if;
  if request_row.unit_status <> 'available' then raise exception 'La unidad ya no está disponible.'; end if;
  if exists (select 1 from public.reservations where unit_id = request_row.unit_id and status = 'active') then raise exception 'La unidad ya tiene una reserva activa.'; end if;

  update public.reservation_requests set status = 'approved', reservation_type = 'temporary_hold', expires_at = hold_until where id = target_request_id;
  insert into public.reservations (organization_id, reservation_request_id, unit_id, reservation_type, status, expires_at)
  values (request_row.organization_id, target_request_id, request_row.unit_id, 'temporary_hold', 'active', hold_until);
  update public.units set status = 'reserved', reservation_expires_at = hold_until where id = request_row.unit_id;
  insert into public.unit_status_history (organization_id, unit_id, from_status, to_status, reason, source, changed_by)
  values (request_row.organization_id, request_row.unit_id, 'available', 'reserved', 'Bloqueo temporal aprobado por 24 horas', 'reservation_review', actor);
  insert into public.audit_events (organization_id, actor_user_id, entity_type, entity_id, action, metadata)
  values (request_row.organization_id, actor, 'reservation_request', target_request_id, 'temporary_hold_approved', jsonb_build_object('unit_id', request_row.unit_id, 'expires_at', hold_until));
  if request_row.requested_by_membership_id is not null then
    insert into public.notifications (organization_id, membership_id, type, title, body, link)
    values (request_row.organization_id, request_row.requested_by_membership_id, 'reservation_hold_approved', 'Bloqueo temporal aprobado', 'La unidad quedó bloqueada por 24 horas. Adjunta el pago y los documentos antes de la fecha límite.', '/portal/admin/reservations');
  end if;
  return jsonb_build_object('request_id', target_request_id, 'status', 'approved', 'reservation_type', 'temporary_hold', 'expires_at', hold_until);
end;
$$;
revoke execute on function public.review_reservation_request(bigint, text, text) from public, anon;
grant execute on function public.review_reservation_request(bigint, text, text) to authenticated;

-- Runs every 15 minutes. It warns during the final four hours, then releases
-- expired temporary holds while preserving all request and audit history.
create or replace function public.process_expired_reservation_holds()
returns void language plpgsql security definer set search_path = ''
as $$
declare r record;
begin
  for r in select res.id, res.organization_id, res.reservation_request_id, res.unit_id, res.expires_at, rr.requested_by_membership_id
    from public.reservations res join public.reservation_requests rr on rr.id = res.reservation_request_id
   where res.status = 'active' and res.reservation_type = 'temporary_hold' and res.expires_at is not null
  loop
    if r.expires_at <= now() then
      update public.reservations set status = 'expired' where id = r.id and status = 'active';
      update public.reservation_requests set status = 'cancelled' where id = r.reservation_request_id and status = 'approved';
      update public.units set status = 'available', reservation_expires_at = null where id = r.unit_id and status = 'reserved';
      insert into public.unit_status_history (organization_id, unit_id, from_status, to_status, reason, source) values (r.organization_id, r.unit_id, 'reserved', 'available', 'Bloqueo temporal vencido sin pago/documentos', 'reservation_expiry');
      if r.requested_by_membership_id is not null then
        insert into public.notifications (organization_id, membership_id, type, title, body, link) values (r.organization_id, r.requested_by_membership_id, 'reservation_hold_expired', 'Unidad liberada', 'El bloqueo temporal venció sin completar el pago y los documentos requeridos.', '/portal/clientes');
      end if;
    elsif r.expires_at <= now() + interval '4 hours' and not exists (select 1 from public.notifications n where n.membership_id = r.requested_by_membership_id and n.type = 'reservation_hold_expiring' and n.created_at >= r.expires_at - interval '4 hours') then
      if r.requested_by_membership_id is not null then
        insert into public.notifications (organization_id, membership_id, type, title, body, link) values (r.organization_id, r.requested_by_membership_id, 'reservation_hold_expiring', 'Tu bloqueo vence pronto', 'Faltan menos de 4 horas para completar el pago y adjuntar los documentos. Después la unidad será liberada.', '/portal/clientes');
      end if;
    end if;
  end loop;
end;
$$;
revoke execute on function public.process_expired_reservation_holds() from public, anon, authenticated;
select cron.schedule('process-expired-reservation-holds', '*/15 * * * *', $$select public.process_expired_reservation_holds();$$)
where not exists (select 1 from cron.job where jobname = 'process-expired-reservation-holds');
