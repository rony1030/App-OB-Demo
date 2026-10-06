'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useState } from 'react';

import { Bed, X, CheckCircle2, Layers, ZoomIn, ArrowDown } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import type { ProjectVillaTypology } from '@/lib/data/cipres-typologies';

interface TypologyDetailModalProps {
  typology: ProjectVillaTypology | null;
  isOpen: boolean;
  onClose: () => void;
  onScrollToTable?: () => void;
}

export default function TypologyDetailModal({
  typology,
  isOpen,
  onClose,
  onScrollToTable,
}: TypologyDetailModalProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!isOpen || !typology) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 sm:p-6 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative my-auto w-full max-w-4xl rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-200">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider border',
                typology.badgeColor
              )}
            >
              {typology.badge}
            </span>
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline"><LocalizedText text={"Ficha Técnica &amp; Plano Arquitectónico"} /></span>
          </div>

          <UITranslationBoundary attributes={["aria-label"]}><button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-800 transition"
            aria-label="Cerrar ventana"
          >
            <X className="h-5 w-5" />
          </button></UITranslationBoundary>
        </div>

        {/* Modal Body */}
        <div className="max-h-[80vh] overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Title & Tagline */}
          <div>
            <h2 className="text-2xl font-black text-slate-950 sm:text-3xl tracking-tight">
              {typology.name}
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-600 max-w-2xl">
              {typology.tagline}
            </p>
          </div>

          {/* Key Spec Metrics Pill Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-3.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 block"><LocalizedText text={"Construcción"} /></span>
              <span className="text-xl font-black text-blue-950 mt-1 block">
                {typology.constructionAreaSqm}<LocalizedText text={" m²"} /></span>
              <span className="text-[10px] text-blue-700 font-semibold"><LocalizedText text={"Área cerrada"} /></span>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 block"><LocalizedText text={"Precio Villa"} /></span>
              <span className="text-xl font-black text-emerald-950 mt-1 block">
                {formatCurrency(typology.startingPrice)}
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold"><LocalizedText text={"Precio base modelo"} /></span>
            </div>

            <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-3.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 block"><LocalizedText text={"Habitaciones"} /></span>
              <div className="flex items-center gap-1.5 mt-1">
                <Bed className="h-4 w-4 text-purple-700" />
                <span className="text-xl font-black text-purple-950">{typology.bedrooms}<LocalizedText text={" Hab"} /></span>
              </div>
              <span className="text-[10px] text-purple-700 font-semibold">{typology.bathrooms}<LocalizedText text={" Baños"} /></span>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-3.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 block"><LocalizedText text={"Solar / Lote Requerido"} /></span>
              <span className="text-sm font-black text-amber-950 mt-1 block">
                {typology.lotRangeSqm}
              </span>
              <span className="text-[10px] text-amber-800 font-semibold"><LocalizedText text={"Terreno privado"} /></span>
            </div>
          </div>

          {/* Architectural Floor Plan Box with Zoom */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-600" />
                <span><LocalizedText text={"Plano de Distribución Arquitectónica (2D)"} /></span>
              </h3>
              <button
                type="button"
                onClick={() => setIsZoomed((v) => !v)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800"
              >
                <ZoomIn className="h-3.5 w-3.5" />
                <span>{isZoomed ? 'Reducir zoom' : 'Ampliar plano'}</span>
              </button>
            </div>

            <div
              className={cn(
                'group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 transition-all duration-300 shadow-inner',
                typology.floorPlanImage && !imageError ? (isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in') : ''
              )}
              onClick={() => {
                if (typology.floorPlanImage && !imageError) setIsZoomed((v) => !v);
              }}
            >
              {typology.floorPlanImage && !imageError ? (
                <>
                  <img
                    src={typology.floorPlanImage}
                    alt={`Plano Arquitectónico ${typology.name}`}
                    className={cn(
                      'w-full object-contain transition-transform duration-300',
                      isZoomed ? 'scale-125 my-8' : 'max-h-[460px]'
                    )}
                    onError={() => setImageError(true)}
                  />
                  <div className="absolute bottom-3 right-3 rounded-xl bg-slate-900/80 px-3 py-1.5 text-[10px] font-bold text-white backdrop-blur"><LocalizedText text={"Haz clic para "} />{isZoomed ? 'reducir' : 'ampliar plano con cotas'}
                  </div>
                </>
              ) : (
                <div className="p-12 text-center flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Layers className="h-12 w-12 text-slate-300" />
                  <span className="text-sm font-bold text-slate-600"><LocalizedText text={"Plano Arquitectónico en Actualización"} /></span>
                  <p className="text-xs text-slate-400 max-w-sm"><LocalizedText text={"El plano 2D para el modelo "} />{typology.name}<LocalizedText text={" está en revisión por el equipo técnico. Consulta con tu Master Broker o asesor asignado."} /></p>
                </div>
              )}
            </div>
          </div>

          {/* Spaces / Ambientes Breakdown Table */}
          {typology.spaces.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900"><LocalizedText text={"Distribución de Ambientes &amp; Metrajes"} /></h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {typology.spaces.map((space) => (
                  <div
                    key={space.name}
                    className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 text-xs border border-slate-100"
                  >
                    <span className="font-semibold text-slate-700">{space.name}</span>
                    <span className="font-black text-slate-900">{space.area}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description and Features */}
          <div className="grid sm:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900"><LocalizedText text={"Memoria Descriptiva"} /></h3>
              <p className="text-xs leading-relaxed text-slate-600">
                {typology.description}
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900"><LocalizedText text={"Equipamiento &amp; Terminaciones"} /></h3>
              <ul className="space-y-2">
                {typology.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="text-xs text-slate-500">
            <span><LocalizedText text={"Modelo disponible para construcción sobre cualquier solar habilitado."} /></span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {onScrollToTable && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onScrollToTable();
                }}
                className="inline-flex h-10 flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                <ArrowDown className="h-3.5 w-3.5 text-slate-500" />
                <span><LocalizedText text={"Ver Disponibilidad de Solares"} /></span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 flex-1 sm:flex-none items-center justify-center rounded-xl bg-slate-950 px-5 text-xs font-extrabold text-white hover:bg-slate-800 transition"
            ><LocalizedText text={"Cerrar Ficha"} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
