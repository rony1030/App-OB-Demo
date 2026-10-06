import 'server-only';

import type { OrganizationSummary } from '@/lib/data/admin';
import { normalizeCanaRockUnits } from '@/lib/integrations/inventory/normalize-cana-rock';
import type { InventoryStatus } from '@/lib/integrations/inventory/types';
import type { PortalProject, PortalUnitStatus } from '@/lib/portal-projects';

const CANA_ROCK_SITE_URL = 'https://cana-rock.osvaldobello.com';

type CanaRockPreviewDefinition = {
  id: number;
  slug: 'star' | 'universe' | 'galaxy' | 'stelar';
  name: string;
  delivery: string;
  fallbackStartingPrice: number;
  image: string;
  description: string;
  gallery: string[];
  amenities: string[];
};

const previewDefinitions: CanaRockPreviewDefinition[] = [
  {
    id: -9101,
    slug: 'star',
    name: 'Cana Rock Star',
    delivery: 'Listo para entrega',
    fallbackStartingPrice: 165_000,
    image: 'https://canarock.info/wp-content/uploads/2022/06/web01-scaled.jpg',
    description: 'Residencial de arquitectura moderna en Cana Bay, junto al Hard Rock Golf Club, con unidades listas para entrega.',
    gallery: [
      'https://canarock.info/wp-content/uploads/2022/06/web01-scaled.jpg',
      'https://canarock.info/wp-content/uploads/2022/06/Sala-scaled.jpg',
      'https://canarock.info/wp-content/uploads/2022/07/Exterior-Nocturno-1-web-1-scaled.jpg',
    ],
    amenities: ['Piscina', 'Gimnasio', 'Seguridad 24 horas', 'Zona infantil', 'Acceso al club de playa'],
  },
  {
    id: -9102,
    slug: 'universe',
    name: 'Cana Rock Universe',
    delivery: 'Bloque A listo / Bloque B mayo 2027',
    fallbackStartingPrice: 190_000,
    image: 'https://canarock.info/wp-content/uploads/2021/09/004-2.jpg',
    description: 'Una combinación de diseño ecológico tropical y estilo de vida de resort dentro de Cana Bay.',
    gallery: [
      'https://canarock.info/wp-content/uploads/2021/09/004-2.jpg',
      'https://canarock.info/wp-content/uploads/2021/09/002-2.jpg',
      'https://canarock.info/wp-content/uploads/2021/09/001-2.jpg',
    ],
    amenities: ['Piscina', 'Gimnasio', 'Seguridad 24 horas', 'Restaurante de autor', 'Vistas al campo de golf'],
  },
  {
    id: -9103,
    slug: 'galaxy',
    name: 'Cana Rock Galaxy',
    delivery: 'Agosto 2026',
    fallbackStartingPrice: 220_000,
    image: 'https://canarock.info/wp-content/uploads/2021/09/001-1.jpg',
    description: 'Proyecto residencial vanguardista con apartamentos inteligentes y vistas privilegiadas al golf.',
    gallery: [
      'https://canarock.info/wp-content/uploads/2021/09/001-1.jpg',
      'https://canarock.info/wp-content/uploads/2021/09/002-1.jpg',
      'https://canarock.info/wp-content/uploads/2021/09/003-1.jpg',
    ],
    amenities: ['Piscina infinita', 'Gimnasio', 'Seguridad 24 horas', 'Smart Home', 'Aparcamiento subterráneo'],
  },
  {
    id: -9104,
    slug: 'stelar',
    name: 'Cana Rock Cosmos Stelar',
    delivery: 'Diciembre 2027',
    fallbackStartingPrice: 175_000,
    image: 'https://canarock.info/wp-content/uploads/2023/05/230426_Cosmos_Aerea-01_Final-scaled.jpg',
    description: 'Una propuesta residencial contemporánea integrada con la naturaleza y el Hard Rock Golf Club de Cana Bay.',
    gallery: [
      'https://canarock.info/wp-content/uploads/2023/05/230426_Cosmos_Aerea-01_Final-scaled.jpg',
      'https://canarock.info/wp-content/uploads/2023/05/Vista-exterior-01_Final-02-scaled.jpg',
      'https://canarock.info/wp-content/uploads/2023/10/PF-001-scaled.jpg',
    ],
    amenities: ['Piscina', 'Gimnasio', 'Seguridad 24 horas', 'Área de yoga', 'Vistas al lago y al golf'],
  },
];

const statusLabels: Record<InventoryStatus, PortalUnitStatus> = {
  available: 'Disponible',
  blocked: 'Bloqueada',
  separated: 'Separada',
  reserved: 'Separada',
  sold: 'Vendida',
  withdrawn: 'Bloqueada',
  unknown: 'Bloqueada',
};

export function isCanaRockLocalPreviewEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.LOCAL_CANA_ROCK_PREVIEW === 'true';
}

export const canaRockPreviewOrganizations: OrganizationSummary[] = [
  {
    id: -9201,
    name: 'Cana Rock / Osvaldo Bello',
    slug: 'cana-rock-osvaldo-bello',
    kind: 'master_broker',
    status: 'Previsualización local',
    contactEmail: null,
    contactPhone: null,
    usersCount: 1,
    projectsCount: 4,
    createdAt: '2026-09-03T00:00:00.000Z',
    initials: 'CR',
  },
  {
    id: -9202,
    name: 'Grupo Cana Rock',
    slug: 'grupo-cana-rock',
    kind: 'developer',
    status: 'Previsualización local',
    contactEmail: null,
    contactPhone: null,
    usersCount: 0,
    projectsCount: 4,
    createdAt: '2026-09-03T00:00:00.000Z',
    initials: 'GC',
  },
];

async function fetchAvailability(definition: CanaRockPreviewDefinition): Promise<unknown[]> {
  const url = new URL('/api/projects/availability', CANA_ROCK_SITE_URL);
  url.searchParams.set('slug', definition.slug);

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) return [];

    const payload = (await response.json()) as { units?: unknown[] };
    return Array.isArray(payload.units) ? payload.units : [];
  } catch (error) {
    console.warn(`Cana Rock preview: no fue posible cargar ${definition.slug}.`, error);
    return [];
  }
}

async function buildPreviewProject(definition: CanaRockPreviewDefinition): Promise<PortalProject> {
  const rawUnits = await fetchAvailability(definition);
  const normalized = normalizeCanaRockUnits(rawUnits, `cana-rock-${definition.slug}`);
  const units = normalized.units.map((unit, index) => ({
    id: `${Math.abs(definition.id)}${String(index + 1).padStart(4, '0')}`,
    unit: unit.unitCode,
    tower: unit.tower ?? 'Cana Bay',
    floor: unit.floor ?? 0,
    type: unit.typology ?? 'Apartamento',
    bedrooms: unit.bedrooms ?? 0,
    bathrooms: unit.bathrooms ?? 0,
    area: unit.areaSqm ?? 0,
    price: unit.price ?? 0,
    currency: 'USD',
    status: statusLabels[unit.status],
    isPublic: true,
    customColumns: unit.parkingSpaces === null ? undefined : { Parqueos: String(unit.parkingSpaces) },
  }));
  const prices = units.filter((unit) => unit.status === 'Disponible').map((unit) => unit.price).filter((price) => price > 0);
  const startingPrice = prices.length > 0 ? Math.min(...prices) : definition.fallbackStartingPrice;
  const availableUnits = units.filter((unit) => unit.status === 'Disponible').length;

  return {
    id: definition.id,
    slug: `cana-rock-${definition.slug}`,
    name: definition.name,
    developer: 'Grupo Cana Rock',
    location: 'Cana Bay, Punta Cana',
    zone: 'Punta Cana',
    status: 'Activo',
    delivery: definition.delivery,
    startingPrice,
    currency: 'USD',
    commission: 0,
    totalUnits: units.length,
    availableUnits,
    description: definition.description,
    shortDescription: definition.description,
    image: definition.image,
    gallery: definition.gallery,
    highlights: ['Inventario conectado con Cana Rock', 'Administrado por Cana Rock / Osvaldo Bello'],
    amenities: definition.amenities,
    paymentPlan: definition.slug === 'star'
      ? [
          { label: 'Reserva', value: 'US$ 3,000' },
          { label: 'Inicial', value: '20%' },
          { label: 'Contra entrega', value: '80%' },
        ]
      : [
          { label: 'Reserva', value: 'US$ 3,000' },
          { label: 'Inicial', value: '20%' },
          { label: 'Durante construcción', value: '40%' },
          { label: 'Contra entrega', value: '40%' },
        ],
    documents: [],
    units,
    projectType: 'building',
    lots: [],
    updatedAt: new Intl.DateTimeFormat('es-DO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'America/Santo_Domingo',
    }).format(new Date()),
    isLocalPreview: true,
    inventorySourceLabel: 'API oficial de Cana Rock',
    sourceUrl: `${CANA_ROCK_SITE_URL}/${definition.slug}`,
  };
}

export async function getCanaRockPreviewProjects(): Promise<PortalProject[]> {
  if (!isCanaRockLocalPreviewEnabled()) return [];
  return Promise.all(previewDefinitions.map(buildPreviewProject));
}

export function mergeCanaRockPreviewProjects(
  projects: PortalProject[],
  previewProjects: PortalProject[],
): PortalProject[] {
  const previewSlugs = new Set(previewProjects.map((project) => project.slug));
  return [...projects.filter((project) => !previewSlugs.has(project.slug)), ...previewProjects].sort((a, b) =>
    a.name.localeCompare(b.name, 'es'),
  );
}
