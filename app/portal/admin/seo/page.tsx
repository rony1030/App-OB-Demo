import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-user';
import SeoIntelligenceDashboard from '@/components/portal/admin/seo/SeoIntelligenceDashboard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Optimizador SEO & Search Console | OB Brokers Portal',
  description: 'Auditoría SEO, simulador SERP y métricas de posicionamiento para Google Search Console.',
};

export default async function AdminSeoPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login?next=/portal/admin/seo');
  }

  if (currentUser.role !== 'super_admin' && currentUser.role !== 'master_broker_admin') {
    redirect('/portal');
  }

  return <SeoIntelligenceDashboard />;
}
