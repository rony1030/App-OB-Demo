'use client';

/** A blank canvas still produces a valid PNG, so the pixels themselves have to be checked. */
export function isCanvasBlank(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return true;
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] !== 0) return false;
  }
  return true;
}

/**
 * Crops the canvas down to the actual stroke bounds. Without this the
 * signature travels surrounded by transparent padding and shrinks to a tiny
 * mark once it's fitted into its box on the PDF.
 */
export function trimCanvas(source: HTMLCanvasElement): string {
  const ctx = source.getContext('2d', { willReadFrequently: true });
  if (!ctx) return source.toDataURL('image/png');
  const { width: w, height: h } = source;
  const { data } = ctx.getImageData(0, 0, w, h);

  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] !== 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return source.toDataURL('image/png');

  const pad = 6;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(w - 1, maxX + pad);
  maxY = Math.min(h - 1, maxY + pad);

  const out = document.createElement('canvas');
  out.width = maxX - minX + 1;
  out.height = maxY - minY + 1;
  out.getContext('2d', { willReadFrequently: true })?.drawImage(source, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
  return out.toDataURL('image/png');
}

/**
 * Renders a typed name as a handwritten-looking signature image using a
 * calligraphic font already loaded on the page. Generous canvas padding
 * accounts for ascenders/descenders the font metrics don't report, then
 * `trimCanvas` crops it back down.
 */
export function renderTypedSignature(text: string, fontFamily: string, size = 72, weight = 400): string | null {
  const value = text.trim();
  if (!value) return null;

  const font = `${weight} ${size}px ${fontFamily}`;
  const meter = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  if (!meter) return null;
  meter.font = font;
  const textWidth = meter.measureText(value).width;

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = Math.ceil(textWidth + size * 1.4);
  tempCanvas.height = Math.ceil(size * 2.2);

  const ctx = tempCanvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.font = font;
  ctx.fillStyle = '#0A0A33';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(value, tempCanvas.width / 2, tempCanvas.height / 2);

  return trimCanvas(tempCanvas);
}
