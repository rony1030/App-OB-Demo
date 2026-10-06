-- Atomic review workflow for administrators. A broker can request a hold,
-- but only an authorized master administrator can approve or reject it.
create or replace function public.review_reservation_request(
  target_request_id bigint,
  target_decision text,
  target_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_row record;
  actor uuid := auth.uid();
begin
  if actor is null then
    raise exception 'Debes iniciar sesión.';
  end if;
  if target_decision not in ('approve', 'reject') then
    raise exception 'Decisión inválida.';
  end if;

  select rr.id, rr.organization_id, rr.unit_id, rr.status, u.project_id, u.status as unit_status
    into request_row
    from public.reservation_requests rr
    join public.units u on u.id = rr.unit_id
   where rr.id = target_request_id
   for update of rr, u;

  if not found then
    raise exception 'Solicitud no encontrada.';
  end if;
  if request_row.status <> 'pending' then
    raise exception 'La solicitud ya fue procesada.';
  end if;
  if not (select private.has_org_role(
    request_row.organization_id,
    array['super_admin','master_broker_admin']::text[]
  )) then
    raise exception 'No tienes permisos para revisar esta solicitud.';
  end if;

  if target_decision = 'reject' then
    update public.reservation_requests
       set status = 'rejected', notes = coalesce(nullif(btrim(target_reason), ''), notes)
     where id = target_request_id;
    return jsonb_build_object('request_id', target_request_id, 'status', 'rejected');
  end if;

  if request_row.unit_status <> 'available' then
    raise exception 'La unidad ya no está disponible.';
  end if;
  if exists (select 1 from public.reservations r where r.unit_id = request_row.unit_id and r.status = 'active') then
    raise exception 'La unidad ya tiene una reserva activa.';
  end if;

  update public.reservation_requests
     set status = 'approved'
   where id = target_request_id;
  insert into public.reservations (organization_id, reservation_request_id, unit_id, status, expires_at)
  values (request_row.organization_id, target_request_id, request_row.unit_id, 'active', now() + interval '7 days');
  update public.units
     set status = 'reserved', reservation_expires_at = now() + interval '7 days'
   where id = request_row.unit_id;
  insert into public.unit_status_history (organization_id, unit_id, from_status, to_status, reason, source, changed_by)
  values (request_row.organization_id, request_row.unit_id, 'available', 'reserved', 'Solicitud de reserva aprobada', 'manual', actor);
  insert into public.audit_events (organization_id, actor_user_id, entity_type, entity_id, action, metadata)
  values (request_row.organization_id, actor, 'reservation_request', target_request_id, 'reservation_approved', jsonb_build_object('unit_id', request_row.unit_id));

  return jsonb_build_object('request_id', target_request_id, 'status', 'approved', 'unit_id', request_row.unit_id);
end;
$$;

revoke execute on function public.review_reservation_request(bigint, text, text) from public, anon;
grant execute on function public.review_reservation_request(bigint, text, text) to authenticated;
