-- Recuperada del historial remoto de Supabase (aplicada fuera de git)
revoke all on function public.notify_org_admins(bigint, text, text, text, text) from public, anon, authenticated;
grant execute on function public.notify_org_admins(bigint, text, text, text, text) to service_role;
