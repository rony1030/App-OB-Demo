'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth/get-user';

type RecipientKind = 'leads' | 'payments' | 'reservations';

const tableByKind = {
  leads: 'report_notification_recipients',
  payments: 'agreement_notification_recipients',
  reservations: 'reservation_notification_recipients',
} as const satisfies Record<RecipientKind, string>;

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

async function authorize() {
  const user = await getCurrentUser();
  return user?.role === 'super_admin' ? user : null;
}

export async function addMasterBrokerRecipientAction(payload: {
  organizationId: number;
  kind: RecipientKind;
  email: string;
  label?: string;
}): Promise<{ success?: boolean; error?: string }> {
  const user = await authorize();
  if (!user) return { error: 'Solo el superadministrador puede configurar estos destinatarios.' };
  if (!tableByKind[payload.kind] || !isEmail(payload.email)) return { error: 'Indica un correo válido.' };
  const admin = createAdminClient();
  const recipient = {
    organization_id: payload.organizationId,
    email: payload.email.trim().toLowerCase(),
    label: payload.label?.trim() || null,
    is_active: true,
  };
  const options = { onConflict: 'organization_id,email' };
  const { error } = payload.kind === 'payments'
    ? await admin.from('agreement_notification_recipients').upsert(recipient, options)
    : payload.kind === 'leads'
      ? await admin.from('report_notification_recipients').upsert({ ...recipient, created_by: user.id }, options)
      : await admin.from('reservation_notification_recipients').upsert({ ...recipient, created_by: user.id }, options);
  if (error) return { error: error.message };
  revalidatePath('/portal/admin/brokers');
  return { success: true };
}

export async function removeMasterBrokerRecipientAction(payload: {
  organizationId: number;
  kind: RecipientKind;
  email: string;
}): Promise<{ success?: boolean; error?: string }> {
  const user = await authorize();
  if (!user) return { error: 'Solo el superadministrador puede configurar estos destinatarios.' };
  const admin = createAdminClient();
  const { error } = await admin.from(tableByKind[payload.kind]).update({ is_active: false }).eq('organization_id', payload.organizationId).eq('email', payload.email);
  if (error) return { error: error.message };
  revalidatePath('/portal/admin/brokers');
  return { success: true };
}
