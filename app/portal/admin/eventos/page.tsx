import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-user';
import { getBrokerEvents } from '@/lib/data/events';
import EventsManager from '@/components/portal/admin/EventsManager';

export const dynamic = 'force-dynamic';

export default async function AdminEventsPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/login?next=/portal/admin/eventos');
  }

  if (currentUser.role !== 'super_admin' && currentUser.role !== 'master_broker_admin') {
    redirect('/portal');
  }

  const events = await getBrokerEvents(true);

  return <EventsManager initialEvents={events} />;
}
