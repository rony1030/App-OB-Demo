
import { LocalizedText } from '@/components/i18n/UITranslationBoundary';
import ContactDetail360 from '@/components/portal/crm/ContactDetail360';
import { getContactByCode, getContactLeadReportingContext, getAccessibleProjects, getClientDocuments, getClientReservationPayments } from '@/lib/data/crm';
import { getCurrentUser } from '@/lib/auth/get-user';
import { verifyOrgAccess } from '@/lib/auth/verify-org-access';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, UserX } from 'lucide-react';
import DemoContactWorkflow from '@/components/portal/crm/DemoContactWorkflow';
import { getContacts } from '@/lib/data/crm';
import { getPortalProjects } from '@/lib/data/projects';

export default async function ContactDetailPage(props: { params: Promise<{ code: string }> }) {
  const params = await props.params;
  const code = params.code;

  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/login');

  if (process.env.NEXT_PUBLIC_APP_SCOPE === 'demo') {
    const [seed, projects] = await Promise.all([getContacts(), getPortalProjects()]);
    return <DemoContactWorkflow code={code} seed={seed} projects={projects} />;
  }

  const contact = await getContactByCode(code);

  if (!contact) {
    return (
      <div className="portal-enter max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
          <UserX className="w-6 h-6" />
        </div>
        <h1 className="text-lg font-black text-slate-900"><LocalizedText text={"Contacto no encontrado"} /></h1>
        <p className="text-xs text-slate-500"><LocalizedText text={"El contacto no existe en la base de datos o fue eliminado."} /></p>
        <div className="pt-2">
          <Link
            href="/portal/clientes"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" /><LocalizedText text={" Volver a la lista de Clientes"} /></Link>
        </div>
      </div>
    );
  }

  if (!verifyOrgAccess(currentUser, contact.organizationId)) notFound();

  const [reporting, accessibleProjects, clientDocuments, reservationPayments] = await Promise.all([
    getContactLeadReportingContext(contact.id),
    getAccessibleProjects(),
    getClientDocuments(contact.id),
    getClientReservationPayments(contact.id),
  ]);

  return <ContactDetail360 contact={contact} reportTargets={reporting.targets} leadReports={reporting.reports} accessibleProjects={accessibleProjects} clientDocuments={clientDocuments} reservationPayments={reservationPayments} />;
}
