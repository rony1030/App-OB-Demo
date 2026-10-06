export type OrganizationDocumentType =
  | 'rnc'
  | 'mercantile_registry'
  | 'tax_certificate'
  | 'legal_representative_id'
  | 'banking'
  | 'other';

export type OrganizationDocument = {
  id: number;
  documentType: OrganizationDocumentType;
  title: string;
  status: string;
  storageBucket: string;
  storagePath: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  issuedAt: string | null;
  expiresAt: string | null;
  notes: string | null;
  createdAt: string;
};

export const ORGANIZATION_DOCUMENT_TYPE_LABELS: Record<OrganizationDocumentType, string> = {
  rnc: 'RNC',
  mercantile_registry: 'Registro mercantil',
  tax_certificate: 'Certificación fiscal',
  legal_representative_id: 'Documento del representante',
  banking: 'Documento bancario',
  other: 'Otro documento',
};

export function organizationDocumentState(status: string, expiresAt: string | null) {
  if (status === 'approved' && expiresAt && Date.parse(expiresAt) < Date.now()) return 'expired';
  if (status === 'approved') return 'approved';
  if (status === 'rejected') return 'rejected';
  if (status === 'requested') return 'requested';
  if (status === 'expired') return 'expired';
  return 'submitted';
}

export function formatOrganizationDocumentDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${String(date.getUTCDate()).padStart(2, '0')}/${String(date.getUTCMonth() + 1).padStart(2, '0')}/${date.getUTCFullYear()}`;
}
