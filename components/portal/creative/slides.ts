import type { CarouselProjectData, CanvasObjectLayout } from './types';

export type SlideKind = 'cover' | 'content' | 'amenities' | 'closing';

export function getTotalSlides(data: CarouselProjectData): number {
  return 1 + data.contentSlides.length + 1 + 1;
}

export function getSlideKind(data: CarouselProjectData, index: number): SlideKind {
  if (index === 0) return 'cover';
  if (index <= data.contentSlides.length) return 'content';
  if (index === data.contentSlides.length + 1) return 'amenities';
  return 'closing';
}

export function getContentSlideIndex(data: CarouselProjectData, index: number): number {
  return index - 1;
}

export function getSlideLabel(data: CarouselProjectData, index: number): string {
  const kind = getSlideKind(data, index);
  if (kind === 'cover') return 'Portada';
  if (kind === 'content') return `Contenido ${getContentSlideIndex(data, index) + 1}`;
  if (kind === 'amenities') return 'Amenidades';
  return 'Cierre';
}

export function setElementLayout(source: CarouselProjectData, index: number, objectId: string, layout: CanvasObjectLayout): CarouselProjectData {
  const kind = getSlideKind(source, index);
  if (kind === 'cover') {
    return { ...source, slide1: { ...source.slide1, elements: { ...source.slide1.elements, [objectId]: layout } } };
  }
  if (kind === 'content') {
    const i = getContentSlideIndex(source, index);
    const slides = [...source.contentSlides];
    slides[i] = { ...slides[i], elements: { ...slides[i].elements, [objectId]: layout } };
    return { ...source, contentSlides: slides };
  }
  if (kind === 'amenities') {
    return { ...source, slide4: { ...source.slide4, elements: { ...source.slide4.elements, [objectId]: layout } } };
  }
  return { ...source, slide5: { ...source.slide5, elements: { ...source.slide5.elements, [objectId]: layout } } };
}
