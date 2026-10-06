'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  FileCheck2, 
  Layers3, 
  Sparkles, 
  Tag, 
  Users, 
  XCircle 
} from 'lucide-react';
import StatTile from '@/components/ui/StatTile';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatCurrency } from '@/lib/utils';
import type { DeveloperOverview } from '@/lib/data/developer';

export interface DeveloperApprovalItem {
  id: string;
  type: 'fair' | 'digital_ads' | 'open_house' | 'artwork';
  title: string;
  projectName: string;
  proposedBy: string;
  budgetEstimated?: number;
  currency?: string;
  dateScheduled?: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

const mockInitialApprovals: DeveloperApprovalItem[] = [
  {
    id: 'app-01',
    type: 'fair',
    title: 'Stand Comercial en Feria Inmobiliaria Nueva York / Paterson',
    projectName: 'Costa Paraíso',
    proposedBy: 'Osvaldo Bello · Bello Valdez Enterprise',
    budgetEstimated: 4500,
    currency: 'USD',
    dateScheduled: '15 de Noviembre 2026',
    description: 'Participación y stand exclusivo con maqueta digital para captación de inversionistas de la diáspora dominicana.',
    status: 'pending',
    submittedAt: '2026-10-01',
  },
  {
    id: 'app-02',
    type: 'digital_ads',
    title: 'Fondo de Pauta Digital Meta & Google (Fase Lanzamiento)',
    projectName: 'Costa Paraíso',
    proposedBy: 'Equipo de Marketing OB Brokers',
    budgetEstimated: 2500,
    currency: 'USD',
    dateScheduled: 'Mes 1 - Octubre / Noviembre',
    description: 'Campañas de alta intención segmentadas en EE.UU., Canadá y mercado local para villas de 3 hab y apartamentos.',
    status: 'pending',
    submittedAt: '2026-10-01',
  },
  {
    id: 'app-03',
    type: 'artwork',
    title: 'Dossier Comercial y Landing Page Oficial Costa Paraíso',
    projectName: 'Costa Paraíso',
    proposedBy: 'Dirección Comercial BVE',
    budgetEstimated: 0,
    currency: 'USD',
    description: 'Aprobación de renders finales, tipologías (Villa Coral y Villa Arena) y esquema de pagos 20/30/50.',
    status: 'approved',
    submittedAt: '2026-09-25',
  },
];

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

export default function EnhancedDeveloperOverview({
  overview,
  orgName,
  readOnly,
}: {
  overview: DeveloperOverview;
  orgName: string;
  readOnly: boolean;
}) {
  const [activeTab, setActiveTab] = useState<'projects' | 'approvals'>('projects');
  const [approvals, setApprovals] = useState<DeveloperApprovalItem[]>(mockInitialApprovals);
  const [toastMessage, setToastMessage] = useState('');

  const pendingApprovalsCount = approvals.filter((a) => a.status === 'pending').length;

  const handleUpdateStatus = (id: string, newStatus: 'approved' | 'rejected') => {
    setApprovals((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
    setToastMessage(newStatus === 'approved' ? 'Solicitud aprobada exitosamente.' : 'Solicitud marcada como rechazada.');
    setTimeout(() => setToastMessage(''), 3000);
  };

  return (
    <div className="portal-enter space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-600">
            Panel de Desarrollador & Propietario
          </p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-950">{orgName}</h1>
          <p className="mt-1 text-xs text-slate-500">
            {readOnly ? 'Vista de consulta' : 'Gestiona'} proyectos, disponibilidad en vivo y aprobaciones de ferias y eventos.
          </p>
        </div>

        {/* Selector de Pestañas */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200">
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
              activeTab === 'projects'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            Tus Proyectos ({overview.projects.length})
          </button>
          <button
            onClick={() => setActiveTab('approvals')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
              activeTab === 'approvals'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCheck2 className="h-3.5 w-3.5" />
            Aprobaciones
            {pendingApprovalsCount > 0 && (
              <span className="ml-1 rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] font-black text-white">
                {pendingApprovalsCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800 animate-in fade-in">
          {toastMessage}
        </div>
      )}

      {/* Métricas Generales */}
      <section className="grid gap-4 sm:grid-cols-4">
        <StatTile label="Proyectos Activos" value={overview.totalProjects} icon={Building2} />
        <StatTile label="Unidades Disponibles" value={overview.totalUnitsAvailable} icon={Layers3} />
        <StatTile label="Master Brokers y Red" value={overview.totalActiveMasterBrokers} icon={Users} />
        <StatTile label="Aprobaciones Pendientes" value={pendingApprovalsCount} icon={FileCheck2} />
      </section>

      {/* PESTAÑA 1: PROYECTOS */}
      {activeTab === 'projects' && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-sm font-extrabold text-slate-900">Inventario y Estado de Proyectos</h2>
          </div>
          {overview.projects.length === 0 ? (
            <p className="p-8 text-center text-xs text-slate-400">
              Todavía no tienes proyectos registrados en la plataforma.
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {overview.projects.map((project) => (
                <div key={project.id} className="grid gap-3 p-4 sm:grid-cols-[1.3fr_auto_auto_auto_auto] sm:items-center">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{project.name}</p>
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      {lifecycleLabels[project.lifecycleStatus] ?? project.lifecycleStatus} · Inventario actualizado {formatUpdated(project.inventoryUpdatedAt)}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs font-bold text-slate-800">{project.availableUnits} / {project.totalUnits}</p>
                    <p className="text-[10px] text-slate-500">unidades disponibles</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <span className="font-semibold text-slate-700">{project.documentsCount}</span> documento(s)
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <span className="font-semibold text-blue-600">{project.proposalViews + project.dossierViews}</span> aperturas
                  </div>
                  <div className="flex items-center justify-between gap-2 sm:justify-end">
                    <span className="text-[10px] font-bold text-blue-700">{project.activeMasterBrokersCount} brokers</span>
                    <StatusBadge status={project.publicationStatus} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PESTAÑA 2: APROBACIONES DE FERIAS, EVENTOS Y PRESUPUESTOS (Pág. 7 y 15 de la propuesta) */}
      {activeTab === 'approvals' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Aprobación en Línea de Ferias, Eventos y Pautas</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Valida presupuestos compartidos y autoriza participaciones comerciales del comercializador exclusivo.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              Págs. 7 & 15 de la Propuesta
            </span>
          </div>

          <div className="space-y-4">
            {approvals.map((item) => (
              <div
                key={item.id}
                className={`rounded-2xl border p-5 transition ${
                  item.status === 'pending'
                    ? 'border-amber-200 bg-amber-50/20'
                    : item.status === 'approved'
                    ? 'border-emerald-200 bg-emerald-50/10'
                    : 'border-slate-200 bg-slate-50/50'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white">
                        <Tag className="h-3 w-3" />
                        {item.type === 'fair' ? 'Feria Internacional' : item.type === 'digital_ads' ? 'Pauta Digital' : 'Material Gráfico'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        Proyecto: {item.projectName}
                      </span>
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-900">{item.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">{item.description}</p>
                    <p className="text-[10px] text-slate-400 pt-1">
                      Propuesto por: <strong>{item.proposedBy}</strong> · Fecha: {item.submittedAt}
                    </p>
                  </div>

                  <div className="flex flex-col sm:items-end justify-between min-w-[140px] space-y-2">
                    {item.budgetEstimated !== undefined && item.budgetEstimated > 0 && (
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Presupuesto Estimado</span>
                        <span className="text-sm font-black text-slate-900">
                          {formatCurrency(item.budgetEstimated, item.currency || 'USD')}
                        </span>
                      </div>
                    )}

                    {/* Acciones de Aprobación */}
                    <div className="flex items-center gap-2 pt-2">
                      {item.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'approved')}
                            className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Aprobar
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(item.id, 'rejected')}
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-red-50 hover:text-red-600 transition"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Rechazar
                          </button>
                        </>
                      ) : item.status === 'approved' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          Aprobado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800">
                          <XCircle className="h-3.5 w-3.5 text-red-600" />
                          No Aprobado
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
