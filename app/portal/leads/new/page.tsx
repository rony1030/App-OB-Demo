import { redirect } from 'next/navigation';
import LeadWorkspace from '@/components/portal/LeadWorkspace';
import { getPortalProjects } from '@/lib/data/projects';
import { getCurrentUser } from '@/lib/auth/get-user';
import { getAgencyAgents } from '@/lib/data/team';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function NewLeadPage() {
  if (process.env.NEXT_PUBLIC_APP_SCOPE === 'demo' && !(await cookies()).get('demo_auth_session')) redirect('/login?next=/portal/leads/new');
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/login?next=/portal/leads/new');

  const [projects, rawAgents] = process.env.NEXT_PUBLIC_APP_SCOPE === 'demo' ? [await getPortalProjects(), []] : await Promise.all([
    getPortalProjects(),
    getAgencyAgents(currentUser.organization.id).catch(() => []),
  ]);

  // Ensure current user is present in agents list
  const currentAgent = {
    membershipId: currentUser.membershipId,
    userId: currentUser.id,
    displayName: currentUser.displayName,
    email: currentUser.email as string | null,
    role: currentUser.role as string,
  };

  const agentsMap = new Map<number, typeof currentAgent>();
  agentsMap.set(currentAgent.membershipId, currentAgent);
  for (const ag of rawAgents) {
    agentsMap.set(ag.membershipId, ag);
  }

  const agencyAgents = Array.from(agentsMap.values());

  return (
    <LeadWorkspace
      projectNames={projects.map((project) => project.name)}
      currentUser={{
        id: currentUser.id,
        displayName: currentUser.displayName,
        membershipId: currentUser.membershipId,
      }}
      agencyAgents={agencyAgents}
    />
  );
}
