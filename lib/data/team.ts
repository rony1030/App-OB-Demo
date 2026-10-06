import { createClient } from '@/lib/supabase/server';
import { agreementState as resolveAgreementState, type AgreementState } from '@/lib/data/agreements';

export type TeamMemberOverview = {
  membershipId: number;
  userId: string;
  displayName: string;
  email: string | null;
  role: string;
  contactsCount: number;
  pipelineValue: number;
  agreementState: AgreementState | 'none';
  agreementExpiresAt: string | null;
};

export type AgencyTeamOverview = {
  members: TeamMemberOverview[];
  totalContacts: number;
  totalPipelineValue: number;
  membersWithValidAgreement: number;
  membersPending: number;
};

const roleLabels: Record<string, string> = {
  broker_agent: 'Vendedor / Asesor inmobiliario',
  agency_admin: 'Administrador de agencia',
  agency_support: 'Soporte de agencia',
  master_broker_admin: 'Administrador principal',
  master_broker_operations: 'Operaciones Master',
};

export { roleLabels };

export async function getAgencyTeamOverview(organizationId: number): Promise<AgencyTeamOverview> {
  const supabase = await createClient();

  const { data: memberships } = await supabase
    .from('memberships')
    .select('id, user_id, role')
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .in('role', ['broker_agent', 'agency_admin', 'agency_support', 'master_broker_admin', 'master_broker_operations']);

  const members = memberships ?? [];
  if (members.length === 0) {
    return { members: [], totalContacts: 0, totalPipelineValue: 0, membersWithValidAgreement: 0, membersPending: 0 };
  }

  const userIds = members.map((m) => m.user_id);
  const membershipIds = members.map((m) => m.id);

  const [{ data: profiles }, { data: contacts }, { data: agreements }] = await Promise.all([
    supabase.from('profiles').select('user_id, display_name, email').in('user_id', userIds),
    supabase
      .from('contacts')
      .select('created_by, opportunities(budget_min, budget_max, stage)')
      .eq('organization_id', organizationId)
      .is('deleted_at', null),
    supabase
      .from('agreements')
      .select('signer_membership_id, status, expires_at')
      .in('signer_membership_id', membershipIds)
      .order('created_at', { ascending: false }),
  ]);

  const profileByUserId = new Map((profiles ?? []).map((p) => [p.user_id, p]));

  type ContactRow = { created_by: string | null; opportunities: { budget_min: number | null; budget_max: number | null; stage: string }[] };
  const contactsByOwner = new Map<string, { count: number; value: number }>();
  for (const c of (contacts ?? []) as unknown as ContactRow[]) {
    if (!c.created_by) continue;
    const entry = contactsByOwner.get(c.created_by) ?? { count: 0, value: 0 };
    entry.count += 1;
    const openOpps = c.opportunities.filter((o) => !['won', 'lost'].includes(o.stage));
    entry.value += openOpps.reduce((sum, o) => sum + ((o.budget_min ?? 0) + (o.budget_max ?? o.budget_min ?? 0)) / 2, 0);
    contactsByOwner.set(c.created_by, entry);
  }

  const latestAgreementByMembership = new Map<number, { status: string; expires_at: string | null }>();
  for (const a of agreements ?? []) {
    if (a.signer_membership_id !== null && !latestAgreementByMembership.has(a.signer_membership_id)) {
      latestAgreementByMembership.set(a.signer_membership_id, { status: a.status, expires_at: a.expires_at });
    }
  }

  let membersWithValidAgreement = 0;
  let membersPending = 0;

  const result: TeamMemberOverview[] = members.map((m) => {
    const profile = profileByUserId.get(m.user_id);
    const stats = contactsByOwner.get(m.user_id) ?? { count: 0, value: 0 };
    const agreement = latestAgreementByMembership.get(m.id);
    const state = agreement ? resolveAgreementState(agreement.status, agreement.expires_at) : 'none';
    if (state === 'vigente') membersWithValidAgreement += 1;
    if (state === 'pending_signature') membersPending += 1;

    return {
      membershipId: m.id,
      userId: m.user_id,
      displayName: profile?.display_name ?? 'Sin nombre',
      email: profile?.email ?? null,
      role: m.role,
      contactsCount: stats.count,
      pipelineValue: stats.value,
      agreementState: state,
      agreementExpiresAt: agreement?.expires_at ?? null,
    };
  });

  return {
    members: result.sort((a, b) => b.pipelineValue - a.pipelineValue),
    totalContacts: result.reduce((s, m) => s + m.contactsCount, 0),
    totalPipelineValue: result.reduce((s, m) => s + m.pipelineValue, 0),
    membersWithValidAgreement,
    membersPending,
  };
}

export type AgencyAgentOption = {
  membershipId: number;
  userId: string;
  displayName: string;
  email: string | null;
  role: string;
};

export async function getAgencyAgents(organizationId: number): Promise<AgencyAgentOption[]> {
  const supabase = await createClient();

  const { data: memberships } = await supabase
    .from('memberships')
    .select('id, user_id, role')
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .in('role', ['broker_agent', 'agency_admin', 'agency_support', 'master_broker_admin', 'master_broker_operations', 'super_admin']);

  const members = memberships ?? [];
  if (members.length === 0) return [];

  const userIds = members.map((m) => m.user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, display_name, email')
    .in('user_id', userIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));

  return members.map((m) => {
    const prof = profileMap.get(m.user_id);
    const displayName = prof?.display_name || prof?.email?.split('@')[0] || 'Agente';
    return {
      membershipId: m.id,
      userId: m.user_id,
      displayName,
      email: prof?.email ?? null,
      role: m.role,
    };
  });
}

