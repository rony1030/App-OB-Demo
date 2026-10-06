-- Documents belong to the client file, not to the broker or the project.
create table if not exists public.client_documents (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  contact_id bigint not null references public.contacts(id) on delete cascade,
  opportunity_id bigint references public.opportunities(id) on delete set null,
  reservation_request_id bigint references public.reservation_requests(id) on delete set null,
  document_type text not null default 'other'
    check (document_type in ('id_card', 'proof_of_funds', 'contract', 'payment_receipt', 'other')),
  title text not null,
  file_name text not null,
  storage_bucket text not null default 'private-documents',
  storage_path text not null unique,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 15728640),
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists client_documents_contact_idx on public.client_documents (contact_id, created_at desc);
create index if not exists client_documents_reservation_idx on public.client_documents (reservation_request_id, created_at desc);
alter table public.client_documents enable row level security;
grant select, insert on public.client_documents to authenticated;

create policy client_documents_org_select on public.client_documents
  for select to authenticated using ((select private.has_org_role(organization_id, null)));
create policy client_documents_org_insert on public.client_documents
  for insert to authenticated with check ((select private.has_org_role(organization_id, array[
    'super_admin','master_broker_admin','master_broker_operations','agency_admin','agency_support','broker_agent'
  ]::text[])));
