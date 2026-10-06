'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import { hasCapability } from '@/lib/auth/permissions';
import type { OrganizationDocumentType } from '@/lib/agency-documents-constants';
import { MAX_DOCUMENT_SIZE_BYTES, MAX_DOCUMENT_SIZE_LABEL } from '@/lib/storage/document-limits';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

export async function uploadAgencyDocumentAction(
  _prev: { success?: boolean; error?: string } | null,
  formData: FormData
): Promise<{ success?: boolean; error?: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser || !hasCapability(currentUser.role, 'manage_agency_documents')) {
    return { error: 'No tienes permiso para subir documentos de agencia.' };
  }

  const title = String(formData.get('title') || '').trim();
  const documentType = String(formData.get('documentType') || 'other') as OrganizationDocumentType;
  const expiresAt = String(formData.get('expiresAt') || '').trim() || null;
  const notes = String(formData.get('notes') || '').trim() || null;
  const file = formData.get('file') as File | null;

  if (!title || !file || file.size === 0) return { error: 'Escribe un título y selecciona un archivo.' };
  if (file.size > MAX_DOCUMENT_SIZE_BYTES) return { error: `El archivo supera el límite de ${MAX_DOCUMENT_SIZE_LABEL}.` };
  if (!ALLOWED_MIME_TYPES.has(file.type)) return { error: 'Formato no permitido. Usa PDF, imagen u Office.' };

  const supabase = await createClient();
  const { data: documentRow, error: insertError } = await supabase
    .from('organization_documents')
    .insert({
      organization_id: currentUser.organization.id,
      document_type: documentType,
      title,
      status: 'submitted',
      storage_bucket: 'private-documents',
      expires_at: expiresAt,
      notes,
      created_by: currentUser.id,
      mime_type: file.type,
      size_bytes: file.size,
    })
    .select('id')
    .single();

  if (insertError || !documentRow) return { error: insertError?.message || 'No fue posible registrar el documento.' };

  const extension = file.name.split('.').pop()?.toLowerCase() || 'pdf';
  const storagePath = `${currentUser.organization.slug}/agency-documents/${documentRow.id}/${Date.now()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from('private-documents')
    .upload(storagePath, buffer, { contentType: file.type, upsert: false });

  if (uploadError) return { error: uploadError.message };

  const { error: updateError } = await supabase
    .from('organization_documents')
    .update({ storage_path: storagePath })
    .eq('id', documentRow.id)
    .eq('organization_id', currentUser.organization.id);

  if (updateError) return { error: updateError.message };

  revalidatePath('/portal/agency');
  return { success: true };
}

export async function getAgencyDocumentUrlAction(documentId: number): Promise<{ url?: string; error?: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser || !hasCapability(currentUser.role, 'manage_agency_documents')) {
    return { error: 'No tienes permiso para ver este documento.' };
  }

  const supabase = await createClient();
  const { data: doc, error } = await supabase
    .from('organization_documents')
    .select('storage_bucket, storage_path')
    .eq('id', documentId)
    .eq('organization_id', currentUser.organization.id)
    .maybeSingle();

  if (error || !doc?.storage_path) return { error: error?.message || 'Documento no encontrado.' };

  const { data, error: signError } = await supabase.storage
    .from(doc.storage_bucket)
    .createSignedUrl(doc.storage_path, 300);

  if (signError || !data) return { error: signError?.message || 'No fue posible abrir el documento.' };
  return { url: data.signedUrl };
}

export async function refreshSellerDossierAction(membershipId: number): Promise<{ success?: boolean; error?: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser || !hasCapability(currentUser.role, 'manage_agency_users')) {
    return { error: 'No tienes permiso para actualizar dossiers de vendedores.' };
  }

  const supabase = await createClient();
  const { data: membership, error } = await supabase
    .from('memberships')
    .select('id, organization_id, role')
    .eq('id', membershipId)
    .maybeSingle();

  if (error || !membership) return { error: error?.message || 'Vendedor no encontrado.' };
  if (currentUser.role !== 'super_admin' && membership.organization_id !== currentUser.organization.id) {
    return { error: 'Solo puedes actualizar vendedores de tu agencia.' };
  }
  if (membership.role !== 'broker_agent') {
    return { error: 'Solo se actualizan dossiers individuales de vendedores.' };
  }

  await supabase
    .from('memberships')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', membershipId);

  revalidatePath('/portal/projects');
  revalidatePath('/portal/admin/users');
  return { success: true };
}
