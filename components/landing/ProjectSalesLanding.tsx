'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from '@/components/ui/OptimizedImage';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, MapPin, MessageCircle, FileText, ArrowRight, ChevronRight, ChevronLeft, X, Menu, Check, Download, Search, List, LayoutGrid, Lock, Building2, Calculator, AlertCircle, ShieldCheck, ChevronDown } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { compareUnitCodes } from '@/lib/unit-code';
import type { PortalProject, PortalUnit } from '@/lib/portal-projects';
import { downloadImagePack, type DownloadProgress } from '@/lib/image-pack-download';
import { recordPresenceAction } from '@/app/portal/analytics-actions';
import type { ProjectLandingConfig } from '@/lib/data/landing-config';
import { CipresAmenityIcon } from '@/components/branding/CipresAmenityIcon';
import { type ProjectVillaTypology, CIPRES_OPTIONAL_ADDONS, CIPRES_DEFAULT_FAQS } from '@/lib/data/cipres-typologies';
import TypologyDetailModal from '@/components/portal/TypologyDetailModal';
import CanaRockProjectLanding from '@/components/landing/CanaRockProjectLanding';
import UveResidencesLanding from '@/components/landing/UveResidencesLanding';
import PalmViewProjectLanding from '@/components/landing/PalmViewProjectLanding';
import ElementsProjectLanding from '@/components/landing/ElementsProjectLanding';
import PublicLanguageSwitcher from '@/components/i18n/PublicLanguageSwitcher';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { usePublicLandingTranslations } from '@/components/i18n/usePublicLandingTranslations';
import { getHostingerAssetUrl } from '@/lib/storage/hostinger-constants';

function resolveLandingAssetUrl(src: string): string {
  return getHostingerAssetUrl(src) || src;
}

export interface ProjectSalesLandingProps {
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
  customTypologies?: Record<string, ProjectVillaTypology>;
  developerProjectCount?: number;
  developerProjects?: { slug: string; name: string }[];
  serverToday?: string;
}

function resolveCustomValue(customColumns?: Record<string, string>, colName?: string): string {
  if (!customColumns || !colName) return '—';
  const directValue = customColumns[colName];
  if (typeof directValue === 'string' && directValue.trim() !== '') return directValue;
  if (typeof directValue === 'number' && Number.isFinite(directValue)) return String(directValue);
  const target = colName.trim().toUpperCase();
  for (const [k, v] of Object.entries(customColumns)) {
    const cleanK = k.trim().toUpperCase();
    const value = typeof v === 'string' ? v.trim() : typeof v === 'number' && Number.isFinite(v) ? String(v) : '';
    if ((cleanK === target || cleanK.includes(target) || target.includes(cleanK)) && value) {
      return value;
    }
  }
  return '—';
}

function normalizeColumnLabel(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
}

function getVillaColumnLabel(colName: string, typologies: ProjectVillaTypology[]) {
  const normalized = normalizeColumnLabel(colName);
  const match = typologies.find((typology) => {
    const key = normalizeColumnLabel(typology.key);
    const name = normalizeColumnLabel(typology.name);
    return normalized === key || normalized.includes(key) || name.includes(normalized);
  });

  if (!match) return colName;
  return `${match.name} (${match.constructionAreaSqm} m²)`;
}

function OptimizedTypologyImage({ src, alt }: { src: string; alt: string }) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  return (
    <div className="absolute inset-0" aria-busy={status === 'loading'}>
      {status === 'loading' && (
        <div
          role="status"
          className="absolute inset-4 flex items-center justify-center rounded-xl bg-stone-100 text-[11px] font-mono uppercase tracking-[0.14em] text-stone-500 animate-pulse z-10 pointer-events-none"
        ><LocalizedText text={"Cargando imagen…"} /></div>
      )}
      {status === 'error' && (
        <div
          role="alert"
          className="absolute inset-4 flex items-center justify-center rounded-xl bg-stone-100 px-6 text-center text-xs text-stone-600"
        ><LocalizedText text={"No se pudo cargar esta imagen. Intenta cambiar de vista y volver a abrirla."} /></div>
      )}
      <Image
        key={src}
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 639px) calc(100vw - 80px), (max-width: 1023px) calc(100vw - 112px), 584px"
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
        priority
        className={cn(
          'object-contain p-4 transition-[opacity,transform] duration-300 group-hover:scale-105',
          status === 'error' ? 'opacity-0' : 'opacity-100'
        )}
      />
    </div>
  );
}

export default function ProjectSalesLanding(props: ProjectSalesLandingProps) {
  if (props.config.theme.experiencePreset === 'cana-rock-resort') {
    return <CanaRockProjectLanding {...props} />;
  }

  if (
    props.project.slug === 'uve-residences' ||
    props.config.projectSlug === 'uve-residences' ||
    props.config.theme.experiencePreset === 'uve-residences'
  ) {
    return <UveResidencesLanding {...props} />;
  }

  if (props.project.slug === 'palm-view' || props.config.projectSlug === 'palm-view' || props.config.theme.experiencePreset === 'palm-view') {
    return <PalmViewProjectLanding {...props} />;
  }

  if (props.project.slug === 'elements' || props.config.projectSlug === 'elements') {
    return <ElementsProjectLanding {...props} />;
  }

  return <DefaultProjectSalesLanding {...props} />;
}

function DefaultProjectSalesLanding({
  project,
  config,
  brokerReferrer,
  isAuthenticated = false,
  currentUser,
  customTypologies,
  developerProjectCount = 1,
  developerProjects = [],
}: ProjectSalesLandingProps) {
  const isUve = project.slug === 'uve-residences' || config.projectSlug === 'uve-residences';
  const isCipres = project.slug === 'cipres-residences' || config.projectSlug === 'cipres-residences';
  const availabilityOnlyMode = isUve || isCipres;
  const { t, locale } = useLocale();
  const modelsLabel = locale === 'fr' ? 'Modèles' : locale === 'en' ? 'Models' : 'Modelos';
  const { translations, isLoading: isTranslating } = usePublicLandingTranslations(project.slug, locale);
  const translated = (fieldPath: string, sourceText: string) =>
    locale === 'es' || !sourceText ? sourceText : (translations[fieldPath] || sourceText);

  const [selectedTypology, setSelectedTypology] = useState<ProjectVillaTypology | null>(null);

  // Financial Calculator & Lead Capture state
  // Lightbox & Inquiry state
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [, setSelectedUnitForInquiry] = useState<PortalUnit | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const initialTypology = Object.values(customTypologies || {})[0];
  const [leadForm, setLeadForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Cliente',
    typology: initialTypology ? `${initialTypology.name} (${initialTypology.constructionAreaSqm} m²)` : '',
    message: '',
  });
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [dossierModalOpen, setDossierModalOpen] = useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);

  // Active villa tab in models section
  const [activeVillaKey, setActiveVillaKey] = useState<string>(initialTypology?.key || '');
  const [villaViewMode, setVillaViewMode] = useState<'render' | 'plano'>('render');

  // Financial Calculator State
  const [calcModelKey, setCalcModelKey] = useState<string>(initialTypology?.key || '');
  const [calcMonths, setCalcMonths] = useState<number>(12);

  const typologiesMap = customTypologies && Object.keys(customTypologies).length > 0
    ? customTypologies
    : {};

  const typologiesList = Object.values(typologiesMap);


  // Full visual gallery: use config customGallery or project gallery
  const allMedia = (
    config?.customGallery && config.customGallery.length > 0
      ? config.customGallery
      : project.gallery && project.gallery.length > 0
        ? project.gallery
        : []
  ).filter((u) => !u.includes('unsplash.com') && !u.includes('_plano.jpg'));

  // Dedicated Hero slideshow slides: Strictly prioritize user heroSlides
  const heroSlides = (
    config?.heroSlides && config.heroSlides.length > 0
      ? config.heroSlides
      : allMedia.filter((u) => !u.toLowerCase().includes('plano') && !u.toLowerCase().includes('mapa')).slice(0, 7)
  ).filter((u) => !u.includes('unsplash.com'));

  const activeHeroMedia = heroSlides.length > 0 ? heroSlides : allMedia;

  // Hero interactive image slider state
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
  const [galleryFilter, setGalleryFilter] = useState<'all' | 'exterior' | 'planos'>('all');
  const [featuredGalleryIndex, setFeaturedGalleryIndex] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Image Pack Download state
  const [imagePackDownloading, setImagePackDownloading] = useState(false);
  const [imagePackProgress, setImagePackProgress] = useState<DownloadProgress | null>(null);
  const [availabilityQuery, setAvailabilityQuery] = useState('');
  const [availabilityStatus, setAvailabilityStatus] = useState<'all' | 'available' | 'reserved'>(availabilityOnlyMode ? 'available' : 'all');
  const [selectedManzana, setSelectedManzana] = useState<'all' | 'M4' | 'M8'>('all');
  const [availabilityView, setAvailabilityView] = useState<'list' | 'cards'>('list');
  const [showAllAvailability, setShowAllAvailability] = useState(false);

  useEffect(() => {
    const storageKey = `ob_presence_landing_${project.id}`;
    let sessionKey = window.sessionStorage.getItem(storageKey);
    if (!sessionKey) {
      sessionKey = crypto.randomUUID().replace(/-/g, '');
      window.sessionStorage.setItem(storageKey, sessionKey);
    }
    const heartbeat = () => { void recordPresenceAction({ sessionKey: sessionKey!, surface: 'landing', projectId: project.id }); };
    heartbeat();
    const interval = window.setInterval(heartbeat, 60_000);
    return () => window.clearInterval(interval);
  }, [project.id]);

  const handleDownloadImagePack = async () => {
    setImagePackDownloading(true);
    setImagePackProgress(null);
    try {
      await downloadImagePack(project.id, project.name, (p) => setImagePackProgress(p), allMedia);
    } catch (err) {
      console.error('Error descargando paquete:', err);
    } finally {
      setImagePackDownloading(false);
      setImagePackProgress(null);
    }
  };

  const isPlanMedia = (url: string) => {
    const normalized = url.toLowerCase();
    return normalized.includes('plano') || normalized.includes('floor') || /cipres_0[134]\.png/.test(normalized);
  };

  const filteredGalleryMedia = allMedia.filter((url) => {
    if (galleryFilter === 'planos') return isPlanMedia(url);
    if (galleryFilter === 'exterior') return !isPlanMedia(url);
    return true;
  });
  const activeFeaturedGalleryIndex = Math.min(featuredGalleryIndex, Math.max(filteredGalleryMedia.length - 1, 0));
  const featuredGalleryImage = filteredGalleryMedia[activeFeaturedGalleryIndex] || filteredGalleryMedia[0] || allMedia[0];
  const hasImagePack = allMedia.length > 0;
  const qualityReferenceImages = allMedia.filter((url) => !isPlanMedia(url)).slice(4, 10);
  const masterPlanImage =
    allMedia.find((url) => url.includes('cipres_06') || url.includes('cipres_10')) ||
    allMedia.find((url) => url.includes('cipres_05')) ||
    config.locationMapUrl ||
    allMedia[0];

  // Hero slideshow auto-rotation effect
  useEffect(() => {
    if (activeHeroMedia.length <= 1) return;
    const interval = setInterval(() => {
      setHeroSlideIndex((prev) => (prev + 1) % activeHeroMedia.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [activeHeroMedia.length]);

  // Available units filtered and naturally sorted
  const availableUnits = (project.units || []).filter((u) => u.isPublic !== false && (!availabilityOnlyMode || u.status === 'Disponible'));
  const customCols = project.customColumnsList || [];
  const hasCustomCols = customCols.length > 0;

  const sortedAvailableUnits = [...availableUnits].sort((a, b) => {
    return compareUnitCodes(a.unit, b.unit);
  });

  const countM4 = availableUnits.filter((u) => /M\s*4/i.test(u.unit) || (u.tower && /M\s*4/i.test(u.tower))).length;
  const countM8 = availableUnits.filter((u) => /M\s*8/i.test(u.unit) || (u.tower && /M\s*8/i.test(u.tower))).length;

  const filteredAvailabilityUnits = sortedAvailableUnits.filter((unit) => {
    if (selectedManzana === 'M4') {
      const isM4 = /M\s*4/i.test(unit.unit) || (unit.tower && /M\s*4/i.test(unit.tower));
      if (!isM4) return false;
    } else if (selectedManzana === 'M8') {
      const isM8 = /M\s*8/i.test(unit.unit) || (unit.tower && /M\s*8/i.test(unit.tower));
      if (!isM8) return false;
    }

    const query = availabilityQuery.trim().toLowerCase();
    const searchableText = [unit.unit, unit.tower, unit.status, unit.area, unit.price, JSON.stringify(unit.customColumns || {})]
      .map((value) => String(value ?? ''))
      .join(' ')
      .toLowerCase();
    const matchesQuery = !query || searchableText.includes(query);
    const matchesStatus = availabilityOnlyMode
      ? unit.status === 'Disponible'
      : availabilityStatus === 'all'
      || (availabilityStatus === 'available' && unit.status === 'Disponible')
      || (availabilityStatus === 'reserved' && unit.status !== 'Disponible');
    return matchesQuery && matchesStatus;
  });
  const visibleAvailabilityUnits = showAllAvailability ? filteredAvailabilityUnits : filteredAvailabilityUnits.slice(0, 20);

  // Contact whatsapp
  const rawWhatsapp = brokerReferrer?.phone || config?.theme?.contactWhatsapp || '18097828828';
  let cleanPhone = rawWhatsapp.replace(/\D/g, '');
  if (cleanPhone.length === 10 && (cleanPhone.startsWith('809') || cleanPhone.startsWith('829') || cleanPhone.startsWith('849'))) {
    cleanPhone = `1${cleanPhone}`;
  }
  if (!cleanPhone) cleanPhone = '18097828828';

  const buildWhatsappLink = (_customText?: string) => '#contacto';

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLeadSubmitted(true);
  };

  // Calculator calculations (driven by config.financial)
  const fin = config.financial ?? { reserveAmount: 500, contractPercent: 0.10, constructionPercent: 0.20, deliveryPercent: 0.70, availableMonths: [12, 24], defaultMonths: 12 };
  const selectedCalcTypology = typologiesMap[calcModelKey] || typologiesList[0];
  const villaPrice = selectedCalcTypology?.startingPrice || project.startingPrice || 0;
  const reserveAmount = fin.reserveAmount;
  const contractPercent = fin.contractPercent;
  const contractAmount = villaPrice * contractPercent - reserveAmount;
  const constructionPercent = fin.constructionPercent;
  const constructionTotal = villaPrice * constructionPercent;
  const monthlyInstallment = constructionTotal / calcMonths;
  const deliveryPercent = fin.deliveryPercent;
  const deliveryAmount = villaPrice * deliveryPercent;

  // Selected Villa in Showcase
  const currentVilla = typologiesMap[activeVillaKey] || typologiesList[0];
  const currentVillaImage = currentVilla
    ? villaViewMode === 'plano' && currentVilla.floorPlanImage
      ? currentVilla.floorPlanImage
      : currentVilla.image || currentVilla.floorPlanImage
    : '';

  // FAQs from config (editable via Landing Builder/Supabase) or official Ciprés FAQs
  const defaultFaqs = isCipres ? CIPRES_DEFAULT_FAQS : [];
  const rawFaqs = config.faqs && config.faqs.length > 0 ? config.faqs : defaultFaqs;
  const faqs = rawFaqs.map((f, idx) => ({
    q: translated(`faqs.${idx}.question`, f.question),
    a: translated(`faqs.${idx}.answer`, f.answer),
  }));

  return (
    <div className={cn(
      'min-h-screen bg-[#FBFBFA] text-[#191919] font-sans antialiased w-full max-w-full overflow-x-hidden',
      isUve && 'uve-editorial-landing'
    )}>
      {/* 1. MANORÉ MINIMALIST NAVBAR (CLEAN EDITORIAL IDENTITY) */}
      <header className={cn(
        'sticky top-0 z-40 w-full border-b border-stone-200/70 bg-[#FBFBFA]/90 backdrop-blur-md transition-all',
        isUve && 'uve-site-header'
      )}>
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 sm:gap-6 px-4 sm:px-6 lg:px-8">
          {/* Brand Logo & Location */}
          <Link href="/" className="flex shrink-0 items-center gap-2.5 sm:gap-3 group">
            {config.navbarLogoUrl ? (
              <>
                <Image
                  src={config.navbarLogoUrl}
                  alt={project.name}
                  width={48}
                  height={48}
                  unoptimized
                  className="h-11 w-11 sm:h-12 sm:w-12 object-contain shrink-0"
                />
                {config.navbarLogoTextUrl ? (
                  <Image
                    src={config.navbarLogoTextUrl}
                    alt={project.name}
                    width={140}
                    height={40}
                    unoptimized
                    className="h-9 sm:h-10 w-auto object-contain shrink-0"
                  />
                ) : (
                  <div className="flex flex-col shrink-0">
                    <span className="text-base font-semibold tracking-[0.2em] uppercase text-stone-900 font-mono">
                      {project.name}
                    </span>
                    <span className="text-[10px] tracking-[0.25em] uppercase text-emerald-800 font-mono font-medium">
                      {config.footerLocation || project.location || ''}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col shrink-0">
                <span className="text-base font-semibold tracking-[0.2em] uppercase text-stone-900 font-mono">
                  {project.name}
                </span>
                <span className="text-[10px] tracking-[0.25em] uppercase text-emerald-800 font-mono font-medium">
                  {config.footerLocation || project.location || ''}
                </span>
              </div>
            )}
          </Link>

          {/* Clean Desktop Navigation Links */}
          <nav className="hidden 2xl:flex shrink-0 items-center justify-center gap-5 2xl:gap-6 text-[11px] 2xl:text-[12px] font-medium tracking-[0.08em] uppercase text-stone-600 whitespace-nowrap">
            <a href="#villas" className="hover:text-emerald-800 transition py-1">{modelsLabel}</a>
            <a href="#ubicacion" className="hover:text-emerald-800 transition py-1">{t('location')}</a>
            <a href="#lotes" className="hover:text-emerald-800 transition py-1">{t('availability')}</a>
          </nav>

          {/* Right Action & Mobile Toggle */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <UITranslationBoundary attributes={["title"]}><Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-stone-200/90 bg-stone-50/70 hover:bg-stone-100 text-[11px] font-mono tracking-wider uppercase text-stone-600 hover:text-emerald-900 transition"
              title="Volver al portal"
            >
              <Building2 className="h-3.5 w-3.5 text-emerald-800 shrink-0" />
              <span className="hidden sm:inline"><LocalizedText text={"Volver al portal"} /></span>
            </Link></UITranslationBoundary>

            <PublicLanguageSwitcher circular />

            {developerProjectCount > 1 && developerProjects.length > 1 && <div className="relative hidden 2xl:block">
              <button
                type="button"
                onClick={() => setProjectMenuOpen((current) => !current)}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-stone-300 bg-white px-3.5 text-[11px] font-mono uppercase tracking-wider text-emerald-900 transition hover:border-emerald-800 hover:bg-emerald-50/50"
                aria-expanded={projectMenuOpen}
                aria-haspopup="menu"
              >
                <Building2 className="h-3.5 w-3.5 text-emerald-700" />
                <span><LocalizedText text={"Proyectos"} /></span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${projectMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {projectMenuOpen && (
                <div className="absolute right-0 top-full z-50 pt-2" role="menu">
                  <div className="w-64 rounded-2xl border border-stone-200 bg-white p-2 shadow-2xl">
                    <p className="px-3 pb-2 pt-1 text-[9px] font-black uppercase tracking-[0.16em] text-stone-400"><LocalizedText text={"Proyectos de "} />{project.developer || 'este desarrollador'}</p>
                    {developerProjects.map((item) => (
                      <Link key={item.slug} href={`/proyectos/${item.slug}`} onClick={() => setProjectMenuOpen(false)} className="block rounded-xl px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-stone-700 transition hover:bg-emerald-50 hover:text-emerald-900" role="menuitem">
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>}

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/portal"
                  className="inline-flex h-9 items-center justify-center gap-1.5 px-3.5 sm:px-4 rounded-full border border-stone-300 bg-white text-[11px] font-mono tracking-wider uppercase text-emerald-900 hover:border-emerald-800 hover:bg-emerald-50/50 transition shadow-2xs font-semibold"
                >
                  <LayoutGrid className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                  <span className="hidden sm:inline">{t('myPortal')}</span>
                </Link>
              </div>
            ) : (
              <Link
                href={`/login?next=/proyectos/${project.slug}`}
                className="inline-flex h-9 items-center justify-center gap-1.5 px-3.5 sm:px-4 rounded-full bg-emerald-900 hover:bg-emerald-950 text-white text-[11px] font-mono tracking-wider uppercase transition shadow-xs font-semibold"
              >
                <Lock className="h-3.5 w-3.5 text-emerald-300 shrink-0" />
                <span className="hidden sm:inline">{t('brokerAccess')}</span>
              </Link>
            )}

            {/* Mobile Hamburger Button */}
            <UITranslationBoundary attributes={["aria-label"]}><button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="2xl:hidden p-2 rounded-xl text-stone-800 hover:bg-stone-200/60 transition cursor-pointer"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button></UITranslationBoundary>
          </div>
        </div>

        {/* Mobile Slide-Down Menu Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="2xl:hidden overflow-hidden border-t border-stone-200 bg-[#FBFBFA]/98 backdrop-blur-xl px-6 py-6 space-y-5 shadow-2xl"
            >
              <nav className="flex flex-col space-y-1 text-xs font-mono uppercase tracking-wider text-stone-700">
                {[ 
                  { href: '#villas', label: `03. ${modelsLabel}` },
                  { href: '#ubicacion', label: `04. ${t('location')}` },
                  { href: '#lotes', label: `05. ${t('availability')}` },
                ].map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-3 border-b border-stone-200/60 hover:text-emerald-800 transition flex items-center justify-between"
                  >
                    <span>{item.label}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-stone-400" />
                  </a>
                ))}
              </nav>

              {developerProjectCount > 1 && developerProjects.length > 1 && <div className="border-b border-stone-200/60 pb-3">
                <button type="button" onClick={() => setProjectMenuOpen((current) => !current)} className="flex w-full items-center justify-between py-3 text-xs font-mono uppercase tracking-wider font-semibold text-emerald-900">
                  <span><LocalizedText text={"Proyectos"} /></span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${projectMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {projectMenuOpen && <div className="space-y-1 rounded-2xl bg-stone-50 p-2">{developerProjects.map((item) => <Link key={item.slug} href={`/proyectos/${item.slug}`} onClick={() => { setProjectMenuOpen(false); setMobileMenuOpen(false); }} className="block rounded-xl px-3 py-2.5 text-xs font-semibold text-stone-700 hover:bg-emerald-50">{item.name}</Link>)}</div>}
              </div>}

              <div className="pt-2 flex flex-col gap-2">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-full border border-stone-300 bg-white text-stone-700 text-xs font-mono uppercase tracking-wider font-semibold transition"
                >
                  <span><LocalizedText text={"Volver al portal"} /></span>
                </Link>

                {isAuthenticated ? (
                  <div className="space-y-2">
                    <Link
                      href="/portal"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-full border border-stone-300 bg-white text-emerald-900 text-xs font-mono uppercase tracking-wider font-semibold transition shadow-2xs"
                    >
                      <LayoutGrid className="h-3.5 w-3.5 text-emerald-700" />
                      <span>{t('myPortal')}</span>
                    </Link>
                  </div>
                ) : (
                  <Link
                    href={`/login?next=/proyectos/${project.slug}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-full bg-emerald-900 text-white text-xs font-mono uppercase tracking-wider font-semibold transition shadow-xs"
                  >
                    <Lock className="h-3.5 w-3.5 text-emerald-300" />
                    <span>{t('brokerAccess')}</span>
                  </Link>
                )}

                <a
                  href={buildWhatsappLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 py-3.5 rounded-full bg-emerald-800 text-white text-xs font-mono uppercase tracking-wider font-semibold shadow-md active:scale-[0.98] transition"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>{t('contactAdvisorOfficial')}</span>
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* 2. MANORÉ HERO: FULL-BLEED CINEMATIC IMMERSION WITH FLOATING GLASS SCRIM */}
      <section className={cn(
        'relative w-full overflow-hidden bg-stone-900 min-h-[85vh] sm:min-h-[90vh] flex items-end',
        isUve && 'uve-hero'
      )}>
        {/* Full Bleed Background Carousel */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.img
              key={heroSlideIndex}
              src={resolveLandingAssetUrl(activeHeroMedia[heroSlideIndex] || config.theme.heroMediaUrl || project.image || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80')}
              alt={`${project.name} slide ${heroSlideIndex + 1}`}
              onError={(e) => {
                const target = e.currentTarget;
                target.src = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80';
              }}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              className="h-full w-full object-cover object-center"
            />
          </AnimatePresence>
          {/* Subtle Dark Gradient Scrim for Legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-950/30 to-stone-950/20" />
        </div>

        {/* Manoré Hero Card Content */}
        <div className="relative z-10 w-full mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 pb-14 sm:pb-20 pt-32">
          <motion.div
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl space-y-6"
          >
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-2.5 rounded-full bg-white/15 px-4 py-1.5 text-xs font-mono tracking-wider uppercase text-white backdrop-blur-md border border-white/20">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                {locale === 'es'
                  ? (config?.hero?.badgeText || 'Ventas Oficiales Abiertas · Entrega Mayo 2026')
                  : locale === 'fr'
                  ? 'Ventes Officielles Ouvertes · Livraison Mai 2026'
                  : 'Official Sales Open · Delivery May 2026'}
              </span>
            </div>
            <div className="inline-flex items-center rounded-full border border-white/20 bg-[#0a1140]/90 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white shadow-sm">
              {developerProjectCount} {developerProjectCount === 1 ? 'Desarrollo' : 'Desarrollos'}
            </div>

            {/* Manoré Signature Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-normal tracking-tight text-white leading-[1.05]">
              {config?.hero?.headline ? (
                translated('hero.headline', config.hero.headline)
              ) : (
                <>
                  {project.name}:{' '}
                  <span className="italic font-serif font-light text-stone-200">
                    {locale === 'fr' ? 'Vivre d’Exception,' : 'Exquisite Living,'}
                  </span>{' '}
                  {locale === 'fr' ? <LocalizedText text={"Élevé."} /> : 'Elevated.'}
                </>
              )}
            </h1>

            {/* Subtitle */}
            <p className="text-stone-200 text-base sm:text-lg font-light leading-relaxed max-w-2xl">
              {translated(
                'hero.subheadline',
                config?.hero?.subheadline || project.shortDescription || project.description || project.name
              )}
            </p>

            {/* Action Group */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href="#villas"
                className="inline-flex h-12 items-center justify-center px-7 rounded-full bg-white text-xs font-mono tracking-wider uppercase text-stone-950 hover:bg-stone-100 transition shadow-lg font-semibold"
              >
                <span>
                  {locale === 'fr'
                    ? 'Explorer les Modèles'
                    : locale === 'en'
                    ? 'Explore Models'
                    : (config?.hero?.ctaText || 'Explorar Modelos')}
                </span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </motion.a>

              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href="#inversion"
                className="inline-flex h-12 items-center justify-center px-6 rounded-full bg-white/10 text-xs font-mono tracking-wider uppercase text-white hover:bg-white/20 backdrop-blur-md border border-white/25 transition"
              >
                <span>{t('simulatePayments')}</span>
              </motion.a>
            </div>
          </motion.div>

          {/* Slider Pagination Controls */}
          <div className="absolute bottom-8 right-6 sm:right-12 hidden sm:flex items-center gap-3 bg-stone-950/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/15 text-xs font-mono text-white">
            <span className="text-stone-300">
              {String(heroSlideIndex + 1).padStart(2, '0')} / {String(activeHeroMedia.length || 1).padStart(2, '0')}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setHeroSlideIndex((prev) => (prev === 0 ? activeHeroMedia.length - 1 : prev - 1))}
                className="p-1 hover:text-emerald-400 transition cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setHeroSlideIndex((prev) => (prev + 1) % activeHeroMedia.length)}
                className="p-1 hover:text-emerald-400 transition cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PROJECT CONCEPT */}
      <section id="concepto" className="py-24 sm:py-32 bg-white w-full max-w-full overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl space-y-3"
          >
            <span className="text-xs font-mono tracking-[0.2em] uppercase text-emerald-800 font-semibold block"><LocalizedText text={"01 / Master Plan &amp; "} />{t('amenities')}
            </span>
            <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-stone-950 leading-tight">
              {translated('concept.title', config?.concept?.title || 'Respaldado por constructores y propietarios con sólida trayectoria.')}
            </h2>
            <p className="text-stone-600 text-sm sm:text-base font-light leading-relaxed">
              {translated('concept.description', config?.concept?.description || project.description || '')}
            </p>
          </motion.div>

          {config.stats && config.stats.length > 0 && (
            <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {config.stats.map((stat, idx) => (
              <motion.div
                key={`stat-${idx}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 + idx * 0.1 }}
                className="p-8 sm:p-10 rounded-3xl bg-[#FAF8F5] border border-stone-200/80 flex flex-col justify-between space-y-6 min-h-[300px] h-full"
              >
                <span className="text-xs font-mono uppercase tracking-widest text-stone-500">{stat.label}</span>
                <div>
                  <span className="text-5xl sm:text-6xl font-light tracking-tight text-stone-950 block">{stat.value}</span>
                </div>
              </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. MANORÉ FEATURES SECTION: ELEVATE YOUR LIFESTYLE */}
      <section className="py-24 sm:py-32 bg-[#FAF8F5] border-y border-stone-200/80 w-full max-w-full overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 space-y-16">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center max-w-3xl mx-auto space-y-3"
          >
            <span className="text-xs font-mono tracking-[0.2em] uppercase text-emerald-800 font-semibold block"><LocalizedText text={"02 / Características Principales"} /></span>
            <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-stone-950"><LocalizedText text={"Diseñado para el bienestar y la solidez."} /></h2>
            <p className="text-stone-600 text-sm sm:text-base font-light"><LocalizedText text={"Cada elemento arquitectónico está pensado para brindar confort, funcionalidad y terminaciones de calidad para uso residencial diario."} /></p>
          </motion.div>

          {/* Dynamic Feature Cards */}
          {config.features && config.features.length > 0 && (
            <div className="grid md:grid-cols-3 gap-8">
              {config.features.map((feat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 + idx * 0.1 }}
                  className="p-8 sm:p-10 rounded-3xl bg-white border border-stone-200/90 shadow-2xs space-y-4"
                >
                  <span className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-mono text-sm font-semibold">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <h3 className="text-xl font-normal text-stone-950">{feat.title}</h3>
                  <p className="text-xs text-stone-600 leading-relaxed font-light">
                    {feat.description}
                  </p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5. MANORÉ PROPERTIES SHOWCASE: RESIDENTIAL MODELS */}
      {config.visibility.typologies && (
        <section id="villas" className="py-24 sm:py-32 bg-white w-full max-w-full overflow-hidden">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 space-y-16">
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-stone-200 pb-8"
            >
              <div className="space-y-2">
                <span className="text-xs font-mono tracking-[0.2em] uppercase text-emerald-800 font-semibold block">
                  03 / {isUve ? <LocalizedText text={"Tipologías Residenciales"} /> : 'Modelos Residenciales'}
                </span>
                <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-stone-950">
                        {isUve ? `Explora las residencias de ${project.name}.` : `Explora los modelos de ${project.name}.`}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-stone-500 max-w-md font-light">
                {isUve ? <LocalizedText text={"Dos tipologías de apartamentos de 96 m² y 115 m², con patios privados y rooftops en los penthouses."} /> : <LocalizedText text={"Conoce los modelos disponibles, sus distribuciones y las opciones de personalización del proyecto."} />}
              </p>
            </motion.div>

            {/* Villa Selector Pills with Fluid Capsule */}
            <div className="flex items-center gap-2 border-b border-stone-200 pb-4 overflow-x-auto relative">
              {typologiesList.map((t) => {
                const isActive = activeVillaKey === t.key;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setActiveVillaKey(t.key)}
                    className={cn(
                      'relative px-6 py-2.5 rounded-full text-xs font-mono tracking-[0.15em] uppercase transition cursor-pointer whitespace-nowrap z-10',
                      isActive ? 'text-white font-semibold' : 'text-stone-600 hover:text-stone-950'
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeVillaCapsule"
                        transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                        className="absolute inset-0 rounded-full bg-emerald-800 -z-10 shadow-sm"
                      />
                    )}
                    <span>{t.name} · {t.constructionAreaSqm}<LocalizedText text={" m²"} /></span>
                  </button>
                );
              })}
            </div>

            {/* Active Villa Detail Magazine Showcase */}
            <AnimatePresence mode="wait">
              {currentVilla && (
                <motion.div
                  key={currentVilla.key}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="grid lg:grid-cols-12 gap-12 items-center bg-[#FAF8F5] p-8 sm:p-12 rounded-3xl border border-stone-200/90 shadow-2xs"
                >
                  <div className="lg:col-span-6 space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono tracking-widest uppercase text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 font-semibold">
                          {currentVilla.badge}
                        </span>
                        <span className="text-sm font-mono text-stone-500"><LocalizedText text={"Solar privativo desde 204 m²"} /></span>
                      </div>
                      <h3 className="text-3xl sm:text-4xl font-light text-stone-950">
                        {currentVilla.name}
                      </h3>
                      <p className="text-sm text-stone-600 font-light leading-relaxed">
                        {currentVilla.tagline}
                      </p>
                    </div>

                    {/* Architectural Specs List */}
                    <div className="grid grid-cols-3 gap-4 py-6 border-y border-stone-200 text-left font-mono">
                      <div>
                        <span className="text-[10px] uppercase text-stone-400 block"><LocalizedText text={"Construcción"} /></span>
                        <span className="text-xl font-light text-stone-950">{currentVilla.constructionAreaSqm}<LocalizedText text={" m²"} /></span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-stone-400 block"><LocalizedText text={"Habitaciones"} /></span>
                        <span className="text-xl font-light text-stone-950">{currentVilla.bedrooms}<LocalizedText text={" Dorm"} /></span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-stone-400 block"><LocalizedText text={"Baños"} /></span>
                        <span className="text-xl font-light text-stone-950">{currentVilla.bathrooms}<LocalizedText text={"Baños"} /></span>
                      </div>
                    </div>

                    {/* Feature Bullets */}
                    <div className="grid sm:grid-cols-2 gap-3 text-xs text-stone-600">
                      {currentVilla.features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Check className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>

                    {/* Pricing & CTA */}
                    <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-mono tracking-wider uppercase text-stone-400 block">
                          {isCipres ? <LocalizedText text={"Precio desde"} /> : <LocalizedText text={"Precio Oficial de Lanzamiento"} />}
                        </span>
                        <span className="text-3xl font-light text-stone-950">
                          {formatCurrency(currentVilla.startingPrice, project.currency)}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => setSelectedTypology(currentVilla)}
                          className="inline-flex h-11 items-center justify-center px-5 rounded-full border border-stone-300 bg-white text-xs font-mono tracking-wider uppercase text-stone-900 hover:border-emerald-800 hover:text-emerald-800 transition cursor-pointer"
                        >
                          <Maximize2 className="h-3.5 w-3.5 mr-2" />
                          <span><LocalizedText text={"Plano 2D"} /></span>
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => {
                            setCalcModelKey(currentVilla.key);
                            document.getElementById('inversion')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="inline-flex h-11 items-center justify-center px-6 rounded-full bg-emerald-800 text-xs font-mono tracking-wider uppercase text-white hover:bg-emerald-900 transition shadow-xs cursor-pointer"
                        >
                          <Calculator className="h-3.5 w-3.5 text-emerald-300 mr-2" />
                          <span><LocalizedText text={"Plan de pago"} /></span>
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  {/* Villa Image / Blueprint Visual with Crossfade */}
                  <div className="lg:col-span-6 space-y-3">
                    <div
                      className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-white border border-stone-200 cursor-pointer group shadow-inner"
                      onClick={() => setSelectedTypology(currentVilla)}
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                          key={`${currentVilla.key}-${villaViewMode}`}
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="absolute inset-0"
                        >
                          {currentVillaImage ? (
                            <OptimizedTypologyImage
                              key={currentVillaImage}
                              src={currentVillaImage}
                              alt={`${villaViewMode === 'plano' ? 'Plano 2D' : 'Fachada 3D'} de ${currentVilla.name}`}
                            />
                          ) : (
                            <div className="absolute inset-4 flex items-center justify-center rounded-xl bg-stone-100 px-6 text-center text-xs text-stone-600"><LocalizedText text={"Imagen no disponible para esta tipología."} /></div>
                          )}
                        </motion.div>
                      </AnimatePresence>
                      <div className="absolute inset-0 bg-stone-950/0 group-hover:bg-stone-950/20 transition flex items-center justify-center">
                        <span className="rounded-full bg-stone-950/90 text-white px-4 py-2 text-xs font-mono tracking-wider uppercase opacity-0 group-hover:opacity-100 transition shadow-lg"><LocalizedText text={"Ampliar Plano 📐"} /></span>
                      </div>
                    </div>

                    {/* Toggle between Render and Blueprint with Animated Pill */}
                    {currentVilla.floorPlanImage && (
                      <div className="flex items-center justify-center gap-2 font-mono text-xs relative">
                        <button
                          type="button"
                          onClick={() => setVillaViewMode('render')}
                          className={cn(
                            'relative px-4 py-1.5 rounded-full transition cursor-pointer z-10',
                            villaViewMode === 'render' ? 'text-white font-medium' : 'text-stone-600 hover:text-stone-950'
                          )}
                        >
                          {villaViewMode === 'render' && (
                            <motion.div
                              layoutId="activeVillaModePill"
                              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                              className="absolute inset-0 rounded-full bg-emerald-800 -z-10 shadow-xs"
                            />
                          )}
                          <span><LocalizedText text={"Fachada 3D"} /></span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setVillaViewMode('plano')}
                          className={cn(
                            'relative px-4 py-1.5 rounded-full transition cursor-pointer z-10',
                            villaViewMode === 'plano' ? 'text-white font-medium' : 'text-stone-600 hover:text-stone-950'
                          )}
                        >
                          {villaViewMode === 'plano' && (
                            <motion.div
                              layoutId="activeVillaModePill"
                              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                              className="absolute inset-0 rounded-full bg-emerald-800 -z-10 shadow-xs"
                            />
                          )}
                          <span><LocalizedText text={"Plano 2D"} /></span>
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* 6. MEMORIA DE CALIDADES & ESPECIFICACIONES (MANORÉ LIGHT RESORT SPEC GRID) */}
      <section id="calidades" className="py-24 sm:py-32 bg-[#FAF8F5] border-y border-stone-200/80 w-full max-w-full overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 space-y-16">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-stone-200 pb-8"
          >
            <div className="space-y-2">
              <span className="text-xs font-mono tracking-[0.2em] uppercase text-emerald-800 font-semibold block">
                {translated('specs.eyebrow', config.specsEyebrow || '04 / Especificaciones Técnicas')}
              </span>
              <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-stone-950">
                {translated('specs.title', config.specsTitle || 'Memoria de Calidades & Acabados.')}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 max-w-md font-light">
              {translated(
                'specs.subtitle',
                config.specsSubtitle || 'Memoria técnica con estructura en formaleta, porcelanato, cocina con granito, baños revestidos y terminaciones pensadas para uso residencial diario.'
              )}
            </p>
          </motion.div>

          {config.specs && config.specs.length > 0 && (
            <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="lg:col-span-5 grid grid-cols-2 gap-3"
              >
                {(config.specImages?.length ? config.specImages : qualityReferenceImages.length ? qualityReferenceImages : allMedia).slice(0, 5).map((url, idx) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setLightboxImage(url)}
                    className={cn(
                      'group relative overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xs',
                      idx === 0 ? 'col-span-2 aspect-[16/9]' : 'aspect-square'
                    )}
                  >
                    <img
                      src={resolveLandingAssetUrl(url)}
                      alt={`Referencia de acabados ${idx + 1}`}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                    <span className="absolute bottom-2 left-2 rounded-full bg-stone-950/75 px-2.5 py-1 text-[9px] font-mono uppercase tracking-wider text-white"><LocalizedText text={"Referencia "} />{String(idx + 1).padStart(2, '0')}
                    </span>
                  </button>
                ))}
              </motion.div>

              <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
                {config.specs.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.6, delay: idx * 0.06, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-2xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-emerald-800 font-semibold tracking-widest">
                        {String(idx + 1).padStart(2, '0')}<LocalizedText text={" / MEMORIA"} /></span>
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    </div>
                    <h4 className="text-lg font-normal text-stone-950">{item.title}</h4>
                    <p className="text-xs text-stone-600 leading-relaxed font-light">
                      {item.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Equipamiento y Terminaciones Adicionales (Piscina & Pergolado) */}
          <div className="pt-10 border-t border-stone-200/90 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-emerald-800 font-semibold block"><LocalizedText text={"Personalización Exclusiva"} /></span>
                <h3 className="text-2xl sm:text-3xl font-light text-stone-950"><LocalizedText text={"Equipamiento y Mejoras Opcionales."} /></h3>
              </div>
              <p className="text-xs text-stone-500 font-light max-w-md"><LocalizedText text={"Mejoras de alta durabilidad disponibles para incorporar en tu solar durante la fase constructiva con entrega coordinada y llave en mano."} /></p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {CIPRES_OPTIONAL_ADDONS.map((addon) => (
                <div
                  key={addon.id}
                  className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-2xs hover:border-emerald-800/40 transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      {addon.badge && (
                        <span className="text-[10px] font-mono font-medium uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                          {addon.badge}
                        </span>
                      )}
                      <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                        {addon.price ? formatCurrency(addon.price, project.currency) : (addon.priceLabel || 'Costo Adicional')}
                      </span>
                    </div>
                    <h4 className="text-base font-semibold text-stone-950">{addon.name}</h4>
                    <p className="text-xs text-stone-600 font-light leading-relaxed">
                      {addon.description}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] font-mono text-emerald-800">
                    <span><LocalizedText text={"Instalación durante obra"} /></span>
                    <Check className="h-4 w-4 text-emerald-600" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 7. MANORÉ MASTER PLAN & AMENITIES */}
      {config.visibility.amenities && (
        <section id="masterplan" className="py-24 sm:py-32 bg-white w-full max-w-full overflow-hidden">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 space-y-16">
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-stone-200 pb-8"
            >
              <div className="space-y-2">
                <span className="text-xs font-mono tracking-[0.2em] uppercase text-emerald-800 font-semibold block"><LocalizedText text={"05 / Entorno &amp; Comunidad"} /></span>
                <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-stone-950"><LocalizedText text={"Master Plan &amp; Amenidades."} /></h2>
              </div>
            <p className="text-xs sm:text-sm text-stone-600 max-w-md font-light">
                {config.locationSubtitle || 'Residencial cerrado con casa club, canchas deportivas, áreas verdes, zona infantil, plaza comercial y control de acceso.'}
            </p>
            </motion.div>

            {config.amenities && config.amenities.length > 0 && (
              <div className="grid lg:grid-cols-12 gap-8 items-stretch">
                <motion.button
                  type="button"
                  onClick={() => masterPlanImage && setLightboxImage(masterPlanImage)}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="group relative lg:col-span-6 min-h-[360px] overflow-hidden rounded-3xl border border-stone-200 bg-stone-100 text-left shadow-2xs"
                >
                  {masterPlanImage && (
                    <img
                      src={resolveLandingAssetUrl(masterPlanImage)}
                      alt={`Master plan y amenidades de ${project.name}`}
                      className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/25 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 text-white">
                    <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-emerald-200"><LocalizedText text={"Referencia visual del entorno"} /></span>
                    <h3 className="mt-2 text-2xl sm:text-3xl font-light"><LocalizedText text={"Áreas comunes, acceso y comunidad."} /></h3>
                  </div>
                </motion.button>

                <div className="lg:col-span-6 grid sm:grid-cols-2 gap-4">
                  {config.amenities.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 15 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-30px' }}
                      transition={{ duration: 0.6, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                      className="rounded-2xl border border-stone-200 bg-[#FAF8F5] p-5 space-y-3 transition hover:border-emerald-800/40 hover:bg-white"
                    >
                      {project.slug === 'cipres-residences' ? <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800"><CipresAmenityIcon name={item.title} className="h-5 w-5" /></span> : <span className="text-[10px] font-mono text-emerald-800 font-semibold block">{String(idx + 1).padStart(2, '0')}</span>}
                      <h4 className="text-base font-medium text-stone-950">{item.title}</h4>
                      <p className="text-xs text-stone-500 font-light leading-relaxed">{item.description}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      
      {/* 7.5 MANORÉ LOCATION & CONNECTIVITY SECTION */}
      {config.visibility.location !== false && (
        <section id="ubicacion" className="py-24 sm:py-32 bg-white border-t border-stone-200 w-full max-w-full overflow-hidden">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 space-y-16">
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-stone-200 pb-8"
            >
              <div className="space-y-2">
                <span className="text-xs font-mono tracking-[0.2em] uppercase text-emerald-800 font-semibold block"><LocalizedText text={"06 / Conectividad &amp; Entorno"} /></span>
                <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-stone-950">
                  {config.locationTitle || `Ubicación de ${project.name}`}
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-stone-600 max-w-md font-light">
                {config.locationSubtitle || project.location || ''}
              </p>
            </motion.div>

            {/* Aerial Location Map Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="relative aspect-[16/9] sm:aspect-[21/9] rounded-3xl overflow-hidden border border-stone-200 shadow-lg group cursor-pointer"
              onClick={() => {
                if (config.googleMapsUrl) {
                  window.open(config.googleMapsUrl, '_blank', 'noopener,noreferrer');
                } else if (config.locationMapUrl) {
                  setLightboxImage(config.locationMapUrl);
                }
              }}
            >
              <img
                src={resolveLandingAssetUrl(config.locationMapUrl || allMedia[0] || '')}
                alt={`Mapa de Ubicación — ${project.name}`}
                className="h-full w-full object-cover group-hover:scale-103 transition duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-transparent to-transparent flex items-end justify-between p-6 sm:p-10">
                <div className="space-y-1">
                  <h3 className="text-xl sm:text-2xl font-normal text-white">
                    {config.locationTitle || project.location || project.name}
                  </h3>
                </div>
                {config.googleMapsUrl && (
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md text-xs font-mono text-white border border-white/30">
                    <MapPin className="h-3.5 w-3.5" />
                    <span><LocalizedText text={"Ver Ubicación en Maps"} /></span>
                  </span>
                )}
              </div>
            </motion.div>

            {/* Travel Time & Connectivity Milestones */}
            {config.proximityItems && config.proximityItems.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {config.proximityItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl bg-[#FAF8F5] border border-stone-200/80 p-5 space-y-2 flex flex-col justify-between"
                  >
                    <span className="text-2xl sm:text-3xl font-light text-emerald-800 font-mono block">
                      {item.time}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-stone-900">{item.place}</h4>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 8. DISPONIBILIDAD DE UNIDADES EN VIVO */}
      {config.visibility.availability && (
        <section id="lotes" className="py-24 sm:py-32 bg-[#FAF8F5] border-y border-stone-200 w-full max-w-full overflow-hidden">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 space-y-12">
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-stone-200 pb-8"
            >
              <div className="space-y-2">
                <span className="text-xs font-mono tracking-[0.2em] uppercase text-emerald-800 font-semibold block"><LocalizedText text={"06 / Inventario en Vivo"} /></span>
                <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-stone-950">
                  {isUve ? 'Disponibilidad de apartamentos.' : 'Disponibilidad de Solares.'}
                </h2>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span><LocalizedText text={"Actualizado en tiempo real"} /></span>
              </div>
            </motion.div>

            {/* Disclaimer de Disponibilidad Oficial */}
            <div className="flex items-start gap-3.5 rounded-2xl border border-amber-200/90 bg-amber-50/75 p-4 sm:p-5 text-xs text-amber-950 shadow-2xs">
              <AlertCircle className="h-5 w-5 shrink-0 text-amber-700 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-amber-950 font-mono tracking-wider uppercase text-[11px]"><LocalizedText text={"Aviso importante sobre disponibilidad y precios"} /></p>
                <p className="text-amber-800 leading-relaxed font-light text-xs"><LocalizedText text={"La disponibilidad de solares, lotes y precios de lista puede variar en tiempo real según el avance de ventas. Por favor consulte y confirme con un asesor oficial de ventas antes de realizar cualquier separación o pago."} /></p>
              </div>
            </div>

            {/* Pestañas de Manzanas (M4 a 12 meses y M8 a 24 meses) */}
            {countM4 > 0 && countM8 > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedManzana('all');
                    setShowAllAvailability(false);
                  }}
                  className={cn(
                    'px-4 py-2 rounded-full text-xs font-mono tracking-wider uppercase transition cursor-pointer font-medium',
                    selectedManzana === 'all'
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'bg-white border border-stone-200 text-stone-600 hover:border-stone-400'
                  )}
                ><LocalizedText text={"Todas las Manzanas ("} />{availableUnits.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedManzana('M4');
                    setShowAllAvailability(false);
                  }}
                  className={cn(
                    'px-4 py-2 rounded-full text-xs font-mono tracking-wider uppercase transition cursor-pointer font-medium flex items-center gap-1.5',
                    selectedManzana === 'M4'
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'bg-white border border-stone-200 text-stone-600 hover:border-stone-400'
                  )}
                >
                  <span><LocalizedText text={"Manzana M4 · Entrega a 12 Meses"} /></span>
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full', selectedManzana === 'M4' ? 'bg-emerald-900/60 text-emerald-100' : 'bg-stone-100 text-stone-600')}>
                    {countM4}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedManzana('M8');
                    setShowAllAvailability(false);
                  }}
                  className={cn(
                    'px-4 py-2 rounded-full text-xs font-mono tracking-wider uppercase transition cursor-pointer font-medium flex items-center gap-1.5',
                    selectedManzana === 'M8'
                      ? 'bg-emerald-800 text-white shadow-xs'
                      : 'bg-white border border-stone-200 text-stone-600 hover:border-stone-400'
                  )}
                >
                  <span><LocalizedText text={"Manzana M8 · Entrega a 24 Meses"} /></span>
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full', selectedManzana === 'M8' ? 'bg-emerald-900/60 text-emerald-100' : 'bg-stone-100 text-stone-600')}>
                    {countM8}
                  </span>
                </button>
              </div>
            )}

            <div className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-stone-200 bg-[#FAF8F5] px-3 py-2.5 text-stone-500">
                <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="sr-only"><LocalizedText text={"Buscar solar o lote"} /></span>
                <UITranslationBoundary attributes={["placeholder"]}><input
                  value={availabilityQuery}
                  onChange={(event) => {
                    setAvailabilityQuery(event.target.value);
                    setShowAllAvailability(false);
                  }}
                  placeholder="Buscar solar, lote o estado"
                  className="min-w-0 flex-1 bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400"
                /></UITranslationBoundary>
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {availabilityOnlyMode ? (
                  <span className="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-800">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" /><LocalizedText text={"Solo disponibles"} /></span>
                ) : (
                  <UITranslationBoundary attributes={["aria-label"]}><select
                    aria-label="Filtrar disponibilidad"
                    value={availabilityStatus}
                    onChange={(event) => {
                      setAvailabilityStatus(event.target.value as typeof availabilityStatus);
                      setShowAllAvailability(false);
                    }}
                    className="h-10 rounded-xl border border-stone-200 bg-white px-3 text-xs font-mono text-stone-700 outline-none focus:border-emerald-700"
                  >
                    <option value="all"><LocalizedText text={"Todos los estados"} /></option>
                    <option value="available"><LocalizedText text={"Disponibles"} /></option>
                    <option value="reserved"><LocalizedText text={"Reservados"} /></option>
                  </select></UITranslationBoundary>
                )}
                <UITranslationBoundary attributes={["aria-label"]}><div className="flex rounded-xl border border-stone-200 bg-[#FAF8F5] p-1" role="group" aria-label="Vista de disponibilidad">
                  <UITranslationBoundary attributes={["aria-label"]}><button type="button" aria-label="Ver en lista" aria-pressed={availabilityView === 'list'} onClick={() => setAvailabilityView('list')} className={cn('rounded-lg p-2 transition', availabilityView === 'list' ? 'bg-emerald-800 text-white' : 'text-stone-500 hover:text-stone-900')}>
                    <List className="h-4 w-4" aria-hidden="true" />
                  </button></UITranslationBoundary>
                  <UITranslationBoundary attributes={["aria-label"]}><button type="button" aria-label="Ver en tarjetas" aria-pressed={availabilityView === 'cards'} onClick={() => setAvailabilityView('cards')} className={cn('rounded-lg p-2 transition', availabilityView === 'cards' ? 'bg-emerald-800 text-white' : 'text-stone-500 hover:text-stone-900')}>
                    <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                  </button></UITranslationBoundary>
                </div></UITranslationBoundary>
              </div>
            </div>

            {/* MOBILE VIEW (< md): Luxury Solar Card Feed */}
            <div className={cn('grid grid-cols-1 gap-4', availabilityView === 'cards' ? 'md:grid-cols-2 xl:grid-cols-3' : 'md:hidden')}>
              {visibleAvailabilityUnits.map((unit) => {
                const isAvailable = unit.status === 'Disponible';
                const solarArea =
                  resolveCustomValue(unit.customColumns, 'METROS CUADRADOS') ||
                  resolveCustomValue(unit.customColumns, 'SOLAR (M2)') ||
                  `${unit.area || '204'} m²`;
                const esmeraldaPrice = resolveCustomValue(unit.customColumns, 'ESMERALDA') || '—';
                const perlaPrice = resolveCustomValue(unit.customColumns, 'PERLA') || '—';
                const ambarPrice = resolveCustomValue(unit.customColumns, 'AMBAR') || '—';

                return (
                  <div
                    key={unit.id}
                    className="bg-white rounded-2xl border border-stone-200/90 p-5 space-y-4 shadow-xs"
                  >
                    {/* Card Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400 block"><LocalizedText text={"Solar / Lote"} /></span>
                          <span className="text-[10px] font-mono px-2 py-0.2 rounded-md bg-stone-100 text-emerald-800 font-semibold">
                            {/M\s*4/i.test(unit.unit) ? <LocalizedText text={"12 Meses"} /> : /M\s*8/i.test(unit.unit) ? <LocalizedText text={"24 Meses"} /> : ''}
                          </span>
                        </div>
                        <span className="text-base font-bold text-stone-950">{unit.unit}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-stone-100 text-stone-700">
                          {solarArea}
                        </span>
                        <span
                          className={cn(
                            'text-[10px] font-mono uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full',
                            isAvailable
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-stone-100 text-stone-400'
                          )}
                        >
                          {isAvailable ? `● ${t('available')}` : `— ${t('reserved')}`}
                        </span>
                      </div>
                    </div>

                    {/* Pricing Breakdown per Villa Option */}
                    <div className="rounded-xl bg-[#FAF8F5] p-3.5 space-y-2 text-xs font-mono border border-stone-200/60">
                      <div className="flex items-center justify-between text-stone-600">
                <span>{isUve ? 'Tipo A (96 m²):' : 'Villa Esmeralda (61 m²):'}</span>
                        <span className="font-bold text-stone-950">{esmeraldaPrice}</span>
                      </div>
                      <div className="flex items-center justify-between text-stone-600">
                <span>{isUve ? 'Tipo B (115 m²):' : 'Villa Perla (65 m²):'}</span>
                        <span className="font-bold text-stone-950">{perlaPrice}</span>
                      </div>
                      <div className="flex items-center justify-between text-stone-600">
                <span>{isUve ? 'Penthouse / Rooftop:' : <LocalizedText text={"Villa Ámbar (74 m²):"} />}</span>
                        <span className="font-bold text-stone-950">{ambarPrice}</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    {isAvailable ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedUnitForInquiry(unit);
                          document.getElementById('inversion')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-800 text-white text-xs font-mono font-semibold uppercase tracking-wider shadow-xs hover:bg-emerald-900 active:scale-[0.98] transition cursor-pointer"
                      >
                        <Calculator className="h-3.5 w-3.5 text-emerald-300" />
                        <span><LocalizedText text={"Plan de pago Solar "} />{unit.unit}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <div className="text-center py-2.5 text-xs font-mono text-stone-400 bg-stone-50 rounded-xl">
                        {isUve ? <LocalizedText text={"Apartamento no disponible"} /> : <LocalizedText text={"Solar no disponible"} />}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* DESKTOP VIEW (>= md): Spacious Inventory Table */}
            <div className={cn('overflow-x-auto bg-white rounded-3xl border border-stone-200/90 shadow-sm p-6', availabilityView === 'list' ? 'hidden md:block' : 'hidden')}>
              <table className="w-full text-left text-xs font-mono min-w-[680px]">
                <thead className="border-b border-stone-200 text-stone-400 uppercase tracking-widest text-[10px]">
                  <tr>
                    <th className="py-4 font-semibold text-stone-900 whitespace-nowrap"><LocalizedText text={"Solar / Lote"} /></th>
                    {hasCustomCols ? (
                      customCols.map((col) => {
                        const isSolar = col.toUpperCase().includes('METRO') || col.toUpperCase().includes('M2');
                        return (
                          <th key={col} className="py-4 font-normal whitespace-nowrap">
                            {isSolar ? 'Solar (m²)' : getVillaColumnLabel(col, typologiesList)}
                          </th>
                        );
                      })
                    ) : (
                      <>
                        <th className="py-4 font-normal whitespace-nowrap"><LocalizedText text={"Manzana"} /></th>
                        <th className="py-4 font-normal whitespace-nowrap"><LocalizedText text={"Área"} /></th>
                        <th className="py-4 font-normal whitespace-nowrap"><LocalizedText text={"Precio"} /></th>
                      </>
                    )}
                    <th className="py-4 font-normal whitespace-nowrap"><LocalizedText text={"Estado"} /></th>
                    <th className="py-4 text-right font-normal whitespace-nowrap"><LocalizedText text={"Acción"} /></th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-stone-100">
                  {visibleAvailabilityUnits.map((unit) => {
                    const isAvailable = unit.status === 'Disponible';

                    return (
                      <tr key={unit.id} className="hover:bg-stone-50/80 transition">
                        <td className="py-4 font-semibold text-stone-950 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span>{unit.unit}</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {/M\s*4/i.test(unit.unit) ? '12m' : /M\s*8/i.test(unit.unit) ? '24m' : ''}
                            </span>
                          </div>
                        </td>

                        {hasCustomCols ? (
                          customCols.map((col) => {
                            const val = resolveCustomValue(unit.customColumns, col);
                            const isPrice = val.includes('$') || val.includes('USD');
                            return (
                              <td
                                key={col}
                                className={cn(
                                  'py-4 whitespace-nowrap',
                                  isPrice ? 'font-semibold text-stone-950' : 'text-stone-500'
                                )}
                              >
                                {val}
                              </td>
                            );
                          })
                        ) : (
                          <>
                            <td className="py-4 text-stone-500 whitespace-nowrap">{unit.tower || 'M-01'}</td>
                            <td className="py-4 text-stone-500 whitespace-nowrap">{unit.area}<LocalizedText text={" m²"} /></td>
                            <td className="py-4 font-semibold text-stone-950 whitespace-nowrap">{formatCurrency(unit.price, unit.currency || project.currency)}</td>
                          </>
                        )}

                        <td className="py-4 whitespace-nowrap">
                          <span
                            className={cn(
                              'text-[10px] uppercase tracking-wider font-semibold',
                              isAvailable ? 'text-emerald-800' : 'text-stone-400'
                            )}
                          >
                            {isAvailable ? `● ${t('available')}` : `— ${t('reserved')}`}
                          </span>
                        </td>

                        <td className="py-4 text-right whitespace-nowrap">
                          {isAvailable ? (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              type="button"
                              onClick={() => {
                                setSelectedUnitForInquiry(unit);
                                document.getElementById('inversion')?.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className="inline-flex items-center px-4 py-1.5 rounded-full border border-stone-300 text-[10px] tracking-wider uppercase text-emerald-800 hover:border-emerald-800 hover:bg-emerald-50 transition cursor-pointer font-medium"
                            >
                              <Calculator className="h-3 w-3 mr-1 text-emerald-700" />
                              <span><LocalizedText text={"Plan de pago"} /></span>
                              <ArrowRight className="h-3 w-3 ml-1" />
                            </motion.button>
                          ) : (
                            <span className="text-stone-400 text-[10px]"><LocalizedText text={"No disponible"} /></span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredAvailabilityUnits.length > 20 && !showAllAvailability && (
              <div className="flex justify-center">
                <button type="button" onClick={() => setShowAllAvailability(true)} className="inline-flex items-center gap-2 rounded-full border border-emerald-800 px-6 py-3 text-xs font-mono uppercase tracking-wider text-emerald-800 transition hover:bg-emerald-800 hover:text-white"><LocalizedText text={"Cargar todas "} /><span className="text-stone-400">({filteredAvailabilityUnits.length})</span>
                </button>
              </div>
            )}
            {filteredAvailabilityUnits.length === 0 && (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-10 text-center text-sm text-stone-500"><LocalizedText text={"No hay solares que coincidan con la búsqueda."} /></div>
            )}
          </div>
        </section>
      )}

      {/* 9. CALCULADORA FINANCIERA & PLAN DE PAGO */}
      <section id="inversion" className="py-24 sm:py-32 bg-white w-full max-w-full overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 space-y-16">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-stone-200 pb-8"
          >
            <div className="space-y-2">
              <span className="text-xs font-mono tracking-[0.2em] uppercase text-emerald-800 font-semibold block"><LocalizedText text={"07 / Esquema de Inversión"} /></span>
              <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-stone-950"><LocalizedText text={"Simulador de Plan de Pago."} /></h2>
            </div>
            <p className="text-xs sm:text-sm text-stone-600 max-w-md font-light">
              {isUve ? <LocalizedText text={"Reserva con US$2,000, 20% a la firma, 30% durante construcción y 50% contra entrega."} /> : <LocalizedText text={"Estructura financiera transparente: 10% a la firma, 20% durante construcción y 70% contra entrega financiable con bancos."} />}
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-12 gap-12 items-start">
            {/* Controls */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 bg-[#FAF8F5] p-8 rounded-3xl border border-stone-200/90 shadow-2xs space-y-6"
            >
              <div className="space-y-3">
                <label className="text-[10px] font-mono tracking-widest uppercase text-stone-500 block">
                  1. {isUve ? <LocalizedText text={"Tipología"} /> : 'Modelo de Villa'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {typologiesList.map((t) => (
                    <motion.button
                      key={t.key}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => setCalcModelKey(t.key)}
                      className={cn(
                        'p-3 rounded-2xl border text-center transition cursor-pointer',
                        calcModelKey === t.key
                          ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                          : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                      )}
                    >
                      <span className="text-xs font-semibold block">{t.name.replace('Villa ', '')}</span>
                      <span className={cn('text-[10px] font-mono block mt-1', calcModelKey === t.key ? 'text-emerald-200' : 'text-emerald-700')}>
                        {formatCurrency(t.startingPrice, project.currency)}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-stone-500 uppercase tracking-wider text-[10px]"><LocalizedText text={"2. Plazo de Construcción"} /></span>
                  <span className="font-semibold text-stone-950">{calcMonths}<LocalizedText text={" Meses"} /></span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[12, 24].map((months) => (
                    <button
                      key={months}
                      type="button"
                      onClick={() => setCalcMonths(months)}
                      className={cn(
                        'p-3 rounded-2xl border text-center transition cursor-pointer',
                        calcMonths === months
                          ? 'bg-emerald-800 text-white border-emerald-800 shadow-xs'
                          : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
                      )}
                    >
                      <span className="text-xs font-semibold">{months}<LocalizedText text={" Meses"} /></span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-stone-200/80 space-y-2 text-xs font-mono bg-white p-4 rounded-2xl border border-stone-200/70">
                <div className="flex justify-between text-stone-600">
                  <span><LocalizedText text={"Precio Total:"} /></span>
                  <span className="text-stone-950 font-semibold">{formatCurrency(villaPrice, project.currency)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span><LocalizedText text={"Reserva Inmediata:"} /></span>
                  <span className="text-emerald-800 font-semibold">{formatCurrency(reserveAmount, project.currency)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span><LocalizedText text={"Firma Contrato ("} />{contractPercent * 100}%):</span>
                  <span className="text-stone-950 font-semibold">{formatCurrency(contractAmount, project.currency)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span><LocalizedText text={"Durante Obra ("} />{constructionPercent * 100}%):</span>
                  <span className="text-stone-950 font-semibold">{formatCurrency(constructionTotal, project.currency)}</span>
                </div>
                <div className="flex justify-between text-emerald-800 bg-emerald-50 -mx-4 px-4 py-2 rounded-lg">
                  <span className="font-semibold"><LocalizedText text={"Cuota Mensual ("} />{calcMonths}<LocalizedText text={" meses):"} /></span>
                  <span className="font-bold">{formatCurrency(monthlyInstallment, project.currency)}<LocalizedText text={"/mes"} /></span>
                </div>
                <div className="flex justify-between text-stone-600 pt-2 border-t border-stone-100">
                  <span><LocalizedText text={"Contra Entrega ("} />{deliveryPercent * 100}%):</span>
                  <span className="text-stone-950 font-semibold">{formatCurrency(deliveryAmount, project.currency)}</span>
                </div>
              </div>

              <motion.a
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href={buildWhatsappLink(`Hola! He simulado la compra de ${selectedCalcTypology?.name} por ${formatCurrency(villaPrice, project.currency)} con cuotas de ${formatCurrency(monthlyInstallment, project.currency)}/mes a ${calcMonths} meses. Deseo cotización oficial.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-emerald-800 text-xs font-mono tracking-wider uppercase text-white hover:bg-emerald-900 transition shadow-xs"
              >
                <MessageCircle className="h-4 w-4 text-emerald-300" />
                <span><LocalizedText text={"Solicitar Esta Cotización"} /></span>
              </motion.a>
            </motion.div>

            {/* Step-by-Step Breakdown Cards */}
            <div className="lg:col-span-7 grid sm:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="p-8 rounded-3xl bg-[#FAF8F5] border border-stone-200/90 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono tracking-widest uppercase text-stone-400 block"><LocalizedText text={"Paso 01 · Reserva"} /></span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <Check className="h-3 w-3" />
                    <span><LocalizedText text={"100% Reembolsable"} /></span>
                  </span>
                </div>
                <span className="text-3xl font-light text-stone-950 block">{formatCurrency(500, project.currency)}</span>
                <p className="text-xs text-stone-600 font-light leading-relaxed"><LocalizedText text={"Separa y congela el precio del solar y villa elegida. "} /><strong className="font-semibold text-emerald-900"><LocalizedText text={"100% reembolsable dentro de los primeros 15 días"} /></strong><LocalizedText text={" si por cualquier razón decides no continuar."} /></p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="p-8 rounded-3xl bg-[#FAF8F5] border border-stone-200/90 shadow-2xs space-y-2"
              >
                <span className="text-[10px] font-mono tracking-widest uppercase text-stone-400 block"><LocalizedText text={"Paso 02 · Contrato (10%)"} /></span>
                <span className="text-3xl font-light text-stone-950 block">{formatCurrency(contractAmount, project.currency)}</span>
                <p className="text-xs text-stone-500 font-light leading-relaxed"><LocalizedText text={"Completa el 10% del valor total con la firma del contrato definitivo en un plazo de 30 días."} /></p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="p-8 rounded-3xl bg-emerald-800 text-white shadow-md space-y-2"
              >
                <span className="text-[10px] font-mono tracking-widest uppercase text-emerald-200 block"><LocalizedText text={"Paso 03 · Cuota Mensual ("} />{calcMonths}<LocalizedText text={" meses)"} /></span>
                <span className="text-3xl font-light text-emerald-300 block">
                  {formatCurrency(monthlyInstallment, project.currency)}
                </span>
                <p className="text-xs text-emerald-100 font-light leading-relaxed"><LocalizedText text={"20% distribuido en "} />{calcMonths}<LocalizedText text={" mensualidades fijas durante la construcción."} /></p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="p-8 rounded-3xl bg-[#FAF8F5] border border-stone-200/90 shadow-2xs space-y-2"
              >
                <span className="text-[10px] font-mono tracking-widest uppercase text-stone-400 block"><LocalizedText text={"Paso 04 · Entrega (70%)"} /></span>
                <span className="text-3xl font-light text-stone-950 block">{formatCurrency(deliveryAmount, project.currency)}</span>
                <p className="text-xs text-stone-500 font-light leading-relaxed"><LocalizedText text={"Financiable con bancos comerciales nacionales o la Cooperativa del Desarrollador a tasas competitivas."} /></p>
              </motion.div>
            </div>
          </div>

          {/* Sección Especial: Financiamiento por Cooperativa COHISPANICA (Específico de Ciprés Residences) */}
          {isCipres && (
            <div className="w-full rounded-3xl border border-emerald-900/10 bg-[#f4f7f2] p-6 text-[#1d4035] sm:p-10 space-y-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-emerald-900/15">
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-emerald-800 font-semibold block">
                      {translated('cooperative.eyebrow', 'Facilidad Crediticia Exclusiva')}
                    </span>
                    <h3 className="max-w-3xl text-2xl sm:text-4xl font-light tracking-tight leading-tight text-[#1d4035]">
                      {translated('cooperative.title', 'Financiamiento Directo por la Cooperativa COHISPANICA.')}
                    </h3>
                  </div>
                  <div className="shrink-0 flex items-center gap-2 rounded-full border border-emerald-900/15 bg-white px-4 py-2 text-xs font-medium text-emerald-900">
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    <span>{translated('cooperative.badge', 'Tasa Competitiva de Mercado')}</span>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2 rounded-2xl bg-white p-5">
                    <span className="text-xs font-semibold text-emerald-800 block"><LocalizedText text={"01 · Aprobación Ágil"} /></span>
                    <h4 className="text-sm font-semibold text-[#1d4035]"><LocalizedText text={"Sin Trabas Bancarias"} /></h4>
                    <p className="text-sm text-[#496458] leading-relaxed"><LocalizedText text={"Calificación directa con el comité financiero de la cooperativa COHISPANICA con requisitos simplificados."} /></p>
                  </div>

                  <div className="space-y-2 rounded-2xl bg-white p-5">
                    <span className="text-xs font-semibold text-emerald-800 block"><LocalizedText text={"02 · Tasa Competitiva"} /></span>
                    <h4 className="text-sm font-semibold text-[#1d4035]"><LocalizedText text={"Interés Preferencial"} /></h4>
                    <p className="text-sm text-[#496458] leading-relaxed"><LocalizedText text={"Tasas de interés alineadas a las mejores condiciones del mercado financiero para cuotas sostenibles."} /></p>
                  </div>

                  <div className="space-y-2 rounded-2xl bg-white p-5">
                    <span className="text-xs font-semibold text-emerald-800 block"><LocalizedText text={"03 · Diáspora y Extranjeros"} /></span>
                    <h4 className="text-sm font-semibold text-[#1d4035]"><LocalizedText text={"Acceso Internacional"} /></h4>
                    <p className="text-sm text-[#496458] leading-relaxed"><LocalizedText text={"Financiamiento abierto a dominicanos en el exterior y extranjeros sin requerir historial crediticio local previo."} /></p>
                  </div>

                  <div className="space-y-2 rounded-2xl bg-white p-5">
                    <span className="text-xs font-semibold text-emerald-800 block"><LocalizedText text={"04 · Hasta 70% Entrega"} /></span>
                    <h4 className="text-sm font-semibold text-[#1d4035]"><LocalizedText text={"Amortización Cómoda"} /></h4>
                    <p className="text-sm text-[#496458] leading-relaxed"><LocalizedText text={"Financia el saldo del 70% contra entrega de la villa con plazos adaptados a tu conveniencia."} /></p>
                  </div>
                </div>

                <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-t border-emerald-900/15 text-sm">
                  <div className="flex items-start gap-2 text-[#496458]">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-800" aria-hidden="true" />
                    <span><LocalizedText text={"Reserva 100% reembolsable dentro de los primeros 15 días."} /></span>
                  </div>
                  <a
                    href={buildWhatsappLink('Hola! Deseo consultar las condiciones y requisitos del financiamiento por la Cooperativa COHISPANICA en Ciprés Residences.')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1d4035] hover:bg-[#2b5b48] px-6 py-2.5 text-white font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-800"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    <span><LocalizedText text={"Consultar con un Asesor"} /></span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </section>

      {/* 10. GALERÍA FOTOGRÁFICA OFICIAL */}
      {config.visibility.gallery && allMedia.length > 0 && (
        <section className="py-24 sm:py-32 bg-[#FAF8F5] border-y border-stone-200 w-full max-w-full overflow-hidden">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 space-y-16">
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-stone-200 pb-8"
            >
              <div className="space-y-2">
                <span className="text-xs font-mono tracking-[0.2em] uppercase text-emerald-800 font-semibold block"><LocalizedText text={"08 / Archivo Visual"} /></span>
                <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-stone-950"><LocalizedText text={"Galería &amp; Renders"} /></h2>
              </div>
              <div className="flex flex-col sm:items-end gap-3">
                <span className="text-xs font-mono text-stone-500"><LocalizedText text={"Selecciona una imagen para verla en grande o descarga la galería con marca de agua."} /></span>
                {hasImagePack && (
                  <button
                    type="button"
                    onClick={handleDownloadImagePack}
                    disabled={imagePackDownloading}
                    className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-xs font-mono font-semibold text-white hover:bg-stone-800 transition shadow-md disabled:opacity-60 cursor-pointer"
                  >
                    {imagePackDownloading ? (
                      <>
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                          <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                        </svg>
                        <span>{imagePackProgress?.status || 'Preparando ZIP...'}</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        <span><LocalizedText text={"Descargar ZIP"} /></span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </motion.div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 font-mono text-xs relative">
              {([
                { key: 'all', label: 'Todas' },
                { key: 'exterior', label: 'Villas & Renders' },
                { key: 'planos', label: 'Planos Arquitectónicos' },
              ] as const).map((tab) => {
                const isActive = galleryFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      setGalleryFilter(tab.key);
                      setFeaturedGalleryIndex(0);
                    }}
                    className={cn(
                      'relative px-4 py-1.5 rounded-full transition cursor-pointer z-10',
                      isActive ? 'text-white font-medium' : 'text-stone-600 hover:text-stone-950'
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeGalleryChip"
                        transition={{ type: 'spring', damping: 25, stiffness: 280 }}
                        className="absolute inset-0 rounded-full bg-emerald-800 -z-10 shadow-xs"
                      />
                    )}
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Dynamic Gallery Viewer */}
            {featuredGalleryImage && (
              <div className="grid min-w-0 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                <motion.button
                  type="button"
                  key={featuredGalleryImage}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => setLightboxImage(featuredGalleryImage)}
                  className="group relative block w-full min-w-0 lg:col-span-8 aspect-[16/10] overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xs"
                >
                  <img
                    src={resolveLandingAssetUrl(featuredGalleryImage)}
                    alt={`Imagen destacada ${featuredGalleryIndex + 1}`}
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-transparent to-transparent" />
                  <span className="absolute bottom-5 left-5 rounded-full bg-white/90 px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-stone-900">
                    {String(activeFeaturedGalleryIndex + 1).padStart(2, '0')} / {String(filteredGalleryMedia.length).padStart(2, '0')}
                  </span>
                </motion.button>

                <div className="min-w-0 lg:col-span-4 grid grid-cols-3 lg:grid-cols-2 gap-3 max-h-[540px] overflow-y-auto pr-1">
                  {filteredGalleryMedia.map((url, idx) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setFeaturedGalleryIndex(idx)}
                      className={cn(
                        'relative aspect-[4/3] overflow-hidden rounded-2xl border bg-white transition',
                        featuredGalleryImage === url
                          ? 'border-emerald-800 ring-2 ring-emerald-800/20'
                          : 'border-stone-200 opacity-75 hover:opacity-100 hover:border-stone-400'
                      )}
                    >
                      <img
                        src={resolveLandingAssetUrl(url)}
                        alt={`Miniatura ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                      <span className="absolute bottom-1.5 left-1.5 rounded bg-stone-950/75 px-1.5 py-0.5 text-[8px] font-mono text-white">
                        #{String(idx + 1).padStart(2, '0')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 11. PREGUNTAS FRECUENTES (FAQ ACORDEÓN) */}
      <section className="py-24 sm:py-32 bg-white w-full max-w-full overflow-hidden">
        <div className="mx-auto max-w-4xl px-6 sm:px-8 space-y-16">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center space-y-2"
          >
            <span className="text-xs font-mono tracking-[0.2em] uppercase text-emerald-800 font-semibold block"><LocalizedText text={"09 / Preguntas Frecuentes"} /></span>
            <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-stone-950"><LocalizedText text={"Información Oficial &amp; Respuestas."} /></h2>
          </motion.div>

          <div className="divide-y divide-stone-200 border-y border-stone-200">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="py-6">
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between text-left text-base font-normal text-stone-950 hover:text-emerald-800 transition cursor-pointer"
                  >
                    <span className="pr-4">{faq.q}</span>
                    <span className="text-lg font-mono text-stone-400">
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 text-xs sm:text-sm text-stone-600 font-light leading-relaxed">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 12. MANORÉ CONCIERGE & CONTACTO (DIRECT WHATSAPP DISPATCH) */}
      {config.visibility.contactForm && (
        <section id="contacto" className="py-24 sm:py-32 bg-[#FAF8F5] border-t border-stone-200 text-stone-900 w-full max-w-full overflow-hidden">
          <div className="mx-auto max-w-5xl px-6 sm:px-8 space-y-12">
            <div className="grid md:grid-cols-12 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="md:col-span-6 space-y-6"
              >
                <span className="text-xs font-mono tracking-[0.2em] uppercase text-emerald-800 font-semibold block"><LocalizedText text={"10 / Atención Directa"} /></span>
                <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-stone-950 leading-tight"><LocalizedText text={"Reserva tu villa en "} />{project.name}.
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 font-light leading-relaxed"><LocalizedText text={"Completa tus datos para recibir el brochure oficial, planos y disponibilidad actualizada de un asesor comercial."} /></p>

                <div className="space-y-2 pt-2 text-xs font-mono text-stone-700">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                    <span><LocalizedText text={"Reserva con "} />{formatCurrency(500, project.currency)}<LocalizedText text={" (100% reembolsable)"} /></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                    <span><LocalizedText text={"Títulos individuales deslindados"} /></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                    <span><LocalizedText text={"Financiamiento directo y bancario disponible"} /></span>
                  </div>
                </div>

                {brokerReferrer && (
                  <div className="flex items-center gap-3 pt-4 border-t border-stone-200">
                    {brokerReferrer.avatarUrl ? (
                      <img
                        src={brokerReferrer.avatarUrl}
                        alt={brokerReferrer.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-800 grid place-items-center font-mono text-xs font-semibold">
                        {brokerReferrer.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <span className="text-[9px] font-mono tracking-wider uppercase text-stone-400 block"><LocalizedText text={"Asesor Concierge Asignado"} /></span>
                      <span className="text-xs font-semibold text-stone-900">{brokerReferrer.name}</span>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Light Luxury Form Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="md:col-span-6 bg-white p-8 sm:p-10 rounded-3xl border border-stone-200/90 shadow-xl"
              >
                <form onSubmit={handleLeadSubmit} className="space-y-4">
                  {leadSubmitted ? (
                    <div className="p-8 text-center space-y-2 text-emerald-800 font-mono text-xs">
                      <Check className="h-8 w-8 mx-auto text-emerald-700" />
                      <p className="text-stone-950 font-semibold text-sm"><LocalizedText text={"Solicitud Recibida"} /></p>
                      <p className="text-stone-600"><LocalizedText text={"Un asesor revisará tus datos y se pondrá en contacto contigo."} /></p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="text-[10px] font-mono uppercase tracking-wider text-stone-600 block mb-1"><LocalizedText text={"Nombre y Apellido *"} /></label>
                        <UITranslationBoundary attributes={["placeholder"]}><input
                          required
                          value={leadForm.name}
                          onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })}
                          placeholder="Ej: Carlos Rodríguez"
                          className="h-11 w-full rounded-full border border-stone-300 bg-[#FAF8F5] px-4 text-xs font-mono text-stone-900 placeholder:text-stone-400 outline-none focus:border-emerald-700 focus:bg-white transition"
                        /></UITranslationBoundary>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-mono uppercase tracking-wider text-stone-600 block mb-1"><LocalizedText text={"Teléfono / WhatsApp *"} /></label>
                          <UITranslationBoundary attributes={["placeholder"]}><input
                            required
                            type="tel"
                            value={leadForm.phone}
                            onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                            placeholder="+1 (829) 000-0000"
                            className="h-11 w-full rounded-full border border-stone-300 bg-[#FAF8F5] px-4 text-xs font-mono text-stone-900 placeholder:text-stone-400 outline-none focus:border-emerald-700 focus:bg-white transition"
                          /></UITranslationBoundary>
                        </div>

                        <div>
                          <label className="text-[10px] font-mono uppercase tracking-wider text-stone-600 block mb-1"><LocalizedText text={"Email"} /></label>
                          <UITranslationBoundary attributes={["placeholder"]}><input
                            type="email"
                            value={leadForm.email}
                            onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                            placeholder="tu@email.com"
                            className="h-11 w-full rounded-full border border-stone-300 bg-[#FAF8F5] px-4 text-xs font-mono text-stone-900 placeholder:text-stone-400 outline-none focus:border-emerald-700 focus:bg-white transition"
                          /></UITranslationBoundary>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-mono uppercase tracking-wider text-stone-600 block mb-1"><LocalizedText text={"Me contacto como"} /></label>
                        <select value={leadForm.role || 'Cliente'} onChange={(e) => setLeadForm({ ...leadForm, role: e.target.value })} className="h-11 w-full rounded-full border border-stone-300 bg-[#FAF8F5] px-4 text-xs font-mono text-stone-900 outline-none focus:border-emerald-700 focus:bg-white transition">
                          <option><LocalizedText text={"Cliente"} /></option>
                          <option><LocalizedText text={"Agente de bienes raíces"} /></option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-mono uppercase tracking-wider text-stone-600 block mb-1"><LocalizedText text={"Modelo de Interés"} /></label>
                        <select
                          value={leadForm.typology}
                          onChange={(e) => setLeadForm({ ...leadForm, typology: e.target.value })}
                          className="h-11 w-full rounded-full border border-stone-300 bg-[#FAF8F5] px-4 text-xs font-mono text-stone-900 outline-none focus:border-emerald-700 focus:bg-white transition"
                        >
                          {typologiesList.map((typology) => (
                            <option key={typology.key} value={`${typology.name} (${typology.constructionAreaSqm} m²)`}>
                              {typology.name} · {typology.constructionAreaSqm}<LocalizedText text={" m²"} /></option>
                          ))}
                          {!isUve && <option value="Solo Solar / Lote"><LocalizedText text={"Solo Solar / Lote"} /></option>}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-mono uppercase tracking-wider text-stone-600 block mb-1"><LocalizedText text={"Mensaje"} /></label>
                        <UITranslationBoundary attributes={["placeholder"]}><textarea
                          rows={2}
                          value={leadForm.message}
                          onChange={(e) => setLeadForm({ ...leadForm, message: e.target.value })}
                          placeholder="¿Alguna consulta específica?"
                          className="w-full rounded-2xl border border-stone-300 bg-[#FAF8F5] p-3 text-xs font-mono text-stone-900 placeholder:text-stone-400 outline-none focus:border-emerald-700 focus:bg-white transition"
                        /></UITranslationBoundary>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-emerald-800 text-xs font-mono tracking-wider uppercase text-white hover:bg-emerald-900 transition active:scale-[0.99] cursor-pointer shadow-sm"
                      >
                        <MessageCircle className="h-4 w-4 text-emerald-300" />
                        <span><LocalizedText text={"Enviar solicitud"} /></span>
                      </motion.button>
                    </>
                  )}
                </form>
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* 13. PROJECT FOOTER */}
      {isCipres ? (
        <footer className="border-t border-emerald-900/10 bg-[#f4f7f2] text-[#1d4035]">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
            <div className="grid gap-10 py-12 sm:py-14 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-16">
              <div className="min-w-0">
                <Link href={`/proyectos/${project.slug}`} className="inline-flex max-w-full items-center gap-3 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-800" aria-label={`${project.name} — inicio`}>
                  {config.navbarLogoUrl && (
                    <UITranslationBoundary attributes={["alt"]}><Image
                      src={config.navbarLogoUrl}
                      alt=""
                      width={80}
                      height={80}
                      unoptimized
                      className="h-14 w-auto shrink-0 object-contain"
                    /></UITranslationBoundary>
                  )}
                  {config.navbarLogoTextUrl ? (
                    <Image
                      src={config.navbarLogoTextUrl}
                      alt={project.name}
                      width={260}
                      height={80}
                      unoptimized
                      className="h-14 w-auto max-w-[min(60vw,220px)] object-contain"
                    />
                  ) : (
                    <span className="font-serif text-2xl font-semibold tracking-tight">{project.name}</span>
                  )}
                </Link>
                {(config.footerLocation || project.location) && (
                  <p className="mt-5 flex max-w-lg items-start gap-2 text-sm leading-relaxed text-[#496458]">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{config.footerLocation || project.location}</span>
                  </p>
                )}
              </div>

              <div className="flex flex-col items-start gap-6 lg:items-end">
                <UITranslationBoundary attributes={["aria-label"]}><nav aria-label="Navegación del pie de página" className="flex flex-wrap gap-x-6 gap-y-1 text-sm font-medium">
                  <a href="#villas" className="rounded-sm py-2 transition-colors hover:text-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"><LocalizedText text={"Modelos"} /></a>
                  <a href="#ubicacion" className="rounded-sm py-2 transition-colors hover:text-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"><LocalizedText text={"Ubicación"} /></a>
                  <a href="#lotes" className="rounded-sm py-2 transition-colors hover:text-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"><LocalizedText text={"Disponibilidad"} /></a>
                </nav></UITranslationBoundary>
                <a href="#contacto" className="inline-flex min-h-11 items-center gap-3 rounded-xl bg-[#1d4035] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#2b5b48] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-800"><LocalizedText text={"Solicitar información"} /><ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-emerald-900/15 py-6 text-xs text-[#496458] sm:flex-row sm:items-center sm:justify-between">
              <span>© {new Date().getFullYear()} {project.name}<LocalizedText text={". Todos los derechos reservados."} /></span>
              <span><LocalizedText text={"Presentado por"} />{' '}
                <Link href="/" className="font-semibold text-[#1d4035] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"><LocalizedText text={"OB Brokers Team"} /></Link>
              </span>
            </div>
          </div>
        </footer>
      ) : (
      <footer className="border-t border-stone-200 bg-[#FBFBFA] py-16 text-xs text-stone-500 font-mono">
        <div className="mx-auto flex max-w-7xl min-w-0 flex-col gap-8 px-6 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-12">
          <div className="flex min-w-0 max-w-full flex-col items-center gap-2 text-center lg:items-start lg:text-left">
            {config.navbarLogoTextUrl || config.navbarLogoUrl ? (
              <div className="flex items-center justify-center gap-2 sm:justify-start">
                {config.navbarLogoUrl && (
                  <UITranslationBoundary attributes={["alt"]}><Image
                    src={config.navbarLogoUrl}
                    alt=""
                    width={72}
                    height={72}
                    unoptimized
                    className="h-9 w-auto object-contain"
                  /></UITranslationBoundary>
                )}
                {config.navbarLogoTextUrl && (
                  <Image
                    src={config.navbarLogoTextUrl}
                    alt={project.name}
                    width={260}
                    height={72}
                    unoptimized
                    className="h-9 w-auto object-contain"
                  />
                )}
              </div>
            ) : (
              <span className="text-sm font-semibold tracking-[0.25em] uppercase text-stone-950 block">
                {project.name}
              </span>
            )}
            <span className="max-w-[280px] break-words">{config.footerLocation || project.location || ''}</span>
          </div>

          <div className="flex min-w-0 max-w-full flex-col items-center gap-4 lg:items-end">
            <div className="flex max-w-full flex-wrap justify-center gap-x-5 gap-y-2 text-center text-[10px] tracking-widest uppercase text-stone-600 lg:justify-end">
              <a href="#villas" className="hover:text-emerald-800"><LocalizedText text={"Modelos"} /></a>
              <a href="#ubicacion" className="hover:text-emerald-800"><LocalizedText text={"Ubicación"} /></a>
              <a href="#lotes" className="hover:text-emerald-800"><LocalizedText text={"Disponibilidad"} /></a>
            </div>
            <div className="text-center text-[10px] text-stone-400 lg:text-right">
              <span>© {new Date().getFullYear()} </span>
              <Link href="/" className="hover:text-emerald-800 transition"><LocalizedText text={"OB Brokers Team"} /></Link>
              <span><LocalizedText text={". Todos los derechos reservados."} /></span>
            </div>
          </div>
        </div>
      </footer>
      )}

      {/* LIGHTBOX MODAL WITH FRAMER MOTION SPRING ANIMATION */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/90 p-4 backdrop-blur-md"
            onClick={(e) => {
              if (e.target === e.currentTarget) setLightboxImage(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              className="relative max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden rounded-3xl border border-white/15 bg-stone-900 shadow-2xl"
            >
              {/* Lightbox Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10 text-white">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-stone-300">
                    {project.name}<LocalizedText text={" · Galería Oficial"} /></span>
                  <span className="rounded-full bg-stone-800 px-2.5 py-0.5 text-[10px] font-mono text-emerald-400">
                    {allMedia.indexOf(lightboxImage) + 1} / {allMedia.length}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={buildWhatsappLink(`Hola! Me interesa consultar sobre esta foto/render de ${project.name}: ${lightboxImage}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-mono text-white hover:bg-emerald-700 transition"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span><LocalizedText text={"Solicitar información"} /></span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setLightboxImage(null)}
                    className="rounded-full bg-stone-800 p-2 text-stone-300 hover:text-white hover:bg-stone-700 cursor-pointer transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Main Image View with Next/Prev Arrows */}
              <div className="relative flex-1 min-h-[50vh] flex items-center justify-center p-4 bg-stone-950/50">
                {allMedia.length > 1 && (
                  <>
                    <UITranslationBoundary attributes={["title"]}><motion.button
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const curIdx = allMedia.indexOf(lightboxImage);
                        const prevIdx = curIdx <= 0 ? allMedia.length - 1 : curIdx - 1;
                        setLightboxImage(allMedia[prevIdx]);
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-10 h-11 w-11 rounded-full bg-stone-900/80 hover:bg-stone-800 text-white grid place-items-center border border-white/15 shadow-xl transition cursor-pointer"
                      title="Anterior"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </motion.button></UITranslationBoundary>

                    <UITranslationBoundary attributes={["title"]}><motion.button
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const curIdx = allMedia.indexOf(lightboxImage);
                        const nextIdx = (curIdx + 1) % allMedia.length;
                        setLightboxImage(allMedia[nextIdx]);
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-10 h-11 w-11 rounded-full bg-stone-900/80 hover:bg-stone-800 text-white grid place-items-center border border-white/15 shadow-xl transition cursor-pointer"
                      title="Siguiente"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </motion.button></UITranslationBoundary>
                  </>
                )}

                <AnimatePresence mode="wait">
                  <UITranslationBoundary attributes={["alt"]}><motion.img
                    key={lightboxImage}
                    src={resolveLandingAssetUrl(lightboxImage)}
                    alt="Vista Ampliada"
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="max-h-[75vh] w-auto max-w-full object-contain rounded-xl"
                  /></UITranslationBoundary>
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TYPOLOGY DETAIL MODAL */}
      <TypologyDetailModal
        typology={selectedTypology}
        isOpen={!!selectedTypology}
        onClose={() => setSelectedTypology(null)}
        onScrollToTable={() => {
          document.getElementById('lotes')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* DOSSIER MODAL */}
      {dossierModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 p-4 backdrop-blur-sm animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDossierModalOpen(false);
          }}
        >
          <div className="relative w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 sm:p-8 shadow-2xl text-stone-900 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-stone-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-stone-700" />
                <span><LocalizedText text={"Brochure Oficial "} />{project.name}</span>
              </h3>
              <button
                type="button"
                onClick={() => setDossierModalOpen(false)}
                className="rounded-full p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed"><LocalizedText text={"Solicita el brochure completo en PDF con planos arquitectónicos, cotas, memoria de calidades y lista oficial de precios."} /></p>
            <a
              href={buildWhatsappLink(`Hola! Deseo recibir el Brochure y Memoria de Calidades en PDF de ${project.name}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-stone-900 text-xs font-bold text-white hover:bg-stone-800 transition shadow-md"
            >
              <MessageCircle className="h-4 w-4 text-emerald-400" />
              <span><LocalizedText text={"Solicitar brochure"} /></span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
