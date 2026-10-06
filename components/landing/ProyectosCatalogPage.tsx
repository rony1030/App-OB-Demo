'use client';
import { LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Building2,
  LockKeyhole,
  MapPin,
  Menu,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import BrandLogo from '@/components/branding/BrandLogo';
import PublicLanguageSwitcher from '@/components/i18n/PublicLanguageSwitcher';
import { useLocale } from '@/components/i18n/LocaleProvider';
import ProjectCatalog from '@/components/landing/ProjectCatalog';
import Footer from '@/components/landing/Footer';
import type { PortalProject } from '@/lib/portal-projects';
import type { MarketingStats } from '@/lib/data/marketing';

export default function ProyectosCatalogPage({
  projects,
}: {
  projects: PortalProject[];
  stats: MarketingStats;
  isAuthenticated?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { locale, t, autoTranslate } = useLocale();

  const totalUnits = projects.reduce((acc, p) => {
    const avail = (p.units || []).filter((u) => u.isPublic !== false && u.status === 'Disponible').length;
    return acc + (avail || 0);
  }, 0);

  const zonesCount = new Set(projects.map((p) => p.zone).filter(Boolean)).size;

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
            <Link href="/proyectos" className="text-blue-700 font-extrabold transition-colors">
              {locale === 'en' ? 'Projects & Properties' : locale === 'fr' ? <LocalizedText text={"Projets & Propriétés"} /> : <LocalizedText text={"Proyectos & Propiedades"} />}
            </Link>
            <Link href="/desarrolladores" className="hover:text-slate-950 transition-colors">
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
              <span>{locale === 'en' ? 'Back to Portal' : locale === 'fr' ? 'Retour au Portail' : <LocalizedText text={"Volver al portal"} />}</span>
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

        {/* Mobile Drawer Menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden border-t border-slate-200/80 bg-white/95 px-6 py-6 shadow-xl backdrop-blur-2xl sm:hidden"
            >
              <nav className="flex flex-col gap-3 font-semibold text-slate-800">
                <Link href="/" onClick={() => setMenuOpen(false)} className="py-2 border-b border-slate-100">
                  {locale === 'en' ? 'Home' : locale === 'fr' ? 'Accueil' : 'Inicio'}
                </Link>
                <Link href="/proyectos" onClick={() => setMenuOpen(false)} className="py-2 border-b border-slate-100 text-blue-700 font-bold">
                  {locale === 'en' ? 'Projects & Properties' : locale === 'fr' ? <LocalizedText text={"Projets & Propriétés"} /> : <LocalizedText text={"Proyectos & Propiedades"} />}
                </Link>
                <Link href="/desarrolladores" onClick={() => setMenuOpen(false)} className="py-2 border-b border-slate-100">
                  {locale === 'en' ? 'Developers' : locale === 'fr' ? <LocalizedText text={"Développeurs"} /> : 'Desarrolladores'}
                </Link>
                <Link href="/portal" onClick={() => setMenuOpen(false)} className="py-2 border-b border-slate-100">
                  {locale === 'en' ? 'Broker Portal' : locale === 'fr' ? 'Portail Brokers' : 'Portal Brokers'}
                </Link>
              </nav>

              <div className="pt-4 flex flex-col gap-2.5">
                <Link
                  href="/"
                  onClick={() => setMenuOpen(false)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-[#b7caae] bg-white text-[#31583a] text-xs font-bold tracking-wider uppercase hover:bg-[#eaf2df] transition-all shadow-xs"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{locale === 'en' ? 'Back to Portal' : locale === 'fr' ? 'Retour au Portail' : <LocalizedText text={"Volver al portal"} />}</span>
                </Link>
                <Link
                  href="/login?next=/portal"
                  onClick={() => setMenuOpen(false)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#dbeabe] text-[#21472b] text-xs font-black tracking-wider uppercase hover:bg-[#c9dfa5] transition-all shadow-xs"
                >
                  <LockKeyhole className="w-4 h-4" />
                  <span>{locale === 'en' ? 'Broker Access' : locale === 'fr' ? 'Accès Brokers' : <LocalizedText text={"Acceso brokers"} />}</span>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-20" aria-hidden="true" />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#FAF8F5] via-white to-white pt-12 pb-8 sm:pt-16 sm:pb-12 border-b border-slate-100">
        <div className="mx-auto max-w-[1680px] px-4 sm:px-8 lg:px-12">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#0a1140]/5 px-3.5 py-1.5 text-[#0a1140] font-extrabold text-[11px] uppercase tracking-wider border border-[#0a1140]/10">
              <Sparkles className="h-3.5 w-3.5 text-[#CA9F47]" />
              <span>{autoTranslate('Portafolio Comercial Oficial • República Dominicana')}</span>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.08]">
              {autoTranslate('Propiedades & Proyectos')} <span className="text-blue-700">{autoTranslate('en General')}</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-2xl">
              {autoTranslate(
                'Catálogo oficial y disponibilidad en tiempo real de los principales desarrollos turísticos e inmobiliarios en Punta Cana, Cap Cana, Bávaro, Las Terrenas y Santo Domingo.'
              )}
            </p>

            {/* Quick Stat Chips */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-xs font-bold text-slate-800 border border-slate-200/80 shadow-2xs">
                <Building2 className="h-4 w-4 text-blue-700" />
                <span>{projects.length} {autoTranslate('Desarrollos Activos')}</span>
              </div>
              {totalUnits > 0 && (
                <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-900 border border-emerald-200 shadow-2xs">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{totalUnits} {autoTranslate('Unidades Disponibles')}</span>
                </div>
              )}
              {zonesCount > 0 && (
                <div className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-xs font-bold text-slate-800 border border-slate-200/80 shadow-2xs">
                  <MapPin className="h-4 w-4 text-amber-600" />
                  <span>{zonesCount} {autoTranslate('Zonas Turísticas')}</span>
                </div>
              )}
              <div className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-xs font-bold text-slate-800 border border-slate-200/80 shadow-2xs">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>{autoTranslate('Títulos Deslindados & Confotur')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FULL PROJECT CATALOG */}
      <ProjectCatalog projects={projects} />

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
