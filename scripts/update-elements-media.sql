-- Update project_media for Elements Residences (project_id = 35) to point to public-assets storage
DELETE FROM project_media WHERE project_id = 35;

INSERT INTO project_media (project_id, organization_id, kind, storage_bucket, storage_path, alt_text, sort_order) VALUES
  (35, 1, 'hero', 'public-assets', 'bello-valdez-enterprise/projects/elements/exterior.jpg', 'Elements Residences & Resort Fachada Principal', 1),
  (35, 1, 'gallery', 'public-assets', 'bello-valdez-enterprise/projects/elements/ext-2.jpg', 'Exterior y Entorno Natural Biofílico', 2),
  (35, 1, 'gallery', 'public-assets', 'bello-valdez-enterprise/projects/elements/elements-3.jpg', 'Terraza y Piscina Privada', 3),
  (35, 1, 'gallery', 'public-assets', 'bello-valdez-enterprise/projects/elements/elements-5.jpg', 'Vista Aérea del Complejo', 4),
  (35, 1, 'gallery', 'public-assets', 'bello-valdez-enterprise/projects/elements/sala-comedor.jpg', 'Interior Sala y Comedor Integrados', 5),
  (35, 1, 'gallery', 'public-assets', 'bello-valdez-enterprise/projects/elements/hab-2.jpg', 'Suite Principal de Lujo Biofílico', 6),
  (35, 1, 'gallery', 'public-assets', 'bello-valdez-enterprise/projects/elements/bano-2.jpg', 'Baño Estilo Spa con Luz Cenital', 7),
  (35, 1, 'gallery', 'public-assets', 'bello-valdez-enterprise/projects/elements/garita.jpg', 'Entrada Principal y Garita de Seguridad', 8),
  (35, 1, 'gallery', 'public-assets', 'bello-valdez-enterprise/projects/elements/master-plan-3d.jpg', 'Master Plan 3D Elements', 9),
  (35, 1, 'gallery', 'public-assets', 'bello-valdez-enterprise/projects/elements/master-plan-2d.jpg', 'Master Plan 2D y Distribución de Solares', 10),
  (35, 1, 'gallery', 'public-assets', 'bello-valdez-enterprise/projects/elements/plano-tipologia-3d.jpg', 'Plano Isométrico 3D Eco Suite', 11);
