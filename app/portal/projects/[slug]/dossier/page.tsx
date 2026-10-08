import { notFound, redirect } from 'next/navigation';
import PresentationEditor from '@/components/portal/PresentationEditor';
import { getPortalProject } from '@/lib/data/projects';
import { getLatestSavedPresentationAction } from '@/app/portal/proposals/actions';
import { getCurrentUser } from '@/lib/auth/get-user';
import { hasCapability } from '@/lib/auth/permissions';
import DemoDossierComposer from '@/components/portal/proposals/DemoDossierComposer';
import { buildDemoDossier } from '@/lib/demo/projects';
import type { SlideBlock } from '@/components/portal/PublicDossierViewer';

export default async function DossierEditorPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const [project, currentUser] = await Promise.all([getPortalProject(params.slug), getCurrentUser()]);
  if (!currentUser) redirect(`/login?next=/portal/projects/${params.slug}/dossier`);
  if (!hasCapability(currentUser.role, 'edit_project_dossier')) redirect(`/portal/projects/${params.slug}`);
  if (!project) notFound();
  if (process.env.NEXT_PUBLIC_APP_SCOPE === 'demo') return <DemoDossierComposer project={project} blocks={buildDemoDossier(project) as SlideBlock[]} />;

  const savedPresentation = await getLatestSavedPresentationAction({
    projectSlug: params.slug,
    projectName: project.name,
    kind: 'dossier',
  });

  return (
    <PresentationEditor
      project={project}
      kind="dossier"
      presentationId={savedPresentation?.presentationId}
      serverInitialBlocks={savedPresentation?.blocks}
    />
  );
}
