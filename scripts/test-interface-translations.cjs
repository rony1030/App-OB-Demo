require('./register-typescript.cjs');
const assert = require('node:assert/strict');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const dictionary = require('../lib/i18n/interface-copy.json');
const phrases = require('../lib/i18n/interface-source.json');
const { interfaceText } = require('../lib/i18n/interface-text.ts');
const { LocaleProvider } = require('../components/i18n/LocaleProvider.tsx');
const { UITranslationBoundary, LocalizedText } = require('../components/i18n/UITranslationBoundary.tsx');
for (const phrase of phrases) for (const locale of ['en', 'fr']) assert.ok(dictionary[phrase]?.[locale]?.trim(), `Missing ${locale}: ${phrase}`);
for (const locale of ['es', 'en', 'fr']) {
  const html = renderToStaticMarkup(React.createElement(LocaleProvider, { initialLocale: locale },
    React.createElement('form', null,
      React.createElement(LocalizedText, { text: 'Proyectos autorizados para la agencia' }),
      React.createElement(UITranslationBoundary, { attributes: ['placeholder'] }, React.createElement('input', { name: 'agencyName', defaultValue: 'Nueva agencia', placeholder: 'Nombre de la agencia' })),
      React.createElement('span', { 'data-customer': true }, 'Nueva agencia'),
      React.createElement('input', { type: 'checkbox', name: 'allProjects', defaultChecked: true }),
    )));
  assert.ok(html.includes('value="Nueva agencia"'), 'Input values must never be translated');
  assert.ok(html.includes('data-customer="true">Nueva agencia</span>'), 'Customer text must stay unchanged');
  assert.ok(html.includes('name="allProjects" checked=""'), 'Checkbox state must remain checked');
  assert.ok(!html.includes('UITranslationBoundary'), 'Translation must not add DOM wrappers');
  assert.ok(interfaceText('Proyectos autorizados para la agencia', locale).trim());
}
assert.equal(interfaceText(' Desconocido ', 'es'), ' Desconocido ');
assert.equal(interfaceText('A &amp; B', 'es'), 'A & B');
console.log(`PASS: ${phrases.length} interface phrases in EN/FR; customer values, checked state and DOM structure preserved.`);
