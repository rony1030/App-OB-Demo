export interface BrokerEventVideo {
  type: 'mp4' | 'youtube' | 'vimeo';
  url: string;
  aspectRatio?: '16:9' | '9:16';
  duration?: string;
  thumbnailUrl?: string;
}

export interface BrokerEvent {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: 'Tour Inmobiliario' | 'Lanzamiento' | 'Capacitación' | 'Networking';
  projectName: string;
  projectSlug?: string;
  location: string;
  date: string;
  formattedDate: string;
  readTime?: string;
  attendeesCount: number;
  featured?: boolean;
  isPublished?: boolean;
  coverImage: string;
  video: BrokerEventVideo;
  summary: string;
  description: string;
  highlights: string[];
  gallery?: string[];
  author?: {
    name: string;
    role: string;
    avatar?: string;
  };
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
}

export const INITIAL_BROKER_EVENTS: BrokerEvent[] = [
  {
    id: 'tour-quebec-cana',
    slug: 'tour-quebec-cana',
    title: 'Tour Exclusivo con Brókers: Recorrido Quebec Cana & Cana Rock',
    subtitle: 'Experiencia in situ conociendo los avances de obra, tipologías premium y modelo de rentabilidad para clientes e inversionistas.',
    category: 'Tour Inmobiliario',
    projectName: 'Quebec Cana / Cana Rock',
    projectSlug: 'cana-rock-star',
    location: 'Cana Bay, Punta Cana, Rep. Dominicana',
    date: '2026-09-18',
    formattedDate: '18 de Septiembre, 2026',
    readTime: '4 min de lectura',
    attendeesCount: 38,
    featured: true,
    isPublished: true,
    coverImage: 'https://canarock.info/wp-content/uploads/2022/06/web01-scaled.jpg',
    video: {
      type: 'mp4',
      url: 'https://cdn.coverr.co/videos/coverr-waves-reaching-the-shore-5573/1080p.mp4',
      aspectRatio: '16:9',
      duration: '02:45',
      thumbnailUrl: 'https://canarock.info/wp-content/uploads/2022/06/web01-scaled.jpg',
    },
    summary: 'Más de 35 brókers aliados vivieron en primera persona el dinamismo de Quebec Cana y el ecosistema Cana Bay, conociendo las condiciones comerciales exclusivas para el cierre de temporada.',
    description: `Durante una jornada completa en Cana Bay Resort, nuestro equipo de Master Brokerage guió a una selecta comitiva de brókers por el perímetro de desarrollo de Quebec Cana y los complejos activos de Cana Rock. 

Los participantes pudieron examinar de cerca las terminaciones constructivas, los accesos directos al campo de golf de Hard Rock, las amenidades privadas y las proyecciones de ROI respaldadas por esquemas de renta corta vacacional.

El evento concluyó con un brindis de networking comercial en el club de playa, donde se presentaron comisiones aceleradas y disponibilidad prioritaria para los clientes de nuestra red.`,
    highlights: [
      'Inspección en terreno de unidades modelo y distribución arquitectónica',
      'Desglose del plan de pagos flexibles y esquemas de comisiones preferenciales',
      'Análisis de rentabilidad hotelera y plusvalía en Cana Bay',
      'Sesión de preguntas técnicas con el equipo de ingeniería y ventas'
    ],
    gallery: [
      'https://canarock.info/wp-content/uploads/2022/06/web01-scaled.jpg',
      'https://canarock.info/wp-content/uploads/2022/06/Sala-scaled.jpg',
      'https://canarock.info/wp-content/uploads/2022/07/Exterior-Nocturno-1-web-1-scaled.jpg',
      'https://canarock.info/wp-content/uploads/2021/09/004-2.jpg'
    ],
    author: {
      name: 'Osvaldo Bello Team',
      role: 'Master Brokerage Operations',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
    },
    tags: ['Tour Inmobiliario', 'Quebec Cana', 'Cana Rock', 'Punta Cana', 'Networking Brókers']
  },
  {
    id: 'lanzamiento-cana-rock-universe',
    slug: 'lanzamiento-cana-rock-universe',
    title: 'Presentación Privada: Cana Rock Universe Fase II',
    subtitle: 'Revelación del master plan y apertura de lista cero de preventa con las principales agencias inmobiliarias.',
    category: 'Lanzamiento',
    projectName: 'Cana Rock Universe',
    projectSlug: 'cana-rock-universe',
    location: 'Salón Cancún, Hard Rock Hotel, Punta Cana',
    date: '2026-08-22',
    formattedDate: '22 de Agosto, 2026',
    readTime: '3 min de lectura',
    attendeesCount: 65,
    featured: false,
    isPublished: true,
    coverImage: 'https://canarock.info/wp-content/uploads/2021/09/004-2.jpg',
    video: {
      type: 'mp4',
      url: 'https://cdn.coverr.co/videos/coverr-sunset-on-the-beach-5309/1080p.mp4',
      aspectRatio: '16:9',
      duration: '01:50',
      thumbnailUrl: 'https://canarock.info/wp-content/uploads/2021/09/004-2.jpg',
    },
    summary: 'Convocatoria exclusiva para presentar el Bloque B de Universe, ofreciendo condiciones especiales de lista cero y bonificaciones de reserva inmediata.',
    description: `Una noche diseñada para celebrar el crecimiento de la comunidad de aliados inmobiliarios y presentar de manera oficial la nueva fase de Universe. Con vistas panorámicas y espacios interactivos, los brókers conocieron los nuevos atractivos de bienestar y áreas comerciales integradas al proyecto.`,
    highlights: [
      'Apertura de unidades a precios de preventa lista cero',
      'Presentación de facilidades de financiamiento bancario directo',
      'Materiales de marketing descargables en alta resolución para brókers'
    ],
    gallery: [
      'https://canarock.info/wp-content/uploads/2021/09/004-2.jpg',
      'https://canarock.info/wp-content/uploads/2021/09/002-2.jpg',
      'https://canarock.info/wp-content/uploads/2021/09/001-2.jpg'
    ],
    author: {
      name: 'Comité Comercial OB Brokers',
      role: 'Alianzas Estratégicas'
    },
    tags: ['Lanzamiento', 'Cana Rock Universe', 'Preventa', 'Inversión']
  },
  {
    id: 'masterclass-estrategias-cierre',
    slug: 'masterclass-estrategias-cierre-internacional',
    title: 'Masterclass: Estrategias de Cierre con Compradores Internacionales',
    subtitle: 'Capacitación comercial especializada en captación de inversionistas de Norteamérica y Europa.',
    category: 'Capacitación',
    projectName: 'Cap Cana & Punta Cana Luxury Portfolio',
    location: 'Centro de Negocios OB Brokers & Streaming Online',
    date: '2026-07-15',
    formattedDate: '15 de Julio, 2026',
    readTime: '5 min de lectura',
    attendeesCount: 110,
    featured: false,
    isPublished: true,
    coverImage: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1200&auto=format&fit=crop&q=80',
    video: {
      type: 'mp4',
      url: 'https://cdn.coverr.co/videos/coverr-waves-reaching-the-shore-5573/1080p.mp4',
      aspectRatio: '16:9',
      duration: '03:15',
      thumbnailUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1200&auto=format&fit=crop&q=80',
    },
    summary: 'Taller práctico sobre estructuración fiduciaria, incentivos CONFOTUR y manejo de objeciones para compradores extranjeros en el Caribe.',
    description: `Una sesión intensiva impartida por especialistas legales y tributarios donde los brókers de la red aprendieron a maximizar los beneficios de la Ley CONFOTUR, estructurar cierres a distancia y utilizar las herramientas digitales de OB Brokers para enviar propuestas personalizadas en segundos.`,
    highlights: [
      'Marco legal de compra para extranjeros e incentivos fiscales CONFOTUR',
      'Uso eficiente del generador de propuestas digitales con inventario en vivo',
      'Estrategias de seguimiento por WhatsApp y videollamadas de cierre'
    ],
    tags: ['Capacitación', 'CONFOTUR', 'Ventas Internacionales', 'Legal Inmobiliario']
  }
];
