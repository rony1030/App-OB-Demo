import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPublicProject } from '@/lib/data/projects';
import { getProjectLandingConfig, getDefaultLandingConfig } from '@/lib/data/landing-config';
import { getCurrentUser } from '@/lib/auth/get-user';
import ElementsProjectLanding from '@/components/landing/ElementsProjectLanding';

export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const project = await getPublicProject('elements');

  if (!project) {
    return { title: 'Elements Residences & Resort · Nisibón' };
  }

  const title = `${project.name} · Ventas Oficiales & Disponibilidad en Vivo`;
  const description =
    project.shortDescription ||
    `Santuario residencial boutique biofílico en Nisibón, La Altagracia. Colección exclusiva de 12 Eco Suites.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: 'https://brokers.osvaldobello.com/elements',
      images: [
        {
          url: 'https://brokers.osvaldobello.com/images/projects/elements/exterior.jpg',
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://brokers.osvaldobello.com/images/projects/elements/exterior.jpg'],
    },
  };
}

export default async function ElementsDirectLandingPage(props: {
  searchParams: Promise<{ broker?: string; ref?: string }>;
}) {
  const searchParams = await props.searchParams;
  const project = await getPublicProject('elements');

  if (!project) {
    notFound();
  }

  const [currentUser, landingConfig] = await Promise.all([
    getCurrentUser().catch(() => null),
    getProjectLandingConfig(project.id, project).catch(() => getDefaultLandingConfig(project)),
  ]);

  // Search params arrive decoded; decoding again can throw on a stray "%".
  const brokerParam = (searchParams.broker || searchParams.ref || '').trim().slice(0, 120);
  const brokerReferrer = brokerParam
    ? {
        name: brokerParam,
      }
    : null;

  return (
    <ElementsProjectLanding
      project={project}
      config={landingConfig || getDefaultLandingConfig(project)}
      brokerReferrer={brokerReferrer}
      isAuthenticated={!!currentUser}
      currentUser={currentUser ? { displayName: currentUser.displayName, organization: { name: currentUser.organization.name } } : null}
    />
  );
}
