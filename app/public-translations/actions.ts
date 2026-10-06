'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { getPublicProject } from '@/lib/data/projects';
import { getProjectLandingConfig } from '@/lib/data/landing-config';
import { getOrCreateTranslation, translatePresentationBatch, type TranslationRequest } from '@/lib/i18n/content-translations';
import { presentationTextEntries } from '@/lib/i18n/presentation-content';
import type { Locale } from '@/lib/i18n/locale';
import type { SupabaseClient } from '@supabase/supabase-js';

type PublicTranslationEntry = Pick<TranslationRequest, 'fieldPath' | 'sourceText' | 'context'>;

function contentEntries(project: NonNullable<Awaited<ReturnType<typeof getPublicProject>>>, config: Awaited<ReturnType<typeof getProjectLandingConfig>>): PublicTranslationEntry[] {
  const entries: PublicTranslationEntry[] = [
    { fieldPath: 'hero.subheadline', sourceText: config.hero.subheadline || project.shortDescription, context: 'Hero subtitle' },
    { fieldPath: 'project.description', sourceText: project.description, context: 'Project narrative' },
    { fieldPath: 'concept.title', sourceText: config.concept.title, context: 'Project concept heading' },
    { fieldPath: 'concept.description', sourceText: config.concept.description, context: 'Project concept text' },
    { fieldPath: 'specs.eyebrow', sourceText: config.specsEyebrow || '04 / Especificaciones Técnicas', context: 'Specifications eyebrow' },
    { fieldPath: 'specs.title', sourceText: config.specsTitle || 'Memoria de Calidades & Acabados.', context: 'Specifications heading' },
    { fieldPath: 'specs.subtitle', sourceText: config.specsSubtitle || 'Materiales, terminaciones y soluciones seleccionadas para el proyecto.', context: 'Specifications introduction' },
  ];

  project.amenities.forEach((value, index) => entries.push({ fieldPath: `amenities.${index}`, sourceText: value, context: 'Amenity name' }));
  project.highlights.forEach((value, index) => entries.push({ fieldPath: `highlights.${index}`, sourceText: value, context: 'Project highlight' }));
  project.paymentPlan.forEach((value, index) => entries.push({ fieldPath: `paymentPlan.${index}.label`, sourceText: value.label, context: 'Payment plan label' }));
  config.paymentSteps.forEach((value, index) => {
    entries.push({ fieldPath: `paymentSteps.${index}.title`, sourceText: value.title, context: 'Payment step title' });
    entries.push({ fieldPath: `paymentSteps.${index}.description`, sourceText: value.description, context: 'Payment step description' });
  });
  config.unitDetail?.includedEquipment.forEach((value, index) => entries.push({ fieldPath: `unitDetail.equipment.${index}`, sourceText: value, context: 'Included equipment' }));
  config.profitability?.items.forEach((value, index) => {
    entries.push({ fieldPath: `profitability.items.${index}.label`, sourceText: value.label, context: 'Investment scenario label' });
    entries.push({ fieldPath: `profitability.items.${index}.description`, sourceText: value.description, context: 'Investment scenario description' });
  });
  return entries.filter((entry) => entry.sourceText?.trim());
}

async function runWithConcurrency<T, R>(items: T[], limit: number, task: (item: T) => Promise<R>) {
  const results: R[] = [];
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const item = items[cursor++];
      results.push(await task(item));
    }
  }));
  return results;
}

export async function resolvePublicLandingTranslationsAction(projectSlug: string, targetLocale: Locale) {
  if (!['en', 'fr'].includes(targetLocale) || !/^[a-z0-9-]{2,100}$/i.test(projectSlug)) {
    return { translations: {}, error: 'Idioma o proyecto no válido.' };
  }

  try {
    const admin = createAdminClient();
    const translationDb = admin as unknown as SupabaseClient;
    const { data: projectRecord } = await translationDb
      .from('projects')
      .select('id, organization_id, publication_status')
      .eq('slug', projectSlug)
      .eq('publication_status', 'published')
      .maybeSingle();
    if (!projectRecord?.id || !projectRecord.organization_id) return { translations: {}, error: 'Proyecto público no encontrado.' };

    const project = await getPublicProject(projectSlug);
    if (!project) return { translations: {}, error: 'Proyecto público no encontrado.' };
    const config = await getProjectLandingConfig(project.id, project);
    const entries = contentEntries(project, config).slice(0, 80);
    const resolved = await runWithConcurrency(entries, 3, async (entry) => ({
      fieldPath: entry.fieldPath,
      result: await getOrCreateTranslation(translationDb, {
        organizationId: Number(projectRecord.organization_id),
        entityType: 'landing',
        entityId: project.id,
        fieldPath: entry.fieldPath,
        sourceLocale: 'es',
        targetLocale,
        sourceText: entry.sourceText,
        context: entry.context,
      }),
    }));
    return {
      translations: Object.fromEntries(resolved.filter(({ result }) => result.translation).map(({ fieldPath, result }) => [fieldPath, result.translation as string])),
      error: null,
    };
  } catch (error) {
    console.error('public landing translation failed', error instanceof Error ? error.name : 'unknown');
    return { translations: {}, error: 'No se pudieron resolver las traducciones.' };
  }
}

export async function resolvePublicPresentationTranslationsAction(
  token: string,
  targetLocale: Locale,
) {
  if (!['en', 'fr'].includes(targetLocale) || !/^[a-f0-9]{40}$/i.test(token)) {
    return { translations: {}, error: 'Idioma o enlace no válido.' };
  }
  try {
    const admin = createAdminClient();
    const translationDb = admin as unknown as SupabaseClient;
    const { data: link } = await translationDb
      .from('shared_links')
      .select('presentation_version_id, status, expires_at')
      .eq('token', token)
      .maybeSingle();
    if (!link || link.status !== 'active' || (link.expires_at && new Date(link.expires_at) < new Date())) {
      return { translations: {}, error: 'El enlace ya no está disponible.' };
    }
    const { data: version } = await translationDb
      .from('presentation_versions')
      .select('id, snapshot, presentation_id, presentation:presentations(id, organization_id, kind)')
      .eq('id', link.presentation_version_id)
      .maybeSingle();
    const presentation = Array.isArray(version?.presentation) ? version.presentation[0] : version?.presentation;
    if (!version?.presentation_id || !presentation?.organization_id) return { translations: {}, error: 'Presentación no encontrada.' };
    if (!Array.isArray(version.snapshot?.blocks)) throw new Error('El documento no contiene páginas traducibles.');
    const entries = presentationTextEntries(version.snapshot.blocks);
    // Keep batches small enough for long proposals with several units. Large JSON
    // responses are more likely to be truncated or fail numeric validation.
    const batches: typeof entries[] = [];
    for (let i = 0; i < entries.length; i += 12) batches.push(entries.slice(i, i + 12));
    const resolved = await runWithConcurrency(batches, 2, async (batch) => {
      const batchIndex = batches.indexOf(batch);
      const translated = await translatePresentationBatch(admin, {
        organizationId: Number(presentation.organization_id),
        entityType: presentation.kind === 'dossier' ? 'dossier' : 'proposal',
        entityId: String(version.presentation_id),
        fieldPath: `version.${version.id}.batch-v3.${batchIndex}`,
        sourceLocale: 'es',
        targetLocale,
        sourceText: '',
        context: 'Complete published real-estate document',
      }, Object.fromEntries(batch.map(entry => [entry.fieldPath, entry.sourceText])));
      return translated;
    });
    return { translations: Object.assign({}, ...resolved) as Record<string, string>, error: null };
  } catch (error) {
    console.error('public presentation translation failed', error instanceof Error ? error.name : 'unknown');
    return { translations: {}, error: 'No se pudieron resolver las traducciones.' };
  }
}
