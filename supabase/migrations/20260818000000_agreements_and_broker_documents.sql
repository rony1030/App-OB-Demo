-- Collaboration agreements (general Broker<->Master Broker + optional
-- per-project) and broker compliance documents (license/ID/insurance, etc.)
-- that expire and require re-upload. Reuses the existing generic e-signature
-- engine (signature_documents/signature_signers/signature_fields) for the
-- actual signing mechanics; this migration adds the business layer on top
-- plus the RLS needed for the signing broker (an external organization from
-- the issuer's point of view) to see and act on their own records.

-- signature_documents needs a source PDF that is not tied to project_documents,
-- because general agreements (no project) cannot reference a row that requires
-- project_id not null.
alter table public.signature_documents
  add column if not exists source_storage_bucket text not null default 'private-documents',
  add column if not exists source_storage_path text;

-- Vigencia configurable por cada Master Broker.
create table public.organization_agreement_settings (
  organization_id bigint primary key references public.organizations(id) on delete cascade,
  default_valid_months integer not null default 12 check (default_valid_months > 0),
  requires_project_specific boolean not null default false,
  reminder_days_before_expiry integer not null default 30 check (reminder_days_before_expiry >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.agreements (
  id bigint generated always as identity primary key,
  master_broker_organization_id bigint not null references public.organizations(id) on delete cascade,
  broker_organization_id bigint not null references public.organizations(id) on delete cascade,
  project_id bigint references public.projects(id) on delete cascade,
  kind text not null default 'general' check (kind in ('general', 'project_specific')),
  signer_membership_id bigint references public.memberships(id) on delete set null,
  valid_months integer not null check (valid_months > 0),
  status text not null default 'draft' check (status in ('draft', 'pending_signature', 'signed', 'expired', 'revoked')),
  signature_document_id bigint references public.signature_documents(id) on delete set null,
  signed_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (kind = 'general' or project_id is not null),
  check (master_broker_organization_id <> broker_organization_id)
);
create index agreements_broker_org_idx on public.agreements (broker_organization_id, status);
create index agreements_master_broker_org_idx on public.agreements (master_broker_organization_id, status);
create index agreements_project_idx on public.agreements (project_id) where project_id is not null;
create unique index agreements_general_one_active_idx on public.agreements (broker_organization_id, master_broker_organization_id)
  where kind = 'general' and status in ('draft', 'pending_signature', 'signed');
create unique index agreements_project_one_active_idx on public.agreements (broker_organization_id, project_id)
  where kind = 'project_specific' and status in ('draft', 'pending_signature', 'signed');

-- Broker compliance documents that are not the agreement itself (license, ID,
-- insurance...) but also expire and require re-upload on expiry.
create table public.broker_documents (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  membership_id bigint not null references public.memberships(id) on delete cascade,
  document_type text not null check (document_type in ('license', 'id_card', 'insurance', 'tax_certificate', 'other')),
  title text not null,
  storage_bucket text not null default 'private-documents',
  storage_path text not null,
  mime_type text not null,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  status text not null default 'submitted' check (status in ('submitted', 'approved', 'rejected', 'expired')),
  issued_at date,
  expires_at date,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (storage_bucket, storage_path)
);
create index broker_documents_membership_idx on public.broker_documents (membership_id, status);
create index broker_documents_org_expiry_idx on public.broker_documents (organization_id, expires_at);

-- updated_at maintenance, same helper used by the rest of the schema.
create trigger organization_agreement_settings_set_updated_at before update on public.organization_agreement_settings
  for each row execute function private.set_updated_at();
create trigger agreements_set_updated_at before update on public.agreements
  for each row execute function private.set_updated_at();
create trigger broker_documents_set_updated_at before update on public.broker_documents
  for each row execute function private.set_updated_at();

alter table public.organization_agreement_settings enable row level security;
alter table public.agreements enable row level security;
alter table public.broker_documents enable row level security;

-- organization_agreement_settings: standard tenant read/write pattern.
create policy organization_agreement_settings_select on public.organization_agreement_settings for select to authenticated
  using ((select private.has_org_role(organization_id, null)));
create policy organization_agreement_settings_insert on public.organization_agreement_settings for insert to authenticated
  with check ((select private.has_org_role(organization_id, array['super_admin','master_broker_admin','master_broker_operations']::text[])));
create policy organization_agreement_settings_update on public.organization_agreement_settings for update to authenticated
  using ((select private.has_org_role(organization_id, array['super_admin','master_broker_admin','master_broker_operations']::text[])))
  with check ((select private.has_org_role(organization_id, array['super_admin','master_broker_admin','master_broker_operations']::text[])));

-- agreements: visible to both sides of the relationship. Only the issuing
-- master broker can create/manage; the broker side can only transition their
-- own agreement while signing (status/signed_at/expires_at/signature_document_id
-- are set by the signing Server Action, not asserted here at the column level,
-- consistent with the trust level the rest of this schema already uses for
-- authenticated writes, e.g. opportunities_org_update).
create policy agreements_select on public.agreements for select to authenticated
  using (
    (select private.has_org_role(master_broker_organization_id, null))
    or (select private.has_org_role(broker_organization_id, null))
  );
create policy agreements_issuer_insert on public.agreements for insert to authenticated
  with check ((select private.has_org_role(master_broker_organization_id, array['super_admin','master_broker_admin','master_broker_operations']::text[])));
create policy agreements_issuer_update on public.agreements for update to authenticated
  using ((select private.has_org_role(master_broker_organization_id, array['super_admin','master_broker_admin','master_broker_operations']::text[])))
  with check ((select private.has_org_role(master_broker_organization_id, array['super_admin','master_broker_admin','master_broker_operations']::text[])));
create policy agreements_broker_sign_update on public.agreements for update to authenticated
  using ((select private.has_org_role(broker_organization_id, array['broker_agent','agency_admin','master_broker_operations']::text[])))
  with check ((select private.has_org_role(broker_organization_id, array['broker_agent','agency_admin','master_broker_operations']::text[])));

-- broker_documents: staff of the org audits its brokers; the broker manages
-- their own documents.
create policy broker_documents_select on public.broker_documents for select to authenticated
  using (
    (select private.has_org_role(organization_id, array['super_admin','master_broker_admin','master_broker_operations','agency_admin']::text[]))
    or exists (select 1 from public.memberships m where m.id = membership_id and m.user_id = (select auth.uid()))
  );
create policy broker_documents_insert on public.broker_documents for insert to authenticated
  with check (exists (select 1 from public.memberships m where m.id = membership_id and m.user_id = (select auth.uid()) and m.status = 'active'));
create policy broker_documents_update on public.broker_documents for update to authenticated
  using (
    (select private.has_org_role(organization_id, array['super_admin','master_broker_admin','master_broker_operations','agency_admin']::text[]))
    or exists (select 1 from public.memberships m where m.id = membership_id and m.user_id = (select auth.uid()))
  )
  with check (
    (select private.has_org_role(organization_id, array['super_admin','master_broker_admin','master_broker_operations','agency_admin']::text[]))
    or exists (select 1 from public.memberships m where m.id = membership_id and m.user_id = (select auth.uid()))
  );

-- Additive visibility so the signing broker (not staff of the issuing org)
-- can see their own signature_documents/signers/fields via the agreements
-- link. Existing *_org_access policies (issuer side) are untouched.
create policy signature_documents_agreement_broker_select on public.signature_documents for select to authenticated
  using (exists (
    select 1 from public.agreements a
    where a.signature_document_id = id
      and (select private.has_org_role(a.broker_organization_id, null))
  ));
create policy signature_documents_agreement_broker_update on public.signature_documents for update to authenticated
  using (exists (
    select 1 from public.agreements a
    where a.signature_document_id = id
      and (select private.has_org_role(a.broker_organization_id, array['broker_agent','agency_admin','master_broker_operations']::text[]))
  ))
  with check (exists (
    select 1 from public.agreements a
    where a.signature_document_id = id
      and (select private.has_org_role(a.broker_organization_id, array['broker_agent','agency_admin','master_broker_operations']::text[]))
  ));

create policy signature_signers_agreement_broker_select on public.signature_signers for select to authenticated
  using (exists (
    select 1 from public.agreements a
    where a.signature_document_id = signature_document_id
      and (select private.has_org_role(a.broker_organization_id, null))
  ));
create policy signature_signers_agreement_broker_update on public.signature_signers for update to authenticated
  using (
    email = (select auth.email())
    and exists (
      select 1 from public.agreements a
      where a.signature_document_id = signature_document_id
        and (select private.has_org_role(a.broker_organization_id, array['broker_agent','agency_admin','master_broker_operations']::text[]))
    )
  )
  with check (
    email = (select auth.email())
    and exists (
      select 1 from public.agreements a
      where a.signature_document_id = signature_document_id
        and (select private.has_org_role(a.broker_organization_id, array['broker_agent','agency_admin','master_broker_operations']::text[]))
    )
  );

create policy signature_fields_agreement_broker_select on public.signature_fields for select to authenticated
  using (exists (
    select 1 from public.signature_signers s
    join public.agreements a on a.signature_document_id = s.signature_document_id
    where s.id = signer_id
      and (select private.has_org_role(a.broker_organization_id, null))
  ));

-- Storage: convention {masterBrokerSlug}/agreements/{agreementId}/....
-- Reading (template + final signed PDF) is open to any active member of the
-- broker org linked via `agreements`; only the roles allowed to sign may
-- upload the stamped final PDF.
create policy private_documents_agreement_broker_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'private-documents'
    and (storage.foldername(name))[2] = 'agreements'
    and exists (
      select 1 from public.agreements a
      where a.id = nullif((storage.foldername(name))[3], '')::bigint
        and (select private.has_org_role(a.broker_organization_id, null))
    )
  );
create policy private_documents_agreement_broker_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'private-documents'
    and (storage.foldername(name))[2] = 'agreements'
    and exists (
      select 1 from public.agreements a
      where a.id = nullif((storage.foldername(name))[3], '')::bigint
        and (select private.has_org_role(a.broker_organization_id, array['broker_agent','agency_admin','master_broker_operations']::text[]))
    )
  );

-- Storage: convention {ownOrgSlug}/broker-documents/{membershipId}/....
-- The broker manages their own files; org staff can audit any broker's file.
create policy private_documents_broker_doc_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'private-documents'
    and (storage.foldername(name))[2] = 'broker-documents'
    and exists (
      select 1 from public.memberships m
      join public.organizations o on o.id = m.organization_id
      where o.slug = (storage.foldername(name))[1]
        and m.id::text = (storage.foldername(name))[3]
        and (
          (m.user_id = (select auth.uid()) and m.status = 'active')
          or (select private.has_org_role(m.organization_id, array['super_admin','master_broker_admin','master_broker_operations','agency_admin']::text[]))
        )
    )
  );
create policy private_documents_broker_doc_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'private-documents'
    and (storage.foldername(name))[2] = 'broker-documents'
    and exists (
      select 1 from public.memberships m
      join public.organizations o on o.id = m.organization_id
      where o.slug = (storage.foldername(name))[1]
        and m.id::text = (storage.foldername(name))[3]
        and m.user_id = (select auth.uid())
        and m.status = 'active'
    )
  );
