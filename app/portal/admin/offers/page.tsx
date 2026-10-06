import { redirect } from 'next/navigation';
import MarketingOffersManager from '@/components/portal/admin/MarketingOffersManager';
import { getCurrentUser } from '@/lib/auth/get-user';
import { hasCapability } from '@/lib/auth/permissions';
import { getPortalProjects } from '@/lib/data/projects';
import { getMarketingOffersForAdmin } from '@/lib/data/marketing-offers';

export const revalidate = 0;

export default async function MarketingOffersPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/portal/admin/offers');
  if (!hasCapability(user.role, 'manage_marketing_offers')) redirect('/portal');

  const [offers, projects] = await Promise.all([
    getMarketingOffersForAdmin(),
    getPortalProjects(),
  ]);

  return (
    <MarketingOffersManager
      offers={offers}
      projects={projects.map((project) => ({ id: project.id, name: project.name, developer: project.developer }))}
      nowIso={new Date().toISOString()}
    />
  );
}
