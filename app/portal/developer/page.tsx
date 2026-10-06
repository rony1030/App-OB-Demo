
import { redirect } from 'next/navigation';
import EnhancedDeveloperOverview from '@/components/portal/EnhancedDeveloperOverview';
import { DEMO_PROJECT_VILLAS } from '@/lib/demo/mock-store';
import { cookies } from 'next/headers';

export default async function DeveloperPortalPage() {
  if (process.env.NEXT_PUBLIC_APP_SCOPE === 'demo' && !(await cookies()).get('demo_auth_session')) redirect('/login?next=/portal/developer');
  if (process.env.NEXT_PUBLIC_APP_SCOPE === 'demo') {
    const project = DEMO_PROJECT_VILLAS;
    const overview = {
      projects: [{ id: project.id, name: project.name, slug: project.slug, publicationStatus: 'published', lifecycleStatus: project.lifecycle_status,
        totalUnits: project.units.length, availableUnits: project.units.filter((unit) => unit.status === 'available').length,
        inventoryUpdatedAt: null, documentsCount: 5, activeMasterBrokersCount: 2, proposalViews: 10, dossierViews: 7, pdfDownloads: 4 }],
      totalProjects: 1, totalUnitsAvailable: project.units.filter((unit) => unit.status === 'available').length, totalActiveMasterBrokers: 2,
    };
    return <><div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-950">Panel de desarrolladora · Datos locales del proyecto {project.name}.</div><EnhancedDeveloperOverview overview={overview} orgName={project.developer_name} readOnly /></>;
  }
  const [{ getDeveloperOverview }, { getCurrentUser }, { getProjectReporting }, { default: ProjectReportingDashboard }, { UITranslationBoundary }] = await Promise.all([
    import('@/lib/data/developer'), import('@/lib/auth/get-user'), import('@/lib/data/project-reporting'), import('@/components/portal/ProjectReportingDashboard'), import('@/components/i18n/UITranslationBoundary'),
  ]);
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
