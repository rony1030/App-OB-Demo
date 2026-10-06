'use client';

import React from 'react';
import Image from '@/components/ui/OptimizedImage';
import { useDocumentText } from '@/components/i18n/DocumentLocale';
import { Check, BedDouble, Bath, Maximize2, Car, CircleDollarSign, MapPin, Calendar, FileText, Scale, Phone, Mail, UserRound, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CanaRockAmenityIcon, resolveIconKey } from '@/components/branding/CanaRockAmenityIcon';
import { AmenityIcon } from '@/components/branding/AmenityIcon';
import { PalmViewAmenityIcon } from '@/components/branding/PalmViewAmenityIcon';
import { UveAmenityIcon } from '@/components/branding/UveAmenityIcon';
import { CipresAmenityIcon } from '@/components/branding/CipresAmenityIcon';
import { isCanaRockProject } from '@/lib/portal/cana-rock-dossier';
import { computeProjectCoverSpecs, type CoverSpecs } from '@/lib/portal/project-cover-specs';
import { readableOnWhite } from '@/lib/portal/personalized-dossier-brand';

export interface TypologyCard {
  id: string;
  name: string;
  image?: string;
  imageFit?: 'cover' | 'contain';
  imagePosition?: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  parking?: number;
  minPrice?: number;
}

export interface PaymentPlanScheme {
  id?: string;
  title: string;
  subtitle?: string;
  steps: string[];
  discount?: string;
  badge?: string;
  isHighlighted?: boolean;
  [key: string]: unknown;
}

export function buildDefaultPaymentPlans(project?: { paymentPlan?: Array<string | { value?: string; label?: string }> }): PaymentPlanScheme[] {
  if (project?.paymentPlan && Array.isArray(project.paymentPlan) && project.paymentPlan.length > 0) {
    const steps: string[] = project.paymentPlan.map((step) => {
      if (typeof step === 'string') return step;
      if (step.value && step.label) {
        if (step.label.toLowerCase().includes('reserva')) {
          return `${step.value} Con la reserva`;
        }
        if (step.value.endsWith('%')) {
          return `${step.value} ${step.label}`;
        }
        return `${step.value} - ${step.label}`;
      }
      return step.label || step.value || '';
    }).filter(Boolean);

    if (steps.length > 0) {
      return [
        {
          id: 'plan-default-project',
          title: 'Pago Estándar',
          subtitle: 'Plan del proyecto',
          steps,
        },
      ];
    }
  }

  return [
    {
      id: 'plan-std-default',
      title: 'Pago estándar 20/30/50',
      subtitle: '-Bloque C y D-',
      steps: [
        '5% Con la reserva',
        '15% Con la promesa de comprar',
        '30% Durante la construcción',
        '50% Tras la entrega de la unidad',
      ],
    },
  ];
}

export type SlotElementType = 'image' | 'heading-text' | 'text' | 'amenities' | 'metric';

export interface ContainerSlot {
  id?: string;
  elementType?: SlotElementType;
  imageUrl?: string;
  imageFit?: 'cover' | 'contain';
  imagePosition?: string;
  kicker?: string;
  title?: string;
  text?: string;
  items?: string[];
  amenityIconMap?: Record<string, string>;
  amenityStyle?: 'cards' | 'list' | 'pills';
  iconMode?: 'auto' | 'check' | 'number';
  metricValue?: string;
  metricLabel?: string;
}

export interface MagazineBlock {
  id?: string;
  type?: string;
  title?: string;
  body?: string;
  kicker?: string;
  subHeader?: string;
  locationLeft?: string;
  locationRight?: string;
  projectLogoUrl?: string;
  layout?: string;
  backgroundType?: string;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  fontFamily?: 'sans' | 'serif' | 'mono';
  titleSize?: number;
  bodySize?: number;
  kickerSize?: number;
  image?: string;
  images?: string[];
  secondaryImage?: string;
  secondaryImageFit?: 'cover' | 'contain';
  secondaryImagePosition?: string;
  overlayOpacity?: number;
  imageFit?: string;
  imagePosition?: string;
  imageExpand?: boolean;
  extraList?: string[];
  iconSourceLabels?: string[];
  iconFamily?: 'cana-rock' | 'cipres' | 'uve' | 'palm-view' | 'minimal';
  amenityStyle?: 'cards' | 'list' | 'pills';
  amenityIconMode?: 'auto' | 'check' | 'number';
  amenityColor?: string;
  amenityIconMap?: Record<string, string>;
  amenityColumns?: number;
  pricingCards?: { title: string; price: number; kicker?: string }[];
  isFloatingCard?: boolean;
  isMasterPlanSlide?: boolean;
  isPricingSlide?: boolean;
  isMapSlide?: boolean;
  hidden?: boolean;
  showBrokerLogo?: boolean;
  showDeveloperLogo?: boolean;
  showComplexBadge?: boolean;
  complexBadgeText?: string;
  complexBadgeLogoUrl?: string;
  customBrokerLogoUrl?: string;
  brokerLogoVariant?: 'normal' | 'white';
  hideBrokerDetails?: boolean;
  customFooterText?: string;
  footerTextColor?: string;
  hideFooter?: boolean;
  hidePageContent?: boolean;
  footerMode?: 'text' | 'logo' | 'logo-white';
  partnerLogos?: boolean;
  customStats?: {
    stat1Label?: string; stat1Value?: string;
    stat2Label?: string; stat2Value?: string;
    stat3Label?: string; stat3Value?: string;
    stat4Label?: string; stat4Value?: string;
  };
  metricValueSize?: number;
  paymentSteps?: { label: string; value: string }[];
  paymentPlans?: PaymentPlanScheme[];
  visibleDocuments?: { id: string; name: string; format?: string; updated?: string }[];
  bankingInfo?: { beneficiary?: string; bank?: string; account?: string; reference?: string };
  coverSpecs?: CoverSpecs;
  typologyCards?: TypologyCard[];
  typologyLayout?: 1 | 2 | 3;
  galleryGrid?: 'none' | 'single' | 'two-col' | 'three-col' | 'one-top-two' | 'two-left-one' | 'panoramic' | 'mosaic';
  galleryGap?: number;
  galleryPadding?: number;
  containerGrid?: 'none' | 'single' | 'two-col' | 'three-col' | 'one-top-two' | 'two-left-one' | 'panoramic' | 'mosaic';
  containerSlots?: ContainerSlot[];
  containerGap?: number;
  containerPadding?: number;
  indexItems?: { title: string; pageNum: string }[];
  indexColumns?: 1 | 2;
  agentAvatarUrl?: string | null;
  agentProfessionalTitle?: string | null;
  showDisclaimer?: boolean;
  disclaimer?: string;
  disclaimerColor?: string;
  disclaimerSize?: number;
  projectLogoSize?: number;
  brokerLogoSize?: number;
}

export interface MagazineSlideProps {
  block: MagazineBlock;
  index: number;
  total: number;
  projectName: string;
  projectSlug?: string;
  brokerName: string;
  brokerPhone: string;
  brokerEmail?: string;
  agencyName: string;
  agencyLogo?: string;
  clientName?: string;
}

function Metric({ label, value, valueSize, accent }: { label: string; value: string; valueSize?: number; accent?: string }) {
  const size = valueSize || (value.length > 15 ? 14 : 19);
  return (
    <div className="rounded-2xl border border-current/15 bg-white/10 p-4 flex flex-col justify-between min-h-[92px] min-w-0 overflow-hidden shadow-2xs">
      <p className="text-[9px] font-bold uppercase tracking-wider opacity-60 truncate">{label}</p>
      <p className="mt-1.5 font-black leading-tight break-words" style={{ fontSize: size, color: accent }}>{value}</p>
    </div>
  );
}

function BankRow({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[8px] font-bold uppercase tracking-wide opacity-50">{label}</p><p className="mt-1 text-xs font-extrabold">{value}</p></div>;
}

function GalleryImage({ src, className }: { src: string; className: string }) {
  const dt = useDocumentText();

  return (
    <div className={cn('relative overflow-hidden rounded-2xl bg-slate-100', className)}>
      {src && <Image src={src} alt={dt("Galería")} fill unoptimized={src.startsWith('data:') || src.startsWith('http')} sizes="760px" className="object-cover" />}
    </div>
  );
}

function SlideHeading({ block, textColor }: { block: MagazineBlock; textColor: string }) {
  const accent = block.accentColor || '#d4af37';
  return (
    <div className="space-y-1">
      {block.kicker && (
        <span
          className="text-[9px] font-black uppercase tracking-[0.2em] block"
          style={{ color: accent, fontSize: block.kickerSize }}
        >
          {block.kicker}
        </span>
      )}
      <h2
        className="text-3xl font-serif italic leading-tight"
        style={{ color: textColor, fontSize: block.titleSize ? `clamp(1.4rem, 3cqw, ${block.titleSize}px)` : undefined }}
      >
        {block.title}
      </h2>
      <div className="w-12 h-[1.5px] mt-1.5" style={{ backgroundColor: accent }} />
    </div>
  );
}

function StructuredItems({ block, isVertical }: { block: MagazineBlock; isVertical?: boolean }) {
  const isHighlights = block.type === 'highlights';
  const items = block.extraList && block.extraList.length > 0
    ? block.extraList
    : isHighlights
    ? (block.body || '').split('\n').map((s) => s.trim()).filter(Boolean)
    : [];
  if (items.length === 0) return null;
  const iconMode = block.amenityIconMode || 'auto';
  const isCR = block.id?.startsWith('cr-');
  const isPalmView = block.iconFamily === 'palm-view' || block.id?.includes('palm-view') || block.id?.includes('coral');
  const isUve = block.iconFamily === 'uve' || block.id?.includes('uve');
  const isCipres = block.iconFamily === 'cipres' || block.id?.includes('cipres');
  const amenityColor = block.amenityColor || block.accentColor || '#d4af37';

  const gridClass = isVertical
    ? (block.amenityStyle === 'list'
        ? 'flex flex-col gap-2'
        : block.amenityStyle === 'pills'
        ? 'flex flex-wrap gap-2'
        : block.amenityColumns === 1
        ? "grid grid-cols-1 gap-2.5"
        : block.amenityColumns === 2
        ? "grid grid-cols-2 gap-2.5"
        : block.amenityColumns === 3
        ? "grid grid-cols-3 gap-2.5"
        : "grid grid-cols-4 gap-2.5")
    : (block.amenityStyle === 'list'
        ? 'flex flex-col gap-1.5'
        : block.amenityStyle === 'pills'
        ? 'flex flex-wrap gap-1.5'
        : cn("grid gap-2", block.amenityColumns === 1 ? 'grid-cols-1' : block.amenityColumns === 2 ? 'grid-cols-2' : block.amenityColumns === 3 ? 'grid-cols-3' : 'grid-cols-4'));

  return (
    <div
      className={cn(
        'pt-1 overflow-y-auto pr-1',
        isVertical ? 'max-h-72' : 'max-h-56',
        gridClass
      )}
    >
      {items.map((item, i) => {
        const iconKey = block.amenityIconMap?.[i];
        return (
          <div
            key={i}
            className={cn(
              'flex items-center gap-2 border border-slate-100 bg-white shadow-2xs text-[10.5px] font-semibold text-slate-800',
              block.amenityStyle === 'pills' ? 'rounded-full px-3 py-1' : 'rounded-xl px-2.5 py-1.5'
            )}
          >
            <span className="flex items-center justify-center shrink-0">
              {iconMode === 'number' ? (
                <div className="flex items-center gap-1">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full text-white text-[8px] font-black" style={{ backgroundColor: amenityColor }}>{i + 1}</span>
                  {isPalmView && <PalmViewAmenityIcon name={block.iconSourceLabels?.[i] || item} className="w-3.5 h-3.5" style={{ color: amenityColor }} />}
                </div>
              ) : iconMode === 'check' ? (
                <Check className="w-3.5 h-3.5" style={{ color: amenityColor }} />
              ) : isUve ? (
                <UveAmenityIcon name={block.iconSourceLabels?.[i] || item} className="w-3.5 h-3.5 shrink-0" style={{ color: amenityColor }} />
              ) : isCipres ? (
                <CipresAmenityIcon name={block.iconSourceLabels?.[i] || item} className="w-3.5 h-3.5 shrink-0" style={{ color: amenityColor }} />
              ) : isPalmView ? (
                <PalmViewAmenityIcon name={block.iconSourceLabels?.[i] || item} className="w-3.5 h-3.5 shrink-0" style={{ color: amenityColor }} />
              ) : isCR ? (
                <CanaRockAmenityIcon name={block.iconSourceLabels?.[i] || item} iconKey={iconKey} className="w-3.5 h-3.5 shrink-0" style={{ color: amenityColor }} />
              ) : (
                <AmenityIcon name={block.iconSourceLabels?.[i] || item} className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} style={{ color: amenityColor }} />
              )}
            </span>
            <span className="truncate">{item}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function MagazineSlide({
  block,
  index,
  total,
  projectName,
  projectSlug,
  brokerName,
  brokerPhone,
  brokerEmail,
  agencyName,
  agencyLogo,
  clientName,
}: MagazineSlideProps) {
  const dt = useDocumentText();

  const isSplit = block.layout === 'split-left' || block.layout === 'split-right';
  const isVertical = block.layout === 'vertical-top' || block.layout === 'vertical-bottom';
  const isImageRight = block.layout === 'split-right';
  const isImageBottom = block.layout === 'vertical-bottom';
  const isImageTop = block.layout === 'vertical-top';
  const isFullImage = block.backgroundType === 'image' && !!block.image;
  const isFloatingCard = !!block.isFloatingCard;
  const isMasterPlan = !!block.isMasterPlanSlide || block.id === 'cr-master-plan';
  const isPricing = !!block.isPricingSlide || block.id === 'cr-precios';
  const isCover = block.type === 'cover' || block.id === 'cr-cover';
  const isIndex = block.type === 'index';
  const isGallery = block.type === 'gallery';
  const isContact = block.type === 'contact' || block.type === 'agent';
  const isTypologies = block.type === 'typologies';
  const isPayment = block.type === 'payment';
  const isExpandedImage = !!block.imageExpand && isSplit && !!block.image;

  const isCR = Boolean(
    block.id?.startsWith('cr-') ||
    (projectSlug ? isCanaRockProject({ slug: projectSlug, name: projectName }) : false) ||
    (block.kicker && block.kicker.toLowerCase().includes('cana rock')) ||
    (projectName && projectName.toLowerCase().includes('cana rock'))
  );

  const detectedSlug =
    projectSlug ||
    (projectName?.toLowerCase().includes('uve') ? 'uve-residences' : undefined) ||
    (projectName?.toLowerCase().includes('palm view') ? 'palm-view' : undefined) ||
    (projectName?.toLowerCase().includes('elements') ? 'elements' : undefined) ||
    (projectName?.toLowerCase().includes('cipr') ? 'cipres-residences' : undefined);

  const resolveFallbackLogo = () => {
    if (detectedSlug === 'palm-view') return '/projects/palm-view/logo-horizontal.svg';
    if (detectedSlug === 'elements') return '/images/projects/elements/logo-horizontal.png';
    if (detectedSlug === 'uve-residences') return '/projects/uve-residences/logo.png';
    if (detectedSlug === 'cipres-residences') return '/projects/cipres-residences/logo.png';
    if (isCR) return '/logo-stelar-white.png';
    return undefined;
  };

  const hasStaleCanaRockLogo =
    !isCR &&
    block.projectLogoUrl &&
    (block.projectLogoUrl.includes('canarock') || block.projectLogoUrl.includes('logo-stelar'));

  const logoUrl = hasStaleCanaRockLogo
    ? resolveFallbackLogo()
    : block.projectLogoUrl && block.projectLogoUrl.includes('canarock.info')
    ? '/logo-stelar-white.png'
    : block.projectLogoUrl || resolveFallbackLogo();

  const shouldRenderFullBg = isFullImage && !isCover;

  const fallbackAccent =
    detectedSlug === 'uve-residences'
      ? '#2F9DB8'
      : detectedSlug === 'cipres-residences'
      ? '#B5964A'
      : detectedSlug === 'palm-view'
      ? '#c5a880'
      : '#d4af37';
  const accentColor = block.accentColor || fallbackAccent;

  const background = block.backgroundType === 'gradient'
    ? `linear-gradient(135deg, ${block.backgroundColor || '#0c094e'}, ${accentColor || '#2563eb'})`
    : block.backgroundColor || (isCover ? '#ffffff' : '#fcfbf9');
  const textColor = block.textColor || '#0f172a';
  const fontClass = block.fontFamily === 'serif' ? 'font-serif' : block.fontFamily === 'mono' ? 'font-mono' : 'font-sans';
  const readableTextColor = shouldRenderFullBg && (block.overlayOpacity ?? 35) >= 30 && textColor.toLowerCase() === '#111827'
    ? '#ffffff'
    : textColor;
  // Keep the authored 1120 × 820 composition stable when its canvas is scaled on phones.
  const slideStyle = {
    background: shouldRenderFullBg ? undefined : background,
    color: readableTextColor,
    '--slide-accent': accentColor,
  } as React.CSSProperties;

  const showBrokerLogo = block.showBrokerLogo !== false && (block.customBrokerLogoUrl || agencyLogo);

  return (
    <div className={cn('relative w-full h-full flex flex-col justify-between overflow-hidden [container-type:inline-size]', fontClass)} style={slideStyle}>
      {/* Background Image - Only for full image non-cover slides */}
      {shouldRenderFullBg && block.image && (
        <div className="absolute inset-0 z-0">
          <Image
            src={block.image}
            alt={block.title || dt("Diapositiva")}
            fill
            className={block.imageFit === 'contain' ? "object-contain" : "object-cover"}
            style={{ objectPosition: block.imagePosition || 'center' }}
            unoptimized={block.image.startsWith('data:') || block.image.startsWith('http')}
          />
          <div
            className="absolute inset-0 bg-slate-950"
            style={isContact
              ? { background: `linear-gradient(180deg, rgba(15,23,42,0.04), rgba(15,23,42,${(block.overlayOpacity ?? 25) / 100}))` }
              : { opacity: (block.overlayOpacity ?? 25) / 100 }}
          />
        </div>
      )}

      {/* Expanded Split Image */}
      {isExpandedImage && (
        <div className={cn('absolute inset-y-0 w-1/2 z-0 overflow-hidden', isImageRight ? 'right-0' : 'left-0')}>
          <Image
            src={block.image!}
            alt={block.title || ''}
            fill
            className="object-cover"
            style={{ objectPosition: block.imagePosition || 'center' }}
            unoptimized={block.image!.startsWith('data:') || block.image!.startsWith('http')}
          />
          <div className="absolute inset-0 bg-slate-950" style={{ opacity: (block.overlayOpacity ?? 0) / 100 }} />
        </div>
      )}

      {/* Top Floating Broker/Agency Logo (Non-Cover Only) */}
      {!isCover && !isContact && showBrokerLogo && (
        <div className="absolute top-7 right-8 z-30 pointer-events-none">
          <div
            className="relative"
            style={{
              height: `${block.brokerLogoSize || 40}px`,
              width: `${Math.round((block.brokerLogoSize || 40) * 3.8)}px`,
              maxWidth: '180px',
            }}
          >
            <Image
              src={block.customBrokerLogoUrl || agencyLogo!}
              alt={agencyName || 'Agencia'}
              fill
              className={cn(
                'object-contain object-right',
                block.brokerLogoVariant === 'white' && 'brightness-0 invert'
              )}
              style={
                block.brokerLogoVariant === 'white'
                  ? { filter: 'brightness(0) invert(1) drop-shadow(0 1px 3px rgba(0,0,0,0.4))' }
                  : undefined
              }
              unoptimized
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center min-h-0 w-full overflow-hidden">
        {isCover ? (
          <CoverContent
            block={block}
            isCR={isCR}
            logoUrl={logoUrl}
            agencyLogo={agencyLogo}
            readableTextColor={readableTextColor}
            clientName={clientName}
            projectName={projectName}
            projectSlug={projectSlug}
          />
        ) : block.hidePageContent ? (
          <FullImageHeaderOnlyContent
            block={block}
            logoUrl={logoUrl}
            agencyLogo={agencyLogo}
            projectName={projectName}
          />
        ) : isIndex ? (
          <IndexContent block={block} textColor={textColor} accentColor={accentColor} />
        ) : isTypologies ? (
          <TypologiesContent block={block} textColor={textColor} />
        ) : isPricing ? (
          <PricingContent block={block} textColor={textColor} />
        ) : isPayment ? (
          <PaymentContent
            block={block}
            textColor={textColor}
            accentColor={accentColor}
            readableTextColor={readableTextColor}
            isSplit={isSplit}
            isImageRight={isImageRight}
            isExpandedImage={isExpandedImage}
            isVertical={isVertical}
          />
        ) : isContact ? (
          <ContactContent block={block} textColor={textColor} brokerName={brokerName} brokerPhone={brokerPhone} brokerEmail={brokerEmail} agencyName={agencyName} agencyLogo={showBrokerLogo ? (block.customBrokerLogoUrl || agencyLogo) : undefined} />
        ) : isMasterPlan ? (
          <MasterPlanContent block={block} textColor={textColor} />
        ) : isFloatingCard ? (
          <FloatingCardContent block={block} />
        ) : isGallery || !!block.containerGrid || (block.galleryGrid && block.galleryGrid !== ('none')) ? (
          <GalleryGridContent block={block} textColor={textColor} />
        ) : isSplit || (isVertical && !!block.image) ? (
          <SplitContent block={block} isImageRight={isImageRight} isExpandedImage={isExpandedImage} textColor={textColor} />
        ) : (
          <TypeContent block={block} textColor={textColor} accentColor={accentColor} projectName={projectName} agencyName={agencyName} isFullImage={isFullImage} readableTextColor={readableTextColor} />
        )}
      </div>

      {/* Footer - Never on Cover */}
      {!block.hideFooter && !isCover && (
        <footer
          className={cn(
            'relative z-20 w-full px-8 py-2.5 flex items-center justify-between text-[10px] font-bold tracking-widest uppercase select-none gap-4',
            isFullImage
              ? 'text-white/90 bg-gradient-to-t from-black/70 via-black/30 to-transparent'
              : 'border-t border-slate-200/60 text-slate-400 bg-[#fcfbf9]'
          )}
        >
          <div className="flex items-center min-w-0 flex-1 overflow-hidden">
            {/* Disclaimer integrated into footer line */}
            {(block.showDisclaimer ?? true) && (
              <span
                className="text-[8px] font-normal tracking-normal truncate font-sans normal-case select-text"
                style={{
                  color: block.footerTextColor || block.disclaimerColor || (isFullImage ? '#ffffff' : '#64748b'),
                  fontSize: block.disclaimerSize ? `${block.disclaimerSize}px` : '8px',
                }}
                title={block.disclaimer || 'Información de carácter ilustrativo y sujeta a cambios sin previo aviso. Precios, disponibilidad, terminaciones y condiciones comerciales deben ser confirmados antes de formalizar cualquier operación.'}
              >
                {block.disclaimer || 'Información de carácter ilustrativo y sujeta a cambios sin previo aviso. Precios, disponibilidad, terminaciones y condiciones comerciales deben ser confirmados antes de formalizar cualquier operación.'}
              </span>
            )}
          </div>

          <span className="shrink-0 font-bold" style={{ color: block.footerTextColor || block.disclaimerColor }}>
            {dt("PÁG.")} {String(index + 1).padStart(2, '0')} {dt("DE")} {String(total).padStart(2, '0')}
          </span>
        </footer>
      )}
    </div>
  );
}

function FullImageHeaderOnlyContent({
  block,
  logoUrl,
  agencyLogo,
  projectName,
}: {
  block: MagazineBlock;
  logoUrl?: string;
  agencyLogo?: string;
  projectName?: string;
}) {
  const dt = useDocumentText();
  const showDeveloperLogo = block.showDeveloperLogo !== false && !!logoUrl;

  return (
    <div className="w-full h-full flex flex-col justify-between p-10 relative z-10 pointer-events-none">
      {/* Top Floating Logos */}
      <div className="w-full flex items-start justify-between gap-4">
        {showDeveloperLogo && logoUrl ? (
          <div
            className="relative shrink-0"
            style={{
              height: `${block.projectLogoSize || 56}px`,
              width: `${Math.round((block.projectLogoSize || 56) * 3.6)}px`,
              maxWidth: '48%',
            }}
          >
            <Image
              src={logoUrl}
              alt={projectName || 'Proyecto'}
              fill
              className="object-contain object-left drop-shadow-lg"
              unoptimized
            />
          </div>
        ) : (
          <div />
        )}

        <div />
      </div>

      {/* Center is empty so the full photo shines */}
      <div className="flex-1" />
    </div>
  );
}

function CoverContent({
  block,
  isCR,
  logoUrl,
  agencyLogo,
  readableTextColor,
  clientName,
  projectName,
  projectSlug,
}: {
  block: MagazineBlock;
  isCR: boolean;
  logoUrl?: string;
  agencyLogo?: string;
  readableTextColor: string;
  clientName?: string;
  projectName?: string;
  projectSlug?: string;
}) {
  const dt = useDocumentText();
  const showDeveloperLogo = block.showDeveloperLogo !== false && !!logoUrl;

  // Luxury Editorial Split Cover with side photo and white capsules for all projects
  const specs = block.coverSpecs || computeProjectCoverSpecs({ slug: projectSlug, name: projectName });
  const hasSpecs = Boolean(
    specs.priceText ||
    specs.bedroomsText ||
    specs.bathroomsText ||
    specs.areaText ||
    specs.parkingText
  );

  const detectedSlug =
    projectSlug ||
    (projectName?.toLowerCase().includes('uve') ? 'uve-residences' : undefined) ||
    (projectName?.toLowerCase().includes('palm view') ? 'palm-view' : undefined) ||
    (projectName?.toLowerCase().includes('elements') ? 'elements' : undefined) ||
    (projectName?.toLowerCase().includes('cipr') ? 'cipres-residences' : undefined);

  const fallbackAccent =
    detectedSlug === 'uve-residences'
      ? '#2F9DB8'
      : detectedSlug === 'cipres-residences'
      ? '#B5964A'
      : detectedSlug === 'palm-view'
      ? '#c5a880'
      : '#d4af37';
  const accent = block.accentColor || fallbackAccent;
  const coverImage = block.image;
  const isImageLeft = block.layout === 'split-left';

  return (
    <div className="w-full h-full relative z-10 flex overflow-hidden bg-white">
      {/* Editorial Content Side */}
      <div
        className={cn(
          "h-full flex flex-col justify-between p-14 relative z-10",
          coverImage ? 'w-1/2 shrink-0' : 'w-full max-w-3xl mx-auto',
          isImageLeft ? 'order-2' : 'order-1'
        )}
      >
        {/* Top Header: Developer / Project Logo (Left) + Broker / Agency Logo (Right) */}
        <div className="w-full flex items-center justify-between gap-4">
          {showDeveloperLogo && logoUrl ? (
            <div
              className="relative shrink-0"
              style={{
                height: `${block.projectLogoSize || 56}px`,
                width: `${Math.round((block.projectLogoSize || 56) * 3.6)}px`,
                maxWidth: '50%',
              }}
            >
              <Image
                src={logoUrl}
                alt={projectName || 'Proyecto'}
                fill
                className="object-contain object-left"
                unoptimized
              />
            </div>
          ) : (
            <div className="h-6" />
          )}

          {/* Agency/Broker Logo on Cover */}
          {block.showBrokerLogo !== false && (block.customBrokerLogoUrl || agencyLogo) && (
            <div
              className="relative shrink-0"
              style={{
                height: `${block.brokerLogoSize || 42}px`,
                width: `${Math.round((block.brokerLogoSize || 42) * 3.6)}px`,
                maxWidth: '45%',
              }}
            >
              <Image
                src={block.customBrokerLogoUrl || agencyLogo!}
                alt="Agencia"
                fill
                className={cn(
                  'object-contain object-right',
                  block.brokerLogoVariant === 'white' && 'brightness-0 invert'
                )}
                unoptimized
              />
            </div>
          )}
        </div>

        {/* Center Hero Content */}
        <div className="space-y-5 my-auto py-2">
          {block.kicker && (
            <p
              className="text-[10.5px] font-black uppercase tracking-[0.25em]"
              style={{ color: accent }}
            >
              {block.kicker}
            </p>
          )}

          <h1
            className="font-serif italic tracking-tight text-slate-950 leading-[1.05]"
            style={{ fontSize: block.titleSize ? `clamp(2.4rem, 4.5cqw, ${block.titleSize}px)` : 'clamp(2.4rem, 4.5cqw, 3.8rem)' }}
          >
            {block.title || projectName}
          </h1>

          {block.subHeader && !/^\d+$/.test(block.subHeader.trim()) ? (
            <div className="flex items-center gap-3">
              <div className="h-[2px] w-10 shrink-0" style={{ backgroundColor: accent }} />
              <p
                className="text-[11px] font-black uppercase tracking-[0.22em]"
                style={{ color: accent }}
              >
                {block.subHeader}
              </p>
            </div>
          ) : (
            <div className="h-[2px] w-12" style={{ backgroundColor: accent }} />
          )}

          {clientName && !['cliente', 'inversionista'].includes(clientName.trim().toLowerCase()) && (
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
              {dt("Preparada para:")} <span className="font-extrabold text-slate-900">{clientName}</span>
            </p>
          )}

          {block.body && (
            <p
              className="text-[13px] leading-relaxed text-slate-600 font-sans"
              style={{ fontSize: block.bodySize ? `${block.bodySize}px` : undefined }}
            >
              {block.body}
            </p>
          )}

          {/* Individual Specs Capsules - Solid White Background with Landing Line Graphic Colors */}
          {hasSpecs && (
            <div className="w-full flex flex-wrap items-center gap-2 pt-2">
              {specs.bedroomsText && (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200 bg-white text-slate-900 shadow-xs">
                  <BedDouble className="w-4 h-4 shrink-0" style={{ color: accent }} strokeWidth={2} />
                  <span className="text-slate-200 font-light text-xs">|</span>
                  <span className="text-[12.5px] font-extrabold tracking-tight text-slate-800">{specs.bedroomsText}</span>
                </div>
              )}

              {specs.bathroomsText && (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200 bg-white text-slate-900 shadow-xs">
                  <Bath className="w-4 h-4 shrink-0" style={{ color: accent }} strokeWidth={2} />
                  <span className="text-slate-200 font-light text-xs">|</span>
                  <span className="text-[12.5px] font-extrabold tracking-tight text-slate-800">{specs.bathroomsText}</span>
                </div>
              )}

              {specs.parkingText && (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200 bg-white text-slate-900 shadow-xs">
                  <Car className="w-4 h-4 shrink-0" style={{ color: accent }} strokeWidth={2} />
                  <span className="text-slate-200 font-light text-xs">|</span>
                  <span className="text-[12.5px] font-extrabold tracking-tight text-slate-800">{specs.parkingText}</span>
                </div>
              )}

              {specs.areaText && (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200 bg-white text-slate-900 shadow-xs">
                  <Maximize2 className="w-4 h-4 shrink-0" style={{ color: accent }} strokeWidth={2} />
                  <span className="text-slate-200 font-light text-xs">|</span>
                  <span className="text-[12.5px] font-extrabold tracking-tight text-slate-800">{specs.areaText}</span>
                </div>
              )}

              {specs.priceText && (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-200 bg-white text-slate-950 shadow-xs">
                  <CircleDollarSign className="w-4 h-4 shrink-0" style={{ color: accent }} strokeWidth={2} />
                  <span className="text-slate-200 font-light text-xs">|</span>
                  <span className="text-[12.5px] font-black tracking-tight text-slate-950">
                    {specs.priceText.toLowerCase().startsWith('desde') ? specs.priceText : `Desde ${specs.priceText}`}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Metadata Bar */}
        <div className="w-full border-t border-slate-200/80 pt-3 flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
          <span className="inline-flex items-center gap-1.5">
            {block.locationLeft && <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: accent }} />}
            <span>{block.locationLeft || ''}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            {block.locationRight && <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: accent }} />}
            <span>{block.locationRight || ''}</span>
          </span>
        </div>
      </div>

      {/* Editorial Side Photo - 50% width, full height, object-cover */}
      {coverImage && (
        <div
          className={cn(
            'h-full w-1/2 relative overflow-hidden shrink-0',
            isImageLeft ? 'order-1' : 'order-2'
          )}
        >
          <Image
            src={coverImage}
            alt={block.title || projectName || ''}
            fill
            sizes="600px"
            className={cn(block.imageFit === 'contain' ? 'object-contain object-center p-4' : 'object-cover object-center')}
            unoptimized={coverImage.startsWith('data:') || coverImage.startsWith('http')}
          />
          {(block.overlayOpacity ?? 0) > 0 && (
            <div
              className="absolute inset-0 bg-slate-950 pointer-events-none"
              style={{ opacity: (block.overlayOpacity ?? 0) / 100 }}
            />
          )}
        </div>
      )}
    </div>
  );
}

function IndexContent({ block, textColor, accentColor }: { block: MagazineBlock; textColor: string; accentColor: string }) {
  const dt = useDocumentText();
  const defaultItems = [
    { title: 'Visión y Concepto', pageNum: 'P. 03' },
    { title: 'Ubicación Estratégica', pageNum: 'P. 04' },
    { title: 'Amenidades y Estilo de Vida', pageNum: 'P. 05' },
    { title: 'Tipologías y Distribución', pageNum: 'P. 06' },
    { title: 'Esquema de Pago', pageNum: 'P. 07' },
    { title: 'Contacto Comercial', pageNum: 'P. 08' },
  ];
  const items = block.indexItems && block.indexItems.length > 0 ? block.indexItems : defaultItems;
  // Auto-switch to 2 columns if more than 7 items to prevent overflow and visual breakage
  const isAutoTwoCols = items.length > 7;
  const isSingleCol = !isAutoTwoCols && block.indexColumns === 1;

  const half = Math.ceil(items.length / 2);
  const col1 = isSingleCol ? items : items.slice(0, half);
  const col2 = isSingleCol ? [] : items.slice(half);

  const renderItem = (item: { title: string; pageNum?: string }, realIdx: number) => (
    <div
      key={realIdx}
      className={cn(
        "flex items-center gap-2.5 group border-b border-current/10 min-w-0",
        items.length > 10 ? "py-1" : "py-2"
      )}
    >
      <span
        className={cn(
          "font-black tracking-widest shrink-0",
          items.length > 10 ? "text-[11px]" : "text-[13px]"
        )}
        style={{ color: accentColor }}
      >
        {String(realIdx + 1).padStart(2, '0')}
      </span>
      <span
        className={cn(
          "font-extrabold uppercase tracking-wide shrink-0 whitespace-nowrap overflow-hidden text-ellipsis",
          isSingleCol ? "text-[13px] max-w-[calc(100%-80px)]" : "text-xs max-w-[calc(100%-65px)]"
        )}
        title={item.title}
        style={{ color: textColor }}
      >
        {item.title}
      </span>
      <div className="flex-1 border-b border-dotted border-current/25 mx-1.5 min-w-[12px]" />
      <span
        className={cn(
          "font-mono font-bold shrink-0",
          items.length > 10 ? "text-[11px] opacity-70" : "text-[12.5px] opacity-80"
        )}
        style={{ color: textColor }}
      >
        {item.pageNum || `P. ${String(realIdx + 3).padStart(2, '0')}`}
      </span>
    </div>
  );

  return (
    <div
      className={cn(
        "w-full h-full flex flex-col justify-center my-auto mx-auto",
        items.length > 10 ? "p-10" : "p-14",
        isSingleCol ? "max-w-2xl" : "max-w-5xl"
      )}
    >
      <div className={cn("space-y-1.5", items.length > 10 ? "mb-5" : "mb-8")}>
        <span className="text-[9px] font-black uppercase tracking-[0.25em] block" style={{ color: accentColor }}>
          {block.kicker || dt("Estructura del dossier")}
        </span>
        <h2 className="text-4xl font-serif italic leading-tight" style={{ color: textColor }}>
          {block.title || dt("Contenido")}
        </h2>
        <div className="w-14 h-[2px]" style={{ backgroundColor: accentColor }} />
        {block.body && (
          <p className="text-sm opacity-80 leading-relaxed font-sans max-w-xl pt-1" style={{ color: textColor }}>
            {block.body}
          </p>
        )}
      </div>

      {isSingleCol ? (
        /* Modo 1 columna (Lista vertical centrada) */
        <div className="flex flex-col gap-2.5 pt-1 w-full">
          {col1.map((item, idx) => renderItem(item, idx))}
        </div>
      ) : (
        /* Modo 2 columnas (Distribuido equitativamente de arriba hacia abajo) */
        <div className={cn(
          "grid grid-cols-2 gap-x-14 pt-1 w-full",
          items.length > 10 ? "gap-y-1" : "gap-y-2"
        )}>
          <div className="flex flex-col">
            {col1.map((item, idx) => renderItem(item, idx))}
          </div>
          <div className="flex flex-col">
            {col2.map((item, idx) => renderItem(item, half + idx))}
          </div>
        </div>
      )}
    </div>
  );
}

function ContainerSlotRenderer({
  slot,
  fallbackImage,
  accentColor,
  textColor,
  index,
}: {
  slot?: ContainerSlot;
  fallbackImage?: string;
  accentColor: string;
  textColor: string;
  index: number;
}) {
  const type = slot?.elementType || 'image';

  if (type === 'heading-text') {
    return (
      <div className="w-full h-full p-6 flex flex-col justify-center text-left overflow-hidden transition-all">
        {slot?.kicker && (
          <span className="text-[9px] font-black uppercase tracking-[0.2em] block mb-1.5" style={{ color: accentColor }}>
            {slot.kicker}
          </span>
        )}
        {slot?.title && (
          <h3 className="text-2xl font-extrabold tracking-tight mb-2 leading-tight" style={{ color: textColor }}>
            {slot.title}
          </h3>
        )}
        {slot?.text && (
          <p className="text-sm leading-relaxed opacity-80 whitespace-pre-line font-sans" style={{ color: textColor }}>
            {slot.text}
          </p>
        )}
      </div>
    );
  }

  if (type === 'text') {
    return (
      <div className="w-full h-full p-6 flex flex-col justify-center text-left overflow-hidden">
        <p className="text-sm leading-relaxed opacity-85 whitespace-pre-line font-sans" style={{ color: textColor }}>
          {slot?.text || 'Texto del contenedor...'}
        </p>
      </div>
    );
  }

  if (type === 'amenities') {
    const items = slot?.items && slot.items.length > 0 ? slot.items : ['Piscina infinity', 'Gimnasio de vanguardia', 'Seguridad 24/7', 'Áreas verdes'];
    const style = slot?.amenityStyle || 'cards';
    const count = items.length;

    // Adapt layout & typography dynamically to item count so it fits the container
    let gridCols = "grid-cols-2";
    let gapCls = 'gap-2';
    let textCls = "text-xs font-bold";
    let iconWrapCls = 'h-5 w-5 rounded-lg';
    let iconSizeCls = 'h-3.5 w-3.5';
    let cardPadCls = style === 'pills' ? 'px-3 py-1.5' : 'p-2';

    if (count > 16) {
      gridCols = "grid-cols-3";
      gapCls = 'gap-1';
      textCls = "text-[8px] font-semibold leading-tight";
      iconWrapCls = 'h-3.5 w-3.5 rounded-xs shrink-0';
      iconSizeCls = 'h-2 w-2';
      cardPadCls = style === 'pills' ? 'px-1.5 py-0.5' : 'py-0.5 px-1.5';
    } else if (count > 8) {
      gridCols = 'grid-cols-2';
      gapCls = 'gap-1.5';
      textCls = "text-[9.5px] font-semibold leading-tight";
      iconWrapCls = 'h-4 w-4 rounded-md shrink-0';
      iconSizeCls = 'h-2.5 w-2.5';
      cardPadCls = style === 'pills' ? 'px-2 py-1' : 'py-1 px-2';
    } else if (count > 4) {
      gridCols = 'grid-cols-2';
      gapCls = 'gap-2';
      textCls = "text-[11px] font-bold";
      iconWrapCls = 'h-4.5 w-4.5 rounded-lg shrink-0';
      iconSizeCls = 'h-3 w-3';
      cardPadCls = style === 'pills' ? 'px-2.5 py-1' : 'py-1.5 px-2';
    }

    return (
      <div className="w-full h-full min-h-0 min-w-0 p-3.5 flex flex-col justify-center text-left overflow-hidden">
        {slot?.title && (
          <h4 className="text-xs font-black uppercase tracking-[0.16em] mb-1.5 shrink-0 truncate" style={{ color: accentColor }}>
            {slot.title}
          </h4>
        )}
        <div className={cn("grid w-full min-h-0 overflow-y-auto scrollbar-none", gridCols, gapCls)}>
          {items.map((it, idx) => {
            const iconKey = slot?.amenityIconMap?.[idx] || resolveIconKey(it);
            return (
              <div
                key={idx}
                className={cn(
                  "flex items-center gap-1.5 transition min-w-0",
                  style === 'pills'
                    ? cn("rounded-full bg-slate-100/80", cardPadCls)
                    : style === 'list'
                      ? cn("border-b border-current/10 py-1 px-0.5", textCls)
                      : cn("rounded-xl bg-white/70 border border-current/10 shadow-2xs", cardPadCls),
                  textCls
                )}
                style={{ color: textColor }}
              >
                <span className={cn("flex shrink-0 items-center justify-center shadow-2xs", iconWrapCls)} style={{ backgroundColor: `${accentColor}18`, color: accentColor }}>
                  <CanaRockAmenityIcon iconKey={iconKey} className={iconSizeCls} style={{ color: accentColor }} />
                </span>
                <span className="truncate min-w-0 flex-1">{it}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (type === 'metric') {
    return (
      <div className="w-full h-full p-6 flex flex-col justify-center items-center text-center overflow-hidden">
        <span className="text-[9.5px] font-black uppercase tracking-[0.2em] opacity-70 mb-1" style={{ color: textColor }}>
          {slot?.metricLabel || 'Cifra Clave'}
        </span>
        <span className="text-4xl font-extrabold tracking-tight font-serif italic" style={{ color: accentColor }}>
          {slot?.metricValue || '100%'}
        </span>
        {slot?.text && <p className="text-xs opacity-75 mt-1 max-w-xs" style={{ color: textColor }}>{slot.text}</p>}
      </div>
    );
  }

  // Element Type 'image' (Default) - Only images retain the frame / border
  const imgSrc = slot?.imageUrl || fallbackImage;
  const hasValidImg = Boolean(imgSrc && imgSrc !== '/images/placeholder.jpg');

  if (!hasValidImg) {
    return (
      <div className="relative w-full h-full rounded-2xl overflow-hidden bg-slate-100 flex flex-col items-center justify-center text-slate-400 border border-slate-200/80 gap-2 shadow-2xs">
        <ImageIcon className="w-8 h-8 stroke-[1.5] text-slate-300" />
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Seleccionar imagen</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-md bg-slate-100 border border-current/5">
      <Image
        src={imgSrc!}
        alt={slot?.title || ''}
        fill
        className={slot?.imageFit === 'contain' ? 'object-contain p-2' : 'object-cover'}
        style={{ objectPosition: slot?.imagePosition || 'center' }}
        unoptimized={imgSrc!.startsWith('data:') || imgSrc!.startsWith('http')}
      />
    </div>
  );
}

function GalleryGridContent({ block, textColor }: { block: MagazineBlock; textColor: string }) {
  const dt = useDocumentText();
  const rawImages = (block.images && block.images.length > 0 ? block.images : [block.image]).filter(Boolean) as string[];
  const images = rawImages;
  const grid = block.containerGrid || block.galleryGrid || 'one-top-two';
  const gap = block.containerGap ?? block.galleryGap ?? 12;
  const padding = block.containerPadding ?? block.galleryPadding ?? 16;
  const hideText = block.hidePageContent;
  const accentColor = block.accentColor || '#d4af37';
  const slots = block.containerSlots || [];

  const getSlot = (idx: number): ContainerSlot | undefined => slots[idx];
  const getImage = (idx: number): string | undefined => images[idx] || images[0] || undefined;

  return (
    <div className="w-full h-full flex flex-col min-h-0 overflow-hidden justify-between" style={{ padding: `${padding}px` }}>
      {!hideText && (block.title || block.kicker) && (
        <div className="mb-3 shrink-0">
          <SlideHeading block={block} textColor={textColor} />
          {block.body && (
            <p
              className="mt-2 opacity-85 font-sans leading-relaxed whitespace-pre-line max-w-5xl"
              style={{
                color: textColor,
                fontSize: block.bodySize ? `${block.bodySize}px` : undefined,
              }}
            >
              {block.body}
            </p>
          )}
        </div>
      )}

      <div className="flex-1 min-h-0 w-full overflow-hidden" style={{ gap: `${gap}px` }}>
        {grid === 'single' && (
          <div className="w-full h-full min-h-0 relative overflow-hidden">
            <ContainerSlotRenderer slot={getSlot(0)} fallbackImage={getImage(0)} accentColor={accentColor} textColor={textColor} index={0} />
          </div>
        )}

        {grid === 'two-col' && (
          <div className="w-full h-full grid grid-cols-2 min-h-0 overflow-hidden" style={{ gap: `${gap}px` }}>
            <div className="relative h-full min-h-0 overflow-hidden">
              <ContainerSlotRenderer slot={getSlot(0)} fallbackImage={getImage(0)} accentColor={accentColor} textColor={textColor} index={0} />
            </div>
            <div className="relative h-full min-h-0 overflow-hidden">
              <ContainerSlotRenderer slot={getSlot(1)} fallbackImage={getImage(1)} accentColor={accentColor} textColor={textColor} index={1} />
            </div>
          </div>
        )}

        {grid === 'three-col' && (
          <div className="w-full h-full grid grid-cols-3 min-h-0 overflow-hidden" style={{ gap: `${gap}px` }}>
            {[0, 1, 2].map((idx) => (
              <div key={idx} className="relative h-full min-h-0 overflow-hidden">
                <ContainerSlotRenderer slot={getSlot(idx)} fallbackImage={getImage(idx)} accentColor={accentColor} textColor={textColor} index={idx} />
              </div>
            ))}
          </div>
        )}

        {grid === 'one-top-two' && (
          <div className="w-full h-full grid grid-rows-[1fr_1fr] grid-cols-2 min-h-0 overflow-hidden" style={{ gap: `${gap}px` }}>
            <div className="col-span-2 row-span-1 relative h-full min-h-0 overflow-hidden">
              <ContainerSlotRenderer slot={getSlot(0)} fallbackImage={getImage(0)} accentColor={accentColor} textColor={textColor} index={0} />
            </div>
            <div className="relative h-full min-h-0 overflow-hidden">
              <ContainerSlotRenderer slot={getSlot(1)} fallbackImage={getImage(1)} accentColor={accentColor} textColor={textColor} index={1} />
            </div>
            <div className="relative h-full min-h-0 overflow-hidden">
              <ContainerSlotRenderer slot={getSlot(2)} fallbackImage={getImage(2)} accentColor={accentColor} textColor={textColor} index={2} />
            </div>
          </div>
        )}

        {grid === 'two-left-one' && (
          <div className="w-full h-full grid grid-cols-2 min-h-0 overflow-hidden" style={{ gap: `${gap}px` }}>
            <div className="grid grid-rows-[1fr_1fr] min-h-0 h-full overflow-hidden" style={{ gap: `${gap}px` }}>
              <div className="relative h-full min-h-0 overflow-hidden">
                <ContainerSlotRenderer slot={getSlot(0)} fallbackImage={getImage(0)} accentColor={accentColor} textColor={textColor} index={0} />
              </div>
              <div className="relative h-full min-h-0 overflow-hidden">
                <ContainerSlotRenderer slot={getSlot(1)} fallbackImage={getImage(1)} accentColor={accentColor} textColor={textColor} index={1} />
              </div>
            </div>
            <div className="relative h-full min-h-0 overflow-hidden">
              <ContainerSlotRenderer slot={getSlot(2)} fallbackImage={getImage(2)} accentColor={accentColor} textColor={textColor} index={2} />
            </div>
          </div>
        )}

        {grid === 'panoramic' && (
          <div className="w-full h-full flex flex-col min-h-0 overflow-hidden" style={{ gap: `${gap}px` }}>
            <div className="relative w-full h-[62%] min-h-0 overflow-hidden">
              <ContainerSlotRenderer slot={getSlot(0)} fallbackImage={getImage(0)} accentColor={accentColor} textColor={textColor} index={0} />
            </div>
            <div className="grid grid-cols-2 h-[38%] min-h-0 overflow-hidden" style={{ gap: `${gap}px` }}>
              <div className="relative h-full min-h-0 overflow-hidden">
                <ContainerSlotRenderer slot={getSlot(1)} fallbackImage={getImage(1)} accentColor={accentColor} textColor={textColor} index={1} />
              </div>
              <div className="relative h-full min-h-0 overflow-hidden">
                <ContainerSlotRenderer slot={getSlot(2)} fallbackImage={getImage(2)} accentColor={accentColor} textColor={textColor} index={2} />
              </div>
            </div>
          </div>
        )}

        {grid === 'mosaic' && (
          <div className="w-full h-full grid grid-cols-2 grid-rows-[1fr_1fr] min-h-0 overflow-hidden" style={{ gap: `${gap}px` }}>
            {[0, 1, 2, 3].map((idx) => (
              <div key={idx} className="relative h-full min-h-0 overflow-hidden">
                <ContainerSlotRenderer slot={getSlot(idx)} fallbackImage={getImage(idx)} accentColor={accentColor} textColor={textColor} index={idx} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ContactContent({
  block,
  textColor,
  brokerName,
  brokerPhone,
  brokerEmail,
  agencyName,
  agencyLogo,
}: {
  block: MagazineBlock;
  textColor: string;
  brokerName: string;
  brokerPhone: string;
  brokerEmail?: string;
  agencyName: string;
  agencyLogo?: string;
}) {
  const dt = useDocumentText();
  const accent = readableOnWhite(block.accentColor || block.footerTextColor || '#334155');
  const name = block.title || brokerName || agencyName;
  const proTitle = block.agentProfessionalTitle || block.subHeader || dt("Asesor Inmobiliario");
  const phone = brokerPhone;
  const email = brokerEmail;
  const avatar = block.agentAvatarUrl;

  if (block.hideBrokerDetails) {
    return (
      <div className="flex h-full w-full items-center justify-center p-14">
        <div className="w-full max-w-2xl border border-slate-200 bg-white text-center shadow-xl p-12">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0a1140]">{dt("Información comercial")}</p>
          <h2 className="mt-4 font-serif italic text-slate-950 text-4xl">{agencyName}</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7" style={{ color: textColor }}>
            {block.body || dt("Solicita información sobre disponibilidad y condiciones comerciales.")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center p-10 my-auto relative z-10">
      <div className="w-full max-w-lg rounded-[24px] bg-white border border-slate-200/80 p-10 shadow-xl flex flex-col items-center text-center space-y-5">
        {agencyLogo && (
          <div className="relative h-14 w-48 mb-1">
            <Image src={agencyLogo} alt={agencyName} fill className="object-contain" unoptimized />
          </div>
        )}
        {/* Agent Avatar */}
        <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md bg-slate-100 shrink-0">
          {avatar ? (
            <Image src={avatar} alt={name} fill className="object-cover" unoptimized={avatar.startsWith('data:') || avatar.startsWith('http')} />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-500">
              <UserRound className="h-8 w-8" aria-hidden="true" />
            </div>
          )}
        </div>

        {/* Name and Title */}
        <div className="space-y-1">
          <h3 className="text-3xl font-extrabold tracking-tight" style={{ color: accent }}>
            {name}
          </h3>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
            {proTitle}
          </p>
        </div>

        {block.body && (
          <p className="text-xs text-slate-600 leading-relaxed font-sans max-w-xs">
            {block.body}
          </p>
        )}

        {/* Contact Links */}
        <div className="w-full space-y-2.5 pt-2">
          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex items-center justify-center gap-2.5 w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 transition shadow-2xs"
            >
              <Phone className="w-4 h-4 text-slate-600" />
              <span>{phone}</span>
            </a>
          )}
          {email && (
            <a
              href={`mailto:${email}`}
              className="flex items-center justify-center gap-2.5 w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 transition shadow-2xs truncate"
            >
              <Mail className="w-4 h-4 text-slate-600 shrink-0" />
              <span className="truncate">{email}</span>
            </a>
          )}
        </div>

        {/* Agency Footer */}
        <div className="w-full pt-4 border-t border-slate-100">
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 block">
            {agencyName.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
}

function FloatingCardContent({ block }: { block: MagazineBlock }) {
  const dt = useDocumentText();
  const accent = block.accentColor || '#d4af37';
  const amenityColor = block.amenityColor || accent;
  const iconMode = block.amenityIconMode || 'auto';
  const style = block.amenityStyle || 'list';
  const cols = block.amenityColumns || 1;
  const items = block.extraList || [];

  const gridClass =
    cols === 2
      ? 'grid grid-cols-2 gap-2.5'
      : cols === 3
      ? 'grid grid-cols-3 gap-2'
      : cols === 4
      ? 'grid grid-cols-4 gap-1.5'
      : 'flex flex-col space-y-2';

  return (
    <div className="w-full h-full flex items-center justify-start p-14">
      <div className={cn(
        "bg-white/95 backdrop-blur-md rounded-3xl p-10 border border-white/60 shadow-2xl text-left",
        cols > 1 ? "max-w-2xl w-full space-y-4" : "max-w-lg space-y-4"
      )}>
        <div className="space-y-1">
          {block.kicker && (
            <span className="text-[9px] font-black uppercase tracking-[0.2em] block" style={{ color: accent }}>
              {block.kicker}
            </span>
          )}
          <h2 className="text-3xl font-serif italic text-slate-900 leading-tight">
            {block.title}
          </h2>
          <div className="w-12 h-[1.5px] mt-2" style={{ backgroundColor: accent }} />
        </div>
        {block.body && (
          <p className="text-xs text-slate-600 leading-relaxed font-sans">{block.body}</p>
        )}
        {items.length > 0 && (
          <div className={cn("pt-2 max-h-[460px] overflow-y-auto pr-1", style === 'pills' ? 'flex flex-wrap gap-2' : gridClass)}>
            {items.map((item, idx) => {
              const iconKey = block.amenityIconMap?.[idx] || block.amenityIconMap?.[String(idx)] || resolveIconKey(item);
              return (
                <div
                  key={idx}
                  className={cn(
                    "flex items-center gap-2.5 text-xs text-slate-800 font-medium transition",
                    style === 'cards' && "p-2.5 rounded-xl border border-slate-200/80 bg-white/90 shadow-2xs",
                    style === 'pills' && "px-3.5 py-1.5 rounded-full border border-slate-200/80 bg-white shadow-2xs text-[11px]",
                    style === 'list' && "py-1"
                  )}
                >
                  <span
                    className={cn(
                      "flex shrink-0 items-center justify-center rounded-full",
                      style === 'cards' ? "h-6 w-6" : "h-5 w-5"
                    )}
                    style={{ backgroundColor: `${amenityColor}18`, color: amenityColor }}
                  >
                    {iconMode === 'number' ? (
                      <span className="text-[9px] font-black">{idx + 1}</span>
                    ) : iconMode === 'check' ? (
                      <Check className="h-3 w-3 stroke-[2.5]" style={{ color: amenityColor }} />
                    ) : (
                      <CanaRockAmenityIcon iconKey={iconKey} name={item} className="h-3.5 w-3.5" style={{ color: amenityColor }} />
                    )}
                  </span>
                  <span className="leading-snug">{item}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function MasterPlanContent({ block, textColor }: { block: MagazineBlock; textColor: string }) {
  const dt = useDocumentText();

  return (
    <div className="w-full h-full grid grid-cols-2 p-10 gap-6 items-center">
      <div className="space-y-3 text-left flex flex-col justify-center">
        <SlideHeading block={block} textColor={textColor} />
        <p className="text-xs leading-relaxed font-sans max-w-md" style={{ color: textColor }}>{block.body}</p>
        <div className="grid grid-cols-2 gap-2 pt-2">
          {(block.extraList || []).map((item, i) => (
            <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200/80 bg-white/90 shadow-2xs text-[11px] font-semibold text-slate-800">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--slide-accent)] text-white text-[9px] font-black">{i + 1}</span>
              <span className="truncate">{item.replace(/^\d+\.\s*/, '')}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="relative w-full h-[440px] rounded-3xl overflow-hidden border border-slate-200 shadow-lg bg-slate-50">
        <Image src={block.image || '/Cana-Rock-Star-Master-Plan.png'} alt={dt("Master Plan")} fill className="object-contain p-2" unoptimized />
      </div>
    </div>
  );
}

function PricingContent({ block, textColor }: { block: MagazineBlock; textColor: string }) {
  const dt = useDocumentText();

  const cards = block.pricingCards || [
    { title: dt("1 Habitación (Estándar)"), price: 149000, kicker: dt("Agotado") },
    { title: dt("Penthouse (5to Nivel)"), price: 260099, kicker: dt("Desde") },
  ];
  return (
    <div className="w-full h-full p-10 flex flex-col justify-between text-left">
      <div className="space-y-2 bg-white/95 border border-slate-100 shadow-sm rounded-3xl p-6 max-w-xl">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--slide-accent)] block">{block.kicker}</span>
        <h2 className="text-3xl font-serif italic" style={{ color: textColor }}>{block.title}</h2>
        <p className="text-xs font-sans" style={{ color: textColor }}>{block.body}</p>
        <div className="text-[9px] font-black uppercase tracking-wider text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl inline-flex items-center gap-2 mt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>{dt("Inventario oficial verificado")} </span>
        </div>
      </div>
      <div className={`grid grid-cols-1 ${cards.length <= 2 ? "grid-cols-2 max-w-2xl" : cards.length === 3 ? "grid-cols-3" : "grid-cols-4"} gap-5 w-full mt-3`}>
        {cards.map((card, i) => (
          <div
            key={i}
            className="rounded-3xl border border-[var(--slide-accent)]/35 p-6 flex flex-col justify-between items-center text-center gap-2.5 shadow-xl"
            style={{ backgroundColor: block.backgroundColor || '#0a1140' }}
          >
            <div className="w-10 h-10 rounded-full border border-[#d4af37]/35 bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37]">
              <BedDouble className="w-5 h-5" />
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-[var(--slide-accent)] font-sans">{card.title}</span>
            <div className="flex items-center justify-center gap-2 w-full mt-1">
              <div className="w-4 h-[1px] bg-[#d4af37]/40" />
              <span className="text-[8px] font-black text-[#d4af37] uppercase tracking-widest">{card.kicker || 'A partir de'}</span>
              <div className="w-4 h-[1px] bg-[#d4af37]/40" />
            </div>
            <span className="text-2xl font-black text-white font-sans mt-0.5 tracking-tight">
              US$ {Math.round(card.price).toLocaleString('en-US')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PaymentContent({
  block,
  textColor,
  accentColor,
  readableTextColor,
  isSplit,
  isImageRight,
  isExpandedImage,
  isVertical,
}: {
  block: MagazineBlock;
  textColor: string;
  accentColor: string;
  readableTextColor: string;
  isSplit: boolean;
  isImageRight: boolean;
  isExpandedImage: boolean;
  isVertical: boolean;
}) {
  const dt = useDocumentText();

  const plans: PaymentPlanScheme[] =
    block.paymentPlans && block.paymentPlans.length > 0
      ? block.paymentPlans
      : block.paymentSteps && block.paymentSteps.length > 0
      ? [
          {
            id: 'legacy-plan',
            title: block.title || dt('Pago Estándar'),
            subtitle: block.subHeader || undefined,
            steps: block.paymentSteps.map((s) => `${s.value} ${s.label}`),
          },
        ]
      : buildDefaultPaymentPlans({ paymentPlan: block.paymentSteps });

  const isDark =
    readableTextColor === '#ffffff' ||
    readableTextColor.toLowerCase().includes('fff') ||
    (block.backgroundColor &&
      ['#000000', '#111827', '#0b1120', '#0f172a'].includes(block.backgroundColor.toLowerCase()));

  const hasImage = Boolean(block.image);
  const showSplit = (isSplit || isVertical) && hasImage;

  const cardsGrid = (
    <div
      className={cn(
        "grid gap-3.5 w-full",
        showSplit
          ? plans.length === 1
            ? 'grid-cols-1 max-w-lg'
            : "grid-cols-2 max-w-2xl"
          : plans.length === 1
          ? 'grid-cols-1 max-w-md mx-auto'
          : plans.length === 2
          ? "grid-cols-2 max-w-3xl"
          : plans.length === 3
          ? "grid-cols-3 max-w-5xl"
          : "grid-cols-4 max-w-6xl"
      )}
    >
      {plans.map((plan, pIdx) => {
        const steps = Array.isArray(plan.steps)
          ? plan.steps
          : typeof plan.steps === 'string'
          ? (plan.steps as string).split('\n').map((s) => s.trim()).filter(Boolean)
          : [];

        return (
          <div
            key={plan.id || pIdx}
            className={cn(
              "rounded-2xl border p-5 flex flex-col justify-between shadow-2xs transition text-left min-h-[200px]",
              showSplit ? 'max-h-[360px]' : 'max-h-[350px]',
              isDark
                ? 'border-white/10 bg-white/5 hover:border-white/20'
                : 'border-slate-200/90 bg-white/95 hover:shadow-md hover:border-slate-300'
            )}
          >
            <div>
              {plan.badge && (
                <div className="mb-2">
                  <span
                    className="inline-block text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border shadow-2xs"
                    style={{
                      backgroundColor: `${accentColor}15`,
                      borderColor: `${accentColor}40`,
                      color: accentColor,
                    }}
                  >
                    {plan.badge}
                  </span>
                </div>
              )}

              <h3
                className={cn(
                  "text-[14.5px] font-extrabold tracking-tight leading-snug",
                  isDark ? 'text-white' : 'text-slate-900'
                )}
              >
                {plan.title}
              </h3>

              {plan.subtitle && (
                <p
                  className={cn(
                    "text-[10.5px] font-medium tracking-wide mt-0.5",
                    isDark ? 'text-white/60' : 'text-slate-500'
                  )}
                >
                  {plan.subtitle}
                </p>
              )}

              <div className="w-6 h-[1.5px] my-2.5" style={{ backgroundColor: `${accentColor}60` }} />

              <ul className="space-y-2">
                {steps.map((step, sIdx) => (
                  <li
                    key={sIdx}
                    className={cn(
                      "text-[11.5px] leading-snug flex items-start gap-2",
                      isDark ? 'text-white/85' : 'text-slate-700'
                    )}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full mt-1 shrink-0"
                      style={{ backgroundColor: accentColor }}
                    />
                    <span className="font-medium">{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {plan.discount && (
              <div className="mt-3 pt-2.5 border-t border-current/10">
                <p
                  className="text-[10.5px] font-serif italic leading-tight"
                  style={{ color: accentColor }}
                >
                  {plan.discount}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const headingBlock = (
    <div className="space-y-1 shrink-0">
      <SlideHeading block={block} textColor={textColor} />
      {block.body && (
        <p className="opacity-70 max-w-2xl text-sm mt-1" style={{ fontSize: block.bodySize }}>
          {block.body}
        </p>
      )}
    </div>
  );

  if (showSplit) {
    if (isExpandedImage) {
      return (
        <div className={cn('relative z-10 flex flex-col justify-center w-1/2 h-full gap-4', isImageRight ? 'mr-auto' : 'ml-auto')} style={{ padding: 'clamp(24px, 5cqw, 44px)' }}>
          {headingBlock}
          <div className="overflow-y-auto pr-1">
            {cardsGrid}
          </div>
        </div>
      );
    }

    const imageElement = (
      <div className="relative w-full h-[420px] rounded-2xl overflow-hidden flex items-center justify-center">
        <Image
          src={block.image!}
          alt={block.title || dt('Plan de Pago')}
          fill
          className={block.imageFit === 'contain' ? 'object-contain' : 'object-cover'}
          style={{ objectPosition: block.imagePosition || 'center' }}
          unoptimized={block.image!.startsWith('data:') || block.image!.startsWith('http')}
        />
      </div>
    );

    return (
      <div className="w-full h-full grid grid-cols-2 p-10 gap-8 items-center text-left overflow-hidden">
        {!isImageRight && imageElement}
        <div className="flex flex-col justify-center space-y-4 min-w-0 h-full overflow-hidden">
          {headingBlock}
          <div className="overflow-y-auto pr-1">
            {cardsGrid}
          </div>
        </div>
        {isImageRight && imageElement}
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col justify-between p-12 text-left overflow-hidden">
      {headingBlock}
      <div className="w-full my-auto py-2">
        {cardsGrid}
      </div>
    </div>
  );
}

function SplitContent({ block, isImageRight, isExpandedImage, textColor }: { block: MagazineBlock; isImageRight: boolean; isExpandedImage: boolean; textColor: string }) {
  const isHighlights = block.type === 'highlights';
  const isVertical = block.layout === 'vertical-top' || block.layout === 'vertical-bottom';
  const isImageTop = block.layout === 'vertical-top';
  const isImageBottom = block.layout === 'vertical-bottom';

  if (isVertical) {
    return (
      <div className="w-full h-full flex flex-col justify-between p-10 min-w-0 overflow-hidden text-left">
        {/* Editorial Top Heading */}
        <div className="mb-1.5 shrink-0">
          <SlideHeading block={block} textColor={textColor} />
        </div>

        {/* Content & Image vertical stack */}
        <div className="flex-1 flex flex-col justify-between min-h-0 gap-4 my-1">
          {((isImageTop && block.image) || (isImageBottom && block.secondaryImage)) && (
            <div className="relative w-full h-[260px] shrink-0 rounded-2xl overflow-hidden bg-slate-100 shadow-xs border border-current/10">
              <Image
                src={isImageTop && block.image ? block.image : block.secondaryImage!}
                alt={block.title || 'Imagen superior'}
                fill
                className={block.isMapSlide || block.imageFit === 'contain' ? 'object-contain p-2' : 'object-cover'}
                style={{ objectPosition: (isImageTop && block.image ? block.imagePosition : block.secondaryImagePosition) || 'center' }}
                unoptimized={true}
              />
            </div>
          )}

          <div className="flex-1 overflow-y-auto pr-1 min-h-0 flex flex-col justify-center">
            {isHighlights || (block.extraList && block.extraList.length > 0) ? (
              <StructuredItems block={block} isVertical={true} />
            ) : block.body ? (
              <p className="text-sm leading-relaxed font-sans whitespace-pre-line" style={{ fontSize: block.bodySize, color: textColor }}>
                {block.body}
              </p>
            ) : null}
          </div>

          {((isImageBottom && block.image) || (isImageTop && block.secondaryImage)) && (
            <div className="relative w-full h-[260px] shrink-0 rounded-2xl overflow-hidden bg-slate-100 shadow-xs border border-current/10">
              <Image
                src={isImageBottom && block.image ? block.image : block.secondaryImage!}
                alt={block.title || 'Imagen inferior'}
                fill
                className={block.isMapSlide || (isImageBottom ? block.imageFit === 'contain' : block.secondaryImageFit === 'contain') ? 'object-contain p-2' : 'object-cover'}
                style={{ objectPosition: (isImageBottom && block.image ? block.imagePosition : block.secondaryImagePosition) || 'center' }}
                unoptimized={true}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  const hasSecondaryImage = Boolean(block.secondaryImage);
  const isPureBannerSplit = hasSecondaryImage && !block.body && (!block.extraList || block.extraList.length === 0);

  const bannerElement = hasSecondaryImage ? (
    <div
      className={cn(
        'relative w-full rounded-2xl overflow-hidden flex items-center justify-center border border-current/10 shadow-sm bg-slate-100',
        isPureBannerSplit ? "h-[430px]" : "h-[230px] shrink-0"
      )}
    >
      <Image
        src={block.secondaryImage!}
        alt={block.title || 'Banner especial'}
        fill
        className={block.secondaryImageFit === 'contain' ? 'object-contain' : 'object-cover'}
        style={{ objectPosition: block.secondaryImagePosition || 'center' }}
        unoptimized={block.secondaryImage!.startsWith('data:') || block.secondaryImage!.startsWith('http')}
      />
    </div>
  ) : null;

  const content = (
    <div className="space-y-4 text-left flex flex-col justify-center min-w-0 h-full">
      {(block.title || block.kicker) && (
        <SlideHeading block={block} textColor={isExpandedImage ? textColor : 'inherit'} />
      )}
      {bannerElement}
      {!isHighlights && block.body && (
        <p className="text-xs text-slate-650 leading-relaxed font-sans whitespace-pre-line" style={{ fontSize: block.bodySize }}>
          {block.body}
        </p>
      )}
      {(isHighlights || (block.extraList && block.extraList.length > 0)) && (
        <StructuredItems block={block} />
      )}
    </div>
  );

  if (isExpandedImage) {
    return (
      <div className={cn('relative z-10 flex items-center w-1/2 h-full', isImageRight ? 'mr-auto' : 'ml-auto')} style={{ padding: 'clamp(24px, 6cqw, 48px)' }}>
        {content}
      </div>
    );
  }

  return (
    <div className="w-full h-full grid grid-cols-2 p-10 gap-8 items-center">
      {!isImageRight && block.image ? (
        <div className="relative w-full h-[430px] rounded-2xl overflow-hidden flex items-center justify-center">
          <Image
            src={block.image}
            alt={block.title || ''}
            fill
            className={block.isMapSlide || block.imageFit === 'contain' ? 'object-contain' : 'object-cover'}
            style={{ objectPosition: block.imagePosition || 'center' }}
            unoptimized={block.image.startsWith('data:') || block.image.startsWith('http')}
          />
        </div>
      ) : null}
      {content}
      {isImageRight && block.image ? (
        <div className="relative w-full h-[430px] rounded-2xl overflow-hidden flex items-center justify-center">
          <Image
            src={block.image}
            alt={block.title || ''}
            fill
            className={block.isMapSlide || block.imageFit === 'contain' ? 'object-contain' : 'object-cover'}
            style={{ objectPosition: block.imagePosition || 'center' }}
            unoptimized={block.image.startsWith('data:') || block.image.startsWith('http')}
          />
        </div>
      ) : null}
    </div>
  );
}

function TypeContent({ block, textColor, accentColor, projectName, agencyName, isFullImage, readableTextColor }: { block: MagazineBlock; textColor: string; accentColor: string; projectName: string; agencyName: string; isFullImage: boolean; readableTextColor: string }) {
  const dt = useDocumentText();

  if (block.type === 'text' || block.type === 'image') {
    return (
      <div className="w-full h-full flex items-center p-14">
        <div className="max-w-2xl space-y-4">
          <SlideHeading block={block} textColor={textColor} />
          <p className="whitespace-pre-line leading-7 opacity-80" style={{ fontSize: block.bodySize }}>{block.body}</p>
          {block.extraList && block.extraList.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2.5 w-full">
              {block.extraList.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/90 p-3 text-xs font-medium text-slate-700 shadow-2xs">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#d4af37]/15 text-[#d4af37]">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </span>
                  <span className="leading-snug">{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (block.type === 'gallery') {
    const img0 = block.images?.[0] || block.image || '';
    const img1 = block.images?.[1] || '';
    const img2 = block.images?.[2] || '';
    return (
      <div className="w-full h-full flex items-center p-14">
        <div className="w-full space-y-4">
          <SlideHeading block={block} textColor={textColor} />
          <p className="opacity-70" style={{ fontSize: block.bodySize }}>{block.body}</p>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <GalleryImage src={img0} className="col-span-2 h-52" />
            {img1 && <GalleryImage src={img1} className="h-40" />}
            {img2 && <GalleryImage src={img2} className="h-40" />}
          </div>
        </div>
      </div>
    );
  }

  if (block.type === 'highlights') {
    const items = block.extraList && block.extraList.length > 0
      ? block.extraList
      : (block.body || '').split('\n').map((s) => s.trim()).filter(Boolean);
    const isCR = block.id?.startsWith('cr-');
    const isPalmView = block.iconFamily === 'palm-view' || block.id?.includes('palm-view') || block.id?.includes('coral');
    const isUve = block.iconFamily === 'uve' || block.id?.includes('uve');
    const isCipres = block.iconFamily === 'cipres' || block.id?.includes('cipres');
    const displayImage = block.image || block.images?.[0];
    const amenityColor = block.amenityColor || block.accentColor || accentColor || '#d4af37';

    if (displayImage) {
      const isImageTop = block.layout === 'vertical-top';
      const isImageBottom = block.layout === 'vertical-bottom';
      const isVertical = isImageTop || isImageBottom;
      const isImageRight = block.layout === 'split-right';

      if (isVertical) {
        return (
          <div className="w-full h-full flex flex-col justify-between p-10 min-w-0 overflow-hidden text-left">
            <div className="mb-2 shrink-0">
              <SlideHeading block={block} textColor={textColor} />
              {block.body && (
                <p className="mt-1 max-w-3xl text-sm opacity-80 leading-relaxed font-sans" style={{ color: textColor }}>
                  {block.body}
                </p>
              )}
            </div>

            <div className="flex-1 flex flex-col justify-between min-h-0 gap-4 my-1">
              {isImageTop && (
                <div className="relative w-full h-[290px] shrink-0 rounded-2xl overflow-hidden bg-slate-100 shadow-xs border border-current/10">
                  <Image
                    src={displayImage}
                    alt={block.title || "Master plan"}
                    fill
                    sizes="(max-width: 1024px) 100vw, 1120px"
                    className={block.isMasterPlanSlide || block.isMapSlide || block.imageFit === 'contain' ? "object-contain p-2" : "object-cover"}
                    style={{ objectPosition: block.imagePosition || 'center' }}
                  />
                </div>
              )}

              <div className="flex-1 overflow-y-auto pr-1 min-h-0 flex flex-col justify-center">
                <StructuredItems block={block} isVertical={true} />
              </div>

              {isImageBottom && (
                <div className="relative w-full h-[290px] shrink-0 rounded-2xl overflow-hidden bg-slate-100 shadow-xs border border-current/10">
                  <Image
                    src={displayImage}
                    alt={block.title || "Master plan"}
                    fill
                    sizes="(max-width: 1024px) 100vw, 1120px"
                    className={block.isMasterPlanSlide || block.isMapSlide || block.imageFit === 'contain' ? "object-contain p-2" : "object-cover"}
                    style={{ objectPosition: block.imagePosition || 'center' }}
                  />
                </div>
              )}
            </div>
          </div>
        );
      }

      return (
        <div className="w-full h-full flex flex-col justify-between p-10 min-w-0">
          <div className="mb-2 shrink-0">
            <SlideHeading block={block} textColor={textColor} />
            {block.body && (
              <p className="mt-1 max-w-2xl text-sm opacity-80 leading-relaxed font-sans" style={{ color: textColor }}>
                {block.body}
              </p>
            )}
          </div>
          <div className="grid grid-cols-12 gap-6 items-center flex-1 min-h-0">
            <div className={cn("col-span-6 h-full min-h-[220px] relative overflow-hidden rounded-2xl border border-current/10 bg-slate-100 shadow-xs", isImageRight ? "order-2" : "order-1")}>
              <Image
                src={displayImage}
                alt={block.title || "Master plan"}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className={block.isMasterPlanSlide || block.isMapSlide || block.imageFit === 'contain' ? "object-contain p-2" : "object-cover"}
                style={{ objectPosition: block.imagePosition || 'center' }}
              />
            </div>
            <div className={cn("col-span-6 overflow-y-auto max-h-full pr-1", isImageRight ? "order-1" : "order-2")}>
              <div className="grid grid-cols-2 gap-2">
                {items.map((item, i) => {
                  const iconKey = block.amenityIconMap?.[i];
                  const iconMode = block.amenityIconMode || 'auto';
                  return (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center gap-2 border border-current/10 bg-white/30 text-xs font-semibold",
                        block.amenityStyle === 'pills' ? "rounded-full px-3.5 py-1.5" : "rounded-xl px-3 py-2"
                      )}
                    >
                      <span className="flex items-center gap-1.5 shrink-0">
                        {iconMode === 'number' ? (
                          <>
                            <span
                              className="flex h-5 w-5 items-center justify-center rounded-full text-white text-[9px] font-black"
                              style={{ backgroundColor: amenityColor }}
                            >
                              {i + 1}
                            </span>
                            {isUve ? (
                              <UveAmenityIcon name={block.iconSourceLabels?.[i] || item} className="h-4 w-4" style={{ color: amenityColor }} />
                            ) : isCipres ? (
                              <CipresAmenityIcon name={block.iconSourceLabels?.[i] || item} className="h-4 w-4" style={{ color: amenityColor }} />
                            ) : isPalmView ? (
                              <PalmViewAmenityIcon name={block.iconSourceLabels?.[i] || item} className="h-4 w-4" style={{ color: amenityColor }} />
                            ) : (
                              <AmenityIcon name={block.iconSourceLabels?.[i] || item} className="h-4 w-4" style={{ color: amenityColor }} />
                            )}
                          </>
                        ) : iconMode === 'check' ? (
                          <Check className="h-4 w-4" style={{ color: amenityColor }} />
                        ) : isUve ? (
                          <UveAmenityIcon name={block.iconSourceLabels?.[i] || item} className="h-4 w-4" style={{ color: amenityColor }} />
                        ) : isCipres ? (
                          <CipresAmenityIcon name={block.iconSourceLabels?.[i] || item} className="h-4 w-4" style={{ color: amenityColor }} />
                        ) : isPalmView ? (
                          <PalmViewAmenityIcon name={block.iconSourceLabels?.[i] || item} className="h-4 w-4" style={{ color: amenityColor }} />
                        ) : isCR ? (
                          <CanaRockAmenityIcon name={item} iconKey={iconKey} className="h-4 w-4" style={{ color: amenityColor }} />
                        ) : (
                          <AmenityIcon name={item} className="h-4 w-4" style={{ color: amenityColor }} />
                        )}
                      </span>
                      <span className="truncate text-[11px] font-bold">{item}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-full flex items-center p-14">
        <div className="w-full space-y-4 min-w-0">
          <SlideHeading block={block} textColor={textColor} />
          {items.length > 0 && (
            <div className={cn("grid gap-3", block.amenityColumns === 3 ? "grid-cols-3" : "grid-cols-2", block.amenityStyle === 'list' && "grid-cols-1")}>
              {items.map((item, i) => {
                const iconKey = block.amenityIconMap?.[i];
                const iconMode = block.amenityIconMode || 'auto';
                return (
                  <div key={i} className={cn('flex min-w-0 items-center gap-3 border border-current/10 bg-white/10', block.amenityStyle === 'pills' ? 'rounded-full px-4 py-3' : block.amenityStyle === 'list' ? 'rounded-xl px-4 py-3' : 'min-h-[82px] rounded-2xl p-4')}>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${amenityColor}18`, color: amenityColor }}>
                      {iconMode === 'number' ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black">{String(i + 1).padStart(2, '0')}</span>
                          {isUve ? (
                            <UveAmenityIcon name={block.iconSourceLabels?.[i] || item} className="h-4 w-4" style={{ color: amenityColor }} />
                          ) : isCipres ? (
                            <CipresAmenityIcon name={block.iconSourceLabels?.[i] || item} className="h-4 w-4" style={{ color: amenityColor }} />
                          ) : isPalmView ? (
                            <PalmViewAmenityIcon name={block.iconSourceLabels?.[i] || item} className="h-4 w-4" style={{ color: amenityColor }} />
                          ) : (
                            <AmenityIcon name={block.iconSourceLabels?.[i] || item} className="h-4 w-4" style={{ color: amenityColor }} />
                          )}
                        </div>
                      ) : iconMode === 'check' ? (
                        <Check className="h-[18px] w-[18px]" strokeWidth={1.5} style={{ color: amenityColor }} />
                      ) : isUve ? (
                        <UveAmenityIcon name={block.iconSourceLabels?.[i] || item} className="h-[18px] w-[18px]" style={{ color: amenityColor }} />
                      ) : isCipres ? (
                        <CipresAmenityIcon name={block.iconSourceLabels?.[i] || item} className="h-[18px] w-[18px]" style={{ color: amenityColor }} />
                      ) : isPalmView ? (
                        <PalmViewAmenityIcon name={block.iconSourceLabels?.[i] || item} className="h-[18px] w-[18px]" style={{ color: amenityColor }} />
                      ) : isCR ? (
                        <CanaRockAmenityIcon name={item} iconKey={iconKey} className="h-[18px] w-[18px]" style={{ color: amenityColor }} />
                      ) : (
                        <AmenityIcon name={item} className="h-[18px] w-[18px]" strokeWidth={1.5} style={{ color: amenityColor }} />
                      )}
                    </span>
                    <span className="min-w-0 break-words text-[11px] font-extrabold leading-4">{item}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (block.type === 'stats') {
    const cs = block.customStats;
    const s1Label = cs?.stat1Label ?? dt("Desde");
    const s1Value = cs?.stat1Value ?? '—';
    const s2Label = cs?.stat2Label ?? dt("Ubicación");
    const s2Value = cs?.stat2Value ?? '—';
    const s3Label = cs?.stat3Label ?? dt("Disponibles");
    const s3Value = cs?.stat3Value ?? '—';
    const s4Label = cs?.stat4Label ?? dt("Entrega");
    const s4Value = cs?.stat4Value ?? '—';

    const isImageTop = block.layout === 'vertical-top';
    const detectedSlug =
      (projectName?.toLowerCase().includes('uve') ? 'uve-residences' : undefined) ||
      (projectName?.toLowerCase().includes('palm view') ? 'palm-view' : undefined) ||
      (projectName?.toLowerCase().includes('elements') ? 'elements' : undefined) ||
      (projectName?.toLowerCase().includes('cipr') ? 'cipres-residences' : undefined);

    const statImage = block.image || (
      detectedSlug === 'uve-residences'
        ? '/projects/uve-residences/hero.jpeg'
        : detectedSlug === 'cipres-residences'
        ? '/projects/cipres-residences/gallery/cipres_01.png'
        : detectedSlug === 'palm-view'
        ? '/projects/palm-view/hero.jpg'
        : undefined
    );

    const statsGrid = (
      <div className="grid grid-cols-4 gap-2.5">
        <Metric label={s1Label} value={s1Value} valueSize={block.metricValueSize} accent={accentColor} />
        <Metric label={s2Label} value={s2Value} valueSize={block.metricValueSize} accent={accentColor} />
        <Metric label={s3Label} value={s3Value} valueSize={block.metricValueSize} accent={accentColor} />
        <Metric label={s4Label} value={s4Value} valueSize={block.metricValueSize} accent={accentColor} />
      </div>
    );

    const imageCard = statImage ? (
      <div className="relative w-full flex-1 min-h-[250px] rounded-2xl overflow-hidden shadow-md border border-slate-200/80 bg-slate-100 group">
        <Image
          src={statImage}
          alt={block.title || projectName || dt("Vista del proyecto")}
          fill
          sizes="(max-width: 1024px) 100vw, 1120px"
          className={cn(block.imageFit === 'contain' ? 'object-contain object-center p-3' : 'object-cover object-center')}
          unoptimized={statImage.startsWith('data:') || statImage.startsWith('http')}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-white bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg border border-white/20 shadow-xs">
            {projectName} · {dt("Vista arquitectónica")}
          </span>
        </div>
      </div>
    ) : null;

    return (
      <div className="w-full h-full flex flex-col justify-between gap-5 p-12 text-left">
        {isImageTop ? (
          <>
            {imageCard}
            <div className="space-y-3 shrink-0">
              <div>
                <SlideHeading block={block} textColor={textColor} />
                {block.body && (
                  <p className="mt-1 text-sm leading-relaxed opacity-70" style={{ fontSize: block.bodySize }}>
                    {block.body}
                  </p>
                )}
              </div>
              {statsGrid}
            </div>
          </>
        ) : (
          <>
            <div className="space-y-3 shrink-0">
              <div>
                <SlideHeading block={block} textColor={textColor} />
                {block.body && (
                  <p className="mt-1 text-sm leading-relaxed opacity-70" style={{ fontSize: block.bodySize }}>
                    {block.body}
                  </p>
                )}
              </div>
              {statsGrid}
            </div>
            {imageCard}
          </>
        )}
      </div>
    );
  }

  if (block.type === 'availability') {
    if (block.typologyCards && block.typologyCards.length > 0) {
      return <TypologiesContent block={block} textColor={textColor} />;
    }
    const cards = block.pricingCards || [];
    return (
      <div className="w-full h-full flex flex-col justify-between p-14 text-left">
        <div className="space-y-3 max-w-2xl">
          <SlideHeading block={block} textColor={textColor} />
          {block.body && (
            <p className="text-sm leading-relaxed font-sans opacity-80" style={{ fontSize: block.bodySize }}>
              {block.body}
            </p>
          )}
        </div>
        {cards.length > 0 && (
          <div className="grid grid-cols-3 gap-4 w-full mt-4">
            {cards.map((card, i) => (
              <div key={i} className="rounded-3xl border border-[#d4af37]/35 bg-[#0a1140] p-6 flex flex-col justify-between items-center text-center gap-3 shadow-xl">
                <div className="w-11 h-11 rounded-full border border-[#d4af37]/35 bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37]">
                  <BedDouble className="w-5 h-5" />
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-[#d4af37] font-sans">{card.title}</span>
                <div className="flex items-center justify-center gap-2 w-full mt-1">
                  <div className="w-4 h-[1px] bg-[#d4af37]/40" />
                  <span className="text-[8px] font-black text-[#d4af37] uppercase tracking-widest">{card.kicker || 'A partir de'}</span>
                  <div className="w-4 h-[1px] bg-[#d4af37]/40" />
                </div>
                <span className="text-2xl font-black text-white font-sans mt-0.5 tracking-tight">US$ {Math.round(card.price).toLocaleString('en-US')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (block.type === 'payment') {
    const plans: PaymentPlanScheme[] =
      block.paymentPlans && block.paymentPlans.length > 0
        ? block.paymentPlans
        : block.paymentSteps && block.paymentSteps.length > 0
        ? [
            {
              id: 'legacy-plan',
              title: block.title || dt('Pago Estándar'),
              subtitle: block.subHeader || undefined,
              steps: block.paymentSteps.map((s) => `${s.value} ${s.label}`),
            },
          ]
        : buildDefaultPaymentPlans({ paymentPlan: block.paymentSteps });

    const isDark =
      readableTextColor === '#ffffff' ||
      readableTextColor.toLowerCase().includes('fff') ||
      (block.backgroundColor &&
        ['#000000', '#111827', '#0b1120', '#0f172a'].includes(block.backgroundColor.toLowerCase()));

    return (
      <div className="w-full h-full flex flex-col justify-between p-12 text-left overflow-hidden">
        <div className="space-y-1 shrink-0">
          <SlideHeading block={block} textColor={textColor} />
          {block.body && (
            <p className="opacity-70 max-w-2xl text-sm mt-1" style={{ fontSize: block.bodySize }}>
              {block.body}
            </p>
          )}
        </div>

        <div className="w-full my-auto py-2">
          <div className="grid grid-cols-4 gap-3.5 max-w-6xl">
            {plans.map((plan, pIdx) => {
              const steps = Array.isArray(plan.steps) ? plan.steps : [];
              return (
                <div
                  key={plan.id || pIdx}
                  className={cn(
                    "rounded-2xl border p-5 flex flex-col justify-between shadow-2xs transition text-left min-h-[220px] max-h-[350px]",
                    isDark
                      ? 'border-white/10 bg-white/5 hover:border-white/20'
                      : 'border-slate-200/90 bg-white/95 hover:shadow-md hover:border-slate-300'
                  )}
                >
                  <div>
                    {plan.badge && (
                      <div className="mb-2">
                        <span
                          className="inline-block text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border shadow-2xs"
                          style={{
                            backgroundColor: `${accentColor}15`,
                            borderColor: `${accentColor}40`,
                            color: accentColor,
                          }}
                        >
                          {plan.badge}
                        </span>
                      </div>
                    )}

                    <h3
                      className={cn(
                        "text-[14.5px] font-extrabold tracking-tight leading-snug",
                        isDark ? 'text-white' : 'text-slate-900'
                      )}
                    >
                      {plan.title}
                    </h3>

                    {plan.subtitle && (
                      <p
                        className={cn(
                          "text-[10.5px] font-medium tracking-wide mt-0.5",
                          isDark ? 'text-white/60' : 'text-slate-500'
                        )}
                      >
                        {plan.subtitle}
                      </p>
                    )}

                    <div className="w-6 h-[1.5px] my-2.5" style={{ backgroundColor: `${accentColor}60` }} />

                    <ul className="space-y-2">
                      {steps.map((step, sIdx) => (
                        <li
                          key={sIdx}
                          className={cn(
                            "text-[11.5px] leading-snug flex items-start gap-2",
                            isDark ? 'text-white/85' : 'text-slate-700'
                          )}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full mt-1 shrink-0"
                            style={{ backgroundColor: accentColor }}
                          />
                          <span className="font-medium">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {plan.discount && (
                    <div className="mt-3 pt-2.5 border-t border-current/10">
                      <p
                        className="text-[10.5px] font-serif italic leading-tight"
                        style={{ color: accentColor }}
                      >
                        {plan.discount}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (block.type === 'documents') {
    const docs = block.visibleDocuments || [];
    return (
      <div className="w-full h-full flex items-center p-14">
        <div className="w-full space-y-4 min-w-0">
          <SlideHeading block={block} textColor={textColor} />
          <p className="opacity-70 leading-relaxed" style={{ fontSize: block.bodySize }}>{block.body}</p>
          <div className="mt-4 divide-y divide-current/10">
            {docs.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 py-4">
                <span className="rounded-xl bg-white/15 p-2">
                  <FileText className="h-4 w-4" style={{ color: accentColor }} />
                </span>
                <p className="flex-1 text-xs font-bold">{doc.name}</p>
                {(doc.format || doc.updated) && <span className="text-[9px] opacity-50">{[doc.format, doc.updated].filter(Boolean).join(' · ')}</span>}
              </div>
            ))}
            {docs.length === 0 && <p className="py-4 text-xs opacity-60 italic">{dt("No hay documentos para mostrar.")} </p>}
          </div>
        </div>
      </div>
    );
  }

  if (block.type === 'banking') {
    const info = block.bankingInfo;
    return (
      <div className="w-full h-full flex items-center p-14">
        <div className="w-full space-y-4 min-w-0">
          <SlideHeading block={block} textColor={textColor} />
          <p className="max-w-2xl leading-6 opacity-70" style={{ fontSize: block.bodySize }}>{block.body}</p>
          <div className="mt-4 grid gap-3 rounded-2xl border border-current/15 bg-white/10 p-5 grid-cols-2">
            <BankRow label={dt("Beneficiario")} value={info?.beneficiary || agencyName} />
            <BankRow label={dt("Banco")} value={info?.bank || dt("Banco ••••••••")} />
            <BankRow label={dt("Cuenta USD")} value={info?.account || '•••• •••• •••• ••••'} />
            <BankRow label={dt("Referencia")} value={info?.reference || projectName} />
          </div>
        </div>
      </div>
    );
  }

  if (block.type === 'disclaimer') {
    return (
      <div className="w-full h-full flex items-center p-14">
        <div className="max-w-2xl space-y-4 min-w-0">
          <SlideHeading block={block} textColor={textColor} />
          <p className="whitespace-pre-line leading-7 opacity-75" style={{ fontSize: block.bodySize }}>{block.body}</p>
          <div className="flex items-center gap-3 rounded-2xl border border-current/15 p-4 text-[10px] font-bold">
            <Scale className="h-5 w-5" style={{ color: accentColor }} />
            {dt("Validar la versión final con el equipo legal antes de enviarla.")} </div>
        </div>
      </div>
    );
  }

  // Fallback: full-bleed overlay card
  if (isFullImage) {
    return (
      <div className="w-full h-full flex flex-col justify-end p-12">
        <div className="bg-slate-950/70 backdrop-blur-md rounded-2xl p-4 border border-white/15 max-w-md text-left text-white space-y-1">
          <span className="text-[8px] font-bold text-[#d4af37] uppercase tracking-widest block">{block.kicker}</span>
          <p className="text-xs text-slate-200 font-sans leading-relaxed">{block.body}</p>
        </div>
      </div>
    );
  }

  // Fallback: centered content for unrecognized types
  return (
    <div className="w-full h-full flex items-center justify-center p-14 text-center">
      <div className="max-w-xl space-y-4">
        <SlideHeading block={block} textColor={readableTextColor} />
        <p className="max-w-md leading-relaxed opacity-85 mx-auto" style={{ fontSize: block.bodySize }}>{block.body}</p>
        {block.extraList && block.extraList.length > 0 && (
          <div className="grid grid-cols-2 gap-2 pt-2">
            {block.extraList.map((item, i) => (
              <div key={i} className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/90 p-3 text-xs font-medium text-slate-700 shadow-2xs">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#d4af37]/15 text-[#d4af37]">
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </span>
                <span className="leading-snug">{item}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TypologiesContent({ block, textColor }: { block: MagazineBlock; textColor: string }) {
  const dt = useDocumentText();
  const accent = block.accentColor || '#d4af37';
  const cards = block.typologyCards || [];
  const layout = block.typologyLayout || (cards.length === 1 ? 1 : cards.length === 2 ? 2 : 3);

  // Layout 1: Single Typology Hero Editorial View
  if (layout === 1 && cards.length > 0) {
    const card = cards[0];
    const isImageTop = block.layout === 'vertical-top';
    const isImageBottom = block.layout === 'vertical-bottom';
    const isVertical = isImageTop || isImageBottom;
    const isImageRight = block.layout === 'split-right';

    if (isVertical) {
      return (
        <div className="w-full h-full p-10 flex flex-col justify-between text-left overflow-hidden">
          {/* Header */}
          <div className="space-y-1 shrink-0 mb-2">
            {block.kicker && (
              <span className="text-[9px] font-black uppercase tracking-[0.2em] block" style={{ color: accent }}>
                {block.kicker}
              </span>
            )}
            <h2 className="text-2xl font-serif italic leading-tight" style={{ color: textColor }}>
              {block.title || card.name}
            </h2>
            <div className="w-12 h-[1.5px] mt-1" style={{ backgroundColor: accent }} />
          </div>

          {/* Vertical Stack */}
          <div className="flex-1 flex flex-col justify-between min-h-0 gap-3 my-1">
            {isImageTop && (
              <div className="relative w-full h-[280px] shrink-0 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center shadow-md border border-slate-200/80">
                {card.image ? (
                  <Image
                    src={card.image}
                    alt={card.name}
                    fill
                    unoptimized={card.image.startsWith('data:') || card.image.startsWith('http')}
                    sizes="(max-width: 1024px) 100vw, 1120px"
                    className={cn(
                      (card.imageFit || block.imageFit) === 'cover'
                        ? 'object-cover object-center'
                        : 'object-contain object-center p-3'
                    )}
                    style={{ objectPosition: card.imagePosition || block.imagePosition || 'center' }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-300 gap-2">
                    <Maximize2 className="w-10 h-10 stroke-[1.5]" />
                    <span className="text-xs font-bold uppercase tracking-wider">{dt("Plano arquitectónico")}</span>
                  </div>
                )}
              </div>
            )}

            {/* Details & Specs & Price Box */}
            <div className="flex-1 flex flex-col justify-center space-y-3 min-h-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xl font-bold tracking-tight text-slate-900">{card.name}</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-[8.5px] font-black uppercase tracking-wider text-slate-400">
                    {card.minPrice && card.minPrice > 0 ? dt("Inversión desde") : dt("Disponibilidad")}
                  </span>
                  <span className="text-2xl font-serif italic font-bold tracking-tight text-slate-900">
                    {card.minPrice && card.minPrice > 0
                      ? `US$ ${Math.round(card.minPrice).toLocaleString('en-US')}`
                      : dt("Bajo consulta")}
                  </span>
                </div>
              </div>

              {block.body && <p className="text-xs text-slate-600 leading-relaxed font-sans">{block.body}</p>}

              <div className="grid grid-cols-4 gap-2.5">
                <div className="rounded-xl border border-slate-100 bg-white p-3 flex items-center gap-2.5 shadow-xs">
                  <BedDouble className="w-4 h-4 shrink-0" strokeWidth={1.5} style={{ color: accent }} />
                  <div className="flex flex-col">
                    <span className="text-sm font-extrabold text-slate-900 leading-none">{card.bedrooms}</span>
                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 mt-0.5">{dt("Habitaciones")}</span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-100 bg-white p-3 flex items-center gap-2.5 shadow-xs">
                  <Bath className="w-4 h-4 shrink-0" strokeWidth={1.5} style={{ color: accent }} />
                  <div className="flex flex-col">
                    <span className="text-sm font-extrabold text-slate-900 leading-none">{card.bathrooms}</span>
                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 mt-0.5">{dt("Baños")}</span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-100 bg-white p-3 flex items-center gap-2.5 shadow-xs">
                  <Maximize2 className="w-4 h-4 shrink-0" strokeWidth={1.5} style={{ color: accent }} />
                  <div className="flex flex-col">
                    <span className="text-sm font-extrabold text-slate-900 leading-none">{card.area ? `${card.area} m²` : '—'}</span>
                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 mt-0.5">{dt("Metraje")}</span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-100 bg-white p-3 flex items-center gap-2.5 shadow-xs">
                  <Car className="w-4 h-4 shrink-0" strokeWidth={1.5} style={{ color: accent }} />
                  <div className="flex flex-col">
                    <span className="text-sm font-extrabold text-slate-900 leading-none">{card.parking ?? 0}</span>
                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-400 mt-0.5">{dt("Parqueos")}</span>
                  </div>
                </div>
              </div>
            </div>

            {isImageBottom && (
              <div className="relative w-full h-[280px] shrink-0 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center shadow-md border border-slate-200/80">
                {card.image ? (
                  <Image
                    src={card.image}
                    alt={card.name}
                    fill
                    unoptimized={card.image.startsWith('data:') || card.image.startsWith('http')}
                    sizes="(max-width: 1024px) 100vw, 1120px"
                    className={cn(
                      (card.imageFit || block.imageFit) === 'cover'
                        ? 'object-cover object-center'
                        : 'object-contain object-center p-3'
                    )}
                    style={{ objectPosition: card.imagePosition || block.imagePosition || 'center' }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-300 gap-2">
                    <Maximize2 className="w-10 h-10 stroke-[1.5]" />
                    <span className="text-xs font-bold uppercase tracking-wider">{dt("Plano arquitectónico")}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-full p-12 flex flex-col justify-between text-left overflow-hidden">
        <div className="space-y-1">
          {block.kicker && (
            <span className="text-[9px] font-black uppercase tracking-[0.2em] block" style={{ color: accent }}>
              {block.kicker}
            </span>
          )}
          <h2 className="text-3xl font-serif italic leading-tight" style={{ color: textColor }}>
            {block.title || card.name}
          </h2>
          <div className="w-12 h-[1.5px] mt-1.5" style={{ backgroundColor: accent }} />
        </div>

        <div className="grid grid-cols-12 gap-6 items-stretch flex-1 my-2 min-h-0">
          {/* Large Image Box */}
          <div className={cn("col-span-7 h-full min-h-[300px] relative rounded-3xl overflow-hidden shadow-lg bg-slate-100 flex items-center justify-center", isImageRight ? "order-2" : "order-1")}>
            {card.image ? (
              <Image
                src={card.image}
                alt={card.name}
                fill
                unoptimized={card.image.startsWith('data:') || card.image.startsWith('http')}
                sizes="(max-width: 768px) 100vw, 650px"
                className={cn(
                  (card.imageFit || block.imageFit) === 'cover'
                    ? 'object-cover object-center'
                    : 'object-contain object-center p-3'
                )}
                style={{ objectPosition: card.imagePosition || block.imagePosition || 'center' }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-300 gap-2">
                <Maximize2 className="w-10 h-10 stroke-[1.5]" />
                <span className="text-xs font-bold uppercase tracking-wider">{dt("Plano arquitectónico")}</span>
              </div>
            )}
          </div>

          {/* Details & Specs & Price Box */}
          <div className={cn("col-span-5 flex flex-col justify-between h-full space-y-4", isImageRight ? "order-1" : "order-2")}>
            <div className="space-y-3">
              <h3 className="text-2xl font-bold tracking-tight text-slate-900">{card.name}</h3>
              {block.body && <p className="text-xs text-slate-600 leading-relaxed font-sans">{block.body}</p>}

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-2xl border border-slate-100 bg-white p-4 flex items-center gap-3.5 shadow-xs">
                  <BedDouble className="w-5 h-5 shrink-0" strokeWidth={1.5} style={{ color: accent }} />
                  <div className="flex flex-col">
                    <span className="text-base font-extrabold text-slate-900 leading-none">{card.bedrooms}</span>
                    <span className="text-[8.5px] font-black uppercase tracking-wider text-slate-400 mt-1">{dt("Habitaciones")}</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-4 flex items-center gap-3.5 shadow-xs">
                  <Bath className="w-5 h-5 shrink-0" strokeWidth={1.5} style={{ color: accent }} />
                  <div className="flex flex-col">
                    <span className="text-base font-extrabold text-slate-900 leading-none">{card.bathrooms}</span>
                    <span className="text-[8.5px] font-black uppercase tracking-wider text-slate-400 mt-1">{dt("Baños")}</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-4 flex items-center gap-3.5 shadow-xs">
                  <Maximize2 className="w-5 h-5 shrink-0" strokeWidth={1.5} style={{ color: accent }} />
                  <div className="flex flex-col">
                    <span className="text-base font-extrabold text-slate-900 leading-none">{card.area ? `${card.area} m²` : '—'}</span>
                    <span className="text-[8.5px] font-black uppercase tracking-wider text-slate-400 mt-1">{dt("Metraje const.")}</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-4 flex items-center gap-3.5 shadow-xs">
                  <Car className="w-5 h-5 shrink-0" strokeWidth={1.5} style={{ color: accent }} />
                  <div className="flex flex-col">
                    <span className="text-base font-extrabold text-slate-900 leading-none">{card.parking ?? 0}</span>
                    <span className="text-[8.5px] font-black uppercase tracking-wider text-slate-400 mt-1">{dt("Parqueos")}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Clean Price Row */}
            <div className="pt-3 border-t border-slate-200/80 flex items-baseline justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                  {card.minPrice && card.minPrice > 0 ? dt("Inversión desde") : dt("Disponibilidad")}
                </p>
                <p className="text-3xl font-serif italic font-bold tracking-tight text-slate-900 mt-0.5">
                  {card.minPrice && card.minPrice > 0
                    ? `US$ ${Math.round(card.minPrice).toLocaleString('en-US')}`
                    : dt("Bajo consulta")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Layout 2 or 3 (Cards Grid)
  const displayCards = cards.slice(0, layout);
  const gridCols = layout === 2 ? "grid-cols-2" : "grid-cols-3";
  const isImageBottom = block.layout === 'vertical-bottom';

  return (
    <div className="w-full h-full p-10 flex flex-col justify-between text-left overflow-hidden">
      <div className="space-y-1 mb-2">
        {block.kicker && (
          <span className="text-[9px] font-black uppercase tracking-[0.2em] block" style={{ color: accent }}>
            {block.kicker}
          </span>
        )}
        <h2 className="text-2xl font-serif italic leading-tight" style={{ color: textColor }}>
          {block.title || dt("Tipologías y Modelos")}
        </h2>
        <div className="w-10 h-[1.5px] mt-1" style={{ backgroundColor: accent }} />
      </div>

      <div className={cn('grid gap-4 flex-1 my-2 min-h-0 items-stretch', gridCols)}>
        {displayCards.map((card, i) => (
          <div
            key={card.id || i}
            className="rounded-3xl border border-slate-200/80 bg-white/95 p-4 flex flex-col justify-between shadow-lg overflow-hidden transition"
          >
            {/* Image */}
            <div className={cn("relative w-full h-[180px] rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center shrink-0", isImageBottom ? "order-2 mt-3" : "order-1 mb-3")}>
              {card.image ? (
                <Image
                  src={card.image}
                  alt={card.name}
                  fill
                  unoptimized={card.image.startsWith('data:') || card.image.startsWith('http')}
                  sizes="400px"
                  className={cn(
                    (card.imageFit || block.imageFit) === 'cover'
                      ? 'object-cover object-center'
                      : 'object-contain object-center p-2'
                  )}
                  style={{ objectPosition: card.imagePosition || block.imagePosition || 'center' }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-300 gap-1.5">
                  <Maximize2 className="w-7 h-7 stroke-[1.5]" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">{dt("Plano")}</span>
                </div>
              )}
            </div>

            {/* Title & Specs */}
            <div className={cn("space-y-2 flex-1 flex flex-col justify-between", isImageBottom ? "order-1" : "order-2")}>
              <div>
                <h4 className="font-extrabold text-base text-slate-900 leading-tight">{card.name}</h4>
              </div>

              {/* Clean Specs Row */}
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-slate-600 font-medium py-1">
                <span>{card.bedrooms} {dt("Hab.")}</span>
                <span className="text-slate-300">·</span>
                <span>{card.bathrooms} {dt("Baños")}</span>
                {card.area ? (
                  <>
                    <span className="text-slate-300">·</span>
                    <span>{card.area} m²</span>
                  </>
                ) : null}
                {card.parking !== undefined && card.parking > 0 ? (
                  <>
                    <span className="text-slate-300">·</span>
                    <span>{card.parking} {dt("Pq.")}</span>
                  </>
                ) : null}
              </div>

              {/* Clean Price Line */}
              <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between mt-1">
                <span className="text-[8px] font-black uppercase tracking-[0.16em] text-slate-400">
                  {card.minPrice && card.minPrice > 0 ? dt("Desde") : dt("Disponibilidad")}
                </span>
                <span className="text-base font-serif italic font-bold text-slate-900">
                  {card.minPrice && card.minPrice > 0
                    ? `US$ ${Math.round(card.minPrice).toLocaleString('en-US')}`
                    : dt("Bajo consulta")}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
