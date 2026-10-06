'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useState, useTransition } from 'react';
import { CheckCircle2, Landmark, Ruler, ShieldCheck, Tag, X } from 'lucide-react';
import type { PortalLot } from '@/lib/portal-projects';
import { cn, formatCurrency } from '@/lib/utils';
import { reserveLotAction } from '@/app/portal/projects/lot-actions';

export default function LotTechnicalCard({
  lot,
  projectSlug,
  onClose,
  onReserved,
}: {
  lot: PortalLot;
  projectSlug: string;
  onClose: () => void;
  onReserved: (lotId: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [reserved, setReserved] = useState(false);

  function reserve() {
    setError('');
    startTransition(async () => {
      const result = await reserveLotAction(Number(lot.id), projectSlug);
      if (result.error) {
        setError(result.error);
        return;
      }
      setReserved(true);
      onReserved(lot.id);
    });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 p-5">
          <div>
            <h2 className="text-lg font-extrabold text-slate-950"><LocalizedText text={"Lote "} />{lot.code}</h2>
            <p className="mt-1 text-xs text-slate-500">{lot.block}</p>
          </div>
          <UITranslationBoundary attributes={["aria-label"]}><button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button></UITranslationBoundary>
        </div>

        <div className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-3">
            <UITranslationBoundary attributes={["label"]}><Stat icon={Ruler} label="Área" value={`${lot.areaSqm} m²`} /></UITranslationBoundary>
            <UITranslationBoundary attributes={["label"]}><Stat icon={Tag} label="Precio" value={formatCurrency(lot.price)} /></UITranslationBoundary>
            <UITranslationBoundary attributes={["label"]}><Stat icon={Landmark} label="Manzana" value={lot.block || '—'} /></UITranslationBoundary>
            <UITranslationBoundary attributes={["label"]}><Stat icon={ShieldCheck} label="Estatus" value={lot.status} /></UITranslationBoundary>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-[11px] font-semibold text-red-700">{error}</div>
          )}

          {reserved ? (
            <div className="flex items-center gap-2 rounded-xl bg-blue-50 p-3 text-xs font-bold text-blue-700">
              <CheckCircle2 className="h-4 w-4" />
              <span><LocalizedText text={"Lote reservado. Tienes 15 días para formalizar."} /></span>
            </div>
          ) : (
            <button
              type="button"
              onClick={reserve}
              disabled={isPending || lot.status !== 'Disponible'}
              className={cn(
                'inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl text-xs font-bold text-white transition',
                lot.status === 'Disponible' ? 'bg-blue-600 hover:bg-blue-700' : 'cursor-not-allowed bg-slate-300'
              )}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>{isPending ? 'Reservando…' : lot.status === 'Disponible' ? 'Reservar Lote' : <LocalizedText text={"No disponible"} />}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: typeof Ruler; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <div className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wide text-slate-400">
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </div>
      <p className="mt-1 text-sm font-extrabold text-slate-900">{value}</p>
    </div>
  );
}
