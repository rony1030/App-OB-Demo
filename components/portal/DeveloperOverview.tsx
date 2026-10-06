
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';
import Link from 'next/link';
import { BarChart3, Building2, FileText, Layers3, Users } from 'lucide-react';
import StatTile from '@/components/ui/StatTile';
import StatusBadge from '@/components/ui/StatusBadge';
import type { DeveloperOverview } from '@/lib/data/developer';

const lifecycleLabels: Record<string, string> = {
  pre_construction: 'Preventa',
  under_construction: 'En construcción',
  ready_to_deliver: 'Listo para entrega',
  delivered: 'Entregado',
  paused: 'Pausado',
};

function formatUpdated(value: string | null) {
  if (!value) return 'sin actualizar';
  return new Intl.DateTimeFormat('es-DO', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value));
}

export default function DeveloperOverview({ overview, orgName, readOnly }: { overview: DeveloperOverview; orgName: string; readOnly: boolean }) {
  return (
    <div className="portal-enter space-y-6">
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-600"><LocalizedText text={"Panel de desarrolladora"} /></p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-950">{orgName}</h1>
        <p className="mt-1 text-xs text-slate-500">
          {readOnly ? 'Vista de consulta' : 'Gestiona'}<LocalizedText text={" tus proyectos, disponibilidad de inventario y actividad de master brokers."} /></p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <UITranslationBoundary attributes={["label"]}><StatTile label="Proyectos" value={overview.totalProjects} icon={Building2} /></UITranslationBoundary>
        <UITranslationBoundary attributes={["label"]}><StatTile label="Unidades disponibles" value={overview.totalUnitsAvailable} icon={Layers3} /></UITranslationBoundary>
        <UITranslationBoundary attributes={["label"]}><StatTile label="Master brokers activos" value={overview.totalActiveMasterBrokers} icon={Users} /></UITranslationBoundary>
      </section>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-sm font-extrabold text-slate-900"><LocalizedText text={"Tus proyectos"} /></h2>
        </div>
        {overview.projects.length === 0 ? (
          <p className="p-8 text-center text-xs text-slate-400"><LocalizedText text={"Todavía no tienes proyectos registrados en la plataforma."} /></p>
        ) : (
          <div className="divide-y divide-slate-100">
            {overview.projects.map((project) => (
              <div key={project.id} className="grid gap-3 p-4 sm:grid-cols-[1.3fr_auto_auto_auto_auto] sm:items-center">
                <div>
                  <p className="text-xs font-bold text-slate-900">{project.name}</p>
                  <p className="mt-0.5 text-[10px] text-slate-500">
                    {lifecycleLabels[project.lifecycleStatus] ?? project.lifecycleStatus}<LocalizedText text={" · Inventario actualizado "} />{formatUpdated(project.inventoryUpdatedAt)}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs font-bold text-slate-800">{project.availableUnits} / {project.totalUnits}</p>
                  <p className="text-[10px] text-slate-500"><LocalizedText text={"unidades disponibles"} /></p>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <FileText className="h-3.5 w-3.5 text-slate-400" /> {project.documentsCount}<LocalizedText text={" documento(s)"} /></div>
                <UITranslationBoundary attributes={["title"]}><div className="flex items-center gap-1.5 text-[10px] text-slate-500" title="Interacciones de propuestas, dossiers y PDF">
                  <BarChart3 className="h-3.5 w-3.5 text-blue-500" /> {project.proposalViews + project.dossierViews}<LocalizedText text={" apertura(s) · "} />{project.pdfDownloads}<LocalizedText text={" PDF"} /></div></UITranslationBoundary>
                <div className="flex items-center justify-between gap-2 sm:justify-end">
                  <span className="text-[10px] font-bold text-blue-700">{project.activeMasterBrokersCount}<LocalizedText text={" master broker(s)"} /></span>
                  <StatusBadge status={project.publicationStatus} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!readOnly && (
        <p className="text-[11px] text-slate-400"><LocalizedText text={"¿Necesitas actualizar el inventario o subir documentos? Contacta a tu master broker — la carga de proyectos se gestiona desde"} />{' '}
          <Link href="/portal/admin" className="font-bold text-blue-600 hover:underline"><LocalizedText text={"Administración"} /></Link>.
        </p>
      )}
    </div>
  );
}
