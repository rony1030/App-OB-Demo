import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/get-user';
import { brokerDocumentState, type BrokerDocumentType } from '@/lib/broker-documents-constants';

export { DOCUMENT_TYPE_LABELS, brokerDocumentState } from '@/lib/broker-documents-constants';
export type { BrokerDocumentType, BrokerDocumentState } from '@/lib/broker-documents-constants';

export type BrokerDocument = {
  id: number;
  documentType: BrokerDocumentType;
  title: string;
  status: string;
  state: ReturnType<typeof brokerDocumentState>;
  storageBucket: string;
  storagePath: string;
  issuedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};

export async function getMyBrokerDocuments(): Promise<BrokerDocument[]> {
  const user = await getCurrentUser();
  if (!user || !user.membershipId) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('broker_documents')
    .select('id, document_type, title, status, storage_bucket, storage_path, issued_at, expires_at, created_at')
    .eq('membership_id', user.membershipId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`No fue posible cargar tus documentos: ${error.message}`);
  return (data ?? []).map((row) => ({
    id: row.id,
    documentType: row.document_type as BrokerDocumentType,
    title: row.title,
    status: row.status,
    state: brokerDocumentState(row.status, row.expires_at),
    storageBucket: row.storage_bucket,
    storagePath: row.storage_path,
    issuedAt: row.issued_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  }));
}

export async function getBrokerFileDocuments(membershipId: number): Promise<BrokerDocument[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('broker_documents')
    .select('id, document_type, title, status, storage_bucket, storage_path, issued_at, expires_at, created_at')
    .eq('membership_id', membershipId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`No fue posible cargar el historial de documentos: ${error.message}`);
  return (data ?? []).map((row) => ({
    id: row.id,
    documentType: row.document_type as BrokerDocumentType,
    title: row.title,
    status: row.status,
    state: brokerDocumentState(row.status, row.expires_at),
    storageBucket: row.storage_bucket,
    storagePath: row.storage_path,
    issuedAt: row.issued_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  }));
}
