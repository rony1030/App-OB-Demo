'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import { MAX_DOCUMENT_SIZE_BYTES, MAX_DOCUMENT_SIZE_LABEL } from '@/lib/storage/document-limits';
import { sendOperationalNotificationEmail } from '@/lib/email/mailer';
import { getOperationalRecipientEmails, getProjectNotificationChannels, notifyOperationalInbox } from '@/lib/operations/notifications';

const ALLOWED_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);

export async function submitReservationPaymentAction(
  contactId: number,
  reservationId: number,
  formData: FormData,
): Promise<{ success?: boolean; error?: string }> {
  const db = await createClient();
  const user = await getCurrentUser(db);
  if (!user?.membershipId) return { error: 'Tu sesión expiró.' };

  const file = formData.get('file');
  if (!(file instanceof File) || file.size <= 0) return { error: 'Adjunta el comprobante de pago.' };
  if (file.size > MAX_DOCUMENT_SIZE_BYTES || !ALLOWED_TYPES.has(file.type)) return { error: `Usa PDF, JPG, PNG o WEBP de hasta ${MAX_DOCUMENT_SIZE_LABEL}.` };
  const amount = Number(formData.get('amount'));
  if (!Number.isFinite(amount) || amount < 0) return { error: 'Indica un monto válido.' };

  const { data: reservation } = await (db)
    .from('reservations')
    .select('id, reservation_request_id, status, reservation_type, reservation_request:reservation_requests!inner(id, unit_id, opportunity_id, requested_by_membership_id, status, expires_at, opportunity:opportunities!inner(contact_id))')
    .eq('id', reservationId)
    .maybeSingle();
  const request = reservation?.reservation_request;
  const opportunity = request?.opportunity;
  if (!reservation || !request || !opportunity || opportunity.contact_id !== contactId) return { error: 'Reserva no encontrada para este cliente.' };
  if (request.requested_by_membership_id !== user.membershipId) return { error: 'Solo quien solicitó el bloqueo puede reportar este pago.' };
  const paymentStage = String(formData.get('paymentStage') || 'reservation');
  if (!['reservation', 'initial', 'construction', 'delivery'].includes(paymentStage)) return { error: 'Selecciona la etapa del pago.' };
  if (reservation.status !== 'active' || request.status !== 'approved') return { error: 'Esta reserva ya no admite comprobantes.' };
  if (paymentStage === 'reservation' && reservation.reservation_type !== 'temporary_hold') return { error: 'El pago de reserva ya fue confirmado. Reporta el inicial, construcción o entrega.' };
  if (paymentStage !== 'reservation' && reservation.reservation_type !== 'payment_confirmed') return { error: 'Primero debe confirmarse el pago de reserva.' };
  if (paymentStage === 'reservation' && request.expires_at && new Date(request.expires_at).getTime() <= Date.now()) return { error: 'El bloqueo ya venció.' };

  const extension = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(-100);
  const path = `${user.organization.slug}/reservations/${reservationId}/payments/${crypto.randomUUID()}-${safeName}.${extension}`;
  const { error: uploadError } = await db.storage.from('private-documents').upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: false });
  if (uploadError) return { error: `No se pudo subir el comprobante: ${uploadError.message}` };

  const { error: insertError } = await (db).from('reservation_payment_submissions').insert({
    reservation_id: reservationId,
    reservation_request_id: request.id,
    organization_id: user.organization.id,
    submitted_by_membership_id: user.membershipId,
    amount,
    currency: String(formData.get('currency') || 'USD'),
    reference: String(formData.get('reference') || '').trim() || null,
    paid_at: String(formData.get('paidAt') || '') || null,
    storage_bucket: 'private-documents',
    storage_path: path,
    file_name: file.name,
    payment_stage: paymentStage,
  });
  if (insertError) {
    await db.storage.from('private-documents').remove([path]);
    return { error: `No se pudo registrar el comprobante: ${insertError.message}` };
  }

  const { data: unit } = await db.from('units').select('unit_code, project_id, project:projects(name)').eq('id', request.unit_id || 0).maybeSingle();
  const channels = unit ? await getProjectNotificationChannels(unit.project_id) : null;
  if (channels) {
    const recipients = await getOperationalRecipientEmails(channels.organizationId);
    const title = `Comprobante de ${paymentStage === 'reservation' ? 'reserva' : paymentStage === 'initial' ? 'inicial' : paymentStage === 'construction' ? 'construcción' : 'entrega'} reportado`;
    const body = `${user.displayName || 'Un agente'} reportó ${String(formData.get('currency') || 'USD')} ${amount.toLocaleString('en-US')} para ${unit?.project?.name || 'el proyecto'} · ${unit?.unit_code || 'unidad'}.`;
    const { data: contactForLink } = await db.from('contacts').select('public_code').eq('id', contactId).maybeSingle();
    if (channels.crmEnabled) await notifyOperationalInbox({ organizationId: channels.organizationId, emails: recipients, type: 'reservation_payment_submitted', title, body, link: `/portal/clientes/${contactForLink?.public_code || contactId}` });
    if (channels.emailEnabled) {
      void sendOperationalNotificationEmail({ recipients, subject: `${title} · ${unit?.unit_code || 'Unidad'}`, title, message: body, actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://brokers.osvaldobello.com'}/portal/admin/reservations`, actionLabel: 'Verificar comprobante' }).catch((error) => console.warn('reservation payment notification email failed:', error));
    }
  }

  revalidatePath('/portal/clientes', 'layout');
  revalidatePath('/portal/admin/reservations');
  revalidatePath('/portal/admin/operations');
  return { success: true };
}
