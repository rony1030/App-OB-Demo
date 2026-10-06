'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import { hasCapability } from '@/lib/auth/permissions';

export type BrandProfileData = {
  id?: number;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  surfaceColor: string;
  logoUrl?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  whatsappNumber?: string | null;
};

export async function getBrandProfileAction(): Promise<BrandProfileData | null> {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();
  if (!currentUser || !hasCapability(currentUser.role, 'manage_agency')) return null;
  const orgId = currentUser?.organization?.id || 1;

  const { data, error } = await supabase
    .from('brand_profiles')
    .select('*')
    .eq('organization_id', orgId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    primaryColor: data.primary_color,
    secondaryColor: data.secondary_color,
    accentColor: data.accent_color,
    surfaceColor: data.surface_color,
    logoUrl: data.logo_path,
    contactEmail: data.contact_email,
    contactPhone: data.contact_phone,
    whatsappNumber: data.whatsapp_number,
  };
}

export async function saveBrandProfileAction(formData: FormData): Promise<{ success?: boolean; error?: string; logoUrl?: string }> {
  const supabase = await createClient();
  const currentUser = await getCurrentUser();
  if (!currentUser || !hasCapability(currentUser.role, 'manage_agency')) {
    return { error: 'No tienes permiso para editar la marca de la agencia.' };
  }
  const orgId = currentUser?.organization?.id || 1;

  const name = String(formData.get('name') || '').trim();
  const primaryColor = String(formData.get('primaryColor') || '#0c094e').trim();
  const secondaryColor = String(formData.get('secondaryColor') || '#1e3a8a').trim();
  const accentColor = String(formData.get('accentColor') || '#2563eb').trim();
  const surfaceColor = String(formData.get('surfaceColor') || '#f8fafc').trim();
  const contactEmail = String(formData.get('contactEmail') || '').trim() || null;
  const contactPhone = String(formData.get('contactPhone') || '').trim() || null;
  const whatsappNumber = String(formData.get('whatsappNumber') || '').trim() || null;
  const website = String(formData.get('website') || '').trim() || null;
  const address = String(formData.get('address') || '').trim() || null;
  let logoUrl = String(formData.get('existingLogoUrl') || '').trim() || null;
  let logoDarkUrl = String(formData.get('existingLogoDarkUrl') || '').trim() || null;

  async function uploadLogo(file: File, suffix: string) {
    const fileExt = file.name.split('.').pop() || 'png';
    const filePath = `logos/org_${orgId}_${suffix}_${Date.now()}.${fileExt}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const { error: uploadError } = await supabase.storage
      .from('public-assets')
      .upload(filePath, buffer, { contentType: file.type || 'image/png', upsert: true });
    if (uploadError) return null;
    const { data: publicData } = supabase.storage.from('public-assets').getPublicUrl(filePath);
    return publicData.publicUrl;
  }

  const logoFile = formData.get('logoFile') as File | null;
  if (logoFile && logoFile.size > 0 && logoFile.name) {
    const url = await uploadLogo(logoFile, 'light');
    if (url) logoUrl = url;
  }

  const logoDarkFile = formData.get('logoDarkFile') as File | null;
  if (logoDarkFile && logoDarkFile.size > 0 && logoDarkFile.name) {
    const url = await uploadLogo(logoDarkFile, 'dark');
    if (url) logoDarkUrl = url;
  }

  // Check if brand_profile exists for this org
  const { data: existing } = await supabase
    .from('brand_profiles')
    .select('id')
    .eq('organization_id', orgId)
    .maybeSingle();

  if (existing) {
    const { error: updateError } = await supabase
      .from('brand_profiles')
      .update({
        name: name || 'Mi Inmobiliaria',
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        accent_color: accentColor,
        surface_color: surfaceColor,
        logo_path: logoUrl,
        logo_dark_path: logoDarkUrl,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        whatsapp_number: whatsappNumber,
        website: website as never,
        address: address as never,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);

    if (updateError) return { error: updateError.message };
  } else {
    const { error: insertError } = await supabase
      .from('brand_profiles')
      .insert({
        organization_id: orgId,
        name: name || 'Mi Inmobiliaria',
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        accent_color: accentColor,
        surface_color: surfaceColor,
        logo_path: logoUrl,
        logo_dark_path: logoDarkUrl,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        whatsapp_number: whatsappNumber,
        website: website as never,
        address: address as never,
        is_default: true,
      } as never);

    if (insertError) return { error: insertError.message };
  }

  revalidatePath('/portal/branding');
  revalidatePath('/portal');
  return { success: true, logoUrl: logoUrl || undefined };
}
