'use client';

import Link from 'next/link';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  CheckCircle2, 
  Share2, 
  Building2, 
  ArrowRight,
  ShieldCheck,
  Download
} from 'lucide-react';
import BrandLogo from '@/components/branding/BrandLogo';
import PublicLanguageSwitcher from '@/components/i18n/PublicLanguageSwitcher';
import Footer from '@/components/landing/Footer';
import type { BrokerEvent } from '@/lib/data/events';

interface EventDetailPageProps {
  event: BrokerEvent;
  relatedEvents: BrokerEvent[];
}

export default function EventDetailPage({
  event,
  relatedEvents,
}: EventDetailPageProps) {
  const handleShare = async () => {
    if (typeof window !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: event.subtitle,
          url: window.location.href,
        });
      } catch {
        // Ignorar si el usuario cancela
      }
    } else if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      alert('Enlace copiado al portapapeles');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 selection:bg-blue-600 selection:text-white font-sans antialiased">
      {/* HEADER */}
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
              Proyectos
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

      {/* CONTENIDO PRINCIPAL */}
      <main className="pt-32 pb-24">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          {/* Navegación Retorno */}
          <div className="mb-6 flex items-center justify-between">
            <Link
              href="/eventos"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-blue-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a Todos los Eventos</span>
            </Link>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Compartir</span>
            </button>
          </div>

          {/* Encabezado del Evento */}
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-bold uppercase tracking-wider">
                {event.category}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {event.formattedDate}
              </span>
              {event.readTime && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {event.readTime}
                  </span>
                </>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-slate-950 tracking-tight leading-[1.15]">
              {event.title}
            </h1>

            <p className="mt-4 text-lg sm:text-xl text-slate-600 font-sans leading-relaxed">
              {event.subtitle}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-6 py-4 border-y border-slate-200/80 text-xs sm:text-sm text-slate-600">
              <span className="flex items-center gap-1.5 font-medium text-slate-900">
                <MapPin className="w-4 h-4 text-blue-700" />
                {event.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-400" />
                +{event.attendeesCount} Brókers participantes
              </span>
              {event.projectName && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  Proyecto: <strong className="text-slate-900">{event.projectName}</strong>
                </span>
              )}
            </div>
          </div>

          {/* REPRODUCTOR DE VIDEO PRINCIPAL */}
          <div className="mt-8 rounded-3xl overflow-hidden bg-slate-950 shadow-2xl border border-slate-800">
            <div className="relative aspect-video w-full">
              <video
                src={event.video.url}
                poster={event.coverImage}
                controls
                className="w-full h-full object-contain"
              >
                Tu navegador no soporta reproducción de videos HTML5.
              </video>
            </div>
          </div>

          {/* CUERPO DEL ARTÍCULO / BLOG */}
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-8">
              <div className="prose prose-slate max-w-none">
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-slate-900">
                  Resumen de la Experiencia
                </h3>
                <div className="mt-4 text-slate-700 text-base leading-relaxed whitespace-pre-line">
                  {event.description}
                </div>

                {/* Puntos Clave */}
                <div className="my-8 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                  <h4 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-700" />
                    Puntos Clave del Recorrido
                  </h4>
                  <ul className="space-y-3">
                    {event.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Galería de fotos del evento si existe */}
                {event.gallery && event.gallery.length > 0 && (
                  <div className="mt-10">
                    <h3 className="text-xl font-serif font-bold text-slate-900 mb-4">
                      Galería Fotográfica del Evento
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {event.gallery.map((imgUrl, idx) => (
                        <div key={idx} className="relative aspect-video rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                          <img
                            src={imgUrl}
                            alt={`${event.title} foto ${idx + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SIDEBAR DERECHA */}
            <div className="lg:col-span-4 space-y-6">
              {/* Tarjeta del Proyecto Vinculado */}
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                  Desarrollo Inspeccionado
                </span>
                <h4 className="text-lg font-serif font-bold text-slate-900 mt-1">
                  {event.projectName}
                </h4>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  ¿Tienes clientes interesados en unidades disponibles o planes de pago para este proyecto?
                </p>
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  <Link
                    href="/#acceso"
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-900 hover:bg-slate-900 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>Solicitar Dossier y Precios</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href="/proyectos"
                    className="w-full py-2 px-4 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium flex items-center justify-center transition-colors"
                  >
                    Ver en Catálogo General
                  </Link>
                </div>
              </div>

              {/* Banner Invitación a Próximos Eventos */}
              <div className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-3xl p-6 text-white shadow-md">
                <span className="text-amber-400 text-xs font-bold uppercase tracking-wider">
                  Comunidad Comercial
                </span>
                <h4 className="text-lg font-serif font-bold text-white mt-1">
                  Asiste al Próximo Tour
                </h4>
                <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                  Regístrate como bróker aliado para recibir invitaciones anticipadas con cupo reservado.
                </p>
                <Link
                  href="/#acceso"
                  className="mt-4 inline-flex items-center justify-center w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition-colors"
                >
                  Registrar mi Agencia
                </Link>
              </div>

              {/* Otros Eventos */}
              {relatedEvents.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800 mb-4">
                    Otros Recorridos
                  </h4>
                  <div className="space-y-4">
                    {relatedEvents.map((re) => (
                      <Link
                        key={re.id}
                        href={`/eventos/${re.slug}`}
                        className="group block"
                      >
                        <span className="text-[10px] font-semibold text-blue-700 uppercase">
                          {re.category}
                        </span>
                        <h5 className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-blue-900 line-clamp-2">
                          {re.title}
                        </h5>
                        <span className="text-[11px] text-slate-400 mt-1 block">
                          {re.formattedDate}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
