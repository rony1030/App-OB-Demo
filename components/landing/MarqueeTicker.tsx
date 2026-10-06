'use client';

import { useMemo } from 'react';
import type { PortalProject } from '@/lib/portal-projects';

const DEFAULT_PROJECT_NAMES = [
  'PALM VIEW GOLF & APARTMENTS',
  'CANA ROCK COSMOS STELAR',
  'CANA ROCK STAR',
  'CANA ROCK UNIVERSE',
  'CANA ROCK GALAXY',
  'CIPRÉS RESIDENCES',
  'UVE RESIDENCES',
];

export default function MarqueeTicker({
  projects = [],
}: {
  projects?: PortalProject[];
}) {
  const projectNames = useMemo(() => {
    const liveNames = (projects || [])
      .map((p) => p.name?.trim().toUpperCase())
      .filter(Boolean)
      .filter((name) => !name.startsWith('DEMO'));

    const set = new Set<string>();
    liveNames.forEach((name) => set.add(name));
    DEFAULT_PROJECT_NAMES.forEach((name) => set.add(name));

    const result = Array.from(set);
    return result.length > 0 ? result : DEFAULT_PROJECT_NAMES;
  }, [projects]);

  return (
    <div className="relative w-full overflow-hidden border-y border-slate-900/10 bg-slate-950 py-3.5 text-white shadow-inner">
      {/* Gradient masks for smooth fade edges */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-slate-950 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-slate-950 to-transparent" />

      <div className="animate-marquee select-none flex items-center gap-8 text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-300">
        {[...projectNames, ...projectNames].map((item, idx) => (
          <div key={idx} className="flex items-center gap-6 shrink-0">
            <span className="text-slate-600 font-normal">/</span>
            <a
              href="#desarrollos"
              className="hover:text-white transition-colors cursor-pointer tracking-[0.22em]"
            >
              {item}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
