-- Lets a project's developer organization see (read-only) the agreements
-- tied to their own projects, so the developer dashboard can show which
-- master brokers/agencies are actively authorized to sell each project.
-- Additive: OR'd with the existing agreements_select policy, does not
-- narrow any access master brokers/brokers already had.
create policy agreements_developer_select on agreements for select to authenticated
using (
  project_id is not null and exists (
    select 1 from projects p
    where p.id = agreements.project_id
    and (select private.has_org_role(p.developer_organization_id, null::text[]))
  )
);
