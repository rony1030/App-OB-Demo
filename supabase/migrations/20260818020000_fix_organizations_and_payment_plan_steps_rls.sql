-- The uncommitted 20260817000000_fix_admin_and_orgs_rls.sql file that shipped
-- with the repo was never actually run against the remote database (only its
-- filename existed locally). Verified via pg_policies: `organizations` still
-- has zero INSERT policy at all (so "Crear Master Broker" has been broken in
-- production this whole time — RLS silently rejects the very first insert),
-- and `payment_plan_steps` still has zero write policy (so a project's
-- payment plan steps can never be inserted either). This migration adds only
-- what's actually missing, deliberately narrower than that draft file: no
-- blanket `with check (true)` on organizations insert, and no re-introduction
-- of a universal cross-org has_org_role bypass for master_broker_admin
-- (20260817010000 already fixed that scope down to super_admin only).

-- organizations: only super_admin can create a new organization, matching
-- the existing UI guard on /portal/admin/brokers/new. `id` is available in
-- the WITH CHECK expression for an identity column on INSERT; for anyone
-- other than super_admin this is always false since a brand-new org can't
-- have any existing membership.
create policy organizations_admin_insert on public.organizations
  for insert to authenticated
  with check ((select private.has_org_role(id, array['super_admin']::text[])));

-- organizations: minimal cross-org directory read, same posture already
-- adopted for `profiles` (20260818010000) — needed so a master broker can
-- pick another organization when issuing a collaboration agreement.
-- Additive to organizations_member_select, which still governs full access
-- to one's own organization.
create policy organizations_directory_select on public.organizations
  for select to authenticated
  using (true);

-- payment_plan_steps: never had a write policy in any migration that
-- actually ran. Same writer-roles + project-ownership pattern used for its
-- parent `payment_plans` table.
create policy payment_plan_steps_org_insert on public.payment_plan_steps
  for insert to authenticated
  with check (exists (
    select 1 from public.payment_plans pp
    where pp.id = payment_plan_id
      and (select private.has_org_role(pp.organization_id, array['super_admin','master_broker_admin','master_broker_operations','agency_admin','developer_admin']::text[]))
  ));

create policy payment_plan_steps_org_update on public.payment_plan_steps
  for update to authenticated
  using (exists (
    select 1 from public.payment_plans pp
    where pp.id = payment_plan_id
      and (select private.has_org_role(pp.organization_id, array['super_admin','master_broker_admin','master_broker_operations','agency_admin','developer_admin']::text[]))
  ))
  with check (exists (
    select 1 from public.payment_plans pp
    where pp.id = payment_plan_id
      and (select private.has_org_role(pp.organization_id, array['super_admin','master_broker_admin','master_broker_operations','agency_admin','developer_admin']::text[]))
  ));

create policy payment_plan_steps_org_delete on public.payment_plan_steps
  for delete to authenticated
  using (exists (
    select 1 from public.payment_plans pp
    where pp.id = payment_plan_id
      and (select private.has_org_role(pp.organization_id, array['super_admin','master_broker_admin','master_broker_operations','agency_admin','developer_admin']::text[]))
  ));
