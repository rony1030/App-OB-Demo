import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth/get-user';

// ── General (Platform-wide) ──

export type GeneralAnalytics = {
  kpis: {
    totalProposals: number;
    totalLeads: number;
    activeNegotiations: number;
    totalDossiers: number;
    totalSharedLinkViews: number;
    totalReservations: number;
  };
  engagementTrend: { date: string; eventType: string; count: number }[];
  topProjects: { projectId: number; projectName: string; totalEvents: number }[];
  toolUsage: { tool: string; label: string; count: number }[];
  conversionFunnel: {
    leads: number;
    opportunities: number;
    proposals: number;
    reservations: number;
    sales: number;
  };
};

// ── Detailed (Per-agency) ──

export type AgencyAnalyticsCard = {
  organizationId: number;
  organizationName: string;
  slug: string;
  initials: string;
  activeUsers: number;
  metrics: {
    proposalsCreated: number;
    leadsRegistered: number;
    activeNegotiations: number;
    dossiersSent: number;
    sharedLinksCreated: number;
    sharedLinkViews: number;
    reservationsMade: number;
  };
  recentEventCount: number;
  activityLevel: 'active' | 'moderate' | 'inactive';
  lastActivityAt: string | null;
};

export type DetailedAnalytics = {
  agencies: AgencyAnalyticsCard[];
};

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function classifyActivity(recentEventCount: number): 'active' | 'moderate' | 'inactive' {
  if (recentEventCount >= 20) return 'active';
  if (recentEventCount >= 5) return 'moderate';
  return 'inactive';
}

async function getAuthedClient() {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('No autenticado');
  const sessionClient = await createClient();
  const isSuper = currentUser.role === 'super_admin';
  let supabase = sessionClient;
  if (isSuper && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabase = createAdminClient();
  }
  return { supabase, currentUser, isSuper };
}

export async function getGeneralAnalytics(scopeOrgId?: number): Promise<GeneralAnalytics> {
  const { supabase } = await getAuthedClient();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  // KPI counts — all in parallel
  const buildQuery = (table: 'presentations' | 'contacts' | 'opportunities' | 'reservation_requests', filters?: Record<string, string | number | boolean | string[]>) => {
    let q = (supabase).from(table).select('*', { count: 'exact', head: true });
    if (filters) {
      for (const [key, val] of Object.entries(filters)) {
        if (Array.isArray(val)) q = q.in(key, val);
        else q = q.eq(key, val);
      }
    }
    if (scopeOrgId) q = q.eq('organization_id', scopeOrgId);
    return q;
  };

  const [
    { count: totalProposals },
    { count: totalLeads },
    { count: activeNegotiations },
    { count: totalDossiers },
    { data: linkViewsData },
    { count: totalReservations },
    { data: recentEvents },
    { data: projectRows },
    { count: opportunitiesCount },
    { count: proposalStageCount },
    { count: salesCount },
    { count: crmActivityCount },
    { count: inventoryEventCount },
    { count: sharedLinksCount },
  ] = await Promise.all([
    buildQuery('presentations', { kind: 'proposal' }),
    buildQuery('contacts'),
    buildQuery('opportunities', { stage: ['proposal', 'negotiation', 'reservation'] }),
    buildQuery('presentations', { kind: 'dossier' }),
    (() => {
      const q = supabase.from('shared_links').select('views_count');
      return q;
    })(),
    buildQuery('reservation_requests'),
    // Engagement trend (30 days)
    (() => {
      let q = supabase
        .from('engagement_events')
        .select('event_type, occurred_at, metadata')
        .gte('occurred_at', thirtyDaysAgo)
        .order('occurred_at', { ascending: true })
        .limit(10000);
      if (scopeOrgId) q = q.eq('organization_id', scopeOrgId);
      return q;
    })(),
    // Projects for name lookup
    supabase.from('projects').select('id, name'),
    // Funnel counts
    buildQuery('opportunities'),
    buildQuery('opportunities', { stage: ['proposal', 'negotiation', 'reservation', 'won'] }),
    (() => {
      let q = supabase.from('sales').select('*', { count: 'exact', head: true });
      if (scopeOrgId) q = q.eq('organization_id', scopeOrgId);
      return q;
    })(),
    // Tool usage: CRM activity from audit_events (30d)
    (() => {
      let q = supabase
        .from('audit_events')
        .select('*', { count: 'exact', head: true })
        .in('entity_type', ['contacts', 'opportunities', 'activities', 'notes'])
        .gte('occurred_at', thirtyDaysAgo);
      if (scopeOrgId) q = q.eq('organization_id', scopeOrgId);
      return q;
    })(),
    // Inventory events
    (() => {
      let q = supabase
        .from('engagement_events')
        .select('*', { count: 'exact', head: true })
        .in('event_type', ['project_view', 'unit_view', 'inventory_filter'])
        .gte('occurred_at', thirtyDaysAgo);
      if (scopeOrgId) q = q.eq('organization_id', scopeOrgId);
      return q;
    })(),
    // Shared links total
    (() => {
      const q = supabase.from('shared_links').select('*', { count: 'exact', head: true });
      return q;
    })(),
  ]);

  // Aggregate shared link views
  const totalSharedLinkViews = (linkViewsData ?? []).reduce(
    (sum: number, l: { views_count: number }) => sum + (l.views_count || 0),
    0
  );

  // Engagement trend: group by day + event_type
  const trendMap = new Map<string, number>();
  for (const e of recentEvents ?? []) {
    const day = (e.occurred_at as string).slice(0, 10);
    const key = `${day}|${e.event_type}`;
    trendMap.set(key, (trendMap.get(key) || 0) + 1);
  }
  const engagementTrend = Array.from(trendMap.entries()).map(([key, count]) => {
    const [date, eventType] = key.split('|');
    return { date, eventType, count };
  });

  // Top projects by event count
  const projectEventMap = new Map<number, number>();
  for (const e of recentEvents ?? []) {
    const meta = e.metadata as { projectId?: number } | null;
    if (meta?.projectId) {
      projectEventMap.set(meta.projectId, (projectEventMap.get(meta.projectId) || 0) + 1);
    }
  }
  const projectNameMap = new Map<number, string>();
  for (const p of projectRows ?? []) projectNameMap.set(p.id, p.name);

  const topProjects = Array.from(projectEventMap.entries())
    .map(([projectId, totalEvents]) => ({
      projectId,
      projectName: projectNameMap.get(projectId) ?? `Proyecto #${projectId}`,
      totalEvents,
    }))
    .sort((a, b) => b.totalEvents - a.totalEvents)
    .slice(0, 10);

  // Tool usage
  const toolUsage = [
    { tool: 'proposals', label: 'Propuestas', count: totalProposals ?? 0 },
    { tool: 'dossiers', label: 'Dossiers', count: totalDossiers ?? 0 },
    { tool: 'crm', label: 'CRM (contactos, oportunidades)', count: crmActivityCount ?? 0 },
    { tool: 'inventory', label: 'Consultas de inventario', count: inventoryEventCount ?? 0 },
    { tool: 'shared_links', label: 'Enlaces compartidos', count: sharedLinksCount ?? 0 },
  ].sort((a, b) => b.count - a.count);

  return {
    kpis: {
      totalProposals: totalProposals ?? 0,
      totalLeads: totalLeads ?? 0,
      activeNegotiations: activeNegotiations ?? 0,
      totalDossiers: totalDossiers ?? 0,
      totalSharedLinkViews,
      totalReservations: totalReservations ?? 0,
    },
    engagementTrend,
    topProjects,
    toolUsage,
    conversionFunnel: {
      leads: totalLeads ?? 0,
      opportunities: opportunitiesCount ?? 0,
      proposals: proposalStageCount ?? 0,
      reservations: totalReservations ?? 0,
      sales: salesCount ?? 0,
    },
  };
}

export async function getDetailedAnalytics(scopeOrgId?: number): Promise<DetailedAnalytics> {
  const { supabase } = await getAuthedClient();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  // Fetch all active broker/agency orgs with memberships
  let orgsQuery = supabase
    .from('organizations')
    .select('id, name, slug, kind, memberships(id, status)')
    .eq('status', 'active')
    .in('kind', ['master_broker', 'agency']);
  if (scopeOrgId) orgsQuery = orgsQuery.eq('id', scopeOrgId);

  const [
    { data: orgs },
    { data: allPresentations },
    { data: allContacts },
    { data: allOpportunities },
    { data: allReservationReqs },
    { data: allSharedLinks },
    { data: allEngagement },
  ] = await Promise.all([
    orgsQuery,
    supabase.from('presentations').select('organization_id, kind'),
    supabase.from('contacts').select('organization_id'),
    supabase.from('opportunities').select('organization_id, stage'),
    supabase.from('reservation_requests').select('organization_id'),
    supabase.from('shared_links').select('views_count, presentation_versions!inner(presentations!inner(organization_id))'),
    (() => {
      let q = supabase
        .from('engagement_events')
        .select('organization_id, event_type, occurred_at')
        .gte('occurred_at', thirtyDaysAgo)
        .limit(10000);
      if (scopeOrgId) q = q.eq('organization_id', scopeOrgId);
      return q;
    })(),
  ]);

  // Build per-org lookup maps
  function groupBy<T>(rows: T[], key: keyof T): Map<number, T[]> {
    const map = new Map<number, T[]>();
    for (const row of rows) {
      const id = row[key] as unknown as number;
      if (!map.has(id)) map.set(id, []);
      map.get(id)!.push(row);
    }
    return map;
  }

  const presentationsByOrg = groupBy(allPresentations ?? [], 'organization_id');
  const contactsByOrg = groupBy(allContacts ?? [], 'organization_id');
  const opportunitiesByOrg = groupBy(allOpportunities ?? [], 'organization_id');
  const reservationsByOrg = groupBy(allReservationReqs ?? [], 'organization_id');
  const engagementByOrg = groupBy(allEngagement ?? [], 'organization_id');

  // Shared links need special handling — nested join
  const sharedLinksByOrg = new Map<number, { count: number; views: number }>();
  for (const sl of allSharedLinks ?? []) {
    const orgId = (sl).presentation_versions?.presentations?.organization_id as number | undefined;
    if (!orgId) continue;
    const entry = sharedLinksByOrg.get(orgId) ?? { count: 0, views: 0 };
    entry.count++;
    entry.views += (sl.views_count ?? 0);
    sharedLinksByOrg.set(orgId, entry);
  }

  const agencies: AgencyAnalyticsCard[] = (orgs ?? []).map((org) => {
    const activeUsers = (org.memberships ?? []).filter((m) => m.status === 'active').length;
    const presentations = presentationsByOrg.get(org.id) ?? [];
    const contacts = contactsByOrg.get(org.id) ?? [];
    const opportunities = opportunitiesByOrg.get(org.id) ?? [];
    const reservations = reservationsByOrg.get(org.id) ?? [];
    const engagement = engagementByOrg.get(org.id) ?? [];
    const slData = sharedLinksByOrg.get(org.id) ?? { count: 0, views: 0 };

    const proposalsCreated = presentations.filter((p) => p.kind === 'proposal').length;
    const dossiersSent = presentations.filter((p) => p.kind === 'dossier').length;
    const activeNeg = opportunities.filter((o) =>
      ['proposal', 'negotiation', 'reservation'].includes(o.stage)
    ).length;

    const recentEventCount = engagement.length;
    const lastEvent = engagement.length > 0
      ? engagement.reduce((latest, e) =>
          e.occurred_at > latest.occurred_at ? e : latest
        )
      : null;

    return {
      organizationId: org.id,
      organizationName: org.name,
      slug: org.slug,
      initials: getInitials(org.name),
      activeUsers,
      metrics: {
        proposalsCreated,
        leadsRegistered: contacts.length,
        activeNegotiations: activeNeg,
        dossiersSent,
        sharedLinksCreated: slData.count,
        sharedLinkViews: slData.views,
        reservationsMade: reservations.length,
      },
      recentEventCount,
      activityLevel: classifyActivity(recentEventCount),
      lastActivityAt: lastEvent?.occurred_at ?? null,
    };
  });

  agencies.sort((a, b) => b.recentEventCount - a.recentEventCount);

  return { agencies };
}
