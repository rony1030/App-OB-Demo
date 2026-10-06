alter table public.profiles
  add column if not exists professional_title text;

alter table public.profiles
  add constraint profiles_professional_title_length
  check (professional_title is null or char_length(trim(professional_title)) between 2 and 80) not valid;

comment on column public.profiles.professional_title is
  'Public-facing professional title shown on proposals and dossiers; maximum 80 characters.';
