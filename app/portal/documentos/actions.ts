'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import { hasCapability } from '@/lib/auth/permissions';
import type { BrokerDocumentType } from '@/lib/data/broker-documents';
import { MAX_DOCUMENT_SIZE_BYTES, MAX_DOCUMENT_SIZE_LABEL } from '@/lib/storage/document-limits';

type ActionResult = { success?: boolean; error?: string };

export async function uploadBrokerDocumentAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser || !currentUser.membershipId) return { error: 'Debes iniciar sesión.' };

  const documentType = String(formData.get('documentType') || 'other') as BrokerDocumentType;
  const title = String(formData.get('title') || '').trim();
  const expiresAtRaw = String(formData.get('expiresAt') || '').trim();
  const issuedAtRaw = String(formData.get('issuedAt') || '').trim();
  const file = formData.get('file') as File | null;

  if (!title || !file || file.size === 0) {
    return { error: 'Selecciona un archivo y escribe un título.' };
  }
  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    return { error: `El documento no puede superar ${MAX_DOCUMENT_SIZE_LABEL}.` };
  }
  if (!['application/pdf', 'image/png', 'image/jpeg'].includes(file.type)) {
    return { error: 'Solo se permiten documentos PDF, PNG o JPG.' };
  }

  const supabase = await createClient();
  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'pdf';
  const path = `${currentUser.organization.slug}/broker-documents/${currentUser.membershipId}/${documentType}-${Date.now()}.${extension}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from('private-documents')
    .upload(path, Buffer.from(arrayBuffer), { contentType: file.type || 'application/octet-stream', upsert: false });
  if (uploadError) return { error: uploadError.message };

  const { error: insertError } = await supabase.from('broker_documents').insert({
    organization_id: currentUser.organization.id,
    membership_id: currentUser.membershipId,
    document_type: documentType,
    title,
    storage_bucket: 'private-documents',
    storage_path: path,
    mime_type: file.type || 'application/octet-stream',
    size_bytes: file.size,
    status: 'submitted',
    issued_at: issuedAtRaw || null,
    expires_at: expiresAtRaw || null,
    created_by: currentUser.id,
  });
  if (insertError) {
    await supabase.storage.from('private-documents').remove([path]);
    return { error: insertError.message };
  }

  revalidatePath('/portal/documentos');
  return { success: true };
}

export async function getBrokerDocumentSignedUrlAction(storagePath: string): Promise<{ url?: string; error?: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: 'Debes iniciar sesión.' };
  const supabase = await createClient();
  const { data: document, error: documentError } = await supabase
    .from('broker_documents')
    .select('storage_bucket, storage_path, organization_id, membership_id')
    .eq('organization_id', currentUser.organization.id)
    .eq('storage_path', storagePath)
    .maybeSingle();

  if (documentError || !document) return { error: 'Documento no encontrado.' };
  const canViewOtherMembers = hasCapability(currentUser.role, 'manage_agency_documents');
  if (!canViewOtherMembers && document.membership_id !== currentUser.membershipId) {
    return { error: 'No tienes permiso para ver este documento.' };
  }

  const { data, error } = await supabase.storage.from(document.storage_bucket).createSignedUrl(document.storage_path, 300);
  if (error || !data) return { error: error?.message || 'No fue posible generar el enlace.' };
  return { url: data.signedUrl };
}
