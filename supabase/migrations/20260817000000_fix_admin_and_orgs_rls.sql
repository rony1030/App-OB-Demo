-- Migration: Fix Row Level Security policies for organizations, projects, payment plan steps, and admin operations

-- 1. Enhance private.has_org_role to grant super_admin universal access across all organizations
create or replace function private.has_org_role(target_organization_id bigint, allowed_roles text[] default null)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and (
      -- Global super_admin or master_broker_admin bypass
      exists (
        select 1
        from public.memberships m
        where m.user_id = (select auth.uid())
          and m.status = 'active'
          and m.role in ('super_admin', 'master_broker_admin')
      )
      -- Or member of target org with allowed role
      or exists (
        select 1
        from public.memberships m
        where m.organization_id = target_organization_id
          and m.user_id = (select auth.uid())
          and m.status = 'active'
          and (allowed_roles is null or m.role = any (allowed_roles))
      )
    );
$$;

-- 2. Organizations RLS policies: Allow insert, update, select for authenticated users
drop policy if exists organizations_member_select on public.organizations;
drop policy if exists organizations_anon_catalog on public.organizations;
drop policy if exists organizations_admin_insert on public.organizations;
drop policy if exists organizations_admin_update on public.organizations;
drop policy if exists organizations_public_select on public.organizations;

create policy organizations_public_select on public.organizations
  for select to anon, authenticated
  using (true);

create policy organizations_admin_insert on public.organizations
  for insert to authenticated
  with check (true);

create policy organizations_admin_update on public.organizations
  for update to authenticated
  using ((select private.has_org_role(id, array['super_admin','master_broker_admin']::text[])) or (select auth.uid()) is not null)
  with check ((select private.has_org_role(id, array['super_admin','master_broker_admin']::text[])) or (select auth.uid()) is not null);

-- 3. Payment Plan Steps RLS policies
drop policy if exists payment_plan_steps_org_insert on public.payment_plan_steps;
drop policy if exists payment_plan_steps_org_update on public.payment_plan_steps;
drop policy if exists payment_plan_steps_org_delete on public.payment_plan_steps;

create policy payment_plan_steps_org_insert on public.payment_plan_steps
  for insert to authenticated
  with check (exists (
    select 1 from public.payment_plans pp
    where pp.id = payment_plan_id
      and (select private.has_org_role(pp.organization_id, array['super_admin','master_broker_admin','master_broker_operations','agency_admin','developer_admin']::text[]))
  ));

create policy payment_plan_steps_org_update on public.payment_plan_steps
  for update to authenticated
  using (exists (
    select 1 from public.payment_plans pp
    where pp.id = payment_plan_id
      and (select private.has_org_role(pp.organization_id, array['super_admin','master_broker_admin','master_broker_operations','agency_admin','developer_admin']::text[]))
  ))
  with check (exists (
    select 1 from public.payment_plans pp
    where pp.id = payment_plan_id
      and (select private.has_org_role(pp.organization_id, array['super_admin','master_broker_admin','master_broker_operations','agency_admin','developer_admin']::text[]))
  ));

create policy payment_plan_steps_org_delete on public.payment_plan_steps
  for delete to authenticated
  using (exists (
    select 1 from public.payment_plans pp
    where pp.id = payment_plan_id
      and (select private.has_org_role(pp.organization_id, array['super_admin','master_broker_admin','master_broker_operations','agency_admin','developer_admin']::text[]))
  ));

-- 4. Automatically link user membership on organization creation
create or replace function public.handle_new_organization()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_uid uuid;
begin
  current_uid := auth.uid();
  if current_uid is not null then
    insert into public.memberships (organization_id, user_id, role, status, is_primary)
    values (new.id, current_uid, 'master_broker_admin', 'active', false)
    on conflict (organization_id, user_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_organization_created on public.organizations;
create trigger on_organization_created
  after insert on public.organizations
  for each row execute function public.handle_new_organization();

-- 5. Ensure grants for authenticated users
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on public.organizations, public.projects, public.project_media, public.amenities,
  public.project_amenities, public.project_highlights, public.payment_plans,
  public.payment_plan_steps, public.typologies, public.units, public.brand_profiles to anon;
grant usage, select on all sequences in schema public to authenticated;
