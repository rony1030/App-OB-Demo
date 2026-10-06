'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  Compass,
  Filter,
  MapPin,
  Play,
  Search,
  Sparkles,
  Users,
  Video,
  X,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import BrandLogo from '@/components/branding/BrandLogo';
import PublicLanguageSwitcher from '@/components/i18n/PublicLanguageSwitcher';
import Footer from '@/components/landing/Footer';
import type { BrokerEvent } from '@/lib/data/events';

interface EventsBlogPageProps {
  events: BrokerEvent[];
}

export default function EventsBlogPage({ events }: EventsBlogPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeVideoEvent, setActiveVideoEvent] = useState<BrokerEvent | null>(null);

  const categories = [
    { id: 'all', label: 'Todos los Eventos' },
    { id: 'Tour Inmobiliario', label: 'Tours Inmobiliarios' },
    { id: 'Lanzamiento', label: 'Lanzamientos' },
    { id: 'Capacitación', label: 'Capacitaciones' },
  ];

  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      const matchesCategory =
        selectedCategory === 'all' || evt.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        evt.title.toLowerCase().includes(q) ||
        evt.summary.toLowerCase().includes(q) ||
        evt.projectName.toLowerCase().includes(q) ||
        evt.location.toLowerCase().includes(q) ||
        evt.tags.some((t) => t.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [events, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 selection:bg-blue-600 selection:text-white font-sans antialiased">
      {/* HEADER DE NAVEGACIÓN */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#FAF9F6]/90 backdrop-blur-xl border-b border-slate-200/60 transition-all duration-300">
        <div className="mx-auto flex h-20 max-w-[1680px] items-center justify-between px-4 sm:px-8 lg:px-12">
          <Link href="/" className="group flex items-center gap-3">
            <BrandLogo size="xl" variant="dark" className="brand-color-cycle" />
          </Link>

          <nav className="hidden lg:flex items-center gap-8 text-[14px] font-semibold text-slate-700">
            <Link href="/" className="hover:text-slate-950 transition-colors">
              Inicio
            </Link>
            <Link href="/proyectos" className="hover:text-slate-950 transition-colors">
              Proyectos & Propiedades
            </Link>
            <Link href="/eventos" className="text-blue-700 font-extrabold transition-colors">
              Eventos & Blog
            </Link>
            <Link href="/portal" className="hover:text-slate-950 transition-colors">
              Portal Brókers
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <PublicLanguageSwitcher />
            <Link
              href="/#acceso"
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-blue-900 transition-colors"
            >
              Registrarme
            </Link>
          </div>
        </div>
      </header>

      {/* HERO DE EVENTOS & BLOG */}
      <section className="relative pt-36 pb-16 lg:pt-44 lg:pb-24 border-b border-slate-200/60 bg-gradient-to-b from-blue-50/40 via-[#FAF9F6] to-[#FAF9F6]">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/80 border border-blue-200 text-blue-900 text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Bitácora Comercial & Tours de Brókers</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-slate-950 tracking-tight leading-[1.1]">
              Eventos, Recorridos y Novedades del Mercado
            </h1>
            <p className="mt-5 text-base sm:text-lg text-slate-600 font-sans leading-relaxed">
              Explora las coberturas en video, inspecciones de obra y encuentros estratégicos de nuestra red de brókers en República Dominicana.
            </p>
          </div>

          {/* BARRA DE FILTROS & BUSCADOR */}
          <div className="mt-10 flex flex-col md:flex-row md:items-center justify-between gap-4 p-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
            {/* Categorías */}
            <div className="flex flex-wrap items-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Input de Búsqueda */}
            <div className="relative min-w-[260px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por proyecto o palabra clave..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* LISTADO DE EVENTOS TIPO BLOG */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-12">
          {filteredEvents.length === 0 ? (
            <div className="py-20 text-center">
              <Compass className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800">No se encontraron eventos</h3>
              <p className="text-sm text-slate-500 mt-1">
                Intenta ajustando el filtro de categoría o tu búsqueda.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold"
              >
                Restablecer filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredEvents.map((evt) => (
                <article
                  key={evt.id}
                  className="group flex flex-col bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300"
                >
                  {/* Imagen y Video Thumbnail */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-950">
                    <img
                      src={evt.coverImage}
                      alt={evt.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

                    {/* Badge Categoría */}
                    <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-wider border border-white/10">
                        {evt.category}
                      </span>
                    </div>

                    {/* Botón de reproducción de video */}
                    <button
                      onClick={() => setActiveVideoEvent(evt)}
                      aria-label={`Ver video de ${evt.title}`}
                      className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-blue-600/90 hover:bg-blue-600 text-white flex items-center justify-center shadow-xl backdrop-blur-md transform group-hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Play className="w-6 h-6 fill-white translate-x-0.5" />
                    </button>

                    {/* Duración */}
                    <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[11px] text-white font-mono flex items-center gap-1">
                      <Video className="w-3 h-3 text-amber-400" />
                      {evt.video.duration || 'Video'}
                    </span>
                  </div>

                  {/* Cuerpo del Artículo */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Metadatos */}
                      <div className="flex items-center gap-3 text-xs text-slate-500 mb-2.5">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          {evt.formattedDate}
                        </span>
                        {evt.readTime && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {evt.readTime}
                            </span>
                          </>
                        )}
                      </div>

                      <h2 className="text-xl font-serif font-bold text-slate-900 group-hover:text-blue-900 transition-colors leading-snug line-clamp-2">
                        <Link href={`/eventos/${evt.slug}`}>
                          {evt.title}
                        </Link>
                      </h2>

                      <p className="mt-3 text-sm text-slate-600 line-clamp-3 leading-relaxed">
                        {evt.summary}
                      </p>
                    </div>

                    {/* Footer de la Card */}
                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        <span className="truncate max-w-[160px]">{evt.location}</span>
                      </span>

                      <Link
                        href={`/eventos/${evt.slug}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 group/link"
                      >
                        <span>Leer y Ver</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* MODAL REPRODUCTOR DE VIDEO */}
      <AnimatePresence>
        {activeVideoEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveVideoEvent(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md cursor-pointer"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-4xl bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700/60 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
                <span className="text-sm font-semibold text-white truncate pr-4">
                  {activeVideoEvent.title}
                </span>
                <button
                  onClick={() => setActiveVideoEvent(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="relative aspect-video w-full bg-black">
                <video
                  src={activeVideoEvent.video.url}
                  poster={activeVideoEvent.coverImage}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                >
                  Tu navegador no soporta reproducción de videos HTML5.
                </video>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
