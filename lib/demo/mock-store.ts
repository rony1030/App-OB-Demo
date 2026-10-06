/**
 * Mock Data Store para el entorno DEMO completamente autónomo.
 * Permite ejecutar login, CRM, creación de leads y generación de propuestas/dossiers
 * sin conectar ni afectar la base de datos de producción de Supabase.
 */

export interface DemoUser {
  id: string;
  email: string;
  displayName: string;
  role: 'super_admin' | 'master_broker_admin' | 'agency_admin' | 'broker_agent';
  membershipId: number;
  organization: {
    id: number;
    name: string;
    slug: string;
    kind: string;
  };
}

export const DEMO_USER: DemoUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'soporte@osvaldobello.com',
  displayName: 'Soporte OB Brokers',
  role: 'super_admin',
  membershipId: 1,
  organization: {
    id: 1,
    name: 'Agentes Inmobiliarios',
    slug: 'agentes-inmobiliarios',
    kind: 'agency',
  },
};

export const DEMO_PROJECT_VILLAS = {
  id: 39,
  slug: 'villas-en-punta-cana',
  name: 'Villas en Punta Cana',
  location: 'Punta Cana Village / Cap Cana, República Dominicana',
  zone: 'Punta Cana',
  lifecycle_status: 'construction',
  project_type: 'villas',
  delivery_date: 'Diciembre 2026',
  description: 'Exclusivo complejo residencial de 19 villas de lujo independientes en Punta Cana, diseñadas con los más altos estándares arquitectónicos, jardines tropicales privados, picuzzi/piscina propia y acabados europeos de primera calidad.',
  short_description: '19 villas exclusivas de 3, 4 y 5 habitaciones con piscina privada y amenidades de resort.',
  starting_price: 450000,
  currency: 'USD',
  commission_rate: 5,
  inventory_total_declared: 19,
  inventory_available_declared: 14,
  developer_name: 'Bello Valdez Enterprise',
  brand_profile: {
    name: 'OB Brokers Team',
    primary_color: '#0f172a',
    accent_color: '#2563eb',
    surface_color: '#ffffff',
    logo_path: '/brand/ob-brokers-horizontal-azul-recortado.png',
  },
  amenities: [
    'Piscina & Picuzzi Privado',
    'Seguridad 24/7 y Garita de Acceso',
    'Casa Club & Lounge Social',
    'Canchas de Pádel & Tenis',
    'Sendero Ecológico & Ciclovía',
    'Parque Infantil y Zonas Verdes',
    'Acceso Preferencial a Playa Blanca',
  ],
  highlights: [
    '19 Villas independientes con lotes desde 450 m²',
    'Reserva inmediata con US$ 5,000',
    'Plan de pago flexible: 10% reserva, 40% durante obra, 50% contra entrega',
    'Diseño bioclimático con doble altura y acabados premium',
  ],
  gallery: [
    '/paridera/villas/galeria/01-portada.jpg',
    '/paridera/villas/villa-01.jpg',
    '/paridera/villas/villa-02.jpg',
    '/paridera/villas/villa-03.jpg',
    '/paridera/villas/villa-04.jpg',
    '/paridera/villas/villa-interior.jpg',
    '/paridera/villas/galeria/02.jpg',
    '/paridera/villas/galeria/03.jpg',
    '/paridera/villas/galeria/04.jpg',
    '/paridera/villas/planos/masterplan.jpg',
  ],
  typologies: [
    {
      id: 1,
      name: 'Villa Coral (3H)',
      bedrooms: 3,
      bathrooms: 3.5,
      total_sqm: 285,
      price: 450000,
      description: 'Villa de 3 habitaciones con baño privado, cuarto de servicio, terraza techada y picuzzi incluido.',
    },
    {
      id: 2,
      name: 'Villa Palma (4H)',
      bedrooms: 4,
      bathrooms: 4.5,
      total_sqm: 350,
      price: 520000,
      description: 'Villa familiar de 4 habitaciones, doble sala, cocina italiana integrada y piscina con deck de coralina.',
    },
    {
      id: 3,
      name: 'Villa Esmeralda Royal (5H)',
      bedrooms: 5,
      bathrooms: 5.5,
      total_sqm: 460,
      price: 680000,
      description: 'Mansión contemporánea de 5 suites, master room con jacuzzi privado, terraza panorámica y piscina infinity.',
    },
  ],
  units: [
    { id: 101, unit_code: 'VC-01', typology_id: 1, list_price: 450000, status: 'available' },
    { id: 102, unit_code: 'VC-02', typology_id: 1, list_price: 455000, status: 'available' },
    { id: 103, unit_code: 'VC-03', typology_id: 1, list_price: 460000, status: 'reserved' },
    { id: 104, unit_code: 'VC-04', typology_id: 1, list_price: 450000, status: 'available' },
    { id: 105, unit_code: 'VC-05', typology_id: 1, list_price: 450000, status: 'sold' },
    { id: 106, unit_code: 'VC-06', typology_id: 1, list_price: 455000, status: 'available' },
    { id: 201, unit_code: 'VP-01', typology_id: 2, list_price: 520000, status: 'available' },
    { id: 202, unit_code: 'VP-02', typology_id: 2, list_price: 525000, status: 'available' },
    { id: 203, unit_code: 'VP-03', typology_id: 2, list_price: 530000, status: 'reserved' },
    { id: 204, unit_code: 'VP-04', typology_id: 2, list_price: 520000, status: 'available' },
    { id: 205, unit_code: 'VP-05', typology_id: 2, list_price: 535000, status: 'available' },
    { id: 206, unit_code: 'VP-06', typology_id: 2, list_price: 540000, status: 'sold' },
    { id: 207, unit_code: 'VP-07', typology_id: 2, list_price: 525000, status: 'available' },
    { id: 301, unit_code: 'VE-01', typology_id: 3, list_price: 680000, status: 'available' },
    { id: 302, unit_code: 'VE-02', typology_id: 3, list_price: 690000, status: 'available' },
    { id: 303, unit_code: 'VE-03', typology_id: 3, list_price: 710000, status: 'reserved' },
    { id: 304, unit_code: 'VE-04', typology_id: 3, list_price: 680000, status: 'available' },
    { id: 305, unit_code: 'VE-05', typology_id: 3, list_price: 720000, status: 'available' },
    { id: 306, unit_code: 'VE-06', typology_id: 3, list_price: 700000, status: 'available' },
  ],
};
