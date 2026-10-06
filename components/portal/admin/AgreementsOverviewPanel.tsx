
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';
import Link from 'next/link';
import { CalendarClock, FileSignature, ShieldCheck, Users } from 'lucide-react';
import type { AgreementsOverview, AgreementSummary } from '@/lib/data/agreements';
import StatusBadge from '@/components/ui/StatusBadge';
import StatTile from '@/components/ui/StatTile';

export default function AgreementsOverviewPanel({
  overview,
  issuedAgreements,
}: {
  overview: AgreementsOverview;
  issuedAgreements: AgreementSummary[];
}) {
  const brokerRoster = new Map<number, AgreementSummary>();
  for (const agreement of issuedAgreements) {
    if (!agreement.signerMembershipId) continue;
    const existing = brokerRoster.get(agreement.signerMembershipId);
    if (!existing || new Date(agreement.signedAt || 0) > new Date(existing.signedAt || 0)) {
      brokerRoster.set(agreement.signerMembershipId, agreement);
    }
  }

  return (
    <section id="access" className="scroll-mt-28 space-y-4">
      <div>
        <h2 className="text-base font-extrabold text-slate-900"><LocalizedText text={"Brokers y acuerdos de colaboración"} /></h2>
        <p className="mt-0.5 text-xs text-slate-500"><LocalizedText text={"Vista de gerencia: quién trabaja con la red y su estado de firma."} /></p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <UITranslationBoundary attributes={["label"]}><StatTile label="Organizaciones broker" value={overview.totalBrokerOrganizations} icon={Users} /></UITranslationBoundary>
        <UITranslationBoundary attributes={["label"]}><StatTile label="Acuerdos vigentes" value={overview.vigente} icon={ShieldCheck} /></UITranslationBoundary>
        <UITranslationBoundary attributes={["label"]}><StatTile label="Acuerdos vencidos" value={overview.vencido} icon={CalendarClock} /></UITranslationBoundary>
        <UITranslationBoundary attributes={["label"]}><StatTile label="Pendientes de firma" value={overview.pendingSignature} icon={FileSignature} /></UITranslationBoundary>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="border-b border-slate-100 p-4">
          <h3 className="text-sm font-extrabold text-slate-900"><LocalizedText text={"Brokers activos por proyecto"} /></h3>
        </div>
        {overview.byProject.length === 0 ? (
          <p className="p-6 text-center text-xs text-slate-400"><LocalizedText text={"No hay proyectos registrados todavía."} /></p>
        ) : (
          <div className="divide-y divide-slate-100">
            {overview.byProject.map((row) => (
              <div key={row.projectId} className="flex items-center justify-between px-4 py-3 text-xs">
                <span className="font-semibold text-slate-700">{row.projectName}</span>
                <span className="font-extrabold text-blue-600">{row.brokerCount}<LocalizedText text={" broker(s)"} /></span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="border-b border-slate-100 p-4">
          <h3 className="text-sm font-extrabold text-slate-900"><LocalizedText text={"Ficha de brokers"} /></h3>
        </div>
        {brokerRoster.size === 0 ? (
          <p className="p-6 text-center text-xs text-slate-400"><LocalizedText text={"Todavía no has emitido acuerdos."} /></p>
        ) : (
          <div className="divide-y divide-slate-100">
            {[...brokerRoster.entries()].map(([membershipId, agreement]) => (
              <div key={membershipId} className="grid gap-2 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                <div>
                  <p className="text-xs font-bold text-slate-900">{agreement.signerName || 'Sin nombre'}</p>
                  <p className="mt-1 text-[10px] text-slate-500">{agreement.brokerOrg.name}</p>
                </div>
                <StatusBadge status={agreement.state} />
                <Link href={`/portal/admin/brokers/${agreement.brokerOrg.slug}`} className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 px-3 text-[10px] font-bold text-slate-600 hover:bg-slate-50"><LocalizedText text={"Ver ficha"} /></Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
