const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

async function renderPdf() {
  const pdfPath = 'C:\\Users\\Rony\\Downloads\\acuerdo\\Acuerdo_Colaboracion_Cipres_Lunovi.pdf';
  const outDir = 'C:\\Users\\Rony\\.gemini\\antigravity\\brain\\1123f24b-c50c-4946-9621-e695323a9c06';

  const pdfBytes = fs.readFileSync(pdfPath);
  const base64Pdf = pdfBytes.toString('base64');

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
    console.log('Saved page 1');
  }

  const p2 = await page.$('#page-2');
  if (p2) {
    await p2.screenshot({ path: path.join(outDir, 'acuerdo_cipres_lunovi_page_2.png') });
    console.log('Saved page 2');
  }

  await browser.close();
}

renderPdf().catch(console.error);
