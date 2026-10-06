'use server';

import { revalidatePath } from 'next/cache';
import { createHash } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import { hasCapability } from '@/lib/auth/permissions';
import { getPublicAssetUrl, PUBLIC_ASSETS_BUCKET, PRIVATE_DOCUMENTS_BUCKET } from '@/lib/supabase/storage';
import { MAX_DOCUMENT_SIZE_BYTES, MAX_DOCUMENT_SIZE_LABEL } from '@/lib/storage/document-limits';

const DOCUMENT_MANAGER_ROLES = [
  'super_admin',
  'master_broker_admin',
  'master_broker_operations',
  'agency_admin',
  'agency_support',
  'developer_admin',
] as const;

const DOCUMENT_CATEGORIES = ['commercial', 'legal', 'technical', 'banking'] as const;
const DOCUMENT_VISIBILITIES = ['public', 'authorized', 'private'] as const;
const DOCUMENT_STATUSES = ['draft', 'review', 'approved', 'published'] as const;

export type DocumentCategory = typeof DOCUMENT_CATEGORIES[number];
export type DocumentVisibility = typeof DOCUMENT_VISIBILITIES[number];
export type DocumentStatus = typeof DOCUMENT_STATUSES[number];

const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
]);

export type UploadResult = { success?: boolean; error?: string };

export type DocumentVersionItem = {
  id: number;
  versionNumber: number;
  storageBucket: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number | null;
  checksumSha256: string | null;
  createdBy: string | null;
  publishedAt: string | null;
  createdAt: string;
};

// Multi-tenant project access verification
async function verifyProjectDocumentAccess(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  currentUser: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>,
  projectId: number
) {
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, slug, organization_id, organization:organizations!projects_organization_id_fkey(slug)')
    .eq('id', projectId)
    .maybeSingle();

  if (projectError || !project) {
    return { error: projectError?.message || 'Proyecto no encontrado.' };
  }

  if (currentUser.role === 'super_admin') {
    return { project };
  }

  // Direct tenant ownership
  if (project.organization_id === currentUser.organization.id) {
    return { project };
  }

  // Active alliance in organization_relationships
  const { data: relationship } = await supabase
    .from('organization_relationships')
    .select('id')
    .eq('status', 'active')
    .or(
      `and(source_organization_id.eq.${currentUser.organization.id},target_organization_id.eq.${project.organization_id}),and(source_organization_id.eq.${project.organization_id},target_organization_id.eq.${currentUser.organization.id})`
    )
    .maybeSingle();

  if (relationship) {
    return { project };
  }

  return { error: 'No tienes autorización para administrar documentos de este proyecto.' };
}

export async function uploadProjectDocumentAction(
  _prev: UploadResult | null,
  formData: FormData
): Promise<UploadResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser || !hasCapability(currentUser.role, 'manage_project_documents')) {
    return { error: 'No tienes permiso para subir documentos de proyecto.' };
  }

  const projectId = Number(formData.get('projectId'));
  const projectSlug = String(formData.get('projectSlug') || '');
  const title = String(formData.get('title') || '').trim();
  const category = String(formData.get('category') || 'commercial') as DocumentCategory;
  const visibility = String(formData.get('visibility') || 'authorized') as DocumentVisibility;
  const status = String(formData.get('status') || 'review') as DocumentStatus;
  const file = formData.get('file') as File | null;

  if (!projectId || !title || !file || file.size === 0) {
    return { error: 'Selecciona un archivo y escribe un título.' };
  }
  if (!DOCUMENT_CATEGORIES.includes(category)) {
    return { error: 'La categoría seleccionada no es válida.' };
  }
  if (!DOCUMENT_VISIBILITIES.includes(visibility)) {
    return { error: 'La visibilidad seleccionada no es válida.' };
  }
  if (!DOCUMENT_STATUSES.includes(status)) {
    return { error: 'El estado editorial seleccionado no es válido.' };
  }
  if (visibility === 'public' && status !== 'published') {
    return { error: 'Un recurso público debe tener estado Publicado tras aprobación comercial.' };
  }
  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    return { error: `El archivo supera el límite de ${MAX_DOCUMENT_SIZE_LABEL}.` };
  }
  if (!ALLOWED_DOCUMENT_MIME_TYPES.has(file.type)) {
    return { error: 'Formato no permitido. Sube PDF, Office, imagen JPG/PNG/WEBP o video MP4.' };
  }

  const supabase = await createClient();
  const accessCheck = await verifyProjectDocumentAccess(supabase, currentUser, projectId);
  if (accessCheck.error || !accessCheck.project) {
    return { error: accessCheck.error || 'Acceso denegado.' };
  }

  const project = accessCheck.project;
  const orgSlug = (project.organization as unknown as { slug: string } | null)?.slug || 'ob-brokers';

  const { data: existingDoc } = await supabase
    .from('project_documents')
    .select('id')
    .eq('project_id', projectId)
    .eq('title', title)
    .maybeSingle();

  let documentId = existingDoc?.id as number | undefined;
  if (!documentId) {
    const { data: newDoc, error: docError } = await supabase
      .from('project_documents')
      .insert({
        organization_id: project.organization_id,
        project_id: projectId,
        title,
        category,
        visibility,
        status,
      })
      .select('id')
      .single();
    if (docError || !newDoc) return { error: docError?.message || 'No fue posible crear el documento.' };
    documentId = newDoc.id;
  }

  const { data: lastVersion } = await supabase
    .from('document_versions')
    .select('version_number')
    .eq('document_id', documentId)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextVersion = (lastVersion?.version_number ?? 0) + 1;

  const extension = file.name.split('.').pop()?.toLowerCase() || 'pdf';
  // Public files reside in public-assets, authorized/private in private-documents
  const targetBucket = visibility === 'public' ? PUBLIC_ASSETS_BUCKET : PRIVATE_DOCUMENTS_BUCKET;
  const path = `${orgSlug}/projects/${projectId}/${documentId}/v${nextVersion}.${extension}`;
  const arrayBuffer = await file.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);
  const checksum = createHash('sha256').update(fileBuffer).digest('hex');

  const { error: uploadError } = await supabase.storage
    .from(targetBucket)
    .upload(path, fileBuffer, { contentType: file.type, upsert: false });
  if (uploadError) return { error: uploadError.message };

  const isApproved = status === 'approved' || status === 'published';
  const { error: versionError } = await supabase.from('document_versions').insert({
    document_id: documentId,
    version_number: nextVersion,
    storage_bucket: targetBucket,
    storage_path: path,
    mime_type: file.type || 'application/octet-stream',
    size_bytes: file.size,
    checksum_sha256: checksum,
    created_by: currentUser.id,
    published_at: isApproved ? new Date().toISOString() : null,
  });
  if (versionError) return { error: versionError.message };

  await supabase
    .from('project_documents')
    .update({ category, visibility, status, updated_at: new Date().toISOString() })
    .eq('id', documentId);

  const effectiveSlug = projectSlug || project.slug;
  revalidatePath(`/portal/projects/${effectiveSlug}`);
  revalidatePath(`/proyectos/${effectiveSlug}`);
  revalidatePath('/portal/admin/projects');
  return { success: true };
}

export async function updateProjectDocumentAction(payload: {
  documentId: number;
  projectId: number;
  projectSlug: string;
  title: string;
  category: DocumentCategory;
  visibility: DocumentVisibility;
  status: DocumentStatus;
}): Promise<{ success?: boolean; error?: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser || !hasCapability(currentUser.role, 'manage_project_documents')) {
    return { error: 'No tienes permiso para actualizar este documento.' };
  }

  const title = payload.title.trim();
  if (!title) {
    return { error: 'El título no puede estar vacío.' };
  }
  if (!DOCUMENT_CATEGORIES.includes(payload.category)) {
    return { error: 'Categoría no válida.' };
  }
  if (!DOCUMENT_VISIBILITIES.includes(payload.visibility)) {
    return { error: 'Visibilidad no válida.' };
  }
  if (!DOCUMENT_STATUSES.includes(payload.status)) {
    return { error: 'Estado editorial no válido.' };
  }
  if (payload.visibility === 'public' && payload.status !== 'published') {
    return { error: 'Un recurso público debe tener estado Publicado.' };
  }

  const supabase = await createClient();
  const accessCheck = await verifyProjectDocumentAccess(supabase, currentUser, payload.projectId);
  if (accessCheck.error) {
    return { error: accessCheck.error };
  }

  const { error: updateError } = await supabase
    .from('project_documents')
    .update({
      title,
      category: payload.category,
      visibility: payload.visibility,
      status: payload.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', payload.documentId)
    .eq('project_id', payload.projectId);

  if (updateError) {
    return { error: updateError.message };
  }

  // If approved or published, mark published_at on latest version if currently unset
  if (payload.status === 'approved' || payload.status === 'published') {
    const { data: latestVersion } = await supabase
      .from('document_versions')
      .select('id, published_at')
      .eq('document_id', payload.documentId)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestVersion && !latestVersion.published_at) {
      await supabase
        .from('document_versions')
        .update({ published_at: new Date().toISOString() })
        .eq('id', latestVersion.id);
    }
  }

  revalidatePath(`/portal/projects/${payload.projectSlug}`);
  revalidatePath(`/proyectos/${payload.projectSlug}`);
  revalidatePath('/portal/admin/projects');
  return { success: true };
}

export async function deleteProjectDocumentAction(payload: {
  documentId: number;
  projectId: number;
  projectSlug: string;
}): Promise<{ success?: boolean; error?: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser || !hasCapability(currentUser.role, 'manage_project_documents')) {
    return { error: 'No tienes permiso para eliminar este documento.' };
  }

  const supabase = await createClient();
  const accessCheck = await verifyProjectDocumentAccess(supabase, currentUser, payload.projectId);
  if (accessCheck.error) {
    return { error: accessCheck.error };
  }

  // Legal and commercial evidence is retained. Removing it from operational
  // views means archiving the record, never deleting its versions or storage.
  const { error: archiveError } = await supabase
    .from('project_documents')
    .update({ status: 'archived', visibility: 'private', updated_at: new Date().toISOString() })
    .eq('id', payload.documentId)
    .eq('project_id', payload.projectId)
    .neq('status', 'archived');

  if (archiveError) {
    return { error: archiveError.message };
  }

  revalidatePath(`/portal/projects/${payload.projectSlug}`);
  revalidatePath(`/proyectos/${payload.projectSlug}`);
  revalidatePath('/portal/admin/projects');
  return { success: true };
}

export async function getDocumentVersionsAction(
  documentId: number
): Promise<{ versions?: DocumentVersionItem[]; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('document_versions')
    .select('id, version_number, storage_bucket, storage_path, mime_type, size_bytes, checksum_sha256, created_by, published_at, created_at')
    .eq('document_id', documentId)
    .order('version_number', { ascending: false });

  if (error) {
    return { error: error.message };
  }

  const versions: DocumentVersionItem[] = (data || []).map((v) => ({
    id: v.id,
    versionNumber: v.version_number,
    storageBucket: v.storage_bucket,
    storagePath: v.storage_path,
    mimeType: v.mime_type,
    sizeBytes: v.size_bytes,
    checksumSha256: v.checksum_sha256,
    createdBy: v.created_by,
    publishedAt: v.published_at,
    createdAt: v.created_at,
  }));

  return { versions };
}

/**
 * RLS on `document_versions` (document_versions_org_select / _access_select)
 * enforces whether the current session may see this row.
 */
export async function getSignedProjectDocumentUrlAction(
  documentVersionId: number
): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const { data: version, error: versionError } = await supabase
    .from('document_versions')
    .select('storage_bucket, storage_path')
    .eq('id', documentVersionId)
    .maybeSingle();

  if (versionError) return { error: versionError.message };
  if (!version) return { error: 'No tienes acceso a este documento.' };

  if (version.storage_bucket === PUBLIC_ASSETS_BUCKET) {
    return { url: getPublicAssetUrl(version.storage_path) };
  }

  const { data, error } = await supabase.storage
    .from(version.storage_bucket)
    .createSignedUrl(version.storage_path, 300);

  if (error || !data) return { error: error?.message || 'No fue posible generar el enlace.' };
  return { url: data.signedUrl };
}

/**
 * Public document delivery action: verifies that the document is public and published,
 * then returns a direct public URL or signed URL.
 */
export async function getPublicProjectDocumentUrlAction(
  documentVersionId: number
): Promise<{ url?: string; error?: string }> {
  const supabase = await createClient();
  const { data: version, error: versionError } = await supabase
    .from('document_versions')
    .select('storage_bucket, storage_path, document:project_documents(visibility, status)')
    .eq('id', documentVersionId)
    .maybeSingle();

  if (versionError) return { error: versionError.message };
  if (!version) return { error: 'Documento no encontrado.' };

  const doc = version.document as unknown as { visibility: string; status: string } | null;
  if (!doc || doc.visibility !== 'public' || !['approved', 'published'].includes(doc.status)) {
    return { error: 'Este documento no está disponible públicamente.' };
  }

  if (version.storage_bucket === PUBLIC_ASSETS_BUCKET) {
    return { url: getPublicAssetUrl(version.storage_path) };
  }

  const { data, error } = await supabase.storage
    .from(version.storage_bucket)
    .createSignedUrl(version.storage_path, 300);

  if (error || !data) return { error: error?.message || 'No fue posible generar el enlace.' };
  return { url: data.signedUrl };
}
