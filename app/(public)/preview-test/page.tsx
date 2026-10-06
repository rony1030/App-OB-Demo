'use client';
import { LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useState } from 'react';
import MagazineSlide from '@/components/presentations/MagazineSlide';
import type { MagazineBlock } from '@/components/presentations/MagazineSlide';

const ACCENT = '#d4af37';
const BG_DARK = '#0c094e';

const sampleBlocks: MagazineBlock[] = [
  // 1. Cover
  {
    id: 'cover',
    type: 'cover',
    title: 'Cana Rock Star',
    body: 'Un desarrollo exclusivo con amenidades de clase mundial en el corazón de Punta Cana.',
    kicker: 'GRUPO CANA ROCK',
    subHeader: 'BROCHURE OFICIAL DE VENTAS',
    layout: 'full',
    backgroundType: 'image',
    backgroundColor: BG_DARK,
    textColor: '#ffffff',
    accentColor: ACCENT,
    fontFamily: 'serif',
    titleSize: 42,
    bodySize: 13,
    image: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200&q=80',
    overlayOpacity: 55,
    projectLogoUrl: '/logo-stelar-white.png',
    locationLeft: 'Cana Bay, Punta Cana',
    locationRight: 'Diciembre 2027',
  },

  // 2. Text / Narrative
  {
    id: 'text-1',
    type: 'text',
    title: 'Una oportunidad única de inversión',
    body: 'Cana Rock Star combina rentabilidad y lifestyle en un solo concepto. Con retornos proyectados del 8-12% anual y una ubicación privilegiada, esta es la inversión inmobiliaria más inteligente del Caribe.\n\nEl proyecto cuenta con certificación CONFOTUR, garantizando exenciones fiscales por 15 años.',
    kicker: 'INVERSIÓN INTELIGENTE',
    layout: 'full',
    backgroundType: 'solid',
    backgroundColor: '#fcfbf9',
    textColor: '#0f172a',
    accentColor: ACCENT,
    bodySize: 14,
    titleSize: 32,
    extraList: ['Exención de impuestos por 15 años', 'ROI proyectado 8-12% anual', 'Administración hotelera incluida', 'Financiamiento directo con el desarrollador'],
  },

  // 3. Highlights / Amenidades
  {
    id: 'highlights-1',
    type: 'highlights',
    title: 'Amenidades de clase mundial',
    body: '',
    kicker: 'LIFESTYLE & BIENESTAR',
    layout: 'full',
    backgroundType: 'solid',
    backgroundColor: '#fcfbf9',
    textColor: '#0f172a',
    accentColor: ACCENT,
    titleSize: 30,
    amenityStyle: 'cards',
    amenityColumns: 3,
    amenityIconMode: 'auto',
    extraList: ['Piscina infinity', 'Gimnasio equipado', 'Spa & wellness center', 'Restaurante gourmet', 'Beach club privado', 'Cancha de tenis'],
  },

  // 4. Stats / Cifras clave
  {
    id: 'stats-1',
    type: 'stats',
    title: 'Cifras del proyecto',
    body: 'Datos actualizados del inventario oficial verificado.',
    kicker: 'EN NÚMEROS',
    layout: 'full',
    backgroundType: 'gradient',
    backgroundColor: BG_DARK,
    textColor: '#ffffff',
    accentColor: ACCENT,
    titleSize: 30,
    bodySize: 13,
    customStats: {
      stat1Label: 'Desde',
      stat1Value: 'US$ 149,000',
      stat2Label: 'Ubicación',
      stat2Value: 'Bávaro, Punta Cana',
      stat3Label: 'Disponibles',
      stat3Value: '47 unidades',
      stat4Label: 'Entrega',
      stat4Value: 'Diciembre 2027',
    },
    metricValueSize: 18,
  },

  // 5. Availability / Pricing
  {
    id: 'pricing-1',
    type: 'availability',
    title: 'Precios y Disponibilidad',
    body: 'Consulta los precios actualizados con tu asesor para obtener la mejor opción.',
    kicker: 'INVENTARIO OFICIAL',
    layout: 'full',
    backgroundType: 'solid',
    backgroundColor: '#fcfbf9',
    textColor: '#0f172a',
    accentColor: ACCENT,
    titleSize: 28,
    bodySize: 13,
    pricingCards: [
      { title: '1 Habitación (Estándar)', price: 149000, kicker: 'Desde' },
      { title: '2 Habitaciones (Premium)', price: 228000, kicker: 'Desde' },
      { title: 'Penthouse (5to Nivel)', price: 312000, kicker: 'Desde' },
    ],
  },

  // 6. Payment Plan (the one we improved!)
  {
    id: 'payment-1',
    type: 'payment',
    title: 'Plan de Pagos',
    body: 'Un esquema flexible para acompañar su inversión.',
    kicker: 'CRONOGRAMA DE INVERSIÓN ESTRUCTURADO',
    layout: 'full',
    backgroundType: 'gradient',
    backgroundColor: BG_DARK,
    textColor: '#ffffff',
    accentColor: ACCENT,
    titleSize: 30,
    bodySize: 13,
    paymentSteps: [
      { label: 'Reserva', value: 'US$ 3,000 · Al separar - 12 sept de 2026' },
      { label: 'Inicial (20%)', value: 'US$ 57,240 · 20% total, saldo luego de reserva - 12 oct de 2026' },
      { label: 'Durante Construcción (40%)', value: 'US$ 120,480 · 12 cuotas mensuales de US$ 10,040 desde 13 oct de 2026' },
      { label: 'Contra Entrega (40%)', value: 'US$ 120,480 · A la entrega estimada' },
    ],
  },

  // 7. Gallery
  {
    id: 'gallery-1',
    type: 'gallery',
    title: 'Galería del proyecto',
    body: 'Vistas panorámicas y acabados de primera calidad.',
    kicker: 'GALERÍA',
    layout: 'full',
    backgroundType: 'solid',
    backgroundColor: '#fcfbf9',
    textColor: '#0f172a',
    accentColor: ACCENT,
    titleSize: 28,
    bodySize: 13,
    images: [
      'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
    ],
  },

  // 8. Documents
  {
    id: 'docs-1',
    type: 'documents',
    title: 'Documentación legal',
    body: 'Todos los documentos han sido revisados y aprobados por nuestro equipo legal.',
    kicker: 'TRANSPARENCIA',
    layout: 'full',
    backgroundType: 'solid',
    backgroundColor: '#fcfbf9',
    textColor: '#0f172a',
    accentColor: ACCENT,
    titleSize: 28,
    bodySize: 13,
    visibleDocuments: [
      { id: '1', name: 'Contrato de compraventa', format: 'PDF', updated: 'Ago 2026' },
      { id: '2', name: 'Certificación CONFOTUR', format: 'PDF', updated: 'Jul 2026' },
      { id: '3', name: 'Planos arquitectónicos', format: 'DWG', updated: 'Jun 2026' },
    ],
  },

  // 9. Banking
  {
    id: 'banking-1',
    type: 'banking',
    title: 'Datos bancarios',
    body: 'Utilice los siguientes datos para realizar su pago de reserva o cuota mensual.',
    kicker: 'INSTRUCCIONES DE PAGO',
    layout: 'full',
    backgroundType: 'gradient',
    backgroundColor: BG_DARK,
    textColor: '#ffffff',
    accentColor: ACCENT,
    titleSize: 28,
    bodySize: 13,
    bankingInfo: {
      beneficiary: 'Cana Rock Development SRL',
      bank: 'Banco Popular Dominicano',
      account: '8291-0034-5678-9012',
      reference: 'Cana Rock Star - Unidad XXX',
    },
  },

  // 10. Disclaimer
  {
    id: 'disclaimer-1',
    type: 'disclaimer',
    title: 'Aviso legal',
    body: 'Los precios, disponibilidad y especificaciones contenidos en este documento son de carácter informativo y pueden cambiar sin previo aviso. Las imágenes son ilustrativas y no constituyen una representación exacta del producto final.\n\nEste documento no constituye una oferta vinculante de compraventa.',
    kicker: 'TÉRMINOS Y CONDICIONES',
    layout: 'full',
    backgroundType: 'solid',
    backgroundColor: '#fcfbf9',
    textColor: '#0f172a',
    accentColor: ACCENT,
    titleSize: 28,
    bodySize: 12,
  },

  // 11. Split layout with image
  {
    id: 'split-1',
    type: 'highlights',
    title: 'Conectividad premium',
    body: 'Acceso directo a las principales vías y puntos de interés.',
    kicker: 'UBICACIÓN ESTRATÉGICA',
    layout: 'split-right',
    backgroundType: 'solid',
    backgroundColor: '#fcfbf9',
    textColor: '#0f172a',
    accentColor: ACCENT,
    titleSize: 28,
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
    imageExpand: true,
    extraList: ['5 min al aeropuerto', '10 min a playa Bávaro', 'A pasos de Downtown Punta Cana', 'Acceso a autopista del coral'],
    amenityIconMode: 'check',
  },

  // 12. Floating card
  {
    id: 'floating-1',
    type: 'text',
    title: 'Beneficios CONFOTUR',
    body: 'Disfrute de exenciones fiscales por 15 años gracias a la Ley 158-01 de incentivo turístico.',
    kicker: 'VENTAJA FISCAL',
    layout: 'full',
    backgroundType: 'image',
    backgroundColor: '#0f172a',
    textColor: '#0f172a',
    accentColor: ACCENT,
    titleSize: 28,
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
    overlayOpacity: 30,
    isFloatingCard: true,
    extraList: ['0% impuesto de transferencia inmobiliaria', '0% impuesto sobre la propiedad (IPI)', '0% impuesto sobre ganancia de capital'],
  },

  // 13. Contact
  {
    id: 'contact-1',
    type: 'contact',
    title: '¿Listo para invertir?',
    body: 'Quedo a su disposición para acompañarle en la evaluación de esta oportunidad.',
    kicker: 'CONTACTO',
    layout: 'full',
    backgroundType: 'solid',
    backgroundColor: '#fcfbf9',
    textColor: '#0f172a',
    accentColor: ACCENT,
    titleSize: 32,
    bodySize: 14,
  },
];

export default function PreviewTestPage() {
  const [filter, setFilter] = useState<string>('all');
  const types = ['all', ...new Set(sampleBlocks.map((b) => b.type || 'unknown'))];
  const filtered = filter === 'all' ? sampleBlocks : sampleBlocks.filter((b) => b.type === filter);
  const total = filtered.length;

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-8">
      <div className="mx-auto max-w-[1200px]">
        <header className="mb-8 text-white">
          <h1 className="text-2xl font-black"><LocalizedText text={"Preview Test — MagazineSlide"} /></h1>
          <p className="mt-1 text-sm text-white/60"><LocalizedText text={"Página de prueba para verificar todos los tipos de bloques del renderer compartido."} /></p>
          <div className="mt-4 flex flex-wrap gap-2">
            {types.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFilter(t)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  filter === t
                    ? 'bg-[#d4af37] text-slate-950'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </header>

        <div className="space-y-8">
          {filtered.map((block, idx) => (
            <div key={block.id}>
              <div className="mb-2 flex items-center gap-3">
                <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-black uppercase text-[#d4af37]">
                  {block.type}
                </span>
                <span className="text-xs text-white/50">{block.id}</span>
                {block.layout !== 'full' && (
                  <span className="rounded-md bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400">
                    {block.layout}
                  </span>
                )}
                {block.isFloatingCard && (
                  <span className="rounded-md bg-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-400"><LocalizedText text={"floating"} /></span>
                )}
              </div>
              <div className="w-full aspect-[1120/820] shadow-2xl rounded-2xl overflow-hidden border border-white/10 bg-[#fcfbf9] relative flex flex-col justify-between">
                <MagazineSlide
                  block={block}
                  index={idx}
                  total={total}
                  projectName="Cana Rock Star"
                  brokerName="Carlos Rodríguez"
                  brokerPhone="+18095551234"
                  brokerEmail="carlos@obbrokers.com"
                  agencyName="OB Brokers Team"
                />
              </div>
            </div>
          ))}
        </div>

        <footer className="mt-12 border-t border-white/10 py-6 text-center text-xs text-white/40"><LocalizedText text={"Preview Test Page — Solo para desarrollo local. No incluir en producción."} /></footer>
      </div>
    </div>
  );
}
