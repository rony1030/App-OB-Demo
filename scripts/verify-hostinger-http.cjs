const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const manifest = require('../storage-export/migration-manifest.json');
const assets = require('../lib/storage/hostinger-verified-assets.json');
const base = process.argv[2] || 'http://127.0.0.1:3012';

(async () => {
  let count = 0;
  for (const asset of assets) {
    const entry = manifest.files[`public-assets/${asset}`];
    const url = `/api/media/${asset.split('/').map(encodeURIComponent).join('/')}`;
    const response = await fetch(new URL(url, base), { method: 'HEAD', signal: AbortSignal.timeout(30000) });
    assert.equal(response.status, 200, asset);
    assert.equal(response.headers.get('x-asset-storage'), 'hostinger', asset);
    assert.equal(Number(response.headers.get('content-length')), entry.sizeBytes, asset);
    count++;
    if (count % 100 === 0) console.log('HEAD_VERIFIED', count);
  }
  const groups = new Set();
  let downloads = 0;
  for (const asset of assets) {
    const group = asset.split('/').slice(0, 3).join('/');
    if (groups.has(group)) continue;
    groups.add(group);
    const entry = manifest.files[`public-assets/${asset}`];
    for (const prefix of ['/api/media/', '/cdn-storage/object/public/public-assets/']) {
      const response = await fetch(new URL(prefix + asset, base), { signal: AbortSignal.timeout(60000) });
      assert.equal(response.status, 200, asset);
      assert.equal(response.headers.get('x-asset-storage'), 'hostinger', asset);
      const bytes = Buffer.from(await response.arrayBuffer());
      assert.equal(bytes.length, entry.sizeBytes, asset);
      assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), entry.sha256, asset);
      downloads++;
    }
  }
  const forbidden = await fetch(new URL('/api/media/not-authorized.png', base), { method: 'HEAD' });
  assert.equal(forbidden.status, 403);
  console.log('HTTP_PASS', JSON.stringify({ headFiles: count, verifiedDownloads: downloads, legacyUrls: true, forbiddenFiles: true }));
})().catch((error) => { console.error(error.message); process.exitCode = 1; });
