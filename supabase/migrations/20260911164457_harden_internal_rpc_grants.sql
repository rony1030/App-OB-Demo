-- Keep internal security-definer helpers out of the anonymous API surface.
-- Public landing and presence entry points remain intentionally callable.
create or replace function public.notify_org_admins(
  target_organization_id bigint,
  notif_type text,
  notif_title text,
  notif_body text default '',
  notif_link text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is not null
     and not exists (
       select 1
       from public.memberships membership
       where membership.user_id = current_user_id
         and membership.status = 'active'
         and (
           membership.organization_id = target_organization_id
           or membership.role = 'super_admin'
         )
     ) then
    raise exception 'Not authorized to notify this organization.'
      using errcode = '42501';
  end if;

  insert into public.notifications (organization_id, membership_id, type, title, body, link)
  select target_organization_id, membership.id, notif_type, notif_title, notif_body, notif_link
  from public.memberships membership
  where membership.organization_id = target_organization_id
    and membership.status = 'active'
    and membership.role in ('super_admin', 'master_broker_admin', 'master_broker_operations');
end;
$$;

revoke all on function public.accept_invitation(text, text) from public, anon, authenticated;
grant execute on function public.accept_invitation(text, text) to authenticated, service_role;

revoke all on function public.handle_new_user() from public, anon, authenticated;

revoke all on function public.notify_org_admins(bigint, text, text, text, text) from public, anon, authenticated;
grant execute on function public.notify_org_admins(bigint, text, text, text, text) to authenticated, service_role;

revoke all on function public.replace_project_amenities(bigint, jsonb) from public, anon, authenticated;
grant execute on function public.replace_project_amenities(bigint, jsonb) to authenticated, service_role;

revoke all on function public.reserve_lot(bigint, bigint, text, integer) from public, anon, authenticated;
grant execute on function public.reserve_lot(bigint, bigint, text, integer) to authenticated, service_role;
