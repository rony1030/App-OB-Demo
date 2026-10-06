'use client';
import { LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useMemo, useState, type KeyboardEvent } from 'react';
import Link from 'next/link';
import Image from '@/components/ui/OptimizedImage';
import { useRouter } from 'next/navigation';
import { ArrowRight, Building2 } from 'lucide-react';
import { cn, formatCurrencyExplicit } from '@/lib/utils';
import type { PortalProject, PortalProjectTypology } from '@/lib/portal-projects';
import Reveal from '@/components/landing/Reveal';
import { PropertySpecIcon, type PropertySpecIconName } from '@/components/branding/PropertySpecIcon';
import { useLocale } from '@/components/i18n/LocaleProvider';

const ZONE_NAMES: Record<string, string> = {
  all: 'Todas las Zonas',
  'punta cana': 'Punta Cana',
  'cap cana': 'Cap Cana',
  bavaro: 'Bávaro',
  'bávaro': 'Bávaro',
  'las terrenas': 'Las Terrenas',
  'santo domingo': 'Santo Domingo',
  'la romana': 'La Romana',
};

const PROJECT_COVER_OVERRIDES: Record<string, string> = {
  'uve-residences': '/projects/uve-residences/exterior-cover.jpg',
  'sunrise-bonita-beach': '/paridera/hub/sunrise-hero.jpg',
  'sunset-bonita-beach': '/paridera/hub/sunset-cover.jpg',
  'beach-bonita-beach': '/paridera/hub/beach-cover.jpg',
  'villas-bonita-beach': '/paridera/hub/villas-cover.jpg',
  'bonita-golf': '/paridera/hub/golf-cover.jpg',
};

const CANA_ROCK_PORTFOLIO_URL = '/desarrolladores/cana-rock';
const PARIDERA_PORTFOLIO_URL = '/desarrolladores/paridera';
const PORTFOLIO_BUTTON_CLASS =
  'group/btn inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#0a1140] px-5 text-xs font-black text-white shadow-md transition-all duration-300 hover:bg-blue-700 hover:text-white active:scale-[0.98]';
const PORTFOLIO_BUTTON_ICON_CLASS =
  'h-4 w-4 text-white transition-transform group-hover/btn:translate-x-1';
const PARIDERA_PORTFOLIO_BUTTON_CLASS =
  'group/btn inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#0A2A3B] px-5 text-xs font-black text-white shadow-md transition-all duration-300 hover:bg-[#12384e] hover:text-white active:scale-[0.98] border border-white/20';
const PARIDERA_PORTFOLIO_BUTTON_ICON_CLASS =
  'h-4 w-4 text-white transition-transform group-hover/btn:translate-x-1';

function handleCardKeyDown(event: KeyboardEvent<HTMLElement>, href: string) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  window.location.href = href;
}

function formatRange(values: number[], suffix = '') {
  const cleanValues = Array.from(new Set(values.filter((value) => Number.isFinite(value) && value > 0)))
    .sort((left, right) => left - right);
  if (cleanValues.length === 0) return '—';

  const isArea = suffix.includes('m²');
  const format = (value: number) => new Intl.NumberFormat('es-DO', {
    maximumFractionDigits: isArea ? 0 : 1,
  }).format(isArea ? Math.round(value) : value);
  const minFormatted = format(cleanValues[0]);
  const maxFormatted = format(cleanValues[cleanValues.length - 1]);
  const range = minFormatted === maxFormatted ? minFormatted : `${minFormatted}–${maxFormatted}`;
  return `${range}${suffix}`;
}

function getParkingSpaces(customColumns?: Record<string, string>, projectSlug?: string) {
  if (customColumns) {
    const entry = Object.entries(customColumns).find(([key]) => {
      const normalized = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('es');
      return (
        normalized.includes('parque') ||
        normalized.includes('parking') ||
        normalized.includes('estac') ||
        normalized.includes('coch') ||
        normalized.includes('garage') ||
        normalized.includes('auto')
      );
    });
    if (entry) {
      const parsed = Number(String(entry[1]).replace(',', '.').match(/[0-9.]+/)?.[0]);
      if (Number.isFinite(parsed) && parsed > 0) return parsed;
    }
  }
  if (projectSlug === 'palm-view') return 1;
  return 0;
}

function parseMoney(value: string | undefined) {
  if (!value) return 0;
  const normalized = value.replace(/[^0-9.,]/g, '').replace(/,/g, '');
  return Number(normalized) || 0;
}

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('es');
}

function cleanLocationLabel(value?: string) {
  return (value || '')
    .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function getDeveloperInfo(project: PortalProject): { key: string; name: string; slug: string } {
  const raw = (project.developer || '').trim();
  const lower = raw.toLowerCase();
  const pSlug = project.slug.toLowerCase();

  if (lower.includes('cana rock') || pSlug.startsWith('cana-rock')) {
    return { key: 'cana-rock', name: 'Grupo Cana Rock', slug: 'cana-rock' };
  }
  if (lower.includes('paridera') || pSlug.endsWith('-bonita-beach') || pSlug === 'bonita-golf') {
    return { key: 'paridera', name: 'Paridera Investors SRL', slug: 'paridera' };
  }
  if (lower.includes('kyser') || pSlug.includes('cipres')) {
    return { key: 'kyser', name: 'Kyser Inmobiliaria & Desarrollos', slug: 'kyser' };
  }
  if (lower.includes('uve') || pSlug.includes('uve')) {
    return { key: 'uve', name: 'UVE Residences Group', slug: 'uve' };
  }
  if (lower.includes('coral') || lower.includes('palm view') || pSlug.includes('palm-view')) {
    return { key: 'coral-golf', name: 'Coral Golf & Hospitality Developments', slug: 'coral-golf' };
  }
  if (lower.includes('elements') || pSlug.includes('elements')) {
    return { key: 'elements', name: 'Elements Developer', slug: 'elements' };
  }

  const cleanName = raw && raw.toLowerCase() !== 'desarrollador por confirmar' ? raw : 'Desarrolladora Oficial';
  const cleanSlug = cleanName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'desarrollador';

  return { key: cleanSlug, name: cleanName, slug: cleanSlug };
}

function getCatalogTypologies(project: PortalProject): PortalProjectTypology[] {
  return [...(project.typologies || [])];
}

function findUnitTypology(
  unit: PortalProject['units'][number],
  typologies: PortalProjectTypology[]
) {
  const hasUsefulSpecs = (typology: PortalProjectTypology) =>
    typology.bedrooms > 0 || typology.bathrooms > 0 || typology.totalSqm > 0 || (typology.parkingSpaces || 0) > 0;

  if (unit.typologyId) {
    const byId = typologies.find((typology) => typology.id === unit.typologyId || typology.key === unit.typologyId);
    if (byId && hasUsefulSpecs(byId)) return byId;
  }

  const byPrice = findUnitTypologyByPrice(unit, typologies);
  if (byPrice) return byPrice;

  const normalizedType = normalizeText(unit.type);
  return typologies.find((typology) => {
    const normalizedName = normalizeText(typology.name);
    const normalizedKey = typology.key ? normalizeText(typology.key) : '';
    return normalizedType.includes(normalizedName) || normalizedName.includes(normalizedType) || (normalizedKey && normalizedType.includes(normalizedKey));
  });
}

function findUnitTypologyByPrice(
  unit: PortalProject['units'][number],
  typologies: PortalProjectTypology[]
) {
  const matchingPriceColumn = Object.entries(unit.customColumns || {}).find(([key, value]) => {
    if (normalizeText(key).includes('metro')) return false;
    const columnPrice = parseMoney(value);
    return columnPrice > 0 && unit.price > 0 && Math.abs(columnPrice - unit.price) < 1;
  });

  if (!matchingPriceColumn) return undefined;

  const normalizedColumn = normalizeText(matchingPriceColumn[0]);
  return typologies.find((typology) => {
    const normalizedName = normalizeText(typology.name);
    const normalizedKey = typology.key ? normalizeText(typology.key) : '';
    return normalizedColumn.includes(normalizedName) || normalizedName.includes(normalizedColumn) || normalizedKey === normalizedColumn;
  });
}

function getLiveProjectSummary(project: PortalProject) {
  const units = (project.units || []).filter((unit) => unit.isPublic !== false && unit.status === 'Disponible');
  const lots = (project.lots || []).filter((lot) => lot.isPublic !== false && lot.status === 'Disponible');
  const typologies = getCatalogTypologies(project);

  const unitDetails = units.map((unit) => {
    const typology = findUnitTypology(unit, typologies);
    const priceTypology = findUnitTypologyByPrice(unit, typologies);
    return {
      bedrooms: unit.bedrooms || typology?.bedrooms || 0,
      bathrooms: unit.bathrooms || typology?.bathrooms || 0,
      area: unit.area || typology?.totalSqm || 0,
      parkingSpaces: getParkingSpaces(unit.customColumns, project.slug) || typology?.parkingSpaces || priceTypology?.parkingSpaces || (project.slug === 'palm-view' ? 1 : 0),
    };
  });

  // Extract any embedded prices from customColumns (e.g. Ciprés lot units with ESMERALDA, PERLA, AMBAR columns)
  const customColumnPrices = units.flatMap((unit) => {
    if (!unit.customColumns) return [];
    return Object.entries(unit.customColumns)
      .filter(([k]) => {
        const norm = normalizeText(k);
        return (
          !norm.includes('metro') &&
          !norm.includes('nivel') &&
          !norm.includes('area') &&
          !norm.includes('deluxe') &&
          !norm.includes('royal') &&
          !norm.includes('paquete') &&
          !norm.includes('upgrade')
        );
      })
      .map(([, v]) => parseMoney(v))
      .filter((p) => p > 10000);
  });

  const prices = [
    ...units.map((unit) => ({ price: unit.price, currency: unit.currency || project.currency || 'USD' })),
    ...lots.map((lot) => ({ price: lot.price, currency: lot.currency || project.currency || 'USD' })),
    ...customColumnPrices.map((p) => ({ price: p, currency: project.currency || 'USD' })),
  ].filter((item) => item.price > 0);

  const fallbackPrices = [
    ...typologies.map((typology) => (typology).startingPrice || 0),
    project.startingPrice || 0,
  ].filter((price) => price > 0);
  const currencies = Array.from(new Set(prices.map((item) => item.currency)));
  const lowestPrice = currencies.length === 1 ? Math.min(...prices.map((item) => item.price)) : null;
  const priceLabel = prices.length > 0
    ? currencies.length > 1
      ? 'Consultar moneda'
      : formatCurrencyExplicit(lowestPrice || 0, currencies[0])
    : fallbackPrices.length > 0
      ? formatCurrencyExplicit(Math.min(...fallbackPrices), project.currency || 'USD')
      : project.availableUnits > 0
        ? 'Consultar precio'
        : 'Sin unidades disponibles';
  const hasAvailability = units.length > 0 || lots.length > 0 || project.availableUnits > 0;

  // Check if units actually have specific bedrooms/bathrooms/areas declared
  const hasUsefulUnitSpecs = unitDetails.some((u) => u.bedrooms > 0 || u.bathrooms > 0 || u.area > 0);
  const allTypologySpecs = typologies.filter((t) => t.bedrooms > 0 || t.bathrooms > 0 || t.totalSqm > 0);
  const useTypologiesRange =
    allTypologySpecs.length > 1 &&
    (project.slug === 'cipres-residences' || !hasUsefulUnitSpecs || new Set(unitDetails.map((u) => u.area)).size <= 1);

  const specSource = useTypologiesRange
    ? allTypologySpecs.map((t) => ({
        bedrooms: t.bedrooms,
        bathrooms: t.bathrooms,
        area: t.totalSqm,
        parkingSpaces: (t).parkingSpaces || 0,
      }))
    : hasUsefulUnitSpecs
      ? unitDetails
      : allTypologySpecs.length > 0
        ? allTypologySpecs.map((t) => ({
            bedrooms: t.bedrooms,
            bathrooms: t.bathrooms,
            area: t.totalSqm,
            parkingSpaces: (t).parkingSpaces || 0,
          }))
        : unitDetails;

  return {
    priceLabel,
    hasAvailability,
    specs: [
      { label: 'Habitaciones', value: formatRange(specSource.map((item) => item.bedrooms)), icon: 'bedrooms' as PropertySpecIconName },
      { label: 'Baños', value: formatRange(specSource.map((item) => item.bathrooms)), icon: 'bathrooms' as PropertySpecIconName },
      { label: 'Metraje Const.', value: formatRange(specSource.map((item) => item.area), ' m²'), icon: 'area' as PropertySpecIconName },
      { label: 'Parqueos', value: formatRange(specSource.map((item) => item.parkingSpaces || 0)), icon: 'parking' as PropertySpecIconName },
    ],
  };
}

export default function ProjectCatalog({
  projects,
}: {
  projects: PortalProject[];
  onRequestDossier?: (projectName: string) => void;
}) {
  const router = useRouter();
  const { locale, t, autoTranslate } = useLocale();
  const [activeZone, setActiveZone] = useState('all');
  const [viewMode, setViewMode] = useState<'developer' | 'all'>('developer');

  const getZoneLabel = (z: string) => {
    if (z === 'all') {
      return locale === 'en' ? 'All Zones' : locale === 'fr' ? 'Toutes les Zones' : 'Todas las Zonas';
    }
    return ZONE_NAMES[z.toLowerCase()] || z;
  };

  const zones = useMemo(() => {
    const list = Array.from(new Set(projects.map((p) => p.zone || 'Punta Cana').filter(Boolean)));
    return ['all', ...list];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    if (activeZone === 'all') return projects;
    return projects.filter((p) => (p.zone || 'Punta Cana').toLowerCase() === activeZone.toLowerCase());
  }, [projects, activeZone]);

  const developerProjectCounts = useMemo(() => {
    const counts = new Map<string, number>();
    projects.forEach((project) => {
      const key = normalizeText(project.developer || 'Desarrollador por confirmar');
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  }, [projects]);

  const developerGroups = useMemo(() => {
    const map = new Map<string, { key: string; name: string; slug: string; projects: PortalProject[] }>();
    filteredProjects.forEach((p) => {
      const dev = getDeveloperInfo(p);
      if (!map.has(dev.key)) {
        map.set(dev.key, { ...dev, projects: [] });
      }
      map.get(dev.key)!.projects.push(p);
    });
    return Array.from(map.values());
  }, [filteredProjects]);

  // Multi-project developers (> 1 project in current filter) consolidate into a developer card
  const multiProjectDevelopers = useMemo(() => {
    return developerGroups.filter((g) => g.projects.length > 1);
  }, [developerGroups]);

  // Standalone developers (exactly 1 project in current filter) render as individual project cards
  const singleProjectItems = useMemo(() => {
    return developerGroups
      .filter((g) => g.projects.length === 1)
      .flatMap((g) => g.projects);
  }, [developerGroups]);

  // Helper to compute combined stats for any multi-project developer
  const getDeveloperCombinedSummary = (dev: { key: string; name: string; slug: string; projects: PortalProject[] }) => {
    const devProjects = dev.projects;
    const allUnits = devProjects.flatMap((p) =>
      (p.units || []).filter((u) => u.isPublic !== false && (u.status === 'Disponible' || (u.status as string) === 'available'))
    );
    const allPrices = [
      ...allUnits.map((u) => u.price).filter((price) => price > 0),
      ...devProjects.map((p) => p.startingPrice).filter((price) => price > 0),
    ];
    const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;

    const deliveries = devProjects
      .map((p) => p.delivery)
      .filter(Boolean) as string[];
    const hasReady = deliveries.some((d) => d.toLowerCase().includes('listo') || d.toLowerCase().includes('inmediata'));
    const years = Array.from(new Set(deliveries.flatMap((d) => d.match(/\b202\d\b/g) || []))).sort();
    const deliveryRange = hasReady && years.length > 0
      ? `Inmediata y ${years[0]}–${years[years.length - 1]}`
      : years.length > 1
        ? `${years[0]} – ${years[years.length - 1]}`
        : deliveries.length > 0
          ? deliveries[0]
          : 'Por definir';

    const allTypologies = devProjects.flatMap((p) => getCatalogTypologies(p));
    const allBedrooms = [
      ...allUnits.map((u) => u.bedrooms),
      ...allTypologies.map((t) => t.bedrooms),
    ].filter((b) => b > 0);
    const allBathrooms = [
      ...allUnits.map((u) => u.bathrooms),
      ...allTypologies.map((t) => t.bathrooms),
    ].filter((b) => b > 0);
    const allAreas = [
      ...allUnits.map((u) => u.area),
      ...allTypologies.map((t) => t.totalSqm),
    ].filter((a) => a > 0);
    const allParkings = [
      ...allUnits.map((u) => getParkingSpaces(u.customColumns, devProjects[0]?.slug)),
      ...allTypologies.map((t) => (t).parkingSpaces || 0),
    ].filter((p) => p > 0);

    const specs = [
      { label: 'Habitaciones', value: formatRange(allBedrooms.length > 0 ? allBedrooms : [1, 2, 3]), icon: 'bedrooms' as PropertySpecIconName },
      { label: 'Baños', value: formatRange(allBathrooms.length > 0 ? allBathrooms : [1, 2, 3]), icon: 'bathrooms' as PropertySpecIconName },
      { label: 'Metraje Const.', value: formatRange(allAreas.length > 0 ? allAreas : [60, 120, 200], ' m²'), icon: 'area' as PropertySpecIconName },
      { label: 'Parqueos', value: formatRange(allParkings.length > 0 ? allParkings : [1, 2]), icon: 'parking' as PropertySpecIconName },
    ];

    const firstProj = devProjects[0];
    const cover =
      dev.key === 'cana-rock'
        ? '/projects/cana-rock/drone-golf-course.jpg'
        : dev.key === 'paridera'
        ? '/paridera/hub/sunrise-hero.jpg'
        : PROJECT_COVER_OVERRIDES[firstProj?.slug] || firstProj?.image || '/projects/palm-view/hero.jpg';

    const portfolioUrl =
      dev.key === 'cana-rock'
        ? CANA_ROCK_PORTFOLIO_URL
        : dev.key === 'paridera'
        ? PARIDERA_PORTFOLIO_URL
        : `/desarrolladores/${dev.slug}`;

    const description =
      dev.key === 'cana-rock'
        ? 'Firma pionera en el desarrollo de condominios residenciales de lujo alrededor del Hard Rock Golf Club en Cana Bay, con club de playa privado y alta rentabilidad.'
        : dev.key === 'paridera'
        ? 'Colección residencial de alta gama concebida alrededor de una Crystal Lagoon privada de 15,000 m² con playas de arena blanca y el campo de golf Las Iguanas en Cap Cana.'
        : firstProj?.shortDescription || firstProj?.description || `Portafolio de proyectos residenciales de ${dev.name}.`;

    const location =
      dev.key === 'cana-rock'
        ? 'Cana Bay, Punta Cana'
        : dev.key === 'paridera'
        ? 'Cap Cana, República Dominicana'
        : firstProj?.location || 'República Dominicana';

    const projectsList = devProjects.map((p) => {
      const status = p.delivery?.trim();
      return {
        name: dev.key === 'cana-rock' ? (p.name.replace(/^Cana Rock\s*/i, '').trim() || p.name) : p.name,
        status: status && !/^por definir$/i.test(status) ? status : null,
      };
    });

    return {
      key: dev.key,
      title: dev.name,
      developer: dev.name,
      location,
      projectsCount: devProjects.length,
      minPrice,
      description,
      projectsList,
      cover,
      deliveryRange,
      specs,
      portfolioUrl,
    };
  };

  return (
    <section id="desarrollos" className="bg-white py-24 sm:py-32 scroll-mt-20 border-b border-slate-100">
      <div className="mx-auto max-w-[1680px] px-4 sm:px-8 lg:px-12 space-y-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-4 border-b border-slate-100">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-blue-900 font-extrabold text-[11px] uppercase tracking-wider border border-blue-100">
              <Building2 className="h-3.5 w-3.5 text-blue-700" />
              <span>{locale === 'en' ? 'Authorized Commercial Portfolio' : locale === 'fr' ? <LocalizedText text={"Portefeuille Commercial Agréé"} /> : 'Portafolio Comercial Autorizado'}</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-slate-950 tracking-tight leading-[1.1]">
              {locale === 'en' ? (
                <><LocalizedText text={"Featured Real Estate "} /><span className="text-blue-700"><LocalizedText text={"Developments"} /></span></>
              ) : locale === 'fr' ? (
                <><LocalizedText text={"Développements Immobiliers "} /><span className="text-blue-700"><LocalizedText text={"en Vedette"} /></span></>
              ) : (
                <><LocalizedText text={"Desarrollos Inmobiliarios "} /><span className="text-blue-700"><LocalizedText text={"Destacados"} /></span></>
              )}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
              {locale === 'en'
                ? 'Official portfolios and high-appreciation Caribbean projects with clean deeds, live inventory, and direct broker tools.'
                : locale === 'fr'
                ? <LocalizedText text={"Portefeuilles officiels et projets d’investissement exclusifs aux Caraïbes avec titres fonciers délimités et inventaire en temps réel."} />
                : <LocalizedText text={"Portafolios oficiales y proyectos de alta plusvalía en el Caribe con títulos deslindados, inventario en tiempo real y herramientas directas para asesores."} />}
            </p>
          </div>

          {/* Controls: Mode Switcher & Zone Filter Tabs */}
          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Toggle: Por Desarrollador vs Por Proyecto */}
            <div className="flex items-center rounded-2xl bg-slate-100/90 p-1 border border-slate-200/80">
              <button
                type="button"
                onClick={() => setViewMode('developer')}
                className={cn(
                  'rounded-xl px-3.5 py-1.5 text-xs font-black transition-all duration-200',
                  viewMode === 'developer'
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-950'
                )}
              >
                {locale === 'en' ? 'By Developer' : locale === 'fr' ? 'Par Promoteur' : 'Por Desarrolladora'}
              </button>
              <button
                type="button"
                onClick={() => setViewMode('all')}
                className={cn(
                  'rounded-xl px-3.5 py-1.5 text-xs font-black transition-all duration-200',
                  viewMode === 'all'
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-950'
                )}
              >
                {locale === 'en'
                  ? `All Projects (${projects.length})`
                  : locale === 'fr'
                  ? `Tous les Projets (${projects.length})`
                  : `Todos los Proyectos (${projects.length})`}
              </button>
            </div>

            {/* Zone Filter Tabs (Bienes Temlis Pill Style) */}
            <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-100/80 border border-slate-200/80">
              {zones.map((z) => {
                const isSelected = activeZone.toLowerCase() === z.toLowerCase();
                return (
                  <button
                    key={z}
                    type="button"
                    onClick={() => setActiveZone(z)}
                    className={cn(
                      'rounded-xl px-4 py-2 text-xs font-bold transition-all duration-300',
                      isSelected
                        ? 'bg-slate-950 text-white shadow-md'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
                    )}
                  >
                    {getZoneLabel(z)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Empty State or Project Grid */}
        {filteredProjects.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-16 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm text-blue-700">
              <Building2 className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                {autoTranslate(projects.length === 0 ? 'Catálogo en proceso de carga' : 'No hay proyectos en esta zona')}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {autoTranslate(projects.length === 0
                  ? 'Los desarrollos están siendo sincronizados desde el panel maestro.'
                  : 'Prueba seleccionando "Todas las Zonas" para ver el catálogo completo.')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveZone('all')}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-slate-950 px-6 text-xs font-extrabold text-white shadow-md hover:bg-blue-600 transition"
            >
              <span>{autoTranslate('Ver Todas las Zonas')}</span>
            </button>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {/* IN DEVELOPER MODE: Render Consolidated Multi-Project Developer Cards */}
            {viewMode === 'developer' &&
              multiProjectDevelopers.map((devGroup, idx) => {
                const summary = getDeveloperCombinedSummary(devGroup);

                // Custom luxury card for Paridera Investors
                if (devGroup.key === 'paridera') {
                  return (
                    <Reveal key={devGroup.key} delay={0.05 * (idx + 1)} className="h-full">
                      <div
                        className="group flex flex-col h-full overflow-hidden rounded-[2rem] border-2 border-slate-200 bg-white shadow-md transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:border-slate-300 cursor-pointer"
                        onClick={() => router.push(PARIDERA_PORTFOLIO_URL)}
                        onKeyDown={(event) => handleCardKeyDown(event, PARIDERA_PORTFOLIO_URL)}
                        role="link"
                        tabIndex={0}
                        aria-label={`${autoTranslate('Explorar portafolio')} ${summary.title}`}
                      >
                        {/* Property Image Cover */}
                        <div className="relative aspect-[16/11] w-full overflow-hidden bg-[#0A2A3B]">
                          <Image
                            src={summary.cover}
                            alt={summary.title}
                            fill
                            sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#0A2A3B]/95 via-[#0A2A3B]/35 to-transparent" />

                          {/* Developer Master Badge */}
                          <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-[#0A2A3B]/90 backdrop-blur-md px-3.5 py-1.5 text-[9px] font-black text-white uppercase tracking-wider border border-white/20 shadow-md">
                            <span>{autoTranslate(`${summary.projectsCount} Desarrollos · Cap Cana`)}</span>
                          </div>

                          {/* Bottom Title on Image */}
                          <Link href={PARIDERA_PORTFOLIO_URL} className="absolute bottom-4 left-4 right-4 text-white group/title block">
                            <h3 className="font-display text-2xl font-black tracking-tight text-white group-hover/title:text-slate-200 transition-colors">
                              {summary.title}
                            </h3>
                            <p className="text-xs text-slate-200 mt-1 font-semibold flex items-center gap-1.5">
                              <span className="text-white font-bold">Bonita Beach Collection</span>
                              <span>•</span>
                              <span>{cleanLocationLabel(summary.location)}</span>
                            </p>
                          </Link>
                        </div>

                        {/* Body Content */}
                        <div className="flex flex-1 flex-col justify-between space-y-6 p-6 sm:p-7">
                          <p className="text-sm font-medium leading-relaxed text-slate-600">
                            {autoTranslate(summary.description)}
                          </p>

                          {/* Included Developments Grid */}
                          <div className="space-y-2.5">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                              {autoTranslate('Proyectos incluidos en este portafolio:')}
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                              {summary.projectsList.map((p) => (
                                <div
                                  key={p.name}
                                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between"
                                >
                                  <span className="text-xs font-black text-slate-900 leading-tight">
                                    {p.name}
                                  </span>
                                  {p.status && (
                                    <span className="text-[9px] font-bold text-slate-500 mt-0.5">
                                      {autoTranslate(p.status)}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Price & Delivery */}
                          <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3.5 text-center">
                              <p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-slate-400">
                                {autoTranslate('Precio desde')}
                              </p>
                              <p className="mt-1 text-base font-black text-slate-950">
                                {formatCurrencyExplicit(summary.minPrice, 'USD')}
                              </p>
                            </div>
                            <div className="rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3.5 text-center">
                              <p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-slate-400">
                                {autoTranslate('Entrega')}
                              </p>
                              <p className="mt-1 text-sm font-bold leading-5 text-slate-800">
                                {autoTranslate(summary.deliveryRange)}
                              </p>
                            </div>
                          </div>

                          {/* Specifications Grid */}
                          <div className="grid grid-cols-2 gap-3">
                            {summary.specs.filter((spec) => spec.value !== '—').map((spec) => (
                              <div
                                key={spec.label}
                                className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5"
                                title={`${autoTranslate(spec.label)} ${spec.value}`}
                              >
                                <PropertySpecIcon name={spec.icon} className="h-6 w-6 shrink-0 text-[#b58726]" />
                                <div className="min-w-0 text-left">
                                  <p className="whitespace-nowrap text-[13px] font-black text-slate-950">{spec.value}</p>
                                  <p className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.1em] text-slate-500">{autoTranslate(spec.label)}</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Primary Action Button */}
                          <div className="pt-1">
                            <Link
                              href={PARIDERA_PORTFOLIO_URL}
                              className={PARIDERA_PORTFOLIO_BUTTON_CLASS}
                            >
                              <span>{autoTranslate('Explorar Portafolio')}</span>
                              <ArrowRight className={PARIDERA_PORTFOLIO_BUTTON_ICON_CLASS} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </Reveal>
                  );
                }

                // Custom card for Cana Rock
                if (devGroup.key === 'cana-rock') {
                  return (
                    <Reveal key={devGroup.key} delay={0.05 * (idx + 1)} className="h-full">
                      <div
                        className="group flex flex-col h-full overflow-hidden rounded-[2rem] border-2 border-blue-600/30 bg-white shadow-md transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:border-blue-600 cursor-pointer"
                        onClick={() => router.push(CANA_ROCK_PORTFOLIO_URL)}
                        onKeyDown={(event) => handleCardKeyDown(event, CANA_ROCK_PORTFOLIO_URL)}
                        role="link"
                        tabIndex={0}
                        aria-label={`${autoTranslate('Explorar portafolio')} ${summary.title}`}
                      >
                        {/* Property Image Cover */}
                        <div className="relative aspect-[16/11] w-full overflow-hidden bg-slate-900">
                          {summary.cover ? (
                            <Image
                              src={summary.cover}
                              alt={summary.title}
                              fill
                              sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-950 to-slate-950">
                              <Building2 className="h-12 w-12 text-white/30" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

                          {/* Developer Master Badge */}
                          <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-[#0a1140]/90 backdrop-blur-md px-3 py-1.5 text-[9px] font-black text-white uppercase tracking-wider border border-white/20 shadow-sm">
                            <span>{autoTranslate(`${summary.projectsCount} ${summary.projectsCount === 1 ? 'Desarrollo' : 'Desarrollos'}`)}</span>
                          </div>

                          {/* Bottom Title on Image */}
                          <Link href="/desarrolladores/cana-rock" className="absolute bottom-4 left-4 right-4 text-white group/title block">
                            <h3 className="font-display text-2xl font-black tracking-tight text-white group-hover/title:text-amber-300 transition-colors">
                              {summary.title}
                            </h3>
                            <p className="text-xs text-slate-200 mt-1 font-semibold">
                              <span>{cleanLocationLabel(summary.location)}</span>
                            </p>
                          </Link>
                        </div>

                        {/* Body Content */}
                        <div className="flex flex-1 flex-col justify-between space-y-6 p-6 sm:p-7">
                          <p className="text-sm font-medium leading-relaxed text-slate-600">
                            {autoTranslate(summary.description)}
                          </p>

                          {/* Included Developments Grid */}
                          <div className="space-y-2.5">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                              {autoTranslate('Proyectos incluidos en este portafolio:')}
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                              {summary.projectsList.map((p) => (
                                <div
                                  key={p.name}
                                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between"
                                >
                                  <span className="text-xs font-black text-slate-900">
                                    {p.name}
                                  </span>
                                  <span className="text-[9px] font-bold text-blue-700 mt-0.5">
                                    {autoTranslate(p.status)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Price & Delivery */}
                          <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3.5 text-center">
                              <p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-slate-400">
                                {autoTranslate('Precio desde')}
                              </p>
                              <p className="mt-1 text-base font-black text-slate-950">
                                {summary.minPrice > 0
                                  ? formatCurrencyExplicit(summary.minPrice, 'USD')
                                  : autoTranslate('Consultar')}
                              </p>
                            </div>
                            <div className="rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3.5 text-center">
                              <p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-slate-400">
                                {autoTranslate('Entrega')}
                              </p>
                              <p className="mt-1 text-sm font-bold leading-5 text-slate-800">
                                {autoTranslate(summary.deliveryRange)}
                              </p>
                            </div>
                          </div>

                          {/* Specifications Grid */}
                          <div className="grid grid-cols-2 gap-3">
                            {summary.specs.filter((spec) => spec.value !== '—').map((spec) => (
                              <div
                                key={spec.label}
                                className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5"
                                title={`${autoTranslate(spec.label)} ${spec.value}`}
                              >
                                <PropertySpecIcon name={spec.icon} className="h-6 w-6 shrink-0 text-[#b58726]" />
                                <div className="min-w-0 text-left">
                                  <p className="whitespace-nowrap text-[13px] font-black text-slate-950">{spec.value}</p>
                                  <p className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.1em] text-slate-500">{autoTranslate(spec.label)}</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Primary Action Button */}
                          <div className="pt-1">
                            <Link
                              href={CANA_ROCK_PORTFOLIO_URL}
                              className={PORTFOLIO_BUTTON_CLASS}
                            >
                              <span>{autoTranslate('Explorar Portafolio')}</span>
                              <ArrowRight className={PORTFOLIO_BUTTON_ICON_CLASS} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </Reveal>
                  );
                }

                // Dynamic generic portfolio card for any other developer with > 1 project (e.g. KYSER, etc.)
                return (
                  <Reveal key={devGroup.key} delay={0.05 * (idx + 1)} className="h-full">
                    <div
                      className="group flex flex-col h-full overflow-hidden rounded-[2rem] border-2 border-slate-300/80 bg-white shadow-md transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:border-blue-600 cursor-pointer"
                      onClick={() => router.push(summary.portfolioUrl)}
                      onKeyDown={(event) => handleCardKeyDown(event, summary.portfolioUrl)}
                      role="link"
                      tabIndex={0}
                      aria-label={`${autoTranslate('Explorar portafolio')} ${summary.title}`}
                    >
                      {/* Property Image Cover */}
                      <div className="relative aspect-[16/11] w-full overflow-hidden bg-slate-950">
                        {summary.cover ? (
                          <Image
                            src={summary.cover}
                            alt={summary.title}
                            fill
                            sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 to-blue-950">
                            <Building2 className="h-12 w-12 text-white/30" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/35 to-transparent" />

                        {/* Developer Master Badge */}
                        <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-slate-950/90 backdrop-blur-md px-3.5 py-1.5 text-[9px] font-black text-blue-300 uppercase tracking-wider border border-blue-400/30 shadow-md">
                          <span>{autoTranslate(`${summary.projectsCount} Desarrollos en Catálogo`)}</span>
                        </div>

                        {/* Bottom Title on Image */}
                        <Link href={summary.portfolioUrl} className="absolute bottom-4 left-4 right-4 text-white group/title block">
                          <h3 className="font-display text-2xl font-black tracking-tight text-white group-hover/title:text-blue-300 transition-colors">
                            {summary.title}
                          </h3>
                          <p className="text-xs text-slate-200 mt-1 font-semibold flex items-center gap-1.5">
                            <span>{cleanLocationLabel(summary.location)}</span>
                          </p>
                        </Link>
                      </div>

                      {/* Body Content */}
                      <div className="flex flex-1 flex-col justify-between space-y-6 p-6 sm:p-7">
                        <p className="text-sm font-medium leading-relaxed text-slate-600">
                          {autoTranslate(summary.description)}
                        </p>

                        {/* Included Developments Grid */}
                        <div className="space-y-2.5">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                            {autoTranslate('Proyectos incluidos en este portafolio:')}
                          </span>
                          <div className="grid grid-cols-2 gap-2">
                            {summary.projectsList.map((p) => (
                              <div
                                key={p.name}
                                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between"
                              >
                                <span className="text-xs font-black text-slate-900 leading-tight">
                                  {p.name}
                                </span>
                                <span className="text-[9px] font-bold text-blue-700 mt-0.5">
                                  {autoTranslate(p.status)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Price & Delivery */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div className="rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3.5 text-center">
                            <p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-slate-400">
                              {autoTranslate('Precio desde')}
                            </p>
                            <p className="mt-1 text-base font-black text-slate-950">
                              {summary.minPrice > 0 ? formatCurrencyExplicit(summary.minPrice, 'USD') : autoTranslate('Consultar')}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3.5 text-center">
                            <p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-slate-400">
                              {autoTranslate('Entrega')}
                            </p>
                            <p className="mt-1 text-sm font-bold leading-5 text-slate-800">
                              {autoTranslate(summary.deliveryRange)}
                            </p>
                          </div>
                        </div>

                        {/* Specifications Grid */}
                        <div className="grid grid-cols-2 gap-3">
                          {summary.specs.filter((spec) => spec.value !== '—').map((spec) => (
                            <div
                              key={spec.label}
                              className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5"
                              title={`${autoTranslate(spec.label)} ${spec.value}`}
                            >
                              <PropertySpecIcon name={spec.icon} className="h-6 w-6 shrink-0 text-[#b58726]" />
                              <div className="min-w-0 text-left">
                                <p className="whitespace-nowrap text-[13px] font-black text-slate-950">{spec.value}</p>
                                <p className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.1em] text-slate-500">{autoTranslate(spec.label)}</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Primary Action Button */}
                        <div className="pt-1">
                          <Link
                            href={summary.portfolioUrl}
                            className={PORTFOLIO_BUTTON_CLASS}
                          >
                            <span>{autoTranslate('Explorar Portafolio')}</span>
                            <ArrowRight className={PORTFOLIO_BUTTON_ICON_CLASS} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </Reveal>
                );
              })}

            {/* In Developer mode, render standalone single-project developers (e.g. Ciprés Residences, Uve, Palm View); in All mode render all */}
            {(viewMode === 'developer' ? singleProjectItems : filteredProjects).map((proj, i) => {
              const liveSummary = getLiveProjectSummary(proj);
              const specs = liveSummary.specs;
              const isReady = proj.status === 'Listo para entrega' || proj.delivery.toLocaleLowerCase('es').includes('listo');
              const isDelivered = proj.status === 'Entregado';
              const timelineLabel = isReady || isDelivered ? 'Estado' : 'Entrega estimada';
              const timelineValue = isReady ? 'Entrega inmediata' : isDelivered ? 'Proyecto entregado' : (proj.delivery || 'Por definir');

              return (
                <Reveal key={proj.slug} delay={0.08 * i} className="h-full">
                  <div
                    className="group flex flex-col h-full overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:border-blue-200 cursor-pointer"
                    onClick={() => router.push(`/proyectos/${proj.slug}`)}
                    onKeyDown={(event) => handleCardKeyDown(event, `/proyectos/${proj.slug}`)}
                    role="link"
                    tabIndex={0}
                    aria-label={`${autoTranslate('Explorar portafolio')} ${proj.name}`}
                  >
                    {/* Property Image Cover with Zoom */}
                    <div className="relative aspect-[16/11] w-full overflow-hidden bg-slate-900">
                      {(PROJECT_COVER_OVERRIDES[proj.slug] || proj.image) ? (
                        <Image
                          src={PROJECT_COVER_OVERRIDES[proj.slug] || proj.image}
                          alt={proj.name}
                          fill
                          sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-900 to-slate-950">
                          <Building2 className="h-12 w-12 text-white/30" />
                        </div>
                      )}
                      
                      {/* Dark gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent transition-opacity duration-300 group-hover:opacity-90" />

                      {(() => {
                        const count = developerProjectCounts.get(normalizeText(proj.developer || 'Desarrollador por confirmar')) || 1;
                        return (
                          <div className="absolute left-4 top-4 inline-flex max-w-[calc(100%-2rem)] items-center rounded-full border border-white/20 bg-[#0a1140]/90 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-white shadow-sm backdrop-blur-md">
                            {autoTranslate(`${count} ${count === 1 ? 'Desarrollo' : 'Desarrollos'}`)}
                          </div>
                        );
                      })()}

                      {/* Bottom Title on Image */}
                      <Link href={`/proyectos/${proj.slug}`} className="absolute bottom-4 left-4 right-4 text-white group/title block">
                      <h3 className="font-display text-xl font-bold tracking-tight drop-shadow-sm group-hover/title:text-amber-200 transition-colors">
                        {proj.name}
                      </h3>
                      <p className="text-xs text-slate-200 mt-1 font-medium">
                        <span className="truncate">{cleanLocationLabel(proj.location)}</span>
                      </p>
                    </Link>
                  </div>

                  {/* Body Content */}
                  <div className="flex flex-1 flex-col justify-between space-y-6 p-6 sm:p-7">
                    <p className="line-clamp-2 text-sm font-medium leading-6 text-slate-600">
                      {autoTranslate(proj.shortDescription || proj.description)}
                    </p>

                    {/* Price, delivery status and real unit ranges */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-4 text-center">
                          <p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-slate-400">{autoTranslate(liveSummary.hasAvailability ? 'Precio desde' : 'Disponibilidad')}</p>
                          <p className="mt-1 text-base font-black text-slate-950">{autoTranslate(liveSummary.priceLabel)}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-4 text-center">
                          <p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-slate-400">{autoTranslate(timelineLabel)}</p>
                          <p className="mt-1 text-sm font-bold leading-5 text-slate-800">{autoTranslate(timelineValue)}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {specs.filter((spec) => spec.value !== '—').map((spec) => {
                          return (
                            <div
                              key={spec.label}
                              className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5"
                              title={`${autoTranslate(spec.label)} ${spec.value}`}
                            >
                              <PropertySpecIcon name={spec.icon} className="h-6 w-6 shrink-0 text-[#b58726]" />
                              <div className="min-w-0 text-left">
                                <p className="whitespace-nowrap text-[13px] font-black text-slate-950">{spec.value}</p>
                                <p className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.1em] text-slate-500">{autoTranslate(spec.label)}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Primary action */}
                    <div className="pt-1">
                      <Link
                        href={`/proyectos/${proj.slug}`}
                        className={PORTFOLIO_BUTTON_CLASS}
                      >
                        <span>{autoTranslate('Explorar Portafolio')}</span>
                        <ArrowRight className={PORTFOLIO_BUTTON_ICON_CLASS} />
                      </Link>
                    </div>
                  </div>
                </div>
              </Reveal>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
