import test from 'node:test';
import assert from 'node:assert/strict';
import { newElement, newSlide, duplicateSlide, duplicateElements, parseDocument, resizeDocument, fillCss, fill, safeImageSource } from '../components/portal/creative/editorModel.ts';

const documentFixture = () => ({ version: 2, projectId: 'test', name: 'Prueba', width: 540, height: 675, slides: [newSlide()] });
test('document portable roundtrip retains all editable properties', () => {
  const doc = documentFixture();
  doc.slides[0].elements = ['text', 'image', 'shape', 'icon'].map(kind => newElement(kind, { rotation: 25, opacity: 0.7, groupId: 'shared' }));
  assert.deepEqual(parseDocument(JSON.parse(JSON.stringify(doc))), doc);
});
test('slide duplication gives independent identifiers, groups and fills', () => {
  const slide = newSlide(); slide.elements = [newElement('text', { groupId: 'original' }), newElement('shape', { groupId: 'original' })];
  const copy = duplicateSlide(slide);
  assert.notEqual(copy.id, slide.id); assert.notEqual(copy.elements[0].id, slide.elements[0].id);
  assert.notEqual(copy.elements[0].groupId, 'original'); assert.equal(copy.elements[0].groupId, copy.elements[1].groupId);
  copy.elements[0].fill.color = '#ff0000'; assert.notEqual(copy.elements[0].fill.color, slide.elements[0].fill.color);
});
test('copy/paste offsets elements without changing the source', () => {
  const source = [newElement('image', { x: 20, y: 30 })];
  const copy = duplicateElements(source); assert.equal(copy[0].x, 36); assert.equal(copy[0].y, 46); assert.equal(source[0].x, 20);
});
test('portrait-square-portrait retains original geometry and font sizes', () => {
  const doc = documentFixture(); doc.slides[0].elements = [newElement('text', { x: 42, y: 125, height: 50 })];
  const square = resizeDocument(doc, 540); assert.equal(square.slides[0].elements[0].y, 100);
  const restored = resizeDocument(square, 675); assert.deepEqual(restored, doc);
});
test('empty document after deleting last slide is valid and portable', () => { const doc = documentFixture(); doc.slides = []; assert.equal(parseDocument(doc).slides.length, 0); });
test('imports reject invalid versions, duplicate ids, malformed properties and unsafe image/css payloads', () => {
  assert.throws(() => parseDocument({ version: 1 }));
  for (const patch of [{ width: NaN }, { hidden: 'false' }, { src: 'javascript:alert(1)' }, { shadow: 'url(https://bad.test)' }, { fontFamily: 'x; color:red' }]) {
    const doc = documentFixture(); doc.slides[0].elements = [newElement('image', patch)]; assert.throws(() => parseDocument(doc));
  }
  const doc = documentFixture(); doc.slides.push(structuredClone(doc.slides[0])); assert.throws(() => parseDocument(doc));
  assert.equal(safeImageSource('data:image/svg+xml,<svg onload="alert(1)"/>'), false);
  assert.equal(safeImageSource('https://example.com/photo.jpg'), true);
});
test('gradient values preserve direction and both colors', () => {
  assert.equal(fillCss({ ...fill('#ffffff'), mode: 'linear', color2: '#000000', angle: 45 }), 'linear-gradient(45deg, #ffffff, #000000)');
});
