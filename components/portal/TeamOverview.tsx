
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';
import { Building2, CircleDollarSign, Users, UserCheck } from 'lucide-react';
import { formatCurrency, formatPortalDate } from '@/lib/utils';
import StatusBadge from '@/components/ui/StatusBadge';
import StatTile from '@/components/ui/StatTile';
import type { AgencyTeamOverview } from '@/lib/data/team';
import { roleLabels } from '@/lib/data/team';

export default function TeamOverview({ overview, orgName }: { overview: AgencyTeamOverview; orgName: string }) {
  return (
    <div className="portal-enter space-y-6">
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-600"><LocalizedText text={"Equipo"} /></p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-950"><LocalizedText text={"Roster de "} />{orgName}</h1>
        <p className="mt-1 text-xs text-slate-500"><LocalizedText text={"Pipeline y estado de acuerdo de cada miembro de tu equipo."} /></p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <UITranslationBoundary attributes={["label"]}><StatTile label="Miembros activos" value={overview.members.length} icon={Users} /></UITranslationBoundary>
        <UITranslationBoundary attributes={["label"]}><StatTile label="Clientes en cartera" value={overview.totalContacts} icon={UserCheck} /></UITranslationBoundary>
        <UITranslationBoundary attributes={["label"]}><StatTile label="Pipeline del equipo" value={formatCurrency(overview.totalPipelineValue)} icon={CircleDollarSign} /></UITranslationBoundary>
        <UITranslationBoundary attributes={["label"]}><StatTile label="Con acuerdo vigente" value={`${overview.membersWithValidAgreement} / ${overview.members.length}`} icon={Building2} /></UITranslationBoundary>
      </section>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-sm font-extrabold text-slate-900"><LocalizedText text={"Miembros del equipo"} /></h2>
        </div>
        {overview.members.length === 0 ? (
          <p className="p-8 text-center text-xs text-slate-400"><LocalizedText text={"Todavía no hay brokers activos en tu organización."} /></p>
        ) : (
          <div className="divide-y divide-slate-100">
            {overview.members.map((member) => (
              <div key={member.membershipId} className="grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-blue-100 text-[11px] font-extrabold text-blue-700">
                    {member.displayName.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() || '??'}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-900">{member.displayName}</p>
                    <p className="truncate text-[10px] text-slate-500">{member.email || 'sin correo'} · {roleLabels[member.role] || member.role}</p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs font-bold text-slate-800">{member.contactsCount}<LocalizedText text={" clientes"} /></p>
                  <p className="text-[10px] text-slate-500">{formatCurrency(member.pipelineValue)}<LocalizedText text={" en pipeline"} /></p>
                </div>
                <div className="text-left sm:text-right text-[10px] text-slate-500">
                  {member.agreementExpiresAt
                    ? `Vence ${formatPortalDate(member.agreementExpiresAt, { day: 'numeric', month: 'short', year: 'numeric' })}`
                    : <LocalizedText text={"Sin acuerdo individual"} />}
                </div>
                {member.agreementState === 'none' ? (
                  <UITranslationBoundary attributes={["label"]}><StatusBadge tone="neutral" label="Sin acuerdo" /></UITranslationBoundary>
                ) : (
                  <StatusBadge status={member.agreementState} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
