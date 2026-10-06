'use client';
import { UITranslationBoundary } from '@/components/i18n/UITranslationBoundary';


import { useMemo, useState, type ReactNode } from 'react';
import { ArrowRight, Bath, BedDouble, Building2, CarFront, Download, Grid2X2, List, Loader2, Ruler, Search, Share2, SlidersHorizontal, X } from 'lucide-react';
import type { PortalUnit, PortalUnitStatus } from '@/lib/portal-projects';
import type { LandingUnitDetailConfig } from '@/lib/data/landing-config';
import { cn, formatCurrencyExplicit } from '@/lib/utils';
import CanaRockUnitDetailModal from '@/components/landing/CanaRockUnitDetailModal';
import { exportAvailabilityToPdf } from '@/lib/export/availability-pdf';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { getHostingerAssetUrl } from '@/lib/storage/hostinger-constants';

const INITIAL_PAGE_SIZE = 8;
const PAGE_INCREMENT = 8;
const statusStyles: Record<PortalUnitStatus, string> = {
  Disponible: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  Separada: 'border-amber-200 bg-amber-50 text-amber-800',
  Vendida: 'border-slate-200 bg-slate-100 text-slate-600',
  Bloqueada: 'border-rose-200 bg-rose-50 text-rose-800',
};
type SortOption = 'price-asc' | 'price-desc' | 'area-desc' | 'unit-asc';
type ViewMode = 'grid' | 'list';

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es'));
}
function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toLocaleString('es-DO', { maximumFractionDigits: 1 });
}
function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] || character);
}
function parking(unit: PortalUnit) {
  const value = Object.entries(unit.customColumns || {}).find(([key]) => /parque|parking/i.test(key))?.[1];
  const parsed = Number.parseFloat(value || '');
  return Number.isFinite(parsed) && parsed > 0 ? formatNumber(parsed) : null;
}

export default function CanaRockAvailabilityExplorer({ units, primaryColor, accentColor, contactHref, projectName, projectLogoUrl, unitDetail }: {
  units: PortalUnit[]; primaryColor: string; accentColor: string; contactHref: string; projectName: string; projectLogoUrl?: string | null; unitDetail?: LandingUnitDetailConfig;
}) {
  const { autoTranslate, locale } = useLocale();
  const publicUnits = useMemo(() => units.filter((unit) => unit.isPublic !== false), [units]);
  const [view, setView] = useState<ViewMode>('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [status, setStatus] = useState<PortalUnitStatus | 'Todas'>('Disponible');
  const [search, setSearch] = useState('');
  const [tower, setTower] = useState('Todas');
  const [type, setType] = useState('Todas');
  const [bedrooms, setBedrooms] = useState('Todas');
  const [bathrooms, setBathrooms] = useState('Todas');
  const [sortBy, setSortBy] = useState<SortOption>('price-asc');
  const [visibleCount, setVisibleCount] = useState(INITIAL_PAGE_SIZE);
  const [selectedUnit, setSelectedUnit] = useState<PortalUnit | null>(null);
  const [shareFeedback, setShareFeedback] = useState('');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const towers = useMemo(() => uniqueSorted(publicUnits.map((unit) => unit.tower)), [publicUnits]);
  const types = useMemo(() => uniqueSorted(publicUnits.map((unit) => unit.type)), [publicUnits]);
  const bedroomOptions = useMemo(() => Array.from(new Set(publicUnits.map((unit) => unit.bedrooms).filter(Boolean))).sort((a, b) => a - b), [publicUnits]);
  const bathroomOptions = useMemo(() => Array.from(new Set(publicUnits.map((unit) => unit.bathrooms).filter(Boolean))).sort((a, b) => a - b), [publicUnits]);
  const availableCount = useMemo(() => publicUnits.filter((unit) => unit.status === 'Disponible').length, [publicUnits]);
  const availableCurrencyCodes = useMemo(() => Array.from(new Set(publicUnits.filter((unit) => unit.status === 'Disponible' && unit.price > 0).map((unit) => unit.currency || 'USD'))), [publicUnits]);
  const averagePrice = useMemo(() => {
    if (availableCurrencyCodes.length !== 1) return 0;
    const prices = publicUnits.filter((unit) => unit.status === 'Disponible' && unit.price > 0).map((unit) => unit.price);
    return prices.length ? prices.reduce((total, price) => total + price, 0) / prices.length : 0;
  }, [availableCurrencyCodes.length, publicUnits]);
  const filteredUnits = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('es');
    const result = publicUnits.filter((unit) => {
      const matchesQuery = !query || [unit.unit, unit.tower, unit.type].some((value) => value?.toLocaleLowerCase('es').includes(query));
      return matchesQuery && (status === 'Todas' || unit.status === status) && (tower === 'Todas' || unit.tower === tower)
        && (type === 'Todas' || unit.type === type) && (bedrooms === 'Todas' || unit.bedrooms === Number(bedrooms))
        && (bathrooms === 'Todas' || unit.bathrooms === Number(bathrooms));
    });
    return result.sort((a, b) => {
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'area-desc') return b.area - a.area;
      if (sortBy === 'unit-asc') return a.unit.localeCompare(b.unit, 'es', { numeric: true });
      return a.price - b.price;
    });
  }, [bathrooms, bedrooms, publicUnits, search, sortBy, status, tower, type]);
  const shownUnits = filteredUnits.slice(0, visibleCount);
  const hasActiveFilters = status !== 'Disponible' || Boolean(search) || tower !== 'Todas' || type !== 'Todas' || bedrooms !== 'Todas' || bathrooms !== 'Todas' || sortBy !== 'price-asc';

  function update(action: () => void) { action(); setVisibleCount(INITIAL_PAGE_SIZE); }
  function reset() {
    setStatus('Disponible'); setSearch(''); setTower('Todas'); setType('Todas'); setBedrooms('Todas'); setBathrooms('Todas'); setSortBy('price-asc'); setVisibleCount(INITIAL_PAGE_SIZE);
  }
  async function shareAvailability() {
    const url = `${window.location.origin}${window.location.pathname}#disponibilidad`;
    const data = { title: `${autoTranslate('Disponibilidad')} · ${projectName}`, text: `${autoTranslate('Consulta la disponibilidad publicada de')} ${projectName}.`, url };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(url);
        setShareFeedback(autoTranslate('Enlace copiado'));
        window.setTimeout(() => setShareFeedback(''), 2400);
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') setShareFeedback(autoTranslate('No fue posible compartir'));
    }
  }
  async function handleDownloadPdf() {
    if (isDownloadingPdf || !filteredUnits.length) return;
    setIsDownloadingPdf(true);
    try {
      await exportAvailabilityToPdf({
        projectName,
        units: filteredUnits,
        availabilityUrl: `${window.location.origin}${window.location.pathname}#disponibilidad`,
        locale,
        primaryColorHex: primaryColor,
        accentColorHex: accentColor,
        projectLogoUrl,
      });
    } catch (err) {
      console.error('Error al generar PDF:', err);
      // Fallback: try opening print view
      const report = window.open('', '_blank');
      if (report) {
        const rows = filteredUnits.map((unit) => `<tr><td><strong>${escapeHtml(unit.unit)}</strong><br><small>${escapeHtml(unit.tower)}</small></td><td>${escapeHtml(unit.type)}</td><td>${unit.bedrooms || '—'}</td><td>${unit.bathrooms || '—'}</td><td>${unit.area ? `${formatNumber(unit.area)} m²` : '—'}</td><td><strong>${escapeHtml(formatCurrencyExplicit(unit.price, unit.currency))}</strong><br><small>${escapeHtml(unit.status)}</small></td></tr>`).join('');
        const logoUrl = projectLogoUrl ? getHostingerAssetUrl(projectLogoUrl) || projectLogoUrl : null;
        const logoHeader = logoUrl
          ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(projectName)}" style="display:block;max-width:190px;max-height:58px;object-fit:contain;filter:brightness(0);margin-bottom:14px" />`
          : `<h1>${escapeHtml(projectName)}</h1>`;
        report.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8" /><title>${escapeHtml(projectName)} · Disponibilidad</title><style>body{font-family:system-ui,sans-serif;color:#081339;margin:36px}header{padding-bottom:14px;border-bottom:3px solid #d4af37}table{border-collapse:collapse;width:100%;margin-top:28px}th{text-align:left;font-size:10px;padding:10px 8px;border-bottom:2px solid #d4af37}td{font-size:12px;padding:12px 8px;border-bottom:1px solid #e4e8ef}</style></head><body><header>${logoHeader}<p>Disponibilidad · ${filteredUnits.length} unidades</p></header><table><thead><tr><th>Unidad</th><th>Modelo</th><th>Hab.</th><th>Baños</th><th>Metraje</th><th>Inversión</th></tr></thead><tbody>${rows}</tbody></table></body></html>`);
        report.document.close();
        report.focus();
        report.print();
      }
    } finally {
      setIsDownloadingPdf(false);
    }
  }
  if (!publicUnits.length) return <EmptyAvailability accentColor={accentColor} />;

  return <div>
    <div className="flex flex-col gap-4 border-y border-slate-200 py-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <Metric label={autoTranslate('Disponibles')} value={`${availableCount} ${autoTranslate('unidades')}`} accentColor={accentColor} />
        {averagePrice > 0 && <Metric label={autoTranslate('Precio promedio')} value={formatCurrencyExplicit(averagePrice, publicUnits.find((unit) => unit.status === 'Disponible')?.currency)} accentColor={accentColor} />}
        <p className="text-xs text-slate-500">{autoTranslate('Inventario publicado · confirma condiciones con el equipo comercial.')}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold tabular-nums text-slate-500">{filteredUnits.length} {filteredUnits.length === 1 ? autoTranslate('resultado') : autoTranslate('resultados')}</span>
        <button
          type="button"
          onClick={handleDownloadPdf}
          disabled={isDownloadingPdf}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 px-3.5 text-[10px] font-black uppercase tracking-[0.1em] text-slate-700 transition hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 cursor-pointer print:hidden"
        >
          {isDownloadingPdf ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: primaryColor }} />
              <span>{autoTranslate('Generando PDF…')}</span>
            </>
          ) : (
            <>
              <Download className="h-3.5 w-3.5" style={{ color: primaryColor }} />
              <span>{autoTranslate('Descargar PDF')}</span>
            </>
          )}
        </button>
        <button type="button" onClick={shareAvailability} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-200 px-3 text-[10px] font-black uppercase tracking-[0.1em] text-slate-700 transition hover:bg-slate-50 print:hidden">
          <Share2 className="h-3.5 w-3.5" style={{ color: primaryColor }} />
          {shareFeedback || autoTranslate('Compartir')}
        </button>
      </div>
    </div>

    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
      <label className="relative block min-w-0 flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <span className="sr-only">{autoTranslate('Buscar unidad, bloque o modelo')}</span>
        <input value={search} onChange={(event) => update(() => setSearch(event.target.value))} placeholder={autoTranslate('Buscar por unidad, bloque o modelo')} className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400" />
      </label>
      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1" aria-label={autoTranslate('Forma de ver la disponibilidad')}>
          <ViewButton active={view === 'grid'} onClick={() => setView('grid')} label={autoTranslate('Tarjetas')} icon={<Grid2X2 className="h-3.5 w-3.5" />} />
          <ViewButton active={view === 'list'} onClick={() => setView('list')} label={autoTranslate('Lista')} icon={<List className="h-3.5 w-3.5" />} />
        </div>
        <button type="button" onClick={() => setFiltersOpen((current) => !current)} className="inline-flex h-12 items-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-black uppercase tracking-[0.1em] text-slate-700 transition hover:bg-slate-50">
          <SlidersHorizontal className="h-4 w-4" style={{ color: primaryColor }} />{autoTranslate('Filtros')}{hasActiveFilters && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accentColor }} />}
        </button>
      </div>
    </div>

    {filtersOpen && <div className="mt-3 grid gap-2 border-b border-slate-200 pb-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <FilterSelect label={autoTranslate('Estado')} value={status} onChange={(value) => update(() => setStatus(value as PortalUnitStatus | 'Todas'))}>
        <option value="Disponible">{autoTranslate('Disponibles')}</option>
        <option value="Todas">{autoTranslate('Todos los estados')}</option>
        <option value="Separada">{autoTranslate('Separadas')}</option>
        <option value="Vendida">{autoTranslate('Vendidas')}</option>
        <option value="Bloqueada">{autoTranslate('Bloqueadas')}</option>
      </FilterSelect>
      <FilterSelect label={autoTranslate('Modelo')} value={type} onChange={(value) => update(() => setType(value))}>
        <option value="Todas">{autoTranslate('Todos los modelos')}</option>
        {types.map((option) => <option key={option} value={option}>{option}</option>)}
      </FilterSelect>
      {towers.length > 1 && <FilterSelect label={autoTranslate('Bloque')} value={tower} onChange={(value) => update(() => setTower(value))}>
        <option value="Todas">{autoTranslate('Todos los bloques')}</option>
        {towers.map((option) => <option key={option} value={option}>{option}</option>)}
      </FilterSelect>}
      <FilterSelect label={autoTranslate('Habitaciones')} value={bedrooms} onChange={(value) => update(() => setBedrooms(value))}>
        <option value="Todas">{autoTranslate('Todas las habitaciones')}</option>
        {bedroomOptions.map((option) => <option key={option} value={option}>{option} {autoTranslate('hab.')}</option>)}
      </FilterSelect>
      <FilterSelect label={autoTranslate('Baños')} value={bathrooms} onChange={(value) => update(() => setBathrooms(value))}>
        <option value="Todas">{autoTranslate('Todos los baños')}</option>
        {bathroomOptions.map((option) => <option key={option} value={option}>{option} {autoTranslate('baños')}</option>)}
      </FilterSelect>
      <FilterSelect label={autoTranslate('Ordenar')} value={sortBy} onChange={(value) => update(() => setSortBy(value as SortOption))}>
        <option value="price-asc">{autoTranslate('Menor precio')}</option>
        <option value="price-desc">{autoTranslate('Mayor precio')}</option>
        <option value="area-desc">{autoTranslate('Mayor metraje')}</option>
        <option value="unit-asc">{autoTranslate('Código de unidad')}</option>
      </FilterSelect>
      {hasActiveFilters && <button type="button" onClick={reset} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-3 text-xs font-bold text-slate-500 transition hover:text-slate-950"><X className="h-3.5 w-3.5" />{autoTranslate('Limpiar filtros')}</button>}
    </div>}

    {shownUnits.length ? <>
      <div className={cn('mt-6', view === 'grid' ? 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' : 'divide-y overflow-hidden rounded-2xl border border-slate-200')}>
        {shownUnits.map((unit) => view === 'grid' ? <UnitCard key={unit.id} unit={unit} primaryColor={primaryColor} accentColor={accentColor} onSelect={() => setSelectedUnit(unit)} /> : <UnitListRow key={unit.id} unit={unit} primaryColor={primaryColor} onSelect={() => setSelectedUnit(unit)} />)}
      </div>
      {filteredUnits.length > shownUnits.length && <div className="mt-6 text-center"><button type="button" onClick={() => setVisibleCount((current) => current + PAGE_INCREMENT)} className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-xs font-black uppercase tracking-[0.1em] transition hover:bg-slate-50" style={{ borderColor: `${primaryColor}40`, color: primaryColor }}>{autoTranslate('Ver')} {Math.min(PAGE_INCREMENT, filteredUnits.length - shownUnits.length)} {autoTranslate('más')} <ArrowRight className="h-3.5 w-3.5" /></button></div>}
    </> : <div className="mt-6 border-y border-slate-200 px-6 py-16 text-center"><Search className="mx-auto h-6 w-6 text-slate-300" /><p className="mt-4 text-sm font-bold text-slate-800">{autoTranslate('No encontramos unidades con estos filtros.')}</p><button type="button" onClick={reset} className="mt-3 text-xs font-bold underline underline-offset-4" style={{ color: primaryColor }}>{autoTranslate('Restablecer disponibilidad')}</button></div>}
    <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><p>{autoTranslate('Precios y disponibilidad sujetos a confirmación comercial.')}</p><a href={contactHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-bold" style={{ color: primaryColor }}>{autoTranslate('Consultar una unidad')} <ArrowRight className="h-3.5 w-3.5" /></a></div>
    <CanaRockUnitDetailModal unit={selectedUnit} units={publicUnits} projectName={projectName} primaryColor={primaryColor} accentColor={accentColor} contactHref={contactHref} unitDetail={unitDetail} onClose={() => setSelectedUnit(null)} />
  </div>;
}

function EmptyAvailability({ accentColor }: { accentColor: string }) {
  const { autoTranslate } = useLocale();
  return (
    <div className="flex min-h-52 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
      <div>
        <Building2 className="mx-auto h-6 w-6" style={{ color: accentColor }} />
        <p className="mt-4 text-sm font-bold text-slate-800">{autoTranslate('Disponibilidad bajo solicitud')}</p>
        <p className="mt-2 text-xs text-slate-500">{autoTranslate('El equipo comercial confirmará las opciones vigentes.')}</p>
      </div>
    </div>
  );
}

function Metric({ label, value, accentColor }: { label: string; value: string; accentColor: string }) {
  return (
    <div>
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-black tabular-nums" style={{ color: accentColor }}>{value}</p>
    </div>
  );
}

function ViewButton({ active, onClick, label, icon }: { active: boolean; onClick: () => void; label: string; icon: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn('inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[10px] font-black uppercase tracking-[0.1em] transition', active ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800')}
    >
      {icon}{label}
    </button>
  );
}

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-slate-400">
        {children}
      </select>
    </label>
  );
}

function UnitCard({ unit, primaryColor, accentColor, onSelect }: { unit: PortalUnit; primaryColor: string; accentColor: string; onSelect: () => void }) {
  const { autoTranslate } = useLocale();
  const parkingSpaces = parking(unit);
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_16px_28px_-24px_rgba(8,19,57,0.6)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4"
      style={{ outlineColor: accentColor }}
    >
      <div className="flex w-full items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.14em]" style={{ color: accentColor }}>{unit.tower}</p>
          <h3 className="mt-1 text-2xl font-black tracking-[-0.04em] text-slate-950">{unit.unit}</h3>
          <p className="mt-1 truncate text-xs font-medium text-slate-500">{unit.type}</p>
        </div>
        <span className={cn('shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em]', statusStyles[unit.status])}>
          {autoTranslate(unit.status)}
        </span>
      </div>
      <dl className={cn('mt-5 grid w-full border-y border-slate-100', parkingSpaces ? 'grid-cols-2' : 'grid-cols-3')}>
        <UnitSpec icon={<BedDouble className="h-4 w-4" />} label={autoTranslate('Habitaciones')} value={unit.bedrooms ? formatNumber(unit.bedrooms) : '—'} accentColor={accentColor} />
        <UnitSpec icon={<Bath className="h-4 w-4" />} label={autoTranslate('Baños')} value={unit.bathrooms ? formatNumber(unit.bathrooms) : '—'} accentColor={accentColor} borderLeft />
        <UnitSpec icon={<Ruler className="h-4 w-4" />} label={autoTranslate('Metraje')} value={unit.area ? `${formatNumber(unit.area)} m²` : '—'} accentColor={accentColor} borderLeft={!parkingSpaces} />
        {parkingSpaces && <UnitSpec icon={<CarFront className="h-4 w-4" />} label={autoTranslate('Parqueos')} value={parkingSpaces} accentColor={accentColor} borderLeft />}
      </dl>
      <div className="mt-5 flex w-full items-end justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">{autoTranslate('Inversión')}</p>
          <p className="mt-1 text-lg font-black tracking-tight" style={{ color: primaryColor }}>{formatCurrencyExplicit(unit.price, unit.currency)}</p>
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-black" style={{ color: primaryColor }}>
          {autoTranslate('Ver ficha')} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </button>
  );
}

function UnitSpec({ icon, label, value, accentColor, borderLeft = false }: { icon: ReactNode; label: string; value: string; accentColor: string; borderLeft?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5 py-3', borderLeft ? 'border-l border-slate-100 pl-3' : 'pr-3')}>
      <span style={{ color: accentColor }}>{icon}</span>
      <div className="min-w-0">
        <dt className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-400">{label}</dt>
        <dd className="mt-0.5 truncate text-xs font-black text-slate-800">{value}</dd>
      </div>
    </div>
  );
}

function UnitListRow({ unit, primaryColor, onSelect }: { unit: PortalUnit; primaryColor: string; onSelect: () => void }) {
  const { autoTranslate } = useLocale();
  return (
    <button
      type="button"
      onClick={onSelect}
      className="grid w-full gap-4 px-5 py-4 text-left transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] sm:grid-cols-[0.7fr_1.15fr_1.3fr_auto] sm:items-center sm:px-6"
      style={{ outlineColor: primaryColor }}
    >
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">{unit.tower}</p>
        <p className="mt-1 text-base font-black text-slate-950">{unit.unit}</p>
      </div>
      <div>
        <p className="text-sm font-bold text-slate-800">{unit.type}</p>
        <span className={cn('mt-2 inline-flex rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em]', statusStyles[unit.status])}>
          {autoTranslate(unit.status)}
        </span>
      </div>
      <dl className="grid grid-cols-3 gap-2 border-y border-slate-100 py-3 sm:border-0 sm:py-0">
        <ListSpec label={autoTranslate('Hab.')} value={unit.bedrooms ? formatNumber(unit.bedrooms) : '—'} />
        <ListSpec label={autoTranslate('Baños')} value={unit.bathrooms ? formatNumber(unit.bathrooms) : '—'} />
        <UITranslationBoundary attributes={["label"]}><ListSpec label="m²" value={unit.area ? formatNumber(unit.area) : '—'} /></UITranslationBoundary>
      </dl>
      <div className="flex items-center justify-between gap-3 text-left sm:text-right">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400">{autoTranslate('Precio')}</p>
          <p className="mt-1 text-base font-black" style={{ color: primaryColor }}>{formatCurrencyExplicit(unit.price, unit.currency)}</p>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0" style={{ color: primaryColor }} />
      </div>
    </button>
  );
}

function ListSpec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[8px] font-black uppercase tracking-[0.1em] text-slate-400">{label}</dt>
      <dd className="mt-1 text-xs font-black text-slate-800">{value}</dd>
    </div>
  );
}
