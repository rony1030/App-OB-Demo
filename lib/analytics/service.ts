import type { createClient } from "@/lib/supabase/server";
import {
  type AnalyticsEventType,
  type CanonicalEngagementEvent,
  sanitizeAnalyticsMetadata,
} from "./events";
import type { Json } from "@/types/database";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export interface ProjectAnalyticsSummary {
  projectId: number;
  totalViews: number;
  totalUnitViews: number;
  totalWhatsappClicks: number;
  totalPdfExports: number;
  totalProposalsCreated: number;
  totalProposalViews: number;
  totalProposalPdfs: number;
  totalProposalShares: number;
  totalProposalWhatsappClicks: number;
  totalResourceDownloads: number;
  topUnits: { unitCode: string; views: number }[];
  topResources: { title: string; downloads: number }[];
  recentActivity: {
    eventType: AnalyticsEventType;
    description: string;
    occurredAt: string;
  }[];
}

export async function trackEvent(
  supabase: SupabaseServerClient,
  event: CanonicalEngagementEvent
): Promise<{ success: boolean; error?: string }> {
  try {
    const sanitized = sanitizeAnalyticsMetadata(event.metadata as unknown as Record<string, unknown>);

    const { error } = await supabase.from("engagement_events").insert({
      organization_id: event.organizationId,
      shared_link_id: event.sharedLinkId ?? null,
      event_type: event.eventType,
      metadata: sanitized as unknown as Json,
      occurred_at: event.occurredAt || new Date().toISOString(),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function getProjectAnalyticsSummary(
  supabase: SupabaseServerClient,
  projectId: number,
  organizationId: number
): Promise<ProjectAnalyticsSummary> {
  const { data: rows } = await supabase
    .from("engagement_events")
    .select("event_type, metadata, occurred_at")
    .eq("organization_id", organizationId)
    .order("occurred_at", { ascending: false })
    .limit(1000);

  const events = (rows || []).filter((r) => {
    const meta = r.metadata as unknown as { projectId?: number } | null;
    return meta?.projectId === projectId;
  });

  let totalViews = 0;
  let totalUnitViews = 0;
  let totalWhatsappClicks = 0;
  let totalPdfExports = 0;
  let totalProposalsCreated = 0;
  let totalProposalViews = 0;
  let totalProposalPdfs = 0;
  let totalProposalShares = 0;
  let totalProposalWhatsappClicks = 0;
  let totalResourceDownloads = 0;

  const unitViewsMap: Record<string, number> = {};
  const resourceMap: Record<string, number> = {};

  events.forEach((e) => {
    const meta = e.metadata as unknown as {
      unitCode?: string;
      resourceTitle?: string;
      source?: string;
    } | null;

    switch (e.event_type) {
      case "project_view":
        totalViews++;
        break;
      case "unit_view":
        totalUnitViews++;
        if (meta?.unitCode) {
          unitViewsMap[meta.unitCode] = (unitViewsMap[meta.unitCode] || 0) + 1;
        }
        break;
      case "whatsapp_click":
        totalWhatsappClicks++;
        if (meta?.source === 'proposal_viewer') totalProposalWhatsappClicks++;
        break;
      case "pdf_export":
        totalPdfExports++;
        if (meta?.source === 'proposal_viewer') totalProposalPdfs++;
        break;
      case "proposal_created":
        totalProposalsCreated++;
        break;
      case "proposal_view":
        totalProposalViews++;
        break;
      case "share_click":
        totalProposalShares++;
        break;
      case "resource_download":
        totalResourceDownloads++;
        if (meta?.resourceTitle) {
          resourceMap[meta.resourceTitle] = (resourceMap[meta.resourceTitle] || 0) + 1;
        }
        break;
    }
  });

  const topUnits = Object.entries(unitViewsMap)
    .map(([unitCode, views]) => ({ unitCode, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  const topResources = Object.entries(resourceMap)
    .map(([title, downloads]) => ({ title, downloads }))
    .sort((a, b) => b.downloads - a.downloads)
    .slice(0, 5);

  const recentActivity = events.slice(0, 10).map((e) => {
    const meta = e.metadata as unknown as {
      unitCode?: string;
      resourceTitle?: string;
    } | null;

    let description = "Interacción con el proyecto";
    if (e.event_type === "project_view") description = "Visita a landing de proyecto";
    if (e.event_type === "unit_view") description = `Consulta de unidad ${meta?.unitCode || ""}`;
    if (e.event_type === "whatsapp_click") description = `Contacto por WhatsApp para unidad ${meta?.unitCode || ""}`;
    if (e.event_type === "pdf_export") description = "Exportación de lista de disponibilidad en PDF";
    if (e.event_type === "proposal_created") description = `Propuesta generada para unidad ${meta?.unitCode || ""}`;
    if (e.event_type === "resource_download") description = `Descarga de documento: ${meta?.resourceTitle || ""}`;

    return {
      eventType: e.event_type as AnalyticsEventType,
      description,
      occurredAt: e.occurred_at,
    };
  });

  return {
    projectId,
    totalViews,
    totalUnitViews,
    totalWhatsappClicks,
    totalPdfExports,
    totalProposalsCreated,
    totalProposalViews,
    totalProposalPdfs,
    totalProposalShares,
    totalProposalWhatsappClicks,
    totalResourceDownloads,
    topUnits,
    topResources,
    recentActivity,
  };
}
