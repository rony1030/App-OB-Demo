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
  console.log('--- 1. VERIFYING CANA ROCK DEVELOPER USER ---');
  const devEmail = 'desarrollador.canarock@obbrokers.com';
  const defaultPassword = 'Password123!';

  const { data: { users: existingUsers } } = await sb.auth.admin.listUsers();
  let devUser = existingUsers.find(u => u.email === devEmail);

  if (devUser) {
    console.log('Dev user verified:', devUser.id);
  }

  console.log('\n--- 2. CREATING / SEEDING 3 INVESTOR CLIENTS (ORGANIZATION 1) ---');

  const clientsData = [
    {
      code: 'CLI-ALDIA-001',
      firstName: 'Carlos',
      lastName: 'Mendoza',
      email: 'carlos.mendoza@inversionista.com',
      phone: '+1 (829) 555-0101',
      unitId: 181, // Cana Rock Star D112
      unitCode: 'CRS-204',
      projectName: 'Cana Rock Star',
      scenario: '1 unidad · Al Día',
    },
    {
      code: 'CLI-MIXTO-002',
      firstName: 'Dra. Elena',
      lastName: 'Ramos',
      email: 'dra.elena.ramos@inversionista.com',
      phone: '+1 (809) 555-0202',
      unitId: 225, // Cana Rock Universe A201
      unitCode: 'CRU-301',
      projectName: 'Cana Rock Universe',
      scenario: '3 unidades · 1 Al Día, 1 Vencida, 1 En Legal',
    },
    {
      code: 'CLI-ENTREGA-003',
      firstName: 'Ing. Roberto',
      lastName: 'Valenzuela',
      email: 'ing.roberto.valenzuela@inversionista.com',
      phone: '+1 (809) 555-0303',
      unitId: 182, // Cana Rock Star D201
      unitCode: 'CRS-101',
      projectName: 'Cana Rock Star',
      scenario: '3 unidades · 1 Entregada, 1 En negociación / al día, 1 En proceso de entrega con Pago Insoluto + 3 cuotas vencidas y mora',
    },
  ];

  for (const client of clientsData) {
    // 1. Check contact
    const { data: existingContact } = await sb.from('contacts').select('id, public_code').eq('public_code', client.code).maybeSingle();
    let contactId = existingContact?.id;

    if (contactId) {
      console.log(`Contact ${client.code} found (ID: ${contactId})`);

      // 2. Check opportunity
      const { data: existingOpp } = await sb.from('opportunities').select('id').eq('contact_id', contactId).maybeSingle();
      let oppId = existingOpp?.id;

      if (!oppId) {
        const { data: newOpp, error: oppErr } = await sb.from('opportunities').insert({
          organization_id: 1,
          contact_id: contactId,
          stage: 'reservation',
          priority: 'high',
          budget_min: 150000,
          budget_max: 400000,
          currency: 'USD',
          objective: client.scenario,
          public_code: `OPP-${client.code.replace('CLI-', '')}`,
        }).select().single();

        if (oppErr) {
          console.error(`Error creating opportunity for ${client.code}:`, oppErr);
        } else {
          oppId = newOpp.id;
          console.log(`Created opportunity for ${client.code} (ID: ${oppId})`);
        }
      }

      if (oppId) {
        // 3. Reservation request
        const { data: existingReq } = await sb.from('reservation_requests').select('id').eq('opportunity_id', oppId).maybeSingle();
        let reqId = existingReq?.id;

        if (!reqId) {
          const { data: newReq, error: reqErr } = await sb.from('reservation_requests').insert({
            organization_id: 1,
            opportunity_id: oppId,
            unit_id: client.unitId,
            status: 'approved',
            reservation_type: 'temporary_hold',
            notes: client.scenario,
          }).select().single();

          if (reqErr) {
            console.error(`Error creating reservation request for ${client.code}:`, reqErr);
          } else {
            reqId = newReq.id;
            console.log(`Created reservation request for ${client.code} (ID: ${reqId})`);
          }
        } else {
          console.log(`Reservation request already exists for ${client.code} (ID: ${reqId})`);
        }

        if (reqId) {
          // 4. Reservation
          const { data: existingRes } = await sb.from('reservations').select('id').eq('reservation_request_id', reqId).maybeSingle();
          let resId = existingRes?.id;

          if (!resId) {
            const { data: newRes, error: resErr } = await sb.from('reservations').insert({
              organization_id: 1,
              reservation_request_id: reqId,
              unit_id: client.unitId,
              status: 'active',
              reservation_type: 'temporary_hold',
            }).select().single();

            if (resErr) {
              console.error(`Error creating reservation for ${client.code}:`, resErr);
            } else {
              resId = newRes.id;
              console.log(`Created reservation for ${client.code} (ID: ${resId})`);
            }
          } else {
            console.log(`Reservation already exists for ${client.code} (ID: ${resId})`);
          }

          if (resId) {
            // 5. Payment submission
            const { data: existingPay } = await sb.from('reservation_payment_submissions').select('id').eq('reservation_id', resId).maybeSingle();
            if (!existingPay) {
              await sb.from('reservation_payment_submissions').insert({
                organization_id: 1,
                reservation_id: resId,
                reservation_request_id: reqId,
                amount: 3000,
                currency: 'USD',
                status: 'approved',
                payment_stage: 'reservation',
                reference: `DEP-RES-${client.code}`,
                paid_at: new Date().toISOString(),
              });
              console.log(`Created initial approved payment for ${client.code}`);
            }
          }
        }
      }
    }
  }

  console.log('\n--- ALL USERS AND CLIENTS SEEDED SUCCESSFULLY ---');
}

run().catch(console.error);
