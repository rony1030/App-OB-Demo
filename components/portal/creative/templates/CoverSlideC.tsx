
import { LocalizedText } from '@/components/i18n/UITranslationBoundary';
import { formatCurrencyExplicit } from '@/lib/utils';
import { AmenityIcon } from '@/components/branding/AmenityIcon';
import type { CoverSlideData, CanvasObjectLayout } from '../types';
import { objectStyle } from '../canvasObjects';

interface CoverSlideCProps {
  data: CoverSlideData;
  layouts: Record<string, CanvasObjectLayout>;
}

// Estilo C — Luxury Dark: foto a sangre, degradado navy, acentos dorados, serif editorial.
export function CoverSlideC({ data, layouts }: CoverSlideCProps) {
  const statsLine = [data.bedrooms, data.bathrooms, data.area].filter(Boolean).join(' · ');

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-950 text-white" style={{ fontFamily: 'var(--font-display)' }}>
      <img src={data.imageUrl} alt={data.title} crossOrigin="anonymous" style={objectStyle(layouts.image)} className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/10" />

      <div style={objectStyle(layouts.badge)} className="flex items-center rounded-full border border-amber-300/70 px-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200"><LocalizedText text={"Preventa exclusiva"} /></div>

      <h1 style={objectStyle(layouts.title)} className="flex items-end text-3xl font-medium italic leading-[1.05] tracking-tight">
        {data.title}
      </h1>

      <div style={objectStyle(layouts.subtitle)} className="flex flex-col justify-start gap-1.5">
        <span className="h-px w-10 bg-amber-300/70" />
        <p className="text-sm font-light uppercase tracking-[0.15em] text-amber-100/90">{data.subtitle}</p>
      </div>

      {statsLine && (
        <p style={objectStyle(layouts.stats)} className="flex items-center text-xs font-light uppercase tracking-[0.15em] text-white/60">
          {statsLine}
        </p>
      )}

      {data.features.length > 0 && (
        <div style={objectStyle(layouts.features)} className="flex flex-wrap items-center gap-2">
          {data.features.map((feature) => (
            <span key={feature.id} className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 px-2.5 py-1 text-[10px] font-medium text-amber-100">
              <AmenityIcon name={feature.label} className="h-3 w-3" strokeWidth={1.5} />
              {feature.label}
            </span>
          ))}
        </div>
      )}

      {data.showPrice && (
        <div style={objectStyle(layouts.priceBlock)} className="flex flex-col justify-center rounded-lg border border-amber-300/50 px-4">
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-amber-200/80">{data.priceLabel}</p>
            <p className="text-xl font-medium text-amber-50">{formatCurrencyExplicit(data.price, data.currency)}</p>
        </div>
      )}
    </div>
  );
}
