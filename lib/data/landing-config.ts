import { createClient } from '@/lib/supabase/server';
import { CIPRES_DEFAULT_FAQS } from '@/lib/data/cipres-typologies';

export interface LandingThemeConfig {
  primaryColor: string; // e.g. '#0f172a' or '#0284c7'
  accentColor: string; // e.g. '#2563eb' or '#d97706'
  fontPreset: 'modern' | 'minimal' | 'luxury';
  logoUrl?: string | null;
  heroMediaUrl?: string | null;
  heroMediaType: 'image' | 'video';
  contactWhatsapp: string;
  contactEmail?: string | null;
  experiencePreset?: 'residential-villas' | 'cana-rock-resort' | 'uve-residences' | 'palm-view' | 'paridera-bonita-beach';
}

export interface LandingSectionVisibility {
  hero: boolean;
  concept: boolean;
  typologies: boolean;
  availability: boolean;
  specs?: boolean;
  gallery: boolean;
  amenities: boolean;
  paymentPlan: boolean;
  location: boolean;
  contactForm: boolean;
  profitability?: boolean;
}

export interface LandingUnitDetailConfig {
  /**
   * Editorial content shown only after a visitor selects a live unit. It is
   * intentionally project-level: appliances and benefit conditions are not
   * inferred from inventory rows.
   */
  includedEquipment: string[];
  qualificationText?: string;
}

export interface LandingProfitabilityItem {
  label: string;
  roi: string;
  description: string;
}

export interface LandingProfitabilityConfig {
  enabled: boolean;
  title: string;
  introduction: string;
  source: string;
  disclaimer: string;
  items: LandingProfitabilityItem[];
}

export interface LandingHeroContent {
  headline: string;
  subheadline: string;
  badgeText: string;
  ctaText: string;
  startingPriceText: string;
}

export interface LandingConceptContent {
  title: string;
  description: string;
  bullet1: string;
  bullet2: string;
  bullet3: string;
  image1?: string;
  image2?: string;
}

export interface PaymentPlanStep {
  title: string;
  percentage: string;
  description: string;
}

export interface LandingAmenityItem {
  title: string;
  description: string;
}

export interface LandingFaqItem {
  question: string;
  answer: string;
}

export interface LandingFeatureCard {
  title: string;
  description: string;
}

export interface LandingSpecCard {
  title: string;
  description: string;
}

export interface LandingStatItem {
  value: string;
  label: string;
}

export interface LandingProximityItem {
  time: string;
  place: string;
}

export interface LandingFinancialConfig {
  reserveAmount: number;
  contractPercent: number;
  constructionPercent: number;
  deliveryPercent: number;
  availableMonths: number[];
  defaultMonths: number;
}

export interface LandingDnsConfig {
  customDomain: string;
  cnameTarget: string;
  isVerified: boolean;
  verifiedAt?: string | null;
}

export interface ProjectLandingConfig {
  projectId: number;
  projectSlug: string;
  isPublished: boolean;
  theme: LandingThemeConfig;
  visibility: LandingSectionVisibility;
  hero: LandingHeroContent;
  concept: LandingConceptContent;
  paymentSteps: PaymentPlanStep[];
  dns: LandingDnsConfig;
  heroSlides?: string[];
  customGallery?: string[];
  locationMapUrl?: string;
  unitDetail?: LandingUnitDetailConfig;
  profitability?: LandingProfitabilityConfig;
  amenities?: LandingAmenityItem[];
  faqs?: LandingFaqItem[];
  features?: LandingFeatureCard[];
  specs?: LandingSpecCard[];
  specImages?: string[];
  specsEyebrow?: string;
  specsTitle?: string;
  specsSubtitle?: string;
  stats?: LandingStatItem[];
  proximityItems?: LandingProximityItem[];
  financial?: LandingFinancialConfig;
  locationTitle?: string;
  locationSubtitle?: string;
  footerLocation?: string;
  navbarLogoUrl?: string;
  navbarLogoTextUrl?: string;
  googleMapsUrl?: string;
  updatedAt?: string;
}

export function getDefaultLandingConfig(project: {
  id: number;
  slug: string;
  name: string;
  location: string;
  shortDescription?: string;
  description?: string;
  startingPrice?: number;
  delivery?: string;
  image?: string;
  heroImage?: string;
  gallery?: string[];
}): ProjectLandingConfig {
  const projectGallery = Array.from(new Set((project.gallery || []).filter(Boolean)));
  const heroMediaUrl = project.image || project.heroImage || projectGallery[0] || null;

  return {
    projectId: project.id,
    projectSlug: project.slug,
    isPublished: true,
    theme: {
      primaryColor: '#090d16',
      accentColor: '#2563eb',
      fontPreset: 'luxury',
      logoUrl: null,
      heroMediaUrl,
      heroMediaType: 'image',
      contactWhatsapp: '18097828828',
      contactEmail: 'ventas@ob-brokers.com',
      experiencePreset: undefined,
    },
    heroSlides: projectGallery.length > 0 ? projectGallery.slice(0, 7) : heroMediaUrl ? [heroMediaUrl] : [],
    customGallery: projectGallery,
    visibility: {
      hero: true,
      concept: true,
      typologies: true,
      availability: true,
      specs: true,
      gallery: true,
      amenities: true,
      paymentPlan: true,
      location: true,
      contactForm: true,
      profitability: false,
    },
    hero: {
      headline: project.name,
      subheadline:
        project.shortDescription ||
        project.description ||
        'Desarrollo residencial exclusivo en el Caribe.',
      badgeText: project.location || 'Desarrollo Residencial',
      ctaText: 'Explorar Disponibilidad',
      startingPriceText: project.startingPrice && project.startingPrice > 0
        ? `Desde USD $${project.startingPrice.toLocaleString()}`
        : 'Precios a consultar',
    },
    concept: {
      title: project.name,
      description: project.description || project.shortDescription || '',
      bullet1: '',
      bullet2: '',
      bullet3: '',
    },
    specs: [],
    amenities: undefined,
    features: undefined,
    locationSubtitle: project.location ? `Ubicado en ${project.location}` : undefined,
    paymentSteps: [],
    faqs: project.slug === 'cipres-residences' ? CIPRES_DEFAULT_FAQS : undefined,
    locationMapUrl: project.slug === 'cipres-residences'
      ? '/projects/cipres-residences/mapa_ubicacion.jpg'
      : (project.slug === 'elements' ? '/images/projects/elements/master-plan-3d.jpg' : undefined),
    navbarLogoUrl: undefined,
    navbarLogoTextUrl: undefined,
    unitDetail: undefined,
    profitability: undefined,
    dns: {
      customDomain: '',
      cnameTarget: 'cname.vercel-dns.com',
      isVerified: false,
      verifiedAt: null,
    },
  };
}

const LANDING_CONFIG_KIND = 'landing_config';
const CUSTOM_DOMAIN_KIND = 'landing_custom_domain';
const MAX_LANDING_CONFIG_BYTES = 750_000;

function containsEmbeddedImage(value: unknown): boolean {
  if (typeof value === 'string') return value.startsWith('data:image/');
  if (Array.isArray(value)) return value.some(containsEmbeddedImage);
  if (value && typeof value === 'object') return Object.values(value).some(containsEmbeddedImage);
  return false;
}

export async function getProjectLandingConfig(
  projectId: number,
  fallbackProject: {
    id: number;
    slug: string;
    name: string;
    location: string;
    shortDescription?: string;
    description?: string;
    startingPrice?: number;
    delivery?: string;
    image?: string;
    heroImage?: string;
    gallery?: string[];
  }
): Promise<ProjectLandingConfig> {
  const defaults = getDefaultLandingConfig(fallbackProject);

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('project_media')
      .select('alt_text, storage_path')
      .eq('project_id', projectId)
      .eq('kind', LANDING_CONFIG_KIND)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data || !data.alt_text) {
      return defaults;
    }

    const parsed = JSON.parse(data.alt_text) as Partial<ProjectLandingConfig>;

    // Fetch custom domain if registered separately
    const { data: domainData } = await supabase
      .from('project_media')
      .select('storage_path')
      .eq('project_id', projectId)
      .eq('kind', CUSTOM_DOMAIN_KIND)
      .limit(1)
      .maybeSingle();

    const resolvedProfitability = parsed.profitability ?? defaults.profitability;
    const hasProfitabilityData = Boolean(
      resolvedProfitability?.enabled && (resolvedProfitability?.items?.length ?? 0) > 0
    );
    const resolvedProfitabilityVisibility =
      parsed.visibility?.profitability !== undefined
        ? parsed.visibility.profitability
        : (hasProfitabilityData ? true : (defaults.visibility.profitability ?? false));

    const merged: ProjectLandingConfig = {
      ...defaults,
      ...parsed,
      theme: { ...defaults.theme, ...(parsed.theme || {}) },
      visibility: {
        ...defaults.visibility,
        ...(parsed.visibility || {}),
        profitability: resolvedProfitabilityVisibility,
      },
      hero: { ...defaults.hero, ...(parsed.hero || {}) },
      concept: { ...defaults.concept, ...(parsed.concept || {}) },
      paymentSteps: parsed.paymentSteps?.length ? parsed.paymentSteps : defaults.paymentSteps,
      heroSlides: parsed.heroSlides ?? defaults.heroSlides,
      customGallery: parsed.customGallery ?? defaults.customGallery,
      locationMapUrl: parsed.locationMapUrl ?? defaults.locationMapUrl,
      unitDetail: parsed.unitDetail ?? defaults.unitDetail,
      profitability: resolvedProfitability,
      amenities: parsed.amenities?.length ? parsed.amenities : defaults.amenities,
      faqs: parsed.faqs ?? defaults.faqs,
      features: parsed.features?.length ? parsed.features : defaults.features,
      specs: parsed.specs?.length ? parsed.specs : defaults.specs,
      stats: parsed.stats ?? defaults.stats,
      proximityItems: parsed.proximityItems ?? defaults.proximityItems,
      financial: parsed.financial ?? defaults.financial,
      locationTitle: parsed.locationTitle ?? defaults.locationTitle,
      locationSubtitle: parsed.locationSubtitle ?? defaults.locationSubtitle,
      footerLocation: parsed.footerLocation ?? defaults.footerLocation,
      navbarLogoUrl: parsed.navbarLogoUrl ?? defaults.navbarLogoUrl,
      navbarLogoTextUrl: parsed.navbarLogoTextUrl ?? defaults.navbarLogoTextUrl,
      googleMapsUrl: parsed.googleMapsUrl ?? defaults.googleMapsUrl,
      dns: {
        ...defaults.dns,
        ...(parsed.dns || {}),
        customDomain: domainData?.storage_path || parsed.dns?.customDomain || '',
      },
    };

    // Cana Rock Star's official project_media gallery is the source of truth.
    // Older landing_config JSON contains a curated 10-image snapshot, which
    // otherwise masks the current project gallery on the public landing.
    if (defaults.projectSlug === 'cana-rock-star' && defaults.customGallery?.length) {
      merged.customGallery = defaults.customGallery;
    }

    if (defaults.projectSlug === 'uve-residences') {
      const parsedLogoIsCipres =
        parsed.navbarLogoUrl?.includes('cipres-residences') ||
        parsed.navbarLogoTextUrl?.includes('cipres-residences');

      merged.hero = {
        ...merged.hero,
        badgeText: 'Resort Style Living · Wellness · Punta Cana',
        headline: 'Vive como en un resort.',
        subheadline: '21 residencias wellness en Brisas de Punta Cana, diseñadas para vivir, relajarte e invertir.',
        startingPriceText: 'Desde US$ 144,400',
      };
      merged.concept = {
        ...merged.concept,
        title: 'Un hogar moderno con la experiencia de vivir de vacaciones.',
        description: 'UVE Residence combina arquitectura contemporánea, amenidades estilo resort y una ubicación estratégica a minutos de Downtown Punta Cana y Playa Jellyfish.',
        bullet1: 'Solo 21 residencias exclusivas',
        bullet2: 'Shuttle diario a Playa Jellyfish',
        bullet3: 'Enfoque wellness para vivir y disfrutar',
      };
      merged.paymentSteps = [
        { title: 'Reserva', percentage: 'US$ 2,000', description: 'Aparta tu residencia seleccionada.' },
        { title: 'Inicial', percentage: '20%', description: 'A la firma del contrato.' },
        { title: 'Durante construcción', percentage: '30%', description: 'Durante la construcción del proyecto.' },
        { title: 'Contra entrega', percentage: '50%', description: 'Entrega estimada: abril de 2028.' },
      ];
      merged.financial = {
        reserveAmount: 2000,
        contractPercent: 0.2,
        constructionPercent: 0.3,
        deliveryPercent: 0.5,
        availableMonths: [12, 24],
        defaultMonths: 12,
      };
      merged.locationTitle = 'Brisas de Punta Cana';
      merged.locationSubtitle = 'A minutos de Downtown Punta Cana, Playa Jellyfish y el Aeropuerto Internacional.';

      if (parsedLogoIsCipres || (!parsed.navbarLogoUrl && !parsed.navbarLogoTextUrl)) {
        merged.navbarLogoUrl = '/projects/uve-residences/logo.png';
        merged.navbarLogoTextUrl = undefined;
      }
    }

    return merged;
  } catch {
    return defaults;
  }
}

export async function saveProjectLandingConfig(
  projectId: number,
  config: ProjectLandingConfig,
  organizationId: number = 1
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const jsonString = JSON.stringify(config);

    if (containsEmbeddedImage(config)) {
      return {
        success: false,
        error: 'Hay una imagen pendiente de subir. Espera a que la carga termine antes de guardar.',
      };
    }

    if (Buffer.byteLength(jsonString, 'utf8') > MAX_LANDING_CONFIG_BYTES) {
      return {
        success: false,
        error: 'La configuración excede el tamaño permitido. Reduce el contenido o elimina imágenes no utilizadas.',
      };
    }

    // Check existing config
    const { data: existing } = await supabase
      .from('project_media')
      .select('id')
      .eq('project_id', projectId)
      .eq('kind', LANDING_CONFIG_KIND)
      .limit(1)
      .maybeSingle();

    if (existing) {
      const { error: updateError } = await supabase
        .from('project_media')
        .update({
          alt_text: jsonString,
          storage_path: `projects/${config.projectSlug}/landing_config.json`,
        })
        .eq('id', existing.id);
      if (updateError) return { success: false, error: updateError.message };
    } else {
      const { error: insertError } = await supabase.from('project_media').insert({
        project_id: projectId,
        organization_id: organizationId,
        kind: LANDING_CONFIG_KIND,
        storage_bucket: 'public-assets',
        storage_path: `projects/${config.projectSlug}/landing_config.json`,
        alt_text: jsonString,
        sort_order: 999,
      });
      if (insertError) return { success: false, error: insertError.message };
    }

    // Save or update custom domain for DNS routing
    const cleanedDomain = (config.dns.customDomain || '').trim().toLowerCase();
    const { data: existingDomain } = await supabase
      .from('project_media')
      .select('id')
      .eq('project_id', projectId)
      .eq('kind', CUSTOM_DOMAIN_KIND)
      .limit(1)
      .maybeSingle();

    if (cleanedDomain) {
      if (existingDomain) {
        const { error: updateError } = await supabase
          .from('project_media')
          .update({
            storage_path: cleanedDomain,
            alt_text: JSON.stringify({ verified: config.dns.isVerified }),
          })
          .eq('id', existingDomain.id);
        if (updateError) return { success: false, error: updateError.message };
      } else {
        const { error: insertError } = await supabase.from('project_media').insert({
          project_id: projectId,
          organization_id: organizationId,
          kind: CUSTOM_DOMAIN_KIND,
          storage_bucket: 'public-assets',
          storage_path: cleanedDomain,
          alt_text: JSON.stringify({ verified: config.dns.isVerified }),
          sort_order: 1000,
        });
        if (insertError) return { success: false, error: insertError.message };
      }
    } else if (existingDomain) {
      const { error: deleteError } = await supabase.from('project_media').delete().eq('id', existingDomain.id);
      if (deleteError) return { success: false, error: deleteError.message };
    }

    return { success: true };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error desconocido al guardar configuración',
    };
  }
}

export async function findProjectSlugByDomain(host: string): Promise<string | null> {
  const cleanHost = host.split(':')[0].trim().toLowerCase();
  if (
    !cleanHost ||
    cleanHost === 'localhost' ||
    cleanHost === '127.0.0.1' ||
    cleanHost.includes('vercel.app') ||
    cleanHost.includes('ob-brokers')
  ) {
    return null;
  }

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('project_media')
      .select('project_id, storage_path')
      .eq('kind', CUSTOM_DOMAIN_KIND)
      .eq('storage_path', cleanHost)
      .limit(1)
      .maybeSingle();

    if (data && data.project_id) {
      const { data: project } = await supabase
        .from('projects')
        .select('slug')
        .eq('id', data.project_id)
        .limit(1)
        .maybeSingle();

      return project?.slug || null;
    }
  } catch {
    // fallback
  }

  return null;
}
