'use client';

import React, { useState } from 'react';
import { Calendar, CheckCircle2, ChevronRight, Image as ImageIcon, Play, Sparkles } from 'lucide-react';
import type { ProjectConstructionUpdate } from '@/lib/data/construction-updates';

interface ConstructionProgressProps {
  updates: ProjectConstructionUpdate[];
  projectName: string;
}

export default function ConstructionProgressTimeline({ updates, projectName }: ConstructionProgressProps) {
  const [selectedUpdate, setSelectedUpdate] = useState<ProjectConstructionUpdate | null>(
    updates.length > 0 ? updates[0] : null
  );

  if (updates.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
        <Sparkles className="mx-auto h-8 w-8 text-slate-400 mb-2" />
        <h4 className="text-sm font-semibold text-slate-900">Bitácora de obra en preparación</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Próximamente se publicarán aquí los reportes mensuales, fotografías de avance y tomas de dron de {projectName}.
        </p>
      </div>
    );
  }

  const latest = updates[0];

  return (
    <div className="space-y-6">
      {/* Resumen del último hito */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {latest.stage_name}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(latest.report_date).toLocaleDateString('es-DO', {
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-1">{latest.title}</h3>
            {latest.summary && <p className="text-xs text-slate-600 mt-1">{latest.summary}</p>}
          </div>

          <div className="text-right sm:border-l sm:border-slate-100 sm:pl-6 min-w-[140px]">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">Avance General</span>
            <span className="text-2xl font-black text-slate-900">{latest.overall_progress_percentage}%</span>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-1">
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, latest.overall_progress_percentage))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Galería de fotos o video si existe */}
        {selectedUpdate && (
          <div className="pt-4 space-y-4">
            {selectedUpdate.drone_video_url && (
              <div className="rounded-xl overflow-hidden bg-slate-900 aspect-video relative flex items-center justify-center">
                <a
                  href={selectedUpdate.drone_video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/90 hover:bg-white text-slate-900 text-xs font-bold transition shadow-lg"
                >
                  <Play className="h-4 w-4 fill-slate-900" />
                  Ver toma aérea de dron
                </a>
              </div>
            )}

            {selectedUpdate.photos && selectedUpdate.photos.length > 0 && (
              <div>
                <h5 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-slate-400" />
                  Fotografías de seguimiento ({selectedUpdate.photos.length})
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {selectedUpdate.photos.map((photo, idx) => (
                    <div
                      key={idx}
                      className="group relative rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-square"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo.url}
                        alt={photo.caption || `Avance de obra ${idx + 1}`}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {photo.caption && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-[10px] text-white font-medium">
                          {photo.caption}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Historial de reportes anteriores */}
      {updates.length > 1 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Historial de Reportes</h4>
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden">
            {updates.map((update) => (
              <button
                key={update.id}
                onClick={() => setSelectedUpdate(update)}
                className={`w-full flex items-center justify-between p-3.5 text-left transition hover:bg-slate-50 ${
                  selectedUpdate?.id === update.id ? 'bg-slate-50/80 font-semibold' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700">
                    {update.overall_progress_percentage}%
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{update.title}</span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(update.report_date).toLocaleDateString('es-DO', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
