
import { LocalizedText } from '@/components/i18n/UITranslationBoundary';
import SimpleProposalCreator from '@/components/portal/proposals/SimpleProposalCreator';
import { getPortalProjects } from '@/lib/data/projects';
import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { Building2, Plus } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-user';
import { hasCapability } from '@/lib/auth/permissions';
import ProposalUnitChooser from '@/components/portal/proposals/ProposalUnitChooser';
import { getContacts } from '@/lib/data/crm';
import { getActiveMarketingOffersForProject } from '@/lib/data/marketing-offers';

export default async function NewProposalPage(props: { searchParams: Promise<{ project?: string; unit?: string; units?: string; selections?: string; kind?: string }> }) {
  const searchParams = await props.searchParams;
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/login?next=/portal/proposals/new');
  if (!hasCapability(currentUser.role, 'create_proposals')) redirect('/portal/projects');
  if (searchParams.kind === 'dossier' && !hasCapability(currentUser.role, 'edit_project_dossier')) redirect('/portal/proposals');

  const projects = await getPortalProjects();

  if (searchParams.kind === 'dossier' && !searchParams.project) {
    return (
      <div className="portal-enter mx-auto max-w-6xl space-y-6 py-4">
        <header>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-600"><LocalizedText text={"Dossier comercial"} /></p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl"><LocalizedText text={"Elige el proyecto para tu dossier"} /></h1>
          <p className="mt-2 text-sm text-slate-500"><LocalizedText text={"Se abrirá el dossier oficial del proyecto para personalizarlo con tu perfil, agencia y marca."} /></p>
        </header>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((item, index) => <Link key={item.id} href={`/portal/projects/${encodeURIComponent(item.slug)}/dossier`} className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-300 hover:shadow-md"><div className="relative aspect-[16/8] overflow-hidden bg-slate-100"><OptimizedImage src={item.image} alt={item.name} fill priority={index === 0} sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw" className="object-cover transition duration-300 group-hover:scale-[1.03]" /></div><div className="p-4"><p className="text-sm font-extrabold text-slate-900">{item.name}</p><p className="mt-1 text-xs text-slate-500">{item.location}</p><p className="mt-3 text-xs font-bold text-blue-700"><LocalizedText text={"Abrir dossier "} /><span aria-hidden="true">→</span></p></div></Link>)}
        </div>
      </div>
    );
  }

  if (!projects || projects.length === 0) {
    return (
      <div className="portal-enter max-w-lg mx-auto py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-700 mx-auto flex items-center justify-center shadow-xs">
          <Building2 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900"><LocalizedText text={"No hay proyectos en el catálogo"} /></h1>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed"><LocalizedText text={"Para generar propuestas comerciales interactivas en marca blanca, primero debes subir o sincronizar al menos un proyecto master."} /></p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/portal"
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
          ><LocalizedText text={"Volver al Inicio"} /></Link>
          <Link
            href="/portal/admin/projects/new"
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-xs font-extrabold text-white shadow-md hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span><LocalizedText text={"Subir Primer Proyecto"} /></span>
          </Link>
        </div>
      </div>
    );
  }

  if (!searchParams.project) {
    return (
      <div className="portal-enter mx-auto max-w-6xl space-y-6 py-4">
        <header>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-600"><LocalizedText text={"Propuesta comercial"} /></p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl"><LocalizedText text={"Elige el proyecto para tu propuesta"} /></h1>
          <p className="mt-2 text-sm text-slate-500"><LocalizedText text={"Selecciona el desarrollo y luego las unidades disponibles. Puedes incluir varias unidades, siempre que pertenezcan a la misma desarrolladora."} /></p>
        </header>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((item, index) => (
              <Link key={item.id} href={`/portal/proposals/new?project=${encodeURIComponent(item.slug)}`} className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-300 hover:shadow-md">
              <div className="relative aspect-[16/8] overflow-hidden bg-slate-100"><OptimizedImage src={item.image} alt={item.name} fill priority={index === 0} sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw" className="object-cover transition duration-300 group-hover:scale-[1.03]" /></div>
              <div className="p-4"><p className="text-sm font-extrabold text-slate-900">{item.name}</p><p className="mt-1 text-xs text-slate-500">{item.location}</p><p className="mt-3 text-xs font-bold text-blue-700"><LocalizedText text={"Crear propuesta "} /><span aria-hidden="true">→</span></p></div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  const project = projects.find((item) => item.slug === searchParams.project);
  if (!project) redirect('/portal/proposals/new');
  const selectedUnits = searchParams.units?.split(',').filter((unit) => project.units.some((item) => item.id === unit)) || (searchParams.unit ? [searchParams.unit] : []);
  const selections = searchParams.selections?.split(',').map((entry) => {
    const [unitId, typologyId] = entry.split(':');
    return { unitId, typologyId };
  }).filter((selection) => project.units.some((unit) => unit.id === selection.unitId) && project.typologies?.some((typology) => typology.id === selection.typologyId || typology.key === selection.typologyId)) || [];
  if (!selectedUnits.length && !selections.length) return <ProposalUnitChooser project={project} />;
  const [contacts, activeOffers] = await Promise.all([
    getContacts(),
    getActiveMarketingOffersForProject(project.id),
  ]);
  return <SimpleProposalCreator project={project} selectedUnitIds={selectedUnits} selectedLotTypologies={selections} recipients={contacts.map((contact) => ({ id: contact.id, fullName: contact.fullName, email: contact.email, phone: contact.phone, classification: contact.classification }))} activeOffers={activeOffers} canApplyManualDiscount={['super_admin', 'master_broker_admin'].includes(currentUser.role)} canUseDirectInvestor={['super_admin', 'master_broker_admin', 'agency_support'].includes(currentUser.role)} brokerName={currentUser.displayName} brokerPhone={currentUser.phone} brokerEmail={currentUser.email} brokerAvatarUrl={currentUser.avatarUrl} brokerProfessionalTitle={currentUser.professionalTitle} />;
}
