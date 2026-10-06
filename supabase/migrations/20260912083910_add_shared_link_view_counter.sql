-- Recuperada del historial remoto de Supabase (aplicada fuera de git)
alter table public.shared_links
  add column if not exists views_count integer not null default 0
  check (views_count >= 0);

create index if not exists shared_links_active_views_idx
  on public.shared_links (status, expires_at, views_count desc);
