import { redirect } from 'next/navigation';
import DeveloperDashboard from '@/components/portal/DeveloperDashboard';
import { getCurrentUser } from '@/lib/auth/get-user';
import { getDeveloperOpsSnapshot } from '@/lib/data/developer-ops';

export default async function DeveloperPortalPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'super_admin') {
    redirect('/portal');
  }

  const snapshot = await getDeveloperOpsSnapshot();
  return <DeveloperDashboard snapshot={snapshot} />;
}
