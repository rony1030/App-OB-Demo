'use client';
import { LocalizedText } from '@/components/i18n/UITranslationBoundary';


import Link from 'next/link';
import BrandLogo from '@/components/branding/BrandLogo';
import { useLocale } from '@/components/i18n/LocaleProvider';

export default function Footer() {
  const { locale, t } = useLocale();

  return (
    <footer className="border-t border-slate-200 bg-slate-50 py-12 text-slate-600 text-xs">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BrandLogo size="sm" variant="dark" />
          <span className="text-slate-300">|</span>
          <p className="text-[11px] text-slate-500">
            {locale === 'en'
              ? 'Technology platform for master brokers and real estate agencies.'
              : locale === 'fr'
              ? 'Plateforme technologique pour master brokers et agences immobilières.'
              : <LocalizedText text={"Plataforma tecnológica para master brokers y agencias inmobiliarias."} />}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-slate-500 sm:justify-end">
          <Link href="/proyectos" className="hover:text-slate-900 font-semibold">
            {locale === 'en' ? 'Projects' : locale === 'fr' ? 'Projets' : <LocalizedText text={"Proyectos"} />}
          </Link>
          <Link href="/desarrolladores" className="hover:text-slate-900 font-semibold">
            {locale === 'en' ? 'Developers' : locale === 'fr' ? <LocalizedText text={"Développeurs"} /> : 'Desarrolladores'}
          </Link>
          <span className="text-slate-300">·</span>
          <Link href="/legal#disclaimer" className="hover:text-slate-900"><LocalizedText text={"Disclaimer"} /></Link>
          <Link href="/legal#privacidad" className="hover:text-slate-900"><LocalizedText text={"Privacidad"} /></Link>
          <Link href="/legal#cookies" className="hover:text-slate-900"><LocalizedText text={"Cookies"} /></Link>
          <span>© {new Date().getFullYear()}<LocalizedText text={" OB Brokers Team. "} />{t('footerRights')}</span>
        </div>
      </div>
    </footer>
  );
}
