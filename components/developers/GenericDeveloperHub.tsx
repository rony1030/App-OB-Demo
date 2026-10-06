'use client';

import React from 'react';
import Link from 'next/link';
import Image from '@/components/ui/OptimizedImage';
import { ArrowRight, Building2, CheckCircle2, ChevronRight, Compass, MapPin, Phone, ShieldCheck } from 'lucide-react';
import type { PortalProject } from '@/lib/portal-projects';
import type { DeveloperProfile } from '@/lib/data/developers-directory';
import type { CurrentSessionUser } from '@/lib/auth/get-user';
import { formatCurrencyExplicit } from '@/lib/utils';
import { useLocale } from '@/components/i18n/LocaleProvider';

interface GenericDeveloperHubProps {
  developer: DeveloperProfile;
  projects: PortalProject[];
  currentUser: CurrentSessionUser | null;
}

export default function GenericDeveloperHub({
  developer,
  projects,
  currentUser,
}: GenericDeveloperHubProps) {
  const { autoTranslate } = useLocale();

  const totalUnits = projects.reduce((sum, p) => {
    const avail = (p.units || []).filter((u) => u.isPublic !== false && u.status === 'Disponible').length || p.availableUnits || 0;
    return sum + avail;
  }, 0);

  const heroImage = developer.coverImage || projects[0]?.image || '/projects/palm-view/hero.jpg';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 selection:bg-blue-600 selection:text-white">
      {/* Top Breadcrumb & Navbar */}
      <nav className="border-b border-slate-200/80 bg-white/95 backdrop-blur sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Link href="/" className="hover:text-slate-900 transition">
              {autoTranslate('Inicio')}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            <Link href="/desarrolladores" className="hover:text-slate-900 transition">
              {autoTranslate('Desarrolladores')}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
            <span className="text-slate-900 font-bold truncate max-w-[200px] sm:max-w-none">
              {developer.name}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <Link
                href="/portal"
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition"
              >
                <span>{autoTranslate('Ir al Portal')}</span>
              </Link>
            ) : (
              <a
                href="https://wa.me/18296391841?text=Hola,%20solicito%20información%20del%20portafolio%20de%20desarrollos"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
              >
                <Phone className="h-3.5 w-3.5" />
                <span>{autoTranslate('Contactar Broker')}</span>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Developer Hero Section */}
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0">
          <Image
            src={heroImage}
            alt={developer.name}
            fill
            sizes="100vw"
            className="object-cover opacity-25 filter blur-xs scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
          <div className="absolute inset-0 bg-radial-at-c from-transparent via-slate-950/60 to-slate-950" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:py-28">
          <div className="max-w-3xl space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-blue-300 border border-blue-400/30 backdrop-blur-md">
                <Building2 className="h-3.5 w-3.5 text-blue-400" />
                {autoTranslate('Portafolio de Desarrollador Oficial')}
              </span>
              {developer.verified && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300 border border-emerald-400/30 backdrop-blur-md">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  {autoTranslate('Verificado')}
                </span>
              )}
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.08]">
              {developer.name}
            </h1>

            {developer.tagline && (
              <p className="text-base sm:text-lg font-medium text-slate-300 leading-relaxed max-w-2xl">
                {autoTranslate(developer.tagline)}
              </p>
            )}

            <p className="text-xs sm:text-sm text-slate-400 font-normal leading-relaxed max-w-2xl">
              {autoTranslate(developer.description)}
            </p>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800">
              <div className="rounded-2xl bg-white/5 p-4 border border-white/10 backdrop-blur-md">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  {autoTranslate('Proyectos')}
                </span>
                <span className="text-xl sm:text-2xl font-black text-white mt-1 block">
                  {projects.length}
                </span>
              </div>
              <div className="rounded-2xl bg-white/5 p-4 border border-white/10 backdrop-blur-md">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  {autoTranslate('Unidades Totales')}
                </span>
                <span className="text-xl sm:text-2xl font-black text-white mt-1 block">
                  {totalUnits > 0 ? `+${totalUnits}` : autoTranslate('Consultar')}
                </span>
              </div>
              <div className="rounded-2xl bg-white/5 p-4 border border-white/10 backdrop-blur-md">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  {autoTranslate('Inversión Desde')}
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-400 mt-1 block">
                  {developer.minPrice > 0 ? formatCurrencyExplicit(developer.minPrice, 'USD') : autoTranslate('Consultar')}
                </span>
              </div>
              <div className="rounded-2xl bg-white/5 p-4 border border-white/10 backdrop-blur-md">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  {autoTranslate('Ubicación')}
                </span>
                <span className="text-sm font-black text-white mt-1 block truncate">
                  {developer.zones.join(', ') || 'Punta Cana'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Grid Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-700 block mb-1">
              {autoTranslate('Colección Residencial')}
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              {autoTranslate('Desarrollos Inmobiliarios en Comercialización')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {autoTranslate(`Explora las propiedades activas y proyectos de ${developer.name} con inventario oficial.`)}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-bold text-slate-700">
            {projects.length} {projects.length === 1 ? autoTranslate('Desarrollo') : autoTranslate('Desarrollos')}
          </span>
        </div>

        {/* Project Cards */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((proj) => {
            const availCount = (proj.units || []).filter((u) => u.isPublic !== false && u.status === 'Disponible').length || proj.availableUnits || 0;
            return (
              <div
                key={proj.slug}
                className="group flex flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-blue-200"
              >
                {/* Image Cover */}
                <div className="relative aspect-[16/11] w-full overflow-hidden bg-slate-900">
                  {proj.image ? (
                    <Image
                      src={proj.image}
                      alt={proj.name}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-800 text-white/30">
                      <Building2 className="h-12 w-12" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

                  {/* Status / Delivery Badge */}
                  <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-slate-950/80 backdrop-blur-md px-3 py-1 text-[9px] font-black text-white uppercase tracking-wider border border-white/20">
                    <span>{proj.delivery ? autoTranslate(`Entrega: ${proj.delivery}`) : autoTranslate('En Construcción')}</span>
                  </div>

                  {/* Bottom Title on Image */}
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <h3 className="font-display text-xl font-bold tracking-tight text-white group-hover:text-amber-200 transition">
                      {proj.name}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-amber-400 shrink-0" />
                      <span className="truncate">{proj.location}</span>
                    </p>
                  </div>
                </div>

                {/* Body Content */}
                <div className="flex flex-1 flex-col justify-between p-6 space-y-6">
                  <p className="line-clamp-2 text-xs sm:text-sm font-medium leading-relaxed text-slate-600">
                    {autoTranslate(proj.shortDescription || proj.description)}
                  </p>

                  {/* Pricing and Availability */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100 text-center">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                        {autoTranslate('Precio Desde')}
                      </span>
                      <span className="text-base font-black text-slate-900 mt-1 block">
                        {proj.startingPrice > 0 ? formatCurrencyExplicit(proj.startingPrice, 'USD') : autoTranslate('Consultar')}
                      </span>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100 text-center">
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                        {autoTranslate('Disponibles')}
                      </span>
                      <span className="text-base font-black text-blue-700 mt-1 block">
                        {availCount > 0 ? `${availCount} ${autoTranslate('unidades')}` : autoTranslate('Agotado')}
                      </span>
                    </div>
                  </div>

                  {/* Action Link */}
                  <Link
                    href={`/proyectos/${proj.slug}`}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-600 active:scale-[0.98]"
                  >
                    <span>{autoTranslate('Ver Proyecto e Inventario')}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Direct Contact Banner */}
      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-blue-300 border border-blue-400/30">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
              {autoTranslate('Representación Master Broker')}
            </span>
            <h3 className="font-display text-2xl sm:text-3xl font-black tracking-tight">
              {autoTranslate(`¿Deseas comercializar proyectos de ${developer.name}?`)}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {autoTranslate('Obtén acceso directo a inventario con bloqueo en tiempo real, cálculo de comisiones aseguradas y material de marketing de alta conversión.')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
            <a
              href="https://wa.me/18296391841?text=Hola,%20deseo%20comercializar%20este%20portafolio%20de%20desarrollo"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 text-xs font-black text-white shadow-md hover:bg-emerald-700 transition"
            >
              <Phone className="h-4 w-4" />
              <span>{autoTranslate('Hablar con Master Broker')}</span>
            </a>
            <Link
              href="/desarrolladores"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white/10 px-6 text-xs font-black text-white hover:bg-white/20 transition border border-white/20"
            >
              <Compass className="h-4 w-4" />
              <span>{autoTranslate('Ver Todos los Desarrolladores')}</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
