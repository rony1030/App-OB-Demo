'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth/get-user';
import { canInviteRole, hasCapability } from '@/lib/auth/permissions';
import type { UserRole } from '@/lib/auth/get-user';
import { createAgencyQuickAction, createInvitationAction } from '@/app/portal/admin/users/user-actions';

export type BrokerAccessRequestStatus = 'pending_review' | 'contacted' | 'approved' | 'changes_requested' | 'rejected' | 'converted';

export async function reviewBrokerAccessRequestAction(
  requestId: number,
  status: BrokerAccessRequestStatus,
  reviewNotes: string,
): Promise<{ success?: boolean; error?: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser || !hasCapability(currentUser.role, 'review_broker_access_requests')) {
    return { error: 'No tienes permisos para revisar solicitudes de acceso profesional.' };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('broker_access_requests')
    .update({
      status,
      review_notes: reviewNotes.trim() || null,
      reviewed_by: currentUser.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('organization_id', currentUser.organization.id);

  if (error) return { error: 'No pudimos actualizar la solicitud.' };
  revalidatePath('/portal/admin/broker-requests');
  return { success: true };
}

const requestedRoleMap: Record<string, UserRole> = {
  'broker inmobiliario': 'broker_agent',
  'director de agencia': 'agency_admin',
  'master broker': 'master_broker_admin',
};

export async function completeApprovedBrokerRequestAsAgencyAction(payload: {
  requestId: number;
  agencyName: string;
  contactEmail: string;
  contactPhone: string;
  adminName: string;
  adminEmail: string;
  projectIds: number[];
  reviewNotes: string;
}): Promise<{
  error?: string;
  warning?: string;
  invitation?: { inviteUrl: string; emailSent?: boolean; emailError?: string; organizationName: string };
}> {
  const supabase = await createClient();
  const currentUser = await getCurrentUser(supabase);
  if (!currentUser || currentUser.role !== 'super_admin') {
    return { error: 'Solo un superadministrador puede registrar una agencia desde una solicitud.' };
  }
  if (!hasCapability(currentUser.role, 'review_broker_access_requests') || !hasCapability(currentUser.role, 'manage_agency_users')) {
    return { error: 'No tienes permiso para completar esta solicitud.' };
  }

  const { data: request, error: requestError } = await supabase
    .from('broker_access_requests')
    .select('id, status, organization_id')
    .eq('id', payload.requestId)
    .eq('organization_id', currentUser.organization.id)
    .maybeSingle();
  if (requestError || !request) return { error: 'La solicitud no existe o ya no está disponible.' };
  if (request.status !== 'approved') return { error: 'Aprueba la solicitud antes de registrar la agencia y emitir el acceso.' };

  const agencyName = String(payload.agencyName || '').trim();
  const contactEmail = payload.contactEmail.trim().toLowerCase();
  const contactPhone = payload.contactPhone.trim();
  const adminName = payload.adminName.trim();
  const adminEmail = payload.adminEmail.trim().toLowerCase();
  if (agencyName.length < 2) return { error: 'Escribe al menos dos caracteres en el nombre comercial de la agencia.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) return { error: 'Indica un correo válido para el administrador inicial.' };
  if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) return { error: 'Revisa el correo de contacto oficial.' };

  const projectIds = [...new Set(payload.projectIds.filter((id) => Number.isInteger(id) && id > 0))];
  if (projectIds.length) {
    const { data: allowedProjects, error: projectsError } = await supabase.from('projects').select('id').in('id', projectIds);
    if (projectsError || (allowedProjects || []).length !== projectIds.length) {
      return { error: 'Uno o más proyectos seleccionados ya no están disponibles.' };
    }
  }

  const created = await createAgencyQuickAction({
    name: agencyName,
    contactEmail,
    contactPhone,
    initialAdminEmail: adminEmail,
    initialAdminName: adminName,
    projectIds,
  });
  if (created.error || !created.organization || !created.inviteUrl) {
    return { error: created.error || 'No pudimos crear la agencia y emitir su invitación.' };
  }

  const { error: updateError } = await supabase
    .from('broker_access_requests')
    .update({
      status: 'converted',
      review_notes: payload.reviewNotes.trim() || null,
      reviewed_by: currentUser.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', request.id)
    .eq('organization_id', currentUser.organization.id);

  revalidatePath('/portal/admin/broker-requests');
  revalidatePath('/portal/admin/users');
  revalidatePath('/portal/admin/brokers');
  return {
    warning: updateError ? 'La agencia y la invitación se crearon, pero no pudimos actualizar el estado de la solicitud. Revisa la lista antes de repetir.' : undefined,
    invitation: {
      inviteUrl: created.inviteUrl,
      emailSent: created.emailSent,
      emailError: created.emailError,
      organizationName: created.organization.name,
    },
  };
}

function normalizeCompanyName(value: string) {
  return value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export async function issueBrokerAccessInvitationAction(payload: {
  requestId: number;
  organizationId?: number;
  createAgencyFromRequest?: boolean;
  projectIds: number[];
  reviewNotes: string;
}): Promise<{
  success?: boolean;
  error?: string;
  warning?: string;
  invitation?: { inviteUrl: string; emailSent?: boolean; emailError?: string; organizationName: string };
}> {
  const supabase = await createClient();
  const currentUser = await getCurrentUser(supabase);
  if (!currentUser || !hasCapability(currentUser.role, 'review_broker_access_requests')) {
    return { error: 'No tienes permiso para revisar solicitudes.' };
  }
  if (!hasCapability(currentUser.role, 'manage_agency_users')) {
    return { error: 'Tu perfil puede revisar solicitudes, pero no emitir invitaciones. Pide a un administrador que complete este paso.' };
  }

  const { data: request, error: requestError } = await supabase
    .from('broker_access_requests')
    .select('id, full_name, email, agency, role_type, status, organization_id')
    .eq('id', payload.requestId)
    .eq('organization_id', currentUser.organization.id)
    .maybeSingle();
  if (requestError || !request) return { error: 'La solicitud no existe o ya no está disponible para tu organización.' };
  if (['rejected', 'converted'].includes(request.status)) return { error: 'Esta solicitud ya fue rechazada o convertida en invitación.' };

  const role = requestedRoleMap[request.role_type.trim().toLowerCase()];
  if (!role || !canInviteRole(currentUser.role, role)) {
    return { error: `Tu perfil no puede emitir el rol solicitado (${request.role_type}). Debe completarlo un administrador autorizado.` };
  }

  const admin = createAdminClient();
  const isNewAgency = role === 'agency_admin' && payload.createAgencyFromRequest === true;
  let organizationId = currentUser.organization.id;
  let agencyOrganizationId: number | undefined;
  let agencyName: string | undefined;

  if (role === 'agency_admin' && currentUser.role !== 'super_admin') {
    return { error: 'Solo un superadministrador puede emitir invitaciones de administrador de agencia.' };
  }

  if (isNewAgency) {
    if (!request.agency?.trim()) return { error: 'La solicitud no incluye el nombre de la agencia para iniciar el registro.' };
    agencyName = request.agency.trim();
    const { data: activeAgencies, error: agencyError } = await admin
      .from('organizations').select('id, name').eq('kind', 'agency').eq('status', 'active');
    if (agencyError) return { error: 'No pudimos comprobar si la agencia ya existe.' };
    const matchingAgency = (activeAgencies || []).find((item) => normalizeCompanyName(item.name) === normalizeCompanyName(agencyName!));
    if (matchingAgency) {
      agencyOrganizationId = matchingAgency.id;
      agencyName = undefined;
    }
  } else if (role === 'agency_admin') {
    if (!payload.organizationId) return { error: 'Selecciona la agencia que recibirá la invitación.' };
    agencyOrganizationId = payload.organizationId;
  } else {
    organizationId = currentUser.role === 'super_admin' && payload.organizationId
      ? payload.organizationId
      : currentUser.organization.id;
  }

  const targetOrganizationId = agencyOrganizationId || organizationId;
  if (!agencyName) {
    const { data: organization, error: organizationError } = await admin
      .from('organizations').select('id, kind, status').eq('id', targetOrganizationId).maybeSingle();
    if (organizationError || !organization || organization.status !== 'active') {
      return { error: 'La empresa seleccionada no está activa o no existe.' };
    }
    const allowedKinds = role === 'master_broker_admin'
      ? ['master_broker']
      : role === 'agency_admin'
        ? ['agency']
        : currentUser.role === 'super_admin'
          ? ['agency', 'master_broker']
          : [currentUser.organization.kind];
    if (!allowedKinds.includes(organization.kind)) {
      return { error: `La empresa seleccionada no corresponde al perfil solicitado (${request.role_type}).` };
    }
  }

  const uniqueProjectIds = [...new Set((payload.projectIds || []).filter((id) => Number.isInteger(id) && id > 0))];
  if (uniqueProjectIds.length) {
    let projectsQuery = supabase.from('projects').select('id').in('id', uniqueProjectIds);
    if (currentUser.role !== 'super_admin' && currentUser.organization.kind === 'developer') {
      projectsQuery = projectsQuery.eq('developer_organization_id', currentUser.organization.id);
    }
    const { data: allowedProjects, error: projectsError } = await projectsQuery;
    if (projectsError || (allowedProjects || []).length !== uniqueProjectIds.length) {
      return { error: 'Uno o más proyectos seleccionados no están disponibles para asignar.' };
    }
  }

  if (!agencyName) {
    const { data: pendingInvite, error: pendingError } = await admin
      .from('invitations').select('id').eq('organization_id', targetOrganizationId)
      .eq('email', request.email.trim().toLowerCase()).eq('status', 'pending').limit(1).maybeSingle();
    if (pendingError) return { error: 'No pudimos comprobar si ya existe una invitación pendiente.' };
    if (pendingInvite) return { error: 'Ya existe una invitación pendiente para este correo y empresa. Revísala en “Administrar accesos” para evitar emitir otra.' };
  }

  const invitationResult = await createInvitationAction({
    email: request.email,
    role,
    organizationId,
    agencyOrganizationId,
    agencyName,
    projectIds: uniqueProjectIds,
  });
  if (invitationResult.error || !invitationResult.invitation) {
    return { error: invitationResult.error || 'No se pudo crear la invitación.' };
  }

  const { error: updateError } = await supabase
    .from('broker_access_requests')
    .update({
      status: 'converted',
      review_notes: payload.reviewNotes.trim() || null,
      reviewed_by: currentUser.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', request.id)
    .eq('organization_id', currentUser.organization.id);

  revalidatePath('/portal/admin/broker-requests');
  revalidatePath('/portal/admin/users');
  return {
    success: true,
    warning: updateError ? 'La invitación se creó, pero no pudimos actualizar el estado de la solicitud. Revisa la lista antes de repetir el envío.' : undefined,
    invitation: {
      inviteUrl: invitationResult.invitation.inviteUrl,
      emailSent: invitationResult.invitation.emailSent,
      emailError: invitationResult.invitation.emailError,
      organizationName: invitationResult.invitation.organizationName,
    },
  };
}
