'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useMemo, useState } from 'react';
import {
  Search,
  FileText,
  UserCheck,
  TrendingUp,
  BookOpen,
  Link2,
  Eye,
  CalendarCheck,
} from 'lucide-react';
import type { DetailedAnalytics, AgencyAnalyticsCard } from '@/lib/data/analytics-dashboard';

type SortKey = 'activity' | 'name' | 'proposals' | 'leads';
type ActivityFilter = 'all' | 'active' | 'moderate' | 'inactive';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'activity', label: 'Más activas primero' },
  { value: 'name', label: 'Nombre A-Z' },
  { value: 'proposals', label: 'Más propuestas' },
  { value: 'leads', label: 'Más leads' },
];

const ACTIVITY_LABELS: Record<string, { label: string; color: string; dot: string }> = {
  active: { label: 'Activa', color: 'bg-green-50 text-green-700', dot: 'bg-green-500' },
  moderate: { label: 'Moderada', color: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  inactive: { label: 'Inactiva', color: 'bg-red-50 text-red-700', dot: 'bg-red-500' },
};

function MetricPill({ icon: Icon, label, value }: { icon: typeof FileText; label: string; value: number }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 py-1.5">
      <Icon className="h-3 w-3 text-slate-400" />
      <div>
        <p className="text-[9px] font-bold text-slate-400">{label}</p>
        <p className="text-xs font-extrabold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function AgencyCard({ agency }: { agency: AgencyAnalyticsCard }) {
  const badge = ACTIVITY_LABELS[agency.activityLevel];
  const m = agency.metrics;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-100 text-xs font-black text-blue-700">
            {agency.initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">{agency.organizationName}</p>
            <p className="text-[10px] font-mono text-slate-400">/{agency.slug}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[9px] font-extrabold ${badge.color}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
          {badge.label}
        </span>
      </div>

      {/* Quick info */}
      <div className="mt-3 flex items-center gap-4 text-[10px] text-slate-500">
        <span className="font-bold">{agency.activeUsers}<LocalizedText text={" usuarios activos"} /></span>
        <span>{agency.recentEventCount}<LocalizedText text={" eventos (30d)"} /></span>
        {agency.lastActivityAt && (
          <span><LocalizedText text={"Última: "} />{new Date(agency.lastActivityAt).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
          </span>
        )}
      </div>

      {/* Metrics grid */}
      <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        <UITranslationBoundary attributes={["label"]}><MetricPill icon={FileText} label="Propuestas" value={m.proposalsCreated} /></UITranslationBoundary>
        <UITranslationBoundary attributes={["label"]}><MetricPill icon={UserCheck} label="Leads" value={m.leadsRegistered} /></UITranslationBoundary>
        <UITranslationBoundary attributes={["label"]}><MetricPill icon={TrendingUp} label="Negociaciones" value={m.activeNegotiations} /></UITranslationBoundary>
        <UITranslationBoundary attributes={["label"]}><MetricPill icon={BookOpen} label="Dossiers" value={m.dossiersSent} /></UITranslationBoundary>
        <UITranslationBoundary attributes={["label"]}><MetricPill icon={Link2} label="Enlaces" value={m.sharedLinksCreated} /></UITranslationBoundary>
        <UITranslationBoundary attributes={["label"]}><MetricPill icon={Eye} label="Vistas enlace" value={m.sharedLinkViews} /></UITranslationBoundary>
        <UITranslationBoundary attributes={["label"]}><MetricPill icon={CalendarCheck} label="Reservas" value={m.reservationsMade} /></UITranslationBoundary>
      </div>
    </article>
  );
}

export default function DetailedAnalyticsView({ data }: { data: DetailedAnalytics }) {
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('activity');
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all');

  const filtered = useMemo(() => {
    let list = data.agencies;

    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (a) => a.organizationName.toLowerCase().includes(q) || a.slug.toLowerCase().includes(q)
      );
    }

    if (activityFilter !== 'all') {
      list = list.filter((a) => a.activityLevel === activityFilter);
    }

    const sorted = [...list];
    switch (sortKey) {
      case 'activity':
        sorted.sort((a, b) => b.recentEventCount - a.recentEventCount);
        break;
      case 'name':
        sorted.sort((a, b) => a.organizationName.localeCompare(b.organizationName));
        break;
      case 'proposals':
        sorted.sort((a, b) => b.metrics.proposalsCreated - a.metrics.proposalsCreated);
        break;
      case 'leads':
        sorted.sort((a, b) => b.metrics.leadsRegistered - a.metrics.leadsRegistered);
        break;
    }

    return sorted;
  }, [data.agencies, query, sortKey, activityFilter]);

  const activityCounts = useMemo(() => {
    const counts = { all: data.agencies.length, active: 0, moderate: 0, inactive: 0 };
    for (const a of data.agencies) counts[a.activityLevel]++;
    return counts;
  }, [data.agencies]);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative">
          <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <UITranslationBoundary attributes={["placeholder"]}><input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar agencia..."
            className="h-10 w-64 rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-xs outline-none focus:border-blue-600 focus:bg-white"
          /></UITranslationBoundary>
        </label>

        <div className="flex items-center gap-2">
          {/* Activity filter chips */}
          {(['all', 'active', 'moderate', 'inactive'] as const).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setActivityFilter(level)}
              className={`rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition ${
                activityFilter === level
                  ? 'bg-blue-600 text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {level === 'all' ? 'Todas' : ACTIVITY_LABELS[level].label} ({activityCounts[level]})
            </button>
          ))}

          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[10px] font-bold text-slate-600 outline-none"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Agency cards grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
          <p className="text-sm font-bold text-slate-400"><LocalizedText text={"No se encontraron agencias"} /></p>
          <p className="mt-1 text-[10px] text-slate-400"><LocalizedText text={"Ajusta los filtros o la búsqueda"} /></p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((agency) => (
            <AgencyCard key={agency.organizationId} agency={agency} />
          ))}
        </div>
      )}
    </div>
  );
}
