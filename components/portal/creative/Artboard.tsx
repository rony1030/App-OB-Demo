'use client';
import { UITranslationBoundary } from '@/components/i18n/UITranslationBoundary';


import type { CSSProperties, PointerEventHandler, ReactNode } from 'react';
import { Home, Building2, BedDouble, Bath, Car, Waves, Trees, MapPin, Phone, Mail, Star, Heart, Check, ArrowRight, Sun, Dumbbell, Shield, Wifi, Circle, Square, type LucideIcon } from 'lucide-react';
import { fillCss, type ArtDocument, type ArtElement, type ArtSlide, type Fill } from './editorModel';

export const ART_ICONS: Record<string, { label: string; component: LucideIcon }> = {
  Home: { label: 'Casa', component: Home }, Building2: { label: 'Edificio', component: Building2 }, BedDouble: { label: 'Habitación', component: BedDouble }, Bath: { label: 'Baño', component: Bath },
  Car: { label: 'Parqueo', component: Car }, Waves: { label: 'Piscina', component: Waves }, Trees: { label: 'Jardín', component: Trees }, MapPin: { label: 'Ubicación', component: MapPin },
  Phone: { label: 'Teléfono', component: Phone }, Mail: { label: 'Correo', component: Mail }, Star: { label: 'Estrella', component: Star }, Heart: { label: 'Corazón', component: Heart },
  Check: { label: 'Confirmación', component: Check }, ArrowRight: { label: 'Flecha', component: ArrowRight }, Sun: { label: 'Sol', component: Sun }, Dumbbell: { label: 'Gimnasio', component: Dumbbell },
  Shield: { label: 'Seguridad', component: Shield }, Wifi: { label: 'Internet', component: Wifi }, Circle: { label: 'Círculo', component: Circle }, Square: { label: 'Cuadrado', component: Square },
};
export function Background({ value }: { value: Fill }) {
  return <div style={{ position: 'absolute', inset: 0, background: fillCss(value), opacity: value.opacity, pointerEvents: 'none' }}>
    {value.mode === 'image' && value.src && <UITranslationBoundary attributes={["alt"]}><img src={value.src} crossOrigin="anonymous" alt="Fondo" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></UITranslationBoundary>}
  </div>;
}
export function elementCss(e: ArtElement): CSSProperties {
  return { position: 'absolute', left: e.x, top: e.y, width: e.width, height: e.height,
    transform: `rotate(${e.rotation}deg)`, opacity: e.opacity,
    borderRadius: e.radius, border: e.borderWidth ? `${e.borderWidth}px solid ${e.borderColor}` : undefined,
    boxShadow: e.shadow, boxSizing: 'border-box', userSelect: 'none', touchAction: 'none',
  };
}
export function ElementContent({ element: e }: { element: ArtElement }) {
  if (e.kind === 'text') return <div style={{ width: '100%', height: '100%', fontFamily: e.fontFamily, fontSize: e.fontSize, fontWeight: e.fontWeight, color: e.color,
    fontStyle: e.italic ? 'italic' : 'normal', textDecoration: e.underline ? 'underline' : 'none', textAlign: e.align, lineHeight: e.lineHeight,
    letterSpacing: e.letterSpacing, textShadow: e.textShadow, whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}>{e.text}</div>;
  if (e.kind === 'image') return <img src={e.src || undefined} alt={e.name} crossOrigin="anonymous" draggable={false} style={{ width: '100%', height: '100%', borderRadius: e.radius, objectFit: e.fit, objectPosition: `${e.positionX}% ${e.positionY}%`, transform: `scale(${e.flipX ? -1 : 1}, ${e.flipY ? -1 : 1})` }} />;
  if (e.kind === 'icon') {
    if (e.icon === 'Original' && e.src) return <div style={{ width: '100%', height: '100%', backgroundColor: e.color, maskImage: `url("${e.src}")`, maskSize: 'contain', maskRepeat: 'no-repeat', maskPosition: 'center' }} />;
    const Icon = ART_ICONS[e.icon]?.component ?? Home;
    return <Icon aria-hidden style={{ width: '100%', height: '100%', color: e.color }} strokeWidth={2} />;
  }
  return <div style={{ position: 'absolute', inset: 0, borderRadius: e.radius, overflow: 'hidden' }}>
    {e.templateGradient ? <div style={{ position: 'absolute', inset: 0, backgroundColor: e.fill.color, backgroundImage: e.templateGradient }} /> : <Background value={e.fill} />}
  </div>;
}
export function Artboard({ doc, slide, id, onPointerDown, onElementPointerDown, onElementDoubleClick, children }: {
  doc: ArtDocument; slide: ArtSlide; id?: string; children?: ReactNode;
  onPointerDown?: PointerEventHandler<HTMLDivElement>;
  onElementPointerDown?: (event: React.PointerEvent<HTMLDivElement>, element: ArtElement) => void;
  onElementDoubleClick?: (element: ArtElement) => void;
}) {
  return <div id={id} data-artboard={slide.id} onPointerDown={onPointerDown} style={{ position: 'relative', width: doc.width, height: doc.height, isolation: 'isolate', overflow: 'hidden', background: '#fff' }}>
    <Background value={slide.background} />
    {slide.elements.filter(e => !e.hidden).map(e => <div key={e.id} data-element-id={e.id} style={{ ...elementCss(e), cursor: onElementPointerDown && !e.locked ? 'move' : undefined, pointerEvents: e.locked ? 'none' : undefined }}
      onPointerDown={event => onElementPointerDown?.(event, e)} onDoubleClick={() => onElementDoubleClick?.(e)}><ElementContent element={e} /></div>)}
    {children}
  </div>;
}
