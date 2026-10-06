export type ConstructionFrequency = "monthly" | "bimonthly" | "quarterly" | "semiannual" | "custom";

export type ProposalPaymentSchedule = {
  reservationAmount: number;
  reservationDate?: string;
  initialPercentage: number;
  initialDueDays: number;
  constructionPercentage: number;
  constructionStartDate?: string;
  deliveryDate?: string;
  constructionFrequency: ConstructionFrequency;
  constructionInstallments: number;
  specialInstallmentAmount?: number;
  specialInstallmentDate?: string;
};

export type CalculatedPaymentLine = {
  label: string;
  amount: number;
  percentage?: number;
  detail: string;
};

const frequencyLabels: Record<ConstructionFrequency, string> = {
  monthly: "mensuales",
  bimonthly: "bimensuales",
  quarterly: "trimestrales",
  semiannual: "semestrales",
  custom: "personalizadas",
};

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  const day = next.getDate();
  next.setDate(1);
  next.setMonth(next.getMonth() + months);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(day, lastDay));
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + Math.max(0, days));
  return next;
}

function frequencyMonths(frequency: ConstructionFrequency) {
  if (frequency === 'bimonthly') return 2;
  if (frequency === 'quarterly') return 3;
  if (frequency === 'semiannual') return 6;
  return 1;
}

function asDate(value?: string, fallback = new Date()) {
  if (!value) return fallback;
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

const SHORT_MONTHS: Record<'es' | 'en' | 'fr', string[]> = {
  es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  fr: ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'],
};

export function formatPaymentDate(value?: string, locale: 'es' | 'en' | 'fr' = 'es') {
  const pending = locale === 'en' ? 'To be defined' : locale === 'fr' ? 'À définir' : 'Por definir';
  if (!value) return pending;
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return pending;
  const day = date.getDate();
  const month = (SHORT_MONTHS[locale] || SHORT_MONTHS.es)[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

export function constructionEndDate(deliveryDate?: string) {
  if (!deliveryDate) return undefined;
  return addMonths(asDate(deliveryDate), -1).toISOString().slice(0, 10);
}

function wholeMonthDifference(start: Date, end: Date) {
  const months = (end.getFullYear() - start.getFullYear()) * 12 + end.getMonth() - start.getMonth();
  return months - (end.getDate() < start.getDate() ? 1 : 0);
}

/**
 * Calculates the construction installments from the reservation date to the
 * month immediately before delivery. A stored installment count is retained
 * only as a fallback for projects without a confirmed delivery date.
 */
export function calculateConstructionInstallments(input: ProposalPaymentSchedule) {
  if (!input.deliveryDate) return Math.max(1, Math.floor(input.constructionInstallments || 1));
  const reservationDate = asDate(input.reservationDate);
  const endDate = asDate(constructionEndDate(input.deliveryDate), reservationDate);
  const interval = frequencyMonths(input.constructionFrequency);
  return Math.max(1, Math.floor(wholeMonthDifference(reservationDate, endDate) / interval));
}

export function calculateProposalPaymentSchedule(price: number, input: ProposalPaymentSchedule, locale: 'es' | 'en' | 'fr' = 'es'): CalculatedPaymentLine[] {
  const safePrice = Math.max(0, price || 0);
  const reservation = Math.max(0, input.reservationAmount || 0);
  const initialPercentage = Math.max(0, input.initialPercentage || 0);
  const constructionPercentage = Math.max(0, input.constructionPercentage || 0);
  const initialTotal = safePrice * initialPercentage / 100;
  const initialBalance = Math.max(0, initialTotal - reservation);
  const constructionTotal = safePrice * constructionPercentage / 100;
  const specialAmount = Math.max(0, input.specialInstallmentAmount || 0);
  const deliveryAmount = Math.max(0, safePrice - initialTotal - constructionTotal - specialAmount);
  const installments = calculateConstructionInstallments(input);
  const reservationDate = input.reservationDate || new Date().toISOString().slice(0, 10);
  const initialDateValue = addDays(asDate(reservationDate), input.initialDueDays || 0);
  const initialDate = initialDateValue.toISOString().slice(0, 10);
  const firstScheduledInstallment = addMonths(initialDateValue, frequencyMonths(input.constructionFrequency));
  const requestedConstructionStart = input.constructionStartDate ? asDate(input.constructionStartDate) : firstScheduledInstallment;
  const constructionStart = (requestedConstructionStart < firstScheduledInstallment ? firstScheduledInstallment : requestedConstructionStart).toISOString().slice(0, 10);
  const constructionEnd = constructionEndDate(input.deliveryDate);
  const installmentAmount = constructionTotal / installments;

  if (locale !== 'es') {
    const en = locale === 'en';
    const date = (value?: string) => formatPaymentDate(value, locale);
    const frequencies = { monthly: ['monthly', 'mensuelles'], bimonthly: ['every two months', 'bimestrielles'], quarterly: ['quarterly', 'trimestrielles'], semiannual: ['semiannual', 'semestrielles'], custom: ['custom', 'personnalisées'] };
    const frequency = frequencies[input.constructionFrequency][en ? 0 : 1];
    const amount = installmentAmount.toLocaleString(en ? 'en-US' : 'fr-FR', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
    return [
      { label: en ? 'Reservation' : 'Réservation', amount: reservation, detail: `${en ? 'At reservation' : 'À la réservation'} - ${date(reservationDate)}` },
      { label: en ? 'Down payment' : 'Apport initial', amount: initialBalance, percentage: initialPercentage, detail: `${initialPercentage}% ${en ? 'total, balance after reservation' : 'au total, solde après réservation'} - ${date(initialDate)}` },
      ...(constructionPercentage > 0 && constructionTotal > 0 ? [{ label: en ? 'During construction' : 'Pendant la construction', amount: constructionTotal, percentage: constructionPercentage, detail: en ? `${installments} ${frequency} installments of ${amount} · same day, starting ${date(constructionStart)}${constructionEnd ? ` · until ${date(constructionEnd)}` : ''}` : `${installments} échéances ${frequency} de ${amount} · même jour, à partir du ${date(constructionStart)}${constructionEnd ? ` · jusqu’au ${date(constructionEnd)}` : ''}` }] : []),
      ...(specialAmount > 0 ? [{ label: en ? 'Special installment' : 'Échéance spéciale', amount: specialAmount, detail: date(input.specialInstallmentDate) }] : []),
      { label: en ? 'On handover' : 'À la livraison', amount: deliveryAmount, percentage: safePrice ? Number((deliveryAmount / safePrice * 100).toFixed(2)) : 0, detail: `${en ? 'At estimated handover' : 'À la livraison estimée'}${input.deliveryDate ? ` - ${date(input.deliveryDate)}` : ''}` },
    ];
  }

  return [
    { label: "Reserva", amount: reservation, detail: `Al separar - ${formatPaymentDate(reservationDate)}` },
    { label: "Inicial", amount: initialBalance, percentage: initialPercentage, detail: `${initialPercentage}% total, saldo luego de reserva - ${formatPaymentDate(initialDate)}` },
    ...(constructionPercentage > 0 && constructionTotal > 0 ? [{ label: "Durante construcción", amount: constructionTotal, percentage: constructionPercentage, detail: `${installments} cuotas ${frequencyLabels[input.constructionFrequency]} de ${installmentAmount.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })} · mismo día, inicia ${formatPaymentDate(constructionStart)}${constructionEnd ? ` · hasta ${formatPaymentDate(constructionEnd)}` : ""}` }] : []),
    ...(specialAmount > 0 ? [{ label: "Cuota especial", amount: specialAmount, detail: formatPaymentDate(input.specialInstallmentDate) }] : []),
    { label: "Contra entrega", amount: deliveryAmount, percentage: safePrice ? Number((deliveryAmount / safePrice * 100).toFixed(2)) : 0, detail: input.deliveryDate ? `A la entrega estimada - ${formatPaymentDate(input.deliveryDate)}` : "A la entrega estimada" },
  ];
}
