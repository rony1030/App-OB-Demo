import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { MessageCircle, ShieldCheck } from 'lucide-react';
import AccessForm from '@/components/portal/investor/AccessForm';

export const metadata: Metadata = {
  title: 'Acceso para inversionistas | OB Brokers',
  description: 'Consulte su estado de cuenta, documentos y avances de obra mediante acceso seguro.',
  robots: { index: false, follow: false },
};

export default function InvestorAccessPage() {
  return (
    <div className="min-h-screen bg-[#F5F8FC] text-[#101826]">
      <header className="sticky top-0 z-50 border-b border-[#DCE3EE] bg-white/95 backdrop-blur-md shadow-sm supports-[backdrop-filter]:bg-white/85 transition-all">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link href="/inversionista" className="shrink-0 transition-opacity hover:opacity-90">
            <Image src="/brand/ob-brokers-horizontal-azul-recortado.png" alt="OB Brokers" width={160} height={64} priority className="h-9 sm:h-10 w-auto" />
          </Link>
          <a
            href="https://wa.me/18296391841?text=Hola%2C%20necesito%20asistencia%20con%20el%20portal%20del%20inversionista."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-[#0C094E] px-3.5 text-xs font-semibold text-white transition hover:bg-[#24207A]"
          >
            <MessageCircle className="h-3.5 w-3.5" aria-hidden />
            <span className="hidden sm:inline">Soporte Inversionistas</span>
            <span className="sm:hidden">Soporte</span>
          </a>
        </div>
      </header>

      <main>
        <section className="bg-[#0C094E] text-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1.1fr_440px] lg:items-center lg:gap-16">
            <div>
              <p className="text-sm font-semibold tracking-wider uppercase text-[#B8BDF2]">Bello Valdez Enterprise</p>
              <h1 className="mt-3 font-display text-4xl leading-[1.1] sm:text-5xl">Su inversión, siempre a la vista.</h1>
              <p className="mt-4 max-w-md text-[#C7CBEA]">
                Consulte su estado de cuenta, reporte pagos, descargue sus contratos y dé seguimiento a los avances de obra de cada inmueble.
              </p>

              <div className="mt-8 flex items-center gap-3 text-xs text-[#C7CBEA]">
                <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
                <span>Acceso confidencial protegido sin contraseñas mediante código OTP de verificación.</span>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 text-[#101826] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.5)] sm:p-8">
              <h2 className="font-display text-2xl">Acceda a su portal</h2>
              <p className="mt-1 mb-6 text-sm text-[#5B6472]">Ingrese el correo registrado en su expediente de compra.</p>
              <AccessForm />

              <div className="mt-6 border-t border-[#E4EBF5] pt-4 text-center">
                <a
                  href="https://wa.me/18296391841?text=Hola%2C%20necesito%20actualizar%20el%20correo%20de%20mi%20expediente%20de%20inversionista."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-[#24207A] hover:underline"
                >
                  <MessageCircle className="h-3.5 w-3.5" aria-hidden /> ¿Cambió su correo electrónico? Contacte a soporte
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
          <div className="rounded-2xl border border-[#DCE3EE] bg-white p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <h3 className="font-display text-xl text-[#0C094E]">¿Es usted asesor o aliado comercial?</h3>
              <p className="mt-1 text-sm text-[#5B6472]">
                Explore los perfiles de demostración del portal para conocer la experiencia y flujos de cobranza.
              </p>
            </div>
            <Link
              href="/inversionista/demo"
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border border-[#0C094E] px-5 text-sm font-semibold text-[#0C094E] transition hover:bg-[#0C094E] hover:text-white"
            >
              Ver modo demostración
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
