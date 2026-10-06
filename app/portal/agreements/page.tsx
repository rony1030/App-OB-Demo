
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CalendarClock, Eye, FileSignature } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/get-user';
import {
  getIssuedAgreements,
  getMyAgreements,
  getOrganizationAgreementSettings,
  listOrgPublishedProjects,
  listOtherOrganizations,
  type AgreementSummary,
} from '@/lib/data/agreements';
import CreateAgreementForm from '@/components/portal/agreements/CreateAgreementForm';
import StatusBadge from '@/components/ui/StatusBadge';
import AgreementActions from '@/components/portal/agreements/AgreementActions';

export default async function AgreementsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/login?next=/portal/agreements');
  // Agencies only receive and sign agreements. Issuance is reserved for the
  // master broker side, even when an agency administrator manages its team.
  const isIssuer = ['super_admin', 'master_broker_admin', 'master_broker_operations'].includes(currentUser.role);

  const [myAgreements, issuedAgreements] = await Promise.all([
    getMyAgreements(),
    isIssuer ? getIssuedAgreements() : Promise.resolve([] as AgreementSummary[]),
  ]);

  let otherOrgs: Awaited<ReturnType<typeof listOtherOrganizations>> = [];
  let projects: Awaited<ReturnType<typeof listOrgPublishedProjects>> = [];
  let defaultValidMonths = 12;
  if (isIssuer) {
    [otherOrgs, projects, { defaultValidMonths }] = await Promise.all([
      listOtherOrganizations(currentUser.organization.id),
      listOrgPublishedProjects(currentUser.organization.id),
      getOrganizationAgreementSettings(currentUser.organization.id),
    ]);
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-600"><LocalizedText text={"Acuerdos de colaboración"} /></p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-950"><LocalizedText text={"Firma y vigencia"} /></h1>
        <p className="mt-1 text-xs text-slate-500"><LocalizedText text={"Selecciona la desarrolladora, completa tu expediente y firma de forma segura. Cada acuerdo conserva su propia vigencia."} /></p>
      </div>

      {isIssuer && (
        <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
          <CreateAgreementForm
            otherOrgs={otherOrgs}
            projects={projects}
            defaultValidMonths={defaultValidMonths}
            defaultRepName={currentUser.organization.id === 1 ? 'Gleivys Osvaldo Bello' : currentUser.displayName}
            defaultRepEmail={currentUser.email}
            defaultRepPosition={currentUser.organization.id === 1 ? 'Gerente General' : undefined}
            defaultCommissionRate={currentUser.organization.id === 1 ? 5 : undefined}
            defaultCommissionTerms={currentUser.organization.id === 1 ? 'Para Cipres Residences: 5% más ITBIS. 50% de la comisión cuando el cliente haya saldado el 10% del valor del inmueble, completado las documentaciones de venta y firmado el contrato de opción a compra; y el restante 50% cuando el cliente haya pagado un 10% adicional (total 20% de la compra) y la desarrolladora haya confirmado los pagos del mismo.' : undefined}
          />
          <UITranslationBoundary attributes={["title"]}><AgreementTable title="Acuerdos emitidos" agreements={issuedAgreements} showBrokerOrg forBroker={false} /></UITranslationBoundary>
        </div>
      )}

      <UITranslationBoundary attributes={["title"]}><AgreementTable
        title={isIssuer ? 'Tus propios acuerdos (como broker)' : 'Mis acuerdos'}
        agreements={myAgreements}
        showBrokerOrg={false}
        forBroker
      /></UITranslationBoundary>
    </div>
  );
}

function AgreementTable({
  title,
  agreements,
  showBrokerOrg,
  forBroker,
}: {
  title: string;
  agreements: AgreementSummary[];
  showBrokerOrg: boolean;
  forBroker: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 p-4">
        <FileSignature className="h-4 w-4 text-blue-600" />
        <h2 className="text-sm font-extrabold text-slate-900">{title}</h2>
      </div>
      {agreements.length === 0 ? (
        <p className="p-6 text-center text-xs text-slate-400"><LocalizedText text={"No hay acuerdos todavía."} /></p>
      ) : (
        <div className="divide-y divide-slate-100">
          {agreements.map((agreement) => (
            <div key={agreement.id} className="grid gap-2 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
              <div>
                <p className="text-xs font-bold text-slate-900">
                  {agreement.kind === 'project_specific' && agreement.project ? agreement.project.name : 'Acuerdo general'}
                  {showBrokerOrg && <span className="text-slate-400"> · {agreement.brokerOrg.name}</span>}
                </p>
                <p className="mt-1 font-mono text-[10px] font-bold tracking-wide text-slate-400">{agreement.publicCode}</p>
                <p className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500">
                  <CalendarClock className="h-3 w-3" />
                  {agreement.expiresAt
                    ? `Vence ${new Date(agreement.expiresAt).toLocaleDateString('es-DO', { day: 'numeric', month: 'short', year: 'numeric' })}`
                    : `Vigencia: ${agreement.validMonths} mes(es) desde la firma`}
                </p>
              </div>
              <StatusBadge status={agreement.state} />
              <AgreementActions publicCode={agreement.publicCode} state={agreement.state} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
