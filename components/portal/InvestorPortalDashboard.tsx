'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { FileText, HardHat, Home, MessageCircle, Wallet, type LucideIcon } from 'lucide-react';
import type { InvestorPortalData } from '@/lib/data/investor-portal';
import AccountStatement from '@/components/portal/investor/AccountStatement';
import AdvisorCard from '@/components/portal/investor/AdvisorCard';
import AttentionNotice, { type PortalTab } from '@/components/portal/investor/AttentionNotice';
import ConstructionReports from '@/components/portal/investor/ConstructionReports';
import DocumentsPanel from '@/components/portal/investor/DocumentsPanel';
import UnitOverview from '@/components/portal/investor/UnitOverview';
import UnitPicker from '@/components/portal/investor/UnitPicker';
import LogoutButton from '@/components/portal/investor/LogoutButton';
import { formatMoney, whatsappLink } from '@/components/portal/investor/status';
import { useWorkflow } from '@/lib/demo/use-workflow';
import { PAYMENT_DELAY_MS } from '@/lib/demo/browser-workflow';
import { computeAccount } from '@/lib/investor/account';

const TABS: { key: PortalTab; label: string; short: string; icon: LucideIcon }[] = [
  { key: 'summary', label: 'Mi unidad', short: 'Unidad', icon: Home },
  { key: 'payments', label: 'Estado de cuenta', short: 'Cuenta', icon: Wallet },
  { key: 'documents', label: 'Documentos', short: 'Documentos', icon: FileText },
  { key: 'progress', label: 'Avances de obra', short: 'Obra', icon: HardHat },
];

const NEEDS_ATTENTION = new Set(['vencida', 'en_legal', 'proceso_entrega']);

export default function InvestorPortalDashboard({ data: seedData }: { data: InvestorPortalData }) {
  const workflow = useWorkflow();
  const data = process.env.NEXT_PUBLIC_APP_SCOPE === 'demo' ? { ...seedData, reservations: seedData.reservations.map(reservation => {
    const reports = workflow.state.investorReports.filter(report => report.code === seedData.contact.publicCode && report.reservationId === reservation.reservationId);
    const installments = reservation.account.schedule.map(row => ({ ...row }));
    for (const report of reports.filter(item => Date.now() >= Date.parse(item.reportedAt) + PAYMENT_DELAY_MS)) {
      let remaining = report.amount;
      for (const row of installments) { const applied = Math.min(remaining, Math.max(0, row.amount - row.paidAmount)); row.paidAmount += applied; if (applied > 0) row.paidAt = report.paidAt; remaining -= applied; }
    }
    return { ...reservation, account: computeAccount({ price: reservation.price, installments, deliveryStatus: reservation.deliveryStatus, collectionStatus: reservation.collectionStatus }), receipts: [...reservation.receipts, ...reports.map(report => ({ id: report.id, label: report.reference, amount: report.amount, currency: reservation.currency, paidAt: report.paidAt, status: Date.now() >= Date.parse(report.reportedAt) + PAYMENT_DELAY_MS ? 'approved' as const : 'pending' as const }))] };
  }) } : seedData;
  const [tab, setTab] = useState<PortalTab>('summary');
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const contentRef = useRef<HTMLDivElement>(null);

  const unit = data.reservations[index] ?? data.reservations[0];

  if (!unit) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0C094E] px-6 text-center text-white">
        <div>
          <h1 className="font-display text-3xl">{data.contact.fullName}</h1>
          <p className="mt-3 text-sm text-[#C7CBEA]">Aún no tiene inmuebles formalizados en su portafolio. Su asesor le contactará con los próximos pasos.</p>
        </div>
      </main>
    );
  }

  const currency = unit.currency;
  const attention = data.reservations.filter((r) => NEEDS_ATTENTION.has(r.account.operationalStatus)).length;
  const totalInvestment = data.reservations.reduce((s, r) => s + r.price, 0);
  const totalPaid = data.reservations.reduce((s, r) => s + r.account.totalPaid, 0);
  const firstName = data.contact.fullName.replace(/^(Dra?\.|Ing\.|Lic\.|Sr\.|Sra\.)\s+/i, '').split(' ')[0];

  const summaryLine =
    data.reservations.length === 1
      ? 'Un inmueble en su portafolio.'
      : `${data.reservations.length} inmuebles en su portafolio. ${
          attention > 0 ? (attention === 1 ? 'Uno requiere su atención.' : `${attention} requieren su atención.`) : 'Todos están al día.'
        }`;

  const goToContent = () => {
    // En móvil el contenido queda debajo de las tarjetas: se lleva la vista al inicio del panel.
    requestAnimationFrame(() => contentRef.current?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }));
  };
  const changeTab = (next: PortalTab) => {
    setTab(next);
    goToContent();
  };
  const changeUnit = (next: number) => {
    setIndex(next);
    goToContent();
  };

  const fade = reduceMotion ? {} : { initial: { opacity: 0, y: 6 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.22 } };

  return (
    <div className="min-h-screen bg-[#F5F8FC] pb-28 text-[#101826] selection:bg-[#0C094E] selection:text-white md:pb-20">
      <div className="sticky top-0 z-50">
        {data.isDemo && process.env.NEXT_PUBLIC_APP_SCOPE !== 'demo' && (
          <div className="bg-[#E8E8F7] px-5 py-2 text-center text-xs text-[#0C094E] sm:text-sm border-b border-[#DCE3EE]">
            Modo demostración · datos ficticios ·{' '}
            <Link href="/inversionista" className="font-semibold underline underline-offset-4 hover:text-[#24207A]">
              Volver al acceso
            </Link>
          </div>
        )}
        <header className="border-b border-[#DCE3EE] bg-white/95 backdrop-blur-md shadow-sm supports-[backdrop-filter]:bg-white/85 transition-all">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
            <Link href="/inversionista" className="shrink-0 transition-opacity hover:opacity-90">
              <Image src="/brand/ob-brokers-horizontal-azul-recortado.png" alt="OB Brokers" width={160} height={64} priority className="h-9 sm:h-10 w-auto shrink-0" />
            </Link>
            <div className="flex items-center gap-2.5 sm:gap-3 text-right">
              <div className="flex flex-col justify-center leading-tight">
                <p className="max-w-[140px] xs:max-w-[180px] sm:max-w-[240px] truncate text-xs sm:text-sm font-bold text-[#0C094E]">
                  {data.contact.fullName}
                </p>
                <p className="text-[10px] sm:text-xs font-semibold tabular-nums text-[#6B7280]">
                  ID: {data.contact.publicCode}
                </p>
              </div>
              <div
                className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0C094E] to-[#24207A] text-[11px] sm:text-xs font-bold text-white shadow-sm ring-2 ring-[#0C094E]/10"
                aria-hidden="true"
              >
                {data.contact.fullName.split(' ').filter(Boolean).slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()}
              </div>
              {!data.isDemo && <LogoutButton />}
            </div>
          </div>
          <nav role="tablist" aria-label="Secciones del portal" className="mx-auto hidden max-w-6xl gap-8 px-8 md:flex">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              role="tab"
              type="button"
              aria-selected={tab === key}
              onClick={() => changeTab(key)}
              className={`-mb-px border-b-2 py-3 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24207A] ${
                tab === key ? 'border-[#0C094E] font-medium text-[#0C094E]' : 'border-transparent text-[#6B7280] hover:text-[#0C094E]'
              }`}
            >
              {label}
              {key === 'payments' && unit.account.overdueCount > 0 && <span className="ml-2 tabular-nums text-[#A5671A]">{unit.account.overdueCount}</span>}
            </button>
          ))}
        </nav>
      </header>
      </div>

      <div className="bg-[#0C094E] text-white">

        <section className="mx-auto max-w-6xl px-5 pb-24 pt-6 sm:px-8 sm:pb-28 sm:pt-10" aria-labelledby="welcome">
          <p className="text-sm text-[#B8BDF2]">Bienvenido, {firstName}</p>
          <h1 id="welcome" className="mt-2 font-display text-4xl leading-[1.1] sm:text-6xl">{data.contact.fullName}</h1>
          <p className="mt-3 text-[#C7CBEA]">{summaryLine}</p>

          <dl className="mt-8 grid divide-y divide-white/10 border-y border-white/10 sm:max-w-3xl sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {[
              ['Inversión total', formatMoney(totalInvestment, currency)],
              ['Total abonado', formatMoney(totalPaid, currency)],
              ['Por liquidar', formatMoney(Math.max(0, totalInvestment - totalPaid), currency)],
            ].map(([label, value]) => (
              <div key={label} className="flex items-baseline justify-between gap-4 py-3.5 sm:block sm:px-6 sm:py-5 sm:first:pl-0">
                <dt className="text-xs text-[#C7CBEA]">{label}</dt>
                <dd className="font-display text-xl tabular-nums text-white sm:mt-1 sm:text-3xl">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <main className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="-mt-16 sm:-mt-20">
          <UnitPicker reservations={data.reservations} selectedIndex={index} onSelect={changeUnit} />
        </div>

        <div ref={contentRef} className="mt-6 grid scroll-mt-20 gap-6 md:scroll-mt-32 lg:grid-cols-[1fr_320px] lg:gap-10">
          <div className="min-w-0">

            <motion.div key={`${unit.reservationId}-${tab}`} className="space-y-6" {...fade}>
              <AttentionNotice unit={unit} advisor={data.advisor} onNavigate={changeTab} />
              <div className="rounded-xl bg-white p-5 shadow-[0_6px_24px_-14px_rgba(11,19,43,0.3)] ring-1 ring-[#E4EBF5] sm:p-8">
                {tab === 'summary' && <UnitOverview unit={unit} />}
                {tab === 'payments' && <AccountStatement unit={unit} code={data.contact.publicCode} advisor={data.advisor} isDemo={data.isDemo} />}
                {tab === 'documents' && <DocumentsPanel documents={data.documents} unitCode={unit.unitCode} advisor={data.advisor} />}
                {tab === 'progress' && (
                  <section aria-label="Avances de obra">
                    <h2 className="mb-6 font-display text-2xl">Avances de obra · {unit.projectName}</h2>
                    <ConstructionReports updates={data.constructionByProject[unit.projectSlug] ?? []} projectName={unit.projectName} />
                  </section>
                )}
              </div>
            </motion.div>
          </div>

          <div className="space-y-6 lg:sticky lg:top-36 lg:self-start">
            <AdvisorCard advisor={data.advisor} unitCode={unit.unitCode} />
            <section className="rounded-xl bg-white p-6 ring-1 ring-[#E4EBF5]" aria-label="Mis datos">
              <p className="text-xs text-[#6B7280]">Mis datos</p>
              <dl className="mt-3 space-y-2 text-sm">
                <div><dt className="sr-only">Nombre</dt><dd>{data.contact.fullName}</dd></div>
                {data.contact.email && <div><dt className="sr-only">Correo</dt><dd className="break-all text-[#5B6472]">{data.contact.email}</dd></div>}
                {data.contact.phone && <div><dt className="sr-only">Teléfono</dt><dd className="text-[#5B6472]">{data.contact.phone}</dd></div>}
                <div><dt className="sr-only">Referencia</dt><dd className="text-xs tabular-nums text-[#6B7280]">Ref. {data.contact.publicCode}</dd></div>
              </dl>
              <a
                href={whatsappLink(data.advisor.whatsapp, `Hola, quiero actualizar mis datos de contacto (referencia ${data.contact.publicCode}).`)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block text-sm underline decoration-[#94A3B8] underline-offset-4 hover:decoration-[#101826]"
              >
                Solicitar actualización
              </a>
            </section>
          </div>
        </div>
      </main>

      {/* Móvil: botón flotante de asesor y barra inferior */}
      <a
        href={whatsappLink(data.advisor.whatsapp, `Hola ${data.advisor.name}, necesito asistencia con mi unidad ${unit.unitCode}.`)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Escribir al asesor por WhatsApp"
        className="fixed bottom-[5.25rem] right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#0C094E] text-white shadow-lg md:hidden"
      >
        <MessageCircle className="h-5 w-5" aria-hidden />
      </a>
      <nav
        role="tablist"
        aria-label="Secciones del portal"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-[#DCE3EE] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        {TABS.map(({ key, short, icon: Icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => changeTab(key)}
              className={`relative flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-[11px] leading-tight ${active ? 'text-[#0C094E]' : 'text-[#6B7280]'}`}
            >
              {active && <span className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-[#24207A]" aria-hidden />}
              <Icon className="h-5 w-5" aria-hidden />
              <span className="text-center">{short}</span>
              {key === 'payments' && unit.account.overdueCount > 0 && (
                <span className="absolute right-3 top-2 h-2 w-2 rounded-full bg-[#C9811F]" aria-label="Cuotas vencidas" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
