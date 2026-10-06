'use client';
import { LocalizedText } from '@/components/i18n/UITranslationBoundary';


import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Compass, Home, LayoutDashboard } from 'lucide-react';

function BackToPreviousPage() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) window.history.back();
        else router.push('/portal');
      }}
      className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-xs font-extrabold text-slate-700 shadow-xs transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      <span><LocalizedText text={"Volver atrás"} /></span>
    </button>
  );
}

export default function PortalNotFound() {
  return (
    <div className="portal-enter flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-700 shadow-xs">
        <Compass className="h-8 w-8 text-blue-600" />
      </div>

      <div className="mt-5 space-y-2">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400"><LocalizedText text={"Recurso no disponible"} /></span>
        <h1 className="text-2xl font-black text-slate-900"><LocalizedText text={"Sección o registro no encontrado"} /></h1>
        <p className="mx-auto max-w-md text-xs text-slate-500 leading-relaxed"><LocalizedText text={"El módulo, cliente, propuesta o proyecto al que intentas acceder no existe en este espacio de trabajo o no tienes los permisos requeridos."} /></p>
      </div>

      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <BackToPreviousPage />
        <Link
          href="/portal"
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-xs font-extrabold text-white shadow-md hover:bg-blue-700 transition"
        >
          <LayoutDashboard className="h-4 w-4" />
          <span><LocalizedText text={"Volver al Panel Principal"} /></span>
        </Link>
        <Link
          href="/"
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-xs font-extrabold text-slate-700 shadow-xs transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Home className="h-4 w-4" aria-hidden="true" />
          <span><LocalizedText text={"Ir al inicio"} /></span>
        </Link>
      </div>
    </div>
  );
}
