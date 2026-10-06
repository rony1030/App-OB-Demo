"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth/get-user";
import {
  type AnalyticsEventType,
  type AnalyticsEventMetadata,
} from "@/lib/analytics/events";
import {
  trackEvent,
  getProjectAnalyticsSummary,
  type ProjectAnalyticsSummary,
} from "@/lib/analytics/service";

export async function recordAnalyticsEventAction(payload: {
  projectId?: number;
  organizationId?: number;
  eventType: AnalyticsEventType;
  metadata?: AnalyticsEventMetadata;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const currentUser = await getCurrentUser(supabase);
    let orgId = currentUser?.organization.id || payload.organizationId;
    if (!orgId && payload.projectId) {
      const { data: proj } = await supabase
        .from("projects")
        .select("organization_id")
        .eq("id", payload.projectId)
        .single();
      orgId = proj?.organization_id;
    }

    if (!orgId) {
      return { success: false, error: "No se pudo resolver la organización del evento." };
    }

    const res = await trackEvent(supabase, {
      organizationId: orgId,
      eventType: payload.eventType,
      metadata: {
        ...payload.metadata,
        projectId: payload.projectId,
      },
    });

    return res;
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function recordPresenceAction(payload: {
  sessionKey: string;
  surface: 'crm' | 'landing' | 'proposal_viewer' | 'dossier_viewer';
  projectId?: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (!/^[A-Za-z0-9_-]{16,128}$/.test(payload.sessionKey)) {
      return { success: false, error: 'Sesión inválida.' };
    }
    const supabase = await createClient();
    const currentUser = await getCurrentUser(supabase);
    const admin = createAdminClient();
    const { error } = await (admin).rpc('record_presence_service', {
      target_session_key: payload.sessionKey,
      target_surface: payload.surface,
      target_project_id: payload.projectId || undefined,
      target_actor_user_id: currentUser?.id || undefined,
    });
    return error ? { success: false, error: error.message } : { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function getProjectAnalyticsAction(
  projectId: number
): Promise<{ data: ProjectAnalyticsSummary | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const currentUser = await getCurrentUser(supabase);

    if (!currentUser) {
      return { data: null, error: "Debes iniciar sesión para consultar estadísticas." };
    }

    const { data: proj, error: projErr } = await supabase
      .from("projects")
      .select("id, organization_id")
      .eq("id", projectId)
      .single();

    if (projErr || !proj) {
      return { data: null, error: "Proyecto no encontrado." };
    }

    // The project SELECT is already protected by project-scoped RLS. Reaching
    // this point means the user owns the project or has an active assignment.
    const summary = await getProjectAnalyticsSummary(
      createAdminClient(),
      projectId,
      proj.organization_id
    );
    return { data: summary, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : String(err) };
  }
}
