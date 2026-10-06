'use client';

import JSZip from 'jszip';

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar: ${url}`));
    img.src = url;
  });
}

function applyWatermark(
  sourceImg: HTMLImageElement,
  watermarkImg: HTMLImageElement | null
): Blob | Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = sourceImg.naturalWidth;
  canvas.height = sourceImg.naturalHeight;
  const ctx = canvas.getContext('2d')!;

  ctx.drawImage(sourceImg, 0, 0);

  if (watermarkImg) {
    const maxWatermarkWidth = canvas.width * 0.25;
    const scale = Math.min(maxWatermarkWidth / watermarkImg.naturalWidth, 1);
    const wmW = watermarkImg.naturalWidth * scale;
    const wmH = watermarkImg.naturalHeight * scale;
    const padding = canvas.width * 0.03;
    const x = canvas.width - wmW - padding;
    const y = canvas.height - wmH - padding;

    ctx.globalAlpha = 0.5;
    ctx.drawImage(watermarkImg, x, y, wmW, wmH);
    ctx.globalAlpha = 1.0;
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Error al generar imagen'))),
      'image/jpeg',
      0.92
    );
  });
}

export interface DownloadProgress {
  current: number;
  total: number;
  status: string;
}

export async function downloadImagePack(
  projectId: number,
  projectName: string,
  onProgress?: (progress: DownloadProgress) => void,
  fallbackImages: string[] = [],
  fallbackWatermarkUrl = '/brand/ob-brokers-horizontal-blanco.png',
  preferFallbackImages = false
): Promise<void> {
  onProgress?.({ current: 0, total: 1, status: 'Obteniendo información del paquete...' });

  let images = fallbackImages;
  let watermarkUrl: string | null = fallbackWatermarkUrl;

  try {
    if (preferFallbackImages && fallbackImages.length > 0) throw new Error('Usar galería curada');
    const res = await fetch(`/api/projects/${projectId}/image-pack/download`);
    if (res.ok) {
      const data = (await res.json()) as {
        images: string[];
        watermarkUrl: string | null;
      };
      if (data.images?.length) {
        images = data.images;
        watermarkUrl = data.watermarkUrl || fallbackWatermarkUrl;
      }
    }
  } catch {
    // Use the public gallery fallback below.
  }

  if (!images || images.length === 0) {
    throw new Error('No hay imágenes en el paquete.');
  }

  const total = images.length;
  onProgress?.({ current: 0, total, status: 'Cargando marca de agua...' });

  let watermarkImg: HTMLImageElement | null = null;
  if (watermarkUrl) {
    try {
      watermarkImg = await loadImage(watermarkUrl);
    } catch {
      // proceed without watermark
    }
  }

  const zip = new JSZip();
  const folder = zip.folder(
    projectName.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s-]/g, '').trim() || 'Paquete-Imagenes'
  )!;

  for (let i = 0; i < images.length; i++) {
    onProgress?.({
      current: i + 1,
      total,
      status: `Procesando imagen ${i + 1} de ${total}...`,
    });

    try {
      const img = await loadImage(images[i]);
      const blob = await applyWatermark(img, watermarkImg);
      folder.file(`imagen-${String(i + 1).padStart(2, '0')}.jpg`, blob);
    } catch (err) {
      console.warn(`Error procesando imagen ${i + 1}:`, err);
    }
  }

  onProgress?.({ current: total, total, status: 'Generando archivo ZIP...' });

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${projectName.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s-]/g, '').trim() || 'Paquete'}-Imagenes.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
