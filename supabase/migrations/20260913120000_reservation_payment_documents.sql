-- Evidence submitted after a temporary hold. Records are append-only from the
-- business perspective; a rejection creates a new submission instead of
-- deleting the previous one.
create table if not exists public.reservation_payment_submissions (
  id bigint generated always as identity primary key,
  reservation_id bigint not null references public.reservations(id) on delete restrict,
  reservation_request_id bigint not null references public.reservation_requests(id) on delete restrict,
  organization_id bigint not null references public.organizations(id) on delete restrict,
  submitted_by_membership_id bigint references public.memberships(id) on delete set null,
  amount numeric(14,2) not null check (amount >= 0),
  currency text not null default 'USD' check (currency in ('USD', 'DOP', 'EUR')),
  reference text,
  paid_at timestamptz,
  storage_bucket text,
  storage_path text,
  file_name text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now()
);
create index if not exists reservation_payment_submissions_reservation_idx on public.reservation_payment_submissions (reservation_id, created_at desc);

create table if not exists public.reservation_request_attachments (
  id bigint generated always as identity primary key,
  reservation_request_id bigint not null references public.reservation_requests(id) on delete restrict,
  organization_id bigint not null references public.organizations(id) on delete restrict,
  uploaded_by_membership_id bigint references public.memberships(id) on delete set null,
  document_type text not null default 'other',
  file_name text not null,
  storage_bucket text not null default 'private-documents',
  storage_path text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes >= 0),
  created_at timestamptz not null default now()
);
create index if not exists reservation_request_attachments_request_idx on public.reservation_request_attachments (reservation_request_id, created_at desc);

alter table public.reservation_payment_submissions enable row level security;
alter table public.reservation_request_attachments enable row level security;
grant select, insert, update on public.reservation_payment_submissions to authenticated;
grant select, insert on public.reservation_request_attachments to authenticated;

create policy reservation_payment_org_access on public.reservation_payment_submissions for select to authenticated
  using ((select private.has_org_role(organization_id, null)) or exists (
    select 1 from public.reservation_requests rr join public.memberships m on m.id = rr.requested_by_membership_id
    where rr.id = reservation_request_id and m.user_id = (select auth.uid()) and m.status = 'active'
  ));
create policy reservation_payment_submitter_insert on public.reservation_payment_submissions for insert to authenticated
  with check (exists (
    select 1 from public.reservation_requests rr join public.memberships m on m.id = rr.requested_by_membership_id
    where rr.id = reservation_request_id and m.user_id = (select auth.uid()) and m.status = 'active'
  ));
create policy reservation_payment_reviewer_update on public.reservation_payment_submissions for update to authenticated
  using ((select private.has_org_role(organization_id, array['super_admin','master_broker_admin']::text[])))
  with check ((select private.has_org_role(organization_id, array['super_admin','master_broker_admin']::text[])));

create policy reservation_attachment_org_access on public.reservation_request_attachments for select to authenticated
  using ((select private.has_org_role(organization_id, null)) or exists (
    select 1 from public.reservation_requests rr join public.memberships m on m.id = rr.requested_by_membership_id
    where rr.id = reservation_request_id and m.user_id = (select auth.uid()) and m.status = 'active'
  ));
create policy reservation_attachment_submitter_insert on public.reservation_request_attachments for insert to authenticated
  with check (exists (
    select 1 from public.reservation_requests rr join public.memberships m on m.id = rr.requested_by_membership_id
    where rr.id = reservation_request_id and m.user_id = (select auth.uid()) and m.status = 'active'
  ));
