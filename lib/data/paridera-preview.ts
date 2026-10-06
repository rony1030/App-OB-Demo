import 'server-only';

import type { PortalProject } from '@/lib/portal-projects';
import { PARIDERA_PAYMENT_PLANS, PARIDERA_PHASES, PARIDERA_RESERVATION_USD } from '@/lib/data/paridera-portfolio';

export interface ParideraPreviewDefinition {
  id: number;
  slug: string;
  name: string;
  delivery: string;
  startingPrice: number;
  image: string;
  heroImage: string;
  description: string;
  shortDescription: string;
  zone: string;
  location: string;
  gallery: string[];
  amenities: string[];
  highlights: string[];
  availableUnits: number;
  totalUnits: number;
  commissionRate: number;
}

export const PARIDERA_PREVIEW_PROJECTS: ParideraPreviewDefinition[] = [
  {
    id: -8201,
    slug: 'sunrise-bonita-beach',
    name: 'Sunrise Fase 1 — Bonita Beach',
    delivery: 'Diciembre 2027',
    startingPrice: 165_000,
    image: '/paridera/hub/sunrise-hero.jpg',
    heroImage: '/paridera/hub/sunrise-hero.jpg',
    shortDescription: 'Apartamentos de 1, 2 y 3 habitaciones frente al mar con beach club privado, rooftop y piscina infinita.',
    description: 'Sunrise es la primera fase del exclusivo complejo residencial Bonita Beach en el campo de golf Las Iguanas, Cap Cana. Concebido bajo estándares de alta arquitectura contemporánea, ofrece residencias de 1, 2 y 3 habitaciones con acabados de primera línea, vistas frontales al océano, acceso directo a la playa, beach club con servicio de butler, rooftop sky lounge y piscina de diseño.',
    zone: 'Cap Cana',
    location: 'Campo de Golf Las Iguanas, Cap Cana, República Dominicana',
    gallery: [],
    amenities: [
      'Beach Club Privado',
      'Piscina Infinita',
      'Rooftop Sky Lounge',
      'Gym & Área Wellness',
      'Lobby Boutique de Doble Altura',
      'Campo de Golf Integrado',
      'Seguridad y Concierge 24/7',
      'Acceso Directo a la Playa',
    ],
    highlights: [
      'Frente al mar con acceso directo a la playa',
      'Beach Club privado y Rooftop Sky Lounge',
      'Acabados de primera línea — Memoria de Calidades Bonita Beach',
      'Reserva con US$ 5,000 y tres planes de pago',
    ],
    availableUnits: 98,
    totalUnits: 120,
    commissionRate: 5,
  },
  {
    id: -8202,
    slug: 'sunset-bonita-beach',
    name: 'Sunset Fase 2 — Bonita Beach',
    delivery: 'Junio 2028',
    startingPrice: 180_000,
    image: '/paridera/sunset/sunset-01.jpg',
    heroImage: '/paridera/sunset/sunset-01.jpg',
    shortDescription: 'Residencias orientadas al oeste con amplias terrazas panorámicas para disfrutar el atardecer caribeño.',
    description: 'Segunda fase de Bonita Beach con orientación estratégica hacia el oeste para contemplar cada atardecer sobre el mar Caribe. Unidades residenciales con terrazas panorámicas y diseño bioclimático.',
    zone: 'Cap Cana',
    location: 'Campo de Golf Las Iguanas, Cap Cana, República Dominicana',
    gallery: [],
    amenities: ['Beach Club', 'Piscina', 'Rooftop Lounge', 'Seguridad 24/7'],
    highlights: ['Orientación oeste', 'Terrazas panorámicas', 'Acceso a todas las amenidades'],
    availableUnits: 100,
    totalUnits: 100,
    commissionRate: 5,
  },
  {
    id: -8203,
    slug: 'beach-bonita-beach',
    name: 'Beach Fase 3 — Bonita Beach',
    delivery: 'Diciembre 2028',
    startingPrice: 210_000,
    image: '/paridera/beach/fachada.jpg',
    heroImage: '/paridera/beach/fachada.jpg',
    shortDescription: 'La fase más exclusiva de Bonita Beach con unidades de mayor metraje y amenidades VIP.',
    description: 'Beach es la cúspide de exclusividad del complejo Bonita Beach, con acabados ultra-premium y acceso prioritario a todos los servicios de hospitalidad.',
    zone: 'Cap Cana',
    location: 'Campo de Golf Las Iguanas, Cap Cana, República Dominicana',
    gallery: [],
    amenities: ['Beach Club VIP', 'Piscina Privada', 'Concierge Exclusivo'],
    highlights: ['Fase más exclusiva', 'Metrajes generosos', 'Respaldo fiduciario'],
    availableUnits: 80,
    totalUnits: 80,
    commissionRate: 5,
  },
  {
    id: -8204,
    slug: 'villas-bonita-beach',
    name: 'Villas Bonita Beach',
    delivery: 'Junio 2028',
    startingPrice: 380_000,
    image: '/paridera/villas/villa-01.jpg',
    heroImage: '/paridera/villas/villa-01.jpg',
    shortDescription: 'Colección de villas independientes con jardín privado, piscina propia y acceso al complejo.',
    description: 'Villas independientes de lujo diseñadas para quienes buscan máxima privacidad sin renunciar a las amenidades de resort de Bonita Beach.',
    zone: 'Cap Cana',
    location: 'Campo de Golf Las Iguanas, Cap Cana, República Dominicana',
    gallery: [],
    amenities: ['Piscina Privada', 'Jardín Propio', 'Acceso al Beach Club', 'Seguridad 24h'],
    highlights: ['Villas independientes', 'Piscina y jardín privado', 'Máxima plusvalía'],
    availableUnits: 24,
    totalUnits: 24,
    commissionRate: 5,
  },
  {
    id: -8205,
    slug: 'bonita-golf',
    name: 'Bonita Golf Residences',
    delivery: 'Junio 2029',
    startingPrice: 250_000,
    image: '/paridera/golf/exterior.jpg',
    heroImage: '/paridera/golf/exterior.jpg',
    shortDescription: 'Residencias integradas al campo de golf de clase mundial con vistas al fairway y club house.',
    description: 'Desarrollo residencial integrado armoniosamente al campo de golf de clase mundial del complejo Bonita Beach. Apartamentos y villas con vistas infinitas al verde del fairway.',
    zone: 'Cap Cana',
    location: 'Campo de Golf Las Iguanas, Cap Cana, República Dominicana',
    gallery: [],
    amenities: ['Campo de Golf', 'Club House', 'Putting Green', 'Pro Shop', 'Piscina'],
    highlights: ['Vistas frontales al fairway', 'Membresía preferencial de golf', 'Club House'],
    availableUnits: 60,
    totalUnits: 60,
    commissionRate: 5,
  },
];

// Optimised renders (public/paridera/*); the raw developer files are too heavy to serve.
const PREVIEW_GALLERIES: Record<string, string[]> = {
  'sunrise-bonita-beach': ['/paridera/hub/sunrise-hero.jpg', '/paridera/hub/sunrise-facade2.jpg', '/paridera/hub/sunrise-beach.jpg', '/paridera/hub/sunrise-pool.jpg', '/paridera/hub/sunrise-golf.jpg', '/paridera/hub/sunrise-sala.jpg', '/paridera/hub/sunrise-balcony.jpg', '/paridera/hub/sunrise-living.jpg', '/paridera/hub/sunrise-rooftop.jpg', '/paridera/hub/sunrise-gym.jpg', '/paridera/hub/sunrise-lobby.jpg'],
  'sunset-bonita-beach': ['/paridera/sunset/sunset-01.jpg', '/paridera/sunset/sunset-02.jpg', '/paridera/sunset/sunset-03.jpg'],
  'beach-bonita-beach': ['/paridera/beach/fachada.jpg', '/paridera/beach/playa.jpg', '/paridera/beach/palapa.jpg', '/paridera/beach/lobby.jpg', '/paridera/beach/restaurante.jpg', '/paridera/beach/sala-2ha.jpg'],
  'villas-bonita-beach': ['/paridera/villas/villa-01.jpg', '/paridera/villas/villa-02.jpg', '/paridera/villas/villa-03.jpg', '/paridera/villas/villa-05.jpg', '/paridera/villas/villa-interior.jpg'],
  'bonita-golf': ['/paridera/golf/exterior.jpg', '/paridera/golf/aerea.jpg', '/paridera/golf/piscina.jpg', '/paridera/golf/falls-01.jpg', '/paridera/golf/terraza-1hf.jpg', '/paridera/golf/sala-3h.jpg'],
};

export function toPortalProject(def: ParideraPreviewDefinition): PortalProject {
  const phase = PARIDERA_PHASES.find((p) => p.slug === def.slug);
  const inventory = phase?.inventory;
  const gallery = PREVIEW_GALLERIES[def.slug] ?? def.gallery;
  return {
    id: def.id,
    slug: def.slug,
    name: def.name,
    developer: 'Paridera Investors SRL',
    status: 'Publicado',
    delivery: 'Por definir',
    deliveryDate: null,
    startingPrice: inventory?.fromPrice ?? def.startingPrice,
    currency: 'USD',
    commission: def.commissionRate,
    image: phase?.cover ?? def.image,
    description: phase?.summary ?? def.description,
    shortDescription: phase?.summary ?? def.shortDescription,
    location: def.location,
    zone: def.zone,
    gallery,
    amenities: phase?.amenities ?? def.amenities,
    highlights: phase ? [phase.typologies, ...phase.amenities] : def.highlights,
    availableUnits: inventory?.available ?? def.availableUnits,
    totalUnits: inventory?.total ?? def.totalUnits,
    updatedAt: new Date().toISOString(),
    isLocalPreview: true,
    inventorySourceLabel: inventory ? `Inventario oficial ${inventory.asOf}` : undefined,
    landingTheme: {
      primaryColor: '#004F73',
      accentColor: '#F5C85B',
      fontPreset: 'luxury',
      logoUrl: '/paridera/hub/logo-h-blue.png',
      experiencePreset: 'paridera-bonita-beach',
    },
    paymentPlan: [
      { label: 'Reserva', value: `US$ ${(phase?.reservationUsd ?? PARIDERA_RESERVATION_USD).toLocaleString('en-US')}` },
      ...(phase?.paymentPlans ?? PARIDERA_PAYMENT_PLANS).map((plan) => ({ label: plan.name, value: plan.split })),
    ],
    units: [],
    projectType: 'building',
    lots: [],
    // Brochure and memoria de calidades get attached once they are uploaded to storage.
    documents: [],
  };
}

// Preview data only renders outside production until the projects exist in the
// database; in production the catalog must come from Supabase.
const PREVIEW_ENABLED = process.env.NODE_ENV !== 'production' || process.env.PARIDERA_PREVIEW === '1';

export function getParideraPreviewProjects(): PortalProject[] {
  return PREVIEW_ENABLED ? PARIDERA_PREVIEW_PROJECTS.map(toPortalProject) : [];
}

export function getParideraPreviewProjectBySlug(slug: string): PortalProject | null {
  if (!PREVIEW_ENABLED) return null;
  const clean = slug.trim().toLowerCase();
  const def = PARIDERA_PREVIEW_PROJECTS.find((p) => p.slug === clean);
  return def ? toPortalProject(def) : null;
}
