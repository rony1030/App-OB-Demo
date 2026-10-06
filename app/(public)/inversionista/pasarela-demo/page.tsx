import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Portal de pagos del desarrollador (demostración) | OB Brokers',
  robots: { index: false, follow: false },
};

/** Simula el portal externo al que se redirige al cliente en proyectos con pasarela propia. */
export default function ExternalGatewayDemoPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F5F8FC] px-5 py-10 text-[#101826]">
      <div className="w-full max-w-md rounded-xl bg-white p-6 ring-1 ring-[#E4EBF5] shadow-[0_6px_24px_-14px_rgba(11,19,43,0.3)] sm:p-8">
        <p className="text-sm text-[#24207A]">Demostración</p>
        <h1 className="mt-1 font-display text-2xl">Portal de pagos del desarrollador</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#5B6472]">
          Aquí el cliente llegaría al sitio propio del desarrollador (por ejemplo, Grupo Cana Rock) para pagar con su número de contrato.
          Cuando el desarrollador confirma el pago, el estado de cuenta del cliente se actualiza.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[#5B6472]">
          En producción, el botón del portal del inversionista abre directamente la dirección real configurada para ese proyecto.
        </p>
        <Link
          href="/inversionista/CLI-ALDIA-001"
          className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#0C094E] px-5 text-sm font-medium text-white transition hover:bg-[#24207A]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Volver al portal del inversionista
        </Link>
      </div>
    </main>
  );
}
