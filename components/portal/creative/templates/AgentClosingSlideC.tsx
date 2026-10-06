import { formatCurrencyExplicit } from '@/lib/utils';
import type { ClosingSlideData, CanvasObjectLayout, SignatureFontKey } from '../types';
import { objectStyle } from '../canvasObjects';
import { agentContactLine } from '../agentContactLine';

interface AgentClosingSlideCProps {
  data: ClosingSlideData;
  layouts: Record<string, CanvasObjectLayout>;
}

const SIGNATURE_FONT_VAR: Record<SignatureFontKey, string> = {
  dancing: 'var(--font-signature-dancing)',
  greatvibes: 'var(--font-signature-greatvibes)',
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
}

export function AgentClosingSlideC({ data, layouts }: AgentClosingSlideCProps) {
  const { agent } = data;
  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-950 text-white" style={{ fontFamily: 'var(--font-display)' }}>
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-black" />

      <h2 style={objectStyle(layouts.headline)} className="flex items-end text-2xl font-medium italic leading-tight">
        {data.headline}
      </h2>

      <div style={objectStyle(layouts.priceBlock)} className="flex flex-col justify-center rounded-lg border border-amber-300/50 px-4">
        <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-amber-200/80">{data.priceLabel}</p>
        <p className="text-xl font-medium text-amber-50">{formatCurrencyExplicit(data.price, data.currency)}</p>
      </div>

      <div style={objectStyle(layouts.ctaButton)} className="flex items-center justify-center rounded-lg border border-amber-300 px-4 text-sm font-medium uppercase tracking-[0.15em] text-amber-100">
        {data.ctaText}
      </div>

      <div style={objectStyle(layouts.agentCard)} className="flex items-center gap-3 rounded-lg border border-amber-300/30 bg-white/5 p-3">
        {agent.avatarUrl ? (
          <img src={agent.avatarUrl} alt={agent.name} crossOrigin="anonymous" className="h-12 w-12 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-amber-300/60 text-sm font-medium text-amber-100">{initials(agent.name)}</span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{agent.name}</p>
          <p className="truncate text-[10px] uppercase tracking-[0.15em] text-amber-200/80">{agent.role}</p>
          <p className="truncate text-[10px] text-white/60">
            {agentContactLine(agent)}
          </p>
        </div>
        <span style={{ fontFamily: SIGNATURE_FONT_VAR[agent.signatureFont] }} className="shrink-0 text-2xl text-amber-200">
          {agent.name}
        </span>
      </div>
    </div>
  );
}
