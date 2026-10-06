'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import Image from '@/components/ui/OptimizedImage';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Flame,
  Images,
  Loader2,
  MapPin,
  Maximize2,
  Menu,
  MessageCircle,
  Pause,
  Play,
  Refrigerator,
  ShieldCheck,
  Snowflake,
  WashingMachine,
  Wind,
  X,
} from 'lucide-react';
import type { ProjectSalesLandingProps } from './ProjectSalesLanding';
import type { PortalProjectDocument } from '@/lib/portal-projects';
import { getPublicProjectDocumentUrlAction } from '@/app/portal/projects/document-actions';
import { cn, formatCurrencyExplicit } from '@/lib/utils';
import LeadCaptureForm from '@/components/landing/LeadCaptureForm';
import { CanaRockAmenityIcon } from '@/components/branding/CanaRockAmenityIcon';
import CanaRockAvailabilityExplorer from '@/components/landing/CanaRockAvailabilityExplorer';
import CanaRockProfitability from '@/components/landing/CanaRockProfitability';
import PublicLanguageSwitcher from '@/components/i18n/PublicLanguageSwitcher';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { usePublicLandingTranslations } from '@/components/i18n/usePublicLandingTranslations';

const CANA_ROCK_PROJECTS = [
  { slug: 'cana-rock-star', name: 'Cana Rock Star' },
  { slug: 'cana-rock-universe', name: 'Cana Rock Universe' },
  { slug: 'cana-rock-galaxy', name: 'Cana Rock Galaxy' },
  { slug: 'cana-rock-stelar', name: 'Cana Rock Cosmos Stelar' },
];

const CANA_ROCK_PROJECT_LOGOS: Record<string, string> = {
  'cana-rock-star': '/logo-star-white.png',
  'cana-rock-universe': 'https://canarock.info/wp-content/uploads/2021/09/Logo-Cana-Rock-Universe.png',
  'cana-rock-galaxy': 'https://canarock.info/wp-content/uploads/2021/09/Logo-Cana-Rock-Galaxy.png',
  'cana-rock-stelar': '/logo-stelar-white.png',
};

const CANA_ROCK_APPLIANCES = [
  { name: 'Nevera', icon: Refrigerator },
  { name: 'Estufa Eléctrica', icon: Flame },
  { name: 'Extractor', icon: Wind },
  { name: 'Lavadora Secadora', icon: WashingMachine },
  { name: 'Aires Acondicionados', icon: Snowflake },
];

export default function CanaRockProjectLanding({
  project,
  config,
  brokerReferrer,
  isAuthenticated = false,
}: ProjectSalesLandingProps) {
  const { t, locale, autoTranslate } = useLocale();
  const { translations, isLoading: isTranslating } = usePublicLandingTranslations(project.slug, locale);
  const translated = (fieldPath: string, sourceText: string) => locale === 'es' ? sourceText : translations[fieldPath] || sourceText;
  const isStarProject = project.slug.toLowerCase().includes('star');

  // Calculator states (for projects in construction)
  const [salesPrice, setSalesPrice] = useState<number>(project.startingPrice || 250000);
  const [paymentPlan, setPaymentPlan] = useState<'standard' | 'promo' | 'vip'>('standard');
  const [constructionMonths, setConstructionMonths] = useState<number>(24);
  const [calculatorCopied, setCalculatorCopied] = useState(false);

  // Calculator logic
  const discountRate = paymentPlan === 'standard' ? 0 : paymentPlan === 'promo' ? 0.03 : 0.06;
  const netPrice = salesPrice * (1 - discountRate);
  const bookingFee = 3000;
  const downPaymentPercent = paymentPlan === 'standard' ? 0.20 : paymentPlan === 'promo' ? 0.50 : 0.80;
  const downPaymentDue = Math.max(0, (netPrice * downPaymentPercent) - bookingFee);
  const constructionPercent = paymentPlan === 'standard' ? 0.40 : paymentPlan === 'promo' ? 0.30 : 0.00;
  const constructionDue = netPrice * constructionPercent;
  const monthlyPayment = constructionMonths > 0 && constructionDue > 0 ? (constructionDue / constructionMonths) : 0;
  const deliveryPercent = paymentPlan === 'standard' ? 0.40 : paymentPlan === 'promo' ? 0.20 : 0.20;
  const deliveryDue = netPrice * deliveryPercent;

  const copyCalculatorPlan = () => {
    const planName = paymentPlan === 'standard'
      ? 'Estándar (20% Inicial / 40% Obra / 40% Entrega)'
      : paymentPlan === 'promo'
      ? 'Pronto Pago - 3% Desc (50% Inicial / 30% Obra / 20% Entrega)'
      : 'Inversionista Especial - 6% Desc (80% Inicial / 20% Entrega)';

    const text = `
*Simulación de Plan de Pagos - ${project.name}*
---------------------------------------
Precio de Lista: US$ ${salesPrice.toLocaleString('en-US')}
Plan Seleccionado: ${planName}
Descuento Aplicado: ${discountRate * 100}% (US$ ${(salesPrice * discountRate).toLocaleString('en-US')})
*Precio Neto Final: US$ ${netPrice.toLocaleString('en-US')}*

*Desglose de Pagos:*
1. Reserva de Bloqueo: US$ ${bookingFee.toLocaleString('en-US')}
2. Completivo de Inicial (${downPaymentPercent * 100}%): US$ ${downPaymentDue.toLocaleString('en-US')}
${paymentPlan !== 'vip' ? `3. Durante Construcción (${constructionPercent * 100}%): US$ ${constructionDue.toLocaleString('en-US')} (en ${constructionMonths} cuotas mensuales de US$ ${Math.round(monthlyPayment).toLocaleString('en-US')})\n` : ''}4. Contra Entrega Final (${deliveryPercent * 100}%): US$ ${deliveryDue.toLocaleString('en-US')}

_Simulación express elaborada para ${project.name}._
`.trim();
    navigator.clipboard.writeText(text);
    setCalculatorCopied(true);
    setTimeout(() => setCalculatorCopied(false), 2000);
  };

  const gallery = Array.from(
    new Set((config.customGallery?.length ? config.customGallery : project.gallery).filter(Boolean))
  );
  const heroSlides = Array.from(
    new Set((config.heroSlides?.length ? config.heroSlides : gallery).filter(Boolean))
  );
  const [heroIndex, setHeroIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxAutoplay, setLightboxAutoplay] = useState(true);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const projectDropdownRef = useRef<HTMLDivElement>(null);
  const projectMenuTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleOpenProjectMenu = () => {
    if (projectMenuTimerRef.current) {
      clearTimeout(projectMenuTimerRef.current);
      projectMenuTimerRef.current = null;
    }
    setProjectMenuOpen(true);
  };

  const handleCloseProjectMenuWithDelay = () => {
    if (projectMenuTimerRef.current) {
      clearTimeout(projectMenuTimerRef.current);
    }
    projectMenuTimerRef.current = setTimeout(() => {
      setProjectMenuOpen(false);
    }, 280);
  };
  const heroImage = heroSlides[heroIndex] || config.theme.heroMediaUrl || project.image;
  const accentColor = config.theme.accentColor || '#d4af37';
  const primaryColor = config.theme.primaryColor || '#081339';
  const projectLogoUrl = config.theme.logoUrl || CANA_ROCK_PROJECT_LOGOS[project.slug] || null;
  const contactHref = '#contacto';
  const showHero = config.visibility.hero !== false;
  const showConcept = config.visibility.concept !== false;
  const showLocation = config.visibility.location !== false;
  const showGallery = config.visibility.gallery !== false;
  const showAmenities = config.visibility.amenities !== false;
  const showSpecs = config.visibility.specs !== false && (config.specs?.length ?? 0) > 0;
  const showAvailability = config.visibility.availability !== false;
  const showPaymentPlan = config.visibility.paymentPlan !== false && project.paymentPlan.length > 0;
  const showProfitability =
    Boolean(config.profitability?.enabled) &&
    (config.profitability?.items?.length ?? 0) > 0 &&
    config.visibility.profitability !== false;
  const publicDocuments = (project.documents || []).filter(
    (d) =>
      d.visibility === 'public' &&
      (d.status === 'approved' || d.status === 'published') &&
      !d.name.toLowerCase().includes('master plan')
  );
  const showPublicDocuments = publicDocuments.length > 0;
  const showContact = config.visibility.contactForm !== false;

  const activeLightboxImage = lightboxIndex === null ? null : gallery[lightboxIndex];

  function openLightbox(index: number) {
    setLightboxIndex(index);
    setLightboxAutoplay(true);
  }

  function closeLightbox() {
    setLightboxIndex(null);
  }

  const showPreviousImage = useCallback(() => {
    setLightboxIndex((current) => current === null ? null : (current - 1 + gallery.length) % gallery.length);
  }, [gallery.length]);

  const showNextImage = useCallback(() => {
    setLightboxIndex((current) => current === null ? null : (current + 1) % gallery.length);
  }, [gallery.length]);

  useEffect(() => {
    if (lightboxIndex === null || gallery.length < 2) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') closeLightbox();
      if (event.key === 'ArrowLeft') showPreviousImage();
      if (event.key === 'ArrowRight') showNextImage();
    }

    window.addEventListener('keydown', handleKeyDown);
    const interval = lightboxAutoplay ? window.setInterval(showNextImage, 5000) : null;

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (interval) window.clearInterval(interval);
    };
  }, [gallery.length, lightboxAutoplay, lightboxIndex, showNextImage, showPreviousImage]);

  // Autoplay for Hero Slides (images change automatically every 5 seconds)
  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const heroInterval = setInterval(() => {
      setHeroIndex((current) => (current + 1) % heroSlides.length);
    }, 5000);

    return () => clearInterval(heroInterval);
  }, [heroSlides.length]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target as Node)) {
        setProjectMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setProjectMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      if (projectMenuTimerRef.current) {
        clearTimeout(projectMenuTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const elements = document.querySelectorAll('.reveal-on-scroll:not(.is-revealed)');
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#f6f4ee] text-slate-950 antialiased">
      <header
        className="sticky top-0 z-40 border-b border-white/10 text-white shadow-lg"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:h-20 sm:gap-6 sm:px-8 lg:px-12">
          <UITranslationBoundary attributes={["title"]}><Link href="/" className="flex min-w-0 items-center gap-4 hover:opacity-90 transition" title="Volver al portal">
            {config.theme.logoUrl ? (
              <span className="relative block h-11 w-24 shrink-0 sm:h-12 sm:w-36">
                <Image
                  src={config.theme.logoUrl}
                  alt={`Logo de ${project.name}`}
                  fill
                  sizes="144px"
                  className="object-contain object-left"
                />
              </span>
            ) : (
              <span className="text-sm font-semibold uppercase tracking-[0.16em]">{project.name}</span>
            )}
          </Link></UITranslationBoundary>

          <nav className="hidden items-center gap-5 text-[10px] font-semibold uppercase tracking-[0.13em] text-white/70 2xl:flex">
            <Link
              href="/desarrolladores/cana-rock"
              className="whitespace-nowrap transition hover:text-white"
            >
              {t('developer')}
            </Link>

            {showGallery && gallery.length > 0 && <a href="#galeria" className="whitespace-nowrap transition hover:text-white">{t('gallery')}</a>}
            {showAmenities && project.amenities.length > 0 && <a href="#amenidades" className="whitespace-nowrap transition hover:text-white">{t('amenities')}</a>}
            {showPaymentPlan && <a href="#pagos" className="whitespace-nowrap transition hover:text-white">{t('paymentPlan')}</a>}
            {showProfitability && <a href="#rentabilidad" className="whitespace-nowrap transition hover:text-white">{t('profitability')}</a>}
            {showAvailability && <a href="#disponibilidad" className="whitespace-nowrap transition hover:text-white">{t('availability')}</a>}
            {showPublicDocuments && <a href="#documentos" className="whitespace-nowrap transition hover:text-white">{t('documentation')}</a>}
          </nav>

          <div className="flex items-center gap-2">
            <PublicLanguageSwitcher dark circular />
            {isTranslating && <span className="hidden animate-pulse text-[9px] font-bold uppercase tracking-[0.12em] text-white/60 lg:inline"><LocalizedText text={"Translating…"} /></span>}
            <div
                ref={projectDropdownRef}
                className="relative hidden 2xl:block"
                onMouseEnter={handleOpenProjectMenu}
                onMouseLeave={handleCloseProjectMenuWithDelay}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (projectMenuTimerRef.current) clearTimeout(projectMenuTimerRef.current);
                    setProjectMenuOpen((current) => !current);
                  }}
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.14em] text-white transition hover:bg-white/10 focus:outline-none"
                  aria-expanded={projectMenuOpen}
                  aria-haspopup="menu"
                >
                  <Building2 className="h-3.5 w-3.5" />
                  <span>{t('projects')}</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${projectMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {projectMenuOpen && (
                  <div className="absolute right-0 top-full z-50 pt-2" role="menu" onMouseEnter={handleOpenProjectMenu} onMouseLeave={handleCloseProjectMenuWithDelay}>
                    <div className="w-64 rounded-2xl border border-white/15 bg-[#081339] p-2 shadow-2xl">
                      <p className="px-3 pb-2 pt-1 text-[9px] font-black uppercase tracking-[0.16em] text-white/45">{autoTranslate('Proyectos Cana Rock')}</p>
                      {CANA_ROCK_PROJECTS.map((item) => {
                        const isCurrent = item.slug === project.slug;
                        return <Link key={item.slug} href={`/proyectos/${item.slug}`} onClick={() => setProjectMenuOpen(false)} className={`block rounded-xl px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] transition ${isCurrent ? 'bg-white text-slate-950 font-bold' : 'text-white/75 hover:bg-white/10 hover:text-white'}`} role="menuitem" aria-current={isCurrent ? 'page' : undefined}>{item.name}</Link>;
                      })}
                    </div>
                  </div>
                )}
            </div>
            <UITranslationBoundary attributes={["aria-label"]}><button
              type="button"
              onClick={() => setMobileMenuOpen((current) => !current)}
              className="grid h-10 w-10 place-items-center rounded-full border border-white/20 text-white transition hover:bg-white/10 2xl:hidden"
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={mobileMenuOpen}
              aria-controls="cana-rock-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button></UITranslationBoundary>
            {isAuthenticated && (
              <Link
                href={`/portal/projects/${project.slug}`}
                className="hidden rounded-full border border-white/20 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/80 transition hover:bg-white/10 sm:inline-flex"
              >
                {t('portal')}
              </Link>
            )}
          </div>

          {mobileMenuOpen && (
            <div id="cana-rock-mobile-menu" className="absolute left-0 right-0 top-full z-50 border-b border-white/10 bg-[#081339] px-4 py-4 shadow-2xl 2xl:hidden">
              <div className="mx-auto grid max-w-7xl gap-2">
                <div className="flex items-center justify-between pb-1 px-1">
                  <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/45"><LocalizedText text={"Proyectos Cana Rock"} /></p>
                  <Link
                    href="/desarrolladores/cana-rock"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 hover:underline"
                  >
                    {t('developer')} ({t('allProjects')}<LocalizedText text={") &rarr;"} /></Link>
                </div>
                <div className="grid gap-1 sm:grid-cols-2">
                  {CANA_ROCK_PROJECTS.map((item) => {
                    const isCurrent = item.slug === project.slug;
                    return (
                      <Link
                        key={item.slug}
                        href={`/proyectos/${item.slug}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`rounded-xl px-3 py-3 text-sm font-bold transition ${isCurrent ? 'bg-white text-slate-950' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
                        aria-current={isCurrent ? 'page' : undefined}
                      >
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-1 border-t border-white/10 pt-3 sm:flex sm:flex-wrap">
                  {showGallery && gallery.length > 0 && <a href="#galeria" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white">{t('gallery')}</a>}
                  {showAmenities && project.amenities.length > 0 && <a href="#amenidades" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white">{t('amenities')}</a>}
                  {showPaymentPlan && <a href="#pagos" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white">{t('paymentPlan')}</a>}
                  {showProfitability && <a href="#rentabilidad" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white">{t('profitability')}</a>}
                  {showAvailability && <a href="#disponibilidad" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white">{t('availability')}</a>}
                  {showPublicDocuments && <a href="#documentos" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/10 hover:text-white">{t('documentation')}</a>}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main aria-busy={isTranslating} className={isTranslating ? 'transition-opacity duration-200 opacity-70' : 'transition-opacity duration-200'}>
        {showHero && <section className="relative min-h-[82vh] overflow-hidden bg-slate-950 text-white">
          {heroImage && (
            <Image
              key={heroImage}
              src={heroImage}
              alt={`Vista principal de ${project.name}`}
              fill
              loading="eager"
              sizes="100vw"
              className="object-cover transition-opacity duration-1000 ease-in-out"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#07102f]/95 via-[#07102f]/65 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-transparent" />

          <div className="relative mx-auto flex min-h-[82vh] max-w-7xl items-end px-5 pb-16 pt-28 sm:px-8 sm:pb-20 lg:px-12">
            <div className="max-w-3xl">
              <h1 className="animate-hero-entry text-5xl font-light leading-[0.98] tracking-[-0.04em] sm:text-7xl lg:text-8xl">
                {project.name}
              </h1>
              <p className="animate-hero-entry-d1 mt-6 max-w-2xl text-base font-light leading-7 text-white/75 sm:text-lg">
                {translated('hero.subheadline', config.hero.subheadline || project.shortDescription)}
              </p>

              <div className="animate-hero-entry-d2 mt-9 flex flex-wrap gap-3">
                <a
                  href="#disponibilidad"
                  className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-950 transition hover:brightness-110"
                  style={{ backgroundColor: accentColor }}
                >
                  {autoTranslate('Ver disponibilidad')} <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="#galeria"
                  className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-6 py-3 text-xs font-bold uppercase tracking-[0.12em] text-white backdrop-blur transition hover:bg-white/15"
                >
                  {autoTranslate('Explorar proyecto')}
                </a>
              </div>

              <dl className="animate-hero-entry-d3 mt-12 grid w-full max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/15 bg-white/10 backdrop-blur sm:grid-cols-4">
                {[
                  [autoTranslate('Desde'), formatCurrencyExplicit(project.startingPrice, project.currency)],
                  [autoTranslate('Disponibles'), String(project.availableUnits)],
                  [autoTranslate('Entrega'), autoTranslate(project.delivery)],
                  [autoTranslate('Ubicación'), autoTranslate(project.location || 'Cana Bay')],
                ].map(([label, value]) => (
                  <div key={label} className="bg-[#07102f]/45 px-5 py-4">
                    <dt className="text-[9px] uppercase tracking-[0.16em] text-white/50">{label}</dt>
                    <dd className="mt-1 text-sm font-semibold text-white whitespace-nowrap">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {heroSlides.length > 1 && (
            <div className="absolute bottom-6 right-5 flex items-center gap-2 rounded-full border border-white/15 bg-slate-950/55 p-1.5 backdrop-blur sm:right-8 lg:right-12">
              <button
                type="button"
                onClick={() => setHeroIndex((current) => (current - 1 + heroSlides.length) % heroSlides.length)}
                className="rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
                aria-label={autoTranslate('Imagen anterior')}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-12 text-center text-[10px] font-bold tracking-[0.14em] text-white/70">
                {String(heroIndex + 1).padStart(2, '0')} / {String(heroSlides.length).padStart(2, '0')}
              </span>
              <button
                type="button"
                onClick={() => setHeroIndex((current) => (current + 1) % heroSlides.length)}
                className="rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
                aria-label={autoTranslate('Imagen siguiente')}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </section>}

        {showConcept && <section id="concepto" className="reveal-on-scroll mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[0.8fr_1.2fr] lg:px-12">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: primaryColor }}>
              {autoTranslate('El proyecto')}
            </p>
            <h2 className="mt-4 text-4xl font-light tracking-[-0.03em] sm:text-5xl">
              {translated('concept.title', config.concept?.title || 'Resort living dentro de Cana Bay.')}
            </h2>
          </div>
          <div className="space-y-8">
            <p className="text-lg font-light leading-8 text-slate-600">{translated('project.description', project.description)}</p>
            <div className={`grid gap-3 ${showLocation ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
              {showLocation && <div className="reveal-on-scroll reveal-stagger rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md" style={{ '--reveal-index': 0 } as React.CSSProperties}>
                  <MapPin className="h-5 w-5" style={{ color: accentColor }} />
                  <p className="mt-4 text-sm font-bold">{autoTranslate('Ubicación privilegiada')}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{project.location}</p>
                </div>}
              <div className="reveal-on-scroll reveal-stagger rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md" style={{ '--reveal-index': 1 } as React.CSSProperties}>
                <ShieldCheck className="h-5 w-5" style={{ color: accentColor }} />
                <p className="mt-4 text-sm font-bold">{autoTranslate('Gestión oficial')}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{autoTranslate('Inventario y precios centralizados.')}</p>
              </div>
              <div className="reveal-on-scroll reveal-stagger rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md" style={{ '--reveal-index': 2 } as React.CSSProperties}>
                <Building2 className="h-5 w-5" style={{ color: accentColor }} />
                <p className="mt-4 text-sm font-bold">{autoTranslate('Desarrollador')}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{project.developer}</p>
              </div>
            </div>
          </div>
        </section>}

        {showGallery && gallery.length > 0 && (
          <section id="galeria" className="bg-white py-20 sm:py-28">
            <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
              <div className="reveal-on-scroll flex items-end justify-between gap-6 border-b border-slate-200 pb-7">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: primaryColor }}>{autoTranslate('Galería oficial')}</p>
                  <h2 className="mt-3 text-4xl font-light tracking-[-0.03em] sm:text-5xl">{autoTranslate('Conoce cada espacio.')}</h2>
                </div>
                <span className="hidden text-xs font-semibold text-slate-400 sm:block">{gallery.length} {autoTranslate('imágenes')}</span>
              </div>
              <div className="mt-8 grid gap-3 md:grid-cols-[minmax(0,1.8fr)_minmax(260px,0.85fr)]">
                {gallery.slice(0, 3).map((imageUrl, index) => (
                  <button
                    type="button"
                    key={imageUrl}
                    onClick={() => openLightbox(index)}
                    style={{ '--reveal-index': index } as React.CSSProperties}
                    className={`reveal-on-scroll reveal-stagger group relative overflow-hidden rounded-2xl bg-slate-100 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-950 ${
                      index === 0
                        ? 'aspect-[4/3] md:row-span-2 md:aspect-auto md:min-h-[520px]'
                        : 'aspect-[4/3] md:aspect-auto md:min-h-[254px]'
                    }`}
                  >
                    <Image
                      src={imageUrl}
                      alt={`${project.name}, imagen ${index + 1}`}
                      fill
                      sizes={index === 0 ? '(max-width: 768px) 100vw, 66vw' : '(max-width: 768px) 50vw, 34vw'}
                      className="object-cover transition duration-700 group-hover:scale-105"
                    />
                    {index === 2 ? (
                      <span className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-transparent p-4 text-white">
                        <span>
                          <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-white/70">{autoTranslate('Galería completa')}</span>
                          <span className="mt-1 block text-sm font-bold">{autoTranslate('Ver')} {gallery.length} {autoTranslate('imágenes')}</span>
                        </span>
                        <span className="grid h-10 w-10 place-items-center rounded-full border border-white/30 bg-white/10 backdrop-blur transition group-hover:bg-white/20">
                          <Images className="h-4 w-4" />
                        </span>
                      </span>
                    ) : (
                      <span className="absolute bottom-4 right-4 rounded-full bg-slate-950/60 p-2 text-white opacity-0 backdrop-blur transition group-hover:opacity-100">
                        <Maximize2 className="h-4 w-4" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {showAmenities && project.amenities.length > 0 && (
          <section id="amenidades" className="py-20 sm:py-28" style={{ backgroundColor: primaryColor }}>
            <div className="mx-auto max-w-7xl px-5 text-white sm:px-8 lg:px-12">
              <div className="reveal-on-scroll max-w-2xl">
                <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: accentColor }}>{t('amenities')}</p>
                <h2 className="mt-4 text-4xl font-light tracking-[-0.03em] sm:text-5xl">{t('amenitiesHeadline')}</h2>
              </div>
              <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {project.amenities.map((amenity, index) => (
                  <div
                    key={amenity}
                    style={{ '--reveal-index': index % 5 } as React.CSSProperties}
                    className="reveal-on-scroll reveal-stagger group/amenity flex min-h-[88px] items-center gap-4 rounded-xl border border-white/10 bg-[#081339]/85 px-5 py-4 backdrop-blur-xs transition-all duration-300 hover:border-white/25 hover:bg-[#0e215d] hover:shadow-lg"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-white transition-transform duration-300 group-hover/amenity:scale-110">
                      <CanaRockAmenityIcon name={amenity} className="h-6 w-6" />
                    </div>
                    <span className="min-w-0 text-sm font-bold leading-snug text-white/90 group-hover/amenity:text-white">
                      {translated(`amenities.${index}`, amenity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {showSpecs && (
          <section id="especificaciones" className="bg-[#FAF8F5] py-20 sm:py-28">
            <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
              <div className="reveal-on-scroll flex flex-col gap-6 border-b border-slate-200 pb-8 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: primaryColor }}>{translated('specs.eyebrow', config.specsEyebrow || '04 / Especificaciones Técnicas')}</p>
                  <h2 className="mt-4 text-4xl font-light tracking-[-0.03em] text-slate-950 sm:text-5xl">{translated('specs.title', config.specsTitle || 'Memoria de Calidades & Acabados.')}</h2>
                </div>
                <p className="max-w-xl text-sm leading-7 text-slate-500">{translated('specs.subtitle', config.specsSubtitle || 'Materiales, terminaciones y soluciones seleccionadas para el proyecto.')}</p>
              </div>
              <div className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
                {(config.specImages || gallery).slice(0, 5).map((imageUrl, index) => (
                  <button key={imageUrl} type="button" onClick={() => { const galleryIndex = gallery.indexOf(imageUrl); if (galleryIndex >= 0) setLightboxIndex(galleryIndex); }} className={cn('group relative overflow-hidden rounded-2xl bg-slate-200 text-left', index === 0 ? 'row-span-2 min-h-[360px] lg:min-h-[520px]' : 'min-h-[180px]')}>
                    <Image src={imageUrl} alt={`Especificación ${index + 1} de ${project.name}`} fill sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover transition duration-700 group-hover:scale-105" />
                    <span className="absolute bottom-3 left-3 rounded-full bg-slate-950/70 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-white"><LocalizedText text={"Referencia "} />{String(index + 1).padStart(2, '0')}</span>
                  </button>
                ))}
                <div className="grid gap-3 sm:grid-cols-2">
                  {(config.specs || []).map((item, index) => (
                    <article key={`${item.title}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-5">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: primaryColor }}>{String(index + 1).padStart(2, '0')}<LocalizedText text={" / MEMORIA"} /></p>
                      <h3 className="mt-4 text-lg font-semibold text-slate-950">{item.title}</h3>
                      <p className="mt-2 text-xs leading-6 text-slate-500">{item.description}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Equipamiento de Línea Blanca Incluido */}
        <section id="appliances-section" className="py-16 sm:py-20 bg-white">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12 space-y-8">
            <div className="reveal-on-scroll border-b border-slate-200 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div className="space-y-1">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight flex flex-wrap items-center gap-2">
                  <span>{autoTranslate('Equipamiento')}</span>
                  <span className="italic font-serif font-normal text-2xl sm:text-3xl" style={{ color: accentColor }}>{autoTranslate('incluido')}</span>
                </h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  {autoTranslate('Línea blanca completa en cada apartamento')}
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-700 shadow-xs">
                <ShieldCheck className="h-4 w-4 shrink-0" style={{ color: accentColor }} /> {autoTranslate('CONFOTUR APROBADO (EXENTO DE IMPUESTOS)')}
              </div>
            </div>

            {/* Catalog Grid */}
            <div className="reveal-on-scroll relative overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-50/50 p-4 sm:p-6 shadow-xs">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
                {CANA_ROCK_APPLIANCES.map((appliance, idx) => {
                  const Icon = appliance.icon;
                  return (
                    <div
                      key={appliance.name}
                      style={{ '--reveal-index': idx } as React.CSSProperties}
                      className="group flex min-h-[96px] sm:min-h-[108px] flex-col items-center justify-center gap-2.5 rounded-2xl border border-slate-200/70 bg-white p-4 text-center transition-all duration-300 hover:border-accent hover:shadow-md"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-800 transition-all duration-300 group-hover:scale-110" style={{ color: accentColor }}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="text-[10px] sm:text-[11px] font-black uppercase leading-snug tracking-wider text-slate-800">
                        {autoTranslate(appliance.name)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Rentabilidad Estimada Section — Exclusiva para Cana Rock Star */}
        {isStarProject && (
          <section id="rentabilidad" className="py-16 sm:py-24 bg-[#f8fafc]">
            <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12 space-y-8">
              <div className="reveal-on-scroll border-b border-slate-200 pb-6">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight flex flex-wrap items-center gap-2">
                  <span>{autoTranslate('Rentabilidad Estimada')}</span>
                  <span className="italic font-serif font-normal text-2xl sm:text-3xl" style={{ color: accentColor }}>{autoTranslate('del proyecto')}</span>
                </h2>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                  {autoTranslate('Análisis Financiero y Proyecciones de Retorno de Inversión')}
                </p>
              </div>

              <div className="reveal-on-scroll grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 p-6 sm:p-10 md:p-12 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-md relative overflow-hidden">
                {/* Columna izquierda: Imagen + Descarga */}
                <div className="flex flex-col items-center justify-center space-y-6">
                  <div className="relative w-full rounded-2xl overflow-hidden border border-slate-100 shadow-md">
                    <UITranslationBoundary attributes={["alt"]}><Image
                      src="/rentabilidad_es.png"
                      alt="Rentabilidad Estimada Cana Rock Star"
                      width={800}
                      height={600}
                      className="w-full h-auto object-contain max-h-[580px]"
                    /></UITranslationBoundary>
                  </div>
                  <a
                    href="/rentabilidad_es.png"
                    download="Cana_Rock_Star_Rentabilidad_ES.png"
                    className="flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-md transition-all hover:scale-102 cursor-pointer w-full sm:w-auto"
                    style={{ backgroundColor: accentColor, color: '#081339' }}
                  >
                    <Download className="w-4 h-4" /> {autoTranslate('Descargar Imagen (PNG)')}
                  </a>
                </div>

                {/* Columna derecha: Proyecciones de ROI */}
                <div className="flex flex-col justify-center space-y-5 text-left">
                  <p className="text-sm font-serif italic text-slate-800 border-l-4 pl-4 leading-relaxed" style={{ borderColor: accentColor }}><LocalizedText text={"Basado en proyecciones oficiales de ocupación y tarifas de mercado, Cana Rock Star ofrece retornos financieros sólidos para sus tres tipologías de apartamentos bajo un escenario de ocupación estimada del "} /><strong><LocalizedText text={"70% (255 noches por año)"} /></strong>:
                  </p>

                  <div className="space-y-3.5">
                    {/* 1 Habitación */}
                    <div className="p-4.5 sm:p-5 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wide">1 {autoTranslate('Habitación')}</h4>
                        <span className="font-black text-sm" style={{ color: accentColor }}><LocalizedText text={"10.02% ROI"} /></span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed"><LocalizedText text={"Con un precio promedio de "} /><strong><LocalizedText text={"US$ 180,000"} /></strong><LocalizedText text={" y una tarifa promedio de "} /><strong><LocalizedText text={"120 USD"} /></strong><LocalizedText text={", genera un ingreso anual bruto de "} /><strong><LocalizedText text={"30,600 USD"} /></strong><LocalizedText text={". Tras deducir los gastos operativos (costo del operador del 25%, servicios públicos, mantenimiento del condominio y fee de Cana Bay), se obtiene un ingreso neto anual de "} /><strong><LocalizedText text={"18,030 USD"} /></strong>.
                      </p>
                    </div>

                    {/* 2 Habitaciones */}
                    <div className="p-4.5 sm:p-5 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wide">2 {autoTranslate('Habitaciones')}</h4>
                        <span className="font-black text-sm" style={{ color: accentColor }}><LocalizedText text={"8.65% ROI"} /></span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed"><LocalizedText text={"Con un precio promedio de "} /><strong><LocalizedText text={"US$ 285,000"} /></strong><LocalizedText text={" y una tarifa promedio de "} /><strong><LocalizedText text={"170 USD"} /></strong><LocalizedText text={", genera un ingreso anual bruto de "} /><strong><LocalizedText text={"43,350 USD"} /></strong><LocalizedText text={". Tras los costos operativos, el ingreso neto resultante es de "} /><strong><LocalizedText text={"24,665 USD"} /></strong>.
                      </p>
                    </div>

                    {/* 3 Habitaciones */}
                    <div className="p-4.5 sm:p-5 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-slate-900 text-sm uppercase tracking-wide">3 {autoTranslate('Habitaciones')}</h4>
                        <span className="font-black text-sm" style={{ color: accentColor }}><LocalizedText text={"7.69% ROI"} /></span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed"><LocalizedText text={"Con un precio promedio de "} /><strong><LocalizedText text={"US$ 390,000"} /></strong><LocalizedText text={" y una tarifa promedio de "} /><strong><LocalizedText text={"210 USD"} /></strong><LocalizedText text={", genera un ingreso anual bruto de "} /><strong><LocalizedText text={"53,550 USD"} /></strong><LocalizedText text={". Tras deducir todos los costos operativos, se alcanza un ingreso neto anual de "} /><strong><LocalizedText text={"29,999 USD"} /></strong>.
                      </p>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 italic font-sans pt-2"><LocalizedText text={"* Las tarifas promedio según datos obtenidos de AIRDNA y World2Meet. El costo del operador del 25% y el fee operativo pueden variar de acuerdo con los acuerdos de servicio de la operadora."} /></p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Plan de Pago Section */}
        {showPaymentPlan && (
          isStarProject ? (
            /* Plan de Pago para Entrega Inmediata (Star) */
            <section id="pagos" className="py-16 sm:py-24 bg-white">
              <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
                <div className="reveal-on-scroll flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-slate-200 pb-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: primaryColor }}>
                      {autoTranslate('Condiciones de inversión')}
                    </p>
                    <h2 className="mt-2 text-3xl font-light tracking-[-0.03em] sm:text-4xl text-slate-950">
                      {autoTranslate('Plan de pago')} <span className="italic font-serif font-normal" style={{ color: accentColor }}>· {autoTranslate('Entrega Inmediata')}</span>
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-700">
                    <ShieldCheck className="h-4 w-4" style={{ color: accentColor }} /> {autoTranslate('Listo para entrega en Cana Bay')}
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Reserva */}
                  <div className="reveal-on-scroll relative rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm transition hover:shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-black text-white shadow-xs" style={{ backgroundColor: accentColor }}>
                        1
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{autoTranslate('Paso')} 1</span>
                    </div>
                    <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{autoTranslate('Reserva de Bloqueo')}</p>
                    <p className="mt-2 text-3xl font-black text-slate-950"><LocalizedText text={"US$ 3,000"} /></p>
                    <p className="mt-3 text-xs leading-5 text-slate-500">{autoTranslate('Bloqueo formal de la unidad en el inventario oficial del proyecto.')}</p>
                  </div>

                  {/* Inicial */}
                  <div className="reveal-on-scroll relative rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm transition hover:shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-black text-white shadow-xs" style={{ backgroundColor: accentColor }}>
                        2
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{autoTranslate('Paso')} 2</span>
                    </div>
                    <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{autoTranslate('Completivo de Inicial')}</p>
                    <p className="mt-2 text-3xl font-black text-slate-950">20%</p>
                    <p className="mt-3 text-xs leading-5 text-slate-500">{autoTranslate('A la firma del contrato de promesa de compraventa (deduciendo los US$ 3,000 de reserva).')}</p>
                  </div>

                  {/* Contra Entrega */}
                  <div className="reveal-on-scroll relative rounded-3xl border border-slate-200/80 bg-white p-7 shadow-sm transition hover:shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-black text-white shadow-xs" style={{ backgroundColor: accentColor }}>
                        3
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{autoTranslate('Paso')} 3</span>
                    </div>
                    <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{autoTranslate('Contra Entrega')}</p>
                    <p className="mt-2 text-3xl font-black text-slate-950">80%</p>
                    <p className="mt-3 text-xs leading-5 text-slate-500">{autoTranslate('Listo para entrega inmediata. Aplica financiamiento hipotecario bancario nacional o internacional.')}</p>
                  </div>
                </div>
                <p className="mt-6 text-[10px] text-slate-400 italic font-sans text-center"><LocalizedText text={"* Unidades terminadas y listas para escrituración inmediata en Cana Bay. Consulte con su asesor las facilidades bancarias preaprobadas."} /></p>
              </div>
            </section>
          ) : (
            /* Calculadora Inteligente de Planes de Pago (Universe, Galaxy, Stelar) */
            <section id="pagos" className="py-16 sm:py-24 bg-white">
              <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12 space-y-8">
                <div className="reveal-on-scroll border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight flex flex-wrap items-center gap-2">
                      <span>{autoTranslate('Calculadora Inteligente')}</span>
                      <span className="italic font-serif font-normal text-2xl sm:text-3xl" style={{ color: accentColor }}>{autoTranslate('de planes de pago')}</span>
                    </h2>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                      {autoTranslate('Simula y estructura la mejor opción financiera para tu inversión al instante.')}
                    </p>
                  </div>
                </div>

                <div className="reveal-on-scroll grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 sm:p-10 md:p-12 rounded-[2.5rem] bg-white border border-slate-200/80 shadow-md relative overflow-hidden">
                  {/* Form side */}
                  <div className="lg:col-span-1 space-y-6 relative z-10 text-left">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{autoTranslate('Precio de Venta (US$)')}</label>
                      <div className="relative">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-xs" style={{ color: accentColor }}><LocalizedText text={"US$"} /></span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={salesPrice.toLocaleString('en-US')}
                          onChange={(e) => {
                            const numericValue = Number(e.target.value.replace(/[^0-9]/g, ''));
                            setSalesPrice(Number.isFinite(numericValue) ? Math.max(0, numericValue) : 0);
                          }}
                          className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl pl-14 pr-6 py-4 text-sm font-black text-slate-800 outline-none focus:border-slate-400 transition-colors shadow-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{autoTranslate('Selecciona el Plan de Pago')}</label>
                      <div className="space-y-2">
                        {[
                          { id: 'standard', label: autoTranslate('Estándar (20% Inicial / 40% Obra / 40% Entrega)') },
                          { id: 'promo', label: autoTranslate('Pronto Pago - 3% Desc (50% Inicial / 30% Obra / 20% Entrega)') },
                          { id: 'vip', label: autoTranslate('Inversionista Especial - 6% Desc (80% Inicial / 20% Entrega)') },
                        ].map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setPaymentPlan(p.id as 'standard' | 'promo' | 'vip')}
                            className={cn(
                              'w-full text-left p-4 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer',
                              paymentPlan === p.id
                                ? 'border-[#d4af37] bg-[#d4af37]/10 text-slate-950 shadow-xs'
                                : 'bg-slate-50 border-slate-200/80 text-slate-500 hover:text-slate-800'
                            )}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {paymentPlan !== 'vip' && (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{autoTranslate('Meses para completar construcción')}</label>
                          <span className="text-xs font-black" style={{ color: accentColor }}>{constructionMonths} {autoTranslate('Meses')}</span>
                        </div>
                        <input
                          type="range"
                          min="12"
                          max="36"
                          value={constructionMonths}
                          onChange={(e) => setConstructionMonths(parseInt(e.target.value))}
                          className="w-full h-1.5 rounded-lg appearance-none cursor-pointer bg-slate-200"
                          style={{ accentColor }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Calculations results */}
                  <div className="lg:col-span-2 p-6 sm:p-8 rounded-[2rem] bg-slate-50 border border-slate-200/80 space-y-6 text-left flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center border-b border-slate-200 pb-4 mb-4">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{autoTranslate('Desglose del Plan de Pagos estructurado')}</span>
                        <div className="text-right">
                          <span className="text-[8px] font-black text-emerald-700 uppercase tracking-widest bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                            {autoTranslate('Descuento Aplicado')}: {discountRate * 100}%
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
                          <span className="text-[8px] text-slate-500 uppercase tracking-widest block font-bold">{autoTranslate('Precio Neto Final')}</span>
                          <span className="text-xl font-black text-slate-900"><LocalizedText text={"US$"} />{netPrice.toLocaleString('en-US')}</span>
                        </div>
                        {paymentPlan !== 'vip' && (
                          <div className="p-4 rounded-xl border" style={{ backgroundColor: `${accentColor}10`, borderColor: `${accentColor}30` }}>
                            <span className="text-[8px] uppercase tracking-widest block font-bold" style={{ color: accentColor }}>{autoTranslate('Mensualidad Estimada (en obra)')}</span>
                            <span className="text-xl font-black" style={{ color: accentColor }}><LocalizedText text={"US$"} />{monthlyPayment.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-6 space-y-3.5 text-xs font-semibold text-slate-600">
                        <div className="flex justify-between items-center py-2.5 border-b border-slate-200/80">
                          <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> {autoTranslate('Reserva de Bloqueo (Fijo)')}
                          </span>
                          <span className="font-bold text-slate-900"><LocalizedText text={"US$"} />{bookingFee.toLocaleString('en-US')}</span>
                        </div>
                        <div className="flex justify-between items-center py-2.5 border-b border-slate-200/80">
                          <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> {autoTranslate('Completivo de Inicial')} ({downPaymentPercent * 100}%)
                          </span>
                          <span className="font-bold text-slate-900"><LocalizedText text={"US$"} />{downPaymentDue.toLocaleString('en-US')}</span>
                        </div>
                        {paymentPlan !== 'vip' && (
                          <div className="flex justify-between items-center py-2.5 border-b border-slate-200/80">
                            <span className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-teal-500" /> {autoTranslate('Total durante Construcción')} ({constructionPercent * 100}% - {constructionMonths} {autoTranslate('cuotas de')}<LocalizedText text={"US$"} />{Math.round(monthlyPayment).toLocaleString('en-US')})
                            </span>
                            <span className="font-bold text-slate-900"><LocalizedText text={"US$"} />{constructionDue.toLocaleString('en-US')}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center py-2.5">
                          <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> {autoTranslate('Contra Entrega Final')} ({deliveryPercent * 100}%)
                          </span>
                          <span className="font-bold text-slate-900"><LocalizedText text={"US$"} />{deliveryDue.toLocaleString('en-US')}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={copyCalculatorPlan}
                      className="w-full py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-md transition-all flex items-center justify-center gap-2 mt-4 hover:opacity-90 cursor-pointer"
                      style={{ backgroundColor: accentColor, color: '#081339' }}
                    >
                      {calculatorCopied ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-800" /> {autoTranslate('¡Copiado al Portapapeles!')}
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" /> {autoTranslate('Copiar plan de pagos')}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )
        )}

        {!isStarProject && showProfitability && (
          <div className="reveal-on-scroll">
            <CanaRockProfitability config={config.profitability} primaryColor={primaryColor} accentColor={accentColor} />
          </div>
        )}

        {showAvailability && <section id="disponibilidad" className="bg-white py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
            <div className="reveal-on-scroll flex flex-col gap-6 border-b border-slate-200 pb-8 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: primaryColor }}><LocalizedText text={"Disponibilidad"} /></p>
                <h2 className="mt-4 text-4xl font-light tracking-[-0.03em] sm:text-5xl"><LocalizedText text={"Encuentra tu unidad."} /></h2>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <p className="max-w-xl text-sm leading-7 text-slate-500"><LocalizedText text={"Explora el inventario publicado por modelo, características y estado. Confirma precio y vigencia antes de reservar."} /></p>
                <a href={contactHref} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-2 rounded-full px-6 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-950" style={{ backgroundColor: accentColor }}><LocalizedText text={"Hablar con un asesor "} /><ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>
            <div className="reveal-on-scroll mt-6">
              <CanaRockAvailabilityExplorer units={project.units || []} primaryColor={primaryColor} accentColor={accentColor} contactHref={contactHref} projectName={project.name} projectLogoUrl={projectLogoUrl} unitDetail={config.unitDetail} />
            </div>
          </div>
        </section>}

        {showPublicDocuments && (
          <CanaRockPublicDocuments
            documents={publicDocuments}
            projectName={project.name}
            projectLogoUrl={projectLogoUrl}
            primaryColor={primaryColor}
            accentColor={accentColor}
          />
        )}

        {showContact && <section className="px-5 py-8 text-white sm:px-8 lg:px-12" style={{ backgroundColor: primaryColor }}>
          <div className="reveal-on-scroll mx-auto flex max-w-7xl flex-col items-start justify-between gap-7 rounded-3xl border border-white/10 bg-white/5 p-7 sm:flex-row sm:items-center sm:p-10">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: accentColor }}><LocalizedText text={"Atención personalizada"} /></p>
              <h2 className="mt-3 text-3xl font-light tracking-tight"><LocalizedText text={"Recibe disponibilidad y propuesta de inversión."} /></h2>
              {brokerReferrer?.name && <p className="mt-2 text-xs text-white/55"><LocalizedText text={"Asesor referido: "} />{brokerReferrer.name}</p>}
            </div>
            <a
              href={contactHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-2 rounded-full px-6 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-950"
              style={{ backgroundColor: accentColor }}
            ><LocalizedText text={"Hablar con un asesor "} /><MessageCircle className="h-4 w-4" />
            </a>
          </div>
        </section>}
        {showContact && <section id="contacto" className="bg-slate-950 px-5 py-16 text-white sm:px-8 lg:px-12">
          <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: accentColor }}><LocalizedText text={"Atención personalizada"} /></p>
              <h2 className="mt-3 text-3xl font-light tracking-tight"><LocalizedText text={"Recibe disponibilidad y propuesta de inversión."} /></h2>
              <p className="mt-4 max-w-md text-sm leading-6 text-white/65"><LocalizedText text={"Indica si eres cliente o agente de bienes raíces y un asesor te contactará con la información oficial."} /></p>
            </div>
            <LeadCaptureForm projectId={project.id} projectSlug={project.slug} projectName={project.name} accentClassName="bg-slate-950 hover:bg-slate-800" />
          </div>
        </section>}
      </main>

      <footer className="border-t border-white/10 px-5 py-8 text-white/50 sm:px-8 lg:px-12" style={{ backgroundColor: primaryColor }}>
        <div className="mx-auto flex max-w-7xl flex-col gap-2 text-[10px] uppercase tracking-[0.16em] sm:flex-row sm:items-center sm:justify-between">
          <span>{project.name} · {project.developer || 'Grupo Cana Rock'}</span>
          <span>© {new Date().getFullYear()} <Link href="/" className="hover:text-white transition"><LocalizedText text={"OB Brokers Team"} /></Link><LocalizedText text={". Todos los derechos reservados."} /></span>
        </div>
      </footer>

      {activeLightboxImage && lightboxIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-4" role="dialog" aria-modal="true">
          <UITranslationBoundary attributes={["aria-label"]}><button
            type="button"
            onClick={closeLightbox}
            className="absolute right-5 top-5 rounded-full border border-white/15 bg-white/10 p-3 text-white transition hover:bg-white/20"
            aria-label="Cerrar imagen"
          >
            <X className="h-5 w-5" />
          </button></UITranslationBoundary>
          <div className="flex h-full w-full max-w-6xl flex-col justify-center py-12">
            <div className="relative min-h-0 flex-1">
              <Image
                key={activeLightboxImage}
                src={activeLightboxImage}
                alt={`${project.name}, imagen ${lightboxIndex + 1} de ${gallery.length}`}
                fill
                sizes="100vw"
                className="object-contain"
              />
              {gallery.length > 1 && <>
                <UITranslationBoundary attributes={["aria-label"]}><button
                  type="button"
                  onClick={showPreviousImage}
                  className="absolute left-0 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-slate-950/60 text-white transition hover:bg-slate-950"
                  aria-label="Imagen anterior"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button></UITranslationBoundary>
                <UITranslationBoundary attributes={["aria-label"]}><button
                  type="button"
                  onClick={showNextImage}
                  className="absolute right-0 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-slate-950/60 text-white transition hover:bg-slate-950"
                  aria-label="Imagen siguiente"
                >
                  <ChevronRight className="h-5 w-5" />
                </button></UITranslationBoundary>
              </>}
            </div>
            <div className="mt-5 flex items-center justify-between gap-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/65">
                {String(lightboxIndex + 1).padStart(2, '0')} / {String(gallery.length).padStart(2, '0')}
              </p>
              {gallery.length > 1 && <button
                type="button"
                onClick={() => setLightboxAutoplay((current) => !current)}
                className="inline-flex h-9 items-center gap-2 rounded-full border border-white/15 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white/80 transition hover:bg-white/10"
              >
                {lightboxAutoplay ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                {lightboxAutoplay ? 'Pausar' : 'Reproducir'}
              </button>}
            </div>
            <UITranslationBoundary attributes={["aria-label"]}><div className="cana-rock-thumbnail-strip mt-3 flex gap-2 overflow-x-auto pb-2" aria-label="Miniaturas de galería">
              {gallery.map((imageUrl, index) => (
                <button
                  type="button"
                  key={imageUrl}
                  onClick={() => setLightboxIndex(index)}
                  className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition sm:h-20 sm:w-32 ${
                    index === lightboxIndex ? 'border-white opacity-100' : 'border-transparent opacity-55 hover:opacity-90'
                  }`}
                  aria-label={`Mostrar imagen ${index + 1}`}
                  aria-current={index === lightboxIndex ? 'true' : undefined}
                >
                  <UITranslationBoundary attributes={["alt"]}><Image src={imageUrl} alt="" fill sizes="128px" className="object-cover" /></UITranslationBoundary>
                </button>
              ))}
            </div></UITranslationBoundary>
          </div>
        </div>
      )}
    </div>
  );
}

function CanaRockPublicDocuments({
  documents,
  projectName,
  projectLogoUrl,
  primaryColor,
  accentColor,
}: {
  documents: PortalProjectDocument[];
  projectName: string;
  projectLogoUrl: string | null;
  primaryColor: string;
  accentColor: string;
}) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  async function handleDownload(doc: PortalProjectDocument) {
    if (!doc.documentVersionId) return;
    setDownloadingId(doc.id);
    setDownloadError(null);
    try {
      const res = await getPublicProjectDocumentUrlAction(doc.documentVersionId);
      if (res.error) {
        setDownloadError(res.error);
      } else if (res.url) {
        window.open(res.url, '_blank', 'noopener,noreferrer');
      }
    } catch {
      setDownloadError('No fue posible obtener el documento.');
    } finally {
      setDownloadingId(null);
    }
  }

  function bankingLabel(doc: PortalProjectDocument) {
    if (doc.category !== 'Bancario') return '';
    const reduced = doc.name
      .replace(/datos\s+bancarios?|bancarios?|oficial(es)?|cana\s+rock|universe|galaxy|cosmos|stelar|star/gi, ' ')
      .replace(/[·|_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return reduced.length <= 24 ? reduced : '';
  }

  function updatedLabel(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    const formatted = new Intl.DateTimeFormat('es-DO', { month: 'long', year: 'numeric' }).format(date);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  return (
    <section id="documentos" className="bg-[#f8f7f2] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="reveal-on-scroll flex flex-col gap-4 border-b border-slate-300 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: primaryColor }}><LocalizedText text={"Recursos oficiales"} /></p>
            <h2 className="mt-3 text-4xl font-light tracking-tight sm:text-5xl text-slate-950"><LocalizedText text={"Documentación del proyecto."} /></h2>
          </div>
          <p className="max-w-md text-xs leading-6 text-slate-600"><LocalizedText text={"Información comercial aprobada para consulta abierta. Para brochures de intermediación y fichas de venta, accede al portal de brokers."} /></p>
        </div>

        {downloadError && (
          <p className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700">
            {downloadError}
          </p>
        )}

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc, index) => {
            const isBanking = doc.category === 'Bancario';
            const blockLabel = bankingLabel(doc);
            return <div
              key={doc.id}
              style={{ '--reveal-index': index } as React.CSSProperties}
              className="reveal-on-scroll reveal-stagger flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div>
                {projectLogoUrl && isBanking && (
                  <div className="mb-5 flex min-h-16 items-center justify-center border-b border-slate-100 pb-5">
                    <span className="relative block h-12 w-full max-w-[190px] sm:h-14">
                      <Image
                        src={projectLogoUrl}
                        alt={`Logo de ${projectName}`}
                        fill
                        sizes="190px"
                        className="object-contain brightness-0"
                      />
                    </span>
                  </div>
                )}
                {!isBanking && <div className="flex items-center justify-between gap-2">
                  <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-blue-700">
                    {doc.format}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {doc.version ? `v${doc.version}` : ''}
                  </span>
                </div>}
                {blockLabel && <p className="mt-4 text-center text-[11px] font-black uppercase tracking-[0.16em] text-slate-800">{blockLabel}</p>}
                {!isBanking && <h3 className="mt-4 text-base font-bold text-slate-950">{doc.name}</h3>}
                <p className={cn('mt-1 text-xs font-medium text-slate-500', isBanking && 'text-center leading-5')}>
                  {isBanking ? `Datos bancarios oficiales · Actualizado: ${updatedLabel(doc.updated)}` : doc.category}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleDownload(doc)}
                disabled={downloadingId === doc.id}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-black uppercase tracking-[0.1em] text-slate-950 transition hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: accentColor }}
              >
                {downloadingId === doc.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {isBanking && doc.format.toLowerCase() === 'pdf' ? 'Descargar PDF' : 'Descargar recurso'}
              </button>
            </div>
          })}
        </div>
      </div>
    </section>
  );
}
