import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-user';
import { getSystemLogs, getLogStats } from '@/lib/logger';
import SystemLogsPanel from '@/components/portal/admin/SystemLogsPanel';

export const dynamic = 'force-dynamic';

export default async function AdminSystemLogsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login?next=/portal/admin/system-logs');
  }

  if (currentUser.role !== 'super_admin' && currentUser.role !== 'master_broker_admin') {
    redirect('/portal');
  }

  const [{ logs, total }, stats] = await Promise.all([
    getSystemLogs({ limit: 50, offset: 0 }),
    getLogStats(),
  ]);

  return (
    <SystemLogsPanel
      initialLogs={logs}
      initialTotal={total}
      stats={stats}
      currentUser={{
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role,
        displayName: currentUser.displayName,
      }}
    />
  );
}
