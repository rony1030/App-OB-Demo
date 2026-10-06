import 'server-only';

import { createHash } from 'node:crypto';

import { normalizeCanaRockUnits } from './normalize-cana-rock';
import {
  InventoryConnectorError,
  type FetchInventoryRequest,
  type InventoryConnector,
  type InventorySnapshot,
} from './types';

interface CanaRockConnectorConfig {
  baseUrl: string;
  apiKey: string;
  timeoutMs?: number;
  fetchImplementation?: typeof fetch;
}

interface CanaRockPayload {
  units: unknown[];
  updatedAt: string | null;
}

function parsePayload(payload: unknown): CanaRockPayload {
  if (typeof payload !== 'object' || payload === null) {
    throw new InventoryConnectorError(
      'Cana Rock devolvió una respuesta que no es un objeto.',
      'invalid_payload',
      false,
    );
  }

  const record = payload as Record<string, unknown>;
  if (!Array.isArray(record.units)) {
    throw new InventoryConnectorError(
      'Cana Rock no incluyó una colección de unidades.',
      'invalid_payload',
      false,
    );
  }

  return {
    units: record.units,
    updatedAt:
      typeof record.updated_at === 'string'
        ? record.updated_at
        : typeof record.updatedAt === 'string'
          ? record.updatedAt
          : null,
  };
}

export class CanaRockInventoryConnector implements InventoryConnector {
  readonly provider = 'cana_rock_portal';
  private readonly fetchImplementation: typeof fetch;
  private readonly timeoutMs: number;

  constructor(private readonly config: CanaRockConnectorConfig) {
    if (!config.baseUrl || !config.apiKey) {
      throw new InventoryConnectorError(
        'El conector Cana Rock requiere URL y credencial de servidor.',
        'configuration_error',
        false,
      );
    }
    this.fetchImplementation = config.fetchImplementation ?? fetch;
    this.timeoutMs = config.timeoutMs ?? 10_000;
  }

  async fetchSnapshot(request: FetchInventoryRequest): Promise<InventorySnapshot> {
    const url = new URL('/api/public/availability', this.config.baseUrl);
    url.searchParams.set('key', this.config.apiKey);
    url.searchParams.set('project', request.projectExternalId);

    const timeoutSignal = AbortSignal.timeout(this.timeoutMs);
    const signal = request.signal
      ? AbortSignal.any([request.signal, timeoutSignal])
      : timeoutSignal;

    let response: Response;
    try {
      response = await this.fetchImplementation(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'App-OB-Brokers-Inventory/1.0',
        },
        cache: 'no-store',
        signal,
      });
    } catch {
      const timedOut = timeoutSignal.aborted;
      throw new InventoryConnectorError(
        timedOut
          ? 'La fuente de inventario excedió el tiempo límite.'
          : 'No se pudo contactar la fuente de inventario.',
        timedOut ? 'timeout' : 'upstream_error',
        true,
      );
    }

    if (response.status === 401 || response.status === 403) {
      throw new InventoryConnectorError(
        'La fuente rechazó la credencial del conector.',
        'authentication_error',
        false,
      );
    }
    if (!response.ok) {
      throw new InventoryConnectorError(
        `La fuente de inventario respondió con estado ${response.status}.`,
        'upstream_error',
        response.status >= 500 || response.status === 429,
      );
    }

    let rawPayload: unknown;
    try {
      rawPayload = await response.json();
    } catch {
      throw new InventoryConnectorError(
        'La fuente de inventario no devolvió JSON válido.',
        'invalid_payload',
        false,
      );
    }

    const payload = parsePayload(rawPayload);
    const normalized = normalizeCanaRockUnits(payload.units, request.projectExternalId);
    const serializedPayload = JSON.stringify(rawPayload);

    return {
      provider: this.provider,
      projectExternalId: request.projectExternalId,
      receivedAt: new Date().toISOString(),
      sourceUpdatedAt: payload.updatedAt,
      payloadHash: createHash('sha256').update(serializedPayload).digest('hex'),
      units: normalized.units,
      invalidUnits: normalized.invalidUnits,
    };
  }
}

export function createCanaRockInventoryConnectorFromEnv(): CanaRockInventoryConnector {
  return new CanaRockInventoryConnector({
    baseUrl: process.env.CANA_ROCK_AVAILABILITY_URL ?? '',
    apiKey: process.env.CANA_ROCK_AVAILABILITY_API_KEY ?? '',
  });
}
