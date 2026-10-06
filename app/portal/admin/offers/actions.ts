'use server';

import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/get-user';
import { hasCapability } from '@/lib/auth/permissions';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BANNER_BYTES = 5 * 1024 * 1024;

type OfferMutationResult = { success?: boolean; error?: string };

function textValue(formData: FormData, name: string) {
  return String(formData.get(name) || '').trim();
}

function parseSantoDomingoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(`${value}:00-04:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function extensionFor(file: File) {
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  return 'jpg';
}

export async function saveMarketingOfferAction(formData: FormData): Promise<OfferMutationResult> {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user || !hasCapability(user.role, 'manage_marketing_offers')) {
    return { error: 'No tienes permiso para administrar ofertas y promociones.' };
  }

  const offerIdValue = Number(textValue(formData, 'offerId'));
  const offerId = Number.isInteger(offerIdValue) && offerIdValue > 0 ? offerIdValue : null;
  const title = textValue(formData, 'title');
  const offerType = textValue(formData, 'offerType');
  const description = textValue(formData, 'description');
  const promotionText = textValue(formData, 'promotionText');
  const displayPlacement = textValue(formData, 'displayPlacement') || 'header_banner';
  const status = textValue(formData, 'status') || 'draft';
  const startsAt = parseSantoDomingoDate(textValue(formData, 'startsAt'));
  const endsAt = parseSantoDomingoDate(textValue(formData, 'endsAt'));
  const discountPercent = offerType === 'discount' ? Number(textValue(formData, 'discountPercent')) : null;
  const projectIds = Array.from(new Set(formData.getAll('projectIds').map(Number).filter((id) => Number.isInteger(id) && id > 0)));

  if (title.length < 3 || title.length > 120) return { error: 'Escribe un nombre de oferta entre 3 y 120 caracteres.' };
  if (!['discount', 'promotion'].includes(offerType)) return { error: 'Selecciona descuento o promoción.' };
  if (!['header_banner', 'side_card', 'popup', 'fullscreen'].includes(displayPlacement)) return { error: 'La ubicación del anuncio no es válida.' };
  if (!['draft', 'active', 'paused'].includes(status)) return { error: 'El estado de la oferta no es válido.' };
  if (!startsAt || !endsAt || new Date(endsAt) <= new Date(startsAt)) return { error: 'La fecha final debe ser posterior a la fecha de inicio.' };
  if (!projectIds.length) return { error: 'Selecciona al menos un proyecto.' };
  if (offerType === 'discount' && (!Number.isFinite(discountPercent) || discountPercent! <= 0 || discountPercent! > 100)) {
    return { error: 'El descuento debe ser mayor que 0% y no puede superar 100%.' };
  }
  if (offerType === 'promotion' && !promotionText) return { error: 'Escribe el beneficio o condición de la promoción.' };

  const admin = createAdminClient();

  const { data: projects, error: projectsError } = await admin
    .from('projects')
    .select('id, organization_id')
    .in('id', projectIds);
  if (projectsError || !projects || projects.length !== projectIds.length) return { error: 'Uno de los proyectos seleccionados no está disponible.' };

  const ownerIds = new Set(projects.map((project) => project.organization_id));
  if (ownerIds.size !== 1) return { error: 'Una oferta solo puede agrupar proyectos de la misma organización.' };
  const organizationId = projects[0].organization_id;
  if (user.role !== 'super_admin' && organizationId !== user.organization.id) return { error: 'Solo puedes administrar ofertas de tu organización.' };

  let existingBannerPath = '';
  if (offerId) {
    const { data: existing } = await admin
      .from('marketing_offers')
      .select('id, organization_id, banner_path')
      .eq('id', offerId)
      .maybeSingle();
    if (!existing || existing.organization_id !== organizationId) return { error: 'La oferta que intentas editar ya no está disponible.' };
    existingBannerPath = existing.banner_path || '';
  }

  let bannerPath = existingBannerPath || null;
  const banner = formData.get('banner');
  if (banner instanceof File && banner.size > 0) {
    if (!ALLOWED_IMAGE_TYPES.has(banner.type)) return { error: 'El banner debe ser JPG, PNG o WebP.' };
    if (banner.size > MAX_BANNER_BYTES) return { error: 'El banner no puede superar 5 MB.' };

    const { data: organization } = await admin
      .from('organizations')
      .select('slug')
      .eq('id', organizationId)
      .single();
    if (!organization?.slug) return { error: 'No fue posible resolver la carpeta de la organización.' };

    bannerPath = `${organization.slug}/marketing/offers/${Date.now()}-${crypto.randomUUID()}.${extensionFor(banner)}`;
    const { error: uploadError } = await admin.storage
      .from('public-assets')
      .upload(bannerPath, Buffer.from(await banner.arrayBuffer()), { contentType: banner.type, upsert: false });
    if (uploadError) return { error: `No se pudo subir el banner: ${uploadError.message}` };
  }

  const offerValues = {
    organization_id: organizationId,
    title,
    offer_type: offerType,
    description,
    promotion_text: offerType === 'promotion' ? promotionText : null,
    discount_percent: offerType === 'discount' ? discountPercent : null,
    banner_path: bannerPath,
    display_placement: displayPlacement,
    status,
    starts_at: startsAt,
    ends_at: endsAt,
    requires_opt_in: true,
    updated_by: user.id,
  };

  let savedOfferId = offerId;
  if (offerId) {
    const { error } = await admin.from('marketing_offers').update(offerValues).eq('id', offerId);
    if (error) return { error: `No se pudo actualizar la oferta: ${error.message}` };
  } else {
    const { data, error } = await admin
      .from('marketing_offers')
      .insert({ ...offerValues, created_by: user.id })
      .select('id')
      .single();
    if (error || !data) return { error: `No se pudo crear la oferta: ${error?.message || 'respuesta vacía'}` };
    savedOfferId = data.id;
  }

  if (!savedOfferId) return { error: 'No se pudo identificar la oferta guardada.' };
  const { error: removeLinksError } = await admin.from('marketing_offer_projects').delete().eq('offer_id', savedOfferId);
  if (removeLinksError) return { error: `La oferta se guardó, pero no se pudieron actualizar sus proyectos: ${removeLinksError.message}` };
  const { error: linksError } = await admin.from('marketing_offer_projects').insert(projectIds.map((projectId) => ({ offer_id: savedOfferId!, project_id: projectId })));
  if (linksError) return { error: `La oferta se guardó, pero no se pudieron asociar sus proyectos: ${linksError.message}` };

  await admin.from('audit_events').insert({
    organization_id: organizationId,
    actor_user_id: user.id,
    action: offerId ? 'marketing_offer_updated' : 'marketing_offer_created',
    entity_type: 'marketing_offer',
    entity_id: String(savedOfferId),
    metadata: { offer_type: offerType, project_ids: projectIds, status },
  }).then(() => {}, () => {});

  revalidatePath('/portal/admin/offers');
  revalidatePath('/portal');
  revalidatePath('/portal/proposals/new');
  return { success: true };
}

export async function setMarketingOfferStatusAction(offerId: number, status: 'active' | 'paused'): Promise<OfferMutationResult> {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user || !hasCapability(user.role, 'manage_marketing_offers')) return { error: 'No tienes permiso para cambiar esta oferta.' };
  if (!Number.isInteger(offerId) || offerId <= 0) return { error: 'Oferta no válida.' };

  const admin = createAdminClient();

  const { data, error } = await admin
    .from('marketing_offers')
    .update({ status, updated_by: user.id })
    .eq('id', offerId)
    .select('id, organization_id')
    .maybeSingle();
  if (error || !data) return { error: error?.message || 'La oferta ya no está disponible.' };

  await admin.from('audit_events').insert({
    organization_id: data.organization_id,
    actor_user_id: user.id,
    action: status === 'active' ? 'marketing_offer_activated' : 'marketing_offer_paused',
    entity_type: 'marketing_offer',
    entity_id: String(offerId),
    metadata: { status },
  }).then(() => {}, () => {});
  revalidatePath('/portal/admin/offers');
  revalidatePath('/portal');
  revalidatePath('/portal/proposals/new');
  return { success: true };
}

export async function archiveMarketingOfferAction(offerId: number): Promise<OfferMutationResult> {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user || !hasCapability(user.role, 'manage_marketing_offers')) return { error: 'No tienes permiso para eliminar esta oferta.' };
  if (!Number.isInteger(offerId) || offerId <= 0) return { error: 'Oferta no válida.' };

  const admin = createAdminClient();

  const { data, error } = await admin
    .from('marketing_offers')
    .update({ status: 'archived', updated_by: user.id })
    .eq('id', offerId)
    .select('id, organization_id')
    .maybeSingle();
  if (error || !data) return { error: error?.message || 'La oferta ya no está disponible.' };

  await admin.from('audit_events').insert({
    organization_id: data.organization_id,
    actor_user_id: user.id,
    action: 'marketing_offer_archived',
    entity_type: 'marketing_offer',
    entity_id: String(offerId),
    metadata: {},
  }).then(() => {}, () => {});
  revalidatePath('/portal/admin/offers');
  revalidatePath('/portal');
  revalidatePath('/portal/proposals/new');
  return { success: true };
}
