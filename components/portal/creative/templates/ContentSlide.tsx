import type { ContentSlideData, CanvasObjectLayout } from '../types';
import { objectStyle } from '../canvasObjects';

interface ContentSlideProps {
  data: ContentSlideData;
  layouts: Record<string, CanvasObjectLayout>;
}

export function ContentSlide({ data, layouts }: ContentSlideProps) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-white text-slate-950">
      <img src={data.imageUrl} alt={data.title} crossOrigin="anonymous" style={objectStyle(layouts.image)} className="object-cover" />

      <h2 style={objectStyle(layouts.title)} className="flex items-end text-2xl font-black leading-tight tracking-tight">
        {data.title}
      </h2>

      <p style={objectStyle(layouts.subtitle)} className="flex items-start text-sm leading-relaxed text-slate-600">
        {data.subtitle}
      </p>
    </div>
  );
}
