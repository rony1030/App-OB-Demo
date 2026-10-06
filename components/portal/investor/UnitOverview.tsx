import Image from 'next/image';
import type { InvestorReservationItem } from '@/lib/data/investor-portal';
import { planBreakdown } from '@/lib/investor/account';
import { STATUS_TONE, formatDate, formatMoney } from './status';

function Figure({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="py-4 sm:px-6 sm:first:pl-0 sm:last:pr-0">
      <dt className="text-xs text-[#6B7280]">{label}</dt>
      <dd className="mt-1 font-display text-2xl tabular-nums text-[#101826]">{value}</dd>
      {hint && <p className="mt-0.5 text-xs text-[#6B7280]">{hint}</p>}
    </div>
  );
}

export default function UnitOverview({ unit }: { unit: InvestorReservationItem }) {
  const a = unit.account;
  const c = unit.currency;
  const tone = STATUS_TONE[a.operationalStatus];
  const plan = planBreakdown(a.schedule);
  const total = plan.reduce((s, p) => s + p.total, 0) || unit.price;
  // Marcas de la barra: fin del 20% inicial (reserva + inicial) y fin del 30% de obra.
  const initialEnd = ((plan[0].total + plan[1].total) / total) * 100;
  const constructionEnd = initialEnd + (plan[2].total / total) * 100;

  return (
    <div className="space-y-12">
      <section aria-labelledby="unit-title">
        <div className="relative -mx-5 -mt-5 aspect-[16/9] overflow-hidden rounded-t-xl bg-[#0C094E] sm:-mx-8 sm:-mt-8 sm:aspect-[21/8]">
          <Image src={unit.coverImage} alt="" fill sizes="(min-width: 1024px) 700px, 100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0C094E]/85 via-[#0C094E]/20 to-transparent" aria-hidden />
          <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-8">
            <p className="inline-flex items-center gap-2 text-sm">
              <span className={`h-2 w-2 rounded-full ${tone.dot}`} aria-hidden />
              {tone.label}
            </p>
            <h2 id="unit-title" className="mt-1 font-display text-3xl leading-tight sm:text-4xl">
              {unit.projectName}
            </h2>
            <p className="text-sm text-[#D5D9E3]">Unidad {unit.unitCode}</p>
          </div>
        </div>

        <dl className="mt-6 grid divide-y divide-[#DCE3EE] border-y border-[#DCE3EE] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <Figure label="Valor del inmueble" value={formatMoney(unit.price, c)} />
          <Figure label="Total abonado" value={formatMoney(a.totalPaid, c)} hint={`${a.paidPercentage}% liquidado`} />
          <Figure label="Saldo restante" value={formatMoney(a.remainingBalance, c)} />
        </dl>

        {/* Barra de liquidación segmentada por etapas del plan */}
        <div className="mt-8">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-[#3d4655]">Progreso de liquidación</span>
            <span className="tabular-nums text-[#101826]">{a.paidPercentage}%</span>
          </div>
          <div
            className="relative mt-2 h-2 rounded-full bg-[#E4EBF5]"
            role="progressbar"
            aria-valuenow={a.paidPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progreso de liquidación del inmueble"
          >
            <div className="h-full rounded-full bg-[#101826] transition-[width] duration-700" style={{ width: `${a.paidPercentage}%` }} />
            {[initialEnd, constructionEnd].map((left) => (
              <span key={left} className="absolute top-1/2 h-4 w-px -translate-y-1/2 bg-[#94A3B8]" style={{ left: `${left}%` }} aria-hidden />
            ))}
          </div>
          <div className="relative mt-2 h-4 text-[11px] text-[#6B7280]">
            <span className="absolute left-0">Inicial 20%</span>
            <span className="absolute -translate-x-1/2" style={{ left: `${(initialEnd + constructionEnd) / 2}%` }}>Construcción 30%</span>
            <span className="absolute right-0">Insoluto 50%</span>
          </div>
        </div>
      </section>

      <section aria-labelledby="plan-title">
        <h3 id="plan-title" className="font-display text-xl text-[#101826]">Plan de pagos acordado</h3>
        <ol className="mt-4 divide-y divide-[#DCE3EE] border-y border-[#DCE3EE]">
          {plan.map((stage, i) => {
            const done = stage.paid >= stage.total - 0.5 && stage.total > 0;
            const partial = !done && stage.paid > 0;
            return (
              <li key={stage.key} className="grid grid-cols-[2rem_1fr_auto] items-baseline gap-x-3 py-4 sm:grid-cols-[2rem_1fr_auto_9rem]">
                <span className="font-display text-sm text-[#24207A]">0{i + 1}</span>
                <div>
                  <p className="text-[#101826]">{stage.label}</p>
                  <p className="text-xs text-[#6B7280]">{stage.detail}</p>
                </div>
                <p className="text-right tabular-nums text-[#101826]">{formatMoney(stage.total, c)}</p>
                <p className={`col-start-2 mt-1 text-xs sm:col-start-auto sm:mt-0 sm:text-right ${done ? 'text-[#2F6B4F]' : partial ? 'text-[#A5671A]' : 'text-[#6B7280]'}`}>
                  {done ? 'Completado' : partial ? `${formatMoney(stage.paid, c)} abonados` : 'Pendiente'}
                </p>
              </li>
            );
          })}
        </ol>
      </section>

      {a.nextDue && a.nextDueInDays !== null && (
        <section aria-labelledby="next-title" className="border border-[#DCE3EE] bg-[#FFFFFF] p-6">
          <p id="next-title" className="text-xs text-[#6B7280]">Próximo pago</p>
          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <p className="text-[#101826]">{a.nextDue.concept}</p>
            <p className="font-display text-2xl tabular-nums text-[#101826]">{formatMoney(a.nextDue.outstanding, c)}</p>
          </div>
          <p className="mt-1 text-sm text-[#5B6472]">
            Vence el {formatDate(a.nextDue.dueDate)}
            {a.nextDueInDays === 0 ? ' · hoy' : a.nextDueInDays === 1 ? ' · mañana' : ` · en ${a.nextDueInDays} días`}
          </p>
        </section>
      )}
    </div>
  );
}
