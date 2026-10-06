export interface TypologyPricingLevel {
  key: string;
  label: string;
  labelEn?: string;
  labelFr?: string;
  inventoryFilter: string;
  floor?: number;
  fallbackPrice: number;
  accent?: boolean;
}

export interface ProjectVillaTypology {
  id: string;
  key: string; // matches column in spreadsheet, e.g. "ESMERALDA", "PERLA", "AMBAR"
  name: string;
  nameEn?: string;
  nameFr?: string;
  tagline: string;
  taglineEn?: string;
  taglineFr?: string;
  startingPrice: number;
  constructionAreaSqm: number;
  lotRangeSqm: string;
  bedrooms: number;
  bathrooms: number;
  parkingSpaces: number;
  levels: number;
  image: string;
  floorPlanImage: string;
  badge: string;
  badgeColor: string;
  description: string;
  descriptionEn?: string;
  descriptionFr?: string;
  features: string[];
  spaces: { name: string; area: string }[];
  accentColor?: string;
  pricingLevels?: TypologyPricingLevel[];
  whatsappMessage?: string;
  whatsappMessageEn?: string;
  whatsappMessageFr?: string;
}

export interface TypologyAddon {
  id: string;
  name: string;
  price?: number;
  priceLabel?: string;
  description: string;
  badge?: string;
}

export const CIPRES_OPTIONAL_ADDONS: TypologyAddon[] = [
  {
    id: 'picuzzi',
    name: 'Piscina / Picuzzi Privado',
    priceLabel: 'Costo Adicional',
    description:
      'Piscina o picuzzi privado en concreto armado con revestimiento vitrificado, sistema de filtrado completo, bomba, iluminación LED subacuática y jets de hidromasaje.',
    badge: 'Más Solicitado',
  },
  {
    id: 'pergolado',
    name: 'Pergolado Contemporáneo',
    priceLabel: 'Costo Adicional',
    description:
      'Estructura de sombra contemporánea en madera tratada de alta durabilidad o perfilería estructural para terraza social o área de parqueos.',
    badge: 'Popular',
  },
  {
    id: 'combo',
    name: 'Paquete Piscina + Pergolado',
    priceLabel: 'Costo Adicional',
    description:
      'Equipamiento exterior integral instalado desde la etapa constructiva para entrega coordinada y llave en mano.',
    badge: 'Paquete Completo',
  },
];

export const CIPRES_DEFAULT_FAQS = [
  {
    question: '¿Quién es la constructora y cuál es su trayectoria?',
    answer:
      'La constructora es KYSER, con más de 7 años de experiencia y destacados proyectos desarrollados en la zona este del país: Residencial Acacia, Residencial Orquídea, Residencial Torres y Residencial Praderas en San Pedro de Macorís; y Moriah (Pueblo Bávaro) y Villa La Fe (Circunvalación Domingo Maíz) en Punta Cana.',
  },
  {
    question: '¿Cuál es la fecha de entrega y cuándo inicia la obra?',
    answer:
      'El inicio de obra está pautado a partir de mayo de 2026. La entrega está organizada según la etapa de desarrollo seleccionada: Manzana M4 con entrega estimada a 12 meses y Manzana M8 con entrega estimada a 24 meses.',
  },
  {
    question: '¿Cuáles son las formas y facilidades de pago?',
    answer:
      'El esquema de pago comprende: Reserva formal con US$ 500 (100% reembolsable dentro de los primeros 15 días), 10% a la firma de contrato definitivo, 20% en cuotas durante la construcción y 70% contra entrega. Los planes de pago pueden personalizarse previa solicitud y evaluación.',
  },
  {
    question: '¿Cómo funciona el financiamiento con la cooperativa COHISPANICA?',
    answer:
      'Se puede financiar tanto con la banca comercial como directamente con el proyecto a través de la Cooperativa COHISPANICA, con tasas altamente competitivas con el mercado de préstamos hipotecarios, ágil aprobación y acceso flexible tanto para residentes como para compradores en el exterior.',
  },
  {
    question: '¿Qué incluyen las casas y cuáles son sus terminaciones?',
    answer:
      'Las viviendas incluyen pisos de porcelanato italiano, baños con porcelanato español y grifería europea certificada, piezas sanitarias y mueble en lavamanos, pintura tipo A en paredes y techos, puertas y clósets de madera con cerraduras, ventanas y puertas en perfilería de aluminio, puerta principal de seguridad, muebles de cocina italianos con tope de granito, preinstalación de aire acondicionado y opción de pérgola y picuzzi con costo adicional.',
  },
  {
    question: '¿El proyecto cuenta con permisos y seguridad jurídica?',
    answer:
      'Sí, estatus de permisología 100% aprobado: Uso de Suelo (Ayuntamiento), Ministerio de Turismo (MITUR), Medio Ambiente, CODIA y títulos de propiedad subdivididos e individualizados.',
  },
  {
    question: '¿Se puede construir en el segundo piso?',
    answer:
      'Sí, las casas están estructuralmente preparadas para un segundo piso, siempre y cuando se mantenga la misma arquitectura y lineamientos del residencial.',
  },
  {
    question: '¿Qué amenidades incluye el residencial?',
    answer:
      'Ciprés Residences cuenta con Casa Club, canchas deportivas, parque infantil, extensas áreas verdes, plaza comercial de 3,000 m², residencial totalmente cerrado y acceso controlado 24/7.',
  },
  {
    question: '¿Cuál es el costo de mantenimiento?',
    answer:
      'El costo de mantenimiento aún no está estimado y será fijado formalmente previo a la entrega por la administración del residencial.',
  },
  {
    question: '¿Cómo se gestiona la disponibilidad y el proceso de reserva?',
    answer:
      'La tabla de disponibilidad se actualiza en tiempo real. La reserva se realiza con US$ 500 para bloquear la unidad de tu elección, contando con 15 días con garantía 100% reembolsable mientras se procesa la documentación y se formaliza el contrato con el equipo comercial.',
  },
];

export const CIPRES_RESIDENCES_TYPOLOGIES: Record<string, ProjectVillaTypology> = {
  ESMERALDA: {
    id: 'esmeralda',
    key: 'ESMERALDA',
    name: 'Villa Esmeralda',
    tagline: '61 m² de Construcción · 2 Habitaciones · 1 Baño · 2 Parqueos',
    startingPrice: 116250,
    constructionAreaSqm: 61,
    lotRangeSqm: 'Desde 204 m²',
    bedrooms: 2,
    bathrooms: 1,
    parkingSpaces: 2,
    levels: 1,
    image: '/projects/cipres-residences/gallery/cipres_07.jpeg',
    floorPlanImage: '/projects/cipres-residences/gallery/cipres_01.png',
    badge: 'Modelo Esmeralda',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    description:
      'Vivienda contemporánea de 61 m² de construcción interna neta sobre amplio solar privativo desde 204 m². Diseñada para máxima eficiencia y confort caribeño con preparación para segundo nivel.',
    features: [
      '61 m² de construcción',
      '2 Habitaciones',
      '1 Baño completo',
      'Solar privativo desde 204 m²',
      'Sala y comedor independientes',
      'Cocina con muebles italianos y granito natural',
      'Área de lavado y terraza-patio',
      '2 estacionamientos privados',
      'Estructura antisísmica en formaleta',
      'Preparada para construcción de 2do nivel',
    ],
    spaces: [
      { name: 'Sala y Comedor', area: '18.5 m²' },
      { name: 'Cocina Contemporánea', area: '7.8 m²' },
      { name: 'Dormitorio Principal', area: '14.2 m²' },
      { name: 'Dormitorio Secundario', area: '10.5 m²' },
      { name: 'Baño Completo', area: '3.8 m²' },
      { name: 'Área de Lavado & Terraza', area: '6.2 m²' },
      { name: 'Parqueo Doble', area: '25.0 m²' },
    ],
  },
  PERLA: {
    id: 'perla',
    key: 'PERLA',
    name: 'Villa Perla',
    tagline: '68 m² de Construcción · 2 Habitaciones · 2 Baños',
    startingPrice: 123750,
    constructionAreaSqm: 68,
    lotRangeSqm: 'Desde 204 m²',
    bedrooms: 2,
    bathrooms: 2,
    parkingSpaces: 2,
    levels: 1,
    image: '/projects/cipres-residences/gallery/cipres_08.jpeg',
    floorPlanImage: '/projects/cipres-residences/gallery/cipres_03.png',
    badge: 'Modelo Perla',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    description:
      'Modelo residencial de 68 m² de construcción. Cuenta con 2 habitaciones, 2 baños completos y área para 2 vehículos.',
    features: [
      '68 m² de construcción',
      '2 Habitaciones',
      '2 Baños completos',
      'Parqueo para 2 vehículos',
      'Solar privativo desde 204 m²',
      'Sala espaciosa y comedor formal',
      'Cocina con muebles italianos y meseta en granito',
      'Área de lavado y terraza-patio',
      'Estructura antisísmica en formaleta',
      'Preparada para 2do nivel',
    ],
    spaces: [
      { name: 'Sala y Comedor', area: '20.5 m²' },
      { name: 'Cocina Italiana', area: '8.4 m²' },
      { name: 'Dormitorio Principal + Baño', area: '15.6 m²' },
      { name: 'Dormitorio Secundario', area: '11.0 m²' },
      { name: 'Baño Común', area: '4.0 m²' },
      { name: 'Área de Lavado & Terraza', area: '5.5 m²' },
      { name: 'Parqueo Doble', area: '25.0 m²' },
    ],
  },
  AMBAR: {
    id: 'ambar',
    key: 'AMBAR',
    name: 'Villa Ámbar',
    tagline: '73 m² de Construcción · 3 Habitaciones · 2 Baños',
    startingPrice: 140000,
    constructionAreaSqm: 73,
    lotRangeSqm: 'Desde 204 m²',
    bedrooms: 3,
    bathrooms: 2,
    parkingSpaces: 2,
    levels: 1,
    image: '/projects/cipres-residences/gallery/cipres_09.jpeg',
    floorPlanImage: '/projects/cipres-residences/gallery/cipres_04.png',
    badge: 'Modelo Ámbar (3 Hab)',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    description:
      'Modelo residencial de 73 m² de construcción. Cuenta con 3 habitaciones, 2 baños y área para 2 vehículos.',
    features: [
      '73 m² de construcción',
      '3 Habitaciones',
      '2 Baños completos',
      'Parqueo para 2 vehículos',
      'Solar privativo desde 204 m²',
      'Cocina contemporánea con tope de granito',
      'Área de lavado y terraza social',
      'Estructura antisísmica en formaleta',
      'Opción de pergolado y picuzzi adicional',
    ],
    spaces: [
      { name: 'Sala y Comedor Familiar', area: '24.0 m²' },
      { name: 'Cocina con Isla/Granito', area: '9.5 m²' },
      { name: 'Master Suite + Baño', area: '16.8 m²' },
      { name: 'Dormitorio 2', area: '11.5 m²' },
      { name: 'Dormitorio 3', area: '10.2 m²' },
      { name: 'Baño Secundario', area: '6.0 m²' },
      { name: 'Terraza & Lavado', area: '7.0 m²' },
      { name: 'Parqueo Doble', area: '25.0 m²' },
    ],
  },
};

export function getProjectTypology(
  keyOrName: string,
  customMap?: Record<string, ProjectVillaTypology>
): ProjectVillaTypology | null {
  const map = customMap || CIPRES_RESIDENCES_TYPOLOGIES;
  const normalized = keyOrName
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  for (const [k, typ] of Object.entries(map)) {
    const normK = k.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const normName = typ.name.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    if (normalized.includes(normK) || normK.includes(normalized) || normalized.includes(normName)) {
      return typ;
    }
  }
  return null;
}

export const PROJECT_TYPOLOGIES_KIND = 'document_preview';

export const UVE_RESIDENCES_TYPOLOGIES: Record<string, ProjectVillaTypology> = {
  TIPO_A: {
    id: 'tipo-a',
    key: 'TIPO_A',
    name: 'Apartamento Tipo A',
    nameEn: 'Apartment Type A',
    nameFr: 'Appartement Type A',
    tagline: '96 m² · 2 Habitaciones · 2 Baños · 1 Parqueo Privado',
    taglineEn: '96 m² · 2 Bedrooms · 2 Bathrooms · 1 Private Parking',
    taglineFr: '96 m² · 2 Chambres · 2 Salles de Bain · 1 Parking Privé',
    startingPrice: 134400,
    constructionAreaSqm: 96,
    lotRangeSqm: '96 m²',
    bedrooms: 2,
    bathrooms: 2,
    parkingSpaces: 1,
    levels: 3,
    image: '/projects/uve-residences/type-a.jpeg',
    floorPlanImage: '',
    badge: 'Tipo A',
    badgeColor: '#7C3AED',
    accentColor: '#7C3AED',
    description: 'Consta de sala, comedor, cocina y balcón. Habitación principal con baño privado, closet y acceso directo al balcón. Habitación secundaria con closet y baño completo.',
    descriptionEn: 'Features open living, dining, kitchen, and balcony. Master suite with private bath, closet, and balcony access. Secondary bedroom with full bathroom.',
    descriptionFr: 'Comprend salon, salle à manger, cuisine et balcon. Suite parentale avec salle de bain privée, dressing et accès balcon. Seconde chambre avec salle de bain complète.',
    features: [],
    spaces: [],
    pricingLevels: [
      { key: 'N2', label: '2do Nivel (Estándar con balcón)', labelEn: '2nd Level (Standard with balcony)', labelFr: '2ème Étage (Standard avec balcon)', inventoryFilter: 'Tipo A', floor: 2, fallbackPrice: 144400, accent: true },
      { key: 'N1', label: '1er Nivel (Con patio privado)', labelEn: '1st Level (With private yard)', labelFr: '1er Étage (Avec jardin privatif)', inventoryFilter: 'Tipo A', floor: 1, fallbackPrice: 154400, accent: false },
      { key: 'PH', label: '3er Nivel (Penthouse + Rooftop privado)', labelEn: '3rd Level (Penthouse + Private rooftop)', labelFr: '3ème Étage (Penthouse + Rooftop privé)', inventoryFilter: 'Penthouse Tipo A', fallbackPrice: 157000, accent: false },
    ],
    whatsappMessage: 'Hola! Quisiera más información y planos del Apartamento Tipo A (96 m²) de UVE Residences.',
    whatsappMessageEn: 'Hello! I would like more information and floor plans for Apartment Type A (96 m²) at UVE Residences.',
    whatsappMessageFr: 'Bonjour! Je souhaite plus d\'informations et les plans de l\'appartement Type A (96 m²) à UVE Residences.',
  },
  TIPO_B: {
    id: 'tipo-b',
    key: 'TIPO_B',
    name: 'Apartamento Tipo B',
    nameEn: 'Apartment Type B',
    nameFr: 'Appartement Type B',
    tagline: '115 m² · 2 Habitaciones · 2 Baños · 1 Parqueo Privado',
    taglineEn: '115 m² · 2 Bedrooms · 2 Bathrooms · 1 Private Parking',
    taglineFr: '115 m² · 2 Chambres · 2 Salles de Bain · 1 Parking Privé',
    startingPrice: 161000,
    constructionAreaSqm: 115,
    lotRangeSqm: '115 m²',
    bedrooms: 2,
    bathrooms: 2,
    parkingSpaces: 1,
    levels: 3,
    image: '/projects/uve-residences/type-b.jpeg',
    floorPlanImage: '',
    badge: 'Tipo B',
    badgeColor: '#0284C7',
    accentColor: '#0284C7',
    description: 'Consta de sala amplia, comedor, cocina y balcón terraza extendido. Habitación principal con baño privado, closet y acceso al balcón. Habitación secundaria con closet y baño completo.',
    descriptionEn: 'Features expansive living room, dining area, kitchen, and extended terrace balcony. Master suite with private bath, closet, and balcony access. Secondary bedroom with full bathroom.',
    descriptionFr: 'Offre un vaste salon, salle à manger, cuisine et grande terrasse balcon. Suite parentale avec salle de bain, placard et accès balcon. Seconde chambre avec salle de bain complète.',
    features: [],
    spaces: [],
    pricingLevels: [
      { key: 'N2', label: '2do Nivel (Estándar con balcón amplio)', labelEn: '2nd Level (Standard with large balcony)', labelFr: '2ème Étage (Standard avec grand balcon)', inventoryFilter: 'Tipo B', floor: 2, fallbackPrice: 181000, accent: true },
      { key: 'N1', label: '1er Nivel (Con patio privado amplio)', labelEn: '1st Level (With large private yard)', labelFr: '1er Étage (Avec grand jardin privatif)', inventoryFilter: 'Tipo B', floor: 1, fallbackPrice: 171000, accent: false },
      { key: 'PH', label: '3er Nivel (Penthouse + 115 m² Rooftop)', labelEn: '3rd Level (Penthouse + 115 m² Rooftop)', labelFr: '3ème Étage (Penthouse + 115 m² Rooftop)', inventoryFilter: 'Penthouse Tipo B', fallbackPrice: 194000, accent: false },
    ],
    whatsappMessage: 'Hola! Quisiera más información y planos del Apartamento Tipo B (115 m²) de UVE Residences.',
    whatsappMessageEn: 'Hello! I would like more information and floor plans for Apartment Type B (115 m²) at UVE Residences.',
    whatsappMessageFr: 'Bonjour! Je souhaite plus d\'informations et les plans de l\'appartement Type B (115 m²) à UVE Residences.',
  },
};
