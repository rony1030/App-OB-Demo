-- Personalized dossiers are published by the server and read-only to the
-- agency that owns it. Ordinary proposals keep their existing org permissions.

drop policy if exists presentations_org_insert on public.presentations;
create policy presentations_org_insert on public.presentations
  for insert to authenticated
  with check (
    (select private.has_org_role(organization_id, array['super_admin','master_broker_admin','master_broker_operations','agency_admin','broker_agent']::text[]))
    and (kind <> 'dossier' or (select private.has_org_role(organization_id, array['super_admin']::text[])))
  );

drop policy if exists presentations_privileged_update on public.presentations;
create policy presentations_privileged_update on public.presentations
  for update to authenticated
  using (
    (select private.has_org_role(organization_id, array['super_admin','master_broker_admin','master_broker_operations','agency_admin','developer_admin']::text[]))
    and (kind <> 'dossier' or (select private.has_org_role(organization_id, array['super_admin']::text[])))
  )
  with check (
    (select private.has_org_role(organization_id, array['super_admin','master_broker_admin','master_broker_operations','agency_admin','developer_admin']::text[]))
    and (kind <> 'dossier' or (select private.has_org_role(organization_id, array['super_admin']::text[])))
  );

drop policy if exists presentations_privileged_delete on public.presentations;
create policy presentations_privileged_delete on public.presentations
  for delete to authenticated
  using (
    (select private.has_org_role(organization_id, array['super_admin','master_broker_admin','master_broker_operations','agency_admin','developer_admin']::text[]))
    and (kind <> 'dossier' or (select private.has_org_role(organization_id, array['super_admin']::text[])))
  );

drop policy if exists presentation_versions_org_access on public.presentation_versions;
create policy presentation_versions_org_select on public.presentation_versions
  for select to authenticated
  using (exists (
    select 1 from public.presentations p
    where p.id = presentation_id
      and (select private.has_org_role(p.organization_id, null))
  ));
create policy presentation_versions_org_insert on public.presentation_versions
  for insert to authenticated
  with check (exists (
    select 1 from public.presentations p
    where p.id = presentation_id
      and (select private.has_org_role(p.organization_id, null))
      and (p.kind <> 'dossier' or (select private.has_org_role(p.organization_id, array['super_admin']::text[])))
  ));

drop policy if exists shared_links_org_access on public.shared_links;
create policy shared_links_org_select on public.shared_links
  for select to authenticated
  using (exists (
    select 1 from public.presentation_versions pv
    join public.presentations p on p.id = pv.presentation_id
    where pv.id = presentation_version_id
      and (select private.has_org_role(p.organization_id, null))
  ));
create policy shared_links_org_insert on public.shared_links
  for insert to authenticated
  with check (exists (
    select 1 from public.presentation_versions pv
    join public.presentations p on p.id = pv.presentation_id
    where pv.id = presentation_version_id
      and (select private.has_org_role(p.organization_id, null))
      and (p.kind <> 'dossier' or (select private.has_org_role(p.organization_id, array['super_admin']::text[])))
  ));
create policy shared_links_org_update on public.shared_links
  for update to authenticated
  using (exists (
    select 1 from public.presentation_versions pv
    join public.presentations p on p.id = pv.presentation_id
    where pv.id = presentation_version_id
      and (select private.has_org_role(p.organization_id, null))
      and (p.kind <> 'dossier' or (select private.has_org_role(p.organization_id, array['super_admin']::text[])))
  ))
  with check (exists (
    select 1 from public.presentation_versions pv
    join public.presentations p on p.id = pv.presentation_id
    where pv.id = presentation_version_id
      and (select private.has_org_role(p.organization_id, null))
      and (p.kind <> 'dossier' or (select private.has_org_role(p.organization_id, array['super_admin']::text[])))
  ));
create policy shared_links_org_delete on public.shared_links
  for delete to authenticated
  using (exists (
    select 1 from public.presentation_versions pv
    join public.presentations p on p.id = pv.presentation_id
    where pv.id = presentation_version_id
      and (select private.has_org_role(p.organization_id, null))
      and (p.kind <> 'dossier' or (select private.has_org_role(p.organization_id, array['super_admin']::text[])))
  ));
