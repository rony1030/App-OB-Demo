import 'server-only';

import type { CurrentSessionUser } from '@/lib/auth/get-user';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export type ReportingOrganization = { id: number; name: string };
export type ReportingProject = { id: number; name: string; slug: string; availableUnits: number; totalUnits: number };
export type ReportingLead = { id: number; client: string; phone: string; email: string; project: string; agency: string; agent: string; reportedAt: string; expiresAt: string | null; status: string };
export type ReportingNegotiation = { id: number; project: string; agency: string; agent: string; unit: string; stage: string; updatedAt: string };
export type ReportingProposal = { id: number; project: string; agency: string; author: string; client: string; units: string; status: string; createdAt: string };
export type ReportingOverview = {
  scopeName: string;
  projects: ReportingProject[];
  units: Array<{ id: number; project: string; code: string; status: string; price: number; currency: string }>;
  leads: ReportingLead[];
  negotiations: ReportingNegotiation[];
  proposals: ReportingProposal[];
  stageCounts: Record<string, number>;
  commissionCounts: Record<string, number>;
  commissionCountsByProject: Record<number, Record<string, number>>;
  salesCount: number;
  salesVolumeByCurrency: Record<string, number>;
  salesByProject: Record<number, { count: number; volumeByCurrency: Record<string, number> }>;
  activeAgencies: number;
  lastLeadAt: string | null;
  limited: boolean;
};

export async function getReportingOrganizations(user: CurrentSessionUser): Promise<ReportingOrganization[]> {
  // Preview mode resolves the subject user's grants, not the super-admin's session grants.
  const client = user.isPreviewMode ? createAdminClient() : await createClient();
  const { data, error } = await client
    .from('master_broker_reporting_access')
    .select('master_broker_organization_id')
    .eq('user_id', user.id)
    .eq('status', 'active');
  if (error) {
    console.error('Reporting access could not be loaded:', error.message);
    return [];
  }
  const ids = (data ?? []).map((row) => row.master_broker_organization_id);
  if (!ids.length) return [];
  const { data: organizations, error: organizationError } = await client.from('organizations').select('id, name, kind, status').in('id', ids);
  if (organizationError) {
    console.error('Reporting organizations could not be loaded:', organizationError.message);
    return [];
  }
  return (organizations ?? []).filter((row) => row.kind === 'master_broker' && row.status === 'active').map((row) => ({ id: row.id, name: row.name }));
}

function nameOf(contact: { first_name: string; last_name: string | null } | undefined) {
  return contact ? `${contact.first_name} ${contact.last_name ?? ''}`.trim() : '—';
}

function snapshotItems(snapshot: unknown): Array<{ property_id?: string; project_slug?: string; unit_name?: string }> {
  if (!snapshot || typeof snapshot !== 'object') return [];
  const value = snapshot as { items?: unknown };
  return Array.isArray(value.items) ? value.items.filter((item) => item && typeof item === 'object') : [];
}

/** Every project ID is resolved from the session here, before the service-role client reads CRM data. */
export async function getProjectReporting(user: CurrentSessionUser, scope: { kind: 'master'; organizationId: number } | { kind: 'developer' }): Promise<ReportingOverview | null> {
  const session = await createClient();
  const admin = createAdminClient();
  let projectRows: Array<{ id: number; name: string; slug: string; inventory_available_declared: number | null; inventory_total_declared: number | null }> = [];
  let scopeName = '';

  if (scope.kind === 'master') {
    const allowed = await getReportingOrganizations(user);
    const organization = allowed.find((item) => item.id === scope.organizationId);
    if (!organization) return null;
    scopeName = organization.name;
    const { data, error } = await admin.from('projects').select('id, name, slug, inventory_available_declared, inventory_total_declared').eq('organization_id', organization.id).order('name');
    if (error) throw error;
    projectRows = data ?? [];
  } else {
    if (user.organization.kind !== 'developer' || !['developer_admin', 'developer_viewer', 'super_admin'].includes(user.role)) return null;
    scopeName = user.organization.name;
    // Session RLS also enforces project_access for project-scoped developer viewers.
    const { data, error } = await session.from('projects').select('id, name, slug, inventory_available_declared, inventory_total_declared').eq('developer_organization_id', user.organization.id).order('name');
    if (error) throw error;
    projectRows = data ?? [];
  }

  const projects = projectRows.map((row) => ({ id: row.id, name: row.name, slug: row.slug, availableUnits: row.inventory_available_declared ?? 0, totalUnits: row.inventory_total_declared ?? 0 }));
  const empty: ReportingOverview = { scopeName, projects, units: [], leads: [], negotiations: [], proposals: [], stageCounts: {}, commissionCounts: {}, commissionCountsByProject: {}, salesCount: 0, salesVolumeByCurrency: {}, salesByProject: {}, activeAgencies: 0, lastLeadAt: null, limited: false };
  if (projects.length === 0) return empty;
  const ids = projects.map((project) => project.id);
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const projectBySlug = new Map(projects.map((project) => [project.slug, project]));

  const [unitsResult, leadsResult, linksResult, claimsResult] = await Promise.all([
    admin.from('units').select('id, project_id, unit_code, status, list_price, currency').in('project_id', ids).order('unit_code').limit(5000),
    admin.from('lead_reports').select('id, project_id, organization_id, contact_id, reported_by_membership_id, created_at, protected_until, protection_status').in('project_id', ids).order('created_at', { ascending: false }).limit(5000),
    admin.from('opportunity_projects').select('opportunity_id, project_id').in('project_id', ids).limit(5000),
    admin.from('commission_claims').select('project_id, status').in('project_id', ids).limit(5000),
  ]);
  for (const result of [unitsResult, leadsResult, linksResult, claimsResult]) if (result.error) throw result.error;
  empty.limited = [unitsResult, leadsResult, linksResult, claimsResult].some((result) => (result.data?.length ?? 0) >= 5000);
  const unitRows = unitsResult.data ?? [];
  const leadRows = leadsResult.data ?? [];
  const links = linksResult.data ?? [];
  const unitById = new Map(unitRows.map((row) => [row.id, row]));
  const { data: opportunityUnits, error: opportunityUnitsError } = unitRows.length
    ? await admin.from('opportunity_units').select('opportunity_id, unit_id').in('unit_id', unitRows.map((row) => row.id)).limit(5000)
    : { data: [], error: null };
  if (opportunityUnitsError) throw opportunityUnitsError;
  const opportunityIds = [...new Set(links.map((row) => row.opportunity_id).concat((opportunityUnits ?? []).map((row) => row.opportunity_id)))];
  const [opportunitiesResult, salesResult, proposalVersionsResult] = await Promise.all([
    opportunityIds.length ? admin.from('opportunities').select('id, organization_id, owner_membership_id, stage, updated_at').in('id', opportunityIds).limit(5000) : Promise.resolve({ data: [], error: null }),
    unitRows.length ? admin.from('sales').select('id, unit_id, sale_price, currency').in('unit_id', unitRows.map((row) => row.id)).limit(5000) : Promise.resolve({ data: [], error: null }),
    // Proposals have no project FK yet; only project-scoped fields are extracted from snapshots below.
    admin.from('presentation_versions').select('presentation_id, version_number, snapshot').order('id', { ascending: false }).limit(5000),
  ]);
  for (const result of [opportunitiesResult, salesResult, proposalVersionsResult]) if (result.error) throw result.error;
  empty.limited ||= [opportunitiesResult, salesResult, proposalVersionsResult].some((result) => (result.data?.length ?? 0) >= 5000) || (opportunityUnits?.length ?? 0) >= 5000;
  const opportunities = opportunitiesResult.data ?? [];
  const sales = salesResult.data ?? [];
  const proposalSnapshots = new Map<number, { items: ReturnType<typeof snapshotItems>; projectSlug?: string; clientName?: string }>();
  for (const row of proposalVersionsResult.data ?? []) {
    if (proposalSnapshots.has(row.presentation_id)) continue;
    const snapshot = row.snapshot as { project_slug?: string; client_name?: string; client?: { name?: string } } | null;
    proposalSnapshots.set(row.presentation_id, { items: snapshotItems(snapshot), projectSlug: snapshot?.project_slug, clientName: snapshot?.client_name || snapshot?.client?.name });
  }
  const matchingProposalIds = [...proposalSnapshots.entries()].filter(([, snapshot]) => snapshot.items.some((item) => ids.includes(Number(item.property_id)) || (item.project_slug && projectBySlug.has(item.project_slug))) || (snapshot.projectSlug && projectBySlug.has(snapshot.projectSlug))).map(([id]) => id);
  const { data: proposalRows, error: proposalError } = matchingProposalIds.length
    ? await admin.from('presentations').select('id, organization_id, contact_id, author_membership_id, kind, status, created_at').in('id', matchingProposalIds).eq('kind', 'proposal').neq('status', 'draft').limit(5000)
    : { data: [], error: null };
  if (proposalError) throw proposalError;

  const contactIds = [...new Set(leadRows.map((row) => row.contact_id).concat((proposalRows ?? []).flatMap((row) => row.contact_id ? [row.contact_id] : [])))];
  const membershipIds = [...new Set(leadRows.flatMap((row) => row.reported_by_membership_id ? [row.reported_by_membership_id] : []).concat(opportunities.flatMap((row) => row.owner_membership_id ? [row.owner_membership_id] : []), (proposalRows ?? []).flatMap((row) => row.author_membership_id ? [row.author_membership_id] : [])))];
  const organizationIds = [...new Set(leadRows.map((row) => row.organization_id).concat(opportunities.map((row) => row.organization_id), (proposalRows ?? []).map((row) => row.organization_id)))];
  const [contactsResult, membershipsResult, organizationsResult] = await Promise.all([
    contactIds.length ? admin.from('contacts').select('id, first_name, last_name, phone, email, deleted_at').in('id', contactIds) : Promise.resolve({ data: [], error: null }),
    membershipIds.length ? admin.from('memberships').select('id, user_id').in('id', membershipIds) : Promise.resolve({ data: [], error: null }),
    organizationIds.length ? admin.from('organizations').select('id, name').in('id', organizationIds) : Promise.resolve({ data: [], error: null }),
  ]);
  for (const result of [contactsResult, membershipsResult, organizationsResult]) if (result.error) throw result.error;
  const contacts = new Map((contactsResult.data ?? []).filter((row) => !row.deleted_at).map((row) => [row.id, row]));
  const memberships = new Map((membershipsResult.data ?? []).map((row) => [row.id, row.user_id]));
  const userIds = [...new Set((membershipsResult.data ?? []).map((row) => row.user_id))];
  const { data: profiles, error: profilesError } = userIds.length ? await admin.from('profiles').select('user_id, display_name').in('user_id', userIds) : { data: [], error: null };
  if (profilesError) throw profilesError;
  const profileNames = new Map((profiles ?? []).map((row) => [row.user_id, row.display_name]));
  const orgNames = new Map((organizationsResult.data ?? []).map((row) => [row.id, row.name]));
  const agentName = (membershipId: number | null) => membershipId ? profileNames.get(memberships.get(membershipId) ?? '') || '—' : '—';
  const agencies = new Set<number>();

  empty.units = unitRows.map((row) => ({ id: row.id, project: projectById.get(row.project_id)?.name ?? '—', code: row.unit_code, status: row.status, price: row.list_price, currency: row.currency }));
  empty.leads = leadRows.map((row) => {
    agencies.add(row.organization_id);
    const contact = contacts.get(row.contact_id);
    return { id: row.id, client: nameOf(contact), phone: contact?.phone ?? '—', email: contact?.email ?? '—', project: projectById.get(row.project_id ?? -1)?.name ?? '—', agency: orgNames.get(row.organization_id) ?? '—', agent: agentName(row.reported_by_membership_id), reportedAt: row.created_at, expiresAt: row.protected_until, status: row.protection_status };
  });
  const linkByOpportunity = new Map<number, number[]>();
  for (const link of links) linkByOpportunity.set(link.opportunity_id, [...(linkByOpportunity.get(link.opportunity_id) ?? []), link.project_id]);
  const unitByOpportunity = new Map<number, string[]>();
  for (const link of opportunityUnits ?? []) {
    const unit = unitById.get(link.unit_id);
    if (unit && ids.includes(unit.project_id)) {
      unitByOpportunity.set(link.opportunity_id, [...(unitByOpportunity.get(link.opportunity_id) ?? []), unit.unit_code]);
      if (!(linkByOpportunity.get(link.opportunity_id) ?? []).includes(unit.project_id)) linkByOpportunity.set(link.opportunity_id, [...(linkByOpportunity.get(link.opportunity_id) ?? []), unit.project_id]);
    }
  }
  empty.negotiations = opportunities.flatMap((row) => {
    const linkedProjects = linkByOpportunity.get(row.id) ?? [];
    if (!linkedProjects.length) return [];
    agencies.add(row.organization_id);
    empty.stageCounts[row.stage] = (empty.stageCounts[row.stage] ?? 0) + 1;
    return [{ id: row.id, project: linkedProjects.map((id) => projectById.get(id)?.name).filter(Boolean).join(', '), agency: orgNames.get(row.organization_id) ?? '—', agent: agentName(row.owner_membership_id), unit: (unitByOpportunity.get(row.id) ?? []).join(', ') || '—', stage: row.stage, updatedAt: row.updated_at }];
  });
  empty.proposals = (proposalRows ?? []).flatMap((row) => {
    const snapshot = proposalSnapshots.get(row.id);
    if (!snapshot) return [];
    const scopedItems = snapshot.items.filter((item) => ids.includes(Number(item.property_id)) || (item.project_slug && projectBySlug.has(item.project_slug)));
    const relatedProjects = [...new Set(scopedItems.map((item) => projectById.get(Number(item.property_id))?.name ?? projectBySlug.get(item.project_slug ?? '')?.name).filter((value): value is string => Boolean(value)))];
    if (!relatedProjects.length && snapshot.projectSlug && projectBySlug.has(snapshot.projectSlug)) relatedProjects.push(projectBySlug.get(snapshot.projectSlug)!.name);
    if (!relatedProjects.length) return [];
    agencies.add(row.organization_id);
    return [{ id: row.id, project: relatedProjects.join(', '), agency: orgNames.get(row.organization_id) ?? '—', author: agentName(row.author_membership_id), client: row.contact_id && contacts.has(row.contact_id) ? nameOf(contacts.get(row.contact_id)) : snapshot.clientName ?? '—', units: scopedItems.map((item) => item.unit_name).filter(Boolean).join(', ') || '—', status: row.status, createdAt: row.created_at }];
  });
  empty.salesCount = sales.length;
  for (const sale of sales) {
    empty.salesVolumeByCurrency[sale.currency] = (empty.salesVolumeByCurrency[sale.currency] ?? 0) + sale.sale_price;
    const projectId = unitById.get(sale.unit_id)?.project_id;
    if (!projectId) continue;
    const summary = empty.salesByProject[projectId] ?? { count: 0, volumeByCurrency: {} };
    summary.count++;
    summary.volumeByCurrency[sale.currency] = (summary.volumeByCurrency[sale.currency] ?? 0) + sale.sale_price;
    empty.salesByProject[projectId] = summary;
  }
  for (const claim of claimsResult.data ?? []) {
    empty.commissionCounts[claim.status] = (empty.commissionCounts[claim.status] ?? 0) + 1;
    empty.commissionCountsByProject[claim.project_id] ??= {};
    empty.commissionCountsByProject[claim.project_id][claim.status] = (empty.commissionCountsByProject[claim.project_id][claim.status] ?? 0) + 1;
  }
  empty.activeAgencies = agencies.size;
  empty.lastLeadAt = leadRows[0]?.created_at ?? null;
  return empty;
}
