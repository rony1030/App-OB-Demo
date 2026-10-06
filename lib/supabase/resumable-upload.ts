import { createClient } from '@/lib/supabase/client';
import { getSupabaseConfig } from '@/lib/supabase/config';

export const MAX_PROJECT_IMAGE_BYTES = 50 * 1024 * 1024;

const TUS_CHUNK_SIZE = 6 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/svg+xml']);

type UploadProjectImageOptions = {
  file: File;
  storagePath: string;
  onProgress?: (percentage: number) => void;
};

function getResumableEndpoint(supabaseUrl: string) {
  const url = new URL(supabaseUrl);

  if (url.hostname.endsWith('.supabase.co')) {
    url.hostname = url.hostname.replace(/\.supabase\.co$/, '.storage.supabase.co');
  }

  url.pathname = '/storage/v1/upload/resumable';
  url.search = '';
  url.hash = '';
  return url.toString();
}

function sanitizePathPart(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/(^-+|-+$)/g, '') || 'proyecto';
}

function extensionFor(file: File) {
  const fileType = (file.type || '').toLowerCase();
  if (fileType === 'image/jpeg' || fileType === 'image/jpg') return 'jpg';
  if (fileType === 'image/png') return 'png';
  if (fileType === 'image/webp') return 'webp';
  if (fileType === 'image/svg+xml') return 'svg';
  const nameExt = file.name.split('.').pop()?.toLowerCase();
  return nameExt && ['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(nameExt) ? nameExt : 'jpg';
}

export function validateProjectImage(file: File): string | null {
  const fileType = (file.type || '').toLowerCase();
  const nameExt = file.name.split('.').pop()?.toLowerCase() || '';
  const isAllowedExt = ['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(nameExt);

  if (!ALLOWED_IMAGE_TYPES.has(fileType) && !isAllowedExt) {
    return `${file.name}: formato no permitido. Usa JPG, PNG o WebP.`;
  }

  if (file.size > MAX_PROJECT_IMAGE_BYTES) {
    return `${file.name}: supera el máximo de 50 MB por imagen.`;
  }

  if (file.size === 0) {
    return `${file.name}: el archivo está vacío.`;
  }

  return null;
}

export function createProjectMediaPath(
  organizationSlug: string,
  projectSlug: string,
  kind: 'hero' | 'gallery',
  file: File,
  index = 0
) {
  const uniqueId = crypto.randomUUID();
  const suffix = kind === 'hero' ? 'hero' : `gallery-${index + 1}`;

  return `${sanitizePathPart(organizationSlug)}/projects/${sanitizePathPart(projectSlug)}/${suffix}-${uniqueId}.${extensionFor(file)}`;
}

export async function uploadProjectImageResumable({
  file,
  storagePath,
  onProgress,
}: UploadProjectImageOptions): Promise<string> {
  const validationError = validateProjectImage(file);
  if (validationError) throw new Error(validationError);

  const supabase = createClient();
  const { data, error } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  if (error || !accessToken) {
    throw new Error('Tu sesión venció. Inicia sesión nuevamente antes de subir las imágenes.');
  }

  const { Upload } = await import('tus-js-client');
  const { supabaseUrl } = getSupabaseConfig();

  return await new Promise<string>((resolve, reject) => {
    const upload = new Upload(file, {
      endpoint: getResumableEndpoint(supabaseUrl),
      retryDelays: [0, 3_000, 5_000, 10_000, 20_000],
      headers: {
        authorization: `Bearer ${accessToken}`,
        'x-upsert': 'false',
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      chunkSize: TUS_CHUNK_SIZE,
      metadata: {
        bucketName: 'public-assets',
        objectName: storagePath,
        contentType: file.type,
        cacheControl: '3600',
      },
      fingerprint: async () =>
        `ob-project-image-${storagePath}-${file.name}-${file.size}-${file.lastModified}`,
      onProgress: (bytesUploaded, bytesTotal) => {
        const percentage = bytesTotal > 0 ? (bytesUploaded / bytesTotal) * 100 : 0;
        onProgress?.(Math.min(100, Math.round(percentage)));
      },
      onError: (uploadError) => {
        reject(new Error(`No se pudo subir ${file.name}: ${uploadError.message}`));
      },
      onSuccess: () => resolve(storagePath),
    });

    upload
      .findPreviousUploads()
      .then((previousUploads) => {
        if (previousUploads.length > 0) {
          upload.resumeFromPreviousUpload(previousUploads[0]);
        }
        upload.start();
      })
      .catch((resumeError: unknown) => {
        reject(
          resumeError instanceof Error
            ? resumeError
            : new Error(`No se pudo iniciar la carga de ${file.name}.`)
        );
      });
  });
}

export async function removeUploadedProjectImages(storagePaths: string[]) {
  const uniquePaths = Array.from(new Set(storagePaths));
  if (uniquePaths.length === 0) return;

  const supabase = createClient();
  const { error } = await supabase.storage.from('public-assets').remove(uniquePaths);

  if (error) {
    console.warn('No se pudieron limpiar las imágenes de una carga fallida:', error.message);
  }
}
