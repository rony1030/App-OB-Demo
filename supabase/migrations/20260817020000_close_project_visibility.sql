-- Close broker-facing project visibility to "closed by default": an
-- authenticated broker should only see projects owned by their own
-- organization, owned by a developer organization they belong to, or
-- explicitly granted via project_access (respecting expires_at). The
-- anonymous public catalog (used by the marketing landing page) is
-- untouched.
--
-- Root cause being fixed: every "*_authenticated_select" policy created in
-- 20260815202245_schema_hardening.sql reads
--   using (publication_status = 'published' or (select private.has_org_role(...)))
-- which means ANY authenticated user, from ANY organization, can read ANY
-- published project. amenities/project_amenities/project_highlights/
-- payment_plan_steps never even got that split and are still wide open to
-- `anon, authenticated` with no organization check at all.

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
        or (p.developer_organization_id is not null and (select private.has_org_role(p.developer_organization_id, null)))
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

revoke all on function private.can_view_project(bigint) from public;
grant execute on function private.can_view_project(bigint) to authenticated;

-- projects / project_media / payment_plans / typologies / units: replace the
-- leaky "published OR org member" authenticated policy with can_view_project.
drop policy projects_authenticated_select on public.projects;
create policy projects_authenticated_select on public.projects for select to authenticated
  using ((select private.can_view_project(id)));

drop policy project_media_authenticated_select on public.project_media;
create policy project_media_authenticated_select on public.project_media for select to authenticated
  using ((select private.can_view_project(project_id)));

drop policy payment_plans_authenticated_select on public.payment_plans;
create policy payment_plans_authenticated_select on public.payment_plans for select to authenticated
  using ((select private.can_view_project(project_id)));

drop policy typologies_authenticated_select on public.typologies;
create policy typologies_authenticated_select on public.typologies for select to authenticated
  using ((select private.can_view_project(project_id)));

drop policy units_authenticated_select on public.units;
create policy units_authenticated_select on public.units for select to authenticated
  using ((select private.can_view_project(project_id)));

-- amenities / project_amenities / project_highlights / payment_plan_steps:
-- these were never split from the original combined `anon, authenticated`
-- catalog policy. Split them now the same way the other catalog tables were
-- split in 20260815202245_schema_hardening.sql.
drop policy amenities_public_catalog on public.amenities;
create policy amenities_anon_catalog on public.amenities for select to anon
  using (exists (
    select 1 from public.project_amenities pa join public.projects p on p.id = pa.project_id
    where pa.amenity_id = id and p.publication_status = 'published'
  ));
create policy amenities_authenticated_select on public.amenities for select to authenticated
  using (exists (
    select 1 from public.project_amenities pa
    where pa.amenity_id = id and (select private.can_view_project(pa.project_id))
  ));

drop policy project_amenities_public_catalog on public.project_amenities;
create policy project_amenities_anon_catalog on public.project_amenities for select to anon
  using (exists (select 1 from public.projects p where p.id = project_id and p.publication_status = 'published'));
create policy project_amenities_authenticated_select on public.project_amenities for select to authenticated
  using ((select private.can_view_project(project_id)));

drop policy project_highlights_public_catalog on public.project_highlights;
create policy project_highlights_anon_catalog on public.project_highlights for select to anon
  using (exists (select 1 from public.projects p where p.id = project_id and p.publication_status = 'published'));
create policy project_highlights_authenticated_select on public.project_highlights for select to authenticated
  using ((select private.can_view_project(project_id)));

drop policy payment_plan_steps_public_catalog on public.payment_plan_steps;
create policy payment_plan_steps_anon_catalog on public.payment_plan_steps for select to anon
  using (exists (
    select 1 from public.payment_plans pp join public.projects p on p.id = pp.project_id
    where pp.id = payment_plan_id and pp.is_active and p.publication_status = 'published'
  ));
create policy payment_plan_steps_authenticated_select on public.payment_plan_steps for select to authenticated
  using (exists (
    select 1 from public.payment_plans pp
    where pp.id = payment_plan_id and (select private.can_view_project(pp.project_id))
  ));

-- project_documents / document_versions: additive policies so a broker with
-- project_access (not a member of the owning org) can see authorized
-- documents, without touching the existing own-org member policy.
create policy project_documents_access_select on public.project_documents for select to authenticated
  using (
    visibility in ('authorized', 'public')
    and status in ('approved', 'published')
    and (select private.can_view_project(project_id))
  );

create policy document_versions_access_select on public.document_versions for select to authenticated
  using (exists (
    select 1 from public.project_documents d
    where d.id = document_id
      and d.visibility in ('authorized', 'public')
      and d.status in ('approved', 'published')
      and (select private.can_view_project(d.project_id))
  ));

-- Storage: allow a broker with project_access to read project documents that
-- live under the owning organization's slug, using the convention
-- {ownerOrgSlug}/projects/{projectId}/... (introduced with real document
-- uploads). Additive to the existing private_documents_member_select policy.
create policy private_documents_project_access_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'private-documents'
    and (storage.foldername(name))[2] = 'projects'
    and (select private.can_view_project(nullif((storage.foldername(name))[3], '')::bigint))
  );
