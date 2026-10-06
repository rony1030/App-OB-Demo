import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import type { PaymentFlowPublic, PaymentReportMode } from '@/lib/investor/payment-report';

/** Configuración completa de un flujo: SOLO servidor. */
export interface PaymentFlowPrivate extends PaymentFlowPublic {
  emailTo: string[];
  apiUrl?: string;
  apiSecretEnv?: string;
}

const GENERIC_FLOW: PaymentFlowPrivate = {
  mode: 'instructions',
  developerName: 'su desarrollador',
  steps: [
    'Realice el pago a la cuenta indicada en su contrato o promesa de compraventa.',
    'Conserve el comprobante bancario.',
    'Envíe el comprobante a su asesor por WhatsApp para que sea confirmado y aplicado a su estado de cuenta.',
  ],
  acceptsReceipt: false,
  emailTo: [],
};

/**
 * Flujos de demostración, uno por modo. No envían nada real: en el modo demo la acción
 * solo simula el resultado y muestra qué ocurriría en producción.
 */
const DEMO_FLOWS: Record<string, PaymentFlowPrivate> = {
  'cana-rock-star': {
    mode: 'redirect',
    developerName: 'Grupo Cana Rock',
    steps: [
      'Ingrese al portal de pagos de Grupo Cana Rock con su número de contrato.',
      'Realice o programe el pago desde allí.',
      'El desarrollador confirma el pago y su estado de cuenta se actualiza.',
    ],
    redirectUrl: '/inversionista/pasarela-demo',
    acceptsReceipt: false,
    emailTo: [],
  },
  'palm-view': {
    mode: 'email',
    developerName: 'Entorno Group',
    steps: [
      'Realice el pago a la cuenta de su contrato.',
      'Complete el reporte con el monto, la fecha y su comprobante.',
      'Enviamos el reporte directamente al equipo de cobros de Entorno Group.',
      'Recibirá la confirmación y su estado de cuenta se actualizará.',
    ],
    acceptsReceipt: true,
    emailTo: [],
  },
  'cipres-residences': {
    mode: 'instructions',
    developerName: 'Kyser',
    steps: [
      'Realice el pago por transferencia a la cuenta de Kyser indicada en su promesa de compraventa.',
      'En el concepto escriba su código de unidad.',
      'Envíe el comprobante a su asesor por WhatsApp.',
      'Kyser confirma el pago en un máximo de 48 horas hábiles.',
    ],
    acceptsReceipt: false,
    emailTo: [],
  },
  'uve-residences': {
    mode: 'api',
    developerName: 'Dominican Condos',
    steps: [
      'Realice el pago a la cuenta de su contrato.',
      'Complete el reporte con el monto, la fecha y su comprobante.',
      'El reporte se registra de inmediato en el sistema de cobros de Dominican Condos.',
      'Su estado de cuenta se actualiza cuando el pago es conciliado.',
    ],
    acceptsReceipt: true,
    emailTo: [],
  },
};

export function toPublicFlow(flow: PaymentFlowPrivate): PaymentFlowPublic {
  const { mode, developerName, steps, redirectUrl, acceptsReceipt } = flow;
  return { mode, developerName, steps, redirectUrl, acceptsReceipt };
}

interface ConfigRow {
  mode: PaymentReportMode;
  developer_name: string;
  instructions: unknown;
  accepts_receipt: boolean;
  redirect_url: string | null;
  email_to: string[] | null;
  api_url: string | null;
  api_secret_env: string | null;
}

/** Flujo del proyecto: demo desde código; real desde `project_payment_report_config`, con respaldo genérico. */
export async function getPaymentFlow(projectSlug: string, isDemo: boolean): Promise<PaymentFlowPrivate> {
  if (isDemo) return DEMO_FLOWS[projectSlug] ?? GENERIC_FLOW;
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('project_payment_report_config' as never)
      .select('mode, developer_name, instructions, accepts_receipt, redirect_url, email_to, api_url, api_secret_env')
      .eq('project_slug' as never, projectSlug as never)
      .maybeSingle();
    const row = data as unknown as ConfigRow | null;
    if (!row) return GENERIC_FLOW;
    const steps = Array.isArray(row.instructions) ? row.instructions.filter((s): s is string => typeof s === 'string') : [];
    return {
      mode: row.mode,
      developerName: row.developer_name,
      steps: steps.length ? steps : GENERIC_FLOW.steps,
      redirectUrl: row.redirect_url ?? undefined,
      acceptsReceipt: row.accepts_receipt,
      emailTo: row.email_to ?? [],
      apiUrl: row.api_url ?? undefined,
      apiSecretEnv: row.api_secret_env ?? undefined,
    };
  } catch (error) {
    console.error('[getPaymentFlow] Error:', error);
    return GENERIC_FLOW;
  }
}
