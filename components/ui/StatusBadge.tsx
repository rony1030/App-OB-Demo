import { LucideIcon, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info';

const TONE_STYLES: Record<StatusTone, string> = {
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
  neutral: 'bg-slate-100 text-slate-600',
  info: 'bg-blue-50 text-blue-700',
};

/**
 * Every domain "state" (agreement/document/opportunity/reservation) reduces
 * to one of these 5 visual tones. Individual screens used to each define
 * their own {bg,text} map per status string — this is the single source of
 * truth instead.
 */
const STATUS_TONE_MAP: Record<string, { tone: StatusTone; label: string }> = {
  vigente: { tone: 'success', label: 'Vigente' },
  active: { tone: 'success', label: 'Activo' },
  approved: { tone: 'success', label: 'Aprobado' },
  signed: { tone: 'success', label: 'Firmado' },
  won: { tone: 'success', label: 'Ganado' },
  published: { tone: 'success', label: 'Publicado' },

  vencido: { tone: 'danger', label: 'Vencido' },
  expired: { tone: 'danger', label: 'Vencido' },
  revoked: { tone: 'danger', label: 'Revocado' },
  rejected: { tone: 'danger', label: 'Rechazado' },
  cancelled: { tone: 'danger', label: 'Cancelado' },
  lost: { tone: 'danger', label: 'Perdido' },

  pending_signature: { tone: 'warning', label: 'Pendiente de firma' },
  pending: { tone: 'warning', label: 'Pendiente' },
  submitted: { tone: 'warning', label: 'En revisión' },
  review: { tone: 'warning', label: 'En revisión' },

  draft: { tone: 'neutral', label: 'Borrador' },
  archived: { tone: 'neutral', label: 'Archivado' },
};

export function statusTone(status: string): { tone: StatusTone; label: string } {
  return STATUS_TONE_MAP[status] ?? { tone: 'neutral', label: status };
}

export default function StatusBadge({
  status,
  tone,
  label,
  icon: Icon = ShieldCheck,
  className,
}: {
  /** Domain status key (e.g. "vigente", "pending_signature") — resolved via statusTone() if `tone`/`label` aren't given directly. */
  status?: string;
  tone?: StatusTone;
  label?: string;
  icon?: LucideIcon;
  className?: string;
}) {
  const resolved = tone && label ? { tone, label } : statusTone(status ?? 'draft');

  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[9px] font-extrabold uppercase tracking-wide',
        TONE_STYLES[resolved.tone],
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {resolved.label}
    </span>
  );
}
