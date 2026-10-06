const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const base = process.argv[2] || 'http://127.0.0.1:3012';
const verified = new Set(require('../lib/storage/hostinger-verified-assets.json'));

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1365, height: 900 } });
    for (const route of ['/proyectos/cana-rock-star', '/proyectos/palm-view']) {
      const page = await context.newPage();
      const wrongSource = [];
      const failures = [];
      page.on('request', (request) => {
        const url = new URL(request.url());
        const asset = url.pathname.match(/\/storage\/v1\/(?:object|render\/image)\/public\/public-assets\/(.+)/)?.[1];
        if (asset && verified.has(decodeURIComponent(asset))) wrongSource.push(url.pathname);
      });
      page.on('pageerror', (error) => failures.push(error.message));
      const response = await page.goto(new URL(route, base).href, { waitUntil: 'domcontentloaded', timeout: 60000 });
      assert.equal(response.status(), 200, route);
      // Galleries below the fold intentionally lazy-load. Bring a migrated
      // gallery image into view before checking its decoded pixels.
      await page.locator('img[src*="/api/media/"]').first().scrollIntoViewIfNeeded({ timeout: 30000 });
      await page.waitForFunction(() => Array.from(document.images).some((img) => img.currentSrc.includes('/api/media/') && img.complete && img.naturalWidth > 0), undefined, { timeout: 30000 });
      const images = await page.locator('img').evaluateAll((nodes) => nodes.map((img) => ({ source: new URL(img.currentSrc || img.src).pathname, loaded: img.complete && img.naturalWidth > 0 })));
      assert.equal(wrongSource.length, 0, `Migrated image still requested from Supabase: ${wrongSource.join(', ')}`);
      assert.equal(failures.length, 0, `Page errors: ${failures.join(', ')}`);
      const output = path.join(process.cwd(), 'tmp/hostinger-browser-check');
      fs.mkdirSync(output, { recursive: true });
      await page.screenshot({ path: path.join(output, `${route.split('/').pop()}.png`) });
      console.log('BROWSER_PASS', JSON.stringify({ route, localImagesLoaded: images.filter((img) => img.source.startsWith('/api/media/') && img.loaded).length, migratedSupabaseRequests: wrongSource.length, pageErrors: failures.length }));
      await page.close();
    }
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error.message); process.exitCode = 1; });
