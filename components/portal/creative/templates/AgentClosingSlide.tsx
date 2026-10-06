import { formatCurrencyExplicit } from '@/lib/utils';
import type { ClosingSlideData, CanvasObjectLayout, SignatureFontKey } from '../types';
import { objectStyle } from '../canvasObjects';
import { agentContactLine } from '../agentContactLine';

interface AgentClosingSlideProps {
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
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

export function AgentClosingSlide({ data, layouts }: AgentClosingSlideProps) {
  const { agent } = data;
  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-slate-950 to-slate-900" />

      <h2 style={objectStyle(layouts.headline)} className="flex items-end text-2xl font-black leading-tight tracking-tight">
        {data.headline}
      </h2>

      <div style={objectStyle(layouts.priceBlock)} className="flex flex-col justify-center rounded-xl border border-white/15 bg-white/10 px-4 backdrop-blur-sm">
        <p className="text-[9px] uppercase tracking-wider opacity-70">{data.priceLabel}</p>
        <p className="text-xl font-black">{formatCurrencyExplicit(data.price, data.currency)}</p>
      </div>

      <div style={objectStyle(layouts.ctaButton)} className="flex items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-extrabold">
        {data.ctaText}
      </div>

      <div style={objectStyle(layouts.agentCard)} className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/5 p-3 backdrop-blur-sm">
        {agent.avatarUrl ? (
          <img src={agent.avatarUrl} alt={agent.name} crossOrigin="anonymous" className="h-12 w-12 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-black">{initials(agent.name)}</span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold">{agent.name}</p>
          <p className="truncate text-[10px] uppercase tracking-wide opacity-70">{agent.role}</p>
          <p className="truncate text-[10px] opacity-80">
            {agentContactLine(agent)}
          </p>
        </div>
        <span style={{ fontFamily: SIGNATURE_FONT_VAR[agent.signatureFont] }} className="shrink-0 text-2xl text-blue-200">
          {agent.name}
        </span>
      </div>
    </div>
  );
}
