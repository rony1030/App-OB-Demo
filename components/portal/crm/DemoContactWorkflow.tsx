'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, FileText, Upload, Clock3 } from 'lucide-react';
import type { ContactDetail, ContactSummary } from '@/lib/data/crm';
import type { PortalProject } from '@/lib/portal-projects';
import { formatCurrency } from '@/lib/utils';
import { useWorkflow } from '@/lib/demo/use-workflow';
import { changeWorkflow, contactDetail, saveWorkflowContact, saveWorkflowFile, openWorkflowFile, updateWorkflowDeal, commissionAmount, type WorkflowDeal } from '@/lib/demo/browser-workflow';

const inputClass = 'h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm focus:border-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-100';
const buttonClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50';

export default function DemoContactWorkflow({ code, seed, projects }: { code: string; seed: ContactSummary[]; projects: PortalProject[] }) {
  const { state, ready, error } = useWorkflow();
  const [projectId, setProjectId] = useState(''); const [unitId, setUnitId] = useState('');
  const [notice, setNotice] = useState(''); const [busy, setBusy] = useState(false);
  const [docType, setDocType] = useState('Identidad'); const [note, setNote] = useState('');
  const [activity, setActivity] = useState(''); const [activityKind, setActivityKind] = useState<'call' | 'meeting' | 'task'>('call');
  const local = state.contacts.find(item => item.publicCode === code);
  const original = seed.find(item => item.publicCode === code);
  const contact = local || (original ? contactDetail(original) : null);
  const project = projects.find(item => String(item.id) === projectId) || projects.find(item => item.name === contact?.customFields.project) || projects[0];
  const unit = project?.units.find(item => item.id === unitId);
  const deals = state.deals.filter(item => item.contactId === contact?.id);
  const proposals = state.proposals.filter(item => (item.snapshot as Record<string, unknown> | undefined)?.contact_id === contact?.id);
  function run(action: () => void) { try { action(); setNotice('Cambios guardados.'); } catch (cause) { setNotice(cause instanceof Error ? cause.message : 'No se pudo guardar.'); } }
  function updateContact(update: (draft: ContactDetail) => void) {
    if (!contact) return; const draft = structuredClone(contact); update(draft); draft.updatedAt = new Date().toISOString(); saveWorkflowContact(draft);
  }
  if (!ready) return <p className="p-8 text-sm text-slate-600">Cargando expediente…</p>;
  if (!contact) return <div className="space-y-4 p-8"><h1 className="text-2xl font-bold">Contacto no encontrado</h1><Link href="/portal/clientes">Volver a clientes</Link></div>;
  return <div className="mx-auto max-w-6xl space-y-6 pb-12">
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-4"><Link href="/portal/clientes" aria-label="Volver a clientes" className="rounded-xl border border-slate-200 p-3"><ArrowLeft className="h-5 w-5" /></Link><div><h1 className="text-2xl font-bold text-slate-950">{contact.fullName}</h1><p className="mt-1 text-sm text-slate-600">{contact.publicCode} · {contact.classification} · {contact.phone}</p><p className="text-sm text-slate-600">{contact.email}</p></div></div>
      <Link href={`/portal/proposals/new?contactId=${contact.id}`} className={buttonClass}><FileText className="h-4 w-4" />Crear propuesta</Link>
    </header>
    {(notice || error) && <p role="status" className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">{error || notice}</p>}
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-950">Negociaciones</h2><p className="mt-1 text-sm text-slate-600">Selecciona el proyecto y la unidad para iniciar el proceso comercial.</p>
          <form onSubmit={event => { event.preventDefault(); run(() => {
            if (!project || !unit) throw new Error('Selecciona una unidad disponible.');
            if (state.deals.some(item => item.projectId === project.id && item.unitId === unit.id)) throw new Error('Esta unidad ya tiene una negociación activa.');
            const id = String(Date.now()); const reservedAt = new Date().toISOString();
            const deal: WorkflowDeal = { id, contactId: contact.id, contactCode: contact.publicCode, clientName: contact.fullName, projectId: project.id, projectSlug: project.slug, projectName: project.name, developer: project.developer, unitId: unit.id, unitCode: unit.unit, price: unit.price, currency: unit.currency || 'USD', commissionRate: project.commission || 5, reservedAt };
            changeWorkflow(current => { current.deals.unshift(deal); });
            updateContact(draft => { draft.primaryOpportunity = { id: Number(id), publicCode: `OPP-${id.slice(-6)}`, stage: 'reservation', priority: 'high', budgetMin: unit.price, budgetMax: unit.price, currency: deal.currency, projectName: project.name }; });
          }); }} className="mt-5 space-y-3">
            <label className="block text-sm font-semibold text-slate-700">Proyecto<select aria-label="Proyecto de la negociación" value={String(project?.id || '')} onChange={event => { setProjectId(event.target.value); setUnitId(''); }} className={`${inputClass} mt-1`}>{projects.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
            <label className="block text-sm font-semibold text-slate-700">Unidad<select required aria-label="Unidad de la negociación" value={unitId} onChange={event => setUnitId(event.target.value)} className={`${inputClass} mt-1`}><option value="">Seleccionar unidad</option>{project?.units.filter(item => item.status === 'Disponible' && !state.deals.some(deal => deal.projectId === project.id && deal.unitId === item.id)).map(item => <option key={item.id} value={item.id}>{item.unit} · {formatCurrency(item.price, item.currency || 'USD')}</option>)}</select></label>
            <button className={buttonClass}>Crear negociación y reservar unidad</button>
          </form>
          {deals.map(deal => <DealProcess key={deal.id} deal={deal} onNotice={setNotice} />)}
        </section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-bold">Propuestas del cliente</h2>{proposals.length ? <div className="mt-4 divide-y divide-slate-100">{proposals.map(item => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-semibold">{item.projectName}</p><p className="text-sm text-slate-600">{item.title}</p></div><Link className="text-sm font-semibold text-blue-900 underline underline-offset-4" href={item.sharedUrl || '#'} target="_blank">Abrir propuesta</Link></div>)}</div> : <p className="mt-3 text-sm text-slate-600">Crea una propuesta con las unidades que le interesan al cliente.</p>}</section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-bold">Seguimiento</h2>
          <form className="mt-4 space-y-3" onSubmit={event => { event.preventDefault(); run(() => updateContact(draft => { draft.notes.unshift({ id: Date.now(), body: note, createdAt: new Date().toISOString(), createdByName: 'Equipo comercial' }); })); setNote(''); }}><label className="block text-sm font-semibold">Nota interna<textarea required value={note} onChange={event => setNote(event.target.value)} className="mt-1 min-h-24 w-full rounded-xl border border-slate-300 p-3 text-sm" /></label><button className={buttonClass}>Guardar nota</button></form>
          <form className="mt-5 space-y-3 border-t border-slate-200 pt-5" onSubmit={event => { event.preventDefault(); run(() => updateContact(draft => { draft.activities.unshift({ id: Date.now(), kind: activityKind, subject: activity, details: null, dueAt: null, completedAt: null, createdAt: new Date().toISOString() }); })); setActivity(''); }}><label className="block text-sm font-semibold">Tipo de actividad<select value={activityKind} onChange={event => setActivityKind(event.target.value as typeof activityKind)} className={`${inputClass} mt-1`}><option value="call">Llamada</option><option value="meeting">Reunión</option><option value="task">Tarea</option></select></label><label className="block text-sm font-semibold">Asunto<input required value={activity} onChange={event => setActivity(event.target.value)} className={`${inputClass} mt-1`} /></label><button className={buttonClass}>Registrar actividad</button></form>
          <ul className="mt-5 divide-y divide-slate-100">{contact.activities.map(item => <li key={item.id} className="flex items-center justify-between gap-3 py-3 text-sm"><span>{item.subject}</span>{item.kind === 'task' && <button className="font-semibold text-blue-900" onClick={() => run(() => updateContact(draft => { const task = draft.activities.find(value => value.id === item.id); if (task) task.completedAt = task.completedAt ? null : new Date().toISOString(); }))}>{item.completedAt ? 'Completada' : 'Completar'}</button>}</li>)}{contact.notes.map(item => <li key={item.id} className="py-3 text-sm text-slate-700">{item.body}</li>)}</ul>
        </section>
      </div>
      <aside className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-bold">Expediente del cliente</h2><p className="mt-1 text-sm text-slate-600">Identidad, documentos y comprobantes asociados a la negociación.</p><label className="mt-4 block text-sm font-semibold">Tipo de documento<select value={docType} onChange={event => setDocType(event.target.value)} className={`${inputClass} mt-1`}><option>Identidad</option><option>Comprobante de fondos</option><option>Promesa de compraventa</option><option>Comprobante de pago</option></select></label><label className={`${buttonClass} mt-3 w-full cursor-pointer`}><Upload className="h-4 w-4" />{busy ? 'Guardando…' : 'Subir documento'}<input type="file" className="sr-only" disabled={busy} accept="application/pdf,image/png,image/jpeg,image/webp" onChange={async event => { const file = event.target.files?.[0]; if (!file) return; setBusy(true); try { await saveWorkflowFile(contact.id, file, docType); setNotice('Documento agregado al expediente.'); } catch (cause) { setNotice(cause instanceof Error ? cause.message : 'No se pudo guardar el documento.'); } finally { setBusy(false); } }} /></label><p className="mt-2 text-xs text-slate-600">PDF o imagen · Hasta 10 MB</p><div className="mt-4 divide-y divide-slate-100">{(state.documents[String(contact.id)] || []).map(item => <button key={item.id} onClick={() => { void openWorkflowFile(item.id).catch(cause => setNotice(cause.message)); }} className="block w-full py-3 text-left text-sm text-blue-900"><span className="block truncate font-semibold">{item.name}</span><span className="text-xs text-slate-600">{item.type}</span></button>)}</div></section>
        <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-bold">Registro y protección</h2><p className="mt-2 text-sm text-slate-600">Cliente registrado. La protección comercial se confirma al vincularlo al proyecto.</p><p className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-800"><CheckCircle2 className="h-4 w-4" />Protección de 180 días activa</p></section>
      </aside>
    </div>
  </div>;
}

function DealProcess({ deal, onNotice }: { deal: WorkflowDeal; onNotice: (notice: string) => void }) {
  const [amount, setAmount] = useState(String(Math.round(deal.price * .2)));
  const [reference, setReference] = useState(''); const [receipt, setReceipt] = useState<File | null>(null); const [busy, setBusy] = useState(false);
  return <div className="mt-6 border-t border-slate-200 pt-5"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold text-slate-950">{deal.projectName} · {deal.unitCode}</h3><span className="text-sm font-semibold text-slate-600">{formatCurrency(deal.price, deal.currency)}</span></div>
    <ol className="my-4 space-y-2 text-sm text-slate-700">{[['Unidad reservada', deal.reservedAt], ['Pago confirmado por la desarrolladora', deal.paymentConfirmedAt], ['Promesa de compraventa firmada', deal.promiseSignedAt], ['Comisión solicitada', deal.claimRequestedAt]].map(([label, at]) => <li key={label} className="flex items-center gap-2">{at ? <CheckCircle2 className="h-4 w-4 text-emerald-700" /> : <Clock3 className="h-4 w-4 text-slate-400" />}{label}</li>)}</ol>
    {!deal.paymentReportedAt && <form className="space-y-3" onSubmit={async event => { event.preventDefault(); setBusy(true); try { const document = receipt ? await saveWorkflowFile(deal.contactId, receipt, 'Comprobante de pago') : undefined; updateWorkflowDeal(deal.id, 'report_payment', { amount: Number(amount), reference, receiptId: document?.id }); onNotice('Pago reportado. Verificando comprobante y promesa de compraventa…'); } catch (cause) { onNotice(cause instanceof Error ? cause.message : 'No se pudo reportar el pago.'); } finally { setBusy(false); } }}><label className="block text-sm font-semibold">Monto pagado por el cliente ({deal.currency})<input type="number" min="0.01" max={deal.price} step="0.01" required value={amount} onChange={event => setAmount(event.target.value)} className={`${inputClass} mt-1`} /></label><label className="block text-sm font-semibold">Referencia bancaria<input value={reference} onChange={event => setReference(event.target.value)} className={`${inputClass} mt-1`} /></label><label className="block text-sm font-semibold">Comprobante de pago (opcional)<input type="file" accept="application/pdf,image/png,image/jpeg,image/webp" className="mt-2 block w-full text-xs" onChange={event => setReceipt(event.target.files?.[0] || null)} /></label><button disabled={busy} className={buttonClass}>{busy ? 'Registrando…' : 'El cliente pagó · Enviar a verificación'}</button></form>}
    {deal.paymentReportedAt && !deal.paymentConfirmedAt && <p role="status" className="text-sm text-blue-900">Verificando pago y firma de promesa…</p>}
    {deal.paymentConfirmedAt && !deal.claimRequestedAt && <div className="space-y-3"><p className="text-sm text-emerald-800">Pago y promesa confirmados. Comisión disponible: {formatCurrency(commissionAmount(deal), deal.currency)}.</p><button className={buttonClass} onClick={() => { try { updateWorkflowDeal(deal.id, 'request_claim'); onNotice('Comisión solicitada. Ya puedes generar tu proforma.'); } catch (cause) { onNotice(cause instanceof Error ? cause.message : 'No se pudo solicitar.'); } }}>Solicitar pago de comisión</button></div>}
    {deal.claimRequestedAt && <Link href={`/portal/comisiones#${deal.id}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-blue-900 underline underline-offset-4">Continuar con proforma y factura</Link>}
  </div>;
}
