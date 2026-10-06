-- Recuperada del historial remoto de Supabase (aplicada fuera de git)
-- Qualify outer-table columns explicitly. The original unqualified `id`
-- references were resolved against the inner projects table, which hid every
-- public brand profile and made the amenity predicate independent of the row.
drop policy if exists amenities_anon_catalog on public.amenities;
create policy amenities_anon_catalog
  on public.amenities for select to anon
  using (
    exists (
      select 1
      from public.project_amenities pa
      join public.projects p on p.id = pa.project_id
      where pa.amenity_id = amenities.id
        and p.publication_status = 'published'
    )
  );

drop policy if exists brand_profiles_anon_catalog on public.brand_profiles;
create policy brand_profiles_anon_catalog
  on public.brand_profiles for select to anon
  using (
    exists (
      select 1
      from public.projects p
      where p.brand_profile_id = brand_profiles.id
        and p.publication_status = 'published'
    )
  );

drop policy if exists brand_profiles_authenticated_select on public.brand_profiles;
create policy brand_profiles_authenticated_select
  on public.brand_profiles for select to authenticated
  using (
    (select private.has_org_role(brand_profiles.organization_id, null))
    or exists (
      select 1
      from public.projects p
      where p.brand_profile_id = brand_profiles.id
        and p.publication_status = 'published'
    )
  );
