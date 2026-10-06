'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/get-user';

export async function createSupportTicketAction(subject: string, description: string, category: string, priority: string) {
  if (subject.trim().length < 5 || description.trim().length < 10) return { error: 'Incluye un asunto y una descripción clara del caso.' };
  const supabase = await createClient(); const user = await getCurrentUser(supabase);
  if (!user) return { error: 'Tu sesión expiró.' };
  const { error } = await (supabase).from('support_tickets').insert({ organization_id: user.organization.id, opened_by_user_id: user.id, subject: subject.trim(), description: description.trim(), category, priority });
  if (error) return { error: error.message };
  revalidatePath('/portal/support'); return { success: true };
}
