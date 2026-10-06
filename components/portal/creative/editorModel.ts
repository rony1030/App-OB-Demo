export type ElementKind = 'text' | 'image' | 'shape' | 'icon';
export interface Fill {
  mode: 'solid' | 'linear' | 'radial' | 'image';
  color: string;
  color2: string;
  angle: number;
  src: string;
  opacity: number;
}
export interface ArtElement {
  id: string;
  name: string;
  kind: ElementKind;
  x: number; y: number; width: number; height: number;
  rotation: number; opacity: number;
  locked: boolean; hidden: boolean; groupId?: string;
  text: string; fontFamily: string; fontSize: number; fontWeight: number;
  italic: boolean; underline: boolean; align: 'left' | 'center' | 'right';
  lineHeight: number; letterSpacing: number; color: string; textShadow: string;
  src: string; fit: 'cover' | 'contain' | 'fill'; positionX: number; positionY: number;
  flipX: boolean; flipY: boolean; icon: string;
  fill: Fill; radius: number; borderWidth: number; borderColor: string; shadow: string;
  /** Trusted template gradients only; cleared when changing the fill. */
  templateGradient?: string;
}
export interface ArtSlide { id: string; name: string; background: Fill; elements: ArtElement[] }
export interface ArtDocument {
  version: 2; projectId: string; name: string;
  width: number; height: number; slides: ArtSlide[];
}
export const uid = () => crypto.randomUUID();
export const fill = (color = '#ffffff'): Fill => ({ mode: 'solid', color, color2: '#0f172a', angle: 180, src: '', opacity: 1 });
export function newElement(kind: ElementKind, patch: Partial<ArtElement> = {}): ArtElement {
  return {
    id: uid(), name: ({ text: 'Texto', image: 'Imagen', shape: 'Forma', icon: 'Icono' })[kind], kind,
    x: 60, y: 80, width: kind === 'text' ? 300 : 120, height: kind === 'text' ? 70 : 120,
    rotation: 0, opacity: 1, locked: false, hidden: false,
    text: 'Escribe tu texto', fontFamily: 'Arial, sans-serif', fontSize: 28, fontWeight: 700,
    italic: false, underline: false, align: 'left', lineHeight: 1.2, letterSpacing: 0, color: '#0f172a', textShadow: 'none',
    src: '', fit: 'cover', positionX: 50, positionY: 50, flipX: false, flipY: false, icon: 'Home',
    fill: fill(kind === 'shape' ? '#0f0b50' : 'transparent'), radius: 0, borderWidth: 0, borderColor: '#0f172a', shadow: 'none',
    ...patch,
  };
}
export const newSlide = (name = 'Lámina nueva'): ArtSlide => ({ id: uid(), name, background: fill(), elements: [] });
export function duplicateElements(elements: ArtElement[], offset = 16): ArtElement[] {
  const groups = new Map<string, string>();
  return elements.map(e => {
    if (e.groupId && !groups.has(e.groupId)) groups.set(e.groupId, uid());
    return { ...structuredClone(e), id: uid(), x: e.x + offset, y: e.y + offset, groupId: e.groupId ? groups.get(e.groupId) : undefined };
  });
}
export function duplicateSlide(slide: ArtSlide): ArtSlide {
  return { ...structuredClone(slide), id: uid(), name: `${slide.name} · copia`, elements: duplicateElements(slide.elements, 0) };
}
export function bounds(elements: ArtElement[]) {
  const x = Math.min(...elements.map(e => e.x)), y = Math.min(...elements.map(e => e.y));
  return { x, y, width: Math.max(...elements.map(e => e.x + e.width)) - x, height: Math.max(...elements.map(e => e.y + e.height)) - y };
}
export function resizeDocument(doc: ArtDocument, height: number): ArtDocument {
  const scale = height / doc.height;
  return { ...doc, height, slides: doc.slides.map(s => ({ ...s, elements: s.elements.map(e => ({ ...e, y: e.y * scale, height: e.height * scale })) })) };
}
export function fillCss(f: Fill): string {
  if (f.mode === 'linear') return `linear-gradient(${f.angle}deg, ${f.color}, ${f.color2})`;
  if (f.mode === 'radial') return `radial-gradient(ellipse at center, ${f.color}, ${f.color2})`;
  return f.color;
}
export function safeImageSource(src: string): boolean {
  return src === '' || /^https?:\/\//i.test(src) || /^\/(?!\/)/.test(src) || /^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+/=\s]+$/i.test(src);
}
const finite = (value: unknown, min: number, max: number): value is number => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
function checkFill(value: unknown): asserts value is Fill {
  const f = value as Fill;
  if (!f || !['solid', 'linear', 'radial', 'image'].includes(f.mode) || typeof f.color !== 'string' || typeof f.color2 !== 'string'
    || /[;{}]|url\(/i.test(f.color + f.color2) || !finite(f.angle, -360, 360) || !finite(f.opacity, 0, 1) || typeof f.src !== 'string' || !safeImageSource(f.src)) throw new Error('Fondo o relleno inválido.');
}
/** Imports are data only. No raw HTML/SVG/CSS URLs are accepted. */
export function parseDocument(input: unknown): ArtDocument {
  const doc = structuredClone(input) as ArtDocument;
  if (!doc || doc.version !== 2 || typeof doc.projectId !== 'string' || typeof doc.name !== 'string' || doc.width !== 540 || ![540, 675].includes(doc.height)
    || !Array.isArray(doc.slides) || doc.slides.length > 100) throw new Error('Archivo incompatible. Selecciona un diseño del editor versión 2.');
  const ids = new Set<string>();
  const checkId = (id: unknown) => { if (typeof id !== 'string' || !id || ids.has(id)) throw new Error('Identificadores de elementos o láminas inválidos.'); ids.add(id); };
  for (const s of doc.slides) {
    checkId(s.id); checkFill(s.background);
    if (typeof s.name !== 'string' || !Array.isArray(s.elements) || s.elements.length > 1000) throw new Error('Lámina inválida o demasiado grande.');
    for (const e of s.elements) {
      checkId(e.id); checkFill(e.fill);
      if (!['text', 'image', 'shape', 'icon'].includes(e.kind)) throw new Error('Tipo de elemento inválido.');
      for (const k of ['name', 'text', 'fontFamily', 'color', 'textShadow', 'src', 'icon', 'borderColor', 'shadow'] as const) if (typeof e[k] !== 'string') throw new Error(`Propiedad inválida: ${k}`);
      for (const k of ['locked', 'hidden', 'italic', 'underline', 'flipX', 'flipY'] as const) if (typeof e[k] !== 'boolean') throw new Error(`Propiedad inválida: ${k}`);
      if (e.groupId !== undefined && typeof e.groupId !== 'string') throw new Error('Grupo inválido.');
      if (!safeImageSource(e.src) || !['cover', 'contain', 'fill'].includes(e.fit) || !['left', 'center', 'right'].includes(e.align)) throw new Error('Imagen o alineación inválida.');
      for (const k of ['x', 'y', 'rotation', 'letterSpacing'] as const) if (!finite(e[k], -10000, 10000)) throw new Error('Posición inválida.');
      for (const k of ['width', 'height', 'fontSize', 'lineHeight'] as const) if (!finite(e[k], 0.01, 10000)) throw new Error('Tamaño inválido.');
      for (const k of ['radius', 'borderWidth', 'fontWeight'] as const) if (!finite(e[k], 0, 10000)) throw new Error('Estilo inválido.');
      if (!finite(e.opacity, 0, 1) || !finite(e.positionX, 0, 100) || !finite(e.positionY, 0, 100)) throw new Error('Opacidad o encuadre inválido.');
      for (const css of [e.color, e.borderColor, e.fontFamily, e.shadow, e.textShadow, e.templateGradient ?? '']) if (/[;{}]|url\(|expression\(/i.test(css)) throw new Error('Estilo no permitido.');
      if (e.templateGradient && !/^(linear|radial)-gradient\(/.test(e.templateGradient)) throw new Error('Degradado inválido.');
    }
  }
  return doc;
}
