import type { Metadata } from 'next';
import { getDevelopersDirectory } from '@/lib/data/developers-directory';
import { getCurrentUser } from '@/lib/auth/get-user';
import DevelopersDirectoryPage from '@/components/developers/DevelopersDirectoryPage';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Directorio Oficial de Desarrolladores Inmobiliarios · OB Brokers Team',
  description:
    'Descubra las principales firmas constructoras y desarrolladoras inmobiliarias aliadas de OB Brokers Team en Punta Cana, Cap Cana, Bávaro y Santo Domingo.',
  openGraph: {
    title: 'Desarrolladores Inmobiliarios Oficiales · OB Brokers Team',
    description:
      'Portafolio de firmas desarrolladoras con inventario en tiempo real, respaldo fiduciario y garantías comerciales exclusivas.',
    url: 'https://brokers.osvaldobello.com/desarrolladores',
  },
  alternates: {
    canonical: 'https://brokers.osvaldobello.com/desarrolladores',
  },
};

export default async function DesarrolladoresRootPage() {
  const [data, currentUser] = await Promise.all([
    getDevelopersDirectory(),
    getCurrentUser().catch(() => null),
  ]);

  return <DevelopersDirectoryPage data={data} isAuthenticated={!!currentUser} />;
}
