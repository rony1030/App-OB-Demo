import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import { getMyAgreements } from '@/lib/data/agreements';


export type ContactSummary = {
  id: number;
  firstName: string;
  lastName: string | null;
  fullName: string;
  email: string | null;
  phone: string;
  publicCode: string;
  phoneNormalized: string | null;
  phoneLast4: string | null;
  country: string | null;
  preferredLanguage: string;
  classification: string | null;
  source: string | null;
  createdAt: string;
  updatedAt: string;
  tags: { id: number; name: string; color: string | null }[];
  primaryOpportunity?: {
    id: number;
    publicCode: string;
    stage: string;
    priority: string | null;
    budgetMin: number | null;
    budgetMax: number | null;
    currency: string;
    projectName?: string;
  };
  dnd: {
    email: boolean;
    whatsapp: boolean;
    calls: boolean;
    sms: boolean;
  };
};

export type ContactDetail = ContactSummary & {
  notes: {
    id: number;
    body: string;
    createdAt: string;
    createdByName?: string;
  }[];
  activities: {
    id: number;
    kind: 'call' | 'email' | 'whatsapp' | 'meeting' | 'visit' | 'task' | 'system';
    subject: string;
    details: string | null;
    dueAt: string | null;
    completedAt: string | null;
    createdAt: string;
  }[];
  opportunities: {
    id: number;
    publicCode: string;
    stage: string;
    priority: string | null;
    budgetMin: number | null;
    budgetMax: number | null;
    currency: string;
    objective: string | null;
    nextFollowUpAt: string | null;
    closedReason: string | null;
    projects: { id: number; name: string; slug: string }[];
    units: { id: number; unitNumber: string; price: number }[];
  }[];
  customFields: Record<string, string | number | boolean>;
};

export type LeadReportTarget = { projectId: number; projectName: string; developerName: string; agreementId: number };
export type ContactLeadReport = { id: number; publicCode: string; projectName: string; developerName: string; status: string; protectedUntil: string | null; createdAt: string; reviewReason: string | null };
export type ClientDocument = { id: number; publicCode: string; documentType: string; title: string; fileName: string; mimeType: string; sizeBytes: number; createdAt: string };

export async function getContacts(): Promise<ContactSummary[]> {
  const supabase = await createClient();
  const currentUser = await getCurrentUser(supabase);
  if (!currentUser) return [];

  let contactsQuery = supabase
    .from('contacts')
    .select(`
      id,
      first_name,
      last_name,
      email,
      phone,
      public_code,
      phone_normalized,
      phone_last4,
      country,
      preferred_language,
      classification,
      source,
      created_at,
      updated_at,
      contact_tags (
        tag:tags (
          id,
          name,
          color
        )
      ),
      consent_preferences (
        channel,
        status
      ),
      opportunities (
        id,
        public_code,
        stage,
        priority,
        budget_min,
        budget_max,
        currency,
        opportunity_projects (
          project:projects (
            id,
            name
          )
        )
      )
    `)
    .eq('organization_id', currentUser.organization.id)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  // Brokers must never see contacts created by another broker. Organization
  // administrators may see their agency's contacts, but never another org's.
  if (currentUser.role === 'broker_agent') {
    contactsQuery = contactsQuery.eq('created_by', currentUser.id);
  }

  const { data: contacts, error } = await contactsQuery;

  if (error || !contacts) {
    return [];
  }

  return contacts.map((c) => {
    const rawTags = (c.contact_tags || []) as unknown as { tag: { id: number; name: string; color: string | null } }[];
    const tags = rawTags.map((rt) => rt.tag).filter(Boolean);

    const consentList = (c.consent_preferences || []) as { channel: string; status: string }[];
    const dnd = {
      email: consentList.some((p) => p.channel === 'email' && p.status === 'denied'),
      whatsapp: consentList.some((p) => p.channel === 'whatsapp' && p.status === 'denied'),
      calls: consentList.some((p) => p.channel === 'call' && p.status === 'denied'),
      sms: consentList.some((p) => p.channel === 'sms' && p.status === 'denied'),
    };

    const rawOpps = (c.opportunities || []) as unknown as {
      id: number;
      public_code: string;
      stage: string;
      priority: string | null;
      budget_min: number | null;
      budget_max: number | null;
      currency: string;
      opportunity_projects: { project: { id: number; name: string } }[];
    }[];

    const firstOpp = rawOpps[0];
    const projectName = firstOpp?.opportunity_projects?.[0]?.project?.name;

    return {
      id: c.id,
      firstName: c.first_name,
      lastName: c.last_name,
      fullName: `${c.first_name} ${c.last_name || ''}`.trim(),
      email: c.email,
      phone: c.phone,
      publicCode: c.public_code,
      phoneNormalized: c.phone_normalized,
      phoneLast4: c.phone_last4,
      country: c.country,
      preferredLanguage: c.preferred_language,
      classification: c.classification,
      source: c.source,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      tags,
      dnd,
      primaryOpportunity: firstOpp
        ? {
            id: firstOpp.id,
            publicCode: firstOpp.public_code,
            stage: firstOpp.stage,
            priority: firstOpp.priority,
            budgetMin: firstOpp.budget_min ? Number(firstOpp.budget_min) : null,
            budgetMax: firstOpp.budget_max ? Number(firstOpp.budget_max) : null,
            currency: firstOpp.currency,
            projectName,
          }
        : undefined,
    };
  });
}

export type DashboardStage = 'Nuevo' | 'Contactado' | 'Propuesta' | 'Negociación' | 'Reserva';

export type DashboardLead = {
  id: number;
  publicCode: string;
  name: string;
  email: string;
  project: string;
  value: number;
  stage: DashboardStage;
  initials: string;
  updatedAt: string;
};

export type CrmDashboardSummary = {
  activeClientsCount: number;
  pipelineTotalValue: number;
  stageCounts: Record<DashboardStage, number>;
  stageValues: Record<DashboardStage, number>;
  recentLeads: DashboardLead[];
  wonThisMonthCount: number;
  totalClosedThisMonthCount: number;
};

const STAGE_MAP: Record<string, DashboardStage> = {
  new: 'Nuevo',
  contacted: 'Contactado',
  qualified: 'Contactado',
  proposal: 'Propuesta',
  negotiation: 'Negociación',
  reservation: 'Reserva',
};

const EMPTY_STAGE_RECORD: Record<DashboardStage, number> = {
  Nuevo: 0, Contactado: 0, Propuesta: 0, Negociación: 0, Reserva: 0,
};

export async function getCrmDashboardSummary(): Promise<CrmDashboardSummary> {
  const supabase = await createClient();
  const currentUser = await getCurrentUser(supabase);
  if (!currentUser) {
    return {
      activeClientsCount: 0,
      pipelineTotalValue: 0,
      stageCounts: { ...EMPTY_STAGE_RECORD },
      stageValues: { ...EMPTY_STAGE_RECORD },
      recentLeads: [],
      wonThisMonthCount: 0,
      totalClosedThisMonthCount: 0,
    };
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  let contactsQuery = supabase
    .from('contacts')
    .select(`
      id, public_code, first_name, last_name, email, updated_at,
      opportunities (
        id, stage, budget_min, budget_max, currency, updated_at,
        opportunity_projects ( project:projects ( name ) )
      )
    `)
    .eq('organization_id', currentUser.organization.id)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(40);

  if (currentUser.role === 'broker_agent') {
    contactsQuery = contactsQuery.eq('created_by', currentUser.id);
  }

  const { data: contacts } = await contactsQuery;

  type Row = {
    id: number; public_code: string; first_name: string; last_name: string | null; email: string | null; updated_at: string;
    opportunities: {
      id: number; stage: string; budget_min: number | null; budget_max: number | null; currency: string; updated_at: string;
      opportunity_projects: { project: { name: string } | null }[];
    }[];
  };

  const rows = (contacts || []) as unknown as Row[];

  const stageCounts = { ...EMPTY_STAGE_RECORD };
  const stageValues = { ...EMPTY_STAGE_RECORD };
  let wonThisMonthCount = 0;
  let totalClosedThisMonthCount = 0;

  let oppsQuery = supabase
    .from('opportunities')
    .select('id, stage, budget_min, budget_max, updated_at')
    .eq('organization_id', currentUser.organization.id)
    .order('updated_at', { ascending: false });

  if (currentUser.role === 'broker_agent') {
    oppsQuery = oppsQuery.eq('owner_membership_id', currentUser.membershipId);
  }

  const { data: allOpps } = await oppsQuery;

  for (const opp of allOpps || []) {
    const value = ((opp.budget_min ?? 0) + (opp.budget_max ?? opp.budget_min ?? 0)) / 2;
    const bucket = STAGE_MAP[opp.stage];
    if (bucket) {
      stageCounts[bucket] += 1;
      stageValues[bucket] += value;
    }
    if (['won', 'lost'].includes(opp.stage) && opp.updated_at >= monthStart) {
      totalClosedThisMonthCount += 1;
      if (opp.stage === 'won') wonThisMonthCount += 1;
    }
  }

  const recentLeads: DashboardLead[] = rows
    .filter((c) => c.opportunities.length > 0)
    .slice(0, 8)
    .map((c) => {
      const opp = [...c.opportunities].sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0];
      const value = ((opp.budget_min ?? 0) + (opp.budget_max ?? opp.budget_min ?? 0)) / 2;
      const fullName = `${c.first_name} ${c.last_name || ''}`.trim();
      return {
        id: c.id,
        publicCode: c.public_code,
        name: fullName,
        email: c.email || '',
        project: opp.opportunity_projects?.[0]?.project?.name || 'Sin proyecto asignado',
        value,
        stage: STAGE_MAP[opp.stage] || 'Nuevo',
        initials: fullName.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() || '??',
        updatedAt: c.updated_at,
      };
    });

  let countQuery = supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', currentUser.organization.id)
    .is('deleted_at', null);

  if (currentUser.role === 'broker_agent') {
    countQuery = countQuery.eq('created_by', currentUser.id);
  }

  const { count: activeClientsCount } = await countQuery;

  const pipelineTotalValue = Object.values(stageValues).reduce((sum, v) => sum + v, 0);

  return {
    activeClientsCount: activeClientsCount || 0,
    pipelineTotalValue,
    stageCounts,
    stageValues,
    recentLeads,
    wonThisMonthCount,
    totalClosedThisMonthCount,
  };
}

export type TodayActivity = {
  id: number;
  kind: string;
  subject: string;
  dueAt: string | null;
  contactName: string | null;
};

export async function getMyPendingActivities(): Promise<TodayActivity[]> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return [];

  const supabase = await createClient();
  const { data } = await (supabase)
    .from('activities')
    .select('id, kind, subject, due_at, contact:contacts(first_name, last_name)')
    .eq('created_by', currentUser.id)
    .is('completed_at', null)
    .order('due_at', { ascending: true, nullsFirst: false })
    .limit(6);

  type Row = { id: number; kind: string; subject: string; due_at: string | null; contact: { first_name: string; last_name: string | null } | null };
  return ((data || []) as unknown as Row[]).map((a) => ({
    id: a.id,
    kind: a.kind,
    subject: a.subject,
    dueAt: a.due_at,
    contactName: a.contact ? `${a.contact.first_name} ${a.contact.last_name || ''}`.trim() : null,
  }));
}

export async function getContactByCode(code: string): Promise<(ContactDetail & { organizationId: number }) | null> {
  const supabase = await createClient();
  const currentUser = await getCurrentUser(supabase);
  if (!currentUser) return null;

  const { data } = await supabase
    .from('contacts')
    .select('id, organization_id')
    .eq('public_code', code)
    .eq('organization_id', currentUser.organization.id)
    .is('deleted_at', null)
    .maybeSingle();
  if (!data) return null;
  const detail = await getContactById(data.id);
  if (!detail) return null;
  return { ...detail, organizationId: data.organization_id };
}

export async function getContactById(id: number): Promise<ContactDetail | null> {
  const supabase = await createClient();
  const currentUser = await getCurrentUser(supabase);
  if (!currentUser) return null;

  let query = supabase
    .from('contacts')
    .select(`
      id,
      first_name,
      last_name,
      email,
      phone,
      public_code,
      phone_normalized,
      phone_last4,
      country,
      preferred_language,
      classification,
      source,
      created_at,
      updated_at
    `)
    .eq('id', id)
    .eq('organization_id', currentUser.organization.id)
    .is('deleted_at', null);

  if (currentUser.role === 'broker_agent') {
    query = query.eq('created_by', currentUser.id);
  }

  const { data: contact, error } = await query.maybeSingle();

  if (error || !contact) {
    return null;
  }

  const [tagsResult, consentResult, notesResult, activitiesResult, opportunitiesResult] = await Promise.all([
    supabase.from('contact_tags').select('tag:tags(id, name, color)').eq('contact_id', id),
    supabase.from('consent_preferences').select('channel, status').eq('contact_id', id),
    supabase.from('notes').select('id, body, created_at').eq('contact_id', id).order('created_at', { ascending: false }),
    supabase.from('activities').select('id, kind, subject, details, due_at, completed_at, created_at').eq('contact_id', id).order('created_at', { ascending: false }),
    supabase.from('opportunities').select('id, public_code, stage, priority, budget_min, budget_max, currency, objective, next_follow_up_at, closed_reason').eq('contact_id', id),
  ]);

  const c = {
    ...contact,
    contact_tags: tagsResult.data || [],
    consent_preferences: consentResult.data || [],
    notes: notesResult.data || [],
    activities: activitiesResult.data || [],
    opportunities: opportunitiesResult.data || [],
  };

  const rawTags = (c.contact_tags || []) as unknown as { tag: { id: number; name: string; color: string | null } }[];
  const tags = rawTags.map((rt) => rt.tag).filter(Boolean);

  const consentList = (c.consent_preferences || []) as { channel: string; status: string }[];
  const dnd = {
    email: consentList.some((p) => p.channel === 'email' && p.status === 'denied'),
    whatsapp: consentList.some((p) => p.channel === 'whatsapp' && p.status === 'denied'),
    calls: consentList.some((p) => p.channel === 'call' && p.status === 'denied'),
    sms: consentList.some((p) => p.channel === 'sms' && p.status === 'denied'),
  };

  const rawNotes = (c.notes || []) as { id: number; body: string; created_at: string }[];
  const rawActivities = (c.activities || []) as {
    id: number;
    kind: 'call' | 'email' | 'whatsapp' | 'meeting' | 'visit' | 'task' | 'system';
    subject: string;
    details: string | null;
    due_at: string | null;
    completed_at: string | null;
    created_at: string;
  }[];

  const baseOpportunities = (c.opportunities || []) as unknown as {
    id: number;
    public_code: string;
    stage: string;
    priority: string | null;
    budget_min: number | null;
    budget_max: number | null;
    currency: string;
    objective: string | null;
    next_follow_up_at: string | null;
    closed_reason: string | null;
  }[];

  const opportunityIds = baseOpportunities.map((opportunity) => opportunity.id);
  const [projectRowsResult, unitRowsResult] = opportunityIds.length
    ? await Promise.all([
        supabase.from('opportunity_projects').select('opportunity_id, project:projects(id, name, slug)').in('opportunity_id', opportunityIds),
        supabase.from('opportunity_units').select('opportunity_id, unit:units(id, unit_code, list_price)').in('opportunity_id', opportunityIds),
      ])
    : [{ data: [] }, { data: [] }];

  const projectsByOpportunity = new Map<number, { id: number; name: string; slug: string }[]>();
  for (const row of projectRowsResult.data || []) {
    const project = row.project as unknown as { id: number; name: string; slug: string } | null;
    if (project) projectsByOpportunity.set(row.opportunity_id, [...(projectsByOpportunity.get(row.opportunity_id) || []), project]);
  }
  const unitsByOpportunity = new Map<number, { id: number; unitNumber: string; price: number }[]>();
  for (const row of unitRowsResult.data || []) {
    const unit = row.unit as unknown as { id: number; unit_code: string; list_price: number } | null;
    if (unit) unitsByOpportunity.set(row.opportunity_id, [...(unitsByOpportunity.get(row.opportunity_id) || []), { id: unit.id, unitNumber: unit.unit_code, price: Number(unit.list_price) }]);
  }

  const opportunities = baseOpportunities.map((o) => ({
    id: o.id,
    publicCode: o.public_code,
    stage: o.stage,
    priority: o.priority,
    budgetMin: o.budget_min ? Number(o.budget_min) : null,
    budgetMax: o.budget_max ? Number(o.budget_max) : null,
    currency: o.currency,
    objective: o.objective,
    nextFollowUpAt: o.next_follow_up_at,
    closedReason: o.closed_reason,
    projects: projectsByOpportunity.get(o.id) || [],
    units: unitsByOpportunity.get(o.id) || [],
  }));

  const firstOpp = opportunities[0];

  return {
    id: c.id,
    firstName: c.first_name,
    lastName: c.last_name,
    fullName: `${c.first_name} ${c.last_name || ''}`.trim(),
    email: c.email,
    phone: c.phone,
    publicCode: c.public_code,
    phoneNormalized: c.phone_normalized,
    phoneLast4: c.phone_last4,
    country: c.country,
    preferredLanguage: c.preferred_language,
    classification: c.classification,
    source: c.source,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    tags,
    dnd,
    primaryOpportunity: firstOpp
      ? {
          id: firstOpp.id,
          publicCode: firstOpp.publicCode,
          stage: firstOpp.stage,
          priority: firstOpp.priority,
          budgetMin: firstOpp.budgetMin,
          budgetMax: firstOpp.budgetMax,
          currency: firstOpp.currency,
          projectName: firstOpp.projects[0]?.name,
        }
      : undefined,
    notes: rawNotes.map((n) => ({
      id: n.id,
      body: n.body,
      createdAt: n.created_at,
    })),
    activities: rawActivities.map((a) => ({
      id: a.id,
      kind: a.kind,
      subject: a.subject,
      details: a.details,
      dueAt: a.due_at,
      completedAt: a.completed_at,
      createdAt: a.created_at,
    })),
    opportunities,
    customFields: {},
  };
}

export async function getClientDocuments(contactId: number): Promise<ClientDocument[]> {
  const supabase = await createClient();
  // This table is introduced by a migration that can be newer than the
  // generated Supabase type snapshot used during deployment builds.
  const { data } = await (supabase)
    .from('client_documents')
    .select('id, public_code, document_type, title, file_name, mime_type, size_bytes, created_at')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false });
  return ((data || []) as unknown as Array<Record<string, unknown>>).map((row) => ({
    id: Number(row.id),
    publicCode: String(row.public_code || `DOC-${row.id}`),
    documentType: String(row.document_type),
    title: String(row.title),
    fileName: String(row.file_name),
    mimeType: String(row.mime_type),
    sizeBytes: Number(row.size_bytes),
    createdAt: String(row.created_at),
  }));
}

export async function getContactLeadReportingContext(contactId: number): Promise<{ targets: LeadReportTarget[]; reports: ContactLeadReport[] }> {
  const supabase = await createClient();
  const currentUser = await getCurrentUser(supabase);
  if (!currentUser) return { targets: [], reports: [] };
  const [agreements, reportsResult, projectAccessResult] = await Promise.all([
    getMyAgreements(),
    supabase.from('lead_reports').select('id, public_code, project_id, protection_status, protected_until, created_at, review_reason, project:projects(name, developer:organizations!projects_developer_organization_id_fkey(name))').eq('contact_id', contactId).order('created_at', { ascending: false }),
    supabase.from('project_access').select('project_id, project:projects(id, name, developer:organizations!projects_developer_organization_id_fkey(name))').eq('grantee_membership_id', currentUser.membershipId),
  ]);
  const activeAgreements = agreements.filter((agreement) => agreement.status === 'signed' && (!agreement.expiresAt || new Date(agreement.expiresAt).getTime() > Date.now()));
  const targets: LeadReportTarget[] = activeAgreements.flatMap((agreement) => agreement.project ? [{
    projectId: agreement.project.id,
    projectName: agreement.project.name,
    developerName: agreement.project.developer?.name || 'Desarrolladora',
    agreementId: agreement.id,
  }] : []);

  const generalMasterBrokerIds = Array.from(new Set(activeAgreements
    .filter((agreement) => agreement.kind === 'general')
    .map((agreement) => agreement.masterBrokerOrg.id)));
  if (generalMasterBrokerIds.length) {
    const { data: generalProjects } = await supabase
      .from('projects')
      .select('id, name, developer:organizations!projects_developer_organization_id_fkey(name), organization_id')
      .in('organization_id', generalMasterBrokerIds);
    for (const project of (generalProjects || [])) {
      if (!targets.some((target) => target.projectId === project.id)) {
        targets.push({
          projectId: project.id,
          projectName: project.name,
          developerName: project.developer?.name || 'Desarrolladora',
          agreementId: activeAgreements.find((agreement) => agreement.kind === 'general' && agreement.masterBrokerOrg.id === project.organization_id)?.id || 0,
        });
      }
    }
  }

  type AccessRow = { project_id: number; project: { id: number; name: string; developer: { name: string } | null } | null };
  const accessRows = (projectAccessResult.data || []) as unknown as AccessRow[];
  for (const row of accessRows) {
    if (row.project && !targets.some((t) => t.projectId === row.project!.id)) {
      targets.push({
        projectId: row.project.id,
        projectName: row.project.name,
        developerName: row.project.developer?.name || 'Desarrolladora',
        agreementId: 0,
      });
    }
  }

  type ReportRow = { id: number; public_code: string; protection_status: string; protected_until: string | null; created_at: string; review_reason: string | null; project: { name: string; developer: { name: string } | null } | null };
  const reports = ((reportsResult.data || []) as unknown as ReportRow[]).map((report) => ({
    id: report.id,
    publicCode: report.public_code || `LEAD-${report.id}`,
    projectName: report.project?.name || 'Desarrollo sin nombre',
    developerName: report.project?.developer?.name || 'Desarrolladora',
    status: report.protection_status,
    protectedUntil: report.protected_until,
    createdAt: report.created_at,
    reviewReason: report.review_reason,
  }));
  return { targets, reports };
}

export type AccessibleProject = {
  id: number;
  name: string;
  slug: string;
  developerName: string;
};

export async function getAccessibleProjects(): Promise<AccessibleProject[]> {
  const supabase = await createClient();
  const currentUser = await getCurrentUser(supabase);
  if (!currentUser) return [];

  const [agreements, { data: accessRows }] = await Promise.all([
    getMyAgreements(),
    supabase
      .from('project_access')
      .select('project_id, project:projects(id, name, slug, developer:organizations!projects_developer_organization_id_fkey(name))')
      .eq('grantee_membership_id', currentUser.membershipId),
  ]);

  const projects = new Map<number, AccessibleProject>();

  const activeAgreements = agreements.filter((a) => a.status === 'signed' && (!a.expiresAt || new Date(a.expiresAt).getTime() > Date.now()));
  const generalMasterBrokerIds = activeAgreements
    .filter((agreement) => agreement.kind === 'general')
    .map((agreement) => agreement.masterBrokerOrg.id);

  // A general agreement grants the broker organization access to every
  // project published by that master broker. This mirrors the database RLS
  // rule and lets the agency and its members inherit the same catalog.
  if (generalMasterBrokerIds.length) {
    const { data: generalProjects } = await supabase
      .from('projects')
      .select('id, name, slug, organization_id, developer:organizations!projects_developer_organization_id_fkey(name)')
      .in('organization_id', Array.from(new Set(generalMasterBrokerIds)));
    for (const project of (generalProjects || [])) {
      if (!projects.has(project.id)) {
        projects.set(project.id, {
          id: project.id,
          name: project.name,
          slug: project.slug,
          developerName: project.developer?.name || 'Desarrolladora',
        });
      }
    }
  }

  for (const a of activeAgreements) {
    if (a.project && !projects.has(a.project.id)) {
      projects.set(a.project.id, {
        id: a.project.id,
        name: a.project.name,
        slug: (a.project).slug || String(a.project.id),
        developerName: a.project.developer?.name || 'Desarrolladora',
      });
    }
  }

  type Row = { project_id: number; project: { id: number; name: string; slug: string; developer: { name: string } | null } | null };
  for (const row of (accessRows || []) as unknown as Row[]) {
    if (row.project && !projects.has(row.project.id)) {
      projects.set(row.project.id, {
        id: row.project.id,
        name: row.project.name,
        slug: row.project.slug,
        developerName: row.project.developer?.name || 'Desarrolladora',
      });
    }
  }

  return Array.from(projects.values());
}

export type AvailableUnit = {
  id: number;
  unitNumber: string;
  typology: string | null;
  area: number | null;
  price: number;
  currency: string;
  status: string;
};

export async function getAvailableUnitsByProject(projectId: number): Promise<AvailableUnit[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('units')
    .select('id, unit_code, typology_id, floor_level, list_price, currency, status, tower')
    .eq('project_id', projectId)
    .eq('status', 'available')
    .order('unit_code');
  if (!data) return [];
  return data.map((u) => ({
    id: u.id,
    unitNumber: u.unit_code,
    typology: u.tower || (u.floor_level ? `Piso ${u.floor_level}` : null),
    area: null,
    price: Number(u.list_price),
    currency: u.currency || 'USD',
    status: u.status,
  }));
}

export type OpportunityReservationRequest = {
  id: number;
  unitId: number | null;
  status: string;
  notes: string | null;
  createdAt: string;
};

export async function getOpportunityReservationRequests(opportunityId: number): Promise<OpportunityReservationRequest[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('reservation_requests')
    .select('id, unit_id, status, notes, created_at')
    .eq('opportunity_id', opportunityId)
    .order('created_at', { ascending: false });
  if (!data) return [];
  return data.map((r) => ({
    id: r.id,
    unitId: r.unit_id,
    status: r.status,
    notes: r.notes,
    createdAt: r.created_at,
  }));
}

export type ClientReservationPayment = {
  reservationId: number;
  requestId: number;
  projectName: string;
  unitCode: string;
  price: number;
  currency: string;
  expiresAt: string | null;
  reservationType: string;
  payments: { id: number; amount: number; currency: string; status: string; createdAt: string }[];
};

export async function getClientReservationPayments(contactId: number): Promise<ClientReservationPayment[]> {
  const supabase = await createClient();
  const { data: opportunities } = await supabase.from('opportunities').select('id').eq('contact_id', contactId);
  const opportunityIds = (opportunities || []).map((item) => item.id);
  if (!opportunityIds.length) return [];
  // Reservation workflow columns are newer than the checked-in generated
  // Supabase type snapshot used by the deployment build.
  const { data: requests } = await (supabase)
    .from('reservation_requests')
    .select('id, opportunity_id, unit_id, status, expires_at, reservation_type')
    .in('opportunity_id', opportunityIds)
    .eq('status', 'approved');
  const requestRows = (requests || []) as Array<Record<string, unknown>>;
  if (!requestRows.length) return [];
  const requestIds = requestRows.map((item) => Number(item.id));
  const unitIds = requestRows.map((item) => Number(item.unit_id)).filter(Boolean);
  const [{ data: reservations }, { data: units }] = await Promise.all([
    (supabase).from('reservations').select('id, reservation_request_id, reservation_type, status').in('reservation_request_id', requestIds).eq('status', 'active'),
    unitIds.length ? supabase.from('units').select('id, unit_code, list_price, currency, project:projects(name)').in('id', unitIds) : Promise.resolve({ data: [] }),
  ]);
  const reservationRows = (reservations || []) as Array<Record<string, unknown>>;
  if (!reservationRows.length) return [];
  const reservationIds = reservationRows.map((item) => Number(item.id));
  const { data: payments } = await (supabase)
    .from('reservation_payment_submissions')
    .select('id, reservation_id, amount, currency, status, payment_stage, created_at')
    .in('reservation_id', reservationIds)
    .order('created_at', { ascending: false });
  const unitMap = new Map((units || []).map((item) => [item.id, item]));
  const requestMap = new Map(requestRows.map((item) => [Number(item.id), item]));
  const paymentMap = new Map<number, Array<Record<string, unknown>>>();
  for (const payment of (payments || []) as Array<Record<string, unknown>>) {
    const id = Number(payment.reservation_id);
    paymentMap.set(id, [...(paymentMap.get(id) || []), payment]);
  }
  return reservationRows.map((reservation) => {
    const request = requestMap.get(Number(reservation.reservation_request_id))!;
    const unit = unitMap.get(Number(request.unit_id));
    return {
      reservationId: Number(reservation.id), requestId: Number(request.id),
      projectName: unit?.project?.name || 'Proyecto', unitCode: unit?.unit_code || `Unidad #${request.unit_id}`,
      price: Number(unit?.list_price || 0), currency: unit?.currency || 'USD', expiresAt: request.expires_at ? String(request.expires_at) : null,
      reservationType: String(reservation.reservation_type || request.reservation_type || 'temporary_hold'),
      payments: (paymentMap.get(Number(reservation.id)) || []).map((payment) => ({ id: Number(payment.id), amount: Number(payment.amount), currency: String(payment.currency), status: String(payment.status), paymentStage: String(payment.payment_stage || 'reservation'), createdAt: String(payment.created_at) })),
    };
  });
}
