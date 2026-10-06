
import { UITranslationBoundary } from '@/components/i18n/UITranslationBoundary';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-user';
import { getProjectReporting, getReportingOrganizations } from '@/lib/data/project-reporting';
import ProjectReportingDashboard from '@/components/portal/ProjectReportingDashboard';

export default async function MasterReportingPage({ searchParams }: { searchParams: Promise<{ organization?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/portal/master-reporting');
  const organizations = await getReportingOrganizations(user);
  if (!organizations.length) redirect('/portal');
  const requested = Number((await searchParams).organization);
  const selected = organizations.find((organization) => organization.id === requested) ?? organizations[0];
  const overview = await getProjectReporting(user, { kind: 'master', organizationId: selected.id });
  if (!overview) redirect('/portal');

  return <div className="space-y-4">
    {organizations.length > 1 && <div className="flex flex-wrap gap-2">{organizations.map((organization) => <a key={organization.id} href={`/portal/master-reporting?organization=${organization.id}`} className={`rounded-full border px-4 py-2 text-xs font-bold ${organization.id === selected.id ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'}`}>{organization.name}</a>)}</div>}
    <UITranslationBoundary attributes={["description"]}><ProjectReportingDashboard overview={overview} description="Consulta la actividad de tus proyectos asignados, los clientes reportados y el avance comercial, sin modificar el trabajo de las agencias." /></UITranslationBoundary>
  </div>;
}
