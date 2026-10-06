-- A reviewed payment turns an approved temporary hold into a permanent
-- reservation. The evidence is preserved and the unit is never released by
-- the temporary-hold expiry job after this point.
create or replace function public.review_reservation_payment(
  target_submission_id bigint,
  target_decision text,
  target_notes text default null
)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  payment_row record;
  actor uuid := auth.uid();
begin
  if actor is null then raise exception 'Debes iniciar sesión.'; end if;
  if target_decision not in ('approve', 'reject') then raise exception 'Decisión inválida.'; end if;

  select ps.id, ps.organization_id, ps.reservation_id, ps.reservation_request_id,
         ps.status, res.unit_id, res.status as reservation_status,
         rr.status as request_status
    into payment_row
    from public.reservation_payment_submissions ps
    join public.reservations res on res.id = ps.reservation_id
    join public.reservation_requests rr on rr.id = ps.reservation_request_id
   where ps.id = target_submission_id
   for update of ps, res, rr;

  if not found then raise exception 'Comprobante no encontrado.'; end if;
  if payment_row.status <> 'pending' then raise exception 'Este comprobante ya fue revisado.'; end if;
  if not (select private.has_org_role(payment_row.organization_id, array['super_admin','master_broker_admin']::text[])) then
    raise exception 'No tienes permisos para verificar este pago.';
  end if;

  update public.reservation_payment_submissions
     set status = case when target_decision = 'approve' then 'approved' else 'rejected' end,
         reviewed_by = actor,
         reviewed_at = now(),
         review_notes = nullif(btrim(target_notes), '')
   where id = target_submission_id;

  if target_decision = 'reject' then
    return jsonb_build_object('submission_id', target_submission_id, 'status', 'rejected');
  end if;

  if payment_row.reservation_status <> 'active' or payment_row.request_status <> 'approved' then
    raise exception 'La reserva ya no está activa.';
  end if;

  update public.reservations
     set reservation_type = 'payment_confirmed', expires_at = null
   where id = payment_row.reservation_id;
  update public.reservation_requests
     set reservation_type = 'payment_confirmed', expires_at = null
   where id = payment_row.reservation_request_id;
  update public.units set status = 'reserved', reservation_expires_at = null
   where id = payment_row.unit_id;

  insert into public.unit_status_history (organization_id, unit_id, from_status, to_status, reason, source, changed_by)
  values (payment_row.organization_id, payment_row.unit_id, 'reserved', 'reserved', 'Pago de reserva verificado; reserva confirmada', 'reservation_payment_review', actor);
  insert into public.audit_events (organization_id, actor_user_id, entity_type, entity_id, action, metadata)
  values (payment_row.organization_id, actor, 'reservation', payment_row.reservation_id::text, 'reservation_payment_confirmed', jsonb_build_object('submission_id', target_submission_id));

  return jsonb_build_object('submission_id', target_submission_id, 'status', 'approved', 'reservation_type', 'payment_confirmed');
end;
$$;

revoke execute on function public.review_reservation_payment(bigint, text, text) from public, anon;
grant execute on function public.review_reservation_payment(bigint, text, text) to authenticated;
