-- Cana Rock / Osvaldo Bello is a commercial ally and representative, not a
-- master broker organization. The developer is Grupo Cana Rock.
alter table public.organizations drop constraint if exists organizations_kind_check;
alter table public.organizations add constraint organizations_kind_check
  check (kind in ('platform', 'master_broker', 'agency', 'developer', 'partner'));

update public.organizations
set kind = 'partner', updated_at = now()
where slug = 'cana-rock-osvaldo-bello';

update public.organization_relationships
set relationship_type = 'partner_of', updated_at = now()
where source_organization_id = (select id from public.organizations where slug = 'cana-rock-osvaldo-bello')
  and target_organization_id = (select id from public.organizations where slug = 'grupo-cana-rock')
  and relationship_type = 'master_broker_for';
