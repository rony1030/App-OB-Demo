'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { Phone } from 'lucide-react';
import type { ProjectSalesLandingProps } from './ProjectSalesLanding';
import LeadCaptureForm from '@/components/landing/LeadCaptureForm';
import { getPublicAssetUrl } from '@/lib/supabase/storage';
import ParideraAvailability from '@/components/paridera/ParideraAvailability';
import {
  Eyebrow,
  ParallaxImage,
  ParideraFooter,
  ParideraHeader,
  ParideraShell,
  BONITA_GOLF_BRAND,
  Reveal,
  RollButton,
  WordReveal,
  usd,
  type ParideraBrand,
} from '@/components/paridera/ParideraKit';
import { ParideraAmenities, ParideraHero, ParideraLocation, ParideraPlans, type AmenityItem, type HeroSlide } from '@/components/paridera/ParideraSections';
import { PARIDERA_PHASES, PARIDERA_UNITS, type ParideraPhaseKey } from '@/lib/data/paridera-portfolio';

// The 18 MB render video lives in Supabase Storage (public-assets bucket), not in git.
// Without Supabase env vars (local preview) it falls back to a local copy if present.
const SUNRISE_VIDEO_PATH = 'projects/sunrise-bonita-beach/video/exterior.mp4';
function sunriseVideoUrl() {
  try {
    return getPublicAssetUrl(SUNRISE_VIDEO_PATH);
  } catch {
    return '/paridera/sunrise/video/exterior.mp4';
  }
}

/* ─── Per-development content (from the developer's brochure and plans) ─── */

interface Typology {
  key: string;
  name: string;
  /** Typology labels exactly as they appear in the availability PDF. */
  match: string[];
  interior: number;
  terrace: number;
  plan: string;
  note?: string;
}

interface DevelopmentContent {
  slides: HeroSlide[];
  title: ReactNode;
  intro: string;
  statement: string;
  lead: string;
  facts: { value: string; unit?: string; label: string }[];
  trio: [string, string, string];
  video?: { src: string; poster: string; quote: string };
  typologies?: Typology[];
  levels?: { count: number; image: (level: number) => string };
  amenities?: AmenityItem[];
  finishes?: { group: string; items: { label: string; value: string }[] }[];
  finishesImage?: string;
  typologiesTitle?: ReactNode;
  typologiesAside?: string;
  progress?: { caption: string; images: string[] };
  brand?: ParideraBrand;
  taxFacts?: ReactNode[];
}

// Sunrise, Sunset and Beach share the same memoria de calidades (identical PDF).
const BONITA_BEACH_FINISHES: NonNullable<DevelopmentContent['finishes']> = [
    {
      group: 'Interiores',
      items: [
        { label: 'Pisos', value: 'Travertino Navonna' },
        { label: 'Muros', value: 'Pintura SW 7003 Toque White' },
        { label: 'Puertas', value: 'Sweet Chestnut Marrone o blanco' },
      ],
    },
    {
      group: 'Cocina',
      items: [
        { label: 'Tope y backsplash', value: 'Cuarzo Calacatta Venaoro 2 cm' },
        { label: 'Muebles', value: 'Superior ML Roble Clear · inferior EM Gress' },
        { label: 'Equipamiento', value: 'Placa vitrocerámica 60 cm, horno 60×60, campana telescópica, lavavajillas panelable, nevera 33" y microondas' },
        { label: 'Lavado', value: 'Lavadora y secadora compactas 24"' },
      ],
    },
    {
      group: 'Baños',
      items: [
        { label: 'Grifería', value: 'Lux en latón zinc · mezcladora termostática empotrada' },
        { label: 'Mobiliario', value: 'Mueble color Matt Panna y espejo con luz integrada' },
        { label: 'Sanitarios', value: 'Inodoro cerámico blanco con tanque integrado' },
      ],
    },
  ];

const BONITA_BEACH_INTERIORS: [string, string, string] = [
  '/paridera/hub/sunrise-sala.jpg',
  '/paridera/hub/sunrise-interior-beach.jpg',
  '/paridera/hub/sunrise-bedroom.jpg',
];

const SUNRISE: DevelopmentContent = {
  slides: [
    { src: '/paridera/hub/sunrise-hero.jpg', caption: 'Sunrise frente a la playa privada' },
    { src: '/paridera/hub/sunrise-facade2.jpg', caption: 'Fachada de Sunrise' },
    { src: '/paridera/hub/sunrise-interior-beach.jpg', caption: 'Sala con vista a la playa' },
    { src: '/paridera/hub/sunrise-rooftop.jpg', caption: 'Rooftop 360° · planta 9' },
  ],
  title: (
    <>
      Sunrise, el primer edificio
      <br />
      de <em>Bonita Beach</em>
    </>
  ),
  intro: 'Ocho niveles frente a la playa privada y el campo de golf Las Iguanas, en Cap Cana.',
  statement:
    'Residencias de una a cuatro habitaciones con terraza, vista al mar, al golf o a la playa, y acceso a pie a 15,000 m² de laguna de arena blanca.',
  lead: 'Diseño de GVA Arquitectura, dirección de proyecto de TLDI y una gestión integral de alquileres a cargo de un operador internacional.',
  facts: [
    { value: '8', label: 'niveles residenciales' },
    { value: '9.ª', label: 'planta: rooftop & lounge 360°' },
    { value: '84', unit: 'm²', label: 'desde, con terraza incluida' },
    { value: '447', unit: 'm²', label: 'el penthouse de 4 habitaciones' },
  ],
  trio: ['/paridera/hub/sunrise-sala.jpg', '/paridera/hub/sunrise-balcony.jpg', '/paridera/hub/sunrise-bedroom.jpg'],
  video: {
    src: sunriseVideoUrl(),
    poster: '/paridera/sunrise/video/exterior-poster.jpg',
    quote: 'Abrir la terraza y tener el Caribe, la laguna y el fairway en una sola vista.',
  },
  typologies: [
    { key: '1h', name: '1 Habitación + servicio', match: ['2H (1 Hab + Hab de Servicio)'], interior: 67, terrace: 17, plan: '/paridera/sunrise/planos/1-hab-servicio.jpg' },
    { key: '2m', name: '2 Habitaciones Master', match: ['2 Habitaciones Master'], interior: 91, terrace: 22, plan: '/paridera/sunrise/planos/2-hab-master.jpg', note: 'También en formato de 125 m² interiores' },
    { key: '2s', name: '2 Habitaciones + servicio', match: ['2 Hab + HS'], interior: 91, terrace: 22, plan: '/paridera/sunrise/planos/2-hab-servicio.jpg' },
    { key: '2fa', name: '2 Hab + Family · Tipo A', match: ['2 Hab + Family + Hab de Servicio (A)'], interior: 125, terrace: 33, plan: '/paridera/sunrise/planos/2-hab-family-a.jpg' },
    { key: '2fb', name: '2 Hab + Family · Tipo B', match: ['2 Hab + Family + Hab de Servicio (B)'], interior: 120, terrace: 31, plan: '/paridera/sunrise/planos/2-hab-family-b.jpg' },
    { key: 'ph', name: 'Penthouse 4 Habitaciones', match: ['4 + Hab de Servicio'], interior: 271, terrace: 176, plan: '/paridera/sunrise/planos/ph-4-hab.jpg' },
  ],
  levels: { count: 8, image: (level) => `/paridera/sunrise/niveles/nivel-${level}.jpg` },
  amenities: [
    { title: 'Playa privada Crystal Lagoons', text: '15,000 m² de laguna de arena blanca frente al edificio.', image: '/paridera/hub/sunrise-beach.jpg' },
    { title: 'Rooftop & Lounge 360°', text: 'En la novena planta, con vistas panorámicas al mar y al golf. Único en Cap Cana.', image: '/paridera/hub/sunrise-rooftop.jpg' },
    { title: 'Gym 360 & Wellness Spa', text: 'Gimnasio panorámico con vista al campo y al mar.', image: '/paridera/hub/sunrise-gym.jpg' },
    { title: 'Lobby principal', text: 'Llegada de doble altura con lounge y acceso directo a la playa.', image: '/paridera/hub/sunrise-lobby.jpg' },
    { title: 'Piscina con vista al golf', text: 'Abierta al fairway de Las Iguanas.', image: '/paridera/hub/sunrise-pool.jpg' },
    { title: 'Pádel, parque infantil y BBQ', text: 'Y estación de carga para carritos de golf.', image: '/paridera/hub/sunrise-lobby-ext.jpg' },
  ],
  finishes: BONITA_BEACH_FINISHES,
  finishesImage: '/paridera/hub/sunrise-sala2.jpg',
  typologiesTitle: (
    <>
      Seis formas
      <br />
      <em>de vivir frente al mar</em>
    </>
  ),
};

const SUNSET: DevelopmentContent = {
  slides: [
    { src: '/paridera/sunset/sunset-01.jpg', caption: 'Sunset al atardecer' },
    { src: '/paridera/sunset/sunset-02.jpg', caption: 'Fachada de Sunset' },
    { src: '/paridera/sunset/sunset-03.jpg', caption: 'Sunset y la Crystal Lagoon' },
  ],
  title: (
    <>
      Sunset, la segunda fase
      <br />
      de <em>Bonita Beach</em>
    </>
  ),
  intro: 'Ocho niveles frente a la playa Crystal Lagoons y el campo de golf Las Iguanas, en Cap Cana.',
  statement:
    'Residencias de una y dos habitaciones con terraza, frente a 15,000 m² de laguna de arena blanca y con el mismo rooftop, gym y beach club del complejo.',
  lead: 'Diseño de GVA Arquitectura, dirección de proyecto de TLDI y gestión integral de alquileres a cargo de un operador internacional.',
  facts: [
    { value: '127', label: 'residencias' },
    { value: '8', label: 'niveles residenciales' },
    { value: '84', unit: 'm²', label: 'desde, con terraza incluida' },
    { value: '197', unit: 'm²', label: 'la 2 Hab + Family con terraza' },
  ],
  trio: BONITA_BEACH_INTERIORS,
  typologies: [
    { key: '1h', name: '1 Habitación + servicio', match: ['2H (1 Hab + Hab de Servicio)'], interior: 67, terrace: 17, plan: '/paridera/sunset/planos/1-hab-servicio.jpg' },
    { key: '2m', name: '2 Habitaciones Master', match: ['2 Habitaciones Master'], interior: 91, terrace: 22, plan: '/paridera/sunset/planos/2-hab-master.jpg' },
    { key: '2s', name: '2 Habitaciones + servicio', match: ['2 Hab + HS'], interior: 91, terrace: 22, plan: '/paridera/sunset/planos/2-hab-servicio.jpg' },
    { key: '2f', name: '2 Hab + Family + servicio', match: ['2 Hab + Family + Hab de Servicio'], interior: 151, terrace: 46, plan: '/paridera/sunset/planos/2-hab-family.jpg' },
  ],
  typologiesTitle: (
    <>
      Cuatro tipologías,
      <br />
      <em>una misma vista</em>
    </>
  ),
  levels: { count: 8, image: (level) => `/paridera/sunset/niveles/nivel-${level}.jpg` },
  finishes: BONITA_BEACH_FINISHES,
  finishesImage: '/paridera/hub/sunrise-sala2.jpg',
};

const BEACH: DevelopmentContent = {
  slides: [
    { src: '/paridera/beach/fachada.jpg', caption: 'Fachada de Beach' },
    { src: '/paridera/beach/playa.jpg', caption: 'Beach frente a la Crystal Lagoon' },
    { src: '/paridera/beach/palapa.jpg', caption: 'Palapa de playa' },
    { src: '/paridera/beach/ingreso.jpg', caption: 'Ingreso' },
  ],
  title: (
    <>
      Beach, la tercera fase
      <br />
      de <em>Bonita Beach</em>
    </>
  ),
  intro: 'Ocho niveles frente a la Crystal Lagoon, con lobby, restaurante y palapa de playa propios.',
  statement:
    'Residencias de una y dos habitaciones con terraza, a pasos de la laguna de arena blanca y con acceso a todas las amenidades de Bonita Beach.',
  lead: 'Diseño de GVA Arquitectura, dirección de proyecto de TLDI y gestión integral de alquileres a cargo de un operador internacional.',
  facts: [
    { value: '156', label: 'residencias' },
    { value: '8', label: 'niveles residenciales' },
    { value: '84', unit: 'm²', label: 'desde, con terraza incluida' },
    { value: '157', unit: 'm²', label: 'la 2 Hab + Family con terraza' },
  ],
  trio: ['/paridera/beach/sala-1h.jpg', '/paridera/beach/sala-2ha.jpg', '/paridera/beach/sala-2hb.jpg'],
  typologies: [
    { key: '1h', name: '1 Habitación + servicio', match: ['2H (1 Hab + Hab de Servicio)'], interior: 67, terrace: 17, plan: '/paridera/beach/planos/1-hab-servicio.jpg' },
    { key: '2m', name: '2 Habitaciones Master', match: ['2 Habitaciones Master'], interior: 91, terrace: 19, plan: '/paridera/beach/planos/2-hab-master.jpg' },
    { key: '2f', name: '2 Hab + Family + servicio', match: ['2 Hab + Family + Hab de Servicio'], interior: 129, terrace: 28, plan: '/paridera/beach/planos/2-hab-family.jpg' },
  ],
  typologiesTitle: (
    <>
      Tres tipologías
      <br />
      <em>frente a la laguna</em>
    </>
  ),
  levels: { count: 8, image: (level) => `/paridera/beach/niveles/nivel-${level}.jpg` },
  amenities: [
    { title: 'Crystal Lagoon', text: '15,000 m² de laguna de arena blanca frente al edificio.', image: '/paridera/beach/playa.jpg' },
    { title: 'Palapa de playa', text: 'Sombra, lounge y servicio a la orilla de la laguna.', image: '/paridera/beach/palapa.jpg' },
    { title: 'Restaurante', text: 'Cocina y bar dentro del complejo.', image: '/paridera/beach/restaurante.jpg' },
    { title: 'Lobby', text: 'Recepción de doble altura con salida a la playa.', image: '/paridera/beach/lobby.jpg' },
    { title: 'Rooftop & Lounge 360°', text: 'Vistas panorámicas al mar y al golf.', image: '/paridera/hub/sunrise-rooftop.jpg' },
    { title: 'Gym 360 & Wellness Spa', text: 'Gimnasio panorámico con vista al campo y al mar.', image: '/paridera/hub/sunrise-gym.jpg' },
  ],
  finishes: BONITA_BEACH_FINISHES,
  finishesImage: '/paridera/beach/sala-2ha.jpg',
};

const VILLAS: DevelopmentContent = {
  slides: [
    { src: '/paridera/villas/villa-01.jpg', caption: 'Bonita Beach Villas' },
    { src: '/paridera/villas/villa-02.jpg', caption: 'Villa con piscina privada' },
    { src: '/paridera/villas/villa-03.jpg', caption: 'Terraza techada' },
    { src: '/paridera/villas/villa-04.jpg', caption: 'Vía privada' },
  ],
  title: (
    <>
      Diecinueve villas
      <br />
      en <em>Bonita Beach</em>
    </>
  ),
  intro: 'Villas de dos niveles con piscina propia, sobre una vía privada entre la playa y el campo de golf.',
  statement:
    'Cada villa tiene piscina privada, terraza techada, estacionamiento, ducha exterior y estudio, con vista al campo de golf o a la playa.',
  lead: 'Diecinueve lotes sobre vía privada con buffer verde de paisajismo, y acceso a la playa Crystal Lagoons y a las amenidades de Bonita Beach.',
  facts: [
    { value: '19', label: 'villas en lotes independientes' },
    { value: '2', label: 'niveles por villa' },
    { value: '338', unit: 'm²', label: 'construidos en la villa estándar' },
    { value: '555', unit: 'm²', label: 'en la opción premium' },
  ],
  trio: ['/paridera/villas/villa-05.jpg', '/paridera/villas/villa-interior.jpg', '/paridera/villas/villa-06.jpg'],
  typologies: [
    { key: 'v1', name: 'Villa · planta baja', match: ['4H+FAM+HS (A)'], interior: 279, terrace: 49, plan: '/paridera/villas/planos/nivel-1.jpg', note: 'Medidas totales de la villa, en dos niveles. Sala, comedor, cocina, servicio, terraza techada y piscina.' },
    { key: 'v2', name: 'Villa · planta alta', match: ['4H+FAM+HS (A)'], interior: 279, terrace: 49, plan: '/paridera/villas/planos/nivel-2.jpg', note: 'Medidas totales de la villa. Cuatro dormitorios, estudio, walking closets y ducha exterior.' },
    { key: 'p1', name: 'Villa Premium · planta baja', match: ['5 H+FAM+HS (B)'], interior: 380, terrace: 144, plan: '/paridera/villas/planos/premium-nivel-1.jpg', note: 'Medidas totales de la villa. Habitación master en planta baja y piscina de 30 m².' },
    { key: 'p2', name: 'Villa Premium · planta alta', match: ['5 H+FAM+HS (B)'], interior: 380, terrace: 144, plan: '/paridera/villas/planos/premium-nivel-2.jpg', note: 'Medidas totales de la villa. Cuatro dormitorios y walking closets.' },
  ],
  typologiesTitle: (
    <>
      Dos villas,
      <br />
      <em>dos niveles</em>
    </>
  ),
  typologiesAside: 'Villa estándar de 4 habitaciones + family y opción premium de 5 habitaciones + family.',
  amenities: [
    { title: 'Piscina privada', text: 'En cada villa, junto a la terraza techada.', image: '/paridera/villas/villa-07.jpg' },
    { title: 'Vía privada con paisajismo', text: 'Ingreso controlado y buffer verde entre lotes.', image: '/paridera/villas/villa-09.jpg' },
    { title: 'Playa privada Crystal Lagoons', text: '15,000 m² de laguna de arena blanca.', image: '/paridera/hub/sunrise-beach.jpg' },
    { title: 'Beach Club & Restaurante', text: 'Servicio de playa y restaurante del complejo.', image: '/paridera/hub/beach-palapa.jpg' },
    { title: 'Rooftop, gym y wellness spa', text: 'Las amenidades de Bonita Beach, a pocos pasos.', image: '/paridera/hub/sunrise-rooftop.jpg' },
  ],
};

const BONITA_GOLF: DevelopmentContent = {
  brand: BONITA_GOLF_BRAND,
  slides: [
    { src: '/paridera/golf/exterior.jpg', caption: 'Bonita Golf Residences' },
    { src: '/paridera/golf/aerea.jpg', caption: 'Vista aérea' },
    { src: '/paridera/golf/falls-01.jpg', caption: 'Jardines y cascadas' },
    { src: '/paridera/golf/piscina.jpg', caption: 'Piscina' },
  ],
  title: (
    <>
      El mar y el golf,
      <br />
      a <em>solo unos pasos</em>
    </>
  ),
  intro: 'Apartamentos de lujo en primera línea del campo de golf Las Iguanas, a 350 m de la playa, en Cap Cana.',
  statement:
    'Todas las residencias están en primera línea del campo de golf, con terraza, aire acondicionado y cocina equipada incluidos, y entrega prevista para junio de 2027.',
  lead: 'Diseño de GVA Arquitectura, parqueo soterrado bajo vigilancia y carpintería de aluminio europeo con vidrios antihuracán.',
  facts: [
    { value: '159', label: 'residencias' },
    { value: '6', label: 'niveles residenciales' },
    { value: '350', unit: 'm', label: 'hasta la playa' },
    { value: '2', label: 'piscinas de adultos' },
  ],
  trio: ['/paridera/golf/terraza-1hf.jpg', '/paridera/golf/sala-3h.jpg', '/paridera/golf/hab-2h.jpg'],
  typologies: [
    { key: '1h', name: '1 Habitación + servicio', match: ['2 Hab (1+ HS)'], interior: 78, terrace: 15, plan: '/paridera/golf/planos/1-hab-servicio.jpg' },
    { key: '1f', name: '1 Hab + Family + servicio', match: ['1 Hab +Fam+ Hab de Servicio'], interior: 110, terrace: 26, plan: '/paridera/golf/planos/1-hab-family.jpg' },
    { key: '2h', name: '2 Habitaciones', match: ['2 Habitaciones', '2H+HS'], interior: 106, terrace: 28, plan: '/paridera/golf/planos/2-hab-a.jpg', note: 'Tipos A, B y C, de 102 a 112 m² interiores.' },
    { key: '3h', name: '3 Habitaciones + servicio', match: ['3 Hab + Hab de Servicio (A)', '3 Hab + Hab de Servicio (B)', '3 Hab + Hab de Servicio'], interior: 156, terrace: 63, plan: '/paridera/golf/planos/3-hab-b.jpg', note: 'Tipos A y B, de 156 a 168 m² interiores.' },
    { key: 'ph', name: 'Penthouse 4 Hab + Family', match: ['4H+FAM+HS'], interior: 364, terrace: 434, plan: '/paridera/golf/planos/ph-d.jpg', note: 'Penthouse en el sexto nivel, con piscina en la terraza.' },
  ],
  typologiesTitle: (
    <>
      Cinco tipologías
      <br />
      <em>sobre el fairway</em>
    </>
  ),
  typologiesAside: 'Todas con terraza, cocina equipada y parqueo asignado. La 2 Hab + Family incluye jacuzzi.',
  levels: { count: 6, image: (level) => `/paridera/golf/niveles/nivel-${level}.jpg` },
  amenities: [
    { title: 'Dos piscinas de adultos', text: 'Y piscina infantil, rodeadas de jardines con vegetación autóctona.', image: '/paridera/golf/piscina.jpg' },
    { title: 'Jardines y cascadas', text: 'Recorridos verdes entre los edificios.', image: '/paridera/golf/falls-02.jpg' },
    { title: 'Gazebo, lounge y BBQ', text: 'Áreas sociales al aire libre.', image: '/paridera/golf/gazebo.jpg' },
    { title: 'Gym 360 y coworking', text: 'Coworking con mobiliario ergonómico y zona exterior tropical.', image: '/paridera/golf/fachada.jpg' },
    { title: 'Pádel y parque infantil', text: 'Cancha de pádel de materiales de alta calidad.', image: '/paridera/golf/aerea.jpg' },
    { title: 'Beneficios de propietario', text: 'Tarjeta de acceso a Cap Cana, playas y restaurantes, 50% en la membresía del club de golf Las Iguanas el primer año y tarifa especial en Heritage School.', image: '/paridera/golf/falls-03.jpg' },
  ],
  finishes: [
    {
      group: 'Construcción',
      items: [
        { label: 'Estructura', value: 'Hormigón armado porticado sobre losa de cimentación' },
        { label: 'Fachada', value: 'Petos y barandillas de vidrio, revestimiento porcelánico y sistema Panelkret' },
        { label: 'Carpintería', value: 'Aluminio europeo con vidrios resistentes a huracanes' },
        { label: 'Parqueo', value: 'Soterrado bajo vigilancia, uno asignado por unidad' },
      ],
    },
    {
      group: 'Interiores',
      items: [
        { label: 'Pisos y paredes', value: 'Porcelanato rectificado Tino Stone 120×60 cm' },
        { label: 'Puertas', value: 'Madera en tonos roble o blanco, con protección hidrófuga' },
        { label: 'Clima', value: 'Aire acondicionado mini VRF inverter, control por estancia' },
        { label: 'Divisiones', value: 'Sistema USG con aislamiento térmico y acústico' },
      ],
    },
    {
      group: 'Cocina y baños',
      items: [
        { label: 'Cocina', value: 'Muebles hidrófugos tipo Porcelanosa y encimera de cuarzo compacto' },
        { label: 'Equipamiento', value: 'Estufa, horno y extractor de primeras marcas europeas' },
        { label: 'Baños', value: 'Porcelana vitrificada, ducha plana y grifería monomando cromada' },
      ],
    },
  ],
  finishesImage: '/paridera/golf/terraza-1hf.jpg',
  taxFacts: [
    <><strong>Confotur</strong> en trámite: 0% de transferencia y de IPI por 15 años</>,
    <><strong>US$ 2.50–3.00</strong> por m² de mantenimiento mensual estimado</>,
  ],
  progress: {
    caption: 'Construcción iniciada en diciembre de 2024. Fotografías de dron, mayo y junio de 2026.',
    images: ['/paridera/golf/obra/obra-1.jpg', '/paridera/golf/obra/obra-2.jpg', '/paridera/golf/obra/obra-3.jpg', '/paridera/golf/obra/obra-4.jpg'],
  },
};

const CONTENT: Record<ParideraPhaseKey, DevelopmentContent> = {
  sunrise: SUNRISE,
  sunset: SUNSET,
  beach: BEACH,
  villas: VILLAS,
  golf: BONITA_GOLF,
};

const phaseForSlug = (slug: string) =>
  PARIDERA_PHASES.find((p) => p.slug === slug.toLowerCase()) ?? PARIDERA_PHASES[0];

const DEFAULT_TAX_FACTS: ReactNode[] = [
  <><strong>0%</strong> impuestos de transferencia en la compra</>,
  <><strong>0%</strong> IPI durante 15 años</>,
];

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function ParideraProjectLanding({ project, config, brokerReferrer, isAuthenticated = false }: ProjectSalesLandingProps) {
  const phase = phaseForSlug(project.slug);
  const content = CONTENT[phase.key];
  const { available, fromPrice, total } = phase.inventory;
  // Delivery date and contact come from the CRM project settings, so editing them there updates every page.
  const delivery = project.deliveryDate ? project.delivery : null;
  const contact = {
    whatsapp: brokerReferrer?.phone || config?.theme?.contactWhatsapp || '',
    email: config?.theme?.contactEmail || '',
  };

  return (
    <ParideraShell extraStyles={LANDING_STYLES}>
      <ParideraHeader
        nav={[
          ...(content.typologies ? [{ href: '#residencias', label: 'Residencias' }] : []),
          { href: '#disponibilidad', label: 'Disponibilidad' },
          { href: '#amenidades', label: 'Amenidades' },
          { href: '#inversion', label: 'Inversión' },
        ]}
        cta={{ href: '#contacto', label: 'Solicitar información' }}
        brand={content.brand}
      />
      <main>
        <ParideraHero
          slides={content.slides}
          title={content.title}
          intro={content.intro}
          actions={
            <>
              <RollButton href="#disponibilidad">Ver disponibilidad</RollButton>
              <RollButton href="#contacto" variant="ghost">Solicitar información</RollButton>
            </>
          }
          card={{
            image: content.trio[1],
            title: `${available} de ${total} disponibles`,
            text: delivery ? `Desde ${usd(fromPrice)} · entrega ${delivery.toLowerCase()}` : `Desde ${usd(fromPrice)} · inventario al ${phase.inventory.asOf}`,
          }}
        />

        <Intro content={content} />
        {content.video && <VideoStatement video={content.video} />}
        {content.typologies && (
          <Typologies phase={phase.key} typologies={content.typologies} title={content.typologiesTitle} aside={content.typologiesAside} />
        )}
        {content.levels && <LevelExplorer phase={phase.key} levels={content.levels} />}
        <ParideraAvailability
          phase={phase.key}
          ctaHref="#contacto"
          ctaLabel={isAuthenticated ? 'Solicitar cotización' : 'Solicitar información'}
        />
        <ParideraAmenities items={content.amenities} />
        {content.finishes && <Finishes groups={content.finishes} image={content.finishesImage} />}
        {content.progress && <Progress progress={content.progress} />}
        <ParideraPlans
          plans={phase.paymentPlans}
          reservationUsd={phase.reservationUsd}
          taxFacts={[
            ...(delivery ? [<><strong>{delivery}</strong> entrega prevista</>] : []),
            ...(content.taxFacts ?? DEFAULT_TAX_FACTS),
          ]}
          action={<RollButton href="#contacto" variant="ink">Recibir plan de pagos</RollButton>}
        />
        <ParideraLocation />
        <Contact
          projectId={project.id}
          projectSlug={project.slug}
          projectName={project.name}
          typologyOptions={content.typologies?.map((t) => t.name) ?? []}
          brokerReferrer={brokerReferrer}
          contact={contact}
        />
        <OtherDevelopments current={phase.key} />
      </main>
      <ParideraFooter brand={content.brand} current={phase.key} />
    </ParideraShell>
  );
}

/* ─── Intro ──────────────────────────────────────────────────────────────── */

function Intro({ content }: { content: DevelopmentContent }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 85%', 'end 45%'] });
  return (
    <section className="pb-section pb-intro">
      <div className="pb-container">
        <div className="pb-intro__grid">
          <div>
            <Eyebrow>El proyecto</Eyebrow>
          </div>
          <div ref={ref}>
            <WordReveal className="pb-intro__statement" progress={scrollYProgress} text={content.statement} />
            <Reveal delay={0.1}>
              <p className="pb-intro__lead">{content.lead}</p>
            </Reveal>
          </div>
        </div>

        <div className="pb-intro__trio">
          <ParallaxImage src={content.trio[0]} alt="Interior" />
          <ParallaxImage src={content.trio[1]} alt="Terraza" offset={90} />
          <ParallaxImage src={content.trio[2]} alt="Habitación" />
        </div>

        <div className="pb-stats">
          {content.facts.map((stat, i) => (
            <Reveal key={stat.label} delay={i * 0.08} className="pb-stat">
              <div className="pb-stat__value">
                {stat.value}
                {stat.unit && <span>{stat.unit}</span>}
              </div>
              <div className="pb-stat__label">{stat.label}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Sticky video that grows to full bleed ──────────────────────────────── */

function VideoStatement({ video }: { video: NonNullable<DevelopmentContent['video']> }) {
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const scale = useTransform(scrollYProgress, [0, 0.6], [0.78, 1]);
  const radius = useTransform(scrollYProgress, [0, 0.6], [28, 0]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || reduce) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) el.play().catch(() => undefined);
      else el.pause();
    }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, [reduce]);

  return (
    <section ref={ref} className="pb-statement">
      <div className="pb-statement__sticky">
        <motion.div className="pb-statement__bg" style={{ scale, borderRadius: radius }}>
          <video ref={videoRef} className="pl-video" src={video.src} poster={video.poster} muted loop playsInline preload="metadata" />
          <div className="pb-statement__shade" />
        </motion.div>
        <div className="pb-statement__text">
          <WordReveal progress={scrollYProgress} className="pb-statement__quote" text={video.quote} />
        </div>
      </div>
    </section>
  );
}

/* ─── Typologies: tabbed floor plans ─────────────────────────────────────── */

function useTypologyStats(phase: ParideraPhaseKey, typology: Typology) {
  return useMemo(() => {
    const units = PARIDERA_UNITS.filter((u) => u.phase === phase && u.status === 'Disponible' && typology.match.includes(u.typology));
    const prices = units.map((u) => u.price).filter((p): p is number => !!p);
    return { available: units.length, fromPrice: prices.length ? Math.min(...prices) : null };
  }, [phase, typology]);
}

function Typologies({
  phase,
  typologies,
  title,
  aside = 'Todas con terraza, cocina equipada y habitación de servicio en la mayoría de tipologías.',
}: {
  phase: ParideraPhaseKey;
  typologies: Typology[];
  title?: ReactNode;
  aside?: string;
}) {
  const [active, setActive] = useState(0);
  const typology = typologies[active];
  const stats = useTypologyStats(phase, typology);

  return (
    <section id="residencias" className="pb-section">
      <div className="pb-container">
        <div className="pb-head">
          <div>
            <Eyebrow>Residencias</Eyebrow>
            <h2 className="pb-h2">
              {title ?? (
                <>
                  Elige tu
                  <br />
                  <em>residencia</em>
                </>
              )}
            </h2>
          </div>
          <p className="pb-head__aside">{aside}</p>
        </div>

        <div className="pl-typ">
          <ol className="pl-typ__list">
            {typologies.map((t, i) => (
              <li key={t.key}>
                <button type="button" className={i === active ? 'is-active' : ''} onClick={() => setActive(i)} onMouseEnter={() => setActive(i)}>
                  <span className="pl-typ__idx">{String(i + 1).padStart(2, '0')}</span>
                  <span className="pl-typ__name">{t.name}</span>
                  <span className="pl-typ__size">{t.interior + t.terrace} m²</span>
                </button>
              </li>
            ))}
          </ol>

          <div className="pl-typ__stage">
            <div className="pl-typ__plan">
              <AnimatePresence mode="wait">
                <motion.div
                  key={typology.key}
                  className="pl-typ__plan-img"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Image src={typology.plan} alt={`Plano ${typology.name}`} fill sizes="(max-width: 1024px) 100vw, 50vw" style={{ objectFit: 'contain' }} />
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="pl-typ__data">
              <div>
                <span>Interior</span>
                {typology.interior} m²
              </div>
              <div>
                <span>Terraza</span>
                {typology.terrace} m²
              </div>
              <div>
                <span>Disponibles</span>
                {stats.available}
              </div>
              <div>
                <span>Desde</span>
                {stats.fromPrice ? usd(stats.fromPrice) : 'Agotada'}
              </div>
            </div>
            {typology.note && <p className="pl-typ__note">{typology.note}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Level explorer: floor masterplan + units on that floor ─────────────── */

function LevelExplorer({ phase, levels }: { phase: ParideraPhaseKey; levels: NonNullable<DevelopmentContent['levels']> }) {
  const [level, setLevel] = useState(1);
  const units = useMemo(
    () =>
      PARIDERA_UNITS.filter((u) => u.phase === phase && Number(u.level) === level).sort((a, b) =>
        a.code.localeCompare(b.code, 'es', { numeric: true }),
      ),
    [phase, level],
  );

  return (
    <section className="pb-section pb-section--tight">
      <div className="pb-container">
        <div className="pl-levels">
          <div className="pl-levels__head">
            <div>
              <Eyebrow>Explorar por nivel</Eyebrow>
              <h2 className="pb-h2">
                Elige tu piso,
                <br />
                <em>elige tu vista</em>
              </h2>
            </div>
            <div className="pl-levels__tabs" role="tablist" aria-label="Nivel">
              {Array.from({ length: levels.count }, (_, i) => i + 1).map((n) => (
                <button key={n} type="button" role="tab" aria-selected={n === level} className={n === level ? 'is-active' : ''} onClick={() => setLevel(n)}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="pl-levels__body">
            <div className="pl-levels__map">
              <AnimatePresence mode="wait">
                <motion.div
                  key={level}
                  className="pl-levels__map-img"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <Image src={levels.image(level)} alt={`Plano del nivel ${level}`} fill sizes="(max-width: 1024px) 100vw, 60vw" style={{ objectFit: 'contain' }} />
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="pl-levels__units">
              <div className="pl-levels__count">
                <strong>{units.filter((u) => u.status === 'Disponible').length}</strong>
                {units.filter((u) => u.status === 'Disponible').length === 1 ? 'unidad disponible' : 'unidades disponibles'} en el nivel {level}
              </div>
              {units.length === 0 ? (
                <p className="pl-levels__empty">Este nivel está vendido. Revisa los otros pisos o consulta lista de espera.</p>
              ) : (
                <ul>
                  {units.map((u) => (
                    <li key={u.code} className={u.status === 'Reservado' ? 'is-reserved' : ''}>
                      <span className="pl-levels__code">{u.code}</span>
                      <span className="pl-levels__typ">
                        {u.typology}
                        <small>{[u.view, u.totalM2 ? `${u.totalM2} m²` : ''].filter(Boolean).join(' · ')}</small>
                      </span>
                      <span className="pl-levels__price">{u.status === 'Reservado' ? 'Reservada' : u.price ? usd(u.price) : 'Consultar'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Finishes (memoria de calidades) ────────────────────────────────────── */

function Finishes({ groups, image }: { groups: NonNullable<DevelopmentContent['finishes']>; image?: string }) {
  return (
    <section className="pb-section">
      <div className="pb-container">
        <div className="pl-fin">
          {image && (
            <div className="pl-fin__media">
              <ParallaxImage src={image} alt="Acabados interiores" offset={70} />
            </div>
          )}
          <div>
            <Eyebrow>Memoria de calidades</Eyebrow>
            <h2 className="pb-h2">
              Materiales
              <br />
              <em>que se sienten</em>
            </h2>
            <div className="pl-fin__groups">
              {groups.map((group, gi) => (
                <Reveal key={group.group} delay={gi * 0.08} className="pl-fin__group">
                  <h3>{group.group}</h3>
                  <dl>
                    {group.items.map((item) => (
                      <div key={item.label}>
                        <dt>{item.label}</dt>
                        <dd>{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                </Reveal>
              ))}
            </div>
            <p className="pl-fin__legal">Terminaciones ilustrativas, sujetas a cambios comunicados oportunamente por el promotor.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Construction progress ─────────────────────────────────────────────── */

function Progress({ progress }: { progress: NonNullable<DevelopmentContent['progress']> }) {
  return (
    <section className="pb-section">
      <div className="pb-container">
        <div className="pb-head">
          <div>
            <Eyebrow>Avance de obra</Eyebrow>
            <h2 className="pb-h2">
              En construcción,
              <br />
              <em>a la vista</em>
            </h2>
          </div>
          <p className="pb-head__aside">{progress.caption}</p>
        </div>
        <div className="pl-progress">
          {progress.images.map((src, i) => (
            <Reveal key={src} delay={i * 0.06} className="pl-progress__img">
              <Image src={src} alt={`Avance de obra ${i + 1}`} fill sizes="(max-width: 768px) 100vw, 50vw" style={{ objectFit: 'cover' }} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Contact ─────────────────────────────────────────────────────────────── */

function Contact({
  projectId,
  projectSlug,
  projectName,
  typologyOptions,
  brokerReferrer,
  contact,
}: {
  projectId: number;
  projectSlug: string;
  projectName: string;
  typologyOptions: string[];
  brokerReferrer?: ProjectSalesLandingProps['brokerReferrer'];
  contact: { whatsapp: string; email: string };
}) {
  const whatsappDigits = contact.whatsapp.replace(/\D/g, '');
  const whatsappHref = whatsappDigits
    ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(`Hola, me interesa ${projectName}.`)}`
    : null;
  return (
    <section id="contacto" className="pb-section pb-section--tight">
      <div className="pb-container">
        <div className="pl-contact">
          <div className="pl-contact__intro">
            <Eyebrow light>Contacto</Eyebrow>
            <h2 className="pb-h2">
              Recibe la disponibilidad
              <br />
              <em>y tu propuesta</em>
            </h2>
            <p>Te enviamos el inventario actualizado, los planos de la unidad que elijas y el plan de pago que mejor te funcione.</p>
            {brokerReferrer?.name && (
              <div className="pl-contact__broker">
                {brokerReferrer.avatarUrl && (
                  <span className="pl-contact__avatar">
                    {/* eslint-disable-next-line @next/next/no-img-element -- broker avatars come from arbitrary storage hosts */}
                    <img src={brokerReferrer.avatarUrl} alt="" />
                  </span>
                )}
                <div>
                  <span>Te atiende</span>
                  <strong>{brokerReferrer.name}</strong>
                </div>
                {brokerReferrer.phone && (
                  <a href={`tel:${brokerReferrer.phone.replace(/[^\d+]/g, '')}`} aria-label={`Llamar a ${brokerReferrer.name}`}>
                    <Phone size={16} />
                  </a>
                )}
              </div>
            )}
            {(whatsappHref || contact.email) && (
              <div className="pl-contact__links">
                {whatsappHref && (
                  <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                    <span>WhatsApp</span>
                    +{whatsappDigits}
                  </a>
                )}
                {contact.email && (
                  <a href={`mailto:${contact.email}`}>
                    <span>Correo</span>
                    {contact.email}
                  </a>
                )}
              </div>
            )}
          </div>
          <div className="pl-contact__form">
            <LeadCaptureForm
              projectId={projectId}
              projectSlug={projectSlug}
              projectName={projectName}
              typologyOptions={typologyOptions}
              accentClassName="bg-[#0A2A3B] hover:bg-[#004F73]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Other developments ─────────────────────────────────────────────────── */

function OtherDevelopments({ current }: { current: ParideraPhaseKey }) {
  const others = PARIDERA_PHASES.filter((p) => p.key !== current);
  return (
    <section className="pb-section">
      <div className="pb-container">
        <div className="pb-head">
          <div>
            <Eyebrow>Paridera Investors</Eyebrow>
            <h2 className="pb-h2">
              Más desarrollos
              <br />
              <em>en Bonita Beach</em>
            </h2>
          </div>
          <RollButton href="/desarrolladores/paridera#desarrollos" variant="ink">Ver portafolio</RollButton>
        </div>
        <div className="pl-others">
          {others.map((p, i) => (
            <Reveal key={p.key} delay={i * 0.06}>
              <Link href={p.hasLanding ? `/proyectos/${p.slug}` : '/desarrolladores/paridera#desarrollos'} className="pl-other">
                <div className="pl-other__img">
                  <Image src={p.cover} alt={p.name} fill sizes="(max-width: 768px) 100vw, 25vw" style={{ objectFit: 'cover' }} />
                </div>
                <div className="pl-other__label">{p.label}</div>
                <div className="pl-other__name">{p.name}</div>
                <div className="pl-other__meta">
                  {p.inventory.available} disponibles · desde {usd(p.inventory.fromPrice)}
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Landing-only styles (tokens and shared classes live in ParideraKit) ── */

const LANDING_STYLES = `
.pl-video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}

.pl-typ{display:grid;grid-template-columns:minmax(0,0.9fr) minmax(0,1.3fr);gap:clamp(32px,5vw,80px);align-items:start}
.pl-typ__list{list-style:none;margin:0;padding:0;border-top:1px solid var(--line)}
.pl-typ__list button{display:grid;grid-template-columns:44px 1fr auto;gap:12px;align-items:baseline;width:100%;padding:22px 4px;border:0;border-bottom:1px solid var(--line);background:none;font:inherit;text-align:left;color:var(--muted);cursor:pointer;transition:color .3s}
.pl-typ__idx{font-size:13px;font-variant-numeric:tabular-nums}
.pl-typ__name{font-size:clamp(1.15rem,1.7vw,1.6rem);font-weight:500;letter-spacing:-0.025em;transition:transform .5s cubic-bezier(.22,1,.36,1)}
.pl-typ__size{font-size:14px;font-variant-numeric:tabular-nums}
.pl-typ__list button:hover,.pl-typ__list button.is-active{color:var(--ink)}
.pl-typ__list button.is-active .pl-typ__name{transform:translateX(8px)}
.pl-typ__list button.is-active .pl-typ__idx{color:var(--sun-deep)}
.pl-typ__stage{position:sticky;top:110px}
.pl-typ__plan{position:relative;aspect-ratio:5/4;max-height:68svh;width:100%;border-radius:20px;background:var(--sand);overflow:hidden}
.pl-typ__plan-img{position:absolute;inset:6%}
.pl-typ__plan-img img{mix-blend-mode:multiply}
.pl-typ__data{display:grid;grid-template-columns:repeat(4,1fr);margin-top:20px;border-top:1px solid var(--line)}
.pl-typ__data div{padding:16px 12px 0 0;font-size:clamp(1.05rem,1.5vw,1.4rem);font-weight:500;letter-spacing:-0.02em}
.pl-typ__data div+div{padding-left:16px;border-left:1px solid var(--line)}
.pl-typ__data span{display:block;font-size:12.5px;font-weight:600;color:var(--muted);letter-spacing:.03em;margin-bottom:4px}
.pl-typ__note{margin:14px 0 0;font-size:13.5px;color:var(--text)}

.pl-levels{background:var(--sand);border-radius:24px;padding:clamp(28px,5vw,72px)}
.pl-levels__head{display:flex;justify-content:space-between;align-items:flex-end;gap:32px;flex-wrap:wrap;margin-bottom:clamp(28px,4vw,48px)}
.pl-levels__tabs{display:flex;gap:6px;flex-wrap:wrap}
.pl-levels__tabs button{width:48px;height:48px;border-radius:50%;border:1px solid rgba(10,42,59,.18);background:transparent;font:inherit;font-size:15px;font-weight:600;color:var(--ink);cursor:pointer;transition:background .3s,color .3s,border-color .3s}
.pl-levels__tabs button:hover{border-color:var(--ink)}
.pl-levels__tabs button.is-active{background:var(--ink);border-color:var(--ink);color:#fff}
.pl-levels__body{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:clamp(24px,4vw,56px)}
.pl-levels__map{position:relative;aspect-ratio:1.1/1;border-radius:16px;background:#fff;overflow:hidden}
.pl-levels__map-img{position:absolute;inset:0}
.pl-levels__count{font-size:14px;color:var(--text);margin-bottom:16px}
.pl-levels__count strong{display:block;font-size:3rem;font-weight:500;letter-spacing:-0.05em;line-height:1;color:var(--ink);margin-bottom:6px}
.pl-levels__units ul{list-style:none;margin:0;padding:0;border-top:1px solid rgba(10,42,59,.12);max-height:440px;overflow:auto}
.pl-levels__units li{display:grid;grid-template-columns:64px 1fr auto;gap:12px;align-items:center;padding:14px 0;border-bottom:1px solid rgba(10,42,59,.12);font-size:14px}
.pl-levels__units li.is-reserved{color:var(--muted)}
.pl-levels__code{font-weight:600;font-variant-numeric:tabular-nums}
.pl-levels__typ small{display:block;color:var(--muted);font-size:12.5px;margin-top:2px}
.pl-levels__price{font-weight:600;font-variant-numeric:tabular-nums;text-align:right}
.pl-levels__empty{color:var(--text);margin:0;padding:16px 0;border-top:1px solid rgba(10,42,59,.12)}

.pl-fin{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.2fr);gap:clamp(32px,5vw,96px);align-items:start}
.pl-fin__media{position:sticky;top:110px}
.pl-fin__media .pb-parallax{height:clamp(360px,48vw,680px)}
.pl-fin__groups{margin-top:40px}
.pl-fin__group{padding:28px 0;border-top:1px solid var(--line)}
.pl-fin__group h3{margin:0 0 16px;font-size:13px;font-weight:600;color:var(--brand);letter-spacing:.04em}
.pl-fin__group dl{margin:0;display:grid;gap:14px}
.pl-fin__group dl div{display:grid;grid-template-columns:150px 1fr;gap:16px}
.pl-fin__group dt{color:var(--muted);font-size:14px}
.pl-fin__group dd{margin:0;font-size:15.5px;font-weight:500}
.pl-fin__legal{font-size:12.5px;color:var(--muted);margin:8px 0 0}

.pl-contact{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);gap:clamp(28px,5vw,80px);background:var(--ink);color:#fff;border-radius:24px;padding:clamp(28px,5vw,80px)}
.pl-contact__intro p{color:rgba(255,255,255,.72);font-size:17px;max-width:460px;margin:24px 0 0}
.pl-contact__broker{display:flex;align-items:center;gap:14px;margin-top:36px;padding-top:24px;border-top:1px solid rgba(255,255,255,.14)}
.pl-contact__avatar{width:48px;height:48px;border-radius:50%;overflow:hidden;flex-shrink:0}
.pl-contact__avatar img{width:100%;height:100%;object-fit:cover}
.pl-contact__broker span{display:block;font-size:12.5px;color:rgba(255,255,255,.6)}
.pl-contact__broker strong{font-weight:600;font-size:16px}
.pl-contact__broker a{margin-left:auto;display:grid;place-items:center;width:44px;height:44px;border-radius:50%;background:var(--sun);color:var(--ink)}
.pl-contact__links{display:grid;gap:0;margin-top:28px;border-top:1px solid rgba(255,255,255,.14)}
.pl-contact__links a{display:flex;justify-content:space-between;gap:16px;padding:16px 0;border-bottom:1px solid rgba(255,255,255,.14);color:#fff;text-decoration:none;font-weight:500;transition:color .3s,padding .4s}
.pl-contact__links a span{color:rgba(255,255,255,.55);font-weight:400}
.pl-contact__links a:hover{color:var(--sun);padding-left:6px}
.pl-contact__form{background:#fff;color:var(--ink);border-radius:18px;padding:clamp(20px,3vw,36px)}

.pl-progress{display:grid;grid-template-columns:1.4fr 1fr;grid-auto-rows:clamp(200px,24vw,340px);gap:16px}
.pl-progress__img{position:relative;border-radius:16px;overflow:hidden}
.pl-progress__img:first-child{grid-row:span 2}
.pl-progress__img:nth-child(4){grid-column:1/-1}
.pl-others{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}
.pl-other{display:block;text-decoration:none;color:var(--ink)}
.pl-other__img{position:relative;aspect-ratio:4/5;border-radius:16px;overflow:hidden;margin-bottom:16px}
.pl-other__img img{transition:transform 1.2s cubic-bezier(.22,1,.36,1)}
.pl-other:hover .pl-other__img img{transform:scale(1.06)}
.pl-other__label{font-size:13px;color:var(--muted)}
.pl-other__name{font-size:clamp(1.4rem,2vw,1.9rem);font-weight:500;letter-spacing:-0.03em;margin:2px 0 4px}
.pl-other__meta{font-size:14px;color:var(--text)}

@media (max-width:1024px){
  .pl-typ,.pl-levels__body,.pl-fin,.pl-contact{grid-template-columns:1fr}
  .pl-typ__stage,.pl-fin__media{position:static}
  .pl-typ__stage{order:-1}
  .pl-others{grid-template-columns:1fr 1fr}
}
@media (max-width:640px){
  .pl-typ__data{grid-template-columns:1fr 1fr}
  .pl-typ__data div:nth-child(3){padding-left:0;border-left:0}
  .pl-typ__data div{padding-bottom:14px}
  .pl-levels__tabs button{width:40px;height:40px}
  .pl-fin__group dl div{grid-template-columns:1fr;gap:2px}
  .pl-others{grid-template-columns:1fr}
  .pl-progress{grid-template-columns:1fr}
  .pl-progress__img:first-child{grid-row:auto}
  .pl-progress__img:nth-child(4){grid-column:auto}
}
`;
