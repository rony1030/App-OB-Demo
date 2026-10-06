'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { Printer } from 'lucide-react';
import type { CommissionClaimListItem } from '@/lib/data/commission-claim-types';
import { formatCurrency } from '@/lib/utils';

export default function ProformaPrintView({ claim }: { claim: CommissionClaimListItem }) {
  const snapshot = claim.proformaSnapshot;
  const text = (key: string, fallback: string) => typeof snapshot[key] === 'string' && snapshot[key] ? String(snapshot[key]) : fallback;
  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-950 print:bg-white print:p-0">
      <div className="mx-auto max-w-3xl bg-white p-10 shadow-sm print:max-w-none print:shadow-none">
        <div className="flex items-start justify-between border-b border-slate-200 pb-8">
          <div><p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800"><LocalizedText text={"Proforma de comisión"} /></p><h1 className="mt-2 text-3xl font-black">{text('organization_name', claim.organizationName)}</h1><p className="mt-2 text-sm text-slate-500">{text('legal_name', claim.organizationName)}</p><p className="text-sm text-slate-500"><LocalizedText text={"RNC / ID fiscal: "} />{text('tax_id', 'No registrado')}</p><p className="text-sm text-slate-500">{text('legal_address', 'Dirección no registrada')}</p></div>
          <div className="text-right"><p className="text-xs font-bold uppercase text-slate-400"><LocalizedText text={"Número"} /></p><p className="mt-1 text-lg font-black">{claim.proformaNumber}</p><p className="mt-2 text-xs text-slate-500"><LocalizedText text={"Solicitud #"} />{claim.id}</p></div>
        </div>
        <section className="mt-8 grid gap-4 sm:grid-cols-2"><UITranslationBoundary attributes={["label"]}><Info label="Proyecto" value={claim.projectName} /></UITranslationBoundary><UITranslationBoundary attributes={["label"]}><Info label="Unidad" value={claim.unitId ? `Unidad ${claim.unitId}` : 'Unidad vinculada'} /></UITranslationBoundary><UITranslationBoundary attributes={["label"]}><Info label="Moneda" value={claim.currency} /></UITranslationBoundary><UITranslationBoundary attributes={["label"]}><Info label="Porcentaje liberado" value={`${claim.releasedPercentage}%`} /></UITranslationBoundary></section>
        <section className="mt-8 border-t border-slate-200 pt-6"><div className="flex justify-between text-sm"><span><LocalizedText text={"Comisión liberada para revisión"} /></span><strong>{formatCurrency(claim.releasedAmount, claim.currency)}</strong></div><div className="mt-4 flex justify-between border-t border-slate-200 pt-4 text-lg font-black"><span><LocalizedText text={"Total proforma"} /></span><span>{formatCurrency(claim.releasedAmount, claim.currency)}</span></div></section>
        <p className="mt-10 text-xs text-slate-500"><LocalizedText text={"Generada por "} />{text('generated_by', 'usuario autorizado')}<LocalizedText text={" desde OB Brokers. Documento sujeto a validación."} /></p>
        <button type="button" onClick={() => window.print()} className="mt-8 inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-xs font-black text-white print:hidden"><Printer className="h-4 w-4" /><LocalizedText text={" Imprimir o guardar PDF"} /></button>
      </div>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-slate-200 p-4"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</p><p className="mt-1 font-bold">{value}</p></div>;
}
