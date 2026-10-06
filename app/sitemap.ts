import type { MetadataRoute } from 'next';
import { getPublicProjects } from '@/lib/data/projects';
import { supportedLocales } from '@/lib/i18n/locale';

export const dynamic = 'force-dynamic';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://brokers.osvaldobello.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getPublicProjects();

  const entries: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: 'weekly', priority: 1.0 },
  ];

  // Add locale variants for root homepage
  for (const locale of supportedLocales) {
    entries.push({
      url: `${siteUrl}/${locale}`,
      changeFrequency: 'weekly',
      priority: 0.9,
    });
  }

  // Add projects catalogue
  entries.push({ url: `${siteUrl}/proyectos`, changeFrequency: 'weekly', priority: 0.8 });
  for (const locale of supportedLocales) {
    entries.push({
      url: `${siteUrl}/${locale}/proyectos`,
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  }

  // Add individual projects with locale variants
  for (const project of projects) {
    const lastModified = project.updatedAt ? new Date(project.updatedAt) : undefined;
    entries.push({
      url: `${siteUrl}/proyectos/${project.slug}`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    });
    for (const locale of supportedLocales) {
      entries.push({
        url: `${siteUrl}/${locale}/proyectos/${project.slug}`,
        lastModified,
        changeFrequency: 'weekly',
        priority: 0.9,
      });
    }
  }

  // Add developer hubs
  const developerSlugs = ['paridera', 'cana-rock'];
  entries.push({ url: `${siteUrl}/desarrolladores`, changeFrequency: 'weekly', priority: 0.8 });
  for (const locale of supportedLocales) {
    entries.push({
      url: `${siteUrl}/${locale}/desarrolladores`,
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  }

  for (const devSlug of developerSlugs) {
    entries.push({
      url: `${siteUrl}/desarrolladores/${devSlug}`,
      changeFrequency: 'weekly',
      priority: 0.9,
    });
    for (const locale of supportedLocales) {
      entries.push({
        url: `${siteUrl}/${locale}/desarrolladores/${devSlug}`,
        changeFrequency: 'weekly',
        priority: 0.9,
      });
    }
  }

  return entries;
}
