'use client';
import { LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useState } from 'react';
import { Activity, Globe, Building2 } from 'lucide-react';
import type { GeneralAnalytics, DetailedAnalytics } from '@/lib/data/analytics-dashboard';
import GeneralAnalyticsView from './GeneralAnalyticsView';
import DetailedAnalyticsView from './DetailedAnalyticsView';

type Tab = 'general' | 'detailed';

export default function AnalyticsDashboard({
  generalData,
  detailedData,
  globalAccess,
  organizationName,
}: {
  generalData: GeneralAnalytics;
  detailedData: DetailedAnalytics;
  globalAccess: boolean;
  organizationName: string;
}) {
  const [activeTab, setActiveTab] = useState<Tab>('general');

  return (
    <div className="portal-enter space-y-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-blue-700">
            <Activity className="h-4 w-4 text-blue-600" />
            <span>{globalAccess ? <LocalizedText text={"Estadísticas de la Plataforma"} /> : <LocalizedText text={"Estadísticas de la Organización"} />}</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            {globalAccess ? 'Analytics Global' : organizationName}
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-slate-500"><LocalizedText text={"Métricas de uso, actividad por agencia y rendimiento general de la plataforma."} /></p>
        </div>
      </section>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-2xl border border-slate-200 bg-slate-100 p-1.5">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === 'general'
              ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-950/5'
              : 'text-slate-600 hover:text-slate-950'
          }`}
        >
          <Globe className="h-3.5 w-3.5" /><LocalizedText text={"General"} /></button>
        <button
          type="button"
          onClick={() => setActiveTab('detailed')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === 'detailed'
              ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-950/5'
              : 'text-slate-600 hover:text-slate-950'
          }`}
        >
          <Building2 className="h-3.5 w-3.5" /><LocalizedText text={"Por agencia"} /></button>
      </div>

      {activeTab === 'general' && <GeneralAnalyticsView data={generalData} />}
      {activeTab === 'detailed' && <DetailedAnalyticsView data={detailedData} />}
    </div>
  );
}
