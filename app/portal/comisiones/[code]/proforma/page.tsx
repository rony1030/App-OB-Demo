import { notFound } from 'next/navigation';
import { getCommissionClaims } from '@/lib/data/commission-claims';
import ProformaPrintView from '@/components/portal/commission/ProformaPrintView';

export const dynamic = 'force-dynamic';

export default async function CommissionProformaPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const claim = (await getCommissionClaims()).find((item) => item.publicCode === code && item.proformaNumber);
  if (!claim) notFound();
  return <ProformaPrintView claim={claim} />;
}
