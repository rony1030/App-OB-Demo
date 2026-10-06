
import { LocalizedText } from '@/components/i18n/UITranslationBoundary';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import ProjectStudio from '@/components/portal/admin/ProjectStudio';
import { getCurrentUser } from '@/lib/auth/get-user';

export default async function NewProjectStudioPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login');
  }

  if (currentUser.role !== 'super_admin' && currentUser.role !== 'master_broker_admin') {
    redirect('/portal');
  }

  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-400 text-xs font-bold"><LocalizedText text={"Cargando Estudio de Proyectos…"} /></div>
      }
    >
      <ProjectStudio organizationSlug={currentUser.organization.slug} />
    </Suspense>
  );
}
