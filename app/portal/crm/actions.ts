'use server';

import { getDemoContactsPersistent, saveDemoContact } from '@/lib/demo/local-crm-store';
import { DEMO_PORTAL_PROJECTS } from '@/lib/demo/projects';
import { updateDemoState } from '@/lib/demo/local-store';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { MAX_DOCUMENT_SIZE_BYTES, MAX_DOCUMENT_SIZE_LABEL } from '@/lib/storage/document-limits';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth/get-user';
import { getMyAgreements } from '@/lib/data/agreements';
import { sendLeadReportEmails, sendOperationalNotificationEmail } from '@/lib/email/mailer';
import { getOperationalRecipientEmails, getProjectNotificationChannels, notifyOperationalInbox } from '@/lib/operations/notifications';

export type ActionResponse = {
  success?: boolean;
  error?: string;
  contactId?: number;
  contactPublicCode?: string;
  contactReference?: string;
  reportId?: number;
  protectionStatus?: 'pending' | 'protected' | 'conflict' | 'released' | 'existing';
  message?: string;
  opportunityId?: number;
  opportunityCode?: string;
};

export async function createLeadAction(formData: FormData): Promise<ActionResponse> {
  if (process.env.NEXT_PUBLIC_APP_SCOPE === 'demo') {
    const name = (formData.get('name') as string)?.trim() || 'Nuevo Lead';
    const email = (formData.get('email') as string)?.trim() || null;
    const phone = (formData.get('phone') as string)?.trim() || '+1 809 000 0000';
    const classification = (formData.get('classification') as string) || 'Inversionista';
    const source = (formData.get('source') as string) || 'Demo Directo';
    const projectName = (formData.get('project') as string) || 'Villas en Punta Cana';
    const budgetMin = Number(formData.get('budgetMin')) || 450000;
    const budgetMax = Number(formData.get('budgetMax')) || 650000;
    const budgetCurrency = String(formData.get('budgetCurrency') || 'USD').trim().toUpperCase();
    const id = Date.now();
    const publicCode = 'CLI-' + Math.floor(1000 + Math.random() * 9000);
    const nameParts = name.split(' ');
    await saveDemoContact({
      id,
      firstName: nameParts[0] || name,
      lastName: nameParts.slice(1).join(' ') || null,
      fullName: name,
      email,
      phone,
      publicCode,
      phoneNormalized: phone.replace(/\D/g, ''),
      phoneLast4: phone.slice(-4),
      country: 'DO',
      preferredLanguage: 'es',
      classification,
      source,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [{ id: 1, name: 'Lead Demo', color: '#2563eb' }],
      primaryOpportunity: {
        id,
        publicCode: 'OPP-' + Math.floor(1000 + Math.random() * 9000),
        stage: 'Nuevo',
        priority: 'Alta',
        budgetMin,
        budgetMax,
        currency: budgetCurrency,
        projectName,
      },
      dnd: { email: false, whatsapp: false, calls: false, sms: false },
    });
    revalidatePath('/portal/clientes');
    revalidatePath('/portal/leads');
    return {
      success: true,
      contactId: id,
      contactPublicCode: publicCode,
      contactReference: publicCode,
      message: 'Lead creado con éxito en el entorno de demostración.',
    };
  }
  const supabase = await createClient();
  const currentUser = await getCurrentUser();

  const name = (formData.get('name') as string)?.trim();
  const email = (formData.get('email') as string)?.trim() || null;
  const phone = (formData.get('phone') as string)?.trim();
  const classification = (formData.get('classification') as string) || 'Inversionista';
  const priority = (formData.get('priority') as string) || 'Media';
  const source = (formData.get('source') as string) || 'Referido';
  const language = (formData.get('language') as string) || 'es';
  const rawTags = (formData.get('tags') as string) || '';
  const projectName = (formData.get('project') as string) || '';
  const budgetMin = Number(formData.get('budgetMin')) || null;
  const budgetMax = Number(formData.get('budgetMax')) || null;
  const budgetCurrency = String(formData.get('budgetCurrency') || 'USD').trim().toUpperCase();
  const objective = (formData.get('objective') as string) || 'Inversión';
  const notes = (formData.get('notes') as string) || '';
  const dndEmail = formData.get('dndEmail') === 'true';
  const dndWhatsapp = formData.get('dndWhatsapp') === 'true';
  const dndCalls = formData.get('dndCalls') === 'true';

  if (!name || !phone) {
    return { error: 'Nombre y teléfono son obligatorios.' };
  }

  if (!/^[A-Z]{3}$/.test(budgetCurrency)) {
    return { error: 'La moneda del presupuesto debe ser un código ISO de tres letras, por ejemplo USD, DOP, EUR o CAD.' };
  }

  const phoneDigits = phone.replace(/\D/g, '');
  const phoneLast4 = phoneDigits.length >= 4 ? phoneDigits.slice(-4) : null;
  const normalizedEmail = email?.toLowerCase() || null;

  const orgId = currentUser?.organization?.id || 1;
  if (!currentUser) return { error: 'Tu sesión expiró. Inicia sesión nuevamente para registrar el lead.' };

  // Split name into first and last name
  const nameParts = name.split(' ');
  const firstName = nameParts[0] || name;
  const lastName = nameParts.slice(1).join(' ') || null;
  const isUuid = (str?: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str || '');
  const validCreatedBy = isUuid(currentUser?.id) ? currentUser?.id : null;

  // Creating a CRM contact never reserves it with a developer. We only avoid
  // accidental duplicates inside the current agency; commercial protection is
  // explicitly requested later from the contact profile.
  const [phoneContactResult, emailContactResult] = await Promise.all([
    phoneDigits.length >= 7
      ? supabase.from('contacts').select('id, public_code').eq('organization_id', orgId).eq('phone_normalized', phoneDigits).is('deleted_at', null).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    normalizedEmail
      ? supabase.from('contacts').select('id, public_code').eq('organization_id', orgId).eq('email', normalizedEmail).is('deleted_at', null).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);
  const existingContact = phoneContactResult.data || emailContactResult.data;
  if (existingContact) {
    return {
      success: true,
      contactId: existingContact.id,
      contactPublicCode: existingContact.public_code,
      contactReference: existingContact.public_code,
      protectionStatus: 'existing',
      message: 'Este cliente ya existe en tu agencia. Se abrió su ficha para continuar el seguimiento.',
    };
  }

  // 1. Insert contact
  const { data: newContact, error: contactError } = await supabase
    .from('contacts')
    .insert({
      organization_id: orgId,
      first_name: firstName,
      last_name: lastName,
      email: normalizedEmail,
      phone: phone,
      phone_normalized: phoneDigits,
      phone_last4: phoneLast4,
      preferred_language: language.startsWith('En') ? 'en' : language.startsWith('Fr') ? 'fr' : 'es',
      classification,
      source,
      created_by: validCreatedBy,
    })
    .select('id, public_code')
    .single();

  if (contactError || !newContact) {
    return { error: contactError?.message || 'Error al guardar el contacto.' };
  }

  const contactId = newContact.id;

  // 2. Find project if selected
  let projectId: number | null = null;
  if (projectName) {
    try {
      const { data: project } = await supabase
        .from('projects')
        .select('id')
        .ilike('name', `%${projectName}%`)
        .limit(1)
        .maybeSingle();
      if (project) projectId = project.id;
    } catch {
      // Ignore lookup error
    }
  }

  // 3. Create opportunity safely
  const priorityMap: Record<string, string> = {
    Alta: 'high',
    Media: 'medium',
    Baja: 'low',
    'Fase cero': 'phase_zero',
  };

  const stageRaw = (formData.get('stage') as string) || 'Nuevo';
  const stageMap: Record<string, string> = {
    Nuevo: 'new',
    Contactado: 'contacted',
    Calificado: 'qualified',
    Propuesta: 'proposal',
    Negociación: 'negotiation',
  };

  const ownerMembershipIdRaw = formData.get('ownerMembershipId') as string;
  let targetMembershipId = currentUser?.membershipId || null;

  if (ownerMembershipIdRaw && !isNaN(Number(ownerMembershipIdRaw))) {
    const candidateId = Number(ownerMembershipIdRaw);
    const { data: validMem } = await supabase
      .from('memberships')
      .select('id')
      .eq('id', candidateId)
      .eq('organization_id', orgId)
      .eq('status', 'active')
      .maybeSingle();

    if (validMem) {
      targetMembershipId = validMem.id;
    }
  }

  let opportunityId: number | null = null;
  {
    const { data: newOpp, error: oppError } = await supabase
      .from('opportunities')
      .insert({
        organization_id: orgId,
        contact_id: contactId,
        owner_membership_id: targetMembershipId,
        stage: stageMap[stageRaw] || 'new',
        priority: priorityMap[priority] || 'medium',
        budget_min: budgetMin,
        budget_max: budgetMax,
        currency: budgetCurrency,
        objective,
      })
      .select('id')
      .maybeSingle();

    if (oppError) {
      console.error('createLeadAction: opportunities insert failed', oppError);
    } else if (newOpp) {
      opportunityId = newOpp.id;
      if (projectId) {
        const { error: oppProjectError } = await supabase.from('opportunity_projects').insert({
          opportunity_id: newOpp.id,
          project_id: projectId,
        });
        if (oppProjectError) {
          console.error('createLeadAction: opportunity_projects insert failed', oppProjectError);
        }
      }
    }
  }

  // 4. Insert initial note if provided
  if (notes.trim()) {
    const { error: noteError } = await supabase.from('notes').insert({
      organization_id: orgId,
      contact_id: contactId,
      opportunity_id: opportunityId,
      body: notes.trim(),
      created_by: validCreatedBy,
    });
    if (noteError) {
      console.error('createLeadAction: notes insert failed', noteError);
    }
  }

  // 5. Handle tags
  if (rawTags.trim()) {
    const tagList = rawTags.split(',').map((t) => t.trim()).filter(Boolean);
    for (const tagName of tagList) {
      const { data: existingTag, error: tagLookupError } = await supabase
        .from('tags')
        .select('id')
        .eq('organization_id', orgId)
        .ilike('name', tagName)
        .maybeSingle();
      if (tagLookupError) {
        console.error('createLeadAction: tags lookup failed', tagLookupError);
        continue;
      }

      let tagId = existingTag?.id;
      if (!tagId) {
        const { data: createdTag, error: tagCreateError } = await supabase
          .from('tags')
          .insert({
            organization_id: orgId,
            name: tagName,
            color: '#2563eb',
          })
          .select('id')
          .maybeSingle();
        if (tagCreateError) {
          console.error('createLeadAction: tags insert failed', tagCreateError);
        }
        tagId = createdTag?.id;
      }

      if (tagId) {
        const { error: contactTagError } = await supabase.from('contact_tags').insert({
          contact_id: contactId,
          tag_id: tagId,
        });
        if (contactTagError) {
          console.error('createLeadAction: contact_tags insert failed', contactTagError);
        }
      }
    }
  }

  // 6. Handle DND preferences
  const dndChannels: { channel: 'email' | 'whatsapp' | 'call'; status: 'granted' | 'denied' }[] = [
    { channel: 'email', status: dndEmail ? 'denied' : 'granted' },
    { channel: 'whatsapp', status: dndWhatsapp ? 'denied' : 'granted' },
    { channel: 'call', status: dndCalls ? 'denied' : 'granted' },
  ];

  for (const item of dndChannels) {
    const { error: consentError } = await supabase.from('consent_preferences').insert({
      organization_id: orgId,
      contact_id: contactId,
      channel: item.channel,
      status: item.status,
      source: 'lead_creation',
    });
    if (consentError) {
      console.error('createLeadAction: consent_preferences insert failed', consentError);
    }
  }

  revalidatePath('/portal/clientes');
  revalidatePath('/portal/leads');
  return {
    success: true,
    contactId,
    contactPublicCode: newContact.public_code,
    contactReference: newContact.public_code,
    message: 'Lead creado. Reporta el cliente a la desarrolladora cuando tengas el contexto comercial y la autorización correspondiente.',
  };
}

export async function addContactNoteAction(contactId: number, body: string): Promise<ActionResponse> {
  if (!body.trim()) return { error: 'El contenido de la nota no puede estar vacío.' };
  if (process.env.NEXT_PUBLIC_APP_SCOPE === 'demo') {
    await updateDemoState((state) => {
      const detail = state.contactDetails[String(contactId)] ??= { notes: [], activities: [] };
      detail.notes.unshift({ id: Date.now(), body: body.trim(), createdAt: new Date().toISOString(), createdByName: 'Soporte OB Brokers' });
    });
    revalidatePath('/portal/clientes', 'layout');
    return { success: true };
  }

  const supabase = await createClient();
  const currentUser = await getCurrentUser();
  const orgId = currentUser?.organization?.id || 1;

  const { error } = await supabase.from('notes').insert({
    organization_id: orgId,
    contact_id: contactId,
    body: body.trim(),
    created_by: currentUser?.id,
  });

  if (error) return { error: error.message };

  revalidatePath('/portal/clientes', 'layout');
  return { success: true };
}

export async function addContactActivityAction(
  contactId: number,
  kind: 'call' | 'email' | 'whatsapp' | 'meeting' | 'visit' | 'task',
  subject: string,
  details?: string,
  dueAt?: string
): Promise<ActionResponse> {
  if (!subject.trim()) return { error: 'El asunto es obligatorio.' };
  if (process.env.NEXT_PUBLIC_APP_SCOPE === 'demo') {
    await updateDemoState((state) => {
      const detail = state.contactDetails[String(contactId)] ??= { notes: [], activities: [] };
      detail.activities.unshift({ id: Date.now(), kind, subject: subject.trim(), details: details?.trim() || null, dueAt: dueAt || null, completedAt: kind === 'task' ? null : new Date().toISOString(), createdAt: new Date().toISOString() });
    });
    revalidatePath('/portal/clientes', 'layout');
    return { success: true };
  }

  const supabase = await createClient();
  const currentUser = await getCurrentUser();
  const orgId = currentUser?.organization?.id || 1;

  const { error } = await supabase.from('activities').insert({
    organization_id: orgId,
    contact_id: contactId,
    kind,
    subject: subject.trim(),
    details: details?.trim() || null,
    due_at: dueAt || null,
    completed_at: kind === 'task' ? null : new Date().toISOString(),
    created_by: currentUser?.id,
  });

  if (error) return { error: error.message };

  revalidatePath('/portal/clientes', 'layout');
  return { success: true };
}

export async function toggleTaskCompleteAction(activityId: number, contactId: number, completed: boolean): Promise<ActionResponse> {
  if (process.env.NEXT_PUBLIC_APP_SCOPE === 'demo') {
    await updateDemoState((state) => {
      const activity = state.contactDetails[String(contactId)]?.activities.find((entry) => entry.id === activityId);
      if (activity) activity.completedAt = completed ? new Date().toISOString() : null;
    });
    revalidatePath('/portal/clientes', 'layout');
    return { success: true };
  }
  const supabase = await createClient();

  const { error } = await supabase
    .from('activities')
    .update({ completed_at: completed ? new Date().toISOString() : null })
    .eq('id', activityId);

  if (error) return { error: error.message };

  revalidatePath('/portal/clientes', 'layout');
  return { success: true };
}

export async function updateOpportunityStageAction(opportunityId: number, stage: string, contactId?: number): Promise<ActionResponse> {
  if (stage === 'won') {
    return { error: 'El cierre ganado se confirma desde el expediente de venta, después de validar contrato y el pago inicial.' };
  }
  if (process.env.NEXT_PUBLIC_APP_SCOPE === 'demo') {
    const contacts = await getDemoContactsPersistent();
    const contact = contacts.find((entry) => entry.id === contactId || entry.primaryOpportunity?.id === opportunityId);
    if (!contact) return { error: 'Negociación demo no encontrada.' };
    await updateDemoState((state) => {
      const detail = state.contactDetails[String(contact.id)] ??= { notes: [], activities: [] };
      detail.stage = stage;
    });
    revalidatePath('/portal/leads');
    revalidatePath('/portal/clientes');
    return { success: true };
  }
  const supabase = await createClient();

  const { error } = await supabase
    .from('opportunities')
    .update({ stage, closed_reason: stage === 'won' ? 'Venta formalizada' : stage === 'lost' ? 'Descartado' : null })
    .eq('id', opportunityId);

  if (error) return { error: error.message };

  revalidatePath('/portal/leads');
  revalidatePath('/portal/clientes');
  if (contactId) revalidatePath('/portal/clientes', 'layout');
  return { success: true };
}

/** Superadministration resolves a cross-agency lead claim with an auditable reason. */
export async function submitLeadReportAction(
  contactId: number,
  projectId: number,
  workSummary: string,
  acknowledged: boolean
): Promise<ActionResponse> {
  if (!acknowledged) return { error: 'Debes confirmar que la información es veraz y que tienes una gestión comercial activa.' };
  if (!Number.isInteger(contactId) || !Number.isInteger(projectId)) return { error: 'Selecciona un desarrollo válido.' };
  const summary = workSummary.trim();
  if (summary.length < 30) return { error: 'Explica el trabajo comercial realizado en al menos 30 caracteres.' };

  const supabase = await createClient();
  const currentUser = await getCurrentUser(supabase);
  if (!currentUser?.membershipId) return { error: 'Tu sesión expiró. Inicia sesión nuevamente.' };
  const organizationId = currentUser.organization.id;

  const [{ data: contact }, agreements, { data: project }, { data: projectAccess }] = await Promise.all([
    supabase.from('contacts').select('id, public_code, first_name, last_name, email, phone_normalized').eq('id', contactId).is('deleted_at', null).maybeSingle(),
    getMyAgreements(),
    supabase.from('projects').select('id, name, developer_organization_id').eq('id', projectId).maybeSingle(),
    supabase.from('project_access').select('id').eq('grantee_membership_id', currentUser.membershipId).eq('project_id', projectId).maybeSingle(),
  ]);
  if (!contact || !project) return { error: 'No se encontró el cliente o el desarrollo solicitado.' };

  const activeAgreement = agreements.find((agreement) => {
    const valid = agreement.status === 'signed' && (!agreement.expiresAt || new Date(agreement.expiresAt).getTime() > Date.now());
    return valid && (agreement.kind === 'general' || agreement.project?.id === projectId);
  });
  if (!activeAgreement && !projectAccess) return { error: 'No tienes un acuerdo activo ni acceso asignado que permita reportar este cliente para ese desarrollo.' };

  const { data: activeReport } = await supabase
    .from('lead_reports')
    .select('id, protection_status, protected_until')
    .eq('organization_id', organizationId)
    .eq('contact_id', contactId)
    .eq('project_id', projectId)
    .in('protection_status', ['pending', 'conflict', 'protected'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (activeReport && (activeReport.protection_status !== 'protected' || !activeReport.protected_until || new Date(activeReport.protected_until).getTime() > Date.now())) {
    return { error: 'Ya existe un reporte activo o en revisión para este desarrollo. Puedes consultarlo en la ficha.' };
  }

  const admin = createAdminClient();
  const identities = [
    ...(contact.phone_normalized && contact.phone_normalized.length >= 7 ? [{ identity_type: 'phone', normalized_value: contact.phone_normalized }] : []),
    ...(contact.email ? [{ identity_type: 'email', normalized_value: contact.email.toLowerCase() }] : []),
  ];
  const claimMatches = identities.length
    ? await (admin.from('lead_identity_claims')).select('first_organization_id').eq('project_id', projectId).in('normalized_value', identities.map((item) => item.normalized_value))
    : { data: [] as { first_organization_id: number }[] };
  const hasExternalClaim = ((claimMatches.data || []) as Array<{ first_organization_id: number }>).some((claim) => claim.first_organization_id !== organizationId);
  const status = hasExternalClaim ? 'conflict' : 'pending';

  const { data: report, error } = await (supabase.from('lead_reports')).insert({
    organization_id: organizationId,
    contact_id: contactId,
    project_id: projectId,
    reported_by_membership_id: currentUser.membershipId,
    protection_status: status,
    work_summary: summary,
    acknowledgement_at: new Date().toISOString(),
  }).select('id').single();
  if (error || !report) return { error: error?.message || 'No fue posible registrar la solicitud.' };

  await admin.from('notifications').insert({
    organization_id: organizationId,
    membership_id: currentUser.membershipId,
    type: status === 'conflict' ? 'lead_report_conflict' : 'lead_report_submitted',
    title: status === 'conflict' ? 'Reporte con posible conflicto' : 'Reporte enviado para validación',
    body: status === 'conflict'
      ? `El reporte de ${contact.first_name} requiere revisión porque existe una protección previa en este desarrollo.`
      : `El reporte de ${contact.first_name} fue recibido y está pendiente de validación.`,
    link: `/portal/clientes/${contact.public_code}`,
  });
  const masterBrokerId = activeAgreement?.masterBrokerOrg?.id ?? currentUser.organization.id;
  const [{ data: configuredRecipients }, { data: developerOrg }] = await Promise.all([
    (admin).from('report_notification_recipients').select('email').eq('organization_id', masterBrokerId).eq('is_active', true),
    project.developer_organization_id ? admin.from('organizations').select('name, contact_email').eq('id', project.developer_organization_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const reviewerEmails = [...((configuredRecipients || []) as Array<{ email: string }>).map((recipient) => recipient.email), developerOrg?.contact_email || ''];
  const notificationChannels = await getProjectNotificationChannels(projectId);
  const reportTitle = status === 'conflict' ? 'Reporte de cliente con posible conflicto' : 'Nuevo reporte de cliente';
  const reportBody = `${currentUser.displayName || 'Un agente'} reportó a ${contact.first_name} ${contact.last_name || ''} para ${project.name}.`;
  if (notificationChannels?.crmEnabled) await notifyOperationalInbox({ organizationId: masterBrokerId, emails: reviewerEmails, type: status === 'conflict' ? 'lead_report_conflict' : 'lead_report_review_required', title: reportTitle, body: reportBody, link: '/portal/dev' });
  if (notificationChannels?.emailEnabled !== false) void sendLeadReportEmails({
    clientEmail: contact.email,
    clientName: `${contact.first_name} ${contact.last_name || ''}`.trim(),
    projectName: project.name,
    developerName: developerOrg?.name || 'Desarrolladora',
    agencyName: currentUser.organization.name,
    agentName: currentUser.displayName || 'Agente comercial',
    workSummary: summary,
    reviewers: reviewerEmails,
    reviewUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://brokers.osvaldobello.com'}/portal/dev`,
  }).catch((mailError) => console.warn('lead report notification email failed:', mailError));
  await admin.from('audit_events').insert({
    organization_id: organizationId,
    actor_user_id: currentUser.id,
    entity_type: 'lead_report',
    entity_id: String(report.id),
    action: 'lead_report_submitted',
    metadata: { contactId, projectId, agreementId: activeAgreement?.id ?? null, status, workSummaryLength: summary.length },
  });

  revalidatePath('/portal/clientes', 'layout');
  revalidatePath('/portal/dev');
  return { success: true, reportId: report.id, protectionStatus: status, message: status === 'conflict' ? 'El reporte fue enviado y requiere revisión por un posible conflicto.' : 'Reporte enviado. La protección comenzará cuando sea validado.' };
}

export async function uploadLeadReportAttachmentsAction(
  leadReportId: number,
  formData: FormData
): Promise<ActionResponse> {
  const supabase = await createClient();
  const currentUser = await getCurrentUser(supabase);
  if (!currentUser?.membershipId) return { error: 'Sesión expirada.' };

  const files = formData.getAll('files') as File[];
  if (!files.length) return { success: true };
  if (files.reduce((total, file) => total + file.size, 0) > MAX_DOCUMENT_SIZE_BYTES) {
    return { error: `El total de archivos adjuntos no puede superar ${MAX_DOCUMENT_SIZE_LABEL} por envío.` };
  }

  const organizationId = currentUser.organization.id;
  const orgSlug = currentUser.organization.slug || `org_${organizationId}`;

  for (const file of files) {
    if (file.size > MAX_DOCUMENT_SIZE_BYTES) return { error: `${file.name} supera el límite de ${MAX_DOCUMENT_SIZE_LABEL}.` };
    if (!['image/png', 'image/jpeg', 'image/webp', 'application/pdf'].includes(file.type)) {
      return { error: `${file.name}: solo se permiten imágenes (PNG, JPG, WebP) y PDF.` };
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const storagePath = `${orgSlug}/lead-reports/${leadReportId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadErr } = await supabase.storage
      .from('private-documents')
      .upload(storagePath, buffer, { contentType: file.type, upsert: false });
    if (uploadErr) return { error: uploadErr.message };

    const { error: insertErr } = await (supabase).from('lead_report_attachments').insert({
      lead_report_id: leadReportId,
      organization_id: organizationId,
      file_name: file.name,
      storage_path: storagePath,
      mime_type: file.type,
      size_bytes: file.size,
      uploaded_by: currentUser.id,
    });
    if (insertErr) return { error: insertErr.message };
  }

  return { success: true };
}

/** Resolves a submitted report and creates a development-scoped protection. */
export async function resolveLeadConflictAction(
  leadReportId: number,
  decision: 'approve' | 'reject',
  reason: string
): Promise<ActionResponse> {
  const supabase = await createClient();
  const currentUser = await getCurrentUser(supabase);
  const allowedRoles = new Set(['super_admin', 'developer_admin', 'master_broker_admin']);
  if (!currentUser || !allowedRoles.has(currentUser.role)) return { error: 'No tienes permiso para validar reportes de leads.' };
  if (!Number.isInteger(leadReportId) || reason.trim().length < 5) return { error: 'Indica una razón clara para la decisión.' };

  const admin = createAdminClient();
  const { data: report, error: reportError } = await admin
    .from('lead_reports')
    .select('id, contact_id, organization_id, reported_by_membership_id, protection_status, project_id')
    .eq('id', leadReportId)
    .maybeSingle();
  if (reportError || !report) return { error: 'El reporte de lead no está disponible.' };
  if (!['pending', 'conflict'].includes(report.protection_status)) return { error: 'Este reporte ya fue resuelto.' };

  if (decision === 'approve') {
    const { data: contact } = await admin.from('contacts').select('public_code, phone_normalized, email').eq('id', report.contact_id).maybeSingle();
    const values = [
      ...(contact?.phone_normalized && contact.phone_normalized.length >= 7 ? [contact.phone_normalized] : []),
      ...(contact?.email ? [contact.email.toLowerCase()] : []),
    ];
    if (report.project_id && values.length) {
      const { data: existingClaims } = await (admin.from('lead_identity_claims')).select('first_organization_id').eq('project_id', report.project_id).in('normalized_value', values);
      if (((existingClaims || []) as Array<{ first_organization_id: number }>).some((claim) => claim.first_organization_id !== report.organization_id)) {
        await admin.from('lead_reports').update({ protection_status: 'conflict' }).eq('id', report.id);
        return { error: 'Otro reporte ya tiene protección vigente en este desarrollo. El reporte fue marcado como conflicto.' };
      }
      const identities = [
        ...(contact?.phone_normalized && contact.phone_normalized.length >= 7 ? [{ identity_type: 'phone', normalized_value: contact.phone_normalized }] : []),
        ...(contact?.email ? [{ identity_type: 'email', normalized_value: contact.email.toLowerCase() }] : []),
      ];
      for (const identity of identities) {
        await (admin.from('lead_identity_claims')).upsert({
          ...identity,
          project_id: report.project_id,
          canonical_contact_id: report.contact_id,
          first_report_id: report.id,
          first_organization_id: report.organization_id,
        }, { onConflict: 'project_id,identity_type,normalized_value', ignoreDuplicates: true });
      }
    }
  }

  const status = decision === 'approve' ? 'protected' : 'released';
  const { error: updateError } = await (admin
    .from('lead_reports'))
    .update({
      protection_status: status,
      protected_until: decision === 'approve' ? new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString() : null,
      reviewed_at: new Date().toISOString(),
      reviewed_by_user_id: currentUser.id,
      review_reason: reason.trim(),
    })
    .eq('id', leadReportId)
    .in('protection_status', ['pending', 'conflict']);
  if (updateError) return { error: 'No se pudo guardar la resolución.' };

  if (report.reported_by_membership_id) {
    const { data: contactForLink } = await admin.from('contacts').select('public_code').eq('id', report.contact_id).maybeSingle();
    await admin.from('notifications').insert({
      organization_id: report.organization_id,
      membership_id: report.reported_by_membership_id,
      type: decision === 'approve' ? 'lead_report_approved' : 'lead_report_rejected',
      title: decision === 'approve' ? 'Lead aprobado' : 'Lead rechazado',
      body: reason.trim(),
      link: `/portal/clientes/${contactForLink?.public_code || report.contact_id}`,
    });
  }

  await admin.from('audit_events').insert({
    organization_id: report.organization_id,
    actor_user_id: currentUser.id,
    entity_type: 'lead_report',
    entity_id: String(report.id),
    action: decision === 'approve' ? 'lead_report_approved' : 'lead_report_rejected',
    metadata: { reason: reason.trim(), resolvedByMembershipId: currentUser.membershipId },
  });

  revalidatePath('/portal/clientes');
  revalidatePath('/portal/leads');
  return { success: true, contactId: report.contact_id, protectionStatus: status };
}

export async function createOpportunityAction(
  contactId: number,
  projectId?: number
): Promise<ActionResponse> {
  if (process.env.NEXT_PUBLIC_APP_SCOPE === 'demo') {
    const contacts = await getDemoContactsPersistent();
    const contact = contacts.find((entry) => entry.id === contactId);
    if (!contact) return { error: 'Contacto no encontrado en los datos locales del demo.' };
    if (projectId && !DEMO_PORTAL_PROJECTS.some((project) => project.id === projectId)) return { error: 'El proyecto seleccionado no está disponible en el demo.' };

    const opportunityId = Date.now();
    const opportunityCode = `OPP-${opportunityId}`;
    return { success: true, message: 'Negociación creada en este navegador del demo.', opportunityId, opportunityCode };
  }

  const supabase = await createClient();
  const currentUser = await getCurrentUser(supabase);
  if (!currentUser?.membershipId) return { error: 'Tu sesión expiró.' };

  if (projectId) {
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .maybeSingle();
    if (!project) return { error: 'No tienes acceso al proyecto seleccionado.' };
  }

  const { data: contact } = await supabase
    .from('contacts')
    .select('id')
    .eq('id', contactId)
    .is('deleted_at', null)
    .maybeSingle();
  if (!contact) return { error: 'Contacto no encontrado.' };

  const { data: opp, error: oppError } = await supabase
    .from('opportunities')
    .insert({
      organization_id: currentUser.organization.id,
      contact_id: contactId,
      owner_membership_id: currentUser.membershipId,
      stage: 'new',
      priority: 'medium',
      currency: 'USD',
    })
    .select('id')
    .single();

  if (oppError || !opp) return { error: oppError?.message || 'Error al crear la negociación.' };

  if (projectId) {
    const { error: projectError } = await supabase.from('opportunity_projects').insert({
      opportunity_id: opp.id,
      project_id: projectId,
    });
    if (projectError) return { error: projectError.message };
  }

  revalidatePath('/portal/clientes', 'layout');
  revalidatePath('/portal/clientes');
  return { success: true, message: 'Negociación creada exitosamente.' };
}

export async function addProjectToOpportunityAction(
  opportunityId: number,
  projectId: number,
  contactId: number
): Promise<ActionResponse> {
  const supabase = await createClient();
  const currentUser = await getCurrentUser(supabase);
  if (!currentUser?.membershipId) return { error: 'Tu sesión expiró.' };

  const { data: opportunity } = await supabase
    .from('opportunities')
    .select('id, organization_id, contact_id')
    .eq('id', opportunityId)
    .eq('contact_id', contactId)
    .eq('organization_id', currentUser.organization.id)
    .maybeSingle();
  if (!opportunity) return { error: 'Negociación no encontrada o sin permiso.' };

  // The project query is also the authorization check: RLS only exposes
  // projects owned by, or explicitly shared with, the current user.
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .maybeSingle();
  if (!project) return { error: 'No tienes acceso a este proyecto.' };

  const { data: existing } = await supabase
    .from('opportunity_projects')
    .select('project_id')
    .eq('opportunity_id', opportunityId)
    .eq('project_id', projectId)
    .maybeSingle();
  if (existing) return { error: 'Este proyecto ya está vinculado a la negociación.' };

  const { error } = await supabase
    .from('opportunity_projects')
    .insert({ opportunity_id: opportunityId, project_id: projectId });
  if (error) return { error: error.message };

  revalidatePath('/portal/clientes', 'layout');
  return { success: true };
}

export async function addUnitToOpportunityAction(
  opportunityId: number,
  unitId: number,
  contactId: number
): Promise<ActionResponse> {
  const supabase = await createClient();
  const currentUser = await getCurrentUser(supabase);
  if (!currentUser?.membershipId) return { error: 'Tu sesión expiró.' };

  const { data: opportunity } = await supabase
    .from('opportunities')
    .select('id, organization_id, contact_id')
    .eq('id', opportunityId)
    .eq('contact_id', contactId)
    .eq('organization_id', currentUser.organization.id)
    .maybeSingle();
  if (!opportunity) return { error: 'Negociación no encontrada o sin permiso.' };

  const { data: unit } = await supabase
    .from('units')
    .select('id, project_id, status')
    .eq('id', unitId)
    .eq('status', 'available')
    .maybeSingle();
  if (!unit) return { error: 'La unidad ya no está disponible o no tienes acceso.' };

  const { data: projectLink } = await supabase
    .from('opportunity_projects')
    .select('project_id')
    .eq('opportunity_id', opportunityId)
    .eq('project_id', unit.project_id)
    .maybeSingle();
  if (!projectLink) return { error: 'Primero vincula el proyecto a la negociación.' };

  const { data: existing } = await supabase
    .from('opportunity_units')
    .select('unit_id')
    .eq('opportunity_id', opportunityId)
    .eq('unit_id', unitId)
    .maybeSingle();
  if (existing) return { error: 'Esta unidad ya está vinculada.' };

  const { error } = await supabase
    .from('opportunity_units')
    .insert({ opportunity_id: opportunityId, unit_id: unitId });
  if (error) return { error: error.message };

  revalidatePath('/portal/clientes', 'layout');
  return { success: true };
}

export async function removeUnitFromOpportunityAction(
  opportunityId: number,
  unitId: number,
  contactId: number
): Promise<ActionResponse> {
  const supabase = await createClient();
  const currentUser = await getCurrentUser(supabase);
  if (!currentUser?.membershipId) return { error: 'Tu sesión expiró.' };

  const { data: opportunity } = await supabase
    .from('opportunities')
    .select('id, organization_id, contact_id')
    .eq('id', opportunityId)
    .eq('contact_id', contactId)
    .eq('organization_id', currentUser.organization.id)
    .maybeSingle();
  if (!opportunity) return { error: 'Negociación no encontrada o sin permiso.' };

  const { error } = await supabase
    .from('opportunity_units')
    .delete()
    .eq('opportunity_id', opportunityId)
    .eq('unit_id', unitId);
  if (error) return { error: error.message };

  revalidatePath('/portal/clientes', 'layout');
  return { success: true };
}

export async function requestUnitReservationAction(
  opportunityId: number,
  unitId: number,
  contactId: number,
  notes?: string
): Promise<ActionResponse> {
  const supabase = await createClient();
  const currentUser = await getCurrentUser(supabase);
  if (!currentUser?.membershipId) return { error: 'Tu sesión expiró.' };

  const { data: opportunity } = await supabase
    .from('opportunities')
    .select('id, organization_id, contact_id')
    .eq('id', opportunityId)
    .eq('contact_id', contactId)
    .eq('organization_id', currentUser.organization.id)
    .maybeSingle();
  if (!opportunity) return { error: 'Negociación no encontrada o sin permiso.' };
  const { data: unit } = await supabase
    .from('units')
    .select('id, status, project_id, unit_code, project:projects(name)')
    .eq('id', unitId)
    .maybeSingle();
  if (!unit) return { error: 'Unidad no encontrada.' };
  if (unit.status !== 'available') return { error: 'Esta unidad ya no está disponible.' };

  const { data: linked } = await supabase
    .from('opportunity_units')
    .select('unit_id')
    .eq('opportunity_id', opportunityId)
    .eq('unit_id', unitId)
    .maybeSingle();
  if (!linked) return { error: 'Primero vincula la unidad a la negociación.' };

  const { data: pendingReq } = await supabase
    .from('reservation_requests')
    .select('id')
    .eq('opportunity_id', opportunityId)
    .eq('unit_id', unitId)
    .eq('status', 'pending')
    .maybeSingle();
  if (pendingReq) return { error: 'Ya existe una solicitud de reserva pendiente para esta unidad.' };

  const { error: insertError } = await supabase
    .from('reservation_requests')
    .insert({
      organization_id: currentUser.organization.id,
      opportunity_id: opportunityId,
      unit_id: unitId,
      requested_by_membership_id: currentUser.membershipId,
      status: 'pending',
      notes: notes?.trim() || null,
    });
  if (insertError) return { error: insertError.message };

  // A reservation request protects a unit; it does not close the commercial
  // opportunity. The negotiation continues through contract and initial-payment verification.
  await supabase.from('opportunities').update({ stage: 'negotiation' }).eq('id', opportunityId);

  const channels = await getProjectNotificationChannels(unit.project_id);
  if (channels) {
    const recipients = await getOperationalRecipientEmails(channels.organizationId);
    const title = 'Nueva solicitud de reserva';
    const body = `${currentUser.displayName || 'Un agente'} solicitó reservar la unidad ${unit.unit_code} de ${unit.project?.name || 'este proyecto'}.`;
    if (channels.crmEnabled) await notifyOperationalInbox({ organizationId: channels.organizationId, emails: recipients, type: 'reservation_request_submitted', title, body, link: '/portal/admin/reservations' });
    if (channels.emailEnabled) void sendOperationalNotificationEmail({ recipients, subject: `${title} · ${unit.unit_code}`, title, message: body, actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://brokers.osvaldobello.com'}/portal/admin/reservations`, actionLabel: 'Revisar solicitud' }).catch((mailError) => console.warn('reservation request notification email failed:', mailError));
  }

  revalidatePath('/portal/clientes', 'layout');
  revalidatePath('/portal/clientes');
  return { success: true, message: 'Solicitud de reserva enviada. Un administrador la revisará.' };
}

export async function getAvailableUnitsAction(projectId: number) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('units')
    .select('id, unit_code, floor_level, list_price, currency, status, tower')
    .eq('project_id', projectId)
    .eq('status', 'available')
    .order('unit_code');
  if (!data) return [];
  return data.map((u) => ({
    id: u.id,
    unitNumber: u.unit_code,
    typology: u.tower || (u.floor_level ? `Piso ${u.floor_level}` : null),
    area: null as number | null,
    price: Number(u.list_price),
    currency: u.currency || 'USD',
    status: u.status,
  }));
}
