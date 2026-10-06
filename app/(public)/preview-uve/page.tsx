import { notFound } from 'next/navigation';
import ProjectSalesLanding from '@/components/landing/ProjectSalesLanding';
import { getDefaultLandingConfig, type ProjectLandingConfig } from '@/lib/data/landing-config';
import type { PortalProject } from '@/lib/portal-projects';
import type { ProjectVillaTypology } from '@/lib/data/cipres-typologies';

const previewProject: PortalProject = {
  id: -1001,
  slug: 'uve-residences',
  name: 'UVE Residences',
  developer: 'Dominican Condos',
  location: 'Brisas de Punta Cana',
  zone: 'Downtown Punta Cana',
  status: 'En construcción',
  delivery: 'Abril 2028',
  deliveryDate: '2028-04-30',
  startingPrice: 144400,
  currency: 'USD',
  commission: 5,
  totalUnits: 21,
  availableUnits: 21,
  description: 'Un proyecto wellness de 21 residencias con estilo resort, a minutos de Downtown, las playas de Bávaro y el Aeropuerto Internacional de Punta Cana.',
  shortDescription: 'Resort Style Living · Wellness · Brisas de Punta Cana',
  image: '/projects/uve-residences/hero.jpeg',
  gallery: [
    '/projects/uve-residences/hero.jpeg',
    '/projects/uve-residences/type-a.jpeg',
    '/projects/uve-residences/type-b.jpeg',
    '/projects/uve-residences/masterplan.png',
  ],
  highlights: ['21 unidades exclusivas', 'Piscina y jacuzzi', 'Shuttle diario a la playa'],
  amenities: ['Piscina', 'Jacuzzi', 'Gimnasio', 'Sauna', 'Yoga', 'BBQ', 'Ascensor', 'Seguridad 24/7'],
  paymentPlan: [
    { label: 'Reserva', value: 'US$ 2,000' },
    { label: 'Inicial', value: '20%' },
    { label: 'Construcción', value: '30%' },
    { label: 'Entrega', value: '50%' },
  ],
  documents: [],
  units: [
    { id: 'preview-a-101', unit: 'A-101', tower: 'UVE', floor: 1, type: 'Apartamento', bedrooms: 2, bathrooms: 2, area: 96, price: 154400, currency: 'USD', status: 'Disponible', isPublic: true },
    { id: 'preview-a-201', unit: 'A-201', tower: 'UVE', floor: 2, type: 'Apartamento', bedrooms: 2, bathrooms: 2, area: 96, price: 144400, currency: 'USD', status: 'Disponible', isPublic: true },
    { id: 'preview-b-301', unit: 'PH-B-301', tower: 'UVE', floor: 3, type: 'Penthouse', bedrooms: 2, bathrooms: 3, area: 115, price: 194000, currency: 'USD', status: 'Disponible', isPublic: true },
  ],
  projectType: 'building',
  lots: [],
  googleSheetUrl: null,
  customColumnsList: [],
  updatedAt: new Date().toISOString(),
};

const previewTypologies: Record<string, ProjectVillaTypology> = {
  TYPE_A: {
    id: 'preview-type-a',
    key: 'TYPE_A',
    name: 'Tipo A',
    constructionAreaSqm: 96,
    bedrooms: 2,
    bathrooms: 2,
    parkingSpaces: 1,
    image: '/projects/uve-residences/type-a.jpeg',
    floorPlanImage: '/projects/uve-residences/masterplan.png',
    startingPrice: 144400,
    badge: 'Apartamento',
    tagline: 'Patio privado en primer nivel o balcón privado.',
    features: ['Sala y comedor', 'Cocina moderna', '2 baños', 'Estacionamiento privado'],
    lotRangeSqm: 'Patio privado en primer nivel',
    levels: 1,
    badgeColor: '#d78f62',
    description: 'Apartamento de 96 m² con distribución funcional, balcón privado y opción de patio en primer nivel.',
    spaces: [],
  },
  TYPE_B: {
    id: 'preview-type-b',
    key: 'TYPE_B',
    name: 'Tipo B',
    constructionAreaSqm: 115,
    bedrooms: 2,
    bathrooms: 2,
    parkingSpaces: 1,
    image: '/projects/uve-residences/type-b.jpeg',
    floorPlanImage: '/projects/uve-residences/masterplan.png',
    startingPrice: 171000,
    badge: 'Apartamento',
    tagline: 'Mayor amplitud y rooftop privado en penthouse.',
    features: ['115 m² de construcción', 'Cocina moderna', '2 baños', 'Rooftop en penthouse'],
    lotRangeSqm: 'Rooftop privado en penthouse',
    levels: 1,
    badgeColor: '#d78f62',
    description: 'Apartamento de 115 m² con mayor amplitud y rooftop privado en la unidad penthouse.',
    spaces: [],
  },
};

export default function UveLocalPreviewPage() {
  if (process.env.NODE_ENV !== 'development') notFound();

  const defaults = getDefaultLandingConfig(previewProject);
  const config: ProjectLandingConfig = {
    ...defaults,
    theme: {
      ...defaults.theme,
      heroMediaUrl: previewProject.image,
      primaryColor: '#0F172A',
      accentColor: '#7C3AED',
      experiencePreset: 'uve-residences',
    },
    heroSlides: previewProject.gallery,
    customGallery: previewProject.gallery,
    locationMapUrl: '/projects/uve-residences/location.png',
    navbarLogoUrl: '/projects/uve-residences/logo.png',
    navbarLogoTextUrl: undefined,
    financial: {
      reserveAmount: 2000,
      contractPercent: 0.2,
      constructionPercent: 0.3,
      deliveryPercent: 0.5,
      availableMonths: [12, 24],
      defaultMonths: 12,
    },
  };

  return <ProjectSalesLanding project={previewProject} config={config} customTypologies={previewTypologies} serverToday={new Date().toISOString().slice(0, 10)} />;
}
