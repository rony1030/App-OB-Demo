import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, ArrowLeft, MessageCircle } from 'lucide-react';
import { hasDemoAccess } from '@/lib/investor/auth';
import DemoUnlockForm from '@/components/portal/investor/DemoUnlockForm';

export const metadata: Metadata = {
  title: 'Demostración del Portal de Inversionistas | OB Brokers',
  description: 'Casos prácticos de demostración con fotografías reales de proyectos y cartera simulada.',
  robots: { index: false, follow: false },
};

const DEMOS = [
  {
    code: 'CLI-ALDIA-001',
    name: 'Carlos Mendoza',
    short: 'Carlos',
    scenario: 'Una unidad · al día',
    detail: 'El caso más simple: un solo inmueble con todos sus pagos al corriente.',
    images: ['/projects/cana-rock/drone-golf-course.jpg'],
    units: [{ project: 'Cana Rock', flow: 'Portal del desarrollador' }],
  },
  {
    code: 'CLI-MIXTO-002',
    name: 'Dra. Elena Ramos',
    short: 'Elena',
    scenario: 'Tres unidades · al día, con mora y en legal',
    detail: 'Cartera mixta en tres proyectos, con cuotas vencidas y un expediente jurídico.',
    images: [
      '/projects/cipres-residences/gallery/cipres_06.jpeg',
      '/projects/uve-residences/hero.jpeg',
      '/projects/palm-view/gallery/amenidades-casa-club-aerea.jpg',
    ],
    units: [
      { project: 'Ciprés Residences', flow: 'Instrucciones' },
      { project: 'UVE Residences', flow: 'API' },
      { project: 'Palm View', flow: 'Correo' },
    ],
  },
  {
    code: 'CLI-ENTREGA-003',
    name: 'Ing. Roberto Valenzuela',
    short: 'Roberto',
    scenario: 'Tres unidades · entregada, en obra y en entrega',
    detail: 'Incluye el protocolo de entrega con Pago Insoluto, cuotas vencidas y mora.',
    images: [
      '/projects/cana-rock/drone-golf-course.jpg',
      '/projects/palm-view/gallery/amenidades-piscina-torre-1.jpg',
      '/projects/uve-residences/exterior-cover.jpg',
    ],
    units: [
      { project: 'Cana Rock', flow: 'Portal del desarrollador' },
      { project: 'Palm View', flow: 'Correo' },
      { project: 'UVE Residences', flow: 'API' },
    ],
  },
];

export default async function InvestorDemoPage() {
  const isUnlocked = process.env.NEXT_PUBLIC_APP_SCOPE === 'demo' || await hasDemoAccess();

  return (
    <div className="min-h-screen bg-[#F5F8FC] text-[#101826]">
      <header className="sticky top-0 z-50 border-b border-[#DCE3EE] bg-white/95 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <div className="flex items-center gap-4">
            <Link href="/inversionista" className="shrink-0 transition-opacity hover:opacity-90">
              <Image src="/brand/ob-brokers-horizontal-azul-recortado.png" alt="OB Brokers" width={160} height={64} priority className="h-9 sm:h-10 w-auto" />
            </Link>
          </div>
          <Link
            href="/inversionista"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#DCE3EE] px-3 text-xs font-medium text-[#101826] hover:bg-slate-50 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Volver al Login</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        {!isUnlocked ? (
          <div className="py-8">
            <DemoUnlockForm />
          </div>
        ) : (
          <div>
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-wider text-[#24207A]">Ambiente Controlado</p>
              <h1 className="mt-1 font-display text-3xl sm:text-4xl text-[#0C094E]">Tres clientes de ejemplo</h1>
              <p className="mt-2 text-[#5B6472]">
                Datos ficticios con fotografías reales de los proyectos. Cada cliente muestra un caso distinto y un flujo diferente para reportar pagos.
              </p>
            </div>

            <ul className="mt-10 grid gap-6 md:grid-cols-3">
              {DEMOS.map((demo) => (
                <li key={demo.code} className="flex flex-col overflow-hidden rounded-xl bg-white shadow-[0_6px_24px_-14px_rgba(11,19,43,0.3)] ring-1 ring-[#E4EBF5]">
                  <div className={`grid h-48 gap-0.5 bg-white ${demo.images.length === 1 ? 'grid-cols-1' : 'grid-cols-[1.6fr_1fr] grid-rows-2'}`}>
                    {demo.images.map((src, i) => (
                      <div key={src + demo.code} className={`relative bg-[#E4EBF5] ${demo.images.length > 1 && i === 0 ? 'row-span-2' : ''}`}>
                        <Image src={src} alt="" fill sizes="(min-width: 768px) 24vw, 90vw" className="object-cover" />
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="font-display text-2xl leading-tight text-[#0C094E]">{demo.name}</h3>
                    <p className="mt-1 text-sm font-medium text-[#24207A]">{demo.scenario}</p>
                    <p className="mt-3 text-sm leading-relaxed text-[#5B6472]">{demo.detail}</p>

                    <div className="mt-5 border-t border-[#E4EBF5] pt-4">
                      <p className="text-xs font-semibold text-[#6B7280]">Cómo reporta cada pago</p>
                      <ul className="mt-2 divide-y divide-[#EEF2F8]">
                        {demo.units.map((u) => (
                          <li key={u.project} className="flex items-baseline justify-between gap-3 py-2 text-sm">
                            <span className="text-[#101826]">{u.project}</span>
                            <span className="shrink-0 rounded-full bg-[#E8E8F7] px-2.5 py-0.5 text-xs text-[#0C094E]">{u.flow}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-auto pt-6">
                      <Link
                        href={`/inversionista/${demo.code}?demo=1`}
                        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#0C094E] px-4 text-sm font-medium text-white transition hover:bg-[#24207A]"
                      >
                        Entrar como {demo.short} <ArrowRight className="h-4 w-4" aria-hidden />
                      </Link>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
