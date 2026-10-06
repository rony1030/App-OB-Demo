'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { AlertCircle, Boxes, Building2, Check, CheckCircle2, ChevronDown, CircleDollarSign, Edit3, ExternalLink, Eye, EyeOff, FileSpreadsheet, FileText, Info, Layers3, Palette, Plus, RefreshCw, Search, SlidersHorizontal, Table2, Trash2, X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { cn, formatCurrency } from '@/lib/utils';
import { requestConfirmation } from '@/components/feedback/AppNotifications';
import { compareUnitCodes } from '@/lib/unit-code';
import type { PortalProject, PortalUnitStatus } from '@/lib/portal-projects';
import { addNewUnitAction, deleteUnitAction, updateUnitAvailabilityAction, toggleUnitVisibilityAction, syncGoogleSheetInventory, syncAlterEstateInventory, deleteDemoProjectAction, deleteAllDemoDataAction } from '@/app/portal/admin/projects/actions';
import { getProjectTypology, type ProjectVillaTypology } from '@/lib/data/cipres-typologies';
import TypologyDetailModal from '../TypologyDetailModal';
import TypologyShowcaseCards from '../TypologyShowcaseCards';
import ProjectEditor from './ProjectEditor';
import CommissionPlanEditor from './CommissionPlanEditor';

function resolveCustomValue(customColumns?: Record<string, unknown>, colName?: string): string {
  if (!customColumns || !colName) return '—';
  const directValue = customColumns[colName];
  if (typeof directValue === 'string' && directValue.trim() !== '') return directValue;
  if (typeof directValue === 'number' && Number.isFinite(directValue)) return String(directValue);
  const target = colName.trim().toUpperCase();
  for (const [k, v] of Object.entries(customColumns)) {
    const cleanK = k.trim().toUpperCase();
    const val = typeof v === 'string' ? v.trim() : typeof v === 'number' && Number.isFinite(v) ? String(v) : '';
    if ((cleanK === target || cleanK.includes(target) || target.includes(cleanK)) && val !== '') {
      return val;
    }
  }
  return '—';
}

type UnitStatus = 'available' | 'separated' | 'sold' | 'blocked';

const statusMapToPortal: Record<UnitStatus, PortalUnitStatus> = {
  available: 'Disponible',
  separated: 'Separada',
  sold: 'Vendida',
  blocked: 'Bloqueada',
};

const statusConfig: Record<
  UnitStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  available: {
    label: 'Disponible',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  separated: {
    label: 'Separada / Reservada',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  sold: {
    label: 'Vendida',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
  },
  blocked: {
    label: 'Bloqueada',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
  },
};

export default function AdminProjectsManager({
  projects: initialProjects,
  projectTypologies = {},
  orgSlug = 'default',
  crmReservedUnitIds = [],
}: {
  projects: PortalProject[];
  projectTypologies?: Record<number, Record<string, ProjectVillaTypology>>;
  orgSlug?: string;
  crmReservedUnitIds?: string[];
}) {
  const [projects, setProjects] = useState(initialProjects);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState('all');
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const searchParams = useSearchParams();

  // Initialize activeProjectId with persistence priority: URL query -> localStorage -> first project
  const [activeProjectId, setActiveProjectId] = useState<number | null>(() => {
    const requestedId = Number(searchParams.get('project'));
    const requestedSlug = searchParams.get('slug');
    let savedSlug: string | null = null;
    if (typeof window !== 'undefined') {
      try {
        savedSlug = localStorage.getItem('ob_admin_selected_project_slug');
      } catch {}
    }
    const matched =
      projects.find((project) => project.slug === requestedSlug) ??
      projects.find((project) => project.id === requestedId) ??
      (savedSlug ? projects.find((project) => project.slug === savedSlug) : null) ??
      projects[0];
    return matched?.id ?? null;
  });

  const [activeTabMode, setActiveTabMode] = useState<'inventory' | 'edit' | 'commissions'>(() => {
    const tab = searchParams.get('tab');
    if (tab === 'edit') return 'edit';
    if (tab === 'commissions') return 'commissions';
    return 'inventory';
  });

  // Keep internal projects in sync if initialProjects change from parent
  useEffect(() => {
    let active = true;
    queueMicrotask(() => { if (active) setProjects(initialProjects); });
    return () => { active = false; };
  }, [initialProjects]);

  // Keep the editor selection correct when Next reuses this client component
  // during a query-string navigation from a project's edit link.
  const requestedSlug = searchParams.get('slug');
  const requestedProjectId = Number(searchParams.get('project'));
  const requestedTab = searchParams.get('tab');
  useEffect(() => {
    const requestedProject = projects.find((project) => project.slug === requestedSlug)
      ?? projects.find((project) => project.id === requestedProjectId);
    if (!requestedProject) return;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setActiveProjectId((current) => current === requestedProject.id ? current : requestedProject.id);
      if (requestedTab === 'edit') setActiveTabMode('edit');
    });
    return () => { active = false; };
  }, [projects, requestedProjectId, requestedSlug, requestedTab]);

  // Filter visibility: all, visible only, hidden only
  const [rowVisibilityFilter, setRowVisibilityFilter] = useState<'all' | 'visible' | 'hidden'>('all');

  // Column visibility settings (by column name)
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [isColumnPickerOpen, setIsColumnPickerOpen] = useState(false);

  // Unit creation state
  const [isAddingUnit, setIsAddingUnit] = useState(false);
  const [newUnitCode, setNewUnitCode] = useState('');
  const [newUnitPrice, setNewUnitPrice] = useState('185000');
  const [newUnitFloor, setNewUnitFloor] = useState('1');
  const [newUnitStatus, setNewUnitStatus] = useState<UnitStatus>('available');

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const handleDeleteDemo = async () => {
    if (!activeProject || !/^demo\b/i.test(activeProject.name.trim())) return;
    if (!(await requestConfirmation(`Eliminar definitivamente el proyecto demo “${activeProject.name}” y sus datos asociados? Esta acción no se puede deshacer.`))) return;
    startTransition(async () => {
      const result = await deleteDemoProjectAction(activeProject.id);
      if (result.error) {
        setFeedback({ type: 'error', message: result.error });
        return;
      }
      setProjects((current) => current.filter((project) => project.id !== activeProject.id));
      setActiveProjectId(null);
      setFeedback({ type: 'success', message: 'Proyecto demo eliminado correctamente.' });
    });
  };

  const handleDeleteAllDemoData = async () => {
    if (!(await requestConfirmation('Eliminar todos los proyectos, leads, organizaciones y registros identificados como DEMO? Palm View y los proyectos reales no serán tocados. Esta acción no se puede deshacer.'))) return;
    startTransition(async () => {
      const result = await deleteAllDemoDataAction();
      if (result.error) {
        setFeedback({ type: 'error', message: result.error });
        return;
      }
      setProjects((current) => current.filter((project) => !/^demo\b/i.test(project.name.trim()) && !/^demo[-_]/i.test(project.slug.trim())));
      setActiveProjectId(null);
      setFeedback({ type: 'success', message: `Limpieza DEMO completada. Registros principales eliminados: ${result.removed || 0}.` });
    });
  };

  const activeProject = projects.find((p) => p.id === activeProjectId);
  const isLocalPreview = activeProject?.isLocalPreview === true;
  const [selectedTypologyForModal, setSelectedTypologyForModal] = useState<ProjectVillaTypology | null>(null);

  const [sheetInputUrl, setSheetInputUrl] = useState(
    activeProject?.googleSheetUrl ||
      (activeProject?.id === 13 ? 'https://drive.google.com/file/d/1KUP2lrksFu_ZPmVlDCRB1Euy1loLtGqL/view' : '')
  );

  const selectProject = (project: PortalProject) => {
    setActiveProjectId(project.id);
    setIsSelectorOpen(false);
    setSheetInputUrl(
      project.googleSheetUrl ||
        (project.id === 13
          ? 'https://drive.google.com/file/d/1KUP2lrksFu_ZPmVlDCRB1Euy1loLtGqL/view'
          : '')
    );
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('ob_admin_selected_project_slug', project.slug);
        const url = new URL(window.location.href);
        url.searchParams.set('slug', project.slug);
        url.searchParams.delete('project');
        window.history.replaceState(null, '', url.toString());
      } catch {}
    }
  };

  // Sync selected project slug to URL and localStorage whenever activeProject changes
  useEffect(() => {
    if (activeProject && typeof window !== 'undefined') {
      try {
        localStorage.setItem('ob_admin_selected_project_slug', activeProject.slug);
        const url = new URL(window.location.href);
        if (url.searchParams.get('slug') !== activeProject.slug) {
          url.searchParams.set('slug', activeProject.slug);
          url.searchParams.delete('project');
          window.history.replaceState(null, '', url.toString());
        }
      } catch {}
    }
  }, [activeProject]);

  // Determine dynamic columns for active project
  const projectCustomColumns = activeProject?.customColumnsList || [];
  const hasCustomColumns = projectCustomColumns.length > 0;

  // Available toggleable columns
  const allToggleableColumns = hasCustomColumns
    ? projectCustomColumns
    : ['Nivel / Piso', 'Tipología', 'Precio Lista'];

  const visibleCustomColumns = allToggleableColumns.filter(
    (col) => !hiddenColumns.includes(col)
  );

  const toggleColumnVisibility = (colName: string) => {
    setHiddenColumns((prev) =>
      prev.includes(colName) ? prev.filter((c) => c !== colName) : [...prev, colName]
    );
  };

  const handleSyncGoogleSheet = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLocalPreview) {
      setFeedback({ type: 'error', message: 'La previsualización local es de solo lectura. La migración aún no escribe en Supabase.' });
      return;
    }
    if (!activeProjectId || !sheetInputUrl.trim()) return;

    startTransition(async () => {
      setFeedback(null);
      const isAlterEstate = /alterestate\.com/i.test(sheetInputUrl.trim());
      const res = isAlterEstate
        ? await syncAlterEstateInventory(activeProjectId, activeProject?.slug || '')
        : await syncGoogleSheetInventory(activeProjectId, sheetInputUrl.trim());
      if (res.error) {
        setFeedback({ type: 'error', message: res.error });
      } else {
        setFeedback({
          type: 'success',
          message: `¡Disponibilidad sincronizada exitosamente! Se procesaron ${res.count ?? 0} unidades (${res.available ?? 0} disponibles, ${'sold' in res ? res.sold ?? 0 : 0} vendidas, ${'blocked' in res ? res.blocked ?? 0 : 0} bloqueadas). Recargando vista...`,
        });
        setTimeout(() => {
          const currentSlug = activeProject?.slug;
          if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            if (currentSlug) {
              url.searchParams.set('slug', currentSlug);
              url.searchParams.delete('project');
            }
            window.location.href = url.toString();
          }
        }, 1200);
      }
    });
  };

  // Metrics
  const totalProjects = projects.length;
  const totalUnits = projects.reduce((acc, p) => acc + (p.units?.length || p.totalUnits || 0), 0);
  const availableUnits = projects.reduce(
    (acc, p) =>
      acc + (p.units ? p.units.filter((u) => u.status === 'Disponible' && u.isPublic !== false).length : p.availableUnits || 0),
    0
  );
  // Real CRM-only deals (reservations/sales with platform commissions)
  const soldOrReservedCrmCount = crmReservedUnitIds.length;
  const activeProjectCrmDeals = (activeProject?.units || []).filter((u) =>
    crmReservedUnitIds.includes(u.id)
  ).length;

  // Filter projects list
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.developer && p.developer.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesZone = selectedZone === 'all' || p.zone?.toLowerCase() === selectedZone.toLowerCase();
    return matchesSearch && matchesZone;
  });

  const zones = Array.from(new Set(projects.map((p) => p.zone).filter(Boolean)));

  // Units filtering for active project
  const projectUnits = [...(activeProject?.units || [])].sort((a, b) => compareUnitCodes(a.unit, b.unit));
  const filteredUnits = projectUnits.filter((unit) => {
    if (rowVisibilityFilter === 'visible') return unit.isPublic !== false;
    if (rowVisibilityFilter === 'hidden') return unit.isPublic === false;
    return true;
  });

  const visibleUnitsCount = projectUnits.filter((u) => u.isPublic !== false).length;
  const hiddenUnitsCount = projectUnits.filter((u) => u.isPublic === false).length;

  const handleStatusChange = (unitId: string | number, newStatus: UnitStatus) => {
    if (isLocalPreview) {
      setFeedback({ type: 'error', message: 'La previsualización local es de solo lectura.' });
      return;
    }
    startTransition(async () => {
      setFeedback(null);
      const res = await updateUnitAvailabilityAction(Number(unitId), newStatus);
      if (res.error) {
        setFeedback({ type: 'error', message: res.error });
      } else {
        setFeedback({ type: 'success', message: 'Disponibilidad actualizada exitosamente.' });
        setProjects((prev) =>
          prev.map((proj) => {
            if (proj.id !== activeProjectId) return proj;
            const updatedUnits = (proj.units || []).map((u) => {
              if (u.id === String(unitId)) {
                return {
                  ...u,
                  status: statusMapToPortal[newStatus],
                };
              }
              return u;
            });
            const newAvailable = updatedUnits.filter((u) => u.status === 'Disponible' && u.isPublic !== false).length;
            return {
              ...proj,
              units: updatedUnits,
              availableUnits: newAvailable,
            };
          })
        );
      }
    });
  };

  const handleToggleRowVisibility = (unitId: string, currentPublic: boolean) => {
    if (isLocalPreview) {
      setFeedback({ type: 'error', message: 'La previsualización local es de solo lectura.' });
      return;
    }
    const newVisibility = !currentPublic;
    startTransition(async () => {
      setFeedback(null);
      const res = await toggleUnitVisibilityAction(Number(unitId), newVisibility);
      if (res.error) {
        setFeedback({ type: 'error', message: res.error });
      } else {
        setFeedback({
          type: 'success',
          message: newVisibility ? 'Fila visible para brokers y público.' : 'Fila oculta del catálogo comercial.',
        });
        setProjects((prev) =>
          prev.map((proj) => {
            if (proj.id !== activeProjectId) return proj;
            const updatedUnits = (proj.units || []).map((u) =>
              u.id === unitId ? { ...u, isPublic: newVisibility } : u
            );
            const newAvailable = updatedUnits.filter((u) => u.status === 'Disponible' && u.isPublic !== false).length;
            return {
              ...proj,
              units: updatedUnits,
              availableUnits: newAvailable,
            };
          })
        );
      }
    });
  };

  const handleAddUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocalPreview) {
      setFeedback({ type: 'error', message: 'La previsualización local es de solo lectura.' });
      return;
    }
    if (!activeProjectId || !newUnitCode.trim()) return;

    startTransition(async () => {
      setFeedback(null);
      const res = await addNewUnitAction(
        activeProjectId,
        newUnitCode.trim(),
        Number(newUnitPrice) || 185000,
        newUnitStatus,
        Number(newUnitFloor) || 1
      );
      if (res.error) {
        setFeedback({ type: 'error', message: res.error });
      } else {
        setFeedback({ type: 'success', message: `Unidad ${newUnitCode} agregada exitosamente.` });
        setIsAddingUnit(false);
        setNewUnitCode('');
        setProjects((prev) =>
          prev.map((proj) => {
            if (proj.id !== activeProjectId) return proj;
            const newUnit = {
              id: String(Date.now()),
              unit: newUnitCode.trim(),
              tower: 'Torre Principal',
              floor: Number(newUnitFloor) || 1,
              type: 'Unidad Residencial',
              bedrooms: 2,
              bathrooms: 2,
              area: 85,
              price: Number(newUnitPrice) || 185000,
              status: statusMapToPortal[newUnitStatus],
              isPublic: true,
            };
            const currentUnits = proj.units || [];
            const nextUnits = [...currentUnits, newUnit];
            return {
              ...proj,
              units: nextUnits,
              totalUnits: nextUnits.length,
              availableUnits:
                newUnitStatus === 'available' ? proj.availableUnits + 1 : proj.availableUnits,
            };
          })
        );
      }
    });
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (isLocalPreview) {
      setFeedback({ type: 'error', message: 'La previsualización local es de solo lectura.' });
      return;
    }
    if (!(await requestConfirmation('¿Estás seguro de eliminar esta fila del inventario?'))) return;
    startTransition(async () => {
      const res = await deleteUnitAction(Number(unitId));
      if (res.error) {
        setFeedback({ type: 'error', message: res.error });
      } else {
        setFeedback({ type: 'success', message: 'Fila eliminada permanentemente del inventario.' });
        setProjects((prev) =>
          prev.map((proj) => {
            if (proj.id !== activeProjectId) return proj;
            const nextUnits = (proj.units || []).filter((u) => u.id !== unitId);
            return {
              ...proj,
              units: nextUnits,
              totalUnits: nextUnits.length,
              availableUnits: nextUnits.filter((u) => u.status === 'Disponible' && u.isPublic !== false).length,
            };
          })
        );
      }
    });
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-blue-700 font-extrabold text-xs uppercase tracking-wider mb-1">
            <Layers3 className="h-4 w-4 text-blue-600" />
            <span><LocalizedText text={"Supervisión &amp; Catálogo Global de Desarrollos"} /></span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl"><LocalizedText text={"Proyectos Globales"} /></h1>
          <p className="mt-1 max-w-2xl text-xs text-slate-500"><LocalizedText text={"Administra los proyectos del portafolio, ajusta columnas flexibles, oculta o elimina filas y sincroniza disponibilidad en vivo."} /></p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/portal/projects"
            className="inline-flex h-11 min-w-[170px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-center text-xs font-bold leading-tight text-slate-700 shadow-xs hover:bg-slate-50 transition"
          >
            <Eye className="h-4 w-4 text-slate-500" />
            <span><LocalizedText text={"Ver Catálogo Brokers"} /></span>
          </Link>
          <Link
            href="/portal/admin/projects/new"
            className="inline-flex h-11 min-w-[190px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-center text-xs font-extrabold leading-tight text-white shadow-md hover:bg-blue-700 transition active:scale-[0.99]"
          >
            <Plus className="h-4 w-4" />
            <span><LocalizedText text={"+ Subir Nuevo Proyecto"} /></span>
          </Link>
        </div>
      </section>

      {/* KPI Stats */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500"><LocalizedText text={"Proyectos Totales"} /></span>
            <Building2 className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-3xl font-black tracking-tight text-slate-950">{totalProjects}</div>
          <p className="mt-1 text-[11px] text-slate-500 font-medium"><LocalizedText text={"Portafolio oficial activo"} /></p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500"><LocalizedText text={"Unidades Declaradas"} /></span>
            <Boxes className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-3xl font-black tracking-tight text-slate-950">{totalUnits}</div>
          <p className="mt-1 text-[11px] text-slate-500 font-medium"><LocalizedText text={"Inventario global en sistema"} /></p>
        </div>

        <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-5 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider"><LocalizedText text={"Disponibles para Venta"} /></span>
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-black tracking-tight text-emerald-950">{availableUnits}</div>
          <p className="mt-1 text-[11px] text-emerald-700 font-medium"><LocalizedText text={"Listas para propuestas y cierre"} /></p>
        </div>

        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-5 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider"><LocalizedText text={"Separadas / Vendidas (CRM)"} /></span>
            <CircleDollarSign className="h-5 w-5 text-amber-600" />
          </div>
          <div className="text-3xl font-black tracking-tight text-amber-950">{soldOrReservedCrmCount}</div>
          <p className="mt-1 text-[11px] text-amber-700 font-medium"><LocalizedText text={"Negociaciones activas con comisión en plataforma"} /></p>
        </div>
      </section>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={cn(
            'flex items-center justify-between rounded-xl px-4 py-3 text-xs font-semibold shadow-xs',
            feedback.type === 'success'
              ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border border-rose-200 bg-rose-50 text-rose-800'
          )}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Property Selector Bar (Top-level, full-width) */}
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600"><LocalizedText text={"Desarrollo Seleccionado"} /></span>
            <div className="flex items-center gap-3 mt-1.5">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-700 border border-blue-200/80 shrink-0">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-950 flex items-center gap-2">
                  <span>{activeProject?.name || 'Selecciona un Proyecto'}</span>
                  {activeProject?.status && (
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200">
                      {activeProject.status}
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {activeProject?.developer || 'Desarrollador Oficial'} · {activeProject?.location}<LocalizedText text={" · Desde"} />{' '}
                  <strong className="text-slate-900 font-black">
                    {activeProject ? formatCurrency(activeProject.startingPrice, activeProject.currency) : '—'}
                  </strong>
                </p>
              </div>
            </div>
          </div>

          {/* Selector Switch Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSelectorOpen((prev) => !prev)}
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-xs font-extrabold text-slate-800 hover:bg-slate-100 hover:border-slate-300 transition shadow-xs cursor-pointer"
            >
              <Building2 className="h-4 w-4 text-blue-600" />
              <span><LocalizedText text={"Cambiar Proyecto ("} />{projects.length})</span>
              <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform duration-200', isSelectorOpen && 'rotate-180')} />
            </button>
          </div>
        </div>

        {/* Quick project switcher pills for 1-click switching */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1.5 border-t border-slate-100">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 shrink-0 mr-1"><LocalizedText text={"Accesos Rápidos:"} /></span>
          {projects.map((project) => {
            const isSelected = project.id === activeProjectId;
            const availCount =
              project.units?.filter((u) => u.status === 'Disponible' && u.isPublic !== false).length ??
              project.availableUnits ??
              0;
            return (
              <button
                key={project.id}
                type="button"
                onClick={() => selectProject(project)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition whitespace-nowrap shrink-0 border cursor-pointer',
                  isSelected
                    ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                )}
              >
                <span>{project.name}</span>
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.2 text-[9px] font-extrabold',
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  )}
                >
                  {availCount}<LocalizedText text={" disp."} /></span>
              </button>
            );
          })}
        </div>

        {/* Expanded Property Selector Dropdown / Search Modal */}
        {isSelectorOpen && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 space-y-3 mt-3 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <UITranslationBoundary attributes={["placeholder"]}><input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar desarrollo por nombre, zona o desarrollador..."
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs outline-none focus:border-blue-600 shadow-xs"
                  autoFocus
                /></UITranslationBoundary>
              </div>
              {zones.length > 0 && (
                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none shadow-xs"
                >
                  <option value="all"><LocalizedText text={"Todas las zonas ("} />{zones.length})</option>
                  {zones.map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Compact List of Properties */}
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-72 overflow-y-auto pr-1">
              {filteredProjects.length === 0 ? (
                <div className="col-span-full rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-xs text-slate-400"><LocalizedText text={"No se encontraron proyectos con ese criterio."} /></div>
              ) : (
                filteredProjects.map((project) => {
                  const isSelected = project.id === activeProjectId;
                  const unitsCount = project.units?.length || project.totalUnits || 0;
                  const availCount =
                    project.units?.filter((u) => u.status === 'Disponible' && u.isPublic !== false).length ??
                    project.availableUnits ??
                    0;

                  return (
                    <div
                      key={project.id}
                      onClick={() => selectProject(project)}
                      className={cn(
                        'cursor-pointer rounded-xl border p-3 transition flex items-center justify-between gap-3',
                        isSelected
                          ? 'border-blue-600 bg-blue-50/80 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs text-slate-900 truncate">
                            {project.name}
                          </span>
                          {isSelected && (
                            <Check className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {project.developer || 'Desarrollador Oficial'} · {project.location}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-[10px]">
                          <span className="font-extrabold text-blue-700">
                            {availCount} / {unitsCount}<LocalizedText text={" disp."} /></span>
                          <span className="text-slate-400">·</span>
                          <span className="font-semibold text-slate-700"><LocalizedText text={"Desde "} />{formatCurrency(project.startingPrice, project.currency)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </section>

      {/* Selected Project Full-Width Workspace */}
      {activeProject ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-6 w-full">
          {/* Project Header Bar & Full Action Menu */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-[10px] font-extrabold uppercase border border-emerald-200">
                  {isLocalPreview ? 'Vista local' : `ID: #${activeProject.id}`}
                </span>
                <span className="text-xs font-bold text-slate-400 font-mono">
                  /{activeProject.slug}
                </span>
                {activeProjectCrmDeals > 0 && (
                  <span className="rounded-full bg-amber-50 text-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 border border-amber-200">
                    {activeProjectCrmDeals}<LocalizedText text={" en negociación CRM"} /></span>
                )}
              </div>
              <h2 className="text-2xl font-black text-slate-950">{activeProject.name}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeProject.location}<LocalizedText text={" · Comisiones: "} />{activeProject.commission}%
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={isLocalPreview && activeProject.sourceUrl ? activeProject.sourceUrl : `/proyectos/${activeProject.slug}`}
                target="_blank"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
              >
                <span><LocalizedText text={"Landing Pública"} /></span>
                <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
              </Link>

              {!isLocalPreview && (
                <>
                  {activeTabMode !== 'inventory' && (
                    <button
                      type="button"
                      onClick={() => setActiveTabMode('inventory')}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs cursor-pointer"
                    >
                      <Table2 className="h-3.5 w-3.5 text-slate-400" />
                      <span><LocalizedText text={"Ver Disponibilidad"} /></span>
                    </button>
                  )}
                  {activeTabMode !== 'edit' && (
                    <button
                      type="button"
                      onClick={() => setActiveTabMode('edit')}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5 text-slate-400" />
                      <span><LocalizedText text={"Editar Proyecto"} /></span>
                    </button>
                  )}
                  {activeTabMode !== 'commissions' && (
                    <button
                      type="button"
                      onClick={() => setActiveTabMode('commissions')}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs cursor-pointer"
                    >
                      <CircleDollarSign className="h-3.5 w-3.5 text-slate-400" />
                      <span><LocalizedText text={"Plan Comisiones"} /></span>
                    </button>
                  )}
                </>
              )}

              {!isLocalPreview && (
                <Link
                  href={`/portal/admin/projects/${activeProject.slug}/landing`}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                >
                  <Palette className="h-3.5 w-3.5 text-slate-400" />
                  <span><LocalizedText text={"Diseñar Landing"} /></span>
                </Link>
              )}

              {!isLocalPreview && (
                <Link
                  href={`/portal/projects/${activeProject.slug}`}
                  target="_blank"
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                >
                  <span><LocalizedText text={"Ficha Broker"} /></span>
                  <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                </Link>
              )}

              {!isLocalPreview && (
                <Link
                  href={`/portal/projects/${activeProject.slug}/dossier`}
                  target="_blank"
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                >
                  <span><LocalizedText text={"Dossier"} /></span>
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                </Link>
              )}

              {activeTabMode === 'inventory' && !isLocalPreview && (
                <button
                  type="button"
                  onClick={() => setIsAddingUnit((v) => !v)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 text-xs font-extrabold text-white shadow-xs hover:bg-blue-700 transition cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span><LocalizedText text={"Añadir Fila / Unidad"} /></span>
                </button>
              )}
            </div>
          </div>

              {/* Content: Editor, Commissions, or Inventory */}
              {activeTabMode === 'edit' && !isLocalPreview ? (
                <ProjectEditor
                  key={activeProject.id}
                  project={activeProject}
                  initialTypologies={projectTypologies[activeProject.id] || {}}
                  orgSlug={orgSlug}
                  onClose={() => setActiveTabMode('inventory')}
                />
              ) : activeTabMode === 'commissions' && !isLocalPreview ? (
                <div className="p-4">
                  <CommissionPlanEditor
                    key={activeProject.id}
                    projectId={activeProject.id}
                    projectName={activeProject.name}
                    commissionRate={activeProject.commission ?? null}
                    initialMilestones={[]}
                  />
                </div>
              ) : (
                <>
                  {/* Google Sheets / Drive Live Inventory Connection Bar */}
                  {
                    <div className="rounded-2xl border border-emerald-200/90 bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-white p-4 sm:p-5 shadow-xs space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-600 text-white shadow-xs shrink-0">
                            <FileSpreadsheet className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-900 flex items-center gap-2">
                              <span>{isLocalPreview ? activeProject.inventorySourceLabel : 'Disponibilidad oficial'}</span>
                              <span className="rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-2 py-0.5 uppercase tracking-wider">
                                {isLocalPreview ? 'Conectado · solo lectura' : 'Enlace Activo'}
                              </span>
                            </h4>
                            <p className="text-[11px] text-slate-500">
                              {isLocalPreview
                                ? <LocalizedText text={"Inventario consultado directamente desde Cana Rock para validar la migración antes de guardarla en Supabase."} />
                                : <LocalizedText text={"Usa Google Sheets para importar unidades. Los enlaces de AlterEstate se consultan externamente y no se importan como hoja."} />}
                            </p>
                          </div>
                        </div>

                        {sheetInputUrl && (
                          <a
                            href={sheetInputUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline"
                          >
                            <span><LocalizedText text={"Abrir fuente externa"} /></span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>

                      {!isLocalPreview && <form onSubmit={handleSyncGoogleSheet} className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                          <UITranslationBoundary attributes={["placeholder"]}><input
                            value={sheetInputUrl}
                            onChange={(e) => setSheetInputUrl(e.target.value)}
                            placeholder="Pega un enlace de Google Sheets o Drive para importar unidades"
                            className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 shadow-xs"
                          /></UITranslationBoundary>
                        </div>
                        <button
                          type="submit"
                          disabled={isPending || !sheetInputUrl.trim()}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-xs font-extrabold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition active:scale-[0.99] shrink-0 cursor-pointer"
                        >
                          <RefreshCw className={cn('h-3.5 w-3.5', isPending && 'animate-spin')} />
                          <span>{isPending ? 'Sincronizando...' : 'Sincronizar Disponibilidad'}</span>
                        </button>
                      </form>}
                    </div>
                  }

              {/* Add Unit Quick Drawer Form */}
              {isAddingUnit && (
                <form
                  onSubmit={handleAddUnit}
                  className="rounded-2xl border border-blue-200 bg-blue-50/40 p-5 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-900"><LocalizedText text={"Nueva Unidad en "} />{activeProject.name}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsAddingUnit(false)}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-500"><LocalizedText text={"Código / Unidad *"} /></label>
                      <UITranslationBoundary attributes={["placeholder"]}><input
                        required
                        value={newUnitCode}
                        onChange={(e) => setNewUnitCode(e.target.value)}
                        placeholder="Ej. M4 S27, U-3"
                        className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold outline-none focus:border-blue-600"
                      /></UITranslationBoundary>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-500"><LocalizedText text={"Precio Lista (USD) *"} /></label>
                      <input
                        required
                        type="number"
                        value={newUnitPrice}
                        onChange={(e) => setNewUnitPrice(e.target.value)}
                        className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold outline-none focus:border-blue-600"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-500"><LocalizedText text={"Piso / Nivel"} /></label>
                      <input
                        type="number"
                        value={newUnitFloor}
                        onChange={(e) => setNewUnitFloor(e.target.value)}
                        className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold outline-none focus:border-blue-600"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-500"><LocalizedText text={"Estado"} /></label>
                      <select
                        value={newUnitStatus}
                        onChange={(e) => setNewUnitStatus(e.target.value as UnitStatus)}
                        className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold outline-none focus:border-blue-600"
                      >
                        <option value="available"><LocalizedText text={"Disponible"} /></option>
                        <option value="separated"><LocalizedText text={"Separada"} /></option>
                        <option value="sold"><LocalizedText text={"Vendida"} /></option>
                        <option value="blocked"><LocalizedText text={"Bloqueada"} /></option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingUnit(false)}
                      className="h-8 rounded-lg px-3 text-xs font-bold text-slate-600 hover:bg-slate-200/60"
                    ><LocalizedText text={"Cancelar"} /></button>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="h-8 rounded-lg bg-blue-600 px-4 text-xs font-extrabold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isPending ? 'Guardando…' : <LocalizedText text={"Guardar Unidad"} />}
                    </button>
                  </div>
                </form>
              )}

              {/* Table Toolbar: Column Visibility Picker + Row Visibility Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                {/* Row Filter Pills */}
                <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setRowVisibilityFilter('all')}
                    className={cn(
                      'rounded-lg px-3 py-1 font-bold transition',
                      rowVisibilityFilter === 'all'
                        ? 'bg-white text-slate-950 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    )}
                  ><LocalizedText text={"Todas ("} />{projectUnits.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRowVisibilityFilter('visible')}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg px-3 py-1 font-bold transition',
                      rowVisibilityFilter === 'visible'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    )}
                  >
                    <Eye className="h-3.5 w-3.5 text-emerald-600" />
                    <span><LocalizedText text={"Visibles ("} />{visibleUnitsCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRowVisibilityFilter('hidden')}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg px-3 py-1 font-bold transition',
                      rowVisibilityFilter === 'hidden'
                        ? 'bg-white text-amber-700 shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    )}
                  >
                    <EyeOff className="h-3.5 w-3.5 text-amber-600" />
                    <span><LocalizedText text={"Ocultas ("} />{hiddenUnitsCount})</span>
                  </button>
                </div>

                {/* Column Visibility Toggle Popover */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsColumnPickerOpen((v) => !v)}
                    className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5 text-blue-600" />
                    <span><LocalizedText text={"Configurar Columnas ("} />{visibleCustomColumns.length}/{allToggleableColumns.length})</span>
                  </button>

                  {isColumnPickerOpen && (
                    <div className="absolute right-0 z-30 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-xs font-black text-slate-900"><LocalizedText text={"Mostrar / Ocultar Columnas"} /></span>
                        <button
                          type="button"
                          onClick={() => setIsColumnPickerOpen(false)}
                          className="text-slate-400 hover:text-slate-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-500"><LocalizedText text={"Marca o desmarca las columnas que deseas mostrar en la tabla de este proyecto:"} /></p>

                      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                        <div className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-400 bg-slate-50">
                          <span><LocalizedText text={"UNIDADES (Fija)"} /></span>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        </div>

                        {allToggleableColumns.map((col) => {
                          const isVisible = !hiddenColumns.includes(col);
                          return (
                            <label
                              key={col}
                              onClick={() => toggleColumnVisibility(col)}
                              className="flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-950 transition hover:bg-blue-50/50"
                            >
                              <span className="capitalize">{col.toLowerCase()}</span>
                              <input
                                type="checkbox"
                                checked={isVisible}
                                onChange={() => {}}
                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                            </label>
                          );
                        })}

                        <div className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-400 bg-slate-50">
                          <span><LocalizedText text={"ESTADO (Fija)"} /></span>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex justify-between text-[11px]">
                        <button
                          type="button"
                          onClick={() => setHiddenColumns([])}
                          className="font-bold text-blue-600 hover:underline"
                        ><LocalizedText text={"Mostrar todas"} /></button>
                        <button
                          type="button"
                          onClick={() => setIsColumnPickerOpen(false)}
                          className="font-bold text-slate-600 hover:underline"
                        ><LocalizedText text={"Listo"} /></button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Units Table with Flexible Columns */}
              <div>
                {filteredUnits.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-xs text-slate-400 space-y-2">
                    <Boxes className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="font-semibold text-slate-600">
                      {projectUnits.length === 0
                        ? <LocalizedText text={"Este proyecto no tiene unidades registradas todavía."} />
                        : 'No hay filas con el filtro seleccionado.'}
                    </p>
                    {projectUnits.length === 0 && (
                      <p className="text-[11px]"><LocalizedText text={"Pega tu enlace de Google Drive arriba y pulsa &quot;Sincronizar Disponibilidad&quot;."} /></p>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                        <tr>
                          {/* Unit Code column */}
                          <th className="px-4 py-3 font-black text-slate-800"><LocalizedText text={"Unidad"} /></th>

                          {/* Dynamic Custom Columns from Spreadsheet */}
                          {hasCustomColumns ? (
                            projectCustomColumns.map((colName) => {
                              if (hiddenColumns.includes(colName)) return null;
                              const typology = getProjectTypology(colName);
                              const isSolar = colName.toUpperCase().includes('METRO') || colName.toUpperCase().includes('M2');

                              if (typology) {
                                return (
                                  <th key={colName} className="px-4 py-3">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-black text-slate-900 text-[11px] normal-case">
                                        {typology.name}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => setSelectedTypologyForModal(typology)}
                                        className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-1.5 py-0.5 text-[9px] font-black text-blue-700 hover:bg-blue-100 hover:text-blue-900 transition border border-blue-200 cursor-pointer"
                                        title={`Ver plano y detalles de ${typology.name}`}
                                      >
                                        <Info className="h-2.5 w-2.5" />
                                        <span><LocalizedText text={"Plano 📐"} /></span>
                                      </button>
                                    </div>
                                  </th>
                                );
                              }

                              return (
                                <th key={colName} className="px-4 py-3 capitalize">
                                  {isSolar ? (
                                    <div className="flex flex-col">
                                      <span className="font-extrabold text-slate-800"><LocalizedText text={"Solar (Terreno)"} /></span>
                                      <span className="text-[8px] text-slate-400 font-semibold lowercase"><LocalizedText text={"m² solar"} /></span>
                                    </div>
                                  ) : (
                                    colName.toLowerCase()
                                  )}
                                </th>
                              );
                            })
                          ) : (
                            <>
                              {!hiddenColumns.includes('Nivel / Piso') && (
                                <th className="px-4 py-3"><LocalizedText text={"Piso / Nivel"} /></th>
                              )}
                              {!hiddenColumns.includes('Tipología') && (
                                <th className="px-4 py-3"><LocalizedText text={"Tipología"} /></th>
                              )}
                              {!hiddenColumns.includes('Precio Lista') && (
                                <th className="px-4 py-3"><LocalizedText text={"Precio Lista"} /></th>
                              )}
                            </>
                          )}

                          {/* Official Status */}
                          <th className="px-4 py-3"><LocalizedText text={"Disponibilidad"} /></th>

                          {/* Row Visibility Toggle */}
                          <th className="px-4 py-3 text-center"><LocalizedText text={"Visibilidad"} /></th>

                          {/* Actions */}
                          <th className="px-4 py-3 text-right"><LocalizedText text={"Eliminar"} /></th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {filteredUnits.map((unit) => {
                          const currentDbStatus: UnitStatus =
                            unit.status === 'Disponible'
                              ? 'available'
                              : unit.status === 'Separada'
                              ? 'separated'
                              : unit.status === 'Vendida'
                              ? 'sold'
                              : 'blocked';

                          const conf = statusConfig[currentDbStatus];
                          const isPublic = unit.isPublic !== false;

                          return (
                            <tr
                              key={unit.id}
                              className={cn(
                                'transition duration-150',
                                isPublic
                                  ? 'hover:bg-slate-50/70'
                                  : 'bg-amber-50/40 text-amber-950/70 hover:bg-amber-50/70'
                              )}
                            >
                              {/* Unit Code */}
                              <td className="px-4 py-3.5 font-extrabold text-slate-900 whitespace-nowrap">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span>{unit.unit}</span>
                                  {crmReservedUnitIds.includes(unit.id) && (
                                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black text-amber-900 border border-amber-300"><LocalizedText text={"Negociación CRM"} /></span>
                                  )}
                                  {!isPublic && (
                                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800"><LocalizedText text={"Oculta"} /></span>
                                  )}
                                </div>
                              </td>

                              {/* Dynamic Custom Columns Values */}
                              {hasCustomColumns ? (
                                projectCustomColumns.map((colName) => {
                                  if (hiddenColumns.includes(colName)) return null;
                                  const cellValue = resolveCustomValue(unit.customColumns, colName);
                                  const isPrice = cellValue.includes('$') || cellValue.includes('USD');
                                  const isSolar = colName.toUpperCase().includes('METRO') || colName.toUpperCase().includes('M2');
                                  return (
                                    <td
                                      key={colName}
                                      className={cn(
                                        'px-4 py-3.5 whitespace-nowrap',
                                        isPrice ? 'font-black text-slate-900' : isSolar ? 'font-bold text-slate-800' : 'text-slate-600'
                                      )}
                                    >
                                      {isSolar && cellValue !== '—' ? (
                                        <span className="rounded-lg bg-slate-100 px-2 py-0.5 border border-slate-200/70">{cellValue}</span>
                                      ) : (
                                        cellValue
                                      )}
                                    </td>
                                  );
                                })
                              ) : (
                                <>
                                  {!hiddenColumns.includes('Nivel / Piso') && (
                                    <td className="px-4 py-3.5 text-slate-600"><LocalizedText text={"Nivel "} />{unit.floor}
                                    </td>
                                  )}
                                  {!hiddenColumns.includes('Tipología') && (
                                    <td className="px-4 py-3.5 text-slate-600 font-medium">
                                      {unit.type}
                                    </td>
                                  )}
                                  {!hiddenColumns.includes('Precio Lista') && (
                                    <td className="px-4 py-3.5 font-extrabold text-slate-900">
                                      {formatCurrency(unit.price, unit.currency)}
                                    </td>
                                  )}
                                </>
                              )}

                              {/* Interactive Status Selector */}
                              <td className="px-4 py-3.5">
                                <select
                                  disabled={isPending || isLocalPreview}
                                  value={currentDbStatus}
                                  onChange={(e) =>
                                    handleStatusChange(unit.id, e.target.value as UnitStatus)
                                  }
                                  className={cn(
                                    'h-7 rounded-lg border px-2 text-[11px] font-extrabold outline-none cursor-pointer transition shadow-xs',
                                    conf.bg,
                                    conf.text,
                                    conf.border
                                  )}
                                >
                                  <option value="available"><LocalizedText text={"🟢 Disponible"} /></option>
                                  <option value="separated"><LocalizedText text={"🟡 Separada / Reservada"} /></option>
                                  <option value="sold"><LocalizedText text={"🔴 Vendida"} /></option>
                                  <option value="blocked"><LocalizedText text={"⚫ Bloqueada"} /></option>
                                </select>
                              </td>

                              {/* Row Visibility Toggle Button */}
                              <td className="px-4 py-3.5 text-center">
                                <UITranslationBoundary attributes={["title"]}><button
                                  type="button"
                                  disabled={isPending || isLocalPreview}
                                  onClick={() => handleToggleRowVisibility(unit.id, isPublic)}
                                  className={cn(
                                    'inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-extrabold transition shadow-2xs cursor-pointer',
                                    isPublic
                                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300'
                                  )}
                                  title={
                                    isPublic
                                      ? 'Visible para brokers y clientes. Clic para ocultar esta fila.'
                                      : 'Fila oculta del catálogo. Clic para hacerla visible.'
                                  }
                                >
                                  {isPublic ? (
                                    <>
                                      <Eye className="h-3 w-3 text-emerald-600" />
                                      <span><LocalizedText text={"Visible"} /></span>
                                    </>
                                  ) : (
                                    <>
                                      <EyeOff className="h-3 w-3 text-slate-500" />
                                      <span><LocalizedText text={"Oculta"} /></span>
                                    </>
                                  )}
                                </button></UITranslationBoundary>
                              </td>

                              {/* Delete Row Button */}
                              <td className="px-4 py-3.5 text-right">
                                <UITranslationBoundary attributes={["title"]}><button
                                  type="button"
                                  disabled={isPending || isLocalPreview}
                                  onClick={() => handleDeleteUnit(unit.id)}
                                  className="rounded-lg p-1.5 text-rose-500 transition hover:bg-rose-50 hover:text-rose-700"
                                  title="Eliminar esta fila permanentemente"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button></UITranslationBoundary>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

                {/* Typologies Showcase for Villa Projects */}
                {hasCustomColumns && (
                  <div className="pt-6 border-t border-slate-100">
                    <TypologyShowcaseCards
                      onSelectTypology={(t) => setSelectedTypologyForModal(t)}
                    />
                  </div>
                )}

                {/* Modal Viewer */}
                <TypologyDetailModal
                  typology={selectedTypologyForModal}
                  isOpen={!!selectedTypologyForModal}
                  onClose={() => setSelectedTypologyForModal(null)}
                />
              </>
              )}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 p-12 text-center text-xs text-slate-400"><LocalizedText text={"Selecciona un proyecto de la lista para supervisar sus unidades."} /></div>
          )}
    </div>
  );
}
