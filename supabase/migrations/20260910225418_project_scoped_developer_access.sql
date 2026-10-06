-- Recuperada del historial remoto de Supabase (aplicada fuera de git)
-- Developer users see only projects explicitly assigned to their membership.
-- The developer organization remains the commercial owner, but membership is
-- not treated as a blanket grant across every project in that organization.
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
                    select 1 from public.memberships m
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
      )
  );
$$;

-- Existing KYSER administrators are explicitly assigned to Cipres.
insert into public.project_access (organization_id, project_id, grantee_membership_id, access_level)
select p.organization_id, p.id, m.id, 'manage'
from public.projects p
join public.memberships m on m.organization_id = p.developer_organization_id and m.status = 'active'
where p.id = 13
  and p.developer_organization_id = 11
  and m.id in (6, 8)
  and not exists (
    select 1 from public.project_access pa
    where pa.project_id = p.id and pa.grantee_membership_id = m.id
  );

-- Commission visibility follows the same project grant and never bypasses it
-- merely because the user belongs to the developer organization.
drop policy if exists commission_claims_select on public.commission_claims;
create policy commission_claims_select
on public.commission_claims for select to authenticated
using (
  (select private.has_org_role(organization_id, null))
  or exists (
    select 1 from public.projects p
    where p.id = project_id
      and (select private.can_view_project(p.id))
      and (
        (select private.has_org_role(p.organization_id, array['super_admin','master_broker_admin','master_broker_operations']::text[]))
        or (p.developer_organization_id is not null and (select private.has_org_role(p.developer_organization_id, array['super_admin','master_broker_admin','developer_admin','developer_viewer']::text[])))
      )
  )
);

create or replace function private.can_claim_developer(target_claim_id bigint)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.commission_claims c
    join public.projects p on p.id = c.project_id
    where c.id = target_claim_id
      and p.developer_organization_id is not null
      and (select private.can_view_project(p.id))
      and (select private.has_org_role(p.developer_organization_id, array['super_admin','master_broker_admin','developer_admin']::text[]))
  );
$$;


