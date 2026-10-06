import { fill, newElement, newSlide, uid, type ArtElement, type ArtSlide } from './editorModel';

const number = (value: string) => Number.parseFloat(value) || 0;
const transparent = (value: string) => value === 'transparent' || value === 'rgba(0, 0, 0, 0)';

async function captureIcon(node: SVGElement, color: string): Promise<string> {
  const copy = node.cloneNode(true) as SVGElement;
  copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  copy.setAttribute('color', color); copy.setAttribute('stroke', color);
  copy.setAttribute('width', '128'); copy.setAttribute('height', '128');
  const blob = new Blob([new XMLSerializer().serializeToString(copy)], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image(); image.src = url; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 128;
    canvas.getContext('2d')!.drawImage(image, 0, 0, 128, 128);
    return canvas.toDataURL('image/png');
  } finally { URL.revokeObjectURL(url); }
}

/** Measure the existing templates at their native size, converting every painted part to editable data. */
export async function captureTemplate(root: HTMLElement, name: string): Promise<ArtSlide> {
  await document.fonts.ready;
  await Promise.all(Array.from(root.querySelectorAll('img')).map(img => img.decode().catch(() => undefined)));
  const slide = newSlide(name);
  const origin = root.getBoundingClientRect();
  const pending: Promise<void>[] = [];
  function walk(node: Element, inheritedOpacity = 1, groupId?: string) {
    const style = getComputedStyle(node), rect = node.getBoundingClientRect();
    if (style.display === 'none' || style.visibility === 'hidden' || !rect.width || !rect.height) return;
    const opacity = inheritedOpacity * number(style.opacity);
    const geometry = { x: rect.x - origin.x, y: rect.y - origin.y, width: rect.width, height: rect.height, opacity, groupId };
    const isRootSurface = node === root.firstElementChild;
    if (isRootSurface && !transparent(style.backgroundColor)) slide.background = fill(style.backgroundColor);
    const gradient = style.backgroundImage !== 'none' && !style.backgroundImage.includes('url(') ? style.backgroundImage : undefined;
    const hasBackground = (!transparent(style.backgroundColor) && !isRootSurface) || gradient;
    if (hasBackground || number(style.borderTopWidth) || style.boxShadow !== 'none' && node !== root) {
      slide.elements.push(newElement('shape', { ...geometry, name: gradient ? 'Degradado de plantilla' : 'Forma de plantilla',
        fill: fill(hasBackground ? style.backgroundColor : 'transparent'), templateGradient: gradient,
        radius: number(style.borderRadius), borderWidth: number(style.borderTopWidth), borderColor: style.borderTopColor, shadow: style.boxShadow,
      }));
    }
    if (node instanceof HTMLImageElement) {
      if (geometry.x === 0 && geometry.y === 0 && Math.abs(rect.width - origin.width) < 1 && Math.abs(rect.height - origin.height) < 1) {
        slide.background = { ...slide.background, mode: 'image', src: node.currentSrc || node.src };
        return;
      }
      slide.elements.push(newElement('image', { ...geometry, name: node.alt || 'Imagen de plantilla', src: node.currentSrc || node.src,
        fit: style.objectFit === 'contain' ? 'contain' : style.objectFit === 'fill' ? 'fill' : 'cover', radius: number(style.borderRadius) }));
      return;
    }
    if (node instanceof SVGElement) {
      const element = newElement('icon', { ...geometry, name: 'Icono de plantilla', color: style.color, icon: 'Original' });
      slide.elements.push(element);
      pending.push(captureIcon(node, style.color).then(src => { element.src = src; }));
      return;
    }
    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) {
        const range = document.createRange(); range.selectNodeContents(child);
        const textRect = range.getBoundingClientRect();
        const fontSize = number(style.fontSize), line = number(style.lineHeight) || fontSize * 1.2;
        const text = child.textContent.replace(/\s+/g, ' ').trim();
        const onlyText = Array.from(node.childNodes).every(n => n.nodeType === Node.TEXT_NODE);
        const align = style.textAlign === 'center' || style.textAlign === 'right' ? style.textAlign : 'left';
        const x = onlyText && align !== 'left' ? rect.x + number(style.paddingLeft) : textRect.x;
        const width = onlyText ? Math.max(textRect.width + 1, rect.right - x - number(style.paddingRight)) : textRect.width + 1;
        slide.elements.push(newElement('text', { ...geometry, name: text.slice(0, 45), text: style.textTransform === 'uppercase' ? text.toUpperCase() : text,
          x: x - origin.x, y: textRect.y - origin.y - Math.max(0, line - textRect.height) / 2,
          width, height: Math.max(line, textRect.height), fontFamily: style.fontFamily, fontSize, fontWeight: number(style.fontWeight) || 400,
          lineHeight: line / fontSize, letterSpacing: number(style.letterSpacing), color: style.color, italic: style.fontStyle === 'italic',
          underline: style.textDecorationLine.includes('underline'), align, textShadow: style.textShadow,
        }));
      } else if (child instanceof Element) {
        // Keep original visual blocks together; individual children remain accessible in Layers.
        walk(child, opacity, isRootSurface ? uid() : groupId);
      }
    }
  }
  for (const child of root.children) walk(child);
  await Promise.all(pending);
  // Full-canvas image/overlay stay independently selectable through Layers, behind the content.
  slide.elements = slide.elements.map((e: ArtElement) => ({ ...e, groupId: slide.elements.filter(other => other.groupId === e.groupId).length > 1 ? e.groupId : undefined }));
  return slide;
}
