-- Cosmetic fix: the demo land_subdivision seed declared inventory_available_declared=16
-- (all lots), but the seeded grid actually ships with 3 sold + 2 reserved lots.
update public.projects
set inventory_available_declared = 11
where slug = 'residencial-las-palmas' and project_type = 'land_subdivision';
