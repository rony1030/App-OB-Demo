// Plain constants/types shared between server data-fetchers and client
// components. Deliberately has no `server-only` import (unlike
// lib/data/broker-documents.ts) — a client component importing even an inert
// constant from a server-only module drags the whole module graph into the
// client bundle and Next.js rejects the build.
export type BrokerDocumentType = 'license' | 'id_card' | 'insurance' | 'tax_certificate' | 'other';

export const DOCUMENT_TYPE_LABELS: Record<BrokerDocumentType, string> = {
  license: 'Licencia de corretaje',
  id_card: 'Cédula / identificación',
  insurance: 'Seguro de responsabilidad',
  tax_certificate: 'Certificado fiscal',
  other: 'Otro documento',
};

export type BrokerDocumentState = 'submitted' | 'approved' | 'rejected' | 'vigente' | 'vencido';

export function brokerDocumentState(status: string, expiresAt: string | null): BrokerDocumentState {
  if (status === 'approved') {
    if (expiresAt && new Date(expiresAt) < new Date()) return 'vencido';
    return 'vigente';
  }
  if (status === 'rejected') return 'rejected';
  return 'submitted';
}
