-- One-time cleanup of demo/test data ahead of final QA: removes the demo
-- "Residencial Las Palmas" land project (and its lots/reservations), the
-- "Cana Rock" template projects, their placeholder developer organizations,
-- the QA test agency, and the broker.prueba membership/profile tied to it.
-- Runs as a migration (not through PostgREST) specifically to bypass RLS,
-- since some of these rows (e.g. a reservation created while testing the
-- lot-reservation flow) are not visible to the admin.prueba session under
-- normal row-level security.

delete from public.reservations;
delete from public.reservation_requests;
delete from public.lots where project_id in (4, 5, 6);
delete from public.project_amenities where project_id in (4, 5, 6);
delete from public.projects where id in (4, 5, 6);

delete from public.memberships where id = 3;
delete from public.profiles where user_id = 'df4e7650-f470-48b7-b4f7-f03f1a6e6057';
delete from public.organizations where id in (2, 3, 4, 10);
