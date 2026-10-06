
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Building2, Plus, ShieldCheck, Users } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/get-user';
import { getAdminDashboardData } from '@/lib/data/admin';
import StatTile from '@/components/ui/StatTile';

export const revalidate = 0;

export default async function AdminBrokersPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login');
  }

  if (currentUser.role !== 'super_admin') {
    redirect('/portal/admin');
  }

  const metrics = await getAdminDashboardData();
  const organizations = metrics.organizations.filter(
    (organization) => organization.status === 'Activo' && ['master_broker', 'agency', 'developer'].includes(organization.kind)
  );
  const activeMembers = organizations.reduce((total, organization) => total + organization.usersCount, 0);

  return (
    <div className="portal-enter space-y-8 pb-16">
      {/* Header */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-blue-700 font-extrabold text-xs uppercase tracking-wider mb-1">
            <Building2 className="h-4 w-4 text-blue-600" />
            <span><LocalizedText text={"Red &amp; Licencias de Organizaciones"} /></span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl"><LocalizedText text={"Agencias, desarrolladoras y Master Brokers"} /></h1>
          <p className="mt-1 max-w-2xl text-xs text-slate-500"><LocalizedText text={"Cada empresa conserva su función. Los administradores son personas con permisos por organización y pueden pertenecer también a una agencia."} /></p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/portal/admin/brokers/new"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-xs font-extrabold text-white shadow-md hover:bg-blue-700 transition active:scale-[0.99]"
          >
            <Plus className="h-4 w-4" />
            <span><LocalizedText text={"+ Crear Master Broker"} /></span>
          </Link>
        </div>
      </section>

      {/* KPI Tiles */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <UITranslationBoundary attributes={["label"]}><StatTile
          label="Organizaciones activas"
          value={organizations.length}
          helper="Agencias, desarrolladoras y Master Brokers"
          icon={Building2}
        /></UITranslationBoundary>
        <UITranslationBoundary attributes={["label"]}><StatTile
          label="Membresías activas"
          value={activeMembers}
          helper="Una persona puede tener varias membresías"
          icon={Users}
        /></UITranslationBoundary>
        <UITranslationBoundary attributes={["label"]}><StatTile
          label="Proyectos en la red"
          value={metrics.totalProjects}
          helper="Proyectos disponibles en la red"
          icon={Building2}
        /></UITranslationBoundary>
        <UITranslationBoundary attributes={["label"]}><StatTile
          label="Supervisión Master"
          value="100%"
          helper="Sincronización activa"
          icon={ShieldCheck}
        /></UITranslationBoundary>
      </section>

      <UITranslationBoundary attributes={["aria-label"]}><section aria-label="Funciones de cada organización" className="grid gap-4 md:grid-cols-3">
        {[
          ['Agencias', 'Organizan a sus vendedores y comercializan los proyectos autorizados por sus acuerdos.'],
          ['Desarrolladoras', 'Desarrollan los proyectos y consultan los datos correspondientes a su actividad.'],
          ['Master Brokers', 'Gestionan la comercialización de proyectos y sus acuerdos mediante administradores asignados.'],
        ].map(([title, description]) => <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-sm font-extrabold text-slate-950">{title}</h2><p className="mt-2 text-xs leading-5 text-slate-600">{description}</p></div>)}

      </section></UITranslationBoundary>

      {/* Organizations Table */}
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-extrabold text-slate-900"><LocalizedText text={"Directorio de Organizaciones"} /></h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {organizations.length}<LocalizedText text={" empresas activas en la red"} /></p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-slate-50 text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
              <tr>
                <th className="px-6 py-3.5"><LocalizedText text={"Organización"} /></th>
                <th className="px-6 py-3.5"><LocalizedText text={"Tipo"} /></th>
                <th className="px-6 py-3.5"><LocalizedText text={"Membresías"} /></th>
                <th className="px-6 py-3.5"><LocalizedText text={"Relación con los proyectos"} /></th>
                <th className="px-6 py-3.5"><LocalizedText text={"Contacto"} /></th>
                <th className="px-6 py-3.5"><LocalizedText text={"Estado"} /></th>
                <th className="px-6 py-3.5 text-right"><LocalizedText text={"Acción"} /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {organizations.map((broker) => (
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
                      {({ agency: 'Agencia', developer: 'Desarrolladora', master_broker: 'Master Broker' } as Record<string, string>)[broker.kind] || broker.kind}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800">
                    {broker.usersCount}<LocalizedText text={" membresías"} /></td>
                  <td className="px-6 py-4 font-bold text-slate-800">
                    <div className="space-y-1">
                      <p>{broker.developedProjectsCount ?? 0}<LocalizedText text={" proyectos desarrollados"} /></p>
                      <p className="font-normal text-slate-600">{broker.managedProjectsCount ?? 0}<LocalizedText text={" con gestión registrada"} /></p>
                      <p className="font-normal text-slate-600">{broker.assignedProjectsCount ?? 0}<LocalizedText text={" con acceso asignado"} /></p>
                      {broker.kind === 'agency' && <p className="font-normal text-slate-600">{broker.signedAgreementsCount === undefined ? <LocalizedText text={"Acuerdos: lectura no disponible"} /> : `${broker.signedAgreementsCount} acuerdos firmados vigentes`}</p>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {broker.contactEmail || broker.contactPhone || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-lg bg-emerald-50 text-emerald-700 px-2.5 py-1 text-[9px] font-extrabold uppercase border border-emerald-200">
                      {broker.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/portal/admin/brokers/${broker.slug}`}
                      className="font-bold text-blue-600 hover:underline"
                    ><LocalizedText text={"Ver detalle →"} /></Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
