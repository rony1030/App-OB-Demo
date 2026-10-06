/**
 * Local Automated Test Suite for Hostinger Persistent Storage Access & Route Handler
 * 
 * Runs on standard Node.js without any external dependencies.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// --- Logic mirroring our TypeScript implementation for direct CJS test execution ---
const ALLOWED_MIME_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
};

const HOSTINGER_PILOT_LOGOS = new Set(require('../lib/storage/hostinger-verified-assets.json'));

// 1. Setup isolated local test fixtures directory
const baseTmpDir = path.resolve(process.cwd(), 'tmp/test-hostinger-storage-suite');
const testFixturesDir = path.join(baseTmpDir, 'storage-root');
const outsideDir = path.join(baseTmpDir, 'outside-root');

fs.rmSync(baseTmpDir, { recursive: true, force: true });
fs.mkdirSync(testFixturesDir, { recursive: true });
fs.mkdirSync(outsideDir, { recursive: true });

// Create authorized pilot & Lote 1 fixture files
for (const assetPath of HOSTINGER_PILOT_LOGOS) {
  const fullTarget = path.join(testFixturesDir, assetPath);
  fs.mkdirSync(path.dirname(fullTarget), { recursive: true });
  fs.writeFileSync(fullTarget, Buffer.from(`FIXTURE_CONTENT_FOR_${assetPath}`));
}

// Create non-pilot existing files in storage
fs.writeFileSync(path.join(testFixturesDir, 'unauthorized-logo.png'), Buffer.from('UNAUTHORIZED_PNG'));
fs.writeFileSync(path.join(outsideDir, 'external-secret.png'), Buffer.from('EXTERNAL_SECRET_PNG'));

// Try creating a symlink inside storage pointing to external file
let symlinkCreated = false;
let symlinkError = null;
try {
  fs.symlinkSync(
    path.join(outsideDir, 'external-secret.png'),
    path.join(testFixturesDir, 'symlink-escape.png')
  );
  symlinkCreated = true;
} catch (err) {
  symlinkError = err.message;
}

// Override environment variables for testing
process.env.HOSTINGER_PERSISTENT_STORAGE_DIR = testFixturesDir;
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

const DEFAULT_CACHE_CONTROL = 'public, max-age=86400, stale-while-revalidate=604800';

function isHostingerPilotAsset(assetPath) {
  if (!assetPath || typeof assetPath !== 'string') return false;
  const normalized = assetPath
    .replace(/^https?:\/\/[^\/]+/i, '')
    .replace(/^\/?(cdn-storage|storage\/v1)\/object\/public\/public-assets\//i, '')
    .replace(/^\/?(api\/media|public-assets)\//i, '')
    .replace(/^\/+/, '')
    .replace(/\\/g, '/');

  return HOSTINGER_PILOT_LOGOS.has(normalized);
}

async function validateAndResolveAssetPath(relativePath, customBaseDir) {
  if (typeof relativePath !== 'string' || !relativePath.trim()) {
    return { status: 'FORBIDDEN', error: 'Invalid or empty path.' };
  }
  if (path.isAbsolute(relativePath)) {
    return { status: 'FORBIDDEN', error: 'Absolute paths are strictly forbidden.' };
  }
  const normalizedRel = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
  if (!/^[a-zA-Z0-9_\-\.\/ ]+$/.test(normalizedRel)) {
    return { status: 'FORBIDDEN', error: 'Path contains prohibited characters.' };
  }
  const segments = normalizedRel.split('/');
  if (segments.some((seg) => seg === '..' || seg === '.' || seg === '')) {
    return { status: 'FORBIDDEN', error: 'Path traversal segments are strictly forbidden.' };
  }
  if (!HOSTINGER_PILOT_LOGOS.has(normalizedRel)) {
    return { status: 'FORBIDDEN', error: `Asset '${normalizedRel}' is not part of authorized pilot assets.` };
  }
  const ext = path.extname(normalizedRel).toLowerCase();
  const mimeType = ALLOWED_MIME_TYPES[ext];
  if (!mimeType) {
    return { status: 'INVALID_TYPE', error: `Unsupported file extension '${ext}'.` };
  }

  const baseDir = path.resolve(customBaseDir || process.env.HOSTINGER_PERSISTENT_STORAGE_DIR);
  let canonicalBase;
  try {
    canonicalBase = await fs.promises.realpath(baseDir);
  } catch {
    return { status: 'NOT_FOUND', error: 'Storage base directory does not exist.' };
  }

  const resolvedPath = path.resolve(canonicalBase, normalizedRel);
  let canonicalTarget;
  try {
    canonicalTarget = await fs.promises.realpath(resolvedPath);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return { status: 'NOT_FOUND', error: 'File does not exist.' };
    }
    return { status: 'NOT_FOUND', error: 'Unable to access file.' };
  }

  const relToCanonicalBase = path.relative(canonicalBase, canonicalTarget);
  if (relToCanonicalBase.startsWith('..') || path.isAbsolute(relToCanonicalBase)) {
    return { status: 'FORBIDDEN', error: 'Target path escapes storage base directory.' };
  }

  try {
    const fileStat = await fs.promises.stat(canonicalTarget);
    if (!fileStat.isFile()) {
      return { status: 'NOT_FOUND', error: 'Target is not a regular file.' };
    }
    return { status: 'SUCCESS', canonicalTarget, mimeType, fileStat };
  } catch {
    return { status: 'NOT_FOUND', error: 'Unable to stat file.' };
  }
}

async function statHostingerAsset(relativePath, customBaseDir) {
  const validation = await validateAndResolveAssetPath(relativePath, customBaseDir);
  if (validation.status !== 'SUCCESS') {
    return { status: validation.status, error: validation.error };
  }
  return {
    status: 'SUCCESS',
    mimeType: validation.mimeType,
    sizeBytes: validation.fileStat.size,
    headers: {
      'Content-Type': validation.mimeType,
      'Content-Length': String(validation.fileStat.size),
      'Cache-Control': DEFAULT_CACHE_CONTROL,
      'X-Content-Type-Options': 'nosniff',
    },
  };
}

async function readHostingerAsset(relativePath, customBaseDir) {
  const validation = await validateAndResolveAssetPath(relativePath, customBaseDir);
  if (validation.status !== 'SUCCESS') {
    return { status: validation.status, error: validation.error };
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
      'Cache-Control': DEFAULT_CACHE_CONTROL,
      'X-Content-Type-Options': 'nosniff',
    },
  };
}

// Route handler simulation matching app/api/media/[...path]/route.ts
async function GET(request, { params }) {
  const resolvedParams = await params;
  const segments = resolvedParams?.path;
  if (!segments || !Array.isArray(segments) || segments.length === 0) {
    return { status: 400, json: { error: 'File path is required.' } };
  }
  const relativePath = segments.join('/');
  const result = await readHostingerAsset(relativePath);
  if (result.status === 'FORBIDDEN') {
    return { status: 403, json: { error: result.error } };
  }
  if (result.status === 'INVALID_TYPE') {
    return { status: 415, json: { error: result.error } };
  }
  if (result.status === 'NOT_FOUND' || !result.buffer) {
    return { status: 404, json: { error: result.error } };
  }
  return {
    status: 200,
    headers: result.headers,
    body: result.buffer,
  };
}

async function HEAD(request, { params }) {
  const resolvedParams = await params;
  const segments = resolvedParams?.path;
  if (!segments || !Array.isArray(segments) || segments.length === 0) {
    return { status: 400, body: null };
  }
  const relativePath = segments.join('/');
  const result = await statHostingerAsset(relativePath);
  if (result.status === 'FORBIDDEN') {
    return { status: 403, body: null };
  }
  if (result.status === 'INVALID_TYPE') {
    return { status: 415, body: null };
  }
  if (result.status === 'NOT_FOUND') {
    return { status: 404, body: null };
  }
  return {
    status: 200,
    headers: result.headers,
    body: null, // HEAD must never send body
  };
}

function POST() { return { status: 405, headers: { Allow: 'GET, HEAD' } }; }
function PUT() { return { status: 405, headers: { Allow: 'GET, HEAD' } }; }
function DELETE() { return { status: 405, headers: { Allow: 'GET, HEAD' } }; }
function PATCH() { return { status: 405, headers: { Allow: 'GET, HEAD' } }; }

function getPublicAssetUrl(assetPath) {
  if (!assetPath) return '';
  if (isHostingerPilotAsset(assetPath)) {
    const cleanRel = assetPath
      .replace(/^https?:\/\/[^\/]+/i, '')
      .replace(/^\/?(cdn-storage|storage\/v1)\/object\/public\/public-assets\//i, '')
      .replace(/^\/?(api\/media|public-assets)\//i, '')
      .replace(/^\/+/, '');
    const encodedRelPath = cleanRel.split('/').map(encodeURIComponent).join('/');
    return `/api/media/${encodedRelPath}`;
  }
  if (/^https?:\/\//i.test(assetPath)) return assetPath;
  if (assetPath.startsWith('/')) return assetPath;
  const encodedPath = assetPath.split('/').map(encodeURIComponent).join('/');
  return `https://test-project.supabase.co/storage/v1/object/public/public-assets/${encodedPath}`;
}

async function runTests() {
  console.log('===========================================================');
  console.log('   LOCAL TEST SUITE: HOSTINGER PERSISTENT STORAGE ACCESS');
  console.log('===========================================================\n');

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name}:`, err.message);
    }
  }

  async function testAsync(name, fn) {
    total++;
    try {
      await fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${name}:`, err.message);
    }
  }

  // --- UNIT TESTS ---
  for (const pilotLogo of HOSTINGER_PILOT_LOGOS) {
    const expectedMime = ALLOWED_MIME_TYPES[path.extname(pilotLogo).toLowerCase()];
    await testAsync(`[Storage] Read authorized asset: "${pilotLogo}"`, async () => {
      const res = await readHostingerAsset(pilotLogo, testFixturesDir);
      assert.strictEqual(res.status, 'SUCCESS');
      assert.strictEqual(res.mimeType, expectedMime);
      assert.ok(res.buffer instanceof Buffer);
      assert.strictEqual(res.sizeBytes, res.buffer.length);
      assert.strictEqual(res.headers['Cache-Control'], DEFAULT_CACHE_CONTROL);
      assert.strictEqual(res.headers['X-Content-Type-Options'], 'nosniff');
    });

    await testAsync(`[Storage] Stat authorized asset (no buffer): "${pilotLogo}"`, async () => {
      const res = await statHostingerAsset(pilotLogo, testFixturesDir);
      assert.strictEqual(res.status, 'SUCCESS');
      assert.strictEqual(res.mimeType, expectedMime);
      assert.strictEqual(res.buffer, undefined, 'statHostingerAsset must NOT return buffer in memory');
      assert.ok(typeof res.sizeBytes === 'number' && res.sizeBytes > 0);
      assert.strictEqual(res.headers['Content-Length'], String(res.sizeBytes));
    });
  }

  await testAsync('[Storage] Non-existent file returns NOT_FOUND (404)', async () => {
    HOSTINGER_PILOT_LOGOS.add('cana-rock/non-existent/logo.png');
    const res = await readHostingerAsset('cana-rock/non-existent/logo.png', testFixturesDir);
    HOSTINGER_PILOT_LOGOS.delete('cana-rock/non-existent/logo.png');
    assert.strictEqual(res.status, 'NOT_FOUND');
  });

  await testAsync('[Storage] Non-pilot existing file is strictly FORBIDDEN (403)', async () => {
    const res = await readHostingerAsset('unauthorized-logo.png', testFixturesDir);
    assert.strictEqual(res.status, 'FORBIDDEN');
    assert.ok(res.error.includes('not part of authorized pilot'));
  });

  await testAsync('[Storage] Directory traversal is rejected (FORBIDDEN)', async () => {
    const res = await readHostingerAsset('../outside-root/external-secret.png', testFixturesDir);
    assert.strictEqual(res.status, 'FORBIDDEN');
  });

  await testAsync('[Storage] Absolute path is rejected (FORBIDDEN)', async () => {
    const res = await readHostingerAsset(path.join(testFixturesDir, 'cana-rock/galaxy/logo.png'), testFixturesDir);
    assert.strictEqual(res.status, 'FORBIDDEN');
  });

  if (symlinkCreated) {
    await testAsync('[Storage] Symlink escaping base directory is rejected (FORBIDDEN)', async () => {
      HOSTINGER_PILOT_LOGOS.add('symlink-escape.png');
      const res = await readHostingerAsset('symlink-escape.png', testFixturesDir);
      HOSTINGER_PILOT_LOGOS.delete('symlink-escape.png');
      assert.strictEqual(res.status, 'FORBIDDEN');
      assert.ok(res.error.includes('escapes storage base directory'));
    });
  } else {
    console.log(`[INFO] Symlink test skipped on Windows (${symlinkError}). Realpath containment logic is enabled and executable on Linux.`);
  }

  // --- ROUTE HANDLER TESTS ---
  const sampleFixtureContent = fs.readFileSync(path.join(testFixturesDir, 'cana-rock/galaxy/logo.png'));
  await testAsync('[Route Handler] GET authorized pilot returns 200 with body', async () => {
    const res = await GET({}, { params: Promise.resolve({ path: ['cana-rock', 'galaxy', 'logo.png'] }) });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers['Content-Type'], 'image/png');
    assert.strictEqual(res.headers['Content-Length'], String(sampleFixtureContent.length));
    assert.deepStrictEqual(res.body, sampleFixtureContent);
  });

  await testAsync('[Route Handler] HEAD authorized pilot returns 200 with headers and NULL body', async () => {
    const res = await HEAD({}, { params: Promise.resolve({ path: ['cana-rock', 'galaxy', 'logo.png'] }) });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers['Content-Type'], 'image/png');
    assert.strictEqual(res.headers['Content-Length'], String(sampleFixtureContent.length));
    assert.strictEqual(res.body, null, 'HEAD response body must be null');
  });

  await testAsync('[Route Handler] GET non-pilot asset returns 403 Forbidden', async () => {
    const res = await GET({}, { params: Promise.resolve({ path: ['unauthorized-logo.png'] }) });
    assert.strictEqual(res.status, 403);
  });

  await testAsync('[Route Handler] HEAD non-pilot asset returns 403 Forbidden', async () => {
    const res = await HEAD({}, { params: Promise.resolve({ path: ['unauthorized-logo.png'] }) });
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body, null);
  });

  await testAsync('[Route Handler] GET empty path returns 400 Bad Request', async () => {
    const res = await GET({}, { params: Promise.resolve({ path: [] }) });
    assert.strictEqual(res.status, 400);
  });

  test('[Route Handler] Method Not Allowed checks (POST, PUT, DELETE, PATCH -> 405)', () => {
    assert.strictEqual(POST().status, 405);
    assert.strictEqual(POST().headers.Allow, 'GET, HEAD');
    assert.strictEqual(PUT().status, 405);
    assert.strictEqual(DELETE().status, 405);
    assert.strictEqual(PATCH().status, 405);
  });

  // --- SUPABASE RESOLUTION TESTS ---
  test('[Resolver] Pilot logos resolve to /api/media/...', () => {
    assert.strictEqual(getPublicAssetUrl('cana-rock/galaxy/logo.png'), '/api/media/cana-rock/galaxy/logo.png');
    assert.strictEqual(getPublicAssetUrl('cana-rock/stelar/logo.png'), '/api/media/cana-rock/stelar/logo.png');
    assert.strictEqual(getPublicAssetUrl('cana-rock/star/logo.png'), '/api/media/cana-rock/star/logo.png');
  });

  test('[Resolver] Cana Rock Star verified assets resolve to /api/media/...', () => {
    assert.strictEqual(
      getPublicAssetUrl('bello-valdez-enterprise/projects/cana-rock-star/gallery-018ba6bb-68bc-4e72-b82f-0b5abd8196f2.jpg'),
      '/api/media/bello-valdez-enterprise/projects/cana-rock-star/gallery-018ba6bb-68bc-4e72-b82f-0b5abd8196f2.jpg'
    );
    assert.strictEqual(
      getPublicAssetUrl('bello-valdez-enterprise/projects/cana-rock-star/gallery-22d8cad2-b5d8-48f1-87dc-aaf73f826d81.jpg'),
      '/api/media/bello-valdez-enterprise/projects/cana-rock-star/gallery-22d8cad2-b5d8-48f1-87dc-aaf73f826d81.jpg'
    );
  });

  test('[Resolver] Completed Cana Rock Star assets resolve to Hostinger', () => {
    const unverifiedUrl = getPublicAssetUrl('bello-valdez-enterprise/projects/cana-rock-star/gallery-271ee742-dace-459e-903d-9902cf225b8c.jpg');
    assert.strictEqual(
      unverifiedUrl,
      '/api/media/bello-valdez-enterprise/projects/cana-rock-star/gallery-271ee742-dace-459e-903d-9902cf225b8c.jpg'
    );
    const pendingUrl = getPublicAssetUrl('bello-valdez-enterprise/projects/cana-rock-star/gallery-fdab8db0-fdf3-432a-b02a-75970e7522e0.jpg');
    assert.strictEqual(
      pendingUrl,
      '/api/media/bello-valdez-enterprise/projects/cana-rock-star/gallery-fdab8db0-fdf3-432a-b02a-75970e7522e0.jpg'
    );
  });

  test('[Resolver] Non-pilot assets resolve to Supabase untouched', () => {
    const url1 = getPublicAssetUrl('ob-brokers-team/projects/punta-cana/hero.jpg');
    assert.strictEqual(url1, 'https://test-project.supabase.co/storage/v1/object/public/public-assets/ob-brokers-team/projects/punta-cana/hero.jpg');

    const url2 = getPublicAssetUrl('uve-residences/gallery/01.jpg');
    assert.strictEqual(url2, 'https://test-project.supabase.co/storage/v1/object/public/public-assets/uve-residences/gallery/01.jpg');
  });

  // Cleanup test fixtures
  fs.rmSync(baseTmpDir, { recursive: true, force: true });

  console.log('\n-----------------------------------------------------------');
  console.log(`Results: ${passed} of ${total} tests passed.`);
  console.log('-----------------------------------------------------------\n');

  if (passed !== total) {
    process.exitCode = 1;
  }
}

runTests().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
