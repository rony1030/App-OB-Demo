'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth/get-user';

export type ReservationWorkflowSettings = {
  approvalAuthority: 'master_broker' | 'developer' | 'either';
  reservationMode: 'temporary_hold' | 'payment_confirmed' | 'both';
  approvalCreatesHold: boolean;
  holdDurationHours: number;
  warningHours: number;
  requirePaymentForConfirmation: boolean;
  requireDocumentsForConfirmation: boolean;
  releaseWithoutPayment: boolean;
  crmNotificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  allowClientDocumentsBeforeReservation: boolean;
};

export type OperationalNotificationRecipient = {
  email: string;
  label: string | null;
};

const DEFAULTS: ReservationWorkflowSettings = {
  approvalAuthority: 'master_broker',
  reservationMode: 'both',
  approvalCreatesHold: true,
  holdDurationHours: 24,
  warningHours: 4,
  requirePaymentForConfirmation: true,
  requireDocumentsForConfirmation: true,
  releaseWithoutPayment: true,
  crmNotificationsEnabled: true,
  emailNotificationsEnabled: true,
  allowClientDocumentsBeforeReservation: true,
};

function mapSettings(row: Record<string, unknown> | null | undefined): ReservationWorkflowSettings {
  return {
    approvalAuthority: (row?.approval_authority as ReservationWorkflowSettings['approvalAuthority']) || DEFAULTS.approvalAuthority,
    reservationMode: (row?.reservation_mode as ReservationWorkflowSettings['reservationMode']) || DEFAULTS.reservationMode,
    approvalCreatesHold: row?.approval_creates_hold ?? DEFAULTS.approvalCreatesHold,
    holdDurationHours: Number(row?.hold_duration_hours ?? DEFAULTS.holdDurationHours),
    warningHours: Number(row?.warning_hours ?? DEFAULTS.warningHours),
    requirePaymentForConfirmation: row?.require_payment_for_confirmation ?? DEFAULTS.requirePaymentForConfirmation,
    requireDocumentsForConfirmation: row?.require_documents_for_confirmation ?? DEFAULTS.requireDocumentsForConfirmation,
    releaseWithoutPayment: row?.release_without_payment ?? DEFAULTS.releaseWithoutPayment,
    crmNotificationsEnabled: row?.crm_notifications_enabled ?? DEFAULTS.crmNotificationsEnabled,
    emailNotificationsEnabled: row?.email_notifications_enabled ?? DEFAULTS.emailNotificationsEnabled,
    allowClientDocumentsBeforeReservation: row?.allow_client_documents_before_reservation ?? DEFAULTS.allowClientDocumentsBeforeReservation,
  } as ReservationWorkflowSettings;
}

export async function getReservationWorkflowSettingsAction(projectId: number) {
  const db = await createClient();
  const user = await getCurrentUser(db);
  if (!user) return DEFAULTS;
  const { data: project } = await db.from('projects').select('id, organization_id').eq('id', projectId).maybeSingle();
  if (!project || project.organization_id !== user.organization.id) return DEFAULTS;
  // The generated database type is updated after the migration is applied.
  // Keep this server-only query compatible with the current deployed snapshot.
  const { data } = await (db)
    .from('reservation_workflow_settings')
    .select('*')
    .eq('master_broker_organization_id', project.organization_id)
    .or(`project_id.eq.${projectId},project_id.is.null`)
    .order('project_id', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  return mapSettings(data as Record<string, unknown> | null);
}

export async function saveReservationWorkflowSettingsAction(
  projectId: number,
  settings: ReservationWorkflowSettings,
) {
  const db = await createClient();
  const user = await getCurrentUser(db);
  if (!user || !['super_admin', 'master_broker_admin', 'master_broker_operations'].includes(user.role)) {
    return { success: false, error: 'No tienes permisos para configurar el proceso de reservas.' };
  }
  const { data: project } = await db.from('projects').select('id, organization_id').eq('id', projectId).maybeSingle();
  if (!project || project.organization_id !== user.organization.id) return { success: false, error: 'Proyecto no encontrado.' };
  const holdHours = Math.max(1, Math.min(720, Math.round(Number(settings.holdDurationHours) || 24)));
  const warningHours = Math.max(0, Math.min(168, Math.round(Number(settings.warningHours) || 0)));
  const values = {
    master_broker_organization_id: project.organization_id,
    project_id: projectId,
    approval_authority: settings.approvalAuthority,
    reservation_mode: settings.reservationMode,
    approval_creates_hold: settings.approvalCreatesHold,
    hold_duration_hours: holdHours,
    warning_hours: warningHours,
    require_payment_for_confirmation: settings.requirePaymentForConfirmation,
    require_documents_for_confirmation: settings.requireDocumentsForConfirmation,
    release_without_payment: settings.releaseWithoutPayment,
    crm_notifications_enabled: settings.crmNotificationsEnabled,
    email_notifications_enabled: settings.emailNotificationsEnabled,
    allow_client_documents_before_reservation: settings.allowClientDocumentsBeforeReservation,
  };
  const { data: existing } = await (db).from('reservation_workflow_settings')
    .select('id')
    .eq('master_broker_organization_id', project.organization_id)
    .eq('project_id', projectId)
    .maybeSingle();
  const { error } = existing
    ? await (db).from('reservation_workflow_settings').update(values).eq('id', existing.id)
    : await (db).from('reservation_workflow_settings').insert(values);
  if (error) return { success: false, error: error.message };
  revalidatePath('/portal/admin/projects', 'layout');
  revalidatePath('/portal/admin/reservations');
  return { success: true };
}

export async function getOperationalNotificationRecipientsAction(projectId: number): Promise<OperationalNotificationRecipient[]> {
  const db = await createClient();
  const user = await getCurrentUser(db);
  if (!user) return [];
  const { data: project } = await db.from('projects').select('organization_id').eq('id', projectId).maybeSingle();
  if (!project || project.organization_id !== user.organization.id) return [];
  const { data } = await (db)
    .from('reservation_notification_recipients')
    .select('email, label')
    .eq('organization_id', project.organization_id)
    .eq('is_active', true)
    .order('email');
  return (data || []).map((item: Record<string, unknown>) => ({ email: String(item.email), label: item.label ? String(item.label) : null }));
}

export async function saveOperationalNotificationRecipientsAction(projectId: number, rawRecipients: string) {
  const db = await createClient();
  const user = await getCurrentUser(db);
  if (!user || !['super_admin', 'master_broker_admin', 'master_broker_operations'].includes(user.role)) {
    return { success: false, error: 'No tienes permisos para administrar los destinatarios.' };
  }
  const { data: project } = await db.from('projects').select('organization_id').eq('id', projectId).maybeSingle();
  if (!project || project.organization_id !== user.organization.id) return { success: false, error: 'Proyecto no encontrado.' };
  const emails = [...new Set(rawRecipients.split(/[\n,;]+/).map((value) => value.trim().toLowerCase()).filter((value) => /^\S+@\S+\.\S+$/.test(value)))];
  if (emails.length > 20) return { success: false, error: 'Puedes configurar hasta 20 correos.' };
  const admin = createAdminClient();
  const { error: reservationDeleteError } = await (admin).from('reservation_notification_recipients').delete().eq('organization_id', project.organization_id);
  if (reservationDeleteError) return { success: false, error: reservationDeleteError.message };
  const { error: reportDeleteError } = await (admin).from('report_notification_recipients').delete().eq('organization_id', project.organization_id);
  if (reportDeleteError) return { success: false, error: reportDeleteError.message };
  if (emails.length) {
    const rows = emails.map((email) => ({ organization_id: project.organization_id, email, is_active: true, created_by: user.id }));
    const [{ error: reservationInsertError }, { error: reportInsertError }] = await Promise.all([
      (admin).from('reservation_notification_recipients').insert(rows.map(({ created_by, ...row }) => row)),
      (admin).from('report_notification_recipients').insert(rows),
    ]);
    if (reservationInsertError || reportInsertError) return { success: false, error: reservationInsertError?.message || reportInsertError?.message || 'No se pudieron guardar los destinatarios.' };
  }
  revalidatePath('/portal/admin/projects', 'layout');
  return { success: true };
}
