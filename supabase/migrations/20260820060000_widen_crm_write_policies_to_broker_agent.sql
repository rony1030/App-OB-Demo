-- QA audit finding: notes, tags, activities and consent_preferences were
-- never widened to broker_agent the way contacts/lead_reports/opportunities/
-- presentations were in 20260815202245_schema_hardening.sql. broker_agent is
-- the *default* role (lib/auth/get-user.ts falls back to it), so every
-- ordinary broker's writes to these tables have been silently rejected by
-- RLS -- silently because app/portal/crm/actions.ts wraps most of them in
-- try/catch blocks that discard the error. This widens write access to match
-- the already-established contacts/opportunities/lead_reports pattern.

drop policy notes_privileged_insert on public.notes;
create policy notes_org_insert on public.notes for insert to authenticated
  with check ((select private.has_org_role(organization_id, array['super_admin','master_broker_admin','master_broker_operations','agency_admin','broker_agent']::text[])));

drop policy tags_privileged_insert on public.tags;
create policy tags_org_insert on public.tags for insert to authenticated
  with check ((select private.has_org_role(organization_id, array['super_admin','master_broker_admin','master_broker_operations','agency_admin','broker_agent']::text[])));

drop policy consent_preferences_privileged_insert on public.consent_preferences;
create policy consent_preferences_org_insert on public.consent_preferences for insert to authenticated
  with check ((select private.has_org_role(organization_id, array['super_admin','master_broker_admin','master_broker_operations','agency_admin','broker_agent']::text[])));

drop policy activities_privileged_insert on public.activities;
create policy activities_org_insert on public.activities for insert to authenticated
  with check ((select private.has_org_role(organization_id, array['super_admin','master_broker_admin','master_broker_operations','agency_admin','broker_agent']::text[])));

-- toggleTaskCompleteAction updates activities.completed_at.
drop policy activities_privileged_update on public.activities;
create policy activities_org_update on public.activities for update to authenticated
  using ((select private.has_org_role(organization_id, array['super_admin','master_broker_admin','master_broker_operations','agency_admin','broker_agent']::text[])))
  with check ((select private.has_org_role(organization_id, array['super_admin','master_broker_admin','master_broker_operations','agency_admin','broker_agent']::text[])));
