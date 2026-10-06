'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import { MAX_DOCUMENT_SIZE_BYTES, MAX_DOCUMENT_SIZE_LABEL } from '@/lib/storage/document-limits';

const ALLOWED_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
const TYPE_VALUES = new Set(['id_card', 'proof_of_funds', 'contract', 'payment_receipt', 'other']);

export async function uploadClientDocumentAction(
  contactId: number,
  formData: FormData,
): Promise<{ success?: boolean; error?: string }> {
  const db = await createClient();
  const user = await getCurrentUser(db);
  if (!user?.membershipId) return { error: 'Tu sesión expiró.' };
  const file = formData.get('file');
  if (!(file instanceof File) || file.size <= 0) return { error: 'Selecciona un documento.' };
  if (file.size > MAX_DOCUMENT_SIZE_BYTES || !ALLOWED_TYPES.has(file.type)) return { error: `Usa PDF, JPG, PNG o WEBP de hasta ${MAX_DOCUMENT_SIZE_LABEL}.` };

  const { data: contact } = await db.from('contacts').select('id, organization_id').eq('id', contactId).is('deleted_at', null).maybeSingle();
  if (!contact || contact.organization_id !== user.organization.id) return { error: 'Cliente no encontrado.' };
  const documentType = String(formData.get('documentType') || 'other');
  if (!TYPE_VALUES.has(documentType)) return { error: 'Tipo de documento inválido.' };
  const title = String(formData.get('title') || file.name).trim().slice(0, 160);
  const extension = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(-100);
  const path = `${user.organization.slug}/clients/${contactId}/${crypto.randomUUID()}-${safeName}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await db.storage.from('private-documents').upload(path, bytes, { contentType: file.type, upsert: false });
  if (uploadError) return { error: `No se pudo subir el documento: ${uploadError.message}` };
  // `client_documents` is added by the accompanying migration; generated types
  // on the deployment branch can lag behind schema changes.
  const { error: insertError } = await (db).from('client_documents').insert({
    organization_id: user.organization.id,
    contact_id: contactId,
    document_type: documentType,
    title: title || file.name,
    file_name: file.name,
    storage_bucket: 'private-documents',
    storage_path: path,
    mime_type: file.type,
    size_bytes: file.size,
    uploaded_by: user.id,
  });
  if (insertError) {
    await db.storage.from('private-documents').remove([path]);
    return { error: `No se pudo registrar el documento: ${insertError.message}` };
  }
  revalidatePath('/portal/clientes', 'layout');
  return { success: true };
}

export async function getClientDocumentUrlAction(documentId: number, contactId: number) {
  const db = await createClient();
  const user = await getCurrentUser(db);
  if (!user) return { error: 'Tu sesión expiró.' };
  const { data: document } = await (db).from('client_documents').select('storage_bucket, storage_path').eq('id', documentId).eq('contact_id', contactId).eq('organization_id', user.organization.id).maybeSingle();
  if (!document) return { error: 'Documento no encontrado.' };
  const { data, error } = await db.storage.from(document.storage_bucket).createSignedUrl(document.storage_path, 600);
  return error || !data?.signedUrl ? { error: error?.message || 'No fue posible abrir el documento.' } : { url: data.signedUrl };
}
