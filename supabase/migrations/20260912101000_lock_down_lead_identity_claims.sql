-- The identity registry is accessed exclusively by trusted server actions.
-- This explicit policy keeps the table unreachable from browser sessions.

create policy "lead identity claims have no direct client access"
on public.lead_identity_claims
as restrictive
for all
to authenticated
using (false)
with check (false);
