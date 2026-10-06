'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/get-user';
import { hasCapability } from '@/lib/auth/permissions';
import { createClient } from '@/lib/supabase/server';
import {
  getOrCreateTranslation,
  auditMachineTranslations,
  normalizeTranslationText,
  reviewTranslationWithGemini,
  saveReviewedTranslation,
  type TranslatableEntityType,
} from '@/lib/i18n/content-translations';
import type { Locale } from '@/lib/i18n/locale';

type TranslateContentInput = {
  entityType: TranslatableEntityType;
  entityId: string | number;
  fieldPath: string;
  sourceLocale: Locale;
  targetLocale: Locale;
  sourceText: string;
  context?: string;
  revalidatePath?: string;
};

const validEntityTypes = new Set<TranslatableEntityType>(['project', 'landing', 'proposal', 'dossier', 'blog', 'crm']);
const validLocales = new Set<Locale>(['es', 'en', 'fr']);

function canTranslateContent(role: Parameters<typeof hasCapability>[0], entityType: TranslatableEntityType) {
  if (entityType === 'proposal' || entityType === 'dossier') {
    return hasCapability(role, 'create_proposals') || hasCapability(role, 'edit_project_dossier');
  }
  if (entityType === 'blog' || entityType === 'crm') {
    return hasCapability(role, 'manage_projects');
  }
  return hasCapability(role, 'manage_projects');
}

export async function translateContentAction(input: TranslateContentInput) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !validEntityTypes.has(input.entityType) || !canTranslateContent(currentUser.role, input.entityType)) {
    return { success: false, error: 'No tienes permisos para traducir este contenido.' };
  }

  const sourceText = normalizeTranslationText(input.sourceText || '');
  if (!sourceText || sourceText.length > 30_000 || !input.fieldPath?.trim() || !validLocales.has(input.sourceLocale) || !validLocales.has(input.targetLocale)) {
    return { success: false, error: 'El contenido o los idiomas de traducción no son válidos.' };
  }

  const db = await createClient();
  const result = await getOrCreateTranslation(db, {
    organizationId: currentUser.organization.id,
    entityType: input.entityType,
    entityId: input.entityId,
    fieldPath: input.fieldPath.trim(),
    sourceLocale: input.sourceLocale,
    targetLocale: input.targetLocale,
    sourceText,
    context: input.context,
  });

  if (input.revalidatePath?.startsWith('/')) revalidatePath(input.revalidatePath);

  return result.translation
    ? { success: true, translation: result.translation, status: result.status, translationId: result.id }
    : { success: false, error: result.error || 'No se pudo generar la traducción.', status: result.status };
}

export async function approveTranslationAction(translationId: number, translatedText: string, revalidationPath?: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser || (!hasCapability(currentUser.role, 'manage_projects') && !hasCapability(currentUser.role, 'edit_project_dossier'))) {
    return { success: false, error: 'No tienes permisos para revisar traducciones.' };
  }

  const finalText = normalizeTranslationText(translatedText || '');
  if (!Number.isInteger(translationId) || translationId < 1 || !finalText || finalText.length > 30_000) {
    return { success: false, error: 'La traducción no es válida.' };
  }

  const db = await createClient();
  const { error } = await (db)
    .from('content_translations')
    .update({ status: 'reviewed', translated_text: finalText, reviewed_at: new Date().toISOString(), reviewed_by: currentUser.id, error_message: null })
    .eq('id', translationId)
    .eq('organization_id', currentUser.organization.id);

  if (error) return { success: false, error: error.message };
  if (revalidationPath?.startsWith('/')) revalidatePath(revalidationPath);
  return { success: true };
}

export async function saveManualTranslationAction(input: TranslateContentInput, translatedText: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !validEntityTypes.has(input.entityType) || !canTranslateContent(currentUser.role, input.entityType)) {
    return { success: false, error: 'No tienes permisos para guardar esta traducción.' };
  }

  const sourceText = normalizeTranslationText(input.sourceText || '');
  const finalText = normalizeTranslationText(translatedText || '');
  if (!sourceText || !finalText || sourceText.length > 30_000 || finalText.length > 30_000 || !input.fieldPath?.trim() || input.sourceLocale === input.targetLocale || !validLocales.has(input.sourceLocale) || !validLocales.has(input.targetLocale)) {
    return { success: false, error: 'El contenido o los idiomas de traducción no son válidos.' };
  }

  const db = await createClient();
  const result = await saveReviewedTranslation(db, {
    organizationId: currentUser.organization.id,
    entityType: input.entityType,
    entityId: input.entityId,
    fieldPath: input.fieldPath.trim(),
    sourceLocale: input.sourceLocale,
    targetLocale: input.targetLocale,
    sourceText,
    context: input.context,
  }, finalText, currentUser.id);

  if (result.error) return { success: false, error: result.error };
  if (input.revalidatePath?.startsWith('/')) revalidatePath(input.revalidatePath);
  return { success: true, status: 'reviewed' };
}

export async function reviewTranslationAction(translationId: number) {
  const currentUser = await getCurrentUser();
  if (!currentUser || (!hasCapability(currentUser.role, 'manage_projects') && !hasCapability(currentUser.role, 'edit_project_dossier'))) {
    return { success: false, error: 'No tienes permisos para verificar traducciones.' };
  }

  if (!Number.isInteger(translationId) || translationId < 1) {
    return { success: false, error: 'La traducción no es válida.' };
  }

  const db = await createClient();
  const { data: translation, error: lookupError } = await (db)
    .from('content_translations')
    .select('id, source_locale, target_locale, source_text, translated_text, field_path')
    .eq('id', translationId)
    .eq('organization_id', currentUser.organization.id)
    .maybeSingle();

  if (lookupError || !translation?.translated_text) {
    return { success: false, error: lookupError?.message || 'No se encontró una traducción para revisar.' };
  }

  const review = await reviewTranslationWithGemini({
    sourceLocale: translation.source_locale as Locale,
    targetLocale: translation.target_locale as Locale,
    sourceText: translation.source_text,
    translatedText: translation.translated_text,
    context: translation.field_path,
  });

  const { error: saveError } = await (db).from('content_translation_reviews').insert({
    translation_id: translation.id,
    organization_id: currentUser.organization.id,
    status: review.status,
    score: review.score,
    findings: review.findings,
    suggested_text: review.suggestedText,
    provider: review.provider,
    model: review.model,
    error_message: review.error || null,
  });

  if (saveError) return { success: false, error: saveError.message };
  await (db).from('content_translations').update({ last_reviewed_at: new Date().toISOString() }).eq('id', translation.id);
  return { success: true, review };
}

export async function reviewRecentTranslationsAction(limit = 20) {
  const currentUser = await getCurrentUser();
  if (!currentUser || !hasCapability(currentUser.role, 'manage_projects')) {
    return { success: false, error: 'No tienes permisos para ejecutar una revisión masiva.' };
  }

  const db = await createClient();
  const audit = await auditMachineTranslations(db, { limit });
  return audit.error ? { success: false, error: audit.error } : { success: true, ...audit };
}
