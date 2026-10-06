'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { sendAgencyOnboardingReviewEmail } from '@/lib/email/mailer';

function cleanOptional(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

async function getAppOrigin() {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
}

export async function submitAgencyInvitationOnboardingAction(payload: {
  token: string;
  agencyName: string;
  legalName?: string;
  taxId?: string;
  legalAddress?: string;
  contactEmail: string;
  contactPhone?: string;
  representativeName: string;
  representativePhone?: string;
}): Promise<{ success?: boolean; error?: string }> {
  const token = payload.token.trim();
  const agencyName = payload.agencyName.trim();
  const contactEmail = payload.contactEmail.trim().toLowerCase();
  const representativeName = payload.representativeName.trim();
  const representativePhone = cleanOptional(payload.representativePhone);

  if (!token || !agencyName || !representativeName || !isValidEmail(contactEmail)) {
    return { error: 'Completa el nombre de la agencia, el representante y un correo válido.' };
  }

  const admin = createAdminClient();

  const { data: invitation, error: invitationError } = await admin
    .from('invitations')
    .select('id, organization_id, email, role, status, expires_at')
    .eq('token', token)
    .maybeSingle();

  if (invitationError || !invitation) {
    return { error: 'Invitación no encontrada o token inválido.' };
  }

  if (invitation.role !== 'agency_admin') {
    return { error: 'Esta invitación no corresponde a una solicitud de agencia.' };
  }

  if (invitation.status !== 'pending') {
    return { error: 'Esta invitación ya no está pendiente.' };
  }

  if (new Date(invitation.expires_at) <= new Date()) {
    await admin.from('invitations').update({ status: 'expired' }).eq('id', invitation.id);
    return { error: 'Esta invitación ha expirado. Solicita una nueva invitación.' };
  }

  const legalName = cleanOptional(payload.legalName) || agencyName;
  const taxId = cleanOptional(payload.taxId);
  const legalAddress = cleanOptional(payload.legalAddress);
  const contactPhone = cleanOptional(payload.contactPhone);

  const { error: organizationError } = await admin
    .from('organizations')
    .update({
      name: agencyName,
      legal_name: legalName,
      tax_id: taxId,
      legal_address: legalAddress,
      legal_representative_name: representativeName,
      contact_email: contactEmail,
      contact_phone: contactPhone || representativePhone,
      updated_at: new Date().toISOString(),
    })
    .eq('id', invitation.organization_id);

  if (organizationError) {
    return { error: organizationError.message };
  }

  const { error: submissionError } = await (admin)
    .from('agency_onboarding_submissions')
    .insert({
      invitation_id: invitation.id,
      organization_id: invitation.organization_id,
      agency_name: agencyName,
      legal_name: legalName,
      tax_id: taxId,
      legal_address: legalAddress,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      representative_name: representativeName,
      representative_email: invitation.email,
      representative_phone: representativePhone,
      status: 'pending_review',
      submitted_payload: {
        agencyName,
        legalName,
        taxId,
        legalAddress,
        contactEmail,
        contactPhone,
        representativeName,
        representativePhone,
      },
    });

  if (submissionError) {
    return { error: submissionError.message };
  }

  const { error: invitationUpdateError } = await admin
    .from('invitations')
    .update({
      status: 'onboarding_submitted',
      accepted_at: new Date().toISOString(),
    })
    .eq('id', invitation.id);

  if (invitationUpdateError) {
    return { error: invitationUpdateError.message };
  }

  try {
    await sendAgencyOnboardingReviewEmail({
      agencyName,
      legalName,
      taxId,
      legalAddress,
      contactEmail,
      contactPhone,
      representativeName,
      representativePhone,
      representativeEmail: invitation.email,
      reviewUrl: `${await getAppOrigin()}/portal/admin/users`,
    });
  } catch (mailError) {
    console.warn('sendAgencyOnboardingReviewEmail warning:', mailError);
  }

  return { success: true };
}

export async function acceptInvitationAction(payload: {
  token: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  password: string;
}): Promise<{ success?: boolean; error?: string }> {
  const email = payload.email.trim().toLowerCase();
  const firstName = payload.firstName?.trim() || '';
  const lastName = payload.lastName?.trim() || '';
  const phone = payload.phone?.trim() || null;
  const displayName = [firstName, lastName].filter(Boolean).join(' ').trim() || email.split('@')[0] || 'Usuario';
  const hasSecurePassword =
    payload.password.length >= 10 &&
    /[a-z]/.test(payload.password) &&
    /[A-Z]/.test(payload.password) &&
    /\d/.test(payload.password) &&
    /[^A-Za-z0-9]/.test(payload.password);

  if (!payload.token || !email || !hasSecurePassword) {
    return { error: 'Completa los datos requeridos para activar la cuenta.' };
  }

  const admin = createAdminClient();

  const { data: invitation, error: invitationError } = await admin
    .from('invitations')
    .select('id, organization_id, email, role, project_ids, status, expires_at')
    .eq('token', payload.token)
    .maybeSingle();

  if (invitationError || !invitation) {
    return { error: 'Invitación no encontrada o token inválido.' };
  }

  if (invitation.status !== 'pending') {
    return { error: 'Esta invitación ya no está pendiente.' };
  }

  if (new Date(invitation.expires_at) <= new Date()) {
    await admin.from('invitations').update({ status: 'expired' }).eq('id', invitation.id);
    return { error: 'Esta invitación ha expirado. Solicita una nueva a tu administrador.' };
  }

  if (invitation.email.trim().toLowerCase() !== email) {
    return { error: 'El correo no coincide con esta invitación.' };
  }

  const supabase = await createClient();
  let userId: string | null = null;

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: payload.password,
  });

  if (signInData.user) {
    userId = signInData.user.id;
  } else {
    const isInvalidCredentials =
      signInError?.message === 'Invalid login credentials' ||
      signInError?.message.toLowerCase().includes('invalid');

    if (!isInvalidCredentials && signInError) {
      return { error: signInError.message };
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password: payload.password,
      email_confirm: true,
      user_metadata: { display_name: displayName, first_name: firstName, last_name: lastName, phone },
    });

    if (createError || !created.user) {
      return {
        error: createError?.message.includes('already')
          ? 'Este correo ya tiene una cuenta. Ingresa la contraseña correcta.'
          : createError?.message || 'No pudimos crear la cuenta.',
      };
    }

    const { data: newSession, error: newSessionError } = await supabase.auth.signInWithPassword({
      email,
      password: payload.password,
    });

    if (newSessionError || !newSession.user) {
      return { error: newSessionError?.message || 'Cuenta creada, pero no pudimos iniciar sesión.' };
    }

    userId = newSession.user.id;
  }

  const { error: profileError } = await admin.from('profiles').upsert(
    {
      user_id: userId,
      display_name: displayName,
      email,
      phone,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (profileError) {
    return { error: profileError.message };
  }

  const isPrimary = await admin
    .from('memberships')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  const { data: membership, error: membershipError } = await admin
    .from('memberships')
    .upsert(
      {
        organization_id: invitation.organization_id,
        user_id: userId,
        role: invitation.role,
        status: 'active',
        is_primary: !isPrimary.data,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'organization_id,user_id' }
    )
    .select('id')
    .single();

  if (membershipError || !membership) {
    return { error: membershipError?.message || 'No pudimos activar la membresía.' };
  }

  if (invitation.project_ids.length > 0) {
    const { data: projects, error: projectsError } = await admin
      .from('projects')
      .select('id, organization_id')
      .in('id', invitation.project_ids);

    if (projectsError) {
      return { error: projectsError.message };
    }

    const grants = (projects || []).map((project) => ({
      organization_id: project.organization_id,
      project_id: project.id,
      grantee_membership_id: membership.id,
      access_level: 'sell',
    }));

    if (grants.length > 0) {
      const { data: existingGrants, error: existingGrantsError } = await admin
        .from('project_access')
        .select('project_id')
        .eq('grantee_membership_id', membership.id)
        .in(
          'project_id',
          grants.map((grant) => grant.project_id)
        );

      if (existingGrantsError) {
        return { error: existingGrantsError.message };
      }

      const existingProjectIds = new Set((existingGrants || []).map((grant) => grant.project_id));
      const missingGrants = grants.filter((grant) => !existingProjectIds.has(grant.project_id));

      const { error: accessError } =
        missingGrants.length > 0 ? await admin.from('project_access').insert(missingGrants) : { error: null };

      if (accessError) {
        return { error: accessError.message };
      }
    }
  }

  const { error: acceptError } = await admin
    .from('invitations')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    })
    .eq('id', invitation.id);

  if (acceptError) {
    return { error: acceptError.message };
  }

  return { success: true };
}
