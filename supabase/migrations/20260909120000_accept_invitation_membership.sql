create or replace function public.accept_invitation(invitation_token text, display_name text default null)
returns table (
  membership_id bigint,
  organization_id bigint,
  role text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_email extensions.citext;
  invite public.invitations%rowtype;
  resolved_display_name text;
begin
  if current_user_id is null then
    raise exception 'Debes iniciar sesion para aceptar esta invitacion.';
  end if;

  select email::extensions.citext
    into current_email
  from auth.users
  where id = current_user_id;

  select *
    into invite
  from public.invitations
  where token = invitation_token
  for update;

  if invite.id is null then
    raise exception 'Invitacion no encontrada.';
  end if;

  if invite.status <> 'pending' then
    raise exception 'Esta invitacion ya no esta pendiente.';
  end if;

  if invite.expires_at <= now() then
    update public.invitations
    set status = 'expired'
    where id = invite.id;

    raise exception 'Esta invitacion ha expirado.';
  end if;

  if invite.email::extensions.citext <> current_email then
    raise exception 'El correo autenticado no coincide con esta invitacion.';
  end if;

  resolved_display_name := coalesce(
    nullif(trim(display_name), ''),
    split_part(current_email::text, '@', 1),
    'Usuario'
  );

  insert into public.profiles (user_id, display_name, email)
  values (current_user_id, resolved_display_name, current_email)
  on conflict (user_id) do update
  set
    display_name = excluded.display_name,
    email = excluded.email,
    updated_at = now();

  insert into public.memberships (
    organization_id,
    user_id,
    role,
    status,
    is_primary,
    updated_at
  )
  values (
    invite.organization_id,
    current_user_id,
    invite.role,
    'active',
    not exists (
      select 1
      from public.memberships existing
      where existing.user_id = current_user_id
        and existing.status = 'active'
    ),
    now()
  )
  on conflict (organization_id, user_id) do update
  set
    role = excluded.role,
    status = 'active',
    updated_at = now()
  returning id, memberships.organization_id, memberships.role
    into membership_id, organization_id, role;

  insert into public.project_access (
    organization_id,
    project_id,
    grantee_membership_id,
    access_level
  )
  select
    p.organization_id,
    p.id,
    membership_id,
    'sell'
  from public.projects p
  where p.id = any(invite.project_ids)
    and not exists (
      select 1
      from public.project_access pa
      where pa.project_id = p.id
        and pa.grantee_membership_id = membership_id
    );

  update public.invitations
  set
    status = 'accepted',
    accepted_at = now()
  where id = invite.id;

  return next;
end;
$$;

revoke all on function public.accept_invitation(text, text) from public;
grant execute on function public.accept_invitation(text, text) to authenticated;
