'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  Layers3,
  Plus,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import type { AdminDashboardMetrics } from '@/lib/data/admin';
import StatTile from '@/components/ui/StatTile';

export default function AdminDashboard({
  metrics,
  globalAccess,
  organizationName,
}: {
  metrics: AdminDashboardMetrics;
  globalAccess: boolean;
  organizationName: string;
}) {
  const [query, setQuery] = useState('');

  const brokerOrganizations = useMemo(
    () => metrics.organizations.filter(
      (organization) => organization.status === 'Activo' && ['master_broker', 'agency'].includes(organization.kind)
    ),
    [metrics.organizations]
  );

  const rows = useMemo(
    () =>
      brokerOrganizations.filter((broker) =>
        broker.name.toLowerCase().includes(query.toLowerCase())
      ),
    [brokerOrganizations, query]
  );

  return (
    <div className="portal-enter space-y-8">
      {/* Header */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-blue-700 font-extrabold text-xs uppercase tracking-wider mb-1">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <span>{globalAccess ? <LocalizedText text={"Panel de Control Maestro & Supervisión"} /> : <LocalizedText text={"Gestión de la organización"} />}</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            {globalAccess ? <LocalizedText text={"Administración Global"} /> : organizationName}
          </h1>
          <p className="mt-1 max-w-2xl text-xs text-slate-500">
            {globalAccess
              ? <LocalizedText text={"Gestiona las empresas de la red, sube proyectos completos y supervisa el inventario oficial."} />
              : <LocalizedText text={"Administra tu equipo, acuerdos y proyectos asignados sin exponer información de otras empresas."} />}
          </p>
        </div>

        {globalAccess && (
          <div className="flex items-center gap-3">
            <Link
              href="/portal/admin/brokers/new"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
            >
              <Building2 className="h-4 w-4 text-blue-600" />
              <span><LocalizedText text={"+ Crear Master Broker"} /></span>
            </Link>
            <Link
              href="/portal/admin/projects/new"
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-xs font-extrabold text-white shadow-md hover:bg-blue-700 transition active:scale-[0.99]"
            >
              <Plus className="h-4 w-4" />
              <span><LocalizedText text={"+ Subir Nuevo Proyecto"} /></span>
            </Link>
          </div>
        )}
      </section>

      {/* Real Live Metrics Cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <UITranslationBoundary attributes={["label"]}><StatTile
          label={globalAccess ? 'Empresas de la red' : 'Mi empresa'}
          value={brokerOrganizations.length}
          helper={globalAccess ? 'Master brokers y agencias' : organizationName}
          icon={Building2}
          href={globalAccess ? '/portal/admin/brokers' : undefined}
        /></UITranslationBoundary>
        <UITranslationBoundary attributes={["label"]}><StatTile label="Miembros de red / Brokers" value={metrics.totalUsers} helper="Brokers y administradores" icon={Users} href="/portal/admin/users" /></UITranslationBoundary>
        <UITranslationBoundary attributes={["label"]}><StatTile label="Proyectos registrados" value={metrics.totalProjects} helper="Desarrollos en portafolio" icon={Layers3} href="/portal/admin/projects" /></UITranslationBoundary>
        <UITranslationBoundary attributes={["label"]}><StatTile label="Contactos e inversionistas" value={metrics.totalContacts} helper="Cartera global en CRM" icon={UserCheck} href="/portal/clientes" /></UITranslationBoundary>
      </section>

      {/* Organizations Table (Live DB Data) */}
      <section
        id="brokers"
        className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs scroll-mt-28"
      >
        <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              {globalAccess ? 'Master Brokers y Organizaciones Registradas' : <LocalizedText text={"Resumen de tu empresa"} />}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {globalAccess
                ? `${brokerOrganizations.length} empresas activas con acceso a la red`
                : <LocalizedText text={"Información limitada a tu organización y sus asignaciones"} />}
            </p>
          </div>
          <label className="relative">
            <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <UITranslationBoundary attributes={["placeholder"]}><input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar organización..."
              className="h-10 w-64 rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-xs outline-none focus:border-blue-600 focus:bg-white"
            /></UITranslationBoundary>
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-slate-50 text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
              <tr>
                <th className="px-6 py-3.5"><LocalizedText text={"Organización"} /></th>
                <th className="px-6 py-3.5"><LocalizedText text={"Tipo"} /></th>
                <th className="px-6 py-3.5"><LocalizedText text={"Usuarios"} /></th>
                <th className="px-6 py-3.5"><LocalizedText text={"Proyectos"} /></th>
                <th className="px-6 py-3.5"><LocalizedText text={"Contacto"} /></th>
                <th className="px-6 py-3.5"><LocalizedText text={"Estado"} /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-xs text-slate-400"><LocalizedText text={"No se encontraron organizaciones. Haz clic en &quot;+ Crear Master Broker&quot; para añadir la primera."} /></td>
                </tr>
              ) : (
                rows.map((broker) => (
                  <tr key={broker.id} className="text-xs hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-100 text-xs font-black text-blue-700">
                          {broker.initials}
                        </span>
                        <div>
                          <p className="font-bold text-slate-900">{broker.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">/{broker.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[9px] font-extrabold uppercase text-slate-700">
                        {broker.kind === 'developer'
                          ? 'Developer'
                          : broker.kind === 'master_broker'
                            ? 'Master broker'
                            : broker.kind === 'partner'
                              ? 'Aliado / representante'
                            : broker.kind}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {broker.usersCount}<LocalizedText text={" brokers"} /></td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {broker.projectsCount}<LocalizedText text={" proyectos vinculados"} /></td>
                    <td className="px-6 py-4 text-slate-600">
                      {broker.contactEmail || broker.contactPhone || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-lg bg-blue-50 text-blue-700 px-2.5 py-1 text-[9px] font-extrabold uppercase">
                        {broker.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
