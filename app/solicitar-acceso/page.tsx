
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { AccessForm } from '@/components/landing/AccessSection';

export const metadata = {
  title: 'Solicitar acceso | OB Brokers Team',
  description: 'Formulario oficial para solicitar acceso profesional a OB Brokers Team.',
};

export default function RequestAccessPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6 sm:px-8">
          <UITranslationBoundary attributes={["aria-label"]}><Link href="/" className="flex items-center gap-3" aria-label="Volver al inicio">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-sm font-black tracking-tight text-white"><LocalizedText text={"OB"} /></div>
            <div><p className="text-sm font-black tracking-tight"><LocalizedText text={"OB Brokers Team"} /></p><p className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-600"><LocalizedText text={"Red comercial inmobiliaria"} /></p></div>
          </Link></UITranslationBoundary>
          <Link href="/" className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"><ArrowLeft className="h-3.5 w-3.5" /><LocalizedText text={" Volver al inicio"} /></Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-6 pt-14 sm:px-8 sm:pt-20">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[.16em] text-blue-700"><ShieldCheck className="h-4 w-4" /><LocalizedText text={" Solicitud profesional"} /></div>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl"><LocalizedText text={"Solicita tu acceso a la red de brokers."} /></h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600"><LocalizedText text={"Completa tus datos y nuestro equipo revisará tu perfil antes de habilitar el acceso al CRM, inventario y materiales comerciales."} /></p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 pb-16 sm:px-8"><AccessForm selectedProject="" /></div>
    </main>
  );
}
