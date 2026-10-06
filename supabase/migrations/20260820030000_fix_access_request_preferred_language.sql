-- Fixes a bug in the previous migration: contacts.preferred_language is
-- constrained to ('es','en','fr'), not the literal 'Español' the original
-- (broken) landing form code used.
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
  v_org_id bigint := 1;
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
