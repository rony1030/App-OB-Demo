import { notFound } from 'next/navigation';
import SimpleProposalCreator from '@/components/portal/proposals/SimpleProposalCreator';
import type { PortalProject } from '@/lib/portal-projects';
import type { MarketingOffer } from '@/lib/data/marketing-offers';

const previewProject: PortalProject = {
  id: 254,
  slug: 'cana-rock-stelar',
  name: 'Cana Rock Cosmos Stelar',
  developer: 'Grupo Cana Rock',
  brandProfile: { name: 'Cana Rock', accentColor: '#c5a880', surfaceColor: '#fefdf9', logoUrl: '/canarock-logo.png' },
  location: 'Cana Bay, Punta Cana',
  zone: 'Punta Cana',
  status: 'En construcción',
  delivery: 'Diciembre 2027',
  deliveryDate: '2027-12-01',
  startingPrice: 301199,
  currency: 'USD',
  commission: 5,
  totalUnits: 120,
  availableUnits: 18,
  description: 'Cosmos Stelar es una relajante combinación de arquitectura contemporánea y naturaleza, situada en medio del reconocido Hard Rock Golf Club de Cana Bay.',
  shortDescription: 'Arquitectura contemporánea integrada con la naturaleza, el lago y el campo de golf.',
  image: '/projects/cana-rock-stelar/stelar-aerial-bg.jpg',
  gallery: ['/projects/cana-rock-stelar/stelar-aerial-bg.jpg', '/projects/cana-rock-stelar/stelar-render-20.jpg', '/projects/cana-rock-stelar/stelar-render-19.jpg'],
  highlights: ['Piscina', 'Gimnasio', 'Minigolf'],
  amenities: ['Aparcamiento subterráneo', 'Ascensores', 'Bar', 'GYM', 'Lugar para el yoga', 'Minigolf', 'Piscina', 'Restaurante de autor', 'Seguridad 24 horas', 'Vestíbulo'],
  paymentPlan: [{ label: 'Reserva', value: 'US$ 3,000' }, { label: 'Inicial', value: '20%' }, { label: 'Durante construcción', value: '40%' }, { label: 'Contra entrega', value: '40%' }],
  documents: [],
  units: [{ id: '254', unit: 'A504', tower: 'A', floor: 5, type: 'Apartamento', bedrooms: 2, bathrooms: 2, area: 96, price: 301199, currency: 'USD', status: 'Disponible', isPublic: true }],
  projectType: 'building',
  lots: [],
  updatedAt: new Date().toISOString(),
};

const previewOffers: MarketingOffer[] = [{
  id: 901,
  organizationId: 1,
  title: 'Descuento de lanzamiento',
  offerType: 'discount',
  description: 'Beneficio autorizado para propuestas emitidas durante la vigencia.',
  promotionText: null,
  discountPercent: 5,
  bannerPath: null,
  bannerUrl: null,
  displayPlacement: 'header_banner',
  status: 'active',
  startsAt: new Date(Date.now() - 86_400_000).toISOString(),
  endsAt: new Date(Date.now() + 30 * 86_400_000).toISOString(),
  priority: 10,
  requiresOptIn: true,
  projectIds: [254],
}];

export default function ProposalCreatorPreviewPage() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return <div className="px-4 sm:px-6 lg:px-8"><SimpleProposalCreator project={previewProject} selectedUnitIds={['254']} recipients={[
    { id: 1, fullName: 'Rony Bello', email: 'rony@example.com', phone: '+1 809 555 0101', classification: 'Inversionista' },
    { id: 2, fullName: 'María Rodríguez', email: 'maria@example.com', phone: '+1 809 555 0102', classification: 'Inversionista' },
  ]} activeOffers={previewOffers} brokerName="Rony Bello" brokerPhone="+1 809 555 0101" brokerEmail="rony@example.com" /></div>;
}
