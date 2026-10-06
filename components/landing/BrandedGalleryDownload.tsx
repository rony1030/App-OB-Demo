'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { downloadImagePack, type DownloadProgress } from '@/lib/image-pack-download';

type Props = {
  projectId: number;
  projectName: string;
  images: string[];
  className?: string;
  label?: string;
};

export default function BrandedGalleryDownload({ projectId, projectName, images, className = '', label = 'Descargar galería OB' }: Props) {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);

  const handleDownload = async () => {
    if (!images.length || downloading) return;
    setDownloading(true);
    try {
      await downloadImagePack(projectId, projectName, setProgress, images, undefined, true);
    } catch (error) {
      console.error('No se pudo descargar la galería:', error);
    } finally {
      setDownloading(false);
      setProgress(null);
    }
  };

  return (
    <button type="button" onClick={handleDownload} disabled={downloading || images.length === 0} className={className} aria-label={label}>
      <Download className="h-4 w-4" aria-hidden="true" />
      <span>{downloading ? (progress?.status || 'Preparando descarga…') : label}</span>
    </button>
  );
}
