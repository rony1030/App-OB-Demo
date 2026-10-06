-- Limpieza reversible por alcance: elimina únicamente registros DEMO.
-- Ejecutar después de terminar las pruebas. No toca datos reales.
begin;
do $$
declare ids bigint[];
begin
  delete from public.notifications where title like 'DEMO %' or body like '%DEMO%';
  delete from public.commission_claim_documents where file_name like 'DEMO-%' or storage_path like '%/DEMO-%';
  delete from public.commission_claims where proforma_number like 'DEMO-%' or developer_payment_reference like 'DEMO-%';
  delete from public.commissions where id in (select c.id from public.commissions c join public.sales s on s.id = c.sale_id join public.contacts ct on ct.id = s.contact_id where ct.first_name like 'DEMO %');
  delete from public.sales where contact_id in (select id from public.contacts where first_name like 'DEMO %');
  delete from public.reservations where reservation_request_id in (select id from public.reservation_requests where notes like 'DEMO%');
  delete from public.reservation_requests where notes like 'DEMO%';
  delete from public.proposal_decisions where comment like 'Decisión DEMO%';
  delete from public.engagement_events where metadata->>'demo' = 'true';
  delete from public.shared_links where id in (select sl.id from public.shared_links sl join public.presentation_versions pv on pv.id = sl.presentation_version_id where pv.snapshot->>'demo' = 'true');
  delete from public.presentation_versions where snapshot->>'demo' = 'true';
  delete from public.presentations where title like 'DEMO %';
  delete from public.activities where subject like 'DEMO %';
  delete from public.opportunities where id in (select o.id from public.opportunities o join public.contacts c on c.id = o.contact_id where c.first_name like 'DEMO %');
  delete from public.client_documents where title like 'DEMO %';
  delete from public.organization_documents where title like 'DEMO %';
  delete from public.project_documents where title like 'DEMO %';
  delete from public.signature_fields where label = 'Firma DEMO';
  delete from public.signature_signers where name like 'DEMO %';
  delete from public.signature_documents where title like 'DEMO %';
  delete from public.agreements where commission_terms like 'DEMO %';
  delete from public.agreement_notification_recipients where label like 'DEMO %';
  delete from public.organization_relationships where metadata->>'demo' = 'true';
  delete from public.project_access where project_id in (select id from public.projects where name like 'DEMO %');
  delete from public.units where notes like 'Registro DEMO%';
  delete from public.typologies where name like 'DEMO %';
  delete from public.projects where name like 'DEMO %';
  delete from public.contacts where first_name like 'DEMO %';
  delete from public.memberships where organization_id in (select id from public.organizations where slug like 'demo-%-qa');
  delete from public.organizations where slug like 'demo-%-qa';
end $$;
commit;
