import { createAdminClient } from '@/lib/supabase/admin';
import type { SupabaseClient } from '@supabase/supabase-js';

export type DeveloperOpsSnapshot = {
  generatedAt: string;
  system: {
    version: string;
    environment: string;
    commit: string;
  };
  totals: {
    users: number;
    organizations: number;
    agencies: number;
    developers: number;
    projects: number;
    publishedProjects: number;
    activeSessions: number;
    eventsLast24Hours: number;
    auditEventsLast24Hours: number;
    pendingInvitations: number;
    openCommissionClaims: number;
    resources: number;
    incidentsLast7Days: number;
  };
  organizations: Array<{
    id: number;
    name: string;
    slug: string;
    kind: string;
    status: string;
    users: number;
    projects: number;
  }>;
  projectActivity: Array<{ name: string; events: number; activeSessions: number }>;
  recentActivity: Array<{
    action: string;
    entityType: string;
    occurredAt: string;
  }>;
  leadConflicts: Array<{
    id: number;
    contactId: number;
    contactName: string;
    contactReference: string;
    agencyName: string;
    agentName: string;
    createdAt: string;
  }>;
  inventoryChanges: Array<{
    projectName: string;
    unitCode: string;
    kind: string;
    source: string;
    occurredAt: string;
    status: string;
    changes: Array<{ label: string; oldValue: string; newValue: string }>;
  }>;
};

const VERSION = '1.0.0';

function since(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function isIncident(value: string) {
  return /error|fail|rejected|blocked|suspend|ban|incident/i.test(value);
}

export async function getDeveloperOpsSnapshot(): Promise<DeveloperOpsSnapshot> {
  // This query is only called after the page has verified super_admin access.
  // The ungenerated tables are read through the server-only admin client and
  // never passed to the browser as raw rows.
  const db = createAdminClient() as unknown as SupabaseClient;
  const dayAgo = since(24);
  const weekAgo = since(24 * 7);
  const fiveMinutesAgo = since(5 / 60);

  const [orgsResult, membershipsResult, projectsResult, eventsResult, auditResult, invitationsResult, claimsResult, resourcesResult, presenceResult, conflictsResult, profilesResult, inventoryRunsResult] = await Promise.all([
    db.from('organizations').select('id, name, slug, kind, status').eq('status', 'active'),
    db.from('memberships').select('user_id, organization_id, status').neq('status', 'revoked'),
    db.from('projects').select('id, name, organization_id, publication_status'),
    db.from('engagement_events').select('event_type, metadata, occurred_at').gte('occurred_at', weekAgo).limit(5000),
    db.from('audit_events').select('action, entity_type, occurred_at').gte('occurred_at', weekAgo).order('occurred_at', { ascending: false }).limit(100),
    db.from('invitations').select('status').in('status', ['pending', 'sent']),
    db.from('commission_claims').select('status').not('status', 'in', '(paid,rejected,cancelled)'),
    db.from('project_documents').select('id'),
    db.from('presence_sessions').select('session_key, surface, project_id, last_seen_at').gte('last_seen_at', fiveMinutesAgo).is('ended_at', null),
    db.from('lead_reports').select('id, contact_id, created_at, organization:organizations(name), contact:contacts(first_name, last_name, public_code), agent:memberships(user_id)').in('protection_status', ['pending', 'conflict']).order('created_at', { ascending: true }).limit(50),
    db.from('profiles').select('user_id, display_name'),
    db.from('inventory_sync_runs').select('project_id, status, started_at, diff_summary, connection:integration_connections(display_name, provider)').order('started_at', { ascending: false }).limit(80),
  ]);

  const organizations = (orgsResult.data ?? []) as Array<{ id: number; name: string; slug: string; kind: string; status: string }>;
  const memberships = (membershipsResult.data ?? []) as Array<{ user_id: string; organization_id: number; status: string }>;
  const projects = (projectsResult.data ?? []) as Array<{ id: number; name: string; organization_id: number; publication_status: string }>;
  const events = (eventsResult.data ?? []) as Array<{ event_type: string; metadata: unknown; occurred_at: string }>;
  const auditEvents = (auditResult.data ?? []) as Array<{ action: string; entity_type: string; occurred_at: string }>;
  const presence = (presenceResult.data ?? []) as Array<{ session_key: string; surface: string; project_id: number | null; last_seen_at: string }>;
  const conflicts = (conflictsResult.data ?? []) as unknown as Array<{
    id: number;
    contact_id: number;
    created_at: string;
    organization: { name: string }[];
    contact: { first_name: string; last_name: string | null; public_code: string }[];
    agent: { user_id: string }[];
  }>;
  const profileNames = new Map(
    ((profilesResult.data ?? []) as Array<{ user_id: string; display_name: string | null }>).map((profile) => [profile.user_id, profile.display_name])
  );
  const projectNames = new Map(projects.map((project) => [project.id, project.name]));
  const inventoryRuns = (inventoryRunsResult.data ?? []) as unknown as Array<{
    project_id: number;
    status: string;
    started_at: string;
    diff_summary: { diffsSummarySample?: Array<{ unitCode?: string; kind?: string; differences?: Array<{ label?: string; oldValue?: unknown; newValue?: unknown }> }> } | null;
    connection: { display_name?: string; provider?: string } | { display_name?: string; provider?: string }[] | null;
  }>;
  const inventoryChanges = inventoryRuns.flatMap((run) => {
    const connection = Array.isArray(run.connection) ? run.connection[0] : run.connection;
    return (run.diff_summary?.diffsSummarySample || []).map((diff) => ({
      projectName: projectNames.get(run.project_id) || `Proyecto #${run.project_id}`,
      unitCode: diff.unitCode || 'Unidad sin código',
      kind: diff.kind || 'actualización',
      source: connection?.display_name || connection?.provider || 'Actualización externa',
      occurredAt: run.started_at,
      status: run.status,
      changes: (diff.differences || []).map((change) => ({
        label: change.label || 'Dato',
        oldValue: String(change.oldValue ?? 'Sin dato'),
        newValue: String(change.newValue ?? 'Sin dato'),
      })),
    }));
  }).slice(0, 40);

  const activeMemberships = memberships.filter((membership) => membership.status === 'active');
  const uniqueUsers = new Set(activeMemberships.map((membership) => membership.user_id));
  const eventsLast24Hours = events.filter((event) => event.occurred_at >= dayAgo);
  const auditEventsLast24Hours = auditEvents.filter((event) => event.occurred_at >= dayAgo);
  const incidentsLast7Days = auditEvents.filter((event) => isIncident(`${event.action} ${event.entity_type}`)).length;
  const projectEvents = new Map<number, number>();
  const projectSessions = new Map<number, Set<string>>();

  for (const session of presence) {
    if (session.project_id) {
      if (!projectSessions.has(session.project_id)) projectSessions.set(session.project_id, new Set());
      projectSessions.get(session.project_id)!.add(session.session_key);
    }
  }

  for (const event of events) {
    const metadata = event.metadata as { projectId?: number } | null;
    if (metadata?.projectId) {
      projectEvents.set(metadata.projectId, (projectEvents.get(metadata.projectId) ?? 0) + 1);
    }
  }

  const organizationsWithCounts = organizations
    .filter((organization) => ['master_broker', 'agency', 'developer'].includes(organization.kind))
    .map((organization) => ({
      ...organization,
      users: new Set(
        activeMemberships
          .filter((membership) => membership.organization_id === organization.id)
          .map((membership) => membership.user_id)
      ).size,
      projects: projects.filter(
        (project) => project.organization_id === organization.id
      ).length,
    }))
    .sort((a, b) => b.projects - a.projects || b.users - a.users || a.name.localeCompare(b.name, 'es'));

  return {
    generatedAt: new Date().toISOString(),
    system: {
      version: VERSION,
      environment: process.env.APP_ENV || process.env.NODE_ENV || 'local',
      commit: process.env.APP_COMMIT_SHA?.slice(0, 8) || 'local',
    },
    totals: {
      users: uniqueUsers.size,
      organizations: organizationsWithCounts.length,
      agencies: organizationsWithCounts.filter((organization) => organization.kind === 'agency').length,
      developers: organizationsWithCounts.filter((organization) => organization.kind === 'developer').length,
      projects: projects.length,
      publishedProjects: projects.filter((project) => project.publication_status === 'published').length,
      activeSessions: new Set(presence.map((session) => session.session_key)).size,
      eventsLast24Hours: eventsLast24Hours.length,
      auditEventsLast24Hours: auditEventsLast24Hours.length,
      pendingInvitations: invitationsResult.data?.length ?? 0,
      openCommissionClaims: claimsResult.data?.length ?? 0,
      resources: resourcesResult.data?.length ?? 0,
      incidentsLast7Days,
    },
    organizations: organizationsWithCounts,
    projectActivity: projects
      .map((project) => ({
        name: project.name,
        events: projectEvents.get(project.id) ?? 0,
        activeSessions: projectSessions.get(project.id)?.size ?? 0,
      }))
      .sort((a, b) => b.events - a.events || a.name.localeCompare(b.name, 'es'))
      .slice(0, 6),
    recentActivity: auditEvents.slice(0, 8).map((event) => ({
      action: event.action,
      entityType: event.entity_type,
      occurredAt: event.occurred_at,
    })),
    leadConflicts: conflicts.map((conflict) => {
      const organization = conflict.organization[0];
      const contact = conflict.contact[0];
      const agent = conflict.agent[0];
      return {
        id: conflict.id,
        contactId: conflict.contact_id,
        contactName: `${contact?.first_name || 'Cliente'} ${contact?.last_name || ''}`.trim(),
        contactReference: contact?.public_code || `Contacto #${conflict.contact_id}`,
        agencyName: organization?.name || 'Agencia no disponible',
        agentName: agent?.user_id ? profileNames.get(agent.user_id) || 'Agente no disponible' : 'Agente no disponible',
        createdAt: conflict.created_at,
      };
    }),
    inventoryChanges,
  };
}
