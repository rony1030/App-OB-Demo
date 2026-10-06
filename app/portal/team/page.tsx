import { redirect } from 'next/navigation';
import TeamOverview from '@/components/portal/TeamOverview';
import { getAgencyTeamOverview } from '@/lib/data/team';
import { getCurrentUser } from '@/lib/auth/get-user';
import { hasCapability } from '@/lib/auth/permissions';

export default async function TeamPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/login?next=/portal/team');
  if (!hasCapability(currentUser.role, 'manage_agency_users')) redirect('/portal');

  const overview = await getAgencyTeamOverview(currentUser.organization.id);

  return <TeamOverview overview={overview} orgName={currentUser.organization.name} />;
}
