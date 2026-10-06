-- Minimal public read model for the published project catalog.
-- Sensitive organization fields and non-public documents remain inaccessible.

create policy organizations_anon_catalog on public.organizations
  for select to anon
  using (exists (
    select 1
    from public.projects p
    where p.developer_organization_id = id
      and p.publication_status = 'published'
  ));

grant select (id, name, slug) on public.organizations to anon;

create policy project_documents_anon_catalog on public.project_documents
  for select to anon
  using (
    visibility = 'public'
    and status in ('approved', 'published')
    and exists (
      select 1
      from public.projects p
      where p.id = project_id
        and p.publication_status = 'published'
    )
  );

grant select (id, project_id, title, category, status, updated_at)
  on public.project_documents to anon;
