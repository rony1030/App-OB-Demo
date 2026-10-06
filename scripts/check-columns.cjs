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
  const { data: org1 } = await sb.from('organizations').select('*').eq('id', 1).single();
  console.log('Org 1 keys:', Object.keys(org1));

  const { data: set1 } = await sb.from('organization_agreement_settings').select('*').limit(1);
  console.log('Settings keys:', set1 ? Object.keys(set1[0]) : 'none');

  const { data: brand1 } = await sb.from('brand_profiles').select('*').eq('organization_id', 1).single();
  console.log('Brand keys:', Object.keys(brand1));

  const { data: osvaldoProfile } = await sb.from('profiles').select('*').eq('email', 'info@osvaldobello.com').single();
  console.log('Osvaldo Profile keys:', osvaldoProfile ? Object.keys(osvaldoProfile) : 'not found');
}

run().catch(console.error);
