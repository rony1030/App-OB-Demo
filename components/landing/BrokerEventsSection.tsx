'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  X, 
  MapPin, 
  Calendar, 
  Users, 
  ArrowRight, 
  Sparkles, 
  Building2, 
  Compass,
  CheckCircle2,
  Maximize2
} from 'lucide-react';
import { type BrokerEvent, INITIAL_BROKER_EVENTS } from '@/types/events';

interface BrokerEventsSectionProps {
  events?: BrokerEvent[];
  onRequestAccess?: () => void;
  onRequestDossier?: (projectName: string) => void;
}

export default function BrokerEventsSection({
  events,
  onRequestAccess,
  onRequestDossier,
}: BrokerEventsSectionProps) {
  const [activeVideoEvent, setActiveVideoEvent] = useState<BrokerEvent | null>(null);

  // Escuchar tecla ESC para cerrar el modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveVideoEvent(null);
      }
    };
    if (activeVideoEvent) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [activeVideoEvent]);

  const eventList = events && events.length > 0 ? events : INITIAL_BROKER_EVENTS;
  // Tomamos el evento destacado (Tour Quebec Cana) como principal y los demás en lista lateral
  const featuredEvent = eventList.find((e) => e.featured) || eventList[0];
  const otherEvents = eventList.filter((e) => e.id !== featuredEvent.id);

  return (
    <section className="relative py-20 lg:py-28 bg-[#FAF9F6] border-t border-slate-200/80 overflow-hidden" id="eventos">
      {/* Elementos decorativos sutiles de fondo */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-100/30 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      <div className="relative mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-12">
        {/* Cabecera de la sección */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 lg:mb-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-800 text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Experiencias & Tours en Terreno</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-slate-900 tracking-tight leading-[1.15]">
              Eventos y Recorridos con <span className="text-blue-900 underline decoration-amber-400 decoration-4 underline-offset-4">Nuestra Red de Brókers</span>
            </h2>
            <p className="mt-4 text-base sm:text-lg text-slate-600 font-sans leading-relaxed">
              No solo compartimos catálogos digitales; llevamos a los brókers directamente al corazón de los proyectos para inspeccionar avances, rentabilidad y condiciones exclusivas.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onRequestAccess ? onRequestAccess() : document.getElementById('acceso')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-blue-900 text-white text-sm font-semibold shadow-sm hover:shadow transition-all duration-200"
            >
              <span>Unirme a Próximos Tours</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Layout Principal: Evento Destacado (Tour Quebec Cana) + Grid Secundario */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Card Principal Destacada: Tour Quebec Cana */}
          <div className="lg:col-span-8 group relative bg-white rounded-3xl border border-slate-200/80 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
            {/* Visualización del Video / Cover */}
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-950">
              <img
                src={featuredEvent.coverImage}
                alt={featuredEvent.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent pointer-events-none" />

              {/* Badges superiores */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/90 backdrop-blur-md text-slate-950 text-xs font-bold uppercase tracking-wider shadow">
                  <Compass className="w-3.5 h-3.5" />
                  {featuredEvent.category}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-xs font-medium border border-white/20">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  +{featuredEvent.attendeesCount} Brókers
                </span>
              </div>

              {/* Botón Central Play */}
              <button
                onClick={() => setActiveVideoEvent(featuredEvent)}
                aria-label={`Reproducir video de ${featuredEvent.title}`}
                className="absolute inset-0 m-auto w-20 h-20 rounded-full bg-blue-600/90 hover:bg-blue-600 text-white flex items-center justify-center shadow-2xl backdrop-blur-md transform group-hover:scale-110 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-400/50 cursor-pointer"
              >
                <div className="absolute inset-0 rounded-full border-2 border-white/40 animate-ping opacity-40 pointer-events-none" />
                <Play className="w-8 h-8 fill-white translate-x-0.5" />
              </button>

              {/* Barra inferior del video preview */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white/90 text-xs font-medium">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  {featuredEvent.location}
                </span>
                <span className="px-2.5 py-1 rounded bg-black/60 backdrop-blur-sm border border-white/10 font-mono">
                  Video {featuredEvent.video.duration || 'Full HD'}
                </span>
              </div>
            </div>

            {/* Contenido descriptivo del Evento Principal */}
            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md">
                  {featuredEvent.projectName}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {featuredEvent.formattedDate}
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 group-hover:text-blue-900 transition-colors">
                {featuredEvent.title}
              </h3>

              <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
                {featuredEvent.summary}
              </p>

              {/* Puntos destacados del tour */}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-5 border-t border-slate-100">
                {featuredEvent.highlights.slice(0, 4).map((highlight, index) => (
                  <div key={index} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>

              {/* Botones de acción */}
              <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                <button
                  onClick={() => setActiveVideoEvent(featuredEvent)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-900 group/btn"
                >
                  <Play className="w-4 h-4 fill-current text-blue-700" />
                  <span>Ver Video del Recorrido</span>
                </button>

                <div className="flex items-center gap-3">
                  {onRequestDossier && (
                    <button
                      onClick={() => onRequestDossier(featuredEvent.projectName)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-medium transition-colors"
                    >
                      Solicitar Ficha Quebec Cana
                    </button>
                  )}
                  <Link
                    href={`/eventos/${featuredEvent.slug}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold transition-colors"
                  >
                    <span>Leer Reseña Completa</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Otros Eventos con Brókers */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-700" />
                Más Eventos & Capacitaciones
              </h3>
              <Link
                href="/eventos"
                className="text-xs font-semibold text-blue-700 hover:underline flex items-center gap-1"
              >
                <span>Ver Blog</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-4">
              {otherEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="group bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs hover:shadow-md transition-all duration-200"
                >
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-900 mb-3">
                    <img
                      src={evt.coverImage}
                      alt={evt.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
                    />
                    <div className="absolute inset-0 bg-black/20" />
                    <button
                      onClick={() => setActiveVideoEvent(evt)}
                      aria-label={`Ver video de ${evt.title}`}
                      className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-white/90 hover:bg-white text-blue-900 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current translate-x-0.5" />
                    </button>
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 text-[10px] text-white font-mono">
                      {evt.video.duration}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-1.5">
                    <span className="font-semibold text-blue-700 uppercase tracking-wide">
                      {evt.category}
                    </span>
                    <span>•</span>
                    <span>{evt.formattedDate}</span>
                  </div>

                  <h4 className="text-sm font-semibold text-slate-900 group-hover:text-blue-900 transition-colors line-clamp-2">
                    {evt.title}
                  </h4>

                  <p className="mt-1.5 text-xs text-slate-600 line-clamp-2">
                    {evt.summary}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {evt.location.split(',')[0]}
                    </span>
                    <button
                      onClick={() => setActiveVideoEvent(evt)}
                      className="font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Ver video</span>
                      <Play className="w-3 h-3 fill-current" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Banner invitación a ser anfitrión o unirse al próximo tour */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-950 text-white shadow-sm">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                <Compass className="w-3.5 h-3.5" />
                <span>Próximo Tour Programado</span>
              </div>
              <h4 className="font-serif font-bold text-base text-white">
                ¿Quieres asistir al próximo recorrido comercial?
              </h4>
              <p className="mt-1 text-xs text-blue-100/90 leading-relaxed">
                Coordinamos traslados, inspecciones técnicas y almuerzo de relacionamiento para brókers activos.
              </p>
              <button
                onClick={() => onRequestAccess ? onRequestAccess() : document.getElementById('acceso')?.scrollIntoView({ behavior: 'smooth' })}
                className="mt-3.5 w-full py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Solicitar Invitación a Tour</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL REPRODUCTOR DE VIDEO (Lightbox) */}
      <AnimatePresence>
        {activeVideoEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-10">
            {/* Backdrop con desenfoque */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveVideoEvent(null)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md cursor-pointer"
            />

            {/* Contenedor del Modal */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-5xl bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700/60 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Barra superior del reproductor */}
              <div className="flex items-center justify-between px-6 py-4 bg-slate-950/90 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-semibold">
                    {activeVideoEvent.category}
                  </span>
                  <h4 className="text-white text-sm sm:text-base font-medium truncate max-w-md sm:max-w-xl">
                    {activeVideoEvent.title}
                  </h4>
                </div>
                <button
                  onClick={() => setActiveVideoEvent(null)}
                  className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors focus:outline-none"
                  aria-label="Cerrar video"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Video Player */}
              <div className="relative aspect-video w-full bg-black">
                <video
                  src={activeVideoEvent.video.url}
                  poster={activeVideoEvent.video.thumbnailUrl || activeVideoEvent.coverImage}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                >
                  Tu navegador no soporta reproducción de videos HTML5.
                </video>
              </div>

              {/* Pie del modal con detalles del evento */}
              <div className="p-6 bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-800">
                <div className="space-y-1">
                  <p className="text-xs text-slate-400 flex items-center gap-2">
                    <span>{activeVideoEvent.location}</span>
                    <span>•</span>
                    <span>{activeVideoEvent.formattedDate}</span>
                  </p>
                  <p className="text-sm text-slate-200 line-clamp-1">
                    {activeVideoEvent.subtitle}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Link
                    href={`/eventos/${activeVideoEvent.slug}`}
                    onClick={() => setActiveVideoEvent(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                  >
                    Ver Reseña Blog
                  </Link>
                  <button
                    onClick={() => {
                      setActiveVideoEvent(null);
                      if (onRequestAccess) {
                        onRequestAccess();
                      } else {
                        document.getElementById('acceso')?.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors"
                  >
                    Asistir a Próximo Evento
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
