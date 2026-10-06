
import { LocalizedText } from '@/components/i18n/UITranslationBoundary';
import type { ReactNode } from 'react';
import type { CarouselProjectData, CanvasObjectLayout, StylePreset } from './types';
import { CANVAS_SIZES } from './types';
import { getSlideKind, getContentSlideIndex } from './slides';
import { getCoverObjectLayouts, getContentObjectLayouts, getAmenitiesObjectLayouts, getClosingObjectLayouts } from './canvasObjects';
import { CoverSlide } from './templates/CoverSlide';
import { ContentSlide } from './templates/ContentSlide';
import { AmenitiesSlide } from './templates/AmenitiesSlide';
import { AgentClosingSlide } from './templates/AgentClosingSlide';
import { CoverSlideB } from './templates/CoverSlideB';
import { ContentSlideB } from './templates/ContentSlideB';
import { AmenitiesSlideB } from './templates/AmenitiesSlideB';
import { AgentClosingSlideB } from './templates/AgentClosingSlideB';
import { CoverSlideC } from './templates/CoverSlideC';
import { ContentSlideC } from './templates/ContentSlideC';
import { AmenitiesSlideC } from './templates/AmenitiesSlideC';
import { AgentClosingSlideC } from './templates/AgentClosingSlideC';
import { CoverSlideD } from './templates/CoverSlideD';
import { ContentSlideD } from './templates/ContentSlideD';
import { AmenitiesSlideD } from './templates/AmenitiesSlideD';
import { AgentClosingSlideD } from './templates/AgentClosingSlideD';
import { SlideFooter } from './templates/SlideFooter';
import { CanvasSelectionLayer } from './CanvasSelectionLayer';

interface SlideRendererProps {
  data: CarouselProjectData;
  slideIndex: number;
  idPrefix: string;
  editable?: boolean;
  selectedObjectId?: string | null;
  onSelectObject?: (id: string | null) => void;
  onBeginEdit?: () => void;
  onObjectLiveChange?: (objectId: string, layout: CanvasObjectLayout) => void;
  onCommitEdit?: () => void;
}

const IMPLEMENTED_STYLES: StylePreset[] = ['A', 'B', 'C', 'D'];

const STYLE_TEMPLATES: Record<
  'A' | 'B' | 'C' | 'D',
  {
    Cover: typeof CoverSlide;
    Content: typeof ContentSlide;
    Amenities: typeof AmenitiesSlide;
    Closing: typeof AgentClosingSlide;
  }
> = {
  A: { Cover: CoverSlide, Content: ContentSlide, Amenities: AmenitiesSlide, Closing: AgentClosingSlide },
  B: { Cover: CoverSlideB, Content: ContentSlideB, Amenities: AmenitiesSlideB, Closing: AgentClosingSlideB },
  C: { Cover: CoverSlideC, Content: ContentSlideC, Amenities: AmenitiesSlideC, Closing: AgentClosingSlideC },
  D: { Cover: CoverSlideD, Content: ContentSlideD, Amenities: AmenitiesSlideD, Closing: AgentClosingSlideD },
};

export function SlideRenderer({
  data,
  slideIndex,
  idPrefix,
  editable = false,
  selectedObjectId = null,
  onSelectObject,
  onBeginEdit,
  onObjectLiveChange,
  onCommitEdit,
}: SlideRendererProps) {
  const size = CANVAS_SIZES[data.aspectRatio];
  const kind = getSlideKind(data, slideIndex);
  const isImplemented = IMPLEMENTED_STYLES.includes(data.stylePreset);

  let content: ReactNode;
  let layouts: Record<string, CanvasObjectLayout>;

  if (!isImplemented) {
    content = (
      <div className="flex h-full w-full items-center justify-center bg-slate-900 text-center text-xs font-bold text-white/60"><LocalizedText text={"Estilo próximamente disponible"} /></div>
    );
    layouts = {};
  } else {
    const templates = STYLE_TEMPLATES[data.stylePreset as 'A' | 'B' | 'C' | 'D'];
    if (kind === 'cover') {
      layouts = getCoverObjectLayouts(data.slide1);
      content = <templates.Cover data={data.slide1} layouts={layouts} />;
    } else if (kind === 'content') {
      const slide = data.contentSlides[getContentSlideIndex(data, slideIndex)];
      layouts = getContentObjectLayouts(slide);
      content = <templates.Content data={slide} layouts={layouts} />;
    } else if (kind === 'amenities') {
      layouts = getAmenitiesObjectLayouts(data.slide4);
      content = <templates.Amenities data={data.slide4} layouts={layouts} />;
    } else {
      layouts = getClosingObjectLayouts(data.slide5);
      content = <templates.Closing data={data.slide5} layouts={layouts} />;
    }
  }

  return (
    <div
      id={`${idPrefix}-${slideIndex}`}
      className="relative select-none overflow-hidden rounded-xl shadow-2xl"
      style={{ width: size.width, height: size.height }}
    >
      {content}
      <SlideFooter logoUrl={data.footerLogoUrl} show={data.showFooterLogo} />
      {editable && isImplemented && (
        <CanvasSelectionLayer
          objects={layouts}
          selectedId={selectedObjectId}
          onSelect={(id) => onSelectObject?.(id)}
          onBeginEdit={() => onBeginEdit?.()}
          onLiveChange={(id, layout) => onObjectLiveChange?.(id, layout)}
          onCommitEdit={() => onCommitEdit?.()}
        />
      )}
    </div>
  );
}
