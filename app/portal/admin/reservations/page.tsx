import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth/get-user';
import ReservationReviewPanel from '@/components/portal/admin/ReservationReviewPanel';

export const revalidate = 0;

export default async function AdminReservationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login?next=/portal/admin/reservations');
  if (!['super_admin', 'master_broker_admin', 'master_broker_operations', 'developer_admin', 'developer_viewer'].includes(user.role)) redirect('/portal');

  const db = createAdminClient();
  const { data: requests } = await db
    .from('reservation_requests')
    .select('id, organization_id, opportunity_id, unit_id, requested_by_membership_id, status, notes, created_at, expires_at')
    .order('created_at', { ascending: false });
  const rows = requests || [];
  const unitIds = rows.map((r) => r.unit_id).filter((id): id is number => id !== null);
  const opportunityIds = rows.map((r) => r.opportunity_id).filter(Boolean) as number[];
  const orgIds = rows.map((r) => r.organization_id);
  const [unitsResult, opportunitiesResult, organizationsResult] = await Promise.all([
    unitIds.length ? db.from('units').select('id, unit_code, list_price, currency, project_id, project:projects(name, organization_id, developer_organization_id)').in('id', unitIds) : Promise.resolve({ data: [] }),
    opportunityIds.length ? db.from('opportunities').select('id, public_code, contact_id, contact:contacts(first_name, last_name, email, public_code)').in('id', opportunityIds) : Promise.resolve({ data: [] }),
    orgIds.length ? db.from('organizations').select('id, name').in('id', orgIds) : Promise.resolve({ data: [] }),
  ]);

  const unitMap = new Map((unitsResult.data || []).map((u) => [u.id, u]));
  const isPlatformAdmin = user.role === 'super_admin';
  const isMasterOperations = ['master_broker_admin', 'master_broker_operations'].includes(user.role);
  const { data: explicitProjectAccess } = !isPlatformAdmin && !isMasterOperations
    ? await db.from('project_access').select('project_id, expires_at').eq('grantee_membership_id', user.membershipId)
    : { data: [] };
  const currentTimestamp = new Date().getTime();
  const explicitProjectIds = new Set((explicitProjectAccess || []).filter((item) => !item.expires_at || new Date(item.expires_at).getTime() > currentTimestamp).map((item) => Number(item.project_id)));
  const visibleRows = rows.filter((row) => {
    if (isPlatformAdmin) return true;
    const project = unitMap.get(row.unit_id || 0)?.project;
    if (!project) return false;
    if (isMasterOperations) return project.organization_id === user.organization.id;
    return explicitProjectIds.has(Number(unitMap.get(row.unit_id || 0)?.project_id));
  });
  const opportunityMap = new Map((opportunitiesResult.data || []).map((o) => [o.id, o]));
  const organizationMap = new Map((organizationsResult.data || []).map((o) => [o.id, o.name]));
  const contactIds = (opportunitiesResult.data || []).map((o) => o.contact_id).filter(Boolean);
  const requestIds = visibleRows.map((r) => r.id);
  const [{ data: reservations }, { data: documents }, { data: payments }] = await Promise.all([
    requestIds.length ? (db).from('reservations').select('id, reservation_request_id, reservation_type, status, expires_at').in('reservation_request_id', requestIds) : Promise.resolve({ data: [] }),
    contactIds.length ? (db).from('client_documents').select('id, public_code, contact_id, document_type, title, file_name, created_at').in('contact_id', contactIds).order('created_at', { ascending: false }) : Promise.resolve({ data: [] }),
    requestIds.length ? (db).from('reservation_payment_submissions').select('id, reservation_id, reservation_request_id, amount, currency, reference, paid_at, file_name, status, payment_stage, created_at').in('reservation_request_id', requestIds).order('created_at', { ascending: false }) : Promise.resolve({ data: [] }),
  ]);
  const reservationByRequest = new Map(((reservations || [])).map((item) => [item.reservation_request_id, item]));
  const documentsByContact = new Map<number, NonNullable<typeof documents>>();
  for (const document of (documents || [])) documentsByContact.set(document.contact_id, [...(documentsByContact.get(document.contact_id) || []), document]);
  const paymentsByRequest = new Map<number, NonNullable<typeof payments>>();
  for (const payment of (payments || [])) paymentsByRequest.set(payment.reservation_request_id, [...(paymentsByRequest.get(payment.reservation_request_id) || []), payment]);
  const reservationIds = ((reservations || [])).map((item) => item.id);
  const { data: sales } = reservationIds.length ? await db.from('sales').select('id, reservation_id, closed_at').in('reservation_id', reservationIds) : { data: [] };
  const saleByReservation = new Map((sales || []).map((sale) => [sale.reservation_id, sale]));
  const membershipIds = visibleRows.map((row) => row.requested_by_membership_id).filter(Boolean) as number[];
  const { data: memberships } = membershipIds.length ? await db.from('memberships').select('id, user_id').in('id', membershipIds) : { data: [] };
  const userIds = (memberships || []).map((membership) => membership.user_id).filter(Boolean);
  const { data: profiles } = userIds.length ? await db.from('profiles').select('user_id, display_name').in('user_id', userIds) : { data: [] };
  const membershipMap = new Map((memberships || []).map((membership) => [membership.id, membership.user_id]));
  const profileMap = new Map((profiles || []).map((profile) => [profile.user_id, profile.display_name]));
  const viewRows = visibleRows.map((r) => ({
    id: r.id,
    status: r.status,
    notes: r.notes,
    createdAt: r.created_at,
    agencyName: organizationMap.get(r.organization_id) || 'Organización',
    unitCode: unitMap.get(r.unit_id || 0)?.unit_code || `Unidad #${r.unit_id}`,
    projectName: (unitMap.get(r.unit_id || 0)?.project)?.name || 'Proyecto',
    projectId: Number(unitMap.get(r.unit_id || 0)?.project_id || 0),
    price: Number(unitMap.get(r.unit_id || 0)?.list_price || 0),
    currency: unitMap.get(r.unit_id || 0)?.currency || 'USD',
    contact: (opportunityMap.get(r.opportunity_id || 0))?.contact || null,
    contactId: Number((opportunityMap.get(r.opportunity_id || 0))?.contact_id || 0),
    opportunityId: Number(r.opportunity_id || 0),
    opportunityCode: String((opportunityMap.get(r.opportunity_id || 0))?.public_code || `NEG-${r.opportunity_id}`),
    agentName: profileMap.get(membershipMap.get(r.requested_by_membership_id || 0) || '') || 'Agente asignado',
    reservation: reservationByRequest.get(r.id) || null,
    sale: saleByReservation.get(reservationByRequest.get(r.id)?.id || 0) || null,
    documents: documentsByContact.get((opportunityMap.get(r.opportunity_id || 0))?.contact_id || 0) || [],
    payments: paymentsByRequest.get(r.id) || [],
  }));

  return <ReservationReviewPanel rows={viewRows} />;
}
