/* Read-only integration test. Translation cache writes stay in memory. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const originalLoad = Module._load;
Module._load = function (id, parent, main) {
  if (id === 'server-only') return {};
  if (id.startsWith('@/')) id = path.join(root, id.slice(2));
  return originalLoad.call(this, id, parent, main);
};
for (const ext of ['.ts', '.tsx']) {
  require.extensions[ext] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2022 },
  }).outputText, file);
}
require('@next/env').loadEnvConfig(root);
const { createAdminClient } = require('../lib/supabase/admin.ts');
const { presentationTextEntries, validPresentationTranslation, applyPresentationTranslations } = require('../lib/i18n/presentation-content.ts');
const { translatePresentationBatch } = require('../lib/i18n/content-translations.ts');

async function main() {
  const token = process.argv[2];
  assert.match(token || '', /^[a-f0-9]{40}$/i, 'Supply the authorized public dossier token');
  const snapshotIndex = process.argv.indexOf('--snapshot');
  let link;
  let version;
  if (snapshotIndex >= 0) {
    const fixture = JSON.parse(fs.readFileSync(process.argv[snapshotIndex + 1], 'utf8'));
    assert.equal(fixture.token, token, 'Snapshot must belong to the authorized token');
    link = { presentation_version_id: fixture.versionId, status: fixture.status, expires_at: fixture.expires_at };
    version = { snapshot: fixture.snapshot, presentation_id: fixture.presentationId };
  } else {
    const db = createAdminClient();
    const lookup = await db.from('shared_links').select('presentation_version_id, status, expires_at').eq('token', token).single();
    assert.equal(lookup.error, null);
    link = lookup.data;
    const result = await db.from('presentation_versions').select('snapshot, presentation_id').eq('id', link.presentation_version_id).single();
    assert.equal(result.error, null);
    version = result.data;
  }
  assert.equal(link.status, 'active');
  assert.ok(!link.expires_at || new Date(link.expires_at) > new Date());
  const blocks = version.snapshot.blocks;
  const entries = presentationTextEntries(blocks);
  assert.ok(entries.length > 0);
  const batches = [];
  for (let i = 0; i < entries.length; i += 12) batches.push(entries.slice(i, i + 12));
  const cache = new Map();
  const cacheKey = row => `${row.field_path}:${row.target_locale}`;
  const memoryDb = { from() {
    let identity;
    return {
      select() { return this; },
      match(value) { identity = value; return this; },
      async maybeSingle() { return { data: cache.get(cacheKey(identity)) || null, error: null }; },
      async upsert(row) { cache.set(cacheKey(row), row); return { error: null }; },
    };
  } };
  console.log(`${blocks.length} pages, ${entries.length} editorial fields, ${batches.length} batches per language. Production database reads only.`);
  for (const locale of ['en', 'fr']) {
    let cursor = 0;
    let completed = 0;
    const combined = {};
    await Promise.all([0, 1].map(async () => {
      while (cursor < batches.length) {
        const index = cursor++;
        const source = Object.fromEntries(batches[index].map(entry => [entry.fieldPath, entry.sourceText]));
        const translated = await translatePresentationBatch(memoryDb, {
          organizationId: 1, entityType: 'dossier', entityId: String(version.presentation_id),
          fieldPath: `audit.version.${link.presentation_version_id}.batch.${index}`,
          sourceLocale: 'es', targetLocale: locale, sourceText: '', context: 'Complete published real-estate document',
        }, source);
        assert.ok(validPresentationTranslation(source, translated), `${locale} batch ${index}: completeness and amounts`);
        Object.assign(combined, translated);
        completed += 1;
        if (completed % 5 === 0 || completed === batches.length) console.log(`${locale}: ${completed}/${batches.length} batches verified`);
      }
    }));
    assert.equal(Object.keys(combined).length, entries.length);
    assert.equal(applyPresentationTranslations(blocks, combined).length, blocks.length);
    console.log(`PASS ${locale}: every editorial field present; numeric validation passed.`);
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
