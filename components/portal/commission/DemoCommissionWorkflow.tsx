'use client';
import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Clock3, Download, FileText } from 'lucide-react';
import { useWorkflow } from '@/lib/demo/use-workflow';
import { commissionAmount, documentNumber, updateWorkflowDeal, type WorkflowDeal } from '@/lib/demo/browser-workflow';
import { downloadCommissionDocument } from '@/lib/demo/commission-pdf';
import { formatCurrency } from '@/lib/utils';

const actionClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50';
export default function DemoCommissionWorkflow() {
  const { state, ready, error } = useWorkflow(); const [notice, setNotice] = useState(''); const [busy, setBusy] = useState('');
  const claims = state.deals.filter(deal => deal.claimRequestedAt);
  async function generate(deal: WorkflowDeal, kind: 'proforma' | 'factura') {
    setBusy(deal.id); setNotice('');
    try {
      const current = updateWorkflowDeal(deal.id, kind === 'proforma' ? 'proforma' : 'invoice').deals.find(item => item.id === deal.id)!;
      await downloadCommissionDocument(current, kind);
      setNotice(kind === 'proforma' ? 'Proforma generada y enviada a revisión.' : 'Factura final generada. Procesando pago de comisión.');
    } catch (cause) { setNotice(cause instanceof Error ? cause.message : 'No se pudo generar el documento.'); } finally { setBusy(''); }
  }
  return <div className="mx-auto max-w-5xl space-y-6 pb-12"><header><h1 className="text-3xl font-bold tracking-tight text-slate-950">Comisiones y pagos</h1><p className="mt-2 text-sm text-slate-600">Gestiona tus solicitudes, proformas, facturas y cobros.</p></header>
    {(notice || error) && <p role="status" className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">{error || notice}</p>}
    {!ready ? <p className="p-6 text-sm">Cargando solicitudes…</p> : !claims.length ? <section className="rounded-2xl border border-slate-200 bg-white p-8"><h2 className="text-lg font-semibold">Todavía no hay solicitudes de comisión</h2><p className="mt-2 text-sm text-slate-600">Abre la ficha del cliente, registra el pago y solicita tu comisión cuando el pago y la promesa estén confirmados.</p><Link href="/portal/clientes" className={`${actionClass} mt-5`}>Ir a clientes</Link></section> : claims.map(deal => <section key={deal.id} id={deal.id} className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
      <div className="flex flex-wrap justify-between gap-3"><div><h2 className="text-xl font-bold">{deal.projectName} · {deal.unitCode}</h2><Link href={`/portal/clientes/${deal.contactCode}`} className="mt-1 inline-block text-sm text-blue-900 underline underline-offset-4">{deal.clientName}</Link><p className="mt-1 text-sm text-slate-600">{deal.developer}</p></div><div className="text-right"><p className="text-sm text-slate-600">Comisión liberada · {deal.commissionRate}%</p><p className="mt-1 text-2xl font-bold tabular-nums">{formatCurrency(commissionAmount(deal), deal.currency)}</p></div></div>
      <ol className="mt-6 flex flex-wrap gap-x-6 gap-y-3 border-y border-slate-200 py-4 text-sm">{[['Pago confirmado', deal.paymentConfirmedAt], ['Promesa firmada', deal.promiseSignedAt], ['Proforma aprobada', deal.proformaApprovedAt], ['Factura recibida', deal.invoiceAt], ['Comisión pagada', deal.paidAt]].map(([label, at]) => <li key={label} className="flex items-center gap-2">{at ? <CheckCircle2 className="h-4 w-4 text-emerald-700" /> : <Clock3 className="h-4 w-4 text-slate-400" />}{label}</li>)}</ol>
      <div className="mt-5 space-y-3">
        {!deal.proformaAt && <><h3 className="font-bold">Generar proforma</h3><p className="text-sm text-slate-600">El pago del cliente y la promesa están confirmados. Genera el documento para solicitar tu comisión.</p><button disabled={busy === deal.id} onClick={() => { void generate(deal, 'proforma'); }} className={actionClass}><FileText className="h-4 w-4" />{busy === deal.id ? 'Generando…' : 'Generar y enviar proforma'}</button></>}
        {deal.proformaAt && !deal.proformaApprovedAt && <p role="status" className="text-sm font-semibold text-blue-900">Proforma enviada. En revisión por administración…</p>}
        {deal.proformaApprovedAt && !deal.invoiceAt && <><h3 className="font-bold text-emerald-800">Proforma aprobada · Factura final pendiente</h3><p className="text-sm text-slate-600">Genera tu factura final con comprobante fiscal y sello de administración.</p><button disabled={busy === deal.id} onClick={() => { void generate(deal, 'factura'); }} className={actionClass}><FileText className="h-4 w-4" />{busy === deal.id ? 'Generando…' : 'Generar factura final con comprobante fiscal'}</button></>}
        {deal.invoiceAt && !deal.paidAt && <p role="status" className="text-sm font-semibold text-blue-900">Factura final recibida. Validando documento y procesando pago de comisión…</p>}
        {deal.paidAt && <div className="flex items-center gap-3 text-emerald-800"><CheckCircle2 className="h-6 w-6" /><div><h3 className="font-bold">Comisión pagada</h3><p className="mt-1 text-sm">Transferencia confirmada · {formatCurrency(commissionAmount(deal), deal.currency)}</p></div></div>}
      </div>
      <div className="mt-5 flex flex-wrap gap-4">{(['proforma', 'factura'] as const).filter(kind => kind === 'proforma' ? deal.proformaAt : deal.invoiceAt).map(kind => <div key={kind} className="flex flex-wrap items-center gap-3 text-sm"><Link href={`/portal/comisiones/${deal.id}/${kind}`} target="_blank" className="font-semibold text-blue-900 underline underline-offset-4">Ver {documentNumber(deal, kind)}</Link><button className="inline-flex min-h-11 items-center gap-2 text-slate-700" onClick={() => { void downloadCommissionDocument(deal, kind).catch(cause => setNotice(cause.message)); }}><Download className="h-4 w-4" />Descargar PDF</button></div>)}</div>
    </section>)}
  </div>;
}
