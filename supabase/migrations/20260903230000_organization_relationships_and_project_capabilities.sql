-- Multi-company relationships and granular project responsibilities.
-- Cana Rock uses these generic structures as two related organizations:
-- a master broker organization and a developer organization.

create or replace function private.can_manage_project_configuration(target_project_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.projects p
      where p.id = target_project_id
        and (
          (select private.has_org_role(
            p.organization_id,
            array['super_admin', 'master_broker_admin']::text[]
          ))
          or (
            p.developer_organization_id is not null
            and (select private.has_org_role(
              p.developer_organization_id,
              array['super_admin', 'developer_admin']::text[]
            ))
          )
        )
    );
$$;

revoke all on function private.can_manage_project_configuration(bigint) from public;
grant execute on function private.can_manage_project_configuration(bigint) to authenticated;

create table public.organization_relationships (
  id bigint generated always as identity primary key,
  source_organization_id bigint not null references public.organizations(id) on delete cascade,
  target_organization_id bigint not null references public.organizations(id) on delete cascade,
  relationship_type text not null
    check (relationship_type in ('master_broker_for', 'developer_for', 'partner_of', 'agency_of')),
  status text not null default 'pending'
    check (status in ('pending', 'active', 'suspended', 'ended')),
  starts_at timestamptz,
  ends_at timestamptz,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (source_organization_id <> target_organization_id),
  check (ends_at is null or starts_at is null or ends_at > starts_at),
  unique (source_organization_id, target_organization_id, relationship_type)
);

create index organization_relationships_target_status_idx
  on public.organization_relationships (target_organization_id, status);
create index organization_relationships_source_status_idx
  on public.organization_relationships (source_organization_id, status);

create trigger organization_relationships_set_updated_at
before update on public.organization_relationships
for each row execute function private.set_updated_at();

create table public.project_responsibilities (
  id bigint generated always as identity primary key,
  project_id bigint not null references public.projects(id) on delete cascade,
  responsible_organization_id bigint references public.organizations(id) on delete cascade,
  responsible_membership_id bigint references public.memberships(id) on delete cascade,
  responsibility text not null check (responsibility ~ '^[a-z][a-z0-9_.]{2,63}$'),
  is_primary boolean not null default false,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (num_nonnulls(responsible_organization_id, responsible_membership_id) = 1),
  check (ends_at is null or ends_at > starts_at)
);

create unique index project_responsibilities_organization_unique_idx
  on public.project_responsibilities (project_id, responsible_organization_id, responsibility)
  where responsible_organization_id is not null;
create unique index project_responsibilities_membership_unique_idx
  on public.project_responsibilities (project_id, responsible_membership_id, responsibility)
  where responsible_membership_id is not null;
create unique index project_responsibilities_primary_role_idx
  on public.project_responsibilities (project_id, responsibility)
  where is_primary and ends_at is null;
create index project_responsibilities_project_active_idx
  on public.project_responsibilities (project_id, responsibility, starts_at)
  where ends_at is null;
create index project_responsibilities_membership_idx
  on public.project_responsibilities (responsible_membership_id)
  where responsible_membership_id is not null;

create trigger project_responsibilities_set_updated_at
before update on public.project_responsibilities
for each row execute function private.set_updated_at();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'project_access_id_project_unique'
      and conrelid = 'public.project_access'::regclass
  ) then
    alter table public.project_access
      add constraint project_access_id_project_unique unique (id, project_id);
  end if;
end $$;

create table public.project_access_capabilities (
  project_access_id bigint not null,
  project_id bigint not null,
  capability text not null check (capability ~ '^[a-z][a-z0-9_.]{2,63}$'),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (project_access_id, capability),
  foreign key (project_access_id, project_id)
    references public.project_access(id, project_id) on delete cascade
);

create index project_access_capabilities_project_idx
  on public.project_access_capabilities (project_id, capability);

alter table public.organization_relationships enable row level security;
alter table public.project_responsibilities enable row level security;
alter table public.project_access_capabilities enable row level security;

revoke all on table public.organization_relationships from anon, authenticated;
revoke all on table public.project_responsibilities from anon, authenticated;
revoke all on table public.project_access_capabilities from anon, authenticated;

grant select, insert, update, delete on table public.organization_relationships to authenticated;
grant select, insert, update, delete on table public.project_responsibilities to authenticated;
grant select, insert, delete on table public.project_access_capabilities to authenticated;
grant usage, select on sequence public.organization_relationships_id_seq to authenticated;
grant usage, select on sequence public.project_responsibilities_id_seq to authenticated;

create policy organization_relationships_participant_select
on public.organization_relationships for select to authenticated
using (
  (select private.has_org_role(source_organization_id, null))
  or (select private.has_org_role(target_organization_id, null))
);

-- Formal organization relationships are controlled by platform super admins.
create policy organization_relationships_platform_insert
on public.organization_relationships for insert to authenticated
with check ((select private.has_org_role(source_organization_id, array['super_admin']::text[])));

create policy organization_relationships_platform_update
on public.organization_relationships for update to authenticated
using ((select private.has_org_role(source_organization_id, array['super_admin']::text[])))
with check ((select private.has_org_role(source_organization_id, array['super_admin']::text[])));

create policy organization_relationships_platform_delete
on public.organization_relationships for delete to authenticated
using ((select private.has_org_role(source_organization_id, array['super_admin']::text[])));

create policy project_responsibilities_project_select
on public.project_responsibilities for select to authenticated
using ((select private.can_view_project(project_id)));

create policy project_responsibilities_manager_insert
on public.project_responsibilities for insert to authenticated
with check ((select private.can_manage_project_configuration(project_id)));

create policy project_responsibilities_manager_update
on public.project_responsibilities for update to authenticated
using ((select private.can_manage_project_configuration(project_id)))
with check ((select private.can_manage_project_configuration(project_id)));

create policy project_responsibilities_manager_delete
on public.project_responsibilities for delete to authenticated
using ((select private.can_manage_project_configuration(project_id)));

create policy project_access_capabilities_project_select
on public.project_access_capabilities for select to authenticated
using ((select private.can_view_project(project_id)));

create policy project_access_capabilities_manager_insert
on public.project_access_capabilities for insert to authenticated
with check ((select private.can_manage_project_configuration(project_id)));

create policy project_access_capabilities_manager_delete
on public.project_access_capabilities for delete to authenticated
using ((select private.can_manage_project_configuration(project_id)));

comment on table public.organization_relationships is
  'Formal relationship between platform, master broker, developer, partner, and agency organizations.';
comment on table public.project_responsibilities is
  'Time-bounded project responsibility assigned to one organization or membership.';
comment on table public.project_access_capabilities is
  'Granular capabilities that refine an existing project_access grant.';
