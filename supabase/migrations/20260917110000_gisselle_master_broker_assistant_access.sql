-- Gisselle trabaja como asistente del master broker: consulta todos los
-- proyectos y puede preparar propuestas/dossiers, pero no cambia de workspace
-- ni recibe permisos de administración de usuarios o plataforma.
update public.memberships as m
set role = 'agency_support', updated_at = now()
from public.profiles as p
where p.user_id = m.user_id
  and lower(p.email) = lower('gisselledls@osvaldobello.com')
  and m.status = 'active';
