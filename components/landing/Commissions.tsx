'use client';
import { LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { ArrowRight, CircleDollarSign, ClipboardCheck, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import Reveal from '@/components/landing/Reveal';
import { useLocale } from '@/components/i18n/LocaleProvider';

const DETAILS_DATA = {
  es: [
    {
      icon: CircleDollarSign,
      label: 'Tasa de comisión',
      desc: 'Cada desarrollo define su propia comisión según el acuerdo comercial de tu master broker con la desarrolladora. No es una tasa única para toda la plataforma.',
    },
    {
      icon: SlidersHorizontal,
      label: 'Quién la configura',
      desc: 'El administrador de tu organización ajusta la comisión por proyecto, por agencia o por broker individual desde el panel del CRM — sin depender de soporte técnico.',
    },
    {
      icon: ClipboardCheck,
      label: 'Liquidación',
      desc: 'Estados de pago con trazabilidad completa: reservado, en proceso, liquidado. Cada comisión queda vinculada al cierre de venta que la generó.',
    },
    {
      icon: ShieldCheck,
      label: 'Sin sorpresas',
      desc: 'Historial de auditoría inmutable sobre cada cambio de comisión, acuerdo comercial y liquidación — visible para quien tenga permiso de verlo.',
    },
  ],
  en: [
    {
      icon: CircleDollarSign,
      label: 'Commission Rates',
      desc: 'Each development sets its specific commission under your master broker’s commercial agreement. It is tailored per project, not a single platform rate.',
    },
    {
      icon: SlidersHorizontal,
      label: 'Flexible Administration',
      desc: 'Your organization’s admin manages commissions by project, agency, or individual broker directly in the CRM without technical bottlenecks.',
    },
    {
      icon: ClipboardCheck,
      label: 'Traceable Payouts',
      desc: 'Complete status tracking: reserved, in progress, settled. Every commission is linked to the exact closed deal and payment receipt.',
    },
    {
      icon: ShieldCheck,
      label: 'Zero Surprises',
      desc: 'Immutable audit trail on all commission updates, commercial agreements, and disbursements — visible to authorized members.',
    },
  ],
  fr: [
    {
      icon: CircleDollarSign,
      label: 'Taux de Commission',
      desc: 'Chaque projet établit sa commission selon l’accord commercial de votre master broker avec le promoteur, sans taux unique imposé.',
    },
    {
      icon: SlidersHorizontal,
      label: 'Gestion Autonome',
      desc: 'L’administrateur ajuste les barèmes par programme, agence ou courtier individuel directement depuis le CRM sans délai.',
    },
    {
      icon: ClipboardCheck,
      label: 'Règlements Traçables',
      desc: 'Suivi exhaustif : réservé, en traitement, liquidé. Chaque versement est rattaché à la vente conclue correspondante.',
    },
    {
      icon: ShieldCheck,
      label: 'Transparence Totale',
      desc: 'Piste d’audit immuable sur toute modification de commission et accord commercial, accessible aux personnes habilitées.',
    },
  ],
};

export default function Commissions({ onRequestAccess }: { onRequestAccess: () => void }) {
  const { locale } = useLocale();
  const details = DETAILS_DATA[locale] || DETAILS_DATA.es;

  return (
    <section id="comisiones" className="relative overflow-hidden bg-[#071027] py-24 text-white scroll-mt-20 border-t border-[#1b2948] sm:py-32">

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-12">
        <Reveal className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-[11px] font-extrabold uppercase tracking-wider text-slate-200 border border-white/15 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>{locale === 'en' ? 'Commercial Structure & Earnings' : locale === 'fr' ? <LocalizedText text={"Structure Commerciale & Rémunération"} /> : 'Estructura Comercial & Ganancias'}</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-white tracking-tight leading-[1.1]">
            {locale === 'en' ? 'Your commission, your way' : locale === 'fr' ? 'Votre commission, selon vos règles' : <LocalizedText text={"Tu comisión, a tu manera"} />}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-medium">
            {locale === 'en'
              ? 'No rigid imposed rates. Each master broker defines and manages their own commission structure, project by project with complete traceability.'
              : locale === 'fr'
              ? <LocalizedText text={"Aucun taux imposé. Chaque master broker définit et ajuste sa propre grille de commissions, projet par projet en toute transparence."} />
              : <LocalizedText text={"Sin tasas fijas impuestas. Cada master broker define y ajusta su propia estructura de comisiones, proyecto por proyecto con total trazabilidad."} />}
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="rounded-[2rem] border border-[#263552] bg-[#0d1730] p-8 shadow-[0_24px_70px_rgba(0,0,0,0.24)] sm:p-12">
            <div className="grid gap-8 sm:grid-cols-2">
              {details.map((item) => (
                <div key={item.label} className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white border border-white/10">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-extrabold text-white">{item.label}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-slate-400 text-center sm:text-left font-medium">
                {locale === 'en'
                  ? 'Want to view the approved commission tiers for each development?'
                  : locale === 'fr'
                  ? <LocalizedText text={"Vous souhaitez consulter les barèmes autorisés par promoteur ?"} />
                  : <LocalizedText text={"¿Deseas conocer los porcentajes autorizados por desarrollo?"} />}
              </p>
              <button
                type="button"
                onClick={onRequestAccess}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-7 text-xs font-extrabold text-slate-950 shadow-md hover:bg-slate-100 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <span>{locale === 'en' ? 'View Commission Table' : locale === 'fr' ? 'Consulter la Grille des Commissions' : 'Consultar Tabla de Comisiones'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
