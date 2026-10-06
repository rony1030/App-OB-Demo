export interface SignatureSigner {
  id: string;
  document_id: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  sign_order: number;
  status: 'pending' | 'signed' | 'declined';
  signing_token: string;
  signature_data?: string;
  signed_at?: string;
  signer_ip?: string;
}

export interface SignatureField {
  id: string;
  document_id: string;
  signer_id: string;
  page_number: number;
  x: number; // percentage
  y: number; // percentage
  width: number;
  height: number;
  field_type: 'signature' | 'initials' | 'stamp' | 'date' | 'text';
  label?: string;
  value?: string;
}

export interface SignatureDocument {
  id: string;
  title: string;
  pdf_url: string;
  final_pdf_url?: string;
  status: 'draft' | 'pending' | 'partially_signed' | 'completed' | 'cancelled';
  document_hash?: string;
  creator_name?: string;
  creator_email?: string;
  signers: SignatureSigner[];
  fields: SignatureField[];
  created_at: string;
  updated_at: string;
}
