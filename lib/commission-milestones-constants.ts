export type TriggerType = 'client_payment_pct' | 'contract_signed' | 'unit_delivery' | 'final_settlement' | 'custom';

export const TRIGGER_TYPE_LABELS: Record<TriggerType, string> = {
  client_payment_pct: 'Cliente paga % del inmueble',
  contract_signed: 'Firma de contrato',
  unit_delivery: 'Entrega de unidad',
  final_settlement: 'Liquidación final con desarrolladora',
  custom: 'Personalizado',
};
