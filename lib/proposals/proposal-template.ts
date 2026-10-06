import type { PortalProject, PortalProjectTypology, PortalUnit } from '@/lib/portal-projects';
import type { ProposalMagazineBlock } from '@/components/presentations/ProposalMagazinePage';
import type { ProposalPropertyItem } from '@/types/proposals';
import { UVE_RESIDENCES_AMENITIES } from '@/lib/data/uve-residences';
import { CORAL_GOLF_RESORT_AMENITIES, PALM_VIEW_EXCLUSIVE_AMENITIES } from '@/components/branding/PalmViewAmenityIcon';
import type { MarketingOffer } from '@/lib/data/marketing-offers';
import type { ProposalPaymentSchedule } from '@/lib/proposals/payment-schedule';

export type ProposalLotSelection = { unitId: string; typologyId: string };

export type ProposalTypologyCustomization = {
  title?: string;
  details?: string;
  image?: string;
  imageFit?: 'cover' | 'contain';
};

export function generateProposalCode(agencyName: string, brokerName: string, clientName: string, shortId?: string): string {
  const sanitize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9 ]/g, '').trim();
  const initials = (s: string, max = 3) => sanitize(s).split(/\s+/).map((w) => w[0]?.toUpperCase()).filter(Boolean).slice(0, max).join('');
  const orgPrefix = initials(agencyName, 2) || 'OB';
  const agentInit = initials(brokerName, 3) || 'AG';
  const firstWord = sanitize(clientName).split(/\s+/)[0]?.toLowerCase() || 'lead';
  const clientSlug = firstWord.startsWith('inversio')
    ? 'inversion'
    : (firstWord.length > 12 ? firstWord.slice(0, 10) : firstWord);
  const id = shortId || Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${orgPrefix}-${agentInit}-${clientSlug}-${id}`;
}

const DEFAULT_DISCLAIMER = 'Información de carácter ilustrativo y sujeta a cambios sin previo aviso. Precios, disponibilidad, terminaciones y condiciones comerciales deben ser confirmados antes de formalizar cualquier operación.';

function proposalVisualStyle(project: PortalProject) {
  const preset = project.landingTheme?.experiencePreset;
  if (preset === 'cana-rock-resort' || project.slug === 'cana-rock-stelar') {
    return { showFrame: true, showOrnaments: false, coverRadius: '1.45rem' };
  }
  if (preset === 'uve-residences' || project.slug === 'uve-residences') {
    return { showFrame: false, showOrnaments: false, coverRadius: '0' };
  }
  return { showFrame: false, showOrnaments: false, coverRadius: '1rem' };
}

function proposalBrandColors(project: PortalProject) {
  const fallback = project.slug === 'uve-residences'
    ? { primary: '#071B3A', accent: '#2F9DB8' }
    : project.slug === 'cipres-residences'
      ? { primary: '#244336', accent: '#B5964A' }
      : { primary: '#0a1140', accent: '#c5a880' };
  return {
    primary: project.landingTheme?.primaryColor || project.brandProfile?.primaryColor || fallback.primary,
    accent: project.landingTheme?.accentColor || project.brandProfile?.accentColor || fallback.accent,
  };
}

function proposalFontFamily(project: PortalProject): 'sans' | 'serif' {
  return project.landingTheme?.fontPreset === 'luxury' ? 'serif' : 'sans';
}

function proposalIconFamily(project: PortalProject): 'cana-rock' | 'uve' | 'palm-view' | 'minimal' {
  if (project.landingTheme?.experiencePreset === 'cana-rock-resort' || project.slug === 'cana-rock-stelar') {
    return 'cana-rock';
  }
  if (project.landingTheme?.experiencePreset === 'uve-residences' || project.slug === 'uve-residences') {
    return 'uve';
  }
  if (project.landingTheme?.experiencePreset === 'palm-view' || project.slug === 'palm-view') {
    return 'palm-view';
  }
  return 'minimal';
}

export function cleanProposalLocation(value?: string | null) {
  return (value || '')
    .replace(/[\u{1F1E6}-\u{1F1FF}\u{1F300}-\u{1FAFF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function proposalAmenitiesFor(project: PortalProject) {
  if (project.landingAmenities?.length) return project.landingAmenities;
  if (project.amenities.length) return project.amenities;
  if (project.slug === 'palm-view') return [...PALM_VIEW_EXCLUSIVE_AMENITIES];
  if (project.slug === 'uve-residences') return [...UVE_RESIDENCES_AMENITIES];
  return project.highlights;
}

export function projectLogoForProposal(project: PortalProject) {
  if (project.slug === 'palm-view') {
    return '/projects/palm-view/logo-horizontal.svg';
  }
  if (project.slug === 'elements') {
    return '/images/projects/elements/logo-horizontal.png';
  }
  return (
    project.landingTheme?.logoUrl ||
    project.brandProfile?.logoUrl ||
    (project.slug === 'uve-residences' ? '/projects/uve-residences/logo.png' : undefined) ||
    (project.slug === 'cipres-residences' ? '/projects/cipres-residences/logo.png' : undefined) ||
    (project.slug === 'cana-rock-stelar' ? '/canarock-logo.png' : undefined)
  );
}

function paymentNumber(project: PortalProject, label: string, fallback: number) {
  if (project.slug === 'uve-residences') {
    if (label === 'reserva') return 2000;
    if (label === 'inicial') return 20;
    if (label === 'constru') return 30;
  }
  const step = project.paymentPlan.find((item) => item.label.toLocaleLowerCase().includes(label));
  if (!step) return fallback;
  const value = Number(step.value.replace(/[^\d.,-]/g, '').replace(/,/g, ''));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function buildProposalBlocks(
  project: PortalProject,
  options?: {
    coverImage?: string;
    storyImage?: string;
    storySecondaryImage?: string;
    storyImageFit?: 'cover' | 'contain';
    storyImagePosition?: string;
    storySecondaryImageFit?: 'cover' | 'contain';
    storySecondaryImagePosition?: string;
    amenitiesImage?: string;
    amenitiesImageFit?: 'cover' | 'contain';
    amenitiesImagePosition?: string;
    unitsImage?: string;
    unitsImageFit?: 'cover' | 'contain';
    paymentImage?: string;
    paymentImageFit?: 'cover' | 'contain';
    galleryImages?: string[];
    message?: string;
    storyBody?: string;
    storyPart1?: string;
    storyPart2?: string;
    appliedOffer?: MarketingOffer | null;
    manualDiscount?: { type: 'percent' | 'amount'; value: number } | null;
    reservationDate?: string;
    brokerLogoUrl?: string;
    brokerLogoVariant?: 'normal' | 'white';
    headerLogoMode?: 'ob' | 'project' | 'custom' | 'none';
    hideHeaderLogo?: boolean;
    selectedItems?: ProposalPropertyItem[];
    selectedTypologyIds?: string[];
    typologyPlanImages?: Record<string, string | undefined>;
    includeTypologyPage?: boolean;
    customTypology?: ProposalTypologyCustomization;
    paymentSchedule?: Partial<ProposalPaymentSchedule>;
  },
): ProposalMagazineBlock[] {
  const brandColors = proposalBrandColors(project);
  const accent = brandColors.accent;
  const foreground = brandColors.primary;
  const visualStyle = proposalVisualStyle(project);
  const coverImage = options?.coverImage || project.image;
  const galleryImages = Array.from(new Set(options?.galleryImages?.length ? options.galleryImages : project.gallery)).filter(Boolean).slice(0, 12);
  const storyImage = options?.storyImage || galleryImages[0] || project.image;
  const additionalStoryImage = options?.storySecondaryImage || galleryImages.find((image) => image !== storyImage);
  const projectLogoUrl = projectLogoForProposal(project);

  const hasDiscount = Boolean(options?.manualDiscount || (options?.appliedOffer && options.appliedOffer.offerType === 'discount'));
  const offerTitle = hasDiscount ? undefined : (options?.appliedOffer?.title || undefined);
  const offerText = hasDiscount ? undefined : (options?.appliedOffer?.promotionText || undefined);

  const isNoneLogo = options?.headerLogoMode === 'none' || options?.hideHeaderLogo === true;
  const common: ProposalMagazineBlock = {
    backgroundType: 'solid',
    backgroundColor: '#ffffff',
    textColor: foreground,
    accentColor: accent,
    projectLogoUrl,
    showBrokerLogo: !isNoneLogo,
    headerLogoMode: options?.headerLogoMode || (options?.hideHeaderLogo ? 'none' : 'ob'),
    hideHeaderLogo: isNoneLogo,
    brokerLogoVariant: options?.brokerLogoVariant || 'normal' as const,
    customBrokerLogoUrl: options?.brokerLogoUrl,
    showDisclaimer: false,
    disclaimer: DEFAULT_DISCLAIMER,
    disclaimerColor: '#64748b',
    disclaimerSize: 8,
    imageFit: 'cover',
    imagePosition: 'center',
    showFrame: visualStyle.showFrame,
    showOrnaments: visualStyle.showOrnaments,
    coverRadius: visualStyle.coverRadius,
    fontFamily: proposalFontFamily(project),
    iconFamily: project.slug === 'cipres-residences' ? 'cipres' : proposalIconFamily(project),
    offerTitle,
    offerText,
  };

  const galleryPages: ProposalMagazineBlock[] = galleryImages.map((image, index) => ({
    ...common,
    id: `proposal-gallery-${index + 1}`,
    type: 'image',
    image,
    images: [image],
    hidePageContent: true,
    showDisclaimer: true,
    showOrnaments: false,
    showFrame: false,
    galleryPage: true,
  }));

  const typologyGroups = new Map<string, {
    name: string;
    details: string;
    units: string[];
    image?: string;
    floorPlanImage?: string;
    bedrooms?: number;
    bathrooms?: number;
    areaSqm?: number;
    parkingSpaces?: number;
  }>();
  for (const typologyId of options?.selectedTypologyIds || []) {
    const typology = project.typologies?.find((item) => item.id === typologyId || item.key === typologyId);
    if (!typology) continue;
    const key = typology.id || typology.key || typology.name;
    typologyGroups.set(key, {
      name: typology.name,
      details: [
        typology.bedrooms ? `${typology.bedrooms} habitaciones` : '',
        typology.bathrooms ? `${typology.bathrooms} baños` : '',
        typology.totalSqm ? `${typology.totalSqm} m²` : '',
        typology.parkingSpaces ? `${typology.parkingSpaces} parqueos` : '',
        typology.description || '',
      ].filter(Boolean).join(' · ') || 'Información oficial de la tipología seleccionada.',
      units: [],
      image: typology.image || typology.floorPlanImage,
      floorPlanImage: options?.typologyPlanImages?.[key] || typology.floorPlanImage || typology.image,
      bedrooms: typology.bedrooms,
      bathrooms: typology.bathrooms,
      areaSqm: typology.totalSqm,
      parkingSpaces: typology.parkingSpaces,
    });
  }
  for (const item of options?.selectedItems || []) {
    const name = item.typology_name || (item.unit_name ? `Unidad ${item.unit_name}` : 'Apartamento seleccionado');
    const key = item.typology_id || name;
    if (!typologyGroups.has(key)) {
      const bedrooms = item.bedrooms ?? item.typology_bedrooms;
      const bathrooms = item.bathrooms ?? item.typology_bathrooms;
      const areaSqm = item.area_sqm ?? item.typology_area_sqm;
      const parkingSpaces = item.parking_spaces ?? item.typology_parking_spaces;
      const sourceTypology = project.typologies?.find((typology) => typology.id === key || typology.key === key || typology.name === name);

      const finalBedrooms = bedrooms ?? sourceTypology?.bedrooms;
      const finalBathrooms = bathrooms ?? sourceTypology?.bathrooms;
      const finalAreaSqm = areaSqm ?? sourceTypology?.totalSqm;
      const finalParkingSpaces = parkingSpaces ?? sourceTypology?.parkingSpaces;

      const details = [
        finalBedrooms ? `${finalBedrooms} habitaciones` : '',
        finalBathrooms ? `${finalBathrooms} baños` : '',
        finalAreaSqm ? `${finalAreaSqm} m²` : '',
        finalParkingSpaces ? `${finalParkingSpaces} parqueos` : '',
      ].filter(Boolean).join(' · ');
      typologyGroups.set(key, {
        name,
        details: [details, sourceTypology?.description].filter(Boolean).join(' · ') || (item.unit_name ? `Apartamento listo para entrega · Unidad ${item.unit_name}` : 'Información oficial de la unidad seleccionada.'),
        units: [],
        image: item.typology_image || sourceTypology?.image || item.typology_floor_plan_image || sourceTypology?.floorPlanImage,
        floorPlanImage: options?.typologyPlanImages?.[key] || item.typology_floor_plan_image || sourceTypology?.floorPlanImage || item.typology_image || sourceTypology?.image,
        bedrooms: finalBedrooms,
        bathrooms: finalBathrooms,
        areaSqm: finalAreaSqm,
        parkingSpaces: finalParkingSpaces,
      });
    }
    const group = typologyGroups.get(key)!;
    if (item.unit_name && !group.units.includes(item.unit_name)) group.units.push(item.unit_name);
    if (group.bedrooms === undefined && (item.bedrooms ?? item.typology_bedrooms) !== undefined) group.bedrooms = item.bedrooms ?? item.typology_bedrooms;
    if (group.bathrooms === undefined && (item.bathrooms ?? item.typology_bathrooms) !== undefined) group.bathrooms = item.bathrooms ?? item.typology_bathrooms;
    if (group.areaSqm === undefined && (item.area_sqm ?? item.typology_area_sqm) !== undefined) group.areaSqm = item.area_sqm ?? item.typology_area_sqm;
    if (group.parkingSpaces === undefined && (item.parking_spaces ?? item.typology_parking_spaces) !== undefined) group.parkingSpaces = item.parking_spaces ?? item.typology_parking_spaces;
  }

  const includeTypology = options?.includeTypologyPage !== false;
  const typologyPages: ProposalMagazineBlock[] = includeTypology ? Array.from(typologyGroups.values()).map((group, index) => {
    const custom = options?.customTypology;
    const isSingleOrFirst = index === 0 && Array.from(typologyGroups.values()).length === 1;
    const title = (isSingleOrFirst && custom?.title?.trim()) ? custom.title.trim() : group.name;
    const details = (isSingleOrFirst && custom?.details?.trim()) ? custom.details.trim() : group.details;
    const image = (isSingleOrFirst && custom?.image) ? custom.image : (group.floorPlanImage || group.image);
    const imageFit = (isSingleOrFirst && custom?.imageFit) ? custom.imageFit : 'contain';

    return {
      ...common,
      id: `proposal-typology-${index + 1}`,
      type: 'typology',
      kicker: group.units.length === 1 ? 'Unidad seleccionada' : 'Tipología y unidad',
      title,
      body: details,
      typologyName: title,
      typologyDetails: details,
      typologyUnits: group.units,
      typologyBedrooms: group.bedrooms,
      typologyBathrooms: group.bathrooms,
      typologyAreaSqm: group.areaSqm,
      typologyParkingSpaces: group.parkingSpaces,
      availabilityItems: options?.selectedItems,
      image,
      images: [image].filter(Boolean) as string[],
      imageFit,
      typologyFloorPlanImage: group.floorPlanImage || (imageFit === 'contain' ? image : undefined),
      titleSize: 40,
      bodySize: 14,
      showDisclaimer: true,
    };
  }) : [];

  const selectedItems = options?.selectedItems || [];
  const distinctUnitPaymentConfigs = selectedItems.filter((item, index, self) =>
    index === self.findIndex((other) => (
      (other.price || 0) === (item.price || 0) &&
      (other.typology_id || other.typology_name || '') === (item.typology_id || item.typology_name || '')
    ))
  );

  const shouldSplitPayment = selectedItems.length > 1 && (
    distinctUnitPaymentConfigs.length > 1 ||
    selectedItems.some((item, idx) => idx > 0 && item.price !== selectedItems[0].price)
  );

  const basePaymentSchedule = (() => {
    const isReady = project.slug === 'cana-rock-star' || project.status === 'Listo para entrega' || (project.delivery && project.delivery.toLowerCase().includes('listo'));
    const hasConstruStep = project.paymentPlan.some((step) => step.label.toLowerCase().includes('constru'));
    const defaultConstru = isReady || (project.paymentPlan.length > 0 && !hasConstruStep) ? 0 : 30;
    const defaultInitial = paymentNumber(project, 'inicial', 20);
    const defaultReservation = paymentNumber(project, 'reserva', 3000);
    const defaultConstruction = paymentNumber(project, 'constru', defaultConstru);
    const deliveryDate = project.deliveryDate || (project.delivery && /^\d{4}-\d{2}-\d{2}/.test(project.delivery) ? project.delivery.slice(0, 10) : '');
    const defaultConstructionInstallments = (() => {
      if (project.slug !== 'uve-residences' || !deliveryDate) return 12;
      const match = deliveryDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (!match) return 12;
      const target = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
      const today = new Date();
      const months = (target.getFullYear() - today.getFullYear()) * 12 + target.getMonth() - today.getMonth();
      return Math.max(1, months - (target.getDate() < today.getDate() ? 1 : 0));
    })();
    return {
      reservationAmount: options?.paymentSchedule?.reservationAmount ?? defaultReservation,
      reservationDate: options?.reservationDate || options?.paymentSchedule?.reservationDate || new Date().toISOString().slice(0, 10),
      initialPercentage: options?.paymentSchedule?.initialPercentage ?? defaultInitial,
      initialDueDays: options?.paymentSchedule?.initialDueDays ?? 30,
      constructionPercentage: options?.paymentSchedule?.constructionPercentage ?? defaultConstruction,
      constructionStartDate: options?.paymentSchedule?.constructionStartDate || '',
      deliveryDate: options?.paymentSchedule?.deliveryDate || deliveryDate,
      constructionFrequency: options?.paymentSchedule?.constructionFrequency || 'monthly',
      constructionInstallments: options?.paymentSchedule?.constructionInstallments ?? defaultConstructionInstallments,
      specialInstallmentAmount: options?.paymentSchedule?.specialInstallmentAmount ?? 0,
      specialInstallmentDate: options?.paymentSchedule?.specialInstallmentDate || '',
    };
  })();

  const paymentBlocks: ProposalMagazineBlock[] = shouldSplitPayment
    ? selectedItems.map((item, index) => ({
        ...common,
        id: `proposal-payment-${item.unit_id || index + 1}`,
        type: 'payment',
        kicker: `Inversión inteligente · Unidad ${item.unit_name || index + 1}`,
        title: `Plan de pagos ·\nUnidad ${item.unit_name || index + 1}`,
        body: `Un esquema flexible para acompañar la inversión de la unidad ${item.unit_name || index + 1}.`,
        targetUnit: {
          unit_id: item.unit_id,
          unit_name: item.unit_name,
          typology_id: item.typology_id,
          typology_name: item.typology_name,
          price: item.price,
          list_price: item.list_price,
          applied_discount_percent: item.applied_discount_percent,
          currency: item.currency,
          bedrooms: item.bedrooms,
          bathrooms: item.bathrooms,
          area_sqm: item.area_sqm,
          parking_spaces: item.parking_spaces,
        },
        targetUnitName: item.unit_name,
        targetUnitPrice: item.price,
        targetUnitCurrency: item.currency || 'USD',
        image: options?.paymentImage,
        images: options?.paymentImage ? [options.paymentImage] : undefined,
        imageFit: options?.paymentImageFit || 'cover',
        titleSize: 36,
        bodySize: 14,
        extraList: project.paymentPlan.map((step) => `${step.label} · ${step.value}`),
        paymentSchedule: basePaymentSchedule,
        showDisclaimer: true,
      }))
    : [
        {
          ...common,
          id: 'proposal-payment',
          type: 'payment',
          kicker: 'Inversión inteligente',
          title: 'Plan de pagos',
          body: 'Un esquema flexible para acompañar su inversión.',
          targetUnit: selectedItems[0] ? {
            unit_id: selectedItems[0].unit_id,
            unit_name: selectedItems[0].unit_name,
            typology_id: selectedItems[0].typology_id,
            typology_name: selectedItems[0].typology_name,
            price: selectedItems[0].price,
            list_price: selectedItems[0].list_price,
            applied_discount_percent: selectedItems[0].applied_discount_percent,
            currency: selectedItems[0].currency,
            bedrooms: selectedItems[0].bedrooms,
            bathrooms: selectedItems[0].bathrooms,
            area_sqm: selectedItems[0].area_sqm,
            parking_spaces: selectedItems[0].parking_spaces,
          } : undefined,
          targetUnitName: selectedItems[0]?.unit_name,
          targetUnitPrice: selectedItems[0]?.price,
          targetUnitCurrency: selectedItems[0]?.currency || 'USD',
          image: options?.paymentImage,
          images: options?.paymentImage ? [options.paymentImage] : undefined,
          imageFit: options?.paymentImageFit || 'cover',
          titleSize: 40,
          bodySize: 14,
          extraList: project.paymentPlan.map((step) => `${step.label} · ${step.value}`),
          paymentSchedule: basePaymentSchedule,
          showDisclaimer: true,
        },
      ];

  return [
    {
      ...common,
      id: 'proposal-cover',
      type: 'cover',
      kicker: 'Propuesta de inversión',
      title: project.name,
      body: options?.message?.trim() || project.shortDescription,
      image: coverImage,
      images: [coverImage, ...galleryImages.filter((image) => image !== coverImage)],
      availabilityItems: options?.selectedItems,
      titleSize: 54,
      bodySize: 13,
      locationLeft: cleanProposalLocation(project.location),
    },
    {
      ...common,
      id: 'proposal-story',
      type: 'text',
      kicker: 'El proyecto',
      title: 'Concepto',
      body: options?.storyBody?.trim() || [options?.storyPart1?.trim(), options?.storyPart2?.trim()].filter(Boolean).join('\n\n') || project.description,
      conceptPart1: options?.storyPart1?.trim(),
      conceptPart2: options?.storyPart2?.trim(),
      image: storyImage,
      images: [storyImage, additionalStoryImage].filter((image): image is string => Boolean(image)),
      imageFit: options?.storyImageFit || 'cover',
      imagePosition: options?.storyImagePosition || 'center',
      additionalImageFit: options?.storySecondaryImageFit || 'contain',
      additionalImagePosition: options?.storySecondaryImagePosition || 'center',
      titleSize: 26,
      bodySize: 14,
    },
    ...typologyPages,
    ...galleryPages,
    {
      ...common,
      id: 'proposal-units',
      type: 'availability',
      kicker: 'Inventario seleccionado',
      title: 'Unidades de esta propuesta',
      body: 'Disponibilidad y precios vigentes al momento de emisión.',
      image: options?.unitsImage,
      images: options?.unitsImage ? [options.unitsImage] : undefined,
      imageFit: options?.unitsImageFit || 'contain',
      titleSize: 40,
      bodySize: 14,
      showDisclaimer: true,
    },
    ...paymentBlocks,
    ...(project.slug === 'palm-view'
      ? [
          {
            ...common,
            id: 'proposal-amenities-resort',
            type: 'highlights' as const,
            kicker: '01 · Coral Golf Resort',
            title: 'Amenidades del Complejo',
            body: 'Un resort completo con campo de golf de 18 hoyos, club de playa privado Coral Beach, muelle, lagos y club de raqueta.',
            titleSize: 36,
            bodySize: 13,
            image: '/projects/palm-view/plans/coral-golf-resort-3d.png',
            images: ['/projects/palm-view/plans/coral-golf-resort-3d.png'],
            imageFit: 'contain' as const,
            imagePosition: 'top' as const,
            extraList: [...CORAL_GOLF_RESORT_AMENITIES],
            iconSourceLabels: [...CORAL_GOLF_RESORT_AMENITIES],
            amenityStyle: 'cards' as const,
            amenityColumns: 2,
            amenityIconMode: 'number' as const,
            iconFamily: 'palm-view' as const,
          },
          {
            ...common,
            id: 'proposal-amenities-project',
            type: 'highlights' as const,
            kicker: '02 · Palm View',
            title: 'Amenidades Exclusivas del Proyecto',
            body: 'Comodidades diseñadas para el descanso y la convivencia, con servicios hoteleros operados por Homebelike (HMS).',
            titleSize: 36,
            bodySize: 13,
            image: options?.amenitiesImage || '/projects/palm-view/plans/palm-view-master-plan-3d.png',
            images: [options?.amenitiesImage || '/projects/palm-view/plans/palm-view-master-plan-3d.png'],
            imageFit: options?.amenitiesImageFit || ('contain' as const),
            imagePosition: options?.amenitiesImagePosition,
            extraList: project.amenities?.length ? project.amenities : [...PALM_VIEW_EXCLUSIVE_AMENITIES],
            iconSourceLabels: project.amenities?.length ? project.amenities : [...PALM_VIEW_EXCLUSIVE_AMENITIES],
            amenityStyle: 'pills' as const,
            amenityColumns: 3,
            amenityIconMode: 'auto' as const,
            iconFamily: 'palm-view' as const,
          },
        ]
      : [
          {
            ...common,
            id: 'proposal-amenities',
            type: 'highlights' as const,
            kicker: 'Amenidades y estilo de vida',
            title: 'Todo lo que suma valor',
            body: '',
            titleSize: 40,
            bodySize: 14,
            image: options?.amenitiesImage,
            images: options?.amenitiesImage ? [options.amenitiesImage] : undefined,
            imageFit: options?.amenitiesImageFit || 'cover',
            imagePosition: options?.amenitiesImagePosition,
            extraList: proposalAmenitiesFor(project),
            amenityStyle: 'pills' as const,
            amenityColumns: 3,
            amenityIconMode: 'auto' as const,
          },
        ]),
    {
      ...common,
      id: 'proposal-contact',
      type: 'contact',
      kicker: 'Atención personalizada',
      title: 'Hablemos de su próxima inversión',
      body: 'Su asesor le acompañará para confirmar disponibilidad, condiciones y próximos pasos.',
      image: galleryImages[1] || project.image,
      images: [galleryImages[1] || project.image],
      titleSize: 40,
      bodySize: 14,
    },
  ];
}

function selectedTypology(
  project: PortalProject,
  unit: PortalUnit,
  selections: ProposalLotSelection[],
): PortalProjectTypology | undefined {
  if (!project.typologies || project.typologies.length === 0) return undefined;

  // 1. Explicit selection (lots or manual)
  const selection = selections.find((item) => item.unitId === unit.id);
  if (selection) {
    const match = project.typologies.find((item) => item.id === selection.typologyId || item.key === selection.typologyId || item.name.toLowerCase() === selection.typologyId.toLowerCase());
    if (match) return match;
  }

  // 2. unit.typologyId
  if (unit.typologyId) {
    const match = project.typologies.find((item) => item.id === unit.typologyId || item.key === unit.typologyId);
    if (match) return match;
  }

  // 3. Match by unit.type (e.g. "A", "Tipo A", "B", "Tipo B")
  if (unit.type) {
    const norm = unit.type.trim().toLowerCase();
    const match = project.typologies.find((item) => {
      const id = item.id.toLowerCase();
      const key = (item.key || '').toLowerCase();
      const name = item.name.toLowerCase();
      return (
        norm === id ||
        norm === key ||
        norm === name ||
        norm === `tipo ${key}` ||
        norm === `tipo ${id}` ||
        name === `tipo ${norm}` ||
        name.includes(norm) ||
        norm.includes(name)
      );
    });
    if (match) return match;
  }

  // 4. Match by customColumns ('TIPO', 'Tipo', 'TYPE', 'Tipologia', 'MODELO', etc.)
  if (unit.customColumns) {
    const typeKey = Object.keys(unit.customColumns).find((k) => {
      const lower = k.toLowerCase();
      return lower === 'tipo' || lower === 'type' || lower === 'tipologia' || lower === 'seccion' || lower === 'modelo';
    });
    if (typeKey && unit.customColumns[typeKey]) {
      const colVal = unit.customColumns[typeKey].trim().toLowerCase();
      const match = project.typologies.find((item) => {
        const id = item.id.toLowerCase();
        const key = (item.key || '').toLowerCase();
        const name = item.name.toLowerCase();
        return (
          colVal === id ||
          colVal === key ||
          colVal === name ||
          colVal === `tipo ${key}` ||
          colVal === `tipo ${id}` ||
          name === `tipo ${colVal}` ||
          name.includes(colVal)
        );
      });
      if (match) return match;
    }
  }

  // 5. Bedroom & area heuristic
  if (unit.bedrooms > 0) {
    const match = project.typologies.find((item) => {
      if (item.bedrooms !== unit.bedrooms) return false;
      if (unit.area > 0 && item.totalSqm > 0) {
        return Math.abs(item.totalSqm - unit.area) <= 6;
      }
      return true;
    });
    if (match) return match;
  }

  return undefined;
}

export function buildProposalItems(
  project: PortalProject,
  selectedUnitIds: string[],
  selections: ProposalLotSelection[] = [],
): ProposalPropertyItem[] {
  const units = project.units.filter((unit) => {
    if (selections.length) return selections.some((selection) => selection.unitId === unit.id);
    return selectedUnitIds.includes(unit.id);
  });

  return units.map((unit) => {
    const typology = selectedTypology(project, unit, selections);
    const selectedPrice = typology
      ? [typology.key, typology.id, typology.name]
          .filter(Boolean)
          .map((key) => Number((unit.customColumns?.[String(key)] || '').replace(/[^\d.,-]/g, '').replace(/,/g, '')) || 0)
          .find((price) => price > 0) || typology.startingPrice || unit.price
      : unit.price;

    return {
      id: `${project.slug}-${unit.id}`,
      unit_id: unit.id,
      property_id: String(project.id),
      project_name: project.name,
      developer_name: project.developer,
      unit_name: unit.unit || 'Unidad principal',
      typology_id: typology?.id,
      typology_name: typology?.name,
      typology_bedrooms: typology?.bedrooms,
      typology_bathrooms: typology?.bathrooms,
      typology_area_sqm: typology?.totalSqm,
      typology_parking_spaces: typology?.parkingSpaces,
      typology_image: typology?.image || typology?.floorPlanImage,
      typology_floor_plan_image: typology?.floorPlanImage || typology?.image,
      typology_description: typology?.description,
      location: cleanProposalLocation(project.location),
      list_price: selectedPrice || project.startingPrice,
      price: selectedPrice || project.startingPrice,
      currency: (unit.currency || project.currency || 'USD') as ProposalPropertyItem['currency'],
      bedrooms: typology?.bedrooms || unit.bedrooms || 0,
      bathrooms: typology?.bathrooms || unit.bathrooms || 0,
      parking_spaces: typology?.parkingSpaces ?? Number(unit.customColumns?.PARQUEOS || unit.customColumns?.Parqueos || unit.customColumns?.parqueos || 0),
      area_sqm: typology?.totalSqm || unit.area || 0,
      delivery_date: project.deliveryDate || project.delivery || 'Por confirmar',
      description: project.description,
      hero_image: project.image,
      gallery_images: project.gallery,
      amenities: proposalAmenitiesFor(project),
      payment_plan: {
        reservation_amount: 0,
        initial_percentage: 0,
        during_construction_percentage: 0,
        upon_delivery_percentage: 0,
      },
    };
  });
}
