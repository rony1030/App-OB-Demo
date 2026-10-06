-- Payments belong to a commercial stage. Reservation payment confirms the
-- hold; later payments stay in the same negotiation until the sale closes.
alter table public.reservation_payment_submissions
  add column if not exists payment_stage text not null default 'reservation'
  check (payment_stage in ('reservation', 'initial', 'construction', 'delivery'));

create index if not exists reservation_payment_submissions_stage_idx
  on public.reservation_payment_submissions (reservation_id, payment_stage, status, created_at desc);

-- Internal reviewers must be authorized for the project being reviewed. A
-- developer administrator only sees the projects assigned to that membership.
create or replace function private.can_review_operation_project(target_project_id bigint)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.projects p
    where p.id = target_project_id
      and (select private.can_view_project(p.id))
      and (
        (select private.has_org_role(p.organization_id, array['super_admin','master_broker_admin','master_broker_operations']::text[]))
        or (p.developer_organization_id is not null and
            (select private.has_org_role(p.developer_organization_id, array['super_admin','master_broker_admin','developer_admin']::text[])))
      )
  );
$$;

revoke all on function private.can_review_operation_project(bigint) from public;
grant execute on function private.can_review_operation_project(bigint) to authenticated;

create or replace function public.review_reservation_payment(
  target_submission_id bigint,
  target_decision text,
  target_notes text default null
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  payment_row record;
  actor uuid := auth.uid();
begin
  if actor is null then raise exception 'Debes iniciar sesión.'; end if;
  if target_decision not in ('approve', 'reject') then raise exception 'Decisión inválida.'; end if;

  select ps.id, ps.organization_id, ps.reservation_id, ps.reservation_request_id,
         ps.status, ps.payment_stage, res.unit_id, res.status as reservation_status,
         rr.status as request_status, u.project_id
    into payment_row
    from public.reservation_payment_submissions ps
    join public.reservations res on res.id = ps.reservation_id
    join public.reservation_requests rr on rr.id = ps.reservation_request_id
    join public.units u on u.id = res.unit_id
   where ps.id = target_submission_id
   for update of ps, res, rr;

  if not found then raise exception 'Comprobante no encontrado.'; end if;
  if payment_row.status <> 'pending' then raise exception 'Este comprobante ya fue revisado.'; end if;
  if not (select private.can_review_operation_project(payment_row.project_id)) then
    raise exception 'No tienes permisos para revisar pagos de este proyecto.';
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

  -- Subsequent payments are confirmed in the negotiation but do not alter the
  -- reservation. The final conversion is explicit and requires contract + initial.
  if payment_row.payment_stage <> 'reservation' then
    return jsonb_build_object('submission_id', target_submission_id, 'status', 'approved', 'payment_stage', payment_row.payment_stage);
  end if;

  if payment_row.reservation_status <> 'active' or payment_row.request_status <> 'approved' then
    raise exception 'La reserva ya no está activa.';
  end if;

  update public.reservations set reservation_type = 'payment_confirmed', expires_at = null where id = payment_row.reservation_id;
  update public.reservation_requests set reservation_type = 'payment_confirmed', expires_at = null where id = payment_row.reservation_request_id;
  update public.units set status = 'reserved', reservation_expires_at = null where id = payment_row.unit_id;
  insert into public.unit_status_history (organization_id, unit_id, from_status, to_status, reason, source, changed_by)
  values (payment_row.organization_id, payment_row.unit_id, 'reserved', 'reserved', 'Pago de reserva verificado; reserva confirmada', 'reservation_payment_review', actor);
  insert into public.audit_events (organization_id, actor_user_id, entity_type, entity_id, action, metadata)
  values (payment_row.organization_id, actor, 'reservation', payment_row.reservation_id::text, 'reservation_payment_confirmed', jsonb_build_object('submission_id', target_submission_id));
  return jsonb_build_object('submission_id', target_submission_id, 'status', 'approved', 'reservation_type', 'payment_confirmed');
end;
$$;

-- A sale is the end of a negotiation, never the automatic result of a
-- reservation. It requires a contract on the client file and an approved initial.
create or replace function public.confirm_sale_from_reservation(target_reservation_id bigint)
returns bigint language plpgsql security definer set search_path = '' as $$
declare
  reservation_row record;
  new_sale_id bigint;
  new_commission_id bigint;
  commission_amount numeric;
begin
  select res.id, res.organization_id, res.unit_id, res.status, res.reservation_type,
         rr.opportunity_id, opp.contact_id, u.project_id, u.list_price, u.currency,
         p.commission_rate
    into reservation_row
    from public.reservations res
    join public.reservation_requests rr on rr.id = res.reservation_request_id
    join public.opportunities opp on opp.id = rr.opportunity_id
    join public.units u on u.id = res.unit_id
    join public.projects p on p.id = u.project_id
   where res.id = target_reservation_id
   for update of res, rr, opp, u;

  if not found then raise exception 'Reserva no encontrada.'; end if;
  if not (select private.can_review_operation_project(reservation_row.project_id)) then raise exception 'No tienes permisos para cerrar esta venta.'; end if;
  if reservation_row.status <> 'active' or reservation_row.reservation_type <> 'payment_confirmed' then raise exception 'La reserva debe tener su pago de reserva confirmado.'; end if;
  if exists (select 1 from public.sales s where s.reservation_id = reservation_row.id) then raise exception 'Esta reserva ya fue convertida en venta.'; end if;
  if not exists (select 1 from public.reservation_payment_submissions ps where ps.reservation_id = reservation_row.id and ps.payment_stage = 'initial' and ps.status = 'approved') then raise exception 'Primero verifica el pago inicial.'; end if;
  if not exists (select 1 from public.client_documents d where d.contact_id = reservation_row.contact_id and d.document_type = 'contract') then raise exception 'Primero adjunta el contrato firmado al expediente del cliente.'; end if;

  insert into public.sales (organization_id, reservation_id, unit_id, contact_id, sale_price, currency, closed_at)
  values (reservation_row.organization_id, reservation_row.id, reservation_row.unit_id, reservation_row.contact_id, reservation_row.list_price, reservation_row.currency, now())
  returning id into new_sale_id;
  update public.reservations set status = 'converted' where id = reservation_row.id;
  update public.units set status = 'sold', reservation_expires_at = null where id = reservation_row.unit_id;
  update public.opportunities set stage = 'won', closed_reason = 'Contrato firmado y pago inicial confirmado', updated_at = now() where id = reservation_row.opportunity_id;
  insert into public.unit_status_history (organization_id, unit_id, from_status, to_status, reason, source, changed_by)
  values (reservation_row.organization_id, reservation_row.unit_id, 'reserved', 'sold', 'Venta confirmada con contrato e inicial verificados', 'sale_close', auth.uid());

  commission_amount := round(reservation_row.list_price * coalesce(reservation_row.commission_rate, 0) / 100, 2);
  insert into public.commissions (organization_id, sale_id, gross_amount, currency, status)
  values (reservation_row.organization_id, new_sale_id, commission_amount, reservation_row.currency, 'estimated')
  returning id into new_commission_id;
  insert into public.commission_participants (commission_id, organization_id, percentage, amount)
  values (new_commission_id, reservation_row.organization_id, 100, commission_amount);
  insert into public.audit_events (organization_id, actor_user_id, entity_type, entity_id, action, metadata)
  values (reservation_row.organization_id, auth.uid(), 'sale', new_sale_id::text, 'sale_confirmed', jsonb_build_object('reservation_id', reservation_row.id, 'opportunity_id', reservation_row.opportunity_id));
  return new_sale_id;
end;
$$;

revoke execute on function public.review_reservation_payment(bigint, text, text) from public, anon;
grant execute on function public.review_reservation_payment(bigint, text, text) to authenticated;
revoke execute on function public.confirm_sale_from_reservation(bigint) from public, anon;
grant execute on function public.confirm_sale_from_reservation(bigint) to authenticated;

-- Reservation approval uses the same project-scoped authority as payment review.
create or replace function public.review_reservation_request(
  target_request_id bigint,
  target_decision text,
  target_reason text default null
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  request_row record;
  actor uuid := auth.uid();
  hold_until timestamptz := now() + interval '24 hours';
begin
  if actor is null then raise exception 'Debes iniciar sesión.'; end if;
  if target_decision not in ('approve', 'reject') then raise exception 'Decisión inválida.'; end if;
  select rr.id, rr.organization_id, rr.unit_id, rr.requested_by_membership_id, rr.status,
         u.status as unit_status, u.project_id
    into request_row
    from public.reservation_requests rr join public.units u on u.id = rr.unit_id
   where rr.id = target_request_id
   for update of rr, u;
  if not found then raise exception 'Solicitud no encontrada.'; end if;
  if request_row.status <> 'pending' then raise exception 'La solicitud ya fue procesada.'; end if;
  if not (select private.can_review_operation_project(request_row.project_id)) then raise exception 'No tienes permisos para revisar este proyecto.'; end if;
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
  values (request_row.organization_id, request_row.unit_id, 'available', 'reserved', 'Bloqueo temporal aprobado', 'reservation_review', actor);
  insert into public.audit_events (organization_id, actor_user_id, entity_type, entity_id, action, metadata)
  values (request_row.organization_id, actor, 'reservation_request', target_request_id::text, 'temporary_hold_approved', jsonb_build_object('unit_id', request_row.unit_id, 'expires_at', hold_until));
  if request_row.requested_by_membership_id is not null then
    insert into public.notifications (organization_id, membership_id, type, title, body, link)
    values (request_row.organization_id, request_row.requested_by_membership_id, 'reservation_hold_approved', 'Bloqueo temporal aprobado', 'La unidad quedó bloqueada por 24 horas. Adjunta el pago y los documentos antes de la fecha límite.', '/portal/clientes');
  end if;
  return jsonb_build_object('request_id', target_request_id, 'status', 'approved', 'reservation_type', 'temporary_hold', 'expires_at', hold_until);
end;
$$;

revoke execute on function public.review_reservation_request(bigint, text, text) from public, anon;
grant execute on function public.review_reservation_request(bigint, text, text) to authenticated;
