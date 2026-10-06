'use client';
import { LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, RefreshCw } from 'lucide-react';
import { renewAgreementAction } from '@/app/portal/agreements/actions';

export default function RenewAgreementButton({ agreementId }: { agreementId: number }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRenew() {
    setPending(true);
    setError(null);
    const result = await renewAgreementAction(agreementId);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.agreementPublicCode) router.push(`/portal/agreements/${result.agreementPublicCode}/sign`);
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-[11px] font-semibold text-red-700">{error}</p>}
      <button
        type="button"
        onClick={handleRenew}
        disabled={pending}
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-3 text-xs font-bold text-white disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}<LocalizedText text={"Generar nuevo acuerdo para renovar"} /></button>
    </div>
  );
}
