import 'server-only';

import { createClient } from '@/lib/supabase/server';
import type { TriggerType } from '@/lib/commission-milestones-constants';

export { TRIGGER_TYPE_LABELS } from '@/lib/commission-milestones-constants';
export type { TriggerType } from '@/lib/commission-milestones-constants';

export type CommissionMilestone = {
  id: number;
  projectId: number;
  milestoneOrder: number;
  commissionPct: number;
  triggerType: TriggerType;
  triggerValue: number | null;
  description: string | null;
};

export async function getProjectCommissionMilestones(projectId: number): Promise<CommissionMilestone[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('project_commission_milestones')
    .select('id, project_id, milestone_order, commission_pct, trigger_type, trigger_value, description')
    .eq('project_id', projectId)
    .order('milestone_order');
  if (error) throw new Error(`No fue posible cargar el plan de comisiones: ${error.message}`);
  return (data ?? []).map((row) => ({
    id: row.id,
    projectId: row.project_id,
    milestoneOrder: row.milestone_order,
    commissionPct: Number(row.commission_pct),
    triggerType: row.trigger_type as TriggerType,
    triggerValue: row.trigger_value != null ? Number(row.trigger_value) : null,
    description: row.description,
  }));
}

export function formatMilestone(m: CommissionMilestone): string {
  const pct = `${m.commissionPct}% de la comisión`;
  switch (m.triggerType) {
    case 'client_payment_pct':
      return `${pct} cuando el cliente paga el ${m.triggerValue}% del valor de la unidad`;
    case 'contract_signed':
      return `${pct} al firmar el contrato de compra-venta`;
    case 'unit_delivery':
      return `${pct} al momento de la entrega de la unidad`;
    case 'final_settlement':
      return `${pct} al completar todos los compromisos con la desarrolladora`;
    case 'custom':
      return m.description ? `${pct} — ${m.description}` : pct;
  }
}

export function milestonesToTermsText(milestones: CommissionMilestone[]): string {
  if (milestones.length === 0) return '';
  return milestones.map((m, i) => `${i + 1}. ${formatMilestone(m)}.`).join(' ');
}
