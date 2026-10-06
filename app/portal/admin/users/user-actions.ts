"use server";

import crypto from "crypto";
import type { Database } from '@/types/database';
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser, type UserRole } from "@/lib/auth/get-user";
import { canInviteRole, canManageMembershipStatus, hasCapability, roleLabels } from "@/lib/auth/permissions";
import { sendInvitationEmail, sendPasswordSetupEmail } from "@/lib/email/mailer";

export interface InvitationResult {
  id: number;
  email: string;
  role: string;
  status: string;
  token: string;
  inviteUrl: string;
  organizationName: string;
  expiresAt: string;
  createdAt: string;
  acceptedAt?: string | null;
  openedAt?: string | null;
  emailSentAt?: string | null;
  emailLastSentAt?: string | null;
  emailSent?: boolean;
  emailError?: string;
}

async function getAppOrigin() {
  const headerStore = await headers();
  const origin = headerStore.get("origin");
  if (origin) return origin;

  const host = headerStore.get("x-forwarded-host") || headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") || "https";
  if (host) return `${protocol}://${host}`;

  return process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

function createTemporaryPassword() {
  return `${crypto.randomBytes(7).toString("base64url")}Aa!9`;
}

async function grantProjectAccess(admin: ReturnType<typeof createAdminClient>, membershipId: number, projectIds: number[]) {
  if (!projectIds.length) return null;
  const { data: projects, error: projectsError } = await admin
    .from("projects")
    .select("id, organization_id")
    .in("id", projectIds);
  if (projectsError) return projectsError;
  const grants = (projects || []).map((project) => ({
    organization_id: project.organization_id,
    project_id: project.id,
    grantee_membership_id: membershipId,
    access_level: "sell" as const,
  }));
  if (!grants.length) return null;
  const { data: existing, error: existingError } = await admin
    .from("project_access")
    .select("project_id")
    .eq("grantee_membership_id", membershipId)
    .in("project_id", grants.map((grant) => grant.project_id));
  if (existingError) return existingError;
  const current = new Set((existing || []).map((item) => item.project_id));
  const missing = grants.filter((grant) => !current.has(grant.project_id));
  if (!missing.length) return null;
  const { error } = await admin.from("project_access").insert(missing);
  return error;
}

function organizationSlug(value: string) {
  const normalized = value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return normalized || "agencia";
}

async function createAgencyOrganization(admin: ReturnType<typeof createAdminClient>, name: string) {
  const cleanName = name.trim();
  if (cleanName.length < 2) return { error: "Indica el nombre de la agencia." };
  const baseSlug = organizationSlug(cleanName);
  const codePrefix = cleanName
    .toUpperCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .padEnd(2, "X");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const suffix = attempt === 0 ? "" : `-${crypto.randomBytes(3).toString("hex")}`;
    const tempCode = `${codePrefix}-T${Date.now().toString(36)}${suffix}`;
    const { data, error } = await admin
      .from("organizations")
      .insert({ name: cleanName, slug: `${baseSlug}${suffix}`, kind: "agency", status: "active", public_code: tempCode })
      .select("id, name")
      .single();
    if (!error && data) {
      await admin.from("organizations").update({ public_code: `${codePrefix}-${String(data.id).padStart(6, "0")}` }).eq("id", data.id);
      return { organization: data };
    }
    if (!error?.message.toLowerCase().includes("duplicate")) return { error: error?.message || "No se pudo crear la agencia." };
  }
  return { error: "No se pudo generar una identificacion unica para la agencia." };
}

async function resolveAgencyOrganization(
  admin: ReturnType<typeof createAdminClient>,
  payload: { agencyOrganizationId?: number; agencyName?: string }
) {
  if (payload.agencyOrganizationId) {
    const { data, error } = await admin
      .from("organizations")
      .select("id, name, kind, status")
      .eq("id", payload.agencyOrganizationId)
      .maybeSingle();
    if (error || !data || data.kind !== "agency" || data.status !== "active") {
      return { error: "Selecciona una agencia activa valida." };
    }
    return { organization: data };
  }
  return createAgencyOrganization(admin, payload.agencyName || "");
}

export async function createDirectUserAction(payload: {
  email: string;
  displayName: string;
  role: UserRole;
  projectIds?: number[];
  organizationId?: number;
  agencyOrganizationId?: number;
  agencyName?: string;
}): Promise<{ success?: boolean; password?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const currentUser = await getCurrentUser(supabase);
    if (!currentUser || !hasCapability(currentUser.role, "manage_agency_users")) return { error: "No tienes autorización para crear usuarios." };
    if (!canInviteRole(currentUser.role, payload.role)) return { error: "Tu perfil no puede crear ese rol." };
    const email = payload.email.trim().toLowerCase();
    const displayName = payload.displayName.trim();
    if (!email || !email.includes("@") || !displayName) return { error: "Indica nombre y correo válidos." };
    const admin = createAdminClient();
    let createdAgencyId: number | null = null;
    let organizationId = currentUser.role === "super_admin" && payload.organizationId ? payload.organizationId : currentUser.organization.id;
    if (payload.role === "agency_admin") {
      if (currentUser.role !== "super_admin") return { error: "Solo el panel de plataforma puede crear una agencia nueva." };
      const resolved = await resolveAgencyOrganization(admin, payload);
      if (resolved.error || !resolved.organization) return { error: resolved.error || "No se pudo definir la agencia." };
      organizationId = resolved.organization.id;
      if (!payload.agencyOrganizationId) createdAgencyId = resolved.organization.id;
    }
    const password = createTemporaryPassword();
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName },
    });
    if (createError || !created.user) {
      if (createdAgencyId) await admin.from("organizations").update({ status: "archived" }).eq("id", createdAgencyId);
      return { error: createError?.message.includes("already") ? "Este correo ya tiene una cuenta. Usa Restablecer acceso." : createError?.message || "No se pudo crear la cuenta." };
    }

    const { error: profileError } = await admin.from("profiles").upsert({
      user_id: created.user.id,
      email,
      display_name: displayName,
      must_change_password: true,
      updated_at: new Date().toISOString(),
    } as never, { onConflict: "user_id" });
    if (profileError) return { error: profileError.message };

    const { data: existingPrimary } = await admin.from("memberships").select("id").eq("user_id", created.user.id).eq("status", "active").limit(1).maybeSingle();
    const { data: membership, error: membershipError } = await admin.from("memberships").upsert({
      organization_id: organizationId,
      user_id: created.user.id,
      role: payload.role,
      status: "active",
      is_primary: !existingPrimary,
      updated_at: new Date().toISOString(),
    }, { onConflict: "organization_id,user_id" }).select("id").single();
    if (membershipError || !membership) return { error: membershipError?.message || "No se pudo crear la membresía." };
    const grantError = await grantProjectAccess(admin, membership.id, payload.projectIds || []);
    if (grantError) return { error: grantError.message };
    revalidatePath("/portal/admin/users");
    return { success: true, password };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function addExistingMembershipAction(payload: {
  userId: string;
  organizationId: number;
  role: UserRole;
}): Promise<{ success?: boolean; membershipId?: number; error?: string }> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'super_admin') {
      return { error: 'Solo el superadministrador puede agregar miembros a otro Master Broker.' };
    }
    const admin = createAdminClient();
    const { data: organization, error: organizationError } = await admin
      .from('organizations')
      .select('id, name, kind, status')
      .eq('id', payload.organizationId)
      .maybeSingle();
    if (organizationError || !organization || organization.status !== 'active') {
      return { error: 'Selecciona una organización activa.' };
    }
    const { data: existing } = await admin
      .from('memberships')
      .select('id, status')
      .eq('organization_id', organization.id)
      .eq('user_id', payload.userId)
      .maybeSingle();
    if (existing?.status === 'active') return { error: 'Este usuario ya tiene acceso activo a ese Master Broker.' };
    const { data: membership, error: membershipError } = await admin
      .from('memberships')
      .upsert({ organization_id: organization.id, user_id: payload.userId, role: payload.role, status: 'active', is_primary: false, updated_at: new Date().toISOString() }, { onConflict: 'organization_id,user_id' })
      .select('id')
      .single();
    if (membershipError || !membership) return { error: membershipError?.message || 'No se pudo crear la membresía.' };
    revalidatePath('/portal/admin/users');
    revalidatePath('/portal/admin/brokers');
    return { success: true, membershipId: membership.id };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

export async function sendPasswordSetupEmailAction(membershipId: number): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const currentUser = await getCurrentUser(supabase);
    if (!currentUser || !hasCapability(currentUser.role, "manage_agency_users")) return { error: "No tienes autorización para restablecer accesos." };
    const admin = createAdminClient();
    const { data: membership, error } = await admin.from("memberships").select("id, organization_id, role, user_id, profile:profiles(email, display_name)").eq("id", membershipId).maybeSingle();
    if (error || !membership) return { error: error?.message || "Usuario no encontrado." };
    if (membership.user_id === currentUser.id) return { error: "Usa tu propia opción de recuperación de contraseña." };
    if (currentUser.role !== "super_admin" && membership.organization_id !== currentUser.organization.id) return { error: "Solo puedes administrar usuarios de tu organización." };
    if (!canManageMembershipStatus(currentUser.role, membership.role)) return { error: "Tu perfil no puede restablecer este acceso." };
    const profile = membership.profile as unknown as { email?: string; display_name?: string } | null;
    if (!profile?.email) return { error: "Este usuario no tiene correo configurado." };
    const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: "recovery", email: profile.email, options: { redirectTo: `${await getAppOrigin()}/auth/update-password` } });
    if (linkError || !link?.properties?.action_link) return { error: linkError?.message || "No se pudo generar el enlace seguro." };
    await admin.from("profiles").update({ must_change_password: true, updated_at: new Date().toISOString() } as never).eq("user_id", membership.user_id);
    await sendPasswordSetupEmail({ to: profile.email, setupUrl: link.properties.action_link, organizationName: currentUser.organization.name, recipientName: profile.display_name });
    revalidatePath("/portal/admin/users");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function resetTemporaryPasswordAction(membershipId: number): Promise<{ success?: boolean; password?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const currentUser = await getCurrentUser(supabase);
    if (!currentUser || !hasCapability(currentUser.role, "manage_agency_users")) return { error: "No tienes autorización para restablecer accesos." };
    const admin = createAdminClient();
    const { data: membership, error } = await admin.from("memberships").select("id, organization_id, role, user_id").eq("id", membershipId).maybeSingle();
    if (error || !membership) return { error: error?.message || "Usuario no encontrado." };
    if (membership.user_id === currentUser.id) return { error: "No puedes restablecer tu propia contraseña desde este panel." };
    if (currentUser.role !== "super_admin" && membership.organization_id !== currentUser.organization.id) return { error: "Solo puedes administrar usuarios de tu organización." };
    if (!canManageMembershipStatus(currentUser.role, membership.role)) return { error: "Tu perfil no puede restablecer este acceso." };
    const password = createTemporaryPassword();
    const { error: passwordError } = await admin.auth.admin.updateUserById(membership.user_id, { password });
    if (passwordError) return { error: passwordError.message };
    await admin.from("profiles").update({ must_change_password: true, updated_at: new Date().toISOString() } as never).eq("user_id", membership.user_id);
    revalidatePath("/portal/admin/users");
    return { success: true, password };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function createInvitationAction(payload: {
  email: string;
  role: UserRole;
  inviteeName?: string;
  organizationId?: number;
  projectIds?: number[];
  agencyOrganizationId?: number;
  agencyName?: string;
}): Promise<{ success?: boolean; invitation?: InvitationResult; error?: string }> {
  try {
    const supabase = await createClient();
    const currentUser = await getCurrentUser(supabase);

    if (!currentUser) {
      return { error: "Debes iniciar sesión para emitir invitaciones." };
    }

    if (!hasCapability(currentUser.role, "manage_agency_users")) {
      return { error: "No tienes autorización para invitar miembros a la plataforma." };
    }
    if (!canInviteRole(currentUser.role, payload.role)) {
      return { error: "Tu perfil no puede invitar miembros con ese rol." };
    }

    const email = payload.email.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      return { error: "Proporciona un correo electrónico válido." };
    }

    let targetOrgId =
      currentUser.role === "super_admin" && payload.organizationId
        ? payload.organizationId
        : currentUser.organization.id;

    const admin = createAdminClient();
    if (payload.role === "agency_admin") {
      if (currentUser.role !== "super_admin") return { error: "Solo el panel de plataforma puede crear una agencia nueva." };
      const resolved = await resolveAgencyOrganization(admin, payload);
      if (resolved.error || !resolved.organization) return { error: resolved.error || "No se pudo definir la agencia." };
      targetOrgId = resolved.organization.id;
    }

    // Check if user is already an active member of this organization
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("email", email)
      .maybeSingle();

    if (existingProfile?.user_id) {
      const { data: existingMembership } = await supabase
        .from("memberships")
        .select("id, status")
        .eq("organization_id", targetOrgId)
        .eq("user_id", existingProfile.user_id)
        .maybeSingle();

      if (existingMembership && existingMembership.status === "active") {
        return { error: "Este usuario ya cuenta con una membresía activa en la organización." };
      }
    }

    // Check if there is an existing pending invite; if so revoke it
    await admin
      .from("invitations")
      .update({ status: "revoked" })
      .eq("organization_id", targetOrgId)
      .eq("email", email)
      .eq("status", "pending");

    // Generate secure token (48 hex chars)
    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    const { data: inserted, error: insertError } = await admin
      .from("invitations")
      .insert({
        organization_id: targetOrgId,
        email,
        role: payload.role,
        invited_by: currentUser.id,
        token,
        project_ids: payload.projectIds || [],
        status: "pending",
        expires_at: expiresAt,
      })
      .select(`
        id, email, role, status, token, expires_at, created_at,
        organization:organizations(name)
      `)
      .single();

    if (insertError || !inserted) {
      return { error: insertError?.message || "No se pudo crear la invitación." };
    }

    revalidatePath("/portal/admin/users");

    const orgObj = inserted.organization as unknown as { name?: string } | null;
    const organizationName = orgObj?.name || currentUser.organization.name;
    const baseInviteUrl = `${await getAppOrigin()}/invite/${inserted.token}`;
    const inviteeName = payload.inviteeName?.trim();
    const inviteUrl = inviteeName
      ? `${baseInviteUrl}?name=${encodeURIComponent(inviteeName)}`
      : baseInviteUrl;
    let emailSent = false;
    let emailError: string | undefined;

    try {
      await sendInvitationEmail({
        to: inserted.email,
        inviteUrl,
        organizationName,
        roleLabel: roleLabels[inserted.role as UserRole] || inserted.role,
        invitedByName: currentUser.displayName || currentUser.email,
        expiresAt: inserted.expires_at,
      });
      emailSent = true;
      const sentAt = new Date().toISOString();
      await admin
        .from("invitations")
        .update({ email_sent_at: sentAt, email_last_sent_at: sentAt })
        .eq("id", inserted.id);
    } catch (mailErr) {
      console.warn("sendInvitationEmail warning:", mailErr);
      emailError = "La invitación fue creada, pero el correo no pudo enviarse. Copia el enlace y compártelo manualmente.";
    }

    return {
      success: true,
      invitation: {
        id: inserted.id,
        email: inserted.email,
        role: inserted.role,
        status: inserted.status,
        token: inserted.token,
        inviteUrl,
        organizationName,
        expiresAt: inserted.expires_at,
        createdAt: inserted.created_at,
        acceptedAt: null,
        openedAt: null,
        emailSentAt: emailSent ? new Date().toISOString() : null,
        emailLastSentAt: emailSent ? new Date().toISOString() : null,
        emailSent,
        emailError,
      },
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function getInvitationsListAction(
  organizationId?: number
): Promise<{ data: InvitationResult[]; error: string | null }> {
  try {
    const supabase = await createClient();
    const currentUser = await getCurrentUser(supabase);

    if (!currentUser) {
      return { data: [], error: "No autorizado." };
    }

    if (!hasCapability(currentUser.role, "manage_agency_users")) {
      return { data: [], error: "No tienes permisos para ver invitaciones." };
    }

    const targetOrgId =
      currentUser.role === "super_admin" && organizationId
        ? organizationId
        : currentUser.organization.id;

    const admin = createAdminClient();

    let query = admin
      .from("invitations")
      .select(`
        id, email, role, status, token, expires_at, created_at, accepted_at, opened_at, email_sent_at, email_last_sent_at,
        organization:organizations(name)
      `)
      .order("created_at", { ascending: false });

    if (currentUser.role !== "super_admin") {
      query = query.eq("organization_id", targetOrgId);
    }

    const { data, error } = await query;
    if (error) {
      console.error("[getInvitationsListAction] Query error:", error.message);
      return { data: [], error: error.message };
    }

    const list: InvitationResult[] = (data || []).map((row) => {
      const org = row.organization as unknown as { name?: string } | null;
      return {
        id: row.id,
        email: row.email,
        role: row.role,
        status: row.status,
        token: row.token,
        inviteUrl: `/invite/${row.token}`,
        organizationName: org?.name || "Organización",
        expiresAt: row.expires_at,
        createdAt: row.created_at,
        acceptedAt: row.accepted_at,
        openedAt: row.opened_at,
        emailSentAt: row.email_sent_at,
        emailLastSentAt: row.email_last_sent_at,
      };
    });

    return { data: list, error: null };
  } catch (err) {
    console.error("[getInvitationsListAction] Error:", err);
    return { data: [], error: err instanceof Error ? err.message : String(err) };
  }
}

export async function resendInvitationEmailAction(
  invitationId: number
): Promise<{ success?: boolean; invitation?: Partial<InvitationResult>; error?: string }> {
  try {
    const supabase = await createClient();
    const currentUser = await getCurrentUser(supabase);

    if (!currentUser) return { error: "No autorizado." };

    if (!hasCapability(currentUser.role, "manage_agency_users")) {
      return { error: "No tienes permisos para reenviar invitaciones." };
    }

    const admin = createAdminClient();

    const { data: invitation, error } = await admin
      .from("invitations")
      .select(`
        id, organization_id, email, role, status, token, expires_at,
        organization:organizations(name)
      `)
      .eq("id", invitationId)
      .maybeSingle();

    if (error || !invitation) {
      return { error: error?.message || "Invitación no encontrada." };
    }
    if (currentUser.role !== "super_admin" && invitation.organization_id !== currentUser.organization.id) {
      return { error: "Solo puedes reenviar invitaciones de tu agencia." };
    }
    if (!canInviteRole(currentUser.role, invitation.role as UserRole)) {
      return { error: "Tu perfil no puede reenviar invitaciones de ese rol." };
    }

    if (invitation.status !== "pending") {
      return { error: "Solo se pueden reenviar invitaciones pendientes." };
    }

    if (new Date(invitation.expires_at) <= new Date()) {
      await admin.from("invitations").update({ status: "expired" }).eq("id", invitation.id);
      return { error: "Esta invitación expiró. Crea una invitación nueva." };
    }

    const orgObj = invitation.organization as unknown as { name?: string } | null;
    const organizationName = orgObj?.name || currentUser.organization.name;
    const inviteUrl = `${await getAppOrigin()}/invite/${invitation.token}`;

    await sendInvitationEmail({
      to: invitation.email,
      inviteUrl,
      organizationName,
      roleLabel: roleLabels[invitation.role as UserRole] || invitation.role,
      invitedByName: currentUser.displayName || currentUser.email,
      expiresAt: invitation.expires_at,
    });

    const sentAt = new Date().toISOString();
    const { error: updateError } = await admin
      .from("invitations")
      .update({ email_last_sent_at: sentAt, email_sent_at: sentAt })
      .eq("id", invitation.id);

    if (updateError) return { error: updateError.message };

    revalidatePath("/portal/admin/users");
    return {
      success: true,
      invitation: {
        id: invitation.id,
        emailLastSentAt: sentAt,
        emailSentAt: sentAt,
      },
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function revokeInvitationAction(invitationId: number): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const currentUser = await getCurrentUser(supabase);

    if (!currentUser) return { error: "No autorizado." };

    if (!hasCapability(currentUser.role, "manage_agency_users")) {
      return { error: "No tienes permisos para revocar invitaciones." };
    }

    const admin = createAdminClient();

    const { data: invitation, error: lookupError } = await admin
      .from("invitations")
      .select("id, organization_id, role")
      .eq("id", invitationId)
      .maybeSingle();

    if (lookupError || !invitation) {
      return { error: lookupError?.message || "Invitación no encontrada." };
    }
    if (currentUser.role !== "super_admin" && invitation.organization_id !== currentUser.organization.id) {
      return { error: "Solo puedes revocar invitaciones de tu agencia." };
    }
    if (!canInviteRole(currentUser.role, invitation.role as UserRole)) {
      return { error: "Tu perfil no puede revocar invitaciones de ese rol." };
    }

    const { error } = await admin
      .from("invitations")
      .update({ status: "revoked" })
      .eq("id", invitationId);

    if (error) return { error: error.message };

    revalidatePath("/portal/admin/users");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function updateMembershipStatusAction(payload: {
  membershipId: number;
  status: "active" | "suspended" | "revoked";
}): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const currentUser = await getCurrentUser(supabase);

    if (!currentUser) return { error: "No autorizado." };

    if (payload.membershipId === currentUser.membershipId) {
      return { error: "No puedes suspender o revocar tu propia membresía de administrador." };
    }

    const { data: targetMembership, error: targetError } = await supabase
      .from("memberships")
      .select("id, organization_id, role")
      .eq("id", payload.membershipId)
      .maybeSingle();

    if (targetError || !targetMembership) {
      return { error: targetError?.message || "Membresía no encontrada." };
    }
    if (currentUser.role !== "super_admin" && targetMembership.organization_id !== currentUser.organization.id) {
      return { error: "Solo puedes administrar usuarios de tu agencia." };
    }
    if (!canManageMembershipStatus(currentUser.role, targetMembership.role)) {
      return { error: "Tu perfil no puede cambiar el estado de ese usuario." };
    }

    const { error } = await supabase
      .from("memberships")
      .update({
        status: payload.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payload.membershipId);

    if (error) return { error: error.message };

    revalidatePath("/portal/admin/users");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function moveAgencyAdministratorAction(payload: {
  membershipId: number;
  agencyOrganizationId?: number;
  agencyName?: string;
  projectIds?: number[];
}): Promise<{ success?: boolean; organizationName?: string; membershipId?: number; error?: string }> {
  try {
    const supabase = await createClient();
    const currentUser = await getCurrentUser(supabase);
    if (!currentUser || currentUser.role !== "super_admin") {
      return { error: "Solo el panel de plataforma puede trasladar administradores entre agencias." };
    }
    if (payload.membershipId === currentUser.membershipId) {
      return { error: "No puedes trasladar tu propia membresía desde este panel." };
    }

    const admin = createAdminClient();
    const { data: source, error: sourceError } = await admin
      .from("memberships")
      .select("id, user_id, organization_id, role")
      .eq("id", payload.membershipId)
      .maybeSingle();
    if (sourceError || !source) return { error: sourceError?.message || "Membresía no encontrada." };
    if (source.role !== "agency_admin") return { error: "Este editor solo aplica a Administradores de Agencia." };

    const resolved = await resolveAgencyOrganization(admin, payload);
    if (resolved.error || !resolved.organization) return { error: resolved.error || "No se pudo definir la agencia." };
    if (resolved.organization.id === source.organization_id) {
      return { error: "El usuario ya pertenece a esa agencia." };
    }

    const { data: existingTarget, error: targetError } = await admin
      .from("memberships")
      .select("id")
      .eq("organization_id", resolved.organization.id)
      .eq("user_id", source.user_id)
      .maybeSingle();
    if (targetError) return { error: targetError.message };

    let targetMembershipId = existingTarget?.id;
    if (targetMembershipId) {
      const { error } = await admin
        .from("memberships")
        .update({ role: "agency_admin", status: "active", is_primary: true, updated_at: new Date().toISOString() })
        .eq("id", targetMembershipId);
      if (error) return { error: error.message };
    } else {
      const { data, error } = await admin
        .from("memberships")
        .insert({
          organization_id: resolved.organization.id,
          user_id: source.user_id,
          role: "agency_admin",
          status: "active",
          is_primary: true,
        })
        .select("id")
        .single();
      if (error || !data) return { error: error?.message || "No se pudo crear la membresía de la agencia." };
      targetMembershipId = data.id;
    }

    const { error: previousMembershipError } = await admin
      .from("memberships")
      .update({ status: "revoked", is_primary: false, updated_at: new Date().toISOString() })
      .eq("id", source.id);
    if (previousMembershipError) return { error: previousMembershipError.message };

    const projectIds = [...new Set((payload.projectIds || []).filter(Number.isInteger))];
    const grantError = await grantProjectAccess(admin, targetMembershipId, projectIds);
    if (grantError) return { error: grantError.message };

    await admin.from("audit_events").insert({
      organization_id: resolved.organization.id,
      actor_user_id: currentUser.id,
      action: "agency_administrator_moved",
      entity_type: "membership",
      entity_id: String(targetMembershipId),
      metadata: {
        user_id: source.user_id,
        previous_membership_id: source.id,
        previous_organization_id: source.organization_id,
        project_ids: projectIds,
      },
    });

    revalidatePath("/portal/admin/users");
    return { success: true, organizationName: resolved.organization.name, membershipId: targetMembershipId };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function assignProjectAccessAction(payload: {
  membershipId: number;
  projectId: number;
  accessLevel?: "view" | "sell" | "manage_inventory" | "manage";
}): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const currentUser = await getCurrentUser(supabase);

    if (!currentUser) return { error: "No autorizado." };
    if (!['super_admin', 'master_broker_admin'].includes(currentUser.role)) {
      return { error: "Solo la administración general puede asignar proyectos a miembros." };
    }

    // Fetch target membership to check organization
    const { data: mem, error: memErr } = await supabase
      .from("memberships")
      .select("id, organization_id, role")
      .eq("id", payload.membershipId)
      .single();

    if (memErr || !mem) {
      return { error: "Membresía no encontrada." };
    }
    if (currentUser.role !== "super_admin" && mem.organization_id !== currentUser.organization.id) {
      return { error: "Solo puedes asignar proyectos a miembros de tu agencia." };
    }
    if (!canManageMembershipStatus(currentUser.role, mem.role)) {
      return { error: "Tu perfil no puede asignar proyectos a ese rol." };
    }

    // Check project exists
    const { data: proj, error: projErr } = await supabase
      .from("projects")
      .select("id, organization_id")
      .eq("id", payload.projectId)
      .single();

    if (projErr || !proj) {
      return { error: "Proyecto no encontrado." };
    }

    const accessLevel = payload.accessLevel || "sell";

    // Insert or update project_access
    const { error: accessErr } = await supabase
      .from("project_access")
      .insert({
        organization_id: proj.organization_id,
        project_id: payload.projectId,
        grantee_membership_id: payload.membershipId,
        access_level: accessLevel,
      });

    if (accessErr) {
      return { error: accessErr.message };
    }

    revalidatePath("/portal/admin/users");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function assignAllProjectsAction(payload: {
  membershipId: number;
  accessLevel?: "view" | "sell" | "manage_inventory" | "manage";
}): Promise<{ success?: boolean; count?: number; error?: string }> {
  try {
    const supabase = await createClient();
    const currentUser = await getCurrentUser(supabase);
    if (!currentUser || currentUser.role !== "super_admin") {
      return { error: "Solo el superadministrador puede asignar todos los proyectos." };
    }
    const admin = createAdminClient();
    const { data: mem, error: memErr } = await admin
      .from("memberships")
      .select("id, organization_id, role")
      .eq("id", payload.membershipId)
      .single();
    if (memErr || !mem) return { error: "Membresía no encontrada." };

    const { data: projects, error: projErr } = await admin
      .from("projects")
      .select("id, organization_id")
      .eq("publication_status", "published");
    if (projErr || !projects?.length) return { error: projErr?.message || "No hay proyectos publicados." };

    const { data: existing } = await admin
      .from("project_access")
      .select("project_id")
      .eq("grantee_membership_id", payload.membershipId);
    const existingIds = new Set((existing || []).map((e) => e.project_id));
    const toInsert = projects
      .filter((p) => !existingIds.has(p.id))
      .map((p) => ({
        organization_id: p.organization_id,
        project_id: p.id,
        grantee_membership_id: payload.membershipId,
        access_level: payload.accessLevel || "sell",
      }));

    if (!toInsert.length) return { success: true, count: 0 };
    const { error: insertErr } = await admin.from("project_access").insert(toInsert);
    if (insertErr) return { error: insertErr.message };

    revalidatePath("/portal/admin/users");
    return { success: true, count: toInsert.length };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function updateSellerProfileAction(payload: {
  membershipId: number;
  displayName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  linkedinUrl?: string | null;
  tiktokUrl?: string | null;
  websiteUrl?: string | null;
}): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const currentUser = await getCurrentUser(supabase);
    if (!currentUser || !hasCapability(currentUser.role, "manage_agency_users")) {
      return { error: "No tienes permiso para actualizar perfiles de vendedores." };
    }

    const { data: membership, error } = await supabase
      .from("memberships")
      .select("id, organization_id, role, user_id")
      .eq("id", payload.membershipId)
      .maybeSingle();

    if (error || !membership) return { error: error?.message || "Vendedor no encontrado." };
    if (currentUser.role !== "super_admin" && membership.organization_id !== currentUser.organization.id) {
      return { error: "Solo puedes actualizar vendedores de tu agencia." };
    }
    if (membership.role !== "broker_agent") {
      return { error: "Esta edición rápida aplica solo para vendedores." };
    }
    if (!canManageMembershipStatus(currentUser.role, membership.role)) {
      return { error: "Tu perfil no puede actualizar este vendedor." };
    }

    const displayName = payload.displayName.trim();
    if (!displayName) return { error: "El nombre del vendedor es obligatorio." };

    const clean = (value?: string | null) => value?.trim() || null;

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        phone: clean(payload.phone),
        avatar_path: clean(payload.avatarUrl),
        instagram_url: clean(payload.instagramUrl),
        facebook_url: clean(payload.facebookUrl),
        linkedin_url: clean(payload.linkedinUrl),
        tiktok_url: clean(payload.tiktokUrl),
        website_url: clean(payload.websiteUrl),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", membership.user_id);

    if (profileError) return { error: profileError.message };

    await supabase
      .from("memberships")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", membership.id);

    revalidatePath("/portal/admin/users");
    revalidatePath("/portal/projects");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function uploadAgentAvatarAction(formData: FormData): Promise<{ url?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const currentUser = await getCurrentUser(supabase);
    if (!currentUser || !hasCapability(currentUser.role, "manage_agency_users")) {
      return { error: "No tienes permiso para subir fotos de agentes." };
    }

    const file = formData.get("avatarFile") as File | null;
    if (!file || file.size === 0) return { error: "No se recibió ningún archivo." };
    if (file.size > 5 * 1024 * 1024) return { error: "La imagen no puede pesar más de 5 MB." };

    const membershipId = Number(formData.get("membershipId"));
    if (!membershipId) return { error: "Falta el ID del vendedor." };

    const fileExt = file.name.split(".").pop() || "png";
    const filePath = `avatars/agent_${membershipId}_${Date.now()}.${fileExt}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("public-assets")
      .upload(filePath, buffer, { contentType: file.type || "image/png", upsert: true });

    if (uploadError) return { error: uploadError.message };

    const { data: publicData } = supabase.storage.from("public-assets").getPublicUrl(filePath);
    return { url: publicData.publicUrl };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function getInvitationByToken(token: string): Promise<{
  invitation: {
    id: number;
    email: string;
    role: string;
    status: string;
    organizationName: string;
    expiresAt: string;
  } | null;
  error: string | null;
}> {
  try {
    if (!/^[a-f0-9]{48}$/i.test(token)) {
      return { invitation: null, error: "Invitación no encontrada o token inválido." };
    }

    // Invitation tokens are secrets. Resolve them only on the server with the
    // service client; anonymous Data API access to this table is disabled.
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("invitations")
      .select(`
        id, email, role, status, expires_at, opened_at, accepted_at,
        organization:organizations(name)
      `)
      .eq("token", token)
      .maybeSingle();

    if (error || !data) {
      return { invitation: null, error: "Invitación no encontrada o token inválido." };
    }

    if (data.status !== "pending") {
      return { invitation: null, error: `Esta invitación ya fue ${data.status === "accepted" ? "aceptada" : "revocada"}.` };
    }

    if (new Date(data.expires_at) < new Date()) {
      return { invitation: null, error: "Esta invitación ha expirado. Solicita una nueva a tu administrador." };
    }

    if (!data.opened_at) {
      const admin = createAdminClient();
      await admin
        .from("invitations")
        .update({ opened_at: new Date().toISOString() })
        .eq("id", data.id)
        .is("opened_at", null);
    }

    const org = data.organization as unknown as { name?: string } | null;

    return {
      invitation: {
        id: data.id,
        email: data.email,
        role: data.role,
        status: data.status,
        organizationName: org?.name || "Organización Master Broker",
        expiresAt: data.expires_at,
      },
      error: null,
    };
  } catch (err) {
    console.error("getInvitationByToken failed", err instanceof Error ? err.message : String(err));
    return { invitation: null, error: "No pudimos verificar la invitación. Intenta nuevamente." };
  }
}

export async function createAgencyQuickAction(payload: {
  name: string;
  contactEmail?: string;
  contactPhone?: string;
  initialAdminEmail?: string;
  initialAdminName?: string;
  projectIds?: number[];
}): Promise<{
  success?: boolean;
  organization?: { id: number; name: string };
  error?: string;
  inviteUrl?: string;
  emailSent?: boolean;
  emailError?: string;
}> {
  try {
    const supabase = await createClient();
    const currentUser = await getCurrentUser(supabase);
    if (!currentUser || currentUser.role !== "super_admin") {
      return { error: "Solo el superadministrador puede registrar agencias." };
    }

    const admin = createAdminClient();
    const cleanName = payload.name.trim();
    if (cleanName.length < 2) return { error: "Indica un nombre válido para la agencia." };

    const resolved = await createAgencyOrganization(admin, cleanName);
    if (resolved.error || !resolved.organization) {
      return { error: resolved.error || "No se pudo crear la agencia." };
    }

    const orgId = resolved.organization.id;

    if (payload.contactEmail?.trim() || payload.contactPhone?.trim()) {
      const { error: contactError } = await admin.from("organizations").update({
        contact_email: payload.contactEmail?.trim() || null,
        contact_phone: payload.contactPhone?.trim() || null,
      }).eq("id", orgId);
      if (contactError) {
        await admin.from("organizations").update({ status: "archived" }).eq("id", orgId);
        return { error: "No se pudieron guardar los datos de contacto de la agencia." };
      }
    }

    let inviteUrl: string | undefined;
    let emailSent: boolean | undefined;
    let emailError: string | undefined;
    if (payload.initialAdminEmail?.trim()) {
      const inviteRes = await createInvitationAction({
        email: payload.initialAdminEmail.trim(),
        role: "agency_admin",
        inviteeName: payload.initialAdminName,
        agencyOrganizationId: orgId,
        projectIds: payload.projectIds || [],
      });
      if (inviteRes.error || !inviteRes.invitation) {
        await admin.from("organizations").update({ status: "archived" }).eq("id", orgId);
        return { error: inviteRes.error || "No se pudo emitir la invitación del administrador." };
      }
      inviteUrl = inviteRes.invitation.inviteUrl;
      emailSent = inviteRes.invitation.emailSent;
      emailError = inviteRes.invitation.emailError;
    }

    revalidatePath("/portal/admin/users");
    revalidatePath("/portal/admin/brokers");
    return {
      success: true,
      organization: { id: orgId, name: cleanName },
      inviteUrl,
      emailSent,
      emailError,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function updateUserMembershipAction(payload: {
  membershipId: number;
  displayName: string;
  phone?: string;
  role: UserRole;
  organizationId?: number;
  projectIds?: number[];
  avatarUrl?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  linkedinUrl?: string | null;
  tiktokUrl?: string | null;
  websiteUrl?: string | null;
}): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const currentUser = await getCurrentUser(supabase);
    if (!currentUser || !hasCapability(currentUser.role, "manage_agency_users")) {
      return { error: "No tienes autorización para editar miembros." };
    }

    const admin = createAdminClient();
    const { data: mem, error: memErr } = await admin
      .from("memberships")
      .select("id, user_id, organization_id, role")
      .eq("id", payload.membershipId)
      .maybeSingle();

    if (memErr || !mem) return { error: "Membresía no encontrada." };

    if (currentUser.role !== "super_admin" && mem.organization_id !== currentUser.organization.id) {
      return { error: "Solo puedes editar miembros de tu organización." };
    }

    // Update profile
    const clean = (val?: string | null) => val?.trim() || null;
    const profileUpdate: Database['public']['Tables']['profiles']['Update'] = {
      display_name: payload.displayName.trim(),
      phone: clean(payload.phone),
      updated_at: new Date().toISOString(),
    };
    if (payload.avatarUrl !== undefined) profileUpdate.avatar_path = clean(payload.avatarUrl);
    if (payload.instagramUrl !== undefined) profileUpdate.instagram_url = clean(payload.instagramUrl);
    if (payload.facebookUrl !== undefined) profileUpdate.facebook_url = clean(payload.facebookUrl);
    if (payload.linkedinUrl !== undefined) profileUpdate.linkedin_url = clean(payload.linkedinUrl);
    if (payload.tiktokUrl !== undefined) profileUpdate.tiktok_url = clean(payload.tiktokUrl);
    if (payload.websiteUrl !== undefined) profileUpdate.website_url = clean(payload.websiteUrl);

    await admin.from("profiles").update(profileUpdate as never).eq("user_id", mem.user_id);

    // Update membership role and organization
    const membershipUpdate: Database['public']['Tables']['memberships']['Update'] = {
      role: payload.role,
      updated_at: new Date().toISOString(),
    };

    if (currentUser.role === "super_admin" && payload.organizationId && payload.organizationId !== mem.organization_id) {
      membershipUpdate.organization_id = payload.organizationId;
    }

    const { error: memUpdateErr } = await admin
      .from("memberships")
      .update(membershipUpdate as never)
      .eq("id", mem.id);

    if (memUpdateErr) return { error: memUpdateErr.message };

    // Update project access if projectIds passed
    if (payload.projectIds !== undefined) {
      await admin.from("project_access").delete().eq("grantee_membership_id", mem.id);
      if (payload.projectIds.length > 0) {
        await grantProjectAccess(admin, mem.id, payload.projectIds);
      }
    }

    revalidatePath("/portal/admin/users");
    revalidatePath("/portal/projects");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

export async function revokeMembershipAction(
  membershipId: number
): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const currentUser = await getCurrentUser(supabase);
    if (!currentUser) return { error: "No autorizado." };
    if (membershipId === currentUser.membershipId) {
      return { error: "No puedes revocar tu propio acceso de administrador." };
    }

    const admin = createAdminClient();
    const { data: mem, error: memErr } = await admin
      .from("memberships")
      .select("id, role, organization_id")
      .eq("id", membershipId)
      .maybeSingle();

    if (memErr || !mem) return { error: "Membresía no encontrada." };
    if (currentUser.role !== "super_admin" && mem.organization_id !== currentUser.organization.id) {
      return { error: "Solo puedes revocar miembros de tu organización." };
    }
    if (!canManageMembershipStatus(currentUser.role, mem.role)) {
      return { error: "Tu perfil no tiene permisos para revocar este usuario." };
    }

    const { error } = await admin
      .from("memberships")
      .update({ status: "revoked", updated_at: new Date().toISOString() })
      .eq("id", membershipId);

    if (error) return { error: error.message };

    revalidatePath("/portal/admin/users");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
}

