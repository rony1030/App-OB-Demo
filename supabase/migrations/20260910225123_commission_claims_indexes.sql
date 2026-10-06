-- Recuperada del historial remoto de Supabase (aplicada fuera de git)
-- Cover every commission workflow foreign key used in policy and audit queries.
create index if not exists commission_claims_unit_idx on public.commission_claims (unit_id);
create index if not exists commission_claims_opportunity_idx on public.commission_claims (opportunity_id);
create index if not exists commission_claims_sale_idx on public.commission_claims (sale_id);
create index if not exists commission_claims_commission_idx on public.commission_claims (commission_id);
create index if not exists commission_claims_membership_idx on public.commission_claims (submitted_by_membership_id);
create index if not exists commission_claims_confirmed_by_idx on public.commission_claims (developer_payment_confirmed_by);
create index if not exists commission_claims_reviewed_by_idx on public.commission_claims (reviewed_by);
create index if not exists commission_claims_paid_by_idx on public.commission_claims (paid_by);
create index if not exists commission_claim_documents_org_idx on public.commission_claim_documents (organization_id);
create index if not exists commission_claim_documents_uploaded_by_idx on public.commission_claim_documents (uploaded_by);


