import type {
  CanonicalInventoryUnit,
  InvalidInventoryUnit,
  InventoryStatus,
  JsonValue,
} from './types';

type UnknownRecord = Record<string, unknown>;

const statusMap: Record<string, InventoryStatus> = {
  available: 'available',
  disponible: 'available',
  blocked: 'blocked',
  bloqueada: 'blocked',
  bloqueado: 'blocked',
  separated: 'separated',
  separada: 'separated',
  separado: 'separated',
  reserved: 'reserved',
  reservada: 'reserved',
  reservado: 'reserved',
  sold: 'sold',
  vendida: 'sold',
  vendido: 'sold',
  withdrawn: 'withdrawn',
  retirada: 'withdrawn',
  retirado: 'withdrawn',
};

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

function numericValue(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;

  const normalized = value.replace(/[^0-9,.-]/g, '').replace(/,/g, '');
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function firstPresent(record: UnknownRecord, keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== null && record[key] !== undefined && record[key] !== '') {
      return record[key];
    }
  }
  return null;
}

function cleanUnitCode(value: string): string {
  return value
    .replace(/^(Cosmos|Stelar|Galaxy|Star|Universe|Terra)\s+/i, '')
    .trim();
}

function normalizeStatus(value: unknown): InventoryStatus {
  const status = stringValue(value)?.toLowerCase();
  return status ? statusMap[status] ?? 'unknown' : 'available';
}

function normalizeCurrency(value: unknown): 'USD' | 'DOP' | 'EUR' {
  const currency = stringValue(value)?.toUpperCase().replace('$', '');
  if (currency === 'DOP' || currency === 'RD') return 'DOP';
  if (currency === 'EUR') return 'EUR';
  return 'USD';
}

function toJsonValue(value: unknown): JsonValue {
  const serialized = JSON.stringify(value);
  return serialized === undefined ? null : (JSON.parse(serialized) as JsonValue);
}

export function normalizeCanaRockUnits(
  rawUnits: unknown[],
  projectExternalId: string,
): { units: CanonicalInventoryUnit[]; invalidUnits: InvalidInventoryUnit[] } {
  const units: CanonicalInventoryUnit[] = [];
  const invalidUnits: InvalidInventoryUnit[] = [];
  const seenExternalIds = new Set<string>();

  rawUnits.forEach((rawUnit, index) => {
    const sourcePayload = toJsonValue(rawUnit);
    if (!isRecord(rawUnit)) {
      invalidUnits.push({ index, reason: 'La unidad no es un objeto.', sourcePayload });
      return;
    }

    const rawCode = stringValue(
      firstPresent(rawUnit, [
        'unit',
        'unit_number',
        'unit_code',
        'unitCode',
        'code',
        'codigo',
        'unidad',
        'sku',
        'number',
      ]),
    );
    const unitCode = rawCode ? cleanUnitCode(rawCode) : '';
    const externalId =
      stringValue(firstPresent(rawUnit, ['sku', 'id', 'external_id', 'externalId'])) ?? unitCode;

    if (!unitCode || !externalId) {
      invalidUnits.push({
        index,
        reason: 'Falta un identificador estable o número de unidad.',
        sourcePayload,
      });
      return;
    }
    if (seenExternalIds.has(externalId)) {
      invalidUnits.push({ index, reason: `Identificador duplicado: ${externalId}`, sourcePayload });
      return;
    }

    const price = numericValue(
      firstPresent(rawUnit, ['price', 'list_price', 'listPrice', 'amount', 'precio']),
    );
    const areaSqm = numericValue(
      firstPresent(rawUnit, ['areaM2', 'area_net', 'area', 'total_sqm', 'areaSqm', 'metros_cuadrados', 'metraje']),
    );
    if ((price !== null && price < 0) || (areaSqm !== null && areaSqm < 0)) {
      invalidUnits.push({
        index,
        reason: 'Precio o área no puede ser negativo.',
        sourcePayload,
      });
      return;
    }

    seenExternalIds.add(externalId);
    units.push({
      externalId,
      unitCode,
      projectExternalId,
      typology: stringValue(firstPresent(rawUnit, ['appType', 'typology', 'type', 'tipologia'])),
      tower: stringValue(firstPresent(rawUnit, ['block', 'tower', 'section_name', 'bloque', 'torre'])),
      floor: numericValue(firstPresent(rawUnit, ['floor', 'level', 'piso', 'nivel'])),
      bedrooms: numericValue(firstPresent(rawUnit, ['beds', 'bedrooms', 'habitaciones', 'dormitorios'])),
      bathrooms: numericValue(firstPresent(rawUnit, ['baths', 'bathrooms', 'banos', 'baños'])),
      areaSqm,
      parkingSpaces: numericValue(
        firstPresent(rawUnit, [
          'parking',
          'parking_spaces',
          'parkingSpaces',
          'parking_count',
          'parkings',
          'parqueos',
          'parqueo',
          'estacionamientos',
        ]),
      ),
      price,
      currency: normalizeCurrency(firstPresent(rawUnit, ['currency', 'currency_code', 'moneda'])),
      status: normalizeStatus(firstPresent(rawUnit, ['status', 'availability_status', 'estado', 'disponibilidad'])),
      sourcePayload,
    });
  });

  return { units, invalidUnits };
}
