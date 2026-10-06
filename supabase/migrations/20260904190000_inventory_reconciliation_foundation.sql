-- Add diff_summary column to inventory_sync_runs to store auditable diff breakdown
alter table public.inventory_sync_runs
  add column if not exists diff_summary jsonb not null default '{}'::jsonb;

-- Grant permissions to authenticated users for sync runs, mappings, and snapshots
grant select, insert, update on table public.inventory_sync_runs to authenticated;
grant select, insert, update on table public.external_unit_mappings to authenticated;
grant select, insert, update on table public.inventory_source_snapshots to authenticated;

grant usage, select on sequence public.inventory_sync_runs_id_seq to authenticated;
grant usage, select on sequence public.external_unit_mappings_id_seq to authenticated;
grant usage, select on sequence public.inventory_source_snapshots_id_seq to authenticated;

-- RLS policies for inventory_sync_runs
create policy inventory_sync_runs_manager_insert
  on public.inventory_sync_runs for insert to authenticated
  with check ((select private.can_manage_inventory_integration(project_id)));

create policy inventory_sync_runs_manager_update
  on public.inventory_sync_runs for update to authenticated
  using ((select private.can_manage_inventory_integration(project_id)))
  with check ((select private.can_manage_inventory_integration(project_id)));

-- RLS policies for external_unit_mappings
create policy external_unit_mappings_manager_insert
  on public.external_unit_mappings for insert to authenticated
  with check ((select private.can_manage_inventory_integration(project_id)));

create policy external_unit_mappings_manager_update
  on public.external_unit_mappings for update to authenticated
  using ((select private.can_manage_inventory_integration(project_id)))
  with check ((select private.can_manage_inventory_integration(project_id)));

-- RLS policies for inventory_source_snapshots
create policy inventory_source_snapshots_manager_insert
  on public.inventory_source_snapshots for insert to authenticated
  with check ((select private.can_manage_inventory_integration(project_id)));

-- Ensure index on diff_summary is not required unless querying inside it, but ensure index for runs
create index if not exists inventory_sync_runs_mode_status_idx
  on public.inventory_sync_runs (project_id, mode, status, started_at desc);
