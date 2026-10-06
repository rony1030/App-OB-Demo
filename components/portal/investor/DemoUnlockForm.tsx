'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ArrowRight } from 'lucide-react';
import { unlockDemoAction } from '@/app/(public)/inversionista/actions';

export default function DemoUnlockForm() {
  const router = useRouter();
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const clean = accessCode.trim();
    if (!clean) {
      setError('Por favor ingrese el código de acceso.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await unlockDemoAction(clean);
        if (res.ok) {
          router.refresh();
        } else {
          setError(res.error ?? 'Código de demostración incorrecto.');
        }
      } catch {
        setError('Error al validar el código. Intente nuevamente.');
      }
    });
  };

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-[#DCE3EE] bg-white p-8 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0C094E]/10 text-[#0C094E]">
        <Lock className="h-6 w-6" />
      </div>
      <h2 className="mt-4 font-display text-2xl text-[#0C094E]">Acceso a Demostración</h2>
      <p className="mt-2 text-sm text-[#5B6472]">
        Esta sección contiene perfiles ficticios para entrenamiento y presentación a asesores. Ingrese la clave de demostración para continuar.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="demo-code" className="block text-xs font-semibold uppercase tracking-wider text-[#64748B]">
            Código de Demostración
          </label>
          <input
            id="demo-code"
            type="password"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            placeholder="Ingrese el código confidencial"
            autoComplete="current-password"
            className="mt-1 block min-h-12 w-full rounded-lg border border-[#DCE3EE] bg-white px-4 text-sm text-[#101826] placeholder:text-[#94A3B8] focus:border-[#24207A] focus:outline focus:outline-2 focus:outline-[#24207A]/20"
          />
        </div>

        {error && (
          <p role="alert" className="rounded-md bg-red-50 p-2.5 text-xs text-[#A33A32]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending || !accessCode.trim()}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#0C094E] px-4 text-sm font-semibold text-white transition hover:bg-[#24207A] disabled:opacity-50"
        >
          {pending ? 'Validando…' : 'Acceder a las Demostraciones'} <ArrowRight className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
