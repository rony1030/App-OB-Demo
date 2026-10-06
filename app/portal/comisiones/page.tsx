import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-user';
import { getCommissionClaimPermissions, getCommissionClaims } from '@/lib/data/commission-claims';
import CommissionClaimsManager from '@/components/portal/commission/CommissionClaimsManager';

export default async function CommissionClaimsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/portal/comisiones');

  const canAccess =
    ['super_admin', 'master_broker_admin', 'master_broker_operations', 'agency_admin', 'broker_agent', 'developer_admin', 'developer_viewer'].includes(user.role) ||
    user.organization.kind === 'developer';
  if (!canAccess) redirect('/portal');

  const [claims, permissions] = await Promise.all([
    getCommissionClaims(),
    getCommissionClaimPermissions(),
  ]);

  return <CommissionClaimsManager claims={claims} permissions={permissions} />;
}
