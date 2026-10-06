'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useState, useTransition } from 'react';
import { BadgeDollarSign, Clock3, FileUp } from 'lucide-react';
import { submitReservationPaymentAction } from '@/app/portal/crm/reservation-payment-actions';
import { formatPortalDateTime } from '@/lib/utils';

export type ClientReservation = {
  reservationId: number; requestId: number; projectName: string; unitCode: string; price: number; currency: string;
  expiresAt: string | null; reservationType: string; payments: { id: number; amount: number; currency: string; status: string; paymentStage?: string; createdAt: string }[];
};

const paymentStageLabel: Record<string, string> = { reservation: 'Reserva', initial: 'Inicial', construction: 'Construcción', delivery: 'Contra entrega' };

export default function ReservationPaymentPanel({ contactId, reservations }: { contactId: number; reservations: ClientReservation[] }) {
  const active = reservations;
  const [selectedId, setSelectedId] = useState(active[0]?.reservationId || 0);
  const [notice, setNotice] = useState('');
  const [pending, startTransition] = useTransition();
  if (!reservations.length) return null;
  const selected = active.find((item) => item.reservationId === selectedId);

  return <section className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700"><LocalizedText text={"Negociación"} /></p><h2 className="mt-1 text-base font-extrabold text-slate-950"><LocalizedText text={"Pagos y confirmaciones"} /></h2><p className="mt-1 text-xs text-slate-600"><LocalizedText text={"Cada comprobante llega a operaciones para su verificación dentro de esta negociación."} /></p></div><BadgeDollarSign className="h-5 w-5 text-amber-600" /></div>
    {active.length > 0 ? <form onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; startTransition(async () => { const result = await submitReservationPaymentAction(contactId, selectedId, new FormData(form)); setNotice(result.error || 'Comprobante enviado para verificación.'); if (!result.error) form.reset(); }); }} className="mt-4 grid gap-3 md:grid-cols-2">
      {active.length > 1 && <select value={selectedId} onChange={(event) => setSelectedId(Number(event.target.value))} className="h-10 rounded-lg border border-amber-200 bg-white px-3 text-xs"><option value={0}><LocalizedText text={"Selecciona una reserva"} /></option>{active.map((item) => <option key={item.reservationId} value={item.reservationId}>{item.projectName} · {item.unitCode}</option>)}</select>}
      <div className="flex items-center gap-2 text-xs text-slate-600"><Clock3 className="h-4 w-4 text-amber-600" />{selected?.expiresAt ? `Bloqueo vence: ${formatPortalDateTime(selected.expiresAt)}` : 'Bloqueo temporal activo'}</div>
      <select name="paymentStage" defaultValue={selected?.reservationType === 'temporary_hold' ? 'reservation' : 'initial'} className="h-10 rounded-lg border border-amber-200 bg-white px-3 text-xs" disabled={selected?.reservationType === 'temporary_hold'}>
        {selected?.reservationType === 'temporary_hold' ? <option value="reservation"><LocalizedText text={"Pago de reserva"} /></option> : <><option value="initial"><LocalizedText text={"Pago inicial"} /></option><option value="construction"><LocalizedText text={"Pago durante construcción"} /></option><option value="delivery"><LocalizedText text={"Pago contra entrega"} /></option></>}
      </select>
      <UITranslationBoundary attributes={["placeholder"]}><input required name="amount" type="number" min="0" step="0.01" defaultValue={selected?.price || ''} placeholder="Monto pagado" className="h-10 rounded-lg border border-amber-200 bg-white px-3 text-xs" /></UITranslationBoundary>
      <div className="grid grid-cols-[90px_1fr] gap-2"><select name="currency" defaultValue={selected?.currency || 'USD'} className="h-10 rounded-lg border border-amber-200 bg-white px-2 text-xs"><option><LocalizedText text={"USD"} /></option><option><LocalizedText text={"DOP"} /></option><option><LocalizedText text={"EUR"} /></option></select><UITranslationBoundary attributes={["placeholder"]}><input name="reference" placeholder="Referencia o número de transferencia" className="h-10 rounded-lg border border-amber-200 bg-white px-3 text-xs" /></UITranslationBoundary></div>
      <input required name="paidAt" type="datetime-local" className="h-10 rounded-lg border border-amber-200 bg-white px-3 text-xs" />
      <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-xs font-bold text-white hover:bg-slate-800"><FileUp className="h-3.5 w-3.5" /><LocalizedText text={" Adjuntar comprobante"} /><input required name="file" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" className="hidden" /></label>
      <button disabled={pending || !selectedId} className="h-10 rounded-lg bg-amber-600 px-4 text-xs font-extrabold text-white hover:bg-amber-700 disabled:opacity-50">{pending ? 'Enviando...' : <LocalizedText text={"Enviar a verificación"} />}</button>
    </form> : <p className="mt-4 text-xs text-slate-600"><LocalizedText text={"No hay una reserva activa para esta negociación."} /></p>}
    {notice && <p className="mt-3 text-xs font-semibold text-amber-800">{notice}</p>}
    <div className="mt-4 space-y-2">{reservations.flatMap((item) => item.payments.map((payment) => <p key={payment.id} className="rounded-lg bg-white px-3 py-2 text-xs text-slate-700">{item.unitCode} · {paymentStageLabel[payment.paymentStage || 'reservation']}: {payment.currency} {payment.amount.toLocaleString('en-US')} · <strong>{payment.status === 'approved' ? 'Pago verificado' : payment.status === 'rejected' ? 'Rechazado' : <LocalizedText text={"En revisión"} />}</strong></p>))}</div>
  </section>;
}
