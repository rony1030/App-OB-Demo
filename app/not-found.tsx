'use client';
import { LocalizedText } from '@/components/i18n/UITranslationBoundary';


import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2, Compass, Home, ShieldCheck } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();
  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    router.push('/');
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-white selection:bg-blue-600 selection:text-white">
      <div className="w-full max-w-2xl">
        <div className="border-b border-white/15 pb-6">
          <div className="flex items-center gap-3 text-blue-300">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em]"><LocalizedText text={"OB Brokers Team"} /></span>
          </div>
        </div>
        <div className="grid gap-10 py-14 md:grid-cols-[180px_1fr] md:items-start md:gap-14">
          <div className="flex items-center gap-4 md:flex-col md:items-start">
            <Compass className="h-14 w-14 text-blue-300" strokeWidth={1.25} aria-hidden="true" />
            <span className="font-mono text-sm font-semibold tracking-[0.18em] text-blue-300">404</span>
          </div>
          <div>
            <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl"><LocalizedText text={"Esta página no está disponible."} /></h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-300 sm:text-base"><LocalizedText text={"El enlace puede estar incompleto, haber cambiado de ubicación o no estar disponible para esta sesión."} /></p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button type="button" onClick={goBack} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-5 text-xs font-extrabold text-slate-950 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-slate-950">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" /><LocalizedText text={"Volver a la página anterior"} /></button>
              <Link href="/" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/20 px-5 text-xs font-extrabold text-white transition hover:border-white/40 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-slate-950">
                <Home className="h-4 w-4 text-blue-300" aria-hidden="true" /><LocalizedText text={"Ir al inicio"} /></Link>
              <Link href="/portal" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/20 px-5 text-xs font-extrabold text-white transition hover:border-white/40 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-slate-950">
                <Building2 className="h-4 w-4 text-blue-300" aria-hidden="true" /><LocalizedText text={"Abrir portal"} /></Link>
            </div>
          </div>
        </div>
        <p className="border-t border-white/15 pt-5 text-xs text-slate-400"><LocalizedText text={"Si el problema continúa, solicita a tu administrador que revise el enlace o tus permisos de acceso."} /></p>
      </div>
    </main>
  );
}
