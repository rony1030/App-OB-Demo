'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { MAX_DOCUMENT_SIZE_BYTES, MAX_DOCUMENT_SIZE_LABEL } from '@/lib/storage/document-limits';
import { getCurrentUser } from '@/lib/auth/get-user';
import { getOrganizationLegalInfo } from '@/lib/data/admin';

function resultError(error: unknown) {
  return { error: error instanceof Error ? error.message : String(error) };
}

export async function createCommissionClaimAction(saleId: number) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser(supabase);
    if (!user || !['agency_admin', 'broker_agent', 'master_broker_admin', 'super_admin'].includes(user.role)) {
      return { error: 'No tienes permiso para solicitar una comisión.' };
    }

    const { data, error } = await supabase.rpc('create_commission_claim', {
      target_organization_id: user.organization.id,
      target_sale_id: saleId,
    });
    if (error) return { error: error.message };
    revalidatePath('/portal/comisiones');
    return { success: true, claimId: data };
  } catch (error) {
    return resultError(error);
  }
}

export async function confirmCommissionPaymentAction(payload: {
  claimId: number;
  releasedPercentage: number;
  reference?: string;
  notes?: string;
}) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser(supabase);
    if (!user || user.organization.kind !== 'developer' || !['master_broker_admin', 'developer_admin', 'super_admin'].includes(user.role)) {
      return { error: 'Solo el equipo autorizado del developer puede confirmar el pago.' };
    }
    const { error } = await supabase.rpc('confirm_commission_claim_payment', {
      target_claim_id: payload.claimId,
      target_released_percentage: payload.releasedPercentage,
      target_reference: payload.reference || undefined,
      target_notes: payload.notes || undefined,
    });
    if (error) return { error: error.message };
    revalidatePath('/portal/comisiones');
    return { success: true };
  } catch (error) {
    return resultError(error);
  }
}

export async function submitCommissionProformaAction(claimId: number) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser(supabase);
    if (!user || !['agency', 'master_broker'].includes(user.organization.kind) || !['agency_admin', 'broker_agent', 'master_broker_admin', 'super_admin'].includes(user.role)) {
      return { error: 'No tienes permiso para generar esta proforma.' };
    }
    const legal = await getOrganizationLegalInfo(user.organization.id);
    const number = `PRO-${new Date().getFullYear()}-${String(claimId).padStart(6, '0')}`;
    const { error } = await supabase.rpc('submit_commission_proforma', {
      target_claim_id: claimId,
      target_number: number,
      target_snapshot: {
        legal_name: legal.legalName,
        tax_id: legal.taxId,
        legal_address: legal.legalAddress,
        organization_name: user.organization.name,
        generated_by: user.displayName,
      },
    });
    if (error) return { error: error.message };
    revalidatePath('/portal/comisiones');
    return { success: true, number };
  } catch (error) {
    return resultError(error);
  }
}

export async function reviewCommissionClaimAction(payload: { claimId: number; decision: 'approved' | 'correction_requested' | 'rejected'; notes?: string }) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser(supabase);
    if (!user || !['super_admin', 'master_broker_admin', 'master_broker_operations'].includes(user.role) || user.organization.kind === 'developer') {
      return { error: 'No tienes permiso para revisar proformas.' };
    }
    const { error } = await supabase.rpc('review_commission_claim', {
      target_claim_id: payload.claimId,
      target_decision: payload.decision,
      target_notes: payload.notes || undefined,
    });
    if (error) return { error: error.message };
    revalidatePath('/portal/comisiones');
    return { success: true };
  } catch (error) {
    return resultError(error);
  }
}

export async function submitCommissionInvoiceAction(formData: FormData) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser(supabase);
    const claimId = Number(formData.get('claimId'));
    const invoiceNumber = String(formData.get('invoiceNumber') || '').trim();
    const file = formData.get('file');
    if (!user || !['agency', 'master_broker'].includes(user.organization.kind) || !['agency_admin', 'broker_agent', 'master_broker_admin', 'super_admin'].includes(user.role)) {
      return { error: 'No tienes permiso para cargar la factura.' };
    }
    if (!claimId || !(file instanceof File) || file.size <= 0 || file.size > MAX_DOCUMENT_SIZE_BYTES) {
      return { error: `Selecciona una factura válida de hasta ${MAX_DOCUMENT_SIZE_LABEL}.` };
    }
    if (!['application/pdf', 'image/png', 'image/jpeg'].includes(file.type)) {
      return { error: 'La factura debe ser PDF, PNG o JPG.' };
    }
    const path = `${user.organization.slug}/commission-claims/${claimId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
    const bytes = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage.from('private-documents').upload(path, Buffer.from(bytes), { contentType: file.type, upsert: false });
    if (uploadError) return { error: uploadError.message };

    const { error } = await supabase.rpc('submit_commission_invoice', {
      target_claim_id: claimId,
      target_number: invoiceNumber,
      target_bucket: 'private-documents',
      target_path: path,
      target_mime: file.type,
      target_size: file.size,
    });
    if (error) {
      await supabase.storage.from('private-documents').remove([path]);
      return { error: error.message };
    }
    revalidatePath('/portal/comisiones');
    return { success: true };
  } catch (error) {
    return resultError(error);
  }
}

export async function markCommissionClaimPaidAction(payload: { claimId: number; reference?: string }) {
  try {
    const supabase = await createClient();
    const user = await getCurrentUser(supabase);
    if (!user || !['super_admin', 'master_broker_admin', 'master_broker_operations'].includes(user.role) || user.organization.kind === 'developer') {
      return { error: 'No tienes permiso para registrar pagos.' };
    }
    const { error } = await supabase.rpc('mark_commission_claim_paid', {
      target_claim_id: payload.claimId,
      target_reference: payload.reference || undefined,
    });
    if (error) return { error: error.message };
    revalidatePath('/portal/comisiones');
    return { success: true };
  } catch (error) {
    return resultError(error);
  }
}
