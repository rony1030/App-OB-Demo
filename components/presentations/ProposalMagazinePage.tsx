'use client';

import Image from '@/components/ui/OptimizedImage';
import { useContext } from 'react';
import { DocumentLocale, useDocumentText } from '@/components/i18n/DocumentLocale';
import { Bath, BedDouble, CarFront, Check, ImagePlus, Mail, MapPin, Phone, Ruler } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { CanaRockAmenityIcon, resolveIconKey } from '@/components/branding/CanaRockAmenityIcon';
import { CipresAmenityIcon } from '@/components/branding/CipresAmenityIcon';
import { UveAmenityIcon } from '@/components/branding/UveAmenityIcon';
import { PalmViewAmenityIcon } from '@/components/branding/PalmViewAmenityIcon';
import { calculateProposalPaymentSchedule, type ProposalPaymentSchedule } from '@/lib/proposals/payment-schedule';
import type { CSSProperties } from 'react';

export type ProposalMagazineBlock = {
  id?: string; type?: string; title?: string; body?: string; kicker?: string; layout?: string;
  backgroundType?: string; backgroundColor?: string; gradientColor2?: string; textColor?: string; accentColor?: string;
  fontFamily?: 'sans' | 'serif' | 'mono'; image?: string; images?: string[]; imageFit?: string; imagePosition?: string;
  overlayOpacity?: number; titleSize?: number; bodySize?: number; projectLogoUrl?: string; coverLogoUrl?: string; showDeveloperLogo?: boolean;
  showBrokerLogo?: boolean; hideBrokerDetails?: boolean; brokerLogoVariant?: 'normal' | 'white'; customBrokerLogoUrl?: string; customFooterText?: string;
  subHeader?: string; locationLeft?: string; locationRight?: string; hideFooter?: boolean; hidePageContent?: boolean;
  showDisclaimer?: boolean; disclaimer?: string; disclaimerColor?: string; disclaimerSize?: number; extraList?: string[];
  amenityStyle?: 'cards' | 'list' | 'pills'; amenityColumns?: number; amenityIconMode?: 'auto' | 'check' | 'number'; amenityColor?: string;
  iconFamily?: 'cana-rock' | 'cipres' | 'uve' | 'palm-view' | 'minimal';
  iconSourceLabels?: string[];
  amenityIconMap?: Record<string, string>; pricingCards?: { title: string; price: number; kicker?: string }[];
  paymentSchedule?: ProposalPaymentSchedule;
  offerTitle?: string;
  offerText?: string;
  proposalCode?: string;
  showFrame?: boolean;
  showOrnaments?: boolean;
  coverRadius?: string;
  galleryPage?: boolean;
  additionalImageFit?: 'cover' | 'contain';
  additionalImagePosition?: string;
  conceptPart1?: string;
  conceptPart2?: string;
  typologyName?: string;
  typologyDetails?: string;
  typologyUnits?: string[];
  typologyBedrooms?: number;
  typologyBathrooms?: number;
  typologyAreaSqm?: number;
  typologyParkingSpaces?: number;
  availabilityItems?: ProposalMagazineItem[];
  typologyFloorPlanImage?: string;
  headerLogoMode?: 'ob' | 'project' | 'custom' | 'none';
  hideHeaderLogo?: boolean;
  targetUnit?: ProposalMagazineItem;
  targetUnitName?: string;
  targetUnitPrice?: number;
  targetUnitCurrency?: string;
};

export type ProposalMagazineItem = {
  unit_id?: string;
  unit_name?: string;
  typology_id?: string;
  typology_name?: string;
  price?: number;
  list_price?: number;
  applied_discount_percent?: number;
  currency?: string;
  bedrooms?: number;
  bathrooms?: number;
  area_sqm?: number;
  parking_spaces?: number;
};

const DEFAULT_DISCLAIMER = 'Esta propuesta fue generada con datos correctos al momento de su creación. Los precios, imágenes, disponibilidad y condiciones comerciales deben ser confirmados formalmente antes de reservar.';

export function ProposalMagazinePage({
  block,
  index,
  total,
  projectName,
  clientName,
  agencyName,
  agencyLogo,
  brokerName,
  brokerPhone,
  brokerEmail,
  brokerAvatarUrl,
  brokerProfessionalTitle,
  items = [],
  interactiveSlots = false,
  onSlotClick,
}: {
  block: ProposalMagazineBlock;
  index: number;
  total: number;
  projectName: string;
  clientName?: string;
  agencyName?: string;
  agencyLogo?: string;
  brokerName?: string;
  brokerPhone?: string;
  brokerEmail?: string;
  brokerAvatarUrl?: string | null;
  brokerProfessionalTitle?: string | null;
  items?: ProposalMagazineItem[];
  interactiveSlots?: boolean;
  onSlotClick?: (target: 'cover' | 'story' | 'storySecondary' | 'typology' | 'amenities' | 'units' | 'payment' | 'gallery') => void;
}) {
  const dt = useDocumentText();

  const isCover = block.type === 'cover';
  const foreground = block.textColor || '#14213d';
  const accent = block.accentColor || '#c5a880';
  const background = block.backgroundType === 'gradient' ? `linear-gradient(145deg, ${block.backgroundColor || '#ffffff'} 0%, ${block.gradientColor2 || '#f5f0e8'} 100%)` : block.backgroundColor || '#ffffff';
  const image = block.image || block.images?.[0];
  const hasImageBackground = !isCover && block.backgroundType === 'image' && image;
  const isLogoHidden = block.hideHeaderLogo === true || block.headerLogoMode === 'none';
  const resolvedBrokerLogo = !isLogoHidden && block.showBrokerLogo !== false ? (block.customBrokerLogoUrl || agencyLogo) : undefined;
  const headerLogo = isLogoHidden
    ? undefined
    : block.headerLogoMode === 'project'
    ? (block.projectLogoUrl || resolvedBrokerLogo)
    : block.headerLogoMode === 'custom'
    ? (block.customBrokerLogoUrl || resolvedBrokerLogo)
    : (resolvedBrokerLogo || block.projectLogoUrl);
  const headerLogoClass = headerLogo === resolvedBrokerLogo && resolvedBrokerLogo ? (block.brokerLogoVariant === 'white' ? 'brightness-0 invert' : '') : '';
  const titleSize = Math.min(Math.max(block.titleSize || (isCover ? 48 : 34), 22), 66);
  const bodySize = Math.min(Math.max(block.bodySize || 14, 10), 22);
  const selectedItems = (block.availabilityItems || items).filter((item) => item.unit_name || item.price);
  const isVisualOnly = block.hidePageContent === true;
  const keepCentered = isCover || block.type === 'contact';
  const style = { background, color: foreground, '--proposal-accent': accent, '--proposal-border': 'rgba(197, 168, 128, 0.28)', '--proposal-card': '#f8f9fa' } as CSSProperties;

  if (isVisualOnly) {
    return (
      <article className="relative flex h-full w-full flex-col overflow-hidden bg-white" style={style}>
        {image ? <Image src={image} alt={block.title || projectName} fill priority={index === 0} loading={index === 0 ? 'eager' : undefined} sizes="2048px" unoptimized={image.startsWith('data:')} className={block.imageFit === 'contain' ? 'object-contain' : 'object-cover'} style={{ objectPosition: block.imagePosition || 'center' }} /> : null}
        {interactiveSlots && onSlotClick && block.galleryPage && (
          <div className="absolute top-4 right-4 z-20">
            <button
              type="button"
              onClick={() => onSlotClick('gallery')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/75 hover:bg-black/90 text-white text-xs font-bold backdrop-blur-md shadow-lg transition-all hover:scale-[1.02] cursor-pointer"
            >
              <ImagePlus className="w-4 h-4 text-amber-400" />
              <span>{dt("Gestionar fotos de la galería")}</span>
            </button>
          </div>
        )}
        {block.showDisclaimer && <footer className="relative z-10 mt-auto shrink-0 border-t border-slate-200 bg-white/95 px-[8.5%] py-4 text-center backdrop-blur-sm"><p className="text-[8px] italic leading-relaxed text-slate-500">{dt(block.disclaimer || DEFAULT_DISCLAIMER)}</p><p className="mt-2 text-right text-[8px] font-black uppercase tracking-[0.22em] text-slate-400">{block.locationRight || `${dt('Pág.')} ${String(index + 1).padStart(2, '0')}`}</p></footer>}
      </article>
    );
  }

  return <article className={cn('relative h-full w-full overflow-hidden [container-type:inline-size]', block.fontFamily === 'serif' ? 'font-serif' : 'font-sans', block.showFrame !== false && 'border border-[rgba(197,168,128,0.22)]')} style={style}>
    {hasImageBackground && <div className="absolute inset-0"><Image src={image} alt="" fill loading="eager" sizes="2048px" unoptimized={image.startsWith('data:')} className={block.imageFit === 'contain' ? 'object-contain' : 'object-cover'} style={{ objectPosition: block.imagePosition || 'center' }} /><div className="absolute inset-0 bg-[#0f172a]" style={{ opacity: (block.overlayOpacity ?? 58) / 100 }} /></div>}
    <div className="relative z-10 flex h-full flex-col px-[8.5%] pb-[5%] pt-[4%]">
      <header className="flex shrink-0 items-center justify-between gap-5 border-b border-[color:var(--proposal-border)] pb-2.5 sm:pb-3">
        <div className="flex min-h-9 sm:min-h-10 items-center">
          {headerLogo ? (
            <Image
              src={typeof headerLogo === 'string' ? headerLogo : ''}
              alt={agencyName || projectName || dt("Desarrollo")}
              width={210}
              height={72}
              loading="eager"
              unoptimized={typeof headerLogo === 'string' && (headerLogo.startsWith('data:') || headerLogo.startsWith('http'))}
              className={cn('max-h-10 sm:max-h-11 max-w-[14rem] object-contain object-left', headerLogoClass)}
              style={{ width: 'auto', height: 'auto' }}
            />
          ) : isLogoHidden ? (
            <span className="text-[9px] font-black uppercase tracking-[0.28em] text-slate-400">{projectName}</span>
          ) : (
            <span className="text-[9px] font-black uppercase tracking-[0.28em]">{agencyName || projectName}</span>
          )}
        </div>
        <div className="text-right text-[8px] font-black uppercase tracking-[0.26em] opacity-70">{block.subHeader || dt("Propuesta de inversión")}<br /><span className="text-[var(--proposal-accent)]">{String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span></div>
      </header>
      <div className={cn('flex min-h-0 flex-1 flex-col', keepCentered ? 'justify-center' : 'justify-start', isVisualOnly ? 'py-0' : keepCentered ? 'py-[4%]' : 'pt-[2%] pb-[1.5%]')}>
        {block.type === 'cover' ? (
          <Cover block={block} projectName={projectName} clientName={clientName} selectedItems={selectedItems} image={image} titleSize={titleSize} bodySize={bodySize} interactiveSlots={interactiveSlots} onSlotClick={onSlotClick} />
        ) : block.type === 'availability' ? (
          <Availability block={block} selectedItems={selectedItems} bodySize={bodySize} interactiveSlots={interactiveSlots} onSlotClick={onSlotClick} />
        ) : block.type === 'typology' ? (
          <Typology block={block} selectedItems={selectedItems} bodySize={bodySize} interactiveSlots={interactiveSlots} onSlotClick={onSlotClick} />
        ) : block.type === 'payment' ? (
          <Payment block={block} selectedItems={selectedItems} bodySize={bodySize} interactiveSlots={interactiveSlots} onSlotClick={onSlotClick} />
        ) : block.type === 'highlights' ? (
          <Highlights block={block} bodySize={bodySize} interactiveSlots={interactiveSlots} onSlotClick={onSlotClick} />
        ) : block.type === 'floorplan' ? (
          <FloorPlan block={block} image={image} titleSize={titleSize} bodySize={bodySize} />
        ) : block.type === 'location' ? (
          <Location block={block} image={image} titleSize={titleSize} bodySize={bodySize} />
        ) : block.type === 'contact' ? (
          <Contact block={block} agencyName={agencyName} brokerName={brokerName} brokerPhone={brokerPhone} brokerEmail={brokerEmail} brokerAvatarUrl={brokerAvatarUrl} brokerProfessionalTitle={brokerProfessionalTitle} bodySize={bodySize} />
        ) : (
          <Editorial block={block} image={image} titleSize={titleSize} bodySize={bodySize} interactiveSlots={interactiveSlots} onSlotClick={onSlotClick} />
        )}
      </div>
      {!block.hideFooter && <footer className="relative z-20 shrink-0 border-t border-[color:var(--proposal-border)] bg-[color:var(--proposal-paper,#ffffff)] pt-3">{block.showDisclaimer && <p className="mb-3 text-center text-[8px] italic leading-relaxed opacity-60" style={{ color: block.disclaimerColor || foreground, fontSize: `${block.disclaimerSize || 8}px` }}>{dt(block.disclaimer || DEFAULT_DISCLAIMER)}</p>}<div className="flex justify-end text-[8px] font-black uppercase tracking-[0.22em] opacity-55"><span>{block.locationRight || `${dt('Pág.')} ${String(index + 1).padStart(2, '0')}`}</span></div></footer>}
    </div>
  </article>;
}

function formatSectionTitle(title?: string) {
  if (!title) return '';
  return title
    .replace(/\s·\sUnidad\s+/gi, ' ·\nUnidad\u00A0')
    .replace(/\bUnidad\s+([A-Za-z0-9_-]+)\b/gi, 'Unidad\u00A0$1');
}

function SectionHeading({ block, titleSize }: { block: ProposalMagazineBlock; titleSize?: number }) {
  const dt = useDocumentText();
  return (
    <div className="border-b border-[color:var(--proposal-border)] pb-4">
      <p className="text-[9px] font-black uppercase tracking-[0.28em] text-[var(--proposal-accent)]">
        {block.kicker || dt("Propuesta de inversión")}
      </p>
      <h2
        className="mt-1 max-w-3xl font-serif text-[clamp(1.45rem,7cqw,2.5rem)] italic leading-tight whitespace-pre-line"
        style={{ fontSize: `clamp(1.45rem, 7cqw, ${titleSize || 40}px)` }}
      >
        {formatSectionTitle(block.title)}
      </h2>
    </div>
  );
}

function Cover({
  block,
  projectName,
  clientName,
  selectedItems,
  image,
  titleSize,
  bodySize,
  interactiveSlots,
  onSlotClick,
}: {
  block: ProposalMagazineBlock;
  projectName: string;
  clientName?: string;
  selectedItems: ProposalMagazineItem[];
  image?: string;
  titleSize: number;
  bodySize: number;
  interactiveSlots?: boolean;
  onSlotClick?: (target: 'cover' | 'story' | 'storySecondary' | 'typology' | 'amenities' | 'units' | 'payment' | 'gallery') => void;
}) {
  const dt = useDocumentText();

  const primary = selectedItems[0];
  const isMultiUnit = selectedItems.length > 1;

  const validBeds = selectedItems.map((u) => Number(u.bedrooms)).filter((n) => !isNaN(n) && n > 0);
  const minBed = validBeds.length ? Math.min(...validBeds) : null;
  const maxBed = validBeds.length ? Math.max(...validBeds) : null;
  const bedroomsText = minBed !== null
    ? (minBed === maxBed
        ? `${minBed} ${minBed === 1 ? dt("hab.") : dt("habs.")}`
        : `${minBed} – ${maxBed} ${dt("habs.")}`)
    : null;

  const validBaths = selectedItems.map((u) => Number(u.bathrooms)).filter((n) => !isNaN(n) && n > 0);
  const minBath = validBaths.length ? Math.min(...validBaths) : null;
  const maxBath = validBaths.length ? Math.max(...validBaths) : null;
  const bathroomsText = minBath !== null
    ? (minBath === maxBath
        ? `${minBath} ${minBath === 1 ? dt("baño") : dt("baños")}`
        : `${minBath} – ${maxBath} ${dt("baños")}`)
    : null;

  const validAreas = selectedItems.map((u) => Number(u.area_sqm)).filter((n) => !isNaN(n) && n > 0);
  const minArea = validAreas.length ? Math.min(...validAreas) : null;
  const maxArea = validAreas.length ? Math.max(...validAreas) : null;
  const areaText = minArea !== null
    ? (minArea === maxArea
        ? `${minArea} m²`
        : `${minArea} – ${maxArea} m²`)
    : null;

  const validParks = selectedItems.map((u) => Number(u.parking_spaces)).filter((n) => !isNaN(n) && n > 0);
  const minPark = validParks.length ? Math.min(...validParks) : null;
  const maxPark = validParks.length ? Math.max(...validParks) : null;
  const parkingText = minPark !== null
    ? (minPark === maxPark
        ? `${minPark} ${minPark === 1 ? dt("parq.") : dt("parqs.")}`
        : `${minPark} – ${maxPark} ${dt("parqs.")}`)
    : null;

  const hasSpecs = Boolean(bedroomsText || bathroomsText || areaText || parkingText);

  const currency = primary?.currency || 'USD';
  const validPrices = selectedItems.map((u) => Number(u.price)).filter((n) => !isNaN(n) && n > 0);
  const minPrice = validPrices.length ? Math.min(...validPrices) : (primary?.price || 0);
  const maxPrice = validPrices.length ? Math.max(...validPrices) : (primary?.price || 0);

  const validListPrices = selectedItems.map((u) => Number(u.list_price)).filter((n) => !isNaN(n) && n > 0);
  const minListPrice = validListPrices.length ? Math.min(...validListPrices) : null;
  const maxListPrice = validListPrices.length ? Math.max(...validListPrices) : null;
  const discounted = Boolean(
    (minListPrice && minListPrice > minPrice) ||
    (maxListPrice && maxListPrice > maxPrice)
  );

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="relative min-h-0 flex-1 overflow-hidden bg-[#172033]" style={{ borderRadius: block.coverRadius || "1.45rem", border: block.showFrame === false ? "none" : "1px solid rgba(197,168,128,0.2)", boxShadow: block.showFrame === false ? "none" : "0 18px 34px rgba(15,23,42,0.16)" }}>
        {image && <Image src={image} alt={projectName} fill priority loading="eager" sizes="2048px" unoptimized={image.startsWith('data:')} className="object-cover" style={{ objectPosition: block.imagePosition || 'center' }} />}
        <div className="absolute inset-0 bg-gradient-to-t from-[#101827]/95 via-[#101827]/35 to-[#101827]/10" />
        
        {interactiveSlots && onSlotClick && (
          <button
            type="button"
            onClick={() => onSlotClick('cover')}
            className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/85 text-white text-xs font-bold backdrop-blur-md shadow-md transition-all hover:scale-105 cursor-pointer"
          >
            <ImagePlus className="w-3.5 h-3.5 text-amber-300" />
            <span>{dt("Cambiar portada")}</span>
          </button>
        )}

        <div className="absolute inset-x-[5%] top-[5%] flex items-start justify-between gap-4 text-white">
          <span className="rounded-full bg-white px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.18em] text-black shadow-xs">{block.kicker || dt("Propuesta de inversión")}</span>
          <span className="max-w-[42%] text-right text-[8px] font-black uppercase tracking-[0.2em] text-white/75">{block.proposalCode ? <>{block.proposalCode}<br /></> : 'Ref.\n'}<b className="line-clamp-2 text-white">{selectedItems.length ? selectedItems.map((item) => item.unit_name).join(' · ') : dt("Propuesta personalizada")}</b></span>
        </div>
        {block.offerTitle && (
          <div className="absolute left-[5%] top-[17%] max-w-[68%] rounded-xl border border-white/25 bg-white/92 px-3 py-2 text-[#14213d] shadow-lg backdrop-blur">
            <p className="text-[7px] font-black uppercase tracking-[0.2em] text-[var(--proposal-accent)]">{dt("Beneficio autorizado")} </p>
            <p className="mt-0.5 text-[10px] font-black">{block.offerTitle}</p>
            {block.offerText && <p className="mt-0.5 line-clamp-2 text-[8px] leading-3 text-slate-600">{block.offerText}</p>}
          </div>
        )}
        <div className="absolute inset-x-[5%] bottom-[5%] flex items-end justify-between gap-5 text-white">
          <div className="min-w-0">
            <h1 className="font-serif text-[clamp(2rem,9cqw,4.5rem)] italic leading-[0.9]" style={{ fontSize: `clamp(2rem, 9cqw, ${Math.max(titleSize, 48)}px)` }}>{block.title || projectName}</h1>
            <p className="mt-3 text-[9px] font-black uppercase tracking-[0.18em] text-white/80">{block.locationLeft || dt("Ubicación por confirmar")}</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-[1.05fr_0.95fr] gap-5 border-t border-[color:var(--proposal-border)] pt-5">
        <div className="flex flex-col justify-between">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.22em] text-slate-400">{dt("Presentado a")} </p>
            <p className="mt-1 text-base font-black uppercase tracking-tight">{dt(clientName || "Inversionista")}</p>
          </div>
          {primary && (
            <div className="mt-3">
              <div className="flex items-baseline justify-between gap-2">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.22em] text-slate-400">
                    {isMultiUnit ? dt("Unidades seleccionadas") : dt("Unidad seleccionada")}{' '}
                  </p>
                  <p className="mt-0.5 text-base font-black uppercase text-[var(--proposal-accent)]">
                    {isMultiUnit
                      ? selectedItems.map((item) => item.unit_name).filter(Boolean).join(', ')
                      : primary.unit_name}
                  </p>
                </div>
              </div>
              {hasSpecs ? (
                <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-700">
                  {bedroomsText && (
                    <div className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--proposal-border)] bg-white px-2 py-1 shadow-2xs" title={dt("Habitaciones")}>
                      <BedDouble className="h-3.5 w-3.5 text-[var(--proposal-accent)] shrink-0" strokeWidth={1.8} />
                      <span>{bedroomsText}</span>
                    </div>
                  )}
                  {bathroomsText && (
                    <div className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--proposal-border)] bg-white px-2 py-1 shadow-2xs" title={dt("Baños")}>
                      <Bath className="h-3.5 w-3.5 text-[var(--proposal-accent)] shrink-0" strokeWidth={1.8} />
                      <span>{bathroomsText}</span>
                    </div>
                  )}
                  {areaText && (
                    <div className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--proposal-border)] bg-white px-2 py-1 shadow-2xs" title={dt("Metraje total")}>
                      <Ruler className="h-3.5 w-3.5 text-[var(--proposal-accent)] shrink-0" strokeWidth={1.8} />
                      <span>{areaText}</span>
                    </div>
                  )}
                  {parkingText && (
                    <div className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--proposal-border)] bg-white px-2 py-1 shadow-2xs" title={dt("Parqueos")}>
                      <CarFront className="h-3.5 w-3.5 text-[var(--proposal-accent)] shrink-0" strokeWidth={1.8} />
                      <span>{parkingText}</span>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>
        <div className="border-l border-[color:var(--proposal-border)] pl-5">
          <p className="text-[8px] font-black uppercase tracking-[0.22em] text-slate-400">
            {isMultiUnit ? dt("Valor de las unidades") : dt("Valor de la unidad")}{' '}
          </p>
          {discounted && (
            <p className="mt-1 text-[10px] font-bold tabular-nums text-slate-400 line-through">
              {minListPrice === maxListPrice
                ? formatCurrency(minListPrice!, currency)
                : `${formatCurrency(minListPrice || minPrice, currency)} – ${formatCurrency(maxListPrice || maxPrice, currency)}`}
            </p>
          )}
          <p className={cn('text-xl font-black tabular-nums', discounted ? 'mt-0 text-[var(--proposal-accent)]' : 'mt-1')}>
            {primary
              ? minPrice === maxPrice
                ? formatCurrency(minPrice, currency)
                : `${formatCurrency(minPrice, currency)} – ${formatCurrency(maxPrice, currency)}`
              : dt("Por confirmar")}
          </p>
          <p className="mt-2 line-clamp-7 sm:line-clamp-8 text-[9px] sm:text-[9.5px] leading-[1.32] text-slate-500" style={{ fontSize: `${Math.min(bodySize, 11)}px` }}>{block.body || dt("Condiciones comerciales sujetas a confirmación.")}</p>
        </div>
      </div>
    </div>
  );
}

function Editorial({
  block,
  image,
  titleSize,
  bodySize,
  interactiveSlots,
  onSlotClick,
}: {
  block: ProposalMagazineBlock;
  image?: string;
  titleSize: number;
  bodySize: number;
  interactiveSlots?: boolean;
  onSlotClick?: (target: 'cover' | 'story' | 'storySecondary' | 'typology' | 'amenities' | 'units' | 'payment' | 'gallery') => void;
}) {
  const dt = useDocumentText();
  const additionalImage = block.images?.find((candidate) => candidate && candidate !== image);
  const part1 = block.conceptPart1?.trim() || (block.body ? block.body.split(/\n\s*\n/)[0]?.trim() : '');
  const remainingBody = block.body ? block.body.split(/\n\s*\n/).slice(1).join('\n\n').trim() : '';
  const part2 = block.conceptPart2?.trim() || remainingBody;
  const isStructured = Boolean(part1 && part2);

  return (
    <div className="flex flex-1 min-h-0 flex-col justify-between gap-4 sm:gap-5 h-full">
      <div className={cn('grid min-h-0 items-center gap-6 sm:gap-8 shrink-0', image || (interactiveSlots && onSlotClick) ? 'grid-cols-[1fr_1fr]' : 'max-w-3xl')}>
        <div className="space-y-4">
          <SectionHeading block={block} titleSize={titleSize} />
          {isStructured ? (
            <div className="space-y-3">
              <p className="line-clamp-6 text-slate-700 font-normal leading-[1.6]" style={{ fontSize: `${bodySize}px` }}>
                {part1}
              </p>
              <p className="line-clamp-8 text-slate-600 leading-[1.55]" style={{ fontSize: `${Math.max(bodySize - 0.5, 12)}px` }}>
                {part2}
              </p>
            </div>
          ) : (
            <p className="line-clamp-[12] whitespace-pre-line text-slate-600" style={{ fontSize: `${bodySize}px`, lineHeight: 1.65 }}>
              {block.body}
            </p>
          )}
          {block.extraList?.length ? (
            <ul className="space-y-2 pt-1 text-sm font-semibold">
              {block.extraList.slice(0, 5).map((entry) => (
                <li key={entry} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--proposal-accent)]" />
                  {entry}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {image ? (
          <div className="relative group h-full min-h-52 sm:min-h-56 overflow-hidden rounded-[1.25rem] border border-[color:var(--proposal-border)] bg-[#f4f6f8] shadow-sm">
            <Image
              src={image}
              alt={dt("Imagen de la propuesta")}
              fill
              loading="eager"
              sizes="1200px"
              unoptimized={image.startsWith('data:')}
              className={block.imageFit === 'contain' ? 'object-contain p-4' : 'object-cover'}
              style={{ objectPosition: block.imagePosition || 'center' }}
            />
            {interactiveSlots && onSlotClick && (
              <button
                type="button"
                onClick={() => onSlotClick('story')}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs cursor-pointer"
              >
                <ImagePlus className="w-4 h-4" />
                <span>{dt("Cambiar imagen")}</span>
              </button>
            )}
          </div>
        ) : interactiveSlots && onSlotClick ? (
          <button
            type="button"
            onClick={() => onSlotClick('story')}
            className="h-full min-h-52 sm:min-h-56 rounded-[1.25rem] border-2 border-dashed border-[color:var(--proposal-border)] bg-amber-500/5 hover:bg-amber-500/10 transition-colors flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-slate-700 cursor-pointer p-4 text-center"
          >
            <div className="w-9 h-9 rounded-full bg-white shadow-xs border border-[color:var(--proposal-border)] flex items-center justify-center text-[var(--proposal-accent)]">
              <ImagePlus className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-700">{dt("Clic para agregar imagen de concepto")}</span>
          </button>
        ) : null}
      </div>
      {additionalImage ? (
        <div className="relative group flex-1 min-h-[14rem] sm:min-h-[16rem] w-full overflow-hidden rounded-[1.1rem] border border-[color:var(--proposal-border)] bg-[#f4f6f8] shadow-sm">
          <Image
            src={additionalImage}
            alt={dt("Imagen adicional del proyecto")}
            fill
            loading="eager"
            sizes="1800px"
            unoptimized={additionalImage.startsWith('data:')}
            className={block.additionalImageFit === 'cover' ? 'object-cover' : 'object-contain p-1'}
            style={{ objectPosition: block.additionalImagePosition || 'center' }}
          />
          {interactiveSlots && onSlotClick && (
            <button
              type="button"
              onClick={() => onSlotClick('storySecondary')}
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs cursor-pointer"
            >
              <ImagePlus className="w-4 h-4" />
              <span>{dt("Cambiar imagen")}</span>
            </button>
          )}
        </div>
      ) : interactiveSlots && onSlotClick ? (
        <button
          type="button"
          onClick={() => onSlotClick('storySecondary')}
          className="flex-1 min-h-[7rem] w-full rounded-[1.1rem] border-2 border-dashed border-[color:var(--proposal-border)] bg-amber-500/5 hover:bg-amber-500/10 transition-colors flex flex-col items-center justify-center gap-1.5 text-slate-500 hover:text-slate-700 cursor-pointer p-3 text-center"
        >
          <div className="w-8 h-8 rounded-full bg-white shadow-xs border border-[color:var(--proposal-border)] flex items-center justify-center text-[var(--proposal-accent)]">
            <ImagePlus className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-700">{dt("Clic para agregar imagen secundaria")}</span>
        </button>
      ) : null}
    </div>
  );
}

function Availability({
  block,
  selectedItems,
  bodySize,
  interactiveSlots,
  onSlotClick,
}: {
  block: ProposalMagazineBlock;
  selectedItems: ProposalMagazineItem[];
  bodySize: number;
  interactiveSlots?: boolean;
  onSlotClick?: (target: 'cover' | 'story' | 'storySecondary' | 'typology' | 'amenities' | 'units' | 'payment' | 'gallery') => void;
}) {
  const dt = useDocumentText();
  const displayImage = block.image || block.images?.[0];
  return (
    <div className="flex flex-1 min-h-0 flex-col justify-between h-full gap-4">
      <div className="space-y-3.5 shrink-0">
        <SectionHeading block={block} />
        {block.body && (
          <p className="max-w-2xl text-slate-600" style={{ fontSize: `${bodySize}px`, lineHeight: 1.65 }}>
            {block.body}
          </p>
        )}
        <div className="space-y-3">
          {selectedItems.length ? (
            selectedItems.map((item, index) => {
              const discounted = Boolean(item.list_price && item.price && item.list_price > item.price);
              return (
                <div key={`${item.unit_name}-${index}`} className="overflow-hidden rounded-[1.15rem] border border-[color:var(--proposal-border)] bg-white shadow-sm">
                  <div className="flex items-center justify-between gap-4 border-b border-[color:var(--proposal-border)] px-5 py-3.5">
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-[0.22em] text-[var(--proposal-accent)]">
                        {dt("Unidad seleccionada")}
                      </p>
                      <p className="mt-0.5 text-lg font-black">{item.unit_name}</p>
                    </div>
                    <div className="text-right">
                      {discounted && (
                        <p className="text-[9px] font-bold tabular-nums text-slate-400 line-through">
                          {formatCurrency(item.list_price || 0, item.currency || 'USD')}
                        </p>
                      )}
                      <p className="text-lg font-black tabular-nums text-[var(--proposal-accent)]">
                        {formatCurrency(item.price || 0, item.currency || 'USD')}
                      </p>
                    </div>
                  </div>
                  <div className="px-5 py-3.5">
                    <UnitSpecs item={item} />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-xl border border-dashed border-[color:var(--proposal-border)] p-5 text-sm text-slate-500">
              {dt("La unidad seleccionada aparecerá aquí al crear la propuesta.")}
            </div>
          )}

          {selectedItems.length <= 2 && (
            <div className="rounded-xl border border-[color:var(--proposal-border)] bg-[#faf8f5]/85 p-3.5 text-[#14213d] shadow-xs">
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[var(--proposal-accent)]">
                {dt("Garantía de cotización")}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                {dt("Precios, condiciones de pago y disponibilidad garantizados durante el periodo de vigencia de la propuesta o hasta la formalización de la reserva.")}
              </p>
            </div>
          )}
        </div>
      </div>

      {displayImage ? (
        <div className="relative group flex-1 min-h-[14rem] sm:min-h-[16rem] w-full overflow-hidden rounded-2xl border border-[color:var(--proposal-border)] bg-[#f6f8f4] shadow-xs">
          <Image
            src={displayImage}
            alt={block.title || dt("Imagen del inventario")}
            fill
            loading="eager"
            sizes="(max-width: 768px) 100vw, 1200px"
            unoptimized={displayImage.startsWith('data:')}
            className={block.imageFit === 'contain' ? 'object-contain p-2' : 'object-cover'}
            style={{ objectPosition: block.imagePosition || 'center' }}
          />
          {interactiveSlots && onSlotClick && (
            <button
              type="button"
              onClick={() => onSlotClick('units')}
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs cursor-pointer"
            >
              <ImagePlus className="w-4 h-4" />
              <span>{dt("Cambiar imagen")}</span>
            </button>
          )}
        </div>
      ) : interactiveSlots && onSlotClick ? (
        <button
          type="button"
          onClick={() => onSlotClick('units')}
          className="flex-1 min-h-[8rem] w-full rounded-2xl border-2 border-dashed border-[color:var(--proposal-border)] bg-amber-500/5 hover:bg-amber-500/10 transition-colors flex flex-col items-center justify-center gap-1.5 text-slate-500 hover:text-slate-700 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-white shadow-xs border border-[color:var(--proposal-border)] flex items-center justify-center text-[var(--proposal-accent)]">
            <ImagePlus className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-700">{dt("Clic para agregar imagen o render aquí")}</span>
          <span className="text-[10px] text-slate-400">{dt("(Opcional — si lo dejas vacío se mantiene el espacio limpio)")}</span>
        </button>
      ) : null}
    </div>
  );
}

function Typology({
  block,
  selectedItems = [],
  bodySize,
  interactiveSlots,
  onSlotClick,
}: {
  block: ProposalMagazineBlock;
  selectedItems?: ProposalMagazineItem[];
  bodySize: number;
  interactiveSlots?: boolean;
  onSlotClick?: (target: 'cover' | 'story' | 'storySecondary' | 'typology' | 'amenities' | 'units' | 'payment' | 'gallery') => void;
}) {
  const dt = useDocumentText();
  const displayImage = block.typologyFloorPlanImage || block.image || block.images?.[0];
  const units = block.typologyUnits && block.typologyUnits.length > 0
    ? block.typologyUnits
    : (selectedItems.length > 0 && selectedItems[0].unit_name ? [selectedItems[0].unit_name] : []);
  const isSingleUnit = units.length === 1;

  return (
    <div className="flex flex-1 min-h-0 flex-col justify-between h-full gap-4">
      <div className="space-y-4 shrink-0">
        <SectionHeading block={block} />
        {(() => {
          const rawText = (block.typologyDetails || block.body || '').trim();
          const isGenericSpecs = /^\d+\s*(?:hab|rec|dorm)/i.test(rawText) && /bañ/i.test(rawText);
          const showText = rawText.length > 0 && !isGenericSpecs;
          return showText ? (
            <p className="max-w-3xl whitespace-pre-line text-slate-600 mb-4" style={{ fontSize: `${bodySize}px`, lineHeight: 1.65 }}>
              {rawText}
            </p>
          ) : null;
        })()}
        {units.length > 0 && (
          <div className="border-t border-[color:var(--proposal-border)] pt-3.5">
            <p className="text-[8px] font-black uppercase tracking-[0.22em] text-slate-400">
              {isSingleUnit ? dt("Unidad seleccionada") : dt("Unidades de esta tipología")}
            </p>
            <div className={cn("mt-2.5", isSingleUnit ? "space-y-2" : "grid gap-2.5 sm:grid-cols-2")}>
              {units.map((unit) => {
                const unitItem = selectedItems.find((it) => it.unit_name === unit) || (isSingleUnit ? selectedItems[0] : undefined);
                const rawBedrooms = unitItem?.bedrooms ?? block.typologyBedrooms;
                const rawBathrooms = unitItem?.bathrooms ?? block.typologyBathrooms;
                const rawArea = unitItem?.area_sqm ?? block.typologyAreaSqm;
                const rawParking = unitItem?.parking_spaces ?? block.typologyParkingSpaces;

                const bedrooms = rawBedrooms ?? (block.typologyDetails?.match(/(\d+)\s*(?:hab|rec|dorm)/i)?.[1] ? Number(block.typologyDetails.match(/(\d+)\s*(?:hab|rec|dorm)/i)![1]) : undefined);
                const bathrooms = rawBathrooms ?? (block.typologyDetails?.match(/(\d+(?:\.\d+)?)\s*bañ/i)?.[1] ? Number(block.typologyDetails.match(/(\d+(?:\.\d+)?)\s*bañ/i)![1]) : undefined);
                const area = rawArea ?? (block.typologyDetails?.match(/(\d+(?:\.\d+)?)\s*m²/i)?.[1] ? Number(block.typologyDetails.match(/(\d+(?:\.\d+)?)\s*m²/i)![1]) : undefined);
                const parking = rawParking ?? (block.typologyDetails?.match(/(\d+)\s*parq/i)?.[1] ? Number(block.typologyDetails.match(/(\d+)\s*parq/i)![1]) : undefined);
                const hasParking = parking !== undefined && parking !== null && Number(parking) > 0;

                const hasSpecs = bedrooms !== undefined || bathrooms !== undefined || area !== undefined || hasParking;

                return (
                  <div
                    key={unit}
                    className={cn(
                      "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[color:var(--proposal-border)] bg-white/70 px-4 py-2.5 shadow-sm backdrop-blur-sm",
                      isSingleUnit ? "py-3" : ""
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--proposal-accent)]" />
                      <span className="text-sm font-black uppercase tracking-wide text-slate-900">
                        {unit.toUpperCase().startsWith('UNIDAD') ? unit.replace(/^unidad\s+/i, `${dt("Unidad")} `) : `${dt("Unidad")} ${unit}`}
                      </span>
                    </div>

                    {hasSpecs && (
                      <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-700 sm:gap-4">
                        {bedrooms !== undefined && bedrooms !== null && (
                          <div className="flex items-center gap-1.5" title={dt("Habitaciones")}>
                            <BedDouble className="h-4 w-4 text-[var(--proposal-accent)]" strokeWidth={1.8} />
                            <span>{bedrooms} {Number(bedrooms) === 1 ? dt("hab.") : dt("habs.")}</span>
                          </div>
                        )}
                        {bathrooms !== undefined && bathrooms !== null && (
                          <div className="flex items-center gap-1.5" title={dt("Baños")}>
                            <Bath className="h-4 w-4 text-[var(--proposal-accent)]" strokeWidth={1.8} />
                            <span>{bathrooms} {Number(bathrooms) === 1 ? dt("baño") : dt("baños")}</span>
                          </div>
                        )}
                        {area !== undefined && area !== null && (
                          <div className="flex items-center gap-1.5" title={dt("Metraje")}>
                            <Ruler className="h-4 w-4 text-[var(--proposal-accent)]" strokeWidth={1.8} />
                            <span>{area} m²</span>
                          </div>
                        )}
                        {hasParking && (
                          <div className="flex items-center gap-1.5" title={dt("Parqueos")}>
                            <CarFront className="h-4 w-4 text-[var(--proposal-accent)]" strokeWidth={1.8} />
                            <span>{parking} {Number(parking) === 1 ? dt("parqueo") : dt("parqueos")}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {displayImage ? (
        <div className="relative group flex-1 min-h-[16rem] sm:min-h-[19rem] md:min-h-[22rem] w-full overflow-hidden rounded-xl border border-[color:var(--proposal-border)] bg-[#f8f9fa] flex items-center justify-center p-2">
          <Image
            src={displayImage}
            alt={`Imagen de ${block.typologyName || block.title || dt("la tipología")}`}
            fill
            loading="eager"
            sizes="1200px"
            unoptimized={displayImage.startsWith('data:') || displayImage.startsWith('http')}
            className={block.imageFit === 'cover' ? 'object-cover' : 'object-contain p-2 sm:p-4'}
            style={{ objectPosition: block.imagePosition || 'center' }}
          />
          {interactiveSlots && onSlotClick && (
            <button
              type="button"
              onClick={() => onSlotClick('typology')}
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs cursor-pointer"
            >
              <ImagePlus className="w-4 h-4" />
              <span>{dt("Cambiar plano o render")}</span>
            </button>
          )}
        </div>
      ) : interactiveSlots && onSlotClick ? (
        <button
          type="button"
          onClick={() => onSlotClick('typology')}
          className="flex-1 min-h-[10rem] w-full rounded-xl border-2 border-dashed border-[color:var(--proposal-border)] bg-amber-500/5 hover:bg-amber-500/10 transition-colors flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-slate-700 cursor-pointer p-6"
        >
          <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-[color:var(--proposal-border)] flex items-center justify-center text-[var(--proposal-accent)]">
            <ImagePlus className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-slate-700">{dt("Clic para agregar plano o render de la tipología")}</span>
        </button>
      ) : null}
    </div>
  );
}

function UnitSpecs({ item }: { item: ProposalMagazineItem }) {
  const dt = useDocumentText();
 const specs = [{ icon: BedDouble, label: dt("Habitaciones"), value: item.bedrooms }, { icon: Bath, label: dt("Baños"), value: item.bathrooms }, { icon: CarFront, label: dt("Parqueos"), value: item.parking_spaces }, { icon: Ruler, label: dt("Metraje"), value: item.area_sqm ? `${item.area_sqm} m²` : item.area_sqm }].filter((spec) => spec.value !== undefined && spec.value !== null && (spec.label !== dt("Parqueos") || Number(spec.value) > 0)); if (!specs.length) return null; return <dl className={cn('grid gap-2', specs.length >= 4 ? 'grid-cols-4' : specs.length === 3 ? 'grid-cols-3' : 'grid-cols-2')}>{specs.map(({ icon: Icon, label, value }) => <div key={label} className="border-r border-[color:var(--proposal-border)] px-2 text-center last:border-r-0"><Icon className="mx-auto h-4 w-4 text-[var(--proposal-accent)]" strokeWidth={1.7} /><dt className="mt-1 text-[7px] font-black uppercase tracking-[0.12em] text-slate-400">{label}</dt><dd className="mt-1 text-sm font-black tabular-nums">{value}</dd></div>)}</dl>; }

function Payment({
  block,
  selectedItems,
  bodySize,
  interactiveSlots,
  onSlotClick,
}: {
  block: ProposalMagazineBlock;
  selectedItems: ProposalMagazineItem[];
  bodySize: number;
  interactiveSlots?: boolean;
  onSlotClick?: (target: 'cover' | 'story' | 'storySecondary' | 'typology' | 'amenities' | 'units' | 'payment' | 'gallery') => void;
}) {
  const dt = useDocumentText();
  const locale = useContext(DocumentLocale);
  const primary = block.targetUnit || selectedItems[0];
  const displayImage = block.image || block.images?.[0];
  const calculatedSteps = primary && block.paymentSchedule ? calculateProposalPaymentSchedule(primary.price || 0, block.paymentSchedule, locale).map((step) => ({ label: step.percentage ? `${step.label} (${step.percentage}%)` : step.label, amount: formatCurrency(step.amount, primary.currency || 'USD'), detail: step.detail })) : null; const steps = calculatedSteps || (block.extraList?.length ? block.extraList : [dt("Reserva de unidad"), dt("Firma de contrato"), dt("Pago contra entrega")]).map((step) => { const [label, ...valueParts] = step.split(/[·:]/).map((part) => part.trim()); return { label, amount: valueParts.join(' · ') || dt("Por confirmar"), detail: '' }; }); 

  return (
    <div className="flex flex-1 min-h-0 flex-col justify-between h-full gap-4">
      <div className="space-y-3.5 shrink-0">
        <div className="flex items-end justify-between gap-5">
          <SectionHeading block={block} />
          <div className="shrink-0 text-right">
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">
              {block.targetUnit?.unit_name ? `${dt("Valor de la unidad")} (${block.targetUnit.unit_name})` : dt("Valor de la unidad")}{' '}
            </p>
            <p className="mt-1 text-xl font-black tabular-nums text-[var(--proposal-accent)]">{primary ? formatCurrency(primary.price || 0, primary.currency || 'USD') : dt("Por confirmar")}</p>
          </div>
        </div>
        {block.body && (
          <p className="max-w-2xl text-slate-600" style={{ fontSize: `${bodySize}px`, lineHeight: 1.65 }}>{block.body}</p>
        )}
        <div className="overflow-hidden rounded-[1.15rem] border border-[color:var(--proposal-border)] bg-white shadow-sm" suppressHydrationWarning>
          {steps.map((step, index) => (
            <div key={`${step.label}-${index}`} className="grid grid-cols-[30px_minmax(0,1fr)_auto] items-center gap-3 border-b border-[color:var(--proposal-border)] px-4 py-3.5 last:border-b-0 sm:px-5">
              <span className="grid h-7 w-7 place-items-center rounded-full border border-[var(--proposal-accent)] text-[9px] font-black text-[var(--proposal-accent)]">{index + 1}</span>
              <div className="min-w-0">
                <p className="text-sm font-black uppercase tracking-[0.03em]">{step.label}</p>
                {step.detail && <p className="mt-0.5 text-[10px] leading-4 text-slate-500" suppressHydrationWarning>{step.detail}</p>}
              </div>
              <p className="text-right text-sm font-black tabular-nums text-[var(--proposal-accent)]" suppressHydrationWarning>{step.amount}</p>
            </div>
          ))}
        </div>
      </div>

      {displayImage ? (
        <div className="relative group flex-1 min-h-[13rem] sm:min-h-[15rem] w-full overflow-hidden rounded-2xl border border-[color:var(--proposal-border)] bg-[#f6f8f4] shadow-xs">
          <Image
            src={displayImage}
            alt={block.title || dt("Plan de pagos")}
            fill
            loading="eager"
            sizes="(max-width: 768px) 100vw, 1200px"
            unoptimized={displayImage.startsWith('data:')}
            className={block.imageFit === 'contain' ? 'object-contain p-2' : 'object-cover'}
            style={{ objectPosition: block.imagePosition || 'center' }}
          />
          {interactiveSlots && onSlotClick && (
            <button
              type="button"
              onClick={() => onSlotClick('payment')}
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs cursor-pointer"
            >
              <ImagePlus className="w-4 h-4" />
              <span>{dt("Cambiar imagen")}</span>
            </button>
          )}
        </div>
      ) : interactiveSlots && onSlotClick ? (
        <button
          type="button"
          onClick={() => onSlotClick('payment')}
          className="flex-1 min-h-[8rem] w-full rounded-2xl border-2 border-dashed border-[color:var(--proposal-border)] bg-amber-500/5 hover:bg-amber-500/10 transition-colors flex flex-col items-center justify-center gap-1.5 text-slate-500 hover:text-slate-700 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-white shadow-xs border border-[color:var(--proposal-border)] flex items-center justify-center text-[var(--proposal-accent)]">
            <ImagePlus className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-700">{dt("Clic para agregar imagen o render aquí")}</span>
          <span className="text-[10px] text-slate-400">{dt("(Opcional — si lo dejas vacío se mantiene el espacio limpio)")}</span>
        </button>
      ) : null}
    </div>
  );
}

function Highlights({
  block,
  bodySize,
  interactiveSlots,
  onSlotClick,
}: {
  block: ProposalMagazineBlock;
  bodySize: number;
  interactiveSlots?: boolean;
  onSlotClick?: (target: 'cover' | 'story' | 'storySecondary' | 'typology' | 'amenities' | 'units' | 'payment' | 'gallery') => void;
}) {
  const dt = useDocumentText();
  const items = block.extraList?.length ? block.extraList : [dt("Amenidades por confirmar")];
  const columns = block.amenityColumns === 1 ? 1 : block.amenityColumns === 3 ? 3 : block.amenityColumns === 4 ? 4 : 2;
  const isPalmView = block.iconFamily === 'palm-view';
  const displayImage = block.image || block.images?.[0];
  const hasImage = Boolean(displayImage);
  const isImageTop = block.imagePosition === 'top';

  const mark = (item: string, index: number) => {
    const accent = block.amenityColor || 'var(--proposal-accent)';
    if (block.amenityIconMode === 'number') {
      return (
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[9px] font-black text-white shadow-xs" style={{ backgroundColor: accent }}>
            {index + 1}
          </span>
          {isPalmView ? (
            <PalmViewAmenityIcon
              name={block.iconSourceLabels?.[index] || item}
              className="h-4 w-4 shrink-0"
              style={{ color: accent }}
            />
          ) : null}
        </div>
      );
    }
    if (isPalmView) {
      return (
        <PalmViewAmenityIcon
          name={block.iconSourceLabels?.[index] || item}
          className="h-5 w-5 shrink-0"
          style={{ color: accent }}
        />
      );
    }
    if (block.iconFamily === 'cipres') {
      return (
        <CipresAmenityIcon
          name={block.iconSourceLabels?.[index] || item}
          className="h-5 w-5 shrink-0"
          style={{ color: accent }}
        />
      );
    }
    if (block.iconFamily === 'uve') {
      return (
        <UveAmenityIcon
          name={block.iconSourceLabels?.[index] || item}
          className="h-5 w-5 shrink-0"
          style={{ color: accent }}
        />
      );
    }
    if (block.amenityIconMode === 'check' || block.iconFamily === 'minimal') {
      return <Check className="h-4 w-4 shrink-0" style={{ color: accent }} />;
    }
    return (
      <CanaRockAmenityIcon
        iconKey={block.amenityIconMap?.[String(index)] || resolveIconKey(block.iconSourceLabels?.[index] || item)}
        className="h-5 w-5 shrink-0"
        style={{ color: accent }}
      />
    );
  };

  const maxItems = hasImage ? 14 : 18;

  return (
    <div className="flex flex-1 min-h-0 flex-col justify-between h-full gap-4">
      <div className="space-y-3.5 shrink-0">
        <SectionHeading block={block} />
        {block.body ? (
          <p className="max-w-2xl text-slate-600" style={{ fontSize: `${bodySize}px`, lineHeight: 1.55 }}>
            {block.body}
          </p>
        ) : null}

        {hasImage && displayImage && isImageTop && (
          <div className="relative group aspect-[16/8] sm:aspect-[16/7.5] w-full overflow-hidden rounded-2xl border border-[color:var(--proposal-border)] bg-[#f6f8f4] shadow-xs">
            <Image
              src={displayImage}
              alt={block.title || dt("Plano y amenidades")}
              fill
              loading="eager"
              sizes="(max-width: 768px) 100vw, 1200px"
              unoptimized={displayImage.startsWith('data:')}
              className={block.imageFit === 'contain' ? 'object-contain p-2' : 'object-cover'}
              style={{ objectPosition: block.imagePosition && block.imagePosition !== 'top' ? block.imagePosition : 'center' }}
            />
            {interactiveSlots && onSlotClick && (
              <button
                type="button"
                onClick={() => onSlotClick('amenities')}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs cursor-pointer"
              >
                <ImagePlus className="w-4 h-4" />
                <span>{dt("Cambiar imagen")}</span>
              </button>
            )}
          </div>
        )}

        <div className={cn('grid gap-2 sm:gap-2.5', columns === 1 ? 'grid-cols-1' : columns === 2 ? 'grid-cols-2' : columns === 3 ? 'grid-cols-3' : 'grid-cols-4')}>
          {items.slice(0, maxItems).map((item, index) => (
            <div
              key={`${item}-${index}`}
              className={cn(
                'flex items-center gap-2.5 border border-[color:var(--proposal-border)] bg-white',
                block.amenityStyle === 'list'
                  ? 'border-x-0 border-t-0 px-1 py-2'
                  : block.amenityStyle === 'pills'
                  ? 'min-h-10 rounded-lg px-3 py-2'
                  : hasImage
                  ? 'min-h-11 rounded-xl p-2.5 shadow-2xs'
                  : 'min-h-14 rounded-xl p-3 shadow-sm'
              )}
            >
              <span>{mark(item, index)}</span>
              <span className="text-xs sm:text-[13px] font-semibold leading-tight line-clamp-2">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {hasImage && displayImage && !isImageTop && (
        <div className="relative group flex-1 min-h-[14rem] sm:min-h-[16rem] w-full overflow-hidden rounded-2xl border border-[color:var(--proposal-border)] bg-[#f6f8f4] shadow-xs">
          <Image
            src={displayImage}
            alt={block.title || dt("Plano y amenidades")}
            fill
            loading="eager"
            sizes="(max-width: 768px) 100vw, 1200px"
            unoptimized={displayImage.startsWith('data:')}
            className={block.imageFit === 'contain' ? 'object-contain p-2' : 'object-cover'}
            style={{ objectPosition: block.imagePosition && block.imagePosition !== 'top' ? block.imagePosition : 'center' }}
          />
          {interactiveSlots && onSlotClick && (
            <button
              type="button"
              onClick={() => onSlotClick('amenities')}
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs cursor-pointer"
            >
              <ImagePlus className="w-4 h-4" />
              <span>{dt("Cambiar imagen")}</span>
            </button>
          )}
        </div>
      )}

      {!hasImage && interactiveSlots && onSlotClick && (
        <button
          type="button"
          onClick={() => onSlotClick('amenities')}
          className="flex-1 min-h-[8rem] w-full rounded-2xl border-2 border-dashed border-[color:var(--proposal-border)] bg-amber-500/5 hover:bg-amber-500/10 transition-colors flex flex-col items-center justify-center gap-1.5 text-slate-500 hover:text-slate-700 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-full bg-white shadow-xs border border-[color:var(--proposal-border)] flex items-center justify-center text-[var(--proposal-accent)]">
            <ImagePlus className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold text-slate-700">{dt("Clic para agregar imagen o render de amenidades")}</span>
          <span className="text-[10px] text-slate-400">{dt("(Opcional — si lo dejas vacío se mantiene el espacio limpio)")}</span>
        </button>
      )}
    </div>
  );
}

function FloorPlan({ block, image, titleSize, bodySize }: { block: ProposalMagazineBlock; image?: string; titleSize: number; bodySize: number }) {
  const dt = useDocumentText();
 const plans = (block.images?.filter(Boolean).slice(0, 2) || []).length ? block.images!.filter(Boolean).slice(0, 2) : image ? [image] : []; return <div className="space-y-6"><SectionHeading block={block} titleSize={titleSize} /><p className="max-w-2xl text-slate-600" style={{ fontSize: `${bodySize}px`, lineHeight: 1.65 }}>{block.body}</p>{plans.length ? <div className={cn('grid overflow-hidden rounded-xl border border-[color:var(--proposal-border)] bg-white', plans.length > 1 ? 'grid-cols-2' : 'grid-cols-1')}>{plans.map((plan, index) => <div key={`${plan}-${index}`} className={cn('relative min-h-72', index > 0 && 'border-l border-[color:var(--proposal-border)]')}><Image src={plan} alt={dt("Plano técnico de la unidad")} fill loading="eager" sizes={plans.length > 1 ? '360px' : '720px'} unoptimized={plan.startsWith('data:')} className="object-contain p-5" /></div>)}</div> : <div className="grid min-h-72 place-items-center rounded-xl border border-dashed border-[color:var(--proposal-border)] text-center text-sm text-slate-500">{dt("Selecciona uno o dos planos desde la biblioteca de medios.")} </div>}</div>; }

function Location({ block, image, titleSize, bodySize }: { block: ProposalMagazineBlock; image?: string; titleSize: number; bodySize: number }) {
  const dt = useDocumentText();
 return <div className="grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] items-center gap-8"><div className="space-y-6"><SectionHeading block={block} titleSize={titleSize} /><p className="whitespace-pre-line text-slate-600" style={{ fontSize: `${bodySize}px`, lineHeight: 1.65 }}>{block.body}</p>{block.extraList?.length ? <div className="space-y-3 border-t border-[color:var(--proposal-border)] pt-5">{block.extraList.slice(0, 5).map((item) => <p key={item} className="flex items-center gap-3 text-sm font-bold"><MapPin className="h-4 w-4 text-[var(--proposal-accent)]" />{item}</p>)}</div> : null}</div><div className="relative min-h-80 overflow-hidden rounded-xl border border-[color:var(--proposal-border)] bg-[#f4f6f8]">{image ? <Image src={image} alt={dt("Ubicación del proyecto")} fill loading="eager" sizes="440px" unoptimized={image.startsWith('data:')} className={block.imageFit === 'contain' ? 'object-contain p-4' : 'object-cover'} style={{ objectPosition: block.imagePosition || 'center' }} /> : <div className="grid h-full place-items-center text-sm text-slate-500">{dt("Selecciona el mapa o imagen de ubicación.")} </div>}</div></div>; }

function Contact({ block, agencyName, brokerName, brokerPhone, brokerEmail, brokerAvatarUrl, brokerProfessionalTitle, bodySize }: { block: ProposalMagazineBlock; agencyName?: string; brokerName?: string; brokerPhone?: string; brokerEmail?: string; brokerAvatarUrl?: string | null; brokerProfessionalTitle?: string | null; bodySize: number }) {
  const dt = useDocumentText();

  return <div className="flex h-full flex-col items-center justify-center space-y-6">
    <SectionHeading block={block} />
    <p className="max-w-2xl text-center whitespace-pre-line text-slate-600" style={{ fontSize: `${bodySize}px`, lineHeight: 1.65 }}>{block.body}</p>
    <div className="flex w-full max-w-lg flex-col items-center gap-5 rounded-2xl border border-[color:var(--proposal-border)] bg-white px-8 py-7 shadow-sm">
      {brokerAvatarUrl ? <Image src={brokerAvatarUrl} alt={brokerName || dt("Asesor")} width={112} height={112} loading="eager" unoptimized={brokerAvatarUrl.startsWith('data:') || brokerAvatarUrl.startsWith('http')} className="h-24 w-24 rounded-full border-2 border-[color:var(--proposal-border)] object-cover" /> : <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-[color:var(--proposal-border)] bg-[#f8f4ec] text-3xl font-black text-[var(--proposal-accent)]">{(brokerName || agencyName || 'A').slice(0, 1)}</div>}
      <div className="text-center">
        <p className="text-lg font-black">{brokerName || dt("Asesor inmobiliario")}</p>
        <p className="mt-1 text-xs font-bold uppercase tracking-[0.15em] text-[var(--proposal-accent)]">{brokerProfessionalTitle || dt("Asesor inmobiliario")}</p>
        <p className="mt-1 text-xs text-slate-500">{agencyName || dt("Equipo comercial")}</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-semibold text-slate-600">
        <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-[var(--proposal-accent)]" />{brokerPhone || dt("Contacto disponible a solicitud")}</span>
        {brokerEmail && <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-[var(--proposal-accent)]" />{brokerEmail}</span>}
      </div>
    </div>
  </div>;
}
