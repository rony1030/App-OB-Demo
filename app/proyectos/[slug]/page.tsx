import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPublicProject, getPublicProjects } from '@/lib/data/projects';
import { getProjectLandingConfig, getDefaultLandingConfig } from '@/lib/data/landing-config';
import { getCurrentUser } from '@/lib/auth/get-user';
import { getDynamicProjectTypologies } from '@/lib/data/project-typologies-db';
import ProjectSalesLanding from '@/components/landing/ProjectSalesLanding';
import ElementsProjectLanding from '@/components/landing/ElementsProjectLanding';
import UveResidencesLanding from '@/components/landing/UveResidencesLanding';
import PalmViewProjectLanding from '@/components/landing/PalmViewProjectLanding';
import CanaRockProjectLanding from '@/components/landing/CanaRockProjectLanding';
import ParideraProjectLanding from '@/components/landing/ParideraProjectLanding';

import { getProjectSeoSpecs, generateProjectJsonLd } from '@/lib/seo/project-schema';

export const revalidate = 0;

function getServerDateInSantoDomingo() {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Santo_Domingo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const project = await getPublicProject(params.slug);

  if (!project) {
    return { title: 'Proyecto no encontrado · OB Brokers Team' };
  }

  const seo = getProjectSeoSpecs(params.slug, project);
  const title = seo.metaTitle;
  const description = seo.metaDescription;

  let imageUrl: string | undefined;
  if (project.image) {
    if (project.image.startsWith('http://') || project.image.startsWith('https://')) {
      imageUrl = project.image;
    } else if (project.image.startsWith('/')) {
      imageUrl = `https://brokers.osvaldobello.com${project.image}`;
    } else {
      imageUrl = project.image;
    }
  }

  const shareUrl = seo.canonicalUrl;

  return {
    title,
    description,
    keywords: seo.keywords,
    alternates: {
      canonical: shareUrl,
    },
    openGraph: {
      title,
      description,
      url: shareUrl,
      images: imageUrl ? [{ url: imageUrl, alt: title, width: 1200, height: 630 }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default async function ProjectPublicLandingPage(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ broker?: string; ref?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  const project = await getPublicProject(params.slug);

  if (!project) {
    notFound();
  }

  const [currentUser, landingConfig, customTypologies, publicProjects] = await Promise.all([
    getCurrentUser().catch(() => null),
    getProjectLandingConfig(project.id, project).catch(() => getDefaultLandingConfig(project)),
    getDynamicProjectTypologies(project.id, project.slug).catch(() => ({})),
    getPublicProjects().catch(() => []),
  ]);

  const developerProjectCount = project.developer
    ? publicProjects.filter((item) => item.developer?.trim().toLowerCase() === project.developer?.trim().toLowerCase()).length
    : 1;
  const developerProjects = project.developer
    ? publicProjects
        .filter((item) => item.developer?.trim().toLowerCase() === project.developer?.trim().toLowerCase())
        .map((item) => ({ slug: item.slug, name: item.name }))
    : [];

  const brokerParam = searchParams.broker || searchParams.ref;
  const brokerReferrer = brokerParam
    ? {
        name: decodeURIComponent(brokerParam),
      }
    : null;

  const normalizedSlug = (params.slug || project.slug || '').trim().toLowerCase();
  const effectiveConfig = landingConfig || getDefaultLandingConfig(project);

  const seoSpecs = getProjectSeoSpecs(params.slug, project);
  const jsonLd = generateProjectJsonLd(project, seoSpecs);

  const isParideraProject =
    normalizedSlug.endsWith('-bonita-beach') ||
    normalizedSlug === 'bonita-golf' ||
    project.developer?.toLowerCase().includes('paridera') ||
    effectiveConfig?.theme?.experiencePreset === 'paridera-bonita-beach';

  let landingContent: React.ReactNode;

  if (normalizedSlug === 'elements') {
    landingContent = (
      <ElementsProjectLanding
        project={project}
        config={effectiveConfig}
        brokerReferrer={brokerReferrer}
        isAuthenticated={!!currentUser}
        currentUser={currentUser ? { displayName: currentUser.displayName, organization: { name: currentUser.organization.name } } : null}
      />
    );
  } else if (normalizedSlug === 'uve-residences') {
    landingContent = (
      <UveResidencesLanding
        project={project}
        config={effectiveConfig}
        brokerReferrer={brokerReferrer}
        isAuthenticated={!!currentUser}
        currentUser={currentUser ? { displayName: currentUser.displayName, organization: { name: currentUser.organization.name } } : null}
        customTypologies={customTypologies}
        developerProjectCount={developerProjectCount || 1}
        developerProjects={developerProjects}
        serverToday={getServerDateInSantoDomingo()}
      />
    );
  } else if (normalizedSlug === 'palm-view') {
    landingContent = (
      <PalmViewProjectLanding
        project={project}
        config={effectiveConfig}
        brokerReferrer={brokerReferrer}
        isAuthenticated={!!currentUser}
        currentUser={currentUser ? { displayName: currentUser.displayName, organization: { name: currentUser.organization.name } } : null}
        developerProjectCount={developerProjectCount || 1}
        developerProjects={developerProjects}
      />
    );
  } else if (isParideraProject) {
    landingContent = (
      <ParideraProjectLanding
        project={project}
        config={effectiveConfig}
        brokerReferrer={brokerReferrer}
        isAuthenticated={!!currentUser}
        currentUser={currentUser ? { displayName: currentUser.displayName, organization: { name: currentUser.organization.name } } : null}
        developerProjectCount={developerProjectCount || 1}
        developerProjects={developerProjects}
        serverToday={getServerDateInSantoDomingo()}
      />
    );
  } else if (effectiveConfig?.theme?.experiencePreset === 'cana-rock-resort') {
    landingContent = (
      <CanaRockProjectLanding
        project={project}
        config={effectiveConfig}
        brokerReferrer={brokerReferrer}
        isAuthenticated={!!currentUser}
        currentUser={currentUser ? { displayName: currentUser.displayName, organization: { name: currentUser.organization.name } } : null}
        developerProjectCount={developerProjectCount || 1}
        developerProjects={developerProjects}
        serverToday={getServerDateInSantoDomingo()}
      />
    );
  } else {
    landingContent = (
      <ProjectSalesLanding
        project={project}
        config={effectiveConfig}
        brokerReferrer={brokerReferrer}
        isAuthenticated={!!currentUser}
        currentUser={currentUser ? { displayName: currentUser.displayName, organization: { name: currentUser.organization.name } } : null}
        customTypologies={customTypologies}
        developerProjectCount={developerProjectCount || 1}
        developerProjects={developerProjects}
        serverToday={getServerDateInSantoDomingo()}
      />
    );
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {landingContent}
    </>
  );
}
