export function canReviewOperationsProject(
  user: { role: string; organizationId: number },
  project: { id: number; organizationId: number },
  grants: readonly { projectId: number; expiresAt: string | null }[],
  now = Date.now(),
) {
  if (user.role === 'super_admin') return true;
  if (['master_broker_admin', 'master_broker_operations'].includes(user.role)) return project.organizationId === user.organizationId;
  if (!['developer_admin', 'developer_viewer'].includes(user.role)) return false;
  return grants.some(grant => grant.projectId === project.id && (!grant.expiresAt || Date.parse(grant.expiresAt) > now));
}
