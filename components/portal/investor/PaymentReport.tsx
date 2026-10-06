'use client';

import { useRef, useState, useTransition } from 'react';
import { CheckCircle2, ExternalLink, MessageCircle, Send } from 'lucide-react';
import { reportPaymentAction, type ReportPaymentResult } from '@/app/(public)/inversionista/[code]/actions';
import type { InvestorAdvisor, InvestorReservationItem } from '@/lib/data/investor-portal';
import { PAYMENT_METHODS } from '@/lib/investor/payment-report';
import { formatMoney, whatsappLink } from './status';

const field =
  'mt-1.5 block min-h-12 w-full rounded-lg border border-[#DCE3EE] bg-white px-3.5 text-base text-[#101826] placeholder:text-[#94A3B8] focus:border-[#24207A] focus:outline focus:outline-2 focus:outline-[#24207A]/20 disabled:bg-[#F5F8FC]';
const labelCls = 'block text-sm text-[#3d4655]';
const primaryBtn =
  'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#0C094E] px-5 text-sm font-medium text-white transition hover:bg-[#24207A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24207A] disabled:opacity-60 sm:w-auto';

function suggestedAmount(unit: InvestorReservationItem): number {
  const a = unit.account;
  if (a.operationalStatus === 'proceso_entrega') return a.totalToDeliver;
  if (a.overdueCount > 0) return a.regularizationAmount;
  return a.nextDue?.outstanding ?? 0;
}

export default function PaymentReport({
  unit,
  code,
  advisor,
  isDemo = false,
}: {
  unit: InvestorReservationItem;
  code: string;
  advisor: InvestorAdvisor;
  isDemo?: boolean;
}) {
  const flow = unit.paymentFlow;
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ReportPaymentResult | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  if (unit.account.remainingBalance <= 0) return null;

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set('code', code);
    formData.set('reservationId', String(unit.reservationId));
    startTransition(async () => {
      try {
        setResult(await reportPaymentAction(formData));
      } catch {
        setResult({ ok: false, error: 'No se pudo enviar el reporte. Revise su conexión e intente de nuevo.' });
      }
    });
  };

  const amount = suggestedAmount(unit);
  const canSubmit = isDemo || flow.mode === 'email' || flow.mode === 'api';

  return (
    <section aria-labelledby="report-title" className="rounded-xl border border-[#DCE3EE] bg-[#F8FAFD] p-5 sm:p-6">
      <h3 id="report-title" className="font-display text-xl text-[#101826]">Reportar un pago</h3>
      <p className="mt-1 text-sm text-[#5B6472]">
        {isDemo
          ? 'En esta demostración, el reporte se guardará localmente y no se enviará a ningún proveedor.'
          : canSubmit
          ? `Su reporte se envía a ${flow.developerName} para verificar el pago y aplicarlo a su estado de cuenta.`
          : flow.mode === 'redirect'
          ? `Los pagos de este proyecto se realizan en el portal de ${flow.developerName}.`
          : `Así se reporta un pago de este proyecto con ${flow.developerName}.`}
      </p>

      <ol className="mt-5 space-y-3">
        {flow.steps.map((step, i) => (
          <li key={i} className="flex gap-3 text-sm text-[#3d4655]">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0C094E] text-xs text-white" aria-hidden>{i + 1}</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>

      {!isDemo && flow.mode === 'redirect' && flow.redirectUrl && (
        <a href={flow.redirectUrl} target="_blank" rel="noopener noreferrer" className={`${primaryBtn} mt-6`}>
          Ir al portal de pagos de {flow.developerName} <ExternalLink className="h-4 w-4" aria-hidden />
        </a>
      )}

      {!isDemo && flow.mode === 'instructions' && (
        <a
          href={whatsappLink(advisor.whatsapp, `Hola, acabo de pagar la unidad ${unit.unitCode}. Adjunto mi comprobante.`)}
          target="_blank"
          rel="noopener noreferrer"
          className={`${primaryBtn} mt-6`}
        >
          <MessageCircle className="h-4 w-4" aria-hidden /> Enviar comprobante a mi asesor
        </a>
      )}

      {canSubmit && result?.ok && (
        <div role="status" className="mt-6 rounded-lg border border-[#2F6B4F]/30 bg-white p-4">
          <p className="flex items-center gap-2 font-medium text-[#2F6B4F]">
            <CheckCircle2 className="h-5 w-5" aria-hidden /> Reporte enviado
          </p>
          <p className="mt-1 text-sm text-[#3d4655]">{result.message}</p>
          {result.demo && <p className="mt-2 text-xs text-[#6B7280]">Guardado únicamente en los datos locales de este demo. No se envió correo ni se contactó a un proveedor.</p>}
          <button
            type="button"
            onClick={() => {
              setResult(null);
              formRef.current?.reset();
            }}
            className="mt-3 text-sm underline underline-offset-4"
          >
            Reportar otro pago
          </button>
        </div>
      )}

      {canSubmit && !result?.ok && (
        <form ref={formRef} onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2" noValidate={false}>
          {/* Campo trampa para bots: oculto a personas */}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

          <div>
            <label htmlFor="rp-amount" className={labelCls}>Monto pagado ({unit.currency})</label>
            <input id="rp-amount" name="amount" type="number" inputMode="decimal" step="0.01" min="0.01" required defaultValue={amount > 0 ? amount : ''} className={field} />
            {amount > 0 && <p className="mt-1 text-xs text-[#6B7280]">Sugerido: {formatMoney(amount, unit.currency)}</p>}
          </div>
          <div>
            <label htmlFor="rp-date" className={labelCls}>Fecha del pago</label>
            <input id="rp-date" name="paidAt" type="date" required className={field} />
          </div>
          <div>
            <label htmlFor="rp-method" className={labelCls}>Método</label>
            <select id="rp-method" name="method" required defaultValue="transferencia" className={field}>
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="rp-ref" className={labelCls}>Referencia bancaria <span className="text-[#94A3B8]">(opcional)</span></label>
            <input id="rp-ref" name="reference" type="text" maxLength={80} className={field} />
          </div>
          {flow.acceptsReceipt && (
            <div className="sm:col-span-2">
              <label htmlFor="rp-file" className={labelCls}>Comprobante <span className="text-[#94A3B8]">(PDF o imagen, máx. 4 MB)</span></label>
              <input
                id="rp-file"
                name="receipt"
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                className={`${field} py-2.5 file:mr-3 file:rounded-md file:border-0 file:bg-[#E8E8F7] file:px-3 file:py-1.5 file:text-sm file:text-[#0C094E]`}
              />
            </div>
          )}
          <div className="sm:col-span-2">
            <label htmlFor="rp-note" className={labelCls}>Nota <span className="text-[#94A3B8]">(opcional)</span></label>
            <textarea id="rp-note" name="note" rows={2} maxLength={500} className={`${field} py-3`} />
          </div>

          {result && !result.ok && (
            <p role="alert" className="rounded-lg border border-[#A33A32]/30 bg-white p-3 text-sm text-[#A33A32] sm:col-span-2">
              {result.error}
            </p>
          )}

          <div className="sm:col-span-2">
            <button type="submit" disabled={pending} className={primaryBtn}>
              <Send className="h-4 w-4" aria-hidden /> {pending ? 'Enviando…' : 'Enviar reporte de pago'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
