import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://brokers.osvaldobello.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: ['/', '/proyectos/', '/desarrolladores/'], disallow: ['/portal/', '/api/', '/p/', '/auth/', '/login', '/dev/'] }],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
