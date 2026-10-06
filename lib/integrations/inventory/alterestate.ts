export type AlterEstateUnit = {
  order?: number;
  project_model?: string | null;
  name?: string | null;
  total_floors?: number | null;
  floor_level?: number | null;
  property_area?: number | null;
  terrace_area?: number | null;
  parkinglot_area?: number | null;
  terrain_area?: number | null;
  room?: number | null;
  bathroom?: number | null;
  half_bathrooms?: number | null;
  parkinglot?: number | null;
  status?: string | number | null;
  currency_sale?: string | null;
  sale_price?: number | null;
  building?: string | null;
  project_stage?: string | null;
  layout?: string | null;
};

export function alterEstateUnitsUrl(projectSlug: string) {
  return `https://secure.alterestate.com/api/v1/properties/public/units/${encodeURIComponent(projectSlug)}/`;
}

export function normalizeAlterEstateStatus(value: AlterEstateUnit['status']) {
  const status = String(value ?? '').toLowerCase();
  if (status === '1' || status.includes('avail')) return 'available' as const;
  if (status === '2' || status.includes('reserv')) return 'separated' as const;
  if (status === '3' || status.includes('sold') || status.includes('vend')) return 'sold' as const;
  return 'blocked' as const;
}

export function normalizeAlterEstateUnit(unit: AlterEstateUnit, index: number) {
  const code = String(unit.order ?? index + 1).trim();
  return {
    unitCode: code,
    typology: String(unit.project_model || 'UVE Residence').trim(),
    status: normalizeAlterEstateStatus(unit.status),
    price: Number(unit.sale_price || 0),
    currency: String(unit.currency_sale || 'USD').toUpperCase(),
    floor: unit.floor_level ?? 1,
    area: unit.property_area ?? null,
    bedrooms: unit.room ?? null,
    bathrooms: unit.bathroom ?? null,
    parkingSpaces: unit.parkinglot ?? null,
    notes: JSON.stringify({
      source: 'alterestate',
      building: unit.building ?? null,
      projectStage: unit.project_stage ?? null,
      terraceArea: unit.terrace_area ?? null,
      parkingArea: unit.parkinglot_area ?? null,
      terrainArea: unit.terrain_area ?? null,
      layout: unit.layout ?? null,
    }),
  };
}

export async function fetchAlterEstateUnits(projectSlug: string): Promise<AlterEstateUnit[]> {
  const response = await fetch(alterEstateUnitsUrl(projectSlug), {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`AlterEstate respondió ${response.status}.`);
  const payload: unknown = await response.json();
  if (!Array.isArray(payload)) throw new Error('AlterEstate no devolvió una lista de unidades.');
  return payload as AlterEstateUnit[];
}
