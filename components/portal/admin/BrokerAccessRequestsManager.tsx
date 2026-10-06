'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useRouter } from 'next/navigation';
import { type FormEvent, useMemo, useState, useTransition } from 'react';
import { Building2, CheckCircle2, Clock3, Copy, ExternalLink, FolderKanban, Mail, Phone, Send, UserRound, X } from 'lucide-react';
import {
  completeApprovedBrokerRequestAsAgencyAction,
  issueBrokerAccessInvitationAction,
  reviewBrokerAccessRequestAction,
  type BrokerAccessRequestStatus,
} from '@/app/portal/admin/broker-requests/actions';

export type BrokerAccessRequest = {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  agency: string | null;
  role_type: string;
  project_interest: string | null;
  message: string | null;
  status: string;
  review_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
};

type ProjectOption = { id: number; name: string; slug: string };
type OrganizationOption = { id: number; name: string; kind: string };
type ActiveOrganization = { id: number; name: string; kind: string };
type InvitationSummary = { inviteUrl: string; emailSent?: boolean; emailError?: string; organizationName: string };
type AgencyDraft = {
  name: string;
  contactEmail: string;
  contactPhone: string;
  adminName: string;
  adminEmail: string;
  projectIds: number[];
};

const statuses: Array<{ value: BrokerAccessRequestStatus; label: string }> = [
  { value: 'contacted', label: 'Marcar contactado' },
  { value: 'changes_requested', label: 'Solicitar información' },
  { value: 'rejected', label: 'Rechazar' },
];

const statusLabels: Record<string, string> = {
  pending_review: 'Pendiente de revisión',
  contacted: 'Contactado',
  approved: 'Aprobado · falta emitir acceso',
  changes_requested: 'Información solicitada',
  rejected: 'Rechazado',
  converted: 'Invitación emitida',
};

function normalize(value: string) {
  return value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function expectedOrganizationKinds(request: BrokerAccessRequest, isSuperAdmin: boolean, currentOrganization: ActiveOrganization) {
  const roleType = normalize(request.role_type);
  if (roleType === 'master broker') return ['master_broker'];
  if (roleType === 'director de agencia') return ['agency'];
  return isSuperAdmin ? ['agency', 'master_broker'] : [currentOrganization.kind];
}

function resolvedRoleLabel(request: BrokerAccessRequest) {
  const normalized = normalize(request.role_type);
  if (normalized === 'director de agencia') return 'Administrador de agencia · registro sujeto a revisión';
  if (normalized === 'master broker') return 'Administrador principal de Master Broker';
  return 'Vendedor / Asesor inmobiliario';
}

function needsPlatformAdminForRequest(request: BrokerAccessRequest, isSuperAdmin: boolean) {
  return normalize(request.role_type) === 'director de agencia' && !isSuperAdmin;
}

function projectMatchesInterest(project: ProjectOption, interest: string | null) {
  if (!interest) return false;
  const normalizedInterest = normalize(interest);
  return normalize(project.name) === normalizedInterest || normalize(project.slug) === normalizedInterest;
}

export default function BrokerAccessRequestsManager({
  initialRequests,
  projects,
  organizations,
  currentOrganization,
  isSuperAdmin,
  canIssueInvitations,
}: {
  initialRequests: BrokerAccessRequest[];
  projects: ProjectOption[];
  organizations: OrganizationOption[];
  currentOrganization: ActiveOrganization;
  isSuperAdmin: boolean;
  canIssueInvitations: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState<Record<number, string>>(
    Object.fromEntries(initialRequests.map((request) => [request.id, request.review_notes || ''])),
  );
  const [error, setError] = useState('');
  const [activeRequest, setActiveRequest] = useState<BrokerAccessRequest | null>(null);
  const [organizationId, setOrganizationId] = useState('');
  const [createNewAgency, setCreateNewAgency] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [invitation, setInvitation] = useState<InvitationSummary | null>(null);
  const [copied, setCopied] = useState(false);
  const [showAgencyRegistration, setShowAgencyRegistration] = useState(false);
  const [agencyDraft, setAgencyDraft] = useState<AgencyDraft>({
    name: '', contactEmail: '', contactPhone: '', adminName: '', adminEmail: '', projectIds: [],
  });

  const visibleProjects = useMemo(() => projects, [projects]);
  const allAgencyProjectsSelected = visibleProjects.length > 0
    && visibleProjects.every((project) => agencyDraft.projectIds.includes(project.id));

  function updateRequest(requestId: number, status: BrokerAccessRequestStatus) {
    setError('');
    startTransition(async () => {
      const result = await reviewBrokerAccessRequestAction(requestId, status, notes[requestId] || '');
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function openInvitation(request: BrokerAccessRequest) {
    const kinds = expectedOrganizationKinds(request, isSuperAdmin, currentOrganization);
    const companyMatch = organizations.find((organization) =>
      kinds.includes(organization.kind) && normalize(organization.name) === normalize(request.agency || ''),
    );
    setActiveRequest(request);
    setShowAgencyRegistration(false);
    setOrganizationId(String(companyMatch?.id || (!isSuperAdmin ? currentOrganization.id : '')));
    setCreateNewAgency(normalize(request.role_type) === 'director de agencia' && !companyMatch && Boolean(request.agency));
    setSelectedProjects(visibleProjects.filter((project) => projectMatchesInterest(project, request.project_interest)).map((project) => project.id));
    setInvitation(null);
    setError('');
    setCopied(false);
  }

  function openAgencyRegistration(request: BrokerAccessRequest) {
    setActiveRequest(request);
    setShowAgencyRegistration(true);
    setAgencyDraft({
      name: request.agency || '',
      contactEmail: request.email,
      contactPhone: request.phone,
      adminName: request.full_name,
      adminEmail: request.email,
      projectIds: visibleProjects
        .filter((project) => projectMatchesInterest(project, request.project_interest))
        .map((project) => project.id),
    });
    setInvitation(null);
    setError('');
    setCopied(false);
  }

  function closeModal() {
    if (isPending) return;
    setActiveRequest(null);
    setShowAgencyRegistration(false);
    setInvitation(null);
    setError('');
  }

  function issueInvitation() {
    if (!activeRequest) return;
    setError('');
    startTransition(async () => {
      const result = await issueBrokerAccessInvitationAction({
        requestId: activeRequest.id,
        organizationId: organizationId ? Number(organizationId) : undefined,
        createAgencyFromRequest: createNewAgency,
        projectIds: selectedProjects,
        reviewNotes: notes[activeRequest.id] || '',
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.invitation) setInvitation(result.invitation);
      if (result.warning) setError(result.warning);
      router.refresh();
    });
  }

  function completeAgencyRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeRequest) return;
    const formData = new FormData(event.currentTarget);
    const submittedAgencyName = String(formData.get('agencyName') || '').trim();
    if (!submittedAgencyName) {
      setError('Escribe el nombre comercial de la agencia antes de continuar.');
      return;
    }
    setError('');
    startTransition(async () => {
      const result = await completeApprovedBrokerRequestAsAgencyAction({
        requestId: activeRequest.id,
        agencyName: submittedAgencyName,
        contactEmail: agencyDraft.contactEmail,
        contactPhone: agencyDraft.contactPhone,
        adminName: agencyDraft.adminName,
        adminEmail: agencyDraft.adminEmail,
        projectIds: agencyDraft.projectIds,
        reviewNotes: notes[activeRequest.id] || '',
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.invitation) setInvitation(result.invitation);
      if (result.warning) setError(result.warning);
      router.refresh();
    });
  }

  const availableOrganizations = activeRequest
    ? organizations.filter((organization) => expectedOrganizationKinds(activeRequest, isSuperAdmin, currentOrganization).includes(organization.kind))
    : [];

  if (!initialRequests.length) {
    return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500"><LocalizedText text={"No hay solicitudes de brokers para revisar."} /></div>;
  }

  return (
    <div className="space-y-4">
      {error && !activeRequest && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
      {initialRequests.map((request) => (
        <article key={request.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-black text-slate-950">{request.full_name}</h2>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600">{statusLabels[request.status] || request.status}</span>
              </div>
              <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                <span className="inline-flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-blue-600" />{request.email}</span>
                <span className="inline-flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-blue-600" />{request.phone}</span>
                <span className="inline-flex items-center gap-2"><Building2 className="h-3.5 w-3.5 text-blue-600" />{request.agency || 'Empresa no indicada'}</span>
                <span className="inline-flex items-center gap-2"><UserRound className="h-3.5 w-3.5 text-blue-600" /><LocalizedText text={"Solicita: "} />{request.role_type}</span>
                <span className="inline-flex items-center gap-2"><Clock3 className="h-3.5 w-3.5 text-blue-600" /><LocalizedText text={"Recibido "} />{new Date(request.created_at).toLocaleDateString('es-DO')}</span>
              </div>
              {request.project_interest && <p className="text-xs font-bold text-slate-700"><LocalizedText text={"Proyecto de interés: "} /><span className="font-medium">{request.project_interest}</span></p>}
              {request.message && <p className="max-w-3xl whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">{request.message}</p>}
            </div>
            {request.status === 'converted' && <div className="flex shrink-0 items-center gap-2 text-xs font-bold text-emerald-700"><CheckCircle2 className="h-4 w-4" /><LocalizedText text={"Invitación creada; la cuenta se activa al completar el registro."} /></div>}
          </div>
          <div className="mt-5 border-t border-slate-100 pt-4">
            <label className="block text-xs font-bold text-slate-600"><LocalizedText text={"Notas internas"} /></label>
            <UITranslationBoundary attributes={["placeholder"]}><textarea value={notes[request.id] || ''} onChange={(event) => setNotes((current) => ({ ...current, [request.id]: event.target.value }))} rows={2} placeholder="Ej. Empresa, licencia, perfil y proyectos que se deben habilitar." className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50" /></UITranslationBoundary>
            <div className="mt-3 flex flex-wrap gap-2">
              {canIssueInvitations && request.status !== 'converted' && request.status !== 'rejected' && (
                <button
                  type="button"
                  disabled={isPending || (request.status === 'approved' ? !isSuperAdmin : needsPlatformAdminForRequest(request, isSuperAdmin))}
                  onClick={() => request.status === 'approved' ? openAgencyRegistration(request) : openInvitation(request)}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-950 px-4 py-2.5 text-[11px] font-black text-white transition hover:bg-indigo-800 disabled:opacity-60"
                >
                  <Send className="h-3.5 w-3.5" />{request.status === 'approved' ? <LocalizedText text={"Completar acceso"} /> : <LocalizedText text={"Revisar y emitir acceso"} />}
                </button>
              )}
              {request.status !== 'converted' && request.status !== 'rejected' && statuses.map((item) => (
                <button key={item.value} type="button" disabled={isPending} onClick={() => updateRequest(request.id, item.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[11px] font-black text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-wait disabled:opacity-60">{item.label}</button>
              ))}
            </div>
            {!canIssueInvitations && request.status !== 'converted' && request.status !== 'rejected' && <p className="mt-3 text-xs text-amber-700"><LocalizedText text={"Puedes revisar y dejar notas, pero un administrador con permiso de membresías debe emitir el acceso."} /></p>}
            {needsPlatformAdminForRequest(request, isSuperAdmin) && request.status !== 'converted' && request.status !== 'rejected' && <p className="mt-3 text-xs text-amber-700"><LocalizedText text={"Los perfiles de director de agencia y el alta de una agencia nueva deben ser gestionados por un superadministrador."} /></p>}
            {request.status === 'approved' && !isSuperAdmin && <p className="mt-3 text-xs text-amber-700"><LocalizedText text={"Solo un superadministrador puede completar el acceso registrando la nueva agencia."} /></p>}
          </div>
        </article>
      ))}

      {activeRequest && !showAgencyRegistration && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal(); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="broker-invite-title" className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-600"><LocalizedText text={"Revisión de acceso profesional"} /></p>
                <h2 id="broker-invite-title" className="mt-1 text-xl font-black text-slate-950"><LocalizedText text={"Empresa, membresía y acceso"} /></h2>
                <p className="mt-1 text-sm text-slate-500"><LocalizedText text={"Confirma los datos y define qué podrá ver antes de enviar la invitación."} /></p>
              </div>
              <UITranslationBoundary attributes={["aria-label"]}><button type="button" onClick={closeModal} disabled={isPending} aria-label="Cerrar" className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button></UITranslationBoundary>
            </div>

            {invitation ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-center gap-2 font-black text-emerald-900"><CheckCircle2 className="h-5 w-5" /><LocalizedText text={"Invitación creada para "} />{activeRequest.email}</div>
                  <p className="mt-1 text-sm text-emerald-800"><LocalizedText text={"Empresa: "} />{invitation.organizationName}. {normalize(activeRequest.role_type) === 'director de agencia' ? <LocalizedText text={"La persona completará primero los datos legales de la agencia; OB Brokers deberá revisarlos antes de activar la membresía."} /> : <LocalizedText text={"La cuenta y membresía quedarán activas cuando la persona abra el enlace y cree su contraseña."} />}</p>
                  {invitation.emailSent ? <p className="mt-2 text-xs font-semibold text-emerald-800"><LocalizedText text={"El correo de invitación fue enviado."} /></p> : <p className="mt-2 text-xs font-semibold text-amber-800">{invitation.emailError || 'No se confirmó el envío del correo.'}<LocalizedText text={" Comparte manualmente este enlace:"} /></p>}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input readOnly value={invitation.inviteUrl} className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-700" />
                  <button type="button" onClick={async () => { await navigator.clipboard.writeText(invitation.inviteUrl); setCopied(true); }} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-xs font-black text-slate-700 hover:bg-slate-50"><Copy className="h-4 w-4" />{copied ? 'Copiado' : 'Copiar enlace'}</button>
                  <a href={invitation.inviteUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-950 px-4 py-3 text-xs font-black text-white hover:bg-indigo-800"><ExternalLink className="h-4 w-4" /><LocalizedText text={"Abrir"} /></a>
                </div>
                {invitation.emailSent && <p className="text-xs text-slate-500"><LocalizedText text={"Si hace falta, también puedes copiar el enlace para enviarlo por otro medio."} /></p>}
                <div className="flex justify-end"><button type="button" onClick={closeModal} className="rounded-xl bg-slate-100 px-5 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-200"><LocalizedText text={"Cerrar"} /></button></div>
              </div>
            ) : (
              <>
                <div className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
                  <div><span className="text-[10px] font-black uppercase tracking-wide text-slate-500"><LocalizedText text={"Solicitante"} /></span><p className="mt-1 text-sm font-bold text-slate-900">{activeRequest.full_name}</p><p className="text-xs text-slate-600">{activeRequest.email} · {activeRequest.phone}</p></div>
                  <div><span className="text-[10px] font-black uppercase tracking-wide text-slate-500"><LocalizedText text={"Empresa declarada"} /></span><p className="mt-1 text-sm font-bold text-slate-900">{activeRequest.agency || 'No indicada'}</p><p className="text-xs text-slate-600"><LocalizedText text={"Perfil solicitado: "} />{activeRequest.role_type}</p></div>
                  <div className="sm:col-span-2"><span className="text-[10px] font-black uppercase tracking-wide text-slate-500"><LocalizedText text={"Proyecto / mensaje"} /></span><p className="mt-1 text-xs text-slate-700">{activeRequest.project_interest || 'Sin proyecto indicado'}{activeRequest.message ? ` · ${activeRequest.message}` : ''}</p></div>
                </div>

                <div className="mt-5 space-y-5">
                  {activeRequest.role_type.toLowerCase().includes('director') && createNewAgency && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900"><LocalizedText text={"Se iniciará el registro de "} /><strong>{activeRequest.agency}</strong><LocalizedText text={". Esta persona recibirá un formulario para completar los datos legales y de representación; la agencia y su membresía operativa quedarán pendientes de revisión de OB Brokers."} /></div>
                  )}
                  <div>
                    <label className="mb-2 block text-xs font-black text-slate-700"><LocalizedText text={"Empresa a la que se asociará"} /></label>
                    <p className="mb-2 text-xs text-slate-500"><LocalizedText text={"Membresía que se emitirá: "} /><span className="font-bold text-slate-700">{resolvedRoleLabel(activeRequest)}</span></p>
                    {activeRequest.role_type.toLowerCase().includes('director') && createNewAgency ? (
                      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm"><span className="font-semibold text-slate-800"><LocalizedText text={"Nueva agencia: "} />{activeRequest.agency}</span><button type="button" onClick={() => setCreateNewAgency(false)} className="text-xs font-bold text-indigo-700"><LocalizedText text={"Elegir existente"} /></button></div>
                    ) : (
                      <select value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none focus:border-indigo-500">
                        <option value=""><LocalizedText text={"Selecciona una empresa"} /></option>
                        {availableOrganizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}{normalize(organization.name) === normalize(activeRequest.agency || '') ? <LocalizedText text={" · coincide con la solicitud"} /> : ''}</option>)}
                      </select>
                    )}
                    {activeRequest.role_type.toLowerCase().includes('director') && !createNewAgency && activeRequest.agency && !availableOrganizations.some((organization) => normalize(organization.name) === normalize(activeRequest.agency || '')) && <button type="button" onClick={() => setCreateNewAgency(true)} className="mt-2 text-xs font-bold text-indigo-700"><LocalizedText text={"Registrar una agencia nueva con el nombre declarado"} /></button>}
                  </div>

                  <div>
                    <div className="mb-2 flex items-center gap-2"><FolderKanban className="h-4 w-4 text-indigo-600" /><label className="text-xs font-black text-slate-700"><LocalizedText text={"Proyectos que podrá consultar"} /></label></div>
                    {visibleProjects.length ? (
                      <div className="grid max-h-48 gap-2 overflow-y-auto rounded-xl border border-slate-200 p-3 sm:grid-cols-2">
                        {visibleProjects.map((project) => (
                          <label key={project.id} className="flex cursor-pointer items-start gap-2 rounded-lg p-2 text-xs hover:bg-slate-50">
                            <input type="checkbox" checked={selectedProjects.includes(project.id)} onChange={(event) => setSelectedProjects((current) => event.target.checked ? [...current, project.id] : current.filter((id) => id !== project.id))} className="mt-0.5 accent-indigo-900" />
                            <span className="font-semibold text-slate-700">{project.name}</span>
                          </label>
                        ))}
                      </div>
                    ) : <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500"><LocalizedText text={"No hay proyectos disponibles para asignar."} /></p>}
                    <p className="mt-1 text-[11px] text-slate-500">{selectedProjects.length ? `${selectedProjects.length} proyecto(s) seleccionados.` : <LocalizedText text={"Sin proyectos marcados; la persona no recibirá acceso a dossiers de proyectos todavía."} />}</p>
                  </div>

                  {activeRequest.role_type.toLowerCase().includes('director') && <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs leading-relaxed text-blue-900"><LocalizedText text={"Por seguridad, el director de agencia primero completará la información legal de la empresa. No se crea una membresía activa de agencia hasta que OB Brokers revise ese registro."} /></div>}
                  {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">{error}</div>}
                  <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                    <button type="button" disabled={isPending} onClick={closeModal} className="rounded-xl border border-slate-200 px-4 py-3 text-xs font-black text-slate-700 hover:bg-slate-50"><LocalizedText text={"Cancelar"} /></button>
                    <button type="button" disabled={isPending || (!organizationId && !createNewAgency)} onClick={issueInvitation} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-950 px-5 py-3 text-xs font-black text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50"><Send className="h-4 w-4" />{isPending ? <LocalizedText text={"Preparando invitación…"} /> : <LocalizedText text={"Emitir invitación y guardar revisión"} />}</button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {activeRequest && showAgencyRegistration && (
        <div
          className="fixed inset-0 z-[110] grid place-items-center bg-slate-950/45 p-3 backdrop-blur-sm sm:p-5"
          role="presentation"
          onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal(); }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="agency-registration-title" className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-emerald-200 bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700"><Building2 className="h-5 w-5" /></div>
                <div>
                  <h2 id="agency-registration-title" className="text-base font-black text-slate-950"><LocalizedText text={"Alta de Inmobiliaria Aliada"} /></h2>
                  <p className="text-xs text-slate-500"><LocalizedText text={"Revisa los datos de la solicitud; puedes editarlos antes de crear la agencia."} /></p>
                </div>
              </div>
              <UITranslationBoundary attributes={["aria-label"]}><button type="button" onClick={closeModal} disabled={isPending} aria-label="Cerrar" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button></UITranslationBoundary>
            </div>

            {invitation ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-center gap-2 font-black text-emerald-900"><CheckCircle2 className="h-5 w-5" /><LocalizedText text={"Agencia registrada: "} />{invitation.organizationName}</div>
                  <p className="mt-1 text-sm text-emerald-800"><LocalizedText text={"La invitación del administrador inicial abre el registro de la agencia con el nombre del representante precargado."} /></p>
                  {invitation.emailSent ? <p className="mt-2 text-xs font-semibold text-emerald-800"><LocalizedText text={"El correo de invitación fue enviado."} /></p> : <p className="mt-2 text-xs font-semibold text-amber-800">{invitation.emailError || 'La invitación está creada, pero no se confirmó el envío del correo.'}<LocalizedText text={" Comparte manualmente este enlace:"} /></p>}
                </div>
                {error && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-900">{error}</div>}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <UITranslationBoundary attributes={["aria-label"]}><input readOnly value={invitation.inviteUrl} aria-label="Enlace de invitación" className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-700" /></UITranslationBoundary>
                  <button type="button" onClick={async () => { await navigator.clipboard.writeText(invitation.inviteUrl); setCopied(true); }} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-xs font-black text-slate-700 hover:bg-slate-50"><Copy className="h-4 w-4" />{copied ? 'Copiado' : 'Copiar enlace'}</button>
                  <a href={invitation.inviteUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-black text-white hover:bg-emerald-700"><ExternalLink className="h-4 w-4" /><LocalizedText text={"Abrir"} /></a>
                </div>
                <div className="flex justify-end"><button type="button" onClick={closeModal} className="rounded-xl bg-slate-100 px-5 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-200"><LocalizedText text={"Cerrar"} /></button></div>
              </div>
            ) : (
              <form onSubmit={completeAgencyRegistration} className="mt-4 space-y-4">
                <div>
                  <label htmlFor="request-agency-name" className="mb-1 block text-xs font-bold text-slate-700"><LocalizedText text={"Nombre comercial de la agencia *"} /></label>
                  <UITranslationBoundary attributes={["placeholder"]}><input id="request-agency-name" name="agencyName" required value={agencyDraft.name} onChange={(event) => setAgencyDraft((draft) => ({ ...draft, name: event.target.value }))} placeholder="Ej. Blue Land Properties / Realty Network" className="h-10 w-full rounded-xl border border-emerald-300 px-3 text-sm font-bold text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" /></UITranslationBoundary>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="request-agency-email" className="mb-1 block text-xs font-bold text-slate-700"><LocalizedText text={"Correo de contacto oficial"} /></label>
                    <UITranslationBoundary attributes={["placeholder"]}><input id="request-agency-email" type="email" value={agencyDraft.contactEmail} onChange={(event) => setAgencyDraft((draft) => ({ ...draft, contactEmail: event.target.value }))} placeholder="contacto@inmobiliaria.com" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500" /></UITranslationBoundary>
                  </div>
                  <div>
                    <label htmlFor="request-agency-phone" className="mb-1 block text-xs font-bold text-slate-700"><LocalizedText text={"Teléfono / WhatsApp"} /></label>
                    <UITranslationBoundary attributes={["placeholder"]}><input id="request-agency-phone" type="tel" value={agencyDraft.contactPhone} onChange={(event) => setAgencyDraft((draft) => ({ ...draft, contactPhone: event.target.value }))} placeholder="+1 (809) 000-0000" className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500" /></UITranslationBoundary>
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
                  <p className="text-xs font-extrabold text-emerald-900"><LocalizedText text={"Administrador inicial de la agencia"} /></p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="request-admin-name" className="mb-1 block text-[11px] font-bold text-slate-700"><LocalizedText text={"Nombre del administrador"} /></label>
                      <UITranslationBoundary attributes={["placeholder"]}><input id="request-admin-name" value={agencyDraft.adminName} onChange={(event) => setAgencyDraft((draft) => ({ ...draft, adminName: event.target.value }))} placeholder="Nombre completo" className="h-9 w-full rounded-lg border border-emerald-200 bg-white px-3 text-sm outline-none focus:border-emerald-500" /></UITranslationBoundary>
                    </div>
                    <div>
                      <label htmlFor="request-admin-email" className="mb-1 block text-[11px] font-bold text-slate-700"><LocalizedText text={"Correo del administrador *"} /></label>
                      <UITranslationBoundary attributes={["placeholder"]}><input id="request-admin-email" required type="email" value={agencyDraft.adminEmail} onChange={(event) => setAgencyDraft((draft) => ({ ...draft, adminEmail: event.target.value }))} placeholder="admin@inmobiliaria.com" className="h-9 w-full rounded-lg border border-emerald-200 bg-white px-3 text-sm outline-none focus:border-emerald-500" /></UITranslationBoundary>
                    </div>
                  </div>
                  <p className="text-[11px] leading-relaxed text-emerald-800"><LocalizedText text={"Se enviará una invitación para completar el perfil legal de la agencia y activar el acceso después de su revisión."} /></p>
                </div>

                <div>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2"><FolderKanban className="h-4 w-4 text-emerald-700" /><span className="text-xs font-bold text-slate-700"><LocalizedText text={"Proyectos autorizados para la agencia"} /></span></div>
                    <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-bold text-slate-700">
                      <input
                        type="checkbox"
                        checked={allAgencyProjectsSelected}
                        ref={(input) => {
                          if (input) input.indeterminate = !allAgencyProjectsSelected
                            && visibleProjects.some((project) => agencyDraft.projectIds.includes(project.id));
                        }}
                        disabled={isPending || visibleProjects.length === 0}
                        onChange={(event) => {
                          const selectAll = event.target.checked;
                          setAgencyDraft((draft) => ({ ...draft, projectIds: selectAll ? visibleProjects.map((project) => project.id) : [] }));
                        }}
                        className="accent-emerald-700"
                      /><LocalizedText text={"Todos"} /></label>
                  </div>
                  <div className="grid max-h-36 gap-1 overflow-y-auto rounded-xl border border-slate-200 p-2 sm:grid-cols-2">
                    {visibleProjects.map((project) => (
                      <label key={project.id} className="flex cursor-pointer items-start gap-2 rounded-lg p-2 text-xs text-slate-700 hover:bg-slate-50">
                        <input type="checkbox" checked={agencyDraft.projectIds.includes(project.id)} onChange={(event) => setAgencyDraft((draft) => ({ ...draft, projectIds: event.target.checked ? [...draft.projectIds, project.id] : draft.projectIds.filter((id) => id !== project.id) }))} className="mt-0.5 accent-emerald-700" />
                        <span>{project.name}</span>
                      </label>
                    ))}
                  </div>
                  {activeRequest.message && <p className="mt-2 rounded-lg bg-slate-50 p-2 text-[11px] text-slate-600"><LocalizedText text={"Mensaje de la solicitud: "} />{activeRequest.message}</p>}
                </div>

                {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-semibold text-red-700">{error}</div>}
                <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:justify-end">
                  <button type="button" disabled={isPending} onClick={closeModal} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"><LocalizedText text={"Cancelar"} /></button>
                  <button type="submit" disabled={isPending || !agencyDraft.name.trim() || !agencyDraft.adminEmail.trim()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-extrabold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
                    <Building2 className="h-4 w-4" />{isPending ? <LocalizedText text={"Registrando agencia…"} /> : <LocalizedText text={"Registrar Agencia y enviar acceso"} />}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
