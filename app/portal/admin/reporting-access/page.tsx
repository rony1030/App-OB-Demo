
import { LocalizedText } from '@/components/i18n/UITranslationBoundary';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-user';
import { createAdminClient } from '@/lib/supabase/admin';
import { saveReportingAccess } from './actions';

function unavailable(reason: string) {
  return <div className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 p-6"><p className="text-xs font-extrabold uppercase tracking-widest text-amber-800"><LocalizedText text={"Configuración pendiente"} /></p><h1 className="mt-2 text-xl font-extrabold text-slate-950"><LocalizedText text={"No se puede cargar la administración"} /></h1><p className="mt-3 text-sm text-slate-700">{reason}</p><p className="mt-3 text-xs text-slate-600"><LocalizedText text={"Revisa la variable SUPABASE_SERVICE_ROLE_KEY en el entorno de ejecución de Hostinger y reinicia la aplicación. No compartas el valor de la clave por chat."} /></p></div>;
}

export default async function ReportingAccessPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.realRole !== 'super_admin' || user.isPreviewMode) redirect('/portal');
  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return unavailable('Falta la credencial administrativa del servidor.');
  }
  const [membershipResult, organizationResult, assignmentResult] = await Promise.all([
    admin.from('memberships').select('user_id, organization_id').eq('role', 'agency_admin').eq('status', 'active').limit(1000),
    admin.from('organizations').select('id, name').eq('kind', 'master_broker').eq('status', 'active').order('name'),
    admin.from('master_broker_reporting_access').select('id, user_id, master_broker_organization_id, status').eq('status', 'active').limit(1000),
  ]);
  const firstError = [membershipResult, organizationResult, assignmentResult].find((result) => result.error)?.error;
  if (firstError) return unavailable(`La conexión administrativa no pudo consultar la base de datos (${firstError.code ?? 'sin código'}).`);
  const memberships = membershipResult.data ?? [];
  const organizations = organizationResult.data ?? [];
  const assignments = assignmentResult.data ?? [];
  const userIds = [...new Set(memberships.map((item) => item.user_id))];
  const { data: profiles, error: profileError } = userIds.length ? await admin.from('profiles').select('user_id, display_name, email').in('user_id', userIds) : { data: [], error: null };
  if (profileError) throw profileError;
  const profileById = new Map((profiles ?? []).map((item) => [item.user_id, item]));
  const orgById = new Map(organizations.map((item) => [item.id, item.name]));
  const message = (await searchParams).message;

  return <div className="portal-enter mx-auto max-w-5xl space-y-6"><div><p className="text-[10px] font-extrabold uppercase tracking-widest text-blue-700"><LocalizedText text={"Administración"} /></p><h1 className="mt-1 text-2xl font-extrabold text-slate-950"><LocalizedText text={"Accesos de seguimiento"} /></h1><p className="mt-1 text-sm text-slate-500"><LocalizedText text={"Asigna a una persona administradora de agencia la vista de uno o varios master brokers. Esto no le concede permisos para editar operaciones."} /></p></div>
    {message && <p role="status" className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">{message}</p>}
    <form action={saveReportingAccess} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-[1fr_1fr_auto]"><label className="text-xs font-bold text-slate-700"><LocalizedText text={"Administrador de agencia"} /><select name="userId" required className="mt-1 block h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value=""><LocalizedText text={"Seleccionar"} /></option>{userIds.map((id) => <option key={id} value={id}>{profileById.get(id)?.display_name ?? id} · {profileById.get(id)?.email ?? ''}</option>)}</select></label><label className="text-xs font-bold text-slate-700"><LocalizedText text={"Master broker"} /><select name="organizationId" required className="mt-1 block h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value=""><LocalizedText text={"Seleccionar"} /></option>{organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}</select></label><button name="status" value="active" type="submit" className="self-end rounded-xl bg-slate-950 px-5 py-3 text-xs font-extrabold text-white hover:bg-slate-800"><LocalizedText text={"Asignar vista"} /></button></form>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-4"><h2 className="text-sm font-extrabold text-slate-900"><LocalizedText text={"Asignaciones activas"} /></h2></div>{assignments.length ? <div className="divide-y divide-slate-100">{assignments.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div><p className="text-sm font-bold text-slate-900">{profileById.get(item.user_id)?.display_name ?? 'Usuario'}</p><p className="text-xs text-slate-500">{orgById.get(item.master_broker_organization_id) ?? 'Master broker'}</p></div><form action={saveReportingAccess}><input type="hidden" name="userId" value={item.user_id} /><input type="hidden" name="organizationId" value={item.master_broker_organization_id} /><button name="status" value="revoked" type="submit" className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50"><LocalizedText text={"Revocar vista"} /></button></form></div>)}</div> : <p className="p-8 text-center text-sm text-slate-500"><LocalizedText text={"No hay vistas asignadas todavía."} /></p>}</section>
  </div>;
}
