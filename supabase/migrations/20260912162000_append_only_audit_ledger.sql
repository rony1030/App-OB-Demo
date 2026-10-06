-- Preserve a forensic, organization-scoped ledger for the business records
-- whose lifecycle matters to lead ownership, inventory and legal documents.
create or replace function private.capture_audit_change()
returns trigger
language plpgsql
security definer
set search_path = public, private, auth
as $$
declare
  record_data jsonb;
  previous_data jsonb;
  org_id bigint;
begin
  record_data := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  previous_data := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
  org_id := nullif(record_data ->> 'organization_id', '')::bigint;

  if org_id is null and tg_table_name = 'document_versions' then
    select pd.organization_id into org_id
    from public.project_documents pd
    where pd.id = nullif(record_data ->> 'document_id', '')::bigint;
  end if;

  if org_id is null then
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  if tg_op = 'UPDATE' and (previous_data - 'updated_at') = (record_data - 'updated_at') then
    return new;
  end if;

  insert into public.audit_events (
    organization_id,
    actor_user_id,
    action,
    entity_type,
    entity_id,
    metadata
  ) values (
    org_id,
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    coalesce(record_data ->> 'id', record_data ->> 'document_id'),
    jsonb_strip_nulls(jsonb_build_object(
      'before', previous_data,
      'after', case when tg_op = 'DELETE' then null else record_data end,
      'source', 'database_ledger'
    ))
  );

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create or replace function private.prevent_audit_mutation()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  raise exception 'audit_events is append-only';
end;
$$;

drop trigger if exists audit_events_no_mutation on public.audit_events;
create trigger audit_events_no_mutation
before update or delete on public.audit_events
for each row execute function private.prevent_audit_mutation();

do $$
declare target text;
begin
  foreach target in array array[
    'contacts', 'opportunities', 'activities', 'notes', 'lead_reports',
    'projects', 'units', 'project_documents', 'document_versions', 'presentations'
  ] loop
    execute format('drop trigger if exists %I on public.%I', target || '_audit_ledger', target);
    execute format(
      'create trigger %I after insert or update or delete on public.%I for each row execute function private.capture_audit_change()',
      target || '_audit_ledger', target
    );
  end loop;
end $$;

-- Audit entries contain sensitive operational history. They are deliberately
-- visible only to the roles responsible for oversight, never to ordinary agents.
drop policy if exists audit_events_member_select on public.audit_events;
drop policy if exists audit_events_privileged_update on public.audit_events;
create policy audit_events_oversight_select on public.audit_events
for select to authenticated
using ((select private.has_org_role(organization_id, array['super_admin', 'master_broker_admin', 'master_broker_operations', 'developer_admin', 'support_auditor']::text[])));

comment on table public.audit_events is 'Append-only forensic business ledger. UI archives content but retains this history.';
