import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth/get-user';
import { canaRockPreviewOrganizations, isCanaRockLocalPreviewEnabled } from '@/lib/data/cana-rock-preview';

export type OrganizationSummary = {
  id: number;
  name: string;
  slug: string;
  kind: string;
  status: string;
  contactEmail: string | null;
  contactPhone: string | null;
  usersCount: number;
  projectsCount: number;
  developedProjectsCount?: number;
  managedProjectsCount?: number;
  assignedProjectsCount?: number;
  signedAgreementsCount?: number;
  createdAt: string;
  initials: string;
};

type AdminOrganizationRow = {
  id: number;
  name: string;
  slug: string;
  kind: string;
  status: string;
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
  memberships?: Array<{ id: number; status: string }>;
  projects?: Array<{ id: number }>;
  developer_projects?: Array<{ id: number }>;
};

type ProjectAccessSummaryRow = {
  project_id: number;
  grantee_membership_id: number | null;
  grantee_organization_id: number | null;
  expires_at: string | null;
};

export type AdminDashboardMetrics = {
  totalOrganizations: number;
  totalUsers: number;
  totalProjects: number;
  totalContacts: number;
  organizations: OrganizationSummary[];
};

export async function getAdminDashboardData(scopeOrganizationId?: number): Promise<AdminDashboardMetrics> {
  const currentUser = await getCurrentUser();
  const sessionClient = await createClient();
  const supabase = currentUser?.role === 'super_admin' ? createAdminClient() : sessionClient;
  const previewOrganizations = !scopeOrganizationId && isCanaRockLocalPreviewEnabled()
    ? canaRockPreviewOrganizations
    : [];

  // Fetch organizations. `projects` has two FKs to `organizations`
  // (organization_id and developer_organization_id) — PostgREST can't pick
  // one automatically, so the relationship to embed must be named explicitly
  // or the whole query errors out (PGRST201).
  let organizationsQuery = supabase
    .from('organizations')
    .select(`
      id,
      name,
      slug,
      kind,
      status,
      contact_email,
      contact_phone,
      created_at,
      memberships (id, status),
      projects:projects!projects_organization_id_fkey (id),
      developer_projects:projects!projects_developer_organization_id_fkey (id)
    `)
    .eq('status', 'active');

  if (scopeOrganizationId) {
    organizationsQuery = organizationsQuery.eq('id', scopeOrganizationId);
  }

  const { data: orgs, error: orgsError } = await organizationsQuery
    .order('created_at', { ascending: false });

  const { data: rawAccessRows } = await supabase
    .from('project_access')
    .select('project_id, grantee_membership_id, grantee_organization_id, expires_at');

  const { data: signedAgreements, error: agreementsError } = await supabase
    .from('agreements')
    .select('broker_organization_id, master_broker_organization_id, project_id, kind, expires_at')
    .eq('status', 'signed');
  const now = Date.now();
  const agreementCounts = new Map<number, number>();
  for (const agreement of signedAgreements || []) {
    if (agreement.expires_at && new Date(agreement.expires_at).getTime() <= now) continue;
    agreementCounts.set(agreement.broker_organization_id, (agreementCounts.get(agreement.broker_organization_id) || 0) + 1);
  }

  const organizationRows = (orgs || []) as unknown as AdminOrganizationRow[];
  const accessRows = (rawAccessRows || []) as ProjectAccessSummaryRow[];
  const activeMembershipOrganization = new Map<number, number>();
  const assignedProjectsByOrganization = new Map<number, Set<number>>();

  for (const organization of organizationRows) {
    for (const membership of organization.memberships || []) {
      if (membership.status === 'active') {
        activeMembershipOrganization.set(membership.id, organization.id);
      }
    }
  }

  for (const access of accessRows) {
    if (access.expires_at && new Date(access.expires_at).getTime() <= now) continue;
    const granteeOrganizationId = access.grantee_organization_id
      ?? (access.grantee_membership_id ? activeMembershipOrganization.get(access.grantee_membership_id) : undefined);
    if (!granteeOrganizationId) continue;

    const assignedProjects = assignedProjectsByOrganization.get(granteeOrganizationId) || new Set<number>();
    assignedProjects.add(access.project_id);
    assignedProjectsByOrganization.set(granteeOrganizationId, assignedProjects);
  }

  const projectsByOrganization = new Map<number, Set<number>>(
    organizationRows.map((organization) => [organization.id, new Set((organization.projects || []).map((project) => project.id))]),
  );
  for (const agreement of signedAgreements || []) {
    if (agreement.expires_at && new Date(agreement.expires_at).getTime() <= now) continue;
    const authorizedProjects = assignedProjectsByOrganization.get(agreement.broker_organization_id) || new Set<number>();
    const masterProjects = projectsByOrganization.get(agreement.master_broker_organization_id) || new Set<number>();
    if (agreement.kind === 'general') {
      for (const projectId of masterProjects) authorizedProjects.add(projectId);
    } else if (agreement.project_id) {
      authorizedProjects.add(agreement.project_id);
    }
    assignedProjectsByOrganization.set(agreement.broker_organization_id, authorizedProjects);
  }

  const databaseOrganizations: OrganizationSummary[] =
    !orgsError && orgs && orgs.length > 0
      ? organizationRows.map((o) => {
          const initials =
            o.name
              .split(' ')
              .filter(Boolean)
              .map((w: string) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase() || 'MB';

          const ownedProjects = new Set((o.projects || []).map((project) => project.id));
          const assignedProjects = assignedProjectsByOrganization.get(o.id) || new Set<number>();
          const brokerProjects = new Set([...ownedProjects, ...assignedProjects]);

          return {
            id: o.id,
            name: o.name,
            slug: o.slug,
            kind: o.kind || 'master_broker',
            status: o.status === 'active' ? 'Activo' : 'Configurando',
            contactEmail: o.contact_email,
            contactPhone: o.contact_phone,
            usersCount: o.memberships?.filter((membership) => membership.status === 'active').length || 0,
            projectsCount: o.kind === 'developer'
              ? o.developer_projects?.length || 0
              : brokerProjects.size,
            developedProjectsCount: new Set((o.developer_projects || []).map((project) => project.id)).size,
            managedProjectsCount: ownedProjects.size,
            assignedProjectsCount: assignedProjects.size,
            signedAgreementsCount: agreementsError ? undefined : agreementCounts.get(o.id) || 0,
            createdAt: o.created_at,
            initials,
          };
        })
      : scopeOrganizationId ? [] : [
          {
            id: 1,
            name: 'OB Brokers Team',
            slug: 'ob-brokers-team',
            kind: 'master_broker',
            status: 'Activo',
            contactEmail: 'info@obmasterbrokers.com',
            contactPhone: '+1 (809) 555-0199',
            usersCount: 2,
            projectsCount: 4,
            createdAt: new Date().toISOString(),
            initials: 'OB',
          },
        ];
  const previewSlugs = new Set(previewOrganizations.map((organization) => organization.slug));
  const organizations = [
    ...databaseOrganizations.filter((organization) => !previewSlugs.has(organization.slug)),
    ...previewOrganizations,
  ];

  // Fetch total counts
  let organizationCountQuery = supabase.from('organizations').select('*', { count: 'exact', head: true }).eq('status', 'active');
  let membershipCountQuery = supabase.from('memberships').select('*', { count: 'exact', head: true }).eq('status', 'active');
  let contactsCountQuery = supabase.from('contacts').select('*', { count: 'exact', head: true });

  if (scopeOrganizationId) {
    organizationCountQuery = organizationCountQuery.eq('id', scopeOrganizationId);
    membershipCountQuery = membershipCountQuery.eq('organization_id', scopeOrganizationId);
    contactsCountQuery = contactsCountQuery.eq('organization_id', scopeOrganizationId);
  }

  const [{ count: orgsCount }, { count: usersCount }, { count: projectsCount }, { count: contactsCount }] =
    await Promise.all([
      organizationCountQuery,
      membershipCountQuery,
      supabase.from('projects').select('*', { count: 'exact', head: true }),
      contactsCountQuery,
    ]);

  return {
    totalOrganizations: (orgsCount || databaseOrganizations.length) + previewOrganizations.length,
    totalUsers: usersCount || 0,
    totalProjects: (projectsCount || 0) + (previewOrganizations.length > 0 ? 4 : 0),
    totalContacts: contactsCount || 0,
    organizations,
  };
}

export type OrganizationLegalInfo = {
  legalName: string | null;
  taxId: string | null;
  legalAddress: string | null;
};

export async function getOrganizationLegalInfo(organizationId: number): Promise<OrganizationLegalInfo> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('organizations')
    .select('legal_name, tax_id, legal_address')
    .eq('id', organizationId)
    .maybeSingle();

  return {
    legalName: data?.legal_name ?? null,
    taxId: data?.tax_id ?? null,
    legalAddress: data?.legal_address ?? null,
  };
}

export type OrganizationDetailMember = {
  membershipId: number;
  displayName: string;
  email: string | null;
  role: string;
  status: string;
  joinedAt: string;
};

export type OrganizationDetailProject = {
  projectId: number;
  name: string;
  slug: string;
  accessType: 'owned' | 'assigned';
};

export type OrganizationDetail = {
  id: number;
  name: string;
  slug: string;
  kind: string;
  status: string;
  contactEmail: string | null;
  contactPhone: string | null;
  createdAt: string;
  members: OrganizationDetailMember[];
  projects: OrganizationDetailProject[];
  administrators: OrganizationDetailMember[];
  agencyPartners: Array<{ organizationId: number; name: string; slug: string; agreementCount: number; activeAgreement: boolean }>;
  developerUsers: Array<{ organizationId: number; organizationName: string; membershipId: number; displayName: string; email: string | null; role: string }>;
  notificationRecipients: { leads: string[]; payments: string[]; reservations: string[] };
};

export async function getOrganizationDetailBySlug(slug: string): Promise<OrganizationDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('organizations').select('id').eq('slug', slug).maybeSingle();
  if (!data) return null;
  return getOrganizationDetail(data.id);
}

export async function getOrganizationDetail(orgId: number): Promise<OrganizationDetail | null> {
  const currentUser = await getCurrentUser();
  // Superadmins can inspect cross-organization memberships; every other role
  // remains protected by Supabase RLS for its own organization.
  const supabase = currentUser?.role === 'super_admin' ? createAdminClient() : await createClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug, kind, status, contact_email, contact_phone, created_at')
    .eq('id', orgId)
    .maybeSingle();

  if (!org) return null;

  const { data: memberships } = await supabase
    .from('memberships')
    .select('id, user_id, role, status, created_at')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: true });

  const { data: ownedProjects } = await supabase
    .from('projects')
    .select('id, name, slug')
    .eq('organization_id', orgId);

  const memberIds = (memberships || []).map((membership) => membership.id);
  const { data: accessRows } = memberIds.length > 0
    ? await supabase
        .from('project_access')
        .select('project_id, projects (id, name, slug)')
        .in('grantee_membership_id', memberIds)
    : { data: [] };

  const membershipUserIds = (memberships || []).map((membership) => membership.user_id).filter(Boolean);
  const { data: membershipProfiles } = membershipUserIds.length > 0
    ? await supabase.from('profiles').select('user_id, display_name, email').in('user_id', membershipUserIds)
    : { data: [] };
  const profileMap = new Map((membershipProfiles || []).map((profile) => [profile.user_id, profile]));

  const members: OrganizationDetailMember[] = (memberships || []).map((m: Record<string, unknown>) => {
    const profile = profileMap.get(m.user_id as string);
    return {
      membershipId: m.id as number,
      displayName: profile?.display_name || profile?.email || 'Sin nombre',
      email: profile?.email || null,
      role: m.role as string,
      status: m.status as string,
      joinedAt: m.created_at as string,
    };
  });

  const { data: agreements } = await supabase
    .from('agreements')
    .select('broker_organization_id, project_id, status, expires_at, broker_org:organizations!agreements_broker_organization_id_fkey(id, name, slug)')
    .eq('master_broker_organization_id', orgId);
  const today = Date.now();
  const agencyMap = new Map<number, { organizationId: number; name: string; slug: string; agreementCount: number; activeAgreement: boolean }>();
  for (const agreement of agreements || []) {
    const broker = agreement.broker_org as unknown as { id: number; name: string; slug: string } | null;
    if (!broker) continue;
    const active = agreement.status === 'signed' && (!agreement.expires_at || new Date(agreement.expires_at).getTime() >= today);
    const current = agencyMap.get(broker.id) || { organizationId: broker.id, name: broker.name, slug: broker.slug, agreementCount: 0, activeAgreement: false };
    current.agreementCount += 1;
    current.activeAgreement = current.activeAgreement || active;
    agencyMap.set(broker.id, current);
  }

  const developerOrgIds = new Set<number>();
  for (const agreement of agreements || []) {
    const { data: project } = agreement.project_id ? await supabase.from('projects').select('developer_organization_id').eq('id', agreement.project_id).maybeSingle() : { data: null };
    if (project?.developer_organization_id) developerOrgIds.add(project.developer_organization_id);
  }
  const developerUsers: OrganizationDetail['developerUsers'] = [];
  for (const developerOrgId of developerOrgIds) {
    const { data: developerOrg } = await supabase.from('organizations').select('name').eq('id', developerOrgId).maybeSingle();
    const { data: devMemberships } = await supabase.from('memberships').select('id, user_id, role, profiles(display_name, email)').eq('organization_id', developerOrgId).eq('status', 'active');
    for (const membership of devMemberships || []) {
      const profile = membership.profiles as unknown as { display_name?: string; email?: string } | null;
      developerUsers.push({ organizationId: developerOrgId, organizationName: developerOrg?.name || 'Desarrolladora', membershipId: membership.id, displayName: profile?.display_name || profile?.email || 'Usuario', email: profile?.email || null, role: membership.role });
    }
  }

  const untypedSupabase = supabase;
  const [leadRecipients, paymentRecipients, reservationRecipients] = await Promise.all([
    untypedSupabase.from('report_notification_recipients').select('email').eq('organization_id', orgId).eq('is_active', true),
    untypedSupabase.from('agreement_notification_recipients').select('email').eq('organization_id', orgId).eq('is_active', true),
    untypedSupabase.from('reservation_notification_recipients').select('email').eq('organization_id', orgId).eq('is_active', true),
  ]);

  const projectsMap = new Map<number, OrganizationDetailProject>();
  for (const p of ownedProjects || []) {
    projectsMap.set(p.id, { projectId: p.id, name: p.name, slug: p.slug, accessType: 'owned' });
  }
  for (const row of accessRows || []) {
    const p = (row as Record<string, unknown>).projects as { id: number; name: string; slug: string } | null;
    if (p && !projectsMap.has(p.id)) {
      projectsMap.set(p.id, { projectId: p.id, name: p.name, slug: p.slug, accessType: 'assigned' });
    }
  }

  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    kind: org.kind || 'master_broker',
    status: org.status === 'active' ? 'Activo' : 'Configurando',
    contactEmail: org.contact_email,
    contactPhone: org.contact_phone,
    createdAt: org.created_at,
    members: members.filter((m) => m.status === 'active'),
    projects: Array.from(projectsMap.values()),
    administrators: members.filter((member) => ['master_broker_admin', 'master_broker_operations'].includes(member.role)),
    agencyPartners: Array.from(agencyMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'es')),
    developerUsers,
    notificationRecipients: {
      leads: (leadRecipients.data || []).map((row: { email: string }) => row.email),
      payments: (paymentRecipients.data || []).map((row: { email: string }) => row.email),
      reservations: (reservationRecipients.data || []).map((row: { email: string }) => row.email),
    },
  };
}
