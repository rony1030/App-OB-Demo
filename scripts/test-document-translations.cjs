/* Run: node scripts/test-document-translations.cjs [--live]
 * --live exercises the configured provider without writing to the database. */
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
for (const ext of ['.ts', '.tsx']) require.extensions[ext] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2022 } }).outputText, filename);
const { presentationTextEntries, applyPresentationTranslations, validPresentationTranslation } = require('../lib/i18n/presentation-content.ts');
const { documentCopy, documentText } = require('../lib/i18n/document-copy.ts');
const { calculateProposalPaymentSchedule } = require('../lib/proposals/payment-schedule.ts');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { DocumentLocale } = require('../components/i18n/DocumentLocale.tsx');
const { ProposalMagazinePage } = require('../components/presentations/ProposalMagazinePage.tsx');
const MagazineSlide = require('../components/presentations/MagazineSlide.tsx').default;

async function main() {
  const blocks = [{ title: 'Título', body: '21 unidades', typologyDetails: '2 habitaciones', offerText: 'Oferta', extraList: ['Piscina'], pricingCards: [{ title: 'Villa', kicker: 'Desde', price: 154400 }], customStats: { stat1Label: 'Entrega', stat1Value: '2027' }, paymentSteps: [{ label: 'Reserva', value: 'Al firmar' }], visibleDocuments: [{ id: 'abc', name: 'Plano', format: 'PDF' }], typologyUnits: ['A 102'], image: '/foto.png', amenityIconMap: { 0: 'pool' }, bankingInfo: { account: '1234', beneficiary: 'Rony' } }];
  const entries = presentationTextEntries(blocks);
  assert.equal(entries.length, 12);
  const translated = Object.fromEntries(entries.map(e => [e.fieldPath, `translated ${e.sourceText}`]));
  const result = applyPresentationTranslations(blocks, translated);
  assert.equal(result[0].pricingCards[0].price, 154400);
  for (const key of ['image', 'amenityIconMap', 'bankingInfo', 'typologyUnits']) assert.deepEqual(result[0][key], blocks[0][key]);
  assert.equal(blocks[0].title, 'Título');
  assert.deepEqual(result[0].iconSourceLabels, ['Piscina']);
  const largeDocument = Array.from({ length: 190 }, (_, index) => ({ title: `Página ${index}` }));
  const largeEntries = presentationTextEntries(largeDocument);
  assert.equal(largeEntries.length, 190, 'No silent 160-field truncation');
  assert.equal(applyPresentationTranslations(largeDocument, Object.fromEntries(largeEntries.map(e => [e.fieldPath, `Page ${e.sourceText.match(/\d+/)[0]}`]))).at(-1).title, 'Page 189');
  assert.equal(applyPresentationTranslations(blocks, {})[0].title, 'Título');
  assert.equal(validPresentationTranslation({ a: '21 unidades' }, { a: '22 units' }), false);
  assert.equal(validPresentationTranslation({ a: '21 unidades' }, {}), false);
  assert.equal(validPresentationTranslation({ a: '21 unidades' }, { a: '21 units' }), true);
  for (const [source, values] of Object.entries(documentCopy)) for (const locale of ['en', 'fr']) assert.equal(documentText(source, locale), values[locale === 'en' ? 0 : 1]);
  const schedule = { reservationAmount: 1000, initialPercentage: 20, initialDueDays: 30, constructionPercentage: 30, constructionFrequency: 'monthly', constructionInstallments: 12, reservationDate: '2026-09-15', deliveryDate: '2027-12-15' };
  const es = calculateProposalPaymentSchedule(154400, schedule);
  for (const locale of ['en', 'fr']) {
    const payments = calculateProposalPaymentSchedule(154400, schedule, locale);
    assert.deepEqual(payments.map(p => p.amount), es.map(p => p.amount));
    assert.ok(!payments.some(p => /\breserva\b|construcción|\bcuotas\b|\bentrega\b/i.test(`${p.label} ${p.detail}`)));
    for (const type of ['cover', 'availability', 'typology', 'payment', 'highlights', 'contact', 'floorplan', 'location']) {
      const html = renderToStaticMarkup(React.createElement(DocumentLocale.Provider, { value: locale }, React.createElement(ProposalMagazinePage, { block: { type, title: 'Uve Residences', paymentSchedule: schedule, showDisclaimer: true }, index: 0, total: 8, projectName: 'Uve Residences', clientName: 'Rony', items: [{ unit_name: 'A 102', price: 154400, bedrooms: 2, bathrooms: 2 }] })));
      assert.ok(!/Presentado a|Unidad seleccionada|Valor de la unidad|Propuesta de inversión|Asesor inmobiliario|Unidades de esta tipología|Pág\./.test(html), `${locale}/${type}`);
      if (type === 'cover') assert.ok(html.includes(locale === 'en' ? 'Presented to' : 'Présentée à'));
    }
    const html = renderToStaticMarkup(React.createElement(DocumentLocale.Provider, { value: locale }, React.createElement(MagazineSlide, { block: { type: 'stats' }, index: 0, total: 1, projectName: 'Ciprés', brokerName: 'Rony', brokerPhone: '', agencyName: 'OB' })));
    assert.ok(!/Ubicación|Entrega|PÁG\./.test(html));
  }
  const { translatePresentationBatch } = require('../lib/i18n/content-translations.ts');
  let cached;
  const db = { from: () => ({ select() { return this; }, match() { return this; }, async maybeSingle() { return { data: cached }; }, async upsert(value) { cached = value; return {}; } }) };
  const source = { 'blocks.0.title': 'Uve Residences', 'blocks.0.body': 'Desarrollo boutique de 21 unidades.', 'blocks.1.typologyDetails': '2 habitaciones y 2 baños.' };
  const live = process.argv.includes('--live');
  if (live) require('@next/env').loadEnvConfig(root);
  else {
    process.env.GEMINI_API_KEY = 'test';
    process.env.GEMINI_POOL = '';
    global.fetch = async () => ({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({ 'blocks.0.title': 'Uve Residences', 'blocks.0.body': 'Boutique development with 21 units.', 'blocks.1.typologyDetails': '2 bedrooms and 2 bathrooms.' }) }] } }] }) });
  }
  for (const locale of live ? ['en', 'fr'] : ['en']) {
    cached = undefined;
    const request = { organizationId: 1, entityType: 'proposal', entityId: 'test', fieldPath: 'test', sourceLocale: 'es', targetLocale: locale, sourceText: '' };
    const translated = await translatePresentationBatch(db, request, source);
    assert.ok(validPresentationTranslation(source, translated));
    assert.notEqual(translated['blocks.0.body'], source['blocks.0.body']);
    assert.deepEqual(await translatePresentationBatch(db, request, source), translated);
    console.log(`${live ? 'LIVE' : 'Mock'} provider ${locale}: complete response and cache verified`);
  }
  if (!live) {
    cached = undefined;
    global.fetch = async () => ({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({ 'blocks.0.title': 'Uve Residences' }) }] } }] }) });
    await assert.rejects(translatePresentationBatch(db, { organizationId: 1, entityType: 'proposal', entityId: 'test', fieldPath: 'incomplete', sourceLocale: 'es', targetLocale: 'fr', sourceText: '' }, source), /verificación/);
    assert.equal(cached, undefined, 'Incomplete translations must never be cached as successful');
  }
  console.log('PASS: content coverage, immutable fields, completeness, numbers, ES/EN/FR labels, payment amounts, proposal/dossier rendering.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
