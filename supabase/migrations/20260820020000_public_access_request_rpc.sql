-- Fixes a real bug found during QA: the public landing page's "Solicitar
-- Acceso" form has never actually persisted anything. `anon` has no INSERT
-- grant (let alone an RLS policy) on `contacts`, so `requestAccessAction`'s
-- insert always failed with 42501 (permission denied) -- silently, because
-- the action code deliberately swallows that error and still tells the
-- visitor "solicitud enviada con éxito". No contact, no activity log, and
-- (as of the new notifications system) no admin notification ever fired.
--
-- Rather than granting anon a broad INSERT on a CRM table (arbitrary
-- organization_id, no validation), the fix is a single security-definer RPC
-- that does the whole submission server-side: insert contact, log the
-- activity, and notify org admins -- the same pattern already used by
-- reserve_lot() and notify_org_admins().
create or replace function public.submit_landing_access_request(
  full_name text,
  email text,
  phone text,
  agency text default '',
  role_type text default 'Broker inmobiliario',
  message text default ''
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org_id bigint := 1; -- OB Brokers Team; the landing page is single-tenant today.
  v_first_name text;
  v_last_name text;
  v_phone_digits text;
  v_phone_last4 text;
  v_contact_id bigint;
  v_classification text;
begin
  if coalesce(trim(full_name), '') = '' or coalesce(trim(email), '') = '' or coalesce(trim(phone), '') = '' then
    raise exception 'full_name, email and phone are required.' using errcode = '22023';
  end if;

  v_first_name := split_part(trim(full_name), ' ', 1);
  v_last_name := nullif(trim(substring(trim(full_name) from length(v_first_name) + 1)), '');
  v_phone_digits := regexp_replace(phone, '\D', '', 'g');
  v_phone_last4 := case when length(v_phone_digits) >= 4 then right(v_phone_digits, 4) else v_phone_digits end;
  v_classification := case when role_type ilike '%inversion%' then 'Inversionista' else 'Broker / aliado' end;

  insert into public.contacts (
    organization_id, first_name, last_name, email, phone, phone_normalized, phone_last4,
    classification, source, preferred_language
  ) values (
    v_org_id, v_first_name, v_last_name, email, phone, phone, v_phone_last4,
    v_classification, 'Solicitud Web Landing', 'es'
  )
  returning id into v_contact_id;

  insert into public.activities (organization_id, contact_id, kind, subject, details, completed_at)
  values (
    v_org_id, v_contact_id, 'system',
    format('Solicitud de acceso de %s: %s', role_type, nullif(agency, '')),
    format('Mensaje: %s', coalesce(nullif(message, ''), 'Solicitó acceso desde la página principal.')),
    now()
  );

  perform public.notify_org_admins(
    v_org_id,
    'access_request',
    format('Nueva solicitud de acceso: %s', full_name),
    format('%s · %s · %s', role_type, coalesce(nullif(agency, ''), 'Independiente'), phone),
    '/portal/clientes'
  );

  return v_contact_id;
end;
$$;

revoke all on function public.submit_landing_access_request(text, text, text, text, text, text) from public;
grant execute on function public.submit_landing_access_request(text, text, text, text, text, text) to anon, authenticated;

comment on function public.submit_landing_access_request is 'Public entry point for the landing page "Solicitar Acceso" form: inserts the contact, logs the activity, and notifies org admins, all server-side (anon has no direct table grants on contacts/activities).';
