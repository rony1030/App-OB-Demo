'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Mail, KeyRound, ArrowLeft, RefreshCw } from 'lucide-react';
import { requestOtpAction, verifyOtpAction } from '@/app/(public)/inversionista/actions';

export default function AccessForm() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const handleRequestOtp = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setInfo(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Por favor ingrese su correo electrónico.');
      return;
    }

    startTransition(async () => {
      try {
        const result = await requestOtpAction(cleanEmail);
        if (result.ok) {
          setInfo(result.message ?? 'Le enviamos un código de 6 caracteres a su correo.');
          setStep('otp');
        } else {
          setError(result.error ?? 'No pudimos procesar la solicitud.');
        }
      } catch {
        setError('Ocurrió un error al enviar el código. Revise su conexión e intente de nuevo.');
      }
    });
  };

  const handleVerifyOtp = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const cleanOtp = otp.trim().toUpperCase();
    if (!cleanOtp) {
      setError('Por favor ingrese el código de 6 caracteres.');
      return;
    }

    startTransition(async () => {
      try {
        const result = await verifyOtpAction(email, cleanOtp);
        if (result.ok && result.publicCode) {
          router.push(`/inversionista/${encodeURIComponent(result.publicCode)}`);
        } else {
          setError(result.error ?? 'El código no es válido o ha expirado.');
        }
      } catch {
        setError('No se pudo verificar el código. Revise su conexión e intente de nuevo.');
      }
    });
  };

  const handleResend = () => {
    setError(null);
    setOtp('');
    startTransition(async () => {
      try {
        const result = await requestOtpAction(email);
        if (result.ok) {
          setInfo(result.message || 'Nuevo código enviado. Revise su bandeja de entrada o spam.');
        } else {
          setError(result.error ?? 'No pudimos enviar un nuevo código.');
        }
      } catch {
        setError('Error al reenviar el código. Intente de nuevo.');
      }
    });
  };

  if (step === 'otp') {
    return (
      <form onSubmit={handleVerifyOtp} noValidate className="space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="otp-input" className="block text-sm font-medium text-[#101826]">
              Código de confirmación
            </label>
            <button
              type="button"
              onClick={() => {
                setStep('email');
                setError(null);
                setInfo(null);
              }}
              className="inline-flex items-center gap-1 text-xs text-[#24207A] hover:underline"
            >
              <ArrowLeft className="h-3 w-3" /> Cambiar correo
            </button>
          </div>
          <div className="mt-1 relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#64748B]">
              <KeyRound className="h-4 w-4" />
            </div>
            <input
              id="otp-input"
              name="otp"
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.toUpperCase())}
              autoComplete="one-time-code"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="Ej. K7M92A"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'otp-error' : 'otp-help'}
              className="block min-h-14 w-full rounded-lg border border-[#DCE3EE] bg-white pl-10 pr-4 text-center font-mono text-xl font-bold tracking-widest text-[#101826] placeholder:text-[#94A3B8] focus:border-[#24207A] focus:outline focus:outline-2 focus:outline-[#24207A]/20"
            />
          </div>
          <p id="otp-help" className="mt-1 text-xs text-[#64748B]">
            Enviado a <span className="font-semibold text-[#101826]">{email}</span>. Vence en 10 minutos.
          </p>
        </div>

        {info && (
          <p role="status" className="rounded-md bg-blue-50 p-2.5 text-xs text-[#0C094E]">
            {info}
          </p>
        )}

        {error && (
          <p id="otp-error" role="alert" className="rounded-md bg-red-50 p-2.5 text-xs text-[#A33A32]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending || otp.trim().length < 4}
          className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-lg bg-[#0C094E] px-5 text-base font-medium text-white transition hover:bg-[#24207A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24207A] disabled:opacity-50"
        >
          {pending ? 'Validando…' : 'Ingresar a mi portal'} <ArrowRight className="h-4 w-4" aria-hidden />
        </button>

        <div className="pt-2 text-center">
          <button
            type="button"
            disabled={pending}
            onClick={handleResend}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#24207A] hover:underline disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${pending ? 'animate-spin' : ''}`} />
            ¿No recibió el código? Reenviar
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleRequestOtp} noValidate className="space-y-4">
      <div>
        <label htmlFor="email-input" className="block text-sm font-medium text-[#101826]">
          Correo registrado en su expediente
        </label>
        <div className="mt-1 relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#64748B]">
            <Mail className="h-4 w-4" />
          </div>
          <input
            id="email-input"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="su-correo@ejemplo.com"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? 'email-error' : 'email-help'}
            className="block min-h-14 w-full rounded-lg border border-[#DCE3EE] bg-white pl-10 pr-4 text-base text-[#101826] placeholder:text-[#94A3B8] focus:border-[#24207A] focus:outline focus:outline-2 focus:outline-[#24207A]/20"
          />
        </div>
        <p id="email-help" className="mt-1.5 text-xs text-[#64748B]">
          Le enviaremos un código de confirmación temporal de 6 caracteres. No requiere contraseña.
        </p>
      </div>

      {error && (
        <p id="email-error" role="alert" className="rounded-md bg-red-50 p-2.5 text-xs text-[#A33A32]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || !email.trim()}
        className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-lg bg-[#0C094E] px-5 text-base font-medium text-white transition hover:bg-[#24207A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24207A] disabled:opacity-50"
      >
        {pending ? 'Enviando código…' : 'Continuar con mi correo'} <ArrowRight className="h-4 w-4" aria-hidden />
      </button>
    </form>
  );
}
