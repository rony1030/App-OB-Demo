-- Public catalogs need the developer's display identity for published projects.
-- Contact and legal fields remain outside the anon column grant.

drop policy if exists organizations_anon_catalog on public.organizations;

create policy organizations_anon_catalog
on public.organizations for select to anon
using (
  exists (
    select 1
    from public.projects project
    where project.developer_organization_id = organizations.id
      and project.publication_status = 'published'
  )
);

revoke all on table public.organizations from anon;
grant select (id, name, slug) on table public.organizations to anon;
