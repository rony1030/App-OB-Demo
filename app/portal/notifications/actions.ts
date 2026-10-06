'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/get-user';

export async function markNotificationReadAction(notificationId: number) {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) return { error: 'No autorizado.' };

  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('membership_id', user.membershipId)
    .is('read_at', null);

  if (error) return { error: error.message };
  revalidatePath('/portal', 'layout');
  return { success: true };
}

export async function markAllNotificationsReadAction() {
  const supabase = await createClient();
  const user = await getCurrentUser(supabase);
  if (!user) return { error: 'No autorizado.' };

  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('membership_id', user.membershipId)
    .is('read_at', null);

  if (error) return { error: error.message };
  revalidatePath('/portal', 'layout');
  return { success: true };
}
