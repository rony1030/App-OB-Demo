/**
 * Motor del estado de cuenta del inversionista.
 * Función pura: recibe filas de cuotas y devuelve estados, saldos y estado operativo.
 * Nada se guarda agregado; todo se deriva de las cuotas y de la fecha de corte.
 */

export type InstallmentKind = 'reservation' | 'initial' | 'construction' | 'delivery_balance' | 'other';
export type DeliveryStatus = 'negotiation' | 'in_construction' | 'ready_for_delivery' | 'delivered';
export type CollectionStatus = 'normal' | 'legal';
export type InstallmentState = 'paid' | 'current' | 'pending' | 'overdue' | 'legal';
export type OperationalStatus =
  | 'al_dia'
  | 'vencida'
  | 'en_legal'
  | 'entregada'
  | 'proceso_entrega'
  | 'negociacion';

export interface InstallmentRow {
  sequence: number;
  kind: InstallmentKind;
  concept: string;
  dueDate: string; // YYYY-MM-DD
  amount: number;
  paidAmount: number;
  paidAt?: string | null;
  moraAmount: number;
}

export interface ComputedInstallment extends InstallmentRow {
  state: InstallmentState;
  outstanding: number;
}

export interface AccountSummary {
  totalPrice: number;
  totalPaid: number;
  remainingBalance: number;
  insolutoBalance: number;
  overdueCount: number;
  overdueAmount: number;
  moraAmount: number;
  /** Lo que debe liquidar hoy para regularizar (vencido + mora) */
  regularizationAmount: number;
  /** Para recibir llaves: insoluto + vencido + mora */
  totalToDeliver: number;
  paidPercentage: number;
  nextDue: ComputedInstallment | null;
  nextDueInDays: number | null;
  operationalStatus: OperationalStatus;
  schedule: ComputedInstallment[];
}

const cents = (n: number) => Math.round(n * 100) / 100;

/** Compara fechas YYYY-MM-DD como cadenas (ISO ordena lexicográficamente). */
export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function daysBetween(fromIso: string, toIso: string): number {
  const a = Date.UTC(+fromIso.slice(0, 4), +fromIso.slice(5, 7) - 1, +fromIso.slice(8, 10));
  const b = Date.UTC(+toIso.slice(0, 4), +toIso.slice(5, 7) - 1, +toIso.slice(8, 10));
  return Math.round((b - a) / 86400000);
}

export function computeAccount(input: {
  price: number;
  installments: InstallmentRow[];
  deliveryStatus: DeliveryStatus;
  collectionStatus: CollectionStatus;
  asOf?: Date;
}): AccountSummary {
  const today = toIsoDate(input.asOf ?? new Date());
  const legal = input.collectionStatus === 'legal';
  const rows = [...input.installments].sort((a, b) => a.sequence - b.sequence);

  let firstOpenMarked = false;
  const schedule: ComputedInstallment[] = rows.map((row) => {
    const outstanding = cents(row.amount - row.paidAmount);
    let state: InstallmentState;
    if (outstanding <= 0) state = 'paid';
    else if (legal) state = 'legal';
    else if (row.dueDate < today) state = 'overdue';
    else if (!firstOpenMarked) state = 'current';
    else state = 'pending';
    if (outstanding > 0 && row.dueDate >= today) firstOpenMarked = true;
    return { ...row, state, outstanding };
  });

  const unpaid = schedule.filter((r) => r.outstanding > 0);
  const pastDue = unpaid.filter((r) => r.dueDate < today);
  const totalPaid = cents(schedule.reduce((s, r) => s + r.paidAmount, 0));
  const insoluto = cents(
    unpaid.filter((r) => r.kind === 'delivery_balance').reduce((s, r) => s + r.outstanding, 0),
  );
  const overdueAmount = cents(pastDue.reduce((s, r) => s + r.outstanding, 0));
  const mora = cents(unpaid.reduce((s, r) => s + r.moraAmount, 0));

  const nextDue = schedule.find((r) => r.state === 'current') ?? null;
  let operationalStatus: OperationalStatus;
  if (input.deliveryStatus === 'delivered') operationalStatus = 'entregada';
  else if (legal) operationalStatus = 'en_legal';
  else if (input.deliveryStatus === 'ready_for_delivery') operationalStatus = 'proceso_entrega';
  else if (pastDue.length > 0) operationalStatus = 'vencida';
  else if (input.deliveryStatus === 'negotiation') operationalStatus = 'negociacion';
  else operationalStatus = 'al_dia';

  return {
    totalPrice: input.price,
    totalPaid,
    remainingBalance: cents(Math.max(0, input.price - totalPaid)),
    insolutoBalance: insoluto,
    overdueCount: pastDue.length,
    overdueAmount,
    moraAmount: mora,
    regularizationAmount: cents(overdueAmount + mora),
    totalToDeliver: cents(insoluto + overdueAmount + mora),
    paidPercentage: input.price > 0 ? Math.min(100, Math.round((totalPaid / input.price) * 100)) : 0,
    nextDue,
    nextDueInDays: nextDue ? daysBetween(today, nextDue.dueDate) : null,
    operationalStatus,
    schedule,
  };
}

export interface PlanStage {
  key: 'reservation' | 'initial' | 'construction' | 'delivery_balance';
  label: string;
  detail: string;
  total: number;
  paid: number;
  count: number;
}

/** Plan de pagos acordado, agregado por etapa a partir de las cuotas reales. */
export function planBreakdown(schedule: ComputedInstallment[]): PlanStage[] {
  const defs: Omit<PlanStage, 'total' | 'paid' | 'count'>[] = [
    { key: 'reservation', label: 'Reserva', detail: 'Bloqueo de la unidad' },
    { key: 'initial', label: 'Inicial 20%', detail: 'A la firma de la promesa de compraventa' },
    { key: 'construction', label: '30% en construcción', detail: 'Cuotas mensuales durante la obra' },
    { key: 'delivery_balance', label: '50% Pago Insoluto', detail: 'Contra entrega de llaves y título' },
  ];
  return defs.map((d) => {
    const rows = schedule.filter((r) => r.kind === d.key);
    return {
      ...d,
      total: cents(rows.reduce((s, r) => s + r.amount, 0)),
      paid: cents(rows.reduce((s, r) => s + r.paidAmount, 0)),
      count: rows.length,
    };
  });
}
