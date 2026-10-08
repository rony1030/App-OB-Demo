import { redirect } from 'next/navigation';
import PortalDashboard from '@/components/portal/PortalDashboard';
import { cookies } from 'next/headers';

export default async function PortalPage() {
  if (process.env.NEXT_PUBLIC_APP_SCOPE === 'demo') {
    if (!(await cookies()).get('demo_auth_session')) redirect('/login?next=/portal');
    const { getCrmDashboardSummary } = await import('@/lib/data/crm');
    const { DEMO_PORTAL_PROJECTS } = await import('@/lib/demo/projects');
    const [crm] = await Promise.all([getCrmDashboardSummary()]);
    const projects = DEMO_PORTAL_PROJECTS;
    return <PortalDashboard projects={projects} displayName="Soporte OB Brokers" crm={crm} todayActivities={[]} myAgreement={null} canCreateProposals />;
  }
  const [{ getPortalProjects }, { getMyPendingActivities, getCrmDashboardSummary }, { getMyAgreements }, { getCurrentUser }, { hasCapability }] = await Promise.all([
    import('@/lib/data/projects'), import('@/lib/data/crm'), import('@/lib/data/agreements'), import('@/lib/auth/get-user'), import('@/lib/auth/permissions'),
  ]);
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
