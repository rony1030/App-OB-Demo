'use client';
import { LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileUp, Loader2, Upload } from 'lucide-react';
import { uploadManualAgreementAction } from '@/app/portal/agreements/actions';

export default function ManualUploadForm({ agreementId, validMonths }: { agreementId: number; validMonths: number }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload() {
    if (!file) return;
    setPending(true);
    setError(null);
    const formData = new FormData();
    formData.set('agreementId', String(agreementId));
    formData.set('file', file);
    formData.set('validMonths', String(validMonths));
    const result = await uploadManualAgreementAction(formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
      <div className="flex items-center gap-2">
        <FileUp className="h-4 w-4 text-slate-500" />
        <h3 className="text-sm font-extrabold text-slate-700"><LocalizedText text={"Cargar acuerdo firmado en papel"} /></h3>
      </div>
      <p className="text-[11px] text-slate-500"><LocalizedText text={"Si la agencia firmó el acuerdo en papel, sube aquí el PDF escaneado. Esto marcará el acuerdo como firmado sin requerir firma digital."} /></p>

      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="block w-full text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-xs file:font-bold file:text-blue-700 hover:file:bg-blue-100"
      />

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700">{error}</p>}

      <button
        type="button"
        onClick={handleUpload}
        disabled={pending || !file}
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 disabled:opacity-60 hover:bg-slate-50"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}<LocalizedText text={"Subir y marcar como firmado"} /></button>
    </div>
  );
}
