-- Keep the Elements catalog copy aligned with the actual package offering.
-- This migration is safe to run after the original seed or on an existing catalog.
update public.project_media
set alt_text = 'Terraza y Picuzzi Privado'
where project_id in (select id from public.projects where slug = 'elements')
  and alt_text = 'Terraza y Piscina Privada';

update public.project_highlights
set content = 'Eco Deluxe amueblado y equipado; Eco Royal incorpora picuzzi integrado y paneles solares'
where project_id in (select id from public.projects where slug = 'elements')
  and content = 'Piscina privada incluida y paquetes de personalización Deluxe y Royal';

update public.amenities
set name = 'Picuzzi privado en Eco Royal'
where slug = 'piscina-privada'
  and name = 'Piscina privada en cada unidad'
  and id in (
    select pa.amenity_id
    from public.project_amenities pa
    join public.projects p on p.id = pa.project_id
    where p.slug = 'elements'
  );
