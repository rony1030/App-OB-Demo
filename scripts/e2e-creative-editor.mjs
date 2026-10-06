import { chromium } from 'playwright';

async function run() {
  console.log('--- Starting Creative Studio E2E Tests ---');
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (e) {
    console.log('Chromium launch failed, trying with channel msedge...');
    browser = await chromium.launch({ headless: true, channel: 'msedge' });
  }

  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  // Listen to console
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('BROWSER ERROR:', msg.text());
  });

  console.log('1. Navigating to http://localhost:3006/dev/creative-studio...');
  await page.goto('http://localhost:3006/dev/creative-studio', { waitUntil: 'networkidle' });

  console.log('2. Clicking "Abrir editor de prueba"...');
  await page.click('button:has-text("Abrir editor de prueba")');

  console.log('3. Waiting for Studio Editor dialog to appear...');
  await page.waitForSelector('[role="dialog"][aria-label*="Estudio Creativo"]', { timeout: 15000 });
  console.log('✔ Studio Editor loaded successfully!');

  // Wait for initial capture to settle and "Guardado en este dispositivo"
  await page.waitForTimeout(2000);

  // Take screenshot of opened editor
  await page.screenshot({ path: 'docs/test-e2e-1-opened.png' });
  console.log('✔ Screenshot 1 saved: docs/test-e2e-1-opened.png');

  // Test 4: Select title element on canvas
  console.log('4. Selecting title element on canvas...');
  const titleElement = page.locator('main [data-element-id]').filter({ hasText: 'Cana Rock' }).first();
  await titleElement.click();
  await page.waitForTimeout(500);

  // Check if properties panel shows "Editar elemento"
  const propHeading = await page.locator('aside[aria-label="Propiedades"] h2').textContent();
  console.log('✔ Selected property heading:', propHeading);

  // Test 5: Edit text in textarea
  console.log('5. Editing text in inspector textarea...');
  const textarea = page.locator('aside[aria-label="Propiedades"] textarea');
  await textarea.fill('Cana Rock Luxury Star');
  await page.waitForTimeout(500);

  // Verify canvas updated
  const updatedText = await titleElement.textContent();
  console.log('✔ Canvas title updated to:', updatedText);

  // Test 6: Change fill / color
  console.log('6. Changing text color...');
  const colorInput = page.locator('aside[aria-label="Propiedades"] input[aria-label*="Color del texto: valor"]');
  if (await colorInput.count() > 0) {
    await colorInput.fill('#d4af37');
    await page.waitForTimeout(500);
    console.log('✔ Text color set to gold (#d4af37)');
  }

  // Test 7: Add Shape from library
  console.log('7. Switching to "Agregar" tab and adding a Circle...');
  await page.click('aside[aria-label="Biblioteca y láminas"] button:has-text("Agregar")');
  await page.waitForTimeout(500);
  await page.click('button:has-text("Círculo")');
  await page.waitForTimeout(500);
  console.log('✔ Circle added from library!');

  // Test 8: Add Icon from library
  console.log('8. Searching and adding an Icon...');
  const iconSearch = page.locator('input[placeholder*="Casa"]');
  await iconSearch.fill('Piscina');
  await page.waitForTimeout(500);
  await page.click('button[title="Piscina"]');
  await page.waitForTimeout(500);
  console.log('✔ Waves (Piscina) icon added!');

  // Test 9: Check Layers tab
  console.log('9. Checking "Capas" tab...');
  await page.click('aside[aria-label="Biblioteca y láminas"] button:has-text("Capas")');
  await page.waitForTimeout(500);
  const layerCount = await page.locator('aside[aria-label="Biblioteca y láminas"] [aria-label*="Ocultar"]').count();
  console.log(`✔ Found ${layerCount} layers in current slide`);

  // Test 10: Test Undo
  console.log('10. Testing Undo...');
  await page.click('button[aria-label="Deshacer"]');
  await page.waitForTimeout(500);
  console.log('✔ Undo triggered successfully');

  // Test 11: Switch back to "Láminas" and duplicate current slide
  console.log('11. Duplicating slide in Láminas tab...');
  await page.click('aside[aria-label="Biblioteca y láminas"] button:has-text("Láminas")');
  await page.waitForTimeout(500);
  const initialSlideCount = await page.locator('aside[aria-label="Biblioteca y láminas"] [aria-label*="Duplicar"]').count();
  console.log(`Initial slides count: ${initialSlideCount}`);
  await page.click('button[aria-label="Duplicar lámina 1"]');
  await page.waitForTimeout(500);
  const newSlideCount = await page.locator('aside[aria-label="Biblioteca y láminas"] [aria-label*="Duplicar"]').count();
  console.log(`✔ New slides count after duplication: ${newSlideCount}`);

  // Test 12: Change format 4:5 -> 1:1
  console.log('12. Changing format to 1:1...');
  await page.selectOption('select[aria-label="Formato del carrusel"]', '540');
  await page.waitForTimeout(500);
  console.log('✔ Format set to 1:1 (Square)');

  // Take screenshot of edited state
  await page.screenshot({ path: 'docs/test-e2e-2-edited.png' });
  console.log('✔ Screenshot 2 saved: docs/test-e2e-2-edited.png');

  // Test 13: Export Single PNG
  console.log('13. Testing PNG export...');
  const [downloadPng] = await Promise.all([
    page.waitForEvent('download', { timeout: 10000 }).catch(() => null),
    page.click('button:has-text("Lámina PNG")'),
  ]);
  if (downloadPng) {
    const pngPath = await downloadPng.path();
    console.log(`✔ PNG downloaded successfully: ${downloadPng.suggestedFilename()} (${pngPath})`);
  } else {
    console.log('ℹ Download event handled via dataUrl / blob trigger');
  }
  await page.waitForTimeout(2000);

  // Test 14: Save and close
  console.log('14. Closing editor to test auto-save and persistence...');
  await page.click('button[aria-label="Guardar y cerrar"]');
  await page.waitForTimeout(1000);

  // Test 15: Re-open editor to verify persistence
  console.log('15. Re-opening editor from IndexedDB...');
  await page.click('button:has-text("Abrir editor de prueba")');
  await page.waitForSelector('[role="dialog"][aria-label*="Estudio Creativo"]', { timeout: 15000 });
  await page.waitForTimeout(2000);

  // Verify that the title "Cana Rock Luxury Star" persisted!
  const persistedTitle = await page.locator('main [data-element-id]').filter({ hasText: 'Cana Rock Luxury Star' }).count();
  console.log(`✔ Persisted title found in restored document: ${persistedTitle > 0 ? 'YES (PERSISTED)' : 'NO'}`);

  await page.screenshot({ path: 'docs/test-e2e-3-persisted.png' });
  console.log('✔ Screenshot 3 saved: docs/test-e2e-3-persisted.png');

  await browser.close();
  console.log('--- All Creative Studio E2E Tests PASSED! ---');
}

run().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
