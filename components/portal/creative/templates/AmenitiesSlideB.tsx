import { AmenityIcon } from '@/components/branding/AmenityIcon';
import type { AmenitiesSlideData, CanvasObjectLayout } from '../types';
import { objectStyle } from '../canvasObjects';

interface AmenitiesSlideBProps {
  data: AmenitiesSlideData;
  layouts: Record<string, CanvasObjectLayout>;
}

export function AmenitiesSlideB({ data, layouts }: AmenitiesSlideBProps) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-white text-slate-950">
      <div style={objectStyle(layouts.image)} className="overflow-hidden">
        <img src={data.imageUrl} alt={data.title} crossOrigin="anonymous" className="h-full w-full object-cover" />
      </div>

      <h2 style={objectStyle(layouts.title)} className="flex items-end text-2xl font-black uppercase tracking-tight">
        {data.title}
      </h2>

      <p style={objectStyle(layouts.subtitle)} className="flex items-start text-xs font-bold uppercase tracking-wide text-slate-400">
        {data.subtitle}
      </p>

      <div style={objectStyle(layouts.amenitiesList)} className="grid grid-cols-2 content-start gap-x-3 gap-y-2 overflow-hidden border-t border-slate-200 pt-2">
        {data.amenities.map((amenity) => (
          <span key={amenity.id} className="inline-flex items-center gap-2 text-xs font-bold">
            <AmenityIcon name={amenity.label} className="h-4 w-4 shrink-0" strokeWidth={2} />
            <span className="truncate">{amenity.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
