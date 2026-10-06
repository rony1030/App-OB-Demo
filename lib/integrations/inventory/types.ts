export type InventoryStatus =
  | 'available'
  | 'blocked'
  | 'separated'
  | 'reserved'
  | 'sold'
  | 'withdrawn'
  | 'unknown';

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface CanonicalInventoryUnit {
  externalId: string;
  unitCode: string;
  projectExternalId: string;
  typology: string | null;
  tower: string | null;
  floor: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  areaSqm: number | null;
  parkingSpaces: number | null;
  price: number | null;
  currency: 'USD' | 'DOP' | 'EUR';
  status: InventoryStatus;
  sourcePayload: JsonValue;
}

export interface InvalidInventoryUnit {
  index: number;
  reason: string;
  sourcePayload: JsonValue;
}

export interface InventorySnapshot {
  provider: string;
  projectExternalId: string;
  receivedAt: string;
  sourceUpdatedAt: string | null;
  payloadHash: string;
  units: CanonicalInventoryUnit[];
  invalidUnits: InvalidInventoryUnit[];
}

export interface FetchInventoryRequest {
  projectExternalId: string;
  signal?: AbortSignal;
}

export interface InventoryConnector {
  readonly provider: string;
  fetchSnapshot(request: FetchInventoryRequest): Promise<InventorySnapshot>;
}

export class InventoryConnectorError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'configuration_error'
      | 'authentication_error'
      | 'upstream_error'
      | 'invalid_payload'
      | 'timeout',
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'InventoryConnectorError';
  }
}

export type ReconciliationDiffKind =
  | 'new_unit'
  | 'price_changed'
  | 'status_changed'
  | 'specs_changed'
  | 'unchanged'
  | 'missing_from_source'
  | 'invalid';

export interface FieldDiff<T = unknown> {
  field: string;
  label: string;
  oldValue: T;
  newValue: T;
}

export interface UnitReconciliationDiff {
  unitCode: string;
  externalUnitId: string;
  canonicalUnitId: number | null;
  kind: ReconciliationDiffKind;
  differences: FieldDiff[];
  currentUnit?: {
    unitCode: string;
    status: string;
    listPrice: number;
    currency: string;
    floorLevel: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    totalSqm: number | null;
  } | null;
  incomingUnit?: CanonicalInventoryUnit | null;
  invalidReason?: string | null;
}

export interface ReconciliationSummary {
  receivedCount: number;
  newCount: number;
  updatedCount: number;
  unchangedCount: number;
  missingCount: number;
  invalidCount: number;
  isQuarantined: boolean;
  quarantineReason?: string;
  diffs: UnitReconciliationDiff[];
}

export interface ReconciliationRunResult {
  runId: number;
  projectId: number;
  connectionId: number;
  mode: 'shadow' | 'active';
  status: 'running' | 'succeeded' | 'partial' | 'failed' | 'quarantined';
  summary: ReconciliationSummary;
  sourcePayloadHash: string;
  startedAt: string;
  finishedAt: string;
  applied: boolean;
}
