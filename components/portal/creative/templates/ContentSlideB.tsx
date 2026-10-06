import type { ContentSlideData, CanvasObjectLayout } from '../types';
import { objectStyle } from '../canvasObjects';

interface ContentSlideBProps {
  data: ContentSlideData;
  layouts: Record<string, CanvasObjectLayout>;
}

export function ContentSlideB({ data, layouts }: ContentSlideBProps) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-white text-slate-950">
      <div style={objectStyle(layouts.image)} className="overflow-hidden">
        <img src={data.imageUrl} alt={data.title} crossOrigin="anonymous" className="h-full w-full object-cover" />
      </div>

      <h2 style={objectStyle(layouts.title)} className="flex items-end text-2xl font-black uppercase leading-[0.95] tracking-tight">
        {data.title}
      </h2>

      <p style={objectStyle(layouts.subtitle)} className="flex items-start border-t border-slate-200 pt-2 text-sm font-medium leading-relaxed text-slate-500">
        {data.subtitle}
      </p>
    </div>
  );
}
