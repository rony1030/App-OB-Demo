import { redirect } from 'next/navigation';
import AdminDashboard from '@/components/portal/AdminDashboard';
import AgreementsOverviewPanel from '@/components/portal/admin/AgreementsOverviewPanel';
import OrgLegalInfoCard from '@/components/portal/admin/OrgLegalInfoCard';
import { getAdminDashboardData, getOrganizationLegalInfo } from '@/lib/data/admin';
import { getCurrentUser } from '@/lib/auth/get-user';
import { getIssuedAgreements, getOrgAgreementsOverview } from '@/lib/data/agreements';

export default async function AdminPortalPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login?next=/portal/admin');
  }

  if (currentUser.role !== 'super_admin' && currentUser.role !== 'master_broker_admin') {
    redirect('/portal');
  }

  const hasGlobalAccess = currentUser.role === 'super_admin';

  const [metrics, overview, issuedAgreements, legalInfo] = await Promise.all([
    getAdminDashboardData(hasGlobalAccess ? undefined : currentUser.organization.id),
    getOrgAgreementsOverview(currentUser.organization.id),
    getIssuedAgreements(),
    getOrganizationLegalInfo(currentUser.organization.id),
  ]);

  return (
    <div className="space-y-8">
      <AdminDashboard
        metrics={metrics}
        globalAccess={hasGlobalAccess}
        organizationName={currentUser.organization.name}
      />
      {legalInfo && (
        <OrgLegalInfoCard organizationName={currentUser.organization.name} legalInfo={legalInfo} />
      )}
      {overview && <AgreementsOverviewPanel overview={overview} issuedAgreements={issuedAgreements} />}
    </div>
  );
}
