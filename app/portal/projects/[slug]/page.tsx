import { notFound } from 'next/navigation';
import ProjectDetail from '@/components/portal/ProjectDetail';
import { getPortalProject } from '@/lib/data/projects';
import { getCurrentUser } from '@/lib/auth/get-user';
import { getDynamicProjectTypologies } from '@/lib/data/project-typologies-db';
import { hasCapability } from '@/lib/auth/permissions';
import { getProposalsListAction } from '@/app/portal/proposals/actions';
import { getProjectConstructionUpdates } from '@/lib/data/construction-updates';

export const revalidate = 60;

export default async function ProjectDetailPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const [project, currentUser, constructionUpdates] = await Promise.all([
    getPortalProject(params.slug),
    getCurrentUser(),
    getProjectConstructionUpdates(params.slug),
  ]);
  if (!project) notFound();
  const canManageDocuments = hasCapability(currentUser?.role, 'manage_project_documents');
  const canCreateProposals = hasCapability(currentUser?.role, 'create_proposals');
  const canEditDossier = hasCapability(currentUser?.role, 'edit_project_dossier');
  const customTypologies = await getDynamicProjectTypologies(project.id, project.slug);
  const dossiers = await getProposalsListAction();
  const dossier = dossiers.find(item => item.kind === 'dossier' && item.isMasterTemplate && item.projectSlug === project.slug && item.status === 'ready' && item.sharedUrl);

  return (
    <ProjectDetail
      project={project}
      canManageDocuments={canManageDocuments}
      canCreateProposals={canCreateProposals}
      canEditDossier={canEditDossier}
      customTypologies={customTypologies}
      officialDossier={dossier ? {id:dossier.id,url:dossier.sharedUrl!,pages:dossier.pageCount || 0} : undefined}
      constructionUpdates={constructionUpdates}
    />
  );
}
