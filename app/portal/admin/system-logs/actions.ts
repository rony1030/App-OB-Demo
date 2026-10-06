'use server';

import { getCurrentUser } from '@/lib/auth/get-user';
import { getSystemLogs, getLogStats, writeLog, type LogsFilter } from '@/lib/logger';

/** Verifica que el usuario tiene permiso de ver logs (super_admin o master_broker_admin) */
async function requireLogsAccess() {
  const user = await getCurrentUser();
  if (!user) throw new Error('No autenticado');
  if (user.role !== 'super_admin' && user.role !== 'master_broker_admin') {
    throw new Error('Sin permiso para ver registros del sistema');
  }
  return user;
}

/** Obtiene logs paginados con filtros */
export async function fetchSystemLogsAction(filter: LogsFilter = {}) {
  await requireLogsAccess();
  return getSystemLogs(filter);
}

/** Obtiene estadísticas rápidas del panel */
export async function fetchLogStatsAction() {
  await requireLogsAccess();
  return getLogStats();
}

/** Escribe un log de mantenimiento manual desde el panel */
export async function writeMaintenanceLogAction(
  action: string,
  description: string,
  level: 'info' | 'warning' = 'info',
) {
  const user = await requireLogsAccess();

  await writeLog({
    level,
    category: 'maintenance',
    action,
    description,
    route: '/portal/admin/system-logs',
    user: { id: user.id, email: user.email, role: user.role, displayName: user.displayName },
    metadata: { source: 'manual_entry', adminPanel: true },
  });

  return { ok: true };
}
