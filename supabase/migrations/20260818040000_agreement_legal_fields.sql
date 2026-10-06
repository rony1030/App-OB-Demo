-- The generated collaboration agreement PDF needs to read like a real
-- Dominican legal contract (per the user's reference document): both
-- parties' legal domicile, legal representative name and cédula/RNC. These
-- are organization-level facts (don't change per agreement), except the
-- signer's personal cédula which belongs on signature_signers.

alter table public.organizations
  add column if not exists legal_address text,
  add column if not exists legal_representative_name text,
  add column if not exists legal_representative_id text;

alter table public.signature_signers
  add column if not exists id_number text;
