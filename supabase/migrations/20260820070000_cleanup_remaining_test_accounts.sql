-- Removes the remaining seed/QA accounts from OB Brokers Team, leaving only
-- the real owner account (Rony Abello, super_admin). auth.users rows for
-- these two cannot be dropped here (no service_role key available in this
-- environment) -- only their in-app identity (membership + profile).
delete from public.memberships where id in (2, 4);
delete from public.profiles where user_id in (
  'b0000000-0000-0000-0000-000000000002', -- "Broker Aliado"
  '8e5d5f95-b862-4707-b162-7c825e5b104e'  -- "Admin de Prueba QA" (admin.prueba@obbrokers.test)
);
