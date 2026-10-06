-- The app had no way to look up another user's email at all: `profiles` never
-- stored it, and there was no trigger creating a profile row on signup in the
-- first place. That blocks a real, needed flow: a master broker referencing a
-- specific broker (from a different organization) as the signer of an
-- agreement. This adds the standard Supabase "mirror auth.users into a public
-- profile" trigger, backfills existing users, and opens a minimal directory
-- read so staff can look up who they're inviting to sign.

alter table public.profiles add column if not exists email extensions.citext;

update public.profiles p
set email = u.email::extensions.citext
from auth.users u
where u.id = p.user_id
  and p.email is null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, display_name, email)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1), 'Usuario'),
    new.email
  )
  on conflict (user_id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Minimal cross-org directory: any active platform member can look up the
-- display name/email of another active member, to identify who to invite
-- or send an agreement to. Mirrors the already-open `organizations` read
-- policy (organizations_public_select using (true)) rather than introducing
-- a new openness posture.
create policy profiles_directory_select on public.profiles for select to authenticated
  using (exists (
    select 1 from public.memberships m
    where m.user_id = profiles.user_id and m.status = 'active'
  ));
