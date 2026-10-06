-- =========================================================================================
-- MIGRACIÓN IDEMPOTENTE Y ESTRICTA: ASOCIACIÓN DE GALERÍA CANA ROCK STAR (ID 22)
-- Proyecto: Cana Rock Star | Slug: cana-rock-star | organization_id: 16
-- Destino: public.project_media
-- Total imágenes: 94 | Prefijo: bello-valdez-enterprise/projects/cana-rock-star/
-- =========================================================================================

DO $$
DECLARE
  c_project_id      CONSTANT BIGINT  := 22;
  c_expected_org_id CONSTANT BIGINT  := 16;
  c_expected_slug   CONSTANT TEXT    := 'cana-rock-star';
  c_expected_bucket CONSTANT TEXT    := 'public-assets';
  c_expected_kind   CONSTANT TEXT    := 'gallery';
  c_expected_count  CONSTANT INTEGER := 94;

  v_actual_org_id         BIGINT;
  v_actual_slug           TEXT;
  v_storage_discrepancies TEXT;
  v_collision_details     TEXT;
  v_inserted_count        INTEGER := 0;
  v_post_count            INTEGER;
  v_post_discrepancies    TEXT;
BEGIN
  -- ---------------------------------------------------------------------------------------
  -- 1. Validar identidad y pertenencia estricta del proyecto en base de datos
  -- ---------------------------------------------------------------------------------------
  SELECT organization_id, slug INTO v_actual_org_id, v_actual_slug
  FROM public.projects
  WHERE id = c_project_id;

  IF v_actual_slug IS NULL THEN
    RAISE EXCEPTION '[VALIDATION_FAILED] Proyecto ID % no existe en public.projects.', c_project_id;
  END IF;

  IF v_actual_slug <> c_expected_slug OR v_actual_org_id <> c_expected_org_id THEN
    RAISE EXCEPTION '[VALIDATION_FAILED] Discrepancia en proyecto ID %: slug actual="%" (esperado="%"), organization_id actual=% (esperado=%).',
      c_project_id, v_actual_slug, c_expected_slug, v_actual_org_id, c_expected_org_id;
  END IF;

  -- ---------------------------------------------------------------------------------------
  -- 2. Crear tabla temporal con el inventario determinista de las 94 rutas esperadas
  -- ---------------------------------------------------------------------------------------
  CREATE TEMP TABLE temp_target_gallery (
    sort_order   INTEGER PRIMARY KEY,
    storage_path TEXT NOT NULL UNIQUE,
    alt_text     TEXT NOT NULL
  ) ON COMMIT DROP;

  INSERT INTO temp_target_gallery (sort_order, storage_path, alt_text) VALUES
    (1, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-018ba6bb-68bc-4e72-b82f-0b5abd8196f2.jpg', 'gallery-018ba6bb-68bc-4e72-b82f-0b5abd8196f2.jpg'),
    (2, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-022f092e-0d0a-416b-b2e6-f4867716f828.jpg', 'gallery-022f092e-0d0a-416b-b2e6-f4867716f828.jpg'),
    (3, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-08f94eda-e608-4e1d-97d6-51d315ca6825.jpg', 'gallery-08f94eda-e608-4e1d-97d6-51d315ca6825.jpg'),
    (4, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-0918eeb3-0eeb-41f4-a502-19c60641c25e.jpg', 'gallery-0918eeb3-0eeb-41f4-a502-19c60641c25e.jpg'),
    (5, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-0a3b1cc4-281f-4320-bff1-c24741421406.jpg', 'gallery-0a3b1cc4-281f-4320-bff1-c24741421406.jpg'),
    (6, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-0ed5477f-f83a-49d3-941f-0340cbfc9d26.jpg', 'gallery-0ed5477f-f83a-49d3-941f-0340cbfc9d26.jpg'),
    (7, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-0ef5f62d-4129-4b12-9bf3-0425a66064e9.jpg', 'gallery-0ef5f62d-4129-4b12-9bf3-0425a66064e9.jpg'),
    (8, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-111e24ee-b4ba-4474-9f4f-091216cb539e.jpg', 'gallery-111e24ee-b4ba-4474-9f4f-091216cb539e.jpg'),
    (9, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-115db863-5397-49aa-9b30-207edf9b02ea.jpg', 'gallery-115db863-5397-49aa-9b30-207edf9b02ea.jpg'),
    (10, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-128def76-e8ec-4901-b0cc-ea355a36375c.jpg', 'gallery-128def76-e8ec-4901-b0cc-ea355a36375c.jpg'),
    (11, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-134a0fc9-9235-4ac5-b680-0ba6d359fecd.jpg', 'gallery-134a0fc9-9235-4ac5-b680-0ba6d359fecd.jpg'),
    (12, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-162e9da3-2dc3-4d8b-81ae-109717c0e923.jpg', 'gallery-162e9da3-2dc3-4d8b-81ae-109717c0e923.jpg'),
    (13, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-1da3b7b1-652b-4c51-98c3-e63fa8792ec7.png', 'gallery-1da3b7b1-652b-4c51-98c3-e63fa8792ec7.png'),
    (14, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-1fc9c065-340c-4beb-a80e-0d5bef646cc1.jpg', 'gallery-1fc9c065-340c-4beb-a80e-0d5bef646cc1.jpg'),
    (15, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-20cda8bd-e780-4489-aa33-413c220f6a33.jpg', 'gallery-20cda8bd-e780-4489-aa33-413c220f6a33.jpg'),
    (16, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-22d8cad2-b5d8-48f1-87dc-aaf73f826d81.jpg', 'gallery-22d8cad2-b5d8-48f1-87dc-aaf73f826d81.jpg'),
    (17, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-23a26df8-6571-45a4-9536-9a8764faf83d.jpg', 'gallery-23a26df8-6571-45a4-9536-9a8764faf83d.jpg'),
    (18, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-23db3b3f-f9dd-4e9d-8e5e-3b6f9dc24168.jpg', 'gallery-23db3b3f-f9dd-4e9d-8e5e-3b6f9dc24168.jpg'),
    (19, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-2449339b-d62a-4816-8c5e-e365f51aadab.jpg', 'gallery-2449339b-d62a-4816-8c5e-e365f51aadab.jpg'),
    (20, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-2509e1ab-3ae8-428b-a616-266671b76725.jpg', 'gallery-2509e1ab-3ae8-428b-a616-266671b76725.jpg'),
    (21, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-271ee742-dace-459e-903d-9902cf225b8c.jpg', 'gallery-271ee742-dace-459e-903d-9902cf225b8c.jpg'),
    (22, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-29f5ee9c-2ecc-475e-b3ed-4c819463cd14.jpg', 'gallery-29f5ee9c-2ecc-475e-b3ed-4c819463cd14.jpg'),
    (23, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-2b7153d6-a5ed-466d-981c-ef99febb6eef.jpg', 'gallery-2b7153d6-a5ed-466d-981c-ef99febb6eef.jpg'),
    (24, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-2fa37626-183b-41f1-8a5a-cf018e0e04f4.jpg', 'gallery-2fa37626-183b-41f1-8a5a-cf018e0e04f4.jpg'),
    (25, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-37552757-e13e-4a10-bd12-bd374b562c81.jpg', 'gallery-37552757-e13e-4a10-bd12-bd374b562c81.jpg'),
    (26, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-38ba1830-66c5-4156-ba51-b6e27ea45ac5.jpg', 'gallery-38ba1830-66c5-4156-ba51-b6e27ea45ac5.jpg'),
    (27, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-3a2011a8-6928-4322-acee-323de21bba02.jpg', 'gallery-3a2011a8-6928-4322-acee-323de21bba02.jpg'),
    (28, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-3d4316e4-7a60-49fe-9650-6c5e50540142.jpg', 'gallery-3d4316e4-7a60-49fe-9650-6c5e50540142.jpg'),
    (29, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-40bf9927-eb62-4b7e-b744-b1ec584eea60.jpg', 'gallery-40bf9927-eb62-4b7e-b744-b1ec584eea60.jpg'),
    (30, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-425ad258-6dae-463c-a52d-8b63dc5d6804.jpg', 'gallery-425ad258-6dae-463c-a52d-8b63dc5d6804.jpg'),
    (31, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-5134d469-a1bf-4bf4-9a09-7a0f060611be.jpg', 'gallery-5134d469-a1bf-4bf4-9a09-7a0f060611be.jpg'),
    (32, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-51815be1-117c-4531-9637-540e918c35ad.jpg', 'gallery-51815be1-117c-4531-9637-540e918c35ad.jpg'),
    (33, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-563b45d2-3425-474f-b605-ee445e9daf3b.jpg', 'gallery-563b45d2-3425-474f-b605-ee445e9daf3b.jpg'),
    (34, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-57a616f5-7483-4a94-9e09-ea620c1d083a.jpg', 'gallery-57a616f5-7483-4a94-9e09-ea620c1d083a.jpg'),
    (35, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-5a2af882-62c9-4658-b1a6-b089164ea2bd.jpg', 'gallery-5a2af882-62c9-4658-b1a6-b089164ea2bd.jpg'),
    (36, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-5d78392c-a3e4-4879-9b70-35901e4261ec.jpg', 'gallery-5d78392c-a3e4-4879-9b70-35901e4261ec.jpg'),
    (37, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-63003cbb-0fc6-4391-8319-a985390c1cdd.jpg', 'gallery-63003cbb-0fc6-4391-8319-a985390c1cdd.jpg'),
    (38, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-65ad5384-f147-4aa9-80ad-7cd788e3046c.jpg', 'gallery-65ad5384-f147-4aa9-80ad-7cd788e3046c.jpg'),
    (39, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-6ca25ecd-0c61-4c9a-9c36-2b401d301f27.jpg', 'gallery-6ca25ecd-0c61-4c9a-9c36-2b401d301f27.jpg'),
    (40, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-6ca93a23-933c-4f12-88b3-4ccc2a7c1f53.jpg', 'gallery-6ca93a23-933c-4f12-88b3-4ccc2a7c1f53.jpg'),
    (41, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-6e2a40f2-cd37-4d7c-ab0c-f6e6c5d32941.jpg', 'gallery-6e2a40f2-cd37-4d7c-ab0c-f6e6c5d32941.jpg'),
    (42, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-6e588bd4-0e70-4281-b0bf-64b19ef4e4f6.jpg', 'gallery-6e588bd4-0e70-4281-b0bf-64b19ef4e4f6.jpg'),
    (43, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-6fb0549a-ae79-45db-8743-b3aaa50dee36.jpg', 'gallery-6fb0549a-ae79-45db-8743-b3aaa50dee36.jpg'),
    (44, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-70c5aaa6-f6c6-444b-9547-afc024a3e4ad.jpg', 'gallery-70c5aaa6-f6c6-444b-9547-afc024a3e4ad.jpg'),
    (45, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-731d1a95-fd76-4972-af45-7249646a6226.jpg', 'gallery-731d1a95-fd76-4972-af45-7249646a6226.jpg'),
    (46, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-775aa404-27b8-411f-ab2a-f4c6859ffbf2.jpg', 'gallery-775aa404-27b8-411f-ab2a-f4c6859ffbf2.jpg'),
    (47, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-7ee45441-4a96-434f-ae36-be466a57742c.jpg', 'gallery-7ee45441-4a96-434f-ae36-be466a57742c.jpg'),
    (48, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-8350c160-32da-4b17-bcb2-53213436742a.jpg', 'gallery-8350c160-32da-4b17-bcb2-53213436742a.jpg'),
    (49, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-857e09dc-d3b0-4259-a492-9c8b4ac7b658.jpg', 'gallery-857e09dc-d3b0-4259-a492-9c8b4ac7b658.jpg'),
    (50, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-85985c0f-4297-4cd6-8825-57d139c5c461.jpg', 'gallery-85985c0f-4297-4cd6-8825-57d139c5c461.jpg'),
    (51, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-8b963069-a0c0-4de3-bc13-7a643c5b4a80.jpg', 'gallery-8b963069-a0c0-4de3-bc13-7a643c5b4a80.jpg'),
    (52, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-8e2a7e47-4b73-4102-ab8a-073eb0090882.jpg', 'gallery-8e2a7e47-4b73-4102-ab8a-073eb0090882.jpg'),
    (53, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-94684b31-fc8e-43a5-bd50-252825787d65.jpg', 'gallery-94684b31-fc8e-43a5-bd50-252825787d65.jpg'),
    (54, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-96581c9a-cc3e-4eaf-a782-55dce128e4d2.jpg', 'gallery-96581c9a-cc3e-4eaf-a782-55dce128e4d2.jpg'),
    (55, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-978a08f9-09b5-4787-b4e5-710b10970d7f.jpg', 'gallery-978a08f9-09b5-4787-b4e5-710b10970d7f.jpg'),
    (56, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-9b686355-002b-4380-85ff-17c33d1c53dd.jpg', 'gallery-9b686355-002b-4380-85ff-17c33d1c53dd.jpg'),
    (57, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-a1119745-4f1a-4ecb-8dc3-1c51fcedeea0.jpg', 'gallery-a1119745-4f1a-4ecb-8dc3-1c51fcedeea0.jpg'),
    (58, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-a13984f4-0a22-4966-9dbd-929dad5856fc.jpg', 'gallery-a13984f4-0a22-4966-9dbd-929dad5856fc.jpg'),
    (59, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-a8690e37-918d-4d3e-88e0-bda18ea1d3d1.jpg', 'gallery-a8690e37-918d-4d3e-88e0-bda18ea1d3d1.jpg'),
    (60, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-acf6c0fe-de15-453f-ba82-56fb4b6aba5c.jpg', 'gallery-acf6c0fe-de15-453f-ba82-56fb4b6aba5c.jpg'),
    (61, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-ad8b4e49-e3e0-4a91-887c-12e635c6643f.jpg', 'gallery-ad8b4e49-e3e0-4a91-887c-12e635c6643f.jpg'),
    (62, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-ae6e025e-2b08-4cab-923d-68a5f3835c46.jpg', 'gallery-ae6e025e-2b08-4cab-923d-68a5f3835c46.jpg'),
    (63, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-b2f52087-79a3-4d5f-b1df-5a65250c01b8.jpg', 'gallery-b2f52087-79a3-4d5f-b1df-5a65250c01b8.jpg'),
    (64, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-b39d1063-3a52-4d8b-8cdd-b84dd4e42764.jpg', 'gallery-b39d1063-3a52-4d8b-8cdd-b84dd4e42764.jpg'),
    (65, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-b5142bbc-4c16-4ba1-a823-ea8a979610d6.jpg', 'gallery-b5142bbc-4c16-4ba1-a823-ea8a979610d6.jpg'),
    (66, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-b8ad11dc-bc4d-49c9-975b-8085ce799ddc.jpg', 'gallery-b8ad11dc-bc4d-49c9-975b-8085ce799ddc.jpg'),
    (67, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-bddc0f2d-bfdc-4827-a053-e944debbdafa.jpg', 'gallery-bddc0f2d-bfdc-4827-a053-e944debbdafa.jpg'),
    (68, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-bee7d394-8f7c-4891-ae7a-5a81a0f37ae4.jpg', 'gallery-bee7d394-8f7c-4891-ae7a-5a81a0f37ae4.jpg'),
    (69, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-bf02f6f7-647a-40ed-b893-e9217a3a0e9a.jpg', 'gallery-bf02f6f7-647a-40ed-b893-e9217a3a0e9a.jpg'),
    (70, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-c2c65b28-5ace-4418-a42b-cb652a568912.jpg', 'gallery-c2c65b28-5ace-4418-a42b-cb652a568912.jpg'),
    (71, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-c4e3cf84-6094-4be5-9b08-ec16a60bdac3.jpg', 'gallery-c4e3cf84-6094-4be5-9b08-ec16a60bdac3.jpg'),
    (72, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-c719ba87-b84a-40c9-aab2-b573b8ce5dff.jpg', 'gallery-c719ba87-b84a-40c9-aab2-b573b8ce5dff.jpg'),
    (73, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-c7d3885f-5bfa-472c-b1ab-b9e759a496da.jpg', 'gallery-c7d3885f-5bfa-472c-b1ab-b9e759a496da.jpg'),
    (74, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-cc5f96cc-8abf-485b-8dd2-a46b8c4bf38c.jpg', 'gallery-cc5f96cc-8abf-485b-8dd2-a46b8c4bf38c.jpg'),
    (75, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-cd351cf8-39a2-4c0c-945e-1533ec181bc1.jpg', 'gallery-cd351cf8-39a2-4c0c-945e-1533ec181bc1.jpg'),
    (76, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-d4e83123-97c0-4858-b6a7-a02da660bd4b.jpg', 'gallery-d4e83123-97c0-4858-b6a7-a02da660bd4b.jpg'),
    (77, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-d966160f-c2fb-4d2b-925a-73ad1e88466e.jpg', 'gallery-d966160f-c2fb-4d2b-925a-73ad1e88466e.jpg'),
    (78, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-da152ed9-8941-4b1c-84aa-ce9bd91af966.jpg', 'gallery-da152ed9-8941-4b1c-84aa-ce9bd91af966.jpg'),
    (79, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-dace3a2c-15b9-48e4-9792-831b76f80dea.jpg', 'gallery-dace3a2c-15b9-48e4-9792-831b76f80dea.jpg'),
    (80, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-dadd9d83-5f1d-40cc-b712-f1f617eee7fe.jpg', 'gallery-dadd9d83-5f1d-40cc-b712-f1f617eee7fe.jpg'),
    (81, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-dc2feb23-dabd-473f-86ca-a571ef192508.jpg', 'gallery-dc2feb23-dabd-473f-86ca-a571ef192508.jpg'),
    (82, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-dd251789-5a37-431a-a1f2-7c632da5043f.jpg', 'gallery-dd251789-5a37-431a-a1f2-7c632da5043f.jpg'),
    (83, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-dde4a0b3-9686-4a19-85ce-ca1fee8b9a34.jpg', 'gallery-dde4a0b3-9686-4a19-85ce-ca1fee8b9a34.jpg'),
    (84, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-e0714824-dd80-4a40-9bcd-9b5ea853003c.jpg', 'gallery-e0714824-dd80-4a40-9bcd-9b5ea853003c.jpg'),
    (85, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-e1d54275-659e-4260-954f-f9534dae8c32.jpg', 'gallery-e1d54275-659e-4260-954f-f9534dae8c32.jpg'),
    (86, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-e2ef3931-1dab-4f16-a00d-3d2079a7903a.jpg', 'gallery-e2ef3931-1dab-4f16-a00d-3d2079a7903a.jpg'),
    (87, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-e57e5338-aa71-4c38-99ac-bab782e149e0.jpg', 'gallery-e57e5338-aa71-4c38-99ac-bab782e149e0.jpg'),
    (88, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-e6c67543-c203-4f24-8f5d-a81ea1028e1a.jpg', 'gallery-e6c67543-c203-4f24-8f5d-a81ea1028e1a.jpg'),
    (89, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-e7f71cbd-cb2d-46fd-9041-202bb8dcd12b.jpg', 'gallery-e7f71cbd-cb2d-46fd-9041-202bb8dcd12b.jpg'),
    (90, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-f30f6e6c-a035-49c8-928f-e6fbe7e8e8ff.jpg', 'gallery-f30f6e6c-a035-49c8-928f-e6fbe7e8e8ff.jpg'),
    (91, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-f7e19f36-69cb-4dda-87c7-35d04105c9c4.jpg', 'gallery-f7e19f36-69cb-4dda-87c7-35d04105c9c4.jpg'),
    (92, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-f8b8de51-ea05-49df-8ca9-1fc482043e7e.jpg', 'gallery-f8b8de51-ea05-49df-8ca9-1fc482043e7e.jpg'),
    (93, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-f97d479c-723c-4cb7-bd22-5534ab9dc918.jpg', 'gallery-f97d479c-723c-4cb7-bd22-5534ab9dc918.jpg'),
    (94, 'bello-valdez-enterprise/projects/cana-rock-star/gallery-fdab8db0-fdf3-432a-b02a-75970e7522e0.jpg', 'gallery-fdab8db0-fdf3-432a-b02a-75970e7522e0.jpg');

  -- ---------------------------------------------------------------------------------------
  -- 3. Comparación por conjuntos exacta contra storage.objects bajo public-assets
  --    Falla si falta alguna ruta esperada o si existe algún objeto inesperado bajo el prefijo
  -- ---------------------------------------------------------------------------------------
  WITH storage_set_comparison AS (
    SELECT
      tg.storage_path AS expected_path,
      so.name AS actual_path
    FROM temp_target_gallery tg
    FULL OUTER JOIN (
      SELECT name
      FROM storage.objects
      WHERE bucket_id = c_expected_bucket
        AND name LIKE 'bello-valdez-enterprise/projects/cana-rock-star/%'
    ) so ON tg.storage_path = so.name
    WHERE tg.storage_path IS NULL OR so.name IS NULL
  )
  SELECT string_agg(
    CASE
      WHEN expected_path IS NULL THEN format('[OBJETO_INESPERADO_EN_STORAGE] %s', actual_path)
      WHEN actual_path IS NULL THEN format('[OBJETO_FALTANTE_EN_STORAGE] %s', expected_path)
    END,
    E'\n'
  )
  INTO v_storage_discrepancies
  FROM storage_set_comparison;

  IF v_storage_discrepancies IS NOT NULL THEN
    RAISE EXCEPTION '[STORAGE_SET_MISMATCH] Discrepancias exactas entre el inventario y storage.objects:\n%. Revertiendo.',
      v_storage_discrepancies;
  END IF;

  -- ---------------------------------------------------------------------------------------
  -- 4. Verificar colisiones previas en public.project_media
  --    Falla si alguna ruta ya existe asociada a otro proyecto, organización, bucket o tipo distinto a gallery.
  -- ---------------------------------------------------------------------------------------
  SELECT string_agg(format('ID: %s | project_id: %s | org_id: %s | kind: %s | path: %s', pm.id, pm.project_id, pm.organization_id, pm.kind, pm.storage_path), E'\n')
  INTO v_collision_details
  FROM public.project_media pm
  JOIN temp_target_gallery tg ON pm.storage_path = tg.storage_path
  WHERE pm.project_id <> c_project_id
     OR pm.organization_id <> c_expected_org_id
     OR pm.storage_bucket <> c_expected_bucket
     OR pm.kind <> c_expected_kind;

  IF v_collision_details IS NOT NULL THEN
    RAISE EXCEPTION '[COLLISION_DETECTED] Conflicto de rutas en project_media:\n%. Revertiendo.', v_collision_details;
  END IF;

  -- ---------------------------------------------------------------------------------------
  -- 5. Inserción idempotente de filas faltantes únicamente
  -- ---------------------------------------------------------------------------------------
  INSERT INTO public.project_media (
    organization_id,
    project_id,
    kind,
    storage_bucket,
    storage_path,
    alt_text,
    sort_order
  )
  SELECT
    c_expected_org_id,
    c_project_id,
    c_expected_kind,
    c_expected_bucket,
    tg.storage_path,
    tg.alt_text,
    tg.sort_order
  FROM temp_target_gallery tg
  WHERE NOT EXISTS (
    SELECT 1 FROM public.project_media pm
    WHERE pm.project_id = c_project_id
      AND pm.kind = c_expected_kind
      AND pm.storage_bucket = c_expected_bucket
      AND pm.storage_path = tg.storage_path
  );

  GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
  RAISE NOTICE 'Inserción completada: % filas nuevas insertadas.', v_inserted_count;

  -- ---------------------------------------------------------------------------------------
  -- 6. Verificación Post-Inserción Estricta (Conjunto exacto de 94 rutas y metadatos)
  --    Falla y revierte toda la transacción si falta alguna, sobra alguna o difieren los metadatos.
  -- ---------------------------------------------------------------------------------------
  -- 6.1 Conteo total de filas gallery del proyecto
  SELECT COUNT(*) INTO v_post_count
  FROM public.project_media
  WHERE project_id = c_project_id
    AND kind = c_expected_kind;

  IF v_post_count <> c_expected_count THEN
    RAISE EXCEPTION '[POST_CHECK_FAILED] Conteo de filas gallery para project_id=% es % (esperado=%). Revertiendo.',
      c_project_id, v_post_count, c_expected_count;
  END IF;

  -- 6.2 Comprobación de discrepancias en rutas, organization_id, sort_order, bucket o tipo
  WITH missing_or_mismatched AS (
    SELECT tg.sort_order AS exp_sort, tg.storage_path AS exp_path,
           pm.sort_order AS act_sort, pm.storage_path AS act_path, pm.organization_id AS act_org, pm.kind AS act_kind
    FROM temp_target_gallery tg
    FULL OUTER JOIN (
      SELECT * FROM public.project_media
      WHERE project_id = c_project_id
        AND kind = c_expected_kind
    ) pm ON tg.storage_path = pm.storage_path
    WHERE pm.id IS NULL
       OR tg.sort_order IS NULL
       OR pm.sort_order <> tg.sort_order
       OR pm.organization_id <> c_expected_org_id
       OR pm.storage_bucket <> c_expected_bucket
       OR pm.kind <> c_expected_kind
  )
  SELECT string_agg(format('ExpPath: %s (Sort: %s) vs ActPath: %s (Sort: %s, Org: %s, Kind: %s)', exp_path, exp_sort, act_path, act_sort, act_org, act_kind), E'\n')
  INTO v_post_discrepancies
  FROM missing_or_mismatched;

  IF v_post_discrepancies IS NOT NULL THEN
    RAISE EXCEPTION '[POST_CHECK_FAILED] Discrepancias encontradas en la galería:\n%. Revertiendo.', v_post_discrepancies;
  END IF;

  RAISE NOTICE 'ÉXITO TOTAL: Las 94 imágenes de Cana Rock Star están perfectamente asociadas y validadas.';
END $$;

-- 7. Consulta informativa de verificación
SELECT id, organization_id, project_id, kind, storage_bucket, storage_path, sort_order
FROM public.project_media
WHERE project_id = 22
ORDER BY sort_order ASC, id ASC;
