-- Datos sintéticos para QA integral. Todos los registros identificables usan DEMO.
-- Ejecutar únicamente en un entorno de pruebas o con autorización explícita.
-- No crea usuarios de Auth ni envía correos: usa memberships existentes.

begin;

do $$
declare
  v_master bigint;
  v_developer bigint;
  v_agency_a bigint;
  v_agency_b bigint;
  v_project bigint;
  v_brand bigint;
  v_typology bigint;
  v_unit bigint;
  v_master_member bigint;
  v_agency_a_admin bigint;
  v_agency_a_agent bigint;
  v_agency_b_admin bigint;
  v_developer_admin bigint;
  v_contact bigint;
  v_opportunity bigint;
  v_presentation bigint;
  v_version bigint;
  v_link bigint;
  v_signature_document bigint;
  v_signer bigint;
  v_agreement bigint;
  v_request bigint;
  v_reservation bigint;
  v_sale bigint;
  v_commission bigint;
  v_claim bigint;
  i integer;
  stage_value text;
  status_value text;
begin
  insert into public.organizations (slug, name, kind, legal_name, contact_email, contact_phone)
  values
    ('demo-master-broker-qa', 'DEMO Master Broker QA', 'master_broker', 'DEMO Master Broker QA', 'ronyabellor@gmail.com', '+1 809 555 0101'),
    ('demo-developer-qa', 'DEMO Developer QA', 'developer', 'DEMO Developer QA', 'soporte@osvaldobello.com', '+1 809 555 0102'),
    ('demo-agencia-caribe-qa', 'DEMO Agencia Caribe QA', 'agency', 'DEMO Agencia Caribe QA', 'ronyabellor@gmail.com', '+1 809 555 0103'),
    ('demo-agencia-norte-qa', 'DEMO Agencia Norte QA', 'agency', 'DEMO Agencia Norte QA', 'soporte@osvaldobello.com', '+1 809 555 0104')
  on conflict (slug) do update set name = excluded.name, legal_name = excluded.legal_name,
    contact_email = excluded.contact_email, contact_phone = excluded.contact_phone, status = 'active', updated_at = now();

  select id into v_master from public.organizations where slug = 'demo-master-broker-qa';
  select id into v_developer from public.organizations where slug = 'demo-developer-qa';
  select id into v_agency_a from public.organizations where slug = 'demo-agencia-caribe-qa';
  select id into v_agency_b from public.organizations where slug = 'demo-agencia-norte-qa';

  insert into public.memberships (organization_id, user_id, role, status, is_primary)
  values
    (v_master, 'a0000000-0000-0000-0000-000000000001', 'master_broker_admin', 'active', true),
    (v_developer, '03724e4d-8a17-44c8-b56c-ec2dba566418', 'developer_admin', 'active', true),
    (v_agency_a, '6c553d7e-80ae-4e79-868a-4fd23668260c', 'agency_admin', 'active', true),
    (v_agency_a, '03724e4d-8a17-44c8-b56c-ec2dba566418', 'broker_agent', 'active', false),
    (v_agency_b, 'b8b7f32c-9fb3-4767-8adb-f474016bc967', 'agency_admin', 'active', true)
  on conflict (organization_id, user_id) do update set role = excluded.role, status = 'active', is_primary = excluded.is_primary, updated_at = now();

  select id into v_master_member from public.memberships where organization_id = v_master and user_id = 'a0000000-0000-0000-0000-000000000001';
  select id into v_agency_a_admin from public.memberships where organization_id = v_agency_a and user_id = '6c553d7e-80ae-4e79-868a-4fd23668260c';
  select id into v_agency_a_agent from public.memberships where organization_id = v_agency_a and user_id = '03724e4d-8a17-44c8-b56c-ec2dba566418';
  select id into v_agency_b_admin from public.memberships where organization_id = v_agency_b and user_id = 'b8b7f32c-9fb3-4767-8adb-f474016bc967';
  select id into v_developer_admin from public.memberships where organization_id = v_developer and user_id = '03724e4d-8a17-44c8-b56c-ec2dba566418';

  insert into public.organization_relationships (source_organization_id, target_organization_id, relationship_type, status, starts_at, metadata, created_by)
  values
    (v_master, v_agency_a, 'agency_of', 'active', current_date - 120, jsonb_build_object('demo', true), 'a0000000-0000-0000-0000-000000000001'),
    (v_master, v_agency_b, 'agency_of', 'active', current_date - 90, jsonb_build_object('demo', true), 'a0000000-0000-0000-0000-000000000001'),
    (v_developer, v_master, 'developer_for', 'active', current_date - 180, jsonb_build_object('demo', true), '03724e4d-8a17-44c8-b56c-ec2dba566418')
  on conflict (source_organization_id, target_organization_id, relationship_type) do update set status = 'active', metadata = excluded.metadata, updated_at = now();

  select id into v_brand from public.brand_profiles where organization_id = v_master order by is_default desc, id limit 1;
  insert into public.projects (organization_id, developer_organization_id, brand_profile_id, slug, name, location, zone, lifecycle_status, publication_status, delivery_date, description, short_description, starting_price, currency, commission_rate, master_broker_exclusive, inventory_total_declared, inventory_available_declared, inventory_is_complete, inventory_updated_at, published_at)
  values (v_master, v_developer, v_brand, 'demo-coral-residences-qa', 'DEMO Coral Residences QA', 'Punta Cana, La Altagracia', 'Punta Cana', 'under_construction', 'published', current_date + 730, 'DEMO proyecto de prueba para validar el ciclo completo de CRM, propuestas, acuerdos, documentos y comisiones.', 'DEMO proyecto para pruebas integrales.', 185000, 'USD', 6, true, 24, 18, true, now(), now())
  on conflict (organization_id, slug) do update set developer_organization_id = excluded.developer_organization_id, name = excluded.name, description = excluded.description, short_description = excluded.short_description, publication_status = 'published', updated_at = now()
  returning id into v_project;

  insert into public.project_access (organization_id, project_id, grantee_organization_id, access_level, expires_at)
  values (v_master, v_project, v_agency_a, 'view', current_date + 365), (v_master, v_project, v_agency_b, 'view', current_date + 365)
  on conflict do nothing;

  insert into public.typologies (organization_id, project_id, name, bedrooms, bathrooms, indoor_sqm, terrace_sqm, total_sqm)
  values (v_master, v_project, 'DEMO Villa Esmeralda', 2, 2, 61, 12, 73), (v_master, v_project, 'DEMO Villa Coral', 3, 2.5, 96, 18, 114), (v_master, v_project, 'DEMO Penthouse Marina', 3, 3, 142, 32, 174)
  on conflict (project_id, name) do update set total_sqm = excluded.total_sqm, updated_at = now();

  create temporary table if not exists demo_units (id bigint primary key, code text) on commit drop;
  for i in 1..8 loop
    select id into v_typology from public.typologies where project_id = v_project order by id offset ((i - 1) % 3) limit 1;
    insert into public.units (organization_id, project_id, typology_id, unit_code, tower, floor_level, list_price, currency, status, is_public, notes)
    values (v_master, v_project, v_typology, format('DEMO-%s', lpad(i::text, 3, '0')), 'DEMO Torre A', ((i - 1) % 4) + 1, 185000 + (i * 12500), 'USD', case when i <= 6 then 'available' else 'separated' end, true, 'Registro DEMO para QA')
    on conflict (project_id, unit_code) do update set list_price = excluded.list_price, status = excluded.status, notes = excluded.notes, updated_at = now()
    returning id, unit_code into v_unit, stage_value;
    insert into demo_units values (v_unit, stage_value) on conflict do nothing;
  end loop;

  create temporary table if not exists demo_contacts (id bigint primary key, idx integer) on commit drop;
  for i in 1..10 loop
    select id into v_contact from public.contacts where organization_id = v_agency_a and email = format('demo.lead.%s@qa.osvaldobello.com', i) and deleted_at is null limit 1;
    if v_contact is null then
      insert into public.contacts (organization_id, first_name, last_name, email, phone, phone_normalized, phone_last4, country, preferred_language, classification, source, created_by)
      values (v_agency_a, 'DEMO Cliente ' || i, 'QA', format('demo.lead.%s@qa.osvaldobello.com', i), '+1 809 555 ' || lpad((1000 + i)::text, 4, '0'), '1809555' || lpad((1000 + i)::text, 4, '0'), lpad((1000 + i)::text, 4, '0'), 'DO', case when i % 3 = 0 then 'fr' when i % 2 = 0 then 'en' else 'es' end, 'person', 'DEMO QA', '6c553d7e-80ae-4e79-868a-4fd23668260c')
      returning id into v_contact;
    end if;
    insert into demo_contacts values (v_contact, i) on conflict do nothing;
  end loop;

  create temporary table if not exists demo_opportunities (id bigint primary key, idx integer) on commit drop;
  for i in 1..10 loop
    v_opportunity := null;
    select id into v_contact from demo_contacts where idx = i;
    stage_value := (array['new','contacted','qualified','proposal','negotiation','reservation','won','lost','paused','accepted'])[((i - 1) % 9) + 1];
    if stage_value = 'accepted' then stage_value := 'won'; end if;
    insert into public.opportunities (organization_id, contact_id, owner_membership_id, stage, priority, budget_min, budget_max, currency, objective, next_follow_up_at, closed_reason)
    values (v_agency_a, v_contact, case when i % 2 = 0 then v_agency_a_agent else v_agency_a_admin end, stage_value, case when i <= 3 then 'high' when i <= 7 then 'medium' else 'low' end, 180000, 650000, 'USD', 'DEMO interés en inversión inmobiliaria', now() + (i || ' days')::interval, case when stage_value = 'won' then 'DEMO aceptada' when stage_value = 'lost' then 'DEMO no continuó' else null end)
    on conflict do nothing returning id into v_opportunity;
    if v_opportunity is null then select id into v_opportunity from public.opportunities where organization_id = v_agency_a and contact_id = v_contact order by id desc limit 1; end if;
    insert into demo_opportunities values (v_opportunity, i) on conflict do nothing;
    insert into public.activities (organization_id, opportunity_id, contact_id, kind, subject, details, due_at, completed_at, created_by)
    values (v_agency_a, v_opportunity, v_contact, case when i % 3 = 0 then 'email' when i % 2 = 0 then 'whatsapp' else 'call' end, 'DEMO seguimiento ' || i, 'Actividad DEMO para comprobar trazabilidad.', now() - (i || ' days')::interval, case when i <= 5 then now() - ((i - 1) || ' days')::interval else null end, '6c553d7e-80ae-4e79-868a-4fd23668260c');
  end loop;

  create temporary table if not exists demo_presentations (id bigint primary key, idx integer, link_id bigint) on commit drop;
  for i in 1..6 loop
    select id into v_contact from demo_contacts where idx = i;
    insert into public.presentations (organization_id, contact_id, author_membership_id, kind, title, status)
    values (v_agency_a, v_contact, case when i % 2 = 0 then v_agency_a_agent else v_agency_a_admin end, case when i = 1 then 'dossier' else 'proposal' end, 'DEMO ' || case when i = 1 then 'Dossier' else 'Propuesta' end || ' QA ' || i, (array['sent','viewed','negotiation','accepted','rejected','ready'])[i])
    returning id into v_presentation;
    insert into public.presentation_versions (presentation_id, version_number, snapshot, created_by, published_at)
    values (v_presentation, 1, jsonb_build_object('demo', true, 'project', 'DEMO Coral Residences QA', 'client', 'DEMO Cliente ' || i, 'units', jsonb_build_array('DEMO-00' || i), 'locale', case when i % 3 = 0 then 'fr' when i % 2 = 0 then 'en' else 'es' end), '6c553d7e-80ae-4e79-868a-4fd23668260c', now() - ((7 - i) || ' days')::interval)
    returning id into v_version;
    insert into public.shared_links (presentation_version_id, status, expires_at, views_count)
    values (v_version, case when i = 6 then 'revoked' else 'active' end, now() + interval '30 days', i * 2) returning id into v_link;
    insert into demo_presentations values (v_presentation, i, v_link);
    insert into public.engagement_events (organization_id, shared_link_id, event_type, occurred_at, metadata)
    values (v_agency_a, v_link, case when i = 1 then 'dossier_view' else 'proposal_view' end, now() - ((i + 1) || ' days')::interval, jsonb_build_object('demo', true, 'locale', case when i % 3 = 0 then 'fr' when i % 2 = 0 then 'en' else 'es' end)), (v_agency_a, v_link, 'pdf_export', now() - (i || ' days')::interval, jsonb_build_object('demo', true, 'device', case when i % 2 = 0 then 'mobile' else 'desktop' end));
    if i in (4,5) then
      insert into public.proposal_decisions (organization_id, presentation_id, shared_link_id, decision, client_name, comment, decided_at, metadata)
      values (v_agency_a, v_presentation, v_link, case when i = 4 then 'accepted' else 'rejected' end, 'DEMO Cliente ' || i, 'Decisión DEMO para QA', now() - (i || ' days')::interval, jsonb_build_object('demo', true));
    end if;
  end loop;

  insert into public.project_documents (organization_id, project_id, title, category, visibility, status)
  values (v_master, v_project, 'DEMO Ficha técnica QA', 'technical', 'authorized', 'published'), (v_master, v_project, 'DEMO Condiciones comerciales QA', 'commercial', 'authorized', 'published')
  on conflict (project_id, title) do update set status = excluded.status, updated_at = now();
  insert into public.organization_documents (organization_id, document_type, title, status, storage_bucket, storage_path, mime_type, size_bytes, issued_at, notes, created_by)
  values (v_agency_a, 'tax_certificate', 'DEMO Certificado fiscal QA', 'approved', 'private-documents', 'demo-agencia-caribe-qa/documents/DEMO-certificado-fiscal.pdf', 'application/pdf', 2048, current_date - 30, 'Documento sintético sin valor legal.', '6c553d7e-80ae-4e79-868a-4fd23668260c'), (v_agency_a, 'banking', 'DEMO Certificación bancaria QA', 'submitted', 'private-documents', 'demo-agencia-caribe-qa/documents/DEMO-certificacion-bancaria.pdf', 'application/pdf', 2048, current_date - 10, 'Documento sintético sin valor legal.', '6c553d7e-80ae-4e79-868a-4fd23668260c')
  on conflict do nothing;

  insert into public.signature_documents (organization_id, title, status, source_storage_path, created_by)
  values (v_master, 'DEMO Acuerdo de colaboración pendiente', 'pending', 'demo-master-broker-qa/agreements/DEMO-pending.pdf', 'a0000000-0000-0000-0000-000000000001')
  returning id into v_signature_document;
  insert into public.signature_documents (organization_id, title, status, source_storage_path, created_by)
  values (v_master, 'DEMO Acuerdo de colaboración firmado', 'completed', 'demo-master-broker-qa/agreements/DEMO-signed.pdf', 'a0000000-0000-0000-0000-000000000001');
  select id into v_signature_document from public.signature_documents where title = 'DEMO Acuerdo de colaboración pendiente' order by id desc limit 1;
  insert into public.signature_signers (signature_document_id, name, email, phone, signer_role, sign_order, status, signing_token_hash)
  values (v_signature_document, 'DEMO Agencia Caribe QA', 'ronyabellor@gmail.com', '+1 809 555 0103', 'agency_admin', 1, 'pending', encode(digest('DEMO-pending-signer', 'sha256'), 'hex')) returning id into v_signer;
  insert into public.signature_fields (signer_id, page_number, x, y, width, height, field_type, label) values (v_signer, 1, 70, 84, 22, 8, 'signature', 'Firma DEMO');
  insert into public.agreements (master_broker_organization_id, broker_organization_id, project_id, kind, signer_membership_id, valid_months, status, signature_document_id, expires_at, commission_rate, commission_terms, master_broker_rep_name, master_broker_rep_position, master_broker_rep_email, created_by)
  values (v_master, v_agency_a, v_project, 'project_specific', v_agency_a_admin, 12, 'pending_signature', v_signature_document, now() + interval '12 months', 6, 'DEMO términos de comisión sujetos a validación.', 'Rony Bello', 'Master Broker', 'ronyabellor@gmail.com', 'a0000000-0000-0000-0000-000000000001')
  returning id into v_agreement;
  select id into v_signature_document from public.signature_documents where title = 'DEMO Acuerdo de colaboración firmado' order by id desc limit 1;
  insert into public.signature_signers (signature_document_id, name, email, phone, signer_role, sign_order, status, signed_at, signing_token_hash)
  values (v_signature_document, 'DEMO Agencia Norte QA', 'soporte@osvaldobello.com', '+1 809 555 0104', 'agency_admin', 1, 'signed', now() - interval '35 days', encode(digest('DEMO-signed-signer', 'sha256'), 'hex')) returning id into v_signer;
  insert into public.signature_fields (signer_id, page_number, x, y, width, height, field_type, label, value) values (v_signer, 1, 70, 84, 22, 8, 'signature', 'Firma DEMO', 'DEMO Agencia Norte QA');
  insert into public.agreements (master_broker_organization_id, broker_organization_id, project_id, kind, signer_membership_id, valid_months, status, signature_document_id, signed_at, expires_at, commission_rate, commission_terms, master_broker_rep_name, master_broker_rep_position, master_broker_rep_email, created_by)
  values (v_master, v_agency_b, v_project, 'project_specific', v_agency_b_admin, 12, 'signed', v_signature_document, now() - interval '35 days', now() + interval '11 months', 6, 'DEMO acuerdo firmado para validar consulta y descarga.', 'Rony Bello', 'Master Broker', 'ronyabellor@gmail.com', 'a0000000-0000-0000-0000-000000000001') on conflict do nothing;
  insert into public.agreement_notification_recipients (organization_id, email, label) values (v_master, 'ronyabellor@gmail.com', 'DEMO Administrador'), (v_master, 'soporte@osvaldobello.com', 'DEMO Soporte') on conflict do nothing;

  create temporary table if not exists demo_sales (id bigint primary key, idx integer) on commit drop;
  for i in 1..6 loop
    select id into v_contact from demo_contacts where idx = i;
    select id into v_unit from demo_units order by id offset (i - 1) limit 1;
    insert into public.reservation_requests (organization_id, opportunity_id, unit_id, requested_by_membership_id, status, expires_at, notes, reservation_type)
    select v_agency_a, o.id, v_unit, v_agency_a_agent, 'approved', now() + interval '90 days', 'DEMO reserva para QA', 'payment_confirmed' from demo_opportunities d join public.opportunities o on o.id = d.id where d.idx = i returning id into v_request;
    insert into public.reservations (organization_id, reservation_request_id, unit_id, status, reserved_at, reservation_type)
    values (v_agency_a, v_request, v_unit, 'converted', now() - ((60 - i * 5) || ' days')::interval, 'payment_confirmed') returning id into v_reservation;
    insert into public.sales (organization_id, reservation_id, unit_id, contact_id, sale_price, currency, closed_at)
    values (v_agency_a, v_reservation, v_unit, v_contact, 185000 + i * 12000, 'USD', now() - ((55 - i * 5) || ' days')::interval) returning id into v_sale;
    insert into public.commissions (organization_id, sale_id, gross_amount, currency, status, created_at, updated_at)
    values (v_agency_a, v_sale, round((185000 + i * 12000) * 0.06, 2), 'USD', case when i <= 3 then 'paid' when i = 4 then 'invoiced' else 'approved' end, now() - ((50 - i * 5) || ' days')::interval, now() - ((50 - i * 5) || ' days')::interval) returning id into v_commission;
    insert into public.commission_participants (commission_id, organization_id, membership_id, percentage, amount)
    values (v_commission, null, v_agency_a_agent, 100, round((185000 + i * 12000) * 0.06, 2));
    status_value := case when i = 1 then 'paid' when i = 2 then 'paid' when i = 3 then 'paid' when i = 4 then 'invoice_submitted' when i = 5 then 'proforma_submitted' else 'payment_pending' end;
    insert into public.commission_claims (organization_id, project_id, unit_id, opportunity_id, sale_id, commission_id, submitted_by_membership_id, status, currency, commission_rate, gross_commission_amount, released_percentage, released_amount, developer_payment_confirmed_at, developer_payment_confirmed_by, developer_payment_reference, proforma_number, proforma_snapshot, proforma_generated_at, proforma_submitted_at, final_invoice_number, final_invoice_storage_bucket, final_invoice_storage_path, final_invoice_mime_type, final_invoice_size_bytes, final_invoice_submitted_at, reviewed_by, reviewed_at, review_notes, paid_at, paid_by, payment_reference, created_at, updated_at)
     select v_agency_a, v_project, v_unit, o.id, v_sale, v_commission, v_agency_a_agent, status_value, 'USD', 6, round((185000 + i * 12000) * 0.06, 2), case when i = 6 then 0 else 100 end, case when i = 6 then 0 else round((185000 + i * 12000) * 0.06, 2) end, case when i = 6 then null else now() - ((45 - i * 5) || ' days')::interval end, case when i = 6 then null else '03724e4d-8a17-44c8-b56c-ec2dba566418'::uuid end, case when i = 6 then null else 'DEMO-PAY-' || i end, case when i >= 4 then 'DEMO-PRO-' || i end, case when i >= 4 then jsonb_build_object('demo', true, 'sale_id', v_sale, 'client', 'DEMO Cliente ' || i) else '{}'::jsonb end, case when i >= 4 then now() - ((40 - i * 4) || ' days')::interval end, case when i >= 5 then now() - ((35 - i * 3) || ' days')::interval end, case when i <= 4 then 'DEMO-FACT-' || i end, case when i <= 4 then 'private-documents' end, case when i <= 4 then 'demo-agencia-caribe-qa/commissions/DEMO-' || i || '/factura.pdf' end, case when i <= 4 then 'application/pdf' end, case when i <= 4 then 4096 end, case when i <= 4 then now() - ((25 - i * 2) || ' days')::interval end, case when i <= 5 then 'a0000000-0000-0000-0000-000000000001'::uuid end, case when i <= 5 then now() - ((20 - i) || ' days')::interval end, case when i = 4 then 'DEMO factura recibida, pendiente de pago' end, case when i <= 3 then now() - ((15 - i * 3) || ' days')::interval end, case when i <= 3 then 'a0000000-0000-0000-0000-000000000001'::uuid end, case when i <= 3 then 'DEMO-TRANSFER-' || i end, now() - ((45 - i * 4) || ' days')::interval, now() - ((45 - i * 4) || ' days')::interval from demo_opportunities d join public.opportunities o on o.id = d.id where d.idx = i returning id into v_claim;
    insert into demo_sales values (v_sale, i);
    if i <= 4 then insert into public.commission_claim_documents (claim_id, organization_id, document_type, storage_path, file_name, mime_type, size_bytes, uploaded_by) values (v_claim, v_agency_a, 'final_invoice', 'demo-agencia-caribe-qa/commissions/DEMO-' || i || '/factura.pdf', 'DEMO-factura-' || i || '.pdf', 'application/pdf', 4096, '6c553d7e-80ae-4e79-868a-4fd23668260c'); end if;
  end loop;

  insert into public.notifications (organization_id, membership_id, type, title, body, link, created_at)
  values
    (v_master, v_master_member, 'demo', 'DEMO Comisión pagada', 'La comisión DEMO 1 fue marcada como pagada.', '/portal/comisiones', now() - interval '3 days'),
    (v_master, v_master_member, 'demo', 'DEMO Acuerdo firmado', 'El acuerdo DEMO con la Agencia Norte está firmado.', '/portal/agreements', now() - interval '2 days'),
    (v_agency_a, v_agency_a_admin, 'demo', 'DEMO Propuesta aceptada', 'El cliente DEMO aceptó una propuesta.', '/portal/proposals', now() - interval '1 day'),
    (v_agency_a, v_agency_a_agent, 'demo', 'DEMO Seguimiento pendiente', 'Hay una actividad DEMO pendiente de seguimiento.', '/portal/crm', now() - interval '5 hours'),
    (v_developer, v_developer_admin, 'demo', 'DEMO Estado de comisión', 'Existe una comisión DEMO pendiente de confirmación.', '/portal/comisiones', now() - interval '4 hours')
  on conflict do nothing;
end $$;

commit;
