-- Recuperada del historial remoto de Supabase (aplicada fuera de git)
-- Public professional-access requests are not CRM leads.
-- They remain pending until a master-broker operator reviews and approves them.
create table if not exists public.broker_access_requests (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  full_name text not null check (char_length(trim(full_name)) between 2 and 160),
  email extensions.citext not null,
  phone text not null check (char_length(trim(phone)) between 7 and 40),
  agency text,
  role_type text not null default 'Broker inmobiliario',
  project_interest text,
  message text,
  status text not null default 'pending_review' check (status in (
    'pending_review', 'contacted', 'approved', 'changes_requested', 'rejected', 'converted'
  )),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((email::text) ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  check (message is null or char_length(message) <= 4000),
  check (project_interest is null or char_length(project_interest) <= 200)
);

create index if not exists broker_access_requests_org_status_idx
  on public.broker_access_requests (organization_id, status, created_at desc);
create index if not exists broker_access_requests_email_idx
  on public.broker_access_requests (organization_id, email);

drop trigger if exists broker_access_requests_set_updated_at on public.broker_access_requests;
create trigger broker_access_requests_set_updated_at
  before update on public.broker_access_requests
  for each row execute function private.set_updated_at();

alter table public.broker_access_requests enable row level security;
revoke all on table public.broker_access_requests from public, anon, authenticated;
grant select, update on table public.broker_access_requests to authenticated;

drop policy if exists broker_access_requests_staff_select on public.broker_access_requests;
create policy broker_access_requests_staff_select
  on public.broker_access_requests for select to authenticated
  using ((select private.has_org_role(
    organization_id,
    array['super_admin', 'master_broker_admin', 'master_broker_operations']::text[]
  )));

drop policy if exists broker_access_requests_staff_update on public.broker_access_requests;
create policy broker_access_requests_staff_update
  on public.broker_access_requests for update to authenticated
  using ((select private.has_org_role(
    organization_id,
    array['super_admin', 'master_broker_admin', 'master_broker_operations']::text[]
  )))
  with check ((select private.has_org_role(
    organization_id,
    array['super_admin', 'master_broker_admin', 'master_broker_operations']::text[]
  )));

create or replace function public.submit_broker_access_request(
  full_name text,
  email text,
  phone text,
  agency text default '',
  role_type text default 'Broker inmobiliario',
  project_interest text default '',
  message text default ''
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org_id bigint := 1;
  v_full_name text := trim(full_name);
  v_email extensions.citext := lower(trim(email));
  v_phone text := trim(phone);
  v_agency text := nullif(trim(agency), '');
  v_project text := nullif(trim(project_interest), '');
  v_message text := nullif(trim(message), '');
  v_role text := case lower(trim(role_type))
    when 'broker inmobiliario' then 'Broker inmobiliario'
    when 'director de agencia' then 'Director de agencia'
    when 'master broker' then 'Master broker'
    else 'Broker inmobiliario'
  end;
  v_request_id bigint;
begin
  if char_length(v_full_name) < 2 or char_length(v_full_name) > 160 then
    raise exception 'Nombre inválido';
  end if;
  if v_email::text !~* '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
    raise exception 'Correo inválido';
  end if;
  if char_length(v_phone) < 7 or char_length(v_phone) > 40
     or char_length(regexp_replace(v_phone, '\D', '', 'g')) < 7 then
    raise exception 'Teléfono inválido';
  end if;
  if v_message is not null and char_length(v_message) > 4000 then
    raise exception 'Mensaje demasiado largo';
  end if;
  if v_project is not null and char_length(v_project) > 200 then
    raise exception 'Proyecto inválido';
  end if;

  -- Re-submit an open request instead of creating duplicate review items.
  select id into v_request_id
  from public.broker_access_requests
  where organization_id = v_org_id
    and email = v_email
    and status in ('pending_review', 'contacted', 'changes_requested')
  order by created_at desc
  limit 1;

  if v_request_id is not null then
    update public.broker_access_requests
    set full_name = v_full_name,
        phone = v_phone,
        agency = v_agency,
        role_type = v_role,
        project_interest = v_project,
        message = v_message,
        updated_at = now()
    where id = v_request_id;
    return v_request_id;
  end if;

  insert into public.broker_access_requests (
    organization_id, full_name, email, phone, agency, role_type,
    project_interest, message
  ) values (
    v_org_id, v_full_name, v_email, v_phone, v_agency, v_role,
    v_project, v_message
  ) returning id into v_request_id;

  perform public.notify_org_admins(
    v_org_id,
    'broker_access_request',
    'Nueva solicitud de acceso profesional',
    format('%s solicitó acceso como %s%s', v_full_name, v_role,
      case when v_agency is null then '' else format(' · %s', v_agency) end),
    '/portal/admin/broker-requests'
  );

  return v_request_id;
end;
$$;

revoke all on function public.submit_broker_access_request(text, text, text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.submit_broker_access_request(text, text, text, text, text, text, text)
  to service_role;

comment on table public.broker_access_requests is
  'Professional broker access applications. Deliberately separate from CRM contacts and leads.';


