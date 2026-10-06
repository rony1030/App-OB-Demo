'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useState, useTransition } from 'react';
import { CheckCircle2, ShieldAlert, XCircle } from 'lucide-react';
import { resolveLeadConflictAction } from '@/app/portal/crm/actions';
import { formatPortalDateTime } from '@/lib/utils';

type LeadConflict = {
  id: number;
  contactId: number;
  contactName: string;
  contactReference: string;
  agencyName: string;
  agentName: string;
  createdAt: string;
};

export default function LeadConflictPanel({ initialConflicts }: { initialConflicts: LeadConflict[] }) {
  const [conflicts, setConflicts] = useState(initialConflicts);
  const [reasonById, setReasonById] = useState<Record<number, string>>({});
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState('');

  const resolve = (conflict: LeadConflict, decision: 'approve' | 'reject') => {
    const reason = reasonById[conflict.id]?.trim() || '';
    if (reason.length < 5) {
      setNotice('Escribe una razón de al menos cinco caracteres antes de resolver el conflicto.');
      return;
    }
    startTransition(async () => {
      const result = await resolveLeadConflictAction(conflict.id, decision, reason);
      if (!result.success) {
        setNotice(result.error || 'No se pudo resolver el conflicto.');
        return;
      }
      setConflicts((current) => current.filter((item) => item.id !== conflict.id));
      setNotice(decision === 'approve' ? 'Lead aprobado y protegido. Se notificó al agente.' : 'Lead liberado. Se notificó al agente con la razón indicada.');
    });
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-xs">
      <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-amber-600" /><h2 className="text-sm font-extrabold text-slate-950"><LocalizedText text={"Reportes de clientes por validar"} /></h2></div>
          <p className="mt-1 text-xs text-slate-500"><LocalizedText text={"Revisa la gestión antes de activar los 180 días. Los datos de otra agencia no se exponen."} /></p>
        </div>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-[10px] font-extrabold text-amber-700">{conflicts.length}<LocalizedText text={" pendientes"} /></span>
      </div>

      <div className="divide-y divide-slate-100">
        {conflicts.map((conflict) => (
          <article key={conflict.id} className="grid gap-4 px-5 py-4 xl:grid-cols-[minmax(0,1fr)_minmax(260px,0.8fr)] xl:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2"><p className="text-xs font-extrabold text-slate-900">{conflict.contactName}</p><span className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-500">{conflict.contactReference}</span></div>
              <p className="mt-1 text-[11px] text-slate-500"><LocalizedText text={"Reportado por "} />{conflict.agentName} · {conflict.agencyName} · {formatPortalDateTime(conflict.createdAt)}</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <UITranslationBoundary attributes={["placeholder"]}><input value={reasonById[conflict.id] || ''} onChange={(event) => setReasonById((current) => ({ ...current, [conflict.id]: event.target.value }))} placeholder="Motivo de la decisión" className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-500" /></UITranslationBoundary>
              <button type="button" disabled={isPending} onClick={() => resolve(conflict, 'approve')} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white disabled:opacity-60"><CheckCircle2 className="h-3.5 w-3.5" /><LocalizedText text={" Aprobar"} /></button>
              <button type="button" disabled={isPending} onClick={() => resolve(conflict, 'reject')} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 text-xs font-bold text-rose-700 disabled:opacity-60"><XCircle className="h-3.5 w-3.5" /><LocalizedText text={" Rechazar"} /></button>
            </div>
          </article>
        ))}
        {conflicts.length === 0 && <p className="px-5 py-8 text-center text-xs text-slate-500"><LocalizedText text={"No hay conflictos pendientes. Los nuevos reportes se están protegiendo correctamente."} /></p>}
      </div>
      {notice && <p className="border-t border-slate-100 px-5 py-3 text-xs font-semibold text-slate-600">{notice}</p>}
    </section>
  );
}
