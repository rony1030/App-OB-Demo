// Paridera Investors SRL — Bonita Beach / Bonita Golf portfolio (Cap Cana).
// Copy comes from the developer's brochures. Unit inventory comes from the
// "Disponibilidad & Precios" PDFs via scripts/paridera/import-availability.py,
// which regenerates paridera-inventory.json whenever a new PDF arrives.

import inventory from './paridera-inventory.json';

export type ParideraPhaseKey = 'sunrise' | 'sunset' | 'beach' | 'villas' | 'golf';
export type ParideraUnitStatus = 'Disponible' | 'Reservado';

export interface ParideraUnit {
  phase: ParideraPhaseKey;
  code: string;
  level: number | string;
  typology: string;
  bedrooms: string;
  view: string;
  interiorM2: number | null;
  terraceM2: number | null;
  gardenM2: number | null;
  totalM2: number | null;
  price: number | null;
  status: ParideraUnitStatus;
}

export const PARIDERA_INVENTORY_DATE = inventory.asOf.split('-').reverse().join('.');

/** Units still on the market (sold units are not shipped to the client). */
export const PARIDERA_UNITS = inventory.units as ParideraUnit[];
const COUNTS = inventory.counts as Record<ParideraPhaseKey, { total: number; Disponible: number; Reservado: number; Vendido: number }>;

function inventoryFor(key: ParideraPhaseKey) {
  const c = COUNTS[key];
  const prices = PARIDERA_UNITS.filter((u) => u.phase === key && u.status === 'Disponible' && u.price).map((u) => u.price as number);
  return {
    total: c.total,
    available: c.Disponible,
    reserved: c.Reservado,
    sold: c.Vendido,
    fromPrice: prices.length ? Math.min(...prices) : 0,
    asOf: PARIDERA_INVENTORY_DATE,
  };
}

export interface ParideraPaymentPlan {
  name: string;
  split: string;
  detail: string;
}

// From "13. PLANES DE PAGO" of each phase. Discounts are left out on purpose:
// they are a negotiation tool, not public terms. Sunrise, Sunset, Beach and Villas share
// the Bonita Beach terms; Bonita Golf has its own two plans.
const BONITA_BEACH_PLANS: ParideraPaymentPlan[] = [
  { name: 'Plan 1', split: '80 / 20', detail: '80% a la firma y 20% a la entrega.' },
  { name: 'Plan 2', split: '50 / 30 / 20', detail: '50% a la firma, 30% en cuotas hasta la entrega y 20% a la entrega.' },
  { name: 'Plan 3', split: '30 / 40 / 30', detail: '30% inicial, 40% en cuotas mensuales, trimestrales o semestrales y 30% a la entrega.' },
];

const BONITA_GOLF_PLANS: ParideraPaymentPlan[] = [
  { name: 'Plan 1', split: '80 / 20', detail: '80% inicial y 20% a la entrega.' },
  { name: 'Plan 2', split: '30 / 40 / 30', detail: '30% a la firma, 40% en cuotas mensuales, trimestrales o semestrales y 30% a la entrega.' },
];

export interface ParideraPhase {
  key: ParideraPhaseKey;
  slug: string;
  name: string;
  /** Full commercial name, e.g. "Bonita Beach Sunrise". */
  fullName: string;
  label: string;
  /** Whether the project already has its own landing on the platform. */
  hasLanding: boolean;
  reservationUsd: number;
  paymentPlans: ParideraPaymentPlan[];
  cover: string;
  summary: string;
  typologies: string;
  amenities: string[];
  inventory: {
    total: number;
    available: number;
    reserved: number;
    sold: number;
    fromPrice: number;
    asOf: string;
  };
}

export const PARIDERA_PHASES: ParideraPhase[] = [
  {
    key: 'sunrise',
    slug: 'sunrise-bonita-beach',
    name: 'Sunrise',
    fullName: 'Bonita Beach Sunrise',
    label: 'Bonita Beach · Fase 1',
    hasLanding: true,
    cover: '/paridera/hub/sunrise-hero.jpg',
    summary:
      'El primer edificio de Bonita Beach Residences: ocho niveles frente a la playa privada, con vistas al mar y al campo de golf Las Iguanas.',
    typologies: '1 Hab + servicio · 2 Hab Master · 2 Hab + Family · 4 Hab',
    amenities: ['Playa privada artificial', 'Rooftop & Lounge 360° en planta 9', 'Gym 360 & Wellness Spa', 'Beach Club & Restaurante'],
    reservationUsd: 5_000,
    paymentPlans: BONITA_BEACH_PLANS,
    inventory: inventoryFor('sunrise'),
  },
  {
    key: 'sunset',
    slug: 'sunset-bonita-beach',
    name: 'Sunset',
    fullName: 'Bonita Beach Sunset',
    label: 'Bonita Beach · Fase 2',
    hasLanding: true,
    cover: '/paridera/hub/sunset-cover.jpg',
    summary:
      'Segunda fase del complejo, con la misma playa de tecnología Crystal Lagoons y unidades amplias de hasta 2 habitaciones + family.',
    typologies: '1 Hab + servicio · 2 Hab Master · 2 Hab + Family',
    amenities: ['Playa Crystal Lagoons', 'Rooftop 360°', 'Pista de pádel', 'Parque infantil'],
    reservationUsd: 5_000,
    paymentPlans: BONITA_BEACH_PLANS,
    inventory: inventoryFor('sunset'),
  },
  {
    key: 'beach',
    slug: 'beach-bonita-beach',
    name: 'Beach',
    fullName: 'Bonita Beach Fase 3',
    label: 'Bonita Beach · Fase 3',
    hasLanding: true,
    cover: '/paridera/hub/beach-cover.jpg',
    summary:
      'Tercera fase de Bonita Beach, frente a la Crystal Lagoon, con lobby, restaurante y palapa de playa propios.',
    typologies: '1 Hab + servicio · 2 Hab Master · 2 Hab + Family',
    amenities: ['Crystal Lagoon', 'Palapa de playa', 'Restaurante', 'Gym 360 & Spa'],
    reservationUsd: 5_000,
    paymentPlans: BONITA_BEACH_PLANS,
    inventory: inventoryFor('beach'),
  },
  {
    key: 'villas',
    slug: 'villas-bonita-beach',
    name: 'Villas',
    fullName: 'Bonita Beach Villas',
    label: 'Bonita Beach · Villas',
    hasLanding: true,
    cover: '/paridera/hub/villas-cover.jpg',
    summary:
      'Diecinueve villas de dos niveles sobre vía privada, con piscina propia, terraza techada y vista a la playa o al golf.',
    typologies: 'Villa 4 Hab + Family · Villa Premium 5 Hab + Family',
    amenities: ['Piscina privada', 'Vía privada con paisajismo', 'Ducha exterior y estudio', 'Acceso al Beach Club'],
    reservationUsd: 15_000,
    paymentPlans: BONITA_BEACH_PLANS,
    inventory: inventoryFor('villas'),
  },
  {
    key: 'golf',
    slug: 'bonita-golf',
    name: 'Bonita Golf',
    fullName: 'Bonita Golf',
    label: 'Bonita Golf Residences',
    hasLanding: true,
    cover: '/paridera/hub/golf-cover.jpg',
    summary:
      'Apartamentos de lujo en el campo de golf Las Iguanas, a pocos pasos de Playa Juanillo, con beneficios de propietario en Cap Cana.',
    typologies: '1 Hab + Family · 2 Hab · 3 Hab + servicio · PH 4 Hab',
    amenities: ['2 piscinas de adultos', 'Gazebo y pádel', 'Coworking', 'Seguridad privada 24h'],
    reservationUsd: 5_000,
    paymentPlans: BONITA_GOLF_PLANS,
    inventory: inventoryFor('golf'),
  },
];

/** Shorthand used by the hub, which presents the Bonita Beach terms. */
export const PARIDERA_PAYMENT_PLANS = BONITA_BEACH_PLANS;
export const PARIDERA_RESERVATION_USD = 5_000;
