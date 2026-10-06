
import { LocalizedText } from '@/components/i18n/UITranslationBoundary';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import BrokerStudio from '@/components/portal/admin/BrokerStudio';
import { getCurrentUser } from '@/lib/auth/get-user';

export default async function NewBrokerStudioPage() {
  const currentUser = await getCurrentUser();

  if (currentUser && currentUser.role !== 'super_admin') {
    redirect('/portal');
  }

  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-400 text-xs font-bold"><LocalizedText text={"Cargando Estudio de Organizaciones…"} /></div>
      }
    >
      <BrokerStudio />
    </Suspense>
  );
}
