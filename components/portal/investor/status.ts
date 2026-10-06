import type { InstallmentState, OperationalStatus } from '@/lib/investor/account';

/** Tonos de estado: apagados y funcionales; el color solo aparece donde hay información. */
export interface StatusTone {
  label: string;
  text: string;
  dot: string;
  rule: string;
}

export const STATUS_TONE: Record<OperationalStatus, StatusTone> = {
  al_dia: { label: 'Al día', text: 'text-[#2F6B4F]', dot: 'bg-[#2F6B4F]', rule: 'border-[#2F6B4F]' },
  negociacion: { label: 'En construcción · Al día', text: 'text-[#2F6B4F]', dot: 'bg-[#2F6B4F]', rule: 'border-[#2F6B4F]' },
  vencida: { label: 'Cuotas vencidas', text: 'text-[#A5671A]', dot: 'bg-[#C9811F]', rule: 'border-[#C9811F]' },
  en_legal: { label: 'En proceso legal', text: 'text-[#A33A32]', dot: 'bg-[#A33A32]', rule: 'border-[#A33A32]' },
  proceso_entrega: { label: 'En proceso de entrega', text: 'text-[#5B45B0]', dot: 'bg-[#5B45B0]', rule: 'border-[#5B45B0]' },
  entregada: { label: 'Entregada', text: 'text-[#14213D]', dot: 'bg-[#14213D]', rule: 'border-[#14213D]' },
};

export const INSTALLMENT_TONE: Record<InstallmentState, { label: string; text: string }> = {
  paid: { label: 'Pagada', text: 'text-[#2F6B4F]' },
  current: { label: 'Al día', text: 'text-[#14213D]' },
  pending: { label: 'Pendiente', text: 'text-[#6B7280]' },
  overdue: { label: 'Vencida', text: 'text-[#A5671A]' },
  legal: { label: 'En legal', text: 'text-[#A33A32]' },
};

export function whatsappLink(number: string, message: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

/** Fechas ISO (YYYY-MM-DD o timestamp) en español, sin desfase de zona horaria. */
export function formatDate(value: string | null | undefined, withYear = true): string {
  if (!value) return '—';
  const iso = value.length === 10 ? `${value}T12:00:00` : value;
  return new Intl.DateTimeFormat('es-DO', {
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
    timeZone: 'America/Santo_Domingo',
  })
    .format(new Date(iso))
    .replace('.', '');
}

export function formatMoney(amount: number, currency = 'USD'): string {
  const prefix = currency === 'USD' ? 'US$' : currency;
  const hasCents = Math.abs(amount % 1) > 0.004;
  return `${prefix} ${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}
