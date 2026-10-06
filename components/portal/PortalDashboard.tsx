'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, Building2, CalendarDays, ChevronRight, CircleDollarSign,
  FileSignature, FileText, MapPin, Plus, Search, TrendingUp, UserPlus, Users,
} from 'lucide-react';
import { cn, formatCurrency, formatPortalDate } from '@/lib/utils';
import type { PortalProject } from '@/lib/portal-projects';
import type { CrmDashboardSummary, DashboardStage, TodayActivity } from '@/lib/data/crm';
import type { AgreementSummary } from '@/lib/data/agreements';
import StatusBadge from '@/components/ui/StatusBadge';
import { useLocale } from '@/components/i18n/LocaleProvider';

const stageOrder: DashboardStage[] = ['Nuevo', 'Contactado', 'Propuesta', 'Negociación', 'Reserva'];

const stageBarColor: Record<DashboardStage, string> = {
  Nuevo: 'bg-blue-400', Contactado: 'bg-blue-500', Propuesta: 'bg-blue-600', Negociación: 'bg-blue-700', Reserva: 'bg-blue-900',
};

const stageStyle: Record<DashboardStage, string> = {
  Nuevo: 'bg-blue-50 text-blue-600', Contactado: 'bg-sky-50 text-sky-700', Propuesta: 'bg-indigo-50 text-indigo-700',
  Negociación: 'bg-blue-100 text-blue-800', Reserva: 'bg-slate-900 text-white',
};

const dashboardI18n = {
  es: {
    welcome: 'Bienvenido',
    greetings: {
      morning: 'Buenos días',
      afternoon: 'Buenas tardes',
      evening: 'Buenas noches',
    },
    subtitle: 'Tu operación comercial está al día. Estas son las oportunidades que necesitan atención.',
    createProposal: 'Crear propuesta',
    newLead: 'Nuevo lead',
    agreementPending: 'Tienes un acuerdo de colaboración pendiente de firma',
    agreementExpired: 'Tu acuerdo de colaboración venció — renuévalo para seguir operando',
    agreementValid: (date: string) => `Acuerdo vigente hasta ${date}`,
    agreementStatusPending: 'Pendiente de firma',
    agreementStatusExpired: 'Vencido',
    agreementStatusActive: 'Vigente',
    activeClients: 'Clientes activos',
    openOpportunity: (count: number) => `${count} con oportunidad abierta`,
    estimatedPipeline: 'Pipeline estimado',
    activeOpportunities: (count: number) => `${count} oportunidades activas`,
    availableUnits: 'Unidades disponibles',
    inProjects: (count: number) => `en ${count} proyectos`,
    monthlyConversion: 'Conversión mensual',
    closedCount: (won: number, total: number) =>
      total > 0 ? `${won} de ${total} cierres este mes` : 'sin cierres este mes',
    pipelineTitle: 'Pipeline comercial',
    pipelineSubtitle: 'Valor potencial por etapa de seguimiento',
    viewPipeline: 'Ver pipeline',
    totalPipelineValue: 'Valor total del pipeline',
    opportunitiesBadge: (count: number) => `${count} oportunidades`,
    stages: {
      Nuevo: 'Nuevo',
      Contactado: 'Contactado',
      Propuesta: 'Propuesta',
      Negociación: 'Negociación',
      Reserva: 'Reserva',
    },
    todaySchedule: 'Agenda de hoy',
    pendingActivities: (count: number) => `${count} actividad(es) pendiente(s)`,
    noPendingActivities: 'No tienes actividades pendientes registradas.',
    activityKinds: {
      call: 'Llamada',
      email: 'Correo',
      whatsapp: 'WhatsApp',
      meeting: 'Reunión',
      visit: 'Visita',
      task: 'Tarea',
      system: 'Sistema',
    } as Record<string, string>,
    recentClients: 'Clientes recientes',
    recentClientsSubtitle: 'Seguimientos con movimiento reciente',
    filterClientsPlaceholder: 'Filtrar clientes',
    noClientsFound: 'No hay clientes con esos filtros.',
    assignedProjects: 'Proyectos asignados',
    portfolioAvailability: 'Disponibilidad de tu portafolio',
    viewAll: 'Ver todos',
    fromPrice: 'Desde',
    unavailable: (pct: number) => `${pct}% no disponible`,
    unitsCount: (count: number) => `${count} unidades`,
  },
  en: {
    welcome: 'Welcome',
    greetings: {
      morning: 'Good morning',
      afternoon: 'Good afternoon',
      evening: 'Good evening',
    },
    subtitle: 'Your commercial operation is up to date. These are the opportunities that need attention.',
    createProposal: 'Create proposal',
    newLead: 'New lead',
    agreementPending: 'You have a collaboration agreement pending signature',
    agreementExpired: 'Your collaboration agreement has expired — renew it to continue operating',
    agreementValid: (date: string) => `Agreement valid until ${date}`,
    agreementStatusPending: 'Pending signature',
    agreementStatusExpired: 'Expired',
    agreementStatusActive: 'Active',
    activeClients: 'Active clients',
    openOpportunity: (count: number) => `${count} with open opportunity`,
    estimatedPipeline: 'Estimated pipeline',
    activeOpportunities: (count: number) => `${count} active opportunities`,
    availableUnits: 'Available units',
    inProjects: (count: number) => `in ${count} projects`,
    monthlyConversion: 'Monthly conversion',
    closedCount: (won: number, total: number) =>
      total > 0 ? `${won} of ${total} closed this month` : 'no deals closed this month',
    pipelineTitle: 'Commercial pipeline',
    pipelineSubtitle: 'Potential value by tracking stage',
    viewPipeline: 'View pipeline',
    totalPipelineValue: 'Total pipeline value',
    opportunitiesBadge: (count: number) => `${count} opportunities`,
    stages: {
      Nuevo: 'New',
      Contactado: 'Contacted',
      Propuesta: 'Proposal',
      Negociación: 'Negotiation',
      Reserva: 'Reservation',
    },
    todaySchedule: "Today's schedule",
    pendingActivities: (count: number) => `${count} pending activity(ies)`,
    noPendingActivities: 'No pending activities recorded.',
    activityKinds: {
      call: 'Call',
      email: 'Email',
      whatsapp: 'WhatsApp',
      meeting: 'Meeting',
      visit: 'Visit',
      task: 'Task',
      system: 'System',
    } as Record<string, string>,
    recentClients: 'Recent clients',
    recentClientsSubtitle: 'Follow-ups with recent activity',
    filterClientsPlaceholder: 'Filter clients',
    noClientsFound: 'No clients found with those filters.',
    assignedProjects: 'Assigned projects',
    portfolioAvailability: 'Portfolio availability',
    viewAll: 'View all',
    fromPrice: 'From',
    unavailable: (pct: number) => `${pct}% unavailable`,
    unitsCount: (count: number) => `${count} units`,
  },
  fr: {
    welcome: 'Bienvenue',
    greetings: {
      morning: 'Bonjour',
      afternoon: 'Bon après-midi',
      evening: 'Bonsoir',
    },
    subtitle: 'Vos opérations commerciales sont à jour. Voici les opportunités nécessitant votre attention.',
    createProposal: 'Créer une proposition',
    newLead: 'Nouveau prospect',
    agreementPending: 'Vous avez un contrat de collaboration en attente de signature',
    agreementExpired: 'Votre contrat de collaboration a expiré — renouvelez-le pour continuer',
    agreementValid: (date: string) => `Contrat valable jusqu'au ${date}`,
    agreementStatusPending: 'En attente de signature',
    agreementStatusExpired: 'Expiré',
    agreementStatusActive: 'Valide',
    activeClients: 'Clients actifs',
    openOpportunity: (count: number) => `${count} avec opportunité ouverte`,
    estimatedPipeline: 'Pipeline estimé',
    activeOpportunities: (count: number) => `${count} opportunités actives`,
    availableUnits: 'Unités disponibles',
    inProjects: (count: number) => `dans ${count} projets`,
    monthlyConversion: 'Conversion mensuelle',
    closedCount: (won: number, total: number) =>
      total > 0 ? `${won} sur ${total} clôturés ce mois-ci` : 'aucun closing ce mois-ci',
    pipelineTitle: 'Pipeline commercial',
    pipelineSubtitle: 'Valeur potentielle par étape de suivi',
    viewPipeline: 'Voir le pipeline',
    totalPipelineValue: 'Valeur totale du pipeline',
    opportunitiesBadge: (count: number) => `${count} opportunités`,
    stages: {
      Nuevo: 'Nouveau',
      Contactado: 'Contacté',
      Propuesta: 'Proposition',
      Negociación: 'Négociation',
      Reserva: 'Réservation',
    },
    todaySchedule: "Agenda d'aujourd'hui",
    pendingActivities: (count: number) => `${count} activité(s) en attente`,
    noPendingActivities: 'Aucune activité en attente enregistrée.',
    activityKinds: {
      call: 'Appel',
      email: 'E-mail',
      whatsapp: 'WhatsApp',
      meeting: 'Réunion',
      visit: 'Visite',
      task: 'Tâche',
      system: 'Système',
    } as Record<string, string>,
    recentClients: 'Clients récents',
    recentClientsSubtitle: 'Suivis avec activité récente',
    filterClientsPlaceholder: 'Filtrer les clients',
    noClientsFound: 'Aucun client trouvé avec ces filtres.',
    assignedProjects: 'Projets assignés',
    portfolioAvailability: 'Disponibilité de votre portefeuille',
    viewAll: 'Voir tout',
    fromPrice: 'À partir de',
    unavailable: (pct: number) => `${pct}% non disponible`,
    unitsCount: (count: number) => `${count} unités`,
  },
};

function greetingForHour(hour: number, locale: 'es' | 'en' | 'fr' = 'es') {
  const t = dashboardI18n[locale] || dashboardI18n.es;
  if (locale === 'fr') {
    if (hour < 12) return t.greetings.morning;
    if (hour < 18) return t.greetings.afternoon;
    return t.greetings.evening;
  }
  if (hour < 12) return t.greetings.morning;
  if (hour < 19) return t.greetings.afternoon;
  return t.greetings.evening;
}

export default function PortalDashboard({
  projects,
  displayName,
  crm,
  todayActivities,
  myAgreement,
  canCreateProposals = false,
}: {
  projects: PortalProject[];
  displayName: string;
  crm: CrmDashboardSummary;
  todayActivities: TodayActivity[];
  myAgreement: AgreementSummary | null;
  canCreateProposals?: boolean;
}) {
  const { locale } = useLocale();
  const t = dashboardI18n[locale] || dashboardI18n.es;

  const [search, setSearch] = useState('');
  const [stage, setStage] = useState<DashboardStage | 'Todos'>('Todos');
  const [clientNow, setClientNow] = useState<Date | null>(null);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) setClientNow(new Date());
    });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => crm.recentLeads.filter((lead) => {
    const matchesSearch = `${lead.name} ${lead.email} ${lead.project}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (stage === 'Todos' || lead.stage === stage);
  }), [crm.recentLeads, search, stage]);

  const today = clientNow ? formatPortalDate(clientNow, { weekday: 'long', day: 'numeric', month: 'long' }, locale) : t.welcome;
  const santoDomingoHour = clientNow ? Number(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: 'America/Santo_Domingo' }).format(clientNow)) : null;
  const firstName = displayName.split(' ')[0];
  const conversionLabel = crm.totalClosedThisMonthCount > 0
    ? `${Math.round((crm.wonThisMonthCount / crm.totalClosedThisMonthCount) * 100)}%`
    : '—';

  return (
    <div className="portal-enter space-y-6">
      <section className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-blue-600">{today}</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
            {santoDomingoHour === null ? t.welcome : greetingForHour(santoDomingoHour, locale)}, {firstName}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">{t.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {canCreateProposals && (
            <Link href="/portal/proposals" className="inline-flex h-11 items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 text-xs font-bold text-blue-700 shadow-sm hover:bg-blue-50">
              <FileText className="h-4 w-4" /> {t.createProposal}
            </Link>
          )}
          <Link href="/portal/leads/new" className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700">
            <UserPlus className="h-4 w-4" /> {t.newLead}
          </Link>
        </div>
      </section>

      {myAgreement && (
        <Link
          href={myAgreement.state === 'pending_signature' ? `/portal/agreements/${myAgreement.publicCode}/sign` : '/portal/agreements'}
          className={cn(
            'flex items-center justify-between gap-4 rounded-2xl border p-4 shadow-sm transition hover:shadow-md',
            myAgreement.state === 'vencido' ? 'border-red-200 bg-red-50' : myAgreement.state === 'pending_signature' ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-white'
          )}
        >
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><FileSignature className="h-5 w-5" /></span>
            <div>
              <p className="text-xs font-extrabold text-slate-900">
                {myAgreement.state === 'pending_signature' && t.agreementPending}
                {myAgreement.state === 'vencido' && t.agreementExpired}
                {myAgreement.state === 'vigente' && myAgreement.expiresAt && t.agreementValid(formatPortalDate(myAgreement.expiresAt, { day: 'numeric', month: 'short', year: 'numeric' }, locale))}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500"><LocalizedText text={"Master Broker: "} />{myAgreement.masterBrokerOrg.name}</p>
            </div>
          </div>
          <StatusBadge
            status={myAgreement.state}
            label={
              myAgreement.state === 'pending_signature'
                ? t.agreementStatusPending
                : myAgreement.state === 'vencido'
                ? t.agreementStatusExpired
                : myAgreement.state === 'vigente'
                ? t.agreementStatusActive
                : undefined
            }
          />
        </Link>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: t.activeClients, value: String(crm.activeClientsCount), note: t.openOpportunity(crm.recentLeads.length), icon: Users },
          { label: t.estimatedPipeline, value: formatCurrency(crm.pipelineTotalValue), note: t.activeOpportunities(stageOrder.reduce((s, k) => s + crm.stageCounts[k], 0)), icon: CircleDollarSign },
          { label: t.availableUnits, value: String(projects.reduce((total, project) => total + project.availableUnits, 0)), note: t.inProjects(projects.length), icon: Building2 },
          { label: t.monthlyConversion, value: conversionLabel, note: t.closedCount(crm.wonThisMonthCount, crm.totalClosedThisMonthCount), icon: TrendingUp },
        ].map((item) => <MetricCard key={item.label} {...item} />)}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.45fr_0.75fr]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-950">{t.pipelineTitle}</h2>
              <p className="mt-1 text-xs text-slate-500">{t.pipelineSubtitle}</p>
            </div>
            <Link href="/portal/leads" className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800">
              {t.viewPipeline} <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-px bg-slate-100 sm:grid-cols-5">
            {stageOrder.map((stageKey) => (
              <button
                key={stageKey}
                type="button"
                onClick={() => setStage(stage === stageKey ? 'Todos' : stageKey)}
                className={cn('bg-white p-4 text-left transition hover:bg-blue-50', stage === stageKey && 'bg-blue-50')}
              >
                <span className={cn('mb-3 block h-1.5 w-8 rounded-full', stageBarColor[stageKey])} />
                <span className="block text-xl font-extrabold text-slate-950">{crm.stageCounts[stageKey]}</span>
                <span className="mt-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">{t.stages[stageKey]}</span>
              </button>
            ))}
          </div>
          <div className="border-t border-slate-100 p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-slate-500">{t.totalPipelineValue}</p>
                <p className="mt-1 text-2xl font-extrabold text-slate-950">{formatCurrency(crm.pipelineTotalValue)}</p>
              </div>
              <span className="rounded-lg bg-blue-50 px-3 py-2 text-[10px] font-bold text-blue-700">
                {t.opportunitiesBadge(stageOrder.reduce((s, k) => s + crm.stageCounts[k], 0))}
              </span>
            </div>
            <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-100 flex">
              {stageOrder.map((stageKey) => {
                const pct = crm.pipelineTotalValue > 0 ? (crm.stageValues[stageKey] / crm.pipelineTotalValue) * 100 : 0;
                return <div key={stageKey} className={stageBarColor[stageKey]} style={{ width: `${pct}%` }} />;
              })}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-950">{t.todaySchedule}</h2>
              <p className="mt-1 text-xs text-slate-500">{t.pendingActivities(todayActivities.length)}</p>
            </div>
            <UITranslationBoundary attributes={["aria-label"]}><Link href="/portal/leads" aria-label="Ver clientes" className="rounded-xl bg-blue-50 p-2.5 text-blue-600 hover:bg-blue-100">
              <Plus className="h-4 w-4" />
            </Link></UITranslationBoundary>
          </div>
          {todayActivities.length === 0 ? (
            <p className="mt-5 rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
              {t.noPendingActivities}
            </p>
          ) : (
            <div className="mt-4 space-y-2.5">
              {todayActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600"><CalendarDays className="h-4 w-4" /></span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-900">{activity.subject}</p>
                    <p className="mt-0.5 text-[10px] text-slate-500">
                      {t.activityKinds[activity.kind] || activity.kind}
                      {activity.contactName ? ` · ${activity.contactName}` : ''}
                      {activity.dueAt ? ` · ${formatPortalDate(activity.dueAt, { day: 'numeric', month: 'short' }, locale)}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-950">{t.recentClients}</h2>
              <p className="mt-1 text-xs text-slate-500">{t.recentClientsSubtitle}</p>
            </div>
            <label className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.filterClientsPlaceholder}
                className="h-9 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-xs outline-none focus:border-blue-400 sm:w-48"
              />
            </label>
          </div>
          <div className="divide-y divide-slate-100">
            {filtered.map((lead) => (
              <Link key={lead.id} href={`/portal/clientes/${lead.publicCode}`} className="grid gap-3 p-4 transition hover:bg-slate-50/70 sm:grid-cols-[1fr_0.8fr_auto] sm:items-center">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-100 text-[11px] font-extrabold text-blue-700">{lead.initials}</span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-900">{lead.name}</p>
                    <p className="truncate text-[10px] text-slate-500">{lead.email}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">{lead.project}</p>
                  <p className="mt-1 text-[10px] font-bold text-slate-400">{formatCurrency(lead.value)}</p>
                </div>
                <span className={cn('w-fit rounded-lg px-2.5 py-1.5 text-[9px] font-extrabold uppercase tracking-wide', stageStyle[lead.stage])}>
                  {t.stages[lead.stage] || lead.stage}
                </span>
              </Link>
            ))}
            {!filtered.length && <p className="p-8 text-center text-xs text-slate-500">{t.noClientsFound}</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-950">{t.assignedProjects}</h2>
              <p className="mt-1 text-xs text-slate-500">{t.portfolioAvailability}</p>
            </div>
            <Link href="/portal/projects" className="text-xs font-bold text-blue-600">{t.viewAll}</Link>
          </div>
          <div className="mt-5 space-y-4">
            {projects.map((project) => {
              const placed = project.totalUnits ? Math.max(0, Math.round((1 - project.availableUnits / project.totalUnits) * 100)) : 0;
              return (
                <div key={project.slug} className="rounded-xl border border-slate-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-extrabold text-slate-900">{project.name}</p>
                      <p className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
                        <MapPin className="h-3 w-3" /> {project.location} · {t.fromPrice} {formatCurrency(project.startingPrice, project.currency)}
                      </p>
                    </div>
                    <span className="text-xs font-extrabold text-blue-600">{project.availableUnits}</span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-blue-50">
                    <div className="h-full rounded-full bg-blue-600" style={{ width: `${placed}%` }} />
                  </div>
                  <div className="mt-2 flex justify-between text-[9px] font-bold uppercase tracking-wide text-slate-400">
                    <span>{t.unavailable(placed)}</span>
                    <span>{t.unitsCount(project.totalUnits)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value, note, icon: Icon }: { label: string; value: string; note: string; icon: typeof Users }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950">{value}</p>
        </div>
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600"><Icon className="h-5 w-5" /></span>
      </div>
      <p className="mt-3 flex items-center gap-1 text-[10px] font-bold text-blue-600"><ArrowRight className="h-3 w-3" /> {note}</p>
    </article>
  );
}
