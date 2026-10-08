import { notFound } from 'next/navigation';
import DemoCommissionDocument from '@/components/portal/commission/DemoCommissionDocument';

export default async function CommissionInvoicePage({ params }: { params: Promise<{ code: string }> }) {
  if (process.env.NEXT_PUBLIC_APP_SCOPE !== 'demo') notFound();
  const { code } = await params;
  return <DemoCommissionDocument code={code} kind="factura" />;
}
