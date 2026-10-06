'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';
import type { ProjectConstructionUpdate } from '@/lib/data/construction-updates';
import { formatDate } from './status';

export default function ConstructionReports({
  updates,
  projectName,
}: {
  updates: ProjectConstructionUpdate[];
  projectName: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (updates.length === 0) {
    return (
      <div className="border-y border-[#DCE3EE] py-14 text-center">
        <p className="font-display text-xl text-[#101826]">La bitácora de obra está en preparación</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-[#5B6472]">
          Aquí se publicarán los reportes mensuales, fotografías y tomas de dron de {projectName} apenas el desarrollador los comparta.
        </p>
      </div>
    );
  }

  const current = updates.find((u) => u.id === selectedId) ?? updates[0];
  const progress = Math.min(100, Math.max(0, Number(current.overall_progress_percentage)));

  return (
    <div className="space-y-10">
      <section aria-labelledby="report-title">
        <p className="text-sm text-[#5B6472]">
          {current.stage_name} · {formatDate(current.report_date)}
        </p>
        <h3 id="report-title" className="mt-1 font-display text-2xl text-[#101826]">{current.title}</h3>
        {current.summary && <p className="mt-2 max-w-prose text-sm leading-relaxed text-[#3d4655]">{current.summary}</p>}

        <div className="mt-6">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-[#3d4655]">Ejecución del proyecto</span>
            <span className="font-display text-2xl tabular-nums text-[#101826]">{progress}%</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-[#E4EBF5]" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-[#101826]" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {current.drone_video_url && (
          <a
            href={current.drone_video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-md border border-[#101826]/30 px-4 py-2.5 text-sm text-[#101826] transition hover:border-[#101826]"
          >
            <Play className="h-4 w-4" aria-hidden /> Ver toma aérea de dron
          </a>
        )}

        {current.photos?.length > 0 && (
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {current.photos.map((photo, i) => (
              <li key={`${photo.url}-${i}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt={photo.caption || `Avance de obra ${i + 1}`} loading="lazy" className="aspect-[4/3] w-full rounded-sm object-cover" />
                {photo.caption && <p className="mt-1.5 text-xs text-[#5B6472]">{photo.caption}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {updates.length > 1 && (
        <section aria-labelledby="history-title">
          <h3 id="history-title" className="font-display text-xl text-[#101826]">Reportes anteriores</h3>
          <ul className="mt-3 divide-y divide-[#E4EBF5] border-y border-[#DCE3EE]">
            {updates.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(u.id)}
                  aria-current={u.id === current.id}
                  className="flex w-full items-baseline justify-between gap-4 py-3.5 text-left"
                >
                  <span>
                    <span className={u.id === current.id ? 'font-medium text-[#101826]' : 'text-[#3d4655]'}>{u.title}</span>
                    <span className="block text-xs text-[#6B7280]">{formatDate(u.report_date)}</span>
                  </span>
                  <span className="tabular-nums text-sm text-[#101826]">{Number(u.overall_progress_percentage)}%</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
