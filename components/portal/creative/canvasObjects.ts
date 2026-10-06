import type { CSSProperties } from 'react';
import type { CanvasObjectLayout, CoverSlideData, ContentSlideData, AmenitiesSlideData, ClosingSlideData } from './types';

export function mergeObjectLayout(stored: CanvasObjectLayout | undefined, fallback: CanvasObjectLayout): CanvasObjectLayout {
  return { ...fallback, ...stored };
}

export function objectStyle(layout: CanvasObjectLayout): CSSProperties {
  return {
    position: 'absolute',
    left: `${layout.x}%`,
    top: `${layout.y}%`,
    width: `${layout.width}%`,
    height: `${layout.height}%`,
    display: layout.visible === false ? 'none' : undefined,
  };
}

export function getCoverObjectLayouts(data: CoverSlideData): Record<string, CanvasObjectLayout> {
  const defaults: Record<string, CanvasObjectLayout> = {
    image: { x: 0, y: 0, width: 100, height: 100 },
    badge: { x: 6, y: 6, width: 42, height: 6 },
    title: { x: 6, y: 55, width: 88, height: 12 },
    subtitle: { x: 6, y: 68, width: 88, height: 7 },
    stats: { x: 6, y: 76, width: 88, height: 5 },
    features: { x: 6, y: 82, width: 88, height: 6 },
    priceBlock: { x: 6, y: 90, width: 40, height: 8 },
  };
  return Object.fromEntries(Object.entries(defaults).map(([id, fallback]) => [id, mergeObjectLayout(data.elements?.[id], fallback)]));
}

export function getContentObjectLayouts(data: ContentSlideData): Record<string, CanvasObjectLayout> {
  const imageRight = data.position === 'right';
  const defaults: Record<string, CanvasObjectLayout> = {
    image: { x: imageRight ? 50 : 0, y: 0, width: 50, height: 100 },
    title: { x: imageRight ? 6 : 56, y: 40, width: 40, height: 16 },
    subtitle: { x: imageRight ? 6 : 56, y: 58, width: 40, height: 30 },
  };
  return Object.fromEntries(Object.entries(defaults).map(([id, fallback]) => [id, mergeObjectLayout(data.elements?.[id], fallback)]));
}

export function getAmenitiesObjectLayouts(data: AmenitiesSlideData): Record<string, CanvasObjectLayout> {
  const defaults: Record<string, CanvasObjectLayout> = {
    image: { x: 0, y: 0, width: 100, height: 42 },
    title: { x: 6, y: 46, width: 88, height: 8 },
    subtitle: { x: 6, y: 55, width: 88, height: 6 },
    amenitiesList: { x: 6, y: 63, width: 88, height: 33 },
  };
  return Object.fromEntries(Object.entries(defaults).map(([id, fallback]) => [id, mergeObjectLayout(data.elements?.[id], fallback)]));
}

export function getClosingObjectLayouts(data: ClosingSlideData): Record<string, CanvasObjectLayout> {
  const defaults: Record<string, CanvasObjectLayout> = {
    headline: { x: 8, y: 10, width: 84, height: 18 },
    priceBlock: { x: 8, y: 32, width: 84, height: 12 },
    ctaButton: { x: 8, y: 48, width: 84, height: 8 },
    agentCard: { x: 8, y: 68, width: 84, height: 26 },
  };
  return Object.fromEntries(Object.entries(defaults).map(([id, fallback]) => [id, mergeObjectLayout(data.elements?.[id], fallback)]));
}
