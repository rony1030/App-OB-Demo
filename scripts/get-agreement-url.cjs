const fs = require('fs');
const path = require('path');

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
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const storagePath = 'bello-valdez-enterprise/agreements/21/template.pdf';
  const { data: signedUrlData, error: signedUrlErr } = await sb.storage
    .from('private-documents')
    .createSignedUrl(storagePath, 60 * 60 * 24 * 7); // 7 days

  if (signedUrlErr) {
    console.error('Error creating signed url:', signedUrlErr);
  } else {
    console.log('SIGNED_URL:', signedUrlData.signedUrl);
  }

  const { data: fileData, error: downloadErr } = await sb.storage
    .from('private-documents')
    .download(storagePath);

  if (downloadErr) {
    console.error('Download error:', downloadErr);
  } else {
    const outPath = 'C:\\Users\\Rony\\Downloads\\acuerdo\\Acuerdo_Colaboracion_Cipres_Lunovi.pdf';
    fs.writeFileSync(outPath, Buffer.from(await fileData.arrayBuffer()));
    console.log('FILE_SAVED:', outPath);
  }
}

run().catch(console.error);
