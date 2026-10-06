-- The public proposal/dossier viewer needs the authoring broker's real name,
-- email and phone (for the WhatsApp CTA and personalization) instead of
-- hardcoded demo values. Same narrowly-scoped pattern as the previous
-- migration: only the one membership/profile reachable as the author of a
-- currently-active, non-expired shared presentation.

grant select on memberships to anon;
grant select on profiles to anon;

create policy memberships_public_select_via_shared_link on memberships for select to anon, authenticated
using (
  exists (
    select 1 from presentations p
    join presentation_versions pv on pv.presentation_id = p.id
    join shared_links sl on sl.presentation_version_id = pv.id
    where p.author_membership_id = memberships.id
      and sl.status = 'active'
      and (sl.expires_at is null or sl.expires_at > now())
  )
);

create policy profiles_public_select_via_shared_link on profiles for select to anon, authenticated
using (
  exists (
    select 1 from memberships m
    join presentations p on p.author_membership_id = m.id
    join presentation_versions pv on pv.presentation_id = p.id
    join shared_links sl on sl.presentation_version_id = pv.id
    where m.user_id = profiles.user_id
      and sl.status = 'active'
      and (sl.expires_at is null or sl.expires_at > now())
  )
);
