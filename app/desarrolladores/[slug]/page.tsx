import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getPublicProjects } from '@/lib/data/projects';
import { getCurrentUser } from '@/lib/auth/get-user';
import CanaRockDeveloperHub from '@/components/developers/CanaRockDeveloperHub';
import ParideraDeveloperHub from '@/components/developers/ParideraDeveloperHub';
import GenericDeveloperHub from '@/components/developers/GenericDeveloperHub';
import { getDevelopersDirectory } from '@/lib/data/developers-directory';

export const revalidate = 60;

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const cleanSlug = slug.toLowerCase();
  const siteUrl = 'https://brokers.osvaldobello.com';

  if (cleanSlug === 'paridera' || cleanSlug === 'paridera-investors' || cleanSlug === 'bonita-beach') {
    const title = 'Paridera Investors · Desarrollador Inmobiliario en Cap Cana | Portafolio Oficial';
    const description =
      'Portafolio inmobiliario oficial de Paridera Investors en Cap Cana. Descubre Bonita Beach (Sunrise, Sunset, Beach, Villas) y Bonita Golf Residences frente a Crystal Lagoons y el campo de golf Las Iguanas.';
    const imageUrl = `${siteUrl}/paridera/hub/sunrise-hero.jpg`;
    const canonical = `${siteUrl}/desarrolladores/paridera`;

    return {
      title,
      description,
      keywords: [
        'Paridera Investors',
        'Paridera Cap Cana',
        'Bonita Beach Cap Cana',
        'Bonita Golf Residences',
        'Desarrollador Cap Cana',
        'Inversión inmobiliaria Punta Cana',
        'Crystal Lagoons República Dominicana',
      ],
      alternates: { canonical },
      openGraph: {
        title,
        description,
        url: canonical,
        images: [{ url: imageUrl, alt: title, width: 1200, height: 630 }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [imageUrl],
      },
    };
  }

  if (cleanSlug === 'cana-rock' || cleanSlug === 'canarock' || cleanSlug === 'grupo-cana-rock') {
    const title = 'Cana Rock · Desarrollador Inmobiliario en Hard Rock Golf Club Cana Bay';
    const description =
      'Descubre el portafolio de proyectos residenciales de Cana Rock en Punta Cana: Galaxy, Cosmos Stelar, Star y más, rodeados del campo de golf Hard Rock.';
    const canonical = `${siteUrl}/desarrolladores/cana-rock`;

    return {
      title,
      description,
      alternates: { canonical },
      openGraph: { title, description, url: canonical },
      twitter: { card: 'summary_large_image', title, description },
    };
  }

  // Lookup in developers directory
  const directory = await getDevelopersDirectory();
  const matchedDev = directory.developers.find(
    (d) => d.slug.toLowerCase() === cleanSlug
  );

  if (matchedDev) {
    const title = `${matchedDev.name} · Desarrollador Inmobiliario | Portafolio Oficial OB Brokers`;
    const description = matchedDev.description || `Explora todos los proyectos de ${matchedDev.name} en República Dominicana con inventario y precios oficiales.`;
    const canonical = `${siteUrl}/desarrolladores/${matchedDev.slug}`;
    const imageUrl = matchedDev.coverImage ? (matchedDev.coverImage.startsWith('http') ? matchedDev.coverImage : `${siteUrl}${matchedDev.coverImage}`) : undefined;

    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        title,
        description,
        url: canonical,
        ...(imageUrl ? { images: [{ url: imageUrl, alt: title, width: 1200, height: 630 }] } : {}),
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        ...(imageUrl ? { images: [imageUrl] } : {}),
      },
    };
  }

  return {
    title: 'Desarrolladores Inmobiliarios · OB Brokers',
    description: 'Directorio de desarrolladores y promotores inmobiliarios aliados en República Dominicana.',
  };
}

export default async function DeveloperPortfolioPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const cleanSlug = slug.toLowerCase();

  const [projects, currentUser] = await Promise.all([
    getPublicProjects(),
    // This is a public page. A temporary auth/Supabase outage must not turn
    // the developer portfolio into a 503; render its public view instead.
    getCurrentUser().catch((error) => {
      console.error('Developer portfolio session lookup failed:', error);
      return null;
    }),
  ]);

  if (cleanSlug === 'cana-rock' || cleanSlug === 'canarock' || cleanSlug === 'grupo-cana-rock') {
    return <CanaRockDeveloperHub projects={projects} currentUser={currentUser} />;
  }

  if (cleanSlug === 'paridera' || cleanSlug === 'paridera-investors' || cleanSlug === 'bonita-beach') {
    return <ParideraDeveloperHub projects={projects} currentUser={currentUser} />;
  }

  // Check if slug matches another developer in the directory
  const directory = await getDevelopersDirectory();
  const matchedDev = directory.developers.find(
    (d) => d.slug.toLowerCase() === cleanSlug
  );

  if (matchedDev) {
    // Filter projects associated with this developer
    const devProjectSlugs = new Set(matchedDev.projects.map((p) => p.slug));
    const devProjects = projects.filter(
      (p) => devProjectSlugs.has(p.slug) || (p.developer && p.developer.toLowerCase().includes(cleanSlug))
    );

    return (
      <GenericDeveloperHub
        developer={matchedDev}
        projects={devProjects.length > 0 ? devProjects : projects.filter((p) => p.slug === matchedDev.projects[0]?.slug)}
        currentUser={currentUser}
      />
    );
  }

  redirect('/desarrolladores');
}
