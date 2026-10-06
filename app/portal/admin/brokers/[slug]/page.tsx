
import { LocalizedText } from '@/components/i18n/UITranslationBoundary';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Code2, Handshake, Mail, Phone, Users } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth/get-user';
import { getOrganizationDetailBySlug } from '@/lib/data/admin';

import MasterBrokerNotificationSettings from '@/components/portal/admin/MasterBrokerNotificationSettings';

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  master_broker_admin: 'Administrador',
  master_broker_operations: 'Operaciones',
  broker: 'Broker',
  agent: 'Agente',
  viewer: 'Consultor',
};

export default async function OrganizationDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const currentUser = await getCurrentUser();
  if (!currentUser || !['super_admin', 'master_broker_admin', 'master_broker_operations'].includes(currentUser.role)) {
    redirect('/portal');
  }

  const org = await getOrganizationDetailBySlug(slug);
  if (!org) notFound();

  const kindLabel = org.kind === 'agency' ? 'Agencia' : org.kind === 'master_broker' ? 'Master Broker' : org.kind === 'partner' ? 'Aliado' : org.kind;

  return (
    <div className="space-y-6">
      <Link href="/portal/admin/brokers" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600">
        <ArrowLeft className="h-4 w-4" /><LocalizedText text={" Volver a organizaciones"} /></Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-600">{kindLabel}</p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-950">{org.name}</h1>
          <p className="mt-1 text-xs text-slate-500">/{org.slug} · {org.status}</p>
        </div>
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-100 text-sm font-black text-blue-700">
          {org.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
        </span>
      </div>

      {(org.contactEmail || org.contactPhone) && (
        <div className="flex flex-wrap gap-4 rounded-xl border border-slate-200 bg-white p-4">
          {org.contactEmail && (
            <span className="inline-flex items-center gap-2 text-xs text-slate-600">
              <Mail className="h-4 w-4 text-blue-500" /> {org.contactEmail}
            </span>
          )}
          {org.contactPhone && (
            <span className="inline-flex items-center gap-2 text-xs text-slate-600">
              <Phone className="h-4 w-4 text-blue-500" /> {org.contactPhone}
            </span>
          )}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-extrabold text-slate-900"><LocalizedText text={"Administradores del Master Broker ("} />{org.administrators.length})</h2>
          </div>
          {currentUser.role === 'super_admin' && (
            <Link href="/portal/admin/users" className="rounded-xl border border-blue-200 px-3 py-2 text-[10px] font-extrabold text-blue-700 hover:bg-blue-50"><LocalizedText text={"Gestionar administradores"} /></Link>
          )}
        </div>
        {org.administrators.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-xs text-slate-400"><LocalizedText text={"Todavía no hay administradores asignados a este Master Broker."} /></p>
            {currentUser.role === 'super_admin' && <Link href="/portal/admin/users" className="mt-3 inline-flex rounded-xl bg-blue-600 px-3 py-2 text-[10px] font-extrabold text-white hover:bg-blue-700"><LocalizedText text={"Agregar desde Equipo"} /></Link>}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {org.administrators.map((member) => (
              <div key={member.membershipId} className="flex items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-black text-slate-600">
                    {member.displayName.slice(0, 1).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-900">{member.displayName}</p>
                    {member.email && <p className="text-[10px] text-slate-400">{member.email}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-[9px] font-extrabold uppercase text-blue-700">
                    {ROLE_LABELS[member.role] || member.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
          <div className="flex items-center gap-2">
            <Handshake className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-extrabold text-slate-900"><LocalizedText text={"Agencias con acuerdo ("} />{org.agencyPartners.length})</h2>
          </div>
          {currentUser.role === 'super_admin' && <Link href="/portal/agreements" className="rounded-xl border border-blue-200 px-3 py-2 text-[10px] font-extrabold text-blue-700 hover:bg-blue-50"><LocalizedText text={"Gestionar acuerdos"} /></Link>}
        </div>
        {org.agencyPartners.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-xs text-slate-400"><LocalizedText text={"No hay agencias con acuerdos registrados para este Master Broker."} /></p>
            {currentUser.role === 'super_admin' && <Link href="/portal/agreements" className="mt-3 inline-flex rounded-xl bg-blue-600 px-3 py-2 text-[10px] font-extrabold text-white hover:bg-blue-700"><LocalizedText text={"Registrar acuerdo"} /></Link>}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {org.agencyPartners.map((partner) => (
              <div key={partner.organizationId} className="flex items-center justify-between gap-4 p-4">
                <div>
                  <p className="text-xs font-bold text-slate-900">{partner.name}</p>
                  <p className="text-[10px] text-slate-400">{partner.agreementCount}<LocalizedText text={" acuerdo(s) · /"} />{partner.slug}</p>
                </div>
                <span className={`rounded-lg px-2.5 py-1 text-[9px] font-extrabold uppercase ${partner.activeAgreement ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                  {partner.activeAgreement ? 'Acuerdo vigente' : <LocalizedText text={"Sin acuerdo vigente"} />}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 p-4"><Code2 className="h-4 w-4 text-blue-600" /><h2 className="text-sm font-extrabold text-slate-900"><LocalizedText text={"Usuarios de desarrolladoras autorizadas ("} />{org.developerUsers.length})</h2></div>
        {org.developerUsers.length === 0 ? <p className="p-6 text-center text-xs text-slate-400"><LocalizedText text={"No hay usuarios de desarrolladoras vinculados por acuerdos de proyecto."} /></p> : <div className="divide-y divide-slate-100">{org.developerUsers.map((user) => <div key={user.membershipId} className="flex items-center justify-between gap-4 p-4"><div><p className="text-xs font-bold text-slate-900">{user.displayName}</p><p className="text-[10px] text-slate-400">{user.email || 'Sin correo'} · {user.organizationName}</p></div><span className="rounded-lg bg-amber-50 px-2.5 py-1 text-[9px] font-extrabold uppercase text-amber-700">{user.role}</span></div>)}</div>}
      </section>

      {currentUser.role === 'super_admin' && <MasterBrokerNotificationSettings organizationId={org.id} recipients={org.notificationRecipients} />}
    </div>
  );
}
