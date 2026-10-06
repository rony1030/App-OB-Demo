-- Auto-assign public_code on organization insert, matching the pattern
-- already used by memberships and contacts triggers.

create or replace function private.assign_organization_public_code()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.public_code is null or left(new.public_code, 3) like '%-T%' then
    new.public_code := private.public_code_prefix(new.name) || '-' || lpad(new.id::text, 6, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists organizations_assign_public_code on public.organizations;
create trigger organizations_assign_public_code
before insert on public.organizations
for each row execute function private.assign_organization_public_code();
