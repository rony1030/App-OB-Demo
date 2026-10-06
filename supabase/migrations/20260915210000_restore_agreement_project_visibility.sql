-- Restore the signed-agreement branch after the project-scoped developer
-- access hardening migration. Agreements remain scoped to the broker
-- organization and the master broker that owns the project.
create or replace function private.can_view_project(target_project_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1
    from public.projects p
    where p.id = target_project_id
      and (
        (select private.has_org_role(p.organization_id, null))
        or exists (
          select 1
          from public.project_access pa
          where pa.project_id = p.id
            and (pa.expires_at is null or pa.expires_at > now())
            and (
              (pa.grantee_organization_id is not null and (select private.has_org_role(pa.grantee_organization_id, null)))
              or (pa.grantee_membership_id is not null and exists (
                    select 1
                    from public.memberships m
                    where m.id = pa.grantee_membership_id
                      and m.user_id = (select auth.uid())
                      and m.status = 'active'
                  ))
              or (pa.grantee_team_id is not null and exists (
                    select 1
                    from public.team_members tm
                    join public.memberships m on m.id = tm.membership_id
                    where tm.team_id = pa.grantee_team_id
                      and m.user_id = (select auth.uid())
                      and m.status = 'active'
                  ))
            )
        )
        or exists (
          select 1
          from public.agreements a
          join public.memberships m on m.organization_id = a.broker_organization_id
          where m.user_id = (select auth.uid())
            and m.status = 'active'
            and a.status = 'signed'
            and (a.expires_at is null or a.expires_at > now())
            and a.master_broker_organization_id = p.organization_id
            and (a.kind = 'general' or (a.kind = 'project_specific' and a.project_id = p.id))
        )
      )
  );
$$;

revoke all on function private.can_view_project(bigint) from public;
grant execute on function private.can_view_project(bigint) to authenticated;
