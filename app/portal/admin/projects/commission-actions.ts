'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import type { TriggerType } from '@/lib/commission-milestones-constants';

type MilestoneInput = {
  milestoneOrder: number;
  commissionPct: number;
  triggerType: TriggerType;
  triggerValue: number | null;
  description: string | null;
};

type ActionResult = { success?: boolean; error?: string };

export async function getCommissionMilestonesAction(projectId: number): Promise<MilestoneInput[]> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from('project_commission_milestones')
    .select('milestone_order, commission_pct, trigger_type, trigger_value, description')
    .eq('project_id', projectId)
    .order('milestone_order');
  return (data ?? []).map((row) => ({
    milestoneOrder: row.milestone_order,
    commissionPct: Number(row.commission_pct),
    triggerType: row.trigger_type as TriggerType,
    triggerValue: row.trigger_value != null ? Number(row.trigger_value) : null,
    description: row.description,
  }));
}

export async function saveCommissionMilestonesAction(
  projectId: number,
  milestones: MilestoneInput[]
): Promise<ActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: 'Debes iniciar sesión.' };
  if (!['super_admin', 'master_broker_admin', 'master_broker_operations'].includes(currentUser.role)) {
    return { error: 'No tienes permiso para configurar el plan de comisiones.' };
  }

  const total = milestones.reduce((sum, m) => sum + m.commissionPct, 0);
  if (milestones.length > 0 && Math.abs(total - 100) > 0.01) {
    return { error: `Los porcentajes deben sumar 100%. Actualmente suman ${total.toFixed(1)}%.` };
  }

  for (const m of milestones) {
    if (m.triggerType === 'client_payment_pct' && (m.triggerValue == null || m.triggerValue <= 0)) {
      return { error: `El hito #${m.milestoneOrder} requiere un porcentaje de pago del cliente.` };
    }
  }

  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from('project_commission_milestones')
    .delete()
    .eq('project_id', projectId);
  if (deleteError) return { error: deleteError.message };

  if (milestones.length > 0) {
    const { error: insertError } = await supabase
      .from('project_commission_milestones')
      .insert(
        milestones.map((m) => ({
          project_id: projectId,
          milestone_order: m.milestoneOrder,
          commission_pct: m.commissionPct,
          trigger_type: m.triggerType,
          trigger_value: m.triggerType === 'client_payment_pct' ? m.triggerValue : null,
          description: m.triggerType === 'custom' ? m.description : null,
        }))
      );
    if (insertError) return { error: insertError.message };
  }

  revalidatePath('/portal/admin/projects');
  return { success: true };
}
