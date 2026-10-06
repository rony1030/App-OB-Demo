-- Agency invitations now collect onboarding data first and wait for
-- OB Brokers review before a CRM user is activated.

alter table public.invitations
  drop constraint if exists invitations_status_check;

alter table public.invitations
  add constraint invitations_status_check check (
    status in ('pending', 'onboarding_submitted', 'accepted', 'revoked', 'expired')
  );

create table if not exists public.agency_onboarding_submissions (
  id bigint generated always as identity primary key,
  invitation_id bigint not null references public.invitations(id) on delete cascade,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  agency_name text not null,
  legal_name text,
  tax_id text,
  legal_address text,
  contact_email extensions.citext not null,
  contact_phone text,
  representative_name text not null,
  representative_email extensions.citext not null,
  representative_phone text,
  status text not null default 'pending_review'
    check (status in ('pending_review', 'approved', 'changes_requested', 'rejected')),
  submitted_payload jsonb not null default '{}'::jsonb check (jsonb_typeof(submitted_payload) = 'object'),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (invitation_id)
);

create index if not exists agency_onboarding_submissions_org_status_idx
  on public.agency_onboarding_submissions (organization_id, status, created_at desc);

drop trigger if exists agency_onboarding_submissions_set_updated_at on public.agency_onboarding_submissions;
create trigger agency_onboarding_submissions_set_updated_at
before update on public.agency_onboarding_submissions
for each row execute function private.set_updated_at();

alter table public.agency_onboarding_submissions enable row level security;

revoke all on table public.agency_onboarding_submissions from anon, authenticated;
grant select, insert, update on table public.agency_onboarding_submissions to authenticated;
grant usage, select on sequence public.agency_onboarding_submissions_id_seq to authenticated;

create policy agency_onboarding_submissions_reviewer_select
  on public.agency_onboarding_submissions for select to authenticated
  using (
    (select private.has_org_role(organization_id, array[
      'super_admin',
      'master_broker_admin',
      'master_broker_operations'
    ]::text[]))
  );

create policy agency_onboarding_submissions_reviewer_update
  on public.agency_onboarding_submissions for update to authenticated
  using (
    (select private.has_org_role(organization_id, array[
      'super_admin',
      'master_broker_admin',
      'master_broker_operations'
    ]::text[]))
  )
  with check (
    (select private.has_org_role(organization_id, array[
      'super_admin',
      'master_broker_admin',
      'master_broker_operations'
    ]::text[]))
  );

comment on table public.agency_onboarding_submissions is
  'Agency onboarding details submitted through CRM invitations before user access is activated.';

-- Reservation rules are business configuration, not application constants.
-- A project override wins over the Master Broker default.
create table if not exists public.reservation_workflow_settings (
  id bigint generated always as identity primary key,
  master_broker_organization_id bigint not null references public.organizations(id) on delete cascade,
  project_id bigint references public.projects(id) on delete cascade,
  approval_authority text not null default 'master_broker'
    check (approval_authority in ('master_broker', 'developer', 'either')),
  reservation_mode text not null default 'both'
    check (reservation_mode in ('temporary_hold', 'payment_confirmed', 'both')),
  approval_creates_hold boolean not null default true,
  hold_duration_hours integer not null default 24 check (hold_duration_hours between 1 and 720),
  warning_hours integer not null default 4 check (warning_hours between 0 and 168),
  require_payment_for_confirmation boolean not null default true,
  require_documents_for_confirmation boolean not null default true,
  release_without_payment boolean not null default true,
  crm_notifications_enabled boolean not null default true,
  email_notifications_enabled boolean not null default true,
  allow_client_documents_before_reservation boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (project_id is null or master_broker_organization_id is not null)
);

create unique index if not exists reservation_workflow_master_default_idx
  on public.reservation_workflow_settings (master_broker_organization_id)
  where project_id is null;
create unique index if not exists reservation_workflow_project_override_idx
  on public.reservation_workflow_settings (master_broker_organization_id, project_id)
  where project_id is not null;
create index if not exists reservation_workflow_project_idx
  on public.reservation_workflow_settings (project_id);

create table if not exists public.reservation_notification_recipients (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  email text not null check (position('@' in email) > 1),
  label text,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (organization_id, email)
);

alter table public.reservation_workflow_settings enable row level security;
alter table public.reservation_notification_recipients enable row level security;

create policy reservation_workflow_settings_select on public.reservation_workflow_settings
  for select to authenticated
  using ((select private.has_org_role(master_broker_organization_id, null))
    or exists (select 1 from public.projects p where p.id = project_id and (select private.has_org_role(p.organization_id, null))));
create policy reservation_workflow_settings_manage on public.reservation_workflow_settings
  for all to authenticated
  using ((select private.has_org_role(master_broker_organization_id, array['super_admin','master_broker_admin','master_broker_operations']::text[])))
  with check ((select private.has_org_role(master_broker_organization_id, array['super_admin','master_broker_admin','master_broker_operations']::text[])));

create policy reservation_notification_recipients_select on public.reservation_notification_recipients
  for select to authenticated
  using ((select private.has_org_role(organization_id, array['super_admin','master_broker_admin','master_broker_operations']::text[])));
create policy reservation_notification_recipients_manage on public.reservation_notification_recipients
  for all to authenticated
  using ((select private.has_org_role(organization_id, array['super_admin','master_broker_admin']::text[])))
  with check ((select private.has_org_role(organization_id, array['super_admin','master_broker_admin']::text[])));

create trigger reservation_workflow_settings_set_updated_at
  before update on public.reservation_workflow_settings
  for each row execute function private.set_updated_at();

grant select, insert, update, delete on public.reservation_workflow_settings to authenticated;
grant select, insert, update, delete on public.reservation_notification_recipients to authenticated;

-- Returns the project override when present, otherwise the Master Broker default.
create or replace function public.get_reservation_workflow_settings(target_project_id bigint)
returns public.reservation_workflow_settings
language sql stable security invoker set search_path = ''
as $$
  select s.*
  from public.reservation_workflow_settings s
  join public.projects p on p.id = target_project_id
  where s.master_broker_organization_id = p.organization_id
    and (s.project_id = target_project_id or s.project_id is null)
  order by (s.project_id is null), s.updated_at desc
  limit 1;
$$;
revoke execute on function public.get_reservation_workflow_settings(bigint) from public, anon;
grant execute on function public.get_reservation_workflow_settings(bigint) to authenticated;

-- Keep the existing reservation workflow, but make its authority and duration
-- resolve from the selected Master Broker/project configuration.
create or replace function public.review_reservation_request(
  target_request_id bigint,
  target_decision text,
  target_reason text default null
)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  request_row record;
  rules public.reservation_workflow_settings%rowtype;
  actor uuid := auth.uid();
  hold_until timestamptz;
  actor_can_review boolean := false;
begin
  if actor is null then raise exception 'Debes iniciar sesión.'; end if;
  if target_decision not in ('approve', 'reject') then raise exception 'Decisión inválida.'; end if;

  select rr.id, rr.organization_id, rr.unit_id, rr.requested_by_membership_id,
         rr.status, u.status as unit_status, p.organization_id as master_broker_id,
         p.developer_organization_id
    into request_row
    from public.reservation_requests rr
    join public.units u on u.id = rr.unit_id
    join public.projects p on p.id = u.project_id
   where rr.id = target_request_id
   for update of rr, u;
  if not found then raise exception 'Solicitud no encontrada.'; end if;
  if request_row.status <> 'pending' then raise exception 'La solicitud ya fue procesada.'; end if;

  -- Resolve the project's override, or the Master Broker default.
  select * into rules from public.get_reservation_workflow_settings((select project_id from public.units where id = request_row.unit_id));
  if rules.id is null then
    rules.approval_authority := 'master_broker';
    rules.reservation_mode := 'both';
    rules.approval_creates_hold := true;
    rules.hold_duration_hours := 24;
    rules.crm_notifications_enabled := true;
  end if;

  actor_can_review := (rules.approval_authority in ('master_broker', 'either') and
    (select private.has_org_role(request_row.master_broker_id, array['super_admin','master_broker_admin','master_broker_operations']::text[])))
    or (rules.approval_authority in ('developer', 'either') and request_row.developer_organization_id is not null and
    (select private.has_org_role(request_row.developer_organization_id, array['super_admin','master_broker_admin','developer_admin']::text[])));
  if not actor_can_review then raise exception 'No tienes permisos para revisar esta solicitud según la configuración del proyecto.'; end if;

  if target_decision = 'reject' then
    update public.reservation_requests set status = 'rejected', notes = coalesce(nullif(btrim(target_reason), ''), notes) where id = target_request_id;
    return jsonb_build_object('request_id', target_request_id, 'status', 'rejected');
  end if;
  if request_row.unit_status <> 'available' then raise exception 'La unidad ya no está disponible.'; end if;
  if exists (select 1 from public.reservations where unit_id = request_row.unit_id and status = 'active') then raise exception 'La unidad ya tiene una reserva activa.'; end if;
  if not rules.approval_creates_hold or rules.reservation_mode = 'payment_confirmed' then
    update public.reservation_requests set status = 'approved', expires_at = null where id = target_request_id;
    return jsonb_build_object('request_id', target_request_id, 'status', 'approved', 'reservation_type', 'payment_confirmed');
  end if;

  hold_until := now() + make_interval(hours => rules.hold_duration_hours);
  update public.reservation_requests set status = 'approved', reservation_type = 'temporary_hold', expires_at = hold_until where id = target_request_id;
  insert into public.reservations (organization_id, reservation_request_id, unit_id, reservation_type, status, expires_at)
  values (request_row.organization_id, target_request_id, request_row.unit_id, 'temporary_hold', 'active', hold_until);
  update public.units set status = 'reserved', reservation_expires_at = hold_until where id = request_row.unit_id;
  insert into public.unit_status_history (organization_id, unit_id, from_status, to_status, reason, source, changed_by)
  values (request_row.organization_id, request_row.unit_id, 'available', 'reserved', 'Bloqueo temporal aprobado según reglas del proyecto', 'reservation_review', actor);
  insert into public.audit_events (organization_id, actor_user_id, entity_type, entity_id, action, metadata)
  values (request_row.organization_id, actor, 'reservation_request', target_request_id::text, 'temporary_hold_approved', jsonb_build_object('unit_id', request_row.unit_id, 'expires_at', hold_until));
  if request_row.requested_by_membership_id is not null and rules.crm_notifications_enabled then
    insert into public.notifications (organization_id, membership_id, type, title, body, link)
    values (request_row.organization_id, request_row.requested_by_membership_id, 'reservation_hold_approved', 'Bloqueo temporal aprobado', 'La unidad quedó bloqueada según las reglas del proyecto. Completa el pago y los documentos antes de la fecha límite.', '/portal/clientes');
  end if;
  return jsonb_build_object('request_id', target_request_id, 'status', 'approved', 'reservation_type', 'temporary_hold', 'expires_at', hold_until);
end;
$$;
revoke execute on function public.review_reservation_request(bigint, text, text) from public, anon;
grant execute on function public.review_reservation_request(bigint, text, text) to authenticated;

create or replace function public.process_expired_reservation_holds()
returns void language plpgsql security definer set search_path = ''
as $$
declare
  r record;
  rules public.reservation_workflow_settings%rowtype;
  warn_at timestamptz;
begin
  for r in select res.id, res.organization_id, res.reservation_request_id, res.unit_id,
                  res.expires_at, rr.requested_by_membership_id, u.project_id
             from public.reservations res
             join public.reservation_requests rr on rr.id = res.reservation_request_id
             join public.units u on u.id = res.unit_id
            where res.status = 'active'
              and res.reservation_type = 'temporary_hold'
              and res.expires_at is not null
            for update of res, u skip locked
  loop
    select * into rules from public.get_reservation_workflow_settings(r.project_id);
    if rules.id is null then
      rules.warning_hours := 4;
      rules.release_without_payment := true;
      rules.crm_notifications_enabled := true;
    end if;
    warn_at := r.expires_at - make_interval(hours => rules.warning_hours);

    if r.expires_at <= now() and rules.release_without_payment then
      update public.reservations set status = 'expired' where id = r.id and status = 'active';
      update public.reservation_requests set status = 'cancelled' where id = r.reservation_request_id and status = 'approved';
      update public.units set status = 'available', reservation_expires_at = null where id = r.unit_id and status = 'reserved';
      insert into public.unit_status_history (organization_id, unit_id, from_status, to_status, reason, source)
      values (r.organization_id, r.unit_id, 'reserved', 'available', 'Bloqueo temporal vencido según configuración del proyecto', 'reservation_expiry');
      if r.requested_by_membership_id is not null and rules.crm_notifications_enabled then
        insert into public.notifications (organization_id, membership_id, type, title, body, link)
        values (r.organization_id, r.requested_by_membership_id, 'reservation_hold_expired', 'Unidad liberada', 'El bloqueo temporal venció sin completar el proceso configurado y la unidad fue liberada.', '/portal/clientes');
      end if;
    elsif rules.warning_hours > 0 and r.expires_at <= now() + interval '7 days' and r.expires_at <= now() + make_interval(hours => rules.warning_hours)
      and not exists (select 1 from public.notifications n where n.membership_id = r.requested_by_membership_id and n.type = 'reservation_hold_expiring' and n.created_at >= warn_at) then
      if r.requested_by_membership_id is not null and rules.crm_notifications_enabled then
        insert into public.notifications (organization_id, membership_id, type, title, body, link)
        values (r.organization_id, r.requested_by_membership_id, 'reservation_hold_expiring', 'Tu bloqueo vence pronto', 'El bloqueo se acerca a su fecha límite. Completa el proceso configurado para evitar la liberación.', '/portal/clientes');
      end if;
    end if;
  end loop;
end;
$$;
revoke execute on function public.process_expired_reservation_holds() from public, anon, authenticated;
grant usage, select on sequence public.reservation_workflow_settings_id_seq, public.reservation_notification_recipients_id_seq to authenticated;
grant execute on function public.process_expired_reservation_holds() to service_role;
