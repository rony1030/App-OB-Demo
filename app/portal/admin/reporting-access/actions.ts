'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-user';
import { createAdminClient } from '@/lib/supabase/admin';

function result(message: string): never {
  redirect(`/portal/admin/reporting-access?message=${encodeURIComponent(message)}`);
}

export async function saveReportingAccess(formData: FormData) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.realRole !== 'super_admin' || currentUser.isPreviewMode) result('No tienes permiso para administrar estos accesos.');
  const userId = String(formData.get('userId') ?? '');
  const organizationId = Number(formData.get('organizationId'));
  const status = formData.get('status') === 'revoked' ? 'revoked' : 'active';
  if (!/^[0-9a-f-]{36}$/i.test(userId) || !Number.isSafeInteger(organizationId) || organizationId < 1) result('Selecciona un usuario y una organización válidos.');
  const admin = createAdminClient();
  const [{ data: agencyMembership }, { data: organization }, { data: operationalMembership }] = await Promise.all([
    admin.from('memberships').select('id').eq('user_id', userId).eq('role', 'agency_admin').eq('status', 'active').limit(1).maybeSingle(),
    admin.from('organizations').select('id').eq('id', organizationId).eq('kind', 'master_broker').eq('status', 'active').maybeSingle(),
    admin.from('memberships').select('id').eq('user_id', userId).eq('organization_id', organizationId).eq('status', 'active').limit(1).maybeSingle(),
  ]);
  if (!agencyMembership || !organization) result('El usuario debe administrar una agencia y la organización debe ser un master broker activo.');
  if (status === 'active' && operationalMembership) result('Este usuario ya tiene acceso operativo al master broker. Retira ese rol antes de asignar la vista de solo lectura.');
  const { error } = await admin.from('master_broker_reporting_access').upsert({ user_id: userId, master_broker_organization_id: organizationId, status, granted_by: currentUser.id, updated_at: new Date().toISOString() }, { onConflict: 'user_id,master_broker_organization_id' });
  if (error) result('No se pudo guardar el acceso. Inténtalo de nuevo.');
  revalidatePath('/portal', 'layout');
  revalidatePath('/portal/admin/reporting-access');
  result(status === 'active' ? 'Vista de seguimiento asignada.' : 'Vista de seguimiento revocada.');
}
