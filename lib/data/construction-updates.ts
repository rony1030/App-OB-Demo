import 'server-only';

import { createClient } from '@/lib/supabase/server';

export interface ConstructionPhoto {
  url: string;
  caption?: string;
  sort_order?: number;
}

export interface ProjectConstructionUpdate {
  id: string;
  project_id?: string;
  project_slug: string;
  title: string;
  report_date: string;
  overall_progress_percentage: number;
  stage_name: string;
  summary: string | null;
  description: string | null;
  drone_video_url: string | null;
  drone_video_thumbnail: string | null;
  photos: ConstructionPhoto[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Obtiene las actualizaciones y reportes de obra de un proyecto
 */
export async function getProjectConstructionUpdates(
  projectSlug: string,
  includeUnpublished: boolean = false
): Promise<ProjectConstructionUpdate[]> {
  try {
    const supabase = await createClient();
    // Utilizar any cast para compatibilidad con esquemas dinámicos de Supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('project_construction_updates')
      .select('*')
      .eq('project_slug', projectSlug)
      .order('report_date', { ascending: false });

    if (!includeUnpublished) {
      query = query.eq('is_published', true);
    }

    const { data, error } = await query;

    if (error) {
      // Si la tabla aún no existe o la migración está pendiente en remoto, no rompe el flujo
      console.warn(`[getProjectConstructionUpdates] Notice fetching updates for ${projectSlug}:`, error.message);
      return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((row: any) => ({
      id: String(row.id),
      project_id: row.project_id ? String(row.project_id) : undefined,
      project_slug: String(row.project_slug),
      title: String(row.title || ''),
      report_date: String(row.report_date || ''),
      overall_progress_percentage: Number(row.overall_progress_percentage || 0),
      stage_name: String(row.stage_name || 'En Construcción'),
      summary: row.summary ? String(row.summary) : null,
      description: row.description ? String(row.description) : null,
      drone_video_url: row.drone_video_url ? String(row.drone_video_url) : null,
      drone_video_thumbnail: row.drone_video_thumbnail ? String(row.drone_video_thumbnail) : null,
      photos: Array.isArray(row.photos) ? row.photos : [],
      is_published: Boolean(row.is_published),
      created_at: String(row.created_at || ''),
      updated_at: String(row.updated_at || ''),
    }));
  } catch (err) {
    console.warn(`[getProjectConstructionUpdates] Exception fetching updates for ${projectSlug}:`, err);
    return [];
  }
}
