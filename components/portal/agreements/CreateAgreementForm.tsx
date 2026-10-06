'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useActionState, useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, FileSignature, Loader2 } from 'lucide-react';
import { createAgreementAction, getBrokerOrgMembersAction } from '@/app/portal/agreements/actions';
import type { DirectoryOrg, DirectoryMember } from '@/lib/data/agreements';
import { cn } from '@/lib/utils';

type ActionState = { success?: boolean; error?: string; agreementId?: number };

export default function CreateAgreementForm({
  otherOrgs,
  projects,
  defaultValidMonths,
  defaultRepName,
  defaultRepEmail,
  defaultRepPosition,
  defaultCommissionRate,
  defaultCommissionTerms,
}: {
  otherOrgs: DirectoryOrg[];
  projects: { id: number; name: string; slug: string }[];
  defaultValidMonths: number;
  defaultRepName?: string;
  defaultRepEmail?: string;
  defaultRepPosition?: string;
  defaultCommissionRate?: number;
  defaultCommissionTerms?: string;
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(createAgreementAction, {});
  const [orgId, setOrgId] = useState('');
  const [members, setMembers] = useState<DirectoryMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [membershipId, setMembershipId] = useState('');
  const [kind, setKind] = useState<'general' | 'project_specific'>('general');
  const [showLegal, setShowLegal] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    let active = true;
    getBrokerOrgMembersAction(Number(orgId))
      .then((nextMembers) => {
        if (active) setMembers(nextMembers);
      })
      .finally(() => {
        if (active) setLoadingMembers(false);
      });
    return () => {
      active = false;
    };
  }, [orgId]);

  const selectedOrg = otherOrgs.find((o) => String(o.id) === orgId);
  const selectedMember = members.find((m) => String(m.membershipId) === membershipId);

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <FileSignature className="h-4 w-4 text-blue-600" />
        <h3 className="text-sm font-extrabold text-slate-900"><LocalizedText text={"Emitir acuerdo de colaboración"} /></h3>
      </div>

      <input type="hidden" name="brokerOrganizationName" value={selectedOrg?.name || ''} />
      <input type="hidden" name="signerName" value={selectedMember?.displayName || ''} />
      <input type="hidden" name="signerEmail" value={selectedMember?.email || ''} />

      <div>
        <label className="mb-1 block text-[11px] font-bold text-slate-700"><LocalizedText text={"Organización del broker"} /></label>
        <select
          name="brokerOrganizationId"
          value={orgId}
          onChange={(e) => {
            const nextOrgId = e.target.value;
            setOrgId(nextOrgId);
            setMembershipId('');
            setMembers([]);
            setLoadingMembers(Boolean(nextOrgId));
          }}
          required
          className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-400"
        >
          <option value=""><LocalizedText text={"Selecciona una organización..."} /></option>
          {otherOrgs.map((org) => (
            <option key={org.id} value={org.id}>{org.name} ({org.kind})</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-[11px] font-bold text-slate-700"><LocalizedText text={"Firmante"} /></label>
        <select
          name="signerMembershipId"
          value={membershipId}
          onChange={(e) => setMembershipId(e.target.value)}
          required
          disabled={!orgId || loadingMembers}
          className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-400 disabled:bg-slate-50"
        >
          <option value="">{loadingMembers ? <LocalizedText text={"Cargando..."} /> : <LocalizedText text={"Selecciona un firmante..."} />}</option>
          {members.map((m) => (
            <option key={m.membershipId} value={m.membershipId} disabled={!m.email}>
              {m.displayName}{m.email ? ` · ${m.email}` : <LocalizedText text={" · sin email registrado"} />}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-[11px] font-bold text-slate-700"><LocalizedText text={"Alcance"} /></label>
          <select
            name="kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as 'general' | 'project_specific')}
            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-400"
          >
            <option value="general"><LocalizedText text={"General (toda la red)"} /></option>
            <option value="project_specific"><LocalizedText text={"Específico de proyecto"} /></option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-bold text-slate-700"><LocalizedText text={"Vigencia (meses)"} /></label>
          <input
            type="number"
            name="validMonths"
            min={1}
            defaultValue={defaultValidMonths}
            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-400"
          />
        </div>
      </div>

      {kind === 'project_specific' && (
        <div>
          <label className="mb-1 block text-[11px] font-bold text-slate-700"><LocalizedText text={"Proyecto"} /></label>
          <select name="projectId" required className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-400">
            <option value=""><LocalizedText text={"Selecciona un proyecto..."} /></option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-[11px] font-bold text-slate-700"><LocalizedText text={"Comisión (%)"} /></label>
          <UITranslationBoundary attributes={["placeholder"]}><input
            type="number"
            name="commissionRate"
            step="0.1"
            min={0}
            max={100}
            placeholder="Ej. 4"
            defaultValue={defaultCommissionRate}
            className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-400"
          /></UITranslationBoundary>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-bold text-slate-700"><LocalizedText text={"Cédula/RNC del firmante"} /></label>
          <UITranslationBoundary attributes={["placeholder"]}><input name="signerIdNumber" placeholder="Ej. 001-0000000-0" className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-400" /></UITranslationBoundary>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-[11px] font-bold text-slate-700"><LocalizedText text={"Cómo se paga la comisión"} /></label>
        <UITranslationBoundary attributes={["placeholder"]}><textarea
          name="commissionTerms"
          rows={2}
          defaultValue={defaultCommissionTerms}
          placeholder="Ej. 50% al verificar el pago del 10% del inmueble, 50% al completar el 20%."
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-400"
        /></UITranslationBoundary>
      </div>

      <button
        type="button"
        onClick={() => setShowLegal((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-bold text-slate-600"
      ><LocalizedText text={"Datos legales del contrato (RNC, domicilio, representante)"} />{showLegal ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {showLegal && (
        <div className="space-y-3 rounded-lg border border-slate-100 bg-slate-50/50 p-3">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400"><LocalizedText text={"Broker ("} />{selectedOrg?.name || 'organización'})</p>
          <div className="grid grid-cols-2 gap-3">
            <UITranslationBoundary attributes={["placeholder"]}><input name="brokerOrgTaxId" placeholder="RNC de la empresa" className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-400" /></UITranslationBoundary>
            <UITranslationBoundary attributes={["placeholder"]}><input name="brokerOrgAddress" placeholder="Domicilio legal" className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-400" /></UITranslationBoundary>
          </div>

          <p className="pt-1 text-[10px] font-extrabold uppercase tracking-wide text-slate-400"><LocalizedText text={"Representante de tu organización (Master Bróker)"} /></p>
          <div className="grid grid-cols-2 gap-3">
            <UITranslationBoundary attributes={["placeholder"]}><input name="masterBrokerRepName" defaultValue={defaultRepName} placeholder="Nombre completo" className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-400" /></UITranslationBoundary>
            <UITranslationBoundary attributes={["placeholder"]}><input name="masterBrokerRepPosition" defaultValue={defaultRepPosition} placeholder="Cargo (Ej. Gerente General)" className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-400" /></UITranslationBoundary>
            <UITranslationBoundary attributes={["placeholder"]}><input name="masterBrokerRepId" placeholder="Cédula" className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-400" /></UITranslationBoundary>
            <UITranslationBoundary attributes={["placeholder"]}><input name="masterBrokerRepEmail" type="email" defaultValue={defaultRepEmail} placeholder="Correo de contacto" className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-blue-400" /></UITranslationBoundary>
          </div>
        </div>
      )}

      {state.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700">{state.error}</p>}
      <p className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-[11px] leading-5 text-amber-900"><LocalizedText text={"Antes de firmar, revisa que la empresa, representante, domicilio, RNC y documentos requeridos estén completos en la configuración de la organización."} /></p>
      {state.success && <p className="rounded-lg bg-green-50 px-3 py-2 text-[11px] font-semibold text-green-700"><LocalizedText text={"Acuerdo creado y listo para firmar."} /></p>}

      <button
        type="submit"
        disabled={isPending || !membershipId}
        className={cn('inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-xs font-bold text-white', (isPending || !membershipId) && 'opacity-60')}
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSignature className="h-4 w-4" />}<LocalizedText text={"Crear acuerdo"} /></button>
    </form>
  );
}
