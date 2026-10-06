'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useActionState, useTransition } from 'react';
import { Download, FileText, RefreshCcw, Upload } from 'lucide-react';
import {
  getAgencyDocumentUrlAction,
  uploadAgencyDocumentAction,
} from '@/app/portal/agency/actions';
import {
  ORGANIZATION_DOCUMENT_TYPE_LABELS,
  formatOrganizationDocumentDate,
  organizationDocumentState,
  type OrganizationDocument,
  type OrganizationDocumentType,
} from '@/lib/agency-documents-constants';
import { cn } from '@/lib/utils';

const statusCopy: Record<string, { label: string; className: string }> = {
  requested: { label: 'Solicitado', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  submitted: { label: 'Subido', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  approved: { label: 'Vigente', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Rechazado', className: 'bg-rose-50 text-rose-700 border-rose-200' },
  expired: { label: 'Vencido', className: 'bg-red-50 text-red-700 border-red-200' },
};

export default function AgencySettings({
  organizationName,
  documents,
}: {
  organizationName: string;
  documents: OrganizationDocument[];
}) {
  const [state, formAction, pending] = useActionState(uploadAgencyDocumentAction, null);
  const [opening, startOpening] = useTransition();

  function openDocument(id: number) {
    startOpening(async () => {
      const res = await getAgencyDocumentUrlAction(id);
      if (res.url) window.open(res.url, '_blank', 'noopener,noreferrer');
      if (res.error) alert(res.error);
    });
  }

  return (
    <div className="portal-enter space-y-6">
      <section>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-600"><LocalizedText text={"Configuración de agencia"} /></p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-950">{organizationName}</h1>
        <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500"><LocalizedText text={"Documentos corporativos de la agencia, renovaciones y requisitos pendientes."} /></p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.4fr]">
        <form action={formAction} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <Upload className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-extrabold text-slate-950"><LocalizedText text={"Subir documento"} /></h2>
              <p className="text-[11px] text-slate-500"><LocalizedText text={"PDF, imagen u Office. Máximo 50 MB."} /></p>
            </div>
          </div>

          <label className="block">
            <span className="mb-1 block text-[11px] font-bold text-slate-700"><LocalizedText text={"Tipo"} /></span>
            <select name="documentType" className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-blue-400">
              {(Object.keys(ORGANIZATION_DOCUMENT_TYPE_LABELS) as OrganizationDocumentType[]).map((key) => (
                <option key={key} value={key}>{ORGANIZATION_DOCUMENT_TYPE_LABELS[key]}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-bold text-slate-700"><LocalizedText text={"Título"} /></span>
            <UITranslationBoundary attributes={["placeholder"]}><input name="title" required placeholder="Ej. Registro mercantil renovado" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-blue-400" /></UITranslationBoundary>
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-bold text-slate-700"><LocalizedText text={"Vence"} /></span>
            <input name="expiresAt" type="date" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-blue-400" />
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-bold text-slate-700"><LocalizedText text={"Archivo"} /></span>
            <input name="file" required type="file" className="block w-full rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-xs text-slate-600" />
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-bold text-slate-700"><LocalizedText text={"Nota interna"} /></span>
            <UITranslationBoundary attributes={["placeholder"]}><textarea name="notes" rows={3} placeholder="Ej. Renovación solicitada por administración." className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-400" /></UITranslationBoundary>
          </label>

          {state?.error && <p className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700">{state.error}</p>}
          {state?.success && <p className="rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700"><LocalizedText text={"Documento guardado."} /></p>}

          <button disabled={pending} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-xs font-extrabold text-white disabled:opacity-60">
            {pending ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}<LocalizedText text={"Guardar documento"} /></button>
        </form>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <div>
              <h2 className="text-sm font-extrabold text-slate-950"><LocalizedText text={"Archivo de agencia"} /></h2>
              <p className="mt-1 text-[11px] text-slate-500">{documents.length}<LocalizedText text={" documento(s) registrados."} /></p>
            </div>
            <FileText className="h-5 w-5 text-blue-600" />
          </div>

          {documents.length === 0 ? (
            <p className="p-8 text-center text-xs text-slate-400"><LocalizedText text={"Todavía no hay documentos de agencia."} /></p>
          ) : (
            <div className="divide-y divide-slate-100">
              {documents.map((doc) => {
                const stateKey = organizationDocumentState(doc.status, doc.expiresAt);
                const badge = statusCopy[stateKey] || statusCopy.submitted;
                return (
                  <div key={doc.id} className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div>
                      <p className="text-xs font-extrabold text-slate-950">{doc.title}</p>
                      <p className="mt-1 text-[10px] font-semibold text-slate-500">
                        {ORGANIZATION_DOCUMENT_TYPE_LABELS[doc.documentType] || 'Documento'}{doc.expiresAt ? ` · vence ${formatOrganizationDocumentDate(doc.expiresAt)}` : ''}
                      </p>
                      {doc.notes && <p className="mt-1 text-[10px] text-slate-400">{doc.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn('rounded-lg border px-2.5 py-1 text-[9px] font-extrabold uppercase', badge.className)}>{badge.label}</span>
                      <button
                        type="button"
                        disabled={opening || !doc.storagePath}
                        onClick={() => openDocument(doc.id)}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-[10px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                      >
                        <Download className="h-3.5 w-3.5" /><LocalizedText text={"Abrir"} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
