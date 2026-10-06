import ProjectSalesLanding from '@/components/landing/ProjectSalesLanding';
import type { PortalProject } from '@/lib/portal-projects';
import type { ProjectLandingConfig } from '@/lib/data/landing-config';
import availability from '@/lib/data/palm-view-availability.json';
import { getPublicProject } from '@/lib/data/projects';
import { getDefaultLandingConfig, getProjectLandingConfig } from '@/lib/data/landing-config';
import { getDynamicProjectTypologies } from '@/lib/data/project-typologies-db';

// The live preview reads request cookies through Supabase and must render per request.
export const dynamic = 'force-dynamic';

const gallery = [
  '/projects/palm-view/gallery/exteriores-01-palm-view-aerea.jpg',
  '/projects/palm-view/gallery/exteriores-06-palm-view-torres.jpg',
  '/projects/palm-view/gallery/amenidades-3-casa-club-green.jpg',
  '/projects/palm-view/gallery/amenidades-piscina-torre-1.jpg',
  '/projects/palm-view/gallery/amenidades-club-raqueta.jpg',
  '/projects/palm-view/gallery/interiores-03-palm-view-cocina.jpg',
  '/projects/palm-view/gallery/interiores-03-palm-view-cocina.jpg',
  '/projects/palm-view/gallery/exteriores-04-palm-view-paseo.jpg',
];

const availablePalmViewPrices = availability.units
  .filter((unit) => unit.status === 'available' && typeof unit.price === 'number' && unit.price > 0)
  .map((unit) => unit.price as number);
const palmViewStartingPrice = availablePalmViewPrices.length ? Math.min(...availablePalmViewPrices) : 0;

const project: PortalProject = {
  id: 0,
  slug: 'palm-view',
  name: 'Palm View Golf & Apartments',
  developer: 'Entorno',
  location: 'Punta Cana, República Dominicana',
  zone: 'Coral Golf Resort',
  status: 'Preventa',
  delivery: 'Abril 2028 · Agosto 2029',
  deliveryDate: '2028-04-01',
  startingPrice: palmViewStartingPrice,
  currency: 'USD',
  commission: 0,
  totalUnits: 275,
  availableUnits: availability.units.filter((unit) => unit.status === 'available').length,
  description: 'Apartamentos con servicios hoteleros y amenidades exclusivas dentro de Coral Golf Resort.',
  shortDescription: 'Golf, naturaleza y una forma más tranquila de vivir en Punta Cana.',
  image: gallery[0],
  gallery,
  highlights: ['275 apartamentos', '18 hoyos de golf', '2 etapas de entrega'],
  amenities: ['Golf', 'Casa Club', 'Playa privada', 'Piscinas', 'Gimnasio', 'Spa'],
  paymentPlan: [
    { label: 'Reserva', value: 'US$2,000' },
    { label: 'Inicial', value: '20%' },
    { label: 'Construcción', value: '40%' },
    { label: 'Entrega', value: '40%' },
  ],
  documents: [],
  typologies: [],
  units: availability.units.map((unit, index) => ({
    id: `palm-view-${unit.tower.toLowerCase().replace(' ', '-')}-${unit.unit}-${index}`,
    typologyId: unit.type,
    unit: unit.unit,
    tower: unit.tower,
    floor: Number(unit.unit.slice(0, 1)),
    type: `Tipo ${unit.type}`,
    bedrooms: unit.bedrooms,
    bathrooms: unit.bathrooms,
    area: unit.areaSqm,
    price: unit.price || 0,
    currency: 'USD',
    status: unit.status === 'available' ? 'Disponible' : unit.status === 'reserved' ? 'Separada' : 'Vendida',
    isPublic: true,
    notes: JSON.stringify({ Etapa: unit.stageLabel, Entrega: unit.delivery, Vista: unit.view }),
  })),
  projectType: 'building',
  lots: [],
  customColumnsList: ['Etapa', 'Entrega', 'Vista'],
  updatedAt: availability.updatedAt,
  isLocalPreview: true,
  inventorySourceLabel: 'Lista de precios Palm View · 01 Septiembre 2026',
};

const config: ProjectLandingConfig = {
  projectId: 0,
  projectSlug: 'palm-view',
  isPublished: true,
  theme: {
    primaryColor: '#21412b',
    accentColor: '#9fbd63',
    fontPreset: 'luxury',
    logoUrl: '/projects/palm-view/logo.svg',
    heroMediaUrl: gallery[0],
    heroMediaType: 'image',
    contactWhatsapp: '18090000000',
    contactEmail: 'ventas@ob-brokers.com',
    experiencePreset: 'palm-view',
  },
  visibility: { hero: true, concept: true, typologies: true, availability: true, specs: true, gallery: true, amenities: true, paymentPlan: true, location: true, contactForm: true, profitability: false },
  hero: { headline: 'Donde la vida toma otro ritmo.', subheadline: project.shortDescription, badgeText: project.location, ctaText: 'Ver disponibilidad', startingPriceText: palmViewStartingPrice ? `Desde US$${palmViewStartingPrice.toLocaleString('en-US')}` : 'Precio a consultar' },
  concept: { title: 'Una pausa que se vuelve hogar.', description: project.description, bullet1: 'Amueblado', bullet2: 'Golf y naturaleza', bullet3: 'Servicios hoteleros' },
  paymentSteps: project.paymentPlan.map((step) => ({ title: step.label, percentage: step.value, description: '' })),
  dns: { customDomain: '', cnameTarget: '', isVerified: false },
  heroSlides: gallery,
  customGallery: gallery,
};

export default async function PalmViewPreviewPage() {
  const liveProject = await getPublicProject('palm-view').catch(() => null);
  if (liveProject) {
    const [liveConfig, liveTypologies] = await Promise.all([
      getProjectLandingConfig(liveProject.id, liveProject).catch(() => getDefaultLandingConfig(liveProject)),
      getDynamicProjectTypologies(liveProject.id, liveProject.slug).catch(() => ({})),
    ]);

    return <ProjectSalesLanding project={liveProject} config={liveConfig} customTypologies={liveTypologies} serverToday={new Date().toISOString().slice(0, 10)} />;
  }

  return <ProjectSalesLanding project={project} config={config} serverToday={new Date().toISOString().slice(0, 10)} />;
}
