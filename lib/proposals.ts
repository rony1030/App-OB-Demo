import type { ProposalPropertyItem } from '../types/proposals';

export function calculateEstimatedROI(price: number, dailyRate: number, occupancyRatePct: number = 70) {
  const annualGross = dailyRate * (365 * (occupancyRatePct / 100));
  const estimatedExpenses = annualGross * 0.28; // HOA, management, maintenance ~28%
  const netIncome = annualGross - estimatedExpenses;
  const capRate = price > 0 ? (netIncome / price) * 100 : 0;

  return {
    annualGross,
    estimatedExpenses,
    netIncome,
    capRate: Number(capRate.toFixed(2))
  };
}

export function generatePaymentSchedule(price: number, plan: ProposalPropertyItem['payment_plan'] | undefined) {
  const reservation = plan?.reservation_amount || 5000;
  // Older imports stored 20% as 0.2. Accept both representations so existing
  // public proposals remain financially accurate without mutating their snapshot.
  const normalizePercentage = (value: number | undefined, fallback: number) => {
    const resolved = Number(value ?? fallback);
    return resolved > 0 && resolved <= 1 ? resolved * 100 : resolved;
  };
  const initialPct = normalizePercentage(plan?.initial_percentage, 20);
  const duringPct = normalizePercentage(plan?.during_construction_percentage, 40);
  const deliveryPct = normalizePercentage(plan?.upon_delivery_percentage, 40);
  const initial = Math.max(0, (price * (initialPct / 100)) - reservation);
  const duringConst = price * (duringPct / 100);
  const delivery = Math.max(0, price - reservation - initial - duringConst);

  return [
    { label: 'Reserva', amount: reservation, pct: price > 0 ? Number(((reservation / price) * 100).toFixed(2)) : 0 },
    { label: `Inicial (${initialPct}%)`, amount: initial, pct: initialPct },
    { label: `Durante Construcción (${duringPct}%)`, amount: duringConst, pct: duringPct },
    { label: `Contra Entrega (${deliveryPct}%)`, amount: delivery, pct: deliveryPct },
  ];
}
