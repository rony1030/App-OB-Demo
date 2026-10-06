create table if not exists public.presence_sessions (
  id uuid primary key default extensions.gen_random_uuid(),
  session_key text not null,
  user_id uuid references auth.users(id) on delete set null,
  organization_id bigint references public.organizations(id) on delete cascade,
  project_id bigint references public.projects(id) on delete set null,
  surface text not null check (surface in ('crm', 'landing', 'proposal_viewer', 'dossier_viewer')),
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  ended_at timestamptz,
  constraint presence_sessions_key_check check (length(session_key) between 16 and 128)
);

create unique index if not exists presence_sessions_active_key_idx
  on public.presence_sessions(session_key, surface, coalesce(project_id, 0));
create index if not exists presence_sessions_org_seen_idx
  on public.presence_sessions(organization_id, last_seen_at desc);
create index if not exists presence_sessions_project_seen_idx
  on public.presence_sessions(project_id, last_seen_at desc);

alter table public.presence_sessions enable row level security;
revoke all on table public.presence_sessions from anon, authenticated;

create or replace function public.record_presence(
  target_session_key text,
  target_surface text,
  target_project_id bigint default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare current_user_id uuid := (select auth.uid());
declare current_org_id bigint;
begin
  if target_session_key is null or target_session_key !~ '^[A-Za-z0-9_-]{16,128}$' then
    raise exception 'Sesión inválida';
  end if;
  if target_surface not in ('crm', 'landing', 'proposal_viewer', 'dossier_viewer') then
    raise exception 'Superficie inválida';
  end if;
  if target_project_id is not null and not exists (
    select 1 from public.projects p where p.id = target_project_id and p.publication_status = 'published'
  ) then
    raise exception 'Proyecto no disponible';
  end if;

  if current_user_id is not null then
    select m.organization_id into current_org_id
      from public.memberships m
     where m.user_id = current_user_id and m.status = 'active'
     order by m.is_primary desc nulls last, m.id
     limit 1;
  end if;

  insert into public.presence_sessions (session_key, user_id, organization_id, project_id, surface, last_seen_at, ended_at)
  values (target_session_key, current_user_id, current_org_id, target_project_id, target_surface, now(), null)
  on conflict (session_key, surface, (coalesce(project_id, 0)))
  do update set user_id = excluded.user_id,
                organization_id = excluded.organization_id,
                last_seen_at = now(),
                ended_at = null;
end;
$$;

grant execute on function public.record_presence(text, text, bigint) to anon, authenticated;

comment on table public.presence_sessions is 'Ephemeral presence telemetry. A session is active only while last_seen_at is within the reporting window.';
