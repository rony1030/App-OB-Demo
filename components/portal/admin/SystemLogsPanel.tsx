'use client';

import { useState, useTransition, useCallback } from 'react';
import type { SystemLog, LogLevel, LogCategory } from '@/lib/logger';
import { fetchSystemLogsAction, fetchLogStatsAction, writeMaintenanceLogAction } from '@/app/portal/admin/system-logs/actions';
import {
  Activity, AlertTriangle, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight,
  Circle, Clock, Filter, RefreshCw, Search, Server, ShieldAlert, Terminal, XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Tipos locales ─────────────────────────────────────────────────────────────

interface LogStats {
  totalToday: number;
  totalErrors: number;
  totalCritical: number;
  totalWarnings: number;
}

interface Props {
  initialLogs: SystemLog[];
  initialTotal: number;
  stats: LogStats;
  currentUser: {
    id: string;
    email: string;
    role: string;
    displayName: string;
  };
}

// ─── Helpers visuales ─────────────────────────────────────────────────────────

const LEVEL_STYLES: Record<LogLevel, { badge: string; icon: typeof Circle; label: string }> = {
  info:     { badge: 'bg-sky-100 text-sky-700 border-sky-200',          icon: CheckCircle2,  label: 'Info' },
  warning:  { badge: 'bg-amber-100 text-amber-700 border-amber-200',    icon: AlertTriangle, label: 'Alerta' },
  error:    { badge: 'bg-red-100 text-red-700 border-red-200',          icon: XCircle,       label: 'Error' },
  critical: { badge: 'bg-rose-200 text-rose-900 border-rose-300',       icon: ShieldAlert,   label: 'Crítico' },
};

const CATEGORY_LABELS: Record<LogCategory, string> = {
  auth:           'Autenticación',
  server_action:  'Acción servidor',
  data_mutation:  'Mutación de datos',
  navigation:     'Navegación',
  system:         'Sistema',
  migration:      'Migración',
  external_api:   'API externa',
  maintenance:    'Mantenimiento',
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('es-MX', {
    month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function LevelBadge({ level }: { level: LogLevel }) {
  const { badge, icon: Icon, label } = LEVEL_STYLES[level];
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium', badge)}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

// ─── Componente principal ──────────────────────────────────────────────────────

export default function SystemLogsPanel({ initialLogs, initialTotal, stats: initialStats, currentUser }: Props) {
  const [logs, setLogs] = useState<SystemLog[]>(initialLogs);
  const [total, setTotal] = useState(initialTotal);
  const [stats, setStats] = useState<LogStats>(initialStats);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  // Filtros
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<LogLevel | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<LogCategory | ''>('');
  const [expanded, setExpanded] = useState<string | null>(null);

  // Panel de entrada manual
  const [manualAction, setManualAction] = useState('');
  const [manualDesc, setManualDesc] = useState('');
  const [manualLevel, setManualLevel] = useState<'info' | 'warning'>('info');
  const [manualOpen, setManualOpen] = useState(false);
  const [manualMsg, setManualMsg] = useState('');

  const [isPending, startTransition] = useTransition();

  const refresh = useCallback((newPage = page, lvl = levelFilter, cat = categoryFilter, q = search) => {
    startTransition(async () => {
      const [result, newStats] = await Promise.all([
        fetchSystemLogsAction({
          level: lvl || undefined,
          category: (cat as LogCategory) || undefined,
          search: q || undefined,
          limit: PAGE_SIZE,
          offset: newPage * PAGE_SIZE,
        }),
        fetchLogStatsAction(),
      ]);
      setLogs(result.logs);
      setTotal(result.total);
      setStats(newStats);
    });
  }, [page, levelFilter, categoryFilter, search]);

  const handleFilter = () => {
    setPage(0);
    refresh(0, levelFilter, categoryFilter, search);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    refresh(newPage);
  };

  const handleManualLog = () => {
    if (!manualAction.trim() || !manualDesc.trim()) return;
    startTransition(async () => {
      await writeMaintenanceLogAction(manualAction.trim(), manualDesc.trim(), manualLevel);
      setManualMsg('✓ Registro guardado');
      setManualAction('');
      setManualDesc('');
      setTimeout(() => {
        setManualMsg('');
        setManualOpen(false);
        refresh(0);
      }, 1500);
    });
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-slate-600" />
            Registros del Sistema
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Actividad, errores y auditoría interna — solo visible para administradores
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setManualOpen(!manualOpen)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <Server className="w-4 h-4" />
            Registrar mantenimiento
          </button>
          <button
            onClick={() => refresh()}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={cn('w-4 h-4', isPending && 'animate-spin')} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Panel de registro manual */}
      {manualOpen && (
        <div className="bg-white rounded-xl border border-amber-200 p-4 shadow-sm space-y-3">
          <h2 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-500" />
            Entrada de mantenimiento manual
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Acción / Identificador</label>
              <input
                value={manualAction}
                onChange={e => setManualAction(e.target.value)}
                placeholder="Ej: server_restart, vps_migration_step1"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nivel</label>
              <select
                value={manualLevel}
                onChange={e => setManualLevel(e.target.value as 'info' | 'warning')}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <option value="info">Info</option>
                <option value="warning">Alerta</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Descripción / Contexto</label>
            <textarea
              value={manualDesc}
              onChange={e => setManualDesc(e.target.value)}
              placeholder="¿Qué se hizo, quién lo solicitó, por qué? Ej: Migración del proyecto OB Brokers al VPS de Osvaldo — Rony, 30 Sep 2026"
              rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleManualLog}
              disabled={isPending || !manualAction.trim() || !manualDesc.trim()}
              className="px-4 py-1.5 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
            >
              Guardar registro
            </button>
            {manualMsg && <span className="text-sm text-green-600 font-medium">{manualMsg}</span>}
          </div>
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Hoy', value: stats.totalToday, icon: Clock, color: 'text-sky-600' },
          { label: 'Errores totales', value: stats.totalErrors, icon: XCircle, color: 'text-red-600' },
          { label: 'Críticos', value: stats.totalCritical, icon: ShieldAlert, color: 'text-rose-700' },
          { label: 'Alertas', value: stats.totalWarnings, icon: AlertTriangle, color: 'text-amber-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <Icon className={cn('w-5 h-5 flex-shrink-0', color)} />
            <div>
              <div className="text-2xl font-bold text-slate-900">{value}</div>
              <div className="text-xs text-slate-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleFilter()}
            placeholder="Buscar en descripción..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
          />
        </div>
        <select
          value={levelFilter}
          onChange={e => setLevelFilter(e.target.value as LogLevel | '')}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
        >
          <option value="">Todos los niveles</option>
          {(['info', 'warning', 'error', 'critical'] as LogLevel[]).map(l => (
            <option key={l} value={l}>{LEVEL_STYLES[l].label}</option>
          ))}
        </select>
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value as LogCategory | '')}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
        >
          <option value="">Todas las categorías</option>
          {(Object.entries(CATEGORY_LABELS) as [LogCategory, string][]).map(([cat, label]) => (
            <option key={cat} value={cat}>{label}</option>
          ))}
        </select>
        <button
          onClick={handleFilter}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors"
        >
          <Filter className="w-4 h-4" />
          Filtrar
        </button>
      </div>

      {/* Tabla de logs */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isPending ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mr-3" />
            Cargando registros...
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
            <CheckCircle2 className="w-8 h-8 text-green-400" />
            <p className="font-medium text-slate-600">Sin registros para los filtros seleccionados</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => {
              const isExpanded = expanded === log.id;
              const hasDetail = !!(log.error_message || log.error_stack || Object.keys(log.metadata ?? {}).length > 0);
              return (
                <div key={log.id} className={cn('group', isExpanded && 'bg-slate-50')}>
                  <div
                    className={cn(
                      'flex items-start gap-3 px-4 py-3',
                      hasDetail && 'cursor-pointer hover:bg-slate-50 transition-colors'
                    )}
                    onClick={() => hasDetail && setExpanded(isExpanded ? null : log.id)}
                  >
                    {/* Level */}
                    <div className="flex-shrink-0 pt-0.5">
                      <LevelBadge level={log.level} />
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                          {log.action}
                        </span>
                        <span className="text-xs text-slate-400">
                          {CATEGORY_LABELS[log.category as LogCategory] ?? log.category}
                        </span>
                      </div>
                      <p className="text-sm text-slate-800 mt-0.5 leading-snug">{log.description}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(log.created_at)}
                        </span>
                        {log.user_name && <span>👤 {log.user_name}</span>}
                        {log.user_role && <span className="font-medium text-slate-500">{log.user_role}</span>}
                        {log.route && <span className="font-mono truncate">{log.route}</span>}
                        {log.duration_ms != null && <span>⚡ {log.duration_ms}ms</span>}
                      </div>
                    </div>

                    {/* Expand arrow */}
                    {hasDetail && (
                      <ChevronDown className={cn('w-4 h-4 text-slate-400 flex-shrink-0 mt-1 transition-transform', isExpanded && 'rotate-180')} />
                    )}
                  </div>

                  {/* Detail expanded */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3">
                      {log.error_message && (
                        <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                          <div className="text-xs font-semibold text-red-700 mb-1">Error</div>
                          <pre className="text-xs text-red-800 whitespace-pre-wrap break-words">{log.error_message}</pre>
                        </div>
                      )}
                      {log.error_stack && (
                        <div className="rounded-lg bg-slate-100 p-3">
                          <div className="text-xs font-semibold text-slate-600 mb-1">Stack trace</div>
                          <pre className="text-xs text-slate-700 whitespace-pre-wrap break-words font-mono max-h-48 overflow-y-auto">{log.error_stack}</pre>
                        </div>
                      )}
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="rounded-lg bg-sky-50 border border-sky-100 p-3">
                          <div className="text-xs font-semibold text-sky-700 mb-1">Metadata</div>
                          <pre className="text-xs text-sky-900 whitespace-pre-wrap break-words font-mono">{JSON.stringify(log.metadata, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>{total} registros totales</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 0 || isPending}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-medium">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page >= totalPages - 1 || isPending}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
