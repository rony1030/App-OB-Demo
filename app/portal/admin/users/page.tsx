
import { LocalizedText } from '@/components/i18n/UITranslationBoundary';
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/get-user";
import { hasCapability } from "@/lib/auth/permissions";
import { Users } from "lucide-react";
import AdminUsersManager, { type AgencyOption, type ManagedUser, type ProjectOption } from "@/components/portal/admin/AdminUsersManager";
import { getInvitationsListAction } from "./user-actions";

export const revalidate = 0;

export default async function AdminUsersPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  if (!hasCapability(currentUser.role, "manage_agency_users")) {
    redirect("/portal");
  }

  const supabase = await createClient();
  // Global administration runs server-side with the service client so profile RLS
  // does not turn every cross-organization member into an anonymous placeholder.
  const dataClient = currentUser.role === "super_admin" ? createAdminClient() : supabase;

  // 1. Fetch memberships with user profile and organization
  let membershipsQuery = dataClient
    .from("memberships")
    .select(`
      id,
      user_id,
      role,
      status,
      created_at,
      organization:organizations(id, name, slug, kind)
    `)
    .neq("status", "revoked")
    .order("created_at", { ascending: false });

  if (currentUser.role !== "super_admin") {
    membershipsQuery = membershipsQuery.eq("organization_id", currentUser.organization.id);
  }

  const { data: memberships } = await membershipsQuery;

  const members = memberships || [];
  const userIds = members.map((m) => m.user_id).filter(Boolean);

  const { data: profiles } = userIds.length > 0
    ? await dataClient
        .from("profiles")
        .select("user_id, display_name, email, phone, avatar_path, instagram_url, facebook_url, linkedin_url, tiktok_url, website_url")
        .in("user_id", userIds)
    : { data: [] };

  const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
  const authUserMap = new Map<string, { email?: string; name?: string }>();

  if (currentUser.role === "super_admin") {
    const { data: authUsers } = await createAdminClient().auth.admin.listUsers({ page: 1, perPage: 1000 });
    for (const authUser of authUsers?.users || []) {
      const metadata = authUser.user_metadata as { display_name?: string; full_name?: string; name?: string };
      authUserMap.set(authUser.id, {
        email: authUser.email,
        name: metadata.display_name || metadata.full_name || metadata.name,
      });
    }
  }

  // 2. Fetch project access mappings
  let accessQuery = dataClient
    .from("project_access")
    .select(`
      grantee_membership_id,
      project:projects(name)
    `);

  if (currentUser.role !== "super_admin") {
    accessQuery = members.length > 0
      ? accessQuery.in("grantee_membership_id", members.map((m) => m.id))
      : accessQuery.eq("grantee_membership_id", -1);
  }

  const { data: accessRows } = await accessQuery;

  const accessMap = new Map<number, string[]>();
  (accessRows || []).forEach((row) => {
    if (row.grantee_membership_id) {
      const projObj = row.project as unknown as { name?: string } | null;
      const projName = projObj?.name;
      if (projName) {
        const existing = accessMap.get(row.grantee_membership_id) || [];
        if (!existing.includes(projName)) {
          accessMap.set(row.grantee_membership_id, [...existing, projName]);
        }
      }
    }
  });

  const usersList: ManagedUser[] = members.map((m) => {
    const profile = profileMap.get(m.user_id);
    const authUser = authUserMap.get(m.user_id);
    const orgObj = m.organization as unknown as { id?: number; name?: string; kind?: string } | null;
    const statusLabel =
      m.status === "active" ? "Activo" : m.status === "suspended" ? "Suspendido" : "Pendiente";

    return {
      id: m.id,
      userId: m.user_id,
      name: profile?.display_name || authUser?.name || authUser?.email?.split("@")[0] || "Usuario sin perfil",
      email: profile?.email || authUser?.email || "—",
      phone: profile?.phone || "",
      avatarUrl: profile?.avatar_path || "",
      instagramUrl: profile?.instagram_url || "",
      facebookUrl: profile?.facebook_url || "",
      linkedinUrl: profile?.linkedin_url || "",
      tiktokUrl: profile?.tiktok_url || "",
      websiteUrl: profile?.website_url || "",
      role: m.role || "broker_agent",
      status: statusLabel,
      orgId: orgObj?.id,
      orgName: orgObj?.name || "Bello Valdez Enterprise",
      orgKind: orgObj?.kind || (m.role?.startsWith("developer") ? "developer" : m.role?.startsWith("agency") || m.role === "broker_agent" ? "agency" : "master_broker"),
      createdAt: new Date(m.created_at).toLocaleDateString("es-DO", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      assignedProjects: accessMap.get(m.id) || [],
    };
  });

  // 3. Fetch active projects list for assignment
  let projectsQuery = dataClient
    .from("projects")
    .select("id, name, slug")
    .order("name", { ascending: true });

  if (currentUser.role === "developer_admin" || currentUser.organization.kind === "developer") {
    projectsQuery = projectsQuery.eq("developer_organization_id", currentUser.organization.id);
  }

  const { data: rawProjects } = await projectsQuery;

  const projects: ProjectOption[] = (rawProjects || []).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
  }));

  const { data: rawAgencies } = currentUser.role === "super_admin"
    ? await createAdminClient()
        .from("organizations")
        .select("id, name")
        .eq("kind", "agency")
        .eq("status", "active")
        .order("name", { ascending: true })
    : { data: [] };

  const agencies: AgencyOption[] = (rawAgencies || []).map((agency) => ({
    id: agency.id,
    name: agency.name,
  }));

  const { data: rawMasterBrokers } = currentUser.role === "super_admin"
    ? await createAdminClient()
        .from("organizations")
        .select("id, name")
        .eq("kind", "master_broker")
        .eq("status", "active")
        .order("name", { ascending: true })
    : { data: [] };

  const masterBrokers = (rawMasterBrokers || []).map((organization) => ({
    id: organization.id,
    name: organization.name,
  }));

  const { data: rawDevelopers } = currentUser.role === "super_admin"
    ? await createAdminClient()
        .from("organizations")
        .select("id, name")
        .eq("kind", "developer")
        .eq("status", "active")
        .order("name", { ascending: true })
    : { data: [] };

  const developers = (rawDevelopers || []).map((organization) => ({
    id: organization.id,
    name: organization.name,
  }));

  // 4. Fetch pending invitations
  const { data: invitations, error: invitationsError } = await getInvitationsListAction();
  if (invitationsError) {
    console.error('[AdminUsersPage] Error loading invitations:', invitationsError);
  }

  return (
    <div className="portal-enter space-y-8 pb-16">
      {/* Page Header */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-blue-700 font-extrabold text-xs uppercase tracking-wider mb-1">
            <Users className="h-4 w-4 text-blue-600" />
            <span><LocalizedText text={"Seguridad, Permisos &amp; Miembros"} /></span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl"><LocalizedText text={"Usuarios, Agencias y Desarrolladores"} /></h1>
          <p className="mt-1 max-w-2xl text-xs text-slate-500"><LocalizedText text={"Administra de forma segmentada tu equipo Master Broker, las agencias inmobiliarias aliadas y los desarrolladores con acceso a los proyectos."} /></p>
        </div>
      </section>

      {/* Main Interactive Manager */}
      <AdminUsersManager
        users={usersList}
        initialInvitations={invitations || []}
        projects={projects}
        agencies={agencies}
        masterBrokers={masterBrokers}
        developers={developers}
        currentUserId={currentUser.id}
        currentUserRole={currentUser.role}
      />
    </div>
  );
}
