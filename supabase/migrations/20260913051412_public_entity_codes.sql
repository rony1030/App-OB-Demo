-- Human-facing references are intentionally separate from primary keys. They
-- remain stable as the platform grows and do not disclose sequence volume.
create or replace function private.assign_public_entity_code()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(to_jsonb(new) ->> 'public_code', '') = '' then
    new := jsonb_populate_record(
      new,
      jsonb_build_object(
        'public_code', concat(tg_argv[0], '-', to_char(current_date, 'YYMMDD'), '-', upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)))
      )
    );
  end if;
  return new;
end;
$$;

alter table public.agreements add column if not exists public_code text;
alter table public.contacts add column if not exists public_code text;
alter table public.lead_reports add column if not exists public_code text;
alter table public.opportunities add column if not exists public_code text;
alter table public.client_documents add column if not exists public_code text;
alter table public.broker_documents add column if not exists public_code text;
alter table public.signature_documents add column if not exists public_code text;
alter table public.presentations add column if not exists public_code text;

update public.agreements set public_code = concat('AGR-', to_char(created_at, 'YYMMDD'), '-', upper(substr(md5(id::text || created_at::text), 1, 10))) where public_code is null;
update public.contacts set public_code = concat('CLI-', to_char(created_at, 'YYMMDD'), '-', upper(substr(md5(id::text || created_at::text), 1, 10))) where public_code is null;
update public.lead_reports set public_code = concat('LEAD-', to_char(created_at, 'YYMMDD'), '-', upper(substr(md5(id::text || created_at::text), 1, 10))) where public_code is null;
update public.opportunities set public_code = concat('NEG-', to_char(created_at, 'YYMMDD'), '-', upper(substr(md5(id::text || created_at::text), 1, 10))) where public_code is null;
update public.client_documents set public_code = concat('DOC-', to_char(created_at, 'YYMMDD'), '-', upper(substr(md5(id::text || created_at::text), 1, 10))) where public_code is null;
update public.broker_documents set public_code = concat('BDOC-', to_char(created_at, 'YYMMDD'), '-', upper(substr(md5(id::text || created_at::text), 1, 10))) where public_code is null;
update public.signature_documents set public_code = concat('SDOC-', to_char(created_at, 'YYMMDD'), '-', upper(substr(md5(id::text || created_at::text), 1, 10))) where public_code is null;
update public.presentations set public_code = concat('PROP-', to_char(created_at, 'YYMMDD'), '-', upper(substr(md5(id::text || created_at::text), 1, 10))) where public_code is null;

alter table public.agreements alter column public_code set not null;
alter table public.contacts alter column public_code set not null;
alter table public.lead_reports alter column public_code set not null;
alter table public.opportunities alter column public_code set not null;
alter table public.client_documents alter column public_code set not null;
alter table public.broker_documents alter column public_code set not null;
alter table public.signature_documents alter column public_code set not null;
alter table public.presentations alter column public_code set not null;

create unique index if not exists agreements_public_code_idx on public.agreements (public_code);
create unique index if not exists contacts_public_code_idx on public.contacts (public_code);
create unique index if not exists lead_reports_public_code_idx on public.lead_reports (public_code);
create unique index if not exists opportunities_public_code_idx on public.opportunities (public_code);
create unique index if not exists client_documents_public_code_idx on public.client_documents (public_code);
create unique index if not exists broker_documents_public_code_idx on public.broker_documents (public_code);
create unique index if not exists signature_documents_public_code_idx on public.signature_documents (public_code);
create unique index if not exists presentations_public_code_idx on public.presentations (public_code);

drop trigger if exists agreements_assign_public_code on public.agreements;
drop trigger if exists contacts_assign_public_code on public.contacts;
drop trigger if exists lead_reports_assign_public_code on public.lead_reports;
drop trigger if exists opportunities_assign_public_code on public.opportunities;
drop trigger if exists client_documents_assign_public_code on public.client_documents;
drop trigger if exists broker_documents_assign_public_code on public.broker_documents;
drop trigger if exists signature_documents_assign_public_code on public.signature_documents;
drop trigger if exists presentations_assign_public_code on public.presentations;

create trigger agreements_assign_public_code before insert on public.agreements for each row execute function private.assign_public_entity_code('AGR');
create trigger contacts_assign_public_code before insert on public.contacts for each row execute function private.assign_public_entity_code('CLI');
create trigger lead_reports_assign_public_code before insert on public.lead_reports for each row execute function private.assign_public_entity_code('LEAD');
create trigger opportunities_assign_public_code before insert on public.opportunities for each row execute function private.assign_public_entity_code('NEG');
create trigger client_documents_assign_public_code before insert on public.client_documents for each row execute function private.assign_public_entity_code('DOC');
create trigger broker_documents_assign_public_code before insert on public.broker_documents for each row execute function private.assign_public_entity_code('BDOC');
create trigger signature_documents_assign_public_code before insert on public.signature_documents for each row execute function private.assign_public_entity_code('SDOC');
create trigger presentations_assign_public_code before insert on public.presentations for each row execute function private.assign_public_entity_code('PROP');
