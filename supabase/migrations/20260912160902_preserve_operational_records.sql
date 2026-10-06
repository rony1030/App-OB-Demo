-- Recuperada del historial remoto de Supabase (aplicada fuera de git)
-- Operational records are archived in the application and retained for
-- evidence. Client roles must never receive a direct DELETE capability.
drop policy if exists project_documents_privileged_delete on public.project_documents;
drop policy if exists document_versions_org_delete on public.document_versions;

comment on table public.project_documents is
  'Versioned project documents. Operational removal archives the record; document versions are retained.';
