'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useState, useTransition, useRef, useCallback } from 'react';
import { Paperclip, Send, ShieldCheck, Trash2, X } from 'lucide-react';
import { submitLeadReportAction, uploadLeadReportAttachmentsAction } from '@/app/portal/crm/actions';
import type { ContactLeadReport, LeadReportTarget } from '@/lib/data/crm';
import { formatPortalDate } from '@/lib/utils';
import { MAX_DOCUMENT_SIZE_BYTES, MAX_DOCUMENT_SIZE_LABEL } from '@/lib/storage/document-limits';

const statusLabel: Record<string, string> = { pending: 'En revisión', conflict: 'Requiere revisión', protected: 'Protegido', released: 'Rechazado', expired: 'Vencido' };
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function LeadReportingDialog({ contactId, contactName, targets, reports }: { contactId: number; contactName: string; targets: LeadReportTarget[]; reports: ContactLeadReport[] }) {
  const [open, setOpen] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [summary, setSummary] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [notice, setNotice] = useState('');
  const [pending, startTransition] = useTransition();
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const addFiles = useCallback((incoming: File[]) => {
    const valid = incoming.filter((f) => {
      if (!ALLOWED_TYPES.includes(f.type)) return false;
      if (f.size > MAX_DOCUMENT_SIZE_BYTES) return false;
      return true;
    });
    if (valid.length < incoming.length) {
      setNotice(`Algunos archivos fueron ignorados (solo PNG, JPG, WebP y PDF hasta ${MAX_DOCUMENT_SIZE_LABEL} cada uno).`);
    }
    const next = [...files];
    let exceededTotal = false;
    for (const file of valid) {
      if (next.length >= 10) break;
      if (next.reduce((total, item) => total + item.size, 0) + file.size > MAX_DOCUMENT_SIZE_BYTES) {
        exceededTotal = true;
        break;
      }
      next.push(file);
    }
    if (exceededTotal) setNotice(`Los adjuntos no pueden superar ${MAX_DOCUMENT_SIZE_LABEL} en total por envío.`);
    setFiles(next);
  }, [files]);

  const removeFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index));

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const pastedFiles = items
      .filter((item) => item.kind === 'file')
      .map((item) => item.getAsFile())
      .filter((f): f is File => f !== null);
    if (pastedFiles.length > 0) {
      e.preventDefault();
      addFiles(pastedFiles);
    }
  }, [addFiles]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length) addFiles(dropped);
  }, [addFiles]);

  const submit = () => startTransition(async () => {
    const result = await submitLeadReportAction(contactId, Number(projectId), summary, accepted);
    if (!result.success) return setNotice(result.error || 'No fue posible enviar el reporte.');

    if (files.length > 0 && result.reportId) {
      const fd = new FormData();
      files.forEach((f) => fd.append('files', f));
      const uploadResult = await uploadLeadReportAttachmentsAction(result.reportId, fd);
      if (uploadResult.error) {
        setNotice(`Reporte creado, pero error al subir archivos: ${uploadResult.error}`);
        return;
      }
    }

    setNotice(result.message || 'Reporte enviado.');
    setSummary(''); setAccepted(false); setProjectId(''); setFiles([]);
    setTimeout(() => window.location.reload(), 850);
  });

  return <>
    <button type="button" onClick={() => setOpen(true)} className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-xs font-bold text-emerald-800 hover:bg-emerald-100">
      <ShieldCheck className="h-4 w-4" /><LocalizedText text={" Reportar cliente"} /></button>
    {open && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4" role="dialog" aria-modal="true">
      <section className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-100 p-5">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700"><LocalizedText text={"Protección comercial"} /></p>
            <h2 className="mt-1 text-lg font-extrabold text-slate-950"><LocalizedText text={"Reportar a "} />{contactName}</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500"><LocalizedText text={"La protección de 180 días comienza únicamente cuando el reporte es validado."} /></p>
          </div>
          <UITranslationBoundary attributes={["aria-label"]}><button type="button" onClick={() => { setOpen(false); setFiles([]); }} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Cerrar"><X className="h-4 w-4" /></button></UITranslationBoundary>
        </header>

        <div className="space-y-4 p-5">
          <label className="block text-xs font-bold text-slate-700"><LocalizedText text={"Desarrolladora y desarrollo con acuerdo vigente"} /><select value={projectId} onChange={(event) => setProjectId(event.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500">
              <option value=""><LocalizedText text={"Selecciona un desarrollo"} /></option>
              {targets.map((target) => <option key={target.projectId} value={target.projectId}>{target.developerName} — {target.projectName}</option>)}
            </select>
          </label>

          {targets.length === 0 && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900"><LocalizedText text={"No hay acuerdos específicos activos para este cliente. Primero asigna un proyecto al contacto o formaliza el acuerdo correspondiente."} /></div>}

          <label className="block text-xs font-bold text-slate-700"><LocalizedText text={"¿Qué gestión comercial estás realizando?"} /><UITranslationBoundary attributes={["placeholder"]}><textarea
              ref={textareaRef}
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              onPaste={handlePaste}
              rows={5}
              maxLength={4000}
              placeholder="Explica el interés del cliente, contacto realizado, unidad o presupuesto conversado y el próximo paso. Puedes pegar imágenes con Ctrl+V."
              className="mt-1.5 w-full resize-y rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-emerald-500"
            /></UITranslationBoundary>
          </label>

          {/* File attachment zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`rounded-lg border-2 border-dashed p-3 transition ${dragOver ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Paperclip className="h-3.5 w-3.5" />
                <span><LocalizedText text={"Arrastra archivos aquí, pega con "} /><kbd className="rounded bg-slate-200 px-1 py-0.5 text-[10px] font-bold"><LocalizedText text={"Ctrl+V"} /></kbd><LocalizedText text={" o"} /></span>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="font-bold text-emerald-700 hover:text-emerald-800 underline"><LocalizedText text={"selecciona"} /></button>
              </div>
              <span className="text-[10px] text-slate-400"><LocalizedText text={"PNG, JPG, PDF · Máx "} />{MAX_DOCUMENT_SIZE_LABEL}<LocalizedText text={" por envío"} /></span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,application/pdf"
              className="hidden"
              onChange={(e) => { if (e.target.files) addFiles(Array.from(e.target.files)); e.target.value = ''; }}
            />

            {files.length > 0 && (
              <div className="mt-2 space-y-1">
                {files.map((file, idx) => (
                  <div key={`${file.name}-${idx}`} className="flex items-center justify-between rounded-md bg-white px-2 py-1.5 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      {file.type.startsWith('image/') ? (
                        <UITranslationBoundary attributes={["alt"]}><img src={URL.createObjectURL(file)} alt="" className="h-8 w-8 shrink-0 rounded object-cover" /></UITranslationBoundary>
                      ) : (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-red-50 text-[10px] font-bold text-red-600"><LocalizedText text={"PDF"} /></div>
                      )}
                      <span className="truncate font-medium text-slate-700">{file.name}</span>
                      <span className="shrink-0 text-slate-400">{formatSize(file.size)}</span>
                    </div>
                    <button type="button" onClick={() => removeFile(idx)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-700">
            <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-0.5 h-4 w-4 accent-emerald-600" />
            <span><LocalizedText text={"Confirmo que este cliente tiene interés real, que la información es veraz y que mantendré evidencia de mi gestión. Entiendo que un reporte sin trabajo comercial puede ser rechazado."} /></span>
          </label>

          {reports.length > 0 && (
            <div className="border-t border-slate-100 pt-4">
              <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400"><LocalizedText text={"Reportes de este cliente"} /></p>
              <div className="space-y-2">
                {reports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-800">{report.developerName} · {report.projectName}</p>
                      <p className="text-[10px] text-slate-500">{report.protectedUntil ? `Hasta ${formatPortalDate(report.protectedUntil)}` : formatPortalDate(report.createdAt)}</p>
                      <p className="mt-1 font-mono text-[10px] font-bold tracking-wide text-slate-400">{report.publicCode}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-bold text-slate-600">{statusLabel[report.status] || report.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {notice && <p className="text-xs font-semibold text-slate-700">{notice}</p>}
        </div>

        <footer className="flex justify-end gap-2 border-t border-slate-100 p-4">
          <button type="button" onClick={() => { setOpen(false); setFiles([]); }} className="h-10 rounded-lg px-4 text-xs font-bold text-slate-600 hover:bg-slate-100"><LocalizedText text={"Cancelar"} /></button>
          <button type="button" disabled={pending || !projectId || summary.trim().length < 30 || !accepted} onClick={submit} className="inline-flex h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-xs font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
            <Send className="h-3.5 w-3.5" /> {pending ? 'Enviando...' : files.length > 0 ? `Enviar reporte (${files.length} archivo${files.length > 1 ? 's' : ''})` : <LocalizedText text={"Enviar reporte"} />}
          </button>
        </footer>
      </section>
    </div>}
  </>;
}
