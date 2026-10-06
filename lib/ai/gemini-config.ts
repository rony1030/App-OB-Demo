import 'server-only';

export type GeminiPoolEntry = {
  alias: string;
  key: string;
  model?: string;
};

function cleanEntry(value: unknown, index: number): GeminiPoolEntry | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const key = typeof record.key === 'string' ? record.key.trim() : '';
  if (!key) return null;
  return {
    alias: typeof record.alias === 'string' && record.alias.trim() ? record.alias.trim() : `Clave ${index + 1}`,
    key,
    model: typeof record.model === 'string' && record.model.trim() ? record.model.trim() : undefined,
  };
}

/**
 * Reads the structured GEMINI_POOL JSON first. A legacy GEMINI_API_KEY stays
 * available as the final fallback while environments are being migrated.
 */
export function getGeminiPool(): GeminiPoolEntry[] {
  const rawPool = process.env.GEMINI_POOL?.trim() || '';
  let pool: GeminiPoolEntry[] = [];
  if (rawPool) {
    try {
      const parsed = JSON.parse(rawPool);
      if (Array.isArray(parsed)) pool = parsed.map(cleanEntry).filter((entry): entry is GeminiPoolEntry => Boolean(entry));
    } catch {
      // Support a simple comma-separated fallback without ever logging keys.
      pool = rawPool.split(/[\s,;]+/).map((key, index) => key.trim() ? { alias: `Clave ${index + 1}`, key: key.trim() } : null).filter((entry): entry is GeminiPoolEntry => Boolean(entry));
    }
  }

  const legacyKey = process.env.GEMINI_API_KEY?.trim();
  if (legacyKey) pool.push({ alias: 'Clave principal', key: legacyKey });

  return pool.filter((entry, index, entries) => entries.findIndex((candidate) => candidate.key === entry.key) === index);
}
