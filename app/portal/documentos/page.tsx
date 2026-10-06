
import { LocalizedText } from '@/components/i18n/UITranslationBoundary';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-user';
import { getMyAgreements } from '@/lib/data/agreements';
import { getMyBrokerDocuments } from '@/lib/data/broker-documents';
import MyDocuments from '@/components/portal/documents/MyDocuments';

export default async function MyDocumentsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/login?next=/portal/documentos');

  const [agreements, documents] = await Promise.all([getMyAgreements(), getMyBrokerDocuments()]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-600"><LocalizedText text={"Tu récord como broker"} /></p>
        <h1 className="mt-1 text-2xl font-extrabold text-slate-950"><LocalizedText text={"Mis documentos"} /></h1>
        <p className="mt-1 text-xs text-slate-500"><LocalizedText text={"Acuerdos de colaboración y documentos que requieren estar vigentes."} /></p>
      </div>
      <MyDocuments agreements={agreements} documents={documents} />
    </div>
  );
}
