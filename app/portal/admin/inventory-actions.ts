"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/get-user";
import { executeInventorySync, getProjectIntegrationDetails, getProjectSyncHistory, type SimulationScenario } from "@/lib/integrations/inventory/service";
import type { ReconciliationRunResult } from "@/lib/integrations/inventory/types";

async function assertInventoryPermission(_projectId: number) {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);

  if (!user) {
    throw new Error("Debes iniciar sesión para operar el conector de inventario.");
  }

  const allowedRoles = [
    "super_admin",
    "master_broker_admin",
    "master_broker_operations",
    "developer_admin",
  ];

  if (!allowedRoles.includes(user.role)) {
    throw new Error("No tienes permisos para gestionar la reconciliación de inventario.");
  }

  return { supabase, user };
}

export async function getProjectIntegrationInfoAction(projectId: number) {
  try {
    const { supabase } = await assertInventoryPermission(projectId);
    const details = await getProjectIntegrationDetails(supabase, projectId);
    return { data: details, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function triggerInventorySyncAction(
  projectId: number,
  mode: "shadow" | "active" = "shadow",
  scenario: SimulationScenario = "current"
): Promise<{ data: ReconciliationRunResult | null; error: string | null }> {
  try {
    const { supabase } = await assertInventoryPermission(projectId);
    const result = await executeInventorySync(supabase, projectId, { mode, scenario });

    revalidatePath("/portal/admin/projects");
    revalidatePath("/portal/projects");
    revalidatePath("/proyectos");

    return { data: result, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function getProjectSyncHistoryAction(projectId: number) {
  try {
    const { supabase } = await assertInventoryPermission(projectId);
    const history = await getProjectSyncHistory(supabase, projectId);
    return { data: history, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
