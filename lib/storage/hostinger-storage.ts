import fs from 'fs';
import path from 'path';
import {
  ALLOWED_MIME_TYPES,
  HOSTINGER_PILOT_LOGOS,
  DEFAULT_CACHE_CONTROL,
  isHostingerPilotAsset,
} from './hostinger-constants';

export { ALLOWED_MIME_TYPES, HOSTINGER_PILOT_LOGOS, isHostingerPilotAsset, DEFAULT_CACHE_CONTROL };

/**
 * Get server-configured persistent storage base directory.
 * Private server variable only — NEVER NEXT_PUBLIC.
 */
export function getHostingerStorageBaseDir(): string {
  return (
    process.env.HOSTINGER_PERSISTENT_STORAGE_DIR ||
    process.env.PERSISTENT_STORAGE_DIR ||
    '/home/u868879774/domains/brokers.osvaldobello.com/storage/public-assets'
  );
}

export interface ReadAssetResult {
  status: 'SUCCESS' | 'PARTIAL' | 'RANGE_NOT_SATISFIABLE' | 'FORBIDDEN' | 'NOT_FOUND' | 'INVALID_TYPE';
  buffer?: Buffer;
  mimeType?: string;
  sizeBytes?: number;
  headers?: Record<string, string>;
  error?: string;
}

interface ValidatedPathResult {
  status: 'SUCCESS' | 'FORBIDDEN' | 'NOT_FOUND' | 'INVALID_TYPE';
  error?: string;
  canonicalTarget?: string;
  mimeType?: string;
  fileStat?: fs.Stats;
}

/**
 * Validate path syntax, pilot authorization, canonical realpath, and containment.
 */
async function validateAndResolveAssetPath(
  relativePath: string,
  customBaseDir?: string
): Promise<ValidatedPathResult> {
  // 1. Basic type & emptiness checks
  if (typeof relativePath !== 'string' || !relativePath.trim()) {
    return { status: 'FORBIDDEN', error: 'Invalid or empty path.' };
  }

  // 2. Reject absolute paths
  if (path.isAbsolute(relativePath)) {
    return { status: 'FORBIDDEN', error: 'Absolute paths are strictly forbidden.' };
  }

  // 3. Strict character whitelist to avoid control chars / injection
  const normalizedRel = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  if (!/^[a-zA-Z0-9_\-\.\/ ]+$/.test(normalizedRel)) {
    return { status: 'FORBIDDEN', error: 'Path contains prohibited characters.' };
  }

  // 4. Reject any '..' or '.' segments in raw relative path
  const segments = normalizedRel.split('/');
  if (segments.some((seg) => seg === '..' || seg === '.' || seg === '')) {
    return { status: 'FORBIDDEN', error: 'Path traversal segments are strictly forbidden.' };
  }

  // 5. Enforce pilot asset whitelist (Only exact authorized pilot paths)
  if (!HOSTINGER_PILOT_LOGOS.has(normalizedRel)) {
    return { status: 'FORBIDDEN', error: `Asset '${normalizedRel}' is not part of authorized pilot assets.` };
  }

  // 6. File extension validation against allowed MIME types
  const ext = path.extname(normalizedRel).toLowerCase();
  const mimeType = ALLOWED_MIME_TYPES[ext];
  if (!mimeType) {
    return { status: 'INVALID_TYPE', error: `Unsupported file extension '${ext}'.` };
  }

  // 7. Base directory resolution & canonicalization
  const baseDir = path.resolve(/*turbopackIgnore: true*/ customBaseDir || getHostingerStorageBaseDir());
  let canonicalBase: string;
  try {
    canonicalBase = await fs.promises.realpath(/*turbopackIgnore: true*/ baseDir);
  } catch {
    return { status: 'NOT_FOUND', error: 'Storage base directory does not exist or is inaccessible.' };
  }

  const resolvedPath = path.resolve(/*turbopackIgnore: true*/ canonicalBase, normalizedRel);

  // 8. Canonicalize target path using fs.realpath (resolves symlinks)
  let canonicalTarget: string;
  try {
    canonicalTarget = await fs.promises.realpath(/*turbopackIgnore: true*/ resolvedPath);
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err && err.code === 'ENOENT') {
      return { status: 'NOT_FOUND', error: 'File does not exist.' };
    }
    return { status: 'NOT_FOUND', error: 'Unable to access file.' };
  }

  // 9. Strict canonical containment check (guarantees symlink does not escape baseDir)
  const relToCanonicalBase = path.relative(canonicalBase, canonicalTarget);
  if (relToCanonicalBase.startsWith('..') || path.isAbsolute(relToCanonicalBase)) {
    return { status: 'FORBIDDEN', error: 'Target path escapes storage base directory.' };
  }

  // 10. Check that target is a regular file
  try {
    const fileStat = await fs.promises.stat(canonicalTarget);
    if (!fileStat.isFile()) {
      return { status: 'NOT_FOUND', error: 'Target is not a regular file.' };
    }
    return {
      status: 'SUCCESS',
      canonicalTarget,
      mimeType,
      fileStat,
    };
  } catch {
    return { status: 'NOT_FOUND', error: 'Unable to stat file.' };
  }
}

/**
 * Stat asset metadata without reading file content into memory (ideal for HEAD requests).
 */
export async function statHostingerAsset(relativePath: string, customBaseDir?: string): Promise<ReadAssetResult> {
  const validation = await validateAndResolveAssetPath(relativePath, customBaseDir);

  if (validation.status !== 'SUCCESS' || !validation.fileStat || !validation.mimeType) {
    return {
      status: validation.status,
      error: validation.error,
    };
  }

  const sizeBytes = validation.fileStat.size;

  return {
    status: 'SUCCESS',
    mimeType: validation.mimeType,
    sizeBytes,
    headers: {
      'Content-Type': validation.mimeType,
      'Content-Length': String(sizeBytes),
      'Accept-Ranges': 'bytes',
      'Cache-Control': DEFAULT_CACHE_CONTROL,
      'X-Content-Type-Options': 'nosniff',
      'X-Asset-Storage': 'hostinger',
    },
  };
}

/**
 * Validate and read a file buffer strictly inside the persistent storage directory (for GET requests).
 * Supports optional HTTP Range requests for video/media streaming.
 */
export async function readHostingerAsset(
  relativePath: string,
  customBaseDir?: string,
  rangeHeader?: string | null
): Promise<ReadAssetResult> {
  const validation = await validateAndResolveAssetPath(relativePath, customBaseDir);

  if (validation.status !== 'SUCCESS' || !validation.canonicalTarget || !validation.fileStat || !validation.mimeType) {
    return {
      status: validation.status,
      error: validation.error,
    };
  }

  const fileSize = validation.fileStat.size;

  try {
    // Check for HTTP Range header
    if (rangeHeader && rangeHeader.startsWith('bytes=')) {
      const match = rangeHeader.replace(/^bytes=/, '').trim().match(/^(\d*)-(\d*)$/);
      if (match) {
        const rawStart = match[1];
        const rawEnd = match[2];
        let start = rawStart !== '' ? parseInt(rawStart, 10) : NaN;
        let end = rawEnd !== '' ? parseInt(rawEnd, 10) : NaN;

        if (!isNaN(start) || !isNaN(end)) {
          if (isNaN(start)) {
            // Suffix range: bytes=-500 (last 500 bytes)
            start = Math.max(0, fileSize - end);
            end = fileSize - 1;
          } else if (isNaN(end)) {
            // Open-ended range: bytes=500- (from 500 to end)
            end = fileSize - 1;
          }

          if (start < 0 || start >= fileSize || end < start || end >= fileSize) {
            return {
              status: 'RANGE_NOT_SATISFIABLE',
              error: 'Requested range not satisfiable.',
              headers: {
                'Content-Range': `bytes */${fileSize}`,
                'Accept-Ranges': 'bytes',
                'X-Asset-Storage': 'hostinger',
              },
            };
          }

          const chunkLength = end - start + 1;
          const fd = await fs.promises.open(validation.canonicalTarget, 'r');
          const chunkBuffer = Buffer.alloc(chunkLength);
          await fd.read(chunkBuffer, 0, chunkLength, start);
          await fd.close();

          return {
            status: 'PARTIAL',
            buffer: chunkBuffer,
            mimeType: validation.mimeType,
            sizeBytes: chunkLength,
            headers: {
              'Content-Type': validation.mimeType,
              'Content-Length': String(chunkLength),
              'Content-Range': `bytes ${start}-${end}/${fileSize}`,
              'Accept-Ranges': 'bytes',
              'Cache-Control': DEFAULT_CACHE_CONTROL,
              'X-Content-Type-Options': 'nosniff',
              'X-Asset-Storage': 'hostinger',
            },
          };
        }
      }
    }

    const buffer = await fs.promises.readFile(validation.canonicalTarget);

    return {
      status: 'SUCCESS',
      buffer,
      mimeType: validation.mimeType,
      sizeBytes: buffer.length,
      headers: {
        'Content-Type': validation.mimeType,
        'Content-Length': String(buffer.length),
        'Accept-Ranges': 'bytes',
        'Cache-Control': DEFAULT_CACHE_CONTROL,
        'X-Content-Type-Options': 'nosniff',
        'X-Asset-Storage': 'hostinger',
      },
    };
  } catch (err: unknown) {
    if (err instanceof Error && 'code' in err && err.code === 'ENOENT') {
      return { status: 'NOT_FOUND', error: 'File does not exist.' };
    }
    return { status: 'NOT_FOUND', error: 'Unable to read file content.' };
  }
}
