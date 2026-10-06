'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/get-user';
import { upsertBrokerEvent, deleteBrokerEvent, toggleBrokerEventFeatured, type BrokerEvent } from '@/lib/data/events';

function assertAdminRole(role?: string) {
  if (role !== 'super_admin' && role !== 'master_broker_admin') {
    throw new Error('No tienes permisos administrativos para gestionar eventos.');
  }
}

export async function saveBrokerEventAction(
  eventData: Partial<BrokerEvent> & { title: string; slug: string }
): Promise<{ success: boolean; event?: BrokerEvent; error?: string }> {
  try {
    const user = await getCurrentUser();
    assertAdminRole(user?.role);

    const result = await upsertBrokerEvent(eventData);

    revalidatePath('/');
    revalidatePath('/eventos');
    if (eventData.slug) {
      revalidatePath(`/eventos/${eventData.slug}`);
    }
    revalidatePath('/portal/admin/eventos');

    return result;
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al guardar el evento',
    };
  }
}

export async function deleteBrokerEventAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    assertAdminRole(user?.role);

    const result = await deleteBrokerEvent(id);

    revalidatePath('/');
    revalidatePath('/eventos');
    revalidatePath('/portal/admin/eventos');

    return result;
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al eliminar el evento',
    };
  }
}

export async function toggleBrokerEventFeaturedAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser();
    assertAdminRole(user?.role);

    const result = await toggleBrokerEventFeatured(id);

    revalidatePath('/');
    revalidatePath('/eventos');
    revalidatePath('/portal/admin/eventos');

    return result;
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al actualizar destacado',
    };
  }
}
