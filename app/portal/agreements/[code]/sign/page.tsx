
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, CalendarClock, CheckCircle2, Download, Eye, RefreshCw } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/get-user';
import { getAgreementDetailByCode, agreementState } from '@/lib/data/agreements';
import { createClient } from '@/lib/supabase/server';
import AgreementSignForm from '@/components/portal/signatures/AgreementSignForm';
import RenewAgreementButton from '@/components/portal/signatures/RenewAgreementButton';
import ManualUploadForm from '@/components/portal/signatures/ManualUploadForm';

export default async function AgreementSignPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  const currentUser = await getCurrentUser();
  if (!currentUser) redirect(`/login?next=/portal/agreements/${code}/sign`);

  const agreement = await getAgreementDetailByCode(code);
  if (!agreement) notFound();

  const belongsToBrokerOrg = currentUser.organization.id === agreement.brokerOrg.id;
  const belongsToMasterBrokerOrg = currentUser.organization.id === agreement.masterBrokerOrg.id;
  if (!belongsToBrokerOrg && !belongsToMasterBrokerOrg) notFound();

  const isAssignedSigner = agreement.signer?.email?.toLowerCase() === currentUser.email.toLowerCase();
  const state = agreementState(agreement.status, agreement.expiresAt);

  let sourcePreviewUrl: string | null = null;
  let finalPreviewUrl: string | null = null;
  let manualPreviewUrl: string | null = null;
  const supabase = await createClient();
  if (agreement.sourceStoragePath) {
    const { data } = await supabase.storage.from(agreement.sourceStorageBucket || 'private-documents').createSignedUrl(agreement.sourceStoragePath, 600);
    sourcePreviewUrl = data?.signedUrl ?? null;
  }
  if (agreement.finalStoragePath) {
    const { data } = await supabase.storage.from('private-documents').createSignedUrl(agreement.finalStoragePath, 600);
    finalPreviewUrl = data?.signedUrl ?? null;
  }
  if (agreement.manualUploadPath) {
    const { data } = await supabase.storage.from(agreement.manualUploadBucket || 'private-documents').createSignedUrl(agreement.manualUploadPath, 600);
    manualPreviewUrl = data?.signedUrl ?? null;
  }
  const isIssuer = ['super_admin', 'master_broker_admin', 'master_broker_operations'].includes(currentUser.role);

  return (
    <div className="space-y-6">
      <Link href="/portal/agreements" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600">
        <ArrowLeft className="h-4 w-4" /><LocalizedText text={" Volver a acuerdos"} /></Link>

      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-600">
          {agreement.kind === 'project_specific' && agreement.project ? agreement.project.name : 'Acuerdo general'}
        </p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-950">
          {agreement.masterBrokerOrg.name}<LocalizedText text={" &harr; "} />{agreement.brokerOrg.name}
        </h1>
        <p className="mt-2 font-mono text-[11px] font-bold tracking-wide text-slate-500"><LocalizedText text={"Referencia "} />{agreement.publicCode}</p>
        {agreement.expiresAt && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <CalendarClock className="h-3.5 w-3.5" />
            {state === 'vencido' ? <LocalizedText text={"Venció"} /> : 'Vence'}<LocalizedText text={" el "} />{new Date(agreement.expiresAt).toLocaleDateString('es-DO', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 p-4">
            <h2 className="text-sm font-extrabold text-slate-900"><LocalizedText text={"Documento"} /></h2>
            {(manualPreviewUrl || finalPreviewUrl || sourcePreviewUrl) && (
              <div className="flex items-center gap-2">
                <a
                  href={manualPreviewUrl || finalPreviewUrl || sourcePreviewUrl || ''}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                  title="Abrir en pestaña completa"
                >
                  <Eye className="h-3.5 w-3.5 text-slate-500" />
                  <span>Ver en línea</span>
                </a>
                <a
                  href={manualPreviewUrl || finalPreviewUrl || sourcePreviewUrl || ''}
                  download={`Acuerdo_${agreement.publicCode}.pdf`}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50"
                  title="Descargar archivo PDF"
                >
                  <Download className="h-3.5 w-3.5 text-slate-500" />
                  <span>Descargar PDF</span>
                </a>
              </div>
            )}
          </div>
          {(manualPreviewUrl || finalPreviewUrl || sourcePreviewUrl) ? (
            <UITranslationBoundary attributes={["title"]}><iframe src={manualPreviewUrl || finalPreviewUrl || sourcePreviewUrl || undefined} title={manualPreviewUrl ? 'Acuerdo manual' : finalPreviewUrl ? 'Acuerdo firmado' : 'Acuerdo pendiente de firma'} className="h-[600px] w-full" /></UITranslationBoundary>
          ) : (
            <p className="p-6 text-center text-xs text-slate-400"><LocalizedText text={"El documento aún se está preparando."} /></p>
          )}
        </div>

        <div className="space-y-4">
          {state === 'vigente' && (
            <div className="space-y-3 rounded-2xl border border-green-200 bg-green-50 p-5">
              <p className="flex items-center gap-2 text-sm font-extrabold text-green-800">
                <CheckCircle2 className="h-4 w-4" /><LocalizedText text={" Acuerdo firmado y vigente"} />{agreement.isManual && <span className="rounded-full bg-green-200 px-2 py-0.5 text-[10px] font-bold text-green-800"><LocalizedText text={"Manual"} /></span>}
              </p>
              <p className="text-xs text-green-700"><LocalizedText text={"Firmado el "} />{agreement.signedAt ? new Date(agreement.signedAt).toLocaleString('es-DO') : '—'}{agreement.signer?.name ? ` por ${agreement.signer.name}` : ''}.
              </p>
              {(manualPreviewUrl || finalPreviewUrl) && (
                <div className="flex flex-wrap gap-2">
                  <a href={manualPreviewUrl || finalPreviewUrl || ''} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-lg border border-green-300 bg-white px-3 text-xs font-bold text-green-700"><Eye className="h-3.5 w-3.5" /><LocalizedText text={" Ver documento firmado"} /></a>
                  <a href={manualPreviewUrl || finalPreviewUrl || ''} download={`Acuerdo_${agreement.publicCode}_firmado.pdf`} className="inline-flex h-10 items-center gap-2 rounded-lg bg-green-700 px-3 text-xs font-bold text-white"><Download className="h-3.5 w-3.5" /><LocalizedText text={" Descargar PDF"} /></a>
                </div>
              )}
            </div>
          )}

          {state === 'vencido' && (
            <div className="space-y-3 rounded-2xl border border-red-200 bg-red-50 p-5">
              <p className="text-sm font-extrabold text-red-800"><LocalizedText text={"Este acuerdo venció"} /></p>
              <p className="text-xs text-red-700"><LocalizedText text={"Debe firmarse de nuevo para seguir colaborando."} /></p>
              {finalPreviewUrl && (
                <a href={finalPreviewUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-300 bg-white px-3 text-xs font-bold text-red-700">
                  <Download className="h-3.5 w-3.5" /><LocalizedText text={" Ver documento anterior"} /></a>
              )}
              {belongsToMasterBrokerOrg && (
                <RenewAgreementButton agreementId={agreement.id} />
              )}
            </div>
          )}

          {state === 'pending_signature' && (
            <div className="space-y-4">
              {sourcePreviewUrl && (
                <div className="flex flex-wrap gap-2">
                  <a
                    href={sourcePreviewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Ver en línea</span>
                  </a>
                  <a
                    href={sourcePreviewUrl}
                    download={`Acuerdo_${agreement.publicCode}.pdf`}
                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 text-xs font-bold text-blue-700 hover:bg-blue-50"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Descargar PDF sin firmar</span>
                  </a>
                </div>
              )}
              {isAssignedSigner ? (
                <AgreementSignForm agreementId={agreement.id} signerName={agreement.signer?.name || currentUser.displayName} />
              ) : (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-xs text-amber-800"><LocalizedText text={"Este acuerdo está pendiente de firma por "} /><strong>{agreement.signer?.name}</strong> ({agreement.signer?.email}).</div>
              )}
              {isIssuer && (
                <ManualUploadForm agreementId={agreement.id} validMonths={agreement.validMonths} />
              )}
            </div>
          )}

          {state === 'draft' && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-xs text-slate-500 flex items-center gap-2">
              <RefreshCw className="h-4 w-4" /><LocalizedText text={" El acuerdo todavía se está preparando."} /></div>
          )}
        </div>
      </div>
    </div>
  );
}
