import { formatCurrencyExplicit } from '@/lib/utils';
import type { ClosingSlideData, CanvasObjectLayout, SignatureFontKey } from '../types';
import { objectStyle } from '../canvasObjects';
import { agentContactLine } from '../agentContactLine';

interface AgentClosingSlideBProps {
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

export function AgentClosingSlideB({ data, layouts }: AgentClosingSlideBProps) {
  const { agent } = data;
  return (
    <div className="relative h-full w-full overflow-hidden bg-white text-slate-950">
      <h2 style={objectStyle(layouts.headline)} className="flex items-end text-2xl font-black uppercase leading-[0.95] tracking-tight">
        {data.headline}
      </h2>

      <div style={objectStyle(layouts.priceBlock)} className="flex flex-col justify-center border-2 border-slate-950 px-4">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{data.priceLabel}</p>
        <p className="text-xl font-black">{formatCurrencyExplicit(data.price, data.currency)}</p>
      </div>

      <div style={objectStyle(layouts.ctaButton)} className="flex items-center justify-center bg-slate-950 px-4 text-sm font-black uppercase tracking-wide text-white">
        {data.ctaText}
      </div>

      <div style={objectStyle(layouts.agentCard)} className="flex items-center gap-3 border-t-2 border-slate-950 pt-3">
        {agent.avatarUrl ? (
          <img src={agent.avatarUrl} alt={agent.name} crossOrigin="anonymous" className="h-12 w-12 shrink-0 rounded-full object-cover grayscale" />
        ) : (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-slate-950 text-sm font-black">{initials(agent.name)}</span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black">{agent.name}</p>
          <p className="truncate text-[10px] font-bold uppercase tracking-wide text-slate-500">{agent.role}</p>
          <p className="truncate text-[10px] text-slate-500">
            {agentContactLine(agent)}
          </p>
        </div>
        <span style={{ fontFamily: SIGNATURE_FONT_VAR[agent.signatureFont] }} className="shrink-0 text-2xl text-slate-950">
          {agent.name}
        </span>
      </div>
    </div>
  );
}
