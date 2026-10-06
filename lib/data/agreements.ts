import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth/get-user';

export type AgreementState = 'draft' | 'pending_signature' | 'vigente' | 'vencido' | 'revoked';

/** "vigente"/"vencido" are derived from expires_at at read time — no cron involved. */
export function agreementState(status: string, expiresAt: string | null): AgreementState {
  if (status === 'signed') {
    if (expiresAt && new Date(expiresAt) < new Date()) return 'vencido';
    return 'vigente';
  }
  if (status === 'revoked') return 'revoked';
  if (status === 'pending_signature') return 'pending_signature';
  return 'draft';
}

type LegalOrg = { id: number; name: string; slug: string; legal_name: string | null; tax_id: string | null; legal_address: string | null };

export type AgreementSummary = {
  id: number;
  publicCode: string;
  kind: 'general' | 'project_specific';
  status: string;
  state: AgreementState;
  validMonths: number;
  signedAt: string | null;
  expiresAt: string | null;
  masterBrokerOrg: LegalOrg;
  brokerOrg: LegalOrg;
  project: { id: number; name: string; slug: string; location: string | null; developer: LegalOrg | null } | null;
  signerMembershipId: number | null;
  signerName: string | null;
  commissionRate: number | null;
  commissionTerms: string | null;
  masterBrokerRep: { name: string | null; position: string | null; idNumber: string | null; email: string | null };
};

const LEGAL_ORG_FIELDS = 'id, name, slug, legal_name, tax_id, legal_address';

// `memberships` has no declared FK to `profiles` (both point at auth.users
// independently), so PostgREST can't embed one through the other. Names are
// resolved with a second batched query instead.
const AGREEMENT_SELECT = `
  id, public_code, kind, status, valid_months, signed_at, expires_at,
  master_broker_organization_id, broker_organization_id, project_id, signer_membership_id,
  commission_rate, commission_terms,
  master_broker_rep_name, master_broker_rep_position, master_broker_rep_id, master_broker_rep_email,
  master_broker_org:organizations!agreements_master_broker_organization_id_fkey(${LEGAL_ORG_FIELDS}),
  broker_org:organizations!agreements_broker_organization_id_fkey(${LEGAL_ORG_FIELDS}),
  project:projects(id, name, slug, location, developer:organizations!projects_developer_organization_id_fkey(${LEGAL_ORG_FIELDS})),
  signer:memberships!agreements_signer_membership_id_fkey(id, user_id)
`;

async function profileNamesByUserIds(userIds: string[]): Promise<Map<string, string>> {
  const unique = Array.from(new Set(userIds.filter(Boolean)));
  if (unique.length === 0) return new Map();
  const { data } = await createAdminClient().from('profiles').select('user_id, display_name').in('user_id', unique);
  const map = new Map<string, string>();
  (data ?? []).forEach((p) => map.set(p.user_id, p.display_name));
  return map;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAgreement(row: any, nameByUserId: Map<string, string>): AgreementSummary {
  return {
    id: row.id,
    publicCode: row.public_code || `AGR-${row.id}`,
    kind: row.kind,
    status: row.status,
    state: agreementState(row.status, row.expires_at),
    validMonths: row.valid_months,
    signedAt: row.signed_at,
    expiresAt: row.expires_at,
    masterBrokerOrg: row.master_broker_org,
    brokerOrg: row.broker_org,
    project: row.project,
    signerMembershipId: row.signer_membership_id,
    signerName: row.signer?.user_id ? nameByUserId.get(row.signer.user_id) ?? null : null,
    commissionRate: row.commission_rate,
    commissionTerms: row.commission_terms,
    masterBrokerRep: {
      name: row.master_broker_rep_name,
      position: row.master_broker_rep_position,
      idNumber: row.master_broker_rep_id,
      email: row.master_broker_rep_email,
    },
  };
}

/** Agreements the current broker needs to sign or has already signed. */
export async function getMyAgreements(): Promise<AgreementSummary[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('agreements')
    .select(AGREEMENT_SELECT)
    .eq('broker_organization_id', user.organization.id)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`No fue posible cargar tus acuerdos: ${error.message}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = data as any[];
  const nameByUserId = await profileNamesByUserIds(rows.map((r) => r.signer?.user_id));
  return rows.map((row) => mapAgreement(row, nameByUserId));
}

/** Agreements issued by the current user's organization (master broker management view). */
export async function getIssuedAgreements(): Promise<AgreementSummary[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('agreements')
    .select(AGREEMENT_SELECT)
    .eq('master_broker_organization_id', user.organization.id)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`No fue posible cargar los acuerdos emitidos: ${error.message}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = data as any[];
  const nameByUserId = await profileNamesByUserIds(rows.map((r) => r.signer?.user_id));
  return rows.map((row) => mapAgreement(row, nameByUserId));
}

export type AgreementDetail = AgreementSummary & {
  createdBy: string | null;
  signatureDocumentId: number | null;
  signer: { id: number; name: string; email: string; status: string; signedAt: string | null } | null;
  field: { pageNumber: number; x: number; y: number; width: number; height: number } | null;
  sourceStoragePath: string | null;
  sourceStorageBucket: string | null;
  finalStoragePath: string | null;
  isManual: boolean;
  manualUploadPath: string | null;
  manualUploadBucket: string | null;
};

export async function getAgreementDetailByCode(code: string): Promise<AgreementDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('agreements').select('id').eq('public_code', code).maybeSingle();
  if (!data) return null;
  return getAgreementDetail(data.id);
}

export async function getAgreementDetail(agreementId: number): Promise<AgreementDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('agreements')
    .select(`
      ${AGREEMENT_SELECT},
      created_by, is_manual, manual_upload_path, manual_upload_bucket,
      signature_document:signature_documents!agreements_signature_document_id_fkey(
        id, status, source_storage_bucket, source_storage_path, final_storage_path,
        signature_signers(id, name, email, status, signed_at, signature_fields(page_number, x, y, width, height, field_type))
      )
    `)
    .eq('id', agreementId)
    .maybeSingle();
  if (error) throw new Error(`No fue posible cargar el acuerdo: ${error.message}`);
  if (!data) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any;
  const nameByUserId = await profileNamesByUserIds([row.signer?.user_id]);
  const signatureDoc = Array.isArray(row.signature_document) ? row.signature_document[0] : row.signature_document;
  const signer = signatureDoc?.signature_signers?.[0] ?? null;
  const field = signer?.signature_fields?.find((f: { field_type: string }) => f.field_type === 'signature') ?? null;

  return {
    ...mapAgreement(row, nameByUserId),
    createdBy: row.created_by,
    signatureDocumentId: signatureDoc?.id ?? null,
    signer: signer
      ? { id: signer.id, name: signer.name, email: signer.email, status: signer.status, signedAt: signer.signed_at }
      : null,
    field: field ? { pageNumber: field.page_number, x: field.x, y: field.y, width: field.width, height: field.height } : null,
    sourceStoragePath: signatureDoc?.source_storage_path ?? null,
    sourceStorageBucket: signatureDoc?.source_storage_bucket ?? null,
    finalStoragePath: signatureDoc?.final_storage_path ?? null,
    isManual: row.is_manual ?? false,
    manualUploadPath: row.manual_upload_path ?? null,
    manualUploadBucket: row.manual_upload_bucket ?? null,
  };
}

export type AgreementSettings = { defaultValidMonths: number; requiresProjectSpecific: boolean };

export async function getOrganizationAgreementSettings(organizationId: number): Promise<AgreementSettings> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('organization_agreement_settings')
    .select('default_valid_months, requires_project_specific')
    .eq('organization_id', organizationId)
    .maybeSingle();
  return {
    defaultValidMonths: data?.default_valid_months ?? 12,
    requiresProjectSpecific: data?.requires_project_specific ?? false,
  };
}

export type DirectoryOrg = { id: number; name: string; slug: string; kind: string };

/** Organizations a master broker could send an agreement to (any org that isn't their own). */
export async function listOtherOrganizations(excludeOrganizationId: number): Promise<DirectoryOrg[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, slug, kind')
    .neq('id', excludeOrganizationId)
    .order('name');
  if (error) throw new Error(`No fue posible cargar organizaciones: ${error.message}`);
  return data ?? [];
}

export type DirectoryMember = { membershipId: number; userId: string; displayName: string; email: string | null; role: string };

export async function listOrganizationBrokerMembers(organizationId: number): Promise<DirectoryMember[]> {
  const currentUser = await getCurrentUser();
  if (!currentUser || !['super_admin', 'master_broker_admin', 'master_broker_operations'].includes(currentUser.role)) {
    return [];
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('memberships')
    .select('id, user_id, role, status')
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .in('role', ['broker_agent', 'agency_admin']);
  if (error) throw new Error(`No fue posible cargar los miembros: ${error.message}`);
  const userIds = (data ?? []).map((m) => m.user_id);
  if (userIds.length === 0) return [];
  const { data: profiles } = await admin.from('profiles').select('user_id, display_name, email').in('user_id', userIds);
  const profileByUserId = new Map((profiles ?? []).map((p) => [p.user_id, p]));
  return (data ?? []).map((m) => {
    const profile = profileByUserId.get(m.user_id);
    return {
      membershipId: m.id,
      userId: m.user_id,
      displayName: profile?.display_name ?? 'Sin nombre',
      email: profile?.email ?? null,
      role: m.role,
    };
  });
}

export async function listOrgPublishedProjects(organizationId: number): Promise<{ id: number; name: string; slug: string }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, slug')
    .eq('organization_id', organizationId)
    .order('name');
  if (error) throw new Error(`No fue posible cargar los proyectos: ${error.message}`);
  return data ?? [];
}

export type AgreementsOverview = {
  totalBrokerOrganizations: number;
  vigente: number;
  vencido: number;
  pendingSignature: number;
  byProject: { projectId: number; projectName: string; brokerCount: number }[];
};

/** Gerencia: cuántos brokers trabajan con esta organización, por proyecto y en general. */
export async function getOrgAgreementsOverview(organizationId: number): Promise<AgreementsOverview> {
  const supabase = await createClient();
  const [{ data: agreements, error }, { data: settings }, { data: projects }] = await Promise.all([
    supabase
      .from('agreements')
      .select('id, kind, status, expires_at, broker_organization_id, project_id')
      .eq('master_broker_organization_id', organizationId),
    supabase.from('organization_agreement_settings').select('requires_project_specific').eq('organization_id', organizationId).maybeSingle(),
    supabase.from('projects').select('id, name').eq('organization_id', organizationId),
  ]);
  if (error) throw new Error(`No fue posible cargar el resumen de acuerdos: ${error.message}`);

  const rows = agreements ?? [];
  const brokerOrgIds = new Set(rows.map((r) => r.broker_organization_id));
  let vigente = 0;
  let vencido = 0;
  let pendingSignature = 0;
  const vigenteGeneralBrokerOrgs = new Set<number>();
  const projectSpecificBrokerOrgsByProject = new Map<number, Set<number>>();

  for (const row of rows) {
    const state = agreementState(row.status, row.expires_at);
    if (state === 'vigente') {
      vigente += 1;
      if (row.kind === 'general') vigenteGeneralBrokerOrgs.add(row.broker_organization_id);
      if (row.kind === 'project_specific' && row.project_id) {
        if (!projectSpecificBrokerOrgsByProject.has(row.project_id)) projectSpecificBrokerOrgsByProject.set(row.project_id, new Set());
        projectSpecificBrokerOrgsByProject.get(row.project_id)!.add(row.broker_organization_id);
      }
    } else if (state === 'vencido') {
      vencido += 1;
    } else if (state === 'pending_signature') {
      pendingSignature += 1;
    }
  }

  const requiresProjectSpecific = settings?.requires_project_specific ?? false;
  const byProject = (projects ?? []).map((project) => {
    const specific = projectSpecificBrokerOrgsByProject.get(project.id) ?? new Set<number>();
    const combined = requiresProjectSpecific ? specific : new Set([...specific, ...vigenteGeneralBrokerOrgs]);
    return { projectId: project.id, projectName: project.name, brokerCount: combined.size };
  });

  return {
    totalBrokerOrganizations: brokerOrgIds.size,
    vigente,
    vencido,
    pendingSignature,
    byProject,
  };
}

export type BrokerFile = {
  membershipId: number;
  displayName: string;
  email: string | null;
  role: string;
  organizationName: string;
  agreements: AgreementSummary[];
};

/** Ficha/record de un broker: su historial completo de acuerdos con esta organización. */
export async function getBrokerFile(membershipId: number): Promise<BrokerFile | null> {
  const currentUser = await getCurrentUser();
  if (!currentUser || !['super_admin', 'master_broker_admin', 'master_broker_operations'].includes(currentUser.role)) {
    return null;
  }

  const admin = createAdminClient();
  const { data: membership, error } = await admin
    .from('memberships')
    .select('id, user_id, role, organization_id, organization:organizations!memberships_organization_id_fkey(name)')
    .eq('id', membershipId)
    .maybeSingle();
  if (error) throw new Error(`No fue posible cargar el broker: ${error.message}`);
  if (!membership) return null;

  const targetOrganization = membership.organization as unknown as { name: string } | null;
  if (currentUser.role !== 'super_admin') {
    const { data: authorizedAgreement } = await admin
      .from('agreements')
      .select('id')
      .eq('master_broker_organization_id', currentUser.organization.id)
      .eq('signer_membership_id', membershipId)
      .limit(1)
      .maybeSingle();

    if (!authorizedAgreement && currentUser.organization.id !== membership.organization_id) {
      return null;
    }
  }

  let agreementQuery = admin
    .from('agreements')
    .select(AGREEMENT_SELECT)
    .eq('signer_membership_id', membershipId);
  if (currentUser.role !== 'super_admin') {
    agreementQuery = agreementQuery.eq('master_broker_organization_id', currentUser.organization.id);
  }

  const [{ data: profile }, { data: agreementRows }] = await Promise.all([
    admin.from('profiles').select('display_name, email').eq('user_id', membership.user_id).maybeSingle(),
    agreementQuery.order('created_at', { ascending: false }),
  ]);

  const nameByUserId = new Map<string, string>();
  if (profile?.display_name) nameByUserId.set(membership.user_id, profile.display_name);
  const agreements = ((agreementRows ?? []) as unknown as Parameters<typeof mapAgreement>[0][]).map((row) => mapAgreement(row, nameByUserId));

  return {
    membershipId: membership.id,
    displayName: profile?.display_name ?? 'Sin nombre',
    email: profile?.email ?? null,
    role: membership.role,
    organizationName: targetOrganization?.name ?? 'Sin organización',
    agreements,
  };
}
