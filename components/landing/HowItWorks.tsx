'use client';

import { Compass, FileSignature, LayoutTemplate, Share2, UserCheck } from 'lucide-react';
import Reveal from '@/components/landing/Reveal';
import { useLocale } from '@/components/i18n/LocaleProvider';

const STEPS_DATA = {
  es: [
    {
      title: 'Te unes a la red',
      desc: 'Tu master broker te da acceso comercial a la plataforma con tu propia cuenta.',
      icon: UserCheck,
    },
    {
      title: 'Firmas tu acuerdo digitalmente',
      desc: 'Firma de colaboración con validez legal en minutos. Ves siempre cuándo vence y renuevas con un clic.',
      icon: FileSignature,
    },
    {
      title: 'Accedes al inventario autorizado',
      desc: 'Solo ves los proyectos y la disponibilidad que tu master broker habilitó para ti.',
      icon: Compass,
    },
    {
      title: 'Generas propuestas con tu marca',
      desc: 'Dossiers y propuestas interactivas con tu logo, colores y datos de contacto.',
      icon: LayoutTemplate,
    },
    {
      title: 'Compartes y das seguimiento',
      desc: 'Envías el link por WhatsApp y das seguimiento comercial desde el CRM hasta el cierre.',
      icon: Share2,
    },
  ],
  en: [
    {
      title: 'Join the Network',
      desc: 'Your master broker grants commercial platform access with your dedicated account.',
      icon: UserCheck,
    },
    {
      title: 'Sign Digitally',
      desc: 'Legally binding collaboration agreement in minutes. Track validity and renew in one click.',
      icon: FileSignature,
    },
    {
      title: 'Access Approved Inventory',
      desc: 'Access exclusively the projects and live availability approved by your master broker.',
      icon: Compass,
    },
    {
      title: 'Create Branded Proposals',
      desc: 'White-label dossiers and interactive proposals showcasing your logo and contact info.',
      icon: LayoutTemplate,
    },
    {
      title: 'Share & Track to Close',
      desc: 'Send personalized links via WhatsApp and manage clients in the CRM through closing.',
      icon: Share2,
    },
  ],
  fr: [
    {
      title: 'Rejoignez le Réseau',
      desc: 'Votre master broker vous accorde l’accès commercial avec votre propre compte dédié.',
      icon: UserCheck,
    },
    {
      title: 'Signez Numériquement',
      desc: 'Accord de collaboration à valeur juridique en quelques minutes, renouvelable en un clic.',
      icon: FileSignature,
    },
    {
      title: 'Accédez aux Lots Autorisés',
      desc: 'Visualisez uniquement les projets et la disponibilité en direct validés par votre master broker.',
      icon: Compass,
    },
    {
      title: 'Générez des Offres à Votre Image',
      desc: 'Dossiers et présentations interactives personnalisés avec votre logo et vos coordonnées.',
      icon: LayoutTemplate,
    },
    {
      title: 'Partagez et Concluez',
      desc: 'Envoyez le lien par WhatsApp et pilotez le dossier dans le CRM jusqu’à la signature.',
      icon: Share2,
    },
  ],
};

export default function HowItWorks() {
  const { locale, t } = useLocale();
  const steps = STEPS_DATA[locale] || STEPS_DATA.es;

  return (
    <section id="como-funciona" className="border-t border-slate-200 bg-white py-20 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 space-y-12">
        <Reveal className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 text-blue-700 font-extrabold text-xs uppercase tracking-wider">
            <Compass className="h-4 w-4" />
            <span>{t('howItWorksBadge')}</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-slate-950 tracking-tight">
            {t('howItWorksTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {t('howItWorksSubtitle')}
          </p>
        </Reveal>

        <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((step, index) => (
            <Reveal key={step.title} delay={0.08 * index} className="h-full">
              <div className="group flex h-full flex-col gap-3 border-t border-slate-200 pt-5 transition">
                <div className="flex items-center justify-between">
                  <span className="font-display text-4xl font-light text-blue-300 transition group-hover:text-blue-600">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <step.icon className="h-5 w-5 text-blue-700" />
                </div>
                <h3 className="text-sm font-black text-slate-950">{step.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
