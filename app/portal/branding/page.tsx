import { redirect } from 'next/navigation';
import BrandSettings from '@/components/portal/BrandSettings';
import { getCurrentUser } from '@/lib/auth/get-user';
import { hasCapability } from '@/lib/auth/permissions';

export default async function BrokerBrandingPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/login?next=/portal/branding');
  if (!hasCapability(currentUser.role, 'manage_agency')) redirect('/portal/agency');

  return <BrandSettings />;
}
