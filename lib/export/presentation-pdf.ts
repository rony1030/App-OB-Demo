import { domToPng } from 'modern-screenshot';
import { PDFDocument } from 'pdf-lib';

export interface ExportPdfOptions {
  filename?: string;
  slideSelector?: string;
  aspectRatio?: '1120x820' | '1920x1080' | 'portrait';
  scale?: number;
  quality?: number;
  onProgress?: (current: number, total: number, message: string) => void;
}

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}

async function waitForSlideImages(slides: HTMLElement[]) {
  const images = slides.flatMap((slide) => Array.from(slide.querySelectorAll<HTMLImageElement>('img')));
  await Promise.all(images.map(async (image) => {
    // Force eager loading for offscreen elements
    if (image.loading === 'lazy') {
      image.loading = 'eager';
    }
    if (!image.complete) {
      await new Promise<void>((resolve) => {
        const done = () => resolve();
        image.addEventListener('load', done, { once: true });
        image.addEventListener('error', done, { once: true });
        if (image.src) {
          const s = image.src;
          image.src = s;
        }
        window.setTimeout(done, 4000);
      });
    }
    if (typeof image.decode === 'function') {
      await Promise.race([
        image.decode().catch(() => undefined),
        new Promise<void>((resolve) => window.setTimeout(resolve, 2500)),
      ]);
    }
  }));
}

async function withCaptureTimeout<T>(task: Promise<T>, timeoutMs = 25000) {
  let timeoutId: number | undefined;
  try {
    return await Promise.race([
      task,
      new Promise<T>((_, reject) => {
        timeoutId = window.setTimeout(() => reject(new Error('La página tardó demasiado en procesarse.')), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId);
  }
}

/**
 * Captures all slide elements matching `slideSelector` and stitches them into
 * a high-resolution, multi-page landscape PDF.
 */
export async function exportPresentationToPdf(options: ExportPdfOptions = {}) {
  const {
    filename = 'Brochure.pdf',
    slideSelector = '[data-presentation-slide]',
    aspectRatio = '1120x820',
    scale = 2.5,
    quality = 0.95,
    onProgress,
  } = options;

  const slideElements = Array.from(document.querySelectorAll<HTMLElement>(slideSelector));

  if (slideElements.length === 0) {
    throw new Error('No se encontraron diapositivas para exportar.');
  }

  const pdfDoc = await PDFDocument.create();
  const failedSlides: number[] = [];

  let pageWidth = 840;
  let pageHeight = 615;

  if (aspectRatio === '1920x1080') {
    pageWidth = 1440;
    pageHeight = 810;
  } else if (aspectRatio === 'portrait') {
    pageWidth = 612;
    pageHeight = 792;
  }

  const total = slideElements.length;
  const captureScale = Math.min(scale || 2.0, 2.0);

  const captureFilter = (node: Node) => {
    if (node instanceof HTMLElement) {
      if (node.classList.contains('no-export') || node.hasAttribute('data-no-export')) {
        return false;
      }
    }
    return true;
  };

  for (let i = 0; i < total; i++) {
    const slide = slideElements[i];
    onProgress?.(i, total, `Cargando página ${i + 1} de ${total}…`);

    try {
      await waitForSlideImages([slide]);
      onProgress?.(i + 1, total, `Procesando página ${i + 1} de ${total}…`);

      let dataUrl: string;
      try {
        dataUrl = await withCaptureTimeout(domToPng(slide, {
          scale: captureScale,
          backgroundColor: '#ffffff',
          quality: quality || 0.95,
          font: false,
          timeout: 20000,
          filter: captureFilter,
        }), 25000);
      } catch (firstErr) {
        console.warn(`Slide ${i + 1}: reintentando con escala reducida`, firstErr);
        dataUrl = await withCaptureTimeout(domToPng(slide, {
          scale: 1.25,
          backgroundColor: '#ffffff',
          quality: 0.85,
          font: false,
          timeout: 25000,
          filter: captureFilter,
        }), 30000);
      }

      const pngBytes = dataUrlToUint8Array(dataUrl);
      dataUrl = '';

      const pngImage = await pdfDoc.embedPng(pngBytes);
      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      page.drawImage(pngImage, { x: 0, y: 0, width: pageWidth, height: pageHeight });
    } catch (err) {
      console.warn(`Error en slide ${i + 1}:`, err);
      failedSlides.push(i + 1);
    }
  }

  if (failedSlides.length) {
    throw new Error(`No se pudo generar ${failedSlides.length === 1 ? 'la página' : 'las páginas'} ${failedSlides.join(', ')} del PDF. Intenta nuevamente.`);
  }

  onProgress?.(total, total, 'Compilando archivo PDF…');
  const pdfBytes = await pdfDoc.save();

  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
  return true;
}
