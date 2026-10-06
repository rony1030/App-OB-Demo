'use client';
import { LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useState } from 'react';
import { Maximize2, Layers, Info, CheckCircle2, Ruler } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import type { ProjectVillaTypology } from '@/lib/data/cipres-typologies';
import TypologyDetailModal from './TypologyDetailModal';

interface TypologyShowcaseCardsProps {
  onSelectTypology?: (typology: ProjectVillaTypology) => void;
  selectedTypologyKey?: string | null;
  customTypologies?: Record<string, ProjectVillaTypology>;
}

export default function TypologyShowcaseCards({
  onSelectTypology,
  selectedTypologyKey,
  customTypologies,
}: TypologyShowcaseCardsProps) {
  const [activeModalTypology, setActiveModalTypology] = useState<ProjectVillaTypology | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const typologies = Object.values(customTypologies || {});
  if (typologies.length === 0) return null;

  return (
    <section id="modelos-tipologias" className="space-y-4 pt-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-extrabold text-[11px] uppercase tracking-wider">
            <Layers className="h-4 w-4" />
            <span><LocalizedText text={"Modelos &amp; Tipologías de Villa"} /></span>
          </div>
          <h3 className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl mt-0.5"><LocalizedText text={"Elige el Modelo Arquitectónico para tu Solar"} /></h3>
          <p className="text-xs text-slate-500 max-w-2xl mt-1"><LocalizedText text={"En este proyecto el cliente adquiere el solar y selecciona la tipología deseada. Cada modelo cuenta con metraje de construcción, distribución y características independientes."} /></p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {typologies.map((item) => {
          const isSelected = selectedTypologyKey === item.key;

          return (
            <div
              key={item.id}
              className={cn(
                'group relative flex flex-col justify-between overflow-hidden rounded-3xl border bg-white p-5 transition-all duration-200 shadow-sm hover:shadow-lg',
                isSelected ? 'border-blue-600 ring-2 ring-blue-600/15' : 'border-slate-200 hover:border-slate-300'
              )}
            >
              {/* Card Header */}
              <div className="space-y-3">
                <div className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <span
                    className={cn(
                      'max-w-full rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase leading-4 tracking-wider break-words',
                      item.badgeColor
                    )}
                  >
                    {item.badge}
                  </span>
                  <span className="w-full text-right text-xs font-black text-slate-900 sm:w-auto sm:shrink-0"><LocalizedText text={"Desde "} />{formatCurrency(item.startingPrice)}
                  </span>
                </div>

                <div>
                  <h4 className="text-lg font-black text-slate-950">{item.name}</h4>
                  <p className="text-xs text-slate-500 font-medium line-clamp-2 mt-0.5">
                    {item.tagline}
                  </p>
                </div>

                {/* Floor Plan Thumbnail Image */}
                <div
                  className="relative h-44 w-full cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 group-hover:border-blue-300 transition"
                  onClick={() => setActiveModalTypology(item)}
                >
                  {item.floorPlanImage && !failedImages[item.key] ? (
                    <img
                      src={item.floorPlanImage}
                      alt={`Plano ${item.name}`}
                      className="h-full w-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                      onError={() => setFailedImages((prev) => ({ ...prev, [item.key]: true }))}
                    />
                  ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 gap-1.5 p-4 text-center">
                      <Layers className="h-7 w-7 text-slate-300" />
                      <span className="text-[11px] font-bold text-slate-600"><LocalizedText text={"Plano Arquitectónico"} /></span>
                      <span className="text-[10px] text-slate-400"><LocalizedText text={"Ver ficha técnica y distribución"} /></span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/20 transition-all flex items-center justify-center">
                    <span className="rounded-xl bg-slate-950/80 px-3 py-1.5 text-[10px] font-bold text-white backdrop-blur opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                      <Maximize2 className="h-3 w-3" />
                      <span><LocalizedText text={"Ver Plano Completo"} /></span>
                    </span>
                  </div>
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-3 text-center border border-slate-100 text-xs">
                  <div>
                    <span className="text-[9px] font-extrabold uppercase text-slate-400 block"><LocalizedText text={"Construcción"} /></span>
                    <span className="font-black text-slate-900 mt-0.5 block">
                      {item.constructionAreaSqm}<LocalizedText text={" m²"} /></span>
                  </div>
                  <div>
                    <span className="text-[9px] font-extrabold uppercase text-slate-400 block"><LocalizedText text={"Habitaciones"} /></span>
                    <span className="font-black text-slate-900 mt-0.5 block">
                      {item.bedrooms}<LocalizedText text={" Hab"} /></span>
                  </div>
                  <div>
                    <span className="text-[9px] font-extrabold uppercase text-slate-400 block"><LocalizedText text={"Baños"} /></span>
                    <span className="font-black text-slate-900 mt-0.5 block">
                      {item.bathrooms}<LocalizedText text={"Baños"} /></span>
                  </div>
                </div>

                {/* Short Feature bullets */}
                <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate"><LocalizedText text={"Solar recomendado: "} />{item.lotRangeSqm}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{item.parkingSpaces}<LocalizedText text={" parqueos privados incluidos"} /></span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 mt-3 border-t border-slate-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveModalTypology(item)}
                  className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  <Info className="h-3.5 w-3.5 text-blue-600" />
                  <span><LocalizedText text={"Ver ficha y plano"} /></span>
                  <Ruler className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal viewer */}
      <TypologyDetailModal
        typology={activeModalTypology}
        isOpen={!!activeModalTypology}
        onClose={() => setActiveModalTypology(null)}
      />
    </section>
  );
}
