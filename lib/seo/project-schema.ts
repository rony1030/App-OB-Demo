import type { PortalProject } from '@/lib/portal-projects';

export interface ProjectSeoConfig {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  canonicalUrl: string;
  schemaType: 'ApartmentComplex' | 'SingleFamilyResidence';
  priceCurrency: string;
  lowPrice?: number;
  highPrice?: number;
  latitude: number;
  longitude: number;
  addressLocality: string;
  addressRegion: string;
  addressCountry: string;
}

const PARIDERA_SEO_SPECS: Record<string, Partial<ProjectSeoConfig>> = {
  'sunrise-bonita-beach': {
    metaTitle: 'Bonita Beach Sunrise Cap Cana | Apartamentos de Lujo frente a Crystal Lagoon y Golf',
    metaDescription: 'Apartamentos de lujo de 1 a 4 habitaciones en Cap Cana, Punta Cana. 15,000 m² de playa privada Crystal Lagoons, Rooftop 360°, vistas al campo de golf Las Iguanas y Confotur.',
    keywords: [
      'Bonita Beach Sunrise',
      'Bonita Beach Cap Cana',
      'Apartamentos en Cap Cana',
      'Crystal Lagoons Cap Cana',
      'Golf Las Iguanas',
      'Inversión inmobiliaria Punta Cana',
      'Condos en venta Cap Cana',
      'Confotur Cap Cana'
    ],
    schemaType: 'ApartmentComplex',
    lowPrice: 456000,
  },
  'sunset-bonita-beach': {
    metaTitle: 'Bonita Beach Sunset Cap Cana | Condos con Playa Privada y Vistas al Golf',
    metaDescription: 'Segunda fase de Bonita Beach en Cap Cana: residencias de 1 y 2 habitaciones frente a Crystal Lagoon de arena blanca y campo de golf Las Iguanas. Preventa con alta plusvalía.',
    keywords: [
      'Bonita Beach Sunset',
      'Bonita Beach Fase 2',
      'Apartamentos Cap Cana frente a la playa',
      'Condos de lujo Cap Cana',
      'Las Iguanas Golf',
      'Crystal Lagoons Punta Cana',
      'Comprar apartamento en Cap Cana'
    ],
    schemaType: 'ApartmentComplex',
    lowPrice: 356000,
  },
  'beach-bonita-beach': {
    metaTitle: 'Bonita Beach Fase 3 Cap Cana | Residencias con Beach Club y Crystal Lagoon',
    metaDescription: 'Tercera fase de Bonita Beach Residences en Cap Cana. Lobby independiente, restaurante privado, palapa de playa y acceso a Crystal Lagoons. Unidades desde US$ 370,000.',
    keywords: [
      'Bonita Beach Fase 3',
      'Bonita Beach Residences',
      'Beach Club Cap Cana',
      'Apartamentos playa Cap Cana',
      'Inversión inmobiliaria República Dominicana',
      'Propiedades en Cap Cana'
    ],
    schemaType: 'ApartmentComplex',
    lowPrice: 370000,
  },
  'villas-bonita-beach': {
    metaTitle: 'Bonita Beach Villas Cap Cana | 19 Villas Exclusivas con Piscina Privada',
    metaDescription: 'Exclusivo conjunto de 19 villas de dos niveles con piscina propia, vía privada y jardín tropical en Cap Cana. Vistas al campo de golf Las Iguanas o a la playa. 4 a 5 habitaciones.',
    keywords: [
      'Bonita Beach Villas',
      'Villas en venta Cap Cana',
      'Villas con piscina privada Cap Cana',
      'Luxury villas Punta Cana',
      'Villas de lujo Cap Cana',
      'Inversión en villas República Dominicana'
    ],
    schemaType: 'SingleFamilyResidence',
    lowPrice: 1970000,
  },
  'bonita-golf': {
    metaTitle: 'Bonita Golf Residences Cap Cana | Apartamentos de Lujo en Campo Las Iguanas',
    metaDescription: '160 apartamentos residenciales de lujo de 1 a 4 habitaciones en el campo de golf Las Iguanas, a 400 m de Playa Juanillo en Cap Cana. 2 piscinas, pádel, coworking y Confotur.',
    keywords: [
      'Bonita Golf Residences',
      'Bonita Golf Cap Cana',
      'Apartamentos campo de golf Cap Cana',
      'Las Iguanas Golf Cap Cana',
      'Playa Juanillo Cap Cana',
      'Golf condos Punta Cana',
      'Inversión Cap Cana'
    ],
    schemaType: 'ApartmentComplex',
    lowPrice: 625000,
  },
};

export function getProjectSeoSpecs(slug: string, project?: PortalProject | null): ProjectSeoConfig {
  const custom = PARIDERA_SEO_SPECS[slug] || {};
  const baseName = project?.name || slug;
  const baseLoc = project?.location || 'Cap Cana, Punta Cana';

  return {
    metaTitle: custom.metaTitle || `${baseName} · Ventas Oficiales en ${baseLoc} | Disponibilidad en Vivo`,
    metaDescription:
      custom.metaDescription ||
      project?.shortDescription ||
      `Descubre ${baseName} en ${baseLoc}. Propiedades exclusivas con alta plusvalía, entrega garantizada y planes de pago flexibles.`,
    keywords: custom.keywords || [baseName, baseLoc, 'Bienes Raíces Punta Cana', 'Inversión Inmobiliaria', 'OB Brokers'],
    canonicalUrl: `https://brokers.osvaldobello.com/proyectos/${slug}`,
    schemaType: custom.schemaType || 'ApartmentComplex',
    priceCurrency: 'USD',
    lowPrice: custom.lowPrice || project?.startingPrice || undefined,
    latitude: 18.4984,
    longitude: -68.4125,
    addressLocality: 'Cap Cana',
    addressRegion: 'La Altagracia',
    addressCountry: 'DO',
  };
}

export function generateProjectJsonLd(project: PortalProject, specs: ProjectSeoConfig) {
  const images = (project.gallery && project.gallery.length > 0)
    ? project.gallery
    : project.image
    ? [project.image]
    : [];

  const fullImages = images.map((img: string) =>
    img.startsWith('http') ? img : `https://brokers.osvaldobello.com${img}`
  );

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': specs.schemaType,
        '@id': `${specs.canonicalUrl}#project`,
        name: project.name,
        description: specs.metaDescription,
        url: specs.canonicalUrl,
        image: fullImages,
        address: {
          '@type': 'PostalAddress',
          addressLocality: specs.addressLocality,
          addressRegion: specs.addressRegion,
          addressCountry: specs.addressCountry,
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: specs.latitude,
          longitude: specs.longitude,
        },
        ...(specs.lowPrice
          ? {
              offers: {
                '@type': 'AggregateOffer',
                priceCurrency: specs.priceCurrency,
                lowPrice: specs.lowPrice,
                offerCount: project.availableUnits || undefined,
                availability: (project.availableUnits && project.availableUnits > 0)
                  ? 'https://schema.org/InStock'
                  : 'https://schema.org/PreOrder',
              },
            }
          : {}),
        amenityFeature: (project.amenities || []).map((amenity) => ({
          '@type': 'LocationFeatureSpecification',
          name: amenity,
          value: true,
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Inicio',
            item: 'https://brokers.osvaldobello.com',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Proyectos',
            item: 'https://brokers.osvaldobello.com/proyectos',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: project.name,
            item: specs.canonicalUrl,
          },
        ],
      },
    ],
  };
}
