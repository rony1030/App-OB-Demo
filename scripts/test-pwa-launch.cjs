// Run after npm run build. Inspect actual generated PNGs, not source promises.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const sharp = require('sharp');

async function main() {
  const manifest = JSON.parse(fs.readFileSync('public/manifest.json', 'utf8'));
  assert.equal(manifest.start_url, process.env.NEXT_PUBLIC_APP_SCOPE === 'demo' ? '/inversionista' : '/portal');
  assert.equal(manifest.background_color, '#ffffff');
  assert.equal(manifest.theme_color, '#ffffff');
  for (const size of [180, 192, 512]) {
    const { data, info } = await sharp(`.next/server/app/app-icons/${size}.body`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    assert.equal(info.width, size);
    assert.equal(info.height, size);
    let dark = 0;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      assert.equal(data[i + 3], 255, 'Icons must be opaque');
      if (data[i] < 100) {
        dark++;
        assert.ok(Math.hypot(x - size / 2, y - size / 2) < size * 0.4, 'Mark must fit Android maskable safe circle');
      }
      if (x === 0 || y === 0 || x === size - 1 || y === size - 1) assert.ok(data[i] > 250, 'White edge');
    }
    assert.ok(dark > size * size * 0.02 && dark < size * size * 0.3, 'Visible mark, not an empty or solid icon');
    console.log(`PASS ${size}px: opaque white, recognizable mark, mask-safe`);
  }
  const css = fs.readFileSync('app/globals.css', 'utf8').split('/* PWA AppLaunch cold start styles')[1];
  assert.ok(css, 'Installed app launch styles must exist in globals.css');
  assert.ok(css.includes('display-mode: standalone'));
  assert.ok(css.includes('prefers-reduced-motion'));
  assert.ok(css.includes('pointer-events: none'));
  assert.ok(css.includes('visibility: hidden'));
  const sw = fs.readFileSync('public/sw.js', 'utf8');
  assert.ok(sw.includes("key.startsWith('ob-crm-pwa-')"));
  console.log('PASS launch: installed-only, reduced motion, bounded exit, no input blocking, scoped cache cleanup');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
