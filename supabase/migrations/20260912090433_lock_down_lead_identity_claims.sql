-- Recuperada del historial remoto de Supabase (aplicada fuera de git)
create policy "lead identity claims have no direct client access"
on public.lead_identity_claims
as restrictive
for all
to authenticated
using (false)
with check (false);
