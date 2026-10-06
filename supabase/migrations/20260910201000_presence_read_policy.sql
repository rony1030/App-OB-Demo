-- Presence writes go through the validated SECURITY DEFINER RPC. Direct table
-- writes remain closed; only operational roles can read their own org sessions.
create policy presence_sessions_operational_select
  on public.presence_sessions for select to authenticated
  using (
    organization_id is not null
    and (select private.has_org_role(organization_id, array[
      'super_admin',
      'master_broker_admin',
      'master_broker_operations',
      'agency_admin',
      'developer_admin',
      'support_auditor'
    ]::text[]))
  );
