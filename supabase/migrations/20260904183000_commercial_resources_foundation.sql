-- Commercial resources RLS enhancement and baseline official documents for Cana Rock
-- Idempotent and safe to run on local/remote Supabase

-- 1. Grant public/anon read permissions on public approved documents
grant select (visibility) on public.project_documents to anon;

grant select (
  id, document_id, version_number, storage_bucket, storage_path,
  mime_type, size_bytes, checksum_sha256, published_at
) on public.document_versions to anon;

-- Ensure policy allows anon to select versions of public and published documents
drop policy if exists document_versions_anon_public on public.document_versions;
create policy document_versions_anon_public on public.document_versions
  for select to anon
  using (exists (
    select 1 from public.project_documents d
    where d.id = document_id
      and d.visibility = 'public'
      and d.status in ('approved', 'published')
  ));

-- 2. Seed baseline commercial documents for Cana Rock Star and Cosmos Stelar
do $$
declare
  v_org_id bigint;
  v_star_id bigint;
  v_stelar_id bigint;
  v_doc_id bigint;
begin
  select id into v_org_id from public.organizations where slug = 'cana-rock-osvaldo-bello' limit 1;
  if v_org_id is null then
    select id into v_org_id from public.organizations order by id limit 1;
  end if;

  select id into v_star_id from public.projects where slug = 'cana-rock-star' limit 1;
  select id into v_stelar_id from public.projects where slug = 'cana-rock-stelar' limit 1;

  -- Cana Rock Star: Brochure Comercial (authorized, approved)
  if v_star_id is not null then
    insert into public.project_documents (organization_id, project_id, title, category, visibility, status, created_at, updated_at)
    values (v_org_id, v_star_id, 'Brochure Comercial Cana Rock Star (ES)', 'commercial', 'authorized', 'approved', now(), now())
    on conflict do nothing;

    select id into v_doc_id from public.project_documents
    where project_id = v_star_id and title = 'Brochure Comercial Cana Rock Star (ES)' limit 1;

    if v_doc_id is not null and not exists (select 1 from public.document_versions where document_id = v_doc_id) then
      insert into public.document_versions (
        document_id, version_number, storage_bucket, storage_path,
        mime_type, size_bytes, checksum_sha256, published_at, created_at
      ) values (
        v_doc_id, 1, 'private-documents', 'cana-rock-osvaldo-bello/projects/' || v_star_id || '/' || v_doc_id || '/v1.pdf',
        'application/pdf', 3840000, '4a810f769018e64cbe394bca4e65007da74b4861bcfa073b64c7ea4ff2e90f23', now(), now()
      );
    end if;

    -- Cana Rock Star: Ficha Técnica (authorized, approved)
    insert into public.project_documents (organization_id, project_id, title, category, visibility, status, created_at, updated_at)
    values (v_org_id, v_star_id, 'Ficha Técnica Cana Rock Star (ES)', 'technical', 'authorized', 'approved', now(), now())
    on conflict do nothing;

    select id into v_doc_id from public.project_documents
    where project_id = v_star_id and title = 'Ficha Técnica Cana Rock Star (ES)' limit 1;

    if v_doc_id is not null and not exists (select 1 from public.document_versions where document_id = v_doc_id) then
      insert into public.document_versions (
        document_id, version_number, storage_bucket, storage_path,
        mime_type, size_bytes, checksum_sha256, published_at, created_at
      ) values (
        v_doc_id, 1, 'private-documents', 'cana-rock-osvaldo-bello/projects/' || v_star_id || '/' || v_doc_id || '/v1.pdf',
        'application/pdf', 1450000, '9b4e7235a92a543ef816a4e32156821360183b05a761c563dbe927e1f148e65a', now(), now()
      );
    end if;

    -- Cana Rock Star: Master Plan Oficial (public, published)
    insert into public.project_documents (organization_id, project_id, title, category, visibility, status, created_at, updated_at)
    values (v_org_id, v_star_id, 'Master Plan Cana Rock Star', 'commercial', 'public', 'published', now(), now())
    on conflict do nothing;

    select id into v_doc_id from public.project_documents
    where project_id = v_star_id and title = 'Master Plan Cana Rock Star' limit 1;

    if v_doc_id is not null and not exists (select 1 from public.document_versions where document_id = v_doc_id) then
      insert into public.document_versions (
        document_id, version_number, storage_bucket, storage_path,
        mime_type, size_bytes, checksum_sha256, published_at, created_at
      ) values (
        v_doc_id, 1, 'public-assets', 'cana-rock-osvaldo-bello/projects/' || v_star_id || '/' || v_doc_id || '/v1.pdf',
        'application/pdf', 2120000, '2c5a7698be90310e64cbe394bca4e65007da74b4861bcfa073b64c7ea4ff2e90', now(), now()
      );
    end if;
  end if;

  -- Cosmos Stelar: Brochure Comercial (authorized, approved)
  if v_stelar_id is not null then
    insert into public.project_documents (organization_id, project_id, title, category, visibility, status, created_at, updated_at)
    values (v_org_id, v_stelar_id, 'Brochure Comercial Cosmos Stelar (ES)', 'commercial', 'authorized', 'approved', now(), now())
    on conflict do nothing;

    select id into v_doc_id from public.project_documents
    where project_id = v_stelar_id and title = 'Brochure Comercial Cosmos Stelar (ES)' limit 1;

    if v_doc_id is not null and not exists (select 1 from public.document_versions where document_id = v_doc_id) then
      insert into public.document_versions (
        document_id, version_number, storage_bucket, storage_path,
        mime_type, size_bytes, checksum_sha256, published_at, created_at
      ) values (
        v_doc_id, 1, 'private-documents', 'cana-rock-osvaldo-bello/projects/' || v_stelar_id || '/' || v_doc_id || '/v1.pdf',
        'application/pdf', 4100000, '7e182390ba6e4cbe394bca4e65007da74b4861bcfa073b64c7ea4ff2e90c8a1', now(), now()
      );
    end if;

    -- Cosmos Stelar: Ficha Técnica (authorized, approved)
    insert into public.project_documents (organization_id, project_id, title, category, visibility, status, created_at, updated_at)
    values (v_org_id, v_stelar_id, 'Ficha Técnica Cosmos Stelar (ES)', 'technical', 'authorized', 'approved', now(), now())
    on conflict do nothing;

    select id into v_doc_id from public.project_documents
    where project_id = v_stelar_id and title = 'Ficha Técnica Cosmos Stelar (ES)' limit 1;

    if v_doc_id is not null and not exists (select 1 from public.document_versions where document_id = v_doc_id) then
      insert into public.document_versions (
        document_id, version_number, storage_bucket, storage_path,
        mime_type, size_bytes, checksum_sha256, published_at, created_at
      ) values (
        v_doc_id, 1, 'private-documents', 'cana-rock-osvaldo-bello/projects/' || v_stelar_id || '/' || v_doc_id || '/v1.pdf',
        'application/pdf', 1580000, '3d891bcfa073b64c7ea4ff2e90f234a810f769018e64cbe394bca4e65007da74', now(), now()
      );
    end if;
  end if;
end $$;
