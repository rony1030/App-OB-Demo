const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Register typescript compilation and @ alias
require('./register-typescript.cjs');

// Read .env.local
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

const { generateAgreementPdf } = require('../lib/signatures/pdf-stamp.ts');

const LUNOVI_FOLDER = 'C:\\Users\\Rony\\Downloads\\acuerdo';
const ORG_ID = 61; // Lunovi Real Estate active org
const SABINE_EMAIL = 'sabine@lunovirealestate.com';
const SABINE_NAME = 'Dr. Sabine Vicioso David';
const SABINE_PHONE = '+1 829 619 9971';
const SABINE_CEDULA = '402-5016067-4';

async function main() {
  console.log('=== STARTING LUNOVI & SABINE ONBOARDING (ZERO EMAILS SENT) ===\n');

  // 1. COPY & UPLOAD LOGO
  console.log('1. Processing Logo...');
  const logoLocalSource = path.join(LUNOVI_FOLDER, 'Lunovi-Logo.png');
  const logoBuffer = fs.readFileSync(logoLocalSource);

  // Copy to public/brand
  const publicBrandDir = path.resolve('public/brand');
  fs.mkdirSync(publicBrandDir, { recursive: true });
  fs.writeFileSync(path.join(publicBrandDir, 'lunovi-logo.png'), logoBuffer);
  console.log(' - Copied to public/brand/lunovi-logo.png');

  // Upload to Supabase Storage public-assets
  const logoStoragePath = `logos/org_${ORG_ID}_logo.png`;
  const { error: logoUploadError } = await supabase.storage
    .from('public-assets')
    .upload(logoStoragePath, logoBuffer, { contentType: 'image/png', upsert: true });
  if (logoUploadError) {
    console.error(' - Error uploading logo to public-assets:', logoUploadError);
  } else {
    console.log(' - Uploaded to public-assets:', logoStoragePath);
  }

  const { data: publicUrlData } = supabase.storage.from('public-assets').getPublicUrl(logoStoragePath);
  const logoUrl = publicUrlData?.publicUrl || `/brand/lunovi-logo.png`;
  console.log(' - Public Logo URL:', logoUrl);

  // 2. UPDATE ORGANIZATION 61
  console.log('\n2. Updating Organization Details...');
  const { data: updatedOrg, error: orgUpdateError } = await supabase
    .from('organizations')
    .update({
      name: 'Lunovi Real Estate',
      legal_name: 'LUNOVI REALESTATE, S.R.L.',
      tax_id: '1-32-19226-5',
      legal_address: 'Plaza San Juan Shopping Center, Local E-6, Ave. Barceló, D.M.T. Verón-Punta Cana, Prov. La Altagracia',
      legal_representative_name: SABINE_NAME,
      legal_representative_id: SABINE_CEDULA,
      contact_email: SABINE_EMAIL,
      contact_phone: '+18296199971',
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', ORG_ID)
    .select('*')
    .single();

  if (orgUpdateError) {
    throw new Error(`Failed to update organization: ${orgUpdateError.message}`);
  }
  console.log(' - Organization 61 updated successfully:', {
    name: updatedOrg.name,
    legal_name: updatedOrg.legal_name,
    tax_id: updatedOrg.tax_id,
    representative: updatedOrg.legal_representative_name,
    rep_id: updatedOrg.legal_representative_id,
  });

  // 3. UPSERT BRAND PROFILE FOR CRM
  console.log('\n3. Setting up CRM Brand Profile...');
  const brandData = {
    organization_id: ORG_ID,
    name: 'Lunovi Real Estate',
    is_default: true,
    logo_path: logoUrl,
    logo_dark_path: logoUrl,
    primary_color: '#0c4a6e',
    secondary_color: '#0284c7',
    accent_color: '#eab308',
    surface_color: '#f8fafc',
    contact_email: SABINE_EMAIL,
    contact_phone: SABINE_PHONE,
    whatsapp_number: '+18296199971',
    website: 'https://www.lunovirealestate.com',
    address: 'Plaza San Juan Shopping Center, Local E-6, Ave. Barceló, D.M.T. Verón-Punta Cana',
    updated_at: new Date().toISOString(),
  };

  const { data: existingBrand } = await supabase
    .from('brand_profiles')
    .select('id')
    .eq('organization_id', ORG_ID)
    .maybeSingle();

  let brandProfileId;
  if (existingBrand) {
    const { data: b, error: bErr } = await supabase
      .from('brand_profiles')
      .update(brandData)
      .eq('id', existingBrand.id)
      .select('id')
      .single();
    if (bErr) throw new Error(`Failed to update brand profile: ${bErr.message}`);
    brandProfileId = b.id;
    console.log(' - Brand profile updated with ID:', brandProfileId);
  } else {
    const { data: b, error: bErr } = await supabase
      .from('brand_profiles')
      .insert(brandData)
      .select('id')
      .single();
    if (bErr) throw new Error(`Failed to insert brand profile: ${bErr.message}`);
    brandProfileId = b.id;
    console.log(' - Brand profile created with ID:', brandProfileId);
  }

  // 4. SETUP USER & MEMBERSHIP FOR DR. SABINE VICIOSO DAVID
  console.log('\n4. Setting up User & Membership for Dr. Sabine Vicioso David...');
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  let sabineUser = existingUsers?.users?.find(
    (u) => (u.email || '').toLowerCase() === SABINE_EMAIL.toLowerCase()
  );

  if (!sabineUser) {
    const tempPassword = 'SabineLunovi2026!';
    const { data: createdUser, error: createUserError } = await supabase.auth.admin.createUser({
      email: SABINE_EMAIL,
      password: tempPassword,
      email_confirm: true, // confirmed immediately, NO confirmation email sent!
      user_metadata: {
        display_name: SABINE_NAME,
        first_name: 'Sabine',
        last_name: 'Vicioso David',
        phone: SABINE_PHONE,
      },
    });
    if (createUserError) throw new Error(`Failed to create user: ${createUserError.message}`);
    sabineUser = createdUser.user;
    console.log(' - Created auth user:', sabineUser.id, 'with email:', sabineUser.email);
  } else {
    console.log(' - Auth user already exists:', sabineUser.id);
  }

  // Upsert profile
  const { error: profileError } = await supabase.from('profiles').upsert(
    {
      user_id: sabineUser.id,
      display_name: SABINE_NAME,
      email: SABINE_EMAIL,
      phone: SABINE_PHONE,
      professional_title: 'Real Estate Expert | CEO',
      website_url: 'https://www.lunovirealestate.com',
      locale: 'es',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );
  if (profileError) throw new Error(`Failed to upsert profile: ${profileError.message}`);
  console.log(' - Profile upserted for user');

  // Upsert membership in Org 61 as agency_admin
  const { data: membership, error: membershipError } = await supabase
    .from('memberships')
    .upsert(
      {
        organization_id: ORG_ID,
        user_id: sabineUser.id,
        role: 'agency_admin',
        status: 'active',
        is_primary: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'organization_id,user_id' }
    )
    .select('id')
    .single();

  if (membershipError) throw new Error(`Failed to upsert membership: ${membershipError.message}`);
  const membershipId = membership.id;
  console.log(' - Membership active in Org 61 with ID:', membershipId, '(Role: agency_admin)');

  // Update invitation 6
  await supabase
    .from('invitations')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('organization_id', ORG_ID)
    .eq('email', SABINE_EMAIL);
  console.log(' - Invitation #6 marked as accepted');

  // Grant project access to Cipres (13) and others
  const projectIds = [25, 22, 13, 33, 26, 35, 23, 24];
  for (const pid of projectIds) {
    const { data: proj } = await supabase.from('projects').select('id, organization_id').eq('id', pid).single();
    if (proj) {
      await supabase.from('project_access').upsert(
        {
          project_id: proj.id,
          organization_id: proj.organization_id,
          grantee_membership_id: membershipId,
          access_level: 'sell',
        },
        { onConflict: 'project_id,grantee_membership_id' }
      );
    }
  }
  console.log(' - Project access granted for projects:', projectIds);

  // 5. UPLOAD AGENCY DOCUMENTS TO private-documents
  console.log('\n5. Uploading Agency Compliance Documents...');
  const docsToUpload = [
    {
      fileName: 'Certificado registro mercantil 2026.pdf',
      documentType: 'mercantile_registry',
      title: 'Registro Mercantil No. 12216LA - Lunovi Realestate S.R.L.',
      mimeType: 'application/pdf',
      issuedAt: '2020-08-17',
      expiresAt: '2026-08-17',
      notes: 'Cámara de Comercio y Producción de La Altagracia, Inc. Matrícula No. 12216LA. RNC 1-32-19226-5',
    },
    {
      fileName: 'Cedula Sabine Vicioso.jpg',
      documentType: 'legal_representative_id',
      title: 'Cédula de Identidad - Dr. Sabine Vicioso David',
      mimeType: 'image/jpeg',
      issuedAt: null,
      expiresAt: '2026-06-27',
      notes: 'Cédula No. 402-5016067-4. Gerente / Representante Legal. Pasaporte: C20KPS3T7',
    },
    {
      fileName: 'Wire instructions Lunovi.docx',
      documentType: 'banking',
      title: 'Instrucciones Bancarias - Banco Popular Dominicano',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      issuedAt: null,
      expiresAt: null,
      notes: 'Banco Popular Dominicano. Cta USD: 821390820 / Cta RD$: 821390697. Swift: BPDODOSXXXX',
    },
    {
      fileName: 'Cedula Carlos.pdf',
      documentType: 'other',
      title: 'Cédula de Identidad - Carlos Felix Vicioso David (Socio)',
      mimeType: 'application/pdf',
      issuedAt: null,
      expiresAt: '2024-10-14',
      notes: 'Cédula No. 023-0107686-1. Socio Accionista',
    },
  ];

  for (const doc of docsToUpload) {
    const filePath = path.join(LUNOVI_FOLDER, doc.fileName);
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      continue;
    }
    const fileBuffer = fs.readFileSync(filePath);
    const storagePath = `lunovi-real-estate-eefc50/agency-documents/${doc.documentType}/${Date.now()}-${doc.fileName.replace(/\s+/g, '_')}`;

    // Upload to private-documents
    const { error: uploadError } = await supabase.storage
      .from('private-documents')
      .upload(storagePath, fileBuffer, { contentType: doc.mimeType, upsert: true });

    if (uploadError) {
      console.error(` - Error uploading ${doc.fileName}:`, uploadError.message);
      continue;
    }

    // Insert or update in organization_documents
    const { data: existingDoc } = await supabase
      .from('organization_documents')
      .select('id')
      .eq('organization_id', ORG_ID)
      .eq('document_type', doc.documentType)
      .eq('title', doc.title)
      .maybeSingle();

    if (existingDoc) {
      await supabase
        .from('organization_documents')
        .update({
          storage_bucket: 'private-documents',
          storage_path: storagePath,
          mime_type: doc.mimeType,
          size_bytes: fileBuffer.length,
          status: 'approved',
          issued_at: doc.issuedAt,
          expires_at: doc.expiresAt,
          notes: doc.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingDoc.id);
      console.log(` - Updated doc [${doc.documentType}]: ${doc.title}`);
    } else {
      await supabase
        .from('organization_documents')
        .insert({
          organization_id: ORG_ID,
          document_type: doc.documentType,
          title: doc.title,
          status: 'approved',
          storage_bucket: 'private-documents',
          storage_path: storagePath,
          mime_type: doc.mimeType,
          size_bytes: fileBuffer.length,
          issued_at: doc.issuedAt,
          expires_at: doc.expiresAt,
          notes: doc.notes,
          created_by: sabineUser.id,
        });
      console.log(` - Inserted doc [${doc.documentType}]: ${doc.title}`);
    }
  }

  // 6. CREATE COLLABORATION AGREEMENT FOR CIPRES RESIDENCES
  console.log('\n6. Generating Collaboration Agreement for Cipres Residences...');
  const CIPRES_PROJECT_ID = 13;
  const MASTER_BROKER_ORG_ID = 1; // Bello Valdez Enterprise

  const { data: masterBrokerOrg } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', MASTER_BROKER_ORG_ID)
    .single();

  const { data: projectRow } = await supabase
    .from('projects')
    .select('*, developer:organizations!projects_developer_organization_id_fkey(*)')
    .eq('id', CIPRES_PROJECT_ID)
    .single();

  console.log(` - Master Broker: ${masterBrokerOrg.name} (${masterBrokerOrg.legal_name})`);
  console.log(` - Project: ${projectRow.name} (Developer: ${projectRow.developer?.name})`);

  // Check if an agreement already exists
  const { data: existingAgr } = await supabase
    .from('agreements')
    .select('id, status, public_code')
    .eq('broker_organization_id', ORG_ID)
    .eq('project_id', CIPRES_PROJECT_ID)
    .eq('kind', 'project_specific')
    .maybeSingle();

  let agreementId;
  let agreementPublicCode;

  const commissionTerms = 'Para Cipres Residences: 5% más ITBIS, pagadero a la firma del contrato cuando el cliente haya pagado el 0% del valor del inmueble.';

  if (existingAgr) {
    agreementId = existingAgr.id;
    agreementPublicCode = existingAgr.public_code;
    console.log(` - Existing agreement found: ID ${agreementId} (${agreementPublicCode})`);
  } else {
    const { data: newAgr, error: newAgrErr } = await supabase
      .from('agreements')
      .insert({
        master_broker_organization_id: MASTER_BROKER_ORG_ID,
        broker_organization_id: ORG_ID,
        project_id: CIPRES_PROJECT_ID,
        kind: 'project_specific',
        signer_membership_id: membershipId,
        valid_months: 12,
        status: 'pending_signature',
        commission_rate: 5,
        commission_terms: commissionTerms,
        master_broker_rep_name: 'Gleivys Osvaldo Bello',
        master_broker_rep_position: 'Gerente General',
        master_broker_rep_id: '001-0000000-0',
        master_broker_rep_email: 'info@osvaldobello.com',
        created_by: 'a0000000-0000-0000-0000-000000000001',
      })
      .select('id, public_code')
      .single();

    if (newAgrErr) throw new Error(`Failed to create agreement: ${newAgrErr.message}`);
    agreementId = newAgr.id;
    agreementPublicCode = newAgr.public_code;
    console.log(` - Created new agreement: ID ${agreementId} (${agreementPublicCode})`);
  }

  // Generate the PDF
  console.log(' - Generating contract PDF using generateAgreementPdf...');
  const { bytes: pdfBytes, signatureField } = await generateAgreementPdf({
    masterBroker: {
      legalName: masterBrokerOrg.legal_name || masterBrokerOrg.name,
      taxId: masterBrokerOrg.tax_id,
      address: masterBrokerOrg.legal_address,
      repName: 'Gleivys Osvaldo Bello',
      repPosition: 'Gerente General',
      repId: null,
      repEmail: 'info@osvaldobello.com',
    },
    brokerOrg: {
      legalName: updatedOrg.legal_name,
      taxId: updatedOrg.tax_id,
      address: updatedOrg.legal_address,
    },
    signerName: SABINE_NAME,
    signerIdNumber: SABINE_CEDULA,
    project: {
      name: projectRow.name,
      location: projectRow.location,
      developerName: projectRow.developer?.name || 'KYSER',
    },
    developer: {
      legalName: projectRow.developer?.legal_name || projectRow.developer?.name || 'KYSER',
      taxId: projectRow.developer?.tax_id || null,
      address: projectRow.developer?.legal_address || null,
    },
    commissionRate: 5,
    commissionTerms: commissionTerms,
    validMonths: 12,
    kind: 'project_specific',
  });

  const templatePath = `${masterBrokerOrg.slug}/agreements/${agreementId}/template.pdf`;
  const { error: uploadPdfErr } = await supabase.storage
    .from('private-documents')
    .upload(templatePath, Buffer.from(pdfBytes), { contentType: 'application/pdf', upsert: true });

  if (uploadPdfErr) {
    throw new Error(`Failed to upload agreement template PDF: ${uploadPdfErr.message}`);
  }
  console.log(' - Agreement template PDF uploaded to:', templatePath);

  // Setup signature_documents, signature_signers, and signature_fields
  const title = `Acuerdo de colaboración · ${projectRow.name} · ${updatedOrg.name}`;

  const { data: sigDoc, error: sigDocErr } = await supabase
    .from('signature_documents')
    .insert({
      organization_id: MASTER_BROKER_ORG_ID,
      title,
      status: 'pending',
      source_storage_bucket: 'private-documents',
      source_storage_path: templatePath,
      created_by: 'a0000000-0000-0000-0000-000000000001',
    })
    .select('id')
    .single();

  if (sigDocErr) throw new Error(`Failed to create signature_document: ${sigDocErr.message}`);

  const discardedToken = crypto.randomBytes(24).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(discardedToken).digest('hex');

  const { data: signer, error: signerErr } = await supabase
    .from('signature_signers')
    .insert({
      signature_document_id: sigDoc.id,
      name: SABINE_NAME,
      email: SABINE_EMAIL,
      id_number: SABINE_CEDULA,
      signer_role: 'Broker',
      sign_order: 1,
      status: 'pending',
      signing_token_hash: tokenHash,
    })
    .select('id')
    .single();

  if (signerErr) throw new Error(`Failed to create signer: ${signerErr.message}`);

  await supabase.from('signature_fields').insert({
    signer_id: signer.id,
    page_number: signatureField.pageNumber,
    x: signatureField.x,
    y: signatureField.y,
    width: signatureField.width,
    height: signatureField.height,
    field_type: 'signature',
  });

  await supabase
    .from('agreements')
    .update({ signature_document_id: sigDoc.id })
    .eq('id', agreementId);

  console.log(` - Signature document prepared (ID: ${sigDoc.id}) and linked to agreement ${agreementId}`);

  console.log('\n=== COMPLETE SETUP FINISHED SUCCESSFULLY ===');
  console.log('Summary:');
  console.log(' - Organization:', updatedOrg.name, `(ID: ${ORG_ID})`);
  console.log(' - User:', SABINE_NAME, `(${SABINE_EMAIL})`);
  console.log(' - Role:', 'agency_admin (Admin Inmobiliaria)');
  console.log(' - Membership ID:', membershipId);
  console.log(' - Agreement Public Code:', agreementPublicCode);
  console.log(' - Review URL in Portal:', `/portal/agreements/${agreementPublicCode}`);
  console.log(' - Sign URL in Portal:', `/portal/agreements/${agreementPublicCode}/sign`);
  console.log(' - Zero emails sent.');
}

main().catch((err) => {
  console.error('\nFATAL ERROR:', err);
  process.exit(1);
});
