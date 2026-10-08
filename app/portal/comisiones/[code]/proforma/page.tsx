import { notFound } from 'next/navigation';
import { getCommissionClaims } from '@/lib/data/commission-claims';
import ProformaPrintView from '@/components/portal/commission/ProformaPrintView';
import DemoCommissionDocument from '@/components/portal/commission/DemoCommissionDocument';

export const dynamic = 'force-dynamic';

export default async function CommissionProformaPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (process.env.NEXT_PUBLIC_APP_SCOPE === 'demo') return <DemoCommissionDocument code={code} kind="proforma" />;
  const claim = (await getCommissionClaims()).find((item) => item.publicCode === code && item.proformaNumber);
  if (!claim) notFound();
  return <ProformaPrintView claim={claim} />;
}
