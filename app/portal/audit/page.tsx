import { redirect } from 'next/navigation';
import AuditLog from '@/components/portal/AuditLog';
import { getAuditEvents } from '@/lib/data/audit';
import { getCurrentUser } from '@/lib/auth/get-user';

export default async function AuditPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/login?next=/portal/audit');
  if (!['support_auditor', 'super_admin', 'master_broker_admin'].includes(currentUser.role)) {
    redirect('/portal');
  }

  const events = await getAuditEvents(currentUser.organization.id);

  return <AuditLog events={events} orgName={currentUser.organization.name} />;
}
