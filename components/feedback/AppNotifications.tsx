'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { useEffect, useState } from 'react';

type NoticeKind = 'info' | 'error' | 'success';
type Notice = { id: number; message: string; kind: NoticeKind };
type Confirmation = { message: string; resolve: (accepted: boolean) => void };

let showNotice: ((message: string, kind?: NoticeKind) => void) | null = null;
let askConfirmation: ((message: string) => Promise<boolean>) | null = null;

export function notify(message: string, kind: NoticeKind = 'info') {
  showNotice?.(message, kind);
}

export function requestConfirmation(message: string) {
  return askConfirmation ? askConfirmation(message) : Promise.resolve(false);
}

const presentation = {
  info: { icon: Info, iconClass: 'bg-blue-50 text-blue-700', label: 'Aviso' },
  error: { icon: AlertCircle, iconClass: 'bg-rose-50 text-rose-700', label: 'Atención' },
  success: { icon: CheckCircle2, iconClass: 'bg-emerald-50 text-emerald-700', label: 'Listo' },
};

export default function AppNotifications() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  useEffect(() => {
    const nativeAlert = window.alert;
    showNotice = (message, kind = 'info') => {
      const id = Date.now() + Math.random();
      setNotices((current) => [...current, { id, message, kind }]);
      window.setTimeout(() => setNotices((current) => current.filter((notice) => notice.id !== id)), 6000);
    };
    askConfirmation = (message) => new Promise<boolean>((resolve) => setConfirmation({ message, resolve }));
    window.alert = (message?: unknown) => showNotice?.(String(message ?? ''), 'error');

    return () => {
      window.alert = nativeAlert;
      showNotice = null;
      askConfirmation = null;
    };
  }, []);

  function closeConfirmation(accepted: boolean) {
    confirmation?.resolve(accepted);
    setConfirmation(null);
  }

  return (
    <>
      <div className="pointer-events-none fixed right-4 top-4 z-[200] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
        {notices.map((notice) => {
          const style = presentation[notice.kind];
          const Icon = style.icon;
          return <div key={notice.id} role="status" className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_14px_34px_rgba(15,23,42,0.16)]">
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${style.iconClass}`}><Icon className="h-4 w-4" /></span>
            <div className="min-w-0 flex-1 pt-0.5"><p className="text-xs font-extrabold text-slate-950">{style.label}</p><p className="mt-1 text-sm leading-5 text-slate-600">{notice.message}</p></div>
            <UITranslationBoundary attributes={["aria-label"]}><button type="button" onClick={() => setNotices((current) => current.filter((item) => item.id !== notice.id))} aria-label="Cerrar aviso" className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"><X className="h-4 w-4" /></button></UITranslationBoundary>
          </div>;
        })}
      </div>
      {confirmation && <div className="fixed inset-0 z-[210] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-[2px]" role="presentation">
        <section role="alertdialog" aria-modal="true" aria-labelledby="confirmation-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.3)]">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-amber-700"><TriangleAlert className="h-5 w-5" /></span>
          <h2 id="confirmation-title" className="mt-5 text-lg font-extrabold tracking-tight text-slate-950"><LocalizedText text={"Confirmar acción"} /></h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{confirmation.message}</p>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => closeConfirmation(false)} className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-50"><LocalizedText text={"Cancelar"} /></button>
            <button type="button" autoFocus onClick={() => closeConfirmation(true)} className="h-10 rounded-xl bg-[#0c094e] px-4 text-xs font-extrabold text-white transition hover:bg-[#24207a]"><LocalizedText text={"Confirmar"} /></button>
          </div>
        </section>
      </div>}
    </>
  );
}
