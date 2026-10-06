'use client';

import { useState } from 'react';
import type { InvestorAdvisor, InvestorReservationItem } from '@/lib/data/investor-portal';
import PaymentReport from './PaymentReport';
import { INSTALLMENT_TONE, STATUS_TONE, formatDate, formatMoney } from './status';

function Kpi({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="py-4">
      <dt className="text-xs text-[#6B7280]">{label}</dt>
      <dd className={`mt-1 whitespace-nowrap font-display text-xl tabular-nums sm:text-2xl ${tone ?? 'text-[#101826]'}`}>{value}</dd>
    </div>
  );
}

export default function AccountStatement({ unit, code, advisor, isDemo = false }: { unit: InvestorReservationItem; code: string; advisor: InvestorAdvisor; isDemo?: boolean }) {
  const [filter, setFilter] = useState<'all' | 'open'>('all');
  const a = unit.account;
  const c = unit.currency;
  const rows = filter === 'all' ? a.schedule : a.schedule.filter((r) => r.state !== 'paid');
  const balance = a.insolutoBalance > 0 ? a.insolutoBalance : a.remainingBalance;

  return (
    <div className="space-y-12">
      <section aria-labelledby="kpi-title">
        <h2 id="kpi-title" className="font-display text-2xl text-[#101826]">
          Estado de cuenta · {unit.unitCode}
        </h2>
        <dl className="mt-6 grid grid-cols-2 gap-x-8 border-y border-[#DCE3EE] xl:grid-cols-4">
          <Kpi label="Total inversión" value={formatMoney(unit.price, c)} />
          <Kpi label="Total abonado" value={formatMoney(a.totalPaid, c)} tone="text-[#2F6B4F]" />
          <Kpi label={a.insolutoBalance > 0 ? 'Saldo insoluto' : 'Saldo restante'} value={formatMoney(balance, c)} />
          <Kpi label="Mora acumulada" value={formatMoney(a.moraAmount, c)} tone={a.moraAmount > 0 ? 'text-[#A5671A]' : undefined} />
        </dl>
      </section>

      <PaymentReport unit={unit} code={code} advisor={advisor} isDemo={isDemo} />

      <section aria-labelledby="schedule-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h3 id="schedule-title" className="font-display text-xl text-[#101826]">Cronograma de cuotas</h3>
          <div role="group" aria-label="Filtrar cuotas" className="flex gap-1 text-sm">
            {([['all', `Todas (${a.schedule.length})`], ['open', 'Por pagar']] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                aria-pressed={filter === key}
                className={`rounded-full px-3 py-1 transition ${filter === key ? 'bg-[#101826] text-white' : 'text-[#5B6472] hover:text-[#101826]'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="mt-6 border-y border-[#DCE3EE] py-10 text-center text-sm text-[#6B7280]">
            {a.schedule.length === 0 ? 'El cronograma de este inmueble aún no ha sido cargado.' : 'No quedan cuotas por pagar.'}
          </p>
        ) : (
          <>
            {/* Escritorio: tabla */}
            <table className="mt-4 hidden w-full text-left text-sm md:table">
              <thead>
                <tr className="border-y border-[#101826] text-xs text-[#5B6472]">
                  <th scope="col" className="w-20 py-3 pr-3 font-medium"># Cuota</th>
                  <th scope="col" className="py-3 pr-3 font-medium">Concepto</th>
                  <th scope="col" className="py-3 pr-3 font-medium">Vencimiento</th>
                  <th scope="col" className="py-3 pr-3 text-right font-medium">Monto</th>
                  <th scope="col" className="py-3 pr-3 text-right font-medium">Mora aplicada</th>
                  <th scope="col" className="py-3 text-right font-medium">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4EBF5]">
                {rows.map((r) => {
                  const t = INSTALLMENT_TONE[r.state];
                  return (
                    <tr key={r.sequence} className={r.state === 'paid' ? 'text-[#6B7280]' : 'text-[#101826]'}>
                      <td className="py-3 pr-3 tabular-nums">{r.sequence}</td>
                      <td className="py-3 pr-3">{r.concept}</td>
                      <td className="py-3 pr-3 tabular-nums">{formatDate(r.dueDate)}</td>
                      <td className="py-3 pr-3 text-right tabular-nums">{formatMoney(r.amount, c)}</td>
                      <td className={`py-3 pr-3 text-right tabular-nums ${r.moraAmount > 0 ? 'text-[#A5671A]' : ''}`}>
                        {r.moraAmount > 0 ? formatMoney(r.moraAmount, c) : '—'}
                      </td>
                      <td className={`py-3 text-right ${t.text}`}>{t.label}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Móvil: lista apilada */}
            <ul className="mt-4 divide-y divide-[#E4EBF5] border-y border-[#DCE3EE] md:hidden">
              {rows.map((r) => {
                const t = INSTALLMENT_TONE[r.state];
                return (
                  <li key={r.sequence} className="py-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="text-[#101826]"><span className="tabular-nums text-[#6B7280]">{r.sequence}.</span> {r.concept}</p>
                      <span className={`shrink-0 text-xs ${t.text}`}>{t.label}</span>
                    </div>
                    <div className="mt-1 flex justify-between text-sm text-[#5B6472]">
                      <span>{formatDate(r.dueDate)}</span>
                      <span className="tabular-nums text-[#101826]">{formatMoney(r.amount, c)}</span>
                    </div>
                    {r.moraAmount > 0 && <p className="mt-1 text-xs text-[#A5671A]">Mora aplicada: {formatMoney(r.moraAmount, c)}</p>}
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {a.overdueCount > 0 && (
          <p className={`mt-4 text-sm ${STATUS_TONE[a.operationalStatus].text}`}>
            Vencido: {formatMoney(a.overdueAmount, c)} + mora {formatMoney(a.moraAmount, c)} = {formatMoney(a.regularizationAmount, c)}
          </p>
        )}
      </section>

      <section aria-labelledby="receipts-title">
        <h3 id="receipts-title" className="font-display text-xl text-[#101826]">Comprobantes y reportes de pago</h3>
        {unit.receipts.length === 0 ? (
          <p className="mt-4 border-y border-[#DCE3EE] py-8 text-center text-sm text-[#6B7280]">
            Aún no hay comprobantes registrados en este expediente.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-[#E4EBF5] border-y border-[#DCE3EE]">
            {unit.receipts.map((r) => (
              <li key={r.id} className="flex items-baseline justify-between gap-4 py-3.5">
                <div>
                  <p className="text-[#101826]">{r.label}</p>
                  <p className="text-xs text-[#6B7280]">{formatDate(r.paidAt)}</p>
                </div>
                <div className="text-right">
                  <p className="tabular-nums text-[#101826]">{formatMoney(r.amount, r.currency)}</p>
                  <p className={`text-xs ${r.status === 'approved' ? 'text-[#2F6B4F]' : 'text-[#A5671A]'}`}>
                    {r.status === 'approved' ? 'Confirmado' : 'En verificación'}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
