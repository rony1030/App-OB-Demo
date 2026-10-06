-- Recuperada del historial remoto de Supabase (aplicada fuera de git)
-- Harden the commission workflow and keep an append-only audit trail.
revoke execute on function public.create_commission_claim(bigint,bigint) from anon;
revoke execute on function public.confirm_commission_claim_payment(bigint,numeric,text,text) from anon;
revoke execute on function public.submit_commission_proforma(bigint,text,jsonb) from anon;
revoke execute on function public.review_commission_claim(bigint,text,text) from anon;
revoke execute on function public.submit_commission_invoice(bigint,text,text,text,text,bigint) from anon;
revoke execute on function public.mark_commission_claim_paid(bigint,text) from anon;

create or replace function public.create_commission_claim(target_organization_id bigint, target_sale_id bigint)
returns bigint language plpgsql security definer set search_path = '' as $$
declare new_claim_id bigint;
declare current_membership_id bigint;
declare sale_unit_id bigint;
declare sale_project_id bigint;
declare sale_commission_id bigint;
declare sale_currency text;
declare participant_amount numeric;
declare sale_commission_rate numeric;
begin
  if (select auth.uid()) is null or not (select private.has_org_role(target_organization_id, array['super_admin','master_broker_admin','agency_admin','broker_agent']::text[])) then
    raise exception 'No autorizado para crear la solicitud de comisión';
  end if;
  select s.unit_id, u.project_id, c.id, c.currency, cp.amount, p.commission_rate
    into sale_unit_id, sale_project_id, sale_commission_id, sale_currency, participant_amount, sale_commission_rate
    from public.sales s
    join public.units u on u.id = s.unit_id
    join public.projects p on p.id = u.project_id
    join public.commissions c on c.sale_id = s.id
    join public.commission_participants cp on cp.commission_id = c.id and cp.organization_id = target_organization_id
   where s.id = target_sale_id
     and (select private.can_view_project(u.project_id));
  if sale_project_id is null or participant_amount is null then
    raise exception 'La venta no tiene una comisión asignada a esta organización';
  end if;
  select id into current_membership_id from public.memberships where organization_id = target_organization_id and user_id = (select auth.uid()) and status = 'active' limit 1;
  insert into public.commission_claims (organization_id, project_id, unit_id, sale_id, commission_id, submitted_by_membership_id, currency, commission_rate, gross_commission_amount)
  values (target_organization_id, sale_project_id, sale_unit_id, target_sale_id, sale_commission_id, current_membership_id, sale_currency, sale_commission_rate, participant_amount)
  returning id into new_claim_id;
  insert into public.audit_events (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
  values (target_organization_id, (select auth.uid()), 'commission_claim_created', 'commission_claim', new_claim_id::text, jsonb_build_object('sale_id', target_sale_id, 'project_id', sale_project_id));
  return new_claim_id;
end;
$$;

create or replace function public.confirm_commission_claim_payment(target_claim_id bigint, target_released_percentage numeric, target_reference text default null, target_notes text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare gross_amount numeric;
declare claim_org_id bigint;
declare released_amount numeric;
begin
  if not (select private.can_claim_developer(target_claim_id)) then raise exception 'No autorizado para confirmar el pago del proyecto'; end if;
  select gross_commission_amount, organization_id into gross_amount, claim_org_id from public.commission_claims where id = target_claim_id and status in ('payment_pending','correction_requested');
  if gross_amount is null then raise exception 'La solicitud no está pendiente de confirmación de pago'; end if;
  if target_released_percentage <= 0 or target_released_percentage > 100 then raise exception 'El porcentaje liberado debe estar entre 0 y 100'; end if;
  released_amount := round(gross_amount * target_released_percentage / 100, 2);
  update public.commission_claims set status = 'eligible', released_percentage = target_released_percentage, released_amount = released_amount, developer_payment_confirmed_at = now(), developer_payment_confirmed_by = (select auth.uid()), developer_payment_reference = nullif(trim(target_reference), ''), developer_payment_notes = nullif(trim(target_notes), ''), updated_at = now() where id = target_claim_id;
  insert into public.audit_events (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
  values (claim_org_id, (select auth.uid()), 'commission_payment_confirmed', 'commission_claim', target_claim_id::text, jsonb_build_object('released_percentage', target_released_percentage, 'released_amount', released_amount, 'reference', nullif(trim(target_reference), '')));
end;
$$;

create or replace function public.submit_commission_proforma(target_claim_id bigint, target_number text, target_snapshot jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare claim_amount numeric;
declare claim_currency text;
declare claim_org_id bigint;
begin
  if not (select private.can_claim_agency(target_claim_id)) then raise exception 'No autorizado para generar la proforma'; end if;
  select released_amount, currency, organization_id into claim_amount, claim_currency, claim_org_id from public.commission_claims where id = target_claim_id and status in ('eligible','correction_requested');
  if claim_amount is null then raise exception 'La solicitud no está habilitada para proforma'; end if;
  update public.commission_claims set status = 'proforma_submitted', proforma_number = nullif(trim(target_number), ''), proforma_snapshot = coalesce(target_snapshot, '{}'::jsonb) || jsonb_build_object('claim_id', target_claim_id, 'organization_id', claim_org_id, 'released_amount', claim_amount, 'currency', claim_currency), proforma_generated_at = coalesce(proforma_generated_at, now()), proforma_submitted_at = now(), updated_at = now() where id = target_claim_id;
  if not found then raise exception 'La solicitud no está habilitada para proforma'; end if;
  insert into public.audit_events (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
  values (claim_org_id, (select auth.uid()), 'commission_proforma_submitted', 'commission_claim', target_claim_id::text, jsonb_build_object('proforma_number', nullif(trim(target_number), ''), 'released_amount', claim_amount, 'currency', claim_currency));
end;
$$;

create or replace function public.review_commission_claim(target_claim_id bigint, target_decision text, target_notes text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare claim_org_id bigint;
declare next_status text;
begin
  if not (select private.can_claim_reviewer(target_claim_id)) then raise exception 'No autorizado para revisar la solicitud'; end if;
  if target_decision not in ('approved','correction_requested','rejected') then raise exception 'Decisión inválida'; end if;
  next_status := case when target_decision = 'approved' then 'invoice_pending' else target_decision end;
  select organization_id into claim_org_id from public.commission_claims where id = target_claim_id;
  update public.commission_claims set status = next_status, reviewed_by = (select auth.uid()), reviewed_at = now(), review_notes = nullif(trim(target_notes), ''), updated_at = now() where id = target_claim_id and status in ('proforma_submitted','under_review');
  if not found then raise exception 'La proforma no está pendiente de revisión'; end if;
  insert into public.audit_events (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
  values (claim_org_id, (select auth.uid()), 'commission_proforma_reviewed', 'commission_claim', target_claim_id::text, jsonb_build_object('decision', target_decision, 'status', next_status));
end;
$$;

create or replace function public.submit_commission_invoice(target_claim_id bigint, target_number text, target_bucket text, target_path text, target_mime text, target_size bigint)
returns void language plpgsql security definer set search_path = '' as $$
declare claim_org_id bigint;
declare claim_org_slug text;
begin
  if not (select private.can_claim_agency(target_claim_id)) then raise exception 'No autorizado para cargar la factura'; end if;
  if target_bucket <> 'private-documents' or target_mime not in ('application/pdf','image/png','image/jpeg') or target_size is null or target_size <= 0 or target_size > 15728640 then raise exception 'Archivo de factura inválido'; end if;
  select c.organization_id, o.slug into claim_org_id, claim_org_slug from public.commission_claims c join public.organizations o on o.id = c.organization_id where c.id = target_claim_id and c.status in ('approved','invoice_pending');
  if claim_org_id is null or target_path is null or target_path not like claim_org_slug || '/commission-claims/' || target_claim_id::text || '/%' then raise exception 'La ruta del archivo no pertenece a esta solicitud'; end if;
  update public.commission_claims set status = 'invoice_submitted', final_invoice_number = nullif(trim(target_number), ''), final_invoice_storage_bucket = target_bucket, final_invoice_storage_path = target_path, final_invoice_mime_type = target_mime, final_invoice_size_bytes = target_size, final_invoice_submitted_at = now(), updated_at = now() where id = target_claim_id and status in ('approved','invoice_pending');
  if not found then raise exception 'La solicitud no está habilitada para factura'; end if;
  insert into public.commission_claim_documents (claim_id, organization_id, document_type, storage_bucket, storage_path, file_name, mime_type, size_bytes, uploaded_by)
  values (target_claim_id, claim_org_id, 'final_invoice', target_bucket, target_path, coalesce(nullif(trim(target_number), ''), 'factura-final'), target_mime, target_size, (select auth.uid()))
  on conflict (storage_bucket, storage_path) do nothing;
  insert into public.audit_events (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
  values (claim_org_id, (select auth.uid()), 'commission_invoice_submitted', 'commission_claim', target_claim_id::text, jsonb_build_object('invoice_number', nullif(trim(target_number), ''), 'storage_path', target_path));
end;
$$;

create or replace function public.mark_commission_claim_paid(target_claim_id bigint, target_reference text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare claim_org_id bigint;
begin
  if not (select private.can_claim_reviewer(target_claim_id)) then raise exception 'No autorizado para registrar el pago'; end if;
  select organization_id into claim_org_id from public.commission_claims where id = target_claim_id and status = 'invoice_submitted';
  if claim_org_id is null then raise exception 'La factura no está pendiente de pago'; end if;
  update public.commission_claims set status = 'paid', paid_at = now(), paid_by = (select auth.uid()), payment_reference = nullif(trim(target_reference), ''), updated_at = now() where id = target_claim_id and status = 'invoice_submitted';
  insert into public.audit_events (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
  values (claim_org_id, (select auth.uid()), 'commission_claim_paid', 'commission_claim', target_claim_id::text, jsonb_build_object('reference', nullif(trim(target_reference), '')));
end;
$$;

revoke execute on function public.create_commission_claim(bigint,bigint) from anon;
revoke execute on function public.confirm_commission_claim_payment(bigint,numeric,text,text) from anon;
revoke execute on function public.submit_commission_proforma(bigint,text,jsonb) from anon;
revoke execute on function public.review_commission_claim(bigint,text,text) from anon;
revoke execute on function public.submit_commission_invoice(bigint,text,text,text,text,bigint) from anon;
revoke execute on function public.mark_commission_claim_paid(bigint,text) from anon;


