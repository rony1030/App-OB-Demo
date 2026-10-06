'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import React, { useState } from 'react';
import Link from 'next/link';
import Image from '@/components/ui/OptimizedImage';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, ArrowRight, ArrowUpRight, ChevronDown, X, Menu, Building2, Calendar, Sparkles, Phone, Search, ExternalLink, Download, Bus, Clock, Calculator } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateConstructionInstallments } from '@/lib/proposals/payment-schedule';
import type { PortalProject, PortalUnit } from '@/lib/portal-projects';
import type { ProjectLandingConfig } from '@/lib/data/landing-config';
import PublicLanguageSwitcher from '@/components/i18n/PublicLanguageSwitcher';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { usePublicLandingTranslations } from '@/components/i18n/usePublicLandingTranslations';
import { isGarbageUnitCode } from '@/lib/data/uve-units';
import { UVE_RESIDENCES_TYPOLOGIES, type ProjectVillaTypology } from '@/lib/data/cipres-typologies';
import LeadCaptureForm, { type ProjectInquiryType } from '@/components/landing/LeadCaptureForm';
import BrandedGalleryDownload from '@/components/landing/BrandedGalleryDownload';

export interface UveResidencesLandingProps {
  project: PortalProject;
  config: ProjectLandingConfig;
  brokerReferrer?: {
    name: string;
    phone?: string;
    avatarUrl?: string;
  } | null;
  isAuthenticated?: boolean;
  currentUser?: {
    displayName: string;
    organization: {
      name: string;
    };
  } | null;
  customTypologies?: Record<string, unknown>;
  developerProjectCount?: number;
  developerProjects?: { slug: string; name: string }[];
  serverToday?: string;
}

// Optik & Merridanne smooth reveal animations
const fadeInUp = {
  hidden: { opacity: 0, y: 35 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] },
  },
};

const fadeInScale = {
  hidden: { opacity: 0, scale: 0.94, y: 25 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
};

export default function UveResidencesLanding({
  project,
  config,
  brokerReferrer,
  isAuthenticated = false,
  currentUser,
  customTypologies,
  developerProjectCount = 1,
  developerProjects = [],
  serverToday,
}: UveResidencesLandingProps) {
  const { locale } = useLocale();
  const { translations } = usePublicLandingTranslations(project.slug, locale);
  const galleryImages = project.gallery?.length ? project.gallery : [
    '/projects/uve-residences/pool.jpeg',
    '/projects/uve-residences/gym.png',
    '/projects/uve-residences/aerial.png',
    '/projects/uve-residences/penthouse.jpeg',
    '/projects/uve-residences/type-a.jpeg',
  ];

  // Comprehensive trilingual helper for UVE landing
  const tText = (es: string, en: string, fr?: string) => {
    if (locale === 'fr') return fr || en;
    if (locale === 'en') return en;
    return es;
  };

  // Keep SSR and browser output identical regardless of the device locale.
  const formatPrice = (value: number) => value.toLocaleString('en-US');

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Availability inventory filter & search
  const [availQuery, setAvailQuery] = useState('');
  const [showAllUnits, setShowAllUnits] = useState(false);
  const [inquiryType, setInquiryType] = useState<ProjectInquiryType>('information');

  // Financial calculator state with authentic UVE models
  const fin = config.financial ?? {
    reserveAmount: 2000,
    contractPercent: 0.20,
    constructionPercent: 0.30,
    deliveryPercent: 0.50,
    availableMonths: [12, 24, 30],
    defaultMonths: 24,
  };

  // UVE's published landing terms are fixed; stale paymentPlan rows must not
  // override the confirmed reservation and 20/30/50 distribution.
  const officialReserveAmount = 2000;
  const officialContractPercent = 0.2;
  const officialConstructionPercent = 0.3;
  const officialDeliveryPercent = 0.5;
  const percentLabel = (percentage: number) => Math.round(percentage * 100);

  const isAvailableUnit = (unit: PortalUnit) => unit.status === 'Disponible' || (unit.status as string) === 'available';
  const liveUnits = (project.units || []).filter((u) => !isGarbageUnitCode(u.unit) && u.isPublic !== false && isAvailableUnit(u));
  const livePrice = (type: string, floor?: number, fallback = 0) => {
    const matches = liveUnits.filter((u) => u.type.toLowerCase().includes(type.toLowerCase()) && (floor === undefined || u.floor === floor) && Number(u.price) > 0);
    return matches.length ? Math.min(...matches.map((u) => Number(u.price))) : fallback;
  };
  const livePriceOrNull = (type: string, floor?: number): number | null => {
    const matches = liveUnits.filter((u) => u.type.toLowerCase().includes(type.toLowerCase()) && (floor === undefined || u.floor === floor) && Number(u.price) > 0);
    return matches.length ? Math.min(...matches.map((u) => Number(u.price))) : null;
  };

  const rawTypologies = (customTypologies && typeof customTypologies === 'object' && Object.keys(customTypologies).length > 0
    ? customTypologies
    : UVE_RESIDENCES_TYPOLOGIES) as Record<string, ProjectVillaTypology>;
  const mergeWithDefaults = (raw: ProjectVillaTypology | undefined, fallback: ProjectVillaTypology): ProjectVillaTypology => {
    if (!raw) return fallback;
    return { ...fallback, ...raw, pricingLevels: raw.pricingLevels?.length ? raw.pricingLevels : fallback.pricingLevels };
  };
  const tipoA = mergeWithDefaults(rawTypologies.TIPO_A || Object.values(rawTypologies)[0], UVE_RESIDENCES_TYPOLOGIES.TIPO_A);
  const tipoB = mergeWithDefaults(rawTypologies.TIPO_B || Object.values(rawTypologies)[1], UVE_RESIDENCES_TYPOLOGIES.TIPO_B);

  const tTyp = (es: string, en?: string, fr?: string) => tText(es, en || es, fr || es);

  const buildCalcModels = (typ: ProjectVillaTypology | undefined) => {
    if (!typ?.pricingLevels) return [];
    return typ.pricingLevels.map((lvl) => {
      const p = livePrice(lvl.inventoryFilter, lvl.floor, lvl.fallbackPrice);
      return {
        key: `${typ.key}_${lvl.key}`,
        name: tTyp(`${typ.name.replace('Apartamento ', '')} · ${lvl.label.split(' (')[0]}`, lvl.labelEn ? `${(typ.nameEn || typ.name).replace('Apartment ', '')} · ${lvl.labelEn.split(' (')[0]}` : undefined, lvl.labelFr ? `${(typ.nameFr || typ.name).replace('Appartement ', '')} · ${lvl.labelFr.split(' (')[0]}` : undefined),
        specs: tTyp(typ.tagline, typ.taglineEn, typ.taglineFr),
        price: p,
        badge: lvl.accent
          ? tText(`Desde US$ ${formatPrice(p)}`, `From US$ ${formatPrice(p)}`, `À partir de US$ ${formatPrice(p)}`)
          : `US$ ${formatPrice(p)}`,
        type: typ.name.replace('Apartamento ', ''),
        level: tTyp(lvl.label.split(' (')[0], lvl.labelEn?.split(' (')[0], lvl.labelFr?.split(' (')[0]),
      };
    });
  };

  const UVE_CALC_MODELS = [...buildCalcModels(tipoA), ...buildCalcModels(tipoB)];

  const [calcModelKey, setCalcModelKey] = useState<string>('TIPO_A_N2');
  const [selectedCalcUnitId, setSelectedCalcUnitId] = useState<string | null>(null);
  const deliveryDateValue = project.deliveryDate || '2028-04-30';
  const parsedDeliveryDate = new Date(`${deliveryDateValue.slice(0, 10)}T12:00:00`);
  const hasDeliveryDate = !Number.isNaN(parsedDeliveryDate.getTime());
  const deliveryDate = hasDeliveryDate ? parsedDeliveryDate : new Date('2028-04-30T12:00:00');
  const dateLocale = locale === 'fr' ? 'fr-FR' : locale === 'en' ? 'en-US' : 'es-DO';
  const deliveryLabel = !hasDeliveryDate
    ? project.delivery || tText('Fecha por confirmar', 'Date to be confirmed', 'Date à confirmer')
    : new Intl.DateTimeFormat(dateLocale, { month: 'long', year: 'numeric' }).format(deliveryDate);
  const paymentDeadline = new Date(deliveryDate.getFullYear(), deliveryDate.getMonth() - 1, deliveryDate.getDate());
  const paymentDeadlineLabel = !hasDeliveryDate
    ? tText('fecha por confirmar', 'date to be confirmed', 'date à confirmer')
    : new Intl.DateTimeFormat(dateLocale, { month: 'long', year: 'numeric' }).format(paymentDeadline);
  const reservationDate = serverToday || new Date().toISOString().slice(0, 10);
  const reservationDateLabel = new Intl.DateTimeFormat(dateLocale, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Santo_Domingo' }).format(new Date(`${reservationDate}T12:00:00-04:00`));
  const calcMonths = hasDeliveryDate
    ? calculateConstructionInstallments({
        reservationAmount: officialReserveAmount,
        reservationDate,
        initialPercentage: percentLabel(officialContractPercent),
        initialDueDays: 30,
        constructionPercentage: percentLabel(officialConstructionPercent),
        deliveryDate: deliveryDateValue.slice(0, 10),
        constructionFrequency: 'monthly',
        constructionInstallments: fin.defaultMonths || 1,
      })
    : Math.max(1, fin.defaultMonths || 24);

  const contactHref = '#contacto';
  const buildWhatsappLink = (_customText?: string) => contactHref;

  // Standard official payment plan, read from the published project data.
  const selectedModel = UVE_CALC_MODELS.find((m) => m.key === calcModelKey) || UVE_CALC_MODELS[0] || { key: 'FALLBACK', name: '', specs: '', price: tipoA?.startingPrice || 134400, badge: '', type: '', level: '' };
  const selectedCalcUnit = liveUnits.find((unit) => String(unit.id) === selectedCalcUnitId) || null;
  const unitPrice = selectedCalcUnit && Number(selectedCalcUnit.price) > 1000 ? Number(selectedCalcUnit.price) : selectedModel.price;
  const reserveAmount = officialReserveAmount;
  const contractAmount = unitPrice * officialContractPercent - reserveAmount;
  const constructionTotal = unitPrice * officialConstructionPercent;
  const monthlyConstruction = constructionTotal / (calcMonths || 24);
  const deliveryAmount = Math.max(0, unitPrice - unitPrice * officialContractPercent - constructionTotal);
  const effectiveDeliveryPercent = unitPrice > 0 ? deliveryAmount / unitPrice : officialDeliveryPercent;

  const calculatorModelForUnit = (unit: PortalUnit) => {
    const unitText = `${unit.type} ${unit.unit} ${unit.notes || ''}`.toLowerCase();
    const isTypeB = unitText.includes('tipo b') || Number(unit.area) > 105;
    const isPenthouse = unitText.includes('penthouse') || Number(unit.floor) >= 3;
    if (isTypeB) return isPenthouse ? 'TIPO_B_PH' : Number(unit.floor) === 1 ? 'TIPO_B_N1' : 'TIPO_B_N2';
    return isPenthouse ? 'TIPO_A_PH' : Number(unit.floor) === 1 ? 'TIPO_A_N1' : 'TIPO_A_N2';
  };

  // Inventory filtering: filter out any corrupted scraped CSS rules and fallback to canonical 21 units
  const rawProjectUnits = (project.units || []).filter(
    (u) => !isGarbageUnitCode(u.unit) && u.isPublic !== false && (u.status as string) !== 'withdrawn'
  );
  const allUnits = rawProjectUnits.filter(isAvailableUnit);

  const filteredUnits = allUnits.filter((u) => {
    const q = availQuery.trim().toLowerCase();
    const matchesQ = !q || `${u.unit} ${u.tower} ${u.type} ${u.status} ${u.price}`.toLowerCase().includes(q);
    return matchesQ;
  }).sort((a, b) => a.unit.localeCompare(b.unit, undefined, { numeric: true }));

  const availableUnitsCount = allUnits.filter((u) => u.status === 'Disponible' || (u.status as string) === 'available').length;
  const visibleUnits = showAllUnits ? filteredUnits : filteredUnits.slice(0, 10);

  // Authentic 9 Amenities from PDF Page 26 — SVG outline icons matching brochure style
  const amenityColor = '#e91e8c';
  const featuresList = [
    {
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={amenityColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 15c1.5-1.5 3.5-1 5 0s3.5 1.5 5 0 3.5-1 5 0 3.5 1.5 5 0"/><path d="M2 19c1.5-1.5 3.5-1 5 0s3.5 1.5 5 0 3.5-1 5 0 3.5 1.5 5 0"/><circle cx="12" cy="8" r="3"/><path d="M12 5V3"/></svg>,
      title: tText('Piscina Resort & Solárium', 'Resort Pool & Sun Deck', 'Piscine Resort & Solarium'),
      desc: tText(
        'Piscina estilo resort con áreas de descanso, camastros semi-sumergidos y jardinería tropical.',
        'Immerse in tropical tranquility with beach-entry loungers, cabanas, and manicured lush flora.',
        'Immergez-vous dans la tranquillité tropicale avec transats immergés, cabanes et végétation soignée.'
      ),
    },
    {
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={amenityColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h16"/><path d="M4 12c0 4 3.5 7 8 7s8-3 8-7"/><path d="M4 12c0-1.5.5-3 2-4"/><path d="M20 12c0-1.5-.5-3-2-4"/><circle cx="8" cy="8" r="1" fill={amenityColor}/><circle cx="12" cy="6" r="1" fill={amenityColor}/><circle cx="16" cy="8" r="1" fill={amenityColor}/></svg>,
      title: tText('Jacuzzi de Hidromasaje', 'Hydro Jacuzzi', 'Bain à Remous Hydro'),
      desc: tText(
        'Jacuzzi integrado de hidromasaje para descanso y bienestar diario de residentes y huéspedes.',
        'Warm therapeutic hydro-jets for year-round relaxation and soothing body unwinding.',
        'Jets hydro-thérapeutiques pour une relaxation quotidienne et le bien-être des résidents et invités.'
      ),
    },
    {
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={amenityColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 6.5a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0z"/><path d="M17.5 6.5a2.5 2.5 0 1 1-5 0"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M9 12v5"/><path d="M15 12v5"/><path d="M4 12v-1.5"/><path d="M20 12v-1.5"/></svg>,
      title: tText('Gimnasio Climatizado Equipado', 'Equipped Fitness Gym', 'Salle de Sport Équipée'),
      desc: tText(
        'Gimnasio cerrado con aire acondicionado, máquinas cardiovasculares y zona de pesas libres.',
        'Full fitness club outfitted with cardio machines, free weights, and cross-training stations.',
        "Espace fitness climatisé équipé de machines cardio, poids libres et zones d'entraînement."
      ),
    },
    {
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={amenityColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 20h14"/><path d="M5 20V8l7-4 7 4v12"/><path d="M9 14c0 0 .5-2 3-2s3 2 3 2"/><path d="M10 10v.01"/><path d="M14 10v.01"/><path d="M12 3v2"/><path d="M9 6.5c.7-1 1.7-1.5 3-1.5s2.3.5 3 1.5"/></svg>,
      title: tText('Sauna Finlandés', 'Finnish Dry Sauna', 'Sauna Finlandais Sec'),
      desc: tText(
        'Sauna seco auténtico para desintoxicación corporal, relajación muscular y cuidado de la salud.',
        'Holistic dry Finnish sauna for detoxification, muscular recovery, and mindfulness.',
        'Véritable sauna sec pour la détoxification, la récupération musculaire et le ressourcement.'
      ),
    },
    {
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={amenityColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="9" rx="1.5"/><path d="M8 11V8a2 2 0 0 1 2-2h0"/><path d="M16 11V8a2 2 0 0 0-2-2h0"/><line x1="8" y1="15" x2="8" y2="16"/><line x1="12" y1="15" x2="12" y2="16"/><line x1="16" y1="15" x2="16" y2="16"/><path d="M10 6h4"/></svg>,
      title: tText('Área Social de BBQ', 'Social BBQ Lounge', 'Espace Barbecue & Convivialité'),
      desc: tText(
        'Espacio al aire libre con parrillas modernas, pérgolas y mesas para compartir con amigos.',
        'Covered open-air gazebos with modern barbecue grills for social and family gatherings.',
        'Gazébos couverts avec barbecues modernes et tables pour des moments de partage en famille ou entre amis.'
      ),
    },
    {
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={amenityColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="9" width="20" height="9" rx="2"/><path d="M5 9V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/><path d="M5 13h2"/><path d="M17 13h2"/></svg>,
      title: tText('Shuttle Privado a Playa Jellyfish', 'Daily Beach Shuttle', 'Navette Quotidienne Plage'),
      desc: tText(
        'Transporte diario exclusivo incluido con salidas programadas directas a Playa Jellyfish.',
        'Scheduled VIP transportation included daily directly to the sands of Jellyfish Beach.',
        'Transport VIP quotidien inclus avec départs réguliers directs vers la plage de Jellyfish.'
      ),
    },
    {
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={amenityColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="1.5"/><path d="M9 2v20"/><path d="M15 2v20"/><path d="M5 12h14"/><path d="M12 8l-2 2 2 2"/><path d="M12 14l2 2-2 2"/></svg>,
      title: tText('Ascensores en Cada Bloque', 'Modern Elevators', 'Ascenseurs dans Chaque Bâtiment'),
      desc: tText(
        'Ascensor de última tecnología en cada uno de los 3 edificios para máxima comodidad.',
        'State-of-the-art elevators in every building ensuring complete comfort and universal access.',
        'Ascenseurs de pointe dans chacun des 3 bâtiments garantissant confort et accessibilité totale.'
      ),
    },
    {
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={amenityColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2l-1 5h4l-5 9 1-5H8l5-9z"/><rect x="5" y="18" width="14" height="4" rx="1"/><path d="M9 18v-2"/><path d="M15 18v-2"/></svg>,
      title: tText('Estación de Carga EV', 'Electric Vehicle (EV) Charging', 'Bornes de Recharge VE'),
      desc: tText(
        'Puntos de recarga para vehículos eléctricos e híbridos en el estacionamiento del residencial.',
        'Dedicated charging stations for modern electric and hybrid vehicles inside the community.',
        'Bornes de recharge dédiées aux véhicules électriques et hybrides au sein de la résidence.'
      ),
    },
    {
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={amenityColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 4v6c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V7l7-4z"/><polyline points="9 12 11 14 15 10"/></svg>,
      title: tText('Seguridad 24/7 & Control de Acceso', '24/7 Security & Access Control', "Sécurité 24/7 & Contrôle d'Accès"),
      desc: tText(
        'Residencial cerrado con garita de seguridad, cámaras HD y control de acceso permanente.',
        'Closed perimeter with permanent on-site surveillance, HD cameras, and digital entry gate.',
        "Périmètre fermé avec gardiennage permanent, caméras HD et contrôle d'accès numérique."
      ),
    },
  ];

  return (
    <div className="min-h-screen overflow-x-clip bg-[#FAFAF9] text-[#18181B] selection:bg-[#7C3AED] selection:text-white font-sans antialiased">
      {/* ========================================================================= */}
      {/* 1. MERRIDANNE CLEAN LIGHT NAVBAR WITH OFFICIAL LOGO                       */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-xl border-b border-[#E7E5E4]/80 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Official Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="relative h-12 flex items-center">
              {!logoError ? (
                <UITranslationBoundary attributes={["alt"]}><Image
                  src="/projects/uve-residences/logo.png"
                  alt="UVE Residences"
                  width={150}
                  height={50}
                  priority
                  unoptimized
                  onError={() => setLogoError(true)}
                  className="h-11 sm:h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                /></UITranslationBoundary>
              ) : (
                <div className="flex flex-col">
                  <span className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-[#0284C7] via-[#7C3AED] to-[#DB2777] bg-clip-text text-transparent font-sans"><LocalizedText text={"UVE"} /></span>
                  <span className="text-[10px] tracking-[0.2em] font-bold text-stone-600 uppercase -mt-1 font-sans"><LocalizedText text={"Residences"} /></span>
                </div>
              )}
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-6 text-[13px] font-medium text-[#52525B]">
            <a href="#features" className="hover:text-[#7C3AED] transition-colors">
              {tText('Amenidades', 'Amenities', 'Commodités')}
            </a>
            <a href="#models" className="hover:text-[#7C3AED] transition-colors">
              {tText('Modelos', 'Models', 'Modèles')}
            </a>
            <a href="#availability" className="hover:text-[#7C3AED] transition-colors">
              {tText('Disponibilidad', 'Availability', 'Disponibilité')}
            </a>
            <a href="#calculator" className="hover:text-[#7C3AED] transition-colors">
              {tText('Calculadora', 'Calculator', 'Simulateur')}
            </a>
            <a href="#location" className="hover:text-[#7C3AED] transition-colors">
              {tText('Ubicación', 'Location', 'Emplacement')}
            </a>
          </nav>

          {/* Action Buttons: Language, Portal, Primary CTA */}
          <div className="flex items-center gap-3">
            {developerProjectCount > 1 && developerProjects.length > 1 && <div className="relative hidden lg:block">
              <button
                type="button"
                onClick={() => setProjectMenuOpen((current) => !current)}
                className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-[#52525B] transition hover:border-[#7C3AED] hover:text-[#7C3AED]"
                aria-expanded={projectMenuOpen}
                aria-haspopup="menu"
              >
                <Building2 className="h-3.5 w-3.5" />
                <span><LocalizedText text={"Proyectos"} /></span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${projectMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {projectMenuOpen && (
                <div className="absolute right-0 top-full z-50 pt-2" role="menu">
                  <div className="w-64 rounded-2xl border border-stone-200 bg-white p-2 shadow-2xl">
                    <p className="px-3 pb-2 pt-1 text-[9px] font-black uppercase tracking-[0.16em] text-stone-400"><LocalizedText text={"Proyectos de "} />{project.developer || 'este desarrollador'}</p>
                    {developerProjects.map((item) => <Link key={item.slug} href={`/proyectos/${item.slug}`} onClick={() => setProjectMenuOpen(false)} className="block rounded-xl px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-stone-700 transition hover:bg-violet-50 hover:text-violet-800" role="menuitem">{item.name}</Link>)}
                  </div>
                </div>
              )}
            </div>}
            <PublicLanguageSwitcher circular />

            <Link href="/" className="hidden sm:inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-[#52525B] transition hover:border-[#7C3AED] hover:text-[#7C3AED]">
              <ArrowRight className="h-3.5 w-3.5 rotate-180" />
              <span><LocalizedText text={"Volver al portal"} /></span>
            </Link>

            <Link href={`/login?next=/proyectos/${project.slug}`} className="hidden sm:inline-flex items-center gap-2 rounded-full bg-[#0F172A] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#7C3AED]">
              <span><LocalizedText text={"Acceso brokers"} /></span>
            </Link>

            <UITranslationBoundary attributes={["aria-label"]}><button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              className="rounded-xl border border-stone-300 p-2 text-stone-700 hover:bg-stone-100 lg:hidden"
              aria-label="Toggle Menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button></UITranslationBoundary>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-[#E7E5E4] bg-white px-6 py-5 text-sm font-medium text-[#52525B] space-y-3 lg:hidden"
            >
              <Link href="/" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 font-semibold hover:text-[#7C3AED]"><LocalizedText text={"Volver al portal"} /></Link>
              <Link href={`/login?next=/proyectos/${project.slug}`} onClick={() => setMobileMenuOpen(false)} className="block rounded-full bg-[#0F172A] px-4 py-2.5 text-center font-semibold text-white hover:bg-[#7C3AED]"><LocalizedText text={"Acceso brokers"} /></Link>
              {developerProjectCount > 1 && developerProjects.length > 1 && <div className="border-b border-[#E7E5E4] pb-3">
                <button type="button" onClick={() => setProjectMenuOpen((current) => !current)} className="flex w-full items-center justify-between py-1.5 font-semibold hover:text-[#7C3AED]">
                  <span><LocalizedText text={"Proyectos"} /></span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${projectMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {projectMenuOpen && <div className="mt-2 space-y-1 rounded-2xl bg-stone-50 p-2">{developerProjects.map((item) => <Link key={item.slug} href={`/proyectos/${item.slug}`} onClick={() => { setProjectMenuOpen(false); setMobileMenuOpen(false); }} className="block rounded-xl px-3 py-2.5 text-xs font-semibold hover:bg-violet-50 hover:text-violet-800">{item.name}</Link>)}</div>}
              </div>}
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 hover:text-[#7C3AED]">
                {tText('Amenidades', 'Amenities', 'Commodités')}
              </a>
              <a href="#models" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 hover:text-[#7C3AED]">
                {tText('Modelos', 'Models', 'Modèles')}
              </a>
              <a href="#availability" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 hover:text-[#7C3AED]">
                {tText('Disponibilidad', 'Availability', 'Disponibilité')}
              </a>
              <a href="#calculator" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 hover:text-[#7C3AED]">
                {tText('Calculadora', 'Calculator', 'Simulateur')}
              </a>
              <a href="#location" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 hover:text-[#7C3AED]">
                {tText('Ubicación', 'Location', 'Emplacement')}
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ========================================================================= */}
      {/* 2. MERRIDANNE CENTERED HERO WITH RADIANT BRAND GRADIENT                   */}
      {/* ========================================================================= */}
      <section className="relative pt-16 pb-20 lg:pt-24 lg:pb-28 overflow-hidden bg-gradient-to-b from-[#FAFAF9] via-[#F8F7F4] to-[#FAFAF9] border-b border-[#E7E5E4]">
        {/* Radiant subtle brand glow in center */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[350px] bg-gradient-to-tr from-[#0284C7]/12 via-[#7C3AED]/12 to-[#EC4899]/12 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#E2E8F0_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

        <div className="relative mx-auto max-w-5xl px-4 text-center sm:px-6">
          {/* The two context labels share one wrapping row so they never collide at tablet widths. */}
          <div className="mb-8 flex flex-wrap items-center justify-center gap-3">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeInUp}
              className="inline-flex max-w-full items-center gap-2.5 rounded-full border border-[#7C3AED]/25 bg-white/90 px-4 py-1.5 text-center text-xs font-semibold leading-5 text-[#3F3F46] shadow-sm backdrop-blur-md"
            >
              <span className="h-2 w-2 shrink-0 rounded-full bg-gradient-to-r from-[#0284C7] to-[#EC4899] animate-pulse" />
              <span className="uppercase tracking-wider">
                {tText('Vive como en un Resort · Resort Style Living', 'Resort Style Living · Brisas - Downtown Punta Cana', 'Style de Vie Resort · Brisas - Downtown Punta Cana')}
              </span>
            </motion.div>
            <div className="inline-flex max-w-full rounded-full border border-white/20 bg-[#0a1140]/90 px-4 py-2 text-center text-[10px] font-black uppercase leading-5 tracking-[0.14em] text-white shadow-sm">
              {developerProjectCount} {developerProjectCount === 1 ? 'Desarrollo' : 'Desarrollos'}
            </div>
          </div>

          {/* Centered Big Headline with Signature Gradient Accent (Infopack Pág. 2) */}
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0F172A] leading-[1.14]"
          >
            {locale === 'en' ? (
              <><LocalizedText text={"There are projects you buy... and projects where you"} />{' '}
                <span className="bg-gradient-to-r from-[#0284C7] via-[#7C3AED] to-[#DB2777] bg-clip-text text-transparent"><LocalizedText text={"live differently."} /></span>
              </>
            ) : locale === 'fr' ? (
              <><LocalizedText text={"Il y a des projets qu&apos;on achète... et des projets où"} />{' '}
                <span className="bg-gradient-to-r from-[#0284C7] via-[#7C3AED] to-[#DB2777] bg-clip-text text-transparent"><LocalizedText text={"on vit différemment."} /></span>
              </>
            ) : (
              <><LocalizedText text={"Hay proyectos que se compran... y proyectos en los que"} />{' '}
                <span className="bg-gradient-to-r from-[#0284C7] via-[#7C3AED] to-[#DB2777] bg-clip-text text-transparent"><LocalizedText text={"se vive diferente."} /></span>
              </>
            )}
          </motion.h1>

          {/* Subheader (Infopack Pág. 2 & 4) */}
          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="mt-6 text-base sm:text-lg text-[#52525B] max-w-3xl mx-auto leading-relaxed font-normal"
          >
            {tText(
              'UVE RESIDENCE no es solo un proyecto en Punta Cana: es tu acceso a un estilo de vida que muy pocos tienen. Arquitectura moderna y distribución inteligente en solo 21 exclusivas residencias a 4 minutos de Downtown Punta Cana, con transporte diario incluido a Playa Jellyfish.',
              'UVE RESIDENCE is not just another development in Punta Cana: it is your access to a lifestyle very few enjoy. Modern architecture and smart layouts across only 21 exclusive residences, just 4 minutes from Downtown with daily shuttle included to Jellyfish Beach.',
              'UVE RESIDENCE n\'est pas un simple projet à Punta Cana : c\'est votre accès à un style de vie rare. Une architecture moderne et une distribution intelligente réparties sur seulement 21 résidences exclusives à 4 minutes de Downtown Punta Cana, avec navette quotidienne incluse vers la plage Jellyfish.'
            )}
          </motion.p>

          {/* Dual Action Buttons */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <a
              href="#availability"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-[#0284C7] via-[#7C3AED] to-[#DB2777] hover:opacity-95 text-white font-semibold text-sm transition-all shadow-lg shadow-[#7C3AED]/25 hover:shadow-xl hover:shadow-[#7C3AED]/35 hover:-translate-y-0.5"
            >
              <span>{tText('Ver Disponibilidad', 'Explore Availability', 'Voir la Disponibilité')}</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <a
              href={buildWhatsappLink(tText('Hola! Quisiera descargar el dossier oficial de UVE Residences.', 'Hello! I would like to download the official dossier of UVE Residences.', 'Bonjour! Je souhaite télécharger le dossier officiel d\'UVE Residences.'))}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 font-semibold text-sm transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
            >
              <Download className="w-4 h-4 text-[#7C3AED]" />
              <span>{tText('Descargar Dossier', 'Download Dossier', 'Télécharger le Dossier')}</span>
            </a>
          </motion.div>

          {/* Key Developer Highlights Pills (Infopack Pág. 6 & 7) */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5 text-xs text-[#52525B] font-medium">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 border border-stone-200 shadow-sm">
              <Building2 className="w-3.5 h-3.5 text-[#7C3AED]" />
              {tText('Solo 21 Residencias · 3 Niveles con Ascensor', 'Only 21 Residences · 3 Levels with Elevator', 'Seulement 21 Résidences · 3 Niveaux avec Ascenseur')}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 border border-stone-200 shadow-sm">
              <Bus className="w-3.5 h-3.5 text-[#0284C7]" />
              {tText('Shuttle Diario a Playa Jellyfish Incluido', 'Daily Shuttle to Jellyfish Beach Included', 'Navette Quotidienne Plage Jellyfish Incluse')}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 border border-stone-200 shadow-sm">
              <Clock className="w-3.5 h-3.5 text-[#EC4899]" />
              {tText('A 4 min de Downtown Punta Cana', '4 min from Downtown Punta Cana', 'À 4 min de Downtown Punta Cana')}
            </span>
          </div>

          {/* Large Clean Hero Photo with Soft Shadow */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInScale}
            className="group relative mt-12 overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xl"
          >
            <div className="relative aspect-[4/3] overflow-hidden sm:aspect-[16/9]">
              <UITranslationBoundary attributes={["alt"]}><Image
                src={'/projects/uve-residences/exterior-cover.jpg'}
                alt="UVE Residences Punta Cana"
                fill
                priority
                className="object-cover transition-transform duration-1000 group-hover:scale-105"
              /></UITranslationBoundary>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>

            {/* Summary stays in flow on touch screens so long project data cannot cover the photo. */}
            <div className="relative flex flex-col items-start gap-3 border-stone-200 bg-white/95 p-4 text-left sm:absolute sm:bottom-5 sm:left-5 sm:right-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:rounded-2xl sm:border sm:backdrop-blur-md sm:shadow-lg">
              <div className="grid gap-1.5 text-[11px] font-medium leading-5 text-[#52525B] sm:flex sm:flex-wrap sm:items-center sm:gap-6 sm:text-xs">
                <div className="text-[#0F172A] font-semibold">
                  <span><LocalizedText text={"Brisas - Downtown Punta Cana"} /></span>
                </div>
                <div className="hidden sm:block">•</div>
                <div>{tText('21 Unidades Exclusivas', '21 Exclusive Units', '21 Unités Exclusives')}</div>
                <div className="hidden sm:block">•</div>
                <div>{tText('Entrega ' + deliveryLabel, 'Delivery ' + deliveryLabel, 'Livraison ' + deliveryLabel)}</div>
              </div>

              <div className="flex items-baseline gap-2 sm:shrink-0">
                <span className="text-xs text-[#71717A] uppercase font-semibold">{tText('Desde:', 'From:', 'À partir de:')}</span>
                <span className="text-lg font-bold bg-gradient-to-r from-[#0284C7] to-[#7C3AED] bg-clip-text text-transparent"><LocalizedText text={"US$ "} />{formatPrice(UVE_CALC_MODELS[0].price)}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. MERRIDANNE "WHAT WE DO" / 6-CARD AMENITY GRID                          */}
      {/* ========================================================================= */}
      <section id="features" className="py-20 lg:py-28 border-b border-[#E7E5E4] bg-[#FAFAF9]">
        <div className="max-w-7xl mx-auto px-6">
          {/* 12-Column Split Header */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end pb-14">
            <div className="lg:col-span-7 space-y-3">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#52525B]">
                <span className="w-2 h-2 rounded-full bg-[#7C3AED]" />
                <span>{tText('Amenidades & Estilo de Vida', 'What We Offer', 'Commodités & Style de Vie')}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0F172A] leading-tight">
                {locale === 'en' ? (
                  <><LocalizedText text={"Everything a modern sanctuary "} /><span className="text-[#7C3AED]"><LocalizedText text={"needs"} /></span>
                  </>
                ) : locale === 'fr' ? (
                  <><LocalizedText text={"Tout ce dont un sanctuaire moderne "} /><span className="text-[#7C3AED]"><LocalizedText text={"a besoin"} /></span>
                  </>
                ) : (
                  <><LocalizedText text={"Todo lo que un santuario moderno "} /><span className="text-[#7C3AED]"><LocalizedText text={"necesita"} /></span>
                  </>
                )}
              </h2>
            </div>

            <div className="lg:col-span-5 space-y-4">
              <p className="text-sm sm:text-base text-[#52525B] leading-relaxed">
                {tText(
                  'Desde piscina estilo resort y sauna hasta shuttle privado a la playa — UVE Residences combina confort supremo y alta rentabilidad en renta turística.',
                  'From resort-style wellness facilities to private beach transport — UVE Residences is designed for effortless everyday living and vacation rental returns.',
                  'De la piscine style resort au sauna et navette privée pour la plage — UVE Residences allie confort supérieur et forte rentabilité locative touristique.'
                )}
              </p>
              <a
                href="#about"
                className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-[#7C3AED] hover:text-[#6D28D9] transition-colors"
              >
                <span>{tText('Conocer el Concepto', 'Read Full Concept', 'Découvrir le Concept')}</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* 3-Column Feature Cards Grid (Exact Merridanne box-shadow-01) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuresList.map((feat, idx) => (
              <motion.div
                key={idx}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                variants={fadeInUp}
                className="p-8 rounded-2xl bg-white border border-stone-200/80 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="space-y-6">
                  {/* Merridanne Rounded Square Icon Box */}
                  <div className="w-12 h-12 rounded-xl bg-[#7C3AED]/10 border border-[#7C3AED]/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {feat.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#0F172A] mb-2">
                      {feat.title}
                    </h3>
                    <p className="text-sm text-[#52525B] leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. SPOTLIGHT SECTION: DUAL COLUMN WITH MINI CARDS & ARCHITECTURAL PHOTO   */}
      {/* ========================================================================= */}
      <section id="about" className="py-20 lg:py-28 border-b border-[#E7E5E4] bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Column: Narrative & Mini Feature Cards (Infopack Pág. 4) */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#52525B]">
                <span className="w-2 h-2 rounded-full bg-[#7C3AED]" />
                <span>{tText('Diseño & Arquitectura Moderna', 'Design & Modern Architecture', 'Design & Architecture Moderne')}</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A] leading-tight">
                {locale === 'en' ? (
                  <><LocalizedText text={"Modern architecture in "} /><span className="text-[#7C3AED]"><LocalizedText text={"every single detail"} /></span>
                  </>
                ) : locale === 'fr' ? (
                  <><LocalizedText text={"Design et architecture moderne dans "} /><span className="text-[#7C3AED]"><LocalizedText text={"chaque détail"} /></span>
                  </>
                ) : (
                  <><LocalizedText text={"Diseño y arquitectura moderna en "} /><span className="text-[#7C3AED]"><LocalizedText text={"cada detalle"} /></span>
                  </>
                )}
              </h2>

              <p className="text-sm sm:text-base text-[#52525B] leading-relaxed">
                {tText(
                  'UVE RESIDENCE combina arquitectura moderna con una distribución inteligente, logrando espacios que fluyen de manera natural y aprovechan al máximo la luz, la ventilación y el entorno tropical. Ubicado en una zona en crecimiento de Punta Cana, el proyecto ofrece una conexión ideal entre tranquilidad y accesibilidad, convirtiéndose en una opción atractiva tanto para vivir como para invertir. Un concepto pensado para quienes buscan equilibrio, estilo y valor a largo plazo.',
                  'UVE RESIDENCE combines modern architecture with intelligent floor plans, crafting spaces that flow seamlessly to maximize light, cross ventilation, and the tropical surroundings. Located in a growing area of Punta Cana, the project delivers an ideal balance of tranquility and connectivity, making it an exceptional opportunity for living or investing. Designed for those seeking balance, elevated style, and sustained long-term value.',
                  'UVE RESIDENCE conjugue architecture contemporaine et agencement intelligent, créant des espaces fluides et baignés de lumière naturelle, de ventilation croisée et de nature tropicale. Situé dans un secteur en pleine expansion de Punta Cana, ce projet offre un équilibre idéal entre sérénité et accessibilité, idéal pour y vivre ou y investir. Un concept conçu pour ceux qui recherchent harmonie, élégance et valorisation patrimoniale.'
                )}
              </p>

              {/* 2 Mini Feature Cards (Merridanne feature-card-02) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200">
                  <div className="w-9 h-9 rounded-lg bg-[#7C3AED]/10 text-[#7C3AED] flex items-center justify-center font-bold text-sm mb-3">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-[#0F172A]">
                    {tText('Distribución Inteligente', 'Smart Distribution', 'Agencement Intelligent')}
                  </h4>
                  <p className="text-xs text-[#71717A] mt-1.5 leading-relaxed">
                    {tText(
                      'Apartamentos de 2 habitaciones y 2 a 3 baños con terrazas privadas y ventilación cruzada continua.',
                      '2-bedroom, 2 to 3-bathroom residences with private terraces and continuous cross breezes.',
                      'Appartements de 2 chambres et 2 à 3 salles de bain avec terrasses privatives et ventilation traversante.'
                    )}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200">
                  <div className="w-9 h-9 rounded-lg bg-[#7C3AED]/10 text-[#7C3AED] flex items-center justify-center font-bold text-sm mb-3">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-[#0F172A]">
                    {tText('Estilo de Vida Resort', 'Resort Style Living', 'Style de Vie Resort')}
                  </h4>
                  <p className="text-xs text-[#71717A] mt-1.5 leading-relaxed">
                    {tText(
                      'Piscina, jacuzzi, sauna, gimnasio, shuttle a la playa y seguridad 24/7 en solo 21 residencias.',
                      'Pool, jacuzzi, sauna, gym, beach shuttle, and 24/7 security in a boutique community of only 21 residences.',
                      'Piscine, jacuzzi, sauna, salle de sport, navette plage et sécurité 24/7 au sein d\'une communauté de 21 unités.'
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Clean Architectural Image Frame */}
            <div className="lg:col-span-6 relative aspect-[4/3] rounded-3xl overflow-hidden border border-stone-200 shadow-xl bg-stone-100 group">
              <UITranslationBoundary attributes={["alt"]}><Image
                src="/projects/uve-residences/type-a.jpeg"
                alt="UVE Residences Interior Architecture"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              /></UITranslationBoundary>
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 p-4 rounded-xl bg-white/90 backdrop-blur-md border border-stone-200 text-xs font-medium text-[#0F172A] shadow-md flex items-center justify-between">
                <span>{tText('Modelos contemporáneos de 96 m² y 115 m²', 'Contemporary layouts of 96 m² and 115 m²', 'Modèles contemporains de 96 m² et 115 m²')}</span>
                <span className="text-[#7C3AED] font-bold">{tText('2 Habitaciones', '2 Bedrooms', '2 Chambres')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5B. EXCLUSIVE BENEFIT CALLOUT: BEACH SHUTTLE (Infopack Pág. 27)           */}
      {/* ========================================================================= */}
      <section className="py-12 border-b border-[#E7E5E4] bg-gradient-to-r from-sky-50/60 via-indigo-50/40 to-pink-50/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="rounded-3xl border border-[#7C3AED]/20 bg-white/95 backdrop-blur-md p-8 sm:p-10 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0284C7]/10 text-[#0284C7] text-xs font-bold uppercase tracking-wider">
                <Bus className="w-3.5 h-3.5" />
                <span>{tText('Beneficio Exclusivo · Transporte Diario Incluido', 'Exclusive Amenity · Daily Shuttle Included', 'Avantage Exclusif · Navette Quotidienne Incluse')}</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                {tText('Transporte exclusivo directo a Playa Jellyfish', 'Exclusive direct shuttle to Jellyfish Beach', 'Navette exclusive directe vers la Plage Jellyfish')}
              </h3>
              <p className="text-xs sm:text-sm text-[#52525B] leading-relaxed">
                {tText(
                  'UVE RESIDENCE incluye transporte diario a Playa Jellyfish con salidas programadas varias veces al día, brindando a residentes y huéspedes un beneficio exclusivo que aumenta el atractivo del proyecto para renta vacacional. Una ventaja competitiva que eleva el valor de tu inversión.',
                  'UVE RESIDENCE provides daily scheduled transport to Jellyfish Beach multiple times a day, granting residents and vacation rental guests an exclusive amenity that significantly enhances rental demand. A standout competitive edge that boosts your investment value.',
                  'UVE RESIDENCE inclut une navette quotidienne régulière vers la Plage Jellyfish avec plusieurs départs par jour, offrant aux résidents et locataires saisonniers un privilège rare qui maximise la demande locative. Un avantage concurrentiel déterminant pour votre investissement.'
                )}
              </p>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <div className="text-center sm:text-right">
                <div className="text-2xl font-black text-[#7C3AED]"><LocalizedText text={"15 Mins"} /></div>
                <div className="text-xs text-[#71717A]">{tText('Playa Jellyfish', 'Jellyfish Beach', 'Plage Jellyfish')}</div>
              </div>
              <a
                href={buildWhatsappLink(tText('Hola! Quisiera conocer los detalles del shuttle diario a Playa Jellyfish de UVE Residences.', 'Hello! I would like to know the details of the daily shuttle to Jellyfish Beach at UVE Residences.', 'Bonjour! Je souhaite connaître les détails de la navette quotidienne vers la Plage Jellyfish d\'UVE Residences.'))}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-gradient-to-r from-[#0284C7] to-[#7C3AED] hover:opacity-95 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-[#7C3AED]/20"
              >
                <span>{tText('Consultar Shuttle', 'Inquire About Shuttle', 'En Savoir Plus')}</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. ¿POR QUÉ UVE RESIDENCE? 6 RAZONES DE INVERSIÓN (Infopack Pág. 31)      */}
      {/* ========================================================================= */}
      <section id="investment" className="py-20 lg:py-28 border-b border-[#E7E5E4] bg-[#FAFAF9]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#52525B] mb-3">
              <span className="w-2 h-2 rounded-full bg-[#7C3AED]" />
              <span>{tText('¿Por Qué UVE Residence?', 'Why UVE Residence?', 'Pourquoi UVE Residence ?')}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A]">
              {locale === 'en' ? (
                <><LocalizedText text={"An investment that "} /><span className="text-[#7C3AED]"><LocalizedText text={"makes sense"} /></span>
                </>
              ) : locale === 'fr' ? (
                <><LocalizedText text={"Un investissement qui a "} /><span className="text-[#7C3AED]"><LocalizedText text={"du sens"} /></span>
                </>
              ) : (
                <><LocalizedText text={"Una inversión que "} /><span className="text-[#7C3AED]"><LocalizedText text={"tiene sentido"} /></span>
                </>
              )}
            </h2>
            <p className="mt-4 text-xs sm:text-sm text-[#52525B] leading-relaxed">
              {tText(
                'Punta Cana es hoy uno de los destinos con mayor crecimiento inmobiliario del Caribe. UVE RESIDENCE está ubicado en una zona en expansión, a minutos de Downtown, con transporte diario a la playa y amenidades tipo resort. Una combinación difícil de encontrar a este precio.',
                'Punta Cana is among the fastest growing real estate destinations in the Caribbean. UVE RESIDENCE is strategically positioned in an expanding district, minutes from Downtown, with daily beach shuttle service and resort-caliber amenities. An unmatched value proposition.',
                'Punta Cana figure parmi les destinations immobilières à plus forte croissance des Caraïbes. UVE RESIDENCE se situe dans une zone en plein essor, à quelques minutes de Downtown, avec navette privée vers la plage et prestations resort. Une proposition de valeur unique.'
              )}
            </p>
          </div>

          {/* 6 Reasons Bento Grid from PDF Page 31 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Reason 1 */}
            <div className="p-8 rounded-2xl bg-white border border-stone-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-3xl font-extrabold text-[#0F172A] tracking-tight">
                  {tText('21 Unidades', '21 Units', '21 Unités')}
                </div>
                <div className="text-sm font-semibold text-[#7C3AED] mt-1.5">
                  {tText('Exclusividad & Privacidad', 'Exclusivity & Privacy', 'Exclusivité & Intimité')}
                </div>
              </div>
              <p className="text-xs text-[#71717A] mt-4 leading-relaxed">
                {tText(
                  'Solo 21 residencias exclusivas distribuidas en 3 edificios boutique de 3 niveles con ascensor. Baja densidad que garantiza tranquilidad.',
                  'Only 21 boutique residences across three 3-level buildings with elevators. Low density ensuring privacy and tranquility.',
                  'Seulement 21 résidences réparties sur 3 bâtiments de 3 niveaux avec ascenseur. Faible densité garantissant un calme absolu.'
                )}
              </p>
            </div>

            {/* Reason 2 */}
            <div className="p-8 rounded-2xl bg-white border border-stone-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-3xl font-extrabold text-[#0F172A] tracking-tight">
                  {tText('4 Minutos', '4 Minutes', '4 Minutes')}
                </div>
                <div className="text-sm font-semibold text-[#0284C7] mt-1.5">
                  {tText('A Downtown Punta Cana', 'To Downtown Punta Cana', 'De Downtown Punta Cana')}
                </div>
              </div>
              <p className="text-xs text-[#71717A] mt-4 leading-relaxed">
                {tText(
                  'Conexión inmediata a supermercados, farmacias, bancos, restaurantes, Coco Bongo y toda la vida activa de Punta Cana.',
                  'Immediate access to supermarkets, pharmacies, banks, dining, Coco Bongo, and the vibrant life of Punta Cana.',
                  'Accès direct aux supermarchés, banques, pharmacies, restaurants réputés et animations de Downtown.'
                )}
              </p>
            </div>

            {/* Reason 3: Signature Purple Card */}
            <div className="p-8 rounded-2xl bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/20 flex flex-col justify-between">
              <div>
                <div className="text-3xl font-extrabold tracking-tight">
                  {tText('Shuttle VIP', 'VIP Shuttle', 'Navette VIP')}
                </div>
                <div className="text-sm font-semibold mt-1.5 text-white/95">
                  {tText('Transporte Diario a la Playa', 'Daily Beach Shuttle', 'Transport Quotidien Plage')}
                </div>
              </div>
              <p className="text-xs text-white/85 mt-4 leading-relaxed">
                {tText(
                  'Transporte diario programado con acceso directo a Playa Jellyfish. Beneficio exclusivo de UVE Residence que eleva la demanda en rentas cortas.',
                  'Daily scheduled shuttle service with direct access to Jellyfish Beach. An exclusive UVE benefit fueling short-term rental occupancy.',
                  'Service de navette quotidien direct vers la plage Jellyfish. Un atout exclusif pour booster les réservations courte durée.'
                )}
              </p>
            </div>

            {/* Reason 4 */}
            <div className="p-8 rounded-2xl bg-white border border-stone-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-3xl font-extrabold text-[#0F172A] tracking-tight">
                  {tText('Arquitectura contemporánea', 'Contemporary Architecture', 'Architecture contemporaine')}
                </div>
                <div className="text-sm font-semibold text-[#0F172A] mt-1.5">
                  {tText('Distribución pensada para vivir', 'Designed for Everyday Living', 'Conçu pour le quotidien')}
                </div>
              </div>
              <p className="text-xs text-[#71717A] mt-4 leading-relaxed">
                {tText(
                  'Arquitectura moderna, terrazas privadas y acabados residenciales presentados en la información comercial del proyecto.',
                  'Modern architecture, private terraces, and residential finishes presented in the project\'s commercial information.',
                  'Architecture moderne, terrasses privées et finitions résidentielles présentées dans les informations commerciales du projet.'
                )}
              </p>
            </div>

            {/* Reason 5 */}
            <div className="p-8 rounded-2xl bg-white border border-stone-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-3xl font-extrabold text-[#0F172A] tracking-tight">
                  {tText('Renta Vacacional', 'Vacation Rental', 'Location Saisonnière')}
                </div>
                <div className="text-sm font-semibold text-emerald-600 mt-1.5">
                  {tText('Alta Rentabilidad (Airbnb)', 'High Rental Yields (Airbnb)', 'Forte Rentabilité (Airbnb)')}
                </div>
              </div>
              <p className="text-xs text-[#71717A] mt-4 leading-relaxed">
                {tText(
                  'Configuración ideal de 2 habitaciones con amenidades tipo resort que maximizan el precio por noche y la ocupación en plataformas turísticas.',
                  'Prime 2-bedroom layouts with resort amenities, engineered to maximize average daily rates and high occupancy on booking portals.',
                  "Configuration 2 chambres idéale avec prestations hôtelières maximisant le tarif à la nuitée et le taux d'occupation."
                )}
              </p>
            </div>

            {/* Reason 6 */}
            <div className="p-8 rounded-2xl bg-white border border-stone-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-3xl font-extrabold text-[#0F172A] tracking-tight">
                  {tText('Alta Plusvalía', 'High Capital Growth', 'Forte Plus-Value')}
                </div>
                <div className="text-sm font-semibold text-[#EC4899] mt-1.5"><LocalizedText text={"Brisas de Punta Cana"} /></div>
              </div>
              <p className="text-xs text-[#71717A] mt-4 leading-relaxed">
                {tText(
                  'Ubicado en una zona residencial en plena expansión y valorización acelerada en el destino de mayor crecimiento del Caribe.',
                  'Situated in an expanding residential corridor enjoying accelerated capital appreciation across the Caribbean\'s premier hub.',
                  'Implanté dans un secteur résidentiel en pleine valorisation au cœur de la destination phare des Caraïbes.'
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. ARCHITECTURE & LIFESTYLE GALLERY (AUTHENTIC UVE SPACES)                */}
      {/* ========================================================================= */}
      <section id="gallery" className="py-20 lg:py-28 border-b border-[#E7E5E4] bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-stone-200">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#52525B] mb-2">
                <span className="w-2 h-2 rounded-full bg-gradient-to-r from-[#0284C7] to-[#EC4899]" />
                <span>{tText('Espacios & Estilo de Vida', 'Lifestyle & Spaces', 'Espaces & Style de Vie')}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A]">
                {locale === 'en' ? (
                  <><LocalizedText text={"Architecture crafted for"} />{' '}
                    <span className="bg-gradient-to-r from-[#0284C7] via-[#7C3AED] to-[#DB2777] bg-clip-text text-transparent"><LocalizedText text={"elevated living"} /></span>
                  </>
                ) : locale === 'fr' ? (
                  <><LocalizedText text={"Une architecture conçue pour un"} />{' '}
                    <span className="bg-gradient-to-r from-[#0284C7] via-[#7C3AED] to-[#DB2777] bg-clip-text text-transparent"><LocalizedText text={"style de vie d&apos;exception"} /></span>
                  </>
                ) : (
                  <><LocalizedText text={"Arquitectura para un"} />{' '}
                    <span className="bg-gradient-to-r from-[#0284C7] via-[#7C3AED] to-[#DB2777] bg-clip-text text-transparent"><LocalizedText text={"estilo de vida superior"} /></span>
                  </>
                )}
              </h2>
            </div>
            <p className="text-xs text-[#71717A] uppercase tracking-wider font-semibold">
              {tText('21 Residencias Exclusivas · Arquitectura contemporánea', '21 Exclusive Units · Contemporary Architecture', '21 Résidences Exclusives · Architecture contemporaine')}
            </p>
            <BrandedGalleryDownload projectId={project.id} projectName={project.name} images={galleryImages} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0F172A] px-5 py-3 text-[10px] font-bold uppercase tracking-[.14em] text-white transition hover:bg-[#7C3AED] disabled:cursor-not-allowed disabled:opacity-60" label={tText('Descargar galería con sello OB', 'Download OB-branded gallery', 'Télécharger la galerie avec sceau OB')} />
          </div>

          {/* 6 Authentic Gallery Cards */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-12"
          >
            {[
              {
                title: tText('Piscina Resort & Solárium', 'Resort Pool & Sun Deck', 'Piscine Resort & Solarium'),
                desc: tText('Piscina estilo resort con áreas de descanso, camastros sumergidos y jardinería tropical.', 'Beach-entry swimming pool surrounded by tropical vegetation and private loungers.', 'Piscine style resort avec espaces de détente, transats immergés et jardins tropicaux.'),
                tag: tText('Exterior & Ocio', 'Outdoor & Leisure', 'Extérieur & Loisirs'),
                image: '/projects/uve-residences/pool.jpeg',
              },
              {
                title: tText('Gimnasio Wellness Climatizado', 'Equipped Wellness Gym', 'Salle de Sport Wellness Climatisée'),
                desc: tText('Zona fitness con equipamiento de fuerza y cardio, climatizada para entrenamiento diario.', 'Fully equipped fitness zone curated for strength, cardio, and holistic well-being.', 'Espace fitness complet pour le renforcement et le cardio, climatisé pour l\'entraînement quotidien.'),
                tag: tText('Bienestar', 'Wellness', 'Bien-être'),
                image: '/projects/uve-residences/gym.png',
              },
              {
                title: tText('Vista Aérea & Masterplan', 'Aerial Masterplan Enclave', 'Vue Aérienne & Plan Masse'),
                desc: tText('Enclave cerrado con garita de seguridad y baja densidad en Brisas de Punta Cana.', 'Private gated enclave of just 21 boutique units in Brisas de Punta Cana.', 'Enclave sécurisée et fermée de seulement 21 unités de prestige à Brisas de Punta Cana.'),
                tag: tText('Comunidad', 'Community', 'Communauté'),
                image: '/projects/uve-residences/aerial.png',
              },
              {
                title: tText('Rooftops Privados en Penthouses', 'Private Rooftop Penthouses', 'Rooftops Privatifs en Penthouses'),
                desc: tText('Terrazas privadas solárium de 96 m² a 115 m² en el tercer nivel para vistas panorámicas.', 'Expansive 96 m² to 115 m² private terraces on level 3 with space for jacuzzi and BBQ.', 'Terrasses privatives de 96 m² à 115 m² au troisième niveau offrant une vue panoramique.'),
                tag: tText('Exclusivo Nivel 3', 'Exclusive 3rd Level', 'Exclusif 3ème Étage'),
                image: '/projects/uve-residences/penthouse.jpeg',
              },
              {
                title: tText('Sala & Comedor Contemporáneo', 'Luminous Open Living', 'Séjour Contemporain & Lumineux'),
                desc: tText('Concepto abierto que fusiona sala, comedor y cocina con ventilación cruzada y luz natural.', 'Seamless integration with sliding glass doors, natural cross breeze, and morning sunlight.', 'Espace de vie ouvert intégrant salon, salle à manger et cuisine avec clarté et brise naturelle.'),
                tag: tText('Interiores', 'Interiors', 'Intérieurs'),
                image: '/projects/uve-residences/type-a.jpeg',
              },
              {
                title: tText('Suites con Balcón Privado', 'Private Balconies & Suites', 'Suites avec Balcon Privatif'),
                desc: tText('Dormitorios principales con acabados de primera, carpintería fina y baño privado.', 'Master bedrooms with walk-in closet, imported porcelain tiles, and luxury en-suite bathroom.', 'Chambres principales avec finitions de premier ordre, dressing et salle de bain privative.'),
                tag: tText('Descanso', 'Rest & Comfort', 'Repos & Confort'),
                image: '/projects/uve-residences/type-b.jpeg',
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                variants={fadeInUp}
                className="group relative rounded-3xl overflow-hidden border border-stone-200/90 bg-[#FAFAF9] shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col"
              >
                <div className="relative aspect-[16/11] overflow-hidden bg-stone-100">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                  <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[11px] font-bold text-[#0F172A] shadow-sm">
                    {item.tag}
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-[#0F172A] mb-1.5 group-hover:text-[#7C3AED] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#52525B] leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-stone-200/60 mt-4 flex items-center justify-between">
                    <span className="text-[11px] text-[#71717A] font-medium"><LocalizedText text={"UVE Residences"} /></span>
                    <a
                      href={buildWhatsappLink(`Hola! Quisiera más detalles e imágenes de ${item.title} en UVE Residences.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#7C3AED] hover:text-[#6D28D9] transition-colors"
                    >
                      <span>{tText('Consultar', 'Inquire', 'Consulter')}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7B. MODELOS RESIDENCIALES: TIPO A & TIPO B (Infopack Págs. 8, 17, 33)     */}
      {/* ========================================================================= */}
      <section id="models" className="py-20 lg:py-28 border-b border-[#E7E5E4] bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-12 border-b border-stone-200">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#52525B] mb-2">
                <span className="w-2 h-2 rounded-full bg-[#7C3AED]" />
                <span>{tText('Modelos de Apartamentos', 'Apartment Models', 'Modèles d\'Appartements')}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A]">
                {locale === 'en' ? (
                  <><LocalizedText text={"Two layouts crafted for "} /><span className="text-[#7C3AED]"><LocalizedText text={"smart living"} /></span>
                  </>
                ) : locale === 'fr' ? (
                  <><LocalizedText text={"Deux configurations pensées pour votre "} /><span className="text-[#7C3AED]"><LocalizedText text={"confort"} /></span>
                  </>
                ) : (
                  <><LocalizedText text={"Dos configuraciones pensadas para tu "} /><span className="text-[#7C3AED]"><LocalizedText text={"comodidad"} /></span>
                  </>
                )}
              </h2>
            </div>
            <p className="text-xs text-[#71717A] uppercase tracking-wider font-semibold">
              {tipoA ? `${tipoA.badge} (${tipoA.constructionAreaSqm} m²)` : 'Tipo A'} & {tipoB ? `${tipoB.badge} (${tipoB.constructionAreaSqm} m²)` : 'Tipo B'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-12">
            {[tipoA, tipoB].filter(Boolean).map((typ) => {
              const accent = typ.accentColor || typ.badgeColor || '#7C3AED';
              const typName = tTyp(typ.name, typ.nameEn, typ.nameFr);
              const typTagline = tTyp(typ.tagline, typ.taglineEn, typ.taglineFr);
              const typDesc = tTyp(typ.description, typ.descriptionEn, typ.descriptionFr);
              const typBadge = `${typ.name.replace('Apartamento ', '')} · ${typ.constructionAreaSqm} m²`;
              const firstFilter = typ.pricingLevels?.[0]?.inventoryFilter || typ.name.replace('Apartamento ', '');
              const globalMin = livePriceOrNull(firstFilter);
              const waMsg = tTyp(typ.whatsappMessage || `Hola! Quisiera más información sobre ${typ.name}.`, typ.whatsappMessageEn, typ.whatsappMessageFr);
              const shortName = typ.name.replace('Apartamento ', '');
              const shortNameEn = (typ.nameEn || '').replace('Apartment ', '') || shortName;
              const shortNameFr = (typ.nameFr || '').replace('Appartement ', '') || shortName;
              const ctaLabel = tTyp(`Consultar Modelo ${shortName}`, `Inquire About ${shortNameEn}`, `Consulter Modèle ${shortNameFr}`);

              return (
                <div key={typ.key} className="rounded-3xl border border-stone-200 bg-[#FAFAF9] overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="relative aspect-[16/10] overflow-hidden bg-stone-100">
                      <Image
                        src={typ.image}
                        alt={`${typName} - UVE Residences`}
                        fill
                        className="object-cover transition-transform duration-700 hover:scale-105"
                      />
                      <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-xs font-bold text-[#0F172A] shadow-sm">
                        {typBadge}
                      </div>
                      {globalMin !== null ? (
                        <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-white text-xs font-bold shadow-sm" style={{ backgroundColor: accent }}>
                          {tText(`Desde US$ ${formatPrice(globalMin)}`, `From US$ ${formatPrice(globalMin)}`, `À partir de US$ ${formatPrice(globalMin)}`)}
                        </div>
                      ) : (
                        <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-stone-400 text-white text-xs font-bold shadow-sm">
                          {tText('No disponible', 'Not available', 'Non disponible')}
                        </div>
                      )}
                    </div>

                    <div className="p-7 space-y-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-2xl font-bold text-[#0F172A]">{typName}</h3>
                          <p className="text-xs text-[#71717A] mt-0.5">{typTagline}</p>
                        </div>
                      </div>

                      <p className="text-xs text-[#52525B] leading-relaxed">{typDesc}</p>

                      {typ.pricingLevels && typ.pricingLevels.length > 0 && (
                        <div className="rounded-2xl bg-white border border-stone-200 p-4 space-y-2 text-xs">
                          <div className="font-bold text-[#0F172A] pb-1 border-b border-stone-100 text-[11px] uppercase tracking-wider">
                            {tText('Precios Oficiales por Nivel:', 'Official Pricing by Level:', 'Tarifs Officiels par Niveau :')}
                          </div>
                          {typ.pricingLevels.map((lvl, i) => {
                            const lvlPrice = livePriceOrNull(lvl.inventoryFilter, lvl.floor);
                            const lvlLabel = tTyp(lvl.label, lvl.labelEn, lvl.labelFr);
                            return (
                              <div key={lvl.key} className={`flex justify-between items-center py-1 ${i > 0 ? 'border-t border-stone-100' : ''}`}>
                                <span className="text-[#52525B]">{lvlLabel}</span>
                                {lvlPrice !== null ? (
                                  <span className="font-bold" style={{ color: lvl.accent ? accent : '#0F172A' }}><LocalizedText text={"US$ "} />{formatPrice(lvlPrice)}</span>
                                ) : (
                                  <span className="font-medium text-stone-400 italic">{tText('No disponible', 'Not available', 'Non disponible')}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-7 pt-0">
                    <a
                      href={buildWhatsappLink(waMsg)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 font-bold text-xs uppercase tracking-wider transition-all shadow-sm"
                      style={{ '--hover-accent': accent } as React.CSSProperties}
                    >
                      <span>{ctaLabel}</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. LIVE AVAILABILITY INVENTORY EXPLORER                                   */}
      {/* ========================================================================= */}
      <section id="availability" className="py-20 lg:py-28 border-b border-[#E7E5E4] bg-[#FAFAF9]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-stone-200">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#52525B] mb-2">
                <span className="w-2 h-2 rounded-full bg-[#7C3AED]" />
                <span>{tText('Disponibilidad en Vivo', 'Live Availability', 'Disponibilité en Direct')}</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A]">
                {locale === 'en' ? (
                  <><LocalizedText text={"Available "} /><span className="text-[#7C3AED]"><LocalizedText text={"units"} /></span>
                  </>
                ) : locale === 'fr' ? (
                  <><LocalizedText text={"Unités "} /><span className="text-[#7C3AED]"><LocalizedText text={"disponibles"} /></span>
                  </>
                ) : (
                  <><LocalizedText text={"Unidades "} /><span className="text-[#7C3AED]"><LocalizedText text={"disponibles"} /></span>
                  </>
                )}
              </h2>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder={tText('Buscar unidad, piso...', 'Search unit, floor...', 'Rechercher unité, étage...')}
                  value={availQuery}
                  onChange={(e) => setAvailQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-full bg-white border border-stone-300 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-[#7C3AED] shadow-sm"
                />
              </div>

              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-800">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {tText('Solo disponibles', 'Available only', 'Disponibles uniquement')}
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="pt-8 overflow-x-auto">
            <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-sm">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-xs uppercase text-[#52525B] font-semibold">
                    <th className="py-4 px-5">{tText('Unidad', 'Unit', 'Unité')}</th>
                    <th className="py-4 px-5">{tText('Modelo', 'Model', 'Modèle')}</th>
                    <th className="py-4 px-5">{tText('Piso', 'Floor', 'Étage')}</th>
                    <th className="py-4 px-5">{tText('Área', 'Area', 'Surface')}</th>
                    <th className="py-4 px-5">{tText('Distribución', 'Layout', 'Disposition')}</th>
                    <th className="py-4 px-5">{tText('Precio', 'Price', 'Prix')}</th>
                    <th className="py-4 px-5">{tText('Estado', 'Status', 'Statut')}</th>
                    <th className="py-4 px-5 text-right">{tText('Plan de pago', 'Payment plan', 'Plan de paiement')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs">
                  {visibleUnits.map((u) => {
                    const isAvailable = (u.status as string) === 'Disponible' || (u.status as string) === 'available';
                    const isReserved = (u.status as string) === 'Separada' || (u.status as string) === 'Reservada' || (u.status as string) === 'separated';
                    const isSold = (u.status as string) === 'Vendida' || (u.status as string) === 'sold';
                    const isBlocked = (u.status as string) === 'Bloqueada' || (u.status as string) === 'blocked';

                    const statusBadgeClass = isAvailable
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : isReserved
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : isBlocked
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : 'bg-stone-100 text-stone-500 border border-stone-200';

                    const dotClass = isAvailable
                      ? 'bg-emerald-500 animate-pulse'
                      : isReserved
                      ? 'bg-amber-500'
                      : isBlocked
                      ? 'bg-purple-500'
                      : 'bg-stone-400';

                    const statusLabel = isAvailable
                      ? tText('Disponible', 'Available', 'Disponible')
                      : isReserved
                      ? tText('Reservada', 'Reserved', 'Réservée')
                      : isBlocked
                      ? tText('Bloqueada', 'Blocked', 'Bloquée')
                      : tText('Vendida', 'Sold', 'Vendue');

                    return (
                      <tr key={u.id} className="hover:bg-stone-50 transition-colors">
                        <td className="py-4 px-5 font-bold text-[#0F172A]">{u.unit}</td>
                        <td className="py-4 px-5 text-[#52525B]">
                          {u.type}
                          {u.notes && !u.notes.trim().startsWith('{') && (
                            <span className="block text-[10px] text-[#7C3AED] font-medium">{u.notes}</span>
                          )}
                        </td>
                        <td className="py-4 px-5 text-[#71717A]">{tText('Nivel ' + u.floor, 'Level ' + u.floor, 'Étage ' + u.floor)}</td>
                        <td className="py-4 px-5 font-semibold text-[#0F172A]">{u.area}<LocalizedText text={" m²"} /></td>
                        <td className="py-4 px-5 text-[#71717A]">
                          {tText(`${u.bedrooms} Hab · ${u.bathrooms} Baños`, `${u.bedrooms} Beds · ${u.bathrooms} Baths`, `${u.bedrooms} Ch · ${u.bathrooms} SDB`)}
                        </td>
                        <td className="py-4 px-5 text-[#7C3AED] font-bold text-sm">
                          {u.price && u.price > 1000 ? `US$ ${formatPrice(u.price)}` : '—'}
                        </td>
                        <td className="py-4 px-5">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold',
                              statusBadgeClass
                            )}
                          >
                            <span className={cn('w-1.5 h-1.5 rounded-full', dotClass)} />
                            {statusLabel}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-right">
                          {isAvailable ? (
                            <a
                              href="#calculator"
                              onClick={() => {
                                setCalcModelKey(calculatorModelForUnit(u));
                                setSelectedCalcUnitId(String(u.id));
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-xs transition-all shadow-sm hover:scale-105"
                            >
                              <span>{tText('Calcular', 'Calculate', 'Calculer')}</span>
                              <Calculator className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-stone-400 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {filteredUnits.length > 6 && (
            <div className="text-center pt-8">
              <button
                onClick={() => setShowAllUnits(!showAllUnits)}
                className="px-6 py-2.5 rounded-full border border-stone-300 hover:border-stone-400 text-xs uppercase tracking-wider font-semibold text-stone-700 transition-all bg-white shadow-sm"
              >
                {showAllUnits ? tText('Ver Menos', 'Show Less', 'Voir Moins') : tText(`Ver Todas (${filteredUnits.length} Unidades)`, `View All (${filteredUnits.length} Units)`, `Voir Toutes (${filteredUnits.length} Unités)`)}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. FINANCIAL CALCULATOR & PAYMENT PLAN SIMULATOR                          */}
      {/* ========================================================================= */}
      <section id="calculator" className="scroll-mt-24 py-20 lg:py-28 border-b border-[#E7E5E4] bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#52525B]">
                <span className="w-2 h-2 rounded-full bg-[#7C3AED]" />
                <span>{tText('Calculadora Financiera', 'Financial Calculator', 'Simulateur Financier')}</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A] leading-tight">
                {tText('Planifica tu compra ', 'Plan your purchase ', 'Planifiez votre achat ')}
                <span className="bg-gradient-to-r from-[#0284C7] via-[#7C3AED] to-[#DB2777] bg-clip-text text-transparent">
                  {tText('a tu medida', 'your way', 'sur mesure')}
                </span>
              </h2>

              <p className="text-sm text-[#52525B] leading-relaxed">
                {tText(
                  'Selecciona tu modelo residencial preferido y simula tu plan de pagos durante la construcción de acuerdo con las condiciones oficiales de UVE Residences.',
                  'Select your preferred residential layout and simulate your payment plan during construction according to the official terms of UVE Residences.',
                  'Sélectionnez votre modèle résidentiel préféré et simulez votre plan de paiement pendant la construction selon les conditions officielles d\'UVE Residences.'
                )}
              </p>

              {/* Select Unit Model */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold uppercase text-[#52525B]">
                  {tText('1. Seleccionar Modelo Residencial:', '1. Select Residential Model:', '1. Choisir le Modèle Résidentiel :')}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {UVE_CALC_MODELS.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => {
                        setCalcModelKey(t.key);
                        setSelectedCalcUnitId(null);
                      }}
                      className={cn(
                        'p-3 rounded-2xl border text-left transition-all flex flex-col justify-between',
                        calcModelKey === t.key
                          ? 'bg-[#7C3AED]/10 border-[#7C3AED] shadow-sm'
                          : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-stone-300'
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="text-xs font-bold text-[#0F172A]">{t.name}</div>
                        <span className="text-[10px] font-semibold text-stone-500 uppercase">{t.badge}</span>
                      </div>
                      <div className="text-[11px] text-[#71717A] mt-1">{t.specs}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[#7C3AED]/15 bg-[#7C3AED]/5 p-4 text-sm text-[#52525B]">
                {tText(
                    `El sistema calcula ${calcMonths} cuotas mensuales hasta ${paymentDeadlineLabel}, un mes antes de la entrega estimada de ${deliveryLabel}.`,
                    `The system calculates ${calcMonths} monthly installments through ${paymentDeadlineLabel}, one month before the estimated ${deliveryLabel} delivery.`,
                    `Le système calcule ${calcMonths} mensualités jusqu'en ${paymentDeadlineLabel}, un mois avant la livraison estimée de ${deliveryLabel}.`
                )}
              </div>
            </div>

            {/* Right Breakdown Card */}
            <div className="lg:col-span-7 bg-[#FAFAF9] border border-stone-200 rounded-3xl p-8 space-y-6 shadow-md">
              <div className="flex flex-col gap-1.5 border-b border-stone-200 pb-4">
                {selectedCalcUnit && (
                  <div className="flex items-center justify-between rounded-xl bg-[#7C3AED]/10 px-3 py-2 text-xs text-[#52525B]">
                    <span>{tText('Unidad seleccionada:', 'Selected unit:', 'Unité sélectionnée :')}</span>
                    <span className="font-extrabold text-[#7C3AED]">{selectedCalcUnit.unit}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-[#71717A]">
                  <span>{tText('Modelo Seleccionado:', 'Selected Model:', 'Modèle Sélectionné :')}</span>
                  <span className="font-bold text-[#0F172A]">{selectedModel.name}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs uppercase text-[#71717A] font-bold">
                    {tText('Precio de Lista Oficial:', 'Official List Price:', 'Prix Catalogue Officiel :')}
                  </span>
                  <span className="text-2xl font-extrabold text-[#0F172A]"><LocalizedText text={"US$ "} />{formatPrice(unitPrice)}
                  </span>
                </div>
              </div>

              <div className="space-y-3 text-xs font-medium">
                <div className="p-4 rounded-xl bg-white border border-stone-200 flex items-center justify-between shadow-sm">
                  <div>
                    <div className="text-[#0F172A] font-bold">{tText('1. Pago de reserva', '1. Reservation payment', '1. Paiement de réservation')}</div>
                    <div className="text-[#71717A] text-[11px]">{tText(`Fecha de consulta: ${reservationDateLabel}`, `Inquiry date: ${reservationDateLabel}`, `Date de consultation : ${reservationDateLabel}`)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[#0F172A] font-bold"><LocalizedText text={"US$ "} />{formatPrice(reserveAmount)}</div>
                    <div className="text-[#7C3AED] text-[11px]">{tText('Monto Fijo', 'Fixed Amount', 'Montant Fixe')}</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-stone-200 flex items-center justify-between shadow-sm">
                  <div>
                    <div className="text-[#0F172A] font-bold">{tText(`2. Firma de Contrato (${percentLabel(officialContractPercent)}% Inicial)`, `2. Contract Signing (${percentLabel(officialContractPercent)}% Down Payment)`, `2. Signature du Contrat (${percentLabel(officialContractPercent)}% Acompte)`)}</div>
                    <div className="text-[#71717A] text-[11px]">
                      {tText(
                        `Completivo al ${percentLabel(officialContractPercent)}% inicial (menos US$ ${formatPrice(reserveAmount)} de reserva)`,
                        `Contract balance (minus US$ ${formatPrice(reserveAmount)} reservation)`,
                        `Complément au ${percentLabel(officialContractPercent)}% (déduction faite des US$ ${formatPrice(reserveAmount)} de réservation)`
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[#0F172A] font-bold"><LocalizedText text={"US$ "} />{formatPrice(Math.round(contractAmount))}</div>
                    <div className="text-stone-500 text-[11px]">{percentLabel(officialContractPercent)}<LocalizedText text={"% Total"} /></div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-stone-200 flex items-center justify-between shadow-sm">
                  <div>
                    <div className="text-[#0F172A] font-bold">{tText(`3. Durante Construcción (${percentLabel(officialConstructionPercent)}%)`, `3. During Construction (${percentLabel(officialConstructionPercent)}%)`, `3. Pendant la Construction (${percentLabel(officialConstructionPercent)}%)`)}</div>
                    <div className="text-[#71717A] text-[11px]">
                      {tText(
                        `${calcMonths} cuotas mensuales de ~US$ ${formatPrice(Math.round(monthlyConstruction))}`,
                        `${calcMonths} monthly installments of ~US$ ${formatPrice(Math.round(monthlyConstruction))}`,
                        `${calcMonths} mensualités de ~US$ ${formatPrice(Math.round(monthlyConstruction))}`
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[#0F172A] font-bold"><LocalizedText text={"US$ "} />{formatPrice(Math.round(constructionTotal))}</div>
                    <div className="text-stone-500 text-[11px]">{tText('Cuota estimada', 'Estimated installment', 'Mensualité estimée')}</div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white border border-stone-200 flex items-center justify-between shadow-sm">
                  <div>
                    <div className="text-[#0F172A] font-bold">{tText(`4. Contra Entrega (${percentLabel(effectiveDeliveryPercent)}%)`, `4. Upon Delivery (${percentLabel(effectiveDeliveryPercent)}%)`, `4. À la Livraison (${percentLabel(effectiveDeliveryPercent)}%)`)}</div>
                    <div className="text-[#71717A] text-[11px]">{tText(`${deliveryLabel} o mediante crédito hipotecario`, `${deliveryLabel} or via mortgage financing`, `${deliveryLabel} ou via crédit hypothécaire`)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[#0F172A] font-bold"><LocalizedText text={"US$ "} />{formatPrice(Math.round(deliveryAmount))}</div>
                    <div className="text-blue-600 text-[11px]">{tText('Financiable', 'Financing Available', 'Finançable')}</div>
                  </div>
                </div>
              </div>

              <a
                href={contactHref}
                onClick={() => setInquiryType('information')}
                className="relative flex min-h-14 w-full min-w-0 items-center justify-center rounded-full bg-gradient-to-r from-[#0284C7] via-[#7C3AED] to-[#DB2777] py-4 pl-5 pr-12 text-white font-bold text-xs uppercase tracking-wider transition-all hover:opacity-95 shadow-md shadow-[#7C3AED]/20 hover:shadow-lg hover:-translate-y-0.5"
              >
                <span className="block min-w-0 whitespace-normal break-words text-center leading-snug">
                  {tText('Solicitar información financiera', 'Request financial information', 'Demander les informations financières')}
                </span>
                <ArrowRight aria-hidden="true" className="absolute right-5 h-4 w-4 shrink-0" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. LOCATION & PROXIMITY (Infopack Pág. 5 & 6)                             */}
      {/* ========================================================================= */}
      <section id="location" className="py-20 lg:py-28 border-b border-[#E7E5E4] bg-[#FAFAF9]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#52525B]">
                <span className="w-2 h-2 rounded-full bg-[#7C3AED]" />
                <span>{tText('Ubicación Estratégica · Brisas - Downtown Punta Cana', 'Strategic Location · Brisas - Downtown Punta Cana', 'Emplacement Stratégique · Brisas - Downtown Punta Cana')}</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F172A] leading-tight"><LocalizedText text={"Brisas - Downtown,"} />{' '}
                <span className="text-[#7C3AED]">
                  {tText('cerca de todo', 'close to everything', 'proche de tout')}
                </span>
              </h2>

              <p className="text-sm text-[#52525B] leading-relaxed">
                {tText(
                  'Disfruta de una ubicación privilegiada que te conecta con lo mejor de la zona. Un entorno ideal para vivir o invertir, rodeado de confort, accesibilidad y la más alta plusvalía de Punta Cana.',
                  'Enjoy a privileged location connecting you to the best of Punta Cana. An ideal setting for living or investing, surrounded by comfort, accessibility, and high appreciation.',
                  'Profitez d\'un emplacement privilégié vous reliant directement aux meilleurs attraits de Punta Cana. Un cadre idéal pour habiter ou investir, alliant confort, accessibilité et forte plus-value.'
                )}
              </p>

              {/* Exact Proximity Cards from PDF Page 6 */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm">
                  <div className="text-2xl font-bold text-[#7C3AED]"><LocalizedText text={"4 Min"} /></div>
                  <div className="text-sm font-bold text-[#0F172A] mt-1"><LocalizedText text={"Downtown Punta Cana"} /></div>
                  <div className="text-xs text-[#71717A]">{tText('Supermercados, bancos y farmacias', 'Supermarkets, banks, and pharmacies', 'Supermarchés, banques et pharmacies')}</div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm">
                  <div className="text-2xl font-bold text-[#0284C7]"><LocalizedText text={"15 Min"} /></div>
                  <div className="text-sm font-bold text-[#0F172A] mt-1">{tText('Playa Jellyfish', 'Jellyfish Beach', 'Plage Jellyfish')}</div>
                  <div className="text-xs text-[#71717A]">{tText('Shuttle diario exclusivo incluido', 'Exclusive daily shuttle included', 'Navette quotidienne exclusive incluse')}</div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm">
                  <div className="text-2xl font-bold text-[#EC4899]"><LocalizedText text={"14 Min"} /></div>
                  <div className="text-sm font-bold text-[#0F172A] mt-1">{tText('Aeropuerto (PUJ)', 'Airport (PUJ)', 'Aéroport (PUJ)')}</div>
                  <div className="text-xs text-[#71717A]">{tText('Terminal Internacional de Punta Cana', 'Punta Cana International Terminal', 'Terminal International de Punta Cana')}</div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-sm">
                  <div className="text-2xl font-bold text-[#7C3AED]"><LocalizedText text={"10 Min"} /></div>
                  <div className="text-sm font-bold text-[#0F172A] mt-1"><LocalizedText text={"BlueMall Punta Cana"} /></div>
                  <div className="text-xs text-[#71717A]">{tText('Gastronomía y compras de autor', 'Fine dining and signature shopping', 'Gastronomie et boutiques de marque')}</div>
                </div>
              </div>
            </div>

            {/* Map visual */}
            <div className="lg:col-span-6 relative aspect-[4/3] rounded-3xl overflow-hidden border border-stone-200 shadow-xl bg-stone-100 group">
              <UITranslationBoundary attributes={["alt"]}><Image
                src="/projects/uve-residences/location.png"
                alt="UVE Residences Location"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              /></UITranslationBoundary>
              <div className="absolute inset-0 bg-black/20 pointer-events-none" />
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-white/95 backdrop-blur-md border border-stone-200 flex items-center justify-between shadow-lg">
                <div>
                  <div className="text-xs font-bold text-[#0F172A]"><LocalizedText text={"Brisas de Punta Cana"} /></div>
                  <div className="text-[11px] text-[#71717A]"><LocalizedText text={"República Dominicana"} /></div>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Brisas de Punta Cana, Dominican Republic')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <span><LocalizedText text={"Google Maps"} /></span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. MERRIDANNE CTA BANNER SECTION                                         */}
      {/* ========================================================================= */}
      <section className="py-20 lg:py-28 border-b border-[#E7E5E4] bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#7C3AED]/10 text-[#7C3AED] flex items-center justify-center mx-auto mb-6 shadow-sm">
            <MessageCircle className="w-7 h-7" />
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0F172A]">
            {tText('¿Listo para dar el siguiente paso?', 'Ready to take the next step?', 'Prêt à franchir le pas ?')}
          </h2>

          <p className="mt-4 text-base text-[#52525B] max-w-xl mx-auto leading-relaxed">
            {tText(
              'Habla directamente con un asesor inmobiliario oficial de UVE Residences y recibe el listado de unidades disponibles y la plantilla de inversión.',
              'Speak directly with an official UVE Residences property advisor and receive the latest availability inventory and investment presentation.',
              'Échangez directement avec un conseiller officiel d\'UVE Residences et recevez la grille des unités disponibles et la présentation d\'investissement.'
            )}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <a
              href={contactHref}
              onClick={() => setInquiryType('information')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-sm transition-all shadow-lg shadow-[#7C3AED]/25"
            >
              <Phone className="w-4 h-4" />
              <span>{tText('Solicitar información', 'Request information', 'Demander des informations')}</span>
            </a>

            <a
              href={contactHref}
              onClick={() => setInquiryType('site_visit')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-stone-100 hover:bg-stone-200 border border-stone-300 text-stone-800 font-bold text-sm transition-all shadow-sm"
            >
              <Calendar className="w-4 h-4 text-[#7C3AED]" />
              <span>{tText('Solicitar visita al terreno', 'Request a site visit', 'Demander une visite sur place')}</span>
            </a>
          </div>
        </div>
      </section>

      <section id="contacto" className="border-b border-[#E7E5E4] bg-[#F8F7F4] py-20 lg:py-28">
        <div className="mx-auto grid max-w-5xl items-center gap-10 px-6 md:grid-cols-2">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#7C3AED]"><LocalizedText text={"Atención personalizada"} /></span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[#0F172A] sm:text-4xl"><LocalizedText text={"Recibe disponibilidad y una propuesta a tu medida."} /></h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-[#52525B]"><LocalizedText text={"Déjanos tus datos e indícanos si eres cliente o agente de bienes raíces. El equipo comercial te contactará con la información oficial."} /></p>
          </div>
          <LeadCaptureForm projectId={project.id} projectSlug={project.slug} projectName={project.name} requestType={inquiryType} onRequestTypeChange={setInquiryType} accentClassName="bg-[#7C3AED] hover:bg-[#6D28D9]" typologyOptions={['Tipo A · 96 m²', 'Tipo B · 115 m²', 'Penthouse']} />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 12. MERRIDANNE CLEAN FOOTER                                               */}
      {/* ========================================================================= */}
      <footer className="bg-[#FAFAF9] pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-stone-200">
            {/* Left Brand */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-3">
                <UITranslationBoundary attributes={["alt"]}><Image
                  src="/projects/uve-residences/logo.png"
                  alt="UVE Residences"
                  width={180}
                  height={55}
                  unoptimized
                  className="h-12 w-auto object-contain"
                /></UITranslationBoundary>
              </div>
              <p className="text-xs text-[#52525B] max-w-sm leading-relaxed">
                {tText(
                  'Desarrollado por Dominican Condos y comercializado oficialmente por OB Brokers Team. Arquitectura de autor, estilo de vida wellness y alta plusvalía en Punta Cana.',
                  'Developed by Dominican Condos and officially marketed by OB Brokers Team. Signature architecture, wellness lifestyle, and prime capital growth in Punta Cana.',
                  'Développé par Dominican Condos et commercialisé par OB Brokers Team. Architecture d\'auteur, style de vie bien-être et forte plus-value à Punta Cana.'
                )}
              </p>
              <div className="text-xs text-[#7C3AED] font-semibold"><LocalizedText text={"Brisas de Punta Cana · República Dominicana"} /></div>
            </div>

            {/* Quick Links */}
            <div className="md:col-span-3 space-y-2.5 text-xs text-[#52525B]">
              <div className="text-xs uppercase font-bold text-[#0F172A] tracking-wider mb-3">
                {tText('Navegación', 'Navigation', 'Navigation')}
              </div>
              <div><a href="#about" className="hover:text-[#7C3AED] transition-colors">{tText('El Proyecto', 'The Project', 'Le Projet')}</a></div>
              <div><a href="#features" className="hover:text-[#7C3AED] transition-colors">{tText('Amenidades & Servicios', 'Amenities & Services', 'Commodités & Services')}</a></div>
              <div><a href="#gallery" className="hover:text-[#7C3AED] transition-colors">{tText('Espacios & Estilo de Vida', 'Lifestyle & Spaces', 'Espaces & Style de Vie')}</a></div>
              <div><a href="#models" className="hover:text-[#7C3AED] transition-colors">{tText('Modelos de Apartamentos', 'Apartment Models', 'Modèles d\'Appartements')}</a></div>
              <div><a href="#investment" className="hover:text-[#7C3AED] transition-colors">{tText('Inversión & Retorno', 'Investment & Returns', 'Investissement & Rendement')}</a></div>
              <div><a href="#availability" className="hover:text-[#7C3AED] transition-colors">{tText('Disponibilidad en Vivo', 'Live Availability', 'Disponibilité en Direct')}</a></div>
              <div><a href="#calculator" className="hover:text-[#7C3AED] transition-colors">{tText('Calculadora Financiera', 'Financial Calculator', 'Simulateur Financier')}</a></div>
            </div>

            {/* Contact & Broker access */}
            <div className="md:col-span-4 space-y-3 text-xs text-[#52525B]">
              <div className="text-xs uppercase font-bold text-[#0F172A] tracking-wider mb-3">
                {tText('Atención Broker & Clientes', 'Broker & Client Support', 'Service Brokers & Clients')}
              </div>
              <p className="text-xs text-[#71717A]">
                {tText('Canal directo de ventas y coordinación de cierres comerciales.', 'Direct sales channel and deal closing coordination.', 'Canal direct de vente et coordination des transactions.')}
              </p>
              <a
                href={contactHref}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-xs transition-all shadow-sm"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>{tText('Solicitar información', 'Request information', 'Demander des informations')}</span>
              </a>
            </div>
          </div>

          {/* Bottom attribution */}
          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#71717A]">
            <div>
              {tText(
                `© ${new Date().getFullYear()} UVE Residences. Todos los derechos reservados.`,
                `© ${new Date().getFullYear()} UVE Residences. All rights reserved.`,
                `© ${new Date().getFullYear()} UVE Residences. Tous droits réservés.`
              )}
            </div>
            <div className="flex items-center gap-4">
              {currentUser && (
                <span><LocalizedText text={"Broker: "} />{currentUser.displayName} ({currentUser.organization.name})</span>
              )}
              <Link href="/login" className="hover:text-[#7C3AED] transition-colors">
                {tText('Portal Inmobiliario', 'Real Estate Portal', 'Portail Immobilier')}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
