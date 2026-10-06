'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { completeMandatoryPasswordChangeAction } from './actions';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    // The recovery link's session is established client-side from the URL
    // fragment on load; PASSWORD_RECOVERY confirms it's ready to accept a
    // new password via updateUser().
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setIsPending(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setIsPending(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    const completion = await completeMandatoryPasswordChangeAction();
    if (completion.error) {
      setError(completion.error);
      return;
    }
    setSuccess(true);
    setTimeout(() => router.push('/portal'), 1800);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-2 text-blue-700">
          <ShieldCheck className="h-5 w-5" />
          <span className="text-xs font-extrabold uppercase tracking-wider"><LocalizedText text={"OB Brokers Team"} /></span>
        </div>

        <div>
          <h1 className="text-2xl font-black text-slate-950"><LocalizedText text={"Nueva contraseña"} /></h1>
          <p className="mt-1 text-xs text-slate-500"><LocalizedText text={"Elige una nueva contraseña para tu cuenta."} /></p>
        </div>

        {success ? (
          <div className="rounded-xl bg-emerald-50 p-4 text-xs font-semibold text-emerald-700"><LocalizedText text={"Contraseña actualizada. Redirigiendo al portal…"} /></div>
        ) : !ready ? (
          <div className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500"><LocalizedText text={"Verificando el enlace de recuperación… Si llegaste aquí directamente (sin usar el enlace del correo), solicita uno nuevo desde"} />{' '}
            <Link href="/login" className="font-bold text-blue-700 hover:underline"><LocalizedText text={"la página de inicio de sesión"} /></Link>
            .
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700"><LocalizedText text={"Nueva contraseña"} /></label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <UITranslationBoundary attributes={["placeholder"]}><input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-xs outline-none focus:border-blue-600"
                /></UITranslationBoundary>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700"><LocalizedText text={"Confirmar contraseña"} /></label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <UITranslationBoundary attributes={["placeholder"]}><input
                  required
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••••••"
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-xs outline-none focus:border-blue-600"
                /></UITranslationBoundary>
              </div>
            </div>

            {error && <p className="text-[11px] font-semibold text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={isPending}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-xs font-extrabold text-white shadow-md hover:bg-blue-700 disabled:opacity-60 transition"
            >
              {isPending ? 'Guardando…' : <LocalizedText text={"Guardar nueva contraseña"} />}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
