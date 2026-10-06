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
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const SIG_SRC = 'C:\\Users\\Rony\\Downloads\\Firma Osvaldo.png';
const SEAL_SRC = 'C:\\Users\\Rony\\Downloads\\SELLO BELLO VALDEZ ENTERPRISE.png';

async function main() {
  console.log('--- PERSISTING OSVALDO SIGNATURE & BELLO VALDEZ SEAL ---');

  if (!fs.existsSync(SIG_SRC)) throw new Error(`Missing source file: ${SIG_SRC}`);
  if (!fs.existsSync(SEAL_SRC)) throw new Error(`Missing source file: ${SEAL_SRC}`);

  const sigBytes = fs.readFileSync(SIG_SRC);
  const sealBytes = fs.readFileSync(SEAL_SRC);

  // 1. Copy to public/brand/
  const brandDir = path.resolve('public/brand');
  if (!fs.existsSync(brandDir)) fs.mkdirSync(brandDir, { recursive: true });

  const sigLocal = path.join(brandDir, 'firma-osvaldo.png');
  const sealLocal = path.join(brandDir, 'sello-bello-valdez.png');

  fs.writeFileSync(sigLocal, sigBytes);
  fs.writeFileSync(sealLocal, sealBytes);
  console.log('✓ Copied to local repo:');
  console.log('   -', sigLocal);
  console.log('   -', sealLocal);

  // 2. Upload to Supabase Storage: public-assets
  const pubSigPath = 'ob-brokers-team/brand/firma-osvaldo.png';
  const pubSealPath = 'ob-brokers-team/brand/sello-bello-valdez.png';

  const { error: errPubSig } = await sb.storage
    .from('public-assets')
    .upload(pubSigPath, sigBytes, { contentType: 'image/png', upsert: true });
  if (errPubSig) console.warn('Warning uploading public sig:', errPubSig.message);
  else console.log('✓ Uploaded public signature to public-assets/' + pubSigPath);

  const { error: errPubSeal } = await sb.storage
    .from('public-assets')
    .upload(pubSealPath, sealBytes, { contentType: 'image/png', upsert: true });
  if (errPubSeal) console.warn('Warning uploading public seal:', errPubSeal.message);
  else console.log('✓ Uploaded public seal to public-assets/' + pubSealPath);

  // Also upload to private-documents for official storage
  const privSigPath = 'bello-valdez-enterprise/official/firma-osvaldo.png';
  const privSealPath = 'bello-valdez-enterprise/official/sello-bello-valdez.png';

  await sb.storage.from('private-documents').upload(privSigPath, sigBytes, { contentType: 'image/png', upsert: true });
  await sb.storage.from('private-documents').upload(privSealPath, sealBytes, { contentType: 'image/png', upsert: true });
  console.log('✓ Uploaded official copies to private-documents bucket.');

  // 3. Persist in database: organization_documents for Org 1 (Bello Valdez Enterprise)
  const docsToUpsert = [
    {
      organization_id: 1,
      document_type: 'other',
      title: 'Firma Oficial - Gleivys Osvaldo Bello',
      status: 'approved',
      storage_bucket: 'public-assets',
      storage_path: pubSigPath,
      mime_type: 'image/png',
      size_bytes: sigBytes.length,
      notes: 'Firma digitalizada oficial de Gleivys Osvaldo Bello (Gerente General) para acuerdos de colaboración y contratos de Master Bróker.',
    },
    {
      organization_id: 1,
      document_type: 'other',
      title: 'Sello Oficial - Bello Valdez Enterprise',
      status: 'approved',
      storage_bucket: 'public-assets',
      storage_path: pubSealPath,
      mime_type: 'image/png',
      size_bytes: sealBytes.length,
      notes: 'Sello corporativo oficial de Bello Valdez Enterprise, SRL para acuerdos de colaboración, contratos y documentos legales.',
    }
  ];

  for (const doc of docsToUpsert) {
    const { data: existing } = await sb
      .from('organization_documents')
      .select('id')
      .eq('organization_id', 1)
      .eq('title', doc.title)
      .maybeSingle();

    if (existing) {
      const { error: updErr } = await sb
        .from('organization_documents')
        .update({
          ...doc,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
      if (updErr) console.error(`Error updating ${doc.title}:`, updErr.message);
      else console.log(`✓ Updated DB record in organization_documents: ${doc.title} (ID: ${existing.id})`);
    } else {
      const { data: inserted, error: insErr } = await sb
        .from('organization_documents')
        .insert(doc)
        .select('id')
        .single();
      if (insErr) console.error(`Error inserting ${doc.title}:`, insErr.message);
      else console.log(`✓ Created DB record in organization_documents: ${doc.title} (ID: ${inserted.id})`);
    }
  }

  console.log('\n--- VERIFICATION IN DATABASE ---');
  const { data: allDocs } = await sb
    .from('organization_documents')
    .select('id, document_type, title, storage_bucket, storage_path, status')
    .eq('organization_id', 1);
  console.log(allDocs);
}

main().catch(console.error);
