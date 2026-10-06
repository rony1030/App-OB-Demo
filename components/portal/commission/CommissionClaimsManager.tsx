'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useMemo, useState, useTransition } from 'react';
import { CheckCircle2, CircleDollarSign, FileCheck2, FileUp, ShieldCheck, UploadCloud } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { CommissionClaimListItem, CommissionClaimPermissions } from '@/lib/data/commission-claim-types';
import {
  confirmCommissionPaymentAction,
  markCommissionClaimPaidAction,
  reviewCommissionClaimAction,
  submitCommissionInvoiceAction,
  submitCommissionProformaAction,
} from '@/app/portal/comisiones/actions';
import { getCommissionClaimStatusLabel } from '@/lib/data/commission-claim-types';

export default function CommissionClaimsManager({
  claims,
  permissions,
}: {
  claims: CommissionClaimListItem[];
  permissions: CommissionClaimPermissions;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const totals = useMemo(() => ({
    gross: claims.reduce((sum, claim) => sum + claim.grossCommissionAmount, 0),
    released: claims.reduce((sum, claim) => sum + claim.releasedAmount, 0),
    paid: claims.filter((claim) => claim.paidAt).reduce((sum, claim) => sum + claim.releasedAmount, 0),
    invoiced: claims.filter((claim) => claim.finalInvoiceNumber).reduce((sum, claim) => sum + claim.releasedAmount, 0),
    inProcess: claims.filter((claim) => !claim.paidAt).reduce((sum, claim) => sum + claim.releasedAmount, 0),
    pending: claims.filter((claim) => !claim.paidAt).length,
    correction: claims.filter((claim) => claim.status === 'correction_requested').length,
  }), [claims]);

  const visibleClaims = useMemo(() => claims.filter((claim) => {
    const matchesStatus = statusFilter === 'all' || claim.status === statusFilter;
    const haystack = [claim.projectName, claim.organizationName, claim.clientName, claim.clientEmail, claim.unitId, claim.saleId]
      .filter(Boolean).join(' ').toLowerCase();
    return matchesStatus && haystack.includes(search.toLowerCase().trim());
  }), [claims, search, statusFilter]);

  function downloadSummary() {
    const headers = ['Solicitud', 'Estado', 'Proyecto', 'Agencia', 'Cliente', 'Correo', 'Unidad', 'Venta', 'Monto venta', 'Comision bruta', 'Liberado', 'Proforma', 'Factura final', 'Fecha factura', 'Pago', 'Fecha pago'];
    const rows = visibleClaims.map((claim) => [
      claim.id, getCommissionClaimStatusLabel(claim.status), claim.projectName, claim.organizationName,
      claim.clientName || '', claim.clientEmail || '', claim.unitId || '', claim.saleId || '', claim.saleAmount ?? '',
      claim.grossCommissionAmount, claim.releasedAmount, claim.proformaNumber || '', claim.finalInvoiceNumber || '', claim.finalInvoiceSubmittedAt ? formatDate(claim.finalInvoiceSubmittedAt) : '', claim.paidAt ? 'Pagado' : 'Pendiente', claim.paidAt ? formatDate(claim.paidAt) : '',
    ]);
    const csv = [headers, ...rows].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `resumen-comisiones-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function run(action: () => Promise<{ success?: boolean; error?: string }>) {
    startTransition(async () => {
      const result = await action();
      setMessage(result.error || (result.success ? 'Actualización guardada correctamente.' : ''));
    });
  }

  return (
    <div className="portal-enter space-y-7 pb-16">
      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-emerald-800">
            <CircleDollarSign className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]"><LocalizedText text={"Comisiones de proyectos y aliados"} /></span>
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl"><LocalizedText text={"Control de comisiones por proyecto"} /></h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600"><LocalizedText text={"Este módulo controla únicamente comisiones, proformas y pagos derivados de proyectos y acuerdos con aliados. No sustituye la contabilidad general de una empresa."} /></p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
          <ShieldCheck className="h-4 w-4 text-emerald-700" /><LocalizedText text={" Acceso por proyecto y organización"} /></div>
      </section>

      {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">{message}</div>}

      {claims.length > 0 && (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <UITranslationBoundary attributes={["label"]}><FinancialMetric label="Comisión bruta" value={formatCurrency(totals.gross, claims[0]?.currency || 'USD')} detail={`${claims.length} solicitudes`} /></UITranslationBoundary>
          <UITranslationBoundary attributes={["label"]}><FinancialMetric label="Liberado" value={formatCurrency(totals.released, claims[0]?.currency || 'USD')} detail="Habilitado para proforma" /></UITranslationBoundary>
          <UITranslationBoundary attributes={["label"]}><FinancialMetric label="Pagado" value={formatCurrency(totals.paid, claims[0]?.currency || 'USD')} detail="Desembolsado" /></UITranslationBoundary>
          <UITranslationBoundary attributes={["label"]}><FinancialMetric label="Facturado" value={formatCurrency(totals.invoiced, claims[0]?.currency || 'USD')} detail="Facturas finales registradas" /></UITranslationBoundary>
          <UITranslationBoundary attributes={["label"]}><FinancialMetric label="En proceso" value={formatCurrency(totals.inProcess, claims[0]?.currency || 'USD')} detail={`${totals.pending} solicitudes abiertas`} /></UITranslationBoundary>
          <UITranslationBoundary attributes={["label"]}><FinancialMetric label="Correcciones" value={String(totals.correction)} detail="Facturas por ajustar" /></UITranslationBoundary>
        </section>
      )}

      {claims.length > 0 && (
        <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-slate-900"><LocalizedText text={"Consulta financiera"} /></p>
            <p className="text-xs text-slate-500"><LocalizedText text={"Busca por cliente, proyecto, unidad o venta."} /></p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <UITranslationBoundary attributes={["placeholder","aria-label"]}><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar cliente o unidad" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" aria-label="Buscar comisiones" /></UITranslationBoundary>
            <UITranslationBoundary attributes={["aria-label"]}><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm" aria-label="Filtrar comisiones por estado">
              <option value="all"><LocalizedText text={"Todos los estados"} /></option>
              <option value="payment_pending"><LocalizedText text={"Pago pendiente"} /></option>
              <option value="proforma_submitted"><LocalizedText text={"Proforma enviada"} /></option>
              <option value="invoice_submitted"><LocalizedText text={"Factura recibida"} /></option>
              <option value="correction_requested"><LocalizedText text={"Corrección solicitada"} /></option>
              <option value="paid"><LocalizedText text={"Pagadas"} /></option>
            </select></UITranslationBoundary>
            <button type="button" onClick={downloadSummary} className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-xs font-black text-white"><LocalizedText text={"Descargar resumen"} /></button>
          </div>
        </section>
      )}

      {claims.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <FileCheck2 className="mx-auto h-9 w-9 text-slate-300" />
          <h2 className="mt-4 text-lg font-black text-slate-900"><LocalizedText text={"No hay solicitudes de comisión"} /></h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500"><LocalizedText text={"Cuando una venta tenga el pago confirmado y una comisión asignada, aparecerá aquí para continuar el proceso."} /></p>
        </section>
      ) : (
        <div className="space-y-4">
          {visibleClaims.map((claim) => (
            <ClaimCard key={claim.id} claim={claim} permissions={permissions} isPending={isPending} run={run} />
          ))}
          {visibleClaims.length === 0 && <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500"><LocalizedText text={"No hay comisiones que coincidan con la consulta."} /></section>}
        </div>
      )}
    </div>
  );
}

function ClaimCard({
  claim,
  permissions,
  isPending,
  run,
}: {
  claim: CommissionClaimListItem;
  permissions: CommissionClaimPermissions;
  isPending: boolean;
  run: (action: () => Promise<{ success?: boolean; error?: string }>) => void;
}) {
  const [percentage, setPercentage] = useState('50');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-slate-600">#{claim.id}</span>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-800">{getCommissionClaimStatusLabel(claim.status)}</span>
          </div>
          <h2 className="mt-3 text-lg font-black text-slate-950">{claim.projectName}</h2>
          <p className="mt-1 text-xs font-semibold text-slate-500">{claim.organizationName} · {claim.unitId ? `Unidad ${claim.unitId}` : <LocalizedText text={"Unidad vinculada a la venta"} />}{claim.saleId ? ` · Venta ${claim.saleId}` : ''}</p>
          <p className="mt-2 text-sm font-bold text-slate-800"><LocalizedText text={"Cliente: "} />{claim.clientName || 'Cliente vinculado a la venta'}</p>
          {claim.clientEmail && <p className="text-xs text-slate-500">{claim.clientEmail}</p>}
        </div>
        <div className="text-left sm:text-right">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400"><LocalizedText text={"Comisión liberada"} /></p>
          <p className="mt-1 text-2xl font-black text-slate-950">{formatCurrency(claim.releasedAmount, claim.currency)}</p>
          <p className="text-xs font-bold text-slate-500">{claim.releasedPercentage}<LocalizedText text={"% de "} />{formatCurrency(claim.grossCommissionAmount, claim.currency)}</p>
        </div>
      </div>

      <div className="grid gap-3 p-5 text-xs sm:grid-cols-2 lg:grid-cols-5">
        <UITranslationBoundary attributes={["label"]}><Metric label="Etapa comercial" value={claim.opportunityStage || 'Venta cerrada'} /></UITranslationBoundary>
        <UITranslationBoundary attributes={["label"]}><Metric label="Monto de la venta" value={claim.saleAmount == null ? 'Ver venta' : formatCurrency(claim.saleAmount, claim.currency)} /></UITranslationBoundary>
        <UITranslationBoundary attributes={["label"]}><Metric label="Proforma" value={claim.proformaNumber || 'Pendiente'} /></UITranslationBoundary>
        <UITranslationBoundary attributes={["label"]}><Metric label="Factura final" value={claim.finalInvoiceNumber || 'Pendiente'} /></UITranslationBoundary>
        <UITranslationBoundary attributes={["label"]}><Metric label="Confirmación developer" value={claim.developerPaymentConfirmedAt ? 'Confirmada' : 'Pendiente'} /></UITranslationBoundary>
        <UITranslationBoundary attributes={["label"]}><Metric label="Pago" value={claim.paidAt ? `Pagado · ${formatDate(claim.paidAt)}` : 'Pendiente'} /></UITranslationBoundary>
      </div>
      {(claim.proformaNumber || claim.finalInvoiceNumber) && (
        <div className="flex flex-wrap gap-4 border-t border-slate-100 px-5 py-3">
          {claim.proformaNumber && <a href={`/portal/comisiones/${claim.publicCode || claim.id}/proforma`} target="_blank" rel="noreferrer" className="text-xs font-black text-emerald-800 hover:underline"><LocalizedText text={"Ver proforma generada"} /></a>}
          {claim.finalInvoiceUrl ? <a href={claim.finalInvoiceUrl} target="_blank" rel="noreferrer" className="text-xs font-black text-violet-800 hover:underline"><LocalizedText text={"Ver factura final cargada"} /></a> : claim.finalInvoiceNumber ? <span className="text-xs font-semibold text-slate-500"><LocalizedText text={"Factura registrada; archivo no disponible todavía"} /></span> : null}
        </div>
      )}

      {(claim.canConfirmPayment || claim.canGenerateProforma || claim.canReview || claim.canUploadInvoice || claim.canMarkPaid) && (
        <div className="grid gap-4 border-t border-slate-100 bg-slate-50/70 p-5 lg:grid-cols-2">
          {claim.canConfirmPayment && permissions.canConfirmPayment && (
            <div className="rounded-xl border border-amber-200 bg-white p-4">
              <p className="text-sm font-black text-slate-900"><LocalizedText text={"Confirmar cobro del cliente"} /></p>
              <p className="mt-1 text-xs leading-5 text-slate-500"><LocalizedText text={"Esta confirmación libera el porcentaje definido para esta etapa."} /></p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <UITranslationBoundary attributes={["aria-label"]}><input value={percentage} onChange={(event) => setPercentage(event.target.value)} type="number" min="1" max="100" className="h-10 rounded-lg border border-slate-200 px-3 text-sm" aria-label="Porcentaje de comisión liberado" /></UITranslationBoundary>
                <UITranslationBoundary attributes={["placeholder"]}><input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Referencia de pago" className="h-10 rounded-lg border border-slate-200 px-3 text-sm sm:col-span-2" /></UITranslationBoundary>
              </div>
              <UITranslationBoundary attributes={["placeholder"]}><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Nota de confirmación" className="mt-2 min-h-20 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></UITranslationBoundary>
              <button type="button" disabled={isPending} onClick={() => run(() => confirmCommissionPaymentAction({ claimId: claim.id, releasedPercentage: Number(percentage), reference, notes }))} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-50">
                <CheckCircle2 className="h-4 w-4" /><LocalizedText text={" Confirmar y habilitar proforma"} /></button>
            </div>
          )}

          {claim.canGenerateProforma && (
            <div className="rounded-xl border border-emerald-200 bg-white p-4">
              <p className="text-sm font-black text-slate-900"><LocalizedText text={"Generar proforma"} /></p>
              <p className="mt-1 text-xs leading-5 text-slate-500"><LocalizedText text={"Se tomarán automáticamente los datos legales de la organización y el monto liberado."} /></p>
              <button type="button" disabled={isPending} onClick={() => run(() => submitCommissionProformaAction(claim.id))} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-xs font-black text-white disabled:opacity-50">
                <FileCheck2 className="h-4 w-4" /><LocalizedText text={" Enviar proforma a revisión"} /></button>
            </div>
          )}

          {claim.canReview && permissions.canReview && (
            <div className="rounded-xl border border-blue-200 bg-white p-4">
              <p className="text-sm font-black text-slate-900"><LocalizedText text={"Revisar proforma"} /></p>
              <UITranslationBoundary attributes={["placeholder"]}><textarea placeholder="Comentario de revisión" className="mt-3 min-h-20 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" id={`review-${claim.id}`} /></UITranslationBoundary>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" disabled={isPending} onClick={() => run(() => reviewCommissionClaimAction({ claimId: claim.id, decision: 'approved', notes: (document.getElementById(`review-${claim.id}`) as HTMLTextAreaElement | null)?.value }))} className="rounded-lg bg-blue-700 px-4 py-2.5 text-xs font-black text-white disabled:opacity-50"><LocalizedText text={"Aprobar proforma"} /></button>
                <button type="button" disabled={isPending} onClick={() => run(() => reviewCommissionClaimAction({ claimId: claim.id, decision: 'correction_requested', notes: (document.getElementById(`review-${claim.id}`) as HTMLTextAreaElement | null)?.value }))} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 disabled:opacity-50"><LocalizedText text={"Solicitar corrección"} /></button>
              </div>
            </div>
          )}

          {claim.canUploadInvoice && (
            <form action={async (formData) => { const result = await submitCommissionInvoiceAction(formData); if ('error' in result && result.error) window.alert(result.error); else window.location.reload(); }} className="rounded-xl border border-violet-200 bg-white p-4">
              <p className="text-sm font-black text-slate-900"><LocalizedText text={"Cargar factura final"} /></p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <input type="hidden" name="claimId" value={claim.id} />
                <UITranslationBoundary attributes={["placeholder"]}><input name="invoiceNumber" placeholder="Número de factura" required className="h-10 rounded-lg border border-slate-200 px-3 text-sm" /></UITranslationBoundary>
                <label className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-violet-300 px-3 text-xs font-bold text-violet-800"><UploadCloud className="h-4 w-4" /><span><LocalizedText text={"Seleccionar archivo"} /></span><input name="file" type="file" accept="application/pdf,image/png,image/jpeg" required className="sr-only" /></label>
              </div>
              <button type="submit" disabled={isPending} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-violet-700 px-4 py-2.5 text-xs font-black text-white disabled:opacity-50"><FileUp className="h-4 w-4" /><LocalizedText text={" Enviar factura"} /></button>
            </form>
          )}

          {claim.canMarkPaid && permissions.canReview && (
            <div className="rounded-xl border border-teal-200 bg-white p-4">
              <p className="text-sm font-black text-slate-900"><LocalizedText text={"Registrar pago de comisión"} /></p>
              <p className="mt-1 text-xs leading-5 text-slate-500"><LocalizedText text={"Solo disponible después de recibir y validar la factura final."} /></p>
              <button type="button" disabled={isPending} onClick={() => run(() => markCommissionClaimPaidAction({ claimId: claim.id }))} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-xs font-black text-white disabled:opacity-50"><CheckCircle2 className="h-4 w-4" /><LocalizedText text={" Marcar como pagada"} /></button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-slate-100 bg-slate-50 p-3"><p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">{label}</p><p className="mt-1 font-black text-slate-800">{value}</p></div>;
}

function FinancialMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</p><p className="mt-2 text-2xl font-black text-slate-950">{value}</p><p className="mt-1 text-xs font-semibold text-slate-500">{detail}</p></article>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-DO', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}
