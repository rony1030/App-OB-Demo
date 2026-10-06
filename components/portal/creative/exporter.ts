import { domToPng } from 'modern-screenshot';
import JSZip from 'jszip';
import type { CarouselProjectData } from './types';

function triggerDownload(href: string, fileName: string) {
  const link = document.createElement('a');
  link.href = href;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function prepareExport(element: HTMLElement) {
  await document.fonts.ready;
  await Promise.all(Array.from(element.querySelectorAll('img')).map(async image => {
    if (!image.getAttribute('src')) throw new Error('Hay una imagen vacía. Reemplázala o elimínala antes de exportar.');
    try { await image.decode(); } catch { throw new Error(`No se pudo cargar la imagen «${image.alt || 'sin nombre'}». Reemplázala o vuelve a intentarlo.`); }
  }));
}

export async function exportSlideAsPng(elementId: string, fileName: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`No se encontró el elemento ${elementId} para exportar.`);
  await prepareExport(element);
  const dataUrl = await domToPng(element, { scale: 2, quality: 1 });
  triggerDownload(dataUrl, fileName);
}

export async function exportAllSlidesAsZip(
  idPrefix: string,
  projectName: string,
  totalSlides: number,
  onProgress?: (done: number, total: number) => void
): Promise<void> {
  const zip = new JSZip();
  for (let i = 0; i < totalSlides; i++) {
    const element = document.getElementById(`${idPrefix}-${i}`);
    if (!element) throw new Error(`No se encontró la lámina ${i + 1}.`);
    await prepareExport(element);
    const dataUrl = await domToPng(element, { scale: 2, quality: 1 });
    const base64 = dataUrl.split(',')[1];
    zip.file(`lamina-${String(i + 1).padStart(2, '0')}.png`, base64, { base64: true });
    onProgress?.(i + 1, totalSlides);
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, `${slugify(projectName)}-carrusel.zip`);
  URL.revokeObjectURL(url);
}

export function exportDesignAsJson(data: CarouselProjectData, fileName?: string): void {
  const payload = {
    version: 1,
    app: 'ob-brokers-estudio-creativo',
    exportedAt: new Date().toISOString(),
    editableData: data,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, fileName ?? `${slugify(data.propertyName)}-diseno.json`);
  URL.revokeObjectURL(url);
}

// exportEditableProjectPackage (PDF de referencia + SVG editable + assets originales en ZIP)
// queda documentado como Fase 4 — no se implementa aun porque no hay consumidor en el editor Fase 1.
