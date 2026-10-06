
import { LocalizedText } from '@/components/i18n/UITranslationBoundary';
import { formatCurrencyExplicit } from '@/lib/utils';
import type { ClosingSlideData, CanvasObjectLayout, SignatureFontKey } from '../types';
import { objectStyle } from '../canvasObjects';
import { agentContactLine } from '../agentContactLine';

interface AgentClosingSlideDProps {
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

export function AgentClosingSlideD({ data, layouts }: AgentClosingSlideDProps) {
  const { agent } = data;
  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-gradient-to-br from-orange-700 via-orange-950 to-slate-950" />

      <h2 style={objectStyle(layouts.headline)} className="flex items-end text-2xl font-black uppercase leading-[0.95] tracking-tight">
        {data.headline}
      </h2>

      <div style={objectStyle(layouts.priceBlock)} className="flex flex-col justify-center rounded-lg bg-white px-4 text-slate-950 shadow-lg">
        <p className="text-[9px] font-black uppercase tracking-widest text-orange-600">{data.priceLabel}<LocalizedText text={" — Oferta"} /></p>
        <p className="text-xl font-black">{formatCurrencyExplicit(data.price, data.currency)}</p>
      </div>

      <div style={objectStyle(layouts.ctaButton)} className="flex items-center justify-center rounded-lg bg-orange-600 px-4 text-sm font-black uppercase tracking-wide shadow-lg shadow-orange-950/50">
        {data.ctaText}
      </div>

      <div style={objectStyle(layouts.agentCard)} className="flex items-center gap-3 rounded-lg border border-orange-400/40 bg-black/30 p-3">
        {agent.avatarUrl ? (
          <img src={agent.avatarUrl} alt={agent.name} crossOrigin="anonymous" className="h-12 w-12 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-600 text-sm font-black">{initials(agent.name)}</span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black">{agent.name}</p>
          <p className="truncate text-[10px] font-extrabold uppercase tracking-wide text-orange-200">{agent.role}</p>
          <p className="truncate text-[10px] text-white/70">
            {agentContactLine(agent)}
          </p>
        </div>
        <span style={{ fontFamily: SIGNATURE_FONT_VAR[agent.signatureFont] }} className="shrink-0 text-2xl text-orange-200">
          {agent.name}
        </span>
      </div>
    </div>
  );
}
