import type { ContentSlideData, CanvasObjectLayout } from '../types';
import { objectStyle } from '../canvasObjects';

interface ContentSlideDProps {
  data: ContentSlideData;
  layouts: Record<string, CanvasObjectLayout>;
}

export function ContentSlideD({ data, layouts }: ContentSlideDProps) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-950 text-white">
      <img src={data.imageUrl} alt={data.title} crossOrigin="anonymous" style={objectStyle(layouts.image)} className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-orange-950/80 via-transparent to-transparent" />

      <h2 style={objectStyle(layouts.title)} className="flex items-end text-2xl font-black uppercase leading-[0.95] tracking-tight">
        {data.title}
      </h2>

      <p style={objectStyle(layouts.subtitle)} className="flex items-start text-sm font-bold leading-relaxed text-orange-100/90">
        {data.subtitle}
      </p>
    </div>
  );
}
