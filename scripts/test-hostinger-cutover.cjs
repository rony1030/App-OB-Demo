const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

// Compile the real implementation in memory, not a duplicate of its logic.
const root = path.resolve(__dirname, '..');
const modules = new Map();
function loadTs(filename) {
  filename = path.resolve(filename);
  if (modules.has(filename)) return modules.get(filename).exports;
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  modules.set(filename, mod);
  const nativeRequire = mod.require.bind(mod);
  mod.require = (specifier) => {
    if (specifier.startsWith('@/') || specifier.startsWith('.')) {
      const target = specifier.startsWith('@/')
        ? path.join(root, specifier.slice(2))
        : path.resolve(path.dirname(filename), specifier);
      if (fs.existsSync(`${target}.ts`)) return loadTs(`${target}.ts`);
      if (target.endsWith('.json')) return nativeRequire(target);
    }
    return nativeRequire(specifier);
  };
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, resolveJsonModule: true },
    fileName: filename,
  });
  mod._compile(compiled.outputText, filename);
  return mod.exports;
}

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
process.env.NEXT_PUBLIC_STORAGE_PROXY = 'false';
const constants = loadTs(path.join(root, 'lib/storage/hostinger-constants.ts'));
const resolver = loadTs(path.join(root, 'lib/supabase/storage.ts'));
const assets = require('../lib/storage/hostinger-verified-assets.json');
const config = require('../next.config.js');
let checks = 0;
function equal(actual, expected) { assert.equal(actual, expected); checks++; }

(async () => {
  equal(assets.length, 461);
  equal(new Set(assets).size, assets.length);
  for (const asset of assets) {
    const target = `/api/media/${asset.split('/').map(encodeURIComponent).join('/')}`;
    const forms = [asset, `public-assets/${asset}`, target,
      `https://test-project.supabase.co/storage/v1/object/public/public-assets/${asset}`,
      `/cdn-storage/object/public/public-assets/${asset}`,
      `https://brokers.osvaldobello.com/cdn-storage/object/public/public-assets/${asset}`,
      `https://test-project.supabase.co/storage/v1/render/image/public/public-assets/${asset}?width=500`,
      `/cdn-storage/render/image/public/public-assets/${asset}?width=500`];
    for (const source of forms) {
      equal(constants.getHostingerAssetUrl(source), target);
      equal(resolver.getPublicAssetUrl(source), target);
      equal(resolver.supabaseUrlToCdn(source), target);
      equal(resolver.getOptimizedImageUrl(source, { width: 500 }), target);
      equal(resolver.supabaseImageLoader({ src: source, width: 500 }), target);
    }
  }
  for (const source of ['../secret.pdf', '/api/media/../secret.png', '%ZZ', '/cdn-storage/object/public/private-documents/secret.pdf']) {
    equal(constants.getHostingerAssetUrl(source), null);
  }
  const privateUrl = 'https://test-project.supabase.co/storage/v1/object/sign/private-documents/brochure.pdf?token=test';
  equal(resolver.getPublicAssetUrl(privateUrl), privateUrl);
  equal(resolver.getPublicAssetUrl('data:image/png;base64,dGVzdA=='), 'data:image/png;base64,dGVzdA==');
  equal(resolver.getPublicAssetUrl('new-upload.png'), 'https://test-project.supabase.co/storage/v1/object/public/public-assets/new-upload.png');
  const rewrites = await config.rewrites();
  equal(rewrites.beforeFiles.length, assets.length * 2);
  equal(rewrites.fallback.length, 1);
  for (const asset of assets) {
    const target = `/api/media/${asset.split('/').map(encodeURIComponent).join('/')}`;
    equal(rewrites.beforeFiles.filter((r) => r.destination === target).length, 2);
  }
  process.env.NEXT_PUBLIC_STORAGE_PROXY = 'true';
  equal(resolver.getPublicAssetUrl(assets[0]), constants.getHostingerAssetUrl(assets[0]));
  equal(resolver.getPublicAssetUrl('new-upload.png').includes('/cdn-storage/'), true);
  console.log(`PASS ${checks} checks against real storage resolvers and legacy rewrites; no network or source mutations.`);
})().catch((error) => { console.error(error); process.exitCode = 1; });
