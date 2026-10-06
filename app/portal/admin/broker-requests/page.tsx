
import { LocalizedText } from '@/components/i18n/UITranslationBoundary';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ClipboardList } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth/get-user';
import { hasCapability } from '@/lib/auth/permissions';
import BrokerAccessRequestsManager, { type BrokerAccessRequest } from '@/components/portal/admin/BrokerAccessRequestsManager';

export const revalidate = 0;

export default async function BrokerAccessRequestsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/login?next=/portal/admin/broker-requests');
  if (!hasCapability(currentUser.role, 'review_broker_access_requests')) redirect('/portal');

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('broker_access_requests')
    .select('id, full_name, email, phone, agency, role_type, project_interest, message, status, review_notes, created_at, reviewed_at')
    .eq('organization_id', currentUser.organization.id)
    .order('created_at', { ascending: false });

  const requests: BrokerAccessRequest[] = (data || []).map((item) => ({
    ...item,
    agency: item.agency || null,
    project_interest: item.project_interest || null,
    message: item.message || null,
    review_notes: item.review_notes || null,
    reviewed_at: item.reviewed_at || null,
  }));

  const optionsClient = currentUser.role === 'super_admin' ? createAdminClient() : supabase;
  const { data: projectRows } = await optionsClient
    .from('projects')
    .select('id, name, slug')
    .order('name', { ascending: true });
  const projects = (projectRows || []).map((project) => ({ id: project.id, name: project.name, slug: project.slug }));

  const { data: organizationRows } = currentUser.role === 'super_admin'
    ? await createAdminClient()
        .from('organizations')
        .select('id, name, kind')
        .in('kind', ['agency', 'master_broker'])
        .eq('status', 'active')
        .order('name', { ascending: true })
    : await supabase
        .from('organizations')
        .select('id, name, kind')
        .eq('id', currentUser.organization.id)
        .eq('status', 'active');
  const organizations = (organizationRows || []).map((organization) => ({
    id: organization.id,
    name: organization.name,
    kind: organization.kind,
  }));

  return (
    <div className="portal-enter space-y-8 pb-16">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-blue-700">
            <ClipboardList className="h-4 w-4 text-blue-600" />
            <span><LocalizedText text={"Acceso profesional"} /></span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl"><LocalizedText text={"Solicitudes de brokers"} /></h1>
          <p className="mt-1 max-w-2xl text-xs text-slate-500"><LocalizedText text={"Revisa cada perfil antes de crear una cuenta o asignar una membresía. Estas solicitudes no son leads del CRM."} /></p>
        </div>
        <Link href="/portal/admin/users" className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-700 hover:bg-slate-50"><LocalizedText text={"Administrar accesos"} /></Link>
      </section>
      <BrokerAccessRequestsManager
        initialRequests={requests}
        projects={projects}
        organizations={organizations}
        currentOrganization={{ id: currentUser.organization.id, name: currentUser.organization.name, kind: currentUser.organization.kind }}
        isSuperAdmin={currentUser.role === 'super_admin'}
        canIssueInvitations={hasCapability(currentUser.role, 'manage_agency_users')}
      />
    </div>
  );
}
