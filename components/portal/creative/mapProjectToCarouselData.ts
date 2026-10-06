import type { PortalProject } from '@/lib/portal-projects';
import type { AgentProfile, CarouselProjectData } from './types';

const MAX_CONTENT_SLIDES = 4;

function aggregateBedroomRange(project: PortalProject): string {
  const available = project.units.filter((u) => u.bedrooms > 0);
  if (available.length === 0) return '';
  const values = available.map((u) => u.bedrooms);
  const min = Math.min(...values);
  const max = Math.max(...values);
  return min === max ? `${min} hab` : `${min}-${max} hab`;
}

function aggregateBathroomRange(project: PortalProject): string {
  const available = project.units.filter((u) => u.bathrooms > 0);
  if (available.length === 0) return '';
  const values = available.map((u) => u.bathrooms);
  const min = Math.min(...values);
  const max = Math.max(...values);
  return min === max ? `${min} baños` : `${min}-${max} baños`;
}

function aggregateAreaRange(project: PortalProject): string {
  const available = project.units.filter((u) => u.area > 0);
  if (available.length === 0) return '';
  const values = available.map((u) => u.area);
  const min = Math.min(...values);
  const max = Math.max(...values);
  return min === max ? `${min} m²` : `${min}-${max} m²`;
}

export function mapProjectToCarouselData(project: PortalProject, agent: AgentProfile): CarouselProjectData {
  const gallery = [project.image, ...project.gallery].filter(Boolean);
  const contentImages = gallery.slice(1, 1 + MAX_CONTENT_SLIDES);
  const amenitiesImage = gallery[1 + MAX_CONTENT_SLIDES] ?? gallery[gallery.length - 1] ?? project.image;

  return {
    id: project.slug,
    propertyName: project.name,
    location: project.location,
    aspectRatio: 'portrait',
    stylePreset: 'A',
    footerLogoUrl: null,
    showFooterLogo: true,
    slide1: {
      title: project.name,
      subtitle: project.location,
      bedrooms: aggregateBedroomRange(project),
      bathrooms: aggregateBathroomRange(project),
      area: aggregateAreaRange(project),
      price: project.startingPrice,
      currency: project.currency,
      priceLabel: 'Desde',
      imageUrl: project.image,
      features: project.amenities.slice(0, 3).map((label, i) => ({ id: `feature-${i}`, label })),
      showPrice: true,
    },
    contentSlides: contentImages.map((imageUrl, i) => ({
      title: project.highlights[i] || project.name,
      subtitle: project.shortDescription,
      imageUrl,
      position: i % 2 === 0 ? 'left' : 'right',
    })),
    slide4: {
      title: 'Amenidades',
      subtitle: `Todo lo que ${project.name} tiene para ti`,
      amenities: project.amenities.map((label, i) => ({ id: `amenity-${i}`, label })),
      imageUrl: amenitiesImage,
    },
    slide5: {
      headline: `¿Listo para invertir en ${project.name}?`,
      price: project.startingPrice,
      currency: project.currency,
      priceLabel: 'Desde',
      ctaText: 'Solicita más información',
      agent,
    },
  };
}
