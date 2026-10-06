import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-user';
import { getGeneralAnalytics, getDetailedAnalytics } from '@/lib/data/analytics-dashboard';
import AnalyticsDashboard from '@/components/portal/admin/AnalyticsDashboard';

export default async function AnalyticsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login?next=/portal/admin/analytics');
  }

  if (!['super_admin', 'master_broker_admin'].includes(currentUser.role)) {
    redirect('/portal');
  }

  const scopeOrgId = currentUser.role === 'super_admin' ? undefined : currentUser.organization.id;

  const [generalData, detailedData] = await Promise.all([
    getGeneralAnalytics(scopeOrgId),
    getDetailedAnalytics(scopeOrgId),
  ]);

  return (
    <AnalyticsDashboard
      generalData={generalData}
      detailedData={detailedData}
      globalAccess={currentUser.role === 'super_admin'}
      organizationName={currentUser.organization.name}
    />
  );
}
