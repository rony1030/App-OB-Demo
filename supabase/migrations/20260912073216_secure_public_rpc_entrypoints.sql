-- Recuperada del historial remoto de Supabase (aplicada fuera de git)
-- Browser clients must never be able to invoke privileged telemetry or lead
-- capture functions directly. Both operations now originate in validated
-- Next.js Server Actions using the service-role key.
revoke all on function public.record_presence(text, text, bigint) from public, anon, authenticated;
revoke all on function public.submit_landing_access_request(text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.submit_landing_access_request(text, text, text, text, text, text) to service_role;

create or replace function public.record_presence_service(
  target_session_key text,
  target_surface text,
  target_project_id bigint default null,
  target_actor_user_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare current_org_id bigint;
begin
  if target_session_key is null or target_session_key !~ '^[A-Za-z0-9_-]{16,128}$' then
    raise exception 'Sesión inválida';
  end if;
  if target_surface not in ('crm', 'landing', 'proposal_viewer', 'dossier_viewer') then
    raise exception 'Superficie inválida';
  end if;
  if target_project_id is not null and not exists (
    select 1 from public.projects p
    where p.id = target_project_id and p.publication_status = 'published'
  ) then
    raise exception 'Proyecto no disponible';
  end if;
  if target_actor_user_id is not null then
    select m.organization_id into current_org_id
    from public.memberships m
    where m.user_id = target_actor_user_id and m.status = 'active'
    order by m.is_primary desc nulls last, m.id
    limit 1;
  end if;
  insert into public.presence_sessions (
    session_key, user_id, organization_id, project_id, surface, last_seen_at, ended_at
  ) values (
    target_session_key, target_actor_user_id, current_org_id, target_project_id, target_surface, now(), null
  )
  on conflict (session_key, surface, (coalesce(project_id, 0)))
  do update set
    user_id = excluded.user_id,
    organization_id = excluded.organization_id,
    last_seen_at = now(),
    ended_at = null;
end;
$$;

revoke all on function public.record_presence_service(text, text, bigint, uuid) from public, anon, authenticated;
grant execute on function public.record_presence_service(text, text, bigint, uuid) to service_role;
