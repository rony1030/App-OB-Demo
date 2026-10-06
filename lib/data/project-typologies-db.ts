import 'server-only';
import { createClient } from '@/lib/supabase/server';
import {
  PROJECT_TYPOLOGIES_KIND,
  CIPRES_RESIDENCES_TYPOLOGIES,
  UVE_RESIDENCES_TYPOLOGIES,
  type ProjectVillaTypology,
} from './cipres-typologies';

function sanitizeCipresTypologies(
  typologies: Record<string, ProjectVillaTypology>,
  projectId: number
): Record<string, ProjectVillaTypology> {
  if (projectId !== 13) return typologies;
  const cleaned: Record<string, ProjectVillaTypology> = {};

  for (const [key, t] of Object.entries(typologies)) {
    const item: ProjectVillaTypology = { ...t };
    // Lot size: must say "Desde 204 m²" (not "152.40 m² – 238.00 m²")
    if (
      !item.lotRangeSqm ||
      item.lotRangeSqm.includes('152') ||
      item.lotRangeSqm.includes('154') ||
      item.lotRangeSqm.includes('238')
    ) {
      item.lotRangeSqm = 'Desde 204 m²';
    }

    if (key === 'PERLA' || item.id === 'perla') {
      item.constructionAreaSqm = 68;
      item.bedrooms = 2;
      item.bathrooms = 2;
      item.tagline = '68 m² de Construcción · 2 Habitaciones · 2 Baños';
      item.description =
        'Modelo residencial de 68 m² de construcción. Cuenta con 2 habitaciones, 2 baños completos y área para 2 vehículos.';
      item.features = (item.features || [])
        .map((f) => {
          if (f.includes('98 m²') || f.includes('98')) return '68 m² de construcción';
          if (f.includes('3 Hab')) return '2 Habitaciones';
          if (f.includes('152') || f.includes('154') || f.includes('238'))
            return 'Solar privativo desde 204 m²';
          return f;
        })
        .filter(Boolean);

      if (!item.features.some((f) => f.includes('68 m²'))) item.features.unshift('68 m² de construcción');
      if (!item.features.some((f) => f.includes('2 Hab'))) item.features.push('2 Habitaciones');
      if (!item.features.some((f) => f.includes('2 Baño'))) item.features.push('2 Baños completos');
      if (!item.features.some((f) => f.includes('Solar'))) item.features.push('Solar privativo desde 204 m²');
    }

    if (key === 'ESMERALDA' || item.id === 'esmeralda') {
      item.constructionAreaSqm = 61;
      item.bedrooms = 2;
      item.bathrooms = 1;
      item.tagline = '61 m² de Construcción · 2 Habitaciones · 1 Baño';
      item.features = (item.features || []).map((f) => {
        if (f.includes('152') || f.includes('154') || f.includes('238'))
          return 'Solar privativo desde 204 m²';
        return f;
      });
      if (!item.features.some((f) => f.includes('Solar'))) item.features.push('Solar privativo desde 204 m²');
    }

    if (key === 'AMBAR' || item.id === 'ambar') {
      item.features = (item.features || []).map((f) => {
        if (f.includes('152') || f.includes('154') || f.includes('238'))
          return 'Solar privativo desde 204 m²';
        return f;
      });
      if (!item.features.some((f) => f.includes('Solar'))) item.features.push('Solar privativo desde 204 m²');
    }

    cleaned[key] = item;
  }
  return cleaned;
}

export async function getDynamicProjectTypologies(
  projectId: number,
  projectSlug?: string
): Promise<Record<string, ProjectVillaTypology>> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('project_media')
      .select('alt_text')
      .eq('project_id', projectId)
      .eq('kind', PROJECT_TYPOLOGIES_KIND)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data?.alt_text) {
      const parsed = JSON.parse(data.alt_text);
      if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
        return sanitizeCipresTypologies(parsed, projectId);
      }
    }
  } catch (err) {
    console.error('Error fetching dynamic project typologies:', err);
  }

  if (projectId === 13) {
    return CIPRES_RESIDENCES_TYPOLOGIES;
  }

  if (projectSlug === 'uve-residences') {
    return UVE_RESIDENCES_TYPOLOGIES;
  }

  return {};
}

export async function saveDynamicProjectTypologies(
  projectId: number,
  typologies: Record<string, ProjectVillaTypology>,
  orgId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const sanitized = sanitizeCipresTypologies(typologies, projectId);
    const payloadJson = JSON.stringify(sanitized);

    const { data: existing } = await supabase
      .from('project_media')
      .select('id')
      .eq('project_id', projectId)
      .eq('kind', PROJECT_TYPOLOGIES_KIND)
      .limit(1)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('project_media')
        .update({
          alt_text: payloadJson,
        })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      const { error } = await supabase.from('project_media').insert({
        organization_id: orgId,
        project_id: projectId,
        kind: PROJECT_TYPOLOGIES_KIND,
        storage_bucket: 'public-assets',
        storage_path: `ob-brokers-team/projects/project-typologies-${projectId}.json`,
        alt_text: payloadJson,
      });

      if (error) throw error;
    }

    return { success: true };
  } catch (err: unknown) {
    console.error('Error saving dynamic project typologies:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al guardar tipologías',
    };
  }
}
