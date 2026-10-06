/**
 * Sistema de Logging Interno — OB Brokers CRM
 *
 * Registra errores, acciones de servidor, mutaciones de datos y eventos del sistema.
 * NUNCA incluye contraseñas, tokens, ni información sensible en los logs.
 *
 * Acceso solo desde server-side (Server Actions, Route Handlers, API internos).
 * El panel de visualización está en /portal/admin/system-logs.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import type { CurrentSessionUser } from '@/lib/auth/get-user';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type LogLevel = 'info' | 'warning' | 'error' | 'critical';

export type LogCategory =
  | 'auth'
  | 'server_action'
  | 'data_mutation'
  | 'navigation'
  | 'system'
  | 'migration'
  | 'external_api'
  | 'maintenance';

export interface LogEntry {
  level: LogLevel;
  category: LogCategory;
  action: string;
  description: string;
  route?: string;
  metadata?: Record<string, unknown>;
  error?: Error | unknown;
  durationMs?: number;
  statusCode?: number;
  user?: Pick<CurrentSessionUser, 'id' | 'email' | 'role' | 'displayName'> | null;
}

export interface SystemLog {
  id: string;
  created_at: string;
  user_id: string | null;
  user_email: string | null;
  user_role: string | null;
  user_name: string | null;
  level: LogLevel;
  category: LogCategory;
  action: string;
  description: string;
  route: string | null;
  metadata: Record<string, unknown>;
  error_message: string | null;
  error_stack: string | null;
  duration_ms: number | null;
  status_code: number | null;
}

export interface LogsFilter {
  level?: LogLevel;
  category?: LogCategory;
  userId?: string;
  from?: string;
  to?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

// ─── Helpers internos ─────────────────────────────────────────────────────────

/** Extrae mensaje de error de cualquier tipo de excepción */
function extractErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try { return JSON.stringify(error); } catch { return String(error); }
}

/** Extrae stack trace, truncado a 2000 chars para no saturar la BD */
function extractErrorStack(error: unknown): string | null {
  if (error instanceof Error && error.stack) {
    return error.stack.slice(0, 2000);
  }
  return null;
}

/** Sanitiza metadata — elimina campos potencialmente sensibles */
function sanitizeMetadata(meta: Record<string, unknown> = {}): Record<string, unknown> {
  const FORBIDDEN_KEYS = new Set([
    'password', 'token', 'secret', 'key', 'apikey', 'api_key',
    'authorization', 'cookie', 'session', 'serviceRoleKey',
  ]);
  return Object.fromEntries(
    Object.entries(meta).filter(([k]) => !FORBIDDEN_KEYS.has(k.toLowerCase()))
  );
}

// ─── Logger principal ─────────────────────────────────────────────────────────

/**
 * Escribe una entrada en el registro del sistema.
 * Falla silenciosamente (solo console.error) para no interrumpir el flujo principal.
 */
export async function writeLog(entry: LogEntry): Promise<void> {
  // Siempre imprimir en consola también (visible en VPS/PM2 logs)
  const consoleMsg = `[OB-LOG][${entry.level.toUpperCase()}][${entry.category}] ${entry.action}: ${entry.description}`;
  if (entry.level === 'error' || entry.level === 'critical') {
    console.error(consoleMsg, entry.error ?? '');
  } else if (entry.level === 'warning') {
    console.warn(consoleMsg);
  } else {
    console.info(consoleMsg);
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    await supabase.from('system_logs').insert({
      user_id: entry.user?.id ?? null,
      user_email: entry.user?.email ?? null,
      user_role: entry.user?.role ?? null,
      user_name: entry.user?.displayName ?? null,
      level: entry.level,
      category: entry.category,
      action: entry.action,
      description: entry.description,
      route: entry.route ?? null,
      metadata: sanitizeMetadata(entry.metadata),
      error_message: extractErrorMessage(entry.error),
      error_stack: extractErrorStack(entry.error),
      duration_ms: entry.durationMs ?? null,
      status_code: entry.statusCode ?? null,
    });
  } catch (dbError) {
    // No interrumpir el flujo — solo registrar en consola
    console.error('[OB-LOG] No se pudo guardar log en Supabase:', dbError);
  }
}

/** Shorthand para logs de nivel INFO */
export function logInfo(
  action: string,
  description: string,
  extra?: Omit<LogEntry, 'level' | 'action' | 'description'>
): Promise<void> {
  return writeLog({ level: 'info', ...extra, action, description,
    category: extra?.category ?? 'system' });
}

/** Shorthand para logs de nivel WARNING */
export function logWarning(
  action: string,
  description: string,
  extra?: Omit<LogEntry, 'level' | 'action' | 'description'>
): Promise<void> {
  return writeLog({ level: 'warning', ...extra, action, description,
    category: extra?.category ?? 'system' });
}

/** Shorthand para logs de nivel ERROR */
export function logError(
  action: string,
  description: string,
  extra?: Omit<LogEntry, 'level' | 'action' | 'description'>
): Promise<void> {
  return writeLog({ level: 'error', ...extra, action, description,
    category: extra?.category ?? 'system' });
}

/** Shorthand para logs de nivel CRITICAL */
export function logCritical(
  action: string,
  description: string,
  extra?: Omit<LogEntry, 'level' | 'action' | 'description'>
): Promise<void> {
  return writeLog({ level: 'critical', ...extra, action, description,
    category: extra?.category ?? 'system' });
}

// ─── Wrapper para Server Actions ──────────────────────────────────────────────

/**
 * Envuelve un Server Action con logging automático de inicio, éxito y error.
 * Registra quién ejecutó la acción, cuándo, cuánto tardó y qué pasó.
 *
 * @example
 * export const myAction = withActionLogging('myAction', 'data_mutation', async (formData) => {
 *   // lógica...
 * });
 */
export function withActionLogging<TArgs extends unknown[], TReturn>(
  actionName: string,
  category: LogCategory,
  fn: (...args: TArgs) => Promise<TReturn>,
  getUser?: () => Promise<Pick<CurrentSessionUser, 'id' | 'email' | 'role' | 'displayName'> | null>,
): (...args: TArgs) => Promise<TReturn> {
  return async (...args: TArgs): Promise<TReturn> => {
    const start = Date.now();
    const user = getUser ? await getUser().catch(() => null) : null;

    try {
      const result = await fn(...args);
      const durationMs = Date.now() - start;

      await logInfo(actionName, `Server action completada exitosamente`, {
        category,
        user,
        durationMs,
        route: `server_action:${actionName}`,
      });

      return result;
    } catch (error) {
      const durationMs = Date.now() - start;

      await logError(actionName, `Error en server action: ${extractErrorMessage(error)}`, {
        category,
        user,
        error,
        durationMs,
        route: `server_action:${actionName}`,
      });

      throw error;
    }
  };
}

// ─── Consultas (solo server-side) ────────────────────────────────────────────

/**
 * Obtiene logs del sistema con filtros opcionales.
 * Solo debe llamarse desde Server Components o Server Actions con rol admin.
 */
export async function getSystemLogs(filter: LogsFilter = {}): Promise<{
  logs: SystemLog[];
  total: number;
}> {
  const {
    level,
    category,
    userId,
    from,
    to,
    search,
    limit = 50,
    offset = 0,
  } = filter;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createAdminClient() as any;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from('system_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (level) query = query.eq('level', level);
  if (category) query = query.eq('category', category);
  if (userId) query = query.eq('user_id', userId);
  if (from) query = query.gte('created_at', from);
  if (to) query = query.lte('created_at', to);
  if (search) query = query.ilike('description', `%${search}%`);

  const { data, count, error } = await query.range(offset, offset + limit - 1);

  if (error) {
    console.error('[OB-LOG] Error al consultar system_logs:', error);
    return { logs: [], total: 0 };
  }

  return {
    logs: (data as SystemLog[]) ?? [],
    total: count ?? 0,
  };
}

/** Estadísticas rápidas para el dashboard de logs */
export async function getLogStats(): Promise<{
  totalToday: number;
  totalErrors: number;
  totalCritical: number;
  totalWarnings: number;
}> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createAdminClient() as any;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [todayRes, errorsRes, criticalRes, warningsRes] = await Promise.all([
      supabase.from('system_logs').select('id', { count: 'exact' }).gte('created_at', todayStart.toISOString()).limit(0),
      supabase.from('system_logs').select('id', { count: 'exact' }).eq('level', 'error').limit(0),
      supabase.from('system_logs').select('id', { count: 'exact' }).eq('level', 'critical').limit(0),
      supabase.from('system_logs').select('id', { count: 'exact' }).eq('level', 'warning').limit(0),
    ]);

    return {
      totalToday: todayRes.count ?? 0,
      totalErrors: errorsRes.count ?? 0,
      totalCritical: criticalRes.count ?? 0,
      totalWarnings: warningsRes.count ?? 0,
    };
  } catch {
    return { totalToday: 0, totalErrors: 0, totalCritical: 0, totalWarnings: 0 };
  }
}
