'use client';
import { LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';

export default function LandingEditorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Landing editor render failed:', error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-5 py-12">
      <section className="w-full max-w-lg border border-slate-200 bg-white p-8 shadow-sm">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-rose-600"><LocalizedText text={"Editor de landing"} /></p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-950"><LocalizedText text={"No se pudo cargar esta configuración."} /></h1>
        <p className="mt-3 text-sm leading-6 text-slate-600"><LocalizedText text={"La información guardada no se modificó. Puedes volver a intentar la carga o regresar a los proyectos."} /></p>
        {error.digest ? (
          <p className="mt-4 font-mono text-xs text-slate-400"><LocalizedText text={"Referencia: "} />{error.digest}
          </p>
        ) : null}
        <div className="mt-7 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-10 items-center gap-2 bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" /><LocalizedText text={"Reintentar"} /></button>
          <Link
            href="/portal/admin/projects"
            className="inline-flex min-h-10 items-center gap-2 border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-500 hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /><LocalizedText text={"Volver a proyectos"} /></Link>
        </div>
      </section>
    </main>
  );
}
