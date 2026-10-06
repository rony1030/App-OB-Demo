import { getSupabaseConfig } from './config';
import { getHostingerAssetUrl } from '@/lib/storage/hostinger-constants';

export const PUBLIC_ASSETS_BUCKET = 'public-assets';
export const PRIVATE_DOCUMENTS_BUCKET = 'private-documents';

function getCdnPrefix() {
  const { supabaseUrl } = getSupabaseConfig();
  if (process.env.NEXT_PUBLIC_STORAGE_PROXY !== 'true') {
    return `${supabaseUrl}/storage/v1`;
  }
  if (typeof window !== 'undefined') return '/cdn-storage';
  const host = process.env.NEXT_PUBLIC_SITE_URL || '';
  return host ? `${host.startsWith('http') ? host : `https://${host}`}/cdn-storage` : '/cdn-storage';
}

export function supabaseUrlToCdn(url: string): string {
  if (!url) return url;
  const hostedAsset = getHostingerAssetUrl(url);
  if (hostedAsset) return hostedAsset;
  if (process.env.NEXT_PUBLIC_STORAGE_PROXY !== 'true') return url;
  const { supabaseUrl } = getSupabaseConfig();
  if (url.includes(supabaseUrl + '/storage/v1/')) {
    return url.replace(supabaseUrl + '/storage/v1', getCdnPrefix());
  }
  return url;
}

export function getPublicAssetUrl(path: string) {
  if (!path) return '';
  if (/^data:image\//i.test(path)) return path;
  // Older dossier copies encoded a data URL as though it were a storage path.
  // Recover those immutable snapshots without changing their stored content.
  const encodedLogo = path.match(/\/object\/public\/public-assets\/(data%3Aimage%2F[^?#]+)/i)?.[1];
  if (encodedLogo) {
    try {
      const decodedLogo = decodeURIComponent(encodedLogo);
      if (/^data:image\/(?:png|jpe?g|webp|gif|svg\+xml);base64,/i.test(decodedLogo)) return decodedLogo;
    } catch {
      // Keep the original URL if it cannot be decoded safely.
    }
  }

  // Verified objects are served locally; Supabase retains only the backup.
  const hostedAsset = getHostingerAssetUrl(path);
  if (hostedAsset) return hostedAsset;

  // 2. Default standard Supabase fallback
  if (/^https?:\/\//i.test(path)) return supabaseUrlToCdn(path);
  if (path.startsWith('/')) return path;
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  return `${getCdnPrefix()}/object/public/${PUBLIC_ASSETS_BUCKET}/${encodedPath}`;
}

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif';
}

export function getOptimizedImageUrl(path: string, options: ImageTransformOptions = {}) {
  if (!path) return '';
  const hostedAsset = getHostingerAssetUrl(path);
  if (hostedAsset) return hostedAsset;

  const isFullUrl = /^https?:\/\//i.test(path);

  let basePath = path;
  const proxiedPublicObject = path.match(/^\/cdn-storage\/object\/public\/(.+)$/i);
  if (proxiedPublicObject) {
    basePath = proxiedPublicObject[1];
  } else if (path.startsWith('/')) {
    // Hostinger/local routes are already same-origin assets; only Supabase
    // public objects support the Storage image transformation endpoint.
    return path;
  } else if (isFullUrl) {
    const match = path.match(/\/storage\/v1\/object\/public\/([^?]+)/);
    if (!match) return supabaseUrlToCdn(path);
    basePath = match[1];
  } else {
    basePath = `${PUBLIC_ASSETS_BUCKET}/${path}`;
  }

  const encodedPath = basePath.split('/').map(encodeURIComponent).join('/');
  const params = new URLSearchParams();
  if (options.width) params.set('width', String(options.width));
  if (options.height) params.set('height', String(options.height));
  params.set('quality', String(options.quality || 75));
  params.set('format', options.format || 'webp');

  return `${getCdnPrefix()}/render/image/public/${encodedPath}?${params.toString()}`;
}

export function supabaseImageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  const hostedAsset = getHostingerAssetUrl(src);
  if (hostedAsset) return hostedAsset;
  if (src.startsWith('/') || !src.includes('supabase.co')) {
    return `${src}${src.includes('?') ? '&' : '?'}w=${width}`;
  }

  const match = src.match(/\/storage\/v1\/object\/public\/([^?]+)/);
  if (!match) {
    const cdnMatch = src.match(/\/cdn-storage\/object\/public\/([^?]+)/);
    if (!cdnMatch) return src;
    return `/cdn-storage/object/public/${cdnMatch[1]}`;
  }

  return `/cdn-storage/object/public/${match[1]}`;
}

export function isCdnImage(src: string): boolean {
  return typeof src === 'string' && (src.includes('/cdn-storage/') || src.includes('supabase.co/storage'));
}
