import "server-only";

import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  FieldDiff,
  InventorySnapshot,
  ReconciliationRunResult,
  ReconciliationSummary,
  UnitReconciliationDiff,
} from "./types";

interface DbUnit {
  id: number;
  project_id: number;
  unit_code: string;
  status: "available" | "separated" | "sold" | "blocked";
  list_price: number;
  currency: "USD" | "DOP" | "EUR";
  floor_level: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  total_sqm: number | null;
  is_public: boolean;
}

interface DbMapping {
  id: number;
  connection_id: number;
  project_id: number;
  unit_id: number | null;
  external_unit_id: string;
  external_unit_code: string;
  source_hash: string | null;
  is_active: boolean;
}

interface DbConnection {
  id: number;
  project_id: number;
  provider: string;
  display_name: string;
  external_project_id: string;
  base_url: string;
  credentials_secret_name: string;
  status: string;
}

export async function reconcileInventorySnapshot(
  supabase: SupabaseClient,
  projectId: number,
  snapshot: InventorySnapshot,
  mode: "shadow" | "active" = "shadow"
): Promise<ReconciliationRunResult> {
  const startedAt = new Date().toISOString();

  // 1. Fetch project info
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, organization_id, slug, name, currency, starting_price, inventory_total_declared, inventory_available_declared")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    throw new Error(`No se encontró el proyecto ID ${projectId}: ${projectError?.message || "No existe"}`);
  }

  // 2. Fetch or resolve connection
  let { data: connection } = await supabase
    .from("integration_connections")
    .select("id, project_id, provider, display_name, external_project_id, base_url, credentials_secret_name, status")
    .eq("project_id", projectId)
    .eq("provider", snapshot.provider)
    .maybeSingle();

  if (!connection) {
    // Check if there is any connection for this project
    const { data: anyConn } = await supabase
      .from("integration_connections")
      .select("id, project_id, provider, display_name, external_project_id, base_url, credentials_secret_name, status")
      .eq("project_id", projectId)
      .limit(1)
      .maybeSingle();

    if (anyConn) {
      connection = anyConn;
    } else {
      // Create a default paused connection for this provider
      const { data: newConn, error: connErr } = await supabase
        .from("integration_connections")
        .insert({
          project_id: projectId,
          provider: snapshot.provider,
          display_name: `Conector ${snapshot.provider}`,
          external_project_id: snapshot.projectExternalId || project.slug,
          base_url: "https://portal.canarock.info",
          credentials_secret_name: "CANA_ROCK_AVAILABILITY_API_KEY",
          status: "paused",
          sync_interval_seconds: 300,
          config: { autoCreated: true },
        })
        .select()
        .single();

      if (connErr || !newConn) {
        throw new Error(`No se pudo inicializar la conexión del proyecto: ${connErr?.message}`);
      }
      connection = newConn as DbConnection;
    }
  }

  // 3. Fetch existing units for this project
  const { data: rawUnits, error: unitsError } = await supabase
    .from("units")
    .select("id, project_id, unit_code, status, list_price, currency, floor_level, bedrooms, bathrooms, total_sqm, is_public")
    .eq("project_id", projectId);

  if (unitsError) {
    throw new Error(`Error cargando unidades canónicas: ${unitsError.message}`);
  }

  const existingUnits: DbUnit[] = (rawUnits || []) as DbUnit[];
  const unitsByCode = new Map<string, DbUnit>();
  const unitsById = new Map<number, DbUnit>();
  for (const u of existingUnits) {
    unitsByCode.set(u.unit_code.trim().toUpperCase(), u);
    unitsById.set(u.id, u);
  }

  // 4. Fetch existing mappings for this connection
  const { data: rawMappings } = await supabase
    .from("external_unit_mappings")
    .select("id, connection_id, project_id, unit_id, external_unit_id, external_unit_code, source_hash, is_active")
    .eq("connection_id", connection.id);

  const mappings: DbMapping[] = (rawMappings || []) as DbMapping[];
  const mappingByExternalId = new Map<string, DbMapping>();
  const mappingByUnitId = new Map<number, DbMapping>();
  for (const m of mappings) {
    mappingByExternalId.set(m.external_unit_id, m);
    if (m.unit_id) {
      mappingByUnitId.set(m.unit_id, m);
    }
  }

  // 5. Guardrail Checks
  let isQuarantined = false;
  let quarantineReason: string | undefined;

  // Check 5a: Currency mismatch check
  const projectCurrency = (project.currency || "USD").toUpperCase();
  const invalidCurrencyUnits = snapshot.units.filter(
    (u) => u.currency && u.currency.toUpperCase() !== projectCurrency
  );
  if (invalidCurrencyUnits.length > 0) {
    isQuarantined = true;
    quarantineReason = `Discrepancia de divisa crítica: ${invalidCurrencyUnits.length} unidades recibidas en ${invalidCurrencyUnits[0].currency}, pero el proyecto opera en ${projectCurrency}. Sincronización puesta en cuarentena para evitar corrupción comercial.`;
  }

  // Check 5b: Mass disappearance check (> 20% dropped from feed when >= 5 units previously mapped)
  const activeMappedCount = mappings.filter((m) => m.is_active && m.unit_id !== null).length;
  if (!isQuarantined && activeMappedCount >= 5) {
    const receivedIds = new Set(snapshot.units.map((u) => u.externalId));
    const missingCount = mappings.filter((m) => m.is_active && !receivedIds.has(m.external_unit_id)).length;
    const dropPercentage = (missingCount / activeMappedCount) * 100;
    if (dropPercentage > 20) {
      isQuarantined = true;
      quarantineReason = `Alerta de desaparición masiva: ${missingCount} de ${activeMappedCount} unidades (${dropPercentage.toFixed(1)}%) desaparecieron de la fuente externa. Umbral de seguridad del 20% superado. La sincronización se pone en cuarentena para evitar desabastecimiento erróneo.`;
    }
  }

  // 6. Compute unit-by-unit differences
  const diffs: UnitReconciliationDiff[] = [];
  const processedExternalIds = new Set<string>();
  const matchedCanonicalUnitIds = new Set<number>();

  let newCount = 0;
  let updatedCount = 0;
  let unchangedCount = 0;

  for (const inc of snapshot.units) {
    processedExternalIds.add(inc.externalId);

    // Look up via mapping or unit code
    const mapping = mappingByExternalId.get(inc.externalId);
    let matchedUnit: DbUnit | undefined;
    if (mapping && mapping.unit_id) {
      matchedUnit = unitsById.get(mapping.unit_id);
    }
    if (!matchedUnit) {
      matchedUnit = unitsByCode.get(inc.unitCode.trim().toUpperCase());
    }

    if (!matchedUnit) {
      // New unit from source
      newCount++;
      diffs.push({
        unitCode: inc.unitCode,
        externalUnitId: inc.externalId,
        canonicalUnitId: null,
        kind: "new_unit",
        differences: [
          { field: "unit_code", label: "Código", oldValue: null, newValue: inc.unitCode },
          { field: "price", label: "Precio Lista", oldValue: null, newValue: inc.price },
          { field: "status", label: "Estado", oldValue: null, newValue: inc.status },
          { field: "floor", label: "Nivel / Piso", oldValue: null, newValue: inc.floor },
          { field: "bedrooms", label: "Habitaciones", oldValue: null, newValue: inc.bedrooms },
          { field: "bathrooms", label: "Baños", oldValue: null, newValue: inc.bathrooms },
          { field: "area", label: "Metraje (m²)", oldValue: null, newValue: inc.areaSqm },
        ],
        currentUnit: null,
        incomingUnit: inc,
      });
      continue;
    }

    matchedCanonicalUnitIds.add(matchedUnit.id);

    // Compare fields
    const fieldDiffs: FieldDiff[] = [];

    // Map status
    const canonicalStatusNormalized = matchedUnit.status.toLowerCase();
    const incomingStatusNormalized = (
      inc.status === "available" ? "available"
      : inc.status === "sold" ? "sold"
      : inc.status === "separated" || inc.status === "reserved" ? "separated"
      : inc.status === "blocked" || inc.status === "withdrawn" ? "blocked"
      : "available"
    );

    if (canonicalStatusNormalized !== incomingStatusNormalized) {
      fieldDiffs.push({
        field: "status",
        label: "Estado",
        oldValue: matchedUnit.status,
        newValue: incomingStatusNormalized,
      });
    }

    // Price comparison (numeric tolerance of 0.01)
    if (inc.price !== null && Math.abs((matchedUnit.list_price || 0) - inc.price) >= 0.01) {
      fieldDiffs.push({
        field: "price",
        label: "Precio Lista",
        oldValue: matchedUnit.list_price,
        newValue: inc.price,
      });
    }

    // Floor comparison
    if (inc.floor !== null && matchedUnit.floor_level !== inc.floor) {
      fieldDiffs.push({
        field: "floor",
        label: "Nivel / Piso",
        oldValue: matchedUnit.floor_level,
        newValue: inc.floor,
      });
    }

    // Bedrooms comparison
    if (inc.bedrooms !== null && matchedUnit.bedrooms !== inc.bedrooms) {
      fieldDiffs.push({
        field: "bedrooms",
        label: "Habitaciones",
        oldValue: matchedUnit.bedrooms,
        newValue: inc.bedrooms,
      });
    }

    // Bathrooms comparison
    if (inc.bathrooms !== null && matchedUnit.bathrooms !== inc.bathrooms) {
      fieldDiffs.push({
        field: "bathrooms",
        label: "Baños",
        oldValue: matchedUnit.bathrooms,
        newValue: inc.bathrooms,
      });
    }

    // Area sqm comparison
    if (inc.areaSqm !== null && Math.abs((matchedUnit.total_sqm || 0) - inc.areaSqm) >= 0.1) {
      fieldDiffs.push({
        field: "area",
        label: "Metraje (m²)",
        oldValue: matchedUnit.total_sqm,
        newValue: inc.areaSqm,
      });
    }

    const currentUnitSnapshot = {
      unitCode: matchedUnit.unit_code,
      status: matchedUnit.status,
      listPrice: matchedUnit.list_price,
      currency: matchedUnit.currency,
      floorLevel: matchedUnit.floor_level,
      bedrooms: matchedUnit.bedrooms,
      bathrooms: matchedUnit.bathrooms,
      totalSqm: matchedUnit.total_sqm,
    };

    if (fieldDiffs.length > 0) {
      updatedCount++;
      const hasPriceChange = fieldDiffs.some((d) => d.field === "price");
      const hasStatusChange = fieldDiffs.some((d) => d.field === "status");
      const kind = hasPriceChange ? "price_changed" : hasStatusChange ? "status_changed" : "specs_changed";

      diffs.push({
        unitCode: inc.unitCode,
        externalUnitId: inc.externalId,
        canonicalUnitId: matchedUnit.id,
        kind,
        differences: fieldDiffs,
        currentUnit: currentUnitSnapshot,
        incomingUnit: inc,
      });
    } else {
      unchangedCount++;
      diffs.push({
        unitCode: inc.unitCode,
        externalUnitId: inc.externalId,
        canonicalUnitId: matchedUnit.id,
        kind: "unchanged",
        differences: [],
        currentUnit: currentUnitSnapshot,
        incomingUnit: inc,
      });
    }
  }

  // 7. Find units in DB/mapping missing from source
  let missingCount = 0;
  for (const m of mappings) {
    if (m.is_active && !processedExternalIds.has(m.external_unit_id)) {
      missingCount++;
      const canonicalUnit = m.unit_id ? unitsById.get(m.unit_id) : undefined;
      diffs.push({
        unitCode: m.external_unit_code,
        externalUnitId: m.external_unit_id,
        canonicalUnitId: m.unit_id,
        kind: "missing_from_source",
        differences: [
          {
            field: "presence",
            label: "Presencia en Fuente",
            oldValue: "Presente en inventario",
            newValue: "Ausente en fuente externa",
          },
        ],
        currentUnit: canonicalUnit
          ? {
              unitCode: canonicalUnit.unit_code,
              status: canonicalUnit.status,
              listPrice: canonicalUnit.list_price,
              currency: canonicalUnit.currency,
              floorLevel: canonicalUnit.floor_level,
              bedrooms: canonicalUnit.bedrooms,
              bathrooms: canonicalUnit.bathrooms,
              totalSqm: canonicalUnit.total_sqm,
            }
          : null,
        incomingUnit: null,
      });
    }
  }

  // 8. Track invalid units
  for (const inv of snapshot.invalidUnits) {
    diffs.push({
      unitCode: `Índice #${inv.index}`,
      externalUnitId: `invalid-${inv.index}`,
      canonicalUnitId: null,
      kind: "invalid",
      differences: [],
      currentUnit: null,
      incomingUnit: null,
      invalidReason: inv.reason,
    });
  }

  const invalidCount = snapshot.invalidUnits.length;
  const runStatus = isQuarantined ? "quarantined" : invalidCount > 0 ? "partial" : "succeeded";
  const finishedAt = new Date().toISOString();

  const summary: ReconciliationSummary = {
    receivedCount: snapshot.units.length,
    newCount,
    updatedCount,
    unchangedCount,
    missingCount,
    invalidCount,
    isQuarantined,
    quarantineReason,
    diffs,
  };

  // 9. Persist sync run in inventory_sync_runs
  const { data: runRecord, error: runError } = await supabase
    .from("inventory_sync_runs")
    .insert({
      connection_id: connection.id,
      project_id: projectId,
      mode,
      status: runStatus,
      source_payload_hash: snapshot.payloadHash,
      received_count: snapshot.units.length,
      created_count: newCount,
      updated_count: updatedCount,
      unchanged_count: unchangedCount,
      invalid_count: invalidCount,
      missing_count: missingCount,
      error_code: isQuarantined ? "quarantine_triggered" : null,
      error_summary: isQuarantined ? quarantineReason : null,
      started_at: startedAt,
      finished_at: finishedAt,
      diff_summary: {
        receivedCount: summary.receivedCount,
        newCount: summary.newCount,
        updatedCount: summary.updatedCount,
        unchangedCount: summary.unchangedCount,
        missingCount: summary.missingCount,
        invalidCount: summary.invalidCount,
        isQuarantined: summary.isQuarantined,
        quarantineReason: summary.quarantineReason,
        diffsSummarySample: diffs.filter((d) => d.kind !== "unchanged").slice(0, 50),
      },
    })
    .select()
    .single();

  if (runError || !runRecord) {
    throw new Error(`Error registrando corrida de sincronización: ${runError?.message}`);
  }

  const syncRunId = runRecord.id;

  // 10. Persist source snapshots (capped to reasonable batch if huge)
  const snapshotsToInsert = snapshot.units.slice(0, 200).map((u) => {
    const rawPayload = typeof u.sourcePayload === "object" && u.sourcePayload !== null ? u.sourcePayload : { raw: u.sourcePayload };
    return {
      sync_run_id: syncRunId,
      project_id: projectId,
      external_unit_id: u.externalId,
      external_unit_code: u.unitCode,
      canonical_status: u.status,
      payload_hash: createHash("sha256").update(JSON.stringify(u.sourcePayload)).digest("hex"),
      source_payload: rawPayload,
    };
  });

  if (snapshotsToInsert.length > 0) {
    await supabase.from("inventory_source_snapshots").insert(snapshotsToInsert);
  }

  // 11. If active mode and NOT quarantined: apply canonical mutations
  let applied = false;
  if (mode === "active" && !isQuarantined) {
    // 11a: Apply updates to changed units
    for (const diff of diffs) {
      if (diff.kind === "price_changed" || diff.kind === "status_changed" || diff.kind === "specs_changed") {
        if (diff.canonicalUnitId && diff.incomingUnit) {
          const inc = diff.incomingUnit;
          const statusNorm: "available" | "separated" | "sold" | "blocked" =
            inc.status === "available" ? "available"
            : inc.status === "sold" ? "sold"
            : inc.status === "separated" || inc.status === "reserved" ? "separated"
            : "blocked";

          const { error: updateError } = await supabase
            .from("units")
            .update({
              status: statusNorm,
              list_price: inc.price ?? undefined,
              floor_level: inc.floor ?? undefined,
              bedrooms: inc.bedrooms ?? undefined,
              bathrooms: inc.bathrooms ?? undefined,
              total_sqm: inc.areaSqm ?? undefined,
              updated_at: new Date().toISOString(),
            })
            .eq("id", diff.canonicalUnitId);

          if (updateError) {
            throw new Error(`No se pudo aplicar el cambio de ${inc.unitCode}: ${updateError.message}`);
          }

          const changedAt = new Date().toISOString();
          const statusChange = diff.differences.find((difference) => difference.field === 'status');
          if (statusChange) {
            await supabase.from('unit_status_history').insert({
              organization_id: project.organization_id,
              unit_id: diff.canonicalUnitId,
              from_status: String(statusChange.oldValue || ''),
              to_status: String(statusChange.newValue || statusNorm),
              reason: `Actualización desde ${connection.display_name}`,
              source: `external:${connection.provider}`,
              created_at: changedAt,
            });
          }

          const priceChange = diff.differences.find((difference) => difference.field === 'price');
          if (priceChange && inc.price !== null) {
            await supabase
              .from('unit_price_history')
              .update({ effective_until: changedAt })
              .eq('unit_id', diff.canonicalUnitId)
              .is('effective_until', null);
            await supabase.from('unit_price_history').insert({
              organization_id: project.organization_id,
              unit_id: diff.canonicalUnitId,
              price: inc.price,
              currency: inc.currency,
              effective_from: changedAt,
            });
          }
        }
      } else if (diff.kind === "new_unit" && diff.incomingUnit) {
        const inc = diff.incomingUnit;
        const statusNorm: "available" | "separated" | "sold" | "blocked" =
          inc.status === "available" ? "available"
          : inc.status === "sold" ? "sold"
          : inc.status === "separated" || inc.status === "reserved" ? "separated"
          : "blocked";

        const { data: createdUnit } = await supabase
          .from("units")
          .insert({
            organization_id: (project as unknown as { organization_id?: number }).organization_id || 1,
            project_id: projectId,
            unit_code: inc.unitCode,
            status: statusNorm,
            list_price: inc.price || 0,
            currency: projectCurrency as "USD" | "DOP" | "EUR",
            floor_level: inc.floor,
            bedrooms: inc.bedrooms,
            bathrooms: inc.bathrooms,
            total_sqm: inc.areaSqm,
            is_public: true,
          })
          .select("id")
          .maybeSingle();

        if (createdUnit) {
          // Add mapping
          await supabase.from("external_unit_mappings").upsert({
            connection_id: connection.id,
            project_id: projectId,
            unit_id: createdUnit.id,
            external_unit_id: inc.externalId,
            external_unit_code: inc.unitCode,
            is_active: true,
            last_seen_at: new Date().toISOString(),
          });
        }
      }
    }

    // 11b: Update mapping last_seen_at for matched units
    for (const inc of snapshot.units) {
      const mapping = mappingByExternalId.get(inc.externalId);
      if (mapping) {
        await supabase
          .from("external_unit_mappings")
          .update({ last_seen_at: new Date().toISOString(), is_active: true })
          .eq("id", mapping.id);
      }
    }

    // 11c: Update project declared availability and inventory_updated_at
    const { data: updatedUnits } = await supabase
      .from("units")
      .select("id, status")
      .eq("project_id", projectId);

    if (updatedUnits) {
      const availableCount = updatedUnits.filter((u) => u.status === "available").length;
      await supabase
        .from("projects")
        .update({
          inventory_available_declared: availableCount,
          inventory_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId);
    }

    // Update connection last_success_at
    await supabase
      .from("integration_connections")
      .update({
        last_success_at: new Date().toISOString(),
        last_attempt_at: new Date().toISOString(),
        last_error_code: null,
      })
      .eq("id", connection.id);

    applied = true;
  } else {
    // Shadow mode only updates last_attempt_at on connection
    await supabase
      .from("integration_connections")
      .update({
        last_attempt_at: new Date().toISOString(),
        last_error_code: isQuarantined ? "quarantined" : null,
      })
      .eq("id", connection.id);
  }

  return {
    runId: syncRunId,
    projectId,
    connectionId: connection.id,
    mode,
    status: runStatus,
    summary,
    sourcePayloadHash: snapshot.payloadHash,
    startedAt,
    finishedAt,
    applied,
  };
}
