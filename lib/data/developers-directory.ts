import 'server-only';

import { getPublicProjects } from '@/lib/data/projects';
import type { PortalProject } from '@/lib/portal-projects';

export interface DeveloperProjectSummary {
  id: string | number;
  name: string;
  slug: string;
  location: string;
  zone: string;
  image: string;
  startingPrice: number;
  currency: string;
  availableUnits: number;
  delivery: string;
  statusTag?: string;
}

export interface DeveloperProfile {
  slug: string;
  name: string;
  legalName?: string;
  logoUrl?: string;
  coverImage?: string;
  description: string;
  tagline?: string;
  verified: boolean;
  yearsActive?: string;
  country?: string;
  zones: string[];
  projectCount: number;
  availableUnitsCount: number;
  minPrice: number;
  currency: string;
  portfolioUrl: string;
  projects: DeveloperProjectSummary[];
  highlights?: string[];
  website?: string;
}

export interface DevelopersDirectoryData {
  developers: DeveloperProfile[];
  totalDevelopers: number;
  totalProjects: number;
  totalAvailableUnits: number;
  uniqueZones: string[];
}

const KNOWN_DEVELOPERS: Record<string, Partial<DeveloperProfile>> = {
  'cana-rock': {
    slug: 'cana-rock',
    name: 'Grupo Cana Rock',
    tagline: 'Desarrollo inmobiliario y hospitalidad en Cana Bay, Punta Cana',
    description:
      'Firma pionera y líder en el desarrollo de condominios residenciales de lujo alrededor del Hard Rock Golf Club en Cana Bay. Con un portafolio de proyectos emblemáticos, Cana Rock ofrece un estilo de vida resort integral con club de playa privado, alta rentabilidad y respaldo fiduciario asegurado.',
    logoUrl: '/w2m/assets/canarock-logo.png',
    coverImage: 'https://canarock.info/wp-content/uploads/2021/09/004-2.jpg',
    verified: true,
    yearsActive: '8+ años',
    country: 'República Dominicana',
    portfolioUrl: '/desarrolladores/cana-rock',
    highlights: ['Pionero en Cana Bay', 'Club de Playa Privado', '+2,000 Unidades Entregadas y en Obra', 'Renta Vacacional Optimizada'],
    website: 'https://canarock.info',
  },
  'kyser': {
    slug: 'kyser',
    name: 'Kyser Inmobiliaria & Desarrollos',
    tagline: 'Arquitectura contemporánea y alta valorización en Bávaro',
    description:
      'Empresa desarrolladora especializada en proyectos residenciales modernos con concepto hotelero en el polo turístico de Bávaro y Punta Cana. Creadores de Ciprés Residences, enfocado en confort, bienestar y retorno de inversión en rentas vacacionales.',
    logoUrl: '/projects/cipres-residences/hero.png',
    coverImage: '/projects/cipres-residences/hero.png',
    verified: true,
    yearsActive: '5+ años',
    country: 'República Dominicana',
    portfolioUrl: '/proyectos/cipres-residences',
    highlights: ['Concepto Airbnb Friendly', 'Diseño Sostenible', 'Ubicación Estratégica en Bávaro'],
  },
  'uve': {
    slug: 'uve',
    name: 'UVE Residences Group',
    tagline: 'Exclusividad y diseño vanguardista en el Este',
    description:
      'Firma desarrolladora enfocada en residencias boutique de alto estándar en zonas de alta plusvalía en Punta Cana, integrando acabados de primera y espacios pensados para el inversor internacional exigente.',
    logoUrl: '/projects/uve-residences/hero.jpeg',
    coverImage: '/projects/uve-residences/hero.jpeg',
    verified: true,
    yearsActive: '4+ años',
    country: 'República Dominicana',
    portfolioUrl: '/proyectos/uve-residences',
    highlights: ['Residencias Boutique', 'Acabados de Lujo', 'Inversión Inteligente'],
  },
  'coral-golf': {
    slug: 'coral-golf',
    name: 'Coral Golf & Hospitality Developments',
    tagline: 'Macro-desarrollos y golf living en Cabeza de Toro',
    description:
      'Desarrollos urbanos planificados con campo de golf iluminado de 18 hoyos, lago cristalino y condominios de lujo como Palm View Golf & Residences en Cabeza de Toro, Punta Cana.',
    logoUrl: '/projects/palm-view/hero.jpg',
    coverImage: '/projects/palm-view/hero.jpg',
    verified: true,
    yearsActive: '6+ años',
    country: 'República Dominicana',
    portfolioUrl: '/proyectos/palm-view',
    highlights: ['Campo de Golf Iluminado', 'Lago Cristalino Navegable', 'Respaldo Internacional'],
  },
  'paridera': {
    slug: 'paridera',
    name: 'Paridera Investors SRL',
    legalName: 'Paridera Investors SRL',
    tagline: 'Bonita Beach y Bonita Golf, en Cap Cana',
    description:
      'Firma desarrolladora dominicana especializada en proyectos residenciales de alto estándar en Cap Cana. Bonita Beach Residences, diseñado por GVA Arquitectura sobre el campo de golf Las Iguanas, reúne los edificios Sunrise, Sunset y Beach, una colección de villas y Bonita Golf Residences.',
    logoUrl: '/paridera/hub/logo-h-blue.png',
    coverImage: '/paridera/hub/sunrise-hero.jpg',
    verified: true,
    yearsActive: '3+ años',
    country: 'República Dominicana',
    portfolioUrl: '/desarrolladores/paridera',
    highlights: [
      'Playa privada de 15,000 m²',
      'Campo de golf Las Iguanas',
      'Sunrise · Sunset · Beach · Villas · Golf',
    ],
  },
};

function normalizeSlug(name: string): string {
  const clean = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  if (clean.includes('cana rock') || clean.includes('canarock')) return 'cana-rock';
  if (clean.includes('kyser') || clean.includes('cipres')) return 'kyser';
  if (clean.includes('uve')) return 'uve';
  if (clean.includes('coral') || clean.includes('palm view') || clean.includes('palmview')) return 'coral-golf';
  if (clean.includes('paridera') || clean.includes('bonita beach')) return 'paridera';

  return clean.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'desarrollador';
}

export async function getDevelopersDirectory(): Promise<DevelopersDirectoryData> {
  const projects = await getPublicProjects();

  const grouped = new Map<string, { name: string; projects: PortalProject[] }>();

  for (const p of projects) {
    const rawName = (p.developer || '').trim();
    const effectiveName = rawName && rawName.toLowerCase() !== 'desarrollador por confirmar'
      ? rawName
      : p.name.toLowerCase().includes('cana rock')
      ? 'Grupo Cana Rock'
      : p.slug === 'cipres-residences'
      ? 'Kyser Inmobiliaria & Desarrollos'
      : p.slug === 'uve-residences'
      ? 'UVE Residences Group'
      : p.slug === 'palm-view'
      ? 'Coral Golf & Hospitality Developments'
      : 'Desarrolladora Oficial';

    const slug = normalizeSlug(effectiveName);

    if (!grouped.has(slug)) {
      grouped.set(slug, { name: effectiveName, projects: [] });
    }
    grouped.get(slug)!.projects.push(p);
  }

  // Ensure Cana Rock is always present with its portfolio
  if (!grouped.has('cana-rock')) {
    const crProjects = projects.filter((p) => p.name.toLowerCase().includes('cana rock') || p.slug.startsWith('cana-rock'));
    if (crProjects.length > 0) {
      grouped.set('cana-rock', { name: 'Grupo Cana Rock', projects: crProjects });
    }
  }

  const developers: DeveloperProfile[] = [];
  const allZones = new Set<string>();
  let totalAvailableUnits = 0;

  for (const [slug, { name, projects: devProjects }] of grouped.entries()) {
    const known = KNOWN_DEVELOPERS[slug] || {};

    const projectSummaries: DeveloperProjectSummary[] = devProjects.map((p) => {
      const avail = (p.units || []).filter((u) => u.isPublic !== false && u.status === 'Disponible').length || p.availableUnits || 0;
      totalAvailableUnits += avail;
      if (p.zone) allZones.add(p.zone);

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        location: p.location,
        zone: p.zone || 'Punta Cana',
        image: p.image || (p.gallery && p.gallery.length > 0 ? p.gallery[0] : '/projects/palm-view/hero.jpg'),
        startingPrice: p.startingPrice || 0,
        currency: p.currency || 'USD',
        availableUnits: avail,
        delivery: p.delivery || 'En desarrollo',
        statusTag: p.delivery ? `Entrega: ${p.delivery}` : 'En comercialización',
      };
    });

    const devZones = Array.from(new Set(projectSummaries.map((p) => p.zone).filter(Boolean)));
    const prices = projectSummaries.map((p) => p.startingPrice).filter((pr) => pr > 0);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const totalDevUnits = projectSummaries.reduce((sum, p) => sum + p.availableUnits, 0);

    const firstProject = devProjects[0];
    const fallbackImage = firstProject?.image || (firstProject?.gallery && firstProject.gallery.length > 0 ? firstProject.gallery[0] : undefined);

    developers.push({
      slug,
      name: known.name || name,
      legalName: known.legalName,
      logoUrl: known.logoUrl || fallbackImage,
      coverImage: known.coverImage || fallbackImage,
      tagline: known.tagline || `Firma desarrolladora con proyectos en ${devZones.join(', ') || 'el Este de República Dominicana'}`,
      description:
        known.description ||
        `Desarrolladora inmobiliaria con ${projectSummaries.length} proyecto(s) activo(s) respaldados por la red master broker de OB Brokers Team. Garantía de terminación, planes de pago flexibles y alta valorización.`,
      verified: known.verified ?? true,
      yearsActive: known.yearsActive,
      country: known.country || 'República Dominicana',
      zones: devZones.length > 0 ? devZones : ['Punta Cana'],
      projectCount: projectSummaries.length,
      availableUnitsCount: totalDevUnits,
      minPrice,
      currency: 'USD',
      portfolioUrl: known.portfolioUrl || (devProjects.length === 1 ? `/proyectos/${devProjects[0].slug}` : `/desarrolladores/${slug}`),
      projects: projectSummaries,
      highlights: known.highlights || [`${projectSummaries.length} Desarrollos Activos`, 'Garantía Fiduciaria', 'Comisiones Aseguradas'],
      website: known.website,
    });
  }

  // Sort: verified first, then by number of projects descending
  developers.sort((a, b) => {
    if (a.verified && !b.verified) return -1;
    if (!a.verified && b.verified) return 1;
    return b.projectCount - a.projectCount;
  });

  return {
    developers,
    totalDevelopers: developers.length,
    totalProjects: projects.length,
    totalAvailableUnits,
    uniqueZones: Array.from(allZones),
  };
}
