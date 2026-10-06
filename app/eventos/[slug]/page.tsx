import { redirect } from 'next/navigation';

// Detalle de evento aún no publicado — acceso público desactivado temporalmente.
export default function EventoDetailPage() {
  redirect('/');
}
