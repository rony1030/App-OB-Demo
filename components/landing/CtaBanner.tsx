'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import Link from 'next/link';
import Image from '@/components/ui/OptimizedImage';
import { ArrowRight, KeyRound, ShieldCheck } from 'lucide-react';
import Reveal from '@/components/landing/Reveal';
import { useLocale } from '@/components/i18n/LocaleProvider';

const FALLBACK_BACKGROUND = 'https://images.unsplash.com/photo-1722592172801-9eff21cd5495?w=1600&q=80&auto=format&fit=crop';

export default function CtaBanner({ onRequestAccess, backgroundImage }: { onRequestAccess: () => void; backgroundImage?: string }) {
  const { locale, t } = useLocale();

  return (
    <section className="border-t border-[#1b2948] bg-[#071027] py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative flex flex-col items-center justify-between gap-10 overflow-hidden rounded-[2rem] border border-[#263552] bg-[#0d1730] p-8 text-white shadow-[0_24px_70px_rgba(0,0,0,0.24)] sm:p-14 lg:flex-row">
            {/* Optional project image, kept intentionally quiet so the message leads. */}
            <UITranslationBoundary attributes={["alt"]}><Image
              src={backgroundImage || FALLBACK_BACKGROUND}
              alt=""
              aria-hidden="true"
              fill
              sizes="(max-width: 1024px) 100vw, 1200px"
              quality={50}
              className="pointer-events-none object-cover opacity-[0.06]"
            /></UITranslationBoundary>
            <div className="pointer-events-none absolute inset-0 bg-[#0d1730]/80" />

            <div className="relative space-y-3 max-w-2xl text-center lg:text-left">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-200 border border-white/10">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                {locale === 'en' ? 'Exclusive Professional Access' : locale === 'fr' ? 'Accès Professionnel Exclusif' : <LocalizedText text={"Acceso Exclusivo para Profesionales"} />}
              </span>
              <h2 className="font-display text-2xl sm:text-4xl font-semibold tracking-tight text-white leading-tight">
                {locale === 'en'
                  ? 'Join the Caribbean’s most dynamic broker network'
                  : locale === 'fr'
                  ? <LocalizedText text={"Rejoignez le réseau de courtiers le plus dynamique des Caraïbes"} />
                  : <LocalizedText text={"Únete a la red de brokers más activa del Caribe"} />}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
                {locale === 'en'
                  ? 'Request your credentials today and market high-end real estate with institutional backing and 100% white-label tools.'
                  : locale === 'fr'
                  ? 'Obtenez vos identifiants dès aujourd’hui et commercialisez les programmes les plus prestigieux en marque blanche totale.'
                  : <LocalizedText text={"Solicita tus credenciales comerciales hoy mismo y empieza a comercializar los mejores proyectos con respaldo contractual y 100% marca blanca."} />}
              </p>
            </div>

            <div className="relative flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={onRequestAccess}
                className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-white px-8 text-xs font-extrabold text-slate-950 shadow-xl hover:bg-slate-100 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <ShieldCheck className="h-4 w-4" />
                <span>{t('requestAccess')}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <Link
                href="/login"
                className="inline-flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 text-xs font-bold text-white hover:bg-white/10 active:scale-[0.98] transition-all"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>{locale === 'en' ? 'Sign In' : locale === 'fr' ? 'Connexion' : <LocalizedText text={"Iniciar Sesión"} />}</span>
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
