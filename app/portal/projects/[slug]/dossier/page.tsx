import { notFound, redirect } from 'next/navigation';
import PresentationEditor from '@/components/portal/PresentationEditor';
import { getPortalProject } from '@/lib/data/projects';
import { getLatestSavedPresentationAction } from '@/app/portal/proposals/actions';
import { getCurrentUser } from '@/lib/auth/get-user';
import { hasCapability } from '@/lib/auth/permissions';

export default async function DossierEditorPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const [project, currentUser] = await Promise.all([getPortalProject(params.slug), getCurrentUser()]);
  if (!currentUser) redirect(`/login?next=/portal/projects/${params.slug}/dossier`);
  if (!hasCapability(currentUser.role, 'edit_project_dossier')) redirect(`/portal/projects/${params.slug}`);
  if (!project) notFound();

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
