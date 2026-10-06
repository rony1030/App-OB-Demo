import { AmenityIcon } from '@/components/branding/AmenityIcon';
import type { AmenitiesSlideData, CanvasObjectLayout } from '../types';
import { objectStyle } from '../canvasObjects';

interface AmenitiesSlideDProps {
  data: AmenitiesSlideData;
  layouts: Record<string, CanvasObjectLayout>;
}

export function AmenitiesSlideD({ data, layouts }: AmenitiesSlideDProps) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-950 text-white">
      <img src={data.imageUrl} alt={data.title} crossOrigin="anonymous" style={objectStyle(layouts.image)} className="object-cover" />
      <div className="absolute inset-x-0 top-0 h-[42%] bg-gradient-to-t from-slate-950 via-transparent to-transparent" />

      <h2 style={objectStyle(layouts.title)} className="flex items-end text-2xl font-black uppercase tracking-tight">
        {data.title}
      </h2>

      <p style={objectStyle(layouts.subtitle)} className="flex items-start text-xs font-extrabold uppercase tracking-wide text-orange-300">
        {data.subtitle}
      </p>

      <div style={objectStyle(layouts.amenitiesList)} className="grid grid-cols-2 content-start gap-x-3 gap-y-2 overflow-hidden">
        {data.amenities.map((amenity) => (
          <span key={amenity.id} className="inline-flex items-center gap-2 text-xs font-bold">
            <AmenityIcon name={amenity.label} className="h-4 w-4 shrink-0 text-orange-400" strokeWidth={2} />
            <span className="truncate">{amenity.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
