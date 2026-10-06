-- OB Brokers Team: initial multi-tenant platform schema.
-- Every exposed table has RLS enabled. Public catalog access is explicit.

create extension if not exists citext with schema extensions;

create schema if not exists private;
revoke all on schema private from public;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.organizations (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  kind text not null check (kind in ('platform', 'master_broker', 'agency', 'developer')),
  status text not null default 'active' check (status in ('active', 'suspended', 'archived')),
  legal_name text,
  tax_id text,
  contact_email extensions.citext,
  contact_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  phone text,
  avatar_path text,
  locale text not null default 'es' check (locale in ('es', 'en', 'fr')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.memberships (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in (
    'super_admin', 'master_broker_admin', 'master_broker_operations',
    'agency_admin', 'broker_agent', 'developer_admin',
    'developer_viewer', 'support_auditor'
  )),
  status text not null default 'pending' check (status in ('pending', 'active', 'suspended', 'revoked')),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index memberships_user_status_idx on public.memberships (user_id, status);
create index memberships_organization_role_idx on public.memberships (organization_id, role, status);

create or replace function private.has_org_role(target_organization_id bigint, allowed_roles text[] default null)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.memberships m
      where m.organization_id = target_organization_id
        and m.user_id = (select auth.uid())
        and m.status = 'active'
        and (allowed_roles is null or m.role = any (allowed_roles))
    );
$$;

create or replace function private.has_org_slug_role(target_slug text, allowed_roles text[] default null)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.organizations o
      join public.memberships m on m.organization_id = o.id
      where o.slug = target_slug
        and m.user_id = (select auth.uid())
        and m.status = 'active'
        and (allowed_roles is null or m.role = any (allowed_roles))
    );
$$;

revoke all on function private.has_org_role(bigint, text[]) from public;
revoke all on function private.has_org_slug_role(text, text[]) from public;
grant usage on schema private to authenticated;
grant execute on function private.has_org_role(bigint, text[]) to authenticated;
grant execute on function private.has_org_slug_role(text, text[]) to authenticated;

create table public.teams (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table public.team_members (
  team_id bigint not null references public.teams(id) on delete cascade,
  membership_id bigint not null references public.memberships(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (team_id, membership_id)
);
create index team_members_membership_idx on public.team_members (membership_id);

create table public.brand_profiles (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  logo_path text,
  logo_dark_path text,
  favicon_path text,
  primary_color text not null default '#0C094E' check (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  secondary_color text not null default '#24207A' check (secondary_color ~ '^#[0-9A-Fa-f]{6}$'),
  accent_color text not null default '#E8E8F7' check (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  surface_color text not null default '#F8F9FD' check (surface_color ~ '^#[0-9A-Fa-f]{6}$'),
  contact_email extensions.citext,
  contact_phone text,
  whatsapp_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

create unique index brand_profiles_one_default_idx
  on public.brand_profiles (organization_id) where is_default;

create table public.projects (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete restrict,
  developer_organization_id bigint references public.organizations(id) on delete restrict,
  brand_profile_id bigint references public.brand_profiles(id) on delete set null,
  slug text not null,
  name text not null,
  location text not null,
  zone text not null,
  lifecycle_status text not null check (lifecycle_status in ('pre_construction', 'under_construction', 'ready_to_deliver', 'delivered', 'paused')),
  publication_status text not null default 'draft' check (publication_status in ('draft', 'review', 'published', 'archived')),
  delivery_date date,
  description text not null default '',
  short_description text not null default '',
  starting_price numeric(14,2) check (starting_price is null or starting_price >= 0),
  currency text not null default 'USD' check (currency in ('USD', 'DOP', 'EUR')),
  commission_rate numeric(5,2) check (commission_rate is null or commission_rate between 0 and 100),
  master_broker_exclusive boolean not null default false,
  inventory_total_declared integer check (inventory_total_declared is null or inventory_total_declared >= 0),
  inventory_available_declared integer check (inventory_available_declared is null or inventory_available_declared >= 0),
  inventory_is_complete boolean not null default false,
  inventory_updated_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);
create index projects_developer_idx on public.projects (developer_organization_id);
create index projects_catalog_idx on public.projects (publication_status, zone, starting_price);

create table public.project_media (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  project_id bigint not null references public.projects(id) on delete cascade,
  kind text not null check (kind in ('hero', 'gallery', 'floor_plan', 'logo', 'document_preview')),
  storage_bucket text not null default 'public-assets',
  storage_path text not null,
  alt_text text not null default '',
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  unique (storage_bucket, storage_path)
);
create index project_media_project_order_idx on public.project_media (project_id, sort_order);

create table public.amenities (
  id bigint generated always as identity primary key,
  slug text not null unique,
  name text not null unique,
  icon text
);

create table public.project_amenities (
  project_id bigint not null references public.projects(id) on delete cascade,
  amenity_id bigint not null references public.amenities(id) on delete restrict,
  primary key (project_id, amenity_id)
);
create index project_amenities_amenity_idx on public.project_amenities (amenity_id);

create table public.project_highlights (
  id bigint generated always as identity primary key,
  project_id bigint not null references public.projects(id) on delete cascade,
  content text not null,
  sort_order integer not null default 0 check (sort_order >= 0),
  unique (project_id, sort_order)
);
create index project_highlights_project_idx on public.project_highlights (project_id, sort_order);

create table public.payment_plans (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  project_id bigint not null references public.projects(id) on delete cascade,
  name text not null,
  currency text not null default 'USD' check (currency in ('USD', 'DOP', 'EUR')),
  is_active boolean not null default true,
  valid_from date,
  valid_until date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_until is null or valid_from is null or valid_until >= valid_from),
  unique (project_id, name)
);
create index payment_plans_project_active_idx on public.payment_plans (project_id, is_active);

create table public.payment_plan_steps (
  id bigint generated always as identity primary key,
  payment_plan_id bigint not null references public.payment_plans(id) on delete cascade,
  label text not null,
  percentage numeric(6,3) check (percentage is null or percentage between 0 and 100),
  fixed_amount numeric(14,2) check (fixed_amount is null or fixed_amount >= 0),
  milestone text,
  sort_order integer not null check (sort_order >= 0),
  unique (payment_plan_id, sort_order),
  check (percentage is not null or fixed_amount is not null)
);
create index payment_plan_steps_plan_idx on public.payment_plan_steps (payment_plan_id);

create table public.typologies (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  project_id bigint not null references public.projects(id) on delete cascade,
  name text not null,
  bedrooms smallint not null default 0 check (bedrooms >= 0),
  bathrooms numeric(4,1) not null default 0 check (bathrooms >= 0),
  indoor_sqm numeric(10,2) check (indoor_sqm is null or indoor_sqm >= 0),
  terrace_sqm numeric(10,2) check (terrace_sqm is null or terrace_sqm >= 0),
  total_sqm numeric(10,2) not null check (total_sqm > 0),
  floor_plan_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, name)
);
create index typologies_project_idx on public.typologies (project_id);

create table public.units (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  project_id bigint not null references public.projects(id) on delete cascade,
  typology_id bigint references public.typologies(id) on delete set null,
  unit_code text not null,
  tower text,
  floor_level integer,
  list_price numeric(14,2) not null check (list_price >= 0),
  currency text not null default 'USD' check (currency in ('USD', 'DOP', 'EUR')),
  status text not null default 'available' check (status in ('available', 'blocked', 'separated', 'reserved', 'sold', 'withdrawn')),
  is_public boolean not null default true,
  reservation_expires_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, unit_code)
);
create index units_typology_idx on public.units (typology_id);
create index units_inventory_idx on public.units (project_id, status, list_price) where is_public;

create table public.unit_price_history (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  unit_id bigint not null references public.units(id) on delete cascade,
  price numeric(14,2) not null check (price >= 0),
  currency text not null check (currency in ('USD', 'DOP', 'EUR')),
  effective_from timestamptz not null default now(),
  effective_until timestamptz,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (effective_until is null or effective_until > effective_from)
);
create index unit_price_history_unit_time_idx on public.unit_price_history (unit_id, effective_from desc);

create table public.unit_status_history (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  unit_id bigint not null references public.units(id) on delete cascade,
  from_status text,
  to_status text not null,
  reason text,
  source text not null default 'manual',
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index unit_status_history_unit_time_idx on public.unit_status_history (unit_id, created_at desc);

create table public.project_access (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  project_id bigint not null references public.projects(id) on delete cascade,
  grantee_organization_id bigint references public.organizations(id) on delete cascade,
  grantee_team_id bigint references public.teams(id) on delete cascade,
  grantee_membership_id bigint references public.memberships(id) on delete cascade,
  access_level text not null default 'view' check (access_level in ('view', 'sell', 'manage_inventory', 'manage')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  check (num_nonnulls(grantee_organization_id, grantee_team_id, grantee_membership_id) = 1)
);
create index project_access_project_idx on public.project_access (project_id);
create index project_access_grantee_org_idx on public.project_access (grantee_organization_id) where grantee_organization_id is not null;

create table public.project_documents (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  project_id bigint not null references public.projects(id) on delete cascade,
  title text not null,
  category text not null check (category in ('commercial', 'legal', 'technical', 'banking')),
  visibility text not null default 'authorized' check (visibility in ('public', 'authorized', 'private')),
  status text not null default 'draft' check (status in ('draft', 'review', 'approved', 'published', 'replaced', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, title)
);
create index project_documents_project_idx on public.project_documents (project_id, category, status);

create table public.document_versions (
  id bigint generated always as identity primary key,
  document_id bigint not null references public.project_documents(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  storage_bucket text not null default 'private-documents',
  storage_path text not null,
  mime_type text not null,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  checksum_sha256 text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  unique (document_id, version_number),
  unique (storage_bucket, storage_path)
);
create index document_versions_document_idx on public.document_versions (document_id, version_number desc);

create table public.contacts (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  first_name text not null,
  last_name text,
  email extensions.citext,
  phone text not null,
  phone_normalized text,
  phone_last4 text check (phone_last4 is null or phone_last4 ~ '^[0-9]{4}$'),
  country text,
  preferred_language text not null default 'es' check (preferred_language in ('es', 'en', 'fr')),
  classification text,
  source text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create unique index contacts_org_email_active_idx on public.contacts (organization_id, email) where email is not null and deleted_at is null;
create index contacts_org_phone_active_idx on public.contacts (organization_id, phone_normalized) where phone_normalized is not null and deleted_at is null;
create index contacts_org_last4_active_idx on public.contacts (organization_id, phone_last4) where phone_last4 is not null and deleted_at is null;

create table public.lead_reports (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  contact_id bigint not null references public.contacts(id) on delete cascade,
  project_id bigint references public.projects(id) on delete set null,
  reported_by_membership_id bigint references public.memberships(id) on delete set null,
  protection_status text not null default 'pending' check (protection_status in ('pending', 'protected', 'conflict', 'expired', 'released')),
  protected_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index lead_reports_contact_idx on public.lead_reports (contact_id);
create index lead_reports_project_status_idx on public.lead_reports (project_id, protection_status);

create table public.opportunities (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  contact_id bigint not null references public.contacts(id) on delete cascade,
  owner_membership_id bigint references public.memberships(id) on delete set null,
  stage text not null default 'new' check (stage in ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'reservation', 'won', 'lost', 'paused')),
  priority text check (priority in ('high', 'medium', 'low', 'phase_zero')),
  budget_min numeric(14,2) check (budget_min is null or budget_min >= 0),
  budget_max numeric(14,2) check (budget_max is null or budget_max >= 0),
  currency text not null default 'USD' check (currency in ('USD', 'DOP', 'EUR')),
  objective text,
  next_follow_up_at timestamptz,
  closed_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (budget_max is null or budget_min is null or budget_max >= budget_min),
  check (stage not in ('won', 'lost') or closed_reason is not null)
);
create index opportunities_pipeline_idx on public.opportunities (organization_id, stage, updated_at desc);
create index opportunities_owner_idx on public.opportunities (owner_membership_id, stage);

create table public.opportunity_projects (
  opportunity_id bigint not null references public.opportunities(id) on delete cascade,
  project_id bigint not null references public.projects(id) on delete cascade,
  primary key (opportunity_id, project_id)
);
create index opportunity_projects_project_idx on public.opportunity_projects (project_id);

create table public.opportunity_units (
  opportunity_id bigint not null references public.opportunities(id) on delete cascade,
  unit_id bigint not null references public.units(id) on delete cascade,
  primary key (opportunity_id, unit_id)
);
create index opportunity_units_unit_idx on public.opportunity_units (unit_id);

create table public.activities (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  opportunity_id bigint references public.opportunities(id) on delete cascade,
  contact_id bigint references public.contacts(id) on delete cascade,
  kind text not null check (kind in ('call', 'email', 'whatsapp', 'meeting', 'visit', 'task', 'system')),
  subject text not null,
  details text,
  due_at timestamptz,
  completed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (opportunity_id is not null or contact_id is not null)
);
create index activities_opportunity_time_idx on public.activities (opportunity_id, created_at desc);
create index activities_due_idx on public.activities (organization_id, due_at) where completed_at is null;

create table public.notes (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  contact_id bigint references public.contacts(id) on delete cascade,
  opportunity_id bigint references public.opportunities(id) on delete cascade,
  body text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (contact_id is not null or opportunity_id is not null)
);

create table public.tags (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  name text not null,
  color text check (color is null or color ~ '^#[0-9A-Fa-f]{6}$'),
  unique (organization_id, name)
);

create table public.contact_tags (
  contact_id bigint not null references public.contacts(id) on delete cascade,
  tag_id bigint not null references public.tags(id) on delete cascade,
  primary key (contact_id, tag_id)
);
create index contact_tags_tag_idx on public.contact_tags (tag_id);

create table public.consent_preferences (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  contact_id bigint not null references public.contacts(id) on delete cascade,
  channel text not null check (channel in ('email', 'whatsapp', 'call', 'sms')),
  status text not null check (status in ('unknown', 'granted', 'denied', 'revoked')),
  source text,
  recorded_at timestamptz not null default now(),
  unique (contact_id, channel)
);

create table public.presentations (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  contact_id bigint references public.contacts(id) on delete set null,
  author_membership_id bigint references public.memberships(id) on delete set null,
  kind text not null check (kind in ('dossier', 'proposal')),
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'ready', 'sent', 'viewed', 'negotiation', 'accepted', 'expired', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index presentations_org_status_idx on public.presentations (organization_id, status, updated_at desc);

create table public.presentation_versions (
  id bigint generated always as identity primary key,
  presentation_id bigint not null references public.presentations(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  snapshot jsonb not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  published_at timestamptz,
  unique (presentation_id, version_number)
);
create index presentation_versions_presentation_idx on public.presentation_versions (presentation_id, version_number desc);

create table public.shared_links (
  id bigint generated always as identity primary key,
  presentation_version_id bigint not null references public.presentation_versions(id) on delete cascade,
  token text not null unique default encode(extensions.gen_random_bytes(24), 'hex'),
  status text not null default 'active' check (status in ('active', 'revoked', 'expired')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table public.engagement_events (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  shared_link_id bigint references public.shared_links(id) on delete set null,
  event_type text not null check (event_type in ('opened', 'viewed', 'downloaded', 'clicked', 'requested_contact')),
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);
create index engagement_events_link_time_idx on public.engagement_events (shared_link_id, occurred_at desc);

create table public.reservation_requests (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  opportunity_id bigint references public.opportunities(id) on delete set null,
  unit_id bigint not null references public.units(id) on delete restrict,
  requested_by_membership_id bigint references public.memberships(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'correction_requested', 'approved', 'rejected', 'cancelled')),
  expires_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index reservation_requests_unit_status_idx on public.reservation_requests (unit_id, status);

create table public.reservations (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  reservation_request_id bigint not null unique references public.reservation_requests(id) on delete restrict,
  unit_id bigint not null references public.units(id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'expired', 'cancelled', 'converted')),
  reserved_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index reservations_one_active_per_unit_idx on public.reservations (unit_id) where status = 'active';

create table public.sales (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  reservation_id bigint unique references public.reservations(id) on delete set null,
  unit_id bigint not null references public.units(id) on delete restrict,
  contact_id bigint not null references public.contacts(id) on delete restrict,
  sale_price numeric(14,2) not null check (sale_price >= 0),
  currency text not null check (currency in ('USD', 'DOP', 'EUR')),
  closed_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index sales_org_closed_idx on public.sales (organization_id, closed_at desc);

create table public.commissions (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  sale_id bigint not null references public.sales(id) on delete cascade,
  gross_amount numeric(14,2) not null check (gross_amount >= 0),
  currency text not null check (currency in ('USD', 'DOP', 'EUR')),
  status text not null default 'estimated' check (status in ('estimated', 'approved', 'invoiced', 'paid', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index commissions_sale_idx on public.commissions (sale_id);

create table public.commission_participants (
  id bigint generated always as identity primary key,
  commission_id bigint not null references public.commissions(id) on delete cascade,
  organization_id bigint references public.organizations(id) on delete restrict,
  membership_id bigint references public.memberships(id) on delete restrict,
  percentage numeric(6,3) not null check (percentage between 0 and 100),
  amount numeric(14,2) not null check (amount >= 0),
  check (num_nonnulls(organization_id, membership_id) = 1)
);
create index commission_participants_commission_idx on public.commission_participants (commission_id);

create table public.signature_documents (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  title text not null,
  source_document_version_id bigint references public.document_versions(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'pending', 'partially_signed', 'completed', 'cancelled')),
  final_storage_path text,
  document_hash text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.signature_signers (
  id bigint generated always as identity primary key,
  signature_document_id bigint not null references public.signature_documents(id) on delete cascade,
  name text not null,
  email extensions.citext not null,
  phone text,
  signer_role text,
  sign_order integer not null check (sign_order > 0),
  status text not null default 'pending' check (status in ('pending', 'signed', 'declined')),
  signing_token_hash text not null,
  signed_at timestamptz,
  signer_ip inet,
  unique (signature_document_id, sign_order)
);

create table public.signature_fields (
  id bigint generated always as identity primary key,
  signer_id bigint not null references public.signature_signers(id) on delete cascade,
  page_number integer not null check (page_number > 0),
  x numeric(6,3) not null check (x between 0 and 100),
  y numeric(6,3) not null check (y between 0 and 100),
  width numeric(6,3) not null check (width > 0 and width <= 100),
  height numeric(6,3) not null check (height > 0 and height <= 100),
  field_type text not null check (field_type in ('signature', 'initials', 'stamp', 'date', 'text')),
  label text,
  value text
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  occurred_at timestamptz not null default now(),
  request_id uuid,
  ip_address inet,
  metadata jsonb not null default '{}'::jsonb
);
create index audit_events_org_time_idx on public.audit_events (organization_id, occurred_at desc);
create index audit_events_entity_idx on public.audit_events (entity_type, entity_id, occurred_at desc);

-- Automatic updated_at maintenance.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'organizations','profiles','memberships','teams','brand_profiles','projects',
    'payment_plans','typologies','units','project_documents','contacts',
    'lead_reports','opportunities','notes','presentations','reservation_requests',
    'reservations','commissions','signature_documents'
  ] loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function private.set_updated_at()',
      table_name || '_set_updated_at', table_name
    );
  end loop;
end $$;

-- RLS is enabled on every application table, including child and junction tables.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'organizations','profiles','memberships','teams','team_members','brand_profiles','projects',
    'project_media','amenities','project_amenities','project_highlights','payment_plans','payment_plan_steps',
    'typologies','units','unit_price_history','unit_status_history','project_access',
    'project_documents','document_versions','contacts','lead_reports','opportunities',
    'opportunity_projects','opportunity_units','activities','notes','tags','contact_tags',
    'consent_preferences','presentations','presentation_versions','shared_links',
    'engagement_events','reservation_requests','reservations','sales','commissions',
    'commission_participants','signature_documents','signature_signers','signature_fields',
    'audit_events'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end $$;

-- Tenant tables share one conservative baseline: members read, privileged roles write.
do $$
declare table_name text;
declare writer_roles text := 'array[''super_admin'',''master_broker_admin'',''master_broker_operations'',''agency_admin'',''developer_admin'']::text[]';
begin
  foreach table_name in array array[
    'teams','brand_profiles','projects','project_media','payment_plans','typologies','units',
    'unit_price_history','unit_status_history','project_access','project_documents','contacts',
    'lead_reports','opportunities','activities','notes','tags','consent_preferences',
    'presentations','engagement_events','reservation_requests','reservations','sales',
    'commissions','signature_documents','audit_events'
  ] loop
    execute format('create policy %I on public.%I for select to authenticated using ((select private.has_org_role(organization_id, null)))', table_name || '_member_select', table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select private.has_org_role(organization_id, %s)))', table_name || '_privileged_insert', table_name, writer_roles);
    execute format('create policy %I on public.%I for update to authenticated using ((select private.has_org_role(organization_id, %s))) with check ((select private.has_org_role(organization_id, %s)))', table_name || '_privileged_update', table_name, writer_roles, writer_roles);
    if table_name <> 'audit_events' then
      execute format('create policy %I on public.%I for delete to authenticated using ((select private.has_org_role(organization_id, %s)))', table_name || '_privileged_delete', table_name, writer_roles);
    end if;
  end loop;
end $$;

create policy organizations_member_select on public.organizations
  for select to authenticated using ((select private.has_org_role(id, null)));
create policy organizations_admin_update on public.organizations
  for update to authenticated
  using ((select private.has_org_role(id, array['super_admin','master_broker_admin']::text[])))
  with check ((select private.has_org_role(id, array['super_admin','master_broker_admin']::text[])));

create policy profiles_self_select on public.profiles
  for select to authenticated using (user_id = (select auth.uid()));
create policy profiles_self_update on public.profiles
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy memberships_self_or_admin_select on public.memberships
  for select to authenticated
  using (user_id = (select auth.uid()) or (select private.has_org_role(organization_id, array['super_admin','master_broker_admin','agency_admin','developer_admin']::text[])));
create policy memberships_admin_insert on public.memberships
  for insert to authenticated
  with check ((select private.has_org_role(organization_id, array['super_admin','master_broker_admin','agency_admin','developer_admin']::text[])));
create policy memberships_admin_update on public.memberships
  for update to authenticated
  using ((select private.has_org_role(organization_id, array['super_admin','master_broker_admin','agency_admin','developer_admin']::text[])))
  with check ((select private.has_org_role(organization_id, array['super_admin','master_broker_admin','agency_admin','developer_admin']::text[])));

-- Brokers can create and update CRM work inside their own active organization.
create policy contacts_member_insert on public.contacts for insert to authenticated
  with check ((select private.has_org_role(organization_id, array['broker_agent']::text[])));
create policy opportunities_member_insert on public.opportunities for insert to authenticated
  with check ((select private.has_org_role(organization_id, array['broker_agent']::text[])));
create policy opportunities_member_update on public.opportunities for update to authenticated
  using ((select private.has_org_role(organization_id, array['broker_agent']::text[])))
  with check ((select private.has_org_role(organization_id, array['broker_agent']::text[])));
create policy lead_reports_member_insert on public.lead_reports for insert to authenticated
  with check ((select private.has_org_role(organization_id, array['broker_agent']::text[])));
create policy presentations_member_insert on public.presentations for insert to authenticated
  with check ((select private.has_org_role(organization_id, array['broker_agent']::text[])));

-- Explicit anonymous catalog access; everything else stays closed by default.
create policy projects_public_catalog on public.projects for select to anon, authenticated
  using (publication_status = 'published');
create policy project_media_public_catalog on public.project_media for select to anon, authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.publication_status = 'published'));
create policy amenities_public_catalog on public.amenities for select to anon, authenticated
  using (exists (select 1 from public.project_amenities pa join public.projects p on p.id = pa.project_id where pa.amenity_id = id and p.publication_status = 'published'));
create policy project_amenities_public_catalog on public.project_amenities for select to anon, authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.publication_status = 'published'));
create policy project_highlights_public_catalog on public.project_highlights for select to anon, authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.publication_status = 'published'));
create policy payment_plans_public_catalog on public.payment_plans for select to anon, authenticated
  using (is_active and exists (select 1 from public.projects p where p.id = project_id and p.publication_status = 'published'));
create policy payment_plan_steps_public_catalog on public.payment_plan_steps for select to anon, authenticated
  using (exists (select 1 from public.payment_plans pp join public.projects p on p.id = pp.project_id where pp.id = payment_plan_id and pp.is_active and p.publication_status = 'published'));
create policy typologies_public_catalog on public.typologies for select to anon, authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.publication_status = 'published'));
create policy units_public_catalog on public.units for select to anon, authenticated
  using (is_public and exists (select 1 from public.projects p where p.id = project_id and p.publication_status = 'published'));
create policy brand_profiles_public_catalog on public.brand_profiles for select to anon, authenticated
  using (exists (select 1 from public.projects p where p.brand_profile_id = id and p.publication_status = 'published'));

-- New Supabase projects no longer expose tables automatically. Grants are intentional.
revoke all on all tables in schema public from anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on public.projects, public.project_media, public.amenities, public.project_amenities, public.project_highlights,
  public.payment_plans, public.payment_plan_steps, public.typologies, public.units,
  public.brand_profiles to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Storage layout: public brand/project media and private business documents.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('public-assets', 'public-assets', true, 10485760, array['image/png','image/jpeg','image/webp','image/svg+xml']),
  ('private-documents', 'private-documents', false, 52428800, array['application/pdf','image/png','image/jpeg','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy public_assets_read on storage.objects
  for select to anon, authenticated using (bucket_id = 'public-assets');
create policy public_assets_member_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'public-assets' and (select private.has_org_slug_role((storage.foldername(name))[1], array['super_admin','master_broker_admin','master_broker_operations','developer_admin']::text[])));
create policy public_assets_member_update on storage.objects
  for update to authenticated
  using (bucket_id = 'public-assets' and (select private.has_org_slug_role((storage.foldername(name))[1], array['super_admin','master_broker_admin','master_broker_operations','developer_admin']::text[])))
  with check (bucket_id = 'public-assets' and (select private.has_org_slug_role((storage.foldername(name))[1], array['super_admin','master_broker_admin','master_broker_operations','developer_admin']::text[])));
create policy public_assets_member_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'public-assets' and (select private.has_org_slug_role((storage.foldername(name))[1], array['super_admin','master_broker_admin','master_broker_operations','developer_admin']::text[])));
create policy private_documents_member_select on storage.objects
  for select to authenticated
  using (bucket_id = 'private-documents' and (select private.has_org_slug_role((storage.foldername(name))[1], null)));
create policy private_documents_member_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'private-documents' and (select private.has_org_slug_role((storage.foldername(name))[1], array['super_admin','master_broker_admin','master_broker_operations','developer_admin']::text[])));

comment on schema private is 'Non-exposed authorization and trigger helpers.';
comment on table public.audit_events is 'Append-only business audit trail; DELETE has no RLS policy.';
comment on table public.presentation_versions is 'Immutable snapshots of published dossiers and proposals.';
