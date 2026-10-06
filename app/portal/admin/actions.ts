'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/get-user';

export async function createMasterBrokerAction(formData: FormData): Promise<{ success?: boolean; error?: string; orgId?: number }> {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();

  if (!currentUser || !['super_admin', 'master_broker_admin'].includes(currentUser.role)) {
    return { error: 'No tienes permisos para crear organizaciones.' };
  }

  const name = String(formData.get('name') || '').trim();
  const kind = String(formData.get('kind') || 'master_broker').trim();
  const contactEmail = String(formData.get('contactEmail') || '').trim() || null;
  const contactPhone = String(formData.get('contactPhone') || '').trim() || null;
  const legalName = String(formData.get('legalName') || '').trim() || null;

  if (!name) {
    return { error: 'El nombre de la organización es obligatorio.' };
  }

  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') + `-${Date.now().toString(36)}`;

  const codePrefix = name
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .padEnd(2, 'X');

  const tempCode = `${codePrefix}-T${Date.now().toString(36)}`;
  const { data: newOrg, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name,
      slug,
      kind,
      status: 'active',
      legal_name: legalName,
      contact_email: contactEmail,
      contact_phone: contactPhone,
      public_code: tempCode,
    })
    .select('id')
    .single();

  if (newOrg) {
    await supabase
      .from('organizations')
      .update({ public_code: `${codePrefix}-${String(newOrg.id).padStart(6, '0')}` })
      .eq('id', newOrg.id);
  }

  if (orgError || !newOrg) {
    return { error: orgError?.message || 'Error al crear la organización.' };
  }

  // Create active membership for the current user if logged in
  if (currentUser?.id) {
    const { error: membershipError } = await supabase.from('memberships').insert({
      organization_id: newOrg.id,
      user_id: currentUser.id,
      role: 'master_broker_admin',
      status: 'active',
      is_primary: false,
    });
    if (membershipError) {
      return { error: `Organización creada, pero no se pudo asignarte como administrador: ${membershipError.message}` };
    }
  }

  // Create default brand_profile for this organization
  const { error: brandError } = await supabase.from('brand_profiles').insert({
    organization_id: newOrg.id,
    name,
    primary_color: '#0c094e',
    secondary_color: '#1e3a8a',
    accent_color: '#2563eb',
    surface_color: '#f8fafc',
    contact_email: contactEmail,
    contact_phone: contactPhone,
    is_default: true,
  });
  if (brandError) {
    return { error: `Organización creada, pero no se pudo crear su perfil de marca: ${brandError.message}` };
  }

  revalidatePath('/portal/admin');
  revalidatePath('/portal/admin#brokers');
  revalidatePath('/portal');
  return { success: true, orgId: newOrg.id };
}

export async function updateOwnOrganizationLegalInfoAction(
  _prev: { success?: boolean; error?: string } | null,
  formData: FormData
): Promise<{ success?: boolean; error?: string }> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: 'Debes iniciar sesión.' };
  if (!['super_admin', 'master_broker_admin'].includes(currentUser.role)) {
    return { error: 'No tienes permiso para editar los datos legales de la organización.' };
  }

  const legalName = String(formData.get('legalName') || '').trim() || null;
  const taxId = String(formData.get('taxId') || '').trim() || null;
  const legalAddress = String(formData.get('legalAddress') || '').trim() || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from('organizations')
    .update({ legal_name: legalName, tax_id: taxId, legal_address: legalAddress })
    .eq('id', currentUser.organization.id);

  if (error) return { error: error.message };

  revalidatePath('/portal/admin');
  return { success: true };
}
