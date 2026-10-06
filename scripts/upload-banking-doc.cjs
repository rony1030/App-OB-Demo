const fs = require('fs');
const path = require('path');

require('./register-typescript.cjs');

const envPath = path.resolve('.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const k = trimmed.slice(0, idx).trim();
        const v = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
        process.env[k] = v;
      }
    }
  }
}

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  const pdfPath = path.resolve('tmp/Instrucciones_Bancarias_Lunovi.pdf');
  const buffer = fs.readFileSync(pdfPath);
  const storagePath = `lunovi-real-estate-eefc50/agency-documents/banking/${Date.now()}-Instrucciones_Bancarias_Lunovi.pdf`;

  const { error: uploadError } = await supabase.storage
    .from('private-documents')
    .upload(storagePath, buffer, { contentType: 'application/pdf', upsert: true });

  if (uploadError) {
    throw new Error(`Upload error: ${uploadError.message}`);
  }
  console.log('Uploaded banking PDF to:', storagePath);

  const { data: sabineUser } = await supabase.auth.admin.listUsers();
  const sabine = sabineUser?.users?.find(u => u.email === 'sabine@lunovirealestate.com');

  const { data: doc, error: insertError } = await supabase
    .from('organization_documents')
    .insert({
      organization_id: 61,
      document_type: 'banking',
      title: 'Instrucciones Bancarias - Banco Popular Dominicano (USD / RD$)',
      status: 'approved',
      storage_bucket: 'private-documents',
      storage_path: storagePath,
      mime_type: 'application/pdf',
      size_bytes: buffer.length,
      notes: 'Banco Popular Dominicano. Cta USD: 821390820 / Cta RD$: 821390697. Swift: BPDODOSXXXX',
      created_by: sabine?.id,
    })
    .select('*')
    .single();

  if (insertError) throw new Error(`Insert error: ${insertError.message}`);
  console.log('Banking document registered with ID:', doc.id);

  // List all organization documents for Lunovi (61)
  const { data: allDocs } = await supabase
    .from('organization_documents')
    .select('*')
    .eq('organization_id', 61);
  console.log('\nAll Organization Documents for Lunovi (Org 61):');
  console.table(allDocs.map(d => ({
    id: d.id,
    type: d.document_type,
    title: d.title,
    status: d.status,
    expires_at: d.expires_at,
    bucket: d.storage_bucket,
  })));
}

main().catch(console.error);
