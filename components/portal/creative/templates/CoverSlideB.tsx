
import { LocalizedText } from '@/components/i18n/UITranslationBoundary';
import { formatCurrencyExplicit } from '@/lib/utils';
import { AmenityIcon } from '@/components/branding/AmenityIcon';
import type { CoverSlideData, CanvasObjectLayout } from '../types';
import { objectStyle } from '../canvasObjects';

interface CoverSlideBProps {
  data: CoverSlideData;
  layouts: Record<string, CanvasObjectLayout>;
}

// Estilo B — Minimal Bold: fondo blanco, foto encajonada, tipografía negra masiva.
export function CoverSlideB({ data, layouts }: CoverSlideBProps) {
  const statsLine = [data.bedrooms, data.bathrooms, data.area].filter(Boolean).join(' · ');

  return (
    <div className="relative h-full w-full overflow-hidden bg-white text-slate-950">
      <div style={objectStyle(layouts.image)} className="overflow-hidden">
        <img src={data.imageUrl} alt={data.title} crossOrigin="anonymous" className="h-full w-full object-cover" />
      </div>

      <div style={objectStyle(layouts.badge)} className="flex items-center rounded-full border-2 border-slate-950 px-4 text-[10px] font-black uppercase tracking-widest"><LocalizedText text={"Preventa exclusiva"} /></div>

      <h1 style={objectStyle(layouts.title)} className="flex items-end text-[2rem] font-black uppercase leading-[0.95] tracking-tight">
        {data.title}
      </h1>

      <p style={objectStyle(layouts.subtitle)} className="flex items-start text-sm font-bold uppercase tracking-wide text-slate-500">
        {data.subtitle}
      </p>

      {statsLine && (
        <p style={objectStyle(layouts.stats)} className="flex items-center border-t border-slate-200 pt-1 text-xs font-bold uppercase tracking-wide text-slate-400">
          {statsLine}
        </p>
      )}

      {data.features.length > 0 && (
        <div style={objectStyle(layouts.features)} className="flex flex-wrap items-center gap-2">
          {data.features.map((feature) => (
            <span key={feature.id} className="inline-flex items-center gap-1.5 rounded-full border border-slate-950 px-2.5 py-1 text-[10px] font-bold uppercase">
              <AmenityIcon name={feature.label} className="h-3 w-3" strokeWidth={2} />
              {feature.label}
            </span>
          ))}
        </div>
      )}

      {data.showPrice && (
        <div style={objectStyle(layouts.priceBlock)} className="flex flex-col justify-center border-2 border-slate-950 px-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{data.priceLabel}</p>
            <p className="text-xl font-black">{formatCurrencyExplicit(data.price, data.currency)}</p>
        </div>
      )}
    </div>
  );
}
