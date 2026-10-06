
import { LocalizedText } from '@/components/i18n/UITranslationBoundary';
import { ShieldCheck } from 'lucide-react';
import type { AuditEvent } from '@/lib/data/audit';

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('es-DO', {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Santo_Domingo',
  }).format(new Date(value));
}

export default function AuditLog({ events, orgName }: { events: AuditEvent[]; orgName: string }) {
  return (
    <div className="portal-enter space-y-6">
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-600"><LocalizedText text={"Auditoría"} /></p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-950"><LocalizedText text={"Trazabilidad de "} />{orgName}</h1>
        <p className="mt-1 text-xs text-slate-500"><LocalizedText text={"Registro de solo lectura de acciones relevantes en la organización."} /></p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 p-5">
          <ShieldCheck className="h-4 w-4 text-blue-600" />
          <h2 className="text-sm font-extrabold text-slate-900"><LocalizedText text={"Eventos recientes"} /></h2>
        </div>
        {events.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-xs font-semibold text-slate-500"><LocalizedText text={"Todavía no hay eventos registrados."} /></p>
            <p className="mt-1 text-[11px] text-slate-400"><LocalizedText text={"El registro de auditoría está listo para recibir eventos, pero las acciones de la plataforma aún no los generan de forma automática."} /></p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {events.map((event) => (
              <div key={event.id} className="grid gap-2 p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                <span className="w-fit rounded-lg bg-blue-50 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide text-blue-700">{event.action}</span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-slate-900">{event.entityType} {event.entityId ? `· #${event.entityId}` : ''}</p>
                  <p className="text-[10px] text-slate-500">{event.actorName || 'Sistema'}</p>
                </div>
                <span className="text-[10px] text-slate-400">{formatDateTime(event.occurredAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
