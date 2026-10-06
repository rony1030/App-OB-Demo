
import { LocalizedText } from '@/components/i18n/UITranslationBoundary';
import { formatCurrencyExplicit } from '@/lib/utils';
import { AmenityIcon } from '@/components/branding/AmenityIcon';
import type { CoverSlideData, CanvasObjectLayout } from '../types';
import { objectStyle } from '../canvasObjects';

interface CoverSlideDProps {
  data: CoverSlideData;
  layouts: Record<string, CanvasObjectLayout>;
}

// Estilo D — Preventa Urgente: alto contraste naranja/rojo, tipografía maciza, urgencia.
export function CoverSlideD({ data, layouts }: CoverSlideDProps) {
  const statsLine = [data.bedrooms, data.bathrooms, data.area].filter(Boolean).join(' · ');

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-950 text-white">
      <img src={data.imageUrl} alt={data.title} crossOrigin="anonymous" style={objectStyle(layouts.image)} className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-orange-950/95 via-black/50 to-black/20" />

      <div style={objectStyle(layouts.badge)} className="flex items-center gap-1.5 rounded-md bg-orange-600 px-4 text-[10px] font-black uppercase tracking-wider shadow-lg shadow-orange-950/50">
        <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /><LocalizedText text={"Últimas unidades"} /></div>

      <h1 style={objectStyle(layouts.title)} className="flex items-end text-3xl font-black uppercase leading-[0.95] tracking-tight">
        {data.title}
      </h1>

      <p style={objectStyle(layouts.subtitle)} className="flex items-start text-sm font-extrabold uppercase tracking-wide text-orange-200">
        {data.subtitle}
      </p>

      {statsLine && (
        <p style={objectStyle(layouts.stats)} className="flex items-center text-xs font-extrabold uppercase tracking-wide text-white/80">
          {statsLine}
        </p>
      )}

      {data.features.length > 0 && (
        <div style={objectStyle(layouts.features)} className="flex flex-wrap items-center gap-2">
          {data.features.map((feature) => (
            <span key={feature.id} className="inline-flex items-center gap-1.5 rounded-md bg-orange-600/90 px-2.5 py-1 text-[10px] font-black uppercase">
              <AmenityIcon name={feature.label} className="h-3 w-3" strokeWidth={2} />
              {feature.label}
            </span>
          ))}
        </div>
      )}

      {data.showPrice && (
        <div style={objectStyle(layouts.priceBlock)} className="flex flex-col justify-center rounded-lg bg-white px-4 text-slate-950 shadow-lg">
          <p className="text-[9px] font-black uppercase tracking-widest text-orange-600">{data.priceLabel}<LocalizedText text={" — Oferta"} /></p>
            <p className="text-xl font-black">{formatCurrencyExplicit(data.price, data.currency)}</p>
        </div>
      )}
    </div>
  );
}
