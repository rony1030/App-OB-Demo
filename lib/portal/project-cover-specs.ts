import type { PortalUnit, PortalProjectTypology } from '@/lib/portal-projects';
import { formatCurrency } from '@/lib/utils';
import { UVE_RESIDENCES_CANONICAL_UNITS } from '@/lib/data/uve-units';
import { UVE_RESIDENCES_TYPOLOGIES, CIPRES_RESIDENCES_TYPOLOGIES } from '@/lib/data/cipres-typologies';

import type { Json } from '@/types/database';

export interface CoverSpecs {
  bedroomsText?: string;
  bathroomsText?: string;
  areaText?: string;
  parkingText?: string;
  priceText?: string;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  maxBathrooms?: number;
  minArea?: number;
  maxArea?: number;
  minParking?: number;
  maxParking?: number;
  minPrice?: number;
  maxPrice?: number;
  [key: string]: Json | undefined;
}

export interface ProjectLike {
  slug?: string;
  name?: string;
  units?: PortalUnit[];
  typologies?: PortalProjectTypology[];
  startingPrice?: number;
  currency?: string;
}

export function computeProjectCoverSpecs(project: ProjectLike): CoverSpecs {
  const slug = (project.slug || '').toLowerCase();
  const name = (project.name || '').toLowerCase();
  const isUve = slug === 'uve-residences' || name.includes('uve');
  const isCipres = slug === 'cipres-residences' || name.includes('cipr');

  // 1. Resolve units (prefer Disponible, fallback to all)
  let rawUnits = project.units || [];
  if (rawUnits.length === 0 && isUve) {
    rawUnits = UVE_RESIDENCES_CANONICAL_UNITS;
  }

  const availableUnits = rawUnits.filter((u) => u.status === 'Disponible');
  const activeUnits = availableUnits.length > 0 ? availableUnits : rawUnits;

  // 2. Resolve typologies fallback
  let typologies: PortalProjectTypology[] = project.typologies || [];
  if (typologies.length === 0) {
    if (isUve) {
      typologies = Object.values(UVE_RESIDENCES_TYPOLOGIES).map((t) => ({
        id: t.id,
        key: t.key,
        name: t.name,
        bedrooms: t.bedrooms,
        bathrooms: t.bathrooms,
        totalSqm: t.constructionAreaSqm,
        startingPrice: t.startingPrice,
        parkingSpaces: t.parkingSpaces,
      }));
    } else if (isCipres) {
      typologies = Object.values(CIPRES_RESIDENCES_TYPOLOGIES).map((t) => ({
        id: t.id,
        key: t.key,
        name: t.name,
        bedrooms: t.bedrooms,
        bathrooms: t.bathrooms,
        totalSqm: t.constructionAreaSqm,
        startingPrice: t.startingPrice,
        parkingSpaces: t.parkingSpaces,
      }));
    }
  }

  const typoMap = new Map<string, PortalProjectTypology>();
  for (const t of typologies) {
    if (t.id) typoMap.set(t.id.toLowerCase(), t);
    if (t.key) typoMap.set(t.key.toLowerCase(), t);
    if (t.name) typoMap.set(t.name.toLowerCase(), t);
  }

  // 3. Bedrooms
  let bedNums = activeUnits
    .map((u) => {
      const n = Number(u.bedrooms);
      if (Number.isFinite(n) && n > 0) return n;
      const typo = u.typologyId ? typoMap.get(u.typologyId.toLowerCase()) : undefined;
      return typo?.bedrooms ? Number(typo.bedrooms) : 0;
    })
    .filter((n) => n > 0);

  if (bedNums.length === 0) {
    bedNums = typologies.map((t) => Number(t.bedrooms)).filter((n) => Number.isFinite(n) && n > 0);
  }

  let minBedrooms: number | undefined;
  let maxBedrooms: number | undefined;
  let bedroomsText: string | undefined;
  if (bedNums.length > 0) {
    minBedrooms = Math.min(...bedNums);
    maxBedrooms = Math.max(...bedNums);
    bedroomsText =
      minBedrooms === maxBedrooms
        ? `${minBedrooms} ${minBedrooms === 1 ? 'hab.' : 'habs.'}`
        : `${minBedrooms} – ${maxBedrooms} habs.`;
  }

  // 4. Bathrooms
  let bathNums = activeUnits
    .map((u) => {
      const n = Number(u.bathrooms);
      if (Number.isFinite(n) && n > 0) return n;
      const typo = u.typologyId ? typoMap.get(u.typologyId.toLowerCase()) : undefined;
      return typo?.bathrooms ? Number(typo.bathrooms) : 0;
    })
    .filter((n) => n > 0);

  if (bathNums.length === 0) {
    bathNums = typologies.map((t) => Number(t.bathrooms)).filter((n) => Number.isFinite(n) && n > 0);
  }

  let minBathrooms: number | undefined;
  let maxBathrooms: number | undefined;
  let bathroomsText: string | undefined;
  if (bathNums.length > 0) {
    minBathrooms = Math.min(...bathNums);
    maxBathrooms = Math.max(...bathNums);
    bathroomsText =
      minBathrooms === maxBathrooms
        ? `${minBathrooms} ${minBathrooms === 1 ? 'baño' : 'baños'}`
        : `${minBathrooms} – ${maxBathrooms} baños`;
  }

  // 5. Area
  let areaNums = activeUnits
    .map((u) => {
      const n = Number(u.area);
      if (Number.isFinite(n) && n > 0) return n;
      const typo = u.typologyId ? typoMap.get(u.typologyId.toLowerCase()) : undefined;
      return typo?.totalSqm ? Number(typo.totalSqm) : 0;
    })
    .filter((n) => n > 0);

  if (areaNums.length === 0) {
    areaNums = typologies.map((t) => Number(t.totalSqm)).filter((n) => Number.isFinite(n) && n > 0);
  }

  let minArea: number | undefined;
  let maxArea: number | undefined;
  let areaText: string | undefined;
  if (areaNums.length > 0) {
    minArea = Math.round(Math.min(...areaNums));
    maxArea = Math.round(Math.max(...areaNums));
    areaText =
      minArea === maxArea
        ? `${minArea} m²`
        : `${minArea} – ${maxArea} m²`;
  }

  // 6. Parking - CRITICAL: Never show if 0 or unavailable
  const unitParks = activeUnits
    .map((u) => {
      const cols = u.customColumns || {};
      for (const k of Object.keys(cols)) {
        if (/parq|estacion|parking/i.test(k)) {
          const p = parseInt(String(cols[k]).replace(/[^\d]/g, ''), 10);
          if (!isNaN(p)) return p;
        }
      }
      const typo = u.typologyId ? typoMap.get(u.typologyId.toLowerCase()) : undefined;
      if (typeof typo?.parkingSpaces === 'number') return typo.parkingSpaces;
      return null;
    })
    .filter((n): n is number => n !== null);

  const typoParks = typologies
    .map((t) => t.parkingSpaces)
    .filter((n): n is number => typeof n === 'number');

  const parks = (unitParks.length > 0 ? unitParks : typoParks).filter((n) => n > 0);
  let minParking: number | undefined;
  let maxParking: number | undefined;
  let parkingText: string | undefined;

  if (parks.length > 0) {
    const minP = Math.min(...parks);
    const maxP = Math.max(...parks);
    minParking = minP;
    maxParking = maxP;
    parkingText =
      minP === maxP
        ? `${minP} ${minP === 1 ? 'parq.' : 'parqs.'}`
        : `${minP} – ${maxP} parqs.`;
  }

  // 7. Price
  // Gather available unit prices and typology starting prices
  const unitPrices = activeUnits
    .map((u) => Number(u.price))
    .filter((n) => Number.isFinite(n) && n > 0);

  const typoPrices = typologies
    .map((t) => Number(t.startingPrice))
    .filter((n) => Number.isFinite(n) && n > 0);

  const projectPrice = project.startingPrice && project.startingPrice > 0 ? [project.startingPrice] : [];

  // If typologies have prices, combine with unit prices to ensure the true lowest price floor is reflected
  const priceNums = unitPrices.length > 0 && typoPrices.length > 0
    ? [...unitPrices, ...typoPrices]
    : unitPrices.length > 0
    ? unitPrices
    : typoPrices.length > 0
    ? typoPrices
    : projectPrice;

  let minPrice: number | undefined;
  let maxPrice: number | undefined;
  let priceText: string | undefined;
  const currency = project.currency || 'USD';

  if (priceNums.length > 0) {
    minPrice = Math.min(...priceNums);
    maxPrice = Math.max(...priceNums);
    priceText =
      minPrice === maxPrice
        ? formatCurrency(minPrice, currency)
        : `${formatCurrency(minPrice, currency)} – ${formatCurrency(maxPrice, currency)}`;
  }

  return {
    bedroomsText,
    bathroomsText,
    areaText,
    parkingText,
    priceText,
    minBedrooms,
    maxBedrooms,
    minBathrooms,
    maxBathrooms,
    minArea,
    maxArea,
    minParking,
    maxParking,
    minPrice,
    maxPrice,
  };
}
