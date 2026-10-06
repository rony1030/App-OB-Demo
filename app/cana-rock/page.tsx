import { getPublicProjects } from '@/lib/data/projects';
import { getCurrentUser } from '@/lib/auth/get-user';
import CanaRockDeveloperHub from '@/components/developers/CanaRockDeveloperHub';

export const dynamic = 'force-dynamic';

export default async function CanaRockDirectPage() {
  const [projects, currentUser] = await Promise.all([
    getPublicProjects(),
    getCurrentUser(),
  ]);

  return <CanaRockDeveloperHub projects={projects} currentUser={currentUser} />;
}
