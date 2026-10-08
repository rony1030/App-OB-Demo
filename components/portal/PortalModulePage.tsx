'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWorkflow } from '@/lib/demo/use-workflow';
import { changeWorkflow, mergeWorkflowContacts } from '@/lib/demo/browser-workflow';
import Image from '@/components/ui/OptimizedImage';
import { notify, requestConfirmation } from '@/components/feedback/AppNotifications';
import {
  ArrowUpRight,
  Archive,
  BarChart3,
  BedDouble,
  BookOpen,
  Building2,
  Copy,
  Check,
  ChevronDown,
  Clock3,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  LayoutGrid,
  List,
  LoaderCircle,
  Mail,
  MapPin,
  MessageCircle,
  Monitor,
  Smartphone,
  Sparkles,
  Tablet,
  UserRound,
  X,
  Plus,
  Pencil,
  Search,
  Trash2,
} from 'lucide-react';
import { cn, formatCurrency, formatPortalDate } from '@/lib/utils';
import type { PortalProject } from '@/lib/portal-projects';
import type { ContactSummary } from '@/lib/data/crm';
import type { ProposalListItem, ProposalTracking } from '@/app/portal/proposals/actions';
import { archivePresentationAction, cloneProjectDossierAction, deletePresentationAction, getProposalTrackingAction, resendProposalEmailAction } from '@/app/portal/proposals/actions';
import SmartLists from '@/components/portal/crm/SmartLists';

import { useLocale } from '@/components/i18n/LocaleProvider';

const moduleCopy = {
  clientes: {
    eyebrow: {
      es: 'Relaciones comerciales · CRM Inteligente',
      en: 'Commercial Relations · Smart CRM',
      fr: 'Relations Commerciales · CRM Intelligent',
    },
    title: {
      es: 'Contactos y Smart Lists',
      en: 'Contacts & Smart Lists',
      fr: 'Contacts & Smart Lists',
    },
    description: {
      es: 'Segmenta, filtra y gestiona el ciclo 360 de tu cartera de inversionistas y compradores.',
      en: 'Segment, filter, and manage the 360 cycle of your investor and buyer portfolio.',
      fr: 'Segmentez, filtrez et gérez le cycle 360 de votre portefeuille d’investisseurs et d’acheteurs.',
    },
    action: {
      es: 'Nuevo contacto',
      en: 'New contact',
      fr: 'Nouveau contact',
    },
  },
  leads: {
    eyebrow: {
      es: 'Embudo comercial',
      en: 'Sales Funnel',
      fr: 'Entonnoir Commercial',
    },
    title: {
      es: 'Negociaciones',
      en: 'Negotiations',
      fr: 'Négociations',
    },
    description: {
      es: 'Controla cada oportunidad desde el primer contacto hasta el cierre y reserva formal.',
      en: 'Track every opportunity from first contact to closing and formal reservation.',
      fr: 'Suivez chaque opportunité du premier contact à la signature et réservation formelle.',
    },
    action: {
      es: 'Nueva oportunidad',
      en: 'New opportunity',
      fr: 'Nouvelle opportunité',
    },
  },
  projects: {
    eyebrow: {
      es: 'Portafolio asignado',
      en: 'Assigned Portfolio',
      fr: 'Portefeuille Assigné',
    },
    title: {
      es: 'Proyectos',
      en: 'Projects',
      fr: 'Projets',
    },
    description: {
      es: 'Materiales, precios y condiciones de los desarrollos autorizados para ti.',
      en: 'Marketing assets, prices, and terms of developments authorized for you.',
      fr: 'Supports, grilles tarifaires et conditions des programmes immobiliers autorisés pour vous.',
    },
    action: {
      es: 'Comparar proyectos',
      en: 'Compare projects',
      fr: 'Comparer les projets',
    },
  },
  inventory: {
    eyebrow: {
      es: 'Disponibilidad en vivo',
      en: 'Live Availability',
      fr: 'Disponibilité en Direct',
    },
    title: {
      es: 'Inventario maestro',
      en: 'Master Inventory',
      fr: 'Inventaire Principal',
    },
    description: {
      es: 'Consulta unidades, tipologías y precios por proyecto en tiempo real.',
      en: 'Check units, typologies, and prices per project in real time.',
      fr: 'Consultez les unités, typologies et prix par projet en temps réel.',
    },
    action: {
      es: 'Exportar inventario',
      en: 'Export inventory',
      fr: 'Exporter l’inventaire',
    },
  },
  proposals: {
    eyebrow: {
      es: 'Documentos comerciales',
      en: 'Commercial Documents',
      fr: 'Documents Commerciaux',
    },
    title: {
      es: 'Propuestas y dossiers',
      en: 'Proposals & Dossiers',
      fr: 'Propositions & Dossiers',
    },
    description: {
      es: 'Crea y da seguimiento a propuestas multi-proyecto personalizadas con tu marca.',
      en: 'Create and track branded multi-project proposals tailored to your clients.',
      fr: 'Créez et suivez des propositions multi-projets personnalisées avec votre marque.',
    },
    action: {
      es: 'Nueva propuesta',
      en: 'New proposal',
      fr: 'Nouvelle proposition',
    },
  },
} as const;

type ModuleKey = keyof typeof moduleCopy;

export default function PortalModulePage({
  module,
  projects,
  contacts: seedContacts = [],
  proposals: seedProposals = [],
  canCreateProposals = false,
  canEditDossiers = false,
  canEditProposals = false,
}: {
  module: ModuleKey;
  projects: PortalProject[];
  contacts?: ContactSummary[];
  proposals?: ProposalListItem[];
  canCreateProposals?: boolean;
  canEditDossiers?: boolean;
  canEditProposals?: boolean;
}) {
  const workflow = useWorkflow();
  const contacts = process.env.NEXT_PUBLIC_APP_SCOPE === 'demo' ? mergeWorkflowContacts(seedContacts, workflow.state) : seedContacts;
  const proposals = process.env.NEXT_PUBLIC_APP_SCOPE === 'demo' ? [...workflow.state.proposals, ...seedProposals.filter(item => !workflow.state.proposals.some(saved => saved.id === item.id))] : seedProposals;
  const { locale } = useLocale();
  const copyRaw = moduleCopy[module];
  const copy = {
    eyebrow: copyRaw.eyebrow[locale] || copyRaw.eyebrow.es,
    title: copyRaw.title[locale] || copyRaw.title.es,
    description: copyRaw.description[locale] || copyRaw.description.es,
    action: copyRaw.action[locale] || copyRaw.action.es,
  };
  const [notice, setNotice] = useState('');
  const [compareProjects, setCompareProjects] = useState(false);
  const [selectedProjectSlugs, setSelectedProjectSlugs] = useState<string[]>([]);

  const notify = (message: string) => {
    setNotice(message);
    setTimeout(() => setNotice(''), 2200);
  };

  const createDossierLabel = locale === 'fr' ? 'Créer un dossier' : locale === 'en' ? 'Create dossier' : 'Crear dossier';

  return (
    <div className="portal-enter space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-600">
            {copy.eyebrow}
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
            {copy.title}
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">{copy.description}</p>
        </div>

        <div className="flex items-center gap-2">
          {module === 'proposals' && canCreateProposals ? (
            <div className="flex items-center gap-2">
              {canEditDossiers && <Link href="/portal/proposals/new?kind=dossier" className="inline-flex h-11 w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-800 hover:border-blue-300 hover:text-blue-800 hover:bg-blue-50 transition"><FileText className="h-4 w-4" />{createDossierLabel}</Link>}
              <Link href="/portal/proposals/new" className="inline-flex h-11 w-fit items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition"><Plus className="h-4 w-4" />{copy.action}</Link>
            </div>
          ) : module === 'proposals' ? null : module === 'projects' ? (
            <button
              type="button"
              onClick={() => {
                setCompareProjects((current) => !current);
                setSelectedProjectSlugs([]);
              }}
              aria-pressed={compareProjects}
              className={cn(
                'inline-flex h-11 w-fit items-center gap-2 rounded-xl px-4 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                compareProjects ? 'border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100' : 'bg-blue-900 text-white hover:bg-blue-800'
              )}
            >
              {compareProjects ? <X className="h-4 w-4" /> : <BarChart3 className="h-4 w-4" />}
              {compareProjects ? (locale === 'fr' ? 'Fermer la comparaison' : locale === 'en' ? 'Close comparison' : 'Cerrar comparación') : copy.action}
            </button>
          ) : module === 'clientes' || module === 'leads' ? (
            <Link
              href="/portal/leads/new"
              className="inline-flex h-11 w-fit items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition"
            >
              <Plus className="h-4 w-4" />
              {copy.action}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => notify(`${copy.action}: preparado`)}
              className="inline-flex h-11 w-fit items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition"
            >
              {module === 'inventory' ? <Download className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {copy.action}
            </button>
          )}
        </div>
      </section>

      {/* Module Dynamic Content */}
      {module === 'clientes' ? (
        <SmartLists initialContacts={contacts} />
      ) : module === 'leads' ? (
        <PipelineBoard contacts={contacts} />
      ) : module === 'projects' ? (
        <ProjectsGrid
          projects={projects}
          compareMode={compareProjects}
          selectedSlugs={selectedProjectSlugs}
          onSelectionChange={setSelectedProjectSlugs}
        />
      ) : module === 'inventory' ? (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <InventoryTable projects={projects} />
        </section>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <ProposalsTable initialProposals={proposals} canEditDossiers={canEditDossiers} canEditProposals={canEditProposals} projects={projects} />
        </section>
      )}

      {notice && (
        <div className="fixed bottom-5 right-5 z-50 rounded-xl bg-slate-950 px-4 py-3 text-xs font-semibold text-white shadow-xl animate-in fade-in">
          {notice}
        </div>
      )}

    </div>
  );
}

function PipelineBoard({ contacts }: { contacts: ContactSummary[] }) {
  const { locale } = useLocale();
  const columnLabels: Record<string, Record<string, string>> = {
    new: { es: 'Nuevos', en: 'New', fr: 'Nouveaux' },
    qualified: { es: 'Calificados', en: 'Qualified', fr: 'Qualifiés' },
    contacted: { es: 'Contactados', en: 'Contacted', fr: 'Contactés' },
    proposal: { es: 'Propuesta enviada', en: 'Proposal sent', fr: 'Proposition envoyée' },
    negotiation: { es: 'Negociación', en: 'Negotiation', fr: 'Négociation' },
    reservation: { es: 'Reserva', en: 'Reservation', fr: 'Réservation' },
    won: { es: 'Cierre ganado', en: 'Closed won', fr: 'Gagné' },
  };
  const columns = [
    { key: 'new', label: columnLabels.new[locale] || columnLabels.new.es },
    { key: 'qualified', label: columnLabels.qualified[locale] || columnLabels.qualified.es },
    { key: 'contacted', label: columnLabels.contacted[locale] || columnLabels.contacted.es },
    { key: 'proposal', label: columnLabels.proposal[locale] || columnLabels.proposal.es },
    { key: 'negotiation', label: columnLabels.negotiation[locale] || columnLabels.negotiation.es },
    { key: 'reservation', label: columnLabels.reservation[locale] || columnLabels.reservation.es },
    { key: 'won', label: columnLabels.won[locale] || columnLabels.won.es },
  ];

  const emptyText = locale === 'fr' ? 'Aucune opportunité' : locale === 'en' ? 'No opportunities' : 'Sin oportunidades';
  const openBudgetText = locale === 'fr' ? 'Ouvert' : locale === 'en' ? 'Open' : 'Abierto';
  const noProjectText = locale === 'fr' ? 'Sans projet' : locale === 'en' ? 'No project' : 'Sin proyecto';

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {columns.map((col) => {
        const columnContacts = contacts.filter(
          (c) => (c.primaryOpportunity?.stage || 'new') === col.key
        );
        const columnTotalValue = columnContacts.reduce(
          (sum, c) => sum + (c.primaryOpportunity?.budgetMax || 0),
          0
        );

        return (
          <div
            key={col.key}
            className="flex flex-col rounded-2xl border border-slate-200 bg-slate-100/70 p-3 min-h-[420px]"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-3">
              <div>
                <p className="font-black text-xs text-slate-900 uppercase tracking-wider">
                  {col.label}
                </p>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                  {columnTotalValue > 0 ? formatCurrency(columnTotalValue) : '$0'}
                </p>
              </div>
              <span className="rounded-lg bg-white px-2 py-1 text-[10px] font-black text-blue-600 shadow-sm">
                {columnContacts.length}
              </span>
            </div>

            <div className="space-y-2.5 flex-1 overflow-y-auto custom-scrollbar">
              {columnContacts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-[11px] text-slate-400">
                  {emptyText}
                </div>
              ) : (
                columnContacts.map((c) => (
                  <Link
                    key={c.id}
                    href={`/portal/clientes/${c.publicCode}`}
                    className="block rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-extrabold text-slate-900 text-xs truncate">
                        {c.fullName}
                      </p>
                      {c.primaryOpportunity?.priority && (
                        <span
                          className={cn(
                            'rounded px-1.5 py-0.5 text-[9px] font-extrabold uppercase',
                            c.primaryOpportunity.priority === 'high'
                              ? 'bg-red-50 text-red-600'
                              : 'bg-blue-50 text-blue-600'
                          )}
                        >
                          {c.primaryOpportunity.priority}
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-[11px] text-slate-500 truncate flex items-center gap-1">
                      <Building2 className="h-3 w-3 text-blue-500 shrink-0" />
                      <span>{c.primaryOpportunity?.projectName || noProjectText}</span>
                    </p>

                    <p className="mt-2 font-mono text-[10px] font-bold tracking-wide text-slate-400">
                      {c.primaryOpportunity?.publicCode || `NEG-${c.primaryOpportunity?.id || c.id}`}
                    </p>

                    <div className="mt-3 flex items-center justify-between border-t border-slate-50 pt-2 text-[11px]">
                      <span className="font-extrabold text-blue-600">
                        {c.primaryOpportunity?.budgetMax
                          ? formatCurrency(c.primaryOpportunity.budgetMax)
                          : openBudgetText}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatPortalDate(c.updatedAt, { month: 'short', day: 'numeric' }, locale)}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function InventoryTable({ projects }: { projects: PortalProject[] }) {
  const { locale } = useLocale();
  const units = projects.flatMap((project) =>
    project.units.map((unit) => ({ ...unit, project: project.name }))
  );
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[800px] text-left">
        <thead className="bg-slate-50 text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
          <tr>
            <th className="px-5 py-3">{locale === 'fr' ? <LocalizedText text={"Unité"} /> : locale === 'en' ? 'Unit' : <LocalizedText text={"Unidad"} />}</th>
            <th className="px-5 py-3">{locale === 'fr' ? 'Projet' : locale === 'en' ? 'Project' : <LocalizedText text={"Proyecto"} />}</th>
            <th className="px-5 py-3">{locale === 'fr' ? 'Typologie' : locale === 'en' ? 'Typology' : <LocalizedText text={"Tipología"} />}</th>
            <th className="px-5 py-3">{locale === 'fr' ? 'Surface' : locale === 'en' ? 'Area' : <LocalizedText text={"Área"} />}</th>
            <th className="px-5 py-3">{locale === 'fr' ? 'Prix' : locale === 'en' ? 'Price' : <LocalizedText text={"Precio"} />}</th>
            <th className="px-5 py-3">{locale === 'fr' ? 'Statut' : locale === 'en' ? 'Status' : 'Estado'}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {units.map((unit) => (
            <tr key={`${unit.project}-${unit.id}`} className="text-xs hover:bg-slate-50/60">
              <td className="px-5 py-4 font-extrabold text-blue-600">{unit.unit}</td>
              <td className="px-5 py-4 font-semibold text-slate-800">{unit.project}</td>
              <td className="px-5 py-4">
                <span className="inline-flex items-center gap-1 text-slate-600">
                  <BedDouble className="h-3.5 w-3.5" />
                  {unit.type}
                </span>
              </td>
              <td className="px-5 py-4 text-slate-500">{unit.area}<LocalizedText text={" m²"} /></td>
              <td className="px-5 py-4 font-bold text-slate-900">{formatCurrency(unit.price)}</td>
              <td className="px-5 py-4">
                <Status value={unit.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProposalsTable({
  initialProposals,
  canEditDossiers = false,
  canEditProposals = false,
  projects = [],
}: {
  initialProposals: ProposalListItem[];
  canEditDossiers?: boolean;
  canEditProposals?: boolean;
  projects?: PortalProject[];
}) {
  const { locale } = useLocale();
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [archivedIds, setArchivedIds] = useState<number[]>([]);
  const [kindFilter, setKindFilter] = useState<'all' | 'proposal' | 'dossier'>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [isArchiving, startArchiving] = useTransition();
  const router = useRouter();
  const [tracking, setTracking] = useState<ProposalTracking | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [cloningId, setCloningId] = useState<number | null>(null);
  const [resendingId, setResendingId] = useState<number | null>(null);

  const filterTabs = [
    { value: 'all', label: locale === 'fr' ? 'Tout' : locale === 'en' ? 'All' : 'Todo' },
    { value: 'proposal', label: locale === 'fr' ? 'Propositions' : locale === 'en' ? 'Proposals' : 'Propuestas' },
    { value: 'dossier', label: locale === 'fr' ? 'Dossiers' : locale === 'en' ? 'Dossiers' : 'Dossiers' },
  ] as const;

  const handleCloneDossier = async (item: ProposalListItem) => {
    if (process.env.NEXT_PUBLIC_APP_SCOPE === 'demo') {
      const token = crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().slice(0, 8);
      // This function runs only from a click handler, never during render.
      // eslint-disable-next-line react-hooks/purity
      const clone = { ...item, id: Date.now(), sharedToken: token, sharedUrl: `/p/${token}`, title: `${item.projectName} · Dossier personalizado`, createdAt: new Date().toISOString(), viewsCount: 0 };
      changeWorkflow(state => { state.proposals.unshift(clone); });
      router.push(clone.sharedUrl); return;
    }
    try {
      setCloningId(item.id);
      const res = await cloneProjectDossierAction({
        dossierId: item.id,
        projectSlug: item.projectSlug,
      });
      setCloningId(null);
      if (res.success && res.url) {
        window.alert(
          locale === 'fr'
            ? 'Dossier personnalisé créé avec succès ! Vos coordonnées et le logo de votre agence ont été appliqués.'
            : locale === 'en'
            ? 'Personalized dossier created! Your contact details and agency logo have been applied.'
            : '¡Dossier personalizado creado con éxito! Se añadieron tus datos de contacto y el logo de tu empresa.'
        );
        router.push(res.url);
      } else {
        window.alert(res.error || (locale === 'fr' ? 'Impossible de créer le dossier personnalisé.' : locale === 'en' ? 'Could not create personalized dossier.' : 'No fue posible crear el dossier personalizado.'));
      }
    } catch (err) {
      setCloningId(null);
      console.error(err);
      window.alert('Error al procesar el dossier.');
    }
  };

  const resendEmail = async (item: ProposalListItem) => {
    if (!item.clientEmail) return;
    const confirmPrompt = locale === 'fr'
      ? `Renvoyer la proposition par e-mail à ${item.clientEmail} ?`
      : locale === 'en'
      ? `Resend proposal by email to ${item.clientEmail}?`
      : `¿Reenviar la propuesta por correo a ${item.clientEmail}?`;
    if (!(await requestConfirmation(confirmPrompt))) return;
    if (process.env.NEXT_PUBLIC_APP_SCOPE === 'demo') { notify('Propuesta enviada al cliente.', 'success'); return; }
    setResendingId(item.id);
    const result = await resendProposalEmailAction(item.id);
    setResendingId(null);
    if (result.success) {
      window.alert(locale === 'fr' ? `E-mail renvoyé à ${item.clientEmail}` : locale === 'en' ? `Email resent to ${item.clientEmail}` : `Correo reenviado a ${item.clientEmail}`);
    } else {
      window.alert(result.error || (locale === 'fr' ? 'Impossible de renvoyer l’e-mail.' : locale === 'en' ? 'Could not resend email.' : 'No fue posible reenviar el correo.'));
    }
  };

  const copyUrl = (id: number, url?: string, titleOrProject?: string) => {
    if (!url) return;
    const fullUrl = window.location.origin + url;
    const shareMessage = titleOrProject
      ? `Hola, te comparto esta propuesta de inversión de *${titleOrProject}*:\n${fullUrl}`
      : `Hola, te comparto esta propuesta de inversión:\n${fullUrl}`;
    navigator.clipboard.writeText(shareMessage);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };
  const archive = async (item: ProposalListItem) => {
    const confirmArchivePrompt = locale === 'fr'
      ? `Archiver « ${item.title} » ? Le lien n'apparaîtra plus dans le CRM mais l'historique sera préservé.`
      : locale === 'en'
      ? `Archive “${item.title}”? Link will no longer appear in CRM, but history is preserved.`
      : `¿Archivar “${item.title}”? El enlace deja de aparecer en el CRM, pero el historial queda preservado.`;
    if (!(await requestConfirmation(confirmArchivePrompt))) return;
    if (process.env.NEXT_PUBLIC_APP_SCOPE === 'demo') {
      changeWorkflow(state => { state.proposals = [{ ...item, status: 'archived' }, ...state.proposals.filter(value => value.id !== item.id)]; });
      setArchivedIds(current => [...current, item.id]); return;
    }
    startArchiving(async () => {
      const result = await archivePresentationAction(item.id);
      if (result.success) setArchivedIds((current) => [...current, item.id]);
      else window.alert(result.error || (locale === 'fr' ? 'Impossible d’archiver la proposition.' : locale === 'en' ? 'Could not archive proposal.' : 'No fue posible archivar la propuesta.'));
    });
  };
  const removePresentation = async (item: ProposalListItem) => {
    const prompt = locale === 'fr'
      ? `Supprimer définitivement ${item.kind === 'dossier' ? 'le dossier' : 'la proposition'} « ${item.title} » ? Son lien cessera de fonctionner. Cette action est irréversible.`
      : locale === 'en'
      ? `Permanently delete “${item.title}”? Its link will stop working. This cannot be undone.`
      : `¿Eliminar definitivamente ${item.kind === 'dossier' ? 'el dossier' : 'la propuesta'} “${item.title}”? Su enlace dejará de funcionar. Esta acción no se puede deshacer.`;
    if (!(await requestConfirmation(prompt))) return;
    if (process.env.NEXT_PUBLIC_APP_SCOPE === 'demo') {
      changeWorkflow(state => { state.proposals = [{ ...item, status: 'archived' }, ...state.proposals.filter(value => value.id !== item.id)]; });
      setArchivedIds(current => [...current, item.id]); return;
    }
    startArchiving(async () => {
      const result = await deletePresentationAction(item.id);
      if (result.success) setArchivedIds((current) => [...current, item.id]);
      else notify(result.error || 'No se pudo eliminar el documento.', 'error');
    });
  };
  const openTracking = async (item: ProposalListItem) => {
    if (process.env.NEXT_PUBLIC_APP_SCOPE === 'demo') {
      setTracking({ presentationId: item.id, title: item.title, kind: item.kind, clientName: item.clientName || 'Sin asignar', projectName: item.projectName || '', views: item.viewsCount || 0, pdfs: 0, shares: 0, whatsappClicks: 0, averageDurationSeconds: 0, devices: [], locations: [], activity: item.demoActivity || [] }); return;
    }
    setTrackingLoading(true);
    const result = await getProposalTrackingAction(item.id);
    setTrackingLoading(false);
    if (result.data) setTracking(result.data);
    else window.alert(result.error || 'No fue posible cargar el seguimiento.');
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const proposals = useMemo(() => {
    return initialProposals.filter((item) => {
      if (archivedIds.includes(item.id) || item.status === 'archived') return false;
      if (kindFilter !== 'all' && item.kind !== kindFilter) return false;
      if (!normalizedQuery) return true;

      const titleMatch = (item.title || '').toLowerCase().includes(normalizedQuery);
      const projectMatch = (item.projectName || '').toLowerCase().includes(normalizedQuery);
      const clientNameMatch = (item.clientName || '').toLowerCase().includes(normalizedQuery);
      const clientEmailMatch = (item.clientEmail || '').toLowerCase().includes(normalizedQuery);
      const idMatch = String(item.id).includes(normalizedQuery);
      const kindMatch = (item.kind || '').toLowerCase().includes(normalizedQuery);
      const statusMatch = (item.status || '').toLowerCase().includes(normalizedQuery);

      return (
        titleMatch ||
        projectMatch ||
        clientNameMatch ||
        clientEmailMatch ||
        idMatch ||
        kindMatch ||
        statusMatch
      );
    });
  }, [initialProposals, archivedIds, kindFilter, normalizedQuery]);

  const emptyStateConfig = {
    title: normalizedQuery
      ? locale === 'fr'
        ? `Aucun résultat pour « ${searchQuery} »`
        : locale === 'en'
        ? `No results for “${searchQuery}”`
        : `Sin resultados para “${searchQuery}”`
      : kindFilter === 'dossier'
      ? locale === 'fr'
        ? 'Aucun dossier généré'
        : locale === 'en'
        ? 'No dossiers generated'
        : 'No hay dossiers generados'
      : kindFilter === 'proposal'
      ? locale === 'fr'
        ? 'Aucune proposition générée'
        : locale === 'en'
        ? 'No proposals generated'
        : 'No hay propuestas generadas'
      : locale === 'fr'
      ? 'Aucun document généré'
      : locale === 'en'
      ? 'No documents generated'
      : 'No hay documentos generados',
    description: normalizedQuery
      ? locale === 'fr'
        ? 'Essayez de rechercher avec un autre terme ou effacez la recherche pour voir tous les documents.'
        : locale === 'en'
        ? 'Try searching with another keyword or clear the search to view all documents.'
        : 'Prueba buscando con otro término o limpia la barra de búsqueda para ver todos los documentos.'
      : kindFilter === 'dossier'
      ? locale === 'fr'
        ? 'Créez un dossier commercial interactif pour présenter les projets à vos clients.'
        : locale === 'en'
        ? 'Create an interactive commercial dossier to showcase projects to your clients.'
        : 'Crea un dossier comercial interactivo para presentar proyectos a tus clientes.'
      : kindFilter === 'proposal'
      ? locale === 'fr'
        ? 'Créez une proposition commerciale personnalisée pour vos clients depuis l’éditeur.'
        : locale === 'en'
        ? 'Create a customized commercial proposal for your clients from the editor.'
        : 'Crea una propuesta comercial personalizada para tus clientes desde el editor.'
      : locale === 'fr'
      ? 'Créez un dossier ou une proposition commerciale personnalisée pour vos clients.'
      : locale === 'en'
      ? 'Create a dossier or a customized commercial proposal for your clients.'
      : 'Crea una propuesta comercial o genera un dossier desde el catálogo.',
  };

  const renderEmptyStateButtons = () => {
    if (normalizedQuery) {
      return (
        <button
          type="button"
          onClick={() => setSearchQuery('')}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800 cursor-pointer shadow-xs"
        >
          <X className="h-3.5 w-3.5" />
          {locale === 'fr' ? 'Effacer la recherche' : locale === 'en' ? 'Clear search' : <LocalizedText text={"Limpiar búsqueda"} />}
        </button>
      );
    }
    if (kindFilter === 'dossier') {
      if (!canEditDossiers) return null;
      return (
        <Link
          href="/portal/proposals/new?kind=dossier"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700"
        >
          <FileText className="h-3.5 w-3.5" />
          {locale === 'fr' ? <LocalizedText text={"Créer un dossier"} /> : locale === 'en' ? 'Create dossier' : <LocalizedText text={"Crear dossier"} />}
        </Link>
      );
    }

    if (kindFilter === 'proposal') {
      return (
        <Link
          href="/portal/proposals/new"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700"
        >
          <Plus className="h-3.5 w-3.5" />
          {locale === 'fr' ? 'Nouvelle Proposition' : locale === 'en' ? 'New Proposal' : <LocalizedText text={"Nueva Propuesta"} />}
        </Link>
      );
    }

    return (
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {canEditDossiers && <Link
          href="/portal/proposals/new?kind=dossier"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-800 shadow-xs transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800"
        >
          <FileText className="h-3.5 w-3.5 text-slate-500" />
          {locale === 'fr' ? <LocalizedText text={"Créer un dossier"} /> : locale === 'en' ? 'Create dossier' : <LocalizedText text={"Crear dossier"} />}
        </Link>}
        <Link
          href="/portal/proposals/new"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-blue-700"
        >
          <Plus className="h-3.5 w-3.5" />
          {locale === 'fr' ? 'Nouvelle Proposition' : locale === 'en' ? 'New Proposal' : <LocalizedText text={"Nueva Propuesta"} />}
        </Link>
      </div>
    );
  };

  return (
    <div>
      <div className="flex flex-col gap-2.5 border-b border-slate-200 bg-slate-50 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Filter Tabs */}
        <div className="flex items-center gap-1.5 shrink-0">
          {filterTabs.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setKindFilter(value)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-[11px] font-extrabold transition cursor-pointer',
                kindFilter === value ? 'bg-slate-950 text-white shadow-xs' : 'text-slate-500 hover:bg-white hover:text-slate-800'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Center: Responsive Intelligent Live Search Bar */}
        <div className="relative flex-1 min-w-[200px] max-w-xl mx-0 sm:mx-3">
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-3.5 w-3.5 text-slate-400 pointer-events-none transition-colors group-focus-within:text-blue-600" />
            <UITranslationBoundary attributes={["placeholder"]}><input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                locale === 'fr'
                  ? 'Rechercher par titre, client, projet, e-mail...'
                  : locale === 'en'
                  ? 'Search by title, client, project, email...'
                  : 'Buscar por título, cliente, proyecto, correo...'
              }
              className="w-full h-8 pl-8 pr-8 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 shadow-2xs transition focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            /></UITranslationBoundary>
            {searchQuery && (
              <UITranslationBoundary attributes={["title"]}><button
                type="button"
                onClick={() => setSearchQuery('')}
                title={locale === 'fr' ? 'Effacer la recherche' : locale === 'en' ? 'Clear search' : 'Limpiar búsqueda'}
                className="absolute right-2.5 grid h-4 w-4 place-items-center rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 transition"
              >
                <X className="h-2.5 w-2.5" />
              </button></UITranslationBoundary>
            )}
          </div>
        </div>

        {/* Right: View Mode Toggle */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-0.5 shadow-2xs shrink-0 self-end sm:self-auto">
          <UITranslationBoundary attributes={["title","aria-label"]}><button
            type="button"
            onClick={() => setViewMode('cards')}
            title={locale === 'fr' ? 'Vue en cartes' : locale === 'en' ? 'Cards view' : 'Vista en tarjetas'}
            aria-label="Cards view"
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer',
              viewMode === 'cards'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{locale === 'fr' ? 'Cartes' : locale === 'en' ? 'Cards' : 'Tarjetas'}</span>
          </button></UITranslationBoundary>
          <UITranslationBoundary attributes={["title","aria-label"]}><button
            type="button"
            onClick={() => setViewMode('table')}
            title={locale === 'fr' ? 'Vue en tableau' : locale === 'en' ? 'Table view' : 'Vista en tabla'}
            aria-label="Table view"
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition cursor-pointer',
              viewMode === 'table'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            )}
          >
            <List className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{locale === 'fr' ? 'Tableau' : locale === 'en' ? 'Table' : 'Tabla'}</span>
          </button></UITranslationBoundary>
        </div>
      </div>

      {proposals.length === 0 ? (
        <div className="px-6 py-16 text-center text-slate-400">
          <FileText className="mx-auto mb-2 h-10 w-10 text-slate-300" strokeWidth={1.5} />
          <p className="text-base font-bold text-slate-700">{emptyStateConfig.title}</p>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            {emptyStateConfig.description}
          </p>
          {renderEmptyStateButtons()}
        </div>
      ) : viewMode === 'cards' ? (
        /* CARDS GRID VIEW (Default) */
        <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 lg:grid-cols-3 bg-slate-50/50">
          {proposals.map((item) => {
            const statusLabel =
              item.isMasterTemplate
                ? item.canClone ? 'Plantilla pública' : 'Plantilla privada'
                : item.status === 'accepted'
                ? 'Cliente interesado'
                : item.status === 'rejected'
                ? 'No continúa'
                : (item.sharedExpiresAt || (item.status === 'ready' && item.sharedToken))
                ? 'Enlace activo'
                : 'Borrador';

            // Find project image fallback if coverImage is not directly on item
            const projectMatch = projects.find(
              (p) =>
                (item.projectName && p.name.toLowerCase() === item.projectName.toLowerCase()) ||
                (item.projectName && p.slug.toLowerCase() === item.projectName.toLowerCase())
            );
            const coverUrl = item.coverImage || projectMatch?.image;

            return (
              <div
                key={`card-${item.id}`}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              >
                <div>
                  {/* Card Media Preview Header */}
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900">
                    {coverUrl ? (
                      <Image
                        src={coverUrl}
                        alt={item.title}
                        fill
                        unoptimized
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
                        <Building2 className="h-10 w-10 text-slate-600/50" />
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />

                    {/* Top Badges */}
                    <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-sm',
                          item.kind === 'proposal'
                            ? 'bg-blue-600/90 text-white'
                            : 'bg-indigo-600/90 text-white'
                        )}
                      >
                        {item.kind === 'proposal' ? 'Propuesta' : 'Dossier'}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {item.viewsCount !== undefined && (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-md">
                            <Eye className="h-3 w-3 text-blue-300" />
                            {item.viewsCount} {item.viewsCount === 1 ? 'apertura' : 'aperturas'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom overlay in media header */}
                    <div className="absolute bottom-3 inset-x-3 flex items-end justify-between gap-2">
                      <span className="font-mono text-[10px] font-bold text-white/75 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-md"><LocalizedText text={"ID: #"} />{item.id}
                      </span>
                      {item.projectPrice && (
                        <span className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-black text-white shadow-sm">
                          {formatCurrency(item.projectPrice)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="line-clamp-2 text-sm font-extrabold text-slate-950 group-hover:text-blue-600 transition">
                        {item.title}
                      </h3>
                      {item.projectName && (
                        <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                          <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{item.projectName}</span>
                        </div>
                      )}
                    </div>

                    {/* Recipient / Document info */}
                    {item.kind === 'dossier' ? (
                      <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-2.5">
                        <div className="flex items-center gap-2">
                          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white text-indigo-600 shadow-2xs border border-indigo-200/60">
                            <BookOpen className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700">
                              {item.isMasterTemplate
                                ? (locale === 'fr' ? 'Dossier Officiel' : locale === 'en' ? 'Official Dossier' : 'Dossier Oficial')
                                : (locale === 'fr' ? 'Dossier Personnalisé' : locale === 'en' ? 'Personalized Dossier' : 'Dossier Personalizado')}
                            </p>
                            <p className="truncate text-xs font-bold text-slate-800">
                              {item.isMasterTemplate
                                ? (locale === 'fr' ? 'Brochure officielle du projet' : locale === 'en' ? 'Official project sales brochure' : 'Brochure oficial del proyecto')
                                : (locale === 'fr' ? 'Avec vos coordonnées & marque' : locale === 'en' ? 'With your contact details & brand' : 'Con tus datos y logo de agencia')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-2.5">
                        <div className="flex items-center gap-2">
                          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white text-slate-500 shadow-2xs border border-slate-200/60">
                            <UserRound className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                              {locale === 'fr' ? 'Destinataire' : locale === 'en' ? 'Recipient' : 'Destinatario'}
                            </p>
                            <p className="truncate text-xs font-bold text-slate-800">
                              {item.clientName || 'Sin asignar'}
                            </p>
                            {item.clientEmail && (
                              <p className="truncate text-[10px] text-slate-400">{item.clientEmail}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Status & Date */}
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            'h-2 w-2 rounded-full',
                            item.status === 'accepted'
                              ? 'bg-emerald-500 ring-2 ring-emerald-100'
                              : item.status === 'rejected'
                              ? 'bg-rose-500 ring-2 ring-rose-100'
                              : (item.isMasterTemplate ? item.canClone : Boolean(item.sharedExpiresAt))
                              ? 'bg-blue-500 ring-2 ring-blue-100'
                              : 'bg-slate-300'
                          )}
                        />
                        <span
                          className={cn(
                            'font-bold text-[10px] uppercase',
                            item.status === 'accepted'
                              ? 'text-emerald-700'
                              : item.status === 'rejected'
                              ? 'text-rose-700'
                              : (item.isMasterTemplate ? item.canClone : Boolean(item.sharedExpiresAt))
                              ? 'text-blue-700'
                              : 'text-slate-400'
                          )}
                        >
                          {statusLabel}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {formatPortalDate(item.createdAt, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="flex items-center justify-between gap-1.5 border-t border-slate-100 bg-slate-50/50 p-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(item.kind === 'dossier' ? canEditDossiers : (canEditProposals || item.isOwner)) && (
                      <UITranslationBoundary attributes={["title","aria-label"]}><Link
                        href={`/portal/proposals/${item.id}/edit`}
                        title={item.kind === 'dossier' ? 'Editar dossier' : 'Editar propuesta'}
                        aria-label={item.kind === 'dossier' ? 'Editar dossier' : 'Editar propuesta'}
                        className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 shadow-2xs"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Link></UITranslationBoundary>
                    )}

                    {item.canClone && (
                      <UITranslationBoundary attributes={["title"]}><button
                        type="button"
                        onClick={() => handleCloneDossier(item)}
                        disabled={cloningId === item.id}
                        title={locale === 'fr' ? 'Créer ma version personnalisée' : locale === 'en' ? 'Personalize for me' : 'Crear para mí (Personalizar)'}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 text-xs font-bold text-indigo-700 shadow-2xs transition hover:bg-indigo-100 disabled:opacity-50"
                      >
                        {cloningId === item.id ? (
                          <LoaderCircle className="h-3.5 w-3.5 animate-spin text-indigo-600" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                        )}
                        <span>{locale === 'fr' ? <LocalizedText text={"Créer pour moi"} /> : locale === 'en' ? 'Create for me' : <LocalizedText text={"Crear para mí"} />}</span>
                      </button></UITranslationBoundary>
                    )}

                    {item.sharedUrl && (
                      <>
                        <UITranslationBoundary attributes={["title","aria-label"]}><button
                          type="button"
                          onClick={() => copyUrl(item.id, item.sharedUrl, item.projectName || item.title)}
                          title="Copiar mensaje con enlace"
                          aria-label="Copiar mensaje con enlace"
                          className={cn(
                            'grid h-8 w-8 place-items-center rounded-lg border bg-white transition shadow-2xs',
                            copiedId === item.id
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-600'
                              : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                          )}
                        >
                          {copiedId === item.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        </button></UITranslationBoundary>

                        <UITranslationBoundary attributes={["title","aria-label"]}><a
                          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                            `Hola, te comparto esta propuesta de inversión de *${item.projectName || item.title}*:\n${
                              typeof window !== 'undefined' ? window.location.origin : ''
                            }${item.sharedUrl}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Compartir por WhatsApp"
                          aria-label="Compartir por WhatsApp"
                          className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-emerald-600 transition hover:border-emerald-300 hover:bg-emerald-50 shadow-2xs"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                        </a></UITranslationBoundary>

                        <UITranslationBoundary attributes={["title","aria-label"]}><button
                          type="button"
                          onClick={() => openTracking(item)}
                          title="Ver métricas de apertura"
                          aria-label="Ver métricas de apertura"
                          className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 shadow-2xs"
                        >
                          <BarChart3 className="h-3.5 w-3.5" />
                        </button></UITranslationBoundary>

                        {item.kind === 'proposal' && item.clientEmail && (
                          <UITranslationBoundary attributes={["title","aria-label"]}><button
                            type="button"
                            onClick={() => resendEmail(item)}
                            disabled={resendingId === item.id}
                            title="Reenviar correo al cliente"
                            aria-label="Reenviar correo al cliente"
                            className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 shadow-2xs disabled:opacity-50"
                          >
                            <Mail className="h-3.5 w-3.5" />
                          </button></UITranslationBoundary>
                        )}

                      </>
                    )}
                    {item.canDelete ? (
                      <UITranslationBoundary attributes={["title"]}><button type="button" onClick={() => removePresentation(item)} disabled={isArchiving} title="Eliminar definitivamente" aria-label={`Eliminar definitivamente ${item.kind === 'dossier' ? 'dossier' : 'propuesta'} ${item.title}`} className="grid h-8 w-8 place-items-center rounded-lg border border-rose-200 bg-white text-rose-600 transition hover:bg-rose-50 disabled:opacity-50">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button></UITranslationBoundary>
                    ) : item.kind === 'proposal' && item.isOwner && (
                      <UITranslationBoundary attributes={["title"]}><button type="button" onClick={() => archive(item)} disabled={isArchiving} title="Archivar propuesta" aria-label={`Archivar propuesta ${item.title}`} className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 disabled:opacity-50">
                        <Archive className="h-3.5 w-3.5" />
                      </button></UITranslationBoundary>
                    )}
                  </div>

                  {item.sharedUrl && (
                    <a
                      href={item.sharedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-blue-700"
                    >
                      <span>{locale === 'fr' ? 'Voir' : locale === 'en' ? 'View' : <LocalizedText text={"Ver"} />}</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW (Alternative) */
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left">
            <thead className="bg-slate-50 text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-400">
              <tr>
                <th className="px-5 py-3">{locale === 'fr' ? 'Document / Titre' : locale === 'en' ? 'Document / Title' : <LocalizedText text={"Documento / Título"} />}</th>
                <th className="px-5 py-3">{locale === 'fr' ? 'Destinataire' : locale === 'en' ? 'Recipient' : 'Destinatario'}</th>
                <th className="px-5 py-3">{locale === 'fr' ? 'Projet / Valeur' : locale === 'en' ? 'Project / Value' : <LocalizedText text={"Proyecto / Valor"} />}</th>
                <th className="px-5 py-3">{locale === 'fr' ? 'Type' : locale === 'en' ? 'Type' : 'Tipo'}</th>
                <th className="px-5 py-3">{locale === 'fr' ? 'Suivi' : locale === 'en' ? 'Tracking' : 'Seguimiento'}</th>
                <th className="px-5 py-3">{locale === 'fr' ? 'Date' : locale === 'en' ? 'Date' : 'Fecha'}</th>
                <th className="px-5 py-3 text-right">{locale === 'fr' ? 'Actions' : locale === 'en' ? 'Actions' : 'Acciones'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {proposals.map((item) => (
                <tr key={item.id} className="text-xs hover:bg-slate-50/60">
                  <td className="px-5 py-4">
                    <p className="font-extrabold text-slate-900">{item.title}</p>
                    <p className="text-[10px] text-slate-400 font-mono"><LocalizedText text={"ID: #"} />{item.id}</p>
                  </td>
                  <td className="px-5 py-4">
                    {item.kind === 'dossier' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-800 bg-indigo-50/80 px-2.5 py-1 rounded-lg border border-indigo-100">
                        <BookOpen className="h-3 w-3 text-indigo-600 shrink-0" />
                        <span>{item.isMasterTemplate ? 'Brochure oficial' : (item.clientName ? `Para ${item.clientName}` : 'Personalizado')}</span>
                      </span>
                    ) : (
                      <>
                        <p className="font-semibold text-slate-800">{item.clientName || 'Sin asignar'}</p>
                        {item.clientEmail && (
                          <p className="text-[10px] text-slate-400 truncate max-w-[160px]">{item.clientEmail}</p>
                        )}
                      </>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-700">{item.projectName || '—'}</p>
                    {item.projectPrice && (
                      <p className="text-[11px] font-extrabold text-blue-600">
                        {formatCurrency(item.projectPrice)}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider',
                        item.kind === 'proposal'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
                      )}
                    >
                      {item.kind === 'proposal' ? 'Propuesta' : 'Dossier'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-extrabold text-slate-800">{item.viewsCount || 0} {item.viewsCount === 1 ? 'apertura' : 'aperturas'}</p>
                    <p className={cn('mt-1 text-[9px] font-black uppercase', item.isMasterTemplate && item.canClone ? 'text-blue-700' : item.status === 'accepted' ? 'text-emerald-700' : item.status === 'rejected' ? 'text-rose-700' : 'text-slate-400')}>
                      {item.isMasterTemplate ? (item.canClone ? 'Plantilla pública' : 'Plantilla privada') : item.status === 'accepted' ? 'Cliente interesado' : item.status === 'rejected' ? <LocalizedText text={"No continúa"} /> : (item.sharedExpiresAt || (item.status === 'ready' && item.sharedToken)) ? 'Enlace activo' : 'Borrador'}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-slate-400 text-[11px]">
                    {formatPortalDate(item.createdAt, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {(item.kind === 'dossier' ? canEditDossiers : (canEditProposals || item.isOwner)) && (
                        <UITranslationBoundary attributes={["title","aria-label"]}><Link
                          href={`/portal/proposals/${item.id}/edit`}
                          title={item.kind === 'dossier' ? 'Editar dossier' : 'Editar propuesta'}
                          aria-label={item.kind === 'dossier' ? 'Editar dossier' : 'Editar propuesta'}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 transition"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Link></UITranslationBoundary>
                      )}
                      {item.canClone && (
                        <UITranslationBoundary attributes={["title"]}><button
                          type="button"
                          onClick={() => handleCloneDossier(item)}
                          disabled={cloningId === item.id}
                          title={locale === 'fr' ? 'Créer ma version personnalisée' : locale === 'en' ? 'Personalize for me' : 'Crear para mí'}
                          className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 transition disabled:opacity-50"
                        >
                          {cloningId === item.id ? (
                            <LoaderCircle className="h-3 w-3 animate-spin text-indigo-600" />
                          ) : (
                            <Sparkles className="h-3 w-3 text-indigo-600" />
                          )}
                          <span className="hidden sm:inline">{locale === 'fr' ? <LocalizedText text={"Créer pour moi"} /> : locale === 'en' ? 'Create for me' : <LocalizedText text={"Crear para mí"} />}</span>
                        </button></UITranslationBoundary>
                      )}
                      {item.sharedUrl && (
                        <>
                          <UITranslationBoundary attributes={["title"]}><button
                            type="button"
                            onClick={() => copyUrl(item.id, item.sharedUrl, item.projectName || item.title)}
                            title="Copiar mensaje con enlace para compartir"
                            className={cn(
                              'p-1.5 rounded-lg border transition',
                              copiedId === item.id
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-600'
                                : 'border-slate-200 hover:bg-slate-100 text-slate-500'
                            )}
                          >
                            {copiedId === item.id ? (
                              <Check className="h-3.5 w-3.5" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button></UITranslationBoundary>

                          <UITranslationBoundary attributes={["title","aria-label"]}><a
                            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Hola, te comparto esta propuesta de inversión de *${item.projectName || item.title}*:\n${typeof window !== 'undefined' ? window.location.origin : ''}${item.sharedUrl}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Compartir por WhatsApp"
                            aria-label="Compartir por WhatsApp"
                            className="p-1.5 rounded-lg border border-slate-200 text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 transition"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </a></UITranslationBoundary>

                          <UITranslationBoundary attributes={["title"]}><a
                            href={item.sharedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Abrir visor interactivo"
                            className="p-1.5 rounded-lg border border-slate-200 text-blue-600 hover:bg-blue-50 transition"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a></UITranslationBoundary>
                          <UITranslationBoundary attributes={["title"]}><button type="button" onClick={() => openTracking(item)} title="Ver seguimiento" className="rounded-lg border border-slate-200 p-1.5 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"><BarChart3 className="h-3.5 w-3.5" /></button></UITranslationBoundary>
                          {item.kind === 'proposal' && item.clientEmail && (
                            <UITranslationBoundary attributes={["title"]}><button type="button" onClick={() => resendEmail(item)} disabled={resendingId === item.id} title="Reenviar correo al cliente" className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-50">
                              <Mail className="h-3.5 w-3.5" />
                            </button></UITranslationBoundary>
                          )}
                        </>
                      )}
                      {item.canDelete ? (
                        <UITranslationBoundary attributes={["title"]}><button type="button" onClick={() => removePresentation(item)} disabled={isArchiving} title="Eliminar definitivamente" aria-label={`Eliminar definitivamente ${item.kind === 'dossier' ? 'dossier' : 'propuesta'} ${item.title}`} className="rounded-lg border border-rose-200 p-1.5 text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"><Trash2 className="h-3.5 w-3.5" /></button></UITranslationBoundary>
                      ) : item.kind === 'proposal' && item.isOwner && (
                        <UITranslationBoundary attributes={["title"]}><button type="button" onClick={() => archive(item)} disabled={isArchiving} title="Archivar propuesta" aria-label={`Archivar propuesta ${item.title}`} className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"><Archive className="h-3.5 w-3.5" /></button></UITranslationBoundary>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {(tracking || trackingLoading) && (
        <UITranslationBoundary attributes={["aria-label"]}><div className="mt-6 border-t border-slate-200 pt-6" aria-label="Seguimiento del documento">
          <section className="w-full rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            {trackingLoading ? <div className="flex min-h-56 items-center justify-center text-sm font-bold text-slate-500"><LocalizedText text={"Cargando seguimiento…"} /></div> : tracking && <>
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-blue-600"><LocalizedText text={"Seguimiento del documento"} /></p><h2 className="mt-2 text-2xl font-black text-slate-950">{tracking.title}</h2><p className="mt-1 text-sm text-slate-500">{tracking.kind === 'dossier' ? 'Dossier' : 'Propuesta'} · {tracking.clientName} · {tracking.projectName}</p>{process.env.NEXT_PUBLIC_APP_SCOPE === 'demo' && <span className="mt-3 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-bold text-amber-800">Actividad de ejemplo · datos simulados para el demo</span>}</div><UITranslationBoundary attributes={["aria-label"]}><button type="button" onClick={() => setTracking(null)} aria-label="Cerrar seguimiento" className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"><X className="h-4 w-4" /></button></UITranslationBoundary></div>
              <div className="mt-6 grid gap-3 sm:grid-cols-4">{[['Aperturas', tracking.views], ['PDF descargados', tracking.pdfs], ['Compartidos', tracking.shares], ['WhatsApp', tracking.whatsappClicks]].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</p><p className="mt-2 text-2xl font-black text-slate-950">{value}</p></div>)}</div>
              <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.4fr]"><div className="space-y-5"><div className="rounded-2xl border border-slate-200 p-4"><div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-blue-600" /><h3 className="text-sm font-black text-slate-900"><LocalizedText text={"Tiempo promedio"} /></h3></div><p className="mt-3 text-3xl font-black text-slate-950">{tracking.averageDurationSeconds ? `${Math.floor(tracking.averageDurationSeconds / 60)}m ${tracking.averageDurationSeconds % 60}s` : '—'}</p><p className="mt-1 text-xs text-slate-500"><LocalizedText text={"Con base en sesiones que reportaron duración."} /></p></div><div className="rounded-2xl border border-slate-200 p-4"><h3 className="text-sm font-black text-slate-900"><LocalizedText text={"Dispositivos"} /></h3><div className="mt-3 space-y-2">{tracking.devices.length ? tracking.devices.map((entry) => <div key={entry.label} className="flex items-center justify-between text-xs"><span className="flex items-center gap-2 text-slate-600">{entry.label === 'mobile' ? <Smartphone className="h-3.5 w-3.5" /> : entry.label === 'tablet' ? <Tablet className="h-3.5 w-3.5" /> : <Monitor className="h-3.5 w-3.5" />}{entry.label}</span><b>{entry.count}</b></div>) : <p className="text-xs text-slate-400"><LocalizedText text={"Aún no hay datos."} /></p>}</div></div><div className="rounded-2xl border border-slate-200 p-4"><h3 className="text-sm font-black text-slate-900"><LocalizedText text={"Ubicaciones"} /></h3><div className="mt-3 space-y-2">{tracking.locations.length ? tracking.locations.map((entry) => <div key={entry.label} className="flex items-center justify-between text-xs"><span className="flex items-center gap-2 text-slate-600"><MapPin className="h-3.5 w-3.5 text-blue-600" />{entry.label}</span><b>{entry.count}</b></div>) : <p className="text-xs text-slate-400"><LocalizedText text={"La ubicación aparecerá cuando el proveedor la entregue."} /></p>}</div></div></div><div className="rounded-2xl border border-slate-200 p-4"><h3 className="text-sm font-black text-slate-900"><LocalizedText text={"Bitácora de actividad"} /></h3><div className="mt-3 divide-y divide-slate-100">{tracking.activity.length ? tracking.activity.map((entry, index) => <div key={`${entry.occurredAt}-${index}`} className="flex items-start justify-between gap-3 py-3 text-xs"><div><p className="font-bold text-slate-800">{entry.label}</p><p className="mt-1 text-slate-400">{[entry.device, entry.location, entry.durationSeconds ? `${Math.floor(entry.durationSeconds / 60)}m ${entry.durationSeconds % 60}s permanencia` : undefined].filter(Boolean).join(' · ') || 'Interacción web'}</p></div><time className="shrink-0 text-[10px] text-slate-400">{formatPortalDate(entry.occurredAt, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</time></div>) : <p className="py-8 text-center text-xs text-slate-400"><LocalizedText text={"Todavía no hay actividad registrada."} /></p>}</div></div></div>
            </>}
          </section>
        </div></UITranslationBoundary>
      )}
    </div>
  );
}

function ProjectsGrid({
  projects,
  compareMode,
  selectedSlugs,
  onSelectionChange,
}: {
  projects: PortalProject[];
  compareMode: boolean;
  selectedSlugs: string[];
  onSelectionChange: (slugs: string[]) => void;
}) {
  const { locale } = useLocale();
  const [query, setQuery] = useState('');
  const [developer, setDeveloper] = useState('all');
  const [developerMenuOpen, setDeveloperMenuOpen] = useState(false);
  const developerMenuRef = useRef<HTMLDivElement>(null);
  const developerTriggerRef = useRef<HTMLButtonElement>(null);
  const developers = useMemo(
    () => Array.from(new Set(projects.map((project) => project.developer))).sort((a, b) => a.localeCompare(b, locale === 'es' ? 'es' : 'fr')),
    [projects, locale]
  );
  const developerCounts = useMemo(() => new Map(developers.map((name) => [name, projects.filter((project) => project.developer === name).length])), [developers, projects]);
  useEffect(() => {
    if (!developerMenuOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!developerMenuRef.current?.contains(event.target as Node)) setDeveloperMenuOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, [developerMenuOpen]);
  const focusDeveloperOption = (index: number) => {
    const options = developerMenuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]');
    options?.[(index + options.length) % options.length]?.focus();
  };
  const openDeveloperMenu = () => {
    setDeveloperMenuOpen(true);
    requestAnimationFrame(() => focusDeveloperOption(Math.max(0, developers.indexOf(developer) + 1)));
  };
  const normalizedQuery = query.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const filteredProjects = useMemo(() => projects.filter((project) => {
    if (developer !== 'all' && project.developer !== developer) return false;
    if (!normalizedQuery) return true;
    const searchText = [project.name, project.developer, project.location, project.zone, project.status]
      .join(' ')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
    return searchText.includes(normalizedQuery);
  }).sort((a, b) => a.name.localeCompare(b.name, locale === 'es' ? 'es' : 'fr')), [developer, locale, normalizedQuery, projects]);
  const selectedProjects = selectedSlugs.map((slug) => projects.find((project) => project.slug === slug)).filter((project): project is PortalProject => Boolean(project));
  const toggleSelection = (slug: string) => {
    if (selectedSlugs.includes(slug)) onSelectionChange(selectedSlugs.filter((selected) => selected !== slug));
    else if (selectedSlugs.length < 3) onSelectionChange([...selectedSlugs, slug]);
  };

  const searchPlaceholder = locale === 'fr'
    ? 'Rechercher un projet, promoteur ou emplacement'
    : locale === 'en'
    ? 'Search project, developer, or location'
    : 'Buscar proyecto, desarrolladora o ubicación';

  const allDevelopersText = locale === 'fr'
    ? `Tous les promoteurs (${developers.length})`
    : locale === 'en'
    ? `All developers (${developers.length})`
    : `Todas las desarrolladoras (${developers.length})`;

  const developerLabel = locale === 'fr' ? 'Promoteur' : locale === 'en' ? 'Developer' : 'Desarrolladora';
  const availableLabel = locale === 'fr' ? 'Disponibles' : locale === 'en' ? 'Available' : 'Disponibles';
  const fromLabel = locale === 'fr' ? 'À partir de' : locale === 'en' ? 'From' : 'Desde';
  const deliveryLabel = locale === 'fr' ? 'Livraison' : locale === 'en' ? 'Delivery' : 'Entrega';
  const detailsLabel = locale === 'fr' ? 'Fiche' : locale === 'en' ? 'Details' : 'Ficha';
  const projectCountLabel = locale === 'fr' ? (filteredProjects.length === 1 ? 'projet' : 'projets') : locale === 'en' ? (filteredProjects.length === 1 ? 'project' : 'projects') : (filteredProjects.length === 1 ? 'proyecto' : 'proyectos');

  return (
    <div className="space-y-5">
      <div className="grid gap-3 border-y border-slate-200 py-4 sm:grid-cols-[minmax(0,1fr)_260px]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <div className="relative" ref={developerMenuRef}>
          <button
            ref={developerTriggerRef}
            type="button"
            aria-label={`${developerLabel}: ${developer === 'all' ? allDevelopersText : developer}`}
            aria-haspopup="menu"
            aria-expanded={developerMenuOpen}
            aria-controls="project-developer-menu"
            onClick={() => developerMenuOpen ? setDeveloperMenuOpen(false) : openDeveloperMenu()}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                openDeveloperMenu();
              }
            }}
            className={cn('flex h-11 w-full items-center gap-2.5 rounded-lg border bg-white px-3 text-left text-sm font-bold text-slate-700 outline-none transition hover:border-slate-300 hover:bg-slate-50 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-100', developerMenuOpen ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200')}
          >
            <Filter className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">{developer === 'all' ? allDevelopersText : developer}</span>
            <ChevronDown className={cn('h-4 w-4 shrink-0 text-slate-400 transition-transform', developerMenuOpen && 'rotate-180')} aria-hidden="true" />
          </button>
          {developerMenuOpen && (
            <div
              id="project-developer-menu"
              role="menu"
              aria-label={developerLabel}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  setDeveloperMenuOpen(false);
                  developerTriggerRef.current?.focus();
                } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Home' || event.key === 'End') {
                  event.preventDefault();
                  const options = Array.from(developerMenuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitemradio"]') ?? []);
                  const currentIndex = options.indexOf(document.activeElement as HTMLButtonElement);
                  const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : currentIndex + (event.key === 'ArrowDown' ? 1 : -1);
                  focusDeveloperOption(nextIndex);
                }
              }}
              className="absolute right-0 top-full z-50 mt-2 max-h-80 w-full min-w-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10"
            >
              {([{ name: 'all', label: allDevelopersText, count: 0 }, ...developers.map((name) => ({ name, label: name, count: developerCounts.get(name) ?? 0 }))]).map(({ name, label, count }) => (
                <button
                  key={name}
                  type="button"
                  role="menuitemradio"
                  aria-checked={developer === name}
                  onClick={() => { setDeveloper(name); setDeveloperMenuOpen(false); developerTriggerRef.current?.focus(); }}
                  className={cn('flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-blue-500', developer === name ? 'bg-blue-50 text-blue-800' : 'text-slate-700 hover:bg-slate-50')}
                >
                  <span className="min-w-0 flex-1 truncate">{label}</span>
                  {name !== 'all' && <span className={cn('shrink-0 rounded-md px-1.5 py-0.5 text-[10px]', developer === name ? 'bg-white text-blue-700' : 'bg-slate-100 text-slate-500')}>{count}</span>}
                  {developer === name && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-600" role="status">
          <span className="font-extrabold text-slate-950">{filteredProjects.length}</span> {projectCountLabel}
          {developer !== 'all' && <span className="text-slate-400"> · {developer}</span>}
        </p>
        {(developer !== 'all' || query) && (
          <button type="button" onClick={() => { setDeveloper('all'); setQuery(''); }} className="text-xs font-bold text-blue-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
            {locale === 'fr' ? 'Effacer les filtres' : locale === 'en' ? 'Clear filters' : 'Limpiar filtros'}
          </button>
        )}
      </div>

      {compareMode && (
        <UITranslationBoundary attributes={["aria-label"]}><section id="project-comparison" aria-label={locale === 'fr' ? 'Comparaison de projets' : locale === 'en' ? 'Project comparison' : 'Comparación de proyectos'} className="scroll-mt-24 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-950">{locale === 'fr' ? 'Comparer les projets' : locale === 'en' ? 'Compare projects' : <LocalizedText text={"Comparar proyectos"} />}</h2>
              <p className="mt-1 text-sm text-slate-600">
                {locale === 'fr' ? <LocalizedText text={"Sélectionnez 2 ou 3 projets dans la liste."} /> : locale === 'en' ? 'Select 2 or 3 projects from the list.' : <LocalizedText text={"Selecciona 2 o 3 proyectos de la lista."} />}
              </p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-800">{selectedProjects.length} / 3</span>
          </div>
          {selectedProjects.length >= 2 && (
            <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th scope="col" className="w-32 p-3 text-xs font-bold text-slate-500">{locale === 'fr' ? 'Critère' : locale === 'en' ? 'Detail' : 'Dato'}</th>
                    {selectedProjects.map((project) => (
                      <th scope="col" key={project.slug} className="min-w-40 p-3 align-top">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-extrabold text-slate-950">{project.name}</span>
                          <button type="button" onClick={() => toggleSelection(project.slug)} aria-label={`${locale === 'fr' ? 'Retirer' : locale === 'en' ? 'Remove' : 'Quitar'} ${project.name}`} className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><X className="h-4 w-4" /></button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {[
                    [developerLabel, (project: PortalProject) => project.developer],
                    [locale === 'fr' ? 'Emplacement' : locale === 'en' ? 'Location' : 'Ubicación', (project: PortalProject) => project.location],
                    [fromLabel, (project: PortalProject) => formatCurrency(project.startingPrice)],
                    [availableLabel, (project: PortalProject) => `${project.availableUnits} / ${project.totalUnits}`],
                    [deliveryLabel, (project: PortalProject) => project.delivery],
                  ].map(([label, getValue]) => (
                    <tr key={String(label)}>
                      <th scope="row" className="p-3 text-xs font-bold text-slate-500">{String(label)}</th>
                      {selectedProjects.map((project) => <td key={project.slug} className="p-3 font-semibold">{(getValue as (project: PortalProject) => string)(project)}</td>)}
                    </tr>
                  ))}
                  <tr>
                    <th scope="row" className="p-3 text-xs font-bold text-slate-500">{detailsLabel}</th>
                    {selectedProjects.map((project) => <td key={project.slug} className="p-3"><Link href={`/portal/projects/${project.slug}`} className="inline-flex items-center gap-1 font-bold text-blue-700 hover:underline">{detailsLabel}<ArrowUpRight className="h-4 w-4" /></Link></td>)}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </section></UITranslationBoundary>
      )}

      {filteredProjects.length === 0 ? (
        <div className="border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <Search className="mx-auto h-7 w-7 text-slate-300" />
          <p className="mt-3 text-sm font-black text-slate-800">
            {locale === 'fr' ? <LocalizedText text={"Aucun projet trouvé"} /> : locale === 'en' ? 'No projects found' : <LocalizedText text={"No encontramos proyectos"} />}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {locale === 'fr' ? 'Essayez un autre nom, emplacement ou promoteur.' : locale === 'en' ? 'Try another name, location, or developer.' : <LocalizedText text={"Prueba con otro nombre, ubicación o desarrolladora."} />}
          </p>
        </div>
      ) : (
        <div className={cn('grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3', compareMode && selectedProjects.length > 0 && 'pb-20')}>
            {filteredProjects.map((project, projectIndex) => (
              <article key={project.slug} className={cn('group overflow-hidden rounded-xl border bg-white transition hover:shadow-md', selectedSlugs.includes(project.slug) ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200 hover:border-blue-300')}>
                <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                  {project.image ? <Image src={project.image} alt={project.name} fill priority={projectIndex === 0} sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw" className="object-cover transition duration-300 group-hover:scale-105" /> : <div className="flex h-full w-full items-center justify-center text-slate-300"><Building2 className="h-10 w-10" /></div>}
                  <div className="absolute left-3 top-3 rounded-md bg-slate-900/85 px-2.5 py-1 text-[9px] font-extrabold uppercase text-white backdrop-blur-xs">{project.zone}</div>
                </div>
                <div className="p-5">
                  <h3 className="text-base font-extrabold text-slate-950">{project.name}</h3>
                  <p className="mt-0.5 text-xs font-semibold text-slate-600">{project.developer}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin className="h-3.5 w-3.5 shrink-0 text-blue-600" />{project.location}</p>
                  <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-3 text-center">
                    <div><p className="text-[9px] font-bold uppercase text-slate-400">{availableLabel}</p><p className="mt-1 text-xs font-extrabold text-slate-900">{project.availableUnits} / {project.totalUnits}</p></div>
                    <div><p className="text-[9px] font-bold uppercase text-slate-400">{fromLabel}</p><p className="mt-1 text-xs font-extrabold text-slate-900">{formatCurrency(project.startingPrice)}</p></div>
                    <div><p className="text-[9px] font-bold uppercase text-slate-400">{deliveryLabel}</p><p className="mt-1 text-xs font-extrabold leading-snug text-slate-900">{project.delivery}</p></div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Link href={`/portal/projects/${project.slug}`} className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-50 px-3 text-xs font-bold text-blue-700 transition hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"><span>{detailsLabel}</span><ArrowUpRight className="h-3.5 w-3.5" /></Link>
                    {compareMode && <button type="button" onClick={() => toggleSelection(project.slug)} disabled={!selectedSlugs.includes(project.slug) && selectedSlugs.length >= 3} aria-pressed={selectedSlugs.includes(project.slug)} className={cn('inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50', selectedSlugs.includes(project.slug) ? 'border-blue-700 bg-blue-700 text-white' : 'border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-blue-50')}>
                      {selectedSlugs.includes(project.slug) ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                      {selectedSlugs.includes(project.slug) ? (locale === 'fr' ? 'Sélectionné' : locale === 'en' ? 'Selected' : 'Seleccionado') : (locale === 'fr' ? 'Comparer' : locale === 'en' ? 'Compare' : 'Comparar')}
                    </button>}
                  </div>
                </div>
              </article>
            ))}
        </div>
      )}
      {compareMode && selectedProjects.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 flex items-center justify-between gap-3 rounded-xl bg-slate-950 px-4 py-3 text-white shadow-lg sm:left-auto sm:w-80" role="status">
          <span className="text-xs font-bold">{selectedProjects.length} / 3 {locale === 'fr' ? <LocalizedText text={"sélectionnés"} /> : locale === 'en' ? 'selected' : 'seleccionados'}</span>
          <a href="#project-comparison" className="rounded-lg bg-white px-3 py-2 text-xs font-extrabold text-slate-950 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950">
            {locale === 'fr' ? 'Voir' : locale === 'en' ? 'View' : <LocalizedText text={"Ver comparación"} />}
          </a>
        </div>
      )}
    </div>
  );
}

function Status({ value }: { value: string }) {
  const { locale } = useLocale();
  const strong = value === 'Reserva' || value === 'Aceptada' || value === 'Disponible';
  const label = locale === 'fr'
    ? (value === 'Disponible' ? 'Disponible' : value === 'Reserva' ? 'Réservé' : value === 'Aceptada' ? 'Acceptée' : value)
    : locale === 'en'
    ? (value === 'Disponible' ? 'Available' : value === 'Reserva' ? 'Reserved' : value === 'Aceptada' ? 'Accepted' : value)
    : value;

  return (
    <span
      className={cn(
        'inline-flex rounded-lg px-2.5 py-1.5 text-[9px] font-extrabold uppercase tracking-wide',
        strong ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700'
      )}
    >
      {label}
    </span>
  );
}
