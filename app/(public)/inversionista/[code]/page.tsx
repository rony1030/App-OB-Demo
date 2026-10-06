import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getInvestorPortalDataByCode } from '@/lib/data/investor-portal';
import { getAuthenticatedInvestorSession, hasDemoAccess } from '@/lib/investor/auth';
import { findDemoClient } from '@/lib/data/investor-demo';
import InvestorPortalDashboard from '@/components/portal/InvestorPortalDashboard';

// Datos financieros personales: nunca se sirven desde una caché compartida.
export const dynamic = 'force-dynamic';

export async function generateMetadata(props: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ demo?: string }>;
}): Promise<Metadata> {
  const { code } = await props.params;
  const { demo } = await props.searchParams;
  const isDemoRequest = demo === '1' || Boolean(findDemoClient(code));
  const data = await getInvestorPortalDataByCode(code, isDemoRequest);

  if (!data) {
    return {
      title: 'Portal de Inversionista · OB Brokers',
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `Portal de Inversionista · ${data.contact.fullName} | OB Brokers`,
    robots: { index: false, follow: false },
    description: `Seguimiento de inversión, estado de cuenta y avances de obra para ${data.contact.fullName}.`,
  };
}

export default async function InvestorPortalPage(props: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ demo?: string }>;
}) {
  const { code } = await props.params;
  const { demo } = await props.searchParams;
  const cleanCode = code.trim().toUpperCase();

  // Caso 1: Código de Demostración
  if (findDemoClient(cleanCode)) {
    const isUnlocked = process.env.NEXT_PUBLIC_APP_SCOPE === 'demo' || await hasDemoAccess();
    if (!isUnlocked) {
      // Si intentan entrar a un código demo sin clave demo, redirigir a /inversionista/demo
      redirect('/inversionista/demo');
    }
    const demoData = await getInvestorPortalDataByCode(cleanCode, true);
    if (!demoData) notFound();
    return <InvestorPortalDashboard data={demoData} />;
  }

  // Caso 2: Inversionista Real (Acceso normal por sesión HTTP-only)
  const session = await getAuthenticatedInvestorSession();
  if (!session) {
    redirect('/inversionista');
  }

  // Validar que la sesión corresponda exactamente al código solicitado
  if (session.publicCode.toUpperCase() !== cleanCode) {
    // Si la sesión es válida pero el código en URL no coincide con su expediente,
    // redirigir a su propio código
    redirect(`/inversionista/${encodeURIComponent(session.publicCode)}`);
  }

  const data = await getInvestorPortalDataByCode(cleanCode, false);
  if (!data) {
    notFound();
  }

  // Doble verificación: el contacto ID debe coincidir
  if (data.contact.id !== session.contactId) {
    redirect('/inversionista');
  }

  return <InvestorPortalDashboard data={data} />;
}
