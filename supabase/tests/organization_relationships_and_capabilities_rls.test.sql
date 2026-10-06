begin;

create extension if not exists pgtap with schema extensions;
select plan(16);

select has_table('public', 'organization_relationships', 'organization_relationships exists');
select has_table('public', 'project_responsibilities', 'project_responsibilities exists');
select has_table('public', 'project_access_capabilities', 'project_access_capabilities exists');

select ok(
  (select c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'organization_relationships'),
  'organization_relationships has RLS enabled'
);
select ok(
  (select c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'project_responsibilities'),
  'project_responsibilities has RLS enabled'
);
select ok(
  (select c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'project_access_capabilities'),
  'project_access_capabilities has RLS enabled'
);

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000201', 'authenticated', 'authenticated', 'platform@test.invalid', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000202', 'authenticated', 'authenticated', 'admin-a@test.invalid', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000203', 'authenticated', 'authenticated', 'admin-b@test.invalid', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now());

insert into public.organizations (slug, name, kind)
values
  ('rls-rel-platform', 'RLS Relationship Platform', 'platform'),
  ('rls-rel-mb-a', 'RLS Relationship MB A', 'master_broker'),
  ('rls-rel-mb-b', 'RLS Relationship MB B', 'master_broker'),
  ('rls-rel-developer-c', 'RLS Relationship Developer C', 'developer');

insert into public.memberships (organization_id, user_id, role, status)
values
  ((select id from public.organizations where slug = 'rls-rel-platform'), '00000000-0000-0000-0000-000000000201', 'super_admin', 'active'),
  ((select id from public.organizations where slug = 'rls-rel-mb-a'), '00000000-0000-0000-0000-000000000202', 'master_broker_admin', 'active'),
  ((select id from public.organizations where slug = 'rls-rel-mb-b'), '00000000-0000-0000-0000-000000000203', 'master_broker_admin', 'active');

insert into public.projects (
  organization_id, developer_organization_id, slug, name, location, zone,
  lifecycle_status, publication_status
)
values (
  (select id from public.organizations where slug = 'rls-rel-mb-a'),
  (select id from public.organizations where slug = 'rls-rel-developer-c'),
  'rls-rel-project-a', 'RLS Relationship Project A', 'Test', 'Test',
  'pre_construction', 'draft'
);

insert into public.organization_relationships (
  source_organization_id, target_organization_id, relationship_type, status
)
values
  ((select id from public.organizations where slug = 'rls-rel-mb-a'),
   (select id from public.organizations where slug = 'rls-rel-developer-c'),
   'master_broker_for', 'active'),
  ((select id from public.organizations where slug = 'rls-rel-mb-b'),
   (select id from public.organizations where slug = 'rls-rel-developer-c'),
   'master_broker_for', 'active');

insert into public.project_access (
  organization_id, project_id, grantee_organization_id, access_level
)
values (
  (select organization_id from public.projects where slug = 'rls-rel-project-a'),
  (select id from public.projects where slug = 'rls-rel-project-a'),
  (select id from public.organizations where slug = 'rls-rel-mb-b'),
  'sell'
);

insert into public.project_responsibilities (
  project_id, responsible_organization_id, responsibility, is_primary
)
values (
  (select id from public.projects where slug = 'rls-rel-project-a'),
  (select id from public.organizations where slug = 'rls-rel-mb-a'),
  'master_broker.primary',
  true
);

insert into public.project_access_capabilities (project_access_id, project_id, capability)
values (
  (select id from public.project_access
   where project_id = (select id from public.projects where slug = 'rls-rel-project-a')
     and grantee_organization_id = (select id from public.organizations where slug = 'rls-rel-mb-b')),
  (select id from public.projects where slug = 'rls-rel-project-a'),
  'proposal.create'
);

select set_config(
  'test.relationship_project_id',
  (select id::text from public.projects where slug = 'rls-rel-project-a'),
  true
);
select set_config(
  'test.relationship_access_id',
  (select id::text from public.project_access
   where project_id = (select id from public.projects where slug = 'rls-rel-project-a')
     and grantee_organization_id = (select id from public.organizations where slug = 'rls-rel-mb-b')),
  true
);
select set_config(
  'test.relationship_developer_id',
  (select id::text from public.organizations where slug = 'rls-rel-developer-c'),
  true
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000202', true);

select results_eq(
  $$select relationship_type from public.organization_relationships
    where source_organization_id = (
      select id from public.organizations where slug = 'rls-rel-mb-a'
    )$$,
  $$values ('master_broker_for'::text)$$,
  'MB-A sees its relationship with the developer'
);
select is_empty(
  $$select id from public.organization_relationships
    where source_organization_id = (
      select id from public.organizations where slug = 'rls-rel-mb-b'
    )$$,
  'MB-A cannot see the MB-B relationship'
);
select throws_ok(
  $$insert into public.organization_relationships
      (source_organization_id, target_organization_id, relationship_type, status)
    values (
      (select id from public.organizations where slug = 'rls-rel-mb-a'),
      current_setting('test.relationship_developer_id')::bigint,
      'partner_of', 'active'
    )$$,
  '42501',
  null,
  'master broker admin cannot formalize organization relationships'
);
select lives_ok(
  $$insert into public.project_responsibilities
      (project_id, responsible_organization_id, responsibility)
    values (
      current_setting('test.relationship_project_id')::bigint,
      (select id from public.organizations where slug = 'rls-rel-mb-a'),
      'content.approver'
    )$$,
  'project owner admin can assign a responsibility'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000203', true);
select results_eq(
  $$select responsibility from public.project_responsibilities
    where responsibility = 'master_broker.primary'$$,
  $$values ('master_broker.primary'::text)$$,
  'organization with project access can read project responsibilities'
);
select throws_ok(
  $$insert into public.project_responsibilities
      (project_id, responsible_organization_id, responsibility)
    values (
      current_setting('test.relationship_project_id')::bigint,
      (select id from public.organizations where slug = 'rls-rel-mb-b'),
      'content.approver'
    )$$,
  '42501',
  null,
  'organization with project access cannot assign responsibilities'
);
select results_eq(
  $$select capability from public.project_access_capabilities$$,
  $$values ('proposal.create'::text)$$,
  'organization with project access can read its project capability'
);
select throws_ok(
  $$insert into public.project_access_capabilities (project_access_id, project_id, capability)
    values (
      current_setting('test.relationship_access_id')::bigint,
      current_setting('test.relationship_project_id')::bigint,
      'project.content.manage'
    )$$,
  '42501',
  null,
  'organization with project access cannot grant itself a capability'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000201', true);
select lives_ok(
  $$insert into public.organization_relationships
      (source_organization_id, target_organization_id, relationship_type, status)
    values (
      (select id from public.organizations where slug = 'rls-rel-mb-a'),
      (select id from public.organizations where slug = 'rls-rel-mb-b'),
      'partner_of', 'active'
    )$$,
  'platform super admin can formalize organization relationships'
);

reset role;
select ok(
  not has_table_privilege('anon', 'public.organization_relationships', 'select,insert,update,delete')
  and not has_table_privilege('anon', 'public.project_responsibilities', 'select,insert,update,delete')
  and not has_table_privilege('anon', 'public.project_access_capabilities', 'select,insert,update,delete'),
  'anonymous users have no relationship or capability privileges'
);

select * from finish();
rollback;
