import { redirect } from 'next/navigation';

// Eventos aún no publicados — acceso público desactivado temporalmente.
// Para publicar, conectar EventsManager desde /portal/admin/eventos.
export default function EventosPage() {
  redirect('/');
}
