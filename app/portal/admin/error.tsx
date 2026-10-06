'use client';
import { LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw } from 'lucide-react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Admin error:', error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-5 py-12">
      <section className="w-full max-w-lg border border-slate-200 bg-white p-8 shadow-sm rounded-lg">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-rose-600"><LocalizedText text={"Error en administración"} /></p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-950"><LocalizedText text={"No se pudo cargar esta sección"} /></h1>
        <p className="mt-3 text-sm leading-6 text-slate-600"><LocalizedText text={"Ocurrió un error al cargar el panel de administración. Los datos no fueron modificados. Puedes reintentar o regresar al panel principal."} /></p>
        {error.digest && (
          <p className="mt-4 font-mono text-xs text-slate-400"><LocalizedText text={"Referencia: "} />{error.digest}
          </p>
        )}
        <div className="mt-7 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-10 items-center gap-2 rounded bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" /><LocalizedText text={"Reintentar"} /></button>
          <Link
            href="/portal/admin"
            className="inline-flex min-h-10 items-center gap-2 rounded border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-500 hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /><LocalizedText text={"Volver a admin"} /></Link>
        </div>
      </section>
    </main>
  );
}
