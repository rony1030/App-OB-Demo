'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useState, useTransition } from 'react';
import { ExternalLink, FileCheck2, FileUp } from 'lucide-react';
import type { ClientDocument } from '@/lib/data/crm';
import { getClientDocumentUrlAction, uploadClientDocumentAction } from '@/app/portal/crm/client-document-actions';
import { formatPortalDate } from '@/lib/utils';

const labels: Record<string, string> = {
  id_card: 'Identidad',
  proof_of_funds: 'Comprobante de fondos',
  contract: 'Contrato',
  payment_receipt: 'Comprobante de pago',
  other: 'Otro',
};

export default function ClientDocumentsPanel({ contactId, documents }: { contactId: number; documents: ClientDocument[] }) {
  const [items] = useState(documents);
  const [type, setType] = useState('id_card');
  const [title, setTitle] = useState('');
  const [notice, setNotice] = useState('');
  const [pending, startTransition] = useTransition();

  const upload = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    startTransition(async () => {
      const result = await uploadClientDocumentAction(contactId, data);
      if (result.error) { setNotice(result.error); return; }
      setNotice('Documento agregado al expediente.');
      setTitle('');
      form.reset();
      setType('id_card');
      window.location.reload();
    });
  };

  const open = (document: ClientDocument) => startTransition(async () => {
    const result = await getClientDocumentUrlAction(document.id, contactId);
    if (result.url) window.open(result.url, '_blank', 'noopener,noreferrer');
    else setNotice(result.error || 'No fue posible abrir el documento.');
  });

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400"><LocalizedText text={"Expediente"} /></p><h2 className="mt-1 text-base font-extrabold text-slate-950"><LocalizedText text={"Documentos del cliente"} /></h2><p className="mt-1 text-xs text-slate-500"><LocalizedText text={"Se conservan en el perfil y luego pueden asociarse a una reserva."} /></p></div>
        <FileCheck2 className="h-5 w-5 text-blue-700" />
      </div>
      <form onSubmit={upload} className="mt-4 grid gap-2 md:grid-cols-[150px_1fr_auto]">
        <select name="documentType" value={type} onChange={(e) => setType(e.target.value)} className="h-10 rounded-lg border border-slate-200 bg-white px-2 text-xs"><option value="id_card"><LocalizedText text={"Identidad"} /></option><option value="proof_of_funds"><LocalizedText text={"Comprobante de fondos"} /></option><option value="contract"><LocalizedText text={"Contrato"} /></option><option value="payment_receipt"><LocalizedText text={"Comprobante de pago"} /></option><option value="other"><LocalizedText text={"Otro"} /></option></select>
        <UITranslationBoundary attributes={["placeholder"]}><input name="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título opcional del documento" className="h-10 rounded-lg border border-slate-200 px-3 text-xs" /></UITranslationBoundary>
        <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-xs font-bold text-white hover:bg-slate-800"><FileUp className="h-3.5 w-3.5" /><LocalizedText text={" Subir"} /><input name="file" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" required className="hidden" onChange={(e) => { if (e.target.files?.[0]) e.currentTarget.form?.requestSubmit(); }} /></label>
      </form>
      {notice && <p className="mt-3 text-xs font-semibold text-blue-700">{notice}</p>}
      <div className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
        {items.length === 0 ? <p className="py-5 text-center text-xs text-slate-400"><LocalizedText text={"Todavía no hay documentos en este expediente."} /></p> : items.map((document) => <div key={document.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-xs font-bold text-slate-900">{document.title}</p><p className="mt-0.5 text-[10px] text-slate-500">{labels[document.documentType] || 'Documento'} · {formatPortalDate(document.createdAt)}</p><p className="mt-1 font-mono text-[10px] font-bold tracking-wide text-slate-400">{document.publicCode}</p></div><UITranslationBoundary attributes={["title"]}><button type="button" onClick={() => open(document)} disabled={pending} title="Abrir documento" className="shrink-0 rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"><ExternalLink className="h-3.5 w-3.5" /></button></UITranslationBoundary></div>)}
      </div>
    </section>
  );
}
