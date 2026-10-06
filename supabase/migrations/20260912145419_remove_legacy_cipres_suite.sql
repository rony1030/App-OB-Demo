-- Recuperada del historial remoto de Supabase (aplicada fuera de git)
delete from public.typologies t using public.projects p where t.project_id = p.id and p.slug = 'cipres-residences' and lower(trim(t.name)) in ('suite estándar', 'suite estandar');
