import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { getPublicAssetUrl } from '@/lib/supabase/storage';
import type { PortalLot, PortalProject, PortalProjectDocument, PortalProjectTypology, PortalUnit, PortalUnitStatus } from '@/lib/portal-projects';
import { getCanaRockPreviewProjects, mergeCanaRockPreviewProjects } from '@/lib/data/cana-rock-preview';
import { getParideraPreviewProjects, getParideraPreviewProjectBySlug } from '@/lib/data/paridera-preview';
import { CIPRES_RESIDENCES_TYPOLOGIES, PROJECT_TYPOLOGIES_KIND } from '@/lib/data/cipres-typologies';
import { getProjectLandingConfig } from '@/lib/data/landing-config';
import { compareUnitCodes, normalizeUnitCode } from '@/lib/unit-code';

// project_documents requires the `authenticated` role (documents are
// permission-gated per broker agreement, not public) — anon has no GRANT on
// it at all, so embedding it here would hard-fail the public landing page
// with a Postgres permission error rather than just returning empty rows.
// PUBLIC_PROJECT_SELECT below is the anon-safe variant used by that page.
const PROJECT_SELECT = `
  id,
  slug,
  name,
  location,
  zone,
  lifecycle_status,
  project_type,
  delivery_date,
  description,
  short_description,
  starting_price,
  currency,
  commission_rate,
  inventory_total_declared,
  inventory_available_declared,
  inventory_updated_at,
  updated_at,
  developer:organizations!projects_developer_organization_id_fkey(name),
  brand_profile:brand_profiles(name, primary_color, accent_color, surface_color, logo_path),
  project_media(id, kind, storage_bucket, storage_path, alt_text, sort_order),
  project_highlights(content, sort_order),
  project_amenities(amenities(name)),
  payment_plans(id, is_active, payment_plan_steps(label, percentage, fixed_amount, sort_order)),
  typologies(id, name, bedrooms, bathrooms, total_sqm),
  units(id, typology_id, unit_code, tower, floor_level, list_price, currency, status, is_public, notes),
  lots(id, lot_code, block, area_sqm, list_price, currency, status, polygon, is_public),
  project_documents(id, title, category, status, visibility, updated_at, document_versions(id, version_number, storage_bucket, storage_path, mime_type, size_bytes, checksum_sha256, published_at))
`;

const PUBLIC_PROJECT_SELECT = `
  id,
  slug,
  name,
  location,
  zone,
  lifecycle_status,
  project_type,
  delivery_date,
  description,
  short_description,
  starting_price,
  currency,
  commission_rate,
  inventory_total_declared,
  inventory_available_declared,
  inventory_updated_at,
  updated_at,
  developer:organizations!projects_developer_organization_id_fkey(name),
  brand_profile:brand_profiles(name, primary_color, accent_color, surface_color, logo_path),
  project_media(id, kind, storage_bucket, storage_path, alt_text, sort_order),
  project_highlights(content, sort_order),
  project_amenities(amenities(name)),
  payment_plans(id, is_active, payment_plan_steps(label, percentage, fixed_amount, sort_order)),
  typologies(id, name, bedrooms, bathrooms, total_sqm),
  units(id, typology_id, unit_code, tower, floor_level, list_price, currency, status, is_public, notes),
  lots(id, lot_code, block, area_sqm, list_price, currency, status, polygon, is_public)
`;

// PostgREST derives this nested shape from a string relation query.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CatalogRow = Record<string, any>;

const lifecycleLabels: Record<string, string> = {
  pre_construction: 'Preventa',
  under_construction: 'En construcción',
  ready_to_deliver: 'Listo para entrega',
  delivered: 'Entregado',
  paused: 'Pausado',
};

const unitStatusLabels: Record<string, PortalUnitStatus> = {
  available: 'Disponible',
  separated: 'Separada',
  reserved: 'Separada',
  sold: 'Vendida',
  blocked: 'Bloqueada',
  withdrawn: 'Bloqueada',
};

const documentCategoryLabels: Record<string, PortalProjectDocument['category']> = {
  commercial: 'Comercial',
  legal: 'Legal',
  technical: 'Técnico',
  banking: 'Bancario',
};

function formatDelivery(value: string | null, lifecycleStatus?: string, slug?: string) {
  if (slug === 'cipres-residences') {
    return '12 y 24 meses';
  }
  if (!value) return lifecycleStatus === 'ready_to_deliver' ? 'Listo para entrega' : 'Por definir';
  return new Intl.DateTimeFormat('es-DO', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${value}T00:00:00Z`))
    .replace(/^./, (letter) => letter.toUpperCase());
}

function formatUpdated(value: string | null) {
  if (!value) return 'sin fecha';
  return new Intl.DateTimeFormat('es-DO', {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/Santo_Domingo',
  }).format(new Date(value));
}

function formatPlanStep(step: CatalogRow) {
  if (step.fixed_amount !== null && step.fixed_amount !== undefined) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(step.fixed_amount));
  }
  return `${Number(step.percentage ?? 0)}%`;
}

function normalizeTypologyName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function parseMoney(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value !== 'string') return 0;
  const normalized = value.replace(/[^\d.,-]/g, '').replace(/,/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseCustomColumns(notes: unknown): Record<string, string> {
  if (!notes || typeof notes !== 'string') return {};
  try {
    const parsed = JSON.parse(notes);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return Object.fromEntries(
        Object.entries(parsed).map(([key, value]) => [key, String(value ?? '')])
      );
    }
  } catch {
    // Notes may be plain text for older inventory rows.
  }
  return {};
}

import { isGarbageUnitCode } from '@/lib/data/uve-units';

function getAvailabilityColumnPrices(row: CatalogRow, projectTypologies?: PortalProjectTypology[]) {
  const typologyKeys = [
    ...(row.typologies ?? []).map((item: CatalogRow) => item.name),
    ...(projectTypologies ?? []).flatMap((t) => [t.name, t.key, t.id]).filter(Boolean),
  ];

  if (!typologyKeys.length) return [];

  return (row.units ?? [])
    .filter((unit: CatalogRow) => unit.is_public !== false && unit.status === 'available' && !isGarbageUnitCode(unit.unit_code))
    .flatMap((unit: CatalogRow) => {
      const customColumns = parseCustomColumns(unit.notes);
      return typologyKeys.map((key: string) => parseMoney(customColumns[key])).filter((price: number) => price > 0);
    });
}

const PALM_VIEW_DEFAULT_TYPOLOGIES: Record<string, {
  id: string;
  key: string;
  name: string;
  bedrooms: number;
  bathrooms: number;
  totalSqm: number;
  parkingSpaces: number;
  image?: string;
  floorPlanImage?: string;
}> = {
  modelo_1: { id: 'modelo-1', key: 'MODELO_1', name: 'Tipo A', bedrooms: 2, bathrooms: 2, totalSqm: 90.83, parkingSpaces: 1, image: '/cdn-storage/object/public/public-assets/bello-valdez-enterprise/projects/palm-view/typology-6b28d645-90d0-4b21-8791-725a9319e41f.png', floorPlanImage: '/cdn-storage/object/public/public-assets/bello-valdez-enterprise/projects/palm-view/typology-6b28d645-90d0-4b21-8791-725a9319e41f.png' },
  modelo_2: { id: 'modelo-2', key: 'MODELO_2', name: 'Tipo B', bedrooms: 3, bathrooms: 3, totalSqm: 112.18, parkingSpaces: 1, image: '/cdn-storage/object/public/public-assets/bello-valdez-enterprise/projects/palm-view/typology-35329b95-383b-4fbe-acd1-15c19aef7bc9.png', floorPlanImage: '/cdn-storage/object/public/public-assets/bello-valdez-enterprise/projects/palm-view/typology-35329b95-383b-4fbe-acd1-15c19aef7bc9.png' },
  modelo_3: { id: 'modelo-3', key: 'MODELO_3', name: 'Tipo C', bedrooms: 2, bathrooms: 2, totalSqm: 93.62, parkingSpaces: 1, image: '/cdn-storage/object/public/public-assets/bello-valdez-enterprise/projects/palm-view/typology-c4b1d1c4-7b43-4874-b584-1381bc957531.png', floorPlanImage: '/cdn-storage/object/public/public-assets/bello-valdez-enterprise/projects/palm-view/typology-c4b1d1c4-7b43-4874-b584-1381bc957531.png' },
  modelo_4: { id: 'modelo-4', key: 'MODELO_4', name: 'Tipo D', bedrooms: 2, bathrooms: 2, totalSqm: 86.39, parkingSpaces: 1, image: '/cdn-storage/object/public/public-assets/bello-valdez-enterprise/projects/palm-view/typology-90b2f46d-e30f-4619-aa2b-4962b01c0e60.png', floorPlanImage: '/cdn-storage/object/public/public-assets/bello-valdez-enterprise/projects/palm-view/typology-90b2f46d-e30f-4619-aa2b-4962b01c0e60.png' },
  modelo_5: { id: 'modelo-5', key: 'MODELO_5', name: 'Tipo E', bedrooms: 1, bathrooms: 2, totalSqm: 64.83, parkingSpaces: 1, image: '/cdn-storage/object/public/public-assets/bello-valdez-enterprise/projects/palm-view/typology-44192f2e-b58e-4498-a517-d25261bdf04c.png', floorPlanImage: '/cdn-storage/object/public/public-assets/bello-valdez-enterprise/projects/palm-view/typology-44192f2e-b58e-4498-a517-d25261bdf04c.png' },
  modelo_6: { id: 'modelo-6', key: 'MODELO_6', name: 'Tipo F - Torre 3', bedrooms: 2, bathrooms: 2, totalSqm: 71.32, parkingSpaces: 1, image: '/cdn-storage/object/public/public-assets/bello-valdez-enterprise/projects/palm-view/typology-1a283d01-a6d7-4b13-8a92-516160e4561f.png', floorPlanImage: '/cdn-storage/object/public/public-assets/bello-valdez-enterprise/projects/palm-view/typology-1a283d01-a6d7-4b13-8a92-516160e4561f.png' },
  modelo_7: { id: 'modelo-7', key: 'MODELO_7', name: 'Tipo F', bedrooms: 1, bathrooms: 1, totalSqm: 49.56, parkingSpaces: 1, image: '/cdn-storage/object/public/public-assets/bello-valdez-enterprise/projects/palm-view/typology-4aeff275-bc77-40aa-bb82-9aefd42fffa8.png', floorPlanImage: '/cdn-storage/object/public/public-assets/bello-valdez-enterprise/projects/palm-view/typology-4aeff275-bc77-40aa-bb82-9aefd42fffa8.png' },
  modelo_8: { id: 'modelo-8', key: 'MODELO_8', name: 'Tipo G', bedrooms: 1, bathrooms: 1, totalSqm: 49.56, parkingSpaces: 1, image: '/cdn-storage/object/public/public-assets/bello-valdez-enterprise/projects/palm-view/typology-98c8c9fb-a6ee-4b49-b64a-f78ca7be73fc.png', floorPlanImage: '/cdn-storage/object/public/public-assets/bello-valdez-enterprise/projects/palm-view/typology-98c8c9fb-a6ee-4b49-b64a-f78ca7be73fc.png' },
  modelo_9: { id: 'modelo-9', key: 'MODELO_9', name: 'Tipo H', bedrooms: 1, bathrooms: 1, totalSqm: 49.56, parkingSpaces: 1, image: '/cdn-storage/object/public/public-assets/bello-valdez-enterprise/projects/palm-view/typology-601ff67e-97c3-4d13-aa87-2891315467f9.png', floorPlanImage: '/cdn-storage/object/public/public-assets/bello-valdez-enterprise/projects/palm-view/typology-601ff67e-97c3-4d13-aa87-2891315467f9.png' },
  modelo_10: { id: 'modelo-10', key: 'MODELO_10', name: 'Tipo J 15', bedrooms: 2, bathrooms: 2, totalSqm: 77.95, parkingSpaces: 1, image: '/cdn-storage/object/public/public-assets/bello-valdez-enterprise/projects/palm-view/typology-a0cea72f-ccd3-4b2b-8c85-ecae30e3d895.png', floorPlanImage: '/cdn-storage/object/public/public-assets/bello-valdez-enterprise/projects/palm-view/typology-a0cea72f-ccd3-4b2b-8c85-ecae30e3d895.png' },
  modelo_11: { id: 'modelo-11', key: 'MODELO_11', name: 'Tipo J 16', bedrooms: 2, bathrooms: 2, totalSqm: 77.95, parkingSpaces: 1, image: '/cdn-storage/object/public/public-assets/bello-valdez-enterprise/projects/palm-view/typology-5c11e5dc-13ec-47bc-8822-817fe2ca2d35.png', floorPlanImage: '/cdn-storage/object/public/public-assets/bello-valdez-enterprise/projects/palm-view/typology-5c11e5dc-13ec-47bc-8822-817fe2ca2d35.png' },
  modelo_12: { id: 'modelo-12', key: 'MODELO_12', name: 'Tipo K', bedrooms: 2, bathrooms: 2, totalSqm: 79.83, parkingSpaces: 1, image: '/cdn-storage/object/public/public-assets/bello-valdez-enterprise/projects/palm-view/typology-2f6a3ba6-b227-4f91-aae0-378a31f591fb.png', floorPlanImage: '/cdn-storage/object/public/public-assets/bello-valdez-enterprise/projects/palm-view/typology-2f6a3ba6-b227-4f91-aae0-378a31f591fb.png' },
};

function mapProject(row: CatalogRow): PortalProject {
  const media = [...(row.project_media ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const hero = media.find((item) => item.kind === 'hero') ?? media[0];
  const typologyMedia = media.find((item) => item.kind === PROJECT_TYPOLOGIES_KIND);
  const typologyAssetUrls = new Set<string>();
  if (typologyMedia?.alt_text) {
    try {
      const dynamicTypologies = JSON.parse(typologyMedia.alt_text) as Record<string, CatalogRow>;
      Object.values(dynamicTypologies).forEach((typology) => {
        [typology?.image, typology?.floorPlanImage].forEach((asset) => {
          if (typeof asset === 'string' && asset.trim()) typologyAssetUrls.add(asset.trim());
        });
      });
    } catch {
      // Ignore malformed optional typology metadata and keep the rest of the gallery.
    }
  }
  const gallery = media
    .filter((item) => item.kind === 'gallery')
    .map((item) => getPublicAssetUrl(item.storage_path))
    .filter((url) => !url.toLowerCase().includes('/floorplan-') && !typologyAssetUrls.has(url));
  const heroUrl = hero ? getPublicAssetUrl(hero.storage_path) : '';
  const cleanHeroImage = heroUrl && !heroUrl.includes('plano') ? heroUrl : (gallery[0] || '');

  const googleSheetMedia = media.find((item) => item.kind === 'google_sheet');
  const digitalFolderMedia = media.find((item) => item.kind === 'digital_folder' || item.kind === 'drive_folder');
  const projectTypologies: PortalProjectTypology[] = (row.typologies ?? []).map((item: CatalogRow) => ({
    id: String(item.id),
    name: item.name ?? 'Tipología por definir',
    bedrooms: Number(item.bedrooms ?? 0),
    bathrooms: Number(item.bathrooms ?? 0),
    totalSqm: Number(item.total_sqm ?? 0),
    startingPrice: Number(item.starting_price || item.startingPrice || item.price || item.min_price || 0) || undefined,
    parkingSpaces: Number(item.parking_spaces || item.parkingSpaces || 1),
    image: item.image || item.image_url || item.floor_plan_image || item.floorPlanImage || undefined,
    floorPlanImage: item.floor_plan_image || item.floorPlanImage || item.image || item.image_url || undefined,
    description: item.description || undefined,
    features: Array.isArray(item.features) ? item.features : undefined,
  }));

  // Resolve dynamic typologies from project_media if available (take highest ID for latest revision)
  const typMedia = (row.project_media ?? [])
    .filter((m: CatalogRow) => m.kind === PROJECT_TYPOLOGIES_KIND)
    .sort((a: CatalogRow, b: CatalogRow) => Number(b.id || 0) - Number(a.id || 0))[0];

  let dynamicTypMap: Record<string, {
    id?: string;
    name?: string;
    bedrooms?: number;
    bathrooms?: number;
    constructionAreaSqm?: number;
    totalSqm?: number;
    parkingSpaces?: number;
    startingPrice?: number;
    image?: string;
    floorPlanImage?: string;
    description?: string;
    features?: string[];
  }> | null = null;
  if (typMedia?.alt_text) {
    try {
      dynamicTypMap = JSON.parse(typMedia.alt_text) as typeof dynamicTypMap;
    } catch {}
  }

  const hasOnlyDummyTypologies = projectTypologies.length === 0 || (projectTypologies.length === 1 && projectTypologies[0].name === 'Apartamento');

  if (dynamicTypMap && typeof dynamicTypMap === 'object' && Object.keys(dynamicTypMap).length > 0) {
    projectTypologies.length = 0;
    for (const [key, raw] of Object.entries(dynamicTypMap)) {
      if (!raw) continue;
      const item = raw as Record<string, unknown>;
      const img = item.image || item.floorPlanImage || undefined;
      const planImg = item.floorPlanImage || item.image || undefined;
      projectTypologies.push({
        id: String(item.id || key.toLowerCase()),
        key,
        name: item.name || key,
        bedrooms: Number(item.bedrooms ?? 0),
        bathrooms: Number(item.bathrooms ?? 0),
        totalSqm: Number(item.constructionAreaSqm || item.totalSqm || 0),
        parkingSpaces: Number(item.parkingSpaces || 1),
        startingPrice: Number(item.startingPrice || 0),
        image: img,
        floorPlanImage: planImg,
        description: item.description,
        features: item.features,
      } as PortalProjectTypology);
    }
  } else if (hasOnlyDummyTypologies) {
    if (row.slug === 'cipres-residences') {
      projectTypologies.length = 0;
      for (const [key, raw] of Object.entries(CIPRES_RESIDENCES_TYPOLOGIES)) {
        const item = raw;
        projectTypologies.push({
          id: String(item.id || key.toLowerCase()),
          key,
          name: item.name || key,
          bedrooms: Number(item.bedrooms ?? 0),
          bathrooms: Number(item.bathrooms ?? 0),
          totalSqm: Number(item.constructionAreaSqm || 0),
          parkingSpaces: Number(item.parkingSpaces || 1),
          startingPrice: Number(item.startingPrice || 0),
          image: item.image || item.floorPlanImage || undefined,
          floorPlanImage: item.floorPlanImage || item.image || undefined,
          description: item.description,
          features: item.features,
        } as PortalProjectTypology);
      }
    } else if (row.slug === 'palm-view') {
      projectTypologies.length = 0;
      for (const [key, item] of Object.entries(PALM_VIEW_DEFAULT_TYPOLOGIES)) {
        projectTypologies.push({
          id: item.id,
          key: item.key,
          name: item.name,
          bedrooms: item.bedrooms,
          bathrooms: item.bathrooms,
          totalSqm: item.totalSqm,
          parkingSpaces: item.parkingSpaces,
          startingPrice: 0,
          image: item.image || item.floorPlanImage,
          floorPlanImage: item.floorPlanImage || item.image,
        } as PortalProjectTypology);
      }
    }
  }

  const typologies = new Map((row.typologies ?? []).map((item: CatalogRow) => [String(item.id), item]));
  const activePlan = (row.payment_plans ?? []).find((plan: CatalogRow) => plan.is_active) ?? row.payment_plans?.[0];
  const rawUnits = (row.units ?? [])
    .filter((u: CatalogRow) => !isGarbageUnitCode(u.unit_code) && u.is_public !== false && u.status !== 'withdrawn')
    .sort((a: CatalogRow, b: CatalogRow) => compareUnitCodes(a.unit_code, b.unit_code));

  const availablePublicUnits = rawUnits.filter((unit: CatalogRow) => unit.is_public !== false && unit.status === 'available');
  const availablePublicLots = (row.lots ?? []).filter((lot: CatalogRow) => lot.is_public !== false && lot.status === 'available');
  // A lot can represent the land of the same unit. Count the project's primary
  // inventory type once instead of adding both records (Elements has 12 of each).
  const liveInventory = row.project_type === 'land_subdivision'
    ? (row.lots?.length ? availablePublicLots : availablePublicUnits)
    : (row.units?.length ? availablePublicUnits : availablePublicLots);
  const livePrices = liveInventory
    .map((item: CatalogRow | PortalUnit) => {
      if ('list_price' in item) {
        const custom = parseCustomColumns(item.notes);
        if (custom['Precio'] && custom['Precio'] !== '-') {
          const p = parseMoney(custom['Precio']);
          if (p > 0) return p;
        }
        if (custom['base_price'] || custom['Precio Base'] || custom['precio_base']) {
          const p = parseMoney(custom['base_price'] || custom['Precio Base'] || custom['precio_base']);
          if (p > 0) return p;
        }
        const lp = Number(item.list_price ?? 0);
        return lp;
      }
      return Number(item.price ?? 0);
    })
    .filter((price: number) => price > 0);
  const availabilityColumnPrices = getAvailabilityColumnPrices(row, projectTypologies);
  const effectiveLivePrices = availabilityColumnPrices.length > 0 ? availabilityColumnPrices : livePrices;
  const liveCurrencies = Array.from(
    new Set(
      liveInventory
        .filter((item: CatalogRow | PortalUnit) => Number(('list_price' in item ? item.list_price : item.price) ?? 0) > 0)
        .map((item: CatalogRow | PortalUnit) => ('currency' in item ? item.currency : row.currency) ?? row.currency ?? 'USD')
    )
  );

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    developer: row.developer?.name ?? 'Desarrollador por confirmar',
    brandProfile: row.brand_profile ? {
      name: row.brand_profile.name,
      primaryColor: row.brand_profile.primary_color,
      accentColor: row.brand_profile.accent_color,
      surfaceColor: row.brand_profile.surface_color,
      logoUrl: row.brand_profile.logo_path,
    } : undefined,
    location: row.location,
    zone: row.zone,
    status: lifecycleLabels[row.lifecycle_status] ?? row.lifecycle_status,
    delivery: formatDelivery(row.delivery_date, row.lifecycle_status, row.slug),
    deliveryDate: row.delivery_date ?? null,
    startingPrice: effectiveLivePrices.length && liveCurrencies.length <= 1 ? Math.min(...effectiveLivePrices) : Number(row.starting_price ?? 0),
    currency: liveCurrencies[0] ?? row.currency ?? 'USD',
    commission: Number(row.commission_rate ?? 0),
    totalUnits: row.inventory_total_declared ?? rawUnits.length,
    availableUnits: liveInventory.length,
    description: row.description,
    shortDescription: row.short_description,
    image: cleanHeroImage,
    gallery,
    highlights: [...(row.project_highlights ?? [])].sort((a, b) => a.sort_order - b.sort_order).map((item) => item.content),
    amenities: (row.project_amenities ?? []).map((item: CatalogRow) => item.amenities?.name).filter(Boolean).sort(),
    paymentPlan: [...(activePlan?.payment_plan_steps ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((step) => ({ label: step.label, value: formatPlanStep(step) })),
    documents: (row.project_documents ?? [])
      .filter((document: CatalogRow) => document.status !== 'archived')
      .map((document: CatalogRow) => {
      const latestVersion = [...(document.document_versions ?? [])].sort((a, b) => b.version_number - a.version_number)[0] ?? null;
      const extension = latestVersion?.storage_path?.split('.').pop()?.toUpperCase();
      return {
        id: String(document.id),
        documentVersionId: latestVersion?.id ?? null,
        name: document.title,
        category: documentCategoryLabels[document.category] ?? 'Comercial',
        format: extension || (document.title.toLowerCase().includes('precios') ? 'XLSX' : 'PDF'),
        version: latestVersion?.version_number ?? null,
        visibility: document.visibility ?? 'authorized',
        status: document.status ?? 'draft',
        checksum: latestVersion?.checksum_sha256 ?? null,
        updated: formatUpdated(latestVersion?.published_at ?? document.updated_at),
        storageBucket: latestVersion?.storage_bucket ?? null,
        storagePath: latestVersion?.storage_path ?? null,
      };
      }),
    typologies: projectTypologies,
    projectType: (row.project_type as PortalProject['projectType']) ?? 'building',
    lots: (row.lots ?? []).map((lot: CatalogRow): PortalLot => ({
      id: String(lot.id),
      code: lot.lot_code,
      block: lot.block ?? '',
      areaSqm: Number(lot.area_sqm ?? 0),
      price: Number(lot.list_price ?? 0),
      currency: lot.currency ?? row.currency ?? 'USD',
      status: unitStatusLabels[lot.status] ?? 'Bloqueada',
      isPublic: lot.is_public !== false,
      polygon: Array.isArray(lot.polygon) ? lot.polygon : [],
    })),
    units: rawUnits.map((unit: CatalogRow) => {
        const typology = unit.typology_id === null || unit.typology_id === undefined
          ? undefined
          : typologies.get(String(unit.typology_id)) as CatalogRow | undefined;
        const customColumns = parseCustomColumns(unit.notes);

        // Floor level from Nivel column or clean fallback
        let floor = unit.floor_level ?? 0;
        const rawNivelEntry = Object.entries(customColumns).find(([k]) => {
          const norm = normalizeTypologyName(k);
          return norm === 'nivel' || norm === 'piso' || norm === 'floor' || norm === 'level';
        });
        if (rawNivelEntry && rawNivelEntry[1]) {
          const parsedLvl = parseInt(String(rawNivelEntry[1]), 10);
          if (!isNaN(parsedLvl) && parsedLvl > 0) floor = parsedLvl;
        } else if (floor > 50) {
          floor = Math.floor(floor / 100);
        }

        // Bedrooms
        let bedrooms = Number(typology?.bedrooms ?? 0);
        if (customColumns['bedrooms'] !== undefined && customColumns['bedrooms'] !== null && customColumns['bedrooms'] !== '') {
          const b = parseInt(String(customColumns['bedrooms']), 10);
          if (!isNaN(b) && b > 0) bedrooms = b;
        } else {
          const rawHabEntry = Object.entries(customColumns).find(([k]) => {
            const norm = normalizeTypologyName(k);
            return (
              (norm === 'hab' || norm === 'habs' || norm.includes('habitacion') || norm.includes('dorm') || norm.includes('bed')) &&
              !norm.includes('habitable') &&
              !norm.includes('sqm') &&
              !norm.includes('m2') &&
              !norm.includes('metro') &&
              !norm.includes('area')
            );
          });
          if (rawHabEntry && rawHabEntry[1]) {
            const parsedHab = parseInt(String(rawHabEntry[1]), 10);
            if (!isNaN(parsedHab) && parsedHab > 0) bedrooms = parsedHab;
          }
        }

        // Bathrooms (keep decimal for half bathrooms like 2.5)
        let bathrooms = Number(typology?.bathrooms ?? 0);
        if (customColumns['bathrooms'] !== undefined && customColumns['bathrooms'] !== null && customColumns['bathrooms'] !== '') {
          const b = parseFloat(String(customColumns['bathrooms']));
          if (!isNaN(b) && b > 0) bathrooms = b;
        } else {
          const rawBanEntry = Object.entries(customColumns).find(([k]) => {
            const norm = normalizeTypologyName(k);
            return (norm.includes('ban') || norm.includes('bath')) && !norm.includes('sqm') && !norm.includes('m2');
          });
          if (rawBanEntry && rawBanEntry[1]) {
            let parsedBan = parseFloat(String(rawBanEntry[1]).replace(',', '.'));
            const rawHalfEntry = Object.entries(customColumns).find(([k]) => {
              const norm = normalizeTypologyName(k);
              return norm.includes('1/2') || norm.includes('medio');
            });
            if (rawHalfEntry && rawHalfEntry[1] && rawHalfEntry[1] !== '-' && parseFloat(String(rawHalfEntry[1]).replace(',', '.')) > 0) {
              parsedBan += parseFloat(String(rawHalfEntry[1]).replace(',', '.')) >= 1 ? 1 : 0.5;
            }
            if (!isNaN(parsedBan) && parsedBan > 0) bathrooms = parsedBan;
          }
        }

        // Area (sqm) - match any area/m2 column like 'Área (m²)', 'Area (M2)', 'Metraje'
        let area = Number(typology?.total_sqm ?? 0);
        if (customColumns['construction_sqm']) {
          const a = parseFloat(String(customColumns['construction_sqm']));
          if (!isNaN(a) && a > 0) area = a;
        } else if (customColumns['total_sqm']) {
          const a = parseFloat(String(customColumns['total_sqm']));
          if (!isNaN(a) && a > 0) area = a;
        } else {
          const rawAreaEntry = Object.entries(customColumns).find(([k]) => {
            const norm = normalizeTypologyName(k);
            return (
              (norm.includes('m2') || norm.includes('area') || norm.includes('metraje') || norm.includes('superficie')) &&
              !norm.includes('terreno') && !norm.includes('patio') && !norm.includes('extra') && !norm.includes('precio') && !norm.includes('lot')
            );
          });
          if (rawAreaEntry && rawAreaEntry[1]) {
            const parsedArea = parseFloat(String(rawAreaEntry[1]).replace(',', '.').replace(/[^\d.]/g, ''));
            if (!isNaN(parsedArea) && parsedArea > 0) area = Math.round(parsedArea * 100) / 100;
          }
        }

        // Tower
        let resolvedTower = unit.tower;
        if (!resolvedTower || resolvedTower === 'Sin torre') {
          const rawTowerEntry = Object.entries(customColumns).find(([k]) => {
            const norm = normalizeTypologyName(k);
            return norm.includes('torre') || norm.includes('tower') || norm.includes('bloque');
          });
          if (rawTowerEntry && rawTowerEntry[1] && rawTowerEntry[1].trim() && rawTowerEntry[1].trim() !== '-') {
            resolvedTower = rawTowerEntry[1].trim();
          }
        }

        // Typology name / Type
        let typeName = typology?.name ?? 'Apartamento';
        const isUveProject = row.slug === 'uve-residences' || (typeof row.name === 'string' && /uve\s*residence/i.test(row.name));
        if (isUveProject) {
          const isTypeB = (customColumns['SECCION'] || '').toUpperCase().includes('TYPE B') || area >= 110;
          if (floor === 3) {
            typeName = isTypeB ? 'Penthouse Tipo B' : 'Penthouse Tipo A';
          } else {
            typeName = isTypeB ? 'Apartamento Tipo B' : 'Apartamento Tipo A';
          }
        } else {
          const rawTypeEntry = Object.entries(customColumns).find(([k]) => {
            const norm = normalizeTypologyName(k);
            return norm === 'tipo' || norm === 'type' || norm === 'tipologia' || norm === 'seccion' || norm === 'modelo';
          });
          if (rawTypeEntry && rawTypeEntry[1] && rawTypeEntry[1].trim() && rawTypeEntry[1].trim() !== '-') {
            typeName = rawTypeEntry[1].trim();
          } else if (typeName === 'Villa Residencial' && (row.project_type === 'apartment' || row.project_type === 'building')) {
            typeName = 'Apartamento';
          }
        }

        // Clean notes (NEVER return raw JSON string)
        let friendlyNotes: string | null = null;
        if (unit.notes && typeof unit.notes === 'string') {
          if (unit.notes.trim().startsWith('{')) {
            const terreno = customColumns['m2 Terreno'] || customColumns['Terreno'] || customColumns['Patio'];
            const extra = customColumns['m2 Extra'] || customColumns['Terraza'] || customColumns['Rooftop'];
            const tNum = terreno && terreno !== '-' ? parseFloat(terreno) : 0;
            const eNum = extra && extra !== '-' ? parseFloat(extra) : 0;
            if (tNum > 0) {
              friendlyNotes = `Patio ${Math.round(tNum)} m²`;
            } else if (eNum > 0) {
              friendlyNotes = `Terraza Privada ${Math.round(eNum)} m²`;
            } else if (customColumns['SECCION'] && customColumns['SECCION'] !== '-' && !customColumns['SECCION'].toUpperCase().includes('TYPE')) {
              friendlyNotes = customColumns['SECCION'];
            }
          } else {
            friendlyNotes = unit.notes;
          }
        }

        // Clean price: If sheet has '-' or not available, price is 0 (renders as '—')
        let listPrice = Number(unit.list_price);
        if (customColumns['Precio']) {
          const pStr = customColumns['Precio'].trim();
          if (pStr === '-' || /^(n\/a|tbd|vendido)/i.test(pStr)) {
            listPrice = 0;
          } else {
            const parsedP = parseMoney(pStr);
            if (parsedP > 0) listPrice = parsedP;
          }
        } else if (customColumns['base_price'] || customColumns['Precio Base'] || customColumns['precio_base']) {
          const p = parseMoney(customColumns['base_price'] || customColumns['Precio Base'] || customColumns['precio_base']);
          if (p > 0) listPrice = p;
        } else if (!listPrice || listPrice <= 0 || isNaN(listPrice)) {
          // If unit has specific typology prices in customColumns (e.g. Ciprés: ESMERALDA, PERLA, AMBAR)
          const embeddedPrices = Object.entries(customColumns)
            .filter(([k]) => {
              const norm = normalizeTypologyName(k);
              return (
                !norm.includes('metro') &&
                !norm.includes('nivel') &&
                !norm.includes('deluxe') &&
                !norm.includes('royal') &&
                !norm.includes('paquete') &&
                !norm.includes('upgrade')
              );
            })
            .map(([, v]) => parseMoney(v))
            .filter((p) => p > 10000);
          if (embeddedPrices.length > 0) {
            listPrice = Math.min(...embeddedPrices);
          }
        }

        return {
          id: String(unit.id),
          typologyId: unit.typology_id === null || unit.typology_id === undefined ? null : String(unit.typology_id),
          unit: normalizeUnitCode(unit.unit_code),
          tower: resolvedTower ?? 'Sin torre',
          floor,
          type: typeName,
          bedrooms,
          bathrooms,
          area,
          price: listPrice,
          currency: unit.currency ?? row.currency ?? 'USD',
          status: unitStatusLabels[unit.status] ?? 'Bloqueada',
          isPublic: unit.is_public !== false,
          notes: friendlyNotes,
          customColumns,
        };
      }),
    googleSheetUrl: googleSheetMedia?.storage_path ?? null,
    digitalFolderUrl: digitalFolderMedia?.storage_path ?? null,
    customColumnsList: (() => {
      const set = new Set<string>();
      (row.units ?? []).forEach((u: CatalogRow) => {
        if (u.notes) {
          try {
            const parsed = JSON.parse(u.notes);
            if (parsed && typeof parsed === 'object') {
              Object.keys(parsed).forEach((k) => set.add(k));
            }
          } catch {}
        }
      });
      return Array.from(set);
    })(),
    updatedAt: formatUpdated(row.inventory_updated_at ?? row.updated_at),
  };
}

async function attachLandingTheme(project: PortalProject): Promise<PortalProject> {
  const landing = await getProjectLandingConfig(project.id, project);
  return {
    ...project,
    landingTheme: {
      primaryColor: landing.theme.primaryColor,
      accentColor: landing.theme.accentColor,
      fontPreset: landing.theme.fontPreset,
      logoUrl: landing.theme.logoUrl || project.brandProfile?.logoUrl || null,
      experiencePreset: landing.theme.experiencePreset,
    },
    landingAmenities: (landing.amenities || []).map((item) => item.title).filter(Boolean),
  };
}

export async function getPortalProjects(): Promise<PortalProject[]> {
  const previewProjects = await getCanaRockPreviewProjects();
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('projects')
      .select(PROJECT_SELECT)
      .eq('publication_status', 'published')
      .order('name');

    if (error || !data || data.length === 0) {
      console.warn('getPortalProjects: DB returned empty or error, using fallback catalog');
      return mergeCanaRockPreviewProjects(await getPublicProjects(), previewProjects);
    }
    const projects = await Promise.all((data as CatalogRow[]).map(mapProject).map(attachLandingTheme));
    return mergeCanaRockPreviewProjects(projects, previewProjects);
  } catch (err) {
    console.error('getPortalProjects exception:', err);
    return mergeCanaRockPreviewProjects(await getPublicProjects(), previewProjects);
  }
}

// For the public (anon) landing page only — see PUBLIC_PROJECT_SELECT note above.
export async function getPublicProjects(): Promise<PortalProject[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('projects')
      .select(PUBLIC_PROJECT_SELECT)
      .eq('publication_status', 'published')
      .order('name');

    const parideraPreviews = getParideraPreviewProjects();

    if (error || !data || data.length === 0) {
      return parideraPreviews;
    }
    const mapped = (data as CatalogRow[])
      .filter((row) => !/^demo\b/i.test(String(row.name || '')) && !/^demo-/i.test(String(row.slug || '')))
      .map(mapProject);

    // A successful query can still yield no public catalog after demo records
    // are removed. Use configured preview projects instead of rendering an
    // empty catalog; production previews remain opt-in in their source modules.
    if (mapped.length === 0) {
      return parideraPreviews;
    }

    // Merge paridera projects if not present in DB
    const existingSlugs = new Set(mapped.map((p) => p.slug));
    const missingParidera = parideraPreviews.filter((p) => !existingSlugs.has(p.slug));
    return [...mapped, ...missingParidera];
  } catch (err) {
    console.error('getPublicProjects exception:', err);
    return getParideraPreviewProjects();
  }
}

export async function getPublicProject(slug: string): Promise<PortalProject | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('projects')
      .select(PUBLIC_PROJECT_SELECT)
      .eq('slug', slug)
      .eq('publication_status', 'published')
      .maybeSingle();

    if (error || !data) {
      const preview = getParideraPreviewProjectBySlug(slug);
      if (preview) return preview;
      console.error('getPublicProject error:', error?.message);
      return null;
    }
    return attachLandingTheme(mapProject(data as CatalogRow));
  } catch (err) {
    const preview = getParideraPreviewProjectBySlug(slug);
    if (preview) return preview;
    console.error('getPublicProject exception:', err);
    return null;
  }
}

export async function getPortalProject(slug: string): Promise<PortalProject | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('projects')
      .select(PROJECT_SELECT)
      .eq('slug', slug)
      .maybeSingle();

    if (error || !data) {
      return getPublicProject(slug);
    }
    return mapProject(data as CatalogRow);
  } catch (err) {
    console.error('getPortalProject exception:', err);
    return getPublicProject(slug);
  }
}
