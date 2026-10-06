'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/get-user';

export type ReserveLotResponse = {
  success?: boolean;
  error?: string;
  reservationId?: number;
};

export async function reserveLotAction(
  lotId: number,
  projectSlug: string,
  opportunityId?: number,
  notes?: string
): Promise<ReserveLotResponse> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: 'Debes iniciar sesión.' };

  const supabase = await createClient();

  const { data, error } = await supabase.rpc('reserve_lot', {
    target_lot_id: lotId,
    target_opportunity_id: opportunityId,
    reservation_notes: notes,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/portal/projects/${projectSlug}`);
  return { success: true, reservationId: data?.[0]?.reservation_id };
}
