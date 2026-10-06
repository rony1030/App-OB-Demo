import type { Metadata } from 'next';
import { getPublicProjects } from '@/lib/data/projects';
import { getMarketingStats } from '@/lib/data/marketing';
import { getCurrentUser } from '@/lib/auth/get-user';
import ProyectosCatalogPage from '@/components/landing/ProyectosCatalogPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Catálogo de Proyectos & Propiedades · OB Brokers Team',
  description:
    'Catálogo oficial y disponibilidad en tiempo real de los principales desarrollos turísticos e inmobiliarios en Punta Cana, Cap Cana, Bávaro, Las Terrenas y Santo Domingo.',
  openGraph: {
    title: 'Propiedades & Proyectos en General · OB Brokers Team',
    description:
      'Explora el portafolio comercial oficial con inventario en tiempo real, tipologías y precios directos para brokers e inversionistas.',
    url: 'https://brokers.osvaldobello.com/proyectos',
  },
};

async function loadData() {
  try {
    const [projects, stats, currentUser] = await Promise.all([
      getPublicProjects(),
      getMarketingStats(),
      getCurrentUser().catch(() => null),
    ]);
    return { projects, stats, isAuthenticated: !!currentUser };
  } catch (error) {
    console.error('Error cargando catálogo de proyectos:', error);
    return {
      projects: [],
      stats: { masterBrokerCount: 0, projectCount: 0 },
      isAuthenticated: false,
    };
  }
}

export default async function ProyectosRootPage() {
  const { projects, stats, isAuthenticated } = await loadData();
  return (
    <ProyectosCatalogPage
      projects={projects}
      stats={stats}
      isAuthenticated={isAuthenticated}
    />
  );
}
