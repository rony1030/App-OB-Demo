-- Stable references make agency, agent and client records unambiguous in CRM
-- operations without exposing one agency's lead details to another.

alter table public.organizations add column if not exists public_code text;
alter table public.memberships add column if not exists public_code text;
alter table public.contacts add column if not exists public_code text;

create or replace function private.public_code_prefix(value text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  word text;
  result text := '';
begin
  for word in select regexp_split_to_table(upper(coalesce(value, '')), '[^A-Z0-9]+') loop
    if word <> '' then
      result := result || left(word, 1);
    end if;
    exit when length(result) >= 2;
  end loop;

  return rpad(nullif(left(result, 2), ''), 2, 'X');
end;
$$;

update public.organizations
set public_code = private.public_code_prefix(name) || '-' || lpad(id::text, 6, '0')
where public_code is null;

update public.memberships membership
set public_code = organization.public_code || '-A' || lpad(membership.id::text, 6, '0')
from public.organizations organization
where organization.id = membership.organization_id
  and membership.public_code is null;

update public.contacts contact
set public_code = organization.public_code || '-C' || lpad(contact.id::text, 6, '0')
from public.organizations organization
where organization.id = contact.organization_id
  and contact.public_code is null;

alter table public.organizations alter column public_code set not null;
alter table public.memberships alter column public_code set not null;
alter table public.contacts alter column public_code set not null;

create unique index if not exists organizations_public_code_key on public.organizations (public_code);
create unique index if not exists memberships_public_code_key on public.memberships (public_code);
create unique index if not exists contacts_public_code_key on public.contacts (public_code);

create or replace function private.assign_membership_public_code()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  organization_code text;
begin
  if new.public_code is null then
    select public_code into organization_code
    from public.organizations
    where id = new.organization_id;
    new.public_code := organization_code || '-A' || lpad(new.id::text, 6, '0');
  end if;
  return new;
end;
$$;

create or replace function private.assign_contact_public_code()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  organization_code text;
begin
  if new.public_code is null then
    select public_code into organization_code
    from public.organizations
    where id = new.organization_id;
    new.public_code := organization_code || '-C' || lpad(new.id::text, 6, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists memberships_assign_public_code on public.memberships;
create trigger memberships_assign_public_code
before insert on public.memberships
for each row execute function private.assign_membership_public_code();

drop trigger if exists contacts_assign_public_code on public.contacts;
create trigger contacts_assign_public_code
before insert on public.contacts
for each row execute function private.assign_contact_public_code();

-- This index is deliberately private: cross-agency duplicate detection runs
-- only in trusted server actions after role checks, never in the browser.
create table if not exists public.lead_identity_claims (
  id bigint generated always as identity primary key,
  identity_type text not null check (identity_type in ('phone', 'email')),
  normalized_value text not null,
  canonical_contact_id bigint not null references public.contacts(id) on delete cascade,
  first_report_id bigint references public.lead_reports(id) on delete set null,
  first_organization_id bigint not null references public.organizations(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (identity_type, normalized_value)
);

alter table public.lead_identity_claims enable row level security;
revoke all on public.lead_identity_claims from anon, authenticated;
revoke all on sequence public.lead_identity_claims_id_seq from anon, authenticated;

create index if not exists lead_identity_claims_canonical_contact_idx
  on public.lead_identity_claims (canonical_contact_id);
create index if not exists lead_identity_claims_first_org_idx
  on public.lead_identity_claims (first_organization_id);

create or replace function private.touch_lead_identity_claims()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists lead_identity_claims_touch_updated_at on public.lead_identity_claims;
create trigger lead_identity_claims_touch_updated_at
before update on public.lead_identity_claims
for each row execute function private.touch_lead_identity_claims();
