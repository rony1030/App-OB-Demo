'use client';
import { LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { BadgeCheck, CircleDollarSign, FileSpreadsheet, Layers, ShieldCheck, Users, ArrowUpRight } from 'lucide-react';
import Reveal from '@/components/landing/Reveal';
import { useLocale } from '@/components/i18n/LocaleProvider';

const FEATURES_DATA = {
  es: [
    {
      title: 'Protección de Clientes 180 Días',
      desc: 'Registra tus prospectos en segundos. El sistema bloquea duplicados y asegura tu comisión durante 180 días naturales con trazabilidad completa.',
      icon: ShieldCheck,
    },
    {
      title: 'Propuestas Interactivas de Marca Blanca',
      desc: 'Genera enlaces personalizados con tu logotipo, contacto y fotos del proyecto. Envía propuestas por WhatsApp que los clientes pueden explorar interactivamente.',
      icon: Layers,
    },
    {
      title: 'Sincronización en Tiempo Real',
      desc: 'Disponibilidad de unidades y listas de precios sincronizadas directamente con las hojas de cálculo de los desarrolladores en Google Sheets.',
      icon: FileSpreadsheet,
    },
    {
      title: 'Esquemas de Pago Flexibles & Financiamiento',
      desc: 'Desglose claro de cuotas de reserva, inicial, construcción y contra entrega, con cálculo de financiamiento bancario y condiciones oficiales del proyecto.',
      icon: CircleDollarSign,
    },
    {
      title: 'Gestión CRM 360 Grados',
      desc: 'Historial de actividades, notas comerciales, etiquetas inteligentes y seguimiento del pipeline desde el primer contacto hasta el cierre de venta.',
      icon: Users,
    },
    {
      title: 'Liquidación Transparente de Comisiones',
      desc: 'Panel de control con estados de pago de comisiones, contratos de corretaje y acuerdos comerciales claros con cada master broker.',
      icon: BadgeCheck,
    },
  ],
  en: [
    {
      title: '180-Day Client Protection',
      desc: 'Register prospects in seconds. The system prevents duplicates and guarantees your commission for 180 calendar days with full traceability.',
      icon: ShieldCheck,
    },
    {
      title: 'Interactive White-Label Proposals',
      desc: 'Generate custom branded links with your logo, contact details, and project visuals. Share via WhatsApp for an interactive client experience.',
      icon: Layers,
    },
    {
      title: 'Real-Time Inventory Sync',
      desc: 'Unit availability and pricing synchronized directly with developer inventories and live master sheets.',
      icon: FileSpreadsheet,
    },
    {
      title: 'Flexible Payment Plans & Financing',
      desc: 'Clear breakdown of reservation, down payment, construction, and delivery installments, with mortgage calculators and interest-free options.',
      icon: CircleDollarSign,
    },
    {
      title: '360° Commercial CRM',
      desc: 'Activity logs, commercial notes, smart tags, and pipeline management from first contact all the way to deal closing.',
      icon: Users,
    },
    {
      title: 'Transparent Commission Settlements',
      desc: 'Real-time payout dashboard with brokerage agreements, verified milestones, and transparent disbursement tracking.',
      icon: BadgeCheck,
    },
  ],
  fr: [
    {
      title: 'Protection Client 180 Jours',
      desc: 'Enregistrez vos prospects en quelques secondes. Le système bloque les doublons et garantit votre commission pendant 180 jours civils avec une traçabilité totale.',
      icon: ShieldCheck,
    },
    {
      title: 'Propositions Interactives en Marque Blanche',
      desc: 'Générez des liens personnalisés avec votre logo, vos coordonnées et les visuels du projet. Partagez sur WhatsApp pour une découverte interactive.',
      icon: Layers,
    },
    {
      title: 'Synchronisation en Temps Réel',
      desc: 'Disponibilité des lots et grilles tarifaires synchronisées directement avec les inventaires promoteurs en direct.',
      icon: FileSpreadsheet,
    },
    {
      title: 'Plans de Paiement Flexibles & Financement',
      desc: 'Décomposition claire des versements de réservation, acompte, travaux et livraison, avec simulations de financement et options sans intérêts.',
      icon: CircleDollarSign,
    },
    {
      title: 'Gestion CRM 360 Degrés',
      desc: 'Historique d’activité, notes commerciales, étiquettes intelligentes et suivi complet du pipeline jusqu’à la conclusion de la vente.',
      icon: Users,
    },
    {
      title: 'Règlement Transparent des Commissions',
      desc: 'Tableau de bord des commissions avec conventions d’apporteur, statuts de paiement vérifiés et règlements ponctuels.',
      icon: BadgeCheck,
    },
  ],
};

export default function ValuePillars() {
  const { locale, t } = useLocale();
  const features = FEATURES_DATA[locale] || FEATURES_DATA.es;

  return (
    <section id="beneficios" className="border-t border-slate-200/80 bg-slate-50/70 py-24 sm:py-32 scroll-mt-20">
      <div className="mx-auto max-w-[1680px] px-4 sm:px-8 lg:px-12 space-y-16">
        <Reveal className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3.5 py-1 text-blue-900 font-extrabold text-[11px] uppercase tracking-wider border border-blue-100">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-700" />
            <span>{t('valuePillarsBadge')}</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-slate-950 tracking-tight leading-[1.1]">
            {locale === 'en' ? (
              <><LocalizedText text={"Engineered to close more "} /><span className="text-blue-700"><LocalizedText text={"real estate sales"} /></span></>
            ) : locale === 'fr' ? (
              <><LocalizedText text={"Conçu pour conclure plus de "} /><span className="text-blue-700"><LocalizedText text={"ventes immobilières"} /></span></>
            ) : (
              <><LocalizedText text={"Diseñado para cerrar más "} /><span className="text-blue-700"><LocalizedText text={"ventas inmobiliarias"} /></span></>
            )}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            {t('valuePillarsSubtitle')}
          </p>
        </Reveal>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feat, i) => (
            <Reveal key={feat.title} delay={0.06 * i} className="h-full">
              <div className="group relative flex h-full flex-col justify-between rounded-[2rem] border border-slate-200/80 bg-white p-8 shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-300 hover:shadow-xl">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-4xl font-light text-slate-300 transition-colors duration-300 group-hover:text-blue-600">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 transition-colors duration-300 group-hover:bg-slate-950 group-hover:text-white">
                      <feat.icon className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-950 tracking-tight">{feat.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">{feat.desc}</p>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400 group-hover:text-blue-700 transition-colors">
                  <span>{locale === 'en' ? 'Commercial Module' : locale === 'fr' ? 'Module Commercial' : <LocalizedText text={"Módulo Comercial"} />}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
