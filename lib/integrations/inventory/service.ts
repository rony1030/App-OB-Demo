import "server-only";

import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CanaRockInventoryConnector } from "./cana-rock";
import { reconcileInventorySnapshot } from "./reconcile";
import type {
  CanonicalInventoryUnit,
  InventorySnapshot,
  ReconciliationRunResult,
} from "./types";

export type SimulationScenario = "current" | "with_changes" | "currency_mismatch" | "mass_drop";

export interface ReconcileOptions {
  mode: "shadow" | "active";
  scenario?: SimulationScenario;
}

export async function fetchProjectSnapshot(
  supabase: SupabaseClient,
  projectId: number,
  scenario: SimulationScenario = "current"
): Promise<InventorySnapshot> {
  const { data: project } = await supabase
    .from("projects")
    .select("id, slug, name, currency")
    .eq("id", projectId)
    .single();

  if (!project) {
    throw new Error(`Proyecto ID ${projectId} no encontrado.`);
  }

  const liveUrl = process.env.CANA_ROCK_AVAILABILITY_URL;
  const liveKey = process.env.CANA_ROCK_AVAILABILITY_API_KEY;

  // If live credentials are set and not forcing a test scenario
  if (liveUrl && liveKey && scenario === "current") {
    const connector = new CanaRockInventoryConnector({
      baseUrl: liveUrl,
      apiKey: liveKey,
    });
    return await connector.fetchSnapshot({ projectExternalId: project.slug });
  }

  // Otherwise, construct simulated snapshot from canonical DB + scenario
  const { data: rawUnits } = await supabase
    .from("units")
    .select("id, unit_code, status, list_price, currency, floor_level, bedrooms, bathrooms, total_sqm")
    .eq("project_id", projectId);

  const { data: rawMappings } = await supabase
    .from("external_unit_mappings")
    .select("external_unit_id, unit_id, external_unit_code")
    .eq("project_id", projectId);

  const mappingByUnitId = new Map<number, string>();
  for (const m of rawMappings || []) {
    if (m.unit_id) mappingByUnitId.set(m.unit_id, m.external_unit_id);
  }

  const units = rawUnits || [];
  const projectCurrency = (project.currency || "USD") as "USD" | "DOP" | "EUR";

  if (scenario === "mass_drop") {
    // Drop 80% of units to trigger mass disappearance quarantine
    const keptCount = Math.max(1, Math.floor(units.length * 0.15));
    const subset = units.slice(0, keptCount);
    const mappedSubset: CanonicalInventoryUnit[] = subset.map((u) => {
      const extId = mappingByUnitId.get(u.id) || `ext-${project.slug}-${u.unit_code}`;
      return {
        externalId: extId,
        unitCode: u.unit_code,
        projectExternalId: project.slug,
        typology: null,
        tower: null,
        floor: u.floor_level,
        bedrooms: u.bedrooms,
        bathrooms: u.bathrooms,
        areaSqm: u.total_sqm,
        parkingSpaces: 1,
        price: u.list_price,
        currency: projectCurrency,
        status: u.status,
        sourcePayload: { id: extId, code: u.unit_code, price: u.list_price, status: u.status },
      };
    });

    const serialized = JSON.stringify(mappedSubset);
    return {
      provider: "cana_rock_portal",
      projectExternalId: project.slug,
      receivedAt: new Date().toISOString(),
      sourceUpdatedAt: new Date().toISOString(),
      payloadHash: createHash("sha256").update(serialized).digest("hex"),
      units: mappedSubset,
      invalidUnits: [],
    };
  }

  if (scenario === "currency_mismatch") {
    // Change currency to DOP when project is USD to trigger currency quarantine
    const mismatchCurrency = projectCurrency === "USD" ? "DOP" : "USD";
    const convertedUnits: CanonicalInventoryUnit[] = units.map((u) => {
      const extId = mappingByUnitId.get(u.id) || `ext-${project.slug}-${u.unit_code}`;
      return {
        externalId: extId,
        unitCode: u.unit_code,
        projectExternalId: project.slug,
        typology: null,
        tower: null,
        floor: u.floor_level,
        bedrooms: u.bedrooms,
        bathrooms: u.bathrooms,
        areaSqm: u.total_sqm,
        parkingSpaces: 1,
        price: u.list_price,
        currency: mismatchCurrency as "USD" | "DOP" | "EUR",
        status: u.status,
        sourcePayload: { id: extId, code: u.unit_code, price: u.list_price, currency: mismatchCurrency },
      };
    });

    const serialized = JSON.stringify(convertedUnits);
    return {
      provider: "cana_rock_portal",
      projectExternalId: project.slug,
      receivedAt: new Date().toISOString(),
      sourceUpdatedAt: new Date().toISOString(),
      payloadHash: createHash("sha256").update(serialized).digest("hex"),
      units: convertedUnits,
      invalidUnits: [],
    };
  }

  // Standard or with changes
  const canonicalList: CanonicalInventoryUnit[] = units.map((u, idx) => {
    const extId = mappingByUnitId.get(u.id) || `ext-${project.slug}-${u.unit_code}`;
    let status = u.status;
    let price = u.list_price;

    if (scenario === "with_changes") {
      // Simulate 1 unit sold and 1 unit with price updated
      if (idx === 0) {
        status = u.status === "available" ? "sold" : "available";
      } else if (idx === 1) {
        price = (u.list_price || 200000) + 15000;
      }
    }

    return {
      externalId: extId,
      unitCode: u.unit_code,
      projectExternalId: project.slug,
      typology: null,
      tower: null,
      floor: u.floor_level,
      bedrooms: u.bedrooms,
      bathrooms: u.bathrooms,
      areaSqm: u.total_sqm,
      parkingSpaces: 1,
      price,
      currency: projectCurrency,
      status,
      sourcePayload: { id: extId, code: u.unit_code, price, status },
    };
  });

  if (scenario === "with_changes") {
    // Add 1 synthetic new unit
    canonicalList.push({
      externalId: `ext-${project.slug}-NEW-999`,
      unitCode: "NEW-999",
      projectExternalId: project.slug,
      typology: "Penthouse Exclusivo",
      tower: "Torre C",
      floor: 6,
      bedrooms: 3,
      bathrooms: 3,
      areaSqm: 185.5,
      parkingSpaces: 2,
      price: 345000,
      currency: projectCurrency,
      status: "available",
      sourcePayload: { id: `ext-${project.slug}-NEW-999`, code: "NEW-999", price: 345000 },
    });
  }

  const serialized = JSON.stringify(canonicalList);
  return {
    provider: "cana_rock_portal",
    projectExternalId: project.slug,
    receivedAt: new Date().toISOString(),
    sourceUpdatedAt: new Date().toISOString(),
    payloadHash: createHash("sha256").update(serialized).digest("hex"),
    units: canonicalList,
    invalidUnits: [],
  };
}

export async function executeInventorySync(
  supabase: SupabaseClient,
  projectId: number,
  options: ReconcileOptions
): Promise<ReconciliationRunResult> {
  const snapshot = await fetchProjectSnapshot(supabase, projectId, options.scenario || "current");
  return await reconcileInventorySnapshot(supabase, projectId, snapshot, options.mode);
}

export async function getProjectSyncHistory(
  supabase: SupabaseClient,
  projectId: number,
  limit: number = 10
) {
  const { data: runs, error } = await supabase
    .from("inventory_sync_runs")
    .select("id, connection_id, project_id, mode, status, received_count, created_count, updated_count, unchanged_count, invalid_count, missing_count, error_code, error_summary, started_at, finished_at, diff_summary")
    .eq("project_id", projectId)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Error consultando historial de sincronización: ${error.message}`);
  }

  return runs || [];
}

export async function getProjectIntegrationDetails(
  supabase: SupabaseClient,
  projectId: number
) {
  const { data: connection } = await supabase
    .from("integration_connections")
    .select("id, provider, display_name, external_project_id, base_url, status, last_attempt_at, last_success_at, last_error_code")
    .eq("project_id", projectId)
    .maybeSingle();

  const { count: mappedCount } = await supabase
    .from("external_unit_mappings")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .eq("is_active", true);

  const { data: lastRun } = await supabase
    .from("inventory_sync_runs")
    .select("id, mode, status, started_at, finished_at, received_count, created_count, updated_count, unchanged_count, missing_count, invalid_count, error_code, error_summary, diff_summary")
    .eq("project_id", projectId)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    connection,
    mappedUnitsCount: mappedCount || 0,
    lastRun: lastRun || null,
  };
}
