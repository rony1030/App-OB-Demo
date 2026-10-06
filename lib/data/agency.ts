import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import { hasCapability } from '@/lib/auth/permissions';
import type { OrganizationDocument, OrganizationDocumentType } from '@/lib/agency-documents-constants';

export type { OrganizationDocument, OrganizationDocumentType } from '@/lib/agency-documents-constants';

export async function getAgencyDocuments(): Promise<OrganizationDocument[]> {
  const currentUser = await getCurrentUser();
  if (!currentUser || !hasCapability(currentUser.role, 'manage_agency_documents')) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('organization_documents')
    .select('id, document_type, title, status, storage_bucket, storage_path, mime_type, size_bytes, issued_at, expires_at, notes, created_at')
    .eq('organization_id', currentUser.organization.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`No fue posible cargar documentos de agencia: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id,
    documentType: row.document_type as OrganizationDocumentType,
    title: row.title,
    status: row.status,
    storageBucket: row.storage_bucket,
    storagePath: row.storage_path,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    issuedAt: row.issued_at,
    expiresAt: row.expires_at,
    notes: row.notes,
    createdAt: row.created_at,
  }));
}
