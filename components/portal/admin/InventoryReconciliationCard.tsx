"use client";
import { LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useState, useEffect, useTransition } from "react";
import { AlertTriangle, CheckCircle2, Database, Eye, History, Play, RefreshCw, ShieldAlert, ShieldCheck, X } from "lucide-react";
import { getProjectIntegrationInfoAction, triggerInventorySyncAction, getProjectSyncHistoryAction } from "@/app/portal/admin/inventory-actions";
import type { ReconciliationRunResult } from "@/lib/integrations/inventory/types";
import { formatCurrency, formatPortalDateTime } from "@/lib/utils";

interface SyncRunRecord {
  id: number;
  mode: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  received_count: number;
  created_count: number;
  updated_count: number;
  unchanged_count: number;
  missing_count: number;
  invalid_count: number;
  error_code: string | null;
  error_summary: string | null;
  diff_summary?: unknown;
}

interface InventoryReconciliationCardProps {
  projectId: number;
  projectName: string;
  projectSlug: string;
  projectCurrency: string;
  isLocalPreview?: boolean;
}

export default function InventoryReconciliationCard({
  projectId,
  projectName,
  projectSlug,
  projectCurrency,
  isLocalPreview = false,
}: InventoryReconciliationCardProps) {
  const [isPending, startTransition] = useTransition();
  const [info, setInfo] = useState<{
    connection: {
      id: number;
      provider: string;
      display_name: string;
      status: string;
      last_attempt_at: string | null;
      last_success_at: string | null;
      last_error_code: string | null;
    } | null;
    mappedUnitsCount: number;
    lastRun: SyncRunRecord | null;
  } | null>(null);

  const [lastResult, setLastResult] = useState<ReconciliationRunResult | null>(null);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyRuns, setHistoryRuns] = useState<SyncRunRecord[]>([]);
  const [scenario, setScenario] = useState<"current" | "with_changes" | "currency_mismatch" | "mass_drop">("current");
  const [message, setMessage] = useState<{ type: "success" | "error" | "warning"; text: string } | null>(null);

  const refreshInfo = async () => {
    if (isLocalPreview) return;
    const res = await getProjectIntegrationInfoAction(projectId);
    if (res.data) {
      setInfo(res.data);
    }
  };

  useEffect(() => {
    let active = true;
    if (!isLocalPreview) {
      getProjectIntegrationInfoAction(projectId).then((res) => {
        if (active && res.data) {
          setInfo(res.data);
        }
      });
    }
    return () => {
      active = false;
    };
  }, [projectId, isLocalPreview]);

  const handleRunSync = (mode: "shadow" | "active") => {
    if (isLocalPreview) {
      setMessage({
        type: "warning",
        text: "La reconciliación en vivo está desactivada en modo previsualización local.",
      });
      return;
    }

    startTransition(async () => {
      setMessage(null);
      const res = await triggerInventorySyncAction(projectId, mode, scenario);
      if (res.error) {
        setMessage({ type: "error", text: res.error });
      } else if (res.data) {
        setLastResult(res.data);
        setIsDiffModalOpen(true);
        if (res.data.status === "quarantined") {
          setMessage({
            type: "error",
            text: `⚠️ Corrida en Cuarentena: ${res.data.summary.quarantineReason || "Violación de umbral de seguridad."}`,
          });
        } else if (res.data.applied) {
          setMessage({
            type: "success",
            text: `✅ Cambios aplicados canónicamente: ${res.data.summary.updatedCount} actualizadas, ${res.data.summary.newCount} nuevas.`,
          });
        } else {
          setMessage({
            type: "success",
            text: `🔎 Corrida en Modo Sombra completada: ${res.data.summary.receivedCount} unidades comparadas. Ningún cambio aplicado a la BD.`,
          });
        }
        await refreshInfo();
      }
    });
  };

  const handleOpenHistory = async () => {
    setIsHistoryOpen(true);
    const res = await getProjectSyncHistoryAction(projectId);
    if (res.data) {
      setHistoryRuns(res.data);
    }
  };

  return (
    <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50/70 via-slate-50 to-white p-4 sm:p-5 shadow-xs space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-white shadow-xs shrink-0">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                {info?.connection?.display_name || "Conector Oficial Cana Rock"}
              </h4>
              <span className="font-mono text-[10px] text-slate-400 font-bold">/{projectSlug}</span>
              <span className="rounded-full bg-indigo-100 text-indigo-800 text-[9px] font-extrabold px-2 py-0.5 uppercase tracking-wider border border-indigo-200">
                {info?.connection?.status === "active" ? <LocalizedText text={"En Línea"} /> : <LocalizedText text={"Modo Auditoría / Sombra"} />}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5"><LocalizedText text={"Reconciliación segura de inventario. Compara discrepancias antes de tocar los 116 registros canónicos."} /></p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleOpenHistory}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 shadow-xs transition"
          >
            <History className="h-3.5 w-3.5 text-slate-500" />
            <span><LocalizedText text={"Historial de Corridas"} /></span>
          </button>
          {lastResult && (
            <button
              type="button"
              onClick={() => setIsDiffModalOpen(true)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 shadow-xs transition"
            >
              <Eye className="h-3.5 w-3.5 text-indigo-600" />
              <span><LocalizedText text={"Ver Diferencias ("} />{lastResult.summary.diffs.filter((d) => d.kind !== "unchanged").length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-indigo-100/60">
        <div className="rounded-xl bg-white p-2.5 border border-slate-200/80">
          <span className="text-[10px] font-extrabold uppercase text-slate-400"><LocalizedText text={"Unidades Mapeadas"} /></span>
          <div className="text-lg font-black text-slate-900 mt-0.5">{info?.mappedUnitsCount ?? "—"}</div>
        </div>
        <div className="rounded-xl bg-white p-2.5 border border-slate-200/80">
          <span className="text-[10px] font-extrabold uppercase text-slate-400"><LocalizedText text={"Última Corrida"} /></span>
          <div className="text-xs font-bold text-slate-800 mt-1 truncate">
            {info?.lastRun?.started_at ? formatPortalDateTime(info.lastRun.started_at) : <LocalizedText text={"Sin corridas"} />}
          </div>
        </div>
        <div className="rounded-xl bg-white p-2.5 border border-slate-200/80">
          <span className="text-[10px] font-extrabold uppercase text-slate-400"><LocalizedText text={"Estado Auditoría"} /></span>
          <div className="mt-1">
            {info?.lastRun?.status === "succeeded" ? (
              <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /><LocalizedText text={" Conciliado"} /></span>
            ) : info?.lastRun?.status === "quarantined" ? (
              <span className="inline-flex items-center gap-1 text-xs font-black text-rose-700">
                <ShieldAlert className="h-3.5 w-3.5 text-rose-600" /><LocalizedText text={" En Cuarentena"} /></span>
            ) : (
              <span className="text-xs font-bold text-slate-500"><LocalizedText text={"Pendiente"} /></span>
            )}
          </div>
        </div>
        <div className="rounded-xl bg-white p-2.5 border border-slate-200/80">
          <span className="text-[10px] font-extrabold uppercase text-slate-400"><LocalizedText text={"Moneda Canónica"} /></span>
          <div className="text-xs font-black text-indigo-700 mt-1 font-mono">{projectCurrency}<LocalizedText text={" (Estricta)"} /></div>
        </div>
      </div>

      {/* Feedback Banner */}
      {message && (
        <div
          className={`rounded-xl p-3 text-xs font-medium flex items-start gap-2 border ${
            message.type === "error"
              ? "bg-rose-50 border-rose-200 text-rose-900"
              : message.type === "warning"
              ? "bg-amber-50 border-amber-200 text-amber-900"
              : "bg-emerald-50 border-emerald-200 text-emerald-900"
          }`}
        >
          {message.type === "error" ? (
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">{message.text}</div>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-bold text-slate-600 whitespace-nowrap"><LocalizedText text={"Escenario de Prueba:"} /></label>
          <select
            value={scenario}
            onChange={(e) =>
              setScenario(
                e.target.value as "current" | "with_changes" | "currency_mismatch" | "mass_drop"
              )
            }
            disabled={isPending}
            className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600"
          >
            <option value="current"><LocalizedText text={"Idéntico (Validar 0 cambios)"} /></option>
            <option value="with_changes"><LocalizedText text={"Con Discrepancias (1 precio, 1 estado, 1 nueva)"} /></option>
            <option value="currency_mismatch"><LocalizedText text={"Alerta Cuarentena: Divisa Inválida"} /></option>
            <option value="mass_drop"><LocalizedText text={"Alerta Cuarentena: Caída Masiva &gt;20%"} /></option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isPending}
            onClick={() => handleRunSync("shadow")}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-indigo-300 bg-white px-3 text-xs font-bold text-indigo-700 shadow-xs hover:bg-indigo-50 active:scale-[0.99] disabled:opacity-60 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-indigo-600 ${isPending ? "animate-spin" : ""}`} />
            <span><LocalizedText text={"Ejecutar Modo Sombra"} /></span>
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={() => handleRunSync("active")}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 text-xs font-extrabold text-white shadow-xs hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-60 transition"
          >
            <Play className="h-3.5 w-3.5 fill-white" />
            <span><LocalizedText text={"Aplicar Cambios Canónicos"} /></span>
          </button>
        </div>
      </div>

      {/* Diff Drawer / Modal */}
      {isDiffModalOpen && lastResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                      lastResult.status === "quarantined"
                        ? "bg-rose-100 text-rose-800"
                        : lastResult.status === "succeeded"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  ><LocalizedText text={"Corrida #"} />{lastResult.runId} · {lastResult.mode === "shadow" ? "Modo Sombra" : "Modo Activo"}
                  </span>
                  <span className="text-xs font-bold text-slate-500 font-mono"><LocalizedText text={"Hash: "} />{lastResult.sourcePayloadHash.slice(0, 12)}…
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-950 mt-1"><LocalizedText text={"Reconciliación de Disponibilidad — "} />{projectName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDiffModalOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Quarantine warning if applicable */}
              {lastResult.status === "quarantined" && (
                <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-xs text-rose-950 flex items-start gap-3">
                  <ShieldAlert className="h-6 w-6 text-rose-600 shrink-0" />
                  <div>
                    <h5 className="font-black text-rose-900 uppercase tracking-wider text-[11px]"><LocalizedText text={"Sincronización Puesta en Cuarentena de Seguridad"} /></h5>
                    <p className="mt-1 font-medium">{lastResult.summary.quarantineReason}</p>
                    <p className="mt-1 text-[11px] text-rose-700"><LocalizedText text={"Por política de seguridad canónica, los cambios automáticos fueron bloqueados para proteger el portafolio de ventas."} /></p>
                  </div>
                </div>
              )}

              {/* Counters summary */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200 text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase"><LocalizedText text={"Recibidas"} /></div>
                  <div className="text-lg font-black text-slate-900">{lastResult.summary.receivedCount}</div>
                </div>
                <div className="rounded-xl bg-emerald-50 p-2.5 border border-emerald-200 text-center">
                  <div className="text-[10px] font-bold text-emerald-600 uppercase"><LocalizedText text={"Sin Cambio"} /></div>
                  <div className="text-lg font-black text-emerald-700">{lastResult.summary.unchangedCount}</div>
                </div>
                <div className="rounded-xl bg-amber-50 p-2.5 border border-amber-200 text-center">
                  <div className="text-[10px] font-bold text-amber-600 uppercase"><LocalizedText text={"Modificadas"} /></div>
                  <div className="text-lg font-black text-amber-700">{lastResult.summary.updatedCount}</div>
                </div>
                <div className="rounded-xl bg-blue-50 p-2.5 border border-blue-200 text-center">
                  <div className="text-[10px] font-bold text-blue-600 uppercase"><LocalizedText text={"Nuevas"} /></div>
                  <div className="text-lg font-black text-blue-700">{lastResult.summary.newCount}</div>
                </div>
                <div className="rounded-xl bg-rose-50 p-2.5 border border-rose-200 text-center">
                  <div className="text-[10px] font-bold text-rose-600 uppercase"><LocalizedText text={"Ausentes"} /></div>
                  <div className="text-lg font-black text-rose-700">{lastResult.summary.missingCount}</div>
                </div>
                <div className="rounded-xl bg-slate-100 p-2.5 border border-slate-300 text-center">
                  <div className="text-[10px] font-bold text-slate-500 uppercase"><LocalizedText text={"Inválidas"} /></div>
                  <div className="text-lg font-black text-slate-700">{lastResult.summary.invalidCount}</div>
                </div>
              </div>

              {/* Diffs Table */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2"><LocalizedText text={"Detalle de Diferencias Detectadas"} /></h4>
                {lastResult.summary.diffs.filter((d) => d.kind !== "unchanged").length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/50 p-6 text-center text-xs text-emerald-800 font-medium">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 mx-auto mb-2" /><LocalizedText text={"¡Inventario idéntico al 100%! No se detectaron diferencias entre la fuente y la base de datos canónica."} /></div>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-slate-200">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 font-black text-slate-700 text-[11px] uppercase">
                        <tr>
                          <th className="px-3 py-2.5"><LocalizedText text={"Unidad"} /></th>
                          <th className="px-3 py-2.5"><LocalizedText text={"Tipo de Cambio"} /></th>
                          <th className="px-3 py-2.5"><LocalizedText text={"Valor Actual Canónico"} /></th>
                          <th className="px-3 py-2.5"><LocalizedText text={"Valor Fuente Externa"} /></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {lastResult.summary.diffs
                          .filter((d) => d.kind !== "unchanged")
                          .map((diff, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/80">
                              <td className="px-3 py-2 font-mono font-bold text-slate-900">
                                {diff.unitCode}
                              </td>
                              <td className="px-3 py-2">
                                <span
                                  className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                                    diff.kind === "price_changed"
                                      ? "bg-amber-100 text-amber-800"
                                      : diff.kind === "status_changed"
                                      ? "bg-purple-100 text-purple-800"
                                      : diff.kind === "new_unit"
                                      ? "bg-blue-100 text-blue-800"
                                      : diff.kind === "missing_from_source"
                                      ? "bg-rose-100 text-rose-800"
                                      : "bg-slate-100 text-slate-800"
                                  }`}
                                >
                                  {diff.kind === "price_changed"
                                    ? <LocalizedText text={"Precio Cambiado"} />
                                    : diff.kind === "status_changed"
                                    ? "Estado Cambiado"
                                    : diff.kind === "new_unit"
                                    ? <LocalizedText text={"Unidad Nueva"} />
                                    : diff.kind === "missing_from_source"
                                    ? "Ausente en Fuente"
                                    : diff.kind}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-slate-600">
                                {diff.currentUnit ? (
                                  <div>
                                    <span className="font-bold text-slate-900">{diff.currentUnit.status}</span> ·{" "}
                                    {formatCurrency(diff.currentUnit.listPrice, diff.currentUnit.currency)}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 italic"><LocalizedText text={"No existía"} /></span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-slate-900">
                                {diff.incomingUnit ? (
                                  <div className="font-semibold text-indigo-700">
                                    <span>{diff.incomingUnit.status}</span> ·{" "}
                                    {formatCurrency(diff.incomingUnit.price || 0, diff.incomingUnit.currency)}
                                  </div>
                                ) : diff.invalidReason ? (
                                  <span className="text-rose-600 font-bold">{diff.invalidReason}</span>
                                ) : (
                                  <span className="text-slate-400 italic">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4">
              <span className="text-xs text-slate-500 font-medium"><LocalizedText text={"Auditoría verificada mediante hashes SHA-256 e historial inmutable."} /></span>
              <button
                type="button"
                onClick={() => setIsDiffModalOpen(false)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-extrabold text-white hover:bg-slate-800"
              ><LocalizedText text={"Cerrar Auditoría"} /></button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="relative flex max-h-[85vh] w-full max-w-3xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <div>
                <h3 className="text-sm font-black text-slate-950 uppercase tracking-wider"><LocalizedText text={"Historial de Reconciliaciones — "} />{projectName}
                </h3>
                <p className="text-xs text-slate-500"><LocalizedText text={"Últimas 10 ejecuciones registradas en base de datos."} /></p>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {historyRuns.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400"><LocalizedText text={"No hay corridas previas registradas."} /></div>
              ) : (
                <div className="space-y-3">
                  {historyRuns.map((run) => (
                    <div key={run.id} className="rounded-2xl border border-slate-200 p-4 bg-white shadow-xs">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-slate-900"><LocalizedText text={"Corrida #"} />{run.id}</span>
                          <span
                            className={`rounded-md px-2 py-0.5 text-[9px] font-black uppercase ${
                              run.mode === "shadow" ? "bg-slate-100 text-slate-700" : "bg-indigo-100 text-indigo-700"
                            }`}
                          >
                            {run.mode}
                          </span>
                          <span
                            className={`rounded-md px-2 py-0.5 text-[9px] font-black uppercase ${
                              run.status === "succeeded"
                                ? "bg-emerald-100 text-emerald-700"
                                : run.status === "quarantined"
                                ? "bg-rose-100 text-rose-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {run.status}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {formatPortalDateTime(run.started_at)}
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-center text-[11px] bg-slate-50 rounded-xl p-2 font-medium text-slate-600">
                        <div><LocalizedText text={"Recibidas: "} /><span className="font-bold text-slate-900">{run.received_count}</span></div>
                        <div><LocalizedText text={"Nuevas: "} /><span className="font-bold text-blue-600">{run.created_count}</span></div>
                        <div><LocalizedText text={"Actualizadas: "} /><span className="font-bold text-amber-600">{run.updated_count}</span></div>
                        <div><LocalizedText text={"Sin Cambio: "} /><span className="font-bold text-emerald-600">{run.unchanged_count}</span></div>
                      </div>

                      {run.error_summary && (
                        <p className="mt-2 text-xs font-semibold text-rose-700 bg-rose-50 p-2 rounded-lg">
                          ⚠️ {run.error_summary}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 bg-slate-50 px-6 py-3 text-right">
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-extrabold text-white hover:bg-slate-800"
              ><LocalizedText text={"Cerrar"} /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
