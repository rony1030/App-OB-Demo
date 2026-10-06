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

const AGREEMENT_ID = 21;
const PROJECT_ID = 13;
const NEW_TERMS = 'Para Cipres Residences: 5% más ITBIS. 50% de la comisión cuando el cliente haya saldado el 10% del valor del inmueble, completado las documentaciones de venta y firmado el contrato de opción a compra; y el restante 50% cuando el cliente haya pagado un 10% adicional (total 20% de la compra) y la desarrolladora haya confirmado los pagos del mismo.';

async function run() {
  console.log('1. Updating agreement record in database...');
  const { data: updatedAgr, error: agrErr } = await sb
    .from('agreements')
    .update({
      commission_terms: NEW_TERMS,
      updated_at: new Date().toISOString(),
    })
    .eq('id', AGREEMENT_ID)
    .select('*')
    .single();

  if (agrErr) throw new Error(`Agreement update error: ${agrErr.message}`);
  console.log(' - Agreement ID 21 updated in DB.');

  console.log('2. Upserting project_commission_milestones for project 13...');
  // Delete old milestones if any
  await sb.from('project_commission_milestones').delete().eq('project_id', PROJECT_ID);

  await sb.from('project_commission_milestones').insert([
    {
      project_id: PROJECT_ID,
      milestone_order: 1,
      commission_pct: 50.00,
      trigger_type: 'client_payment_pct',
      trigger_value: 10.00,
      description: '50% de la comisión cuando el cliente haya saldado el 10% del valor del inmueble, completado las documentaciones de venta y firmado el contrato de opción a compra.',
    },
    {
      project_id: PROJECT_ID,
      milestone_order: 2,
      commission_pct: 50.00,
      trigger_type: 'client_payment_pct',
      trigger_value: 20.00,
      description: '50% restante cuando el cliente haya pagado un 10% adicional (total 20% de compra) y la desarrolladora haya confirmado los pagos del mismo.',
    },
  ]);
  console.log(' - Milestones created in database.');

  console.log('3. Regenerating contract PDF with corrected commission terms...');
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
      developerName: 'KYSER',
    },
    developer: {
      legalName: 'KYSER',
      taxId: null,
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
  try {
    const { error: uploadError } = await sb.storage
      .from('private-documents')
      .upload(templatePath, Buffer.from(bytes), { contentType: 'application/pdf', upsert: true });

    if (uploadError) {
      console.warn(' - Supabase storage upload warning:', uploadError.message);
    } else {
      console.log(' - Uploaded updated template PDF to storage:', templatePath);
    }
  } catch (e) {
    console.warn(' - Storage upload skipped / network error:', e.message);
  }

  // Update signature fields coordinates if changed
  const { data: sigDoc } = await sb.from('signature_documents').select('id').eq('source_storage_path', templatePath).maybeSingle();
  if (sigDoc) {
    const { data: signer } = await sb.from('signature_signers').select('id').eq('signature_document_id', sigDoc.id).maybeSingle();
    if (signer) {
      await sb.from('signature_fields').delete().eq('signer_id', signer.id);
      await sb.from('signature_fields').insert({
        signer_id: signer.id,
        page_number: signatureField.pageNumber,
        x: signatureField.x,
        y: signatureField.y,
        width: signatureField.width,
        height: signatureField.height,
        field_type: 'signature',
      });
      console.log(' - Signature box updated for page:', signatureField.pageNumber);
    }
  }

  console.log('\n=== UPDATE COMPLETED SUCCESSFULLY ===');
}

run().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
