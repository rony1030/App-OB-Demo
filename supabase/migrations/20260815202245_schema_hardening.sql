-- Resolve initial database advisor findings.

-- PostgreSQL does not index foreign keys automatically. Add a covering index
-- for every single-column FK that is still uncovered.
do $$
declare fk record;
begin
  for fk in
    select
      c.conrelid::regclass as table_name,
      c.conname,
      a.attname as column_name
    from pg_constraint c
    join pg_attribute a
      on a.attrelid = c.conrelid
     and a.attnum = c.conkey[1]
    where c.contype = 'f'
      and cardinality(c.conkey) = 1
      and c.connamespace = 'public'::regnamespace
      and not exists (
        select 1
        from pg_index i
        where i.indrelid = c.conrelid
          and c.conkey[1] = any (i.indkey)
      )
  loop
    execute format(
      'create index if not exists %I on %s (%I)',
      replace(fk.conname, '_fkey', '_idx'),
      fk.table_name,
      fk.column_name
    );
  end loop;
end $$;

-- Catalog policies: one policy per role/action avoids repeated evaluation.
drop policy projects_member_select on public.projects;
drop policy projects_public_catalog on public.projects;
create policy projects_anon_catalog on public.projects for select to anon
  using (publication_status = 'published');
create policy projects_authenticated_select on public.projects for select to authenticated
  using (publication_status = 'published' or (select private.has_org_role(organization_id, null)));

drop policy project_media_member_select on public.project_media;
drop policy project_media_public_catalog on public.project_media;
create policy project_media_anon_catalog on public.project_media for select to anon
  using (exists (select 1 from public.projects p where p.id = project_id and p.publication_status = 'published'));
create policy project_media_authenticated_select on public.project_media for select to authenticated
  using (exists (
    select 1 from public.projects p
    where p.id = project_id
      and (p.publication_status = 'published' or (select private.has_org_role(p.organization_id, null)))
  ));

drop policy brand_profiles_member_select on public.brand_profiles;
drop policy brand_profiles_public_catalog on public.brand_profiles;
create policy brand_profiles_anon_catalog on public.brand_profiles for select to anon
  using (exists (select 1 from public.projects p where p.brand_profile_id = id and p.publication_status = 'published'));
create policy brand_profiles_authenticated_select on public.brand_profiles for select to authenticated
  using ((select private.has_org_role(organization_id, null)) or exists (
    select 1 from public.projects p where p.brand_profile_id = id and p.publication_status = 'published'
  ));

drop policy payment_plans_member_select on public.payment_plans;
drop policy payment_plans_public_catalog on public.payment_plans;
create policy payment_plans_anon_catalog on public.payment_plans for select to anon
  using (is_active and exists (select 1 from public.projects p where p.id = project_id and p.publication_status = 'published'));
create policy payment_plans_authenticated_select on public.payment_plans for select to authenticated
  using ((select private.has_org_role(organization_id, null)) or (is_active and exists (
    select 1 from public.projects p where p.id = project_id and p.publication_status = 'published'
  )));

drop policy typologies_member_select on public.typologies;
drop policy typologies_public_catalog on public.typologies;
create policy typologies_anon_catalog on public.typologies for select to anon
  using (exists (select 1 from public.projects p where p.id = project_id and p.publication_status = 'published'));
create policy typologies_authenticated_select on public.typologies for select to authenticated
  using ((select private.has_org_role(organization_id, null)) or exists (
    select 1 from public.projects p where p.id = project_id and p.publication_status = 'published'
  ));

drop policy units_member_select on public.units;
drop policy units_public_catalog on public.units;
create policy units_anon_catalog on public.units for select to anon
  using (is_public and exists (select 1 from public.projects p where p.id = project_id and p.publication_status = 'published'));
create policy units_authenticated_select on public.units for select to authenticated
  using ((select private.has_org_role(organization_id, null)) or (is_public and exists (
    select 1 from public.projects p where p.id = project_id and p.publication_status = 'published'
  )));

-- Consolidate CRM write policies so each statement evaluates one predicate.
drop policy contacts_privileged_insert on public.contacts;
drop policy contacts_member_insert on public.contacts;
create policy contacts_org_insert on public.contacts for insert to authenticated
  with check ((select private.has_org_role(organization_id, array['super_admin','master_broker_admin','master_broker_operations','agency_admin','broker_agent']::text[])));

drop policy lead_reports_privileged_insert on public.lead_reports;
drop policy lead_reports_member_insert on public.lead_reports;
create policy lead_reports_org_insert on public.lead_reports for insert to authenticated
  with check ((select private.has_org_role(organization_id, array['super_admin','master_broker_admin','master_broker_operations','agency_admin','broker_agent']::text[])));

drop policy opportunities_privileged_insert on public.opportunities;
drop policy opportunities_member_insert on public.opportunities;
create policy opportunities_org_insert on public.opportunities for insert to authenticated
  with check ((select private.has_org_role(organization_id, array['super_admin','master_broker_admin','master_broker_operations','agency_admin','broker_agent']::text[])));
drop policy opportunities_privileged_update on public.opportunities;
drop policy opportunities_member_update on public.opportunities;
create policy opportunities_org_update on public.opportunities for update to authenticated
  using ((select private.has_org_role(organization_id, array['super_admin','master_broker_admin','master_broker_operations','agency_admin','broker_agent']::text[])))
  with check ((select private.has_org_role(organization_id, array['super_admin','master_broker_admin','master_broker_operations','agency_admin','broker_agent']::text[])));

drop policy presentations_privileged_insert on public.presentations;
drop policy presentations_member_insert on public.presentations;
create policy presentations_org_insert on public.presentations for insert to authenticated
  with check ((select private.has_org_role(organization_id, array['super_admin','master_broker_admin','master_broker_operations','agency_admin','broker_agent']::text[])));

-- Explicit policies for child tables. These were intentionally closed by RLS
-- in the first migration; they now inherit access through their tenant parent.
create policy team_members_org_select on public.team_members for select to authenticated
  using (exists (select 1 from public.teams t where t.id = team_id and (select private.has_org_role(t.organization_id, null))));
create policy team_members_org_write on public.team_members for all to authenticated
  using (exists (select 1 from public.teams t where t.id = team_id and (select private.has_org_role(t.organization_id, array['super_admin','master_broker_admin','agency_admin','developer_admin']::text[]))))
  with check (exists (select 1 from public.teams t where t.id = team_id and (select private.has_org_role(t.organization_id, array['super_admin','master_broker_admin','agency_admin','developer_admin']::text[]))));

create policy document_versions_org_select on public.document_versions for select to authenticated
  using (exists (select 1 from public.project_documents d where d.id = document_id and (select private.has_org_role(d.organization_id, null))));
create policy document_versions_org_write on public.document_versions for all to authenticated
  using (exists (select 1 from public.project_documents d where d.id = document_id and (select private.has_org_role(d.organization_id, array['super_admin','master_broker_admin','master_broker_operations','developer_admin']::text[]))))
  with check (exists (select 1 from public.project_documents d where d.id = document_id and (select private.has_org_role(d.organization_id, array['super_admin','master_broker_admin','master_broker_operations','developer_admin']::text[]))));

create policy opportunity_projects_org_access on public.opportunity_projects for all to authenticated
  using (exists (select 1 from public.opportunities o where o.id = opportunity_id and (select private.has_org_role(o.organization_id, null))))
  with check (exists (select 1 from public.opportunities o where o.id = opportunity_id and (select private.has_org_role(o.organization_id, null))));
create policy opportunity_units_org_access on public.opportunity_units for all to authenticated
  using (exists (select 1 from public.opportunities o where o.id = opportunity_id and (select private.has_org_role(o.organization_id, null))))
  with check (exists (select 1 from public.opportunities o where o.id = opportunity_id and (select private.has_org_role(o.organization_id, null))));

create policy contact_tags_org_access on public.contact_tags for all to authenticated
  using (exists (select 1 from public.contacts c where c.id = contact_id and (select private.has_org_role(c.organization_id, null))))
  with check (exists (select 1 from public.contacts c where c.id = contact_id and (select private.has_org_role(c.organization_id, null))));

create policy presentation_versions_org_access on public.presentation_versions for all to authenticated
  using (exists (select 1 from public.presentations p where p.id = presentation_id and (select private.has_org_role(p.organization_id, null))))
  with check (exists (select 1 from public.presentations p where p.id = presentation_id and (select private.has_org_role(p.organization_id, null))));
create policy shared_links_org_access on public.shared_links for all to authenticated
  using (exists (
    select 1 from public.presentation_versions pv
    join public.presentations p on p.id = pv.presentation_id
    where pv.id = presentation_version_id and (select private.has_org_role(p.organization_id, null))
  ))
  with check (exists (
    select 1 from public.presentation_versions pv
    join public.presentations p on p.id = pv.presentation_id
    where pv.id = presentation_version_id and (select private.has_org_role(p.organization_id, null))
  ));

create policy commission_participants_org_access on public.commission_participants for all to authenticated
  using (exists (select 1 from public.commissions c where c.id = commission_id and (select private.has_org_role(c.organization_id, null))))
  with check (exists (select 1 from public.commissions c where c.id = commission_id and (select private.has_org_role(c.organization_id, null))));

create policy signature_signers_org_access on public.signature_signers for all to authenticated
  using (exists (select 1 from public.signature_documents d where d.id = signature_document_id and (select private.has_org_role(d.organization_id, null))))
  with check (exists (select 1 from public.signature_documents d where d.id = signature_document_id and (select private.has_org_role(d.organization_id, null))));
create policy signature_fields_org_access on public.signature_fields for all to authenticated
  using (exists (
    select 1 from public.signature_signers s
    join public.signature_documents d on d.id = s.signature_document_id
    where s.id = signer_id and (select private.has_org_role(d.organization_id, null))
  ))
  with check (exists (
    select 1 from public.signature_signers s
    join public.signature_documents d on d.id = s.signature_document_id
    where s.id = signer_id and (select private.has_org_role(d.organization_id, null))
  ));
