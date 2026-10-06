-- Recuperada del historial remoto de Supabase (aplicada fuera de git)
-- Keep every existing platform-owned dossier as an editable private template.
-- This is reversible: the platform administrator can publish a template again
-- from the dossier editor after confirming its content.
update public.shared_links sl
set status = 'revoked'
where sl.status = 'active'
  and exists (
    select 1
    from public.presentation_versions pv
    join public.presentations p on p.id = pv.presentation_id
    join public.memberships m on m.id = p.author_membership_id
    where pv.id = sl.presentation_version_id
      and p.kind = 'dossier'
      and p.status <> 'archived'
      and m.role = 'super_admin'
  );

update public.presentations p
set status = 'draft', updated_at = now()
from public.memberships m
where p.author_membership_id = m.id
  and p.kind = 'dossier'
  and p.status <> 'archived'
  and m.role = 'super_admin';
