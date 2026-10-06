-- Recuperada del historial remoto de Supabase (aplicada fuera de git)
-- Brokers and agency admins may request a reservation, but cannot approve it.
-- Approval remains a separate privileged workflow that creates the reservation
-- and changes the unit status atomically.
drop policy if exists reservation_requests_privileged_insert on public.reservation_requests;
create policy reservation_requests_org_insert on public.reservation_requests
for insert to authenticated
with check ((select private.has_org_role(
  organization_id,
  array['super_admin','master_broker_admin','master_broker_operations','agency_admin','broker_agent']::text[]
)));

-- A unit can have only one request awaiting review at a time. Historical
-- rejected, cancelled, and corrected requests remain preserved.
create unique index if not exists reservation_requests_one_pending_unit_idx
  on public.reservation_requests (unit_id)
  where status = 'pending';
