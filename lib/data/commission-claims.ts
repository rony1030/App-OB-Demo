import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import type { CommissionClaimListItem, CommissionClaimPermissions, CommissionClaimStatus } from '@/lib/data/commission-claim-types';


export async function getCommissionClaimPermissions(): Promise<CommissionClaimPermissions> {
  const user = await getCurrentUser();
  if (!user) return { isAgency: false, isDeveloper: false, canReview: false, canConfirmPayment: false };

  const isDeveloper = user.organization.kind === 'developer';
  const isAgency = user.organization.kind === 'agency';
  const canReview = ['super_admin', 'master_broker_admin', 'master_broker_operations'].includes(user.role) && !isDeveloper;
  const canConfirmPayment = isDeveloper && ['super_admin', 'master_broker_admin', 'developer_admin'].includes(user.role);

  return { isAgency, isDeveloper, canReview, canConfirmPayment };
}

export async function getCommissionClaims(): Promise<CommissionClaimListItem[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('commission_claims')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error || !data) return [];

  const rows = data as Array<DatabaseClaimRow>;
  const projectIds = [...new Set(rows.map((row) => row.project_id))];
  const organizationIds = [...new Set(rows.map((row) => row.organization_id))];
  const opportunityIds = [...new Set(rows.map((row) => row.opportunity_id).filter((id): id is number => id !== null))];
  const saleIds = [...new Set(rows.map((row) => row.sale_id).filter((id): id is number => id !== null))];
  const [{ data: projects }, { data: organizations }, { data: opportunities }, { data: sales }] = await Promise.all([
    projectIds.length ? supabase.from('projects').select('id, name, slug').in('id', projectIds) : Promise.resolve({ data: [] }),
    organizationIds.length ? supabase.from('organizations').select('id, name').in('id', organizationIds) : Promise.resolve({ data: [] }),
    opportunityIds.length ? supabase.from('opportunities').select('id, contact_id, stage').in('id', opportunityIds) : Promise.resolve({ data: [] }),
    saleIds.length ? supabase.from('sales').select('id, sale_price').in('id', saleIds) : Promise.resolve({ data: [] }),
  ]);

  const projectMap = new Map((projects ?? []).map((project) => [project.id, project]));
  const organizationMap = new Map((organizations ?? []).map((organization) => [organization.id, organization.name]));
  const opportunityMap = new Map((opportunities ?? []).map((opportunity) => [opportunity.id, opportunity]));
  const saleMap = new Map((sales ?? []).map((sale) => [sale.id, sale]));
  const contactIds = [...new Set((opportunities ?? []).map((opportunity) => opportunity.contact_id).filter(Boolean))];
  const { data: contacts } = contactIds.length
    ? await supabase.from('contacts').select('id, first_name, last_name, email').in('id', contactIds)
    : { data: [] };
  const contactMap = new Map((contacts ?? []).map((contact) => [contact.id, contact]));
  const invoiceUrls = new Map<number, string>();
  await Promise.all(rows.map(async (row) => {
    if (!row.final_invoice_storage_bucket || !row.final_invoice_storage_path) return;
    const { data: signed } = await supabase.storage
      .from(row.final_invoice_storage_bucket)
      .createSignedUrl(row.final_invoice_storage_path, 60 * 60);
    if (signed?.signedUrl) invoiceUrls.set(row.id, signed.signedUrl);
  }));
  const isDeveloper = user.organization.kind === 'developer';
  const canReview = ['super_admin', 'master_broker_admin', 'master_broker_operations'].includes(user.role) && !isDeveloper;
  const canConfirmPayment = isDeveloper && ['super_admin', 'master_broker_admin', 'developer_admin'].includes(user.role);

  return rows.flatMap((row) => {
    const project = projectMap.get(row.project_id);
    if (!project) return [];
    const isOwnClaim = row.organization_id === user.organization.id;
    const opportunity = row.opportunity_id ? opportunityMap.get(row.opportunity_id) : undefined;
    const contact = opportunity?.contact_id ? contactMap.get(opportunity.contact_id) : undefined;
    const sale = row.sale_id ? saleMap.get(row.sale_id) : undefined;
    const amount = Number(row.released_amount || 0);
    return [{
      id: row.id,
      publicCode: (row as Record<string, unknown>).public_code as string | null || null,
      organizationId: row.organization_id,
      organizationName: organizationMap.get(row.organization_id) || 'Organización',
      projectId: row.project_id,
      projectName: project.name,
      projectSlug: project.slug,
      clientName: contact ? [contact.first_name, contact.last_name].filter(Boolean).join(' ') || null : null,
      clientEmail: contact?.email || null,
      opportunityStage: opportunity?.stage || null,
      saleAmount: sale?.sale_price == null ? null : Number(sale.sale_price),
      unitId: row.unit_id,
      saleId: row.sale_id,
      status: row.status as CommissionClaimStatus,
      currency: row.currency,
      grossCommissionAmount: Number(row.gross_commission_amount || 0),
      releasedPercentage: Number(row.released_percentage || 0),
      releasedAmount: amount,
      proformaNumber: row.proforma_number,
      proformaSnapshot: row.proforma_snapshot || {},
      finalInvoiceNumber: row.final_invoice_number,
      finalInvoiceStoragePath: row.final_invoice_storage_path,
      finalInvoiceUrl: invoiceUrls.get(row.id) || null,
      developerPaymentConfirmedAt: row.developer_payment_confirmed_at,
      proformaSubmittedAt: row.proforma_submitted_at,
      finalInvoiceSubmittedAt: row.final_invoice_submitted_at,
      reviewNotes: row.review_notes,
      paidAt: row.paid_at,
      createdAt: row.created_at,
      canConfirmPayment: canConfirmPayment && ['payment_pending', 'correction_requested'].includes(row.status),
      canGenerateProforma: isOwnClaim && ['eligible', 'correction_requested'].includes(row.status),
      canReview: canReview && ['proforma_submitted', 'under_review'].includes(row.status),
      canUploadInvoice: isOwnClaim && ['approved', 'invoice_pending', 'correction_requested'].includes(row.status),
      canMarkPaid: canReview && row.status === 'invoice_submitted',
    }];
  });
}

type DatabaseClaimRow = {
  id: number;
  organization_id: number;
  project_id: number;
  unit_id: number | null;
  opportunity_id: number | null;
  sale_id: number | null;
  status: string;
  currency: string;
  gross_commission_amount: number;
  released_percentage: number;
  released_amount: number;
  proforma_number: string | null;
  proforma_snapshot: Record<string, unknown>;
  final_invoice_number: string | null;
  final_invoice_storage_path: string | null;
  final_invoice_storage_bucket: string | null;
  developer_payment_confirmed_at: string | null;
  proforma_submitted_at: string | null;
  final_invoice_submitted_at: string | null;
  review_notes: string | null;
  paid_at: string | null;
  created_at: string;
};
