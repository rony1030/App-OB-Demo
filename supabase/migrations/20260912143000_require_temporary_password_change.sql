alter table public.profiles
  add column if not exists must_change_password boolean not null default false;

comment on column public.profiles.must_change_password is
  'When true, the member must define a new password before entering the CRM.';
