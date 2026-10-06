'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPublicAssetUrl, PUBLIC_ASSETS_BUCKET } from '@/lib/supabase/storage';
import { getCurrentUser } from '@/lib/auth/get-user';
import { saveDynamicProjectTypologies } from '@/lib/data/project-typologies-db';
import type { ProjectVillaTypology } from '@/lib/data/cipres-typologies';

const AUTHORIZED_ROLES = [
  'super_admin',
  'master_broker_admin',
  'master_broker_operations',
  'developer_admin',
];

export interface PaymentPlanStepItem {
  id?: number;
  label: string;
  percentage?: number | null;
  fixed_amount?: number | null;
  milestone?: string | null;
  sort_order?: number;
}

export interface ProjectEditPayload {
  general: {
    name: string;
    location: string;
    zone: string;
    deliveryDate: string;
    startingPrice: number;
    currency: string;
    commissionRate: number;
    shortDescription: string;
    description: string;
    digitalFolderUrl?: string;
  };
  media: {
    heroUrl: string;
    galleryUrls: string[];
  };
  amenities: string[];
  typologies: Record<string, ProjectVillaTypology>;
  paymentPlan?: {
    planName?: string;
    currency?: string;
    steps: PaymentPlanStepItem[];
  };
}

function parseSqlDate(value?: string | null): string | null {
  if (!value) return null;
  const clean = value.trim();
  if (!clean || clean.toLowerCase().includes('definir')) return null;

  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;

  // If YYYY-MM
  if (/^\d{4}-\d{2}$/.test(clean)) return `${clean}-01`;

  // If YYYY
  if (/^\d{4}$/.test(clean)) return `${clean}-12-01`;

  // Try parsing Spanish month strings like "Diciembre 2027", "Dic de 2027", etc.
  const months: Record<string, string> = {
    enero: '01', ene: '01',
    febrero: '02', feb: '02',
    marzo: '03', mar: '03',
    abril: '04', abr: '04',
    mayo: '05', may: '05',
    junio: '06', jun: '06',
    julio: '07', jul: '07',
    agosto: '08', ago: '08',
    septiembre: '09', sep: '09', set: '09',
    octubre: '10', oct: '10',
    noviembre: '11', nov: '11',
    diciembre: '12', dic: '12',
  };

  const lower = clean.toLowerCase();
  for (const [name, num] of Object.entries(months)) {
    if (lower.includes(name)) {
      const yearMatch = lower.match(/\b(20\d{2})\b/);
      if (yearMatch) {
        return `${yearMatch[1]}-${num}-01`;
      }
    }
  }

  // Fallback: try standard date parse
  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return null;
}

export async function updateProjectFullAction(
  projectId: number,
  payload: ProjectEditPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const currentUser = await getCurrentUser(supabase);

    if (!currentUser || !AUTHORIZED_ROLES.includes(currentUser.role)) {
      return { success: false, error: 'No tienes permisos para editar este proyecto.' };
    }

    const orgId = currentUser.organization?.id || 1;

    // 1. Fetch current project to know slug
    const { data: currentProject, error: fetchErr } = await supabase
      .from('projects')
      .select('id, slug, organization_id')
      .eq('id', projectId)
      .single();

    if (fetchErr || !currentProject) {
      return { success: false, error: `Proyecto no encontrado (${fetchErr?.message || 'ID inválido'}).` };
    }

    // 2. Update projects table
    const safeDeliveryDate = parseSqlDate(payload.general.deliveryDate);
    const currency = payload.general.currency.trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) {
      return { success: false, error: 'La moneda debe ser un código ISO de tres letras, por ejemplo USD, DOP, EUR o CAD.' };
    }
    const { error: updateProjErr } = await supabase
      .from('projects')
      .update({
        name: payload.general.name.trim(),
        location: payload.general.location.trim(),
        zone: payload.general.zone.trim(),
        delivery_date: safeDeliveryDate,
        starting_price: Number(payload.general.startingPrice) || 0,
        currency,
        commission_rate: Number(payload.general.commissionRate) || 0,
        short_description: payload.general.shortDescription.trim(),
        description: payload.general.description.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    if (updateProjErr) {
      console.error('updateProjectFullAction: error updating projects table', updateProjErr);
      return { success: false, error: `Error al actualizar datos del proyecto: ${updateProjErr.message}` };
    }

    // 3. Update Hero Media
    if (payload.media.heroUrl.trim()) {
      const { data: existingHero } = await supabase
        .from('project_media')
        .select('id')
        .eq('project_id', projectId)
        .eq('kind', 'hero')
        .limit(1)
        .maybeSingle();

      const cleanHeroPath = payload.media.heroUrl.includes('public-assets/')
        ? payload.media.heroUrl.split('public-assets/')[1]
        : payload.media.heroUrl.trim();

      if (existingHero) {
        await supabase
          .from('project_media')
          .update({
            storage_path: cleanHeroPath,
            storage_bucket: 'public-assets',
          })
          .eq('id', existingHero.id);
      } else {
        await supabase.from('project_media').insert({
          organization_id: orgId,
          project_id: projectId,
          kind: 'hero',
          storage_bucket: 'public-assets',
          storage_path: cleanHeroPath,
          sort_order: 0,
        });
      }
    }

    // 4. Update Gallery Media
    if (Array.isArray(payload.media.galleryUrls)) {
      // Reconcile the full gallery so removing every image is also persisted.
      await supabase
        .from('project_media')
        .delete()
        .eq('project_id', projectId)
        .eq('kind', 'gallery');

      const seenPaths = new Set<string>();
      const galleryInserts = [];

      for (let idx = 0; idx < payload.media.galleryUrls.length; idx++) {
        const rawUrl = payload.media.galleryUrls[idx].trim();
        if (!rawUrl) continue;

        const cleanPath = rawUrl.includes('public-assets/')
          ? rawUrl.split('public-assets/')[1]
          : rawUrl;

        if (!seenPaths.has(cleanPath)) {
          seenPaths.add(cleanPath);
          galleryInserts.push({
            organization_id: orgId,
            project_id: projectId,
            kind: 'gallery',
            storage_bucket: 'public-assets',
            storage_path: cleanPath,
            sort_order: idx + 1,
          });
        }
      }

      if (galleryInserts.length > 0) {
        await supabase.from('project_media').insert(galleryInserts);
      }
    }

    // 4.5 Save or update digital folder (Google Drive / cloud link)
    const digitalFolderUrl = payload.general.digitalFolderUrl?.trim() || '';
    const { data: existingDigitalFolder } = await supabase
      .from('project_media')
      .select('id')
      .eq('project_id', projectId)
      .eq('kind', 'digital_folder')
      .maybeSingle();

    if (digitalFolderUrl) {
      if (existingDigitalFolder) {
        await supabase
          .from('project_media')
          .update({
            storage_path: digitalFolderUrl,
            storage_bucket: 'external',
            alt_text: 'Carpeta digital (Google Drive / Nube)',
          })
          .eq('id', existingDigitalFolder.id);
      } else {
        await supabase.from('project_media').insert({
          organization_id: orgId,
          project_id: projectId,
          kind: 'digital_folder',
          storage_bucket: 'external',
          storage_path: digitalFolderUrl,
          alt_text: 'Carpeta digital (Google Drive / Nube)',
          sort_order: 98,
        });
      }
    } else if (existingDigitalFolder) {
      await supabase
        .from('project_media')
        .delete()
        .eq('id', existingDigitalFolder.id);
    }

    // 5. Reconcile amenities through a scoped database function. This keeps
    // shared amenity records reusable while replacing only this project's links.
    const normalizedAmenities = Array.from(
      new Map(
        (payload.amenities || [])
          .map((name) => name.trim())
          .filter(Boolean)
          .map((name) => [name.toLocaleLowerCase('es'), name])
      ).values()
    );
    const { error: amenitiesError } = await supabase.rpc('replace_project_amenities', {
      target_project_id: projectId,
      amenity_items: normalizedAmenities.map((name) => ({ name })),
    });

    if (amenitiesError) {
      return { success: false, error: `Error al actualizar amenidades: ${amenitiesError.message}` };
    }

    // 6. Save dynamic typologies
    const typResult = await saveDynamicProjectTypologies(
      projectId,
      payload.typologies,
      orgId
    );
    if (!typResult.success) {
      return typResult;
    }

    // 6.5 Save payment plan
    if (payload.paymentPlan && Array.isArray(payload.paymentPlan.steps)) {
      try {
        const adminDb = createAdminClient();
        let planId: number | null = null;
        const { data: existingPlan } = await adminDb
          .from('payment_plans')
          .select('id')
          .eq('project_id', projectId)
          .eq('is_active', true)
          .order('id', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingPlan) {
          planId = existingPlan.id;
          await adminDb
            .from('payment_plans')
            .update({
              currency,
              name: payload.paymentPlan.planName?.trim() || 'Plan de Pago Estándar',
              updated_at: new Date().toISOString(),
            })
            .eq('id', planId);
        } else {
          const { data: newPlan, error: newPlanErr } = await adminDb
            .from('payment_plans')
            .insert({
              organization_id: orgId,
              project_id: projectId,
              name: payload.paymentPlan.planName?.trim() || 'Plan de Pago Estándar',
              currency,
              is_active: true,
            })
            .select('id')
            .single();
          if (newPlan) {
            planId = newPlan.id;
          } else if (newPlanErr) {
            console.error('Error creating payment plan:', newPlanErr);
          }
        }

        if (planId) {
          await adminDb.from('payment_plan_steps').delete().eq('payment_plan_id', planId);

          const stepInserts = payload.paymentPlan.steps
            .filter((step) => step.label && step.label.trim())
            .map((step, idx) => ({
              payment_plan_id: planId!,
              label: step.label.trim(),
              percentage: step.percentage !== null && step.percentage !== undefined ? Number(step.percentage) : null,
              fixed_amount: step.fixed_amount !== null && step.fixed_amount !== undefined ? Number(step.fixed_amount) : null,
              milestone: step.milestone?.trim() || null,
              sort_order: idx,
            }));

          if (stepInserts.length > 0) {
            const { error: stepsErr } = await adminDb.from('payment_plan_steps').insert(stepInserts);
            if (stepsErr) {
              console.error('Error inserting payment plan steps:', stepsErr);
            }
          }
        }
      } catch (planError) {
        console.error('Error handling payment plan update:', planError);
      }
    }

    // 7. Revalidate all routes
    revalidatePath(`/proyectos/${currentProject.slug}`);
    revalidatePath(`/portal/projects/${currentProject.slug}`);
    revalidatePath(`/portal/projects/${currentProject.slug}/dossier`);
    revalidatePath('/portal/admin/projects', 'layout');
    revalidatePath(`/portal/admin/projects`);
    revalidatePath('/');
    revalidatePath('/portal');

    return { success: true };
  } catch (err: unknown) {
    console.error('updateProjectFullAction unexpected error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error inesperado al guardar el proyecto.',
    };
  }
}

export async function getProjectPaymentPlanAction(projectId: number): Promise<{
  success: boolean;
  planName?: string;
  currency?: string;
  steps: PaymentPlanStepItem[];
  error?: string;
}> {
  try {
    const adminDb = createAdminClient();
    const { data: plan, error: planErr } = await adminDb
      .from('payment_plans')
      .select('id, name, currency, payment_plan_steps(id, label, percentage, fixed_amount, milestone, sort_order)')
      .eq('project_id', projectId)
      .eq('is_active', true)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (planErr) throw planErr;

    if (!plan) {
      // Check if there is any plan even if is_active is not set
      const { data: fallbackPlan } = await adminDb
        .from('payment_plans')
        .select('id, name, currency, payment_plan_steps(id, label, percentage, fixed_amount, milestone, sort_order)')
        .eq('project_id', projectId)
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fallbackPlan) {
        const steps = ((fallbackPlan.payment_plan_steps as unknown as Array<{ id: number; label: string; percentage: number | null; fixed_amount: number | null; milestone: string | null; sort_order: number }>) || [])
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
          .map((s) => ({
            id: s.id,
            label: s.label,
            percentage: s.percentage !== null && s.percentage !== undefined ? Number(s.percentage) : null,
            fixed_amount: s.fixed_amount !== null && s.fixed_amount !== undefined ? Number(s.fixed_amount) : null,
            milestone: s.milestone,
            sort_order: s.sort_order,
          }));
        return {
          success: true,
          planName: fallbackPlan.name,
          currency: fallbackPlan.currency,
          steps,
        };
      }
      return { success: true, steps: [] };
    }

    const steps = ((plan.payment_plan_steps as unknown as Array<{ id: number; label: string; percentage: number | null; fixed_amount: number | null; milestone: string | null; sort_order: number }>) || [])
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((s) => ({
        id: s.id,
        label: s.label,
        percentage: s.percentage !== null && s.percentage !== undefined ? Number(s.percentage) : null,
        fixed_amount: s.fixed_amount !== null && s.fixed_amount !== undefined ? Number(s.fixed_amount) : null,
        milestone: s.milestone,
        sort_order: s.sort_order,
      }));

    return {
      success: true,
      planName: plan.name,
      currency: plan.currency,
      steps,
    };
  } catch (err: unknown) {
    return {
      success: false,
      steps: [],
      error: err instanceof Error ? err.message : 'Error al obtener plan de pagos',
    };
  }
}

export async function saveImagePackAction(
  projectId: number,
  imagePackUrls: string[],
  watermarkLogoUrl: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const currentUser = await getCurrentUser(supabase);

    if (!currentUser || !AUTHORIZED_ROLES.includes(currentUser.role)) {
      return { success: false, error: 'No tienes permisos para editar este proyecto.' };
    }

    const orgId = currentUser.organization?.id || 1;

    const { data: project } = await supabase
      .from('projects')
      .select('id, slug, organization_id')
      .eq('id', projectId)
      .single();

    if (!project) {
      return { success: false, error: 'Proyecto no encontrado.' };
    }

    // Replace image_pack entries
    await supabase
      .from('project_media')
      .delete()
      .eq('project_id', projectId)
      .eq('kind', 'image_pack');

    if (imagePackUrls.length > 0) {
      const seenPaths = new Set<string>();
      const inserts = [];

      for (let idx = 0; idx < imagePackUrls.length; idx++) {
        const rawUrl = imagePackUrls[idx].trim();
        if (!rawUrl) continue;

        const cleanPath = rawUrl.includes('public-assets/')
          ? rawUrl.split('public-assets/')[1]
          : rawUrl;

        if (!seenPaths.has(cleanPath)) {
          seenPaths.add(cleanPath);
          inserts.push({
            organization_id: orgId,
            project_id: projectId,
            kind: 'image_pack',
            storage_bucket: 'public-assets',
            storage_path: cleanPath,
            sort_order: idx + 1,
          });
        }
      }

      if (inserts.length > 0) {
        await supabase.from('project_media').insert(inserts);
      }
    }

    // Replace watermark_logo entry
    await supabase
      .from('project_media')
      .delete()
      .eq('project_id', projectId)
      .eq('kind', 'watermark_logo');

    if (watermarkLogoUrl && watermarkLogoUrl.trim()) {
      const cleanPath = watermarkLogoUrl.includes('public-assets/')
        ? watermarkLogoUrl.split('public-assets/')[1]
        : watermarkLogoUrl.trim();

      await supabase.from('project_media').insert({
        organization_id: orgId,
        project_id: projectId,
        kind: 'watermark_logo',
        storage_bucket: 'public-assets',
        storage_path: cleanPath,
        sort_order: 0,
      });
    }

    revalidatePath(`/proyectos/${project.slug}`);
    revalidatePath('/portal/admin/projects', 'layout');

    return { success: true };
  } catch (err: unknown) {
    console.error('saveImagePackAction error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error inesperado al guardar el paquete de imágenes.',
    };
  }
}

export async function getImagePackAction(
  projectId: number
): Promise<{ imagePackUrls: string[]; watermarkLogoUrl: string | null }> {
  try {
    const supabase = await createClient();

    const { data: packMedia } = await supabase
      .from('project_media')
      .select('storage_path, storage_bucket')
      .eq('project_id', projectId)
      .eq('kind', 'image_pack')
      .order('sort_order', { ascending: true });

    const { data: watermarkMedia } = await supabase
      .from('project_media')
      .select('storage_path, storage_bucket')
      .eq('project_id', projectId)
      .eq('kind', 'watermark_logo')
      .limit(1)
      .maybeSingle();

    const imagePackUrls = (packMedia || []).map((m) => {
      if ((m.storage_bucket || PUBLIC_ASSETS_BUCKET) === PUBLIC_ASSETS_BUCKET) {
        return getPublicAssetUrl(m.storage_path);
      }
      const { data: { publicUrl } } = supabase.storage
        .from(m.storage_bucket || 'public-assets')
        .getPublicUrl(m.storage_path);
      return publicUrl;
    });

    let watermarkLogoUrl: string | null = null;
    if (watermarkMedia && (watermarkMedia.storage_bucket || PUBLIC_ASSETS_BUCKET) === PUBLIC_ASSETS_BUCKET) {
      watermarkLogoUrl = getPublicAssetUrl(watermarkMedia.storage_path);
    } else if (watermarkMedia) {
      const { data: { publicUrl } } = supabase.storage
        .from(watermarkMedia.storage_bucket || 'public-assets')
        .getPublicUrl(watermarkMedia.storage_path);
      watermarkLogoUrl = publicUrl;
    }

    return { imagePackUrls, watermarkLogoUrl };
  } catch {
    return { imagePackUrls: [], watermarkLogoUrl: null };
  }
}

export async function uploadProjectImageAction(
  projectId: number,
  formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const currentUser = await getCurrentUser(supabase);

    if (!currentUser || !AUTHORIZED_ROLES.includes(currentUser.role)) {
      return { success: false, error: 'No tienes permisos para subir imágenes.' };
    }

    const file = formData.get('file') as File | null;
    if (!file) {
      return { success: false, error: 'No se seleccionó ningún archivo.' };
    }

    const { data: project } = await supabase
      .from('projects')
      .select('id, slug, organization_id, organizations (slug)')
      .eq('id', projectId)
      .single();

    if (!project) {
      return { success: false, error: 'Proyecto no encontrado.' };
    }

    const orgSlug = (project.organizations as unknown as { slug: string } | null)?.slug || currentUser.organization.slug;
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const uniqueId = crypto.randomUUID();
    const storagePath = `${orgSlug}/projects/${project.slug}/gallery-${uniqueId}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    // The browser upload is intentionally protected by Storage RLS. Once the
    // authenticated role has been validated above, use the server-side admin
    // client for this controlled write so organization-folder RLS differences
    // cannot block legitimate project editors.
    const { error: uploadError } = await createAdminClient().storage
      .from('public-assets')
      .upload(storagePath, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload to public-assets failed:', uploadError);
      return { success: false, error: uploadError.message };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('public-assets')
      .getPublicUrl(storagePath);

    // Register in project_media as gallery
    await supabase.from('project_media').insert({
      organization_id: project.organization_id,
      project_id: projectId,
      kind: 'gallery',
      storage_bucket: 'public-assets',
      storage_path: storagePath,
      alt_text: file.name,
      sort_order: 99,
    });

    return { success: true, url: publicUrl };
  } catch (err: unknown) {
    console.error('uploadProjectImageAction unexpected error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error inesperado al subir la imagen.',
    };
  }
}
