
import { LocalizedText } from '@/components/i18n/UITranslationBoundary';
import { formatCurrencyExplicit } from '@/lib/utils';
import { AmenityIcon } from '@/components/branding/AmenityIcon';
import type { CoverSlideData, CanvasObjectLayout } from '../types';
import { objectStyle } from '../canvasObjects';

interface CoverSlideProps {
  data: CoverSlideData;
  layouts: Record<string, CanvasObjectLayout>;
}

export function CoverSlide({ data, layouts }: CoverSlideProps) {
  const statsLine = [data.bedrooms, data.bathrooms, data.area].filter(Boolean).join(' · ');

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-950 text-white">
      <img src={data.imageUrl} alt={data.title} crossOrigin="anonymous" style={objectStyle(layouts.image)} className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/10" />

      <div style={objectStyle(layouts.badge)} className="flex items-center rounded-full bg-blue-600 px-4 text-[11px] font-black uppercase tracking-wider"><LocalizedText text={"Preventa exclusiva"} /></div>

      <h1 style={objectStyle(layouts.title)} className="flex items-end text-3xl font-black leading-[1.05] tracking-tight">
        {data.title}
      </h1>

      <p style={objectStyle(layouts.subtitle)} className="flex items-start text-sm font-semibold opacity-90">
        {data.subtitle}
      </p>

      {statsLine && (
        <p style={objectStyle(layouts.stats)} className="flex items-center text-xs font-bold uppercase tracking-wide opacity-80">
          {statsLine}
        </p>
      )}

      {data.features.length > 0 && (
        <div style={objectStyle(layouts.features)} className="flex flex-wrap items-center gap-2">
          {data.features.map((feature) => (
            <span key={feature.id} className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1 text-[10px] font-bold backdrop-blur-xs">
              <AmenityIcon name={feature.label} className="h-3 w-3" strokeWidth={1.5} />
              {feature.label}
            </span>
          ))}
        </div>
      )}

      {data.showPrice && (
        <div style={objectStyle(layouts.priceBlock)} className="flex items-center justify-between rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
          <div>
            <p className="text-[9px] uppercase tracking-wider opacity-70">{data.priceLabel}</p>
            <p className="text-xl font-black">{formatCurrencyExplicit(data.price, data.currency)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
