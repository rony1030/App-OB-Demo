"use client";
import { LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useEffect, useState, useTransition } from "react";
import { Activity, BarChart3, CheckCircle2, Clock, Download, Eye, FileSpreadsheet, FileText, MessageCircle, RefreshCcw, ShieldCheck, TrendingUp } from "lucide-react";
import { getProjectAnalyticsAction } from "@/app/portal/analytics-actions";
import type { ProjectAnalyticsSummary } from "@/lib/analytics/service";
import { formatPortalTime } from "@/lib/utils";

interface ProjectAnalyticsPanelProps {
  projectId: number;
  projectName: string;
}

export default function ProjectAnalyticsPanel({
  projectId,
  projectName,
}: ProjectAnalyticsPanelProps) {
  const [summary, setSummary] = useState<ProjectAnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    startTransition(async () => {
      const res = await getProjectAnalyticsAction(projectId);
      if (!active) return;
      if (res.error) {
        setError(res.error);
      } else {
        setSummary(res.data);
      }
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [projectId]);

  const handleRefresh = () => {
    setIsLoading(true);
    startTransition(async () => {
      const res = await getProjectAnalyticsAction(projectId);
      if (res.error) {
        setError(res.error);
      } else {
        setSummary(res.data);
      }
      setIsLoading(false);
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-3xl border border-slate-200 bg-white p-8">
        <div className="flex flex-col items-center gap-2 text-slate-400">
          <RefreshCcw className="h-6 w-6 animate-spin text-blue-600" />
          <p className="text-xs font-semibold"><LocalizedText text={"Cargando métricas comerciales..."} /></p>
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500">
        <p className="font-bold text-slate-800 mb-1"><LocalizedText text={"No se pudieron cargar las estadísticas"} /></p>
        <p>{error || "Intenta nuevamente más tarde."}</p>
      </div>
    );
  }

  const kpis = [
    {
      label: "Visitas Totales",
      value: summary.totalViews,
      helper: "Landing y fichas de proyecto",
      icon: Eye,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Consultas de Unidad",
      value: summary.totalUnitViews,
      helper: "Fichas de unidad abiertas",
      icon: TrendingUp,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
    {
      label: "Contactos WhatsApp",
      value: summary.totalWhatsappClicks,
      helper: "Consultas directas a brokers",
      icon: MessageCircle,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Exportaciones PDF",
      value: summary.totalPdfExports,
      helper: "Listas de disponibilidad",
      icon: FileSpreadsheet,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Propuestas Emitidas",
      value: summary.totalProposalsCreated,
      helper: "Cotizaciones simuladas",
      icon: FileText,
      color: "text-sky-600",
      bg: "bg-sky-50",
    },
    {
      label: "Aperturas de Propuesta",
      value: summary.totalProposalViews,
      helper: "Lecturas de enlaces compartidos",
      icon: Eye,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      label: "PDF de Propuesta",
      value: summary.totalProposalPdfs,
      helper: "Documentos descargados por clientes",
      icon: Download,
      color: "text-rose-600",
      bg: "bg-rose-50",
    },
    {
      label: "Compartidas",
      value: summary.totalProposalShares,
      helper: "Reenvíos desde el visor privado",
      icon: FileText,
      color: "text-cyan-600",
      bg: "bg-cyan-50",
    },
    {
      label: "Contactos de Propuesta",
      value: summary.totalProposalWhatsappClicks,
      helper: "Consultas por WhatsApp desde el visor",
      icon: MessageCircle,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Documentos Oficiales",
      value: summary.totalResourceDownloads,
      helper: "Brochures y fichas descargadas",
      icon: Download,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-extrabold text-[10px] uppercase tracking-wider">
            <BarChart3 className="h-3.5 w-3.5" />
            <span><LocalizedText text={"Métricas &amp; Rendimiento Comercial"} /></span>
          </div>
          <h2 className="text-xl font-black text-slate-950 mt-1"><LocalizedText text={"Estadísticas de "} />{projectName}
          </h2>
        </div>
        <button
          type="button"
          disabled={isPending}
          onClick={handleRefresh}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition self-start sm:self-auto"
        >
          <RefreshCcw className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`} />
          <span><LocalizedText text={"Actualizar"} /></span>
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                  {kpi.label}
                </span>
                <div className={`rounded-lg p-1.5 ${kpi.bg} ${kpi.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-black text-slate-900">{kpi.value}</p>
                <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">{kpi.helper}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Operational Health & Security Guardrail */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-extrabold text-emerald-950"><LocalizedText text={"Operación Continua y Privacidad Activa"} /></p>
            <p className="text-[10px] text-emerald-800"><LocalizedText text={"Aislamiento RLS en PostgreSQL · Sin almacenamiento de PII sensible · Retención de eventos controlada."} /></p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[9px] font-black text-emerald-800">
            <CheckCircle2 className="h-3 w-3" /><LocalizedText text={"Inventario en Sincronía"} /></span>
        </div>
      </div>

      {/* Two Column Breakdown: Top Units & Top Resources */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Units */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span><LocalizedText text={"Unidades más Consultadas"} /></span>
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold"><LocalizedText text={"Ranking de interés"} /></span>
          </div>

          {summary.topUnits.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center italic"><LocalizedText text={"Aún no hay interacción registrada con unidades individuales."} /></p>
          ) : (
            <div className="space-y-3">
              {summary.topUnits.map((u, i) => {
                const max = summary.topUnits[0]?.views || 1;
                const pct = Math.round((u.views / max) * 100);

                return (
                  <div key={u.unitCode} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-800 flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-mono">#{i + 1}</span>
                        <span><LocalizedText text={"Unidad "} />{u.unitCode}</span>
                      </span>
                      <span className="text-blue-600 font-extrabold">{u.views}<LocalizedText text={" aperturas"} /></span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-600 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Downloaded Resources */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Download className="h-4 w-4 text-purple-600" />
              <span><LocalizedText text={"Documentos más Descargados"} /></span>
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold"><LocalizedText text={"Brochures y Fichas"} /></span>
          </div>

          {summary.topResources.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center italic"><LocalizedText text={"Aún no hay descargas de recursos registradas."} /></p>
          ) : (
            <div className="divide-y divide-slate-100">
              {summary.topResources.map((r) => (
                <div key={r.title} className="flex items-center justify-between py-2.5 text-xs">
                  <div className="flex items-center gap-2.5">
                    <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="font-bold text-slate-800 truncate max-w-[220px]">
                      {r.title}
                    </span>
                  </div>
                  <span className="font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md text-[10px]">
                    {r.downloads}<LocalizedText text={" descargas"} /></span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Timeline */}
      {summary.recentActivity.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-600" />
            <span><LocalizedText text={"Actividad Comercial Reciente"} /></span>
          </h3>
          <div className="divide-y divide-slate-100">
            {summary.recentActivity.map((act, index) => (
              <div key={index} className="flex items-center justify-between py-2 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                  <span>{act.description}</span>
                </div>
                <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                  <Clock className="h-3 w-3" />
                  {formatPortalTime(act.occurredAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
