-- Estado de cuenta del inversionista: cronograma de cuotas, mora, estado de entrega y cobro jurídico.
-- Los saldos (abonado, insoluto, vencido, mora) se calculan desde estas filas; no se guardan agregados.

alter table public.reservations
  add column if not exists contract_price numeric(14,2) check (contract_price is null or contract_price >= 0),
  add column if not exists delivery_status text not null default 'in_construction'
    check (delivery_status in ('negotiation', 'in_construction', 'ready_for_delivery', 'delivered')),
  add column if not exists collection_status text not null default 'normal'
    check (collection_status in ('normal', 'legal')),
  add column if not exists legal_notes text,
  add column if not exists delivered_at date;

create table if not exists public.reservation_installments (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  reservation_id bigint not null references public.reservations(id) on delete cascade,
  sequence integer not null check (sequence > 0),
  kind text not null default 'construction'
    check (kind in ('reservation', 'initial', 'construction', 'delivery_balance', 'other')),
  concept text not null,
  due_date date not null,
  amount numeric(14,2) not null check (amount >= 0),
  paid_amount numeric(14,2) not null default 0 check (paid_amount >= 0),
  paid_at date,
  mora_amount numeric(14,2) not null default 0 check (mora_amount >= 0),
  currency text not null default 'USD' check (currency in ('USD', 'DOP', 'EUR')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (reservation_id, sequence),
  check (paid_amount <= amount)
);
create index if not exists reservation_installments_reservation_idx
  on public.reservation_installments (reservation_id, due_date);

alter table public.reservation_installments enable row level security;
grant select on public.reservation_installments to authenticated;
grant insert, update, delete on public.reservation_installments to authenticated;

create policy reservation_installments_org_select on public.reservation_installments
  for select to authenticated using ((select private.has_org_role(organization_id, null)));
create policy reservation_installments_admin_write on public.reservation_installments
  for all to authenticated
  using ((select private.has_org_role(organization_id, array['super_admin','master_broker_admin','master_broker_operations']::text[])))
  with check ((select private.has_org_role(organization_id, array['super_admin','master_broker_admin','master_broker_operations']::text[])));

-- Documentos que el cliente ve en su portal: tipos contractuales y visibilidad explícita.
alter table public.client_documents drop constraint if exists client_documents_document_type_check;
alter table public.client_documents add constraint client_documents_document_type_check
  check (document_type in (
    'id_card', 'proof_of_funds', 'contract', 'payment_receipt', 'other',
    'promesa_compraventa', 'recibo_oficial', 'carta_liquidacion', 'acta_entrega', 'aviso_cobro', 'intimacion_legal'
  ));
alter table public.client_documents
  add column if not exists visible_to_client boolean not null default false;
