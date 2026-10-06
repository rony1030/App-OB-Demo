-- Centrally managed offers for the broker catalog. Brokers may consume an
-- active offer, but only platform/master-broker marketing roles can create or
-- change one. Every applied offer is frozen into the proposal snapshot.

create table public.marketing_offers (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete restrict,
  title text not null check (char_length(trim(title)) between 3 and 120),
  offer_type text not null check (offer_type in ('discount', 'promotion')),
  description text not null default '' check (char_length(description) <= 1200),
  promotion_text text check (promotion_text is null or char_length(promotion_text) <= 500),
  discount_percent numeric(5,2),
  banner_path text,
  display_placement text not null default 'header_banner'
    check (display_placement in ('header_banner', 'side_card', 'popup', 'fullscreen')),
  status text not null default 'draft'
    check (status in ('draft', 'active', 'paused', 'archived')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  priority integer not null default 0 check (priority between -100 and 100),
  requires_opt_in boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (
    (offer_type = 'discount' and discount_percent > 0 and discount_percent <= 100)
    or
    (offer_type = 'promotion' and discount_percent is null and char_length(trim(coalesce(promotion_text, ''))) > 0)
  )
);

create table public.marketing_offer_projects (
  offer_id bigint not null references public.marketing_offers(id) on delete cascade,
  project_id bigint not null references public.projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (offer_id, project_id)
);

create index marketing_offers_org_status_dates_idx
  on public.marketing_offers (organization_id, status, starts_at, ends_at);
create index marketing_offer_projects_project_idx
  on public.marketing_offer_projects (project_id, offer_id);

create trigger marketing_offers_set_updated_at
before update on public.marketing_offers
for each row execute function private.set_updated_at();

create or replace function private.marketing_offer_is_manageable(target_offer_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.marketing_offers offer
      where offer.id = target_offer_id
        and (select private.has_org_role(
          offer.organization_id,
          array['super_admin', 'master_broker_admin', 'master_broker_operations']::text[]
        ))
    );
$$;

create or replace function private.marketing_offer_is_viewable(target_offer_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.marketing_offers offer
      where offer.id = target_offer_id
        and (
          (select private.has_org_role(offer.organization_id, null))
          or exists (
            select 1
            from public.marketing_offer_projects link
            where link.offer_id = offer.id
              and (select private.can_view_project(link.project_id))
          )
        )
    );
$$;

create or replace function private.project_marketing_is_manageable(target_project_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.projects project
      where project.id = target_project_id
        and (select private.has_org_role(
          project.organization_id,
          array['super_admin', 'master_broker_admin', 'master_broker_operations']::text[]
        ))
    );
$$;

create or replace function private.enforce_marketing_offer_project_owner()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  offer_org_id bigint;
  project_org_id bigint;
begin
  select organization_id into offer_org_id
  from public.marketing_offers
  where id = new.offer_id;

  select organization_id into project_org_id
  from public.projects
  where id = new.project_id;

  if offer_org_id is null or project_org_id is null or offer_org_id <> project_org_id then
    raise exception 'La oferta y el proyecto deben pertenecer a la misma organización.';
  end if;

  return new;
end;
$$;

create trigger marketing_offer_projects_same_owner
before insert or update on public.marketing_offer_projects
for each row execute function private.enforce_marketing_offer_project_owner();

revoke all on function private.marketing_offer_is_manageable(bigint) from public;
revoke all on function private.marketing_offer_is_viewable(bigint) from public;
revoke all on function private.project_marketing_is_manageable(bigint) from public;
grant execute on function private.marketing_offer_is_manageable(bigint) to authenticated;
grant execute on function private.marketing_offer_is_viewable(bigint) to authenticated;
grant execute on function private.project_marketing_is_manageable(bigint) to authenticated;

alter table public.marketing_offers enable row level security;
alter table public.marketing_offer_projects enable row level security;

revoke all on table public.marketing_offers from anon, authenticated;
revoke all on table public.marketing_offer_projects from anon, authenticated;
grant select, insert, update, delete on table public.marketing_offers to authenticated;
grant select, insert, update, delete on table public.marketing_offer_projects to authenticated;
grant usage, select on sequence public.marketing_offers_id_seq to authenticated;

create policy marketing_offers_authorized_select
on public.marketing_offers for select to authenticated
using ((select private.marketing_offer_is_viewable(id)));

create policy marketing_offers_marketing_insert
on public.marketing_offers for insert to authenticated
with check ((select private.has_org_role(
  organization_id,
  array['super_admin', 'master_broker_admin', 'master_broker_operations']::text[]
)));

create policy marketing_offers_marketing_update
on public.marketing_offers for update to authenticated
using ((select private.marketing_offer_is_manageable(id)))
with check ((select private.has_org_role(
  organization_id,
  array['super_admin', 'master_broker_admin', 'master_broker_operations']::text[]
)));

create policy marketing_offers_marketing_delete
on public.marketing_offers for delete to authenticated
using ((select private.marketing_offer_is_manageable(id)));

create policy marketing_offer_projects_authorized_select
on public.marketing_offer_projects for select to authenticated
using (
  (select private.marketing_offer_is_viewable(offer_id))
  and (select private.can_view_project(project_id))
);

create policy marketing_offer_projects_marketing_insert
on public.marketing_offer_projects for insert to authenticated
with check (
  (select private.marketing_offer_is_manageable(offer_id))
  and (select private.project_marketing_is_manageable(project_id))
);

create policy marketing_offer_projects_marketing_update
on public.marketing_offer_projects for update to authenticated
using (
  (select private.marketing_offer_is_manageable(offer_id))
  and (select private.project_marketing_is_manageable(project_id))
)
with check (
  (select private.marketing_offer_is_manageable(offer_id))
  and (select private.project_marketing_is_manageable(project_id))
);

create policy marketing_offer_projects_marketing_delete
on public.marketing_offer_projects for delete to authenticated
using (
  (select private.marketing_offer_is_manageable(offer_id))
  and (select private.project_marketing_is_manageable(project_id))
);

comment on table public.marketing_offers is
  'Time-bounded discounts and promotions prepared by master-broker marketing staff.';
comment on table public.marketing_offer_projects is
  'Projects covered by an authorized marketing offer.';
