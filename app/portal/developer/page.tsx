
import { UITranslationBoundary } from '@/components/i18n/UITranslationBoundary';
import { redirect } from 'next/navigation';
import EnhancedDeveloperOverview from '@/components/portal/EnhancedDeveloperOverview';
import { getDeveloperOverview } from '@/lib/data/developer';
import { getCurrentUser } from '@/lib/auth/get-user';
import { getProjectReporting } from '@/lib/data/project-reporting';
import ProjectReportingDashboard from '@/components/portal/ProjectReportingDashboard';

export default async function DeveloperPortalPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/login?next=/portal/developer');
  const canViewDeveloperPanel =
    ['developer_admin', 'developer_viewer', 'master_broker_admin', 'super_admin'].includes(currentUser.role) &&
    (currentUser.organization.kind === 'developer' || currentUser.role === 'super_admin');
  if (!canViewDeveloperPanel) {
    redirect('/portal');
  }

  const [overview, reporting] = await Promise.all([
    getDeveloperOverview(currentUser.organization.id),
    getProjectReporting(currentUser, { kind: 'developer' }),
  ]);

  return (
    <div className="space-y-10">
      <EnhancedDeveloperOverview overview={overview} orgName={currentUser.organization.name} readOnly={currentUser.role === 'developer_viewer'} />
      {reporting && (
        <UITranslationBoundary attributes={["description"]}>
          <ProjectReportingDashboard overview={reporting} description="Actividad comercial registrada para tus proyectos. El seguimiento no abre expedientes privados de agencias o agentes." />
        </UITranslationBoundary>
      )}
    </div>
  );
}
