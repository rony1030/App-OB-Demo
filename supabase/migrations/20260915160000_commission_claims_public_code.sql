-- Add public_code to commission_claims following the same pattern as other entities.
alter table public.commission_claims add column if not exists public_code text;

update public.commission_claims
set public_code = concat(
  'COM-',
  to_char(created_at, 'YYMMDD'),
  '-',
  upper(substr(md5(id::text || created_at::text), 1, 10))
)
where public_code is null;

alter table public.commission_claims alter column public_code set not null;

create unique index if not exists commission_claims_public_code_idx
  on public.commission_claims (public_code);

drop trigger if exists commission_claims_assign_public_code on public.commission_claims;

create trigger commission_claims_assign_public_code
  before insert on public.commission_claims
  for each row execute function private.assign_public_entity_code('COM');
