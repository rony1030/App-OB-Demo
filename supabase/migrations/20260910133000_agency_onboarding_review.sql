-- Agency invitations now collect onboarding data first and wait for
-- OB Brokers review before a CRM user is activated.

alter table public.invitations
  drop constraint if exists invitations_status_check;

alter table public.invitations
  add constraint invitations_status_check check (
    status in ('pending', 'onboarding_submitted', 'accepted', 'revoked', 'expired')
  );

create table if not exists public.agency_onboarding_submissions (
  id bigint generated always as identity primary key,
  invitation_id bigint not null references public.invitations(id) on delete cascade,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  agency_name text not null,
  legal_name text,
  tax_id text,
  legal_address text,
  contact_email extensions.citext not null,
  contact_phone text,
  representative_name text not null,
  representative_email extensions.citext not null,
  representative_phone text,
  status text not null default 'pending_review'
    check (status in ('pending_review', 'approved', 'changes_requested', 'rejected')),
  submitted_payload jsonb not null default '{}'::jsonb check (jsonb_typeof(submitted_payload) = 'object'),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (invitation_id)
);

create index if not exists agency_onboarding_submissions_org_status_idx
  on public.agency_onboarding_submissions (organization_id, status, created_at desc);

drop trigger if exists agency_onboarding_submissions_set_updated_at on public.agency_onboarding_submissions;
create trigger agency_onboarding_submissions_set_updated_at
before update on public.agency_onboarding_submissions
for each row execute function private.set_updated_at();

alter table public.agency_onboarding_submissions enable row level security;

revoke all on table public.agency_onboarding_submissions from anon, authenticated;
grant select, insert, update on table public.agency_onboarding_submissions to authenticated;
grant usage, select on sequence public.agency_onboarding_submissions_id_seq to authenticated;

create policy agency_onboarding_submissions_reviewer_select
  on public.agency_onboarding_submissions for select to authenticated
  using (
    (select private.has_org_role(organization_id, array[
      'super_admin',
      'master_broker_admin',
      'master_broker_operations'
    ]::text[]))
  );

create policy agency_onboarding_submissions_reviewer_update
  on public.agency_onboarding_submissions for update to authenticated
  using (
    (select private.has_org_role(organization_id, array[
      'super_admin',
      'master_broker_admin',
      'master_broker_operations'
    ]::text[]))
  )
  with check (
    (select private.has_org_role(organization_id, array[
      'super_admin',
      'master_broker_admin',
      'master_broker_operations'
    ]::text[]))
  );

comment on table public.agency_onboarding_submissions is
  'Agency onboarding details submitted through CRM invitations before user access is activated.';
