import { notFound, redirect } from 'next/navigation';
import SimpleProposalCreator from '@/components/portal/proposals/SimpleProposalCreator';
import PresentationEditor from '@/components/portal/PresentationEditor';
import { getPortalProjects } from '@/lib/data/projects';
import { getCurrentUser } from '@/lib/auth/get-user';
import { getContacts } from '@/lib/data/crm';
import { getActiveMarketingOffersForProject } from '@/lib/data/marketing-offers';
import { getProposalForEditAction } from '@/app/portal/proposals/actions';
import { hasCapability } from '@/lib/auth/permissions';

export default async function EditProposalPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const presentationId = Number(params.id);
  if (!Number.isInteger(presentationId) || presentationId <= 0) notFound();

  const currentUser = await getCurrentUser();
  if (!currentUser) redirect(`/login?next=/portal/proposals/${presentationId}/edit`);

  const { data: proposalData, error, viewUrl } = await getProposalForEditAction(presentationId);
  if (viewUrl) redirect(viewUrl);
  if (error || !proposalData) notFound();

  const canEditAny = proposalData.kind === 'dossier'
    ? hasCapability(currentUser.role, 'edit_project_dossier')
    : ['super_admin', 'master_broker_admin'].includes(currentUser.role);
  const isAuthor = Boolean(currentUser.membershipId && proposalData.authorMembershipId === currentUser.membershipId);
  if (!canEditAny && (proposalData.kind === 'dossier' || !isAuthor)) {
    redirect('/portal/proposals');
  }

  const [projects, contacts] = await Promise.all([
    getPortalProjects(),
    getContacts(),
  ]);

  const snap = proposalData.snapshot;
  const projectSlug = proposalData.projectSlug || (snap.project_slug as string);
  const projectName = (snap.project as string) || (snap.projectName as string);
  const project = projects.find(
    (p) => (projectSlug && p.slug === projectSlug) || (projectName && p.name.toLowerCase() === projectName.toLowerCase())
  );

  if (!project) notFound();

  if (proposalData.kind === 'dossier') {
    return (
      <PresentationEditor
        project={project}
        kind="dossier"
        presentationId={proposalData.presentationId}
        serverInitialBlocks={Array.isArray(snap.blocks) ? (snap.blocks) : undefined}
      />
    );
  }

  const rawItems = Array.isArray(snap.items) ? (snap.items as Array<Record<string, unknown>>) : [];
  const selectedUnitIds = rawItems
    .map((it) => String(it.unit_id || it.id || ''))
    .filter((id) => project.units.some((u) => u.id === id));

  const activeOffers = await getActiveMarketingOffersForProject(project.id);

  return (
    <SimpleProposalCreator
      project={project}
      selectedUnitIds={selectedUnitIds.length > 0 ? selectedUnitIds : [project.units[0]?.id].filter(Boolean)}
      recipients={contacts.map((contact) => ({
        id: contact.id,
        fullName: contact.fullName,
        email: contact.email,
        phone: contact.phone,
        classification: contact.classification,
      }))}
      activeOffers={activeOffers}
      canApplyManualDiscount={['super_admin', 'master_broker_admin'].includes(currentUser.role)}
      canUseDirectInvestor={['super_admin', 'master_broker_admin', 'agency_support'].includes(currentUser.role)}
      brokerName={currentUser.displayName}
      brokerPhone={currentUser.phone}
      brokerEmail={currentUser.email}
      brokerAvatarUrl={currentUser.avatarUrl}
      brokerProfessionalTitle={currentUser.professionalTitle}
      editMode={{
        presentationId: proposalData.presentationId,
        title: proposalData.title,
        token: proposalData.token,
        url: proposalData.url,
        snapshot: proposalData.snapshot,
      }}
    />
  );
}
