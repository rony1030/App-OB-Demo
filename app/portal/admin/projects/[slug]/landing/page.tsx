import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-user';
import { getPortalProjects } from '@/lib/data/projects';
import { getProjectLandingConfig } from '@/lib/data/landing-config';
import { getDynamicProjectTypologies } from '@/lib/data/project-typologies-db';
import LandingBuilder from '@/components/portal/admin/landing-builder/LandingBuilder';

const AUTHORIZED_ROLES = [
  'super_admin',
  'master_broker_admin',
  'master_broker_operations',
  'developer_admin',
];

export default async function ProjectLandingBuilderPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;

  const currentUser = await getCurrentUser();
  if (!currentUser || !AUTHORIZED_ROLES.includes(currentUser.role)) {
    redirect('/portal');
  }

  const allProjects = await getPortalProjects();
  const project = allProjects.find((p) => p.slug === params.slug);

  if (!project) {
    notFound();
  }

  const [landingConfig, customTypologies] = await Promise.all([
    getProjectLandingConfig(project.id, project),
    getDynamicProjectTypologies(project.id),
  ]);

  return (
    <LandingBuilder
      project={project}
      initialConfig={landingConfig}
      customTypologies={customTypologies}
    />
  );
}
