-- ============================================================
-- SYSTEM LOGS — Registro de actividad, errores y auditoría
-- ============================================================
-- Solo accesible por super_admin y master_broker_admin desde
-- el CRM interno. Nunca expuesto al frontend público.
-- ============================================================

create table if not exists public.system_logs (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),

  -- Quién
  user_id       uuid references auth.users(id) on delete set null,
  user_email    text,
  user_role     text,
  user_name     text,

  -- Qué
  level         text not null check (level in ('info', 'warning', 'error', 'critical')),
  category      text not null check (category in (
    'auth', 'server_action', 'data_mutation', 'navigation',
    'system', 'migration', 'external_api', 'maintenance'
  )),
  action        text not null,          -- Ej: "saveBrokerEvent", "deleteContact"
  description   text not null,          -- Descripción legible del evento

  -- Contexto técnico
  route         text,                   -- Ruta o endpoint implicado
  metadata      jsonb default '{}'::jsonb, -- Datos extra sin información sensible
  error_message text,                   -- Solo en nivel error/critical
  error_stack   text,                   -- Solo en nivel error/critical (truncado)
  duration_ms   integer,                -- Duración de la operación en ms
  status_code   integer                 -- HTTP status si aplica
);

-- Índices para búsquedas frecuentes en el panel
create index if not exists system_logs_level_idx        on public.system_logs(level);
create index if not exists system_logs_category_idx     on public.system_logs(category);
create index if not exists system_logs_created_at_idx   on public.system_logs(created_at desc);
create index if not exists system_logs_user_id_idx      on public.system_logs(user_id);

-- RLS: solo service role puede escribir; ningún rol de cliente puede leer/escribir directamente
alter table public.system_logs enable row level security;

-- No crear políticas permisivas — todo el acceso es via service role key (server-side)
-- Esto garantiza que ni un broker_agent ni ningún usuario autenticado puede leer los logs
-- desde el cliente de Supabase. Solo el admin del servidor puede acceder.

comment on table public.system_logs is
  'Registro interno de actividad, errores y auditoría del sistema CRM. Solo accesible via service role key.';
