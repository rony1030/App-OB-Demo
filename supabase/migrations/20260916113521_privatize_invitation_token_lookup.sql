-- Recuperada del historial remoto de Supabase (aplicada fuera de git)
drop policy if exists invitations_token_lookup on public.invitations;
revoke select on table public.invitations from anon;
