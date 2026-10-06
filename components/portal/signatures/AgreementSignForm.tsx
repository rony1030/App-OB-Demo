'use client';
import { LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import SignatureCapture from '@/components/portal/signatures/SignatureCapture';
import { signAgreementAction } from '@/app/portal/agreements/actions';

export default function AgreementSignForm({ agreementId, signerName }: { agreementId: number; signerName: string }) {
  const router = useRouter();
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSign() {
    if (!dataUrl) {
      setError('Dibuja o escribe tu firma antes de continuar.');
      return;
    }
    if (!accepted) {
      setError('Debes confirmar que aceptas los términos del acuerdo.');
      return;
    }
    setPending(true);
    setError(null);
    const result = await signAgreementAction(agreementId, dataUrl);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-blue-600" />
        <h3 className="text-sm font-extrabold text-slate-900"><LocalizedText text={"Tu firma"} /></h3>
      </div>
      <SignatureCapture signerName={signerName} onChange={setDataUrl} />

      <label className="flex items-start gap-2 text-[11px] text-slate-600">
        <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5" />
        <span><LocalizedText text={"He leído y acepto los términos de este acuerdo de colaboración."} /></span>
      </label>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700">{error}</p>}

      <button
        type="button"
        onClick={handleSign}
        disabled={pending || !dataUrl || !accepted}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-xs font-bold text-white disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}<LocalizedText text={"Firmar acuerdo"} /></button>
    </div>
  );
}
