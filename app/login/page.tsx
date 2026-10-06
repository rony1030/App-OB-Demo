'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { Suspense, useActionState, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  Send,
} from 'lucide-react';
import { loginAction, requestPasswordResetAction, type AuthState } from '@/app/auth/actions';
import { requestMagicLinkAction, type MagicLinkState } from '@/app/auth/magic-actions';
import { getPublicAssetUrl } from '@/lib/supabase/storage';
import BrandLogo from '@/components/branding/BrandLogo';
import { cn } from '@/lib/utils';

function ForgotPasswordForm({ onBack }: { onBack: () => void }) {
  const [state, formAction, isPending] = useActionState<AuthState, FormData>(
    requestPasswordResetAction,
    {}
  );

  return (
    <div className="w-full max-w-md">
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl"><LocalizedText text={"Recuperar acceso"} /></h1>
      <p className="mt-2 text-sm text-slate-500"><LocalizedText text={"Ingresa tu correo y te enviaremos un enlace para elegir una nueva contraseña."} /></p>

      {state?.success ? (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-700"><LocalizedText text={"Si ese correo está registrado, recibirás un enlace de recuperación en unos minutos."} /></div>
      ) : (
        <form action={formAction} className="mt-8 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700"><LocalizedText text={"Correo electrónico"} /></label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <UITranslationBoundary attributes={["placeholder"]}><input
                required
                type="email"
                name="email"
                placeholder="tu.correo@ejemplo.com"
                className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              /></UITranslationBoundary>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-xs font-extrabold text-white shadow-md transition hover:bg-slate-800 active:scale-[0.99] disabled:opacity-60"
          >
            {isPending ? 'Enviando…' : <LocalizedText text={"Enviar enlace de recuperación"} />}
          </button>
        </form>
      )}

      <button
        type="button"
        onClick={onBack}
        className="mt-6 text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline"
      ><LocalizedText text={"← Volver a iniciar sesión"} /></button>
    </div>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/portal';
  const urlError = searchParams.get('error');

  useEffect(() => {
    const run = async () => {
    if (process.env.NEXT_PUBLIC_APP_SCOPE === 'demo') return;
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const accessToken = hash.get('access_token');
    const refreshToken = hash.get('refresh_token');
    if (!accessToken || !refreshToken) return;

    let cancelled = false;
    const supabaseModule = await import('@/lib/supabase/client');
    const supabase = supabaseModule.createClient();
    void supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }).then(({ error }) => {
      if (cancelled) return;
      if (error) {
        window.location.replace('/login?error=token_invalid_or_expired');
        return;
      }
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      window.location.replace(next);
    });
    return () => { cancelled = true; };
    };
    void run();
  }, [next]);

  const isDemo = process.env.NEXT_PUBLIC_APP_SCOPE === 'demo';
  const [mode, setMode] = useState<'magic' | 'password'>('password');
  const [forgotMode, setForgotMode] = useState(false);

  // Magic Link Form State
  const [magicState, magicAction, isMagicPending] = useActionState<MagicLinkState, FormData>(
    requestMagicLinkAction,
    {}
  );
  const [magicEmail, setMagicEmail] = useState('');

  // Password Login Form State
  const [passwordState, passwordAction, isPasswordPending] = useActionState<AuthState, FormData>(
    loginAction,
    {}
  );
  const [showPassword, setShowPassword] = useState(false);
  const [emailValue, setEmailValue] = useState(isDemo ? 'soporte@osvaldobello.com' : '');
  const [passwordValue, setPasswordValue] = useState(isDemo ? 'Soporte2026*' : '');

  if (forgotMode) {
    return <ForgotPasswordForm onBack={() => setForgotMode(false)} />;
  }

  return (
    <div className="w-full max-w-md">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          {isDemo ? 'Acceso de Demostración' : mode === 'magic' ? <LocalizedText text={"Acceso Directo al Portal"} /> : <LocalizedText text={"Iniciar sesión"} />}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {mode === 'magic'
            ? <LocalizedText text={"Ingresa tu correo para recibir un Magic Link seguro y acceder al portal."} />
            : <LocalizedText text={"Ingresa a tu cuenta con tu correo y contraseña habituales."} />}
        </p>
      </div>

      {/* URL Error Message (e.g. expired magic token) */}
      {urlError === 'token_invalid_or_expired' && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-800"><LocalizedText text={"El enlace de acceso utilizado es inválido o ha expirado (validez: 30 minutos). Por favor solicita uno nuevo abajo."} /></div>
      )}

      {/* Mode Switcher Tabs (Oculto en scope DEMO) */}
      {!isDemo && (
        <div className="mt-6 flex items-center rounded-2xl bg-slate-100 p-1 border border-slate-200">
          <button
            type="button"
            onClick={() => setMode('password')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition',
              mode === 'password'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            )}
          >
            <KeyRound className="h-3.5 w-3.5 text-slate-700" />
            <span><LocalizedText text={"Con Contraseña"} /></span>
          </button>

          <button
            type="button"
            onClick={() => setMode('magic')}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black transition',
              mode === 'magic'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            )}
          >
            <Mail className="h-3.5 w-3.5 text-blue-600" />
            <span><LocalizedText text={"Magic Link"} /></span>
          </button>
        </div>
      )}

      {/* ===================== MODE 1: MAGIC LINK ===================== */}
      {mode === 'magic' && (
        <div className="mt-6">
          {magicState?.success ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-6 text-center space-y-4 animate-in fade-in">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-emerald-950"><LocalizedText text={"¡Enlace de acceso enviado!"} /></h3>
                <p className="mt-1.5 text-xs text-emerald-800 leading-relaxed"><LocalizedText text={"Hemos enviado un Magic Link seguro a:"} /><br />
                  <strong className="font-bold text-emerald-950">{magicState.email}</strong>
                </p>
                <p className="mt-3 text-[11px] text-emerald-700"><LocalizedText text={"Si tu cuenta está activa, recibirás un enlace de acceso seguro. Revisa tu bandeja de entrada o carpeta de spam."} /></p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMagicEmail('');
                    window.location.reload();
                  }}
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-950 underline"
                ><LocalizedText text={"Enviar a otro correo"} /></button>
              </div>
            </div>
          ) : (
            <form action={magicAction} className="space-y-4">
              {magicState?.error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 animate-in fade-in">
                  {magicState.error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700"><LocalizedText text={"Correo electrónico institucional o personal *"} /></label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <UITranslationBoundary attributes={["placeholder"]}><input
                    required
                    type="email"
                    name="email"
                    value={magicEmail}
                    onChange={(e) => setMagicEmail(e.target.value)}
                    placeholder="tu.correo@ejemplo.com"
                    className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  /></UITranslationBoundary>
                </div>
              </div>

              <button
                type="submit"
                disabled={isMagicPending}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-xs font-extrabold text-white shadow-md transition hover:bg-slate-800 active:scale-[0.99] disabled:opacity-60"
              >
                {isMagicPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span><LocalizedText text={"Verificando cuenta..."} /></span>
                  </>
                ) : (
                  <>
                    <span><LocalizedText text={"Enviar Magic Link de Acceso"} /></span>
                    <Send className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {/* ===================== MODE 2: PASSWORD ===================== */}
      {mode === 'password' && (
        <div className="mt-6">
          {passwordState?.error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 animate-in fade-in">
              {passwordState.error}
            </div>
          )}

          <form action={passwordAction} className="space-y-4">
            <input type="hidden" name="next" value={next} />

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700"><LocalizedText text={"Correo electrónico"} /></label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <UITranslationBoundary attributes={["placeholder"]}><input
                  required
                  type="email"
                  name="email"
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                  placeholder="tu.correo@inmobiliaria.com"
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                /></UITranslationBoundary>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700"><LocalizedText text={"Contraseña"} /></label>
                <button
                  type="button"
                  onClick={() => setForgotMode(true)}
                  className="text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline"
                ><LocalizedText text={"¿Olvidaste tu contraseña?"} /></button>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <UITranslationBoundary attributes={["placeholder"]}><input
                  required
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={passwordValue}
                  onChange={(e) => setPasswordValue(e.target.value)}
                  placeholder="••••••••••••"
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-11 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                /></UITranslationBoundary>
                <UITranslationBoundary attributes={["aria-label"]}><button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button></UITranslationBoundary>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPasswordPending}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-xs font-extrabold text-white shadow-md transition hover:bg-slate-800 active:scale-[0.99] disabled:opacity-60"
            >
              {isPasswordPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span><LocalizedText text={"Iniciando sesión…"} /></span>
                </>
              ) : (
                <>
                  <span><LocalizedText text={"Entrar con contraseña"} /></span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Footer Links */}
      {isDemo && (
        <div className="mt-8 pt-6 border-t border-slate-200 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 text-center">
            Accesos Rápidos de Demostración
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/inversionista/demo"
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 text-blue-900 transition text-center group"
            >
              <span className="text-xs font-extrabold group-hover:underline">Demo Inversionista</span>
              <span className="text-[10px] text-blue-600 font-medium mt-0.5">Cartera y pagos</span>
            </Link>
            <div
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 text-center relative cursor-not-allowed select-none"
              title="Portal del Desarrollador en preparación"
            >
              <span className="text-xs font-bold text-slate-600">Demo Developer</span>
              <span className="text-[10px] text-amber-600 font-bold mt-0.5 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                Próximamente
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 flex items-center justify-between text-xs text-slate-500">
        <Link href="/" className="font-semibold text-slate-600 hover:text-slate-900"><LocalizedText text={"← Volver a la página principal"} /></Link>
        <span><LocalizedText text={"Osvaldo Bello Group"} /></span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-2">
      {/* Left Column: Clean, Bright, High-Contrast Form */}
      <div className="flex flex-col justify-between p-8 sm:p-12 lg:p-16">
        <header className="flex items-center justify-center">
          <Link href="/" className="flex items-center justify-center rounded-2xl p-2 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100">
            <span className="relative block h-24 w-72 overflow-hidden sm:h-28 sm:w-80">
              <UITranslationBoundary attributes={["alt"]}><Image
                src='/brand/ob-brokers-horizontal-azul-recortado.png'
                alt="OB Brokers Team"
                fill
                priority
                unoptimized
                sizes="320px"
                className="object-contain object-center"
              /></UITranslationBoundary>
            </span>
          </Link>
        </header>

        <main className="my-auto py-10 flex justify-center">
          <Suspense fallback={
            <div className="h-96 w-full max-w-md flex items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          }>
            <LoginForm />
          </Suspense>
        </main>

        <footer className="text-xs text-slate-400">
          <p>© {new Date().getFullYear()}<LocalizedText text={" OB Brokers Team. Todos los derechos reservados."} /></p>
        </footer>
      </div>

      {/* Right Column: Brand Treatment */}
      <div className="relative hidden lg:flex lg:flex-col lg:justify-between overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 p-16">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 h-[420px] w-[420px] rounded-full bg-white/10 blur-[100px]" />
          <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-blue-500/10 blur-[100px]" />
        </div>

        <div className="relative flex justify-end">
          <BrandLogo size="lg" variant="light" />
        </div>

        <div className="relative space-y-4 text-white">
          <span className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white backdrop-blur-md"><LocalizedText text={"Master Broker · Punta Cana & Bávaro"} /></span>
          <h2 className="text-2xl font-black leading-tight sm:text-3xl"><LocalizedText text={"Plataforma Integral de Comercialización & Gestión de Inventario en Tiempo Real."} /></h2>
          <p className="text-xs text-white/80 leading-relaxed max-w-md"><LocalizedText text={"Acceso administrativo a proyectos, tipologías, planos arquitectónicos y disponibilidad sincronizada con Google Sheets."} /></p>
        </div>
      </div>
    </div>
  );
}
