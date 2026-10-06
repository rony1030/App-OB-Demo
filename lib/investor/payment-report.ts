/**
 * Reporte de pagos del inversionista: tipos y validación (seguros para cliente y servidor).
 * La configuración PRIVADA de cada flujo (correos, API) vive solo en el servidor.
 */

export type PaymentReportMode = 'email' | 'redirect' | 'instructions' | 'api';

/** Lo único que ve el navegador de un flujo. Nunca incluye correos ni credenciales. */
export interface PaymentFlowPublic {
  mode: PaymentReportMode;
  developerName: string;
  /** Pasos del proceso; se muestran en todos los modos como guía. */
  steps: string[];
  redirectUrl?: string;
  acceptsReceipt: boolean;
}

export const PAYMENT_METHODS = [
  { value: 'transferencia', label: 'Transferencia bancaria' },
  { value: 'deposito', label: 'Depósito' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'otro', label: 'Otro' },
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]['value'];

export const RECEIPT_MAX_BYTES = 4 * 1024 * 1024;
export const RECEIPT_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export interface PaymentReportInput {
  amount: number;
  paidAt: string; // YYYY-MM-DD
  method: string;
  reference?: string;
  note?: string;
}

export interface PaymentReportValidation {
  ok: boolean;
  error?: string;
  value?: { amount: number; paidAt: string; method: PaymentMethod; reference: string | null; note: string | null };
}

/** Valida el reporte. `today` es YYYY-MM-DD en la zona del servidor. */
export function validatePaymentReport(input: PaymentReportInput, today: string): PaymentReportValidation {
  const amount = Math.round(Number(input.amount) * 100) / 100;
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: 'Indique un monto mayor que cero.' };
  if (amount > 50_000_000) return { ok: false, error: 'El monto indicado no es válido.' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.paidAt) || Number.isNaN(Date.parse(input.paidAt))) {
    return { ok: false, error: 'Indique la fecha en que realizó el pago.' };
  }
  if (input.paidAt > today) return { ok: false, error: 'La fecha del pago no puede ser futura.' };
  if (input.paidAt < '2015-01-01') return { ok: false, error: 'La fecha del pago no es válida.' };
  const method = PAYMENT_METHODS.find((m) => m.value === input.method)?.value;
  if (!method) return { ok: false, error: 'Seleccione cómo realizó el pago.' };
  const reference = (input.reference ?? '').trim().slice(0, 80);
  const note = (input.note ?? '').trim().slice(0, 500);
  return { ok: true, value: { amount, paidAt: input.paidAt, method, reference: reference || null, note: note || null } };
}

export function validateReceiptFile(file: { size: number; type: string } | null): string | null {
  if (!file || file.size === 0) return null;
  if (file.size > RECEIPT_MAX_BYTES) return 'El comprobante no puede superar 4 MB.';
  if (!RECEIPT_TYPES[file.type]) return 'El comprobante debe ser PDF, JPG, PNG o WebP.';
  return null;
}
