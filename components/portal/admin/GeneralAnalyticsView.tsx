'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useMemo } from 'react';
import {
  FileText,
  UserCheck,
  TrendingUp,
  BookOpen,
  Eye,
  CalendarCheck,
  ArrowRight,
} from 'lucide-react';
import StatTile from '@/components/ui/StatTile';
import type { GeneralAnalytics } from '@/lib/data/analytics-dashboard';

const EVENT_TYPE_LABELS: Record<string, string> = {
  project_view: 'Visitas proyecto',
  unit_view: 'Visitas unidad',
  proposal_view: 'Vistas propuesta',
  proposal_created: 'Propuestas creadas',
  dossier_view: 'Vistas dossier',
  pdf_export: 'Exportaciones PDF',
  whatsapp_click: 'Clicks WhatsApp',
  share_click: 'Compartidos',
  resource_download: 'Descargas recursos',
  gallery_view: 'Vistas galería',
  inventory_filter: 'Filtros inventario',
};

const EVENT_COLORS: Record<string, string> = {
  project_view: 'bg-blue-500',
  unit_view: 'bg-cyan-500',
  proposal_view: 'bg-violet-500',
  proposal_created: 'bg-indigo-500',
  dossier_view: 'bg-emerald-500',
  pdf_export: 'bg-amber-500',
  whatsapp_click: 'bg-green-500',
  share_click: 'bg-pink-500',
  resource_download: 'bg-orange-500',
  gallery_view: 'bg-teal-500',
  inventory_filter: 'bg-slate-400',
};

export default function GeneralAnalyticsView({ data }: { data: GeneralAnalytics }) {
  // Group engagement trend by day (sum all event types)
  const dailyTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of data.engagementTrend) {
      map.set(e.date, (map.get(e.date) || 0) + e.count);
    }
    const entries = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    // Fill in missing days
    if (entries.length > 0) {
      const start = new Date(entries[0][0]);
      const end = new Date(entries[entries.length - 1][0]);
      const filled: [string, number][] = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().slice(0, 10);
        filled.push([key, map.get(key) || 0]);
      }
      return filled;
    }
    return entries;
  }, [data.engagementTrend]);

  const maxDaily = Math.max(1, ...dailyTotals.map(([, c]) => c));

  // Event type totals for breakdown
  const eventTypeTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of data.engagementTrend) {
      map.set(e.eventType, (map.get(e.eventType) || 0) + e.count);
    }
    return Array.from(map.entries())
      .map(([eventType, count]) => ({ eventType, count }))
      .sort((a, b) => b.count - a.count);
  }, [data.engagementTrend]);

  const maxEventCount = Math.max(1, ...eventTypeTotals.map((e) => e.count));

  const { conversionFunnel: funnel } = data;
  const funnelSteps = [
    { label: 'Leads', value: funnel.leads },
    { label: 'Oportunidades', value: funnel.opportunities },
    { label: 'En propuesta+', value: funnel.proposals },
    { label: 'Reservas', value: funnel.reservations },
    { label: 'Ventas', value: funnel.sales },
  ];
  const maxFunnel = Math.max(1, ...funnelSteps.map((s) => s.value));

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <UITranslationBoundary attributes={["label"]}><StatTile label="Propuestas creadas" value={data.kpis.totalProposals} helper="Total histórico" icon={FileText} /></UITranslationBoundary>
        <UITranslationBoundary attributes={["label"]}><StatTile label="Leads registrados" value={data.kpis.totalLeads} helper="Contactos en CRM" icon={UserCheck} /></UITranslationBoundary>
        <UITranslationBoundary attributes={["label"]}><StatTile label="Negociaciones activas" value={data.kpis.activeNegotiations} helper="En propuesta, negociación o reserva" icon={TrendingUp} /></UITranslationBoundary>
        <UITranslationBoundary attributes={["label"]}><StatTile label="Dossiers enviados" value={data.kpis.totalDossiers} helper="Dossiers comerciales generados" icon={BookOpen} /></UITranslationBoundary>
        <UITranslationBoundary attributes={["label"]}><StatTile label="Vistas de enlaces" value={data.kpis.totalSharedLinkViews} helper="Visitas a propuestas compartidas" icon={Eye} /></UITranslationBoundary>
        <UITranslationBoundary attributes={["label"]}><StatTile label="Reservas solicitadas" value={data.kpis.totalReservations} helper="Solicitudes de reserva total" icon={CalendarCheck} /></UITranslationBoundary>
      </section>

      {/* Engagement Trend (30 days) */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
        <h2 className="text-sm font-extrabold text-slate-900"><LocalizedText text={"Actividad últimos 30 días"} /></h2>
        <p className="mt-0.5 text-[10px] text-slate-500"><LocalizedText text={"Eventos de engagement por día en toda la plataforma"} /></p>
        {dailyTotals.length === 0 ? (
          <p className="py-8 text-center text-xs text-slate-400"><LocalizedText text={"Sin datos de actividad en los últimos 30 días"} /></p>
        ) : (
          <div className="mt-4 flex items-end gap-[2px]" style={{ height: 120 }}>
            {dailyTotals.map(([date, count]) => (
              <div key={date} className="group relative flex-1" style={{ height: '100%' }}>
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-t bg-blue-500 transition-colors group-hover:bg-blue-600"
                  style={{ height: `${(count / maxDaily) * 100}%`, minHeight: count > 0 ? 2 : 0 }}
                />
                <div className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold text-white group-hover:block whitespace-nowrap">
                  {new Date(date + 'T12:00:00').toLocaleDateString('es', { day: 'numeric', month: 'short' })}: {count}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tool Usage */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
          <h2 className="text-sm font-extrabold text-slate-900"><LocalizedText text={"Uso de herramientas"} /></h2>
          <p className="mt-0.5 text-[10px] text-slate-500"><LocalizedText text={"Qué funcionalidades se usan más"} /></p>
          <div className="mt-4 space-y-3">
            {data.toolUsage.map((t) => (
              <div key={t.tool}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700">{t.label}</span>
                  <span className="text-[11px] font-extrabold text-slate-900">{t.count.toLocaleString('es')}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-blue-500 transition-all"
                    style={{ width: `${Math.max(2, (t.count / Math.max(1, data.toolUsage[0]?.count ?? 1)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Conversion Funnel */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
          <h2 className="text-sm font-extrabold text-slate-900"><LocalizedText text={"Embudo de conversión"} /></h2>
          <p className="mt-0.5 text-[10px] text-slate-500"><LocalizedText text={"De lead a venta cerrada"} /></p>
          <div className="mt-4 space-y-2">
            {funnelSteps.map((step, i) => {
              const widthPct = Math.max(8, (step.value / maxFunnel) * 100);
              const rate = i > 0 && funnelSteps[i - 1].value > 0
                ? ((step.value / funnelSteps[i - 1].value) * 100).toFixed(0)
                : null;
              return (
                <div key={step.label}>
                  <div className="mb-0.5 flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-700">{step.label}</span>
                    {rate && (
                      <span className="flex items-center gap-0.5 text-[9px] font-bold text-slate-400">
                        <ArrowRight className="h-2.5 w-2.5" /> {rate}%
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-8 items-center rounded-lg bg-gradient-to-r from-blue-500 to-blue-400 px-3 text-[11px] font-extrabold text-white transition-all"
                      style={{ width: `${widthPct}%` }}
                    >
                      {step.value.toLocaleString('es')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Projects */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
          <h2 className="text-sm font-extrabold text-slate-900"><LocalizedText text={"Proyectos más activos"} /></h2>
          <p className="mt-0.5 text-[10px] text-slate-500"><LocalizedText text={"Top 10 por cantidad de eventos (30 días)"} /></p>
          {data.topProjects.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400"><LocalizedText text={"Sin datos"} /></p>
          ) : (
            <div className="mt-3 space-y-2">
              {data.topProjects.map((p, i) => (
                <div key={p.projectId} className="flex items-center gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-blue-50 text-[10px] font-extrabold text-blue-700">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs font-bold text-slate-800">{p.projectName}</span>
                  <span className="shrink-0 text-xs font-extrabold text-slate-600">{p.totalEvents}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Event Type Breakdown */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
          <h2 className="text-sm font-extrabold text-slate-900"><LocalizedText text={"Tipos de interacción"} /></h2>
          <p className="mt-0.5 text-[10px] text-slate-500"><LocalizedText text={"Desglose de eventos por tipo (30 días)"} /></p>
          {eventTypeTotals.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400"><LocalizedText text={"Sin datos"} /></p>
          ) : (
            <div className="mt-3 space-y-2">
              {eventTypeTotals.map((e) => (
                <div key={e.eventType} className="flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${EVENT_COLORS[e.eventType] || 'bg-slate-400'}`} />
                  <span className="min-w-0 flex-1 truncate text-[11px] font-bold text-slate-700">
                    {EVENT_TYPE_LABELS[e.eventType] || e.eventType}
                  </span>
                  <div className="w-24">
                    <div className="h-1.5 rounded-full bg-slate-100">
                      <div
                        className={`h-1.5 rounded-full ${EVENT_COLORS[e.eventType] || 'bg-slate-400'}`}
                        style={{ width: `${(e.count / maxEventCount) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-10 shrink-0 text-right text-[10px] font-extrabold text-slate-600">{e.count}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
