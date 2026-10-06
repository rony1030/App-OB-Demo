'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/get-user';

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function saveMyProfessionalProfileAction(formData: FormData): Promise<{ success?: boolean; error?: string; avatarUrl?: string }> {
  const db = await createClient();
  const user = await getCurrentUser(db);
  if (!user) return { error: 'Tu sesión expiró.' };
  const name = String(formData.get('displayName') || '').trim();
  if (!name) return { error: 'Indica tu nombre profesional.' };
  if (name.length > 100) return { error: 'El nombre profesional no puede superar 100 caracteres.' };
  const clean = (key: string) => String(formData.get(key) || '').trim() || null;
  const professionalTitle = clean('professionalTitle');
  if (professionalTitle && (professionalTitle.length < 2 || professionalTitle.length > 80)) return { error: 'El cargo profesional debe tener entre 2 y 80 caracteres.' };
  let avatarUrl = clean('currentAvatarUrl');
  const avatar = formData.get('avatar') as File | null;
  if (avatar?.size) {
    if (!allowedTypes.has(avatar.type) || avatar.size > 5 * 1024 * 1024) return { error: 'Usa JPG, PNG o WEBP de hasta 5 MB.' };
    const extension = avatar.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `profiles/${user.organization.slug}/${user.id}/${Date.now()}.${extension}`;
    const admin = createAdminClient();
    const { error: uploadError } = await admin.storage.from('public-assets').upload(path, Buffer.from(await avatar.arrayBuffer()), { contentType: avatar.type, upsert: true });
    if (uploadError) return { error: `No se pudo subir la foto: ${uploadError.message}` };
    avatarUrl = admin.storage.from('public-assets').getPublicUrl(path).data.publicUrl;
  }
  const { error } = await db.from('profiles').update({
    display_name: name, phone: clean('phone'), avatar_path: avatarUrl, professional_title: professionalTitle,
    instagram_url: clean('instagramUrl'), facebook_url: clean('facebookUrl'), linkedin_url: clean('linkedinUrl'),
    tiktok_url: clean('tiktokUrl'), website_url: clean('websiteUrl'), updated_at: new Date().toISOString(),
  } as never).eq('user_id', user.id);
  if (error) return { error: error.message };
  revalidatePath('/portal/profile');
  revalidatePath('/portal/proposals');
  return { success: true, avatarUrl: avatarUrl || undefined };
}
