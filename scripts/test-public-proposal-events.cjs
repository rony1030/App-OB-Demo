const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const filename = path.resolve(__dirname, '../lib/analytics/public-proposal-events.ts');
const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const moduleUnderTest = { exports: {} };
new Function('module', 'exports', source)(moduleUnderTest, moduleUnderTest.exports);
const { safePublicProposalMetadata, safePublicSessionId } = moduleUnderTest.exports;

const blocks = [{ title: 'Portada' }, { title: 'Precios' }];
const dirty = {
  pageIndex: 2,
  pageLabel: 'Etiqueta enviada por el visitante',
  cached: true,
  clientEmail: 'private@example.com',
  organization_id: 999,
  projectId: 999,
  ip: '127.0.0.1',
};
assert.deepEqual(safePublicProposalMetadata('section_view', dirty, blocks), {
  pageIndex: 2,
  pageLabel: 'Precios',
});
assert.deepEqual(safePublicProposalMetadata('share_click', dirty, blocks), { pageIndex: 2 });
assert.deepEqual(safePublicProposalMetadata('pdf_export', dirty, blocks), { pageIndex: 2, cached: true });
assert.deepEqual(safePublicProposalMetadata('locale_change', { pageLabel: 'fr' }), { pageLabel: 'FR' });
assert.deepEqual(safePublicProposalMetadata('section_view', { pageIndex: 999, clientEmail: 'private@example.com' }, blocks), {});
assert.equal(safePublicSessionId('valid_session_12345'), 'valid_session_12345');
assert.equal(safePublicSessionId('bad@example.com'), null);
console.log('Public proposal telemetry metadata: 6 checks passed.');
