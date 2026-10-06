
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  Building2,
  CheckCircle2,
  Code2,
  Database,
  FileText,
  KeyRound,
  LifeBuoy,
  LockKeyhole,
  Server,
  Users,
  Webhook,
} from 'lucide-react';
import type { DeveloperOpsSnapshot } from '@/lib/data/developer-ops';
import LeadConflictPanel from '@/components/portal/LeadConflictPanel';

function formatTime(value: string) {
  return new Intl.DateTimeFormat('es-DO', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

function Metric({ label, value, detail, icon: Icon, tone = 'navy' }: { label: string; value: number | string; detail: string; icon: typeof Activity; tone?: 'navy' | 'green' | 'amber' | 'red' }) {
  const tones = {
    navy: 'text-[#0c094e] bg-[#eef0ff]',
    green: 'text-emerald-700 bg-emerald-50',
    amber: 'text-amber-700 bg-amber-50',
    red: 'text-rose-700 bg-rose-50',
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{value}</p>
        </div>
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tones[tone]}`}><Icon className="h-4 w-4" aria-hidden="true" /></span>
      </div>
      <p className="mt-2 text-[11px] text-slate-500">{detail}</p>
    </div>
  );
}

export default function DeveloperDashboard({ snapshot }: { snapshot: DeveloperOpsSnapshot }) {
  const quickLinks = [
    { href: '/portal/admin/users', label: 'Usuarios y permisos', detail: `${snapshot.totals.users} cuentas activas`, icon: Users },
    { href: '/portal/admin/brokers', label: 'Organizaciones', detail: `${snapshot.totals.organizations} organizaciones operativas`, icon: Building2 },
    { href: '/portal/admin/projects', label: 'Proyectos e inventario', detail: `${snapshot.totals.projects} proyectos registrados`, icon: Database },
    { href: '/portal/audit', label: 'Auditoría', detail: `${snapshot.totals.auditEventsLast24Hours} eventos en 24 horas`, icon: LockKeyhole },
    { href: '/portal/comisiones', label: 'Comisiones y pagos', detail: `${snapshot.totals.openCommissionClaims} gestiones abiertas`, icon: FileText },
    { href: '/portal/documentos', label: 'Documentos y recursos', detail: `${snapshot.totals.resources} recursos registrados`, icon: BookOpen },
  ];

  return (
    <div className="portal-enter space-y-7">
      <section className="flex flex-col gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-600"><LocalizedText text={"Control interno de plataforma"} /></p>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl"><LocalizedText text={"Centro de operaciones"} /></h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500"><LocalizedText text={"Supervisa seguridad, actividad, organizaciones, proyectos, recursos y salud operativa de OB Brokers desde una sola vista."} /></p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" /><LocalizedText text={" Sistema operativo · "} />{formatTime(snapshot.generatedAt)}</div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <UITranslationBoundary attributes={["label"]}><Metric label="Usuarios activos" value={snapshot.totals.users} detail="Cuentas con membresía vigente" icon={Users} /></UITranslationBoundary>
        <UITranslationBoundary attributes={["label"]}><Metric label="En línea ahora" value={snapshot.totals.activeSessions} detail="Sesiones en los últimos 5 minutos" icon={Activity} tone="green" /></UITranslationBoundary>
        <UITranslationBoundary attributes={["label"]}><Metric label="Eventos de uso" value={snapshot.totals.eventsLast24Hours} detail="Telemetría registrada en 24 horas" icon={Server} /></UITranslationBoundary>
        <UITranslationBoundary attributes={["label"]}><Metric label="Incidencias" value={snapshot.totals.incidentsLast7Days} detail="Alertas detectadas en auditoría, 7 días" icon={AlertTriangle} tone={snapshot.totals.incidentsLast7Days ? 'red' : 'green'} /></UITranslationBoundary>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-extrabold text-slate-950"><LocalizedText text={"Salud y capacidad"} /></h2>
              <p className="mt-1 text-xs text-slate-500"><LocalizedText text={"Estado agregado del ecosistema y sus operaciones."} /></p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-extrabold text-emerald-700"><LocalizedText text={"ESTABLE"} /></span>
          </div>
          <div className="grid divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            <div className="space-y-4 p-5"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-600"><LocalizedText text={"Organizaciones activas"} /></span><span className="font-black text-slate-950">{snapshot.totals.organizations}</span></div><div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-600"><LocalizedText text={"Agencias conectadas"} /></span><span className="font-black text-slate-950">{snapshot.totals.agencies}</span></div><div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-600"><LocalizedText text={"Desarrolladores registrados"} /></span><span className="font-black text-slate-950">{snapshot.totals.developers}</span></div><div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-600"><LocalizedText text={"Proyectos publicados"} /></span><span className="font-black text-slate-950">{snapshot.totals.publishedProjects} / {snapshot.totals.projects}</span></div></div>
            <div className="space-y-4 p-5"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-600"><LocalizedText text={"Invitaciones pendientes"} /></span><span className="font-black text-slate-950">{snapshot.totals.pendingInvitations}</span></div><div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-600"><LocalizedText text={"Gestiones de comisión abiertas"} /></span><span className="font-black text-slate-950">{snapshot.totals.openCommissionClaims}</span></div><div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-600"><LocalizedText text={"Recursos registrados"} /></span><span className="font-black text-slate-950">{snapshot.totals.resources}</span></div><div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-600"><LocalizedText text={"Eventos de auditoría, 24 h"} /></span><span className="font-black text-slate-950">{snapshot.totals.auditEventsLast24Hours}</span></div></div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-[#0c094e] p-5 text-white shadow-xs"><div className="flex items-center gap-2"><Code2 className="h-4 w-4 text-cyan-200" /><h2 className="text-sm font-extrabold"><LocalizedText text={"Versión del sistema"} /></h2></div><p className="mt-6 text-4xl font-black"><LocalizedText text={"v"} />{snapshot.system.version}</p><dl className="mt-5 space-y-3 text-xs"><div className="flex justify-between gap-4 border-b border-white/10 pb-2"><dt className="text-white/60"><LocalizedText text={"Entorno"} /></dt><dd className="font-bold">{snapshot.system.environment}</dd></div><div className="flex justify-between gap-4 border-b border-white/10 pb-2"><dt className="text-white/60"><LocalizedText text={"Revisión"} /></dt><dd className="font-bold">{snapshot.system.commit}</dd></div><div className="flex justify-between gap-4"><dt className="text-white/60"><LocalizedText text={"Acceso"} /></dt><dd className="font-bold text-emerald-300"><LocalizedText text={"Solo desarrollador"} /></dd></div></dl></div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs"><div className="border-b border-slate-100 px-5 py-4"><h2 className="text-sm font-extrabold text-slate-950"><LocalizedText text={"Actividad por proyecto"} /></h2><p className="mt-1 text-xs text-slate-500"><LocalizedText text={"Interacciones de landing, propuestas, recursos y disponibilidad."} /></p></div><div className="divide-y divide-slate-100">{snapshot.projectActivity.map((project) => <div key={project.name} className="flex items-center justify-between gap-4 px-5 py-3.5"><span className="min-w-0 truncate text-xs font-bold text-slate-800">{project.name}</span><span className="shrink-0 text-right text-xs font-black text-blue-700">{project.events}<LocalizedText text={" eventos"} />{project.activeSessions > 0 && <span className="ml-2 font-semibold text-emerald-700">· {project.activeSessions}<LocalizedText text={" en línea"} /></span>}</span></div>)}{snapshot.projectActivity.length === 0 && <p className="p-5 text-xs text-slate-500"><LocalizedText text={"Aún no hay actividad registrada."} /></p>}</div></div>
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs"><div className="border-b border-slate-100 px-5 py-4"><h2 className="text-sm font-extrabold text-slate-950"><LocalizedText text={"Actividad reciente de seguridad"} /></h2><p className="mt-1 text-xs text-slate-500"><LocalizedText text={"Últimos cambios registrados en el sistema."} /></p></div><div className="divide-y divide-slate-100">{snapshot.recentActivity.map((event, index) => <div key={`${event.occurredAt}-${index}`} className="flex items-center gap-3 px-5 py-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100"><LockKeyhole className="h-3.5 w-3.5 text-slate-600" /></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-slate-800">{event.action}</p><p className="text-[10px] text-slate-500">{event.entityType} · {formatTime(event.occurredAt)}</p></div></div>)}{snapshot.recentActivity.length === 0 && <p className="p-5 text-xs text-slate-500"><LocalizedText text={"Aún no hay eventos de auditoría."} /></p>}</div></div>
      </section>

      <LeadConflictPanel initialConflicts={snapshot.leadConflicts} />

      <section className="rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="text-sm font-extrabold text-slate-950"><LocalizedText text={"Historial de disponibilidad"} /></h2><p className="mt-1 text-xs text-slate-500"><LocalizedText text={"Cambios detectados desde fuentes externas, con el estado anterior y el nuevo valor aplicado."} /></p></div>
          <Link href="/portal/admin/projects" className="inline-flex items-center gap-1 text-xs font-bold text-blue-700"><LocalizedText text={"Ver proyectos "} /><ArrowUpRight className="h-3.5 w-3.5" /></Link>
        </div>
        <div className="divide-y divide-slate-100">
          {snapshot.inventoryChanges.map((change, index) => (
            <div key={`${change.projectName}-${change.unitCode}-${change.occurredAt}-${index}`} className="grid gap-3 px-5 py-4 lg:grid-cols-[minmax(170px,.7fr)_minmax(130px,.45fr)_minmax(0,1fr)_auto] lg:items-center">
              <div><p className="text-xs font-extrabold text-slate-900">{change.projectName}</p><p className="mt-1 text-[10px] font-bold text-slate-500">{change.unitCode} · {change.source}</p></div>
              <div><span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-extrabold text-blue-700">{change.kind.replaceAll('_', ' ')}</span><p className="mt-2 text-[10px] text-slate-500">{formatTime(change.occurredAt)}</p></div>
              <div className="space-y-1.5">{change.changes.length ? change.changes.map((detail, detailIndex) => <p key={detailIndex} className="text-[11px] text-slate-600"><span className="font-bold text-slate-800">{detail.label}:</span> <span className="line-through text-rose-600">{detail.oldValue}</span> <span className="px-1 text-slate-400">→</span><span className="font-bold text-emerald-700">{detail.newValue}</span></p>) : <p className="text-[11px] text-slate-500"><LocalizedText text={"Cambio de disponibilidad registrado."} /></p>}</div>
              <span className={change.status === 'succeeded' ? 'text-[10px] font-extrabold text-emerald-700' : 'text-[10px] font-extrabold text-amber-700'}>{change.status === 'succeeded' ? 'APLICADO' : change.status.toUpperCase()}</span>
            </div>
          ))}
          {snapshot.inventoryChanges.length === 0 && <div className="px-5 py-10 text-center"><p className="text-xs font-bold text-slate-700"><LocalizedText text={"Aún no hay cambios externos registrados."} /></p><p className="mt-1 text-[11px] text-slate-500"><LocalizedText text={"Cuando una conexión actualice precio, estado o especificaciones, aparecerá aquí con su comparación."} /></p></div>}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="text-sm font-extrabold text-slate-950"><LocalizedText text={"Directorio operativo"} /></h2><p className="mt-1 text-xs text-slate-500"><LocalizedText text={"Organizaciones, miembros y proyectos que existen en el sistema."} /></p></div>
          <Link href="/portal/admin/brokers" className="inline-flex items-center gap-1 text-xs font-bold text-blue-700"><LocalizedText text={"Administrar organizaciones "} /><ArrowUpRight className="h-3.5 w-3.5" /></Link>
        </div>
        <div className="divide-y divide-slate-100">
          {snapshot.organizations.map((organization) => (
            <div key={organization.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto] sm:items-center">
              <div className="min-w-0"><p className="truncate text-xs font-extrabold text-slate-900">{organization.name}</p><p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-slate-400">{organization.kind.replace('_', ' ')} · {organization.status}</p></div>
              <span className="text-xs text-slate-600"><strong className="font-black text-slate-950">{organization.users}</strong><LocalizedText text={" usuarios"} /></span>
              <span className="text-xs text-slate-600"><strong className="font-black text-slate-950">{organization.projects}</strong><LocalizedText text={" proyectos"} /></span>
              <Link href={`/portal/admin/brokers/${organization.slug}`} className="text-xs font-bold text-blue-700"><LocalizedText text={"Ver detalle"} /></Link>
            </div>
          ))}
          {snapshot.organizations.length === 0 && <p className="p-5 text-xs text-slate-500"><LocalizedText text={"No hay organizaciones operativas registradas."} /></p>}
        </div>
      </section>

      <section><div className="mb-3 flex items-end justify-between"><div><h2 className="text-sm font-extrabold text-slate-950"><LocalizedText text={"Accesos de operación"} /></h2><p className="mt-1 text-xs text-slate-500"><LocalizedText text={"Entradas directas a los módulos que requieren supervisión."} /></p></div></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{quickLinks.map(({ href, label, detail, icon: Icon }) => <Link key={href} href={href} className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-xs"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#0c094e] group-hover:bg-[#eef0ff]"><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-xs font-extrabold text-slate-900">{label}</span><span className="mt-1 block truncate text-[11px] text-slate-500">{detail}</span></span><ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-blue-600" /></Link>)}</div></section>

      <section id="integrations" className="rounded-xl border border-slate-200 bg-white shadow-xs"><div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><Webhook className="h-4 w-4 text-blue-600" /><h2 className="text-sm font-extrabold text-slate-950"><LocalizedText text={"Integraciones y automatización"} /></h2></div><p className="mt-1 text-xs text-slate-500"><LocalizedText text={"API keys, webhooks y documentación técnica se administrarán aquí cuando se habilite la integración externa."} /></p></div><div className="flex gap-2"><Link href="#api-keys" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-700"><KeyRound className="h-3.5 w-3.5" /><LocalizedText text={" API keys"} /></Link><Link href="#support" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-700"><LifeBuoy className="h-3.5 w-3.5" /><LocalizedText text={" Soporte"} /></Link></div></div><div className="grid gap-3 p-5 sm:grid-cols-3"><div id="api-keys" className="rounded-lg bg-slate-50 p-4"><p className="text-xs font-extrabold text-slate-900"><LocalizedText text={" API keys"} /></p><p className="mt-1 text-[11px] leading-5 text-slate-500"><LocalizedText text={"Aún no hay claves públicas creadas."} /></p></div><div className="rounded-lg bg-slate-50 p-4"><p className="text-xs font-extrabold text-slate-900"><LocalizedText text={"Webhooks"} /></p><p className="mt-1 text-[11px] leading-5 text-slate-500"><LocalizedText text={"Los eventos internos ya se registran; la entrega externa queda pendiente de activación."} /></p></div><div id="support" className="rounded-lg bg-slate-50 p-4"><p className="text-xs font-extrabold text-slate-900"><LocalizedText text={"Soporte operativo"} /></p><p className="mt-1 text-[11px] leading-5 text-slate-500"><LocalizedText text={"Las incidencias actuales se identifican desde Auditoría y las gestiones de comisión."} /></p></div></div></section>
    </div>
  );
}
