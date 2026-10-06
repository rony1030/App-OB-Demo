
import { LocalizedText } from '@/components/i18n/UITranslationBoundary';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-user';
import { getOrganizationLegalInfo } from '@/lib/data/admin';
import OrgLegalInfoCard from '@/components/portal/admin/OrgLegalInfoCard';
import TranslationWorkbench from '@/components/portal/admin/TranslationWorkbench';
import { getRuntimeConfigurationHealth } from '@/lib/runtime/config-health';
import { CheckCircle2, CircleAlert, Database, Palette, Settings } from 'lucide-react';
import Link from 'next/link';

export const revalidate = 0;

export default async function AdminSettingsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login');
  }

  if (currentUser.role !== 'super_admin' && currentUser.role !== 'master_broker_admin') {
    redirect('/portal');
  }

  const legalInfo = await getOrganizationLegalInfo(currentUser.organization.id);
  const runtimeChecks = getRuntimeConfigurationHealth();

  return (
    <div className="portal-enter space-y-8 pb-16">
      {/* Header */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-blue-700 font-extrabold text-xs uppercase tracking-wider mb-1">
            <Settings className="h-4 w-4 text-blue-600" />
            <span><LocalizedText text={"Ajustes Institucionales &amp; Marca"} /></span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl"><LocalizedText text={"Configuración Global"} /></h1>
          <p className="mt-1 max-w-2xl text-xs text-slate-500"><LocalizedText text={"Administra los datos jurídicos de tu master broker, personaliza la marca blanca y verifica el estado de la infraestructura."} /></p>
        </div>
      </section>

      {/* Organization Legal Info */}
      <OrgLegalInfoCard
        organizationName={currentUser.organization.name}
        legalInfo={legalInfo}
      />

      <TranslationWorkbench />

      {/* Branding & White-Label Quick Card */}
      <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-700">
              <Palette className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900"><LocalizedText text={"Personalización de Marca Blanca (Estudio Creativo)"} /></h2>
              <p className="text-xs text-slate-500"><LocalizedText text={"Logo, isotipo, paleta de colores oficial y tipografía para dossiers y portal"} /></p>
            </div>
          </div>

          <Link
            href="/portal/branding"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-xs font-bold text-white hover:bg-blue-600 transition shadow-xs"
          >
            <span><LocalizedText text={"Ir a Estudio de Marca →"} /></span>
          </Link>
        </div>
      </section>

      {/* System Infrastructure Status */}
      <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xs space-y-6">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
            <Database className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900"><LocalizedText text={"Infraestructura &amp; Conexiones Activas"} /></h2>
            <p className="text-xs text-slate-500"><LocalizedText text={"Estado de los servicios centrales de datos y almacenamiento"} /></p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {runtimeChecks.map((check) => (
            <div key={check.label} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-1">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-slate-700">{check.label}</span>
                {check.configured ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <CircleAlert className="h-4 w-4 shrink-0 text-amber-500" />}
              </div>
              <p className="text-[11px] text-slate-500">{check.detail}</p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{check.configured ? 'Configurado' : `Falta para: ${check.requiredFor}`}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
