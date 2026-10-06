import verifiedAssetPaths from './hostinger-verified-assets.json';

/**
 * Hostinger Persistent Storage Constants & Path Helpers
 * Safe for both Client and Server environments.
 */

export const ALLOWED_MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
};

/**
 * Exact public-assets inventory copied to persistent storage and rechecked by
 * size and SHA-256. Source objects remain in Supabase as a backup.
 */
export const HOSTINGER_VERIFIED_ASSETS = new Set<string>(verifiedAssetPaths);

// Backward compatibility alias
export const HOSTINGER_PILOT_LOGOS = HOSTINGER_VERIFIED_ASSETS;

/**
 * Check if a given asset path is verified and authorized in Hostinger storage.
 */
export function getHostingerAssetUrl(assetPath: string): string | null {
  if (!assetPath || typeof assetPath !== 'string') return null;
  const rawPath = assetPath.split(/[?#]/, 1)[0];
  let normalized = rawPath
    .replace(/^https?:\/\/[^\/]+/i, '')
    .replace(/^\/?(cdn-storage|storage\/v1)\/(object|render\/image)\/public\/public-assets\//i, '')
    .replace(/^\/?(api\/media|public-assets)\//i, '')
    .replace(/^\/+/, '')
    .replace(/\\/g, '/');

  try {
    normalized = normalized.split('/').map(decodeURIComponent).join('/');
  } catch {
    return null;
  }
  if (!HOSTINGER_VERIFIED_ASSETS.has(normalized)) return null;
  return `/api/media/${normalized.split('/').map(encodeURIComponent).join('/')}`;
}

export function isHostingerVerifiedAsset(assetPath: string): boolean {
  return getHostingerAssetUrl(assetPath) !== null;
}

// Backward compatibility helper
export const isHostingerPilotAsset = isHostingerVerifiedAsset;

/**
 * Default Cache-Control policy for persistent assets.
 */
export const DEFAULT_CACHE_CONTROL =
  process.env.HOSTINGER_STORAGE_CACHE_CONTROL || 'public, max-age=86400, stale-while-revalidate=604800';
