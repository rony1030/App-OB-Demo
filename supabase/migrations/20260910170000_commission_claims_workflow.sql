-- Commission release workflow. This is intentionally separate from
-- proposals, dossiers, creative assets, and fiscal invoicing.
create table public.commission_claims (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete restrict,
  project_id bigint not null references public.projects(id) on delete restrict,
  unit_id bigint references public.units(id) on delete restrict,
  opportunity_id bigint references public.opportunities(id) on delete set null,
  sale_id bigint references public.sales(id) on delete set null,
  commission_id bigint references public.commissions(id) on delete set null,
  submitted_by_membership_id bigint references public.memberships(id) on delete set null,
  status text not null default 'payment_pending' check (status in (
    'payment_pending', 'eligible', 'proforma_submitted', 'under_review',
    'correction_requested', 'approved', 'invoice_pending', 'invoice_submitted',
    'processing_payment', 'paid', 'rejected', 'cancelled'
  )),
  currency text not null default 'USD' check (currency in ('USD', 'DOP', 'EUR')),
  commission_rate numeric(6,3) check (commission_rate is null or commission_rate between 0 and 100),
  gross_commission_amount numeric(14,2) not null check (gross_commission_amount >= 0),
  released_percentage numeric(6,3) not null default 0 check (released_percentage between 0 and 100),
  released_amount numeric(14,2) not null default 0 check (released_amount >= 0),
  developer_payment_confirmed_at timestamptz,
  developer_payment_confirmed_by uuid references auth.users(id) on delete set null,
  developer_payment_reference text,
  developer_payment_notes text,
  proforma_number text,
  proforma_snapshot jsonb not null default '{}'::jsonb check (jsonb_typeof(proforma_snapshot) = 'object'),
  proforma_generated_at timestamptz,
  proforma_submitted_at timestamptz,
  final_invoice_number text,
  final_invoice_storage_bucket text,
  final_invoice_storage_path text,
  final_invoice_mime_type text,
  final_invoice_size_bytes bigint check (final_invoice_size_bytes is null or final_invoice_size_bytes >= 0),
  final_invoice_submitted_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  paid_at timestamptz,
  paid_by uuid references auth.users(id) on delete set null,
  payment_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, sale_id),
  check (released_amount <= gross_commission_amount),
  check (status not in ('eligible', 'proforma_submitted', 'under_review', 'approved', 'invoice_pending', 'invoice_submitted', 'processing_payment', 'paid') or released_percentage > 0),
  check (status <> 'paid' or paid_at is not null)
);

create index commission_claims_project_status_idx on public.commission_claims (project_id, status, updated_at desc);
create index commission_claims_org_status_idx on public.commission_claims (organization_id, status, updated_at desc);
create index commission_claims_developer_status_idx on public.commission_claims (project_id, status);

create table public.commission_claim_documents (
  id bigint generated always as identity primary key,
  claim_id bigint not null references public.commission_claims(id) on delete cascade,
  organization_id bigint not null references public.organizations(id) on delete restrict,
  document_type text not null check (document_type in ('client_payment_proof', 'proforma', 'final_invoice', 'other')),
  storage_bucket text not null default 'private-documents',
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (storage_bucket, storage_path)
);

create index commission_claim_documents_claim_idx on public.commission_claim_documents (claim_id, document_type, created_at desc);

create trigger commission_claims_set_updated_at
before update on public.commission_claims
for each row execute function private.set_updated_at();

alter table public.commission_claims enable row level security;
alter table public.commission_claim_documents enable row level security;

revoke all on table public.commission_claims from anon, authenticated;
grant select on table public.commission_claims to authenticated;
revoke all on table public.commission_claim_documents from anon, authenticated;
grant select, insert on table public.commission_claim_documents to authenticated;
grant usage, select on sequence public.commission_claims_id_seq to authenticated;
grant usage, select on sequence public.commission_claim_documents_id_seq to authenticated;

-- A claim is visible to the agency that owns it, the master broker that owns
-- the project, and the developer attached to that project.
create policy commission_claims_select
on public.commission_claims for select to authenticated
using (
  (select private.has_org_role(organization_id, null))
  or exists (
    select 1 from public.projects p
    where p.id = project_id
      and (
        (select private.has_org_role(p.organization_id, array['super_admin','master_broker_admin','master_broker_operations']::text[]))
        or (p.developer_organization_id is not null and (select private.has_org_role(p.developer_organization_id, array['super_admin','master_broker_admin','developer_admin','developer_viewer']::text[])))
      )
  )
);

create policy commission_claim_documents_select
on public.commission_claim_documents for select to authenticated
using (
  (select private.has_org_role(organization_id, null))
  or exists (
    select 1 from public.commission_claims c
    join public.projects p on p.id = c.project_id
    where c.id = claim_id
      and (select private.has_org_role(p.organization_id, array['super_admin','master_broker_admin','master_broker_operations']::text[]))
  )
);

create policy commission_claim_documents_agency_insert
on public.commission_claim_documents for insert to authenticated
with check (
  uploaded_by = (select auth.uid())
  and exists (
    select 1 from public.commission_claims c
    where c.id = claim_id
      and c.organization_id = organization_id
      and (select private.has_org_role(c.organization_id, array['super_admin','master_broker_admin','agency_admin','broker_agent']::text[]))
  )
);

create or replace function private.can_claim_agency(target_claim_id bigint)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.commission_claims c
    where c.id = target_claim_id
      and (select private.has_org_role(c.organization_id, array['super_admin','master_broker_admin','agency_admin','broker_agent']::text[]))
  );
$$;

create or replace function private.can_claim_reviewer(target_claim_id bigint)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.commission_claims c
    join public.projects p on p.id = c.project_id
    where c.id = target_claim_id
      and (select private.has_org_role(p.organization_id, array['super_admin','master_broker_admin','master_broker_operations']::text[]))
  );
$$;

create or replace function private.can_claim_developer(target_claim_id bigint)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.commission_claims c
    join public.projects p on p.id = c.project_id
    where c.id = target_claim_id
      and p.developer_organization_id is not null
      and (select private.has_org_role(p.developer_organization_id, array['super_admin','master_broker_admin','developer_admin']::text[]))
  );
$$;

revoke all on function private.can_claim_agency(bigint) from public;
revoke all on function private.can_claim_reviewer(bigint) from public;
revoke all on function private.can_claim_developer(bigint) from public;
grant execute on function private.can_claim_agency(bigint) to authenticated;
grant execute on function private.can_claim_reviewer(bigint) to authenticated;
grant execute on function private.can_claim_developer(bigint) to authenticated;

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
  return new_claim_id;
end;
$$;

create or replace function public.confirm_commission_claim_payment(
  target_claim_id bigint, target_released_percentage numeric, target_reference text default null, target_notes text default null
)
returns void language plpgsql security definer set search_path = '' as $$
declare gross_amount numeric;
begin
  if not (select private.can_claim_developer(target_claim_id)) then raise exception 'No autorizado para confirmar el pago del proyecto'; end if;
  select gross_commission_amount into gross_amount from public.commission_claims where id = target_claim_id and status in ('payment_pending','correction_requested');
  if gross_amount is null then raise exception 'La solicitud no está pendiente de confirmación de pago'; end if;
  if target_released_percentage <= 0 or target_released_percentage > 100 then raise exception 'El porcentaje liberado debe estar entre 0 y 100'; end if;
  update public.commission_claims set status = 'eligible', released_percentage = target_released_percentage, released_amount = round(gross_amount * target_released_percentage / 100, 2), developer_payment_confirmed_at = now(), developer_payment_confirmed_by = (select auth.uid()), developer_payment_reference = nullif(trim(target_reference), ''), developer_payment_notes = nullif(trim(target_notes), ''), updated_at = now() where id = target_claim_id;
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
end;
$$;

create or replace function public.review_commission_claim(target_claim_id bigint, target_decision text, target_notes text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not (select private.can_claim_reviewer(target_claim_id)) then raise exception 'No autorizado para revisar la solicitud'; end if;
  if target_decision not in ('approved','correction_requested','rejected') then raise exception 'Decisión inválida'; end if;
  update public.commission_claims set status = case when target_decision = 'approved' then 'invoice_pending' else target_decision end, reviewed_by = (select auth.uid()), reviewed_at = now(), review_notes = nullif(trim(target_notes), ''), updated_at = now() where id = target_claim_id and status in ('proforma_submitted','under_review');
  if not found then raise exception 'La proforma no está pendiente de revisión'; end if;
end;
$$;

create or replace function public.submit_commission_invoice(target_claim_id bigint, target_number text, target_bucket text, target_path text, target_mime text, target_size bigint)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not (select private.can_claim_agency(target_claim_id)) then raise exception 'No autorizado para cargar la factura'; end if;
  update public.commission_claims set status = 'invoice_submitted', final_invoice_number = nullif(trim(target_number), ''), final_invoice_storage_bucket = target_bucket, final_invoice_storage_path = target_path, final_invoice_mime_type = target_mime, final_invoice_size_bytes = target_size, final_invoice_submitted_at = now(), updated_at = now() where id = target_claim_id and status in ('approved','invoice_pending');
  if not found then raise exception 'La solicitud no está habilitada para factura'; end if;
end;
$$;

create or replace function public.mark_commission_claim_paid(target_claim_id bigint, target_reference text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not (select private.can_claim_reviewer(target_claim_id)) then raise exception 'No autorizado para registrar el pago'; end if;
  update public.commission_claims set status = 'paid', paid_at = now(), paid_by = (select auth.uid()), payment_reference = nullif(trim(target_reference), ''), updated_at = now() where id = target_claim_id and status = 'invoice_submitted';
  if not found then raise exception 'La factura no está pendiente de pago'; end if;
end;
$$;

revoke all on function public.create_commission_claim(bigint,bigint) from public;
revoke all on function public.confirm_commission_claim_payment(bigint,numeric,text,text) from public;
revoke all on function public.submit_commission_proforma(bigint,text,jsonb) from public;
revoke all on function public.review_commission_claim(bigint,text,text) from public;
revoke all on function public.submit_commission_invoice(bigint,text,text,text,text,bigint) from public;
revoke all on function public.mark_commission_claim_paid(bigint,text) from public;
grant execute on function public.create_commission_claim(bigint,bigint) to authenticated;
grant execute on function public.confirm_commission_claim_payment(bigint,numeric,text,text) to authenticated;
grant execute on function public.submit_commission_proforma(bigint,text,jsonb) to authenticated;
grant execute on function public.review_commission_claim(bigint,text,text) to authenticated;
grant execute on function public.submit_commission_invoice(bigint,text,text,text,text,bigint) to authenticated;
grant execute on function public.mark_commission_claim_paid(bigint,text) to authenticated;

comment on table public.commission_claims is 'Controlled commission release workflow, independent from proposals and fiscal invoices.';
comment on table public.commission_claim_documents is 'Private evidence and invoice files attached to a commission claim.';
