import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-user';
import { hasCapability } from '@/lib/auth/permissions';
import { getAgencyDocuments } from '@/lib/data/agency';
import AgencySettings from '@/components/portal/agency/AgencySettings';

export default async function AgencySettingsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/login?next=/portal/agency');
  if (!hasCapability(currentUser.role, 'manage_agency_documents')) redirect('/portal');

  const documents = await getAgencyDocuments();

  return (
    <AgencySettings
      organizationName={currentUser.organization.name}
      documents={documents}
    />
  );
}
