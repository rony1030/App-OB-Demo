begin;

create extension if not exists pgtap with schema extensions;
select plan(16);

select has_table('public', 'integration_connections', 'integration_connections exists');
select has_table('public', 'inventory_sync_runs', 'inventory_sync_runs exists');
select has_table('public', 'external_unit_mappings', 'external_unit_mappings exists');
select has_table('public', 'inventory_source_snapshots', 'inventory_source_snapshots exists');

select ok(
  (select c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'integration_connections'),
  'integration_connections has RLS enabled'
);
select ok(
  (select c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'inventory_sync_runs'),
  'inventory_sync_runs has RLS enabled'
);
select ok(
  (select c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'external_unit_mappings'),
  'external_unit_mappings has RLS enabled'
);
select ok(
  (select c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname = 'inventory_source_snapshots'),
  'inventory_source_snapshots has RLS enabled'
);

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000101', 'authenticated', 'authenticated', 'admin-a@test.invalid', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000102', 'authenticated', 'authenticated', 'admin-b@test.invalid', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000103', 'authenticated', 'authenticated', 'broker-c@test.invalid', '', now(), '{}'::jsonb, '{}'::jsonb, now(), now());

insert into public.organizations (slug, name, kind)
values
  ('rls-test-mb-a', 'RLS Test MB A', 'master_broker'),
  ('rls-test-mb-b', 'RLS Test MB B', 'master_broker');

insert into public.memberships (organization_id, user_id, role, status)
values
  ((select id from public.organizations where slug = 'rls-test-mb-a'), '00000000-0000-0000-0000-000000000101', 'master_broker_admin', 'active'),
  ((select id from public.organizations where slug = 'rls-test-mb-b'), '00000000-0000-0000-0000-000000000102', 'master_broker_admin', 'active'),
  ((select id from public.organizations where slug = 'rls-test-mb-b'), '00000000-0000-0000-0000-000000000103', 'broker_agent', 'active');

insert into public.projects (
  organization_id, slug, name, location, zone, lifecycle_status, publication_status
)
values
  ((select id from public.organizations where slug = 'rls-test-mb-a'), 'rls-test-project-a', 'RLS Test Project A', 'Test', 'Test', 'pre_construction', 'draft'),
  ((select id from public.organizations where slug = 'rls-test-mb-b'), 'rls-test-project-b', 'RLS Test Project B', 'Test', 'Test', 'pre_construction', 'draft');

insert into public.project_access (
  organization_id, project_id, grantee_membership_id, access_level
)
values (
  (select organization_id from public.projects where slug = 'rls-test-project-a'),
  (select id from public.projects where slug = 'rls-test-project-a'),
  (select id from public.memberships where user_id = '00000000-0000-0000-0000-000000000103'),
  'view'
);

insert into public.integration_connections (
  project_id, provider, display_name, external_project_id, base_url, credentials_secret_name
)
values
  ((select id from public.projects where slug = 'rls-test-project-a'), 'test_provider', 'Connection A', 'project-a', 'https://example.invalid', 'TEST_SECRET_A'),
  ((select id from public.projects where slug = 'rls-test-project-b'), 'test_provider', 'Connection B', 'project-b', 'https://example.invalid', 'TEST_SECRET_B');

select set_config(
  'test.project_b_id',
  (select id::text from public.projects where slug = 'rls-test-project-b'),
  true
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000101', true);

select results_eq(
  $$select display_name from public.integration_connections order by display_name$$,
  $$values ('Connection A'::text)$$,
  'MB-A sees only its own connection'
);
select is_empty(
  $$select id from public.integration_connections where display_name = 'Connection B'$$,
  'MB-A cannot read MB-B connection'
);
select lives_ok(
  $$insert into public.integration_connections
      (project_id, provider, display_name, external_project_id, base_url, credentials_secret_name)
    values
      ((select id from public.projects where slug = 'rls-test-project-a'), 'test_provider',
       'Connection A2', 'project-a-2', 'https://example.invalid', 'TEST_SECRET_A2')$$,
  'MB-A admin can create a connection for Project A'
);
select throws_ok(
  $$insert into public.integration_connections
      (project_id, provider, display_name, external_project_id, base_url, credentials_secret_name)
    values
      (current_setting('test.project_b_id')::bigint, 'test_provider',
       'Forbidden connection', 'forbidden', 'https://example.invalid', 'TEST_SECRET_FORBIDDEN')$$,
  '42501',
  null,
  'MB-A admin cannot create a connection for Project B'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000103', true);
select results_eq(
  $$select display_name from public.integration_connections where display_name = 'Connection A'$$,
  $$values ('Connection A'::text)$$,
  'assigned broker can read the Project A connection status'
);
select throws_ok(
  $$insert into public.integration_connections
      (project_id, provider, display_name, external_project_id, base_url, credentials_secret_name)
    values
      ((select id from public.projects where slug = 'rls-test-project-a'), 'test_provider',
       'Broker connection', 'broker-forbidden', 'https://example.invalid', 'TEST_SECRET_BROKER')$$,
  '42501',
  null,
  'assigned broker cannot manage integrations'
);

reset role;
select ok(
  not has_table_privilege('anon', 'public.integration_connections', 'select,insert,update,delete'),
  'anonymous users have no integration connection privileges'
);
select ok(
  not has_table_privilege('authenticated', 'public.inventory_sync_runs', 'insert,update,delete')
  and not has_table_privilege('authenticated', 'public.external_unit_mappings', 'insert,update,delete')
  and not has_table_privilege('authenticated', 'public.inventory_source_snapshots', 'insert,update,delete'),
  'authenticated clients cannot mutate sync evidence'
);

select * from finish();
rollback;
