'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import Image from '@/components/ui/OptimizedImage';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useMemo, useState } from 'react';
import { ArrowLeft, BedDouble, CheckCircle2, Clock3, Download, FileText, FolderOpen, Info, LayoutGrid, List, FilePlus2, LoaderCircle, Mail, Map, MapPin, Palette, Phone, Search, UserPlus, X } from 'lucide-react';
import { useBrand } from '@/components/branding/BrandProvider';
import type { PortalLot, PortalProject, PortalUnit } from '@/lib/portal-projects';
import { cn, formatCurrency } from '@/lib/utils';
import { cloneProjectDossierAction } from '@/app/portal/proposals/actions';
import ProjectDocumentsPanel from '@/components/portal/documents/ProjectDocumentsPanel';
import LotMap from '@/components/portal/LotMap';
import LotTechnicalCard from '@/components/portal/LotTechnicalCard';
import { AmenityIcon } from '@/components/branding/AmenityIcon';
import { getProjectTypology, type ProjectVillaTypology } from '@/lib/data/cipres-typologies';
import TypologyDetailModal from './TypologyDetailModal';
import TypologyShowcaseCards from './TypologyShowcaseCards';
import ProjectAnalyticsPanel from '@/components/portal/analytics/ProjectAnalyticsPanel';
import AvailabilityReportView from '@/components/availability/AvailabilityReportView';
import { availabilityReport, availabilityPath } from '@/lib/availability/report';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { availabilityText } from '@/lib/availability/copy';
import type { ProjectConstructionUpdate } from '@/lib/data/construction-updates';
import ConstructionProgressTimeline from '@/components/portal/ConstructionProgressTimeline';

type Tab = 'dossier' | 'availability' | 'lots' | 'documents' | 'progress' | 'analytics';

function resolveCustomValue(customColumns: Record<string, string> | undefined, col: string): string {
  if (!customColumns) return '—';
  if (customColumns[col]) return customColumns[col];
  const normalizedCol = col.toLowerCase().trim();
  for (const key of Object.keys(customColumns)) {
    if (key.toLowerCase().trim() === normalizedCol) {
      return customColumns[key];
    }
  }
  return '—';
}

interface ProjectDetailProps {
  project: PortalProject;
  canCreateProposals?: boolean;
  canManageDocuments?: boolean;
  canEditDossier?: boolean;
  customTypologies?: Record<string, ProjectVillaTypology>;
  officialDossier?: {id:number;url:string;pages:number};
  constructionUpdates?: ProjectConstructionUpdate[];
}

export default function ProjectDetail({
  project,
  canCreateProposals = true,
  canManageDocuments = false,
  canEditDossier = false,
  customTypologies,
  officialDossier,
  constructionUpdates = [],
}: ProjectDetailProps) {
  const { theme } = useBrand();
  const {locale}=useLocale();
  const availabilityLabel=(text:string)=>availabilityText(text,locale);
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('availability');
  const [query, setQuery] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  const isLandSubdivision = project.projectType === 'land_subdivision';

  const handleCloneDossier = async () => {
    try {
      setIsCloning(true);
      const res = await cloneProjectDossierAction({ projectSlug: project.slug, dossierId:officialDossier?.id });
      setIsCloning(false);
      if (res.success && res.editUrl) {
        notify('¡Dossier personalizado creado con tu marca y contacto!');
        router.push(res.editUrl);
      } else {
        window.alert(res.error || 'No fue posible crear el dossier personalizado.');
      }
    } catch (err) {
      setIsCloning(false);
      console.error(err);
      window.alert('Error al clonar el dossier.');
    }
  };

  const available = useMemo(
    () =>
      project.units.filter((unit) =>
        !query.trim()
          ? true
          : `${unit.unit} ${unit.type} ${unit.tower} ${Object.values(unit.customColumns || {}).join(' ')}`
              .toLowerCase()
              .includes(query.toLowerCase())
      ),
    [project.units, query]
  );

  const notify = (message: string) => { setNotice(message); setTimeout(() => setNotice(''), 2200); };

  function exportInventory() {
    const hasCustom = (project.customColumnsList || []).length > 0;
    let header = 'Unidad,Torre,Nivel,Tipología,Área m²,Precio USD,Estado';
    let rows: string[] = [];

    if (hasCustom && project.customColumnsList) {
      header = ['Unidad', ...project.customColumnsList, 'Estado'].join(',');
      rows = available.map((unit) => [
        unit.unit,
        ...(project.customColumnsList || []).map((col) => `"${unit.customColumns?.[col] || ''}"`),
        unit.status,
      ].join(','));
    } else {
      rows = available.map((unit) => [unit.unit, unit.tower, unit.floor, unit.type, unit.area, unit.price, unit.status].join(','));
    }

    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${project.slug}-disponibilidad.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    notify('Inventario exportado.');
  }

  return (
    <div className="portal-enter min-w-0 max-w-full space-y-6 overflow-x-hidden">
      <Link href="/portal/projects" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600"><ArrowLeft className="h-4 w-4" /><LocalizedText text={" Volver a proyectos"} /></Link>

      <section className="relative overflow-hidden rounded-3xl bg-slate-950 text-white shadow-xl">
        {project.image && <Image src={project.image} alt={project.name} fill priority sizes="(max-width: 1024px) 100vw, 1200px" className="object-cover opacity-55" />}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-indigo-950/80 to-transparent" />
        <div className="relative z-10 flex min-h-[380px] flex-col justify-between p-6 sm:p-9">
          <div className="flex flex-wrap items-center justify-between gap-3"><span className="rounded-full bg-white/10 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.16em] backdrop-blur">{project.status}<LocalizedText text={" · Inventario Activo"} /></span><span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-white/70"><Clock3 className="h-3.5 w-3.5" /><LocalizedText text={" Actualizado "} />{project.updatedAt}</span></div>
          <div className="max-w-3xl"><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-200">{project.developer}</p><h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">{project.name}</h1><p className="mt-3 flex items-center gap-1.5 text-xs text-white/75"><MapPin className="h-4 w-4" /> {project.location}</p><p className="mt-5 max-w-2xl text-sm leading-6 text-white/75">{project.shortDescription}</p><div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={() => setReportOpen(true)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-xs font-bold text-blue-600 shadow-sm hover:bg-slate-50 transition"><UserPlus className="h-4 w-4" /><LocalizedText text={" Reportar cliente"} /></button>
            <button
              type="button"
              onClick={handleCloneDossier}
              disabled={isCloning || !officialDossier}
              title={!officialDossier ? availabilityLabel('Dossier pendiente de publicación') : undefined}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-700 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50"
            >
              {isCloning ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FilePlus2 className="h-4 w-4" />}
              <span><LocalizedText text={"Crear dossier para mí"} /></span>
            </button>
            {canCreateProposals && <Link href={`/portal/proposals/new?project=${project.slug}`} className="inline-flex h-11 items-center gap-2 rounded-xl bg-white/10 px-4 text-xs font-bold text-white backdrop-blur hover:bg-white/15"><FileText className="h-4 w-4" /><LocalizedText text={" Crear propuesta"} /></Link>}
            {canEditDossier && <Link href={`/portal/projects/${project.slug}/dossier`} className="inline-flex h-11 items-center gap-2 rounded-xl bg-white/10 px-4 text-xs font-bold text-white backdrop-blur hover:bg-white/15"><Palette className="h-4 w-4" /><LocalizedText text={" Editar dossier"} /></Link>}
            {project.digitalFolderUrl && (
              <UITranslationBoundary attributes={["title"]}><a
                href={project.digitalFolderUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 px-4 text-xs font-bold backdrop-blur hover:bg-emerald-500/30 hover:text-white transition shadow-sm"
                title="Abrir carpeta en la nube con todos los archivos originales"
              >
                <FolderOpen className="h-4 w-4 text-emerald-400" />
                <span><LocalizedText text={"Carpeta Digital (Drive)"} /></span>
              </a></UITranslationBoundary>
            )}
          </div></div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[
        { label: 'Precio desde', value: formatCurrency(project.startingPrice, project.currency) }, { label: 'Disponibles', value: `${project.availableUnits} / ${project.totalUnits}` },
        { label: 'Entrega', value: project.delivery }, { label: 'Desarrollador', value: project.developer || 'Master Broker' },
      ].map((stat) => <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400">{stat.label}</p><p className="mt-2 text-sm font-extrabold text-slate-900">{stat.value}</p></div>)}</section>

      <UITranslationBoundary attributes={["aria-label"]}><div role="tablist" aria-label="Secciones del proyecto" className="flex min-w-0 max-w-full overflow-x-auto border-b border-slate-200">
        {[
        { id: 'dossier', label: 'Dossier comercial', count: officialDossier?.pages || 0 },
        { id: 'availability', label: isLandSubdivision ? 'Inventario de lotes' : 'Disponibilidad de unidades', count: isLandSubdivision ? project.lots.length : available.length },
        ...(isLandSubdivision && project.lots.length > 0 ? [{ id: 'lots' as const, label: 'Master plan interactivo', count: project.lots.length }] : []),
        { id: 'documents', label: 'Centro documental', count: project.documents.length },
        { id: 'progress', label: 'Avances de obra', count: constructionUpdates.length },
        { id: 'analytics', label: 'Métricas & Estadísticas', count: 'Live' },
        ].map((item) => <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} onClick={() => setTab(item.id as Tab)} className={cn('flex shrink-0 items-center gap-2 border-b-2 px-5 py-3 text-xs font-extrabold transition', tab === item.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-700')}><span>{item.label}</span><span className={cn('rounded-full px-2 py-0.5 text-[9px] font-black', tab === item.id ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-400')}>{item.count}</span></button>)}
      </div></UITranslationBoundary>

      {tab === 'dossier' && (
        officialDossier ? <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">{availabilityLabel('Dossier oficial')} · {officialDossier.pages} {availabilityLabel('páginas')}</h2><a href={officialDossier.url} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold">{availabilityLabel('Abrir dossier completo')}</a></div>
          <iframe src={officialDossier.url} title={`Dossier oficial de ${project.name}`} loading="lazy" className="h-[850px] w-full rounded-xl border border-slate-200 bg-white"/>
        </section> : <div className="space-y-4">
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="font-semibold">{availabilityLabel('Dossier pendiente de publicación')}</h2>
          <p className="mt-2 text-sm text-slate-600">{availabilityLabel('La información de abajo es la ficha del proyecto. El dossier completo aparecerá aquí cuando esté publicado.')}</p>
          {canEditDossier && <a href={`/portal/projects/${project.slug}/dossier`} className="mt-3 inline-block text-sm font-semibold underline underline-offset-4">{availabilityLabel('Abrir editor del dossier')}</a>}
        </section>
        <DossierTab
          project={project}
          brandName={theme.name}
          brandColor={theme.primary_color}
          brandLogo={theme.logo_url}
          canEditDossier={canEditDossier}
        />
        </div>
      )}
      {tab === 'availability' && (
        <div className="space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-semibold">{availabilityLabel('Disponibilidad para compartir')}</h2><p className="mt-1 text-sm text-slate-600">{availabilityLabel('Enlace independiente con inventario actualizado y PDF carta horizontal.')}</p></div><a href={availabilityPath(project.slug)} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white">{availabilityLabel('Abrir disponibilidad en línea')}</a></div></section>
        <AvailabilityTab
          project={project}
          units={available}
          query={query}
          setQuery={setQuery}
          exportInventory={exportInventory}
          customTypologies={customTypologies}
          canCreateProposals={canCreateProposals}
        />
        <details className="rounded-xl border border-slate-200 bg-white"><summary className="cursor-pointer p-4 text-sm font-semibold">{availabilityLabel('Compartir enlace y descargar PDF de disponibilidad')}</summary><AvailabilityReportView report={availabilityReport(project)}/></details>
        </div>
      )}
      {tab === 'lots' && <LotViewerTab project={project} />}
      {tab === 'documents' && <ProjectDocumentsPanel project={project} brandName={theme.name} canManage={canManageDocuments} />}
      {tab === 'progress' && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Seguimiento y avances de obra</h2>
              <p className="text-xs text-slate-500">Bitácora mensual con evidencias fotográficas, vuelos de dron y porcentajes de ejecución.</p>
            </div>
          </div>
          <ConstructionProgressTimeline updates={constructionUpdates} projectName={project.name} />
        </section>
      )}
      {tab === 'analytics' && <ProjectAnalyticsPanel projectId={project.id} projectName={project.name} />}

      {reportOpen && <ClientReportModal project={project} onClose={() => setReportOpen(false)} />}
      {notice && <div className="fixed bottom-5 right-5 z-50 rounded-xl bg-slate-950 px-4 py-3 text-xs font-semibold text-white shadow-xl">{notice}</div>}
    </div>
  );
}

function DossierTab({
  project,
  brandName,
  brandColor,
  brandLogo,
  canEditDossier,
}: {
  project: PortalProject;
  brandName: string;
  brandColor: string;
  brandLogo: string;
  canEditDossier: boolean;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-600"><LocalizedText text={"Visión del proyecto"} /></p>
          <h2 className="mt-2 text-xl font-extrabold text-slate-950"><LocalizedText text={"Una presentación lista para vender"} /></h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">{project.description}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {project.highlights.map((highlight) => (
            <div key={highlight} className="flex items-start gap-3 rounded-xl bg-blue-50 p-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <span className="text-xs font-semibold leading-5 text-slate-700">{highlight}</span>
            </div>
          ))}
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-slate-900"><LocalizedText text={"Amenidades"} /></h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {project.amenities.map((amenity) => (
              <span key={amenity} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[10px] font-bold text-slate-600">
                <AmenityIcon name={amenity} className="h-3.5 w-3.5 text-blue-600" />{amenity}
              </span>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-slate-900"><LocalizedText text={"Plan de pago"} /></h3>
          <div className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-100">
            {project.paymentPlan.map((step) => (
              <div key={step.label} className="flex items-center justify-between px-4 py-3 text-xs">
                <span className="font-semibold text-slate-600">{step.label}</span>
                <span className="font-extrabold text-blue-600">{step.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="overflow-hidden rounded-2xl text-white shadow-lg" style={{ backgroundColor: brandColor }}>
          <div className="p-5">
            <div className="flex items-center justify-between">
              <BrandImage src={brandLogo} name={brandName} inverted />
              <span className="text-[8px] font-bold uppercase tracking-[0.18em] text-white/60"><LocalizedText text={"Vista de marca"} /></span>
            </div>
            <div className="mt-16">
              <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-white/65"><LocalizedText text={"Dossier comercial"} /></p>
              <h3 className="mt-3 text-3xl font-extrabold tracking-tight">{project.name}</h3>
              <p className="mt-2 text-xs text-white/70">{project.location}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 border-t border-white/10 bg-black/10 p-4 text-center">
            <div>
              <p className="text-[8px] uppercase text-white/50"><LocalizedText text={"Desde"} /></p>
              <p className="mt-1 text-xs font-extrabold">{formatCurrency(project.startingPrice, project.currency)}</p>
            </div>
            <div>
              <p className="text-[8px] uppercase text-white/50"><LocalizedText text={"Entrega"} /></p>
              <p className="mt-1 text-xs font-extrabold">{project.delivery}</p>
            </div>
            <div>
              <p className="text-[8px] uppercase text-white/50"><LocalizedText text={"Disponibles"} /></p>
              <p className="mt-1 text-xs font-extrabold">{project.availableUnits}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2.5">
          {canEditDossier && (
            <Link
              href={`/portal/projects/${project.slug}/dossier`}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white py-3 text-xs font-bold text-blue-600 hover:bg-blue-50"
            >
              <Palette className="h-4 w-4" /><LocalizedText text={" Abrir editor de dossier maestro"} /></Link>
          )}
        </div>
      </div>
    </div>
  );
}

function AvailabilityTab({
  project,
  units,
  query,
  setQuery,
  exportInventory,
  customTypologies,
  canCreateProposals,
}: {
  project: PortalProject;
  units: PortalUnit[];
  query: string;
  setQuery: (value: string) => void;
  exportInventory: () => void;
  customTypologies?: Record<string, ProjectVillaTypology>;
  canCreateProposals?: boolean;
}) {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const customCols = project.customColumnsList || [];
  const hasCustom = customCols.some(column => Boolean(getProjectTypology(column,customTypologies)));
  const [selectedTypologyForModal, setSelectedTypologyForModal] = useState<ProjectVillaTypology | null>(null);

  const isVillaProject = Boolean(
    (customTypologies && Object.keys(customTypologies).length > 0) ||
    (project.typologies && project.typologies.length > 0 && customCols.length > 0)
  );

  return (
    <div className="space-y-8">
      <section id="tabla-disponibilidad" className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <label className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <UITranslationBoundary attributes={["placeholder"]}><input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar unidad, solar o modelo..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-xs outline-none focus:border-blue-400"
            /></UITranslationBoundary>
          </label>

          {/* Toggle Tarjetas / Lista */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition',
                viewMode === 'cards'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span><LocalizedText text={"Tarjetas"} /></span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition',
                viewMode === 'table'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              )}
            >
              <List className="h-3.5 w-3.5" />
              <span><LocalizedText text={"Lista"} /></span>
            </button>
          </div>

          <span className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-[10px] font-bold text-blue-700">
            <Clock3 className="h-3.5 w-3.5" /><LocalizedText text={" Actualizado "} />{project.updatedAt}
          </span>
          <button
            type="button"
            onClick={exportInventory}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" /><LocalizedText text={" Exportar CSV"} /></button>
        </div>

        {units.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Search className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            <p className="font-bold text-slate-600 text-sm"><LocalizedText text={"No se encontraron unidades"} /></p>
            <p className="text-xs text-slate-400 mt-1"><LocalizedText text={"Prueba con otro término de búsqueda o limpia el filtro."} /></p>
          </div>
        ) : viewMode === 'cards' ? (
          /* Card Grid View (Ideal for mobile & desktop) */
          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 sm:p-6 bg-slate-50/40">
            {units.map((unit) => {
              // Find solar / m2 column if present
              const solarCol = customCols.find((col) => col.toUpperCase().includes('METRO') || col.toUpperCase().includes('M2'));
              const solarValue = solarCol ? resolveCustomValue(unit.customColumns, solarCol) : null;

              return (
                <article
                  key={unit.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-300 hover:shadow-md transition"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400"><LocalizedText text={"Unidad"} /></span>
                        <h4 className="text-base font-black text-blue-700">{unit.unit}</h4>
                      </div>
                      <UnitStatus value={unit.status} />
                    </div>

                    {solarValue && (
                      <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs">
                        <span className="font-bold text-slate-500"><LocalizedText text={"Solar / Terreno"} /></span>
                        <span className="font-extrabold text-slate-900">{solarValue}</span>
                      </div>
                    )}

                    {hasCustom ? (
                      <div className="mt-3 space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400"><LocalizedText text={"Modelos &amp; Precios"} /></p>
                        <div className="space-y-1.5">
                          {customCols
                            .filter((col) => !col.toUpperCase().includes('METRO') && !col.toUpperCase().includes('M2'))
                            .map((col) => {
                              const val = resolveCustomValue(unit.customColumns, col);
                              const isPrice = val.includes('$') || val.includes('USD');
                              const typology = getProjectTypology(col, customTypologies);

                              return (
                                <div
                                  key={col}
                                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-2 text-xs"
                                >
                                  <div>
                                    <span className="font-extrabold text-slate-800">
                                      {typology?.name || col}
                                    </span>
                                    {typology && (
                                      <button
                                        type="button"
                                        onClick={() => setSelectedTypologyForModal(typology)}
                                        className="inline-flex items-center gap-1 text-[9px] font-bold text-blue-600 hover:underline"
                                      >
                                        <span><LocalizedText text={"Ver plano"} /></span><Map className="h-3 w-3" aria-hidden="true" />
                                      </button>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <span className={cn('block text-xs', isPrice ? 'font-black text-slate-950' : 'text-slate-600')}>
                                      {val}
                                    </span>
                                    {isPrice && unit.status === 'Disponible' && (
                                      <Link
                                        href={`/portal/proposals/new?project=${project.slug}&unit=${unit.id}&typology=${col}`}
                                        className="text-[9px] font-bold text-blue-600 hover:underline"
                                      ><LocalizedText text={"Cotizar →"} /></Link>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-xl bg-slate-50 p-2.5">
                          <span className="text-[9px] font-bold uppercase text-slate-400"><LocalizedText text={"Torre / Nivel"} /></span>
                          <p className="mt-0.5 font-bold text-slate-800">{unit.tower} · {unit.floor}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-2.5">
                          <span className="text-[9px] font-bold uppercase text-slate-400"><LocalizedText text={"Tipología"} /></span>
                          <p className="mt-0.5 font-bold text-slate-800 flex items-center gap-1">
                            <BedDouble className="h-3.5 w-3.5 text-blue-600" />
                            <span>{unit.type}</span>
                          </p>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-2.5">
                          <span className="text-[9px] font-bold uppercase text-slate-400"><LocalizedText text={"Área"} /></span>
                          <p className="mt-0.5 font-bold text-slate-800">{unit.area}<LocalizedText text={" m²"} /></p>
                        </div>
                        <div className="rounded-xl bg-blue-50/50 p-2.5">
                          <span className="text-[9px] font-bold uppercase text-blue-600"><LocalizedText text={"Precio"} /></span>
                          <p className="mt-0.5 font-black text-blue-700">{formatCurrency(unit.price, unit.currency)}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 border-t border-slate-100 pt-3">
                    {unit.status === 'Disponible' && canCreateProposals ? (
                      <Link
                        href={`/portal/proposals/new?project=${encodeURIComponent(project.slug)}&units=${encodeURIComponent(unit.id)}`}
                        className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span><LocalizedText text={" Crear propuesta"} /></span>
                      </Link>
                    ) : (
                      <div className="text-center text-[11px] font-semibold text-slate-400 py-2">
                        {unit.status === 'Separada' ? <LocalizedText text={"Unidad reservada"} /> : <LocalizedText text={"No disponible"} />}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3.5 font-black text-slate-800"><LocalizedText text={"Unidad (Solar)"} /></th>
                  {hasCustom ? (
                    customCols.map((col) => {
                      const typology = getProjectTypology(col, customTypologies);
                      const isSolarCol = col.toUpperCase().includes('METRO') || col.toUpperCase().includes('M2');

                      if (typology) {
                        return (
                          <th key={col} className="px-5 py-3.5">
                            <div className="flex flex-col gap-1">
                              <span className="font-black text-slate-900 text-[11px] normal-case">
                                {typology.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => setSelectedTypologyForModal(typology)}
                                className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[9px] font-extrabold text-blue-700 hover:bg-blue-100 hover:text-blue-900 transition border border-blue-200 cursor-pointer w-fit"
                                title={`Ver metraje (${typology.constructionAreaSqm} m²) y plano de ${typology.name}`}
                              >
                                <Info className="h-2.5 w-2.5" />
                                <span><LocalizedText text={"Ver detalles y plano"} /></span>
                              </button>
                            </div>
                          </th>
                        );
                      }

                      return (
                        <th key={col} className="px-5 py-3.5">
                          {isSolarCol ? (
                            <div className="flex flex-col">
                              <span className="font-extrabold text-slate-800"><LocalizedText text={"Solar (Terreno)"} /></span>
                              <span className="text-[8px] text-slate-400 font-semibold lowercase"><LocalizedText text={"m² privativos"} /></span>
                            </div>
                          ) : (
                            <span className="capitalize">{col.toLowerCase()}</span>
                          )}
                        </th>
                      );
                    })
                  ) : (
                    <>
                      <th className="px-5 py-3.5"><LocalizedText text={"Torre / Nivel"} /></th>
                      <th className="px-5 py-3.5"><LocalizedText text={"Tipología"} /></th>
                      <th className="px-5 py-3.5"><LocalizedText text={"Área"} /></th>
                      <th className="px-5 py-3.5"><LocalizedText text={"Precio"} /></th>
                    </>
                  )}
                  <th className="px-5 py-3.5"><LocalizedText text={"Estado"} /></th>
                  <th className="px-5 py-3.5 text-right"><LocalizedText text={"Propuesta"} /></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {units.map((unit) => (
                  <tr key={unit.id} className="text-xs hover:bg-slate-50/70 transition">
                    <td className="px-5 py-4 font-black text-blue-700 whitespace-nowrap">
                      {unit.unit}
                    </td>
                    {hasCustom ? (
                      customCols.map((col) => {
                        const val = resolveCustomValue(unit.customColumns, col);
                        const isPrice = val.includes('$') || val.includes('USD');
                        const isSolarCol = col.toUpperCase().includes('METRO') || col.toUpperCase().includes('M2');
                        const typology = getProjectTypology(col, customTypologies);

                        if (isSolarCol) {
                          return (
                            <td key={col} className="px-5 py-4 font-black text-slate-800 whitespace-nowrap">
                              <span className="rounded-lg bg-slate-100 px-2 py-1 border border-slate-200/80">
                                {val}
                              </span>
                            </td>
                          );
                        }

                        if (typology && isPrice) {
                          return (
                            <td key={col} className="px-5 py-4 whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="font-black text-slate-950 text-xs">{val}</span>
                                {unit.status === 'Disponible' && (
                                  <Link
                                    href={`/portal/proposals/new?project=${project.slug}&unit=${unit.id}&typology=${col}`}
                                    className="text-[9px] font-bold text-blue-600 hover:underline mt-0.5"
                                  ><LocalizedText text={"Cotizar "} />{typology.name} →
                                  </Link>
                                )}
                              </div>
                            </td>
                          );
                        }

                        return (
                          <td key={col} className={cn('px-5 py-4', isPrice ? 'font-black text-slate-900' : 'text-slate-600')}>
                            {val}
                          </td>
                        );
                      })
                    ) : (
                      <>
                        <td className="px-5 py-4 text-slate-600">{unit.tower} · {unit.floor}</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                            <BedDouble className="h-3.5 w-3.5" /> {unit.type}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-500">{unit.area}<LocalizedText text={" m²"} /></td>
                        <td className="px-5 py-4 font-extrabold text-slate-900">{formatCurrency(unit.price, unit.currency)}</td>
                      </>
                    )}
                    <td className="px-5 py-4">
                      <UnitStatus value={unit.status} />
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      {unit.status === 'Disponible' && canCreateProposals ? (
                        <Link
                          href={`/portal/proposals/new?project=${encodeURIComponent(project.slug)}&units=${encodeURIComponent(unit.id)}`}
                          className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3 py-1.5 text-[10px] font-extrabold text-white shadow-xs hover:bg-blue-700 transition"
                        >
                          <FileText className="h-3 w-3" />
                          <span><LocalizedText text={" Crear propuesta"} /></span>
                        </Link>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-400"><LocalizedText text={"No disponible"} /></span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Reference Section of Villa Typologies & Architectural Floor Plans */}
      {isVillaProject && (
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-50/60 to-white p-6 sm:p-8 shadow-xs">
          <TypologyShowcaseCards
            customTypologies={customTypologies}
            onSelectTypology={(t) => setSelectedTypologyForModal(t)}
          />
        </div>
      )}

      {/* Modal with Architectural Floor Plan and Specs */}
      <TypologyDetailModal
        typology={selectedTypologyForModal}
        isOpen={!!selectedTypologyForModal}
        onClose={() => setSelectedTypologyForModal(null)}
        onScrollToTable={() => {
          document.getElementById('tabla-disponibilidad')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />
    </div>
  );
}

function LotViewerTab({ project }: { project: PortalProject }) {
  const [lots, setLots] = useState<PortalLot[]>(project.lots);
  const [selectedLot, setSelectedLot] = useState<PortalLot | null>(null);

  function handleReserved(lotId: string) {
    setLots((prev) => prev.map((lot) => (lot.id === lotId ? { ...lot, status: 'Separada' } : lot)));
  }

  if (lots.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p className="text-sm font-bold text-slate-600"><LocalizedText text={"Este proyecto todavía no tiene lotes cargados."} /></p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-[10px] font-bold text-slate-600 shadow-sm">
        <UITranslationBoundary attributes={["label"]}><LotLegend color="#16a34a" label="Disponible" /></UITranslationBoundary>
        <UITranslationBoundary attributes={["label"]}><LotLegend color="#f59e0b" label="Separado" /></UITranslationBoundary>
        <UITranslationBoundary attributes={["label"]}><LotLegend color="#64748b" label="Vendido" /></UITranslationBoundary>
        <span className="ml-auto text-slate-400">{lots.length}<LocalizedText text={" lotes · haz clic sobre uno para ver la ficha técnica"} /></span>
      </div>
      <div className="h-[520px] overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
        <LotMap lots={lots} selectedLotId={selectedLot?.id ?? null} onSelectLot={setSelectedLot} />
      </div>
      {selectedLot && (
        <LotTechnicalCard
          lot={lots.find((lot) => lot.id === selectedLot.id) ?? selectedLot}
          projectSlug={project.slug}
          onClose={() => setSelectedLot(null)}
          onReserved={handleReserved}
        />
      )}
    </section>
  );
}

function LotLegend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function ClientReportModal({ project, onClose }: { project: PortalProject; onClose: () => void }) {
  const [phoneError, setPhoneError] = useState('');
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const digits = String(data.get('phone') || '').replace(/\D/g, '');
    if (digits.length < 4 || digits.length > 15) { setPhoneError('Escribe el número completo o solamente sus últimos 4 dígitos.'); return; }
    setPhoneError('El reporte requiere iniciar sesión. No se almacenaron datos personales en este navegador.');
  }
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-4 backdrop-blur-sm" role="dialog" aria-modal="true"><div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl"><div className="flex items-start justify-between border-b border-slate-100 p-5"><div><h2 className="text-lg font-extrabold text-slate-950"><LocalizedText text={" Reportar cliente"} /></h2><p className="mt-1 text-xs text-slate-500">{project.name}</p></div><UITranslationBoundary attributes={["aria-label"]}><button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Cerrar"><X className="h-5 w-5" /></button></UITranslationBoundary></div><form onSubmit={submit} className="space-y-4 p-5"><UITranslationBoundary attributes={["label","placeholder"]}><Field icon={UserPlus} label="Nombre completo" name="name" placeholder="Ej. Laura Pérez" required /></UITranslationBoundary><UITranslationBoundary attributes={["label","placeholder"]}><Field icon={Phone} label="Teléfono o últimos 4 dígitos" name="phone" placeholder="Ej. +1 809 555 0144 o 0144" required /></UITranslationBoundary><p className={cn('-mt-2 text-[10px]', phoneError ? 'text-red-600' : 'text-slate-400')}>{phoneError || 'Acepta el número completo o sus últimos cuatro dígitos.'}</p><UITranslationBoundary attributes={["label","placeholder"]}><Field icon={Mail} label="Correo electrónico" name="email" type="email" placeholder="laura@email.com" required /></UITranslationBoundary><div className="rounded-xl bg-blue-50 p-3 text-[10px] leading-5 text-slate-600"><strong className="text-blue-700"><LocalizedText text={"Privacidad:"} /></strong><LocalizedText text={" no se solicitarán presupuesto, documento de identidad ni datos adicionales en este paso."} /></div><button type="submit" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-xs font-bold text-white"><UserPlus className="h-4 w-4" /><LocalizedText text={" Reportar y continuar"} /></button></form></div></div>;
}

function UnitStatus({ value }: { value: PortalUnit['status'] }) { return <span className={cn('rounded-lg px-2.5 py-1.5 text-[9px] font-extrabold uppercase', value === 'Disponible' ? 'bg-blue-600 text-white' : value === 'Separada' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500')}>{value}</span>; }

function Field({ icon: Icon, label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; icon: typeof Mail }) { return <label className="block"><span className="mb-1.5 block text-[11px] font-bold text-slate-700">{label}</span><span className="relative block"><Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input {...props} className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-3 text-xs outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" /></span></label>; }

function BrandImage({ src, name, inverted = false }: { src: string; name: string; inverted?: boolean }) { const classes = cn('object-contain object-left', inverted && 'brightness-0 invert'); return src.startsWith('data:') ? <img src={src} alt={name} className={cn('h-12 max-w-[190px]', classes)} /> : <span className="relative block h-12 w-48"><Image src={src} alt={name} fill sizes="192px" className={classes} /></span>; }
