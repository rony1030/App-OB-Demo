import 'server-only';

import { DEMO_PORTAL_PROJECT_VILLAS } from '@/lib/data/demo-villas-project';
import type { PortalProject } from '@/lib/portal-projects';

const copy = (slug: string, name: string, description: string, shortDescription: string, image: string, price: number, delivery: string): PortalProject => ({
  ...structuredClone(DEMO_PORTAL_PROJECT_VILLAS),
  id: slug === 'villas-en-punta-cana' ? 39 : slug === 'villas-bahia-coral' ? 9401 : slug === 'apartamentos-brisa-caribe' ? 9402 : 9403,
  slug,
  name,
  description,
  shortDescription,
  image,
  startingPrice: price,
  delivery,
  deliveryDate: slug === 'villas-en-punta-cana' ? '2026-12-31' : slug === 'villas-bahia-coral' ? '2027-12-31' : slug === 'apartamentos-brisa-caribe' ? '2028-06-30' : '2028-03-31',
  location: 'Punta Cana, República Dominicana',
  developer: 'Desarrollos Costa Serena',
  landingAmenities: ['Piscina', 'Seguridad 24 horas', 'Áreas sociales', 'Jardines', 'Zona infantil'],
  amenities: ['Piscina', 'Seguridad 24 horas', 'Áreas sociales', 'Jardines', 'Zona infantil'],
  highlights: ['Espacios residenciales contemporáneos', 'Reserva de US$ 3,000', 'Plan de pago 20% / 40% / 40%'],
  paymentPlan: [{ label: 'Reserva', value: 'US$ 3,000' }, { label: 'Inicial', value: '20%' }, { label: 'Durante construcción', value: '40%' }, { label: 'Contra entrega', value: '40%' }],
  googleSheetUrl: null,
  digitalFolderUrl: null,
  sourceUrl: undefined,
  gallery: [image],
  documents: [],
  typologies: DEMO_PORTAL_PROJECT_VILLAS.typologies?.map((item, index) => ({ ...item, image, floorPlanImage: undefined, name: `${slug.startsWith('apartamentos') ? 'Apartamento' : slug.startsWith('casas') ? 'Casa' : 'Villa'} ${index + 1}`, startingPrice: price + index * 30000 })),
  units: DEMO_PORTAL_PROJECT_VILLAS.units.map((item, index) => ({ ...item, id: String((slug === 'villas-en-punta-cana' ? 100 : slug === 'villas-bahia-coral' ? 940100 : slug === 'apartamentos-brisa-caribe' ? 940200 : 940300) + index + 1), unit: `${slug.startsWith('apartamentos') ? 'BC' : slug.startsWith('casas') ? 'CV' : slug === 'villas-bahia-coral' ? 'BA' : 'VC'}-${String(index + 1).padStart(2, '0')}`, price: price + Math.floor(index / 6) * 30000, type: slug.startsWith('apartamentos') ? 'Apartamento' : slug.startsWith('casas') ? 'Casa' : 'Villa' })),
});

export const DEMO_PORTAL_PROJECTS: PortalProject[] = [
  copy('villas-en-punta-cana', 'Villas en Punta Cana', 'Villas independientes con jardines privados y espacios familiares amplios.', 'Villas de 3, 4 y 5 habitaciones con piscina privada.', '/demo-projects/villas-punta-cana.png', 450000, 'Diciembre 2026'),
  copy('villas-bahia-coral', 'Villas Bahía Coral', 'Residencias independientes con piscina privada, jardín tropical y espacios familiares amplios.', 'Villas de 3 y 4 habitaciones cerca de la costa de Punta Cana.', '/demo-projects/villas-bahia-coral.png', 380000, 'Diciembre 2027'),
  copy('apartamentos-brisa-caribe', 'Apartamentos Brisa Caribe', 'Apartamentos contemporáneos con terrazas, áreas sociales y servicios de estilo resort.', 'Apartamentos de 1, 2 y 3 habitaciones con piscina y rooftop.', '/demo-projects/apartamentos-brisa-caribe.png', 165000, 'Junio 2028'),
  copy('casas-campo-verde', 'Casas Campo Verde', 'Casas familiares rodeadas de áreas verdes, con patios privados y espacios flexibles para teletrabajo.', 'Casas de 3 habitaciones en una comunidad residencial tranquila.', '/demo-projects/casas-campo-verde.png', 295000, 'Marzo 2028'),
];

export function getDemoProjectBySlug(slug: string): PortalProject | null {
  return DEMO_PORTAL_PROJECTS.find((project) => project.slug === slug) || null;
}

export function buildDemoDossier(project: PortalProject): Array<Record<string, unknown>> {
  const base = { backgroundColor: '#ffffff', textColor: '#0f172a', accentColor: '#0f172a', showBrokerLogo: true, customBrokerLogoUrl: '/brand/ob-brokers-horizontal-azul-recortado.png', hideBrokerDetails: true, customFooterText: project.name };
  return [
    { ...base, id: 'cover', type: 'cover', title: project.name, body: project.shortDescription, image: project.image, locationLeft: project.location, locationRight: project.delivery },
    { ...base, id: 'concept', type: 'editorial', title: 'Tu próximo hogar', body: project.description, image: project.image },
    { ...base, id: 'amenities', type: 'highlights', title: 'Espacios para disfrutar', extraList: ['Piscina', 'Jardines', 'Seguridad 24 horas', 'Áreas sociales'], image: project.image },
    { ...base, id: 'typologies', type: 'typology', title: 'Elige tu espacio', typologyCards: project.typologies?.map(item => ({ id: item.id, name: item.name, bedrooms: item.bedrooms, bathrooms: item.bathrooms, area: item.totalSqm, image: project.image, minPrice: item.startingPrice })) },
    { ...base, id: 'gallery', type: 'gallery', title: project.name, images: [project.image], galleryGrid: 'single' },
    { ...base, id: 'payment', type: 'payment', title: 'Plan de pago', paymentSteps: [{ label: 'Inicial', value: '20%' }, { label: 'Durante construcción', value: '40%' }, { label: 'Contra entrega', value: '40%' }] },
    { ...base, id: 'contact', type: 'contact', title: 'Conversemos sobre tu inversión', body: 'Horizonte Asesores Inmobiliarios', image: project.image },
  ];
}
