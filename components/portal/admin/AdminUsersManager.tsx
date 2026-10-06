"use client";
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useState, useTransition, useMemo } from "react";
import { Copy, Mail, RefreshCcw, Send, ShieldCheck, KeyRound, UserCheck, UserPlus, Users, X, Pencil, Building2, HardHat, Search, Check, Trash2, AlertTriangle } from "lucide-react";
import { formatPortalDate } from "@/lib/utils";
import { requestConfirmation } from '@/components/feedback/AppNotifications';
import { createInvitationAction, createDirectUserAction, sendPasswordSetupEmailAction, resetTemporaryPasswordAction, resendInvitationEmailAction, revokeInvitationAction, updateMembershipStatusAction, uploadAgentAvatarAction, addExistingMembershipAction, createAgencyQuickAction, updateUserMembershipAction, revokeMembershipAction, type InvitationResult } from "@/app/portal/admin/users/user-actions";
import { refreshSellerDossierAction } from "@/app/portal/agency/actions";
import type { UserRole } from "@/lib/auth/get-user";

export interface ManagedUser {
  id: number;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  instagramUrl?: string;
  facebookUrl?: string;
  linkedinUrl?: string;
  tiktokUrl?: string;
  websiteUrl?: string;
  role: string;
  status: string; // 'Activo' | 'Suspendido' | 'Pendiente'
  orgId?: number;
  orgName: string;
  orgKind?: string; // 'master_broker' | 'agency' | 'developer' | string
  createdAt: string;
  assignedProjects?: string[];
}

export interface ProjectOption {
  id: number;
  name: string;
  slug: string;
}

export interface AgencyOption {
  id: number;
  name: string;
}

export interface MasterBrokerOption {
  id: number;
  name: string;
}

export interface DeveloperOption {
  id: number;
  name: string;
}

const roleBadges: Record<string, { label: string; bg: string; text: string }> = {
  super_admin: { label: "Superadministrador", bg: "bg-purple-50", text: "text-purple-700" },
  master_broker_admin: { label: "Master Broker Admin", bg: "bg-blue-50", text: "text-blue-700" },
  master_broker_operations: { label: "Operaciones Master", bg: "bg-indigo-50", text: "text-indigo-700" },
  agency_admin: { label: "Admin Inmobiliaria", bg: "bg-emerald-50", text: "text-emerald-700" },
  agency_support: { label: "Soporte de Agencia", bg: "bg-cyan-50", text: "text-cyan-700" },
  broker_agent: { label: "Vendedor / Asesor", bg: "bg-sky-50", text: "text-sky-700" },
  developer_admin: { label: "Desarrollador Admin", bg: "bg-amber-50", text: "text-amber-700" },
  developer_viewer: { label: "Consulta Desarrollador", bg: "bg-slate-100", text: "text-slate-700" },
  support_auditor: { label: "Auditor / Soporte", bg: "bg-rose-50", text: "text-rose-700" },
};

type ActiveTabType = "master_broker" | "agencies" | "developers" | "all" | "invitations";

export default function AdminUsersManager({
  users,
  initialInvitations,
  projects,
  agencies,
  masterBrokers,
  developers = [],
  currentUserId,
  currentUserRole = "broker_agent",
}: {
  users: ManagedUser[];
  initialInvitations: InvitationResult[];
  projects: ProjectOption[];
  agencies: AgencyOption[];
  masterBrokers: MasterBrokerOption[];
  developers?: DeveloperOption[];
  currentUserId: string;
  currentUserRole?: string;
}) {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<ActiveTabType>("master_broker");

  // State lists
  const [userList, setUserList] = useState<ManagedUser[]>(users);
  const [invitations, setInvitations] = useState<InvitationResult[]>(initialInvitations);
  const [agencyList, setAgencyList] = useState<AgencyOption[]>(agencies);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgencyFilter, setSelectedAgencyFilter] = useState<string>("all");
  const [selectedDeveloperFilter, setSelectedDeveloperFilter] = useState<string>("all");

  // Modals state
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isCreateAgencyModalOpen, setIsCreateAgencyModalOpen] = useState(false);
  const [isAssignMasterBrokerModalOpen, setIsAssignMasterBrokerModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [userToRevoke, setUserToRevoke] = useState<ManagedUser | null>(null);

  // Quick temporary password display modal
  const [createdTemporaryPassword, setCreatedTemporaryPassword] = useState<string | null>(null);
  const [createdInviteUrl, setCreatedInviteUrl] = useState<string | null>(null);

  // Toast notifications
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null);
  const [isPending, startTransition] = useTransition();

  const notify = (text: string, error = false) => {
    setNotice({ text, error });
    setTimeout(() => setNotice(null), 4000);
  };

  const resolveInviteUrl = (inviteUrl: string) =>
    inviteUrl.startsWith("http") ? inviteUrl : `${window.location.origin}${inviteUrl}`;

  // Helper to categorize users
  const isMasterBrokerUser = (u: ManagedUser) =>
    u.orgKind === "master_broker" ||
    u.role === "super_admin" ||
    u.role === "master_broker_admin" ||
    u.role === "master_broker_operations";

  const isAgencyUser = (u: ManagedUser) =>
    u.orgKind === "agency" ||
    u.role === "agency_admin" ||
    u.role === "agency_support" ||
    u.role === "broker_agent";

  const isDeveloperUser = (u: ManagedUser) =>
    u.orgKind === "developer" ||
    u.role === "developer_admin" ||
    u.role === "developer_viewer";

  // Tab counts
  const masterBrokerCount = useMemo(() => userList.filter(isMasterBrokerUser).length, [userList]);
  const agenciesCount = useMemo(() => userList.filter(isAgencyUser).length, [userList]);
  const developersCount = useMemo(() => userList.filter(isDeveloperUser).length, [userList]);
  const pendingInvitesCount = useMemo(() => invitations.filter((i) => i.status === "pending").length, [invitations]);

  // Filtered users for table
  const filteredUsers = useMemo(() => {
    return userList.filter((user) => {
      // 1. Tab filter
      if (activeTab === "master_broker" && !isMasterBrokerUser(user)) return false;
      if (activeTab === "agencies") {
        if (!isAgencyUser(user)) return false;
        if (selectedAgencyFilter !== "all" && String(user.orgId) !== selectedAgencyFilter && user.orgName !== selectedAgencyFilter) {
          return false;
        }
      }
      if (activeTab === "developers") {
        if (!isDeveloperUser(user)) return false;
        if (selectedDeveloperFilter !== "all" && String(user.orgId) !== selectedDeveloperFilter && user.orgName !== selectedDeveloperFilter) {
          return false;
        }
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = user.name.toLowerCase().includes(q);
        const matchesEmail = user.email.toLowerCase().includes(q);
        const matchesOrg = user.orgName.toLowerCase().includes(q);
        const matchesRole = (roleBadges[user.role]?.label || user.role).toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesOrg && !matchesRole) return false;
      }

      return true;
    });
  }, [userList, activeTab, selectedAgencyFilter, selectedDeveloperFilter, searchQuery]);

  // Status toggle handler
  const handleToggleSuspend = async (user: ManagedUser) => {
    const isSuspended = user.status === "Suspendido";
    const targetStatus = isSuspended ? "active" : "suspended";
    const confirmMsg = isSuspended
      ? `¿Reactivar el acceso de ${user.name}? Podrá volver a iniciar sesión.`
      : `¿Suspender temporalmente a ${user.name}? Perderá el acceso de inmediato sin borrar sus datos.`;

    if (!(await requestConfirmation(confirmMsg))) return;

    startTransition(async () => {
      const res = await updateMembershipStatusAction({
        membershipId: user.id,
        status: targetStatus,
      });

      if (res.error) {
        notify(res.error, true);
        return;
      }

      setUserList((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: isSuspended ? "Activo" : "Suspendido" } : u))
      );
      notify(isSuspended ? "Usuario reactivado con éxito." : "Usuario suspendido temporalmente.");
    });
  };

  // Revoke membership handler
  const handleRevokeMembership = (user: ManagedUser) => {
    startTransition(async () => {
      const res = await revokeMembershipAction(user.id);
      if (res.error) {
        notify(res.error, true);
        return;
      }
      setUserList((prev) => prev.filter((u) => u.id !== user.id));
      setUserToRevoke(null);
      notify(`Acceso de ${user.name} a ${user.orgName} revocado correctamente.`);
    });
  };

  // Password reset email
  const handleSendPasswordReset = (user: ManagedUser) => {
    startTransition(async () => {
      const res = await sendPasswordSetupEmailAction(user.id);
      notify(res.error || `Enlace de restablecimiento enviado a ${user.email}.`, Boolean(res.error));
    });
  };

  // Generate temporary password
  const handleGenerateTemporaryPassword = (user: ManagedUser) => {
    startTransition(async () => {
      const res = await resetTemporaryPasswordAction(user.id);
      if (res.error || !res.password) {
        notify(res.error || "No se pudo generar la clave temporal.", true);
        return;
      }
      setCreatedTemporaryPassword(res.password);
      notify("Clave temporal generada con éxito.");
    });
  };

  // Revoke invitation
  const handleRevokeInvite = (id: number) => {
    startTransition(async () => {
      const res = await revokeInvitationAction(id);
      if (res.error) {
        notify(res.error, true);
        return;
      }
      setInvitations((prev) => prev.filter((i) => i.id !== id));
      notify("Invitación revocada.");
    });
  };

  // Resend invitation
  const handleResendInvite = (id: number) => {
    startTransition(async () => {
      const res = await resendInvitationEmailAction(id);
      if (res.error) {
        notify(res.error, true);
        return;
      }
      notify("Invitación reenviada por correo.");
    });
  };

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {notice && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-3 text-xs font-bold text-white shadow-2xl transition-all ${
            notice.error ? "bg-rose-600" : "bg-slate-950"
          }`}
        >
          <span>{notice.text}</span>
        </div>
      )}

      {/* KPI Metric Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div
          onClick={() => setActiveTab("master_broker")}
          className={`cursor-pointer rounded-2xl border p-5 shadow-xs transition ${
            activeTab === "master_broker"
              ? "border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700"><LocalizedText text={"Equipo Master Broker"} /></span>
            <ShieldCheck className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-950">{masterBrokerCount}</p>
          <p className="mt-1 text-[11px] text-slate-500"><LocalizedText text={"Bello Valdez / OB Brokers (Nosotros)"} /></p>
        </div>

        <div
          onClick={() => setActiveTab("agencies")}
          className={`cursor-pointer rounded-2xl border p-5 shadow-xs transition ${
            activeTab === "agencies"
              ? "border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700"><LocalizedText text={"Agencias Aliadas"} /></span>
            <Building2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-950">{agenciesCount}</p>
          <p className="mt-1 text-[11px] text-slate-500"><LocalizedText text={"Inmobiliarias y Asesores de venta"} /></p>
        </div>

        <div
          onClick={() => setActiveTab("developers")}
          className={`cursor-pointer rounded-2xl border p-5 shadow-xs transition ${
            activeTab === "developers"
              ? "border-amber-500 bg-amber-50/40 ring-2 ring-amber-500/20"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700"><LocalizedText text={"Desarrolladores"} /></span>
            <HardHat className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-950">{developersCount}</p>
          <p className="mt-1 text-[11px] text-slate-500"><LocalizedText text={"Constructoras de los proyectos"} /></p>
        </div>

        <div
          onClick={() => setActiveTab("invitations")}
          className={`cursor-pointer rounded-2xl border p-5 shadow-xs transition ${
            activeTab === "invitations"
              ? "border-amber-500 bg-amber-50/40 ring-2 ring-amber-500/20"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500"><LocalizedText text={"Invitaciones Pendientes"} /></span>
            <Mail className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-950">{pendingInvitesCount}</p>
          <p className="mt-1 text-[11px] text-slate-500"><LocalizedText text={"Enlaces de activación activos"} /></p>
        </div>
      </section>

      {/* Main Section */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
        {/* Upper Action Bar & Navigation */}
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50">
          {/* Main Entity Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("master_broker")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                activeTab === "master_broker"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span><LocalizedText text={"Equipo Master Broker ("} />{masterBrokerCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("agencies")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                activeTab === "agencies"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span><LocalizedText text={"Agencias Aliadas ("} />{agenciesCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("developers")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                activeTab === "developers"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <HardHat className="h-3.5 w-3.5" />
              <span><LocalizedText text={"Desarrolladores ("} />{developersCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                activeTab === "all"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span><LocalizedText text={"Todos ("} />{userList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("invitations")}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                activeTab === "invitations"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Mail className="h-3.5 w-3.5" />
              <span><LocalizedText text={"Invitaciones ("} />{invitations.length})</span>
            </button>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {currentUserRole === "super_admin" && (
              <>
                <UITranslationBoundary attributes={["title"]}><button
                  type="button"
                  onClick={() => setIsAssignMasterBrokerModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/70 px-3.5 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition"
                  title="Asignar rol de Master Broker a un usuario existente"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                  <span><LocalizedText text={"Acceso Master Broker"} /></span>
                </button></UITranslationBoundary>

                <button
                  type="button"
                  onClick={() => setIsCreateAgencyModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition"
                >
                  <Building2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span><LocalizedText text={"+ Nueva Agencia"} /></span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setIsCreateUserModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-blue-700 transition"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span><LocalizedText text={"+ Nuevo Usuario"} /></span>
            </button>
          </div>
        </div>

        {/* Contextual description for each view */}
        <div className="border-b border-slate-100 px-6 py-3 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            {activeTab === "master_broker" && (
              <p>
                <strong className="text-slate-900 font-bold"><LocalizedText text={"🏢 Master Broker (Bello Valdez Enterprise):"} /></strong><LocalizedText text={" Nuestro equipo interno que administra todos los proyectos, inventario y relaciones comerciales."} /></p>
            )}
            {activeTab === "agencies" && (
              <p>
                <strong className="text-slate-900 font-bold"><LocalizedText text={"🤝 Agencias Inmobiliarias Aliadas:"} /></strong><LocalizedText text={" Empresas de corretaje autorizadas para vender las unidades de los proyectos y sus asesores."} /></p>
            )}
            {activeTab === "developers" && (
              <p>
                <strong className="text-slate-900 font-bold"><LocalizedText text={"🏗️ Desarrolladores &amp; Constructoras:"} /></strong><LocalizedText text={" Equipos que suministran el inventario de proyectos como Cana Rock, Palm View o Uve Residences."} /></p>
            )}
            {activeTab === "all" && (
              <p>
                <strong className="text-slate-900 font-bold"><LocalizedText text={"👥 Vista General:"} /></strong><LocalizedText text={" Listado global de todas las cuentas y membresías registradas en la plataforma."} /></p>
            )}
            {activeTab === "invitations" && (
              <p>
                <strong className="text-slate-900 font-bold"><LocalizedText text={"✉️ Invitaciones de Acceso:"} /></strong><LocalizedText text={" Enlaces únicos emitidos para nuevos miembros que aún no han completado su registro."} /></p>
            )}
          </div>

          {/* Search & Subfilters */}
          {activeTab !== "invitations" && (
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <UITranslationBoundary attributes={["placeholder"]}><input
                  type="text"
                  placeholder="Buscar usuario o correo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-48 sm:w-56 rounded-xl border border-slate-200 bg-slate-50/50 pl-8 pr-3 text-xs outline-none focus:border-blue-500 focus:bg-white"
                /></UITranslationBoundary>
              </div>

              {activeTab === "agencies" && (
                <select
                  value={selectedAgencyFilter}
                  onChange={(e) => setSelectedAgencyFilter(e.target.value)}
                  className="h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 outline-none focus:border-blue-500"
                >
                  <option value="all"><LocalizedText text={"Todas las agencias"} /></option>
                  {agencyList.map((a) => (
                    <option key={a.id} value={String(a.id)}>
                      {a.name}
                    </option>
                  ))}
                </select>
              )}

              {activeTab === "developers" && (
                <select
                  value={selectedDeveloperFilter}
                  onChange={(e) => setSelectedDeveloperFilter(e.target.value)}
                  className="h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs text-slate-700 outline-none focus:border-blue-500"
                >
                  <option value="all"><LocalizedText text={"Todos los desarrolladores"} /></option>
                  {developers.map((d) => (
                    <option key={d.id} value={String(d.id)}>
                      {d.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        {/* Members Table */}
        {activeTab !== "invitations" ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead className="bg-slate-50 text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                <tr>
                  <th className="px-6 py-3.5"><LocalizedText text={"Usuario"} /></th>
                  <th className="px-6 py-3.5"><LocalizedText text={"Organización / Entidad"} /></th>
                  <th className="px-6 py-3.5"><LocalizedText text={"Rol de Acceso"} /></th>
                  <th className="px-6 py-3.5"><LocalizedText text={"Proyectos Asignados"} /></th>
                  <th className="px-6 py-3.5"><LocalizedText text={"Estado"} /></th>
                  <th className="px-6 py-3.5 text-right"><LocalizedText text={"Acciones"} /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-xs text-slate-400"><LocalizedText text={"No se encontraron miembros en esta categoría."} /></td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const badge = roleBadges[user.role] || {
                      label: user.role,
                      bg: "bg-slate-100",
                      text: "text-slate-700",
                    };
                    const isCurrentUser = user.userId === currentUserId;
                    const isSuspended = user.status === "Suspendido";

                    // Entity type pill
                    const isMB = isMasterBrokerUser(user);
                    const isDev = isDeveloperUser(user);
                    const entityBadge = isMB
                      ? { label: "Master Broker", bg: "bg-blue-50 text-blue-700 border-blue-200" }
                      : isDev
                      ? { label: "Desarrollador", bg: "bg-amber-50 text-amber-700 border-amber-200" }
                      : { label: "Agencia Aliada", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };

                    return (
                      <tr key={user.id} className="text-xs hover:bg-slate-50/60 transition">
                        {/* Usuario */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {user.avatarUrl ? (
                              <img
                                src={user.avatarUrl}
                                alt={user.name}
                                className="h-10 w-10 shrink-0 rounded-xl object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-xs font-black text-blue-700">
                                {user.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{user.name}</span>
                                {isCurrentUser && (
                                  <span className="rounded-full bg-blue-100 px-2 py-0.2 text-[8px] font-extrabold text-blue-700"><LocalizedText text={"Tú"} /></span>
                                )}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">{user.email}</p>
                              {user.phone && (
                                <p className="text-[10px] text-slate-500 mt-0.5">{user.phone}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Organización */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <p className="font-bold text-slate-900">{user.orgName}</p>
                            <span
                              className={`inline-block rounded-md border px-2 py-0.5 text-[8px] font-extrabold uppercase ${entityBadge.bg}`}
                            >
                              {entityBadge.label}
                            </span>
                          </div>
                        </td>

                        {/* Rol */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[9px] font-extrabold uppercase ${badge.bg} ${badge.text}`}
                          >
                            {badge.label}
                          </span>
                        </td>

                        {/* Proyectos Asignados */}
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1 max-w-[220px]">
                            {user.assignedProjects && user.assignedProjects.length > 0 ? (
                              user.assignedProjects.map((p) => (
                                <span
                                  key={p}
                                  className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600 truncate max-w-[140px]"
                                  title={p}
                                >
                                  {p}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-slate-400 italic"><LocalizedText text={"Todos los autorizados"} /></span>
                            )}
                          </div>
                        </td>

                        {/* Estado */}
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-lg px-2.5 py-1 text-[9px] font-extrabold uppercase border ${
                              isSuspended
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}
                          >
                            {user.status}
                          </span>
                        </td>

                        {/* Acciones */}
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            {/* Botón Editar Unificado */}
                            <UITranslationBoundary attributes={["title"]}><button
                              type="button"
                              onClick={() => setEditingUser(user)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
                              title="Editar datos, rol u organización"
                            >
                              <Pencil className="h-3 w-3 text-slate-500" />
                              <span><LocalizedText text={"Editar"} /></span>
                            </button></UITranslationBoundary>

                            {/* Enviar enlace de restablecimiento */}
                            {!isCurrentUser && (
                              <UITranslationBoundary attributes={["title"]}><button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleSendPasswordReset(user)}
                                title="Enviar correo para crear contraseña"
                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                              >
                                <Mail className="h-3.5 w-3.5" />
                              </button></UITranslationBoundary>
                            )}

                            {/* Generar clave temporal */}
                            {!isCurrentUser && (
                              <UITranslationBoundary attributes={["title"]}><button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleGenerateTemporaryPassword(user)}
                                title="Generar clave temporal para compartir manualmente"
                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-50"
                              >
                                <KeyRound className="h-3.5 w-3.5" />
                              </button></UITranslationBoundary>
                            )}

                            {/* Suspender / Reactivar */}
                            {!isCurrentUser && (
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleToggleSuspend(user)}
                                className={`rounded-lg px-2.5 py-1 text-[10px] font-bold transition border ${
                                  isSuspended
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                }`}
                              >
                                {isSuspended ? "Reactivar" : "Suspender"}
                              </button>
                            )}

                            {/* Revocar / Eliminar membresía */}
                            {!isCurrentUser && (
                              <UITranslationBoundary attributes={["title"]}><button
                                type="button"
                                disabled={isPending}
                                onClick={() => setUserToRevoke(user)}
                                title="Revocar acceso a esta organización"
                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button></UITranslationBoundary>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Invitaciones Table */
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-slate-50 text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
                <tr>
                  <th className="px-6 py-3.5"><LocalizedText text={"Correo Invitado"} /></th>
                  <th className="px-6 py-3.5"><LocalizedText text={"Rol Propuesto"} /></th>
                  <th className="px-6 py-3.5"><LocalizedText text={"Organización"} /></th>
                  <th className="px-6 py-3.5"><LocalizedText text={"Expira"} /></th>
                  <th className="px-6 py-3.5"><LocalizedText text={"Estado"} /></th>
                  <th className="px-6 py-3.5"><LocalizedText text={"Seguimiento"} /></th>
                  <th className="px-6 py-3.5 text-right"><LocalizedText text={"Acciones"} /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invitations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-xs text-slate-400"><LocalizedText text={"No hay invitaciones registradas."} /></td>
                  </tr>
                ) : (
                  invitations.map((inv) => {
                    const badge = roleBadges[inv.role] || {
                      label: inv.role,
                      bg: "bg-slate-100",
                      text: "text-slate-700",
                    };
                    const isPendingInvite = inv.status === "pending";

                    return (
                      <tr key={inv.id} className="text-xs hover:bg-slate-50/60 transition">
                        <td className="px-6 py-4 font-bold text-slate-900">{inv.email}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[9px] font-extrabold uppercase ${badge.bg} ${badge.text}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-semibold">{inv.organizationName}</td>
                        <td className="px-6 py-4 text-slate-500">
                          {formatPortalDate(inv.expiresAt, {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-lg px-2.5 py-1 text-[9px] font-extrabold uppercase border ${
                              inv.status === "accepted"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : inv.status === "pending"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-slate-100 text-slate-500 border-slate-200"
                            }`}
                          >
                            {inv.status === "pending"
                              ? "Pendiente"
                              : inv.status === "accepted"
                              ? "Aceptada"
                              : "Revocada"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[10px] font-semibold text-slate-500">
                          <div className="space-y-1">
                            <p>{inv.emailLastSentAt || inv.emailSentAt ? <LocalizedText text={"Correo enviado"} /> : <LocalizedText text={"Correo no confirmado"} />}</p>
                            <p>{inv.openedAt ? "Enlace abierto" : <LocalizedText text={"Sin apertura registrada"} />}</p>
                            {inv.acceptedAt && <p className="text-emerald-700 font-bold"><LocalizedText text={"Cuenta activada"} /></p>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            {isPendingInvite && (
                              <>
                                <UITranslationBoundary attributes={["title"]}><button
                                  type="button"
                                  onClick={() => {
                                    const fullUrl = resolveInviteUrl(inv.inviteUrl);
                                    navigator.clipboard.writeText(fullUrl);
                                    notify("Enlace copiado al portapapeles.");
                                  }}
                                  title="Copiar enlace de invitación"
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
                                >
                                  <Copy className="h-3.5 w-3.5" />
                                </button></UITranslationBoundary>
                                <UITranslationBoundary attributes={["title"]}><button
                                  type="button"
                                  disabled={isPending}
                                  onClick={() => handleResendInvite(inv.id)}
                                  title="Reenviar correo"
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 transition"
                                >
                                  <Send className="h-3.5 w-3.5" />
                                </button></UITranslationBoundary>
                                <button
                                  type="button"
                                  disabled={isPending}
                                  onClick={() => handleRevokeInvite(inv.id)}
                                  className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[10px] font-bold text-rose-700 hover:bg-rose-100 transition"
                                ><LocalizedText text={"Revocar"} /></button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ========================================================= */}
      {/* MODAL 1: + NUEVO USUARIO (Asistente Claro) */}
      {/* ========================================================= */}
      {isCreateUserModalOpen && (
        <CreateUserModal
          projects={projects}
          agencies={agencyList}
          masterBrokers={masterBrokers}
          developers={developers}
          currentUserRole={currentUserRole}
          onClose={() => setIsCreateUserModalOpen(false)}
          onSuccess={(result) => {
            setIsCreateUserModalOpen(false);
            if (result.temporaryPassword) {
              setCreatedTemporaryPassword(result.temporaryPassword);
            }
            if (result.inviteUrl) {
              setCreatedInviteUrl(result.inviteUrl);
            }
            if (result.invitation) {
              setInvitations((prev) => [result.invitation!, ...prev]);
            }
            notify(result.message || "Usuario procesado exitosamente.");
          }}
          notify={notify}
        />
      )}

      {/* ========================================================= */}
      {/* MODAL 2: + NUEVA AGENCIA INMOBILIARIA */}
      {/* ========================================================= */}
      {isCreateAgencyModalOpen && (
        <CreateAgencyModal
          projects={projects}
          onClose={() => setIsCreateAgencyModalOpen(false)}
          onSuccess={(newAgency, inviteUrl) => {
            setIsCreateAgencyModalOpen(false);
            setAgencyList((prev) => [...prev, newAgency]);
            if (inviteUrl) {
              setCreatedInviteUrl(inviteUrl);
            }
            setActiveTab("agencies");
            notify(`Agencia "${newAgency.name}" registrada con éxito.`);
          }}
          notify={notify}
        />
      )}

      {/* ========================================================= */}
      {/* MODAL 3: DAR ACCESO MASTER BROKER A USUARIO EXISTENTE */}
      {/* ========================================================= */}
      {isAssignMasterBrokerModalOpen && (
        <AssignMasterBrokerModal
          users={userList}
          masterBrokers={masterBrokers}
          onClose={() => setIsAssignMasterBrokerModalOpen(false)}
          onSuccess={() => {
            setIsAssignMasterBrokerModalOpen(false);
            notify("Acceso de Master Broker asignado correctamente.");
            window.location.reload();
          }}
          notify={notify}
        />
      )}

      {/* ========================================================= */}
      {/* MODAL 4: EDITAR USUARIO (UNIFICADO) */}
      {/* ========================================================= */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          projects={projects}
          agencies={agencyList}
          masterBrokers={masterBrokers}
          developers={developers}
          currentUserRole={currentUserRole}
          onClose={() => setEditingUser(null)}
          onSuccess={(updatedUser) => {
            setUserList((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
            setEditingUser(null);
            notify(`Usuario "${updatedUser.name}" actualizado correctamente.`);
          }}
          notify={notify}
        />
      )}

      {/* ========================================================= */}
      {/* MODAL 5: CONFIRMAR REVOCACIÓN / ELIMINACIÓN DE MEMBRESÍA */}
      {/* ========================================================= */}
      {userToRevoke && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-white/70 p-4 backdrop-blur-sm animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 border border-rose-100">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-950"><LocalizedText text={"Revocar acceso de usuario"} /></h3>
                <p className="text-xs text-slate-500"><LocalizedText text={"Esta acción desvincula la cuenta de esta entidad."} /></p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed"><LocalizedText text={"¿Estás seguro de que deseas revocar el acceso de "} /><strong className="text-slate-900">{userToRevoke.name}</strong><LocalizedText text={" a "} /><strong className="text-slate-900">{userToRevoke.orgName}</strong>?
            </p>
            <p className="text-[11px] text-slate-400 bg-slate-50 p-3 rounded-xl border border-slate-100"><LocalizedText text={"El usuario ya no podrá iniciar sesión en esta organización ni ver sus proyectos. Los registros históricos y transacciones previas se conservarán intactos."} /></p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToRevoke(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              ><LocalizedText text={"Cancelar"} /></button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleRevokeMembership(userToRevoke)}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-rose-700 disabled:opacity-50 transition"
              >
                {isPending ? <RefreshCcw className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                <span><LocalizedText text={"Revocar Acceso"} /></span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 6: MOSTRAR CLAVE TEMPORAL GENERADA */}
      {/* ========================================================= */}
      {createdTemporaryPassword && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-white/70 p-4 backdrop-blur-sm animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-amber-200 space-y-4">
            <div className="flex items-center gap-2 text-xs font-extrabold text-amber-900">
              <KeyRound className="h-4 w-4 text-amber-600" />
              <span><LocalizedText text={"Clave temporal generada"} /></span>
            </div>
            <p className="text-xs leading-relaxed text-slate-600"><LocalizedText text={"Entrega esta clave al usuario por un canal seguro (WhatsApp o llamada). Al iniciar sesión el sistema le pedirá cambiarla obligatoriamente."} /></p>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/50 p-3">
              <code className="min-w-0 break-all text-sm font-black text-slate-950">
                {createdTemporaryPassword}
              </code>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(createdTemporaryPassword);
                  notify("Clave temporal copiada al portapapeles.");
                }}
                className="shrink-0 rounded-lg bg-amber-500 px-3 py-2 text-[10px] font-extrabold text-slate-950 hover:bg-amber-600 transition"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setCreatedTemporaryPassword(null)}
              className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition"
            ><LocalizedText text={"Cerrar y continuar"} /></button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 7: MOSTRAR ENLACE DE INVITACIÓN GENERADO */}
      {/* ========================================================= */}
      {createdInviteUrl && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-white/70 p-4 backdrop-blur-sm animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-emerald-200 space-y-4">
            <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-900">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span><LocalizedText text={"Invitación lista para compartir"} /></span>
            </div>
            <p className="text-xs leading-relaxed text-slate-600"><LocalizedText text={"Enviamos el enlace al correo del miembro, pero también puedes copiarlo directamente aquí si deseas enviárselo por WhatsApp:"} /></p>
            <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
              <span className="truncate text-xs font-mono text-slate-800 select-all">
                {createdInviteUrl}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(createdInviteUrl);
                  notify("Enlace de invitación copiado.");
                }}
                className="shrink-0 rounded-lg bg-emerald-600 px-3 py-2 text-[10px] font-extrabold text-white hover:bg-emerald-700 transition"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setCreatedInviteUrl(null)}
              className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition"
            ><LocalizedText text={"Listo"} /></button>
          </div>
        </div>
      )}
    </div>
  );
}

// =========================================================================
// SUB-MODAL: NUEVO USUARIO
// =========================================================================
function CreateUserModal({
  projects,
  agencies,
  masterBrokers,
  developers,
  currentUserRole,
  onClose,
  onSuccess,
  notify,
}: {
  projects: ProjectOption[];
  agencies: AgencyOption[];
  masterBrokers: MasterBrokerOption[];
  developers: DeveloperOption[];
  currentUserRole: string;
  onClose: () => void;
  onSuccess: (result: { message?: string; temporaryPassword?: string; inviteUrl?: string; invitation?: InvitationResult }) => void;
  notify: (text: string, error?: boolean) => void;
}) {
  const [targetType, setTargetType] = useState<"master_broker" | "agency" | "developer">("master_broker");
  const [selectedOrgId, setSelectedOrgId] = useState<string>(masterBrokers[0]?.id ? String(masterBrokers[0].id) : "");
  const [role, setRole] = useState<UserRole>("master_broker_admin");
  const [provisionMode, setProvisionMode] = useState<"email" | "direct">("email");

  // User details
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>([]);

  const [isPending, startTransition] = useTransition();

  // Switch roles when target type changes
  const handleTargetTypeChange = (type: "master_broker" | "agency" | "developer") => {
    setTargetType(type);
    if (type === "master_broker") {
      setSelectedOrgId(masterBrokers[0]?.id ? String(masterBrokers[0].id) : "");
      setRole("master_broker_admin");
    } else if (type === "agency") {
      setSelectedOrgId(agencies[0]?.id ? String(agencies[0].id) : "");
      setRole("broker_agent");
    } else {
      setSelectedOrgId(developers[0]?.id ? String(developers[0].id) : "");
      setRole("developer_admin");
    }
  };

  const handleSubmit = () => {
    if (!email.trim() || !email.includes("@")) {
      notify("Ingresa un correo electrónico válido.", true);
      return;
    }
    if (provisionMode === "direct" && !name.trim()) {
      notify("Ingresa el nombre completo del usuario.", true);
      return;
    }
    if (!selectedOrgId) {
      notify("Selecciona la organización correspondiente.", true);
      return;
    }

    startTransition(async () => {
      if (provisionMode === "direct") {
        const res = await createDirectUserAction({
          email: email.trim(),
          displayName: name.trim() || email.split("@")[0],
          role,
          organizationId: Number(selectedOrgId),
          agencyOrganizationId: targetType === "agency" ? Number(selectedOrgId) : undefined,
          projectIds: selectedProjectIds,
        });

        if (res.error || !res.password) {
          notify(res.error || "No se pudo crear el usuario.", true);
          return;
        }

        onSuccess({
          message: "Usuario creado con éxito. Comparte la clave temporal.",
          temporaryPassword: res.password,
        });
      } else {
        const res = await createInvitationAction({
          email: email.trim(),
          role,
          organizationId: Number(selectedOrgId),
          agencyOrganizationId: targetType === "agency" ? Number(selectedOrgId) : undefined,
          projectIds: selectedProjectIds,
        });

        if (res.error) {
          notify(res.error, true);
          return;
        }

        onSuccess({
          message: "Invitación emitida y enviada al correo del miembro.",
          inviteUrl: res.invitation?.inviteUrl,
          invitation: res.invitation,
        });
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-white/70 p-4 backdrop-blur-sm animate-in fade-in zoom-in-95" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-950"><LocalizedText text={"Alta de Nuevo Usuario"} /></h3>
            <p className="text-xs text-slate-500 mt-0.5"><LocalizedText text={"Asigna el usuario directamente a su entidad y define su método de acceso."} /></p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Paso 1: Tipo de Entidad */}
        <div>
          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-2"><LocalizedText text={"1. ¿A qué entidad pertenecerá?"} /></label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleTargetTypeChange("master_broker")}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition ${
                targetType === "master_broker"
                  ? "border-blue-500 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <ShieldCheck className="h-5 w-5 mb-1 text-blue-600" />
              <span className="text-xs font-bold"><LocalizedText text={"Master Broker"} /></span>
              <span className="text-[9px] text-slate-400"><LocalizedText text={"Equipo principal"} /></span>
            </button>

            <button
              type="button"
              onClick={() => handleTargetTypeChange("agency")}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition ${
                targetType === "agency"
                  ? "border-emerald-500 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-500/20"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Building2 className="h-5 w-5 mb-1 text-emerald-600" />
              <span className="text-xs font-bold"><LocalizedText text={"Agencia Aliada"} /></span>
              <span className="text-[9px] text-slate-400"><LocalizedText text={"Inmobiliarias"} /></span>
            </button>

            <button
              type="button"
              onClick={() => handleTargetTypeChange("developer")}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition ${
                targetType === "developer"
                  ? "border-amber-500 bg-amber-50/70 text-amber-900 ring-2 ring-amber-500/20"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <HardHat className="h-5 w-5 mb-1 text-amber-600" />
              <span className="text-xs font-bold"><LocalizedText text={"Desarrollador"} /></span>
              <span className="text-[9px] text-slate-400"><LocalizedText text={"Constructora"} /></span>
            </button>
          </div>
        </div>

        {/* Selección de la Organización Específica */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1"><LocalizedText text={"Organización específica *"} /></label>
          {targetType === "master_broker" && (
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-blue-500 font-semibold"
            >
              {masterBrokers.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          )}

          {targetType === "agency" && (
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-emerald-500 font-semibold"
            >
              {!selectedOrgId && <option value=""><LocalizedText text={"-- Selecciona una agencia --"} /></option>}
              {agencies.length === 0 && <option value=""><LocalizedText text={"No hay agencias creadas"} /></option>}
              {agencies.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          )}

          {targetType === "developer" && (
            <select
              value={selectedOrgId}
              onChange={(e) => setSelectedOrgId(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-amber-500 font-semibold"
            >
              {developers.length === 0 && <option value=""><LocalizedText text={"No hay desarrolladores registrados"} /></option>}
              {developers.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Rol Asignado */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1"><LocalizedText text={"Rol de Acceso *"} /></label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-blue-500 font-semibold"
          >
            {targetType === "master_broker" && (
              <>
                <option value="master_broker_admin"><LocalizedText text={"Master Broker Admin (Administrador comercial)"} /></option>
                <option value="master_broker_operations"><LocalizedText text={"Operaciones Master Broker"} /></option>
                {currentUserRole === "super_admin" && (
                  <option value="super_admin"><LocalizedText text={"Superadministrador (Acceso total plataforma)"} /></option>
                )}
              </>
            )}

            {targetType === "agency" && (
              <>
                <option value="broker_agent"><LocalizedText text={"Vendedor / Asesor Inmobiliario"} /></option>
                <option value="agency_admin"><LocalizedText text={"Administrador de la Agencia"} /></option>
                <option value="agency_support"><LocalizedText text={"Soporte de Agencia"} /></option>
              </>
            )}

            {targetType === "developer" && (
              <>
                <option value="developer_admin"><LocalizedText text={"Desarrollador Admin (Control de inventario)"} /></option>
                <option value="developer_viewer"><LocalizedText text={"Consulta Desarrollador (Solo lectura)"} /></option>
              </>
            )}
          </select>
        </div>

        {/* Paso 2: Método de Alta */}
        <div>
          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5"><LocalizedText text={"2. Método de entrega de acceso"} /></label>
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setProvisionMode("email")}
              className={`rounded-lg py-2 text-xs font-bold transition ${
                provisionMode === "email" ? "bg-white text-blue-700 shadow-xs" : "text-slate-500"
              }`}
            ><LocalizedText text={"✉️ Enviar invitación por correo"} /></button>
            <button
              type="button"
              onClick={() => setProvisionMode("direct")}
              className={`rounded-lg py-2 text-xs font-bold transition ${
                provisionMode === "direct" ? "bg-white text-blue-700 shadow-xs" : "text-slate-500"
              }`}
            ><LocalizedText text={"🔑 Clave temporal directa"} /></button>
          </div>
        </div>

        {/* Paso 3: Datos del Usuario */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1"><LocalizedText text={"Nombre completo "} />{provisionMode === "direct" ? "*" : "(opcional)"}
            </label>
            <UITranslationBoundary attributes={["placeholder"]}><input
              type="text"
              placeholder="Ej. Juan Pérez"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 px-3.5 text-xs outline-none focus:border-blue-500 font-bold"
            /></UITranslationBoundary>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1"><LocalizedText text={"Correo electrónico oficial *"} /></label>
            <UITranslationBoundary attributes={["placeholder"]}><input
              type="email"
              placeholder="usuario@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 px-3.5 text-xs outline-none focus:border-blue-500 font-bold"
            /></UITranslationBoundary>
          </div>
        </div>

        {/* Proyectos Asignados */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1"><LocalizedText text={"Proyectos autorizados (opcional)"} /></label>
          <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto rounded-xl border border-slate-200 p-2.5 bg-slate-50/50">
            {projects.map((p) => {
              const checked = selectedProjectIds.includes(p.id);
              return (
                <label key={p.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedProjectIds((prev) => [...prev, p.id]);
                      else setSelectedProjectIds((prev) => prev.filter((id) => id !== p.id));
                    }}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="truncate">{p.name}</span>
                </label>
              );
            })}
          </div>
          <p className="mt-1 text-[10px] text-slate-400"><LocalizedText text={"Si no seleccionas ninguno, tendrá acceso a todos los proyectos autorizados para su organización."} /></p>
        </div>

        {/* Footer actions */}
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
          ><LocalizedText text={"Cancelar"} /></button>
          <button
            type="button"
            disabled={isPending}
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-extrabold text-white hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {isPending ? <RefreshCcw className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
            <span>{provisionMode === "direct" ? <LocalizedText text={"Crear cuenta ahora"} /> : <LocalizedText text={"Enviar invitación"} />}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// SUB-MODAL: NUEVA AGENCIA INMOBILIARIA
// =========================================================================
function CreateAgencyModal({
  projects,
  onClose,
  onSuccess,
  notify,
}: {
  projects: ProjectOption[];
  onClose: () => void;
  onSuccess: (newAgency: AgencyOption, inviteUrl?: string) => void;
  notify: (text: string, error?: boolean) => void;
}) {
  const [agencyName, setAgencyName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminName, setAdminName] = useState("");
  const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>([]);

  const [isPending, startTransition] = useTransition();

  const handleCreate = () => {
    if (!agencyName.trim()) {
      notify("Ingresa el nombre comercial de la inmobiliaria.", true);
      return;
    }

    startTransition(async () => {
      const res = await createAgencyQuickAction({
        name: agencyName.trim(),
        contactEmail: contactEmail.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        initialAdminEmail: adminEmail.trim() || undefined,
        initialAdminName: adminName.trim() || undefined,
        projectIds: selectedProjectIds,
      });

      if (res.error || !res.organization) {
        notify(res.error || "No se pudo crear la agencia.", true);
        return;
      }

      onSuccess(res.organization, res.inviteUrl);
    });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-white/70 p-4 backdrop-blur-sm animate-in fade-in zoom-in-95" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-emerald-200 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-950"><LocalizedText text={"Alta de Inmobiliaria Aliada"} /></h3>
              <p className="text-xs text-slate-500"><LocalizedText text={"Registra una nueva agencia y asigna a su administrador."} /></p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1"><LocalizedText text={"Nombre Comercial de la Agencia *"} /></label>
            <UITranslationBoundary attributes={["placeholder"]}><input
              type="text"
              placeholder="Ej. Blue Land Properties / Realty Network"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-emerald-500 font-bold"
              autoFocus
            /></UITranslationBoundary>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1"><LocalizedText text={"Correo de contacto oficial"} /></label>
              <UITranslationBoundary attributes={["placeholder"]}><input
                type="email"
                placeholder="contacto@inmobiliaria.com"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-emerald-500"
              /></UITranslationBoundary>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1"><LocalizedText text={"Teléfono / WhatsApp"} /></label>
              <UITranslationBoundary attributes={["placeholder"]}><input
                type="text"
                placeholder="+1 (809) 000-0000"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-emerald-500"
              /></UITranslationBoundary>
            </div>
          </div>

          {/* Administrador Inicial Opcional */}
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-3">
            <p className="text-xs font-extrabold text-emerald-900 flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-emerald-600" />
              <span><LocalizedText text={"Administrador Inicial de la Agencia (Opcional)"} /></span>
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1"><LocalizedText text={"Nombre del Administrador"} /></label>
                <UITranslationBoundary attributes={["placeholder"]}><input
                  type="text"
                  placeholder="Ej. Carlos Santana"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="h-9 w-full rounded-lg border border-emerald-200 bg-white px-3 text-xs outline-none focus:border-emerald-500 font-bold"
                /></UITranslationBoundary>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1"><LocalizedText text={"Correo del Administrador"} /></label>
                <UITranslationBoundary attributes={["placeholder"]}><input
                  type="email"
                  placeholder="admin@inmobiliaria.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="h-9 w-full rounded-lg border border-emerald-200 bg-white px-3 text-xs outline-none focus:border-emerald-500 font-bold"
                /></UITranslationBoundary>
              </div>
            </div>
            <p className="text-[10px] text-emerald-800"><LocalizedText text={"Si indicas un correo, se enviará automáticamente una invitación para que cree su contraseña y comience a operar su agencia."} /></p>
          </div>

          {/* Proyectos Autorizados */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1"><LocalizedText text={"Proyectos autorizados para la agencia"} /></label>
            <div className="grid grid-cols-2 gap-2 max-h-28 overflow-y-auto rounded-xl border border-slate-200 p-2.5">
              {projects.map((p) => {
                const checked = selectedProjectIds.includes(p.id);
                return (
                  <label key={p.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedProjectIds((prev) => [...prev, p.id]);
                        else setSelectedProjectIds((prev) => prev.filter((id) => id !== p.id));
                      }}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="truncate">{p.name}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
          ><LocalizedText text={"Cancelar"} /></button>
          <button
            type="button"
            disabled={isPending || !agencyName.trim()}
            onClick={handleCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-extrabold text-white hover:bg-emerald-700 disabled:opacity-50 transition"
          >
            {isPending ? <RefreshCcw className="h-3.5 w-3.5 animate-spin" /> : <Building2 className="h-3.5 w-3.5" />}
            <span><LocalizedText text={"Registrar Agencia"} /></span>
          </button>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// SUB-MODAL: ASIGNAR ACCESO A MASTER BROKER
// =========================================================================
function AssignMasterBrokerModal({
  users,
  masterBrokers,
  onClose,
  onSuccess,
  notify,
}: {
  users: ManagedUser[];
  masterBrokers: MasterBrokerOption[];
  onClose: () => void;
  onSuccess: () => void;
  notify: (text: string, error?: boolean) => void;
}) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedMbId, setSelectedMbId] = useState(masterBrokers[0]?.id ? String(masterBrokers[0].id) : "");
  const [role, setRole] = useState<UserRole>("master_broker_admin");

  const [isPending, startTransition] = useTransition();

  // Deduplicate users for dropdown
  const uniqueUsers = useMemo(() => {
    const map = new Map<string, ManagedUser>();
    users.forEach((u) => {
      if (!map.has(u.userId)) map.set(u.userId, u);
    });
    return Array.from(map.values());
  }, [users]);

  const handleAssign = () => {
    if (!selectedUserId || !selectedMbId) {
      notify("Selecciona el usuario y la organización Master Broker.", true);
      return;
    }

    startTransition(async () => {
      const res = await addExistingMembershipAction({
        userId: selectedUserId,
        organizationId: Number(selectedMbId),
        role,
      });

      if (res.error) {
        notify(res.error, true);
        return;
      }

      onSuccess();
    });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-white/70 p-4 backdrop-blur-sm animate-in fade-in zoom-in-95" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-blue-200 space-y-4">
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700 border border-blue-100">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-950"><LocalizedText text={"Acceso a Master Broker"} /></h3>
              <p className="text-xs text-slate-500"><LocalizedText text={"Otorga privilegios directos a un usuario existente."} /></p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1"><LocalizedText text={"Selecciona el usuario *"} /></label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-blue-500 font-semibold"
            >
              <option value=""><LocalizedText text={"Selecciona una persona..."} /></option>
              {uniqueUsers.map((u) => (
                <option key={u.userId} value={u.userId}>
                  {u.name} — {u.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1"><LocalizedText text={"Organización Master Broker *"} /></label>
            <select
              value={selectedMbId}
              onChange={(e) => setSelectedMbId(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-blue-500 font-bold"
            >
              {masterBrokers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1"><LocalizedText text={"Rol de Administración *"} /></label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-blue-500 font-semibold"
            >
              <option value="master_broker_admin"><LocalizedText text={"Master Broker Admin (Control comercial completo)"} /></option>
              <option value="master_broker_operations"><LocalizedText text={"Operaciones Master Broker"} /></option>
              <option value="super_admin"><LocalizedText text={"Superadministrador (Acceso total)"} /></option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
          ><LocalizedText text={"Cancelar"} /></button>
          <button
            type="button"
            disabled={isPending || !selectedUserId}
            onClick={handleAssign}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-extrabold text-white hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {isPending ? <RefreshCcw className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
            <span><LocalizedText text={"Conceder Acceso"} /></span>
          </button>
        </div>
      </div>
    </div>
  );
}

// =========================================================================
// SUB-MODAL: EDITAR USUARIO (UNIFICADO)
// =========================================================================
function EditUserModal({
  user,
  projects,
  agencies,
  masterBrokers,
  developers,
  currentUserRole,
  onClose,
  onSuccess,
  notify,
}: {
  user: ManagedUser;
  projects: ProjectOption[];
  agencies: AgencyOption[];
  masterBrokers: MasterBrokerOption[];
  developers: DeveloperOption[];
  currentUserRole: string;
  onClose: () => void;
  onSuccess: (updatedUser: ManagedUser) => void;
  notify: (text: string, error?: boolean) => void;
}) {
  const [displayName, setDisplayName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || "");
  const [role, setRole] = useState<UserRole>(user.role as UserRole);
  const [orgId, setOrgId] = useState<number>(user.orgId || masterBrokers[0]?.id || 1);
  const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string>(user.avatarUrl || "");

  // Socials for brokers
  const [instagramUrl, setInstagramUrl] = useState(user.instagramUrl || "");
  const [facebookUrl, setFacebookUrl] = useState(user.facebookUrl || "");
  const [linkedinUrl, setLinkedinUrl] = useState(user.linkedinUrl || "");
  const [tiktokUrl, setTiktokUrl] = useState(user.tiktokUrl || "");
  const [websiteUrl, setWebsiteUrl] = useState(user.websiteUrl || "");

  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    if (!displayName.trim()) {
      notify("El nombre es obligatorio.", true);
      return;
    }

    startTransition(async () => {
      const res = await updateUserMembershipAction({
        membershipId: user.id,
        displayName: displayName.trim(),
        phone: phone.trim() || undefined,
        role,
        organizationId: currentUserRole === "super_admin" ? orgId : undefined,
        projectIds: selectedProjectIds.length > 0 ? selectedProjectIds : undefined,
        avatarUrl,
        instagramUrl,
        facebookUrl,
        linkedinUrl,
        tiktokUrl,
        websiteUrl,
      });

      if (res.error) {
        notify(res.error, true);
        return;
      }

      // Also trigger seller dossier refresh if it was a broker agent
      if (role === "broker_agent") {
        await refreshSellerDossierAction(user.id);
      }

      // Find new organization name
      const allOrgs = [...masterBrokers, ...agencies, ...developers];
      const newOrg = allOrgs.find((o) => o.id === orgId);

      onSuccess({
        ...user,
        name: displayName.trim(),
        phone: phone.trim(),
        role,
        orgId,
        orgName: newOrg ? newOrg.name : user.orgName,
        avatarUrl,
        instagramUrl,
        facebookUrl,
        linkedinUrl,
        tiktokUrl,
        websiteUrl,
      });
    });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-white/70 p-4 backdrop-blur-sm animate-in fade-in zoom-in-95" role="dialog" aria-modal="true">
      <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-950"><LocalizedText text={"Editar Usuario: "} />{user.name}</h3>
            <p className="text-xs text-slate-500"><LocalizedText text={"Modifica datos de perfil, rol u organización asignada."} /></p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Email Informativo */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block"><LocalizedText text={"Correo Electrónico"} /></span>
              <span className="font-mono font-bold text-slate-800">{user.email}</span>
            </div>
            <span className="rounded-lg bg-slate-200/60 px-2 py-0.5 text-[9px] font-extrabold text-slate-600 uppercase"><LocalizedText text={"ID #"} />{user.id}
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1"><LocalizedText text={"Nombre completo *"} /></label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-blue-500 font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1"><LocalizedText text={"Teléfono / WhatsApp"} /></label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1"><LocalizedText text={"Rol de Acceso *"} /></label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-blue-500 font-semibold"
              >
                <UITranslationBoundary attributes={["label"]}><optgroup label="Master Broker (Nosotros)">
                  <option value="master_broker_admin"><LocalizedText text={"Master Broker Admin"} /></option>
                  <option value="master_broker_operations"><LocalizedText text={"Operaciones Master Broker"} /></option>
                  {currentUserRole === "super_admin" && <option value="super_admin"><LocalizedText text={"Superadministrador"} /></option>}
                </optgroup></UITranslationBoundary>
                <UITranslationBoundary attributes={["label"]}><optgroup label="Agencias Inmobiliarias">
                  <option value="broker_agent"><LocalizedText text={"Vendedor / Asesor Inmobiliario"} /></option>
                  <option value="agency_admin"><LocalizedText text={"Administrador de Agencia"} /></option>
                  <option value="agency_support"><LocalizedText text={"Soporte de Agencia"} /></option>
                </optgroup></UITranslationBoundary>
                <UITranslationBoundary attributes={["label"]}><optgroup label="Desarrolladores">
                  <option value="developer_admin"><LocalizedText text={"Desarrollador Admin"} /></option>
                  <option value="developer_viewer"><LocalizedText text={"Consulta Desarrollador"} /></option>
                </optgroup></UITranslationBoundary>
              </select>
            </div>

            {currentUserRole === "super_admin" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1"><LocalizedText text={"Organización Asignada"} /></label>
                <select
                  value={orgId}
                  onChange={(e) => setOrgId(Number(e.target.value))}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none focus:border-blue-500"
                >
                  <UITranslationBoundary attributes={["label"]}><optgroup label="Master Brokers">
                    {masterBrokers.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </optgroup></UITranslationBoundary>
                  <UITranslationBoundary attributes={["label"]}><optgroup label="Agencias Inmobiliarias Aliadas">
                    {agencies.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </optgroup></UITranslationBoundary>
                  <UITranslationBoundary attributes={["label"]}><optgroup label="Desarrolladores">
                    {developers.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </optgroup></UITranslationBoundary>
                </select>
              </div>
            )}
          </div>

          {/* Socials & Dossier if broker agent */}
          {role === "broker_agent" && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
              <span className="text-xs font-extrabold text-slate-900 block"><LocalizedText text={"Datos Comerciales para Dossiers &amp; Propuestas"} /></span>
              <AvatarUploadInput currentUrl={avatarUrl || null} onUrlChange={setAvatarUrl} membershipId={user.id} />
              <div className="grid sm:grid-cols-2 gap-2">
                <UITranslationBoundary attributes={["placeholder"]}><input
                  placeholder="Instagram URL"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs"
                /></UITranslationBoundary>
                <UITranslationBoundary attributes={["placeholder"]}><input
                  placeholder="LinkedIn URL"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs"
                /></UITranslationBoundary>
                <UITranslationBoundary attributes={["placeholder"]}><input
                  placeholder="Facebook URL"
                  value={facebookUrl}
                  onChange={(e) => setFacebookUrl(e.target.value)}
                  className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs"
                /></UITranslationBoundary>
                <UITranslationBoundary attributes={["placeholder"]}><input
                  placeholder="Web Personal"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="h-8 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs"
                /></UITranslationBoundary>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
          ><LocalizedText text={"Cancelar"} /></button>
          <button
            type="button"
            disabled={isPending}
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-extrabold text-white hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {isPending ? <RefreshCcw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            <span><LocalizedText text={"Guardar Cambios"} /></span>
          </button>
        </div>
      </div>
    </div>
  );
}

function AvatarUploadInput({
  currentUrl,
  onUrlChange,
  membershipId,
}: {
  currentUrl: string | null;
  onUrlChange: (url: string) => void;
  membershipId: number;
}) {
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    const formData = new FormData();
    formData.set("avatarFile", file);
    formData.set("membershipId", String(membershipId));

    const res = await uploadAgentAvatarAction(formData);
    setUploading(false);
    if (res.url) {
      onUrlChange(res.url);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {preview ? (
        <UITranslationBoundary attributes={["alt"]}><img src={preview} alt="Avatar" className="h-12 w-12 shrink-0 rounded-full object-cover border border-slate-200" /></UITranslationBoundary>
      ) : (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-500"><LocalizedText text={"Sin foto"} /></span>
      )}
      <div className="flex-1">
        <input
          type="file"
          accept="image/*"
          onChange={handleFile}
          disabled={uploading}
          className="block w-full text-xs text-slate-500 file:mr-2 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-blue-700 hover:file:bg-blue-100"
        />
        <p className="mt-0.5 text-[10px] text-slate-400">
          {uploading ? "Subiendo foto..." : <LocalizedText text={"JPG, PNG. Máx 5 MB."} />}
        </p>
      </div>
    </div>
  );
}
