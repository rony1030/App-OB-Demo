import { notFound, redirect } from 'next/navigation';
import PortalModulePage from '@/components/portal/PortalModulePage';
import { getPortalProjects } from '@/lib/data/projects';
import { getContacts } from '@/lib/data/crm';
import { getProposalsListAction } from '@/app/portal/proposals/actions';
import { getCurrentUser } from '@/lib/auth/get-user';
import { hasCapability } from '@/lib/auth/permissions';

export const dynamic = 'force-dynamic';

const sections = ['clientes', 'leads', 'projects', 'inventory', 'proposals'] as const;

export function generateStaticParams() {
  return sections.map((section) => ({ section }));
}

export default async function PortalSectionPage(props: { params: Promise<{ section: string }> }) {
  const params = await props.params;
  if (!sections.includes(params.section as (typeof sections)[number])) notFound();

  const [projects, contacts, proposals, currentUser] = await Promise.all([
    getPortalProjects(),
    getContacts(),
    getProposalsListAction(),
    getCurrentUser(),
  ]);

  if (!currentUser) redirect(`/login?next=/portal/${params.section}`);
  if (params.section === 'proposals' && !hasCapability(currentUser.role, 'create_proposals')) {
    redirect('/portal/projects');
  }

  return (
    <PortalModulePage
      module={params.section as (typeof sections)[number]}
      projects={projects}
      contacts={contacts}
      proposals={proposals}
      canCreateProposals={hasCapability(currentUser.role, 'create_proposals')}
      canEditDossiers={hasCapability(currentUser.role, 'edit_project_dossier')}
      canEditProposals={['super_admin', 'master_broker_admin'].includes(currentUser.role)}
    />
  );
}
