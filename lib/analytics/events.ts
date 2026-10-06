/**
 * Diccionario Canónico de Eventos de Telemetría y Operación Comercial
 * Ciclo 013: Estadísticas, Métricas y Operación Continua
 *
 * Principio de Privacidad: Se registran eventos de bajo riesgo técnico y comercial.
 * Ningún evento almacena contraseñas, números de identificación, cuentas bancarias ni PII innecesaria.
 */

export type AnalyticsEventType =
  | "project_view"
  | "gallery_view"
  | "inventory_filter"
  | "unit_view"
  | "whatsapp_click"
  | "pdf_export"
  | "share_click"
  | "resource_download"
  | "proposal_created"
  | "proposal_view"
  | "dossier_view"
  | "sync_run";

export interface AnalyticsEventMetadata {
  projectId?: number;
  projectSlug?: string;
  projectName?: string;
  unitCode?: string;
  typology?: string;
  resourceCategory?: string;
  resourceTitle?: string;
  deviceType?: "desktop" | "mobile" | "tablet";
  source?: "landing" | "portal" | "proposal_viewer" | "api";
  filterSpecs?: {
    status?: string;
    bedrooms?: number;
    priceRange?: string;
  };
  durationSeconds?: number;
  sessionKey?: string;
  locationCountry?: string;
  locationCity?: string;
  pageIndex?: number;
  pageLabel?: string;
}

export interface CanonicalEngagementEvent {
  organizationId: number;
  eventType: AnalyticsEventType;
  sharedLinkId?: number | null;
  occurredAt?: string;
  metadata: AnalyticsEventMetadata;
}

export const EVENT_RETENTION_POLICY = {
  highRiskPII: "FORBIDDEN",
  operationalMetrics: "365_DAYS",
  anonymousPageViews: "90_DAYS",
  auditSecurityEvents: "PERMANENT",
} as const;

export function sanitizeAnalyticsMetadata(input: Record<string, unknown>): AnalyticsEventMetadata {
  const sanitized: AnalyticsEventMetadata = {};

  if (typeof input.projectId === "number") sanitized.projectId = input.projectId;
  if (typeof input.projectSlug === "string") sanitized.projectSlug = input.projectSlug.slice(0, 100);
  if (typeof input.projectName === "string") sanitized.projectName = input.projectName.slice(0, 150);
  if (typeof input.unitCode === "string") sanitized.unitCode = input.unitCode.slice(0, 50);
  if (typeof input.typology === "string") sanitized.typology = input.typology.slice(0, 100);
  if (typeof input.resourceCategory === "string") sanitized.resourceCategory = input.resourceCategory.slice(0, 50);
  if (typeof input.resourceTitle === "string") sanitized.resourceTitle = input.resourceTitle.slice(0, 150);
  if (input.deviceType === "desktop" || input.deviceType === "mobile" || input.deviceType === "tablet") {
    sanitized.deviceType = input.deviceType;
  }
  if (input.source === "landing" || input.source === "portal" || input.source === "proposal_viewer" || input.source === "api") {
    sanitized.source = input.source;
  }
  if (typeof input.durationSeconds === "number" && input.durationSeconds >= 0) {
    sanitized.durationSeconds = Math.min(input.durationSeconds, 86400);
  }
  if (typeof input.sessionKey === "string" && /^[A-Za-z0-9_-]{16,128}$/.test(input.sessionKey)) {
    sanitized.sessionKey = input.sessionKey;
  }
  if (typeof input.locationCountry === "string") sanitized.locationCountry = input.locationCountry.slice(0, 80);
  if (typeof input.locationCity === "string") sanitized.locationCity = input.locationCity.slice(0, 100);
  if (typeof input.pageIndex === "number" && Number.isInteger(input.pageIndex) && input.pageIndex >= 1) {
    sanitized.pageIndex = Math.min(input.pageIndex, 500);
  }
  if (typeof input.pageLabel === "string") sanitized.pageLabel = input.pageLabel.slice(0, 100);

  return sanitized;
}
