'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from '@/components/ui/OptimizedImage';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, ArrowUpRight, Building2, CheckCircle2, ChevronRight, ExternalLink, Globe, Layers, LockKeyhole, MapPin, Menu, Phone, Search, ShieldCheck, TrendingUp, X } from 'lucide-react';
import BrandLogo from '@/components/branding/BrandLogo';
import PublicLanguageSwitcher from '@/components/i18n/PublicLanguageSwitcher';
import { useLocale } from '@/components/i18n/LocaleProvider';
import Footer from '@/components/landing/Footer';
import { formatCurrencyExplicit, cn } from '@/lib/utils';
import type { DevelopersDirectoryData } from '@/lib/data/developers-directory';

export default function DevelopersDirectoryPage({
  data,
  isAuthenticated,
}: {
  data: DevelopersDirectoryData;
  isAuthenticated?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const { locale, t, autoTranslate } = useLocale();

  const filteredDevelopers = useMemo(() => {
    return data.developers.filter((dev) => {
      const matchesSearch =
        !searchQuery.trim() ||
        dev.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dev.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dev.projects.some((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesZone =
        selectedZone === 'all' ||
        dev.zones.some((z) => z.toLowerCase().includes(selectedZone.toLowerCase()));

      return matchesSearch && matchesZone;
    });
  }, [data.developers, searchQuery, selectedZone]);

  const zoneFilters = ['all', ...data.uniqueZones];

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 selection:bg-blue-600 selection:text-white font-sans antialiased">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#FAF9F6]/90 backdrop-blur-xl border-b border-slate-200/60 transition-all duration-300">
        <div className="mx-auto flex h-20 max-w-[1680px] items-center justify-between px-4 sm:px-8 lg:px-12">
          {/* Brand Logo */}
          <Link href="/" className="group flex items-center gap-3">
            <BrandLogo size="xl" variant="dark" className="brand-color-cycle" />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-8 text-[14px] font-semibold text-slate-700">
            <Link href="/" className="hover:text-slate-950 transition-colors">
              {locale === 'en' ? 'Home' : locale === 'fr' ? 'Accueil' : 'Inicio'}
            </Link>
            <Link href="/proyectos" className="hover:text-slate-950 transition-colors">
              {locale === 'en' ? 'Projects & Properties' : locale === 'fr' ? <LocalizedText text={"Projets & Propriétés"} /> : <LocalizedText text={"Proyectos & Propiedades"} />}
            </Link>
            <Link href="/desarrolladores" className="text-blue-700 font-extrabold transition-colors">
              {locale === 'en' ? 'Developers' : locale === 'fr' ? <LocalizedText text={"Développeurs"} /> : 'Desarrolladores'}
            </Link>
            <Link href="/portal" className="hover:text-slate-950 transition-colors">
              {locale === 'en' ? 'Broker Portal' : locale === 'fr' ? 'Portail Brokers' : 'Portal Brokers'}
            </Link>
          </nav>

          {/* Right Action CTAs */}
          <div className="hidden sm:flex items-center gap-2.5">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#b7caae] bg-white px-3.5 py-2 text-[11px] font-bold uppercase tracking-[.08em] text-[#31583a] transition hover:bg-[#eaf2df] shadow-2xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{locale === 'en' ? 'Back' : locale === 'fr' ? 'Retour' : <LocalizedText text={"Volver"} />}</span>
            </Link>

            <PublicLanguageSwitcher circular />

            <Link
              href="/login?next=/portal"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#dbeabe] px-3.5 py-2 text-[11px] font-black uppercase tracking-[.08em] text-[#21472b] transition hover:bg-[#c9dfa5] shadow-2xs"
            >
              <LockKeyhole className="h-3.5 w-3.5" />
              <span>{locale === 'en' ? 'Broker Access' : locale === 'fr' ? 'Accès Brokers' : <LocalizedText text={"Acceso brokers"} />}</span>
            </Link>
          </div>

          {/* Mobile Hamburger Trigger */}
          <div className="flex items-center gap-2 sm:hidden">
            <PublicLanguageSwitcher circular />
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label={menuOpen ? t('closeMenu') : t('openMenu')}
              aria-expanded={menuOpen}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-xs active:scale-95 transition"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-b border-slate-200 bg-[#FAF9F6] px-6 py-6 sm:hidden space-y-4 shadow-xl"
            >
              <nav className="flex flex-col gap-3 text-base font-bold text-slate-800">
                <Link href="/" onClick={() => setMenuOpen(false)} className="py-1 hover:text-blue-600">
                  {locale === 'en' ? 'Home' : locale === 'fr' ? 'Accueil' : 'Inicio'}
                </Link>
                <Link href="/proyectos" onClick={() => setMenuOpen(false)} className="py-1 hover:text-blue-600">
                  {locale === 'en' ? 'Projects & Properties' : locale === 'fr' ? <LocalizedText text={"Projets & Propriétés"} /> : <LocalizedText text={"Proyectos & Propiedades"} />}
                </Link>
                <Link href="/desarrolladores" onClick={() => setMenuOpen(false)} className="py-1 text-blue-700 font-black">
                  {locale === 'en' ? 'Developers' : locale === 'fr' ? <LocalizedText text={"Développeurs"} /> : 'Desarrolladores'}
                </Link>
                <Link href="/portal" onClick={() => setMenuOpen(false)} className="py-1 hover:text-blue-600">
                  {locale === 'en' ? 'Broker Portal' : locale === 'fr' ? 'Portail Brokers' : 'Portal Brokers'}
                </Link>
              </nav>
              <div className="pt-3 border-t border-slate-200/80 flex flex-col gap-2.5">
                <Link
                  href="/login?next=/portal"
                  className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-xs font-bold text-white shadow-sm"
                >
                  <LockKeyhole className="h-4 w-4" />
                  <span>{locale === 'en' ? 'Broker Portal Login' : locale === 'fr' ? 'Connexion Brokers' : <LocalizedText text={"Acceso al Portal Brokers"} />}</span>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-14 sm:pt-40 sm:pb-20 overflow-hidden">
        {/* Background Gradients */}
        <div className="pointer-events-none absolute -top-40 right-0 h-[500px] w-[500px] rounded-full bg-blue-100/50 blur-3xl" />
        <div className="pointer-events-none absolute top-20 -left-40 h-[400px] w-[400px] rounded-full bg-amber-100/40 blur-3xl" />

        <div className="mx-auto max-w-[1680px] px-4 sm:px-8 lg:px-12 relative z-10">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-3.5 py-1.5 text-[10px] sm:text-xs font-black uppercase tracking-[0.18em] text-blue-800 shadow-2xs mb-5">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
              <span><LocalizedText text={"Directorio Oficial de Desarrolladores"} /></span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif italic tracking-tight text-slate-950 leading-[1.08]"><LocalizedText text={"Las Firmas Que Desarrollan "} /><span className="not-italic font-sans font-black text-blue-900"><LocalizedText text={"El Caribe"} /></span>
            </h1>

            <p className="mt-5 text-sm sm:text-lg text-slate-600 font-sans leading-relaxed max-w-3xl"><LocalizedText text={"Alianzas comerciales directas con las principales empresas constructoras y desarrolladoras inmobiliarias. Garantía de entrega, respaldo fiduciario, disponibilidad en tiempo real y comisiones oficiales aseguradas para nuestra red de brokers."} /></p>

            {/* Quick Metrics Bar */}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl">
              <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-2xs">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">
                  {data.totalDevelopers}
                </span>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1.5"><LocalizedText text={"Firmas Desarrolladoras"} /></p>
              </div>

              <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-2xs">
                <span className="text-2xl sm:text-3xl font-black text-blue-700 leading-none">
                  {data.totalProjects}
                </span>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1.5"><LocalizedText text={"Desarrollos Activos"} /></p>
              </div>

              <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-2xs">
                <span className="text-2xl sm:text-3xl font-black text-emerald-700 leading-none">
                  {data.totalAvailableUnits.toLocaleString('es-DO')}
                </span>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1.5"><LocalizedText text={"Unidades en Inventario"} /></p>
              </div>

              <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-2xs">
                <span className="text-2xl sm:text-3xl font-black text-amber-700 leading-none">
                  {data.uniqueZones.length || 4}
                </span>
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1.5"><LocalizedText text={"Zonas Turísticas"} /></p>
              </div>
            </div>
          </div>

          {/* SEARCH & FILTERS CONTROLS */}
          <div className="mt-12 rounded-3xl border border-slate-200/90 bg-white/90 p-4 sm:p-5 shadow-sm backdrop-blur-md">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <UITranslationBoundary attributes={["placeholder"]}><input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por desarrolladora o nombre de proyecto..."
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-hidden transition"
                /></UITranslationBoundary>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
                  ><LocalizedText text={"Limpiar"} /></button>
                )}
              </div>

              {/* Zone Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0 mr-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /><LocalizedText text={" Zona:"} /></span>
                {zoneFilters.map((zone) => (
                  <button
                    key={zone}
                    type="button"
                    onClick={() => setSelectedZone(zone)}
                    className={cn(
                      'rounded-full px-3.5 py-1.5 text-xs font-bold transition shrink-0 capitalize',
                      selectedZone.toLowerCase() === zone.toLowerCase()
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    )}
                  >
                    {zone === 'all' ? 'Todas las zonas' : zone}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DEVELOPERS DIRECTORY SHOWCASE */}
      <section className="pb-24">
        <div className="mx-auto max-w-[1680px] px-4 sm:px-8 lg:px-12 space-y-10">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-serif italic text-slate-950"><LocalizedText text={"Empresas Desarrolladoras Oficiales"} /></h2>
              <p className="text-xs text-slate-500 mt-0.5"><LocalizedText text={"Mostrando "} />{filteredDevelopers.length}<LocalizedText text={" de "} />{data.totalDevelopers}<LocalizedText text={" firmas registradas"} /></p>
            </div>
          </div>

          {filteredDevelopers.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center max-w-lg mx-auto">
              <Building2 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800"><LocalizedText text={"No se encontraron desarrolladores"} /></h3>
              <p className="text-xs text-slate-500 mt-1"><LocalizedText text={"Intenta ajustando los términos de búsqueda o seleccionando otra zona geográfica."} /></p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedZone('all');
                }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xs"
              ><LocalizedText text={"Restablecer filtros"} /></button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {filteredDevelopers.map((dev) => (
                <div
                  key={dev.slug}
                  className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 lg:p-10 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
                >
                  {/* Subtle top accent bar */}
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-amber-500 to-emerald-600" />

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: Developer Profile & Brand */}
                    <div className="lg:col-span-5 space-y-5">
                      <div className="flex items-start gap-4">
                        {/* Developer Logo Container */}
                        <div className="relative h-20 w-24 sm:h-24 sm:w-28 rounded-2xl border border-slate-200 bg-slate-50 p-2.5 shadow-2xs shrink-0 flex items-center justify-center overflow-hidden">
                          {dev.logoUrl ? (
                            <Image
                              src={dev.logoUrl}
                              alt={dev.name}
                              fill
                              className="object-contain p-2"
                              unoptimized={dev.logoUrl.startsWith('data:') || dev.logoUrl.startsWith('http')}
                            />
                          ) : (
                            <Building2 className="h-10 w-10 text-slate-300" />
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-800 border border-emerald-200">
                              <ShieldCheck className="h-3 w-3 text-emerald-600" /><LocalizedText text={"Desarrollador Oficial"} /></span>
                            {dev.yearsActive && (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600">
                                {dev.yearsActive}
                              </span>
                            )}
                          </div>

                          <h3 className="text-xl sm:text-2xl font-serif italic text-slate-950 font-bold tracking-tight">
                            {dev.name}
                          </h3>

                          {dev.tagline && (
                            <p className="text-xs font-semibold text-blue-700 leading-snug">
                              {dev.tagline}
                            </p>
                          )}
                        </div>
                      </div>

                      <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-sans">
                        {dev.description}
                      </p>

                      {/* Developer Highlight Badges */}
                      {dev.highlights && dev.highlights.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {dev.highlights.map((h, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 rounded-lg bg-slate-50 border border-slate-200/80 px-2.5 py-1 text-[10px] font-semibold text-slate-700"
                            >
                              <CheckCircle2 className="h-3 w-3 text-blue-600" />
                              {h}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Aggregated Stats Metrics */}
                      <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-slate-100">
                        <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                          <span className="text-xs font-black uppercase tracking-wider text-slate-400 block"><LocalizedText text={"Desarrollos"} /></span>
                          <span className="text-base sm:text-lg font-black text-slate-900 mt-0.5 block">
                            {dev.projectCount} {dev.projectCount === 1 ? <LocalizedText text={"Proyecto"} /> : <LocalizedText text={"Proyectos"} />}
                          </span>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                          <span className="text-xs font-black uppercase tracking-wider text-slate-400 block"><LocalizedText text={"Disponibles"} /></span>
                          <span className="text-base sm:text-lg font-black text-blue-700 mt-0.5 block">
                            {dev.availableUnitsCount}<LocalizedText text={" Unidades"} /></span>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                          <span className="text-xs font-black uppercase tracking-wider text-slate-400 block"><LocalizedText text={"Inversión"} /></span>
                          <span className="text-base sm:text-lg font-black text-slate-900 mt-0.5 block">
                            {dev.minPrice > 0 ? `Desde ${formatCurrencyExplicit(dev.minPrice, dev.currency)}` : 'A consultar'}
                          </span>
                        </div>
                      </div>

                      {/* CTA Action Buttons */}
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <Link
                          href={dev.portfolioUrl}
                          className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
                        >
                          <span><LocalizedText text={"Ver Portafolio Oficial"} /></span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>

                        {dev.website && (
                          <a
                            href={dev.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                          >
                            <Globe className="h-3.5 w-3.5 text-slate-400" />
                            <span><LocalizedText text={"Sitio Web"} /></span>
                            <ExternalLink className="h-3 w-3 text-slate-400" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Active Projects Strip */}
                    <div className="lg:col-span-7 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400"><LocalizedText text={"Desarrollos Activos de "} />{dev.name}
                        </span>
                        <span className="text-[10px] font-bold text-blue-700">
                          {dev.projects.length} {dev.projects.length === 1 ? 'desarrollo' : 'desarrollos'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {dev.projects.map((proj) => (
                          <Link
                            key={proj.id}
                            href={`/proyectos/${proj.slug}`}
                            className="group/card rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs hover:shadow-md transition flex flex-col justify-between"
                          >
                            {/* Project Photo */}
                            <div className="relative h-36 w-full overflow-hidden bg-slate-100">
                              <Image
                                src={proj.image}
                                alt={proj.name}
                                fill
                                sizes="(max-width: 768px) 100vw, 320px"
                                className="object-cover group-hover/card:scale-105 transition duration-500"
                                unoptimized={proj.image.startsWith('data:') || proj.image.startsWith('http')}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                              <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                                <span className="rounded-full bg-black/40 backdrop-blur-md px-2.5 py-0.5 text-[8.5px] font-black uppercase tracking-wider text-white border border-white/20">
                                  {proj.zone}
                                </span>
                                {proj.availableUnits > 0 && (
                                  <span className="rounded-full bg-emerald-500/90 backdrop-blur-md px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-white">
                                    {proj.availableUnits}<LocalizedText text={" Disp."} /></span>
                                )}
                              </div>
                              <div className="absolute bottom-2 left-3 right-3">
                                <span className="text-white font-serif italic text-base font-bold truncate block leading-tight drop-shadow-sm">
                                  {proj.name}
                                </span>
                              </div>
                            </div>

                            {/* Project Details Footer */}
                            <div className="p-3 bg-white flex items-center justify-between border-t border-slate-100">
                              <div>
                                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block"><LocalizedText text={"Precio Desde"} /></span>
                                <span className="text-xs sm:text-sm font-black text-slate-900">
                                  {proj.startingPrice > 0 ? formatCurrencyExplicit(proj.startingPrice, proj.currency) : 'Bajo consulta'}
                                </span>
                              </div>

                              <div className="inline-flex items-center gap-1 text-[10px] font-extrabold text-blue-700 group-hover/card:translate-x-0.5 transition-transform">
                                <span><LocalizedText text={"Ver ficha"} /></span>
                                <ChevronRight className="h-3.5 w-3.5" />
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* B2B ALLIANCE FOR DEVELOPERS */}
      <section className="pb-24">
        <div className="mx-auto max-w-[1680px] px-4 sm:px-8 lg:px-12">
          <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white p-8 sm:p-12 lg:p-16 relative overflow-hidden shadow-2xl border border-blue-900/40">
            {/* Background Glow */}
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />

            <div className="max-w-3xl relative z-10 space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3.5 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-blue-300">
                <Building2 className="h-3 w-3 text-amber-400" />
                <span><LocalizedText text={"Alianza Comercial Master Broker"} /></span>
              </div>

              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-serif italic tracking-tight text-white leading-tight"><LocalizedText text={"¿Eres Desarrollador o Constructora? Comercializa con "} /><span className="text-[#d4af37]"><LocalizedText text={"OB Brokers Team"} /></span>
              </h2>

              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans"><LocalizedText text={"Conectamos tus proyectos con más de 5,000 brokers y agencias inmobiliarias en República Dominicana, Estados Unidos, Canadá y Europa. Plataforma tecnológica con dossiers automáticos, inventario sincronizado y gestión transparente de comisiones."} /></p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                  <TrendingUp className="h-5 w-5 text-amber-400 mb-2" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider"><LocalizedText text={"Aceleración de Ventas"} /></h4>
                  <p className="text-[11px] text-slate-400 mt-1"><LocalizedText text={"Colocación masiva de unidades con eventos de lanzamiento y promociones exclusivas."} /></p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                  <Layers className="h-5 w-5 text-blue-400 mb-2" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider"><LocalizedText text={"Dossiers Inteligentes"} /></h4>
                  <p className="text-[11px] text-slate-400 mt-1"><LocalizedText text={"Material comercial de alta calidad generado automáticamente para cada asesor."} /></p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                  <ShieldCheck className="h-5 w-5 text-emerald-400 mb-2" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider"><LocalizedText text={"Protección y Fiduciaria"} /></h4>
                  <p className="text-[11px] text-slate-400 mt-1"><LocalizedText text={"Contratos formales, trazabilidad de clientes y seguridad jurídica integral."} /></p>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap items-center gap-3">
                <a
                  href="https://wa.me/18092030099?text=Hola%2C%20soy%20desarrollador%20y%20me%20gustar%C3%ADa%20comercializar%20un%20proyecto%20con%20OB%20Brokers%20Team."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#d4af37] px-6 py-3 text-xs font-black text-slate-950 shadow-md hover:bg-white transition"
                >
                  <Phone className="h-4 w-4" />
                  <span><LocalizedText text={"Contactar Equipo Master Broker"} /></span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>

                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-xs font-bold text-white hover:bg-white/20 transition"
                >
                  <LockKeyhole className="h-3.5 w-3.5" />
                  <span><LocalizedText text={"Acceso Portal de Desarrollador"} /></span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
