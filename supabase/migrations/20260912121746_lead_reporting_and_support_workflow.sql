-- Recuperada del historial remoto de Supabase (aplicada fuera de git)
-- A contact belongs to an agency. A commercial protection only exists after a separate, reviewed report against a specific development.
alter table public.lead_reports
  add column if not exists agreement_id bigint references public.agreements(id) on delete set null,
  add column if not exists work_summary text,
  add column if not exists acknowledgement_at timestamptz,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by_user_id uuid references auth.users(id) on delete set null,
  add column if not exists review_reason text;
alter table public.lead_reports add constraint lead_reports_work_summary_length check (work_summary is null or char_length(trim(work_summary)) between 30 and 4000) not valid;
create index if not exists lead_reports_org_contact_project_status_idx on public.lead_reports (organization_id, contact_id, project_id, protection_status, created_at desc);
alter table public.lead_identity_claims add column if not exists project_id bigint references public.projects(id) on delete cascade;
alter table public.lead_identity_claims drop constraint if exists lead_identity_claims_identity_type_normalized_value_key;
create unique index if not exists lead_identity_claims_project_identity_unique on public.lead_identity_claims (project_id, identity_type, normalized_value) where project_id is not null;
create index if not exists lead_identity_claims_project_idx on public.lead_identity_claims (project_id, normalized_value);
create table if not exists public.report_notification_recipients (id bigint generated always as identity primary key, organization_id bigint not null references public.organizations(id) on delete cascade, email text not null check (position('@' in email) > 1), label text, is_active boolean not null default true, created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (organization_id, email));
alter table public.report_notification_recipients enable row level security;
create policy report_notification_recipients_select on public.report_notification_recipients for select to authenticated using ((select private.has_org_role(organization_id, array['super_admin','master_broker_admin','master_broker_operations']::text[])));
create policy report_notification_recipients_write on public.report_notification_recipients for all to authenticated using ((select private.has_org_role(organization_id, array['super_admin','master_broker_admin']::text[]))) with check ((select private.has_org_role(organization_id, array['super_admin','master_broker_admin']::text[])));
create table if not exists public.support_tickets (id bigint generated always as identity primary key, organization_id bigint not null references public.organizations(id) on delete cascade, opened_by_user_id uuid references auth.users(id) on delete set null, subject text not null check (char_length(trim(subject)) between 5 and 180), description text not null check (char_length(trim(description)) between 10 and 8000), category text not null default 'consulta' check (category in ('consulta','incidente','acceso','datos','facturacion','mejora')), priority text not null default 'normal' check (priority in ('low','normal','high','urgent')), status text not null default 'open' check (status in ('open','in_progress','waiting_customer','resolved','closed')), assigned_to_user_id uuid references auth.users(id) on delete set null, resolved_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index if not exists support_tickets_org_status_idx on public.support_tickets (organization_id, status, created_at desc);
alter table public.support_tickets enable row level security;
create policy support_tickets_org_select on public.support_tickets for select to authenticated using ((select private.has_org_role(organization_id, null)));
create policy support_tickets_org_insert on public.support_tickets for insert to authenticated with check ((select private.has_org_role(organization_id, null)));
create policy support_tickets_org_update on public.support_tickets for update to authenticated using ((select private.has_org_role(organization_id, array['super_admin','master_broker_admin','master_broker_operations','agency_admin','agency_support','developer_admin','support_auditor']::text[]))) with check ((select private.has_org_role(organization_id, array['super_admin','master_broker_admin','master_broker_operations','agency_admin','agency_support','developer_admin','support_auditor']::text[])));
create table if not exists public.support_ticket_messages (id bigint generated always as identity primary key, ticket_id bigint not null references public.support_tickets(id) on delete cascade, author_user_id uuid references auth.users(id) on delete set null, body text not null check (char_length(trim(body)) between 1 and 8000), is_internal boolean not null default false, created_at timestamptz not null default now());
alter table public.support_ticket_messages enable row level security;
create policy support_ticket_messages_select on public.support_ticket_messages for select to authenticated using (exists (select 1 from public.support_tickets t where t.id = ticket_id and (select private.has_org_role(t.organization_id, null))));
create policy support_ticket_messages_insert on public.support_ticket_messages for insert to authenticated with check (exists (select 1 from public.support_tickets t where t.id = ticket_id and (select private.has_org_role(t.organization_id, null))));
