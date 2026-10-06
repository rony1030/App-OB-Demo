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

const { createAdminClient } = require('../lib/supabase/admin.ts');

async function testQuery() {
  const admin = createAdminClient();
  const { data: agr, error } = await admin
    .from('agreements')
    .select(`
      id, public_code, kind, status, valid_months, signed_at, expires_at,
      master_broker_organization_id, broker_organization_id, project_id, signer_membership_id,
      commission_rate, commission_terms,
      master_broker_rep_name, master_broker_rep_position, master_broker_rep_id, master_broker_rep_email,
      master_broker_org:organizations!agreements_master_broker_organization_id_fkey(id, name, slug, legal_name, tax_id, legal_address),
      broker_org:organizations!agreements_broker_organization_id_fkey(id, name, slug, legal_name, tax_id, legal_address),
      project:projects(id, name, slug, location, developer:organizations!projects_developer_organization_id_fkey(id, name, slug, legal_name, tax_id, legal_address)),
      signer:memberships!agreements_signer_membership_id_fkey(id, user_id)
    `)
    .eq('public_code', 'AGR-260930-EFFF4B692E')
    .single();

  if (error) {
    console.error('Error fetching agreement:', error);
    return;
  }

  console.log('--- AGREEMENT QUERY RESULT ---');
  console.log('ID:', agr.id);
  console.log('Public Code:', agr.public_code);
  console.log('Kind:', agr.kind);
  console.log('Status:', agr.status);
  console.log('Valid Months:', agr.valid_months);
  console.log('Commission Rate:', agr.commission_rate, '%');
  console.log('Commission Terms:', agr.commission_terms);
  console.log('Master Broker Org:', agr.master_broker_org);
  console.log('Broker Org:', agr.broker_org);
  console.log('Project:', agr.project);
  console.log('Signer Membership:', agr.signer);

  // Check profiles for signer
  if (agr.signer?.user_id) {
    const { data: profile } = await admin.from('profiles').select('*').eq('user_id', agr.signer.user_id).single();
    console.log('Signer Profile:', profile);
  }

  // Check signature documents
  const { data: sigDocs } = await admin.from('signature_documents').select('*, signature_signers(*, signature_fields(*))').eq('id', 15);
  console.log('Signature Document:', JSON.stringify(sigDocs, null, 2));
}

testQuery().catch(console.error);
