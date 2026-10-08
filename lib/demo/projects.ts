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
  gallery: [image, ...DEMO_PORTAL_PROJECT_VILLAS.gallery.filter((item) => item !== image).slice(0, 5)],
  startingPrice: price,
  delivery,
});

export const DEMO_PORTAL_PROJECTS: PortalProject[] = [
  DEMO_PORTAL_PROJECT_VILLAS,
  copy('villas-bahia-coral', 'Villas Bahía Coral', 'Residencias independientes con piscina privada, jardín tropical y espacios familiares amplios.', 'Villas de 3 y 4 habitaciones cerca de la costa de Punta Cana.', '/demo-projects/villas-bahia-coral.png', 380000, 'Diciembre 2027'),
  copy('apartamentos-brisa-caribe', 'Apartamentos Brisa Caribe', 'Apartamentos contemporáneos con terrazas, áreas sociales y servicios de estilo resort.', 'Apartamentos de 1, 2 y 3 habitaciones con piscina y rooftop.', '/demo-projects/apartamentos-brisa-caribe.png', 165000, 'Junio 2028'),
  copy('casas-campo-verde', 'Casas Campo Verde', 'Casas familiares rodeadas de áreas verdes, con patios privados y espacios flexibles para teletrabajo.', 'Casas de 3 habitaciones en una comunidad residencial tranquila.', '/demo-projects/casas-campo-verde.png', 295000, 'Marzo 2028'),
];

export function getDemoProjectBySlug(slug: string): PortalProject | null {
  return DEMO_PORTAL_PROJECTS.find((project) => project.slug === slug) || null;
}
