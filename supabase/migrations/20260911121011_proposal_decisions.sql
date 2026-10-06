-- Public proposal decisions are written only through a validated RPC. The
-- underlying table remains private and organization members can audit results.

alter table public.presentations
  drop constraint if exists presentations_status_check;

alter table public.presentations
  add constraint presentations_status_check check (
    status in ('draft', 'ready', 'sent', 'viewed', 'negotiation', 'accepted', 'rejected', 'expired', 'revoked')
  );

create table public.proposal_decisions (
  id uuid primary key default extensions.gen_random_uuid(),
  organization_id bigint not null references public.organizations(id) on delete cascade,
  presentation_id bigint not null references public.presentations(id) on delete cascade,
  shared_link_id bigint not null unique references public.shared_links(id) on delete cascade,
  decision text not null check (decision in ('accepted', 'rejected')),
  client_name text,
  comment text,
  decided_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint proposal_decisions_client_name_length check (client_name is null or length(client_name) <= 160),
  constraint proposal_decisions_comment_length check (comment is null or length(comment) <= 2000)
);

create index proposal_decisions_org_time_idx
  on public.proposal_decisions (organization_id, decided_at desc);
create index proposal_decisions_presentation_idx
  on public.proposal_decisions (presentation_id);

alter table public.proposal_decisions enable row level security;
revoke all on table public.proposal_decisions from anon, authenticated;
grant select on table public.proposal_decisions to authenticated;

create policy proposal_decisions_member_select
  on public.proposal_decisions for select to authenticated
  using ((select private.has_org_role(organization_id, null)));

create or replace function public.submit_proposal_decision(
  proposal_token text,
  target_decision text,
  target_client_name text default null,
  target_comment text default null
)
returns table (decision text, decided_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_link public.shared_links%rowtype;
  selected_presentation public.presentations%rowtype;
  saved_decision public.proposal_decisions%rowtype;
begin
  if proposal_token is null or proposal_token !~ '^[a-f0-9]{40}$' then
    raise exception 'Enlace de propuesta inválido';
  end if;
  if target_decision not in ('accepted', 'rejected') then
    raise exception 'Decisión inválida';
  end if;
  if length(coalesce(target_client_name, '')) > 160 or length(coalesce(target_comment, '')) > 2000 then
    raise exception 'El contenido de la respuesta excede el límite permitido';
  end if;

  select sl.* into selected_link
  from public.shared_links sl
  where sl.token = proposal_token
  for update;

  if selected_link.id is null
    or selected_link.status <> 'active'
    or (selected_link.expires_at is not null and selected_link.expires_at <= now()) then
    raise exception 'Esta propuesta ya no está disponible';
  end if;

  select p.* into selected_presentation
  from public.presentation_versions pv
  join public.presentations p on p.id = pv.presentation_id
  where pv.id = selected_link.presentation_version_id
  for update of p;

  if selected_presentation.id is null or selected_presentation.kind <> 'proposal' then
    raise exception 'El enlace no corresponde a una propuesta';
  end if;

  select pd.* into saved_decision
  from public.proposal_decisions pd
  where pd.shared_link_id = selected_link.id;

  if saved_decision.id is not null then
    return query select saved_decision.decision, saved_decision.decided_at;
    return;
  end if;

  insert into public.proposal_decisions (
    organization_id,
    presentation_id,
    shared_link_id,
    decision,
    client_name,
    comment,
    metadata
  ) values (
    selected_presentation.organization_id,
    selected_presentation.id,
    selected_link.id,
    target_decision,
    nullif(trim(target_client_name), ''),
    nullif(trim(target_comment), ''),
    jsonb_build_object('source', 'public_proposal')
  ) returning * into saved_decision;

  update public.presentations
  set status = target_decision, updated_at = now()
  where id = selected_presentation.id;

  insert into public.audit_events (
    organization_id,
    actor_user_id,
    action,
    entity_type,
    entity_id,
    metadata
  ) values (
    selected_presentation.organization_id,
    null,
    'proposal.' || target_decision,
    'presentation',
    selected_presentation.id::text,
    jsonb_build_object('shared_link_id', selected_link.id, 'source', 'public_proposal')
  );

  return query select saved_decision.decision, saved_decision.decided_at;
end;
$$;

revoke all on function public.submit_proposal_decision(text, text, text, text) from public;
grant execute on function public.submit_proposal_decision(text, text, text, text) to service_role;

comment on table public.proposal_decisions is
  'Immutable accept/reject responses submitted from active public proposal links.';
