-- Recuperada del historial remoto de Supabase (aplicada fuera de git)
-- Ordinary organization members may read proposals and publicly shared dossiers,
-- but unpublished dossiers and their stored snapshots stay platform-admin only.
drop policy if exists presentations_member_select on public.presentations;
create policy presentations_member_select on public.presentations
  for select to authenticated
  using (
    (select private.has_org_role(organization_id, null))
    and (
      kind <> 'dossier'
      or (status = 'ready' and (select private.presentation_has_active_share(id)))
      or (select private.has_org_role(organization_id, array['super_admin']::text[]))
    )
  );

drop policy if exists presentation_versions_org_select on public.presentation_versions;
create policy presentation_versions_org_select on public.presentation_versions
  for select to authenticated
  using (exists (
    select 1 from public.presentations p
    where p.id = presentation_id
      and (select private.has_org_role(p.organization_id, null))
      and (
        p.kind <> 'dossier'
        or (p.status = 'ready' and (select private.presentation_has_active_share(p.id)))
        or (select private.has_org_role(p.organization_id, array['super_admin']::text[]))
      )
  ));

drop policy if exists shared_links_org_select on public.shared_links;
create policy shared_links_org_select on public.shared_links
  for select to authenticated
  using (exists (
    select 1
    from public.presentation_versions pv
    join public.presentations p on p.id = pv.presentation_id
    where pv.id = presentation_version_id
      and (select private.has_org_role(p.organization_id, null))
      and (
        p.kind <> 'dossier'
        or (p.status = 'ready' and (select private.presentation_has_active_share(p.id)))
        or (select private.has_org_role(p.organization_id, array['super_admin']::text[]))
      )
  ));
