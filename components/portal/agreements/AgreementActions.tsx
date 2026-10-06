'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, Download, Loader2, FileSignature } from 'lucide-react';
import { getAgreementPdfUrlAction } from '@/app/portal/agreements/actions';

export default function AgreementActions({
  publicCode,
  state,
}: {
  publicCode: string;
  state: string;
}) {
  const [loadingView, setLoadingView] = useState(false);
  const [loadingDownload, setLoadingDownload] = useState(false);

  async function handleViewOnline() {
    setLoadingView(true);
    try {
      const res = await getAgreementPdfUrlAction(publicCode, 'view');
      if (res.url) {
        window.open(res.url, '_blank', 'noopener,noreferrer');
      } else if (res.error) {
        alert(res.error);
      }
    } finally {
      setLoadingView(false);
    }
  }

  async function handleDownloadPdf() {
    setLoadingDownload(true);
    try {
      const res = await getAgreementPdfUrlAction(publicCode, 'download');
      if (res.url) {
        const a = document.createElement('a');
        a.href = res.url;
        a.download = res.fileName || `Acuerdo_${publicCode}.pdf`;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else if (res.error) {
        alert(res.error);
      }
    } finally {
      setLoadingDownload(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleViewOnline}
        disabled={loadingView}
        title="Ver acuerdo en línea en nueva pestaña"
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
      >
        {loadingView ? <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" /> : <Eye className="h-3.5 w-3.5 text-slate-500" />}
        <span>Ver en línea</span>
      </button>

      <button
        type="button"
        onClick={handleDownloadPdf}
        disabled={loadingDownload}
        title="Descargar archivo PDF"
        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
      >
        {loadingDownload ? <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" /> : <Download className="h-3.5 w-3.5 text-slate-500" />}
        <span>Descargar PDF</span>
      </button>

      {state === 'pending_signature' && (
        <Link
          href={`/portal/agreements/${publicCode}/sign`}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-[11px] font-bold text-white shadow-sm transition hover:bg-blue-700"
        >
          <FileSignature className="h-3.5 w-3.5" />
          <span>Firmar</span>
        </Link>
      )}

      {state === 'vencido' && (
        <Link
          href={`/portal/agreements/${publicCode}/sign`}
          className="inline-flex h-9 items-center justify-center rounded-lg border border-amber-300 bg-amber-50 px-3 text-[11px] font-bold text-amber-700 hover:bg-amber-100"
        >
          Renovar
        </Link>
      )}
    </div>
  );
}
