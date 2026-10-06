const fs = require('fs');
const path = require('path');

require('./register-typescript.cjs');

const envPath = path.resolve('.env.local');
const lines = fs.readFileSync(envPath, 'utf8').split('\n');
for (const line of lines) {
  const t = line.trim();
  if (t && !t.startsWith('#')) {
    const idx = t.indexOf('=');
    if (idx !== -1) process.env[t.slice(0, idx).trim()] = t.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
  }
}

const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { generateAgreementPdf } = require('../lib/signatures/pdf-stamp.ts');
const { chromium } = require('playwright');

const AGREEMENT_ID = 21;
const PROJECT_ID = 13;
const NEW_TERMS = 'Para Cipres Residences: 5% más ITBIS. 50% de la comisión cuando el cliente haya saldado el 10% del valor del inmueble, completado las documentaciones de venta y firmado el contrato de opción a compra; y el restante 50% cuando el cliente haya pagado un 10% adicional (total 20% de la compra) y la desarrolladora haya confirmado los pagos del mismo.';

async function run() {
  console.log('1. Updating Organization 11 (KYSER) in database...');
  const { data: updatedOrg, error: orgErr } = await sb
    .from('organizations')
    .update({
      legal_name: 'KYSER CONSTRUCTION SRL',
      tax_id: '1-33-50111-2',
      legal_address: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 11)
    .select('*')
    .single();

  if (orgErr) throw new Error(`Org update error: ${orgErr.message}`);
  console.log(' - Developer Org updated:', updatedOrg.name, '| Legal:', updatedOrg.legal_name, '| RNC:', updatedOrg.tax_id);

  console.log('2. Regenerating contract PDF with KYSER RNC and no address...');
  const { bytes, signatureField } = await generateAgreementPdf({
    masterBroker: {
      legalName: 'BELLO VALDEZ ENTERPRISE, SRL',
      taxId: '132558871',
      address: 'Calle Trinitarias Número 39, Mirador Del Oeste, Santo Domingo Oeste',
      repName: 'Gleivys Osvaldo Bello',
      repPosition: 'Gerente General',
      repId: null,
      repEmail: 'info@osvaldobello.com',
    },
    brokerOrg: {
      legalName: 'LUNOVI REALESTATE, S.R.L.',
      taxId: '1-32-19226-5',
      address: 'Plaza San Juan Shopping Center, Local E-6, Ave. Barceló, D.M.T. Verón-Punta Cana, Prov. La Altagracia',
    },
    signerName: 'Dr. Sabine Vicioso David',
    signerIdNumber: '402-5016067-4',
    project: {
      name: 'Cipres Residences',
      location: 'Cv de Verón - Bávaro 23000, Punta Cana 23000',
      developerName: 'KYSER CONSTRUCTION SRL',
    },
    developer: {
      legalName: 'KYSER CONSTRUCTION SRL',
      taxId: '1-33-50111-2',
      address: null,
    },
    commissionRate: 5,
    commissionTerms: NEW_TERMS,
    validMonths: 12,
    kind: 'project_specific',
  });

  // Save to downloads folder
  const targetPath = 'C:\\Users\\Rony\\Downloads\\acuerdo\\Acuerdo_Colaboracion_Cipres_Lunovi.pdf';
  fs.writeFileSync(targetPath, Buffer.from(bytes));
  console.log(' - Saved updated PDF to:', targetPath);

  // Update in Supabase storage
  const templatePath = 'bello-valdez-enterprise/agreements/21/template.pdf';
  const { error: uploadError } = await sb.storage
    .from('private-documents')
    .upload(templatePath, Buffer.from(bytes), { contentType: 'application/pdf', upsert: true });

  if (uploadError) {
    console.warn(' - Supabase storage upload warning:', uploadError.message);
  } else {
    console.log(' - Uploaded updated template PDF to storage:', templatePath);
  }

  // Render to images for visual verification
  console.log('3. Rendering PDF pages to PNG...');
  const outDir = 'C:\\Users\\Rony\\.gemini\\antigravity\\brain\\1123f24b-c50c-4946-9621-e695323a9c06';
  const base64Pdf = Buffer.from(bytes).toString('base64');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 1600 } });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
        <style>
          body { margin: 0; background: #525659; display: flex; flex-direction: column; align-items: center; gap: 20px; padding: 20px; }
          canvas { box-shadow: 0 4px 10px rgba(0,0,0,0.3); background: white; }
        </style>
      </head>
      <body>
        <div id="container"></div>
        <script>
          const pdfData = atob("${base64Pdf}");
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          
          async function render() {
            const loadingTask = pdfjsLib.getDocument({ data: pdfData });
            const pdf = await loadingTask.promise;
            
            for (let num = 1; num <= pdf.numPages; num++) {
              const page = await pdf.getPage(num);
              const scale = 2.0;
              const viewport = page.getViewport({ scale });
              
              const canvas = document.createElement('canvas');
              canvas.id = 'page-' + num;
              canvas.width = viewport.width;
              canvas.height = viewport.height;
              document.getElementById('container').appendChild(canvas);
              
              const renderContext = {
                canvasContext: canvas.getContext('2d'),
                viewport: viewport
              };
              await page.render(renderContext).promise;
            }
            window.rendered = true;
          }
          render().catch(err => { window.error = err.message; });
        </script>
      </body>
    </html>
  `;

  await page.setContent(html);
  await page.waitForFunction(() => window.rendered || window.error, { timeout: 30000 });

  const p1 = await page.$('#page-1');
  if (p1) {
    await p1.screenshot({ path: path.join(outDir, 'acuerdo_cipres_lunovi_page_1.png') });
    console.log(' - Saved page 1 PNG');
  }

  const p2 = await page.$('#page-2');
  if (p2) {
    await p2.screenshot({ path: path.join(outDir, 'acuerdo_cipres_lunovi_page_2.png') });
    console.log(' - Saved page 2 PNG');
  }

  await browser.close();
  console.log('\n=== COMPLETED SUCCESSFULLY ===');
}

run().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
