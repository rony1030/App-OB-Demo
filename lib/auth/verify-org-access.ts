import type { CurrentSessionUser } from './get-user';

export function verifyOrgAccess(
  currentUser: CurrentSessionUser,
  resourceOrgId: number
): boolean {
  if (currentUser.role === 'super_admin') return true;
  return currentUser.organization.id === resourceOrgId;
}
