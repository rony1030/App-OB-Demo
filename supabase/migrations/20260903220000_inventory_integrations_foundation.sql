-- Generic inventory integrations. No provider credential is stored here:
-- credentials_secret_name is only an opaque reference to a server-side secret.

create or replace function private.can_manage_inventory_integration(target_project_id bigint)
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
            array['super_admin', 'master_broker_admin', 'master_broker_operations']::text[]
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

revoke all on function private.can_manage_inventory_integration(bigint) from public;
grant execute on function private.can_manage_inventory_integration(bigint) to authenticated;

create table public.integration_connections (
  id bigint generated always as identity primary key,
  project_id bigint not null references public.projects(id) on delete cascade,
  provider text not null check (provider ~ '^[a-z][a-z0-9_]{1,62}$'),
  display_name text not null,
  external_project_id text not null,
  base_url text not null check (base_url ~ '^https://'),
  credentials_secret_name text not null,
  status text not null default 'paused'
    check (status in ('active', 'paused', 'error', 'archived')),
  sync_interval_seconds integer not null default 300
    check (sync_interval_seconds between 30 and 86400),
  config jsonb not null default '{}'::jsonb
    check (jsonb_typeof(config) = 'object'),
  last_attempt_at timestamptz,
  last_success_at timestamptz,
  last_error_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, provider, external_project_id),
  unique (id, project_id)
);

create index integration_connections_project_status_idx
  on public.integration_connections (project_id, status);

create trigger integration_connections_set_updated_at
before update on public.integration_connections
for each row execute function private.set_updated_at();

create table public.inventory_sync_runs (
  id bigint generated always as identity primary key,
  connection_id bigint not null,
  project_id bigint not null,
  mode text not null default 'shadow' check (mode in ('shadow', 'active', 'manual')),
  status text not null default 'running'
    check (status in ('running', 'succeeded', 'partial', 'failed', 'quarantined')),
  source_payload_hash text check (source_payload_hash is null or source_payload_hash ~ '^[0-9a-f]{64}$'),
  received_count integer not null default 0 check (received_count >= 0),
  created_count integer not null default 0 check (created_count >= 0),
  updated_count integer not null default 0 check (updated_count >= 0),
  unchanged_count integer not null default 0 check (unchanged_count >= 0),
  invalid_count integer not null default 0 check (invalid_count >= 0),
  missing_count integer not null default 0 check (missing_count >= 0),
  error_code text,
  error_summary text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  unique (id, project_id),
  foreign key (connection_id, project_id)
    references public.integration_connections(id, project_id) on delete cascade,
  check (finished_at is null or finished_at >= started_at),
  check (status = 'running' or finished_at is not null)
);

create index inventory_sync_runs_project_started_idx
  on public.inventory_sync_runs (project_id, started_at desc);
create index inventory_sync_runs_connection_started_idx
  on public.inventory_sync_runs (connection_id, started_at desc);
create index inventory_sync_runs_failures_idx
  on public.inventory_sync_runs (project_id, started_at desc)
  where status in ('failed', 'partial', 'quarantined');

create table public.external_unit_mappings (
  id bigint generated always as identity primary key,
  connection_id bigint not null,
  project_id bigint not null,
  unit_id bigint references public.units(id) on delete set null,
  external_unit_id text not null,
  external_unit_code text not null,
  source_hash text check (source_hash is null or source_hash ~ '^[0-9a-f]{64}$'),
  is_active boolean not null default true,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (connection_id, project_id)
    references public.integration_connections(id, project_id) on delete cascade,
  unique (connection_id, external_unit_id),
  check (last_seen_at >= first_seen_at)
);

create unique index external_unit_mappings_connection_unit_idx
  on public.external_unit_mappings (connection_id, unit_id)
  where unit_id is not null;
create index external_unit_mappings_project_active_idx
  on public.external_unit_mappings (project_id, is_active, last_seen_at desc);
create index external_unit_mappings_unit_idx
  on public.external_unit_mappings (unit_id)
  where unit_id is not null;

create trigger external_unit_mappings_set_updated_at
before update on public.external_unit_mappings
for each row execute function private.set_updated_at();

create table public.inventory_source_snapshots (
  id bigint generated always as identity primary key,
  sync_run_id bigint not null,
  project_id bigint not null,
  external_unit_id text not null,
  external_unit_code text not null,
  canonical_status text not null
    check (canonical_status in ('available', 'blocked', 'separated', 'reserved', 'sold', 'withdrawn', 'unknown')),
  payload_hash text not null check (payload_hash ~ '^[0-9a-f]{64}$'),
  source_payload jsonb not null check (jsonb_typeof(source_payload) = 'object'),
  created_at timestamptz not null default now(),
  foreign key (sync_run_id, project_id)
    references public.inventory_sync_runs(id, project_id) on delete cascade,
  unique (sync_run_id, external_unit_id)
);

create index inventory_source_snapshots_project_created_idx
  on public.inventory_source_snapshots (project_id, created_at desc);
create index inventory_source_snapshots_external_unit_idx
  on public.inventory_source_snapshots (project_id, external_unit_id, created_at desc);

alter table public.integration_connections enable row level security;
alter table public.inventory_sync_runs enable row level security;
alter table public.external_unit_mappings enable row level security;
alter table public.inventory_source_snapshots enable row level security;

revoke all on table public.integration_connections from anon, authenticated;
revoke all on table public.inventory_sync_runs from anon, authenticated;
revoke all on table public.external_unit_mappings from anon, authenticated;
revoke all on table public.inventory_source_snapshots from anon, authenticated;

grant select, insert, update, delete on table public.integration_connections to authenticated;
grant select on table public.inventory_sync_runs to authenticated;
grant select on table public.external_unit_mappings to authenticated;
grant select on table public.inventory_source_snapshots to authenticated;
grant usage, select on sequence public.integration_connections_id_seq to authenticated;

create policy integration_connections_project_select
on public.integration_connections for select to authenticated
using ((select private.can_view_project(project_id)));

create policy integration_connections_manager_insert
on public.integration_connections for insert to authenticated
with check ((select private.can_manage_inventory_integration(project_id)));

create policy integration_connections_manager_update
on public.integration_connections for update to authenticated
using ((select private.can_manage_inventory_integration(project_id)))
with check ((select private.can_manage_inventory_integration(project_id)));

create policy integration_connections_manager_delete
on public.integration_connections for delete to authenticated
using ((select private.can_manage_inventory_integration(project_id)));

create policy inventory_sync_runs_project_select
on public.inventory_sync_runs for select to authenticated
using ((select private.can_view_project(project_id)));

create policy external_unit_mappings_project_select
on public.external_unit_mappings for select to authenticated
using ((select private.can_view_project(project_id)));

create policy inventory_source_snapshots_project_select
on public.inventory_source_snapshots for select to authenticated
using ((select private.can_view_project(project_id)));

comment on table public.integration_connections is
  'Project-scoped external connectors. Stores secret references, never secret values.';
comment on table public.inventory_sync_runs is
  'Auditable inventory synchronization executions, including shadow and quarantined runs.';
comment on table public.external_unit_mappings is
  'Stable mapping between provider unit identifiers and canonical units.';
comment on table public.inventory_source_snapshots is
  'Unit-level source evidence captured before canonical inventory mutation.';
