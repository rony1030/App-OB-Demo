'use client';

import type { LandingProfitabilityConfig } from '@/lib/data/landing-config';
import { useLocale } from '@/components/i18n/LocaleProvider';

export default function CanaRockProfitability({ config, primaryColor, accentColor }: { config?: LandingProfitabilityConfig; primaryColor: string; accentColor: string }) {
  const { autoTranslate } = useLocale();
  if (!config?.enabled || !config.items.length) return null;
  return <section id="rentabilidad" className="bg-[#f5f6f8] py-20 sm:py-28">
    <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
      <div className="max-w-3xl border-b border-slate-200 pb-8">
        <h2 className="text-4xl font-black tracking-[-0.04em] sm:text-5xl" style={{ color: primaryColor }}>{autoTranslate(config.title)}</h2>
        <p className="mt-5 text-base leading-7 text-slate-600">{autoTranslate(config.introduction)}</p>
      </div>
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {config.items.map((item) => <article key={item.label} className="border border-slate-200 bg-white p-6 shadow-[0_14px_30px_-28px_rgba(8,19,57,0.65)]"><div className="flex items-start justify-between gap-4"><h3 className="text-sm font-black uppercase tracking-[0.1em] text-slate-700">{autoTranslate(item.label)}</h3><strong className="text-sm font-black" style={{ color: accentColor }}>{item.roi}</strong></div><p className="mt-5 text-sm leading-6 text-slate-600">{autoTranslate(item.description)}</p></article>)}
      </div>
      <div className="mt-7 border-t border-slate-200 pt-5 text-xs leading-5 text-slate-500"><p>{autoTranslate(config.source)}</p><p className="mt-2">{autoTranslate(config.disclaimer)}</p></div>
    </div>
  </section>;
}
