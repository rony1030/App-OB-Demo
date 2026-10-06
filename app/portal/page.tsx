import { redirect } from 'next/navigation';
import PortalDashboard from '@/components/portal/PortalDashboard';
import { getPortalProjects } from '@/lib/data/projects';
import { getCrmDashboardSummary, getMyPendingActivities } from '@/lib/data/crm';
import { getMyAgreements } from '@/lib/data/agreements';
import { getCurrentUser } from '@/lib/auth/get-user';
import { hasCapability } from '@/lib/auth/permissions';

export default async function PortalPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/login?next=/portal');
  if (
    currentUser.role === 'developer_admin' ||
    currentUser.role === 'developer_viewer' ||
    currentUser.organization.kind === 'developer'
  ) {
    redirect('/portal/developer');
  }
  if (currentUser.role === 'support_auditor') {
    redirect('/portal/audit');
  }

  const [projects, crm, todayActivities, myAgreements] = await Promise.all([
    getPortalProjects(),
    getCrmDashboardSummary(),
    getMyPendingActivities(),
    getMyAgreements(),
  ]);

  const myAgreement = myAgreements.find((a) => a.kind === 'general') ?? myAgreements[0] ?? null;

  return (
    <PortalDashboard
      projects={projects}
      displayName={currentUser.displayName}
      crm={crm}
      todayActivities={todayActivities}
      myAgreement={hasCapability(currentUser.role, 'manage_agreements') ? myAgreement : null}
      canCreateProposals={hasCapability(currentUser.role, 'create_proposals')}
    />
  );
}
