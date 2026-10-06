'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth/get-user';
import { sendOperationalNotificationEmail } from '@/lib/email/mailer';
import { getProjectNotificationChannels, notifyMembership } from '@/lib/operations/notifications';
import { canReviewOperationsProject } from '@/lib/operations/review-access';

export async function reviewReservationRequestAction(
  requestId: number,
  decision: 'approve' | 'reject',
  reason?: string,
) {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user || !['super_admin', 'master_broker_admin', 'master_broker_operations', 'developer_admin'].includes(user.role)) {
    return { error: 'No tienes permisos para revisar reservas.' };
  }
  const admin = createAdminClient();
  const { data: request } = await (admin).from('reservation_requests').select('organization_id, requested_by_membership_id, opportunity_id, unit_id').eq('id', requestId).maybeSingle();

  // The database function is introduced by the reservation workflow migration;
  // keep this action compatible with generated types from older schema snapshots.
  const { error } = await (supabase).rpc('review_reservation_request', {
    target_request_id: requestId,
    target_decision: decision,
    target_reason: reason?.trim() || undefined,
  });
  if (error) return { error: error.message };
  if (request?.unit_id) {
    const { data: unit } = await admin.from('units').select('unit_code, project_id, project:projects(name)').eq('id', request.unit_id).maybeSingle();
    const channels = unit ? await getProjectNotificationChannels(unit.project_id) : null;
    const { data: membership } = request.requested_by_membership_id ? await admin.from('memberships').select('user_id').eq('id', request.requested_by_membership_id).maybeSingle() : { data: null };
    const { data: profile } = membership?.user_id ? await admin.from('profiles').select('email').eq('user_id', membership.user_id).maybeSingle() : { data: null };
    const approved = decision === 'approve';
    const title = approved ? 'Solicitud de reserva aprobada' : 'Solicitud de reserva rechazada';
    const body = approved ? `La unidad ${unit?.unit_code || ''} de ${unit?.project?.name || 'este proyecto'} ya tiene el estatus indicado en la operación.` : `La solicitud de la unidad ${unit?.unit_code || ''} fue rechazada.${reason ? ` Motivo: ${reason}` : ''}`;
    if (channels?.crmEnabled) await notifyMembership({ organizationId: request.organization_id || user.organization.id, membershipId: request.requested_by_membership_id, type: approved ? 'reservation_request_approved' : 'reservation_request_rejected', title, body, link: '/portal/clientes' });
    if (channels?.emailEnabled && profile?.email) void sendOperationalNotificationEmail({ recipients: [profile.email], subject: `${title} · ${unit?.unit_code || 'Unidad'}`, title, message: body, actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://brokers.osvaldobello.com'}/portal/clientes`, actionLabel: 'Abrir negociación' }).catch((mailError) => console.warn('reservation review notification email failed:', mailError));
  }

  revalidatePath('/portal/admin/reservations');
  revalidatePath('/portal/admin');
  revalidatePath('/portal/clientes');
  return { success: true };
}

export async function reviewReservationPaymentAction(paymentId: number, decision: 'approve' | 'reject', notes?: string) {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user || !['super_admin', 'master_broker_admin', 'master_broker_operations', 'developer_admin'].includes(user.role)) return { error: 'No tienes permisos para verificar pagos.' };
  const admin = createAdminClient();
  const { data: payment } = await (admin).from('reservation_payment_submissions').select('reservation_request_id, payment_stage').eq('id', paymentId).maybeSingle();
  const { data: request } = payment?.reservation_request_id ? await (admin).from('reservation_requests').select('organization_id, requested_by_membership_id, opportunity_id, unit_id').eq('id', payment.reservation_request_id).maybeSingle() : { data: null };
  const { error } = await (supabase).rpc('review_reservation_payment', {
    target_submission_id: paymentId,
    target_decision: decision,
    target_notes: notes?.trim() || undefined,
  });
  if (error) return { error: error.message };
  if (request?.unit_id) {
    const { data: unit } = await admin.from('units').select('unit_code, project_id, project:projects(name)').eq('id', request.unit_id).maybeSingle();
    const channels = unit ? await getProjectNotificationChannels(unit.project_id) : null;
    const { data: membership } = request.requested_by_membership_id ? await admin.from('memberships').select('user_id').eq('id', request.requested_by_membership_id).maybeSingle() : { data: null };
    const { data: profile } = membership?.user_id ? await admin.from('profiles').select('email').eq('user_id', membership.user_id).maybeSingle() : { data: null };
    const stage = payment?.payment_stage === 'initial' ? 'pago inicial' : payment?.payment_stage === 'construction' ? 'pago de construcción' : payment?.payment_stage === 'delivery' ? 'pago contra entrega' : 'pago de reserva';
    const approved = decision === 'approve';
    const title = approved ? `${stage} confirmado` : `${stage} rechazado`;
    const body = approved ? `El ${stage} de la unidad ${unit?.unit_code || ''} fue verificado por operaciones.` : `El comprobante del ${stage} para la unidad ${unit?.unit_code || ''} requiere corrección.${notes ? ` Observación: ${notes}` : ''}`;
    if (channels?.crmEnabled) await notifyMembership({ organizationId: request.organization_id, membershipId: request.requested_by_membership_id, type: approved ? 'reservation_payment_approved' : 'reservation_payment_rejected', title, body, link: '/portal/clientes' });
    if (channels?.emailEnabled && profile?.email) void sendOperationalNotificationEmail({ recipients: [profile.email], subject: `${title} · ${unit?.unit_code || 'Unidad'}`, title, message: body, actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://brokers.osvaldobello.com'}/portal/clientes`, actionLabel: 'Abrir negociación' }).catch((mailError) => console.warn('payment review notification email failed:', mailError));
  }
  revalidatePath('/portal/admin/reservations');
  revalidatePath('/portal/clientes');
  return { success: true };
}

export async function confirmSaleFromReservationAction(reservationId: number) {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user || !['super_admin', 'master_broker_admin', 'master_broker_operations', 'developer_admin'].includes(user.role)) return { error: 'No tienes permisos para confirmar ventas.' };
  const { data, error } = await (supabase).rpc('confirm_sale_from_reservation', { target_reservation_id: reservationId });
  if (error) return { error: error.message };
  revalidatePath('/portal/admin/reservations');
  revalidatePath('/portal/admin/operations');
  revalidatePath('/portal/clientes');
  revalidatePath('/portal/comisiones');
  return { success: true, saleId: Number(data) };
}

export async function getReservationReviewFileUrlAction(kind: 'client_document' | 'payment', id: number) {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user || !['super_admin', 'master_broker_admin', 'master_broker_operations', 'developer_admin', 'developer_viewer'].includes(user.role)) return { error: 'No tienes permisos para abrir este documento.' };
  const admin = createAdminClient();
  const { data } = kind === 'payment'
    ? await admin.from('reservation_payment_submissions').select('storage_bucket, storage_path, organization_id, reservation_request_id').eq('id', id).maybeSingle()
    : await admin.from('client_documents').select('storage_bucket, storage_path, organization_id, reservation_request_id, contact_id').eq('id', id).maybeSingle();
  if (!data?.storage_bucket || !data?.storage_path) return { error: 'Archivo no encontrado.' };
  if (user.role !== 'super_admin') {
    const contactId = 'contact_id' in data ? Number(data.contact_id) : null;
    const { data: opportunities } = contactId
      ? await admin.from('opportunities').select('id').eq('contact_id', contactId).eq('organization_id', data.organization_id)
      : { data: [] };
    let requests = admin.from('reservation_requests').select('unit_id').eq('organization_id', data.organization_id);
    if (data.reservation_request_id) requests = requests.eq('id', data.reservation_request_id);
    else if (opportunities?.length) requests = requests.in('opportunity_id', opportunities.map(opportunity => opportunity.id));
    else return { error: 'No tienes acceso a este documento.' };
    const { data: relatedRequests } = await requests;
    const unitIds = (relatedRequests || []).map(request => request.unit_id).filter((unitId): unitId is number => unitId !== null);
    const { data: units } = unitIds.length ? await admin.from('units').select('project_id, project:projects(organization_id)').in('id', unitIds) : { data: [] };
    const { data: grants } = await admin.from('project_access').select('project_id, expires_at').eq('grantee_membership_id', user.membershipId);
    const allowed = (units || []).some(unit => unit.project && canReviewOperationsProject(
      { role: user.role, organizationId: user.organization.id },
      { id: unit.project_id, organizationId: unit.project.organization_id },
      (grants || []).map(grant => ({ projectId: grant.project_id, expiresAt: grant.expires_at })),
    ));
    if (!allowed) return { error: 'No tienes acceso a este documento.' };
  }
  const { data: signed, error } = await admin.storage.from(data.storage_bucket).createSignedUrl(data.storage_path, 600);
  return error || !signed?.signedUrl ? { error: error?.message || 'No se pudo abrir el archivo.' } : { url: signed.signedUrl };
}
