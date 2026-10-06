-- Split FOR ALL policies so SELECT evaluates a single permissive policy.

drop policy team_members_org_write on public.team_members;
create policy team_members_org_insert on public.team_members for insert to authenticated
  with check (exists (select 1 from public.teams t where t.id = team_id and (select private.has_org_role(t.organization_id, array['super_admin','master_broker_admin','agency_admin','developer_admin']::text[]))));
create policy team_members_org_update on public.team_members for update to authenticated
  using (exists (select 1 from public.teams t where t.id = team_id and (select private.has_org_role(t.organization_id, array['super_admin','master_broker_admin','agency_admin','developer_admin']::text[]))))
  with check (exists (select 1 from public.teams t where t.id = team_id and (select private.has_org_role(t.organization_id, array['super_admin','master_broker_admin','agency_admin','developer_admin']::text[]))));
create policy team_members_org_delete on public.team_members for delete to authenticated
  using (exists (select 1 from public.teams t where t.id = team_id and (select private.has_org_role(t.organization_id, array['super_admin','master_broker_admin','agency_admin','developer_admin']::text[]))));

drop policy document_versions_org_write on public.document_versions;
create policy document_versions_org_insert on public.document_versions for insert to authenticated
  with check (exists (select 1 from public.project_documents d where d.id = document_id and (select private.has_org_role(d.organization_id, array['super_admin','master_broker_admin','master_broker_operations','developer_admin']::text[]))));
create policy document_versions_org_update on public.document_versions for update to authenticated
  using (exists (select 1 from public.project_documents d where d.id = document_id and (select private.has_org_role(d.organization_id, array['super_admin','master_broker_admin','master_broker_operations','developer_admin']::text[]))))
  with check (exists (select 1 from public.project_documents d where d.id = document_id and (select private.has_org_role(d.organization_id, array['super_admin','master_broker_admin','master_broker_operations','developer_admin']::text[]))));
create policy document_versions_org_delete on public.document_versions for delete to authenticated
  using (exists (select 1 from public.project_documents d where d.id = document_id and (select private.has_org_role(d.organization_id, array['super_admin','master_broker_admin','master_broker_operations','developer_admin']::text[]))));
