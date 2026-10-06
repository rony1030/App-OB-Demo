'use client';

import { useEffect, type ReactNode } from 'react';
import { ArrowRight, Bath, BedDouble, CarFront, Check, Ruler, X } from 'lucide-react';
import type { LandingUnitDetailConfig } from '@/lib/data/landing-config';
import type { PortalUnit } from '@/lib/portal-projects';
import { cn, formatCurrencyExplicit } from '@/lib/utils';
import { useLocale } from '@/components/i18n/LocaleProvider';

function number(value: number) {
  return Number.isInteger(value) ? String(value) : value.toLocaleString('es-DO', { maximumFractionDigits: 1 });
}
function parking(unit: PortalUnit) {
  const value = Object.entries(unit.customColumns || {}).find(([key]) => /parque|parking/i.test(key))?.[1];
  const parsed = Number.parseFloat(value || '');
  return Number.isFinite(parsed) && parsed > 0 ? number(parsed) : null;
}

export default function CanaRockUnitDetailModal({ unit, units, projectName, primaryColor, accentColor, contactHref, unitDetail, onClose }: {
  unit: PortalUnit | null;
  units: PortalUnit[];
  projectName: string;
  primaryColor: string;
  accentColor: string;
  contactHref: string;
  unitDetail?: LandingUnitDetailConfig;
  onClose: () => void;
}) {
  const { autoTranslate } = useLocale();

  useEffect(() => {
    if (!unit) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, unit]);
  if (!unit) return null;

  const floors = Array.from(new Set(units.filter((candidate) => candidate.tower === unit.tower && candidate.floor > 0).map((candidate) => candidate.floor))).sort((a, b) => b - a);
  const equipment = unitDetail?.includedEquipment?.filter(Boolean) || [];
  const parkingSpaces = parking(unit);
  const inquiry = `${contactHref}${contactHref.includes('?') ? '&' : '?'}text=${encodeURIComponent(`Hola, deseo consultar la unidad ${unit.unit} de ${projectName}.`)}`;

  return <div className="fixed inset-0 z-[90] overflow-y-auto bg-[#081339]/80 px-3 py-4 backdrop-blur-sm sm:px-6 sm:py-10" role="presentation" onMouseDown={onClose}>
    <div role="dialog" aria-modal="true" aria-labelledby="unit-detail-title" className="mx-auto max-w-5xl overflow-hidden rounded-2xl bg-white shadow-[0_28px_80px_-30px_rgba(0,0,0,0.75)]" onMouseDown={(event) => event.stopPropagation()}>
      <header className="flex items-start justify-between gap-5 border-b border-slate-200 px-5 py-5 sm:px-8 sm:py-7">
        <div><p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: accentColor }}>{unit.tower}</p><h2 id="unit-detail-title" className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl">{autoTranslate('Unidad')} {unit.unit}</h2><p className="mt-1 text-sm font-medium text-slate-500">{unit.type} · {projectName}</p></div>
        <button type="button" onClick={onClose} aria-label={autoTranslate('Cerrar ficha de unidad')} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-950"><X className="h-5 w-5" /></button>
      </header>
      <div className="grid gap-8 px-5 py-7 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:py-10">
        <div className="space-y-7">
          {floors.length > 0 && <section><h3 className="text-xs font-black uppercase tracking-[0.13em] text-slate-500">{autoTranslate('Ubicación dentro del bloque')}</h3><div className="mt-3 space-y-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-3">{floors.map((floor) => <div key={floor} className={cn('flex min-h-10 items-center justify-between rounded-xl px-3 text-xs font-black uppercase tracking-[0.1em]', floor === unit.floor ? 'text-slate-950 shadow-sm' : 'bg-white text-slate-400')} style={floor === unit.floor ? { backgroundColor: accentColor } : undefined}><span>{autoTranslate('Piso')} {floor}</span>{floor === unit.floor && <span>{autoTranslate('Unidad seleccionada')}</span>}</div>)}</div></section>}
          <section className="border-y border-slate-200 py-6"><h3 className="text-xs font-black uppercase tracking-[0.13em] text-slate-500">{autoTranslate('Especificaciones')}</h3><dl className={cn('mt-5 grid grid-cols-2 gap-x-5 gap-y-5', parkingSpaces ? 'sm:grid-cols-4' : 'sm:grid-cols-3')}><DetailSpec icon={<BedDouble />} label={autoTranslate('Habitaciones')} value={unit.bedrooms ? number(unit.bedrooms) : '—'} /><DetailSpec icon={<Bath />} label={autoTranslate('Baños')} value={unit.bathrooms ? number(unit.bathrooms) : '—'} /><DetailSpec icon={<Ruler />} label={autoTranslate('Superficie total')} value={unit.area ? `${number(unit.area)} m²` : '—'} />{parkingSpaces && <DetailSpec icon={<CarFront />} label={autoTranslate('Parqueos')} value={parkingSpaces} />}</dl><div className="mt-6 border-t border-slate-100 pt-5"><p className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-400">{autoTranslate('Tipo / modelo')}</p><p className="mt-1 text-sm font-black text-slate-900">{unit.type}</p></div></section>
        </div>
        <aside className="flex flex-col justify-between gap-7"><div>{equipment.length > 0 && <section><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-xl font-black tracking-[-0.03em] text-slate-950">{autoTranslate('Línea blanca incluida')}</h3>{unitDetail?.qualificationText && <span className="rounded-full border border-slate-200 px-3 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-slate-600">{autoTranslate(unitDetail.qualificationText)}</span>}</div><div className="mt-4 grid grid-cols-2 gap-2">{equipment.map((item) => <div key={item} className="flex min-h-14 items-center gap-3 border-b border-slate-100 py-2 text-sm font-bold text-slate-700"><span className="grid h-7 w-7 place-items-center rounded-full" style={{ backgroundColor: `${accentColor}25`, color: primaryColor }}><Check className="h-4 w-4" /></span>{autoTranslate(item)}</div>)}</div></section>}</div><div className="border-t border-slate-200 pt-6"><div className="flex items-end justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.13em] text-slate-400">{autoTranslate('Precio de inversión')}</p><p className="mt-2 text-3xl font-black tracking-[-0.04em]" style={{ color: primaryColor }}>{formatCurrencyExplicit(unit.price, unit.currency)}</p></div><span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-emerald-800">{autoTranslate(unit.status)}</span></div><a href={inquiry} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-4 text-xs font-black uppercase tracking-[0.12em] text-slate-950 transition hover:brightness-95" style={{ backgroundColor: accentColor }}>{autoTranslate('Consultar esta unidad')} <ArrowRight className="h-4 w-4" /></a><p className="mt-3 text-center text-[11px] leading-5 text-slate-500">{autoTranslate('La disponibilidad y condiciones se confirman con el equipo comercial antes de reservar.')}</p></div></aside>
      </div>
    </div>
  </div>;
}

function DetailSpec({ icon, label, value }: { icon: ReactNode; label: string; value: string }) { return <div><span className="text-slate-400">{icon}</span><dt className="mt-2 text-[9px] font-black uppercase tracking-[0.12em] text-slate-400">{label}</dt><dd className="mt-1 text-sm font-black text-slate-900">{value}</dd></div>; }
