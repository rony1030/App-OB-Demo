CREATE POLICY "temp_migration_anon_insert" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'public-assets');
CREATE POLICY "temp_migration_anon_update" ON storage.objects FOR UPDATE TO anon USING (bucket_id = 'public-assets');
