import type { ContentSlideData, CanvasObjectLayout } from '../types';
import { objectStyle } from '../canvasObjects';

interface ContentSlideCProps {
  data: ContentSlideData;
  layouts: Record<string, CanvasObjectLayout>;
}

export function ContentSlideC({ data, layouts }: ContentSlideCProps) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-950 text-white" style={{ fontFamily: 'var(--font-display)' }}>
      <img src={data.imageUrl} alt={data.title} crossOrigin="anonymous" style={objectStyle(layouts.image)} className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

      <div style={objectStyle(layouts.title)} className="flex flex-col justify-end gap-1.5">
        <span className="h-px w-10 bg-amber-300/70" />
        <h2 className="text-2xl font-medium italic leading-tight">{data.title}</h2>
      </div>

      <p style={objectStyle(layouts.subtitle)} className="flex items-start text-sm font-light leading-relaxed text-amber-50/80">
        {data.subtitle}
      </p>
    </div>
  );
}
