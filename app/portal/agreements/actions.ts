'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { MAX_DOCUMENT_SIZE_BYTES, MAX_DOCUMENT_SIZE_LABEL } from '@/lib/storage/document-limits';
import { getCurrentUser } from '@/lib/auth/get-user';
import { hasCapability } from '@/lib/auth/permissions';
import { generateAgreementPdf, stampSignatureAndGenerateAuditPdf, type CommissionMilestoneForPdf } from '@/lib/signatures/pdf-stamp';
import { getProjectCommissionMilestones } from '@/lib/data/commission-milestones';
import { getAgreementDetail, getAgreementDetailByCode, getOrganizationAgreementSettings, listOrganizationBrokerMembers } from '@/lib/data/agreements';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendSignedAgreementEmail } from '@/lib/email/mailer';

export async function getBrokerOrgMembersAction(organizationId: number) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return [];
  return listOrganizationBrokerMembers(organizationId);
}

type ActionResult = { success?: boolean; error?: string; agreementId?: number; agreementPublicCode?: string };

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

async function requestIp(): Promise<string | null> {
  const hdrs = await headers();
  const forwarded = hdrs.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return hdrs.get('x-real-ip');
}

type LegalOrgRow = { id: number; name: string; slug: string; legal_name: string | null; tax_id: string | null; legal_address: string | null };

const agreementDocumentLabels: Record<string, string> = { rnc: 'RNC', mercantile_registry: 'Registro mercantil', tax_certificate: 'Certificación fiscal', legal_representative_id: 'Documento del representante', banking: 'Documento bancario', license: 'Licencia', id_card: 'Documento de identidad', insurance: 'Seguro', other: 'Documento adicional' };

async function missingAgreementDocuments(agreement: Awaited<ReturnType<typeof getAgreementDetail>>) {
  if (!agreement) return [];
  const supabase = await createClient();
  const [{ data: requirements }, { data: documents }] = await Promise.all([
    (supabase).from('agreement_document_requirements').select('document_type, label').eq('master_broker_organization_id', agreement.masterBrokerOrg.id).or(`project_id.is.null,project_id.eq.${agreement.project?.id ?? -1}`).eq('is_required', true),
    (supabase).from('organization_documents').select('document_type, status, expires_at').eq('organization_id', agreement.brokerOrg.id),
  ]);
  const today = new Date().toISOString().slice(0, 10);
  return ((requirements || []) as Array<{ document_type: string; label: string | null }>).filter((requirement) => !((documents || []) as Array<{ document_type: string; status: string; expires_at: string | null }>).some((document) => document.document_type === requirement.document_type && document.status === 'approved' && (!document.expires_at || document.expires_at >= today))).map((requirement) => requirement.label || agreementDocumentLabels[requirement.document_type] || requirement.document_type);
}

async function createAgreementRecord(params: {
  masterBrokerOrgId: number;
  masterBrokerSlug: string;
  brokerOrgId: number;
  brokerOrgName: string;
  brokerOrgTaxId: string | null;
  brokerOrgAddress: string | null;
  signerMembershipId: number;
  signerName: string;
  signerEmail: string;
  signerIdNumber: string | null;
  kind: 'general' | 'project_specific';
  projectId: number | null;
  validMonths: number;
  commissionRate: number | null;
  commissionTerms: string | null;
  masterBrokerRepName: string | null;
  masterBrokerRepPosition: string | null;
  masterBrokerRepId: string | null;
  masterBrokerRepEmail: string | null;
  createdBy: string;
}): Promise<ActionResult> {
  const supabase = await createClient();

  // Check first so the unique partial index (one active agreement per scope)
  // never surfaces as a raw Postgres constraint error to the user.
  let existingQuery = supabase
    .from('agreements')
    .select('id, status')
    .eq('broker_organization_id', params.brokerOrgId)
    .eq('kind', params.kind)
    .in('status', ['draft', 'pending_signature', 'signed']);
  if (params.kind === 'project_specific' && params.projectId !== null) {
    existingQuery = existingQuery.eq('project_id', params.projectId);
  } else {
    existingQuery = existingQuery.eq('master_broker_organization_id', params.masterBrokerOrgId);
  }
  const { data: existing } = await existingQuery.maybeSingle();
  if (existing) {
    const statusLabel = existing.status === 'signed' ? 'un acuerdo vigente' : 'un acuerdo pendiente de firma';
    return { error: `${params.brokerOrgName} ya tiene ${statusLabel} en este alcance. Renuévalo desde su ficha en vez de crear uno nuevo.`, agreementId: existing.id };
  }

  // Legal identity for both parties + (if project-specific) the developer.
  const { data: masterBrokerOrg } = await supabase
    .from('organizations')
    .select('id, name, slug, legal_name, tax_id, legal_address')
    .eq('id', params.masterBrokerOrgId)
    .maybeSingle<LegalOrgRow>();

  let projectRow: { name: string; location: string | null; developer_organization_id: number | null } | null = null;
  let developerOrg: LegalOrgRow | null = null;
  if (params.projectId) {
    const { data } = await supabase
      .from('projects')
      .select('name, location, developer_organization_id')
      .eq('id', params.projectId)
      .maybeSingle();
    projectRow = data ?? null;
    if (projectRow?.developer_organization_id) {
      const { data: dev } = await supabase
        .from('organizations')
        .select('id, name, slug, legal_name, tax_id, legal_address')
        .eq('id', projectRow.developer_organization_id)
        .maybeSingle<LegalOrgRow>();
      developerOrg = dev ?? null;
    }
  }

  const { data: brokerOrgBefore } = await supabase
    .from('organizations')
    .select('id, name, slug, legal_name, tax_id, legal_address')
    .eq('id', params.brokerOrgId)
    .maybeSingle<LegalOrgRow>();

  // Broker org legal fields are stable facts (RNC, domicile) — persist them
  // once if this is the first agreement that supplied a value the org didn't
  // already have on file, so future agreements with the same broker
  // organization pre-fill instead of asking again.
  const brokerOrgUpdate: { tax_id?: string; legal_address?: string } = {};
  if (params.brokerOrgTaxId && !brokerOrgBefore?.tax_id) brokerOrgUpdate.tax_id = params.brokerOrgTaxId;
  if (params.brokerOrgAddress && !brokerOrgBefore?.legal_address) brokerOrgUpdate.legal_address = params.brokerOrgAddress;
  if (Object.keys(brokerOrgUpdate).length > 0) {
    await supabase.from('organizations').update(brokerOrgUpdate).eq('id', params.brokerOrgId);
  }
  const brokerOrg: LegalOrgRow | null = brokerOrgBefore ? { ...brokerOrgBefore, ...brokerOrgUpdate } : null;

  const { data: agreement, error: agreementError } = await supabase
    .from('agreements')
    .insert({
      master_broker_organization_id: params.masterBrokerOrgId,
      broker_organization_id: params.brokerOrgId,
      project_id: params.projectId,
      kind: params.kind,
      signer_membership_id: params.signerMembershipId,
      valid_months: params.validMonths,
      status: 'pending_signature',
      created_by: params.createdBy,
      commission_rate: params.commissionRate,
      commission_terms: params.commissionTerms,
      master_broker_rep_name: params.masterBrokerRepName,
      master_broker_rep_position: params.masterBrokerRepPosition,
      master_broker_rep_id: params.masterBrokerRepId,
      master_broker_rep_email: params.masterBrokerRepEmail,
    })
    .select('id, public_code')
    .single();

  if (agreementError || !agreement) {
    const friendly = agreementError?.code === '23505'
      ? `${params.brokerOrgName} ya tiene un acuerdo activo en este alcance. Renuévalo en vez de crear uno nuevo.`
      : agreementError?.message || 'No fue posible crear el acuerdo.';
    return { error: friendly };
  }

  let commissionMilestones: CommissionMilestoneForPdf[] = [];
  if (params.projectId) {
    try {
      const milestones = await getProjectCommissionMilestones(params.projectId);
      commissionMilestones = milestones.map((m) => ({
        commissionPct: m.commissionPct,
        triggerType: m.triggerType,
        triggerValue: m.triggerValue,
        description: m.description,
      }));
    } catch {}
  }

  const { bytes, signatureField } = await generateAgreementPdf({
    masterBroker: {
      legalName: masterBrokerOrg?.legal_name || masterBrokerOrg?.name || '',
      taxId: masterBrokerOrg?.tax_id ?? null,
      address: masterBrokerOrg?.legal_address ?? null,
      repName: params.masterBrokerRepName,
      repPosition: params.masterBrokerRepPosition,
      repId: params.masterBrokerRepId,
      repEmail: params.masterBrokerRepEmail,
    },
    brokerOrg: {
      legalName: brokerOrg?.legal_name || params.brokerOrgName,
      taxId: brokerOrg?.tax_id ?? params.brokerOrgTaxId,
      address: brokerOrg?.legal_address ?? params.brokerOrgAddress,
    },
    signerName: params.signerName,
    signerIdNumber: params.signerIdNumber,
    project: projectRow ? { name: projectRow.name, location: projectRow.location, developerName: developerOrg?.name ?? null } : null,
    developer: developerOrg ? { legalName: developerOrg.legal_name || developerOrg.name, taxId: developerOrg.tax_id, address: developerOrg.legal_address } : null,
    commissionRate: params.commissionRate,
    commissionTerms: params.commissionTerms,
    commissionMilestones,
    validMonths: params.validMonths,
    kind: params.kind,
  });

  const templatePath = `${params.masterBrokerSlug}/agreements/${agreement.id}/template.pdf`;
  const { error: uploadError } = await supabase.storage
    .from('private-documents')
    .upload(templatePath, Buffer.from(bytes), { contentType: 'application/pdf', upsert: true });
  if (uploadError) {
    return { error: `No fue posible subir la plantilla del acuerdo: ${uploadError.message}` };
  }

  const title = params.kind === 'project_specific' && projectRow?.name
    ? `Acuerdo de colaboración · ${projectRow.name}`
    : `Acuerdo de colaboración general · ${params.brokerOrgName}`;

  const { data: signatureDocument, error: sigDocError } = await supabase
    .from('signature_documents')
    .insert({
      organization_id: params.masterBrokerOrgId,
      title,
      status: 'pending',
      source_storage_bucket: 'private-documents',
      source_storage_path: templatePath,
      created_by: params.createdBy,
    })
    .select('id')
    .single();
  if (sigDocError || !signatureDocument) {
    return { error: sigDocError?.message || 'No fue posible preparar el documento de firma.' };
  }

  const discardedToken = crypto.randomBytes(24).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(discardedToken).digest('hex');

  const { data: signer, error: signerError } = await supabase
    .from('signature_signers')
    .insert({
      signature_document_id: signatureDocument.id,
      name: params.signerName,
      email: params.signerEmail,
      id_number: params.signerIdNumber,
      signer_role: 'Broker',
      sign_order: 1,
      status: 'pending',
      signing_token_hash: tokenHash,
    })
    .select('id')
    .single();
  if (signerError || !signer) {
    return { error: signerError?.message || 'No fue posible registrar al firmante.' };
  }

  const { error: fieldError } = await supabase.from('signature_fields').insert({
    signer_id: signer.id,
    page_number: signatureField.pageNumber,
    x: signatureField.x,
    y: signatureField.y,
    width: signatureField.width,
    height: signatureField.height,
    field_type: 'signature',
  });
  if (fieldError) {
    return { error: fieldError.message };
  }

  const { error: linkError } = await supabase
    .from('agreements')
    .update({ signature_document_id: signatureDocument.id })
    .eq('id', agreement.id);
  if (linkError) {
    return { error: linkError.message };
  }

  revalidatePath('/portal/agreements');
  return { success: true, agreementId: agreement.id, agreementPublicCode: agreement.public_code };
}

export async function createAgreementAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: 'Debes iniciar sesión.' };
  if (!hasCapability(currentUser.role, 'manage_agreements')) {
    return { error: 'No tienes permiso para emitir acuerdos.' };
  }

  const brokerOrgId = Number(formData.get('brokerOrganizationId'));
  const signerMembershipId = Number(formData.get('signerMembershipId'));
  const signerName = String(formData.get('signerName') || '').trim();
  const signerEmail = String(formData.get('signerEmail') || '').trim();
  const signerIdNumber = String(formData.get('signerIdNumber') || '').trim() || null;
  const kind = (formData.get('kind') === 'project_specific' ? 'project_specific' : 'general') as 'general' | 'project_specific';
  const projectIdRaw = formData.get('projectId');
  const projectId = projectIdRaw ? Number(projectIdRaw) : null;
  const brokerOrgName = String(formData.get('brokerOrganizationName') || '').trim();
  const brokerOrgTaxId = String(formData.get('brokerOrgTaxId') || '').trim() || null;
  const brokerOrgAddress = String(formData.get('brokerOrgAddress') || '').trim() || null;
  const commissionRateRaw = formData.get('commissionRate');
  const commissionRate = commissionRateRaw ? Number(commissionRateRaw) : null;
  const commissionTerms = String(formData.get('commissionTerms') || '').trim() || null;
  const masterBrokerRepName = String(formData.get('masterBrokerRepName') || '').trim() || null;
  const masterBrokerRepPosition = String(formData.get('masterBrokerRepPosition') || '').trim() || null;
  const masterBrokerRepId = String(formData.get('masterBrokerRepId') || '').trim() || null;
  const masterBrokerRepEmail = String(formData.get('masterBrokerRepEmail') || '').trim() || null;

  if (!brokerOrgId || !signerMembershipId || !signerName || !signerEmail || !brokerOrgName) {
    return { error: 'Faltan datos para crear el acuerdo.' };
  }
  if (kind === 'project_specific' && !projectId) {
    return { error: 'Selecciona un proyecto para un acuerdo específico.' };
  }

  const settings = await getOrganizationAgreementSettings(currentUser.organization.id);
  const validMonthsRaw = formData.get('validMonths');
  const validMonths = validMonthsRaw ? Number(validMonthsRaw) : settings.defaultValidMonths;

  return createAgreementRecord({
    masterBrokerOrgId: currentUser.organization.id,
    masterBrokerSlug: currentUser.organization.slug,
    brokerOrgId,
    brokerOrgName,
    brokerOrgTaxId,
    brokerOrgAddress,
    signerMembershipId,
    signerName,
    signerEmail,
    signerIdNumber,
    kind,
    projectId,
    validMonths,
    commissionRate,
    commissionTerms,
    masterBrokerRepName,
    masterBrokerRepPosition,
    masterBrokerRepId,
    masterBrokerRepEmail,
    createdBy: currentUser.id,
  });
}

export async function renewAgreementAction(agreementId: number): Promise<ActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: 'Debes iniciar sesión.' };

  const previous = await getAgreementDetail(agreementId);
  if (!previous) return { error: 'Acuerdo no encontrado.' };
  if (previous.masterBrokerOrg.id !== currentUser.organization.id) {
    return { error: 'No tienes permiso para renovar este acuerdo.' };
  }
  if (!previous.signer) return { error: 'El acuerdo original no tiene firmante asociado.' };

  const supabase = await createClient();
  if (previous.status === 'signed') {
    const { error: expireError } = await supabase.from('agreements').update({ status: 'expired' }).eq('id', agreementId);
    if (expireError) {
      return { error: `No se pudo marcar el acuerdo anterior como vencido: ${expireError.message}` };
    }
  }

  return createAgreementRecord({
    masterBrokerOrgId: previous.masterBrokerOrg.id,
    masterBrokerSlug: previous.masterBrokerOrg.slug,
    brokerOrgId: previous.brokerOrg.id,
    brokerOrgName: previous.brokerOrg.name,
    brokerOrgTaxId: previous.brokerOrg.tax_id,
    brokerOrgAddress: previous.brokerOrg.legal_address,
    signerMembershipId: previous.signerMembershipId ?? 0,
    signerName: previous.signer.name,
    signerEmail: previous.signer.email,
    signerIdNumber: null,
    kind: previous.kind,
    projectId: previous.project?.id ?? null,
    validMonths: previous.validMonths,
    commissionRate: previous.commissionRate,
    commissionTerms: previous.commissionTerms,
    masterBrokerRepName: previous.masterBrokerRep.name,
    masterBrokerRepPosition: previous.masterBrokerRep.position,
    masterBrokerRepId: previous.masterBrokerRep.idNumber,
    masterBrokerRepEmail: previous.masterBrokerRep.email,
    createdBy: currentUser.id,
  });
}

export async function signAgreementAction(agreementId: number, signatureDataUrl: string): Promise<ActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: 'Debes iniciar sesión.' };
  if (!signatureDataUrl.startsWith('data:image/')) return { error: 'Firma inválida.' };

  const agreement = await getAgreementDetail(agreementId);
  if (!agreement) return { error: 'Acuerdo no encontrado.' };
  if (!agreement.signer || !agreement.field || !agreement.sourceStoragePath) {
    return { error: 'El acuerdo no está listo para firmar todavía.' };
  }
  if (agreement.signer.email.toLowerCase() !== currentUser.email.toLowerCase()) {
    return { error: 'Este acuerdo debe firmarlo el destinatario asignado.' };
  }

  const missingDocuments = await missingAgreementDocuments(agreement);
  if (missingDocuments.length) {
    return { error: `No puedes firmar y sellar hasta actualizar los documentos requeridos: ${missingDocuments.join(', ')}.` };
  }

  const supabase = await createClient();
  const { data: sourceFile, error: downloadError } = await supabase.storage
    .from(agreement.sourceStorageBucket || 'private-documents')
    .download(agreement.sourceStoragePath);
  if (downloadError || !sourceFile) {
    return { error: downloadError?.message || 'No fue posible cargar el documento original.' };
  }
  const sourcePdfBytes = new Uint8Array(await sourceFile.arrayBuffer());

  const signedAt = new Date();
  const signerIp = await requestIp();

  const { bytes: finalBytes, documentHash } = await stampSignatureAndGenerateAuditPdf({
    sourcePdfBytes,
    signatureImageDataUrl: signatureDataUrl,
    field: agreement.field,
    documentTitle: `Acuerdo de colaboración · ${agreement.brokerOrg.name}`,
    documentId: agreement.signatureDocumentId ?? agreement.id,
    signerName: agreement.signer.name,
    signerEmail: agreement.signer.email,
    signerRole: 'Broker',
    signedAt,
    signerIp,
  });

  const finalPath = `${agreement.masterBrokerOrg.slug}/agreements/${agreement.id}/signed-${signedAt.getTime()}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from('private-documents')
    .upload(finalPath, Buffer.from(finalBytes), { contentType: 'application/pdf', upsert: true });
  if (uploadError) return { error: uploadError.message };

  const { error: docUpdateError } = await supabase
    .from('signature_documents')
    .update({ status: 'completed', final_storage_path: finalPath, document_hash: documentHash })
    .eq('id', agreement.signatureDocumentId!);
  if (docUpdateError) return { error: docUpdateError.message };

  const { error: signerUpdateError } = await supabase
    .from('signature_signers')
    .update({ status: 'signed', signed_at: signedAt.toISOString(), signer_ip: signerIp })
    .eq('id', agreement.signer.id);
  if (signerUpdateError) return { error: signerUpdateError.message };

  const expiresAt = addMonths(signedAt, agreement.validMonths);
  const { error: agreementUpdateError } = await supabase
    .from('agreements')
    .update({ status: 'signed', signed_at: signedAt.toISOString(), expires_at: expiresAt.toISOString() })
    .eq('id', agreement.id);
  if (agreementUpdateError) return { error: agreementUpdateError.message };

  const admin = createAdminClient();
  const [{ data: configuredRecipients }, { data: developer }] = await Promise.all([
    (admin).from('agreement_notification_recipients').select('email').eq('organization_id', agreement.masterBrokerOrg.id).eq('is_active', true),
    agreement.project?.id ? admin.from('projects').select('developer:organizations!projects_developer_organization_id_fkey(contact_email)').eq('id', agreement.project.id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const developerEmail = (developer)?.developer?.contact_email || '';
  void sendSignedAgreementEmail({ recipients: ['info@osvaldobello.com', ...((configuredRecipients || []) as Array<{ email: string }>).map((recipient) => recipient.email), developerEmail], agreementTitle: `Acuerdo de colaboración · ${agreement.project?.name || agreement.brokerOrg.name}`, brokerName: agreement.brokerOrg.name, expiresAt, pdf: finalBytes });

  revalidatePath('/portal/agreements');
  revalidatePath(`/portal/agreements/${agreement.publicCode}/sign`);
  return { success: true, agreementId: agreement.id, agreementPublicCode: agreement.publicCode };
}

export async function uploadManualAgreementAction(formData: FormData): Promise<ActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: 'Debes iniciar sesión.' };
  if (!hasCapability(currentUser.role, 'manage_agreements')) {
    return { error: 'No tienes permiso para registrar acuerdos.' };
  }

  const agreementId = Number(formData.get('agreementId'));
  if (!agreementId) return { error: 'Falta el ID del acuerdo.' };

  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) return { error: 'Selecciona un archivo PDF.' };
  if (file.type !== 'application/pdf') return { error: 'El archivo debe ser un PDF.' };
  if (file.size > MAX_DOCUMENT_SIZE_BYTES) return { error: `El archivo no puede superar ${MAX_DOCUMENT_SIZE_LABEL}.` };

  const supabase = await createClient();

  const { data: agreement } = await supabase
    .from('agreements')
    .select('id, master_broker_organization_id, status, public_code')
    .eq('id', agreementId)
    .maybeSingle();
  if (!agreement) return { error: 'Acuerdo no encontrado.' };

  const { data: org } = await supabase
    .from('organizations')
    .select('slug')
    .eq('id', agreement.master_broker_organization_id)
    .maybeSingle();
  const orgSlug = org?.slug || 'unknown';

  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadPath = `${orgSlug}/agreements/${agreement.id}/manual-${Date.now()}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from('private-documents')
    .upload(uploadPath, buffer, { contentType: 'application/pdf', upsert: true });
  if (uploadError) return { error: `Error al subir: ${uploadError.message}` };

  const signedAt = new Date();
  const expiresAtRaw = formData.get('expiresAt');
  const validMonthsRaw = formData.get('validMonths');
  let expiresAt: Date;
  if (expiresAtRaw) {
    expiresAt = new Date(String(expiresAtRaw));
  } else {
    const months = validMonthsRaw ? Number(validMonthsRaw) : 12;
    expiresAt = addMonths(signedAt, months);
  }

  const { error: updateError } = await supabase
    .from('agreements')
    .update({
      status: 'signed',
      is_manual: true,
      manual_upload_path: uploadPath,
      manual_upload_bucket: 'private-documents',
      signed_at: signedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .eq('id', agreement.id);
  if (updateError) return { error: updateError.message };

  revalidatePath('/portal/agreements');
  return { success: true, agreementId: agreement.id, agreementPublicCode: agreement.public_code };
}

export async function getAgreementPdfUrlAction(
  publicCode: string,
  mode: 'view' | 'download' = 'view'
): Promise<{ url?: string; fileName?: string; error?: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: 'Debes iniciar sesión.' };

  const agreement = await getAgreementDetailByCode(publicCode);
  if (!agreement) return { error: 'Acuerdo no encontrado.' };

  const belongsToBrokerOrg = currentUser.organization.id === agreement.brokerOrg.id;
  const belongsToMasterBrokerOrg = currentUser.organization.id === agreement.masterBrokerOrg.id;
  const isSuperAdmin = currentUser.role === 'super_admin' || currentUser.realRole === 'super_admin';

  if (!belongsToBrokerOrg && !belongsToMasterBrokerOrg && !isSuperAdmin) {
    return { error: 'No tienes permisos para ver este acuerdo.' };
  }

  const supabase = await createClient();
  const bucket = agreement.finalStoragePath
    ? 'private-documents'
    : agreement.manualUploadPath
    ? (agreement.manualUploadBucket || 'private-documents')
    : (agreement.sourceStorageBucket || 'private-documents');

  const path = agreement.finalStoragePath || agreement.manualUploadPath || agreement.sourceStoragePath;
  if (!path) {
    return { error: 'El archivo PDF no está disponible todavía.' };
  }

  const projectSlug = agreement.project?.name?.replace(/[^a-zA-Z0-9_-]/g, '_') || 'General';
  const fileName = `Acuerdo_${projectSlug}_${agreement.publicCode}.pdf`;

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(
    path,
    600,
    mode === 'download' ? { download: fileName } : undefined
  );

  if (error || !data?.signedUrl) {
    return { error: error?.message || 'No fue posible generar el enlace al documento.' };
  }

  return { url: data.signedUrl, fileName };
}

