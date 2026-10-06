export type CommissionClaimStatus =
  | 'payment_pending' | 'eligible' | 'proforma_submitted' | 'under_review'
  | 'correction_requested' | 'approved' | 'invoice_pending' | 'invoice_submitted'
  | 'processing_payment' | 'paid' | 'rejected' | 'cancelled';

export type CommissionClaimListItem = {
  id: number;
  publicCode: string | null;
  organizationId: number;
  organizationName: string;
  projectId: number;
  projectName: string;
  projectSlug: string;
  clientName: string | null;
  clientEmail: string | null;
  opportunityStage: string | null;
  saleAmount: number | null;
  unitId: number | null;
  saleId: number | null;
  status: CommissionClaimStatus;
  currency: string;
  grossCommissionAmount: number;
  releasedPercentage: number;
  releasedAmount: number;
  proformaNumber: string | null;
  proformaSnapshot: Record<string, unknown>;
  finalInvoiceNumber: string | null;
  finalInvoiceStoragePath: string | null;
  finalInvoiceUrl: string | null;
  developerPaymentConfirmedAt: string | null;
  proformaSubmittedAt: string | null;
  finalInvoiceSubmittedAt: string | null;
  reviewNotes: string | null;
  paidAt: string | null;
  createdAt: string;
  canConfirmPayment: boolean;
  canGenerateProforma: boolean;
  canReview: boolean;
  canUploadInvoice: boolean;
  canMarkPaid: boolean;
};

export type CommissionClaimPermissions = {
  isAgency: boolean;
  isDeveloper: boolean;
  canReview: boolean;
  canConfirmPayment: boolean;
};

const statusLabels: Record<CommissionClaimStatus, string> = {
  payment_pending: 'Esperando confirmación de pago', eligible: 'Proforma habilitada',
  proforma_submitted: 'Proforma enviada', under_review: 'En revisión',
  correction_requested: 'Corrección solicitada', approved: 'Proforma aprobada',
  invoice_pending: 'Factura pendiente', invoice_submitted: 'Factura recibida',
  processing_payment: 'Pago en proceso', paid: 'Pagada', rejected: 'Rechazada', cancelled: 'Cancelada',
};

export function getCommissionClaimStatusLabel(status: CommissionClaimStatus) {
  return statusLabels[status] || status;
}
