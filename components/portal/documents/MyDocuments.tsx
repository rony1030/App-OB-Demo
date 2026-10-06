'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useActionState, useRef, useState } from 'react';
import { CalendarClock, Download, FileUp, Loader2, Paperclip, Upload } from 'lucide-react';
import type { AgreementSummary } from '@/lib/data/agreements';
import type { BrokerDocument } from '@/lib/data/broker-documents';
import { DOCUMENT_TYPE_LABELS } from '@/lib/broker-documents-constants';
import { uploadBrokerDocumentAction, getBrokerDocumentSignedUrlAction } from '@/app/portal/documentos/actions';
import Link from 'next/link';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatPortalDate } from '@/lib/utils';

import AgreementActions from '@/components/portal/agreements/AgreementActions';

export default function MyDocuments({ agreements, documents }: { agreements: AgreementSummary[]; documents: BrokerDocument[] }) {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4">
          <h2 className="text-sm font-extrabold text-slate-900"><LocalizedText text={"Acuerdos de colaboración"} /></h2>
        </div>
        {agreements.length === 0 ? (
          <p className="p-6 text-center text-xs text-slate-400"><LocalizedText text={"Todavía no tienes acuerdos."} /></p>
        ) : (
          <div className="divide-y divide-slate-100">
            {agreements.map((agreement) => (
              <div key={agreement.id} className="grid gap-2 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    {agreement.kind === 'project_specific' && agreement.project ? agreement.project.name : 'Acuerdo general'}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500">
                    <CalendarClock className="h-3 w-3" />
                    {agreement.expiresAt
                      ? `Vence ${formatPortalDate(agreement.expiresAt, { day: 'numeric', month: 'short', year: 'numeric' })}`
                      : <LocalizedText text={"Sin firmar todavía"} />}
                  </p>
                </div>
                <StatusBadge status={agreement.state} />
                <AgreementActions publicCode={agreement.publicCode} state={agreement.state} />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <UploadDocumentForm />
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-4">
            <h2 className="text-sm font-extrabold text-slate-900"><LocalizedText text={"Mis documentos"} /></h2>
          </div>
          {documents.length === 0 ? (
            <p className="p-6 text-center text-xs text-slate-400"><LocalizedText text={"No has subido documentos todavía."} /></p>
          ) : (
            <div className="divide-y divide-slate-100">
              {documents.map((doc) => (
                <DocumentRow key={doc.id} doc={doc} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function DocumentRow({ doc }: { doc: BrokerDocument }) {
  const [loading, setLoading] = useState(false);

  async function openDocument() {
    setLoading(true);
    const result = await getBrokerDocumentSignedUrlAction(doc.storagePath);
    setLoading(false);
    if (result.url) window.open(result.url, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="grid gap-2 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
      <div>
        <p className="text-xs font-bold text-slate-900">{doc.title}</p>
        <p className="mt-1 text-[10px] text-slate-500">
          {DOCUMENT_TYPE_LABELS[doc.documentType]}
          {doc.expiresAt && ` · Vence ${formatPortalDate(doc.expiresAt, { day: 'numeric', month: 'short', year: 'numeric' })}`}
        </p>
      </div>
      <StatusBadge status={doc.state} />
      <button type="button" onClick={openDocument} disabled={loading} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 text-[10px] font-bold text-slate-600">
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}<LocalizedText text={" Ver"} /></button>
    </div>
  );
}

type ActionState = { success?: boolean; error?: string };

function UploadDocumentForm() {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(uploadBrokerDocumentAction, {});
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>('');

  return (
    <form action={formAction} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <FileUp className="h-4 w-4 text-blue-600" />
        <h3 className="text-sm font-extrabold text-slate-900"><LocalizedText text={"Subir documento"} /></h3>
      </div>
      <div>
        <label className="mb-1 block text-[11px] font-bold text-slate-700"><LocalizedText text={"Tipo"} /></label>
        <select name="documentType" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-400">
          {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-[11px] font-bold text-slate-700"><LocalizedText text={"Título"} /></label>
        <UITranslationBoundary attributes={["placeholder"]}><input name="title" required placeholder="Ej. Licencia 2026" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-400" /></UITranslationBoundary>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-[11px] font-bold text-slate-700"><LocalizedText text={"Emitido"} /></label>
          <input type="date" name="issuedAt" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-400" />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-bold text-slate-700"><LocalizedText text={"Vence"} /></label>
          <input type="date" name="expiresAt" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-400" />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-[11px] font-bold text-slate-700"><LocalizedText text={"Archivo"} /></label>
        <input
          ref={fileRef}
          type="file"
          name="file"
          required
          accept="application/pdf,image/*"
          className="hidden"
          onChange={(e) => setFileName(e.target.files?.[0]?.name || '')}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex h-10 w-full items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 text-xs text-slate-600 hover:border-blue-400 hover:bg-blue-50 transition cursor-pointer"
        >
          <Paperclip className="h-3.5 w-3.5 text-slate-400" />
          <span className={fileName ? 'text-slate-900 font-medium truncate' : 'text-slate-400'}>
            {fileName || 'Seleccionar archivo...'}
          </span>
        </button>
      </div>
      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700">{state.error}</p>}
      {state.success && <p className="rounded-lg bg-green-50 px-3 py-2 text-[11px] font-semibold text-green-700"><LocalizedText text={"Documento subido."} /></p>}
      <button type="submit" disabled={isPending} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-xs font-bold text-white disabled:opacity-60">
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}<LocalizedText text={" Subir"} /></button>
    </form>
  );
}
