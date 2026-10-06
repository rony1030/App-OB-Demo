-- Reporte de pagos del inversionista.
-- Cada proyecto define cómo se reporta un pago: correo al desarrollador, redirección a su portal,
-- instrucciones del proceso, o integración por API. Las credenciales nunca se guardan aquí:
-- solo el NOMBRE de la variable de entorno que contiene el secreto (api_secret_env).

create table if not exists public.project_payment_report_config (
  project_slug text primary key,
  mode text not null default 'instructions' check (mode in ('email', 'redirect', 'instructions', 'api')),
  developer_name text not null,
  instructions jsonb not null default '[]'::jsonb,
  accepts_receipt boolean not null default true,
  redirect_url text check (redirect_url is null or redirect_url ~* '^https://'),
  email_to text[] not null default '{}',
  api_url text check (api_url is null or api_url ~* '^https://'),
  api_secret_env text check (api_secret_env is null or api_secret_env ~ '^[A-Z][A-Z0-9_]{2,63}$'),
  updated_at timestamptz not null default now(),
  check (mode <> 'email' or cardinality(email_to) > 0),
  check (mode <> 'redirect' or redirect_url is not null),
  check (mode <> 'api' or api_url is not null)
);
alter table public.project_payment_report_config enable row level security;
-- Sin políticas: solo el rol de servicio (portal del inversionista) lee esta configuración.

create table if not exists public.investor_payment_reports (
  id bigint generated always as identity primary key,
  organization_id bigint not null references public.organizations(id) on delete cascade,
  contact_id bigint not null references public.contacts(id) on delete cascade,
  reservation_id bigint not null references public.reservations(id) on delete cascade,
  project_slug text not null,
  unit_code text not null,
  amount numeric(14,2) not null check (amount > 0),
  currency text not null default 'USD' check (currency in ('USD', 'DOP', 'EUR')),
  paid_at date not null,
  method text not null check (method in ('transferencia', 'deposito', 'cheque', 'tarjeta', 'otro')),
  reference text,
  note text,
  file_name text,
  delivery_mode text not null check (delivery_mode in ('email', 'api')),
  delivery_status text not null default 'pending' check (delivery_status in ('pending', 'sent', 'failed')),
  delivery_error text,
  created_at timestamptz not null default now()
);
create index if not exists investor_payment_reports_reservation_idx
  on public.investor_payment_reports (reservation_id, created_at desc);
create index if not exists investor_payment_reports_contact_idx
  on public.investor_payment_reports (contact_id, created_at desc);

alter table public.investor_payment_reports enable row level security;
grant select on public.investor_payment_reports to authenticated;
create policy investor_payment_reports_org_select on public.investor_payment_reports
  for select to authenticated using ((select private.has_org_role(organization_id, null)));
