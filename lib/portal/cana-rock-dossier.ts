import type { PortalProject } from '@/lib/portal-projects';

export type CanaRockProjectKey = 'star' | 'universe' | 'galaxy' | 'stelar';

export interface CanaRockPricingCard {
  title: string;
  price: number;
  kicker?: string;
}

export interface CanaRockProjectMeta {
  key: CanaRockProjectKey;
  name: string;
  subtitle: string;
  heroImage: string;
  images: string[];
  masterPlanImage: string;
  logoUrl: string;
  delivery: string;
  location: string;
  lineaBlanca: string[];
  amenities: string[];
  pricingCards: CanaRockPricingCard[];
  paymentPlan: { label: string; value: string }[];
}

export const CANA_ROCK_PROJECTS: Record<CanaRockProjectKey, CanaRockProjectMeta> = {
  star: {
    key: 'star',
    name: 'Cana Rock Star',
    subtitle: 'UN ESTILO DE VIDA EXCLUSIVO FRENTE AL GOLF',
    heroImage: 'https://canarock.info/wp-content/uploads/2022/06/web01-scaled.jpg',
    images: [
      'https://canarock.info/wp-content/uploads/2022/06/web01-scaled.jpg',
      'https://canarock.info/wp-content/uploads/2022/06/Sala-scaled.jpg',
      'https://canarock.info/wp-content/uploads/2022/06/Sala-Comedor-Cocina-scaled.jpg',
      'https://canarock.info/wp-content/uploads/2022/07/370-1-scaled.jpg',
      'https://canarock.info/wp-content/uploads/2022/07/Exterior-Nocturno-1-web-1-scaled.jpg',
      'https://canarock.info/wp-content/uploads/2022/07/Exterior-Nocturno-Pool-Bar-1-scaled.jpg',
      'https://canarock.info/wp-content/uploads/2022/07/Escaleras-Penthouse-scaled.jpg',
      'https://canarock.info/wp-content/uploads/2022/07/Penthouse-Segundo-Nivel-scaled.jpg',
      'https://canarock.info/wp-content/uploads/2022/07/Lobby-Exterior-scaled.jpg',
      'https://canarock.info/wp-content/uploads/2022/07/Lobby-Interior-scaled.jpg',
      'https://canarock.info/wp-content/uploads/2022/06/web01-scaled.jpg',
      'https://canarock.info/wp-content/uploads/2022/06/Sala-scaled.jpg',
      'https://canarock.info/wp-content/uploads/2022/06/Sala-Comedor-Cocina-scaled.jpg',
      'https://canarock.info/wp-content/uploads/2022/07/370-1-scaled.jpg',
      'https://canarock.info/wp-content/uploads/2022/07/Exterior-Nocturno-1-web-1-scaled.jpg',
      'https://canarock.info/wp-content/uploads/2022/07/Exterior-Nocturno-Pool-Bar-1-scaled.jpg',
      'https://canarock.info/wp-content/uploads/2022/07/Escaleras-Penthouse-scaled.jpg',
      'https://canarock.info/wp-content/uploads/2022/07/Penthouse-Segundo-Nivel-scaled.jpg',
      'https://canarock.info/wp-content/uploads/2022/07/Lobby-Exterior-scaled.jpg',
    ],
    masterPlanImage: '/Cana-Rock-Star-Master-Plan.png',
    logoUrl: 'https://canarock.info/wp-content/uploads/2021/09/logo-star-white.png',
    delivery: 'Listo para Entrega',
    location: 'Cana Bay, Punta Cana',
    lineaBlanca: [
      'Nevera de Acero Inoxidable',
      'Estufa de Inducción con Horno',
      'Extractor de Grasa',
      'Lavadora-Secadora Inteligente 2 en 1',
      'Calentador de Agua Eléctrico',
      'Aires Acondicionados Inverter',
    ],
    amenities: [
      'GYM',
      'VISTAS AL GOLF',
      'APARCAMIENTO',
      'SEGURIDAD 24 HORAS',
      'ASCENSORES',
      'LOBBY PRINCIPAL',
      'ZONA INFANTIL',
      'RESTAURANTE DE AUTOR',
      'BAR DE LA PISCINA',
      'INFINITY POOL',
    ],
    pricingCards: [
      { title: '1 Habitación (Estándar)', price: 266999 },
      { title: '2 Habitaciones (Vista Golf)', price: 315299 },
      { title: '3 Habitaciones / PH', price: 466599 },
    ],
    paymentPlan: [
      { label: 'Reserva', value: 'US$ 3,000' },
      { label: 'Inicial (a la firma)', value: '20%' },
      { label: 'Contra entrega', value: '80%' },
    ],
  },
  universe: {
    key: 'universe',
    name: 'Cana Rock Universe',
    subtitle: 'EL PROYECTO MÁS GRANDE Y EMBLEMÁTICO DE CANA BAY',
    heroImage: 'https://canarock.info/wp-content/uploads/2021/09/004-2.jpg',
    images: [
      'https://canarock.info/wp-content/uploads/2021/09/004-2.jpg',
      'https://canarock.info/wp-content/uploads/2021/09/002-2.jpg',
      'https://canarock.info/wp-content/uploads/2022/02/PH-N1-CR-UNIVERSE-scaled.jpg',
      'https://canarock.info/wp-content/uploads/2022/02/APT-N2-CR-UNIVERSE-scaled.jpg',
      'https://canarock.info/wp-content/uploads/2021/09/001-2.jpg',
      'https://canarock.info/wp-content/uploads/2021/09/003-2.jpg',
      'https://canarock.info/wp-content/uploads/2021/09/005-1.jpg',
      'https://canarock.info/wp-content/uploads/2021/09/006-1.jpg',
      'https://canarock.info/wp-content/uploads/2021/09/007.jpg',
      'https://canarock.info/wp-content/uploads/2021/09/008.jpg',
      'https://canarock.info/wp-content/uploads/2022/02/APT-N1-CR-UNIVERSE-scaled.jpg',
    ],
    masterPlanImage: 'https://canarock.info/wp-content/uploads/2021/09/004-2.jpg',
    logoUrl: 'https://canarock.info/wp-content/uploads/2021/09/Logo-Cana-Rock-Universe.png',
    delivery: 'Bloque A: Listo / Bloque B: Mayo 2027',
    location: 'Cana Bay, Punta Cana',
    lineaBlanca: [
      'Refrigerador de Alta Gama',
      'Estufa Empotrable de Vitrocerámica',
      'Extractor de Olores',
      'Lavadora/Secadora Integrada',
      'Climatización Integral Inverter',
    ],
    amenities: [
      'Piscina central de más de 500 m²',
      'Fitness Center con vista al lago',
      'Restaurante de autor gourmet',
      'Acceso al Cana Bay Beach Club',
      'Vistas al campo de golf Hard Rock',
      'Seguridad privada con monitoreo 24/7',
      'Estacionamiento subterráneo techado',
      'Parqueo reservado para carros de golf',
      'Ascensores en cada edificio',
      'Lobby de recepción contemporáneo',
    ],
    pricingCards: [
      { title: '1 Habitación (Estándar)', price: 199000 },
      { title: '2 Habitaciones (Vista Piscina)', price: 245000 },
      { title: '3 Habitaciones / Penthouse', price: 320000 },
    ],
    paymentPlan: [
      { label: 'Reserva', value: 'US$ 3,000' },
      { label: 'Inicial (a la firma)', value: '20%' },
      { label: 'Durante construcción', value: '40%' },
      { label: 'Contra entrega', value: '40%' },
    ],
  },
  galaxy: {
    key: 'galaxy',
    name: 'Cana Rock Galaxy',
    subtitle: 'ARQUITECTURA VANGUARDISTA Y VISTAS PRIVILEGIADAS AL GOLF',
    heroImage: 'https://canarock.info/wp-content/uploads/2021/09/001-1.jpg',
    images: [
      'https://canarock.info/wp-content/uploads/2021/09/001-1.jpg',
      'https://canarock.info/wp-content/uploads/2021/09/002-1.jpg',
      'https://canarock.info/wp-content/uploads/2021/09/003-1.jpg',
      'https://canarock.info/wp-content/uploads/2022/12/Exterior-2-scaled.jpg',
      'https://canarock.info/wp-content/uploads/2022/12/Exterior-1-scaled.jpg',
      'https://canarock.info/wp-content/uploads/2021/09/004-1.jpg',
    ],
    masterPlanImage: 'https://canarock.info/wp-content/uploads/2021/09/001-1.jpg',
    logoUrl: 'https://canarock.info/wp-content/uploads/2021/09/Logo-Cana-Rock-Galaxy.png',
    delivery: 'Agosto 2026',
    location: 'Cana Bay, Punta Cana',
    lineaBlanca: [
      'Estufa Eléctrica Empotrable',
      'Nevera de doble puerta en Acero',
      'Lavadora/Secadora Digital',
      'Extractor de Humos',
      'Aire Acondicionado Central Inverter',
    ],
    amenities: [
      'Infinity pool con swim-up bar',
      'Gimnasio cardiovascular panorámico',
      'Restaurante de autor en condominio',
      'Vistas panorámicas al mar y al golf',
      'Acceso al Club de Playa Cana Bay',
      'Estacionamiento subterráneo techado',
      'Seguridad privada con acceso biométrico 24/7',
      'Parqueo para carros de golf',
      'Ascensores de última generación',
      'Lobby de diseño con conserjería',
    ],
    pricingCards: [
      { title: '1 Habitación (Estándar)', price: 175000 },
      { title: '2 Habitaciones (Vista Golf)', price: 230000 },
      { title: 'Penthouse Exclusivo', price: 325000 },
    ],
    paymentPlan: [
      { label: 'Reserva', value: 'US$ 3,000' },
      { label: 'Inicial (a la firma)', value: '20%' },
      { label: 'Durante construcción', value: '40%' },
      { label: 'Contra entrega', value: '40%' },
    ],
  },
  stelar: {
    key: 'stelar',
    name: 'Cana Rock Cosmos Stelar',
    subtitle: 'UN OASIS RESIDENCIAL DE ÚLTIMA GENERACIÓN EN CANA BAY',
    heroImage: '/projects/cana-rock-stelar/stelar-hero-bg.jpg',
    images: [
      '/projects/cana-rock-stelar/stelar-hero-bg.jpg',
      '/projects/cana-rock-stelar/stelar-punta-cana.png',
      '/projects/cana-rock-stelar/cosmos-stelar-master-plan.png',
      '/projects/cana-rock-stelar/stelar-piscina-social.png',
      '/projects/cana-rock-stelar/stelar-amenidades.png',
      '/projects/cana-rock-stelar/stelar-pricing-bg.jpg',
      '/projects/cana-rock-stelar/stelar-golf-bg.jpg',
      '/projects/cana-rock-stelar/stelar-beach-bg.jpg',
      '/projects/cana-rock-stelar/stelar-racquet-bg.jpg',
      '/projects/cana-rock-stelar/stelar-aerial-bg.jpg',
      '/projects/cana-rock-stelar/stelar-render-11.jpg',
      '/projects/cana-rock-stelar/stelar-render-12.jpg',
      '/projects/cana-rock-stelar/stelar-render-13.jpg',
      '/projects/cana-rock-stelar/stelar-render-14.jpg',
      '/projects/cana-rock-stelar/stelar-render-15.jpg',
      '/projects/cana-rock-stelar/stelar-render-16.jpg',
      '/projects/cana-rock-stelar/stelar-render-17.jpg',
      '/projects/cana-rock-stelar/stelar-render-18.jpg',
      '/projects/cana-rock-stelar/stelar-render-19.jpg',
      '/projects/cana-rock-stelar/stelar-render-20.jpg',
      '/projects/cana-rock-stelar/stelar-confotur-bg.jpg',
    ],
    masterPlanImage: '/projects/cana-rock-stelar/cosmos-stelar-master-plan.png',
    logoUrl: '/logo-stelar-white.png',
    delivery: 'Diciembre 2027',
    location: 'Cana Bay, Punta Cana',
    lineaBlanca: [
      'Estufa Eléctrica Empotrada',
      'Extractor de Campana',
      'Nevera de Alta Capacidad',
      'Lavadora/Secadora de Torre',
      'Climatizador Inverter Centralizado',
    ],
    amenities: [
      'GIMNASIO',
      'SEGURIDAD 24 HORAS',
      'ASCENSORES',
      'LOBBY',
      'LUGAR PARA EL YOGA',
      'MINIGOLF',
      'ZONA INFANTIL',
      'BAR',
      'RESTAURANTE DE AUTOR',
      'PARQUEO SUBTERRÁNEO',
      'PISCINA',
      'VISTAS AL LAGO Y AL CAMPO DE GOLF',
    ],
    pricingCards: [
      { title: 'Tipología disponible', price: 260099, kicker: 'Desde' },
    ],
    paymentPlan: [
      { label: 'Reserva', value: 'US$ 3,000' },
      { label: 'Inicial (a la firma)', value: '20%' },
      { label: 'Durante construcción', value: '40%' },
      { label: 'Contra entrega', value: '40%' },
    ],
  },
};

export function isCanaRockProject(project: { slug: string; name?: string }): boolean {
  const s = (project.slug || '').toLowerCase();
  const n = (project.name || '').toLowerCase();
  return (
    s.startsWith('cana-rock') ||
    s.includes('canarock') ||
    ['star', 'universe', 'galaxy', 'stelar', 'cosmos'].includes(s) ||
    n.includes('cana rock')
  );
}

export function getCanaRockKey(slug: string): CanaRockProjectKey {
  const s = slug.toLowerCase();
  if (s.includes('star')) return 'star';
  if (s.includes('universe')) return 'universe';
  if (s.includes('galaxy')) return 'galaxy';
  if (s.includes('stelar') || s.includes('cosmos')) return 'stelar';
  return 'star';
}

export const MASTER_PLAN_ZONES = [
  '1. Condos',
  '2. Star',
  '3. Galaxy',
  '4. Universe',
  '5. Terra',
  '6. Cosmos Stelar',
  '7. Espacio Macro Conciertos',
  '8. Racquet Club',
  '9. Hard Rock Hotel',
  '10. Cana Rock Mall',
  '11. Beach Club',
  '12. Hard Rock Golf Club',
  '13. Wellness Center',
];

export const CONNECTIVITY_DISTANCES = [
  'Playa Macao — 7 km',
  'Aeropuerto Internacional Punta Cana (PUJ) — 27 km',
  'Blue Mall Punta Cana — 27 km',
  'DownTown Punta Cana — 17 km',
  'Aeropuerto Internacional La Romana (LRM) — 93 km',
  'Aeropuerto Internacional Las Américas (SDQ) — 191 km',
];

export const CONFOTUR_BENEFITS = [
  'Exención del 3% del Impuesto de Transferencia sobre la primera transferencia inmobiliaria.',
  'Exención del 1% anual del Impuesto sobre la Propiedad Inmobiliaria (IPI) por 15 años.',
  'Exención de impuestos sobre dividendos e intereses en el sector de desarrollo turístico.',
  'Alto potencial de plusvalía y exención fiscal total de rentabilidad por alquiler vacacional.',
];

/**
 * Dynamically derives real typologies and prices from project.units inventory.
 * Falls back to project.startingPrice or predefined meta cards if units are unavailable.
 */
export function derivePricingCards(
  project: PortalProject,
  fallbackCards: CanaRockPricingCard[] = []
): CanaRockPricingCard[] {
  const units = project.units || [];
  if (units.length === 0) {
    if (fallbackCards && fallbackCards.length > 0) return fallbackCards;
    if (project.startingPrice && project.startingPrice > 0) {
      return [{ title: 'Unidades Residenciales', price: project.startingPrice, kicker: 'A partir de' }];
    }
    return [];
  }

  // Filter available units
  const available = units.filter(
    (u) => u.status === 'Disponible' || (u.status as string) === 'available' || !u.status
  );
  const pool = available.length > 0 ? available : units;

  const groups: Record<
    string,
    { title: string; minPrice: number; count: number; order: number }
  > = {};

  for (const u of pool) {
    if (!u.price || u.price <= 0) continue;

    const lowerType = (u.type || '').toLowerCase();
    const isPH = lowerType.includes('penthouse') || lowerType.includes('ph');
    const isSwimOut = lowerType.includes('swim');

    let key = '';
    let title = '';
    let order = 1;

    if (isPH) {
      key = 'ph';
      title = u.bedrooms ? `Penthouse (${u.bedrooms} Habs)` : 'Penthouse Exclusivo';
      order = 4;
    } else if (
      u.bedrooms === 1 ||
      lowerType.includes('1 hab') ||
      lowerType.includes('1 bed') ||
      lowerType.includes('1 dorm')
    ) {
      key = '1hab';
      title = '1 Habitación (Estándar)';
      order = 1;
    } else if (
      u.bedrooms === 2 ||
      lowerType.includes('2 hab') ||
      lowerType.includes('2 bed') ||
      lowerType.includes('2 dorm')
    ) {
      key = isSwimOut ? '2hab-swim' : '2hab';
      title = isSwimOut ? '2 Habitaciones (Swim Out)' : '2 Habitaciones (Vista Golf)';
      order = isSwimOut ? 2.5 : 2;
    } else if (
      u.bedrooms >= 3 ||
      lowerType.includes('3 hab') ||
      lowerType.includes('3 bed') ||
      lowerType.includes('3 dorm')
    ) {
      key = '3hab';
      title = `${u.bedrooms || 3} Habitaciones`;
      order = 3;
    } else if (u.type && u.type !== 'Apartamento' && u.type !== 'Tipología por definir') {
      key = lowerType;
      title = u.type;
      order = 5;
    } else {
      key = 'suite';
      title = 'Suite Residencial';
      order = 6;
    }

    if (!groups[key]) {
      groups[key] = { title, minPrice: u.price, count: 1, order };
    } else {
      groups[key].count += 1;
      if (u.price < groups[key].minPrice) {
        groups[key].minPrice = u.price;
      }
    }
  }

  const sortedGroups = Object.values(groups).sort((a, b) => a.order - b.order || a.minPrice - b.minPrice);

  if (sortedGroups.length > 0) {
    return sortedGroups.map((g) => ({
      title: g.title,
      price: g.minPrice,
      kicker: `${g.count} unidad${g.count > 1 ? 'es' : ''} disponible${g.count > 1 ? 's' : ''}`,
    }));
  }

  if (fallbackCards && fallbackCards.length > 0) return fallbackCards;
  if (project.startingPrice && project.startingPrice > 0) {
    return [{ title: 'Unidades Residenciales', price: project.startingPrice, kicker: 'A partir de' }];
  }
  return [];
}

/**
 * Builds the official dossier blocks matching Brochure_star_ES.pdf (30 landscape slides)
 */
export function buildCanaRockDossierBlocks(project: PortalProject) {
  const key = getCanaRockKey(project.slug);
  const meta = CANA_ROCK_PROJECTS[key];

  const primaryImage = project.image || meta.heroImage;
  const galleryImages =
    project.gallery && project.gallery.length > 0
      ? project.gallery
      : meta.images && meta.images.length > 0
      ? meta.images
      : [primaryImage];
  const projectAmenities =
    project.amenities && project.amenities.length > 0
      ? project.amenities
      : meta.amenities;
  const pricingCards = derivePricingCards(project, meta.pricingCards);
  const availableCount = (project.units || []).filter(
    (u) => u.status === 'Disponible' || (u.status as string) === 'available'
  ).length;
  const availabilityBody =
    availableCount > 0
      ? `Inventario verificado: ${availableCount} unidades disponibles en tiempo real. Todos los precios están expresados en dólares americanos (USD):`
      : 'Disponibilidad actualizada en tiempo real según el inventario oficial de la constructora. Todos los precios están expresados en dólares americanos (USD):';

  // If the project is Cana Rock Cosmos Stelar, build the exact 21 official slides matching Brochure Cana Rock Stelar ES.pdf
  if (key === 'stelar') {
    return [
      // PÁG 1: Portada (Luxury Editorial Split Cover)
      {
        id: 'cr-cover',
        type: 'cover',
        title: project.name || meta.name,
        body:
          project.shortDescription ||
          project.description ||
          'Ubicado en el prestigioso complejo de Cana Bay en Punta Cana. Un desarrollo residencial boutique de ultra-lujo diseñado para elevar tus sentidos.',
        kicker: 'CANA ROCK COSMOS STELAR',
        subHeader: 'BROCHURE OFICIAL DE VENTAS',
        locationLeft: project.location || meta.location,
        locationRight: project.delivery || meta.delivery,
        projectLogoUrl: meta.logoUrl,
        layout: 'split-right',
        backgroundType: 'solid',
        backgroundColor: '#ffffff',
        textColor: '#0f172a',
        accentColor: '#d4af37',
        fontFamily: 'serif',
        image: '/projects/cana-rock-stelar/stelar-hero-bg.jpg',
        images: ['/projects/cana-rock-stelar/stelar-hero-bg.jpg'],
        imageFit: 'cover',
        imagePosition: 'center',
        overlayOpacity: 0,
        titleSize: 52,
        bodySize: 13,
        padding: 40,
        minHeight: 820,
        showDisclaimer: false,
        disclaimer: '',
        disclaimerColor: '#94a3b8',
        disclaimerSize: 8,
      },

      // PÁG 2: Punta Cana: Paraíso en el Caribe
      {
        id: 'cr-punta-cana',
        type: 'text',
        title: 'Punta Cana: Paraíso en el Caribe',
        body: 'Punta Cana es el principal destino turístico de la República Dominicana y uno de los más importantes del Caribe. Se sitúa en un cabo al Este del país y en sus playas alberga numerosos hoteles especializados en el turismo internacional y el todo incluido.\n\nEste territorio posee una localización privilegiada, ya que sus costas quedan bañadas al Norte por el Océano Atlántico y al Sur por el Mar Caribe.',
        kicker: 'EL PRINCIPAL DESTINO TURÍSTICO DE LA REGIÓN',
        layout: 'split-right',
        backgroundType: 'solid',
        backgroundColor: '#fcfbf9',
        textColor: '#0f172a',
        accentColor: '#d4af37',
        fontFamily: 'serif',
        image: '/projects/cana-rock-stelar/stelar-punta-cana.png',
        images: ['/projects/cana-rock-stelar/stelar-punta-cana.png'],
        imageFit: 'contain',
        imagePosition: 'center',
        overlayOpacity: 0,
        titleSize: 34,
        bodySize: 13,
        padding: 48,
        minHeight: 820,
        showDisclaimer: false,
        disclaimer: '',
        disclaimerColor: '#94a3b8',
        disclaimerSize: 8,
      },

      // PÁG 3: Master Plan del Proyecto (Sin pastillas genéricas, imagen aérea de Cosmos Stelar en Cana Bay a la izquierda)
      {
        id: 'cr-master-plan',
        type: 'highlights',
        title: 'Master Plan del Proyecto',
        body: 'Visualice el diseño general y la organización por bloques del desarrollo de Cana Rock Star. Nuestro Master Plan estratégico garantiza que cada suite residencial disfrute de una orientación ideal y vistas directas a los hoyos de campeonato del campo de golf Jack Nicklaus Signature.',
        kicker: 'PLANIFICACIÓN URBANA Y DISTRIBUCIÓN DE LOTES',
        layout: 'split-left',
        backgroundType: 'solid',
        backgroundColor: '#fcfbf9',
        textColor: '#0f172a',
        accentColor: '#d4af37',
        fontFamily: 'serif',
        image: '/projects/cana-rock-stelar/cosmos-stelar-master-plan.png',
        images: ['/projects/cana-rock-stelar/cosmos-stelar-master-plan.png'],
        imageFit: 'contain',
        imagePosition: 'center',
        overlayOpacity: 0,
        titleSize: 34,
        bodySize: 13,
        padding: 48,
        minHeight: 820,
        showDisclaimer: false,
        disclaimer: '',
        disclaimerColor: '#94a3b8',
        disclaimerSize: 8,
        extraList: [],
        isMasterPlanSlide: true,
      },

      // PÁG 4: Ubicación & Conectividad (Lámina oficial con piscina Cana Bay / beach club a la izquierda)
      {
        id: 'cr-conectividad',
        type: 'highlights',
        title: 'Ubicación & Conectividad',
        body: 'Ubicado estratégicamente en el corazón de Cana Bay para garantizar accesibilidad rápida y segura a todos los atractivos principales y aeropuertos de la zona:',
        kicker: 'DISTANCIAS CLAVE DESDE EL PROYECTO',
        layout: 'split-left',
        backgroundType: 'solid',
        backgroundColor: '#fcfbf9',
        textColor: '#0f172a',
        accentColor: '#d4af37',
        fontFamily: 'serif',
        image: '/projects/cana-rock-stelar/stelar-piscina-social.png',
        images: ['/projects/cana-rock-stelar/stelar-piscina-social.png'],
        imageFit: 'contain',
        imagePosition: 'center',
        overlayOpacity: 0,
        titleSize: 34,
        bodySize: 13,
        padding: 48,
        minHeight: 820,
        showDisclaimer: false,
        disclaimer: '',
        disclaimerColor: '#94a3b8',
        disclaimerSize: 8,
        extraList: CONNECTIVITY_DISTANCES,
      },

      // PÁG 5: Amenidades del Condominio (amenidades oficiales de Cosmos Stelar)
      {
        id: 'cr-amenidades',
        type: 'highlights',
        title: 'Amenidades del Condominio',
        body: 'Es un exclusivo residencial de diseño moderno y enfoque en el bienestar, ubicado en la prestigiosa comunidad privada de Cana Bay, Punta Cana. Con impresionantes vistas al lago y al hoyo 4 del reconocido campo de golf Jack Nicklaus Signature en el Hard Rock Golf Club, este proyecto fusiona elegancia, naturaleza y comodidad. Ofrece apartamentos de 1 habitación con terraza/balcón techado, opciones Swim-out y Pent-houses de 2 niveles, todos equipados con mobiliario básico y línea blanca completa. Disfruta de piscina con bar, gimnasio, área de yoga, minigolf, espacio de coworking y acceso exclusivo al Club de Playa de Cana Bay.',
        kicker: 'UN OASIS RESIDENCIAL LLENO DE EXPERIENCIAS',
        layout: 'split-left',
        backgroundType: 'solid',
        backgroundColor: '#fcfbf9',
        textColor: '#0f172a',
        accentColor: '#d4af37',
        fontFamily: 'serif',
        image: '/projects/cana-rock-stelar/stelar-amenidades.png',
        images: ['/projects/cana-rock-stelar/stelar-amenidades.png'],
        imageFit: 'contain',
        imagePosition: 'center',
        overlayOpacity: 0,
        titleSize: 34,
        bodySize: 11,
        padding: 48,
        minHeight: 820,
        showDisclaimer: false,
        disclaimer: '',
        disclaimerColor: '#94a3b8',
        disclaimerSize: 8,
        extraList: meta.amenities,
        amenityStyle: 'cards',
        amenityColumns: 2,
        amenityIconMode: 'auto',
      },

      // PÁG 6: Precios y Disponibilidad (Lámina flotante oficial con fondo inmersivo)
      {
        id: 'cr-precios',
        type: 'availability',
        title: 'Precios y Disponibilidad',
        body: availabilityBody,
        kicker: 'UNIDADES RESIDENCIALES DISPONIBLES',
        layout: 'full',
        backgroundType: 'image',
        backgroundColor: '#fcfbf9',
        textColor: '#0f172a',
        accentColor: '#d4af37',
        fontFamily: 'serif',
        image: '/projects/cana-rock-stelar/stelar-pricing-bg.jpg',
        images: ['/projects/cana-rock-stelar/stelar-pricing-bg.jpg'],
        imageFit: 'cover',
        imagePosition: 'center',
        overlayOpacity: 0,
        titleSize: 32,
        bodySize: 12,
        padding: 48,
        minHeight: 820,
        showDisclaimer: true,
        disclaimer: 'Precios e inventario sujetos a confirmación de disponibilidad al momento de la reserva.',
        disclaimerColor: '#94a3b8',
        disclaimerSize: 8,
        isPricingSlide: true,
        pricingCards: pricingCards.length
          ? [[...pricingCards].sort((a, b) => a.price - b.price)[0]]
          : [],
      },

      // PÁG 7: Hard Rock Golf Club
      {
        id: 'cr-golf-club',
        type: 'text',
        title: 'Hard Rock Golf Club',
        body: 'Si eres un apasionado del golf, conoce el Hard Rock Golf Club en Cana Bay que alberga 18 hoyos diseñados por Jack Nicklaus. El cual ofrece una impresionante colección de desafiantes pero complacientes juegos para todos los jugadores, independientemente de su nivel de habilidad o experiencia.',
        kicker: 'CAMPO DE GOLF DE CLASE MUNDIAL JACK NICKLAUS',
        layout: 'full',
        backgroundType: 'image',
        backgroundColor: '#0f172a',
        textColor: '#0f172a',
        accentColor: '#d4af37',
        fontFamily: 'serif',
        image: '/projects/cana-rock-stelar/stelar-golf-bg.jpg',
        images: ['/projects/cana-rock-stelar/stelar-golf-bg.jpg'],
        imageFit: 'cover',
        imagePosition: 'center',
        overlayOpacity: 0,
        titleSize: 32,
        bodySize: 13,
        padding: 48,
        minHeight: 820,
        showDisclaimer: false,
        disclaimer: '',
        disclaimerColor: '#94a3b8',
        disclaimerSize: 8,
        isFloatingCard: true,
      },

      // PÁG 8: Cana Bay Beach Club
      {
        id: 'cr-beach-club',
        type: 'text',
        title: 'Cana Bay Beach Club',
        body: 'Disfrute del acceso preferencial al exclusivo club de playa de Cana Bay, donde la arena blanca se funde con las aguas cristalinas del Caribe. Cuenta con piscina infinita frente al mar, restaurante de autor y bar de cócteles premium.',
        kicker: 'CLUB DE PLAYA PRIVADO EXCLUSIVO',
        layout: 'full',
        backgroundType: 'image',
        backgroundColor: '#0f172a',
        textColor: '#0f172a',
        accentColor: '#d4af37',
        fontFamily: 'serif',
        image: '/projects/cana-rock-stelar/stelar-beach-bg.jpg',
        images: ['/projects/cana-rock-stelar/stelar-beach-bg.jpg'],
        imageFit: 'cover',
        imagePosition: 'center',
        overlayOpacity: 0,
        titleSize: 32,
        bodySize: 13,
        padding: 48,
        minHeight: 820,
        showDisclaimer: false,
        disclaimer: '',
        disclaimerColor: '#94a3b8',
        disclaimerSize: 8,
        isFloatingCard: true,
      },

      // PÁG 9: Cana Bay Racquet Club
      {
        id: 'cr-racquet-club',
        type: 'text',
        title: 'Cana Bay Racquet Club',
        body: 'Manténgase activo en el moderno club de raqueta de Cana Bay, equipado con pistas de tenis y pádel iluminadas de última generación. El lugar perfecto para entrenar o jugar partidos amistosos con vecinos y amigos.',
        kicker: 'PISTAS DE TENIS Y PÁDEL DE NIVEL PROFESIONAL',
        layout: 'full',
        backgroundType: 'image',
        backgroundColor: '#0f172a',
        textColor: '#0f172a',
        accentColor: '#d4af37',
        fontFamily: 'serif',
        image: '/projects/cana-rock-stelar/stelar-racquet-bg.jpg',
        images: ['/projects/cana-rock-stelar/stelar-racquet-bg.jpg'],
        imageFit: 'cover',
        imagePosition: 'center',
        overlayOpacity: 0,
        titleSize: 32,
        bodySize: 13,
        padding: 48,
        minHeight: 820,
        showDisclaimer: false,
        disclaimer: '',
        disclaimerColor: '#94a3b8',
        disclaimerSize: 8,
        isFloatingCard: true,
      },

      // PÁG 10: Render Aéreo Complejo
      {
        id: 'cr-photo-aerial',
        type: 'image',
        title: 'Cana Rock Cosmos Stelar · Vista Aérea Panorámica',
        body: 'Perspectiva aérea de los bloques residenciales, piscina central y áreas verdes frente al golf.',
        kicker: 'EXPERIENCIA VISUAL Y ARQUITECTURA',
        layout: 'full',
        backgroundType: 'image',
        backgroundColor: '#0f172a',
        textColor: '#ffffff',
        accentColor: '#d4af37',
        fontFamily: 'serif',
        image: '/projects/cana-rock-stelar/stelar-aerial-bg.jpg',
        images: ['/projects/cana-rock-stelar/stelar-aerial-bg.jpg'],
        imageFit: 'cover',
        imagePosition: 'center',
        overlayOpacity: 0,
        titleSize: 28,
        bodySize: 11,
        padding: 32,
        minHeight: 820,
        showDisclaimer: false,
        disclaimer: '',
        disclaimerColor: '#94a3b8',
        disclaimerSize: 8,
        isGallerySlide: true,
      },

      // PÁG 11 a 19: Renders Oficiales Interiores y Exteriores (Full resolution)
      ...[
        { num: 11, label: 'Sala y Área Social Suite Principal' },
        { num: 12, label: 'Cocina Abierta y Sala Comedor' },
        { num: 13, label: 'Salón con Vista a Balcón Panorámico' },
        { num: 14, label: 'Cocina Moderna de Concepto Integrado' },
        { num: 15, label: 'Espacios Luminosos y Desayunador' },
        { num: 16, label: 'Área de Trabajo y Home Office' },
        { num: 17, label: 'Dormitorio Master con Terraza' },
        { num: 18, label: 'Suite Principal con Vista al Campo de Golf' },
        { num: 19, label: 'Habitación Luminosa con Ventanales Piso-Techo' },
      ].map((render) => ({
        id: `cr-photo-${render.num}`,
        type: 'image' as const,
        title: `Cana Rock Cosmos Stelar · ${render.label}`,
        body: `Diseño contemporáneo, iluminación natural y acabados de lujo de ${render.label}.`,
        kicker: 'INTERIORES Y ACABADOS DE ALTA GAMA',
        layout: 'full' as const,
        backgroundType: 'image' as const,
        backgroundColor: '#0f172a',
        textColor: '#ffffff',
        accentColor: '#d4af37',
        fontFamily: 'serif' as const,
        image: `/projects/cana-rock-stelar/stelar-render-${render.num}.jpg`,
        images: [`/projects/cana-rock-stelar/stelar-render-${render.num}.jpg`],
        imageFit: 'cover' as const,
        imagePosition: 'center',
        overlayOpacity: 0,
        titleSize: 28,
        bodySize: 11,
        padding: 32,
        minHeight: 820,
        showDisclaimer: false,
        disclaimer: '',
        disclaimerColor: '#94a3b8',
        disclaimerSize: 8,
        isGallerySlide: true,
      })),

      // PÁG 20: Línea Blanca Incluida (Con fondo exterior y tarjeta flotante oficial)
      {
        id: 'cr-linea-blanca',
        type: 'highlights',
        title: 'Línea Blanca Incluida',
        body: 'Cada apartamento se entrega completamente amueblado con equipos electrodomésticos empotrados de la más alta eficiencia energética:',
        kicker: 'ESPECIFICACIONES TÉCNICAS Y EQUIPAMIENTO DE ALTA GAMA',
        layout: 'full',
        backgroundType: 'image',
        backgroundColor: '#0f172a',
        textColor: '#0f172a',
        accentColor: '#d4af37',
        fontFamily: 'serif',
        image: '/projects/cana-rock-stelar/stelar-render-20.jpg',
        images: ['/projects/cana-rock-stelar/stelar-render-20.jpg'],
        imageFit: 'cover',
        imagePosition: 'center',
        overlayOpacity: 0,
        titleSize: 32,
        bodySize: 13,
        padding: 48,
        minHeight: 820,
        showDisclaimer: false,
        disclaimer: '',
        disclaimerColor: '#94a3b8',
        disclaimerSize: 8,
        extraList: meta.lineaBlanca,
        isFloatingCard: true,
      },

      // PÁG 21: Beneficios de Ley CONFOTUR (Con fondo aéreo y tarjeta flotante oficial)
      {
        id: 'cr-confotur',
        type: 'highlights',
        title: 'Beneficios de Ley CONFOTUR',
        body: 'Gracias a la aprobación del Consejo de Fomento Turístico (CONFOTUR), este exclusivo proyecto ofrece incentivos impositivos inigualables por 15 años consecutivos:',
        kicker: 'GRANDES BENEFICIOS FISCALES A SU DISPOSICIÓN',
        layout: 'full',
        backgroundType: 'image',
        backgroundColor: '#0f172a',
        textColor: '#0f172a',
        accentColor: '#d4af37',
        fontFamily: 'serif',
        image: '/projects/cana-rock-stelar/stelar-confotur-bg.jpg',
        images: ['/projects/cana-rock-stelar/stelar-confotur-bg.jpg'],
        imageFit: 'cover',
        imagePosition: 'center',
        overlayOpacity: 0,
        titleSize: 32,
        bodySize: 13,
        padding: 48,
        minHeight: 820,
        showDisclaimer: false,
        disclaimer: '',
        disclaimerColor: '#94a3b8',
        disclaimerSize: 8,
        extraList: CONFOTUR_BENEFITS,
        isFloatingCard: true,
      },
    ];
  }

  // Base slides for Star, Universe, Galaxy...
  const blocks: Array<Record<string, unknown>> = [
    // 1. Portada Oficial (Luxury Editorial Split Cover)
    {
      id: 'cr-cover',
      type: 'cover',
      title: project.name || meta.name,
      body:
        project.shortDescription ||
        project.description ||
        'Ubicado en el prestigioso complejo de Cana Bay en Punta Cana. Un desarrollo residencial boutique de ultra-lujo diseñado para elevar tus sentidos.',
      kicker: 'GRUPO CANA ROCK',
      subHeader: 'BROCHURE OFICIAL DE VENTAS',
      locationLeft: project.location || meta.location,
      locationRight: project.delivery || meta.delivery,
      projectLogoUrl: meta.logoUrl,
      layout: 'split-right',
      backgroundType: 'solid',
      backgroundColor: '#ffffff',
      textColor: '#0f172a',
      accentColor: '#d4af37',
      fontFamily: 'serif',
      image: primaryImage,
      images: [primaryImage, ...galleryImages],
      imageFit: 'cover',
      imagePosition: 'center',
      overlayOpacity: 0,
      titleSize: 52,
      bodySize: 13,
      padding: 40,
      minHeight: 820,
      showDisclaimer: false,
      disclaimer: '',
      disclaimerColor: '#94a3b8',
      disclaimerSize: 8,
    },

    // 2. Punta Cana: Paraíso en el Caribe
    {
      id: 'cr-punta-cana',
      type: 'text',
      title: 'Punta Cana: Paraíso en el Caribe',
      body: 'Punta Cana es el principal destino turístico de la República Dominicana y uno de los más importantes del Caribe. Se sitúa en un cabo al Este del país y en sus playas alberga numerosos hoteles especializados en el turismo internacional y el todo incluido.\n\nEste territorio posee una localización privilegiada, ya que sus costas quedan bañadas al Norte por el Océano Atlántico y al Sur por el Mar Caribe.',
      kicker: 'EL PRINCIPAL DESTINO TURÍSTICO DE LA REGIÓN',
      layout: 'split-right',
      backgroundType: 'solid',
      backgroundColor: '#fcfbf9',
      textColor: '#0f172a',
      accentColor: '#d4af37',
      fontFamily: 'serif',
      image: galleryImages[1] || primaryImage,
      images: [galleryImages[1] || primaryImage],
      imageFit: 'cover',
      imagePosition: 'center',
      overlayOpacity: 0,
      titleSize: 34,
      bodySize: 13,
      padding: 48,
      minHeight: 820,
      showDisclaimer: false,
      disclaimer: '',
      disclaimerColor: '#94a3b8',
      disclaimerSize: 8,
    },

    // 3. Master Plan del Proyecto (Exact 2 columns of numbered pills + image)
    {
      id: 'cr-master-plan',
      type: 'highlights',
      title: 'Master Plan del Proyecto',
      body: `Visualice el diseño general y la organización por bloques del desarrollo de ${meta.name}.\n\nNuestro Master Plan estratégico garantiza que cada suite residencial disfrute de una orientación ideal y vistas directas a los hoyos de campeonato del campo de golf Jack Nicklaus Signature.`,
      kicker: 'PLANIFICACIÓN URBANA Y DISTRIBUCIÓN DE LOTES',
      layout: 'split-right',
      backgroundType: 'solid',
      backgroundColor: '#fcfbf9',
      textColor: '#0f172a',
      accentColor: '#d4af37',
      fontFamily: 'serif',
      image: meta.masterPlanImage,
      images: [meta.masterPlanImage],
      imageFit: 'contain',
      imagePosition: 'center',
      overlayOpacity: 0,
      titleSize: 34,
      bodySize: 12,
      padding: 48,
      minHeight: 820,
      showDisclaimer: false,
      disclaimer: '',
      disclaimerColor: '#94a3b8',
      disclaimerSize: 8,
      extraList: MASTER_PLAN_ZONES,
      isMapSlide: true,
      isMasterPlanSlide: true,
    },

    // 4. Ubicación & Conectividad
    {
      id: 'cr-conectividad',
      type: 'highlights',
      title: 'Ubicación & Conectividad',
      body: 'Ubicado estratégicamente en el corazón de Cana Bay para garantizar accesibilidad rápida y segura a todos los atractivos principales y aeropuertos de la zona:',
      kicker: 'DISTANCIAS CLAVE DESDE EL PROYECTO',
      layout: 'split-right',
      backgroundType: 'solid',
      backgroundColor: '#fcfbf9',
      textColor: '#0f172a',
      accentColor: '#d4af37',
      fontFamily: 'serif',
      image: '/conectividad-y-mapa.png',
      images: ['/conectividad-y-mapa.png'],
      imageFit: 'contain',
      imagePosition: 'center',
      overlayOpacity: 0,
      titleSize: 34,
      bodySize: 12,
      padding: 48,
      minHeight: 820,
      showDisclaimer: false,
      disclaimer: '',
      disclaimerColor: '#94a3b8',
      disclaimerSize: 8,
      extraList: CONNECTIVITY_DISTANCES,
      isMapSlide: true,
    },

    // 5. Amenidades del Condominio
    {
      id: 'cr-amenidades',
      type: 'highlights',
      title: 'Amenidades del Condominio',
      body: `${project.name || meta.name} fusiona un diseño arquitectónico moderno con una gama inigualable de facilidades premium para los propietarios y sus huéspedes.`,
      kicker: 'UN OASIS RESIDENCIAL LLENO DE EXPERIENCIAS',
      layout: 'split-right',
      backgroundType: 'solid',
      backgroundColor: '#fcfbf9',
      textColor: '#0f172a',
      accentColor: '#d4af37',
      fontFamily: 'serif',
      image: galleryImages[3] || primaryImage,
      images: [galleryImages[3] || primaryImage],
      imageFit: 'cover',
      imagePosition: 'center',
      overlayOpacity: 0,
      titleSize: 34,
      bodySize: 13,
      padding: 48,
      minHeight: 820,
      showDisclaimer: false,
      disclaimer: '',
      disclaimerColor: '#94a3b8',
      disclaimerSize: 8,
      extraList: projectAmenities,
    },

    // 6. Precios y Disponibilidad (3 luxury navy cards with gold borders)
    {
      id: 'cr-precios',
      type: 'availability',
      title: 'Precios y Disponibilidad',
      body: availabilityBody,
      kicker: 'UNIDADES RESIDENCIALES DISPONIBLES',
      layout: 'vertical-top',
      backgroundType: 'solid',
      backgroundColor: '#fcfbf9',
      textColor: '#0f172a',
      accentColor: '#d4af37',
      fontFamily: 'serif',
      image: galleryImages[2] || primaryImage,
      images: [galleryImages[2] || primaryImage],
      imageFit: 'cover',
      imagePosition: 'center',
      overlayOpacity: 0,
      titleSize: 32,
      bodySize: 12,
      padding: 48,
      minHeight: 820,
      showDisclaimer: true,
      disclaimer: 'Precios e inventario sujetos a confirmación de disponibilidad al momento de la reserva.',
      disclaimerColor: '#94a3b8',
      disclaimerSize: 8,
      isPricingSlide: true,
      pricingCards: pricingCards,
    },

    // Rentabilidad Estimada (Solo Cana Rock Star)
    ...(key === 'star'
      ? [
          {
            id: 'cr-rentabilidad',
            type: 'stats',
            title: 'Rentabilidad Estimada',
            body: 'Proyecciones financieras bajo un modelo de operación hotelera y ocupación estimada del 70% (255 noches por año). Retornos netos proyectados en USD:',
            kicker: 'ANÁLISIS FINANCIERO Y RETORNO DE INVERSIÓN (ROI)',
            layout: 'split-right',
            backgroundType: 'solid',
            backgroundColor: '#fcfbf9',
            textColor: '#0f172a',
            accentColor: '#d4af37',
            fontFamily: 'serif',
            image: '/rentabilidad_es.png',
            images: ['/rentabilidad_es.png'],
            imageFit: 'contain',
            imagePosition: 'center',
            overlayOpacity: 0,
            titleSize: 32,
            bodySize: 12,
            padding: 48,
            minHeight: 820,
            showDisclaimer: true,
            disclaimer:
              'Las proyecciones son estimados basados en el comportamiento del mercado y no constituyen una garantía de rendimiento futuro.',
            disclaimerColor: '#94a3b8',
            disclaimerSize: 8,
            extraList: [
              '1 Habitación: US$ 18,030 ingreso neto anual · ROI estimado 10.02%',
              '2 Habitaciones: US$ 25,600 ingreso neto anual · ROI estimado 11.13%',
              '3 Habitaciones: US$ 33,200 ingreso neto anual · ROI estimado 11.45%',
              'Gestión hotelera integral disponible con operador especializado.',
            ],
            isMapSlide: true,
          },
        ]
      : []),

    // 7. Hard Rock Golf Club
    {
      id: 'cr-golf-club',
      type: 'text',
      title: 'Hard Rock Golf Club',
      body: 'Si eres un apasionado del golf, conoce el Hard Rock Golf Club en Cana Bay que alberga 18 hoyos diseñados por Jack Nicklaus. El cual ofrece una impresionante colección de desafiantes pero complacientes juegos para todos los jugadores, independientemente de su nivel de habilidad o experiencia.',
      kicker: 'CAMPO DE GOLF DE CLASE MUNDIAL JACK NICKLAUS',
      layout: 'split-right',
      backgroundType: 'solid',
      backgroundColor: '#fcfbf9',
      textColor: '#0f172a',
      accentColor: '#d4af37',
      fontFamily: 'serif',
      image: '/campo-de-golf.png',
      images: ['/campo-de-golf.png'],
      imageFit: 'cover',
      imagePosition: 'center',
      overlayOpacity: 0,
      titleSize: 34,
      bodySize: 13,
      padding: 48,
      minHeight: 820,
      showDisclaimer: false,
      disclaimer: '',
      disclaimerColor: '#94a3b8',
      disclaimerSize: 8,
    },

    // 8. Cana Bay Beach Club
    {
      id: 'cr-beach-club',
      type: 'text',
      title: 'Cana Bay Beach Club',
      body: 'Disfrute del acceso preferencial al exclusivo club de playa de Cana Bay, donde la arena blanca se funde con las aguas cristalinas del Caribe. Cuenta con piscina infinita frente al mar, restaurante de autor y bar de cócteles premium.',
      kicker: 'CLUB DE PLAYA PRIVADO EXCLUSIVO',
      layout: 'split-right',
      backgroundType: 'solid',
      backgroundColor: '#fcfbf9',
      textColor: '#0f172a',
      accentColor: '#d4af37',
      fontFamily: 'serif',
      image: galleryImages[4] || primaryImage,
      images: [galleryImages[4] || primaryImage],
      imageFit: 'cover',
      imagePosition: 'center',
      overlayOpacity: 0,
      titleSize: 34,
      bodySize: 13,
      padding: 48,
      minHeight: 820,
      showDisclaimer: false,
      disclaimer: '',
      disclaimerColor: '#94a3b8',
      disclaimerSize: 8,
    },

    // 9. Cana Bay Racquet Club
    {
      id: 'cr-racquet-club',
      type: 'text',
      title: 'Cana Bay Racquet Club',
      body: 'Manténgase activo en el moderno club de raqueta de Cana Bay, equipado con pistas de tenis y pádel iluminadas de última generación. El lugar perfecto para entrenar o jugar partidos amistosos con vecinos y amigos.',
      kicker: 'PISTAS DE TENIS Y PÁDEL DE NIVEL PROFESIONAL',
      layout: 'split-right',
      backgroundType: 'solid',
      backgroundColor: '#fcfbf9',
      textColor: '#0f172a',
      accentColor: '#d4af37',
      fontFamily: 'serif',
      image: galleryImages[5] || primaryImage,
      images: [galleryImages[5] || primaryImage],
      imageFit: 'cover',
      imagePosition: 'center',
      overlayOpacity: 0,
      titleSize: 34,
      bodySize: 13,
      padding: 48,
      minHeight: 820,
      showDisclaimer: false,
      disclaimer: '',
      disclaimerColor: '#94a3b8',
      disclaimerSize: 8,
    },
  ];

  // Slides 10 to 28: Photographic Gallery Slides
  // Star has 19 real photo pages to make 30 total pages
  const gallerySlice = galleryImages.slice(0, 19);
  gallerySlice.forEach((photoUrl, idx) => {
    blocks.push({
      id: `cr-photo-${idx + 1}`,
      type: 'image',
      title: `${meta.name} · Galería Oficial`,
      body: `Fotografía oficial de espacios, acabados y amenidades de ${meta.name}.`,
      kicker: 'EXPERIENCIA VISUAL Y ACABADOS',
      layout: 'full',
      backgroundType: 'image',
      backgroundColor: '#0f172a',
      textColor: '#ffffff',
      accentColor: '#d4af37',
      fontFamily: 'serif',
      image: photoUrl,
      images: [photoUrl],
      imageFit: 'cover',
      imagePosition: 'center',
      overlayOpacity: 0,
      titleSize: 28,
      bodySize: 11,
      padding: 32,
      minHeight: 820,
      showDisclaimer: false,
      disclaimer: '',
      disclaimerColor: '#94a3b8',
      disclaimerSize: 8,
      isGallerySlide: true,
    });
  });

  // Slide 29: Línea Blanca Incluida (Floating White Card on Building Pool photo)
  blocks.push({
    id: 'cr-linea-blanca',
    type: 'highlights',
    title: 'Línea Blanca Incluida',
    body: 'Cada apartamento se entrega completamente equipado con electrodomésticos empotrados de la más alta eficiencia energética y durabilidad:',
    kicker: 'ESPECIFICACIONES TÉCNICAS Y EQUIPAMIENTO DE ALTA GAMA',
    layout: 'full',
    backgroundType: 'image',
    backgroundColor: '#0f172a',
    textColor: '#0f172a',
    accentColor: '#d4af37',
    fontFamily: 'serif',
    image: primaryImage,
    images: [primaryImage],
    imageFit: 'cover',
    imagePosition: 'center',
    overlayOpacity: 25,
    titleSize: 32,
    bodySize: 13,
    padding: 48,
    minHeight: 820,
    showDisclaimer: false,
    disclaimer: '',
    disclaimerColor: '#94a3b8',
    disclaimerSize: 8,
    extraList: meta.lineaBlanca,
    isFloatingCard: true,
  });

  // Slide 30: Beneficios de Ley CONFOTUR (Floating White Card on Building Pool photo)
  blocks.push({
    id: 'cr-confotur',
    type: 'highlights',
    title: 'Beneficios de Ley CONFOTUR',
    body: 'Gracias a la aprobación del Consejo de Fomento Turístico (CONFOTUR), este exclusivo proyecto ofrece incentivos impositivos inigualables por 15 años consecutivos:',
    kicker: 'GRANDES BENEFICIOS FISCALES A SU DISPOSICIÓN',
    layout: 'full',
    backgroundType: 'image',
    backgroundColor: '#0f172a',
    textColor: '#0f172a',
    accentColor: '#d4af37',
    fontFamily: 'serif',
    image: galleryImages[0] || primaryImage,
    images: [galleryImages[0] || primaryImage],
    imageFit: 'cover',
    imagePosition: 'center',
    overlayOpacity: 25,
    titleSize: 32,
    bodySize: 13,
    padding: 48,
    minHeight: 820,
    showDisclaimer: false,
    disclaimer: '',
    disclaimerColor: '#94a3b8',
    disclaimerSize: 8,
    extraList: CONFOTUR_BENEFITS,
    isFloatingCard: true,
  });

  return blocks;
}
