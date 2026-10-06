'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import Image from '@/components/ui/OptimizedImage';
import Link from 'next/link';
import React, { ChangeEvent, Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AlignLeft, ArrowLeft, BadgeCheck, Bath, BedDouble, Calendar, Car, Check, CheckCircle2, ChevronDown, ChevronUp, CircleDollarSign, Copy, CreditCard, Download, ExternalLink, Eye, FileText, GalleryHorizontalEnd, GripVertical, Home, ImageIcon, Layers, LayoutGrid, ListChecks, ListOrdered, LoaderCircle, Mail, MapPin, Maximize2, Monitor, PanelTop, Palette, Plus, Redo2, RefreshCcw, RotateCcw, Save, Scale, Search, Share2, ShieldAlert, Sliders, Smartphone, TrendingUp, Trash2, Type, Undo2, Upload, UserRound, X } from 'lucide-react';
import { useBrand } from '@/components/branding/BrandProvider';
import { requestConfirmation } from '@/components/feedback/AppNotifications';
import type { PortalProject } from '@/lib/portal-projects';
import { cn, formatCurrency } from '@/lib/utils';
import { saveDossierAction, saveProposalAction, summarizeProposalConceptAction } from '@/app/portal/proposals/actions';
import { isCanaRockProject, derivePricingCards } from '@/lib/portal/cana-rock-dossier';
import { buildDossierTemplate } from '@/lib/portal/dossier-template';
import { CanaRockAmenityIcon, CANA_ROCK_ICON_OPTIONS, resolveIconKey } from '@/components/branding/CanaRockAmenityIcon';
import { UVE_RESIDENCES_AMENITIES } from '@/lib/data/uve-residences';
import { UVE_RESIDENCES_CANONICAL_UNITS } from '@/lib/data/uve-units';
import { UVE_RESIDENCES_TYPOLOGIES, CIPRES_RESIDENCES_TYPOLOGIES } from '@/lib/data/cipres-typologies';
import { CORAL_GOLF_RESORT_AMENITIES, PALM_VIEW_EXCLUSIVE_AMENITIES } from '@/components/branding/PalmViewAmenityIcon';
import { exportPresentationToPdf } from '@/lib/export/presentation-pdf';
import MagazineSlide, { type PaymentPlanScheme, buildDefaultPaymentPlans } from '@/components/presentations/MagazineSlide';
import { ProposalMagazinePage } from '@/components/presentations/ProposalMagazinePage';
import { ScaledSlideSheet } from '@/components/presentations/ScaledProposalSheet';
import { computeProjectCoverSpecs, type CoverSpecs } from '@/lib/portal/project-cover-specs';
import type { MultiPropertyProposal } from '@/types/proposals';
import type { Json } from '@/types/database';
import type { ProposalPaymentSchedule } from '@/lib/proposals/payment-schedule';


export type CanvasRatio = '1120x820' | 'portrait' | '1920x1080';
type PresentationKind = 'dossier' | 'proposal';
type TemplateId = 'editorial' | 'minimal' | 'investment' | 'panorama';
type BlockType = 'cover' | 'index' | 'text' | 'image' | 'gallery' | 'highlights' | 'stats' | 'availability' | 'payment' | 'floorplan' | 'location' | 'documents' | 'banking' | 'disclaimer' | 'contact' | 'typologies';
type LayoutId = 'full' | 'split-left' | 'split-right' | 'vertical-top' | 'vertical-bottom';
type EditorTab = 'pages' | 'blocks' | 'elements' | 'media' | 'styles';
type InspectorTab = 'content' | 'design' | 'media' | 'elements';

export type ProposalRecipient = {
  id: number;
  fullName: string;
  email: string | null;
  phone: string;
  classification?: string | null;
};

export type TypologyCard = {
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
};

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

export type Block = {
  id: string;
  type: BlockType;
  title: string;
  body: string;
  kicker: string;
  hidden?: boolean;
  layout: LayoutId;
  backgroundType: 'solid' | 'image' | 'gradient';
  backgroundColor: string;
  gradientColor2?: string;
  textColor: string;
  accentColor: string;
  fontFamily?: 'sans' | 'serif' | 'mono';
  kickerSize?: number;
  metricValueSize?: number;
  customStats?: {
    stat1Label?: string;
    stat1Value?: string;
    stat2Label?: string;
    stat2Value?: string;
    stat3Label?: string;
    stat3Value?: string;
    stat4Label?: string;
    stat4Value?: string;
  };
  image?: string;
  images?: string[];
  secondaryImage?: string;
  secondaryImageFit?: 'cover' | 'contain';
  secondaryImagePosition?: string;
  imageFit: 'cover' | 'contain';
  imagePosition: string;
  overlayOpacity: number;
  titleSize: number;
  bodySize: number;
  padding: number;
  minHeight: number;
  showDisclaimer: boolean;
  disclaimer: string;
  disclaimerColor: string;
  disclaimerSize: number;
  amenityStyle?: 'cards' | 'list' | 'pills';
  amenityColumns?: 1 | 2 | 3 | 4;
  amenityIconMode?: 'auto' | 'check' | 'number';
  amenityColor?: string;
  subHeader?: string;
  locationLeft?: string;
  locationRight?: string;
  projectLogoUrl?: string;
  projectLogoSize?: number;
  showDeveloperLogo?: boolean;
  showComplexBadge?: boolean;
  complexBadgeText?: string;
  complexBadgeLogoUrl?: string;
  showBrokerLogo?: boolean;
  brokerLogoSize?: number;
  hideBrokerDetails?: boolean;
  brokerLogoVariant?: 'normal' | 'white';
  copyContactBackgroundColor?: string;
  customBrokerLogoUrl?: string;
  hideFooter?: boolean;
  hidePageContent?: boolean;
  customFooterText?: string;
  footerTextColor?: string;
  footerMode?: 'text' | 'logo' | 'logo-white';
  extraList?: string[];
  amenityIconMap?: Record<string, string>;
  partnerLogos?: boolean;
  isMapSlide?: boolean;
  isAmenitiesSlide?: boolean;
  isW2mSlide?: boolean;
  isMasterPlanSlide?: boolean;
  isFloatingCard?: boolean;
  isPricingSlide?: boolean;
  pricingCards?: { title: string; price: number; kicker?: string }[];
  paymentPlans?: PaymentPlanScheme[];
  paymentSchedule?: ProposalPaymentSchedule;
  isGallerySlide?: boolean;
  imageExpand?: boolean;
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
};

const templates: { id: TemplateId; name: string; description: string; preview: string }[] = [
  { id: 'editorial', name: 'Editorial', description: 'Ritmo de revista y portadas con carácter.', preview: 'bg-[#0a1140]' },
  { id: 'minimal', name: 'Minimal', description: 'Mucho blanco y lectura ejecutiva.', preview: 'border border-slate-200 bg-white' },
  { id: 'investment', name: 'Inversión', description: 'Métricas, retorno y datos primero.', preview: 'bg-gradient-to-br from-[#0a1140] to-[#c5a880]' },
  { id: 'panorama', name: 'Panorama', description: 'Fotografía amplia y narrativa inmersiva.', preview: 'bg-gradient-to-r from-[#0a1140] to-[#c5a880]' },
];

const palette: { type: BlockType; label: string; icon: typeof Type }[] = [
  { type: 'cover', label: 'Portada', icon: ImageIcon },
  { type: 'index', label: 'Índice de contenido', icon: ListOrdered },
  { type: 'text', label: 'Narrativa', icon: AlignLeft },
  { type: 'image', label: 'Imagen', icon: ImageIcon },
  { type: 'gallery', label: 'Galería / Mosaico', icon: GalleryHorizontalEnd },
  { type: 'highlights', label: 'Amenidades', icon: ListChecks },
  { type: 'typologies', label: 'Tipologías', icon: Home },
  { type: 'stats', label: 'Cifras clave', icon: TrendingUp },
  { type: 'availability', label: 'Disponibilidad', icon: LayoutGrid },
  { type: 'payment', label: 'Plan de pago', icon: CreditCard },
  { type: 'floorplan', label: 'Plano de unidad', icon: PanelTop },
  { type: 'location', label: 'Ubicación', icon: MapPin },
  { type: 'documents', label: 'Documentos', icon: FileText },
  { type: 'banking', label: 'Datos bancarios', icon: CircleDollarSign },
  { type: 'disclaimer', label: 'Disclaimer', icon: Scale },
  { type: 'contact', label: 'Tarjeta del asesor', icon: UserRound },
];

const defaultDisclaimer = 'Información de carácter ilustrativo y sujeta a cambios sin previo aviso. Precios, disponibilidad, terminaciones y condiciones comerciales deben ser confirmados antes de formalizar cualquier operación.';

function cleanProposalLocation(value?: string | null) {
  return (value || '')
    .replace(/[\u{1F1E6}-\u{1F1FF}\u{1F300}-\u{1FAFF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function proposalAmenitiesFor(project: PortalProject) {
  if (project.amenities.length) return project.amenities;
  if (project.slug === 'palm-view') return [...PALM_VIEW_EXCLUSIVE_AMENITIES];
  if (project.slug === 'uve-residences') return [...UVE_RESIDENCES_AMENITIES];
  return project.highlights;
}

function buildTypologyCards(project: PortalProject): TypologyCard[] {
  let typologies = project.typologies || [];
  if (!typologies.length) {
    if (project.slug === 'uve-residences') {
      typologies = Object.values(UVE_RESIDENCES_TYPOLOGIES).map((t) => ({
        id: t.id,
        key: t.key,
        name: t.name,
        bedrooms: t.bedrooms,
        bathrooms: t.bathrooms,
        totalSqm: t.constructionAreaSqm,
        startingPrice: t.startingPrice,
        parkingSpaces: t.parkingSpaces,
        image: t.image,
        floorPlanImage: t.floorPlanImage,
      }));
    } else if (project.slug === 'cipres-residences') {
      typologies = Object.values(CIPRES_RESIDENCES_TYPOLOGIES).map((t) => ({
        id: t.id,
        key: t.key,
        name: t.name,
        bedrooms: t.bedrooms,
        bathrooms: t.bathrooms,
        totalSqm: t.constructionAreaSqm,
        startingPrice: t.startingPrice,
        parkingSpaces: t.parkingSpaces,
        image: t.image,
        floorPlanImage: t.floorPlanImage,
      }));
    }
  }
  if (!typologies.length) return [];

  const rawUnits = (project.units && project.units.length > 0)
    ? project.units
    : (project.slug === 'uve-residences' ? UVE_RESIDENCES_CANONICAL_UNITS : []);

  const norm = (s?: string | null) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  return typologies.map((t) => {
    const tNormName = norm(t.name);
    const tNormKey = norm(t.key);
    const tNormId = norm(t.id);

    const isMatch = (u: (typeof rawUnits)[number]) => {
      const uTypeId = norm(u.typologyId);
      const uType = norm(u.type);
      const uUnit = norm(u.unit);

      // Direct match
      if (tNormId && (uTypeId === tNormId || uType === tNormId)) return true;
      if (tNormKey && (uTypeId === tNormKey || uType === tNormKey)) return true;

      // Containment match
      if (tNormName && (uType.includes(tNormName) || tNormName.includes(uType))) return true;

      // English / Spanish variant match (e.g. type-b vs tipo-b)
      const tTipo = tNormName.replace('type', 'tipo');
      const uTipo = uType.replace('type', 'tipo');
      if (tTipo && (uTipo.includes(tTipo) || tTipo.includes(uTipo))) return true;

      const tTypeWord = tNormName.replace('tipo', 'type');
      const uTypeWord = uType.replace('tipo', 'type');
      if (tTypeWord && (uTypeWord.includes(tTypeWord) || tTypeWord.includes(uTypeWord))) return true;

      // Area match if bedrooms match
      if (t.totalSqm > 0 && u.area > 0 && Math.abs(t.totalSqm - u.area) <= 2 && t.bedrooms === u.bedrooms) {
        return true;
      }

      return false;
    };

    const matchingUnits = rawUnits.filter(isMatch);
    const availableUnits = matchingUnits.filter(
      (u) => (u.status || '').toLowerCase() === 'disponible' || (u.status || '').toLowerCase() === 'available'
    );

    let minPrice: number | undefined = undefined;

    if (availableUnits.length > 0) {
      const prices = availableUnits.map((u) => Number(u.price || 0)).filter((p) => p > 0);
      if (prices.length > 0) minPrice = Math.min(...prices);
    }
    if (!minPrice && matchingUnits.length > 0) {
      const prices = matchingUnits.map((u) => Number(u.price || 0)).filter((p) => p > 0);
      if (prices.length > 0) minPrice = Math.min(...prices);
    }
    if (!minPrice && typeof t.startingPrice === 'number' && t.startingPrice > 0) {
      minPrice = t.startingPrice;
    }

    // Specific fallbacks for known canonical projects if not yet matched
    if (!minPrice && project.slug === 'uve-residences') {
      const combined = (t.name + ' ' + (t.key || '') + ' ' + (t.id || '')).toLowerCase();
      if (combined.includes('b') || combined.includes('115')) {
        minPrice = 181000;
      } else if (combined.includes('a') || combined.includes('96')) {
        minPrice = 144400;
      }
    }

    return {
      id: t.id,
      name: t.name,
      image: t.image || t.floorPlanImage,
      bedrooms: t.bedrooms,
      bathrooms: t.bathrooms,
      area: t.totalSqm,
      parking: t.parkingSpaces,
      minPrice: minPrice && minPrice > 0 ? minPrice : undefined,
    };
  });
}

function computeProjectStats(project: PortalProject) {
  const availableUnits = project.units ? project.units.filter((u) => u.status === 'Disponible') : [];
  const totalUnits = project.units ? project.units.length : 0;
  
  const minPrice = availableUnits.length > 0
    ? Math.min(...availableUnits.map((u) => u.price))
    : (project.startingPrice ?? 0);

  const priceText = minPrice > 0
    ? `US$ ${Math.round(minPrice).toLocaleString('en-US')}`
    : 'Consultar';

  const locationText = cleanProposalLocation(project.location) || 'Punta Cana';
  const availableText = availableUnits.length > 0
    ? `${availableUnits.length} ${availableUnits.length === 1 ? 'unidad' : 'unidades'}`
    : totalUnits > 0
    ? `${totalUnits} unidades`
    : 'Consultar';

  const deliveryText = project.delivery || project.deliveryDate || 'En construcción';

  return {
    stat1Label: 'Desde',
    stat1Value: priceText,
    stat2Label: 'Ubicación',
    stat2Value: locationText,
    stat3Label: 'Disponibles',
    stat3Value: availableText,
    stat4Label: 'Entrega',
    stat4Value: deliveryText,
  };
}

function normalizeProposalBlocks(blocks: Block[], kind: PresentationKind, project: PortalProject) {
  if (kind === 'dossier') return blocks;
  const isCanaRock = isCanaRockProject(project);
  return blocks.map((block) => {
    const next = {
      ...block,
      locationLeft: block.locationLeft ? cleanProposalLocation(block.locationLeft) : block.locationLeft,
    };
    if (next.type === 'cover') {
      if (!isCanaRock) {
        if (!next.projectLogoUrl || next.projectLogoUrl.includes('canarock') || next.projectLogoUrl.includes('logo-stelar')) {
          next.projectLogoUrl = projectLogoForProposal(project);
        }
        if (next.kicker === 'GRUPO CANA ROCK' || next.kicker === 'PRESENTACION' || next.kicker === 'PRESENTACIÓN' || next.kicker === 'Presentación privada' || next.kicker === 'Dossier comercial') {
          next.kicker = '';
        }
        if (next.subHeader === 'BROCHURE OFICIAL DE VENTAS' || next.subHeader === '31' || (next.subHeader && /^\d+$/.test(next.subHeader.trim()))) {
          next.subHeader = '';
        }
        if (!next.locationLeft || next.locationLeft === 'Cana Bay, Punta Cana') {
          next.locationLeft = cleanProposalLocation(project.location);
        }
        if (!next.locationRight || next.locationRight === 'Diciembre 2027' || next.locationRight === 'Listo para Entrega') {
          next.locationRight = project.delivery || project.deliveryDate || '';
        }
        next.coverSpecs = next.coverSpecs || computeProjectCoverSpecs(project);
      } else {
        if (!next.locationLeft) {
          next.locationLeft = cleanProposalLocation(project.location) || 'Cana Bay, Punta Cana';
        }
        if (!next.locationRight) {
          next.locationRight = project.delivery || project.deliveryDate || 'Diciembre 2027';
        }
        next.coverSpecs = next.coverSpecs || computeProjectCoverSpecs(project);
      }
    }
    if (next.type === 'availability') {
      const typCards = buildTypologyCards(project);
      if (typCards.length > 0) {
        next.type = 'typologies';
        next.title = next.title === 'Catálogo de unidades' ? 'Tipologías disponibles' : next.title;
        next.kicker = next.kicker === 'Inventario dinámico' ? 'Catálogo de tipologías' : next.kicker;
        next.typologyCards = next.typologyCards || typCards;
        next.typologyLayout = next.typologyLayout || (typCards.length === 1 ? 1 : typCards.length <= 2 ? 2 : 3) as (1 | 2 | 3);
      } else {
        next.type = 'stats';
        next.title = next.title === 'Catálogo de unidades' ? 'Una inversión con fundamentos' : next.title;
        next.kicker = next.kicker === 'Inventario dinámico' ? 'Resumen ejecutivo' : next.kicker;
        next.customStats = computeProjectStats(project);
      }
    }
    if (next.type === 'typologies') {
      const freshCards = buildTypologyCards(project);
      if (freshCards.length > 0) {
        if (!next.typologyCards || next.typologyCards.length === 0) {
          next.typologyCards = freshCards;
        } else {
          const norm = (s?: string | null) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          next.typologyCards = next.typologyCards.map((card, idx) => {
            const cardNorm = norm(card.name);
            const match = freshCards.find((fc) => {
              const fcNorm = norm(fc.name);
              return (
                fc.id === card.id ||
                fcNorm === cardNorm ||
                (cardNorm.includes('b') && fcNorm.includes('b')) ||
                (cardNorm.includes('a') && fcNorm.includes('a'))
              );
            }) || freshCards[idx];

            return {
              ...card,
              minPrice: (card.minPrice && card.minPrice > 0) ? card.minPrice : match?.minPrice,
              image: card.image || match?.image,
            };
          });
        }
      }
    }
    if (next.type === 'stats') {
      const defaultStats = computeProjectStats(project);
      next.customStats = {
        stat1Label: next.customStats?.stat1Label || defaultStats.stat1Label,
        stat1Value: next.customStats?.stat1Value && next.customStats.stat1Value !== '—' ? next.customStats.stat1Value : defaultStats.stat1Value,
        stat2Label: next.customStats?.stat2Label || defaultStats.stat2Label,
        stat2Value: next.customStats?.stat2Value && next.customStats.stat2Value !== '—' ? next.customStats.stat2Value : defaultStats.stat2Value,
        stat3Label: next.customStats?.stat3Label || defaultStats.stat3Label,
        stat3Value: next.customStats?.stat3Value && next.customStats.stat3Value !== '—' ? next.customStats.stat3Value : defaultStats.stat3Value,
        stat4Label: next.customStats?.stat4Label || defaultStats.stat4Label,
        stat4Value: next.customStats?.stat4Value && next.customStats.stat4Value !== '—' ? next.customStats.stat4Value : defaultStats.stat4Value,
      };
    }
    return next;
  });
}

function projectLogoForProposal(project: PortalProject) {
  if (project.slug === 'palm-view') return '/projects/palm-view/logo-horizontal.svg';
  if (project.slug === 'elements') return '/images/projects/elements/logo-horizontal.png';
  if (project.slug === 'uve-residences') return '/projects/uve-residences/logo.png';
  if (project.slug === 'cipres-residences') return '/projects/cipres-residences/logo.png';
  if (isCanaRockProject(project)) return '/canarock-logo.png';
  return project.landingTheme?.logoUrl || project.brandProfile?.logoUrl || undefined;
}

function removeAmenityIconAtIndex(iconMap: Record<string, string> | undefined, removedIndex: number) {
  return Object.fromEntries(Object.entries(iconMap || {}).flatMap(([key, value]) => {
    const index = Number(key);
    if (!Number.isInteger(index) || index < 0) return [[key, value]];
    if (index === removedIndex) return [];
    return [[String(index > removedIndex ? index - 1 : index), value]];
  }));
}

async function uploadPresentationImage(file: File, category = 'slides') {
  const extension = (file.name.split('.').pop() || file.type.split('/').pop() || 'jpg').toLowerCase();
  const safeExtension = ['jpg', 'jpeg', 'png', 'webp', 'svg', 'avif'].includes(extension) ? extension : 'jpg';
  const path = `presentations/${category}/${crypto.randomUUID()}.${safeExtension}`;
  const supabase = createClient();
  const { data, error } = await supabase.storage.from('public-assets').upload(path, file, {
    cacheControl: '3600',
    contentType: file.type || 'image/jpeg',
    upsert: false,
  });
  if (error || !data) throw new Error(error?.message || 'No fue posible guardar la imagen.');
  const { data: { publicUrl } } = supabase.storage.from('public-assets').getPublicUrl(path);
  return publicUrl;
}

async function uploadEmbeddedImages<T>(value: T, uploadedImages = new Map<string, Promise<string>>()): Promise<T> {
  if (typeof value === 'string') {
    if (!/^data:image\//i.test(value)) return value;
    let uploaded = uploadedImages.get(value);
    if (!uploaded) {
      uploaded = (async () => {
        const response = await fetch(value);
        const blob = await response.blob();
        const contentType = response.headers.get('content-type') || blob.type || 'image/png';
        const extension = contentType.split('/')[1]?.split(/[+;]/)[0] || 'png';
        return uploadPresentationImage(new File([blob], `imagen.${extension}`, { type: contentType }));
      })();
      uploadedImages.set(value, uploaded);
    }
    return await uploaded as T;
  }
  if (Array.isArray(value)) return await Promise.all(value.map((item) => uploadEmbeddedImages(item, uploadedImages))) as T;
  if (value && typeof value === 'object') {
    const entries = await Promise.all(Object.entries(value as Record<string, unknown>).map(async ([key, item]) => [key, await uploadEmbeddedImages(item, uploadedImages)] as const));
    return Object.fromEntries(entries) as T;
  }
  return value;
}

function makeBlock(type: BlockType, project: PortalProject, seed = Date.now()): Block {
  const isCanaRock = isCanaRockProject(project);
  const defaults: Record<BlockType, Pick<Block, 'title' | 'body' | 'kicker'>> = {
    cover: {
      title: project.name,
      body: project.shortDescription,
      kicker: isCanaRock ? 'GRUPO CANA ROCK' : '',
    },
    index: {
      title: 'Contenido',
      body: '',
      kicker: 'Estructura del dossier',
    },
    text: { title: 'Concepto', body: project.description, kicker: 'El proyecto' },
    image: { title: 'Una experiencia diseñada alrededor de usted', body: 'Una mirada al estilo de vida, la arquitectura y el entorno del proyecto.', kicker: 'Experiencia visual' },
    gallery: { title: 'Explora cada detalle', body: 'Arquitectura, interiores y amenidades seleccionadas.', kicker: 'Galería del proyecto' },
    highlights: { title: 'Estilo de vida', body: '', kicker: 'Catálogo de servicios' },
    stats: { title: 'Una inversión con fundamentos', body: 'Datos principales del proyecto y de la oportunidad comercial.', kicker: 'Resumen ejecutivo' },
    availability: { title: 'Catálogo de unidades', body: 'Disponibilidad y precios vigentes al momento de emisión.', kicker: 'Inventario dinámico' },
    payment: { title: 'Plan de pagos', body: 'Un esquema flexible para acompañar su inversión.', kicker: 'Inversión inteligente' },
    floorplan: { title: 'Distribución de la unidad', body: 'Revise la distribución, los espacios y las dimensiones principales de la unidad seleccionada.', kicker: 'Planos arquitectónicos' },
    location: { title: 'Una ubicación para vivir y conectar', body: 'Conozca el entorno, las conexiones y los puntos de interés alrededor de este proyecto.', kicker: 'Ubicación estratégica' },
    documents: { title: 'Documentos del proyecto', body: 'Material comercial, técnico y legal disponible.', kicker: 'Centro documental' },
    banking: { title: 'Instrucciones bancarias', body: 'Los datos sensibles se presentan de forma protegida y deben validarse antes de realizar cualquier transferencia.', kicker: 'Información confidencial' },
    disclaimer: { title: 'Información importante', body: defaultDisclaimer, kicker: 'Aviso legal' },
    contact: { title: 'Hablemos de su próxima inversión', body: 'Nuestro equipo está listo para acompañarle en cada etapa.', kicker: 'Atención personalizada' },
    typologies: { title: 'Tipologías disponibles', body: 'Encuentra la unidad que se adapta a tu estilo de vida y presupuesto.', kicker: 'Catálogo de tipologías' },
  };
  return {
    id: `${type}-${seed}`,
    type,
    ...defaults[type],
    subHeader: type === 'cover' ? (isCanaRock ? 'BROCHURE OFICIAL DE VENTAS' : '') : undefined,
    locationLeft: type === 'cover' ? cleanProposalLocation(project.location) : undefined,
    locationRight: type === 'cover' ? (project.delivery || project.deliveryDate || '') : undefined,
    projectLogoUrl: type === 'cover' ? projectLogoForProposal(project) : undefined,
    coverSpecs: type === 'cover' ? computeProjectCoverSpecs(project) : undefined,
    typologyCards: type === 'typologies' ? buildTypologyCards(project) : undefined,
    typologyLayout: type === 'typologies' ? (project.typologies && project.typologies.length === 1 ? 1 : project.typologies && project.typologies.length <= 2 ? 2 : 3) as (1 | 2 | 3) : undefined,
    paymentPlans: type === 'payment' ? buildDefaultPaymentPlans(project) : undefined,
    showBrokerLogo: true,
    layout: type === 'cover' ? 'split-right' : type === 'image' ? 'full' : type === 'floorplan' ? 'full' : 'vertical-top',
    backgroundType: type === 'contact' ? 'image' : 'solid',
    backgroundColor: type === 'contact' ? '#0c094e' : '#ffffff',
    textColor: type === 'contact' ? '#ffffff' : '#111827',
    accentColor: project.brandProfile?.accentColor || project.landingTheme?.accentColor || '#2563eb',
    image: type === 'floorplan' ? undefined : project.image,
    images: type === 'floorplan' ? [] : [project.image, ...project.gallery],
    galleryGrid: 'one-top-two',
    galleryGap: 12,
    galleryPadding: 16,
    indexItems: type === 'index' ? [
      { title: 'Visión y Concepto', pageNum: 'P. 03' },
      { title: 'Ubicación Estratégica', pageNum: 'P. 04' },
      { title: 'Amenidades y Estilo de Vida', pageNum: 'P. 05' },
      { title: 'Tipologías y Distribución', pageNum: 'P. 06' },
      { title: 'Esquema de Pago', pageNum: 'P. 07' },
      { title: 'Contacto Comercial', pageNum: 'P. 08' },
    ] : undefined,
    imageFit: type === 'floorplan' ? 'contain' : 'cover',
    imagePosition: 'center',
    overlayOpacity: type === 'cover' || type === 'contact' ? 58 : 20,
    titleSize: type === 'cover' ? 54 : 26,
    bodySize: 14,


    padding: 48,
    minHeight: type === 'cover' ? 760 : 620,
    showDisclaimer: type === 'availability' || type === 'payment' || type === 'banking',
    disclaimer: defaultDisclaimer,
    disclaimerColor: '#64748b',
    disclaimerSize: 9,
    customStats: type === 'stats' ? computeProjectStats(project) : undefined,
    amenityStyle: 'cards',
    amenityColumns: 2,
    amenityIconMode: 'auto',
    indexColumns: type === 'index' ? 1 : undefined,
    extraList: type === 'highlights' ? proposalAmenitiesFor(project) : undefined,
  };
}

function initialBlocks(project: PortalProject, kind: PresentationKind): Block[] {
  const isPalmView = project.slug === 'palm-view';
  const proposalAccent = project.brandProfile?.accentColor || (isPalmView ? '#21412b' : '#c5a880');
  const proposalSurface = project.brandProfile?.surfaceColor || '#fcfbf9';
  if (kind === 'dossier') {
    return buildDossierTemplate(project) as unknown as Block[];
  }

  if (kind === 'proposal') {
    const planNumber = (label: string, fallback: number) => {
      const step = project.paymentPlan.find((item) => item.label.toLocaleLowerCase().includes(label));
      if (!step) return fallback;
      const value = Number(step.value.replace(/[^\d.,-]/g, '').replace(/,/g, ''));
      return Number.isFinite(value) && value > 0 ? value : fallback;
    };
    const reservationAmount = planNumber('reserva', 3000);
    const initialPercentage = planNumber('inicial', 20);
    const constructionPercentage = planNumber('constru', 30);
    const proposalBlocks: BlockType[] = isPalmView
      ? ['cover', 'index', 'text', 'gallery', 'stats', 'typologies', 'payment', 'highlights', 'highlights', 'contact']
      : ['cover', 'index', 'text', 'gallery', 'stats', 'typologies', 'payment', 'highlights', 'contact'];

    let highlightsCount = 0;
    return proposalBlocks.map((type, index) => {
      const block = makeBlock(type, project, index + 1);
      const isCover = type === 'cover';
      const isResortHighlight = isPalmView && type === 'highlights' && highlightsCount === 0;
      const isProjectHighlight = isPalmView && type === 'highlights' && highlightsCount === 1;
      if (type === 'highlights') highlightsCount++;

      return {
        ...block,
        id: isResortHighlight
          ? 'proposal-amenities-resort'
          : isProjectHighlight
          ? 'proposal-amenities-project'
          : block.id,
        title: isCover
          ? project.name
          : isResortHighlight
          ? 'Amenidades del Complejo'
          : isProjectHighlight
          ? 'Amenidades Exclusivas del Proyecto'
          : block.title,
        kicker: isCover
          ? 'Propuesta de inversión'
          : isResortHighlight
          ? '01 · Coral Golf Resort'
          : isProjectHighlight
          ? '02 · Palm View'
          : block.kicker,
        body: isResortHighlight
          ? 'Un resort completo con campo de golf de 18 hoyos, club de playa privado Coral Beach, muelle, lagos y club de raqueta.'
          : isProjectHighlight
          ? 'Comodidades diseñadas para el descanso y la convivencia, con servicios hoteleros operados por Homebelike (HMS).'
          : block.body,
        projectLogoUrl: projectLogoForProposal(project) || project.brandProfile?.logoUrl,
        showBrokerLogo: true,
        hideBrokerDetails: false,
        brokerLogoVariant: 'normal',
        backgroundType: 'solid',
        backgroundColor: proposalSurface,
        gradientColor2: undefined,
        textColor: '#0a1140',
        accentColor: proposalAccent,
        image: type === 'text'
          ? project.image
          : type === 'stats'
          ? (project.gallery?.[0] || project.image)
          : isResortHighlight
          ? '/projects/palm-view/plans/coral-golf-resort-3d.png'
          : isProjectHighlight
          ? '/projects/palm-view/plans/palm-view-master-plan-3d.png'
          : block.image,
        images: isResortHighlight
          ? ['/projects/palm-view/plans/coral-golf-resort-3d.png']
          : isProjectHighlight
          ? ['/projects/palm-view/plans/palm-view-master-plan-3d.png']
          : block.images,
        imageFit: type === 'floorplan' ? 'contain' : (block.imageFit || 'cover'),
        locationLeft: type === 'cover' ? cleanProposalLocation(project.location) : block.locationLeft,
        extraList: type === 'payment'
          ? project.paymentPlan.map((step) => `${step.label} · ${step.value}`)
          : isResortHighlight
          ? [...CORAL_GOLF_RESORT_AMENITIES]
          : isProjectHighlight
          ? (project.amenities?.length ? project.amenities : [...PALM_VIEW_EXCLUSIVE_AMENITIES])
          : type === 'highlights'
          ? proposalAmenitiesFor(project)
          : block.extraList,
        iconSourceLabels: isResortHighlight
          ? [...CORAL_GOLF_RESORT_AMENITIES]
          : isProjectHighlight
          ? (project.amenities?.length ? project.amenities : [...PALM_VIEW_EXCLUSIVE_AMENITIES])
          : undefined,
        amenityStyle: isResortHighlight ? 'cards' : isProjectHighlight ? 'pills' : block.amenityStyle,
        amenityColumns: isResortHighlight ? 2 : 3,
        amenityIconMode: isResortHighlight ? 'number' : 'auto',
        iconFamily: isPalmView ? 'palm-view' : undefined,
        paymentPlans: type === 'payment' ? buildDefaultPaymentPlans(project) : undefined,
      };
    });
  }

  type OrderItem = { type: BlockType; typologyCard?: TypologyCard };
  const items: OrderItem[] = isPalmView
    ? [
        { type: 'cover' },
        { type: 'index' },
        { type: 'text' },
        { type: 'gallery' },
        { type: 'highlights' },
        { type: 'highlights' },
        { type: 'stats' },
      ]
    : [
        { type: 'cover' },
        { type: 'index' },
        { type: 'text' },
        { type: 'gallery' },
        { type: 'highlights' },
        { type: 'stats' },
      ];

  const typologyCards = buildTypologyCards(project);
  if (typologyCards.length > 0) {
    typologyCards.forEach((card) => {
      items.push({ type: 'typologies', typologyCard: card });
    });
  }

  items.push({ type: 'payment' });
  items.push({ type: 'contact' });

  let dossierHighlightsCount = 0;
  return items.map((item, index) => {
    const isResortHighlight = isPalmView && item.type === 'highlights' && dossierHighlightsCount === 0;
    const isProjectHighlight = isPalmView && item.type === 'highlights' && dossierHighlightsCount === 1;
    if (item.type === 'highlights') dossierHighlightsCount++;

    const base = makeBlock(item.type, project, index + 1);
    if (item.type === 'typologies' && item.typologyCard) {
      const card = item.typologyCard;
      return {
        ...base,
        id: `typology-${card.id || index}`,
        title: card.name,
        kicker: 'Tipología · Distribución',
        body: '',
        typologyCards: [card],
        typologyLayout: 1 as const,
        image: card.image,
        images: card.image ? [card.image] : [],
      };
    }
    if (isResortHighlight) {
      return {
        ...base,
        id: 'coral-golf-resort-amenities',
        title: 'Coral Golf Resort',
        kicker: '01 · Complejo y entorno',
        body: 'Un resort de golf y playa en Punta Cana con campo de 18 hoyos, club de playa privado Coral Beach, muelle, lagos y club de raqueta.',
        image: '/projects/palm-view/plans/coral-golf-resort-3d.png',
        images: ['/projects/palm-view/plans/coral-golf-resort-3d.png'],
        imageFit: 'contain',
        extraList: [...CORAL_GOLF_RESORT_AMENITIES],
        iconSourceLabels: [...CORAL_GOLF_RESORT_AMENITIES],
        amenityIconMode: 'number',
        amenityStyle: 'cards',
        amenityColumns: 2,
        iconFamily: 'palm-view',
      };
    }
    if (isProjectHighlight) {
      return {
        ...base,
        id: 'palm-view-exclusive-amenities',
        title: 'Palm View',
        kicker: '02 · Amenidades exclusivas',
        body: 'Comodidades residenciales con servicio hotelero Homebelike (HMS) para vivir y rentar.',
        image: '/projects/palm-view/plans/palm-view-master-plan-3d.png',
        images: ['/projects/palm-view/plans/palm-view-master-plan-3d.png'],
        imageFit: 'contain',
        extraList: project.amenities?.length ? project.amenities : [...PALM_VIEW_EXCLUSIVE_AMENITIES],
        iconSourceLabels: project.amenities?.length ? project.amenities : [...PALM_VIEW_EXCLUSIVE_AMENITIES],
        amenityIconMode: 'auto',
        amenityStyle: 'pills',
        amenityColumns: 3,
        iconFamily: 'palm-view',
      };
    }
    return base;
  });
}

export default function PresentationEditor({
  project,
  kind,
  selectedUnitId,
  selectedUnitIds: initialSelectedUnitIds,
  selectedLotTypologies = [],
  recipients = [],
  serverInitialBlocks,
  presentationId,
  brokerName,
  brokerPhone,
  brokerEmail,
}: {
  project: PortalProject;
  kind: PresentationKind;
  selectedUnitId?: string;
  selectedUnitIds?: string[];
  selectedLotTypologies?: { unitId: string; typologyId: string }[];
  recipients?: ProposalRecipient[];
  serverInitialBlocks?: Block[];
  presentationId?: number;
  brokerName?: string;
  brokerPhone?: string | null;
  brokerEmail?: string;
}) {
  const { theme } = useBrand();
  const proposalTheme = useMemo(() => kind === 'proposal' && project.brandProfile
    ? {
        ...theme,
        name: project.brandProfile.name || project.developer || theme.name,
        logo_url: project.brandProfile.logoUrl || theme.logo_url,
        primary_color: project.brandProfile.primaryColor || theme.primary_color,
        accent_color: project.brandProfile.accentColor || theme.accent_color,
        surface_color: project.brandProfile.surfaceColor || theme.surface_color,
      }
    : theme, [kind, project.brandProfile, project.developer, theme]);
  const [template, setTemplate] = useState<TemplateId>('editorial');
  const draftStorageKey = `ob_${kind}_${kind === 'proposal' ? 'magazine_v6' : 'draft'}_${project.slug}`;
  const stableInitial = useMemo(() => {
    const source = serverInitialBlocks && Array.isArray(serverInitialBlocks) && serverInitialBlocks.length > 0
      ? serverInitialBlocks
      : initialBlocks(project, kind);
    return normalizeProposalBlocks(source, kind, project);
  }, [serverInitialBlocks, project, kind]);
  const [initialEditorState] = useState<{ blocks: Block[]; selectedId: string }>(() => {
    const fallback = { blocks: stableInitial, selectedId: stableInitial[0]?.id || 'cover-1' };
    if (typeof window === 'undefined' || (serverInitialBlocks && Array.isArray(serverInitialBlocks) && serverInitialBlocks.length > 0)) {
      return fallback;
    }
    try {
      const saved = localStorage.getItem(draftStorageKey);
      const parsed = saved ? JSON.parse(saved) : null;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return { blocks: normalizeProposalBlocks(parsed as Block[], kind, project), selectedId: parsed[0]?.id || 'cover-1' };
      }
    } catch {
      // ignore malformed local drafts
    }
    return fallback;
  });
  const [blocks, setBlocks] = useState<Block[]>(initialEditorState.blocks);
  const [past, setPast] = useState<Block[][]>([]);
  const [future, setFuture] = useState<Block[][]>([]);
  const [selectedId, setSelectedId] = useState(initialEditorState.selectedId);
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [leftTab, setLeftTab] = useState<EditorTab>('pages');
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('content');
  const [mobilePanel, setMobilePanel] = useState<EditorTab | 'inspector' | null>(null);
  const [preview, setPreview] = useState(false);
  const [saveState, setSaveState] = useState<'saved' | 'dirty' | 'blocked'>('saved');
  const [savedPresentationId, setSavedPresentationId] = useState(presentationId);
  const [lastSavedAsDraft, setLastSavedAsDraft] = useState(kind === 'dossier');
  const localDraftUnavailable = useRef(false);
  const [canvasRatio, setCanvasRatio] = useState<CanvasRatio>(
    kind === 'proposal' ? 'portrait' : '1120x820'
  );
  const [client, setClient] = useState({ id: null as number | null, name: '', phone: '', email: '', type: 'person' as 'person' | 'company' });
  const [recipientQuery, setRecipientQuery] = useState('');
  const [recipientOpen, setRecipientOpen] = useState(false);
  const [recipientCollapsed, setRecipientCollapsed] = useState(false);
  const matchingRecipients = useMemo(() => {
    const term = recipientQuery.trim().toLocaleLowerCase();
    if (!term) return recipients.slice(0, 7);
    return recipients.filter((recipient) => `${recipient.fullName} ${recipient.email || ''} ${recipient.phone || ''}`.toLocaleLowerCase().includes(term)).slice(0, 7);
  }, [recipientQuery, recipients]);
  const [media, setMedia] = useState<string[]>([project.image, ...project.gallery]);
  const selected = blocks.find((block) => block.id === selectedId) || blocks[0];
  const availableUnits = useMemo(
    () => project.units.filter((unit) => unit.status === 'Disponible'),
    [project.units]
  );
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>(() => {
    if (initialSelectedUnitIds?.length) return initialSelectedUnitIds;
    const preferred = selectedUnitId && project.units.some((unit) => unit.id === selectedUnitId)
      ? selectedUnitId
      : project.units.find((unit) => unit.status === 'Disponible')?.id;
    return preferred ? [preferred] : [];
  });

  const selectedUnits = useMemo(() => {
    if (kind !== 'proposal') return [...availableUnits].sort((a, b) => a.price - b.price).slice(0, 4);
    if (selectedLotTypologies.length) return availableUnits.filter((unit) => selectedLotTypologies.some((selection) => selection.unitId === unit.id));
    return availableUnits.filter((unit) => selectedUnitIds.includes(unit.id));
  }, [availableUnits, selectedUnitIds, selectedLotTypologies, kind]);
  const proposalReady = kind !== 'proposal' || (Boolean(client.id) && selectedUnits.length > 0);

  const proposalItems = useMemo(() => selectedUnits.map((unit) => {
    const selection = selectedLotTypologies.find((item) => item.unitId === unit.id);
    const typology = selection ? project.typologies?.find((item) => item.id === selection.typologyId || item.key === selection.typologyId) : undefined;
    const selectedPrice = typology
      ? [typology.key, typology.id, typology.name].filter(Boolean).map((key) => Number((unit.customColumns?.[String(key)] || '').replace(/[^\d.,-]/g, '').replace(/,/g, '')) || 0).find((price) => price > 0) || typology.startingPrice || unit.price
      : unit.price;
    return ({
    id: `${project.slug}-${unit.id}`,
    property_id: String(project.id),
    project_slug: project.slug,
    project_name: project.name,
    developer_name: project.developer,
    unit_name: typology ? `Solar ${unit.unit} · ${typology.name}` : unit.unit || 'Unidad Principal',
    location: cleanProposalLocation(project.location),
    price: selectedPrice || project.startingPrice,
    currency: unit.currency || project.currency || 'USD',
    bedrooms: typology?.bedrooms || unit.bedrooms || 0,
    bathrooms: typology?.bathrooms || unit.bathrooms || 0,
    parking_spaces: typology?.parkingSpaces ?? Number(unit.customColumns?.PARQUEOS || unit.customColumns?.Parqueos || unit.customColumns?.parqueos || 0),
    area_sqm: typology?.totalSqm || unit.area || 0,
    delivery_date: project.deliveryDate || project.delivery || '2026',
    description: project.description,
    hero_image: project.image,
    gallery_images: project.gallery,
    amenities: proposalAmenitiesFor(project),
    raw_payment_plan: project.paymentPlan,
    payment_plan: {
      reservation_amount: 0,
      initial_percentage: 0,
      during_construction_percentage: 0,
      upon_delivery_percentage: 0,
    },
    });
  }) as MultiPropertyProposal['items'], [project, selectedUnits, selectedLotTypologies]);

  useEffect(() => {
    const page = document.getElementById(`presentation-page-${selectedId}`);
    if (page) page.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [selectedId]);

  function commit(next: Block[]) {
    setPast((items) => [...items.slice(-29), blocks]);
    setBlocks(next);
    setFuture([]);
    setSaveState('dirty');
    if (typeof window !== 'undefined' && !localDraftUnavailable.current && !JSON.stringify(next).includes('data:image/')) {
      try {
        localStorage.setItem(draftStorageKey, JSON.stringify(next));
      } catch {
        localDraftUnavailable.current = true;
      }
    }
  }

  async function resetToDefault() {
    if (await requestConfirmation('¿Deseas restablecer todas las diapositivas al contenido oficial original? Se perderán las modificaciones locales no guardadas.')) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(draftStorageKey);
      }
      const initial = initialBlocks(project, kind);
      setBlocks(initial);
      setPast([]);
      setFuture([]);
      setSelectedId(initial[0]?.id || 'cover-1');
      setSaveState('dirty');
    }
  }

  function updateSelected(update: Partial<Block>) {
    commit(blocks.map((block) => block.id === selectedId ? { ...block, ...update } : block));
  }

  function undo() {
    const previous = past[past.length - 1];
    if (!previous) return;
    setFuture((items) => [blocks, ...items].slice(0, 30));
    setBlocks(previous);
    setPast((items) => items.slice(0, -1));
    setSaveState('dirty');
  }

  function redo() {
    const next = future[0];
    if (!next) return;
    setPast((items) => [...items, blocks].slice(-30));
    setBlocks(next);
    setFuture((items) => items.slice(1));
    setSaveState('dirty');
  }

  function addBlock(type: BlockType) {
    const block = makeBlock(type, project);
    commit([...blocks, block]);
    setSelectedId(block.id);
    setLeftTab('pages');
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    commit(next);
  }

  function duplicate(block: Block) {
    const clone = { ...block, id: `${block.type}-${crypto.randomUUID()}`, title: `${block.title} (copia)` };
    const index = blocks.findIndex((item) => item.id === block.id);
    const next = [...blocks];
    next.splice(index + 1, 0, clone);
    commit(next);
    setSelectedId(clone.id);
  }

  function remove(block: Block) {
    if (blocks.length <= 1) return;
    const coverCount = blocks.filter((item) => item.type === 'cover').length;
    if (block.type === 'cover' && coverCount <= 1) return;
    const next = blocks.filter((item) => item.id !== block.id);
    commit(next);
    setSelectedId(next[Math.max(0, blocks.findIndex((item) => item.id === block.id) - 1)]?.id || next[0]?.id || '');
  }

  const [isSaving, setIsSaving] = useState(false);
  const [shareModalData, setShareModalData] = useState<{ url: string; token: string; emailStatus?: 'sent' | 'failed' | 'skipped'; emailError?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportProgress, setExportProgress] = useState('');

  async function handleExportPdf() {
    if (kind === 'proposal' && !client.id) {
      alert('Selecciona un lead registrado antes de generar la propuesta.');
      return;
    }
    if (kind === 'proposal' && selectedUnits.length === 0) {
      alert('Selecciona al menos una unidad para la propuesta.');
      return;
    }
    setIsExportingPdf(true);
    try {
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      const cleanProjectName = (project.name || project.slug).replace(/[/\\?%*:|"<>]/g, '').trim();
      const pdfName = kind === 'proposal'
        ? `Propuesta ${cleanProjectName} ES.pdf`
        : `Brochure ${cleanProjectName} ES.pdf`;
      await exportPresentationToPdf({
        filename: pdfName,
        slideSelector: kind === 'proposal' ? '[data-presentation-slide="true"]' : undefined,
        aspectRatio: kind === 'proposal' ? 'portrait' : canvasRatio,
        onProgress: (curr, total) => setExportProgress(`${curr}/${total}`),
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al generar el PDF');
    } finally {
      setIsExportingPdf(false);
      setExportProgress('');
    }
  }

  async function saveNow(mode: 'draft' | 'publish' = 'publish') {
    if (kind === 'proposal' && !client.id) {
      alert('Selecciona un lead registrado en el CRM antes de guardar la propuesta.');
      return;
    }
    if (kind === 'proposal' && selectedUnits.length === 0) {
      alert('Selecciona al menos una unidad para la propuesta.');
      return;
    }
    setIsSaving(true);
    try {
      const blocksForSave = await uploadEmbeddedImages(blocks);
      if (blocksForSave !== blocks) setBlocks(blocksForSave);
      const recipient = client.name || (client.type === 'company' ? 'Empresa' : 'Cliente');
      const title = `${project.name} · ${kind === 'proposal' ? 'Propuesta para ' + recipient : 'Dossier Oficial'}`;
      const snapshot = {
        title,
        kind,
        canvasRatio,
        project: project.name,
        project_slug: project.slug,
        client_name: client.name,
        contact_id: client.id,
        client_phone: client.phone,
        client_email: client.email,
        recipient_type: client.type,
        items: proposalItems as unknown as Json,
        blocks: blocksForSave,
        branding: {
          name: proposalTheme.name,
          logo_url: proposalTheme.logo_url,
          primary_color: proposalTheme.primary_color,
          accent_color: proposalTheme.accent_color,
          surface_color: proposalTheme.surface_color,
        },
      };

      const res = kind === 'dossier'
        ? await saveDossierAction({
            presentationId: savedPresentationId,
            projectSlug: project.slug,
            snapshot: snapshot as unknown as Json,
            publish: mode === 'publish',
          })
        : await saveProposalAction({
            title,
            kind,
            contactId: client.id || undefined,
            snapshot: snapshot as unknown as Json,
          });

      if (res.success && (kind === 'dossier' && mode === 'draft' || Boolean(res.url && res.token))) {
        setSaveState('saved');
        if (res.presentationId) setSavedPresentationId(res.presentationId);
        setLastSavedAsDraft(kind === 'dossier' && mode === 'draft');
        localDraftUnavailable.current = false;
        try {
          localStorage.setItem(draftStorageKey, JSON.stringify(blocksForSave));
        } catch {
          localDraftUnavailable.current = true;
        }
        setShareModalData(res.url && res.token ? {
          url: window.location.origin + res.url,
          token: res.token,
          emailStatus: res.emailStatus,
          emailError: res.emailError,
        } : null);
      } else {
        setSaveState('dirty');
        alert(res.error || 'No fue posible guardar. Revisa la conexión e inténtalo de nuevo.');
      }
    } catch (error) {
      setSaveState('dirty');
      alert(error instanceof Error ? `No fue posible guardar: ${error.message}` : 'No fue posible guardar. Revisa la conexión e inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
    }
  }

  function copyShareLink() {
    if (!shareModalData) return;
    navigator.clipboard.writeText(shareModalData.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const url = await uploadPresentationImage(file);
      setMedia((items) => [url, ...items]);
      if (selected?.type === 'floorplan') {
        const plans = [...(selected.images || []), url].filter((item, index, list) => list.indexOf(item) === index).slice(-2);
        updateSelected({ image: plans[0], images: plans, imageFit: 'contain', backgroundType: 'solid' });
        return;
      }
      const layout = selected?.layout;
      const isSplitOrVertical = layout === 'split-left' || layout === 'split-right' || layout === 'vertical-top' || layout === 'vertical-bottom';
      updateSelected({ image: url, ...(!isSplitOrVertical ? { backgroundType: 'image' } : {}) });
    } catch (error) {
      alert(error instanceof Error ? `No se pudo subir la imagen: ${error.message}` : 'No se pudo subir la imagen. Inténtalo de nuevo.');
    }
  }

  function chooseMedia(url: string, asBackground = true) {
    if (selected?.type === 'floorplan') {
      const plans = [...(selected.images || []), url].filter((item, index, list) => list.indexOf(item) === index).slice(-2);
      updateSelected({ image: plans[0], images: plans, imageFit: 'contain', backgroundType: 'solid' });
      return;
    }
    const layout = selected?.layout;
    const isSplitOrVertical = layout === 'split-left' || layout === 'split-right' || layout === 'vertical-top' || layout === 'vertical-bottom';
    updateSelected(
      asBackground && !isSplitOrVertical
        ? { image: url, images: [url], backgroundType: 'image' }
        : { image: url, images: [url] }
    );
  }

  const label = kind === 'dossier' ? 'Dossier' : 'Propuesta';
  return (
    <div className="fixed inset-0 z-[70] flex h-screen flex-col overflow-hidden bg-[#f1f0ec] text-[#0a1140]">
      <header className="flex min-h-[64px] items-center gap-2 border-b border-slate-200 bg-white px-3 sm:gap-3 sm:px-5">
        <UITranslationBoundary attributes={["aria-label"]}><Link href={`/portal/projects/${project.slug}`} aria-label="Volver al proyecto" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link></UITranslationBoundary>
        <div className="hidden min-w-0 max-w-[220px] border-l border-slate-200 pl-3 leading-tight sm:block">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-400">{label}</p>
          <p className="truncate text-sm font-extrabold text-slate-900">{project.name}</p>
        </div>
        <span className="sr-only" aria-live="polite">{saveState === 'blocked' ? <LocalizedText text={"El guardado requiere iniciar sesión"} /> : saveState === 'dirty' ? <LocalizedText text={"Cambios pendientes de guardar"} /> : lastSavedAsDraft ? 'Borrador guardado' : 'Documento publicado'}</span>
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <UITranslationBoundary attributes={["aria-label"]}><button type="button" onClick={undo} disabled={!past.length} aria-label="Deshacer" className="hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30 sm:inline-flex"><Undo2 className="h-4 w-4" /></button></UITranslationBoundary>
          <UITranslationBoundary attributes={["aria-label"]}><button type="button" onClick={redo} disabled={!future.length} aria-label="Rehacer" className="hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-30 sm:inline-flex"><Redo2 className="h-4 w-4" /></button></UITranslationBoundary>

          {/* Reset draft button */}
          <UITranslationBoundary attributes={["title"]}><button
            type="button"
            onClick={resetToDefault}
            title="Restablecer diapositivas a su estado inicial oficial"
            className="hidden items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[9px] font-extrabold text-slate-500 hover:text-red-600 hover:border-red-200 transition md:inline-flex"
          >
            <RotateCcw className="h-3 w-3" />
            <span><LocalizedText text={"Restablecer"} /></span>
          </button></UITranslationBoundary>

          {/* Canvas Proportion Switcher */}
          {kind === 'dossier' ? <div className="hidden items-center rounded-lg border border-slate-200 p-1 md:flex">
            <UITranslationBoundary attributes={["title"]}><button
              type="button"
              title="Formato horizontal (1120x820)"
              onClick={() => setCanvasRatio('1120x820')}
              className={cn(
                'rounded-md px-2 py-1 text-[9px] font-extrabold transition',
                canvasRatio === '1120x820' ? 'bg-blue-50 text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              )}
            ><LocalizedText text={"1120×820"} /></button></UITranslationBoundary>
            <UITranslationBoundary attributes={["title"]}><button
              type="button"
              title="Documento A4 / Vertical"
              onClick={() => setCanvasRatio('portrait')}
              className={cn(
                'rounded-md px-2 py-1 text-[9px] font-extrabold transition',
                canvasRatio === 'portrait' ? 'bg-blue-50 text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              )}
            ><LocalizedText text={"816 px"} /></button></UITranslationBoundary>
            <UITranslationBoundary attributes={["title"]}><button
              type="button"
              title="Presentación 16:9 Full HD"
              onClick={() => setCanvasRatio('1920x1080')}
              className={cn(
                'rounded-md px-2 py-1 text-[9px] font-extrabold transition',
                canvasRatio === '1920x1080' ? 'bg-blue-50 text-blue-600 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              )}
            ><LocalizedText text={"16:9 HD"} /></button></UITranslationBoundary>
          </div> : <span className="hidden rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[9px] font-extrabold text-slate-600 md:inline-flex"><LocalizedText text={"Carta vertical"} /></span>}



          <div className="hidden rounded-lg border border-slate-200 p-1 sm:flex">
            <UITranslationBoundary attributes={["aria-label"]}><button type="button" aria-label="Vista de escritorio" onClick={() => setDevice('desktop')} className={cn('rounded-md p-1.5', device === 'desktop' ? 'bg-blue-50 text-blue-600' : 'text-slate-400')}><Monitor className="h-4 w-4" /></button></UITranslationBoundary>
            <UITranslationBoundary attributes={["aria-label"]}><button type="button" aria-label="Vista móvil" onClick={() => setDevice('mobile')} className={cn('rounded-md p-1.5', device === 'mobile' ? 'bg-blue-50 text-blue-600' : 'text-slate-400')}><Smartphone className="h-4 w-4" /></button></UITranslationBoundary>
          </div>

          {shareModalData && (
            <>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(shareModalData.url);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1800);
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 text-[10px] font-extrabold text-emerald-900 shadow-2xs hover:bg-emerald-100 transition"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-emerald-700" />}
                <span>{copied ? <LocalizedText text={"¡Copiado!"} /> : 'Copiar enlace'}</span>
              </button>
              <a
                href={shareModalData.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[10px] font-extrabold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
              >
                <span><LocalizedText text={"Abrir"} /></span> <ExternalLink className="h-3 w-3 text-slate-500" />
              </a>
            </>
          )}
          {/* Export to PDF Button */}
          <button
            type="button"
            disabled={isExportingPdf || !proposalReady}
            onClick={handleExportPdf}
            aria-describedby={kind === 'proposal' ? 'proposal-requirement-note' : undefined}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-[10px] font-extrabold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-60 transition"
          >
            {isExportingPdf ? (
              <RefreshCcw className="h-3.5 w-3.5 animate-spin text-[#d4af37]" />
            ) : (
              <Download className="h-3.5 w-3.5 text-slate-500" />
            )}
            <span className="hidden sm:inline">
              {isExportingPdf ? (exportProgress ? `PDF (${exportProgress})` : 'Exportando…') : 'Descargar PDF'}
            </span>
          </button>

          <button type="button" onClick={() => setPreview(true)} className="hidden h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-[10px] font-bold text-slate-600 sm:inline-flex"><Eye className="h-4 w-4" /><LocalizedText text={"Vista previa"} /></button>
          {kind === 'dossier' && (
            <button type="button" disabled={isSaving} onClick={() => saveNow('draft')} className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-[10px] font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
              <Save className="h-4 w-4" />
              <span>{isSaving ? 'Guardando…' : saveState === 'saved' && lastSavedAsDraft ? 'Borrador guardado ✓' : <LocalizedText text={"Guardar borrador"} />}</span>
            </button>
          )}
          <button type="button" disabled={isSaving || !proposalReady} onClick={() => saveNow('publish')} aria-describedby={kind === 'proposal' ? 'proposal-requirement-note' : undefined} className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#0a1140] px-3 text-[10px] font-bold text-white shadow-sm hover:bg-[#18205a] disabled:opacity-60 transition">
            {isSaving ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span className="hidden sm:inline">{isSaving ? 'Guardando…' : kind === 'dossier' ? 'Publicar y compartir' : shareModalData ? 'Guardado ✓' : <LocalizedText text={"Guardar y compartir"} />}</span>
            <span className="sm:hidden">{isSaving ? 'Guardando…' : kind === 'dossier' ? 'Publicar' : <LocalizedText text={"Guardar"} />}</span>
          </button>
        </div>
      </header>

      {kind === 'proposal' && (
        <>
        <div className="border-b border-[#ded8ce] bg-[#fcfbf9] px-4 py-2.5">
          {client.id && recipientCollapsed ? (
            <div className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-white px-3 py-2 shadow-sm">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-4 w-4" /></span>
                <div className="min-w-0 leading-tight">
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-emerald-700"><LocalizedText text={"Lead registrado en CRM"} /></p>
                  <p className="truncate text-xs font-extrabold text-slate-900">{client.name}<span className="ml-2 font-medium text-slate-500">{client.email || client.phone || 'Sin datos de contacto'}</span></p>
                </div>
              </div>
              <button type="button" onClick={() => { setRecipientCollapsed(false); setRecipientOpen(true); setRecipientQuery(client.name); }} className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-[10px] font-extrabold text-slate-700 hover:border-blue-300 hover:text-blue-700">
                <ChevronDown className="h-3.5 w-3.5" /><LocalizedText text={" Cambiar lead"} /></button>
            </div>
          ) : (
            <div className="grid gap-2 md:grid-cols-[minmax(180px,0.55fr)_minmax(260px,1.45fr)_minmax(180px,0.8fr)_minmax(220px,1fr)] md:items-center">
              <div className="flex items-center justify-between gap-3 md:block">
                <div id="proposal-requirement-note">
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#8b7657]"><LocalizedText text={"Destinatario"} /></p>
                  <p className="mt-1 text-[10px] font-medium leading-4 text-slate-500"><LocalizedText text={"Selecciona un lead existente del CRM"} /></p>
                </div>
                {client.id && <button type="button" onClick={() => { setRecipientCollapsed(true); setRecipientOpen(false); }} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-extrabold text-slate-500 hover:bg-slate-100 hover:text-slate-800 md:mt-2"><ChevronUp className="h-3.5 w-3.5" /><LocalizedText text={" Ocultar"} /></button>}
              </div>
              <div className="relative">
                <div className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                  <UserRound className="h-4 w-4 shrink-0 text-slate-400" />
                  <UITranslationBoundary attributes={["placeholder"]}><input
                    value={recipientQuery}
                    onFocus={() => setRecipientOpen(true)}
                    onChange={(event) => {
                      setRecipientQuery(event.target.value);
                      setRecipientOpen(true);
                      setRecipientCollapsed(false);
                      setClient({ ...client, id: null, name: '', phone: '', email: '' });
                    }}
                    placeholder="Buscar lead registrado en CRM"
                    className="min-w-0 flex-1 bg-transparent text-xs outline-none"
                  /></UITranslationBoundary>
                  {client.id && <span className="rounded-md bg-emerald-50 px-2 py-1 text-[9px] font-extrabold text-emerald-700"><LocalizedText text={"Seleccionado"} /></span>}
                </div>
                {recipientOpen && <div className="absolute left-0 right-0 top-11 z-50 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                  {matchingRecipients.length ? matchingRecipients.map((recipient) => (
                    <button key={recipient.id} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => {
                      setClient({ id: recipient.id, name: recipient.fullName, phone: recipient.phone || '', email: recipient.email || '', type: recipient.classification === 'Empresa' ? 'company' : 'person' });
                      setRecipientQuery(recipient.fullName);
                      setRecipientOpen(false);
                      setRecipientCollapsed(true);
                      setSaveState('dirty');
                    }} className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-blue-50">
                      <span><span className="block text-xs font-bold text-slate-900">{recipient.fullName}</span><span className="mt-0.5 block text-[10px] text-slate-500">{recipient.email || recipient.phone || 'Sin correo ni teléfono'}</span></span>
                      <span className="text-[9px] font-bold text-slate-400">#{recipient.id}</span>
                    </button>
                  )) : <p className="px-3 py-4 text-xs text-slate-500"><LocalizedText text={"No se encontró un lead registrado."} /></p>}
                </div>}
              </div>
              <UITranslationBoundary attributes={["placeholder"]}><EditorField value={client.phone} onChange={() => undefined} placeholder="Teléfono" icon={Smartphone} readOnly /></UITranslationBoundary>
              <UITranslationBoundary attributes={["placeholder"]}><EditorField value={client.email} onChange={() => undefined} placeholder="Correo electrónico" icon={Mail} type="email" readOnly /></UITranslationBoundary>
            </div>
          )}
        </div>
        <div className="flex min-h-12 items-center justify-between gap-3 border-b border-[#ded8ce] bg-[#f1eee8] px-4 py-2">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#8b7657]"><LocalizedText text={"Unidades incluidas · misma desarrolladora"} /></p>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-bold text-[#0a1140]">
              {proposalItems.map((item) => <span key={item.unit_name}>{item.unit_name} · {formatCurrency(item.price, item.currency || project.currency)}</span>)}
            </div>
          </div>
          <a href={`/portal/proposals/new?project=${encodeURIComponent(project.slug)}`} className="inline-flex h-8 shrink-0 items-center rounded-lg border border-[#cfc6b8] bg-white px-3 text-[10px] font-bold text-[#0a1140] hover:border-[#c5a880]"><LocalizedText text={"Cambiar unidades"} /></a>
        </div>
        </>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_380px] xl:grid-cols-[250px_minmax(0,1fr)_420px]">
        <aside className="hidden min-h-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
          <div className="grid grid-cols-5 border-b border-slate-100 p-1.5 gap-0.5">
            {([['pages', 'Páginas'], ['blocks', 'Plantillas'], ['elements', 'Elementos'], ['media', 'Medios'], ['styles', 'Estilos']] as [EditorTab, string][]).map(([id, text]) => (
              <button key={id} type="button" onClick={() => setLeftTab(id)} className={cn('rounded-lg px-1 py-1.5 text-[7.5px] font-extrabold uppercase tracking-tight text-center truncate', leftTab === id ? 'bg-blue-50 text-blue-700' : 'text-slate-400 hover:bg-slate-50')}>{text}</button>
            ))}
          </div>
          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-3">
            {leftTab === 'pages' && <PagesPanel blocks={blocks} selectedId={selectedId} setSelectedId={setSelectedId} move={move} remove={remove} />}
            {leftTab === 'blocks' && <div className="grid grid-cols-2 gap-2">{palette.map((item) => <button key={item.type} type="button" onClick={() => addBlock(item.type)} className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 p-2 text-[9px] font-bold text-slate-600 hover:border-blue-300 hover:text-blue-700"><item.icon className="h-4 w-4 text-blue-600" />{item.label}</button>)}</div>}
            {leftTab === 'elements' && <ElementsPanel selected={selected} updateSelected={updateSelected} setInspectorTab={setInspectorTab} />}
            {leftTab === 'media' && <MediaLibrary media={media} onChoose={(url) => chooseMedia(url, true)} compact />}
            {leftTab === 'styles' && <div className="space-y-3">{templates.map((item) => <button key={item.id} type="button" onClick={() => { setTemplate(item.id); setSaveState('dirty'); }} className={cn('w-full rounded-xl border p-2 text-left', template === item.id ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200')}><span className={cn('block h-20 rounded-lg', item.preview)} /><span className="mt-2 block text-[10px] font-extrabold text-slate-800">{item.name}</span><span className="mt-0.5 block text-[8px] leading-3 text-slate-400">{item.description}</span></button>)}</div>}
          </div>
          <button type="button" onClick={() => setLeftTab('blocks')} className="m-3 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-50 text-[10px] font-extrabold text-blue-700"><Plus className="h-4 w-4" /><LocalizedText text={"Agregar página"} /></button>
        </aside>

        <main className="custom-scrollbar min-h-0 overflow-y-auto bg-[#e9e6df] p-4 sm:p-6">
          <div
            className={cn(
              'mx-auto transition-all duration-300',
              device === 'mobile'
                ? 'max-w-[390px]'
                : canvasRatio === '1120x820'
                ? 'max-w-[1120px]'
                : canvasRatio === '1920x1080'
                ? 'max-w-[1280px]'
                : 'max-w-[816px]'
            )}
          >
            <PresentationCanvas
              blocks={blocks}
              selectedId={selectedId}
              onSelect={(id) => {
                setSelectedId(id);
                if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                  setMobilePanel('inspector');
                }
              }}
              kind={kind}
              template={template}
              project={project}
              brand={proposalTheme}
              units={selectedUnits}
              proposalItems={proposalItems}
              clientName={client.name}
              brokerName={brokerName}
              brokerPhone={brokerPhone}
              brokerEmail={brokerEmail}
              device={device}
              canvasRatio={canvasRatio}
            />
          </div>
        </main>

        <aside className="hidden min-h-0 border-l border-slate-200 bg-white lg:flex lg:flex-col">
          {selected && <>
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
              <div><p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-blue-600"><LocalizedText text={"Editar página"} /></p><p className="mt-1 max-w-[240px] truncate text-xs font-extrabold text-slate-900">{selected.title}</p></div>
              <div className="flex"><UITranslationBoundary attributes={["title"]}><button type="button" onClick={() => duplicate(selected)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" title="Duplicar"><Copy className="h-4 w-4" /></button></UITranslationBoundary><UITranslationBoundary attributes={["title"]}><button type="button" disabled={blocks.length <= 1 || (selected.type === 'cover' && blocks.filter(b => b.type === 'cover').length <= 1)} onClick={() => remove(selected)} className="rounded-lg p-2 text-slate-400 hover:text-red-600 disabled:opacity-30" title="Eliminar"><Trash2 className="h-4 w-4" /></button></UITranslationBoundary></div>
            </div>
            <div className="grid grid-cols-4 border-b border-slate-100 p-2">
              {([['content', 'Contenido'], ['design', 'Diseño'], ['media', 'Imagen'], ['elements', 'Elementos']] as [InspectorTab, string][]).map(([id, text]) => <button key={id} type="button" onClick={() => setInspectorTab(id)} className={cn('rounded-lg px-1 py-2 text-[8.5px] font-extrabold uppercase tracking-wide', inspectorTab === id ? 'bg-blue-50 text-blue-700' : 'text-slate-400 hover:bg-slate-50')}>{text}</button>)}
            </div>
            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-4">
              {inspectorTab === 'content' && <ContentInspector block={selected} update={updateSelected} kind={kind} paymentPrice={proposalItems[0]?.price || project.startingPrice} project={project} blocks={blocks} remove={remove} />}
              {inspectorTab === 'design' && <DesignInspector block={selected} update={updateSelected} />}
              {inspectorTab === 'media' && <div className="space-y-4"><MediaInspector block={selected} update={updateSelected} /><MediaLibrary media={media} onChoose={(url) => chooseMedia(url, true)} compact /></div>}
              {inspectorTab === 'elements' && <ElementsPanel selected={selected} updateSelected={updateSelected} setInspectorTab={setInspectorTab} />}
            </div>
          </>}
        </aside>
      </div>

      <div className="flex min-h-[72px] shrink-0 flex-col items-center justify-center gap-1 border-t border-slate-200 bg-white px-2 pb-[env(safe-area-inset-bottom)] lg:hidden">
        <p className="truncate text-[9px] font-extrabold text-slate-400 max-w-[70vw] sm:hidden"><span className="uppercase tracking-[0.14em]">{label}</span> <span className="mx-0.5 text-slate-300">·</span> <span className="text-slate-600">{project.name}</span></p>
        <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
          <UITranslationBoundary attributes={["label"]}><MobileDockButton icon={LayoutGrid} label="Páginas" onClick={() => setMobilePanel('pages')} /></UITranslationBoundary>
          <UITranslationBoundary attributes={["label"]}><MobileDockButton icon={Plus} label="Plantillas" onClick={() => setMobilePanel('blocks')} /></UITranslationBoundary>
          <UITranslationBoundary attributes={["label"]}><MobileDockButton icon={Layers} label="Elementos" onClick={() => setMobilePanel('elements')} /></UITranslationBoundary>
          <UITranslationBoundary attributes={["label"]}><MobileDockButton icon={ImageIcon} label="Medios" onClick={() => setMobilePanel('media')} /></UITranslationBoundary>
          <UITranslationBoundary attributes={["label"]}><MobileDockButton icon={Palette} label="Diseño" onClick={() => setMobilePanel('inspector')} disabled={!selected} /></UITranslationBoundary>
        </div>
      </div>

      {mobilePanel && (
        <div className="fixed inset-0 z-[90] bg-slate-950/35 lg:hidden" onClick={() => setMobilePanel(null)}>
          <div className="absolute inset-x-0 bottom-0 max-h-[76vh] overflow-hidden rounded-t-3xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center border-b border-slate-100 px-4 py-3">
              <p className="text-xs font-extrabold text-slate-900">
                {mobilePanel === 'pages' ? <LocalizedText text={"Páginas"} /> : mobilePanel === 'blocks' ? <LocalizedText text={"Plantillas de página"} /> : mobilePanel === 'elements' ? 'Elementos modulares' : mobilePanel === 'media' ? 'Biblioteca de medios' : <LocalizedText text={"Editar diseño"} />}
              </p>
              <button type="button" onClick={() => setMobilePanel(null)} className="ml-auto rounded-lg p-2 text-slate-500">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="custom-scrollbar max-h-[calc(76vh-60px)] overflow-y-auto p-4">
              {mobilePanel === 'pages' && <PagesPanel blocks={blocks} selectedId={selectedId} setSelectedId={(id) => { setSelectedId(id); setMobilePanel(null); }} move={move} remove={remove} />}
              {mobilePanel === 'blocks' && (
                <div className="grid grid-cols-3 gap-2">
                  {palette.map((item) => (
                    <button key={item.type} type="button" onClick={() => { addBlock(item.type); setMobilePanel(null); }} className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 p-2 text-center text-[9px] font-bold text-slate-600">
                      <item.icon className="h-4 w-4 text-blue-600" />
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
              {mobilePanel === 'elements' && (
                <ElementsPanel selected={selected} updateSelected={updateSelected} setInspectorTab={setInspectorTab} />
              )}
              {mobilePanel === 'media' && <MediaLibrary media={media} onChoose={(url) => chooseMedia(url, true)} />}
              {mobilePanel === 'inspector' && (selected ? (
                <>
                  <div className="mb-4 grid grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1">
                    {([['content', 'Contenido'], ['design', 'Diseño'], ['media', 'Imagen'], ['elements', 'Elementos']] as [InspectorTab, string][]).map(([id, text]) => (
                      <button key={id} type="button" onClick={() => setInspectorTab(id)} className={cn('rounded-lg px-1 py-2 text-[8px] font-extrabold uppercase', inspectorTab === id ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-400')}>{text}</button>
                    ))}
                  </div>
                  {inspectorTab === 'content' && <ContentInspector block={selected} update={updateSelected} kind={kind} paymentPrice={proposalItems[0]?.price || project.startingPrice} project={project} blocks={blocks} remove={remove} />}
                  {inspectorTab === 'design' && <DesignInspector block={selected} update={updateSelected} />}
                  {inspectorTab === 'media' && <MediaInspector block={selected} update={updateSelected} />}
                  {inspectorTab === 'elements' && <ElementsPanel selected={selected} updateSelected={updateSelected} setInspectorTab={setInspectorTab} />}
                </>
              ) : (
                <p className="rounded-xl bg-slate-50 p-4 text-center text-xs font-medium text-slate-500"><LocalizedText text={"Selecciona una página para editar su contenido."} /></p>
              ))}
            </div>
          </div>
        </div>
      )}

      {preview && <PreviewOverlay onClose={() => setPreview(false)} blocks={blocks} kind={kind} template={template} project={project} brand={proposalTheme} units={selectedUnits} proposalItems={proposalItems} clientName={client.name} brokerName={brokerName} brokerPhone={brokerPhone} brokerEmail={brokerEmail} device={device} canvasRatio={canvasRatio} />}

      {shareModalData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">{kind === 'dossier' ? 'Dossier publicado' : 'Propuesta publicada y protegida'}</h3>
                  <p className="text-[11px] text-slate-400"><LocalizedText text={"Enlace público con vigencia de 30 días"} /></p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShareModalData(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500"><LocalizedText text={"Enlace público interactivo"} /></label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1.5">
                <input
                  readOnly
                  value={shareModalData.url}
                  className="flex-1 bg-transparent px-2.5 text-xs font-mono text-slate-800 outline-none select-all"
                />
                <button
                  type="button"
                  onClick={copyShareLink}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition shadow-xs',
                    copied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  )}
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            {shareModalData.emailStatus === 'sent' && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                <Mail className="h-4 w-4 text-emerald-600" />
                <p className="text-xs font-bold text-emerald-800"><LocalizedText text={"Correo enviado a "} />{client.email}</p>
              </div>
            )}
            {shareModalData.emailStatus === 'failed' && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                <Mail className="h-4 w-4 text-amber-600" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-amber-800"><LocalizedText text={"Propuesta publicada, envío pendiente"} /></p>
                  <p className="text-[10px] text-amber-600 truncate">{shareModalData.emailError || 'El correo no pudo enviarse. Puedes reintentar desde el historial.'}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-1">
              <a
                href={shareModalData.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs"
              >
                <ExternalLink className="h-3.5 w-3.5 text-blue-600" />
                <span><LocalizedText text={"Abrir visor"} /></span>
              </a>
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `Hola ${client.name || ''}, te comparto la propuesta comercial interactiva para ${project.name}: ${shareModalData.url}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span><LocalizedText text={"Enviar WhatsApp"} /></span>
              </a>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <Link
                href="/portal/proposals"
                className="text-xs font-bold text-blue-600 hover:underline"
              ><LocalizedText text={"Ir al listado de propuestas →"} /></Link>
              <button
                type="button"
                onClick={() => setShareModalData(null)}
                className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
              ><LocalizedText text={"Continuar editando"} /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PagesPanel({
  blocks,
  selectedId,
  setSelectedId,
  move,
  remove,
}: {
  blocks: Block[];
  selectedId: string;
  setSelectedId: (id: string) => void;
  move: (index: number, direction: -1 | 1) => void;
  remove?: (block: Block) => void;
}) {
  const coverCount = blocks.filter((item) => item.type === 'cover').length;
  return (
    <div className="space-y-2">
      {blocks.map((block, index) => {
        const canDelete = Boolean(remove) && blocks.length > 1 && (block.type !== 'cover' || coverCount > 1);
        return (
          <button
            key={block.id}
            type="button"
            onClick={() => setSelectedId(block.id)}
            className={cn(
              'group w-full rounded-xl border p-2 text-left transition',
              selectedId === block.id ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300',
              block.hidden && 'opacity-45'
            )}
          >
            <span className="flex items-center gap-2">
              <GripVertical className="h-3.5 w-3.5 text-slate-300" />
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-[9px] font-extrabold text-slate-500">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-[10px] font-extrabold text-slate-700">
                {block.title}
              </span>
            </span>
            <span className="mt-2 flex items-center justify-between pl-8">
              <span className="text-[8px] font-bold uppercase tracking-wide text-slate-400">
                {palette.find((item) => item.type === block.type)?.label}
              </span>
              <span className="flex items-center gap-0.5">
                <UITranslationBoundary attributes={["title"]}><span
                  onClick={(event) => {
                    event.stopPropagation();
                    move(index, -1);
                  }}
                  className="rounded p-1 text-slate-400 hover:bg-white hover:text-slate-700"
                  title="Mover arriba"
                >
                  <ChevronUp className="h-3 w-3" />
                </span></UITranslationBoundary>
                <UITranslationBoundary attributes={["title"]}><span
                  onClick={(event) => {
                    event.stopPropagation();
                    move(index, 1);
                  }}
                  className="rounded p-1 text-slate-400 hover:bg-white hover:text-slate-700"
                  title="Mover abajo"
                >
                  <ChevronDown className="h-3 w-3" />
                </span></UITranslationBoundary>
                {canDelete && (
                  <UITranslationBoundary attributes={["title"]}><span
                    onClick={(event) => {
                      event.stopPropagation();
                      remove?.(block);
                    }}
                    className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    title="Eliminar página"
                  >
                    <Trash2 className="h-3 w-3" />
                  </span></UITranslationBoundary>
                )}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ElementsPanel({
  selected,
  updateSelected,
  setInspectorTab,
}: {
  selected?: Block;
  updateSelected: (patch: Partial<Block>) => void;
  setInspectorTab: (tab: InspectorTab) => void;
}) {
  const elements: Array<{ type: SlotElementType; label: string; icon: typeof ImageIcon; desc: string }> = [
    { type: 'image', label: 'Imagen', icon: ImageIcon, desc: 'Fotografía, render o plano arquitectónico' },
    { type: 'heading-text', label: 'Título + Texto', icon: AlignLeft, desc: 'Encabezado con párrafo explicativo' },
    { type: 'text', label: 'Solo Texto', icon: Type, desc: 'Párrafo libre, notas o narrativa' },
    { type: 'amenities', label: 'Amenidades', icon: ListChecks, desc: 'Lista con iconos y etiquetas de amenidades' },
    { type: 'metric', label: 'Cifra Clave', icon: TrendingUp, desc: 'Número destacado con subtítulo o métrica' },
  ];

  const gridTemplates: { id: NonNullable<Block['containerGrid']>; label: string; slots: number }[] = [
    { id: 'none', label: 'Estándar (Libre)', slots: 0 },
    { id: 'single', label: '1 Grande', slots: 1 },
    { id: 'two-col', label: '2 Columnas', slots: 2 },
    { id: 'three-col', label: '3 Columnas', slots: 3 },
    { id: 'one-top-two', label: '1 + 2 Abajo', slots: 3 },
    { id: 'two-left-one', label: '2 Izq + 1 Der', slots: 3 },
    { id: 'panoramic', label: 'Panorámica', slots: 2 },
    { id: 'mosaic', label: 'Mosaico 4', slots: 4 },
  ];

  const currentGrid = selected?.containerGrid || selected?.galleryGrid;
  const isContainerActive = Boolean(currentGrid && currentGrid !== ('none'));
  const totalSlots = currentGrid === 'single' ? 1 : currentGrid === 'mosaic' ? 4 : (currentGrid === 'two-col' || currentGrid === 'panoramic' ? 2 : 3);

  const getSlotElementName = (type?: string) => {
    switch (type) {
      case 'heading-text': return 'Título + Texto';
      case 'text': return 'Solo Texto';
      case 'amenities': return 'Amenidades';
      case 'metric': return 'Cifra Clave';
      case 'image':
      default: return 'Imagen';
    }
  };

  const getSlotIcon = (type?: string) => {
    switch (type) {
      case 'heading-text': return AlignLeft;
      case 'text': return Type;
      case 'amenities': return ListChecks;
      case 'metric': return TrendingUp;
      case 'image':
      default: return ImageIcon;
    }
  };

  return (
    <div className="space-y-4">
      {/* Selector rápido de estructura de contenedor */}
      <UITranslationBoundary attributes={["title"]}><CollapsibleSection
        title="Estructura del Contenedor"
        icon={LayoutGrid}
        badge={isContainerActive ? (currentGrid as string) : 'Estándar'}
        defaultOpen={true}
      >
        <div className="space-y-2">
          <p className="text-[9px] text-slate-500 leading-relaxed"><LocalizedText text={"Elige la distribución de celdas flexbox para esta lámina:"} /></p>
          <div className="grid grid-cols-2 gap-1.5">
            {gridTemplates.map((tmpl) => {
              const isSelected = tmpl.id === 'none'
                ? !isContainerActive
                : currentGrid === tmpl.id;
              return (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => {
                    if (tmpl.id === 'none') {
                      updateSelected({ containerGrid: undefined, galleryGrid: undefined });
                    } else {
                      updateSelected({
                        containerGrid: tmpl.id as Block['containerGrid'],
                        galleryGrid: tmpl.id as Block['containerGrid'],
                      });
                    }
                  }}
                  className={cn(
                    'rounded-lg border px-2.5 py-2 text-[9px] font-bold text-left transition',
                    isSelected
                      ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-2xs font-extrabold ring-1 ring-blue-200'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  )}
                >
                  {tmpl.label}
                </button>
              );
            })}
          </div>
        </div>
      </CollapsibleSection></UITranslationBoundary>

      {/* Celdas activas si hay un contenedor */}
      {isContainerActive && (
        <UITranslationBoundary attributes={["title"]}><CollapsibleSection
          title="Celdas de la Lámina"
          icon={Layers}
          badge={`${totalSlots} celdas`}
          defaultOpen={true}
        >
          <div className="space-y-2">
            <p className="text-[9px] text-slate-500"><LocalizedText text={"Contenido asignado a cada celda flexbox:"} /></p>
            <div className="space-y-1.5">
              {Array.from({ length: totalSlots }).map((_, idx) => {
                const slot = selected?.containerSlots?.[idx];
                const elemType = slot?.elementType || 'image';
                const SlotIcon = getSlotIcon(elemType);
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-2.5 py-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-white text-[8.5px] font-extrabold text-blue-600 shadow-2xs border border-slate-200"><LocalizedText text={"C"} />{idx + 1}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <SlotIcon className="h-3.5 w-3.5 text-slate-600" />
                        <span className="text-[9.5px] font-bold text-slate-700">
                          {getSlotElementName(elemType)}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setInspectorTab('content')}
                      className="rounded-md bg-white px-2 py-1 text-[8.5px] font-extrabold text-blue-600 hover:bg-blue-50 border border-slate-200 transition"
                    ><LocalizedText text={"Editar contenido"} /></button>
                  </div>
                );
              })}
            </div>
          </div>
        </CollapsibleSection></UITranslationBoundary>
      )}

      {/* Catálogo de Elementos Modulares */}
      <UITranslationBoundary attributes={["title"]}><CollapsibleSection
        title="Catálogo de Elementos"
        icon={Plus}
        defaultOpen={true}
      >
        <div className="space-y-2.5">
          <p className="text-[9px] text-slate-500">
            {isContainerActive
              ? <LocalizedText text={"Haz clic en una celda para asignar el elemento seleccionado:"} />
              : <LocalizedText text={"Elige un elemento para activar el contenedor modular en esta lámina:"} />}
          </p>

          <div className="space-y-2">
            {elements.map((el) => (
              <div
                key={el.type}
                className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-2xs hover:border-blue-300 transition text-left"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
                    <el.icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-slate-800 leading-none">{el.label}</p>
                    <p className="text-[8.5px] text-slate-400 mt-1 truncate">{el.desc}</p>
                  </div>
                </div>

                {isContainerActive ? (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[8px] font-bold uppercase tracking-wider text-slate-400 mr-0.5"><LocalizedText text={"Asignar a:"} /></span>
                    {Array.from({ length: totalSlots }).map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          const nextSlots = [...(selected?.containerSlots || [])];
                          while (nextSlots.length < totalSlots) {
                            nextSlots.push({ elementType: 'image' });
                          }
                          nextSlots[idx] = { ...nextSlots[idx], elementType: el.type };
                          updateSelected({ containerSlots: nextSlots });
                          setInspectorTab('content');
                        }}
                        className="px-2 py-0.5 rounded-md text-[8.5px] font-extrabold bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 border border-slate-200 transition"
                      ><LocalizedText text={"Celda "} />{idx + 1}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="mt-2.5 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        updateSelected({
                          containerGrid: 'two-col',
                          galleryGrid: 'two-col',
                          containerSlots: [{ elementType: el.type }, { elementType: 'image' }],
                        });
                        setInspectorTab('content');
                      }}
                      className="w-full py-1 px-2 rounded-md bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white text-[8.5px] font-extrabold transition text-center"
                    ><LocalizedText text={"Activar 2 Columnas y colocar aquí"} /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CollapsibleSection></UITranslationBoundary>
    </div>
  );
}

function PresentationImageUploader({
  onUpload,
  buttonLabel = 'Subir imagen desde tu equipo',
  uploadingLabel = 'Subiendo imagen...',
  category = 'slides',
}: {
  onUpload: (url: string) => void;
  buttonLabel?: string;
  uploadingLabel?: string;
  category?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      onUpload(await uploadPresentationImage(file, category));
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'No fue posible subir la imagen. Inténtalo de nuevo.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="pt-1">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-dashed border-blue-300 bg-blue-50/70 hover:bg-blue-100 hover:border-blue-500 text-blue-700 transition cursor-pointer text-[9.5px] font-extrabold shadow-2xs disabled:opacity-60"
      >
        <Upload className="h-3.5 w-3.5 shrink-0 text-blue-600" />
        <span>{uploading ? uploadingLabel : buttonLabel}</span>
      </button>
      {uploadError && <p role="alert" className="mt-1 text-[10px] leading-4 text-rose-700"><LocalizedText text={"No se agregó la imagen. "} />{uploadError}</p>}
    </div>
  );
}

const TypologyFileUploader = PresentationImageUploader;

function ContentInspector({
  block,
  update,
  kind,
  paymentPrice,
  project,
  blocks = [],
  remove,
}: {
  block: Block;
  update: (update: Partial<Block>) => void;
  kind: PresentationKind;
  paymentPrice: number;
  project?: PortalProject;
  blocks?: Block[];
  remove?: (block: Block) => void;
}) {
  const { theme: brand } = useBrand();
  const [activeSlotIdx, setActiveSlotIdx] = useState(0);
  const [activeAmenityPickerIdx, setActiveAmenityPickerIdx] = useState<number | null>(null);

  const grid = block.containerGrid || block.galleryGrid;
  const isContainerActive = Boolean(grid && grid !== ('none'));
  const totalSlots = grid === 'single' ? 1 : grid === 'mosaic' ? 4 : (grid === 'two-col' ? 2 : 3);

  const projectMedia = useMemo(() => {
    return Array.from(
      new Set([
        ...(project?.image ? [project.image] : []),
        ...(project?.gallery || []),
        ...(project?.typologies?.flatMap((t) => [t.image, t.floorPlanImage].filter(Boolean)) || []),
      ].filter(Boolean) as string[])
    );
  }, [project]);

  const updateSlot = (idx: number, patch: Partial<ContainerSlot>) => {
    const nextSlots = [...(block.containerSlots || [])];
    while (nextSlots.length < totalSlots) {
      nextSlots.push({ elementType: 'image' });
    }
    nextSlots[idx] = { ...nextSlots[idx], ...patch };
    update({ containerSlots: nextSlots });
  };

  const structuredItems = block.extraList && block.extraList.length > 0
    ? block.extraList
    : block.type === 'highlights'
      ? block.body.split('\n').map((item) => item.trim()).filter(Boolean)
      : [];

  const isCanaRock = project ? isCanaRockProject(project) : false;

  const elementTypesList = [
    { id: 'image', label: 'Imagen', icon: ImageIcon },
    { id: 'heading-text', label: 'Título + Texto', icon: AlignLeft },
    { id: 'text', label: 'Solo Texto', icon: Type },
    { id: 'amenities', label: 'Amenidades', icon: ListChecks },
    { id: 'metric', label: 'Cifra Clave', icon: TrendingUp },
  ] as const;

  const [isDraftingAi, setIsDraftingAi] = useState(false);

  const handleDraftWithAi = async () => {
    if (isDraftingAi) return;
    setIsDraftingAi(true);
    try {
      const res = await summarizeProposalConceptAction({
        projectName: project?.name,
        projectDescription: project?.description || project?.shortDescription,
        currentPart1: block.body,
      });
      if (res.success) {
        const fullText = [res.part1, res.part2].filter(Boolean).join('\n\n');
        update({ body: fullText });
      } else if (res.error) {
        alert(res.error);
      }
    } catch {
      alert('No fue posible generar la redacción con IA.');
    } finally {
      setIsDraftingAi(false);
    }
  };

  return (
    <div className="space-y-4">
      <UITranslationBoundary attributes={["title"]}><CollapsibleSection title="Textos de la Lámina" icon={AlignLeft} defaultOpen={true}>
        <UITranslationBoundary attributes={["label"]}><Field label="Antetítulo"><input value={block.kicker} onChange={(event) => update({ kicker: event.target.value })} className="editor-input" /></Field></UITranslationBoundary>
        <UITranslationBoundary attributes={["label"]}><Field label="Título"><input value={block.title} onChange={(event) => update({ title: event.target.value })} className="editor-input" /></Field></UITranslationBoundary>
        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/80">
          <UITranslationBoundary attributes={["label"]}><RangeField label="Tamaño Título" value={block.titleSize} min={18} max={72} suffix="px" onChange={(value) => update({ titleSize: value })} /></UITranslationBoundary>
          <UITranslationBoundary attributes={["label"]}><RangeField label="Tamaño Texto" value={block.bodySize} min={10} max={22} suffix="px" onChange={(value) => update({ bodySize: value })} /></UITranslationBoundary>
        </div>
        {block.type !== 'highlights' && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-700">
                {isContainerActive ? <LocalizedText text={"Texto de la página / Narrativa"} /> : 'Contenido'}
              </span>
              <UITranslationBoundary attributes={["title"]}><button
                type="button"
                onClick={handleDraftWithAi}
                disabled={isDraftingAi}
                className={cn(
                  "group relative inline-flex shrink-0 whitespace-nowrap items-center gap-1.5 rounded-full p-[1.5px] text-[10px] font-extrabold uppercase tracking-[0.08em] shadow-2xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer overflow-hidden",
                  "bg-gradient-to-r from-[#0284c7] via-[#a855f7] to-[#ec4899] hover:shadow-md hover:shadow-purple-500/15"
                )}
                title="Redacta con IA el concepto del proyecto a partir de su descripción oficial"
              >
                <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-slate-800 transition-colors group-hover:bg-slate-50">
                  {isDraftingAi ? (
                    <>
                      <LoaderCircle className="h-3 w-3 animate-spin text-purple-600" />
                      <span className="bg-gradient-to-r from-sky-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"><LocalizedText text={"Generando…"} /></span>
                    </>
                  ) : (
                    <span className="bg-gradient-to-r from-sky-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {block.body ? 'Rehacer con IA' : 'Redactar con IA'}
                    </span>
                  )}
                </span>
              </button></UITranslationBoundary>
            </div>
            <UITranslationBoundary attributes={["placeholder"]}><textarea
              value={block.body || ''}
              onChange={(event) => update({ body: event.target.value })}
              rows={isContainerActive ? 5 : 10}
              maxLength={650}
              placeholder="Escribe el texto de la página o genera con IA..."
              className="editor-textarea"
            /></UITranslationBoundary>
            {block.body && (
              <div className="flex justify-end pt-1">
                <span className={cn('text-[9.5px] font-medium tabular-nums', (block.body?.length || 0) > 600 ? 'text-amber-500 font-bold' : 'text-slate-400')}>
                  {block.body.length}<LocalizedText text={" / 650 caracteres"} /></span>
              </div>
            )}
          </div>
        )}
      </CollapsibleSection></UITranslationBoundary>

      {/* Editor de Contenedores Flexbox */}
      {isContainerActive && (
        <UITranslationBoundary attributes={["title"]}><CollapsibleSection title="Celdas del Contenedor" badge={`${totalSlots} celdas`} icon={LayoutGrid} defaultOpen={true}>
          {/* Botones de selección de celda (Sin Emojis) */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl">
            {Array.from({ length: totalSlots }).map((_, idx) => {
              const slot = block.containerSlots?.[idx];
              const elemType = slot?.elementType || 'image';
              const matchedIcon = elementTypesList.find((e) => e.id === elemType)?.icon || ImageIcon;
              const IconComp = matchedIcon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveSlotIdx(idx)}
                  className={cn(
                    'py-1.5 px-1 rounded-lg text-[9px] font-bold transition flex items-center justify-center gap-1 truncate',
                    activeSlotIdx === idx
                      ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                      : 'text-slate-500 hover:text-slate-800'
                  )}
                >
                  <IconComp className="w-3 h-3 shrink-0 text-blue-600" />
                  <span><LocalizedText text={"C"} />{idx + 1}</span>
                </button>
              );
            })}
          </div>

          {/* Configuración de la celda activa */}
          {(() => {
            const currentSlot = block.containerSlots?.[activeSlotIdx] || { elementType: 'image' };
            const activeType = currentSlot.elementType || 'image';

            return (
              <div className="space-y-3 p-3 rounded-2xl border border-slate-200 bg-slate-50/80">
                <Field label={`Elemento en Celda ${activeSlotIdx + 1}`}>
                  <div className="grid grid-cols-3 gap-1.5">
                    {elementTypesList.map((t) => {
                      const IconItem = t.icon;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            // Si selecciona amenidades y no tiene items, inicializa con las 6 principales del proyecto
                            if (t.id === 'amenities' && (!currentSlot.items || currentSlot.items.length === 0)) {
                              const projectAms = project?.amenities && project.amenities.length > 0
                                ? (project.amenities.length > 6 ? project.amenities.slice(0, 6) : project.amenities)
                                : ['Piscina infinity', 'Gimnasio de vanguardia', 'Seguridad 24/7', 'Áreas verdes', 'Casa Club', 'Zonas Deportivas'];
                              updateSlot(activeSlotIdx, { elementType: 'amenities', items: projectAms });
                            } else {
                              updateSlot(activeSlotIdx, { elementType: t.id });
                            }
                          }}
                          className={cn(
                            'py-2 px-1 rounded-lg text-[8.5px] font-bold transition border truncate flex items-center justify-center gap-1',
                            activeType === t.id
                              ? 'bg-blue-50 text-blue-700 border-blue-400 shadow-2xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                          )}
                        >
                          <IconItem className="w-3 h-3 shrink-0" />
                          <span>{t.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </Field>

                {activeType === 'image' && (
                  <div className="space-y-3">
                    {/* Vista previa y botón para remover imagen */}
                    {currentSlot.imageUrl ? (
                      <div className="relative h-32 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-inner group">
                        <Image
                          src={currentSlot.imageUrl}
                          alt={`Celda ${activeSlotIdx + 1}`}
                          fill
                          unoptimized={currentSlot.imageUrl.startsWith('data:') || currentSlot.imageUrl.startsWith('http')}
                          className={currentSlot.imageFit === 'contain' ? 'object-contain p-1' : 'object-cover'}
                          style={{ objectPosition: currentSlot.imagePosition || 'center' }}
                        />
                        <button
                          type="button"
                          onClick={() => updateSlot(activeSlotIdx, { imageUrl: undefined })}
                          className="absolute top-2 right-2 rounded-lg bg-black/65 hover:bg-rose-600 text-white p-1 text-[8.5px] font-bold backdrop-blur-xs transition flex items-center gap-1 px-2 shadow-xs"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span><LocalizedText text={"Quitar foto"} /></span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex h-20 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-200 bg-white text-slate-400">
                        <ImageIcon className="h-5 w-5 stroke-[1.5] text-slate-300" />
                        <span className="text-[9px] font-bold"><LocalizedText text={"Sin foto en esta celda"} /></span>
                      </div>
                    )}

                    {/* Subir foto desde el equipo sin URLs */}
                    <PresentationImageUploader
                      category="container-cells"
                      buttonLabel={currentSlot.imageUrl ? "Cambiar foto desde tu equipo" : "Subir foto desde tu equipo"}
                      uploadingLabel="Subiendo foto..."
                      onUpload={(url) => updateSlot(activeSlotIdx, { imageUrl: url })}
                    />

                    {/* Galería rápida del proyecto */}
                    {projectMedia.length > 0 && (
                      <div className="space-y-1.5 bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="text-[8.5px] font-extrabold uppercase tracking-wider text-slate-400 block"><LocalizedText text={"O elegir foto del proyecto:"} /></span>
                        <div className="flex gap-1.5 overflow-x-auto py-1 scrollbar-none">
                          {projectMedia.slice(0, 14).map((url, mediaIdx) => (
                            <button
                              key={mediaIdx}
                              type="button"
                              onClick={() => updateSlot(activeSlotIdx, { imageUrl: url })}
                              className={cn(
                                'relative w-14 h-11 rounded-lg overflow-hidden border shrink-0 transition hover:opacity-100',
                                currentSlot.imageUrl === url
                                  ? 'ring-2 ring-blue-600 border-transparent'
                                  : 'opacity-70 border-slate-200 hover:border-blue-300'
                              )}
                            >
                              <Image src={url} alt={`Media ${mediaIdx}`} fill unoptimized className="object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <UITranslationBoundary attributes={["label"]}><Field label="Ajuste">
                        <select
                          value={currentSlot.imageFit || 'cover'}
                          onChange={(e) => updateSlot(activeSlotIdx, { imageFit: e.target.value === 'contain' ? 'contain' : 'cover' })}
                          className="editor-input"
                        >
                          <option value="cover"><LocalizedText text={"Cubrir (Cover)"} /></option>
                          <option value="contain"><LocalizedText text={"Contener (Contain)"} /></option>
                        </select>
                      </Field></UITranslationBoundary>
                      <UITranslationBoundary attributes={["label"]}><Field label="Posición">
                        <select
                          value={currentSlot.imagePosition || 'center'}
                          onChange={(e) => updateSlot(activeSlotIdx, { imagePosition: e.target.value })}
                          className="editor-input"
                        >
                          <option value="center"><LocalizedText text={"Centro"} /></option>
                          <option value="top"><LocalizedText text={"Arriba"} /></option>
                          <option value="bottom"><LocalizedText text={"Abajo"} /></option>
                        </select>
                      </Field></UITranslationBoundary>
                    </div>
                  </div>
                )}

                {activeType === 'heading-text' && (
                  <div className="space-y-2">
                    <UITranslationBoundary attributes={["label"]}><Field label="Antetítulo (opcional)">
                      <UITranslationBoundary attributes={["placeholder"]}><input
                        value={currentSlot.kicker || ''}
                        onChange={(e) => updateSlot(activeSlotIdx, { kicker: e.target.value })}
                        placeholder="CONCEPTO EXCLUSIVO"
                        className="editor-input"
                      /></UITranslationBoundary>
                    </Field></UITranslationBoundary>
                    <UITranslationBoundary attributes={["label"]}><Field label="Título">
                      <UITranslationBoundary attributes={["placeholder"]}><input
                        value={currentSlot.title || ''}
                        onChange={(e) => updateSlot(activeSlotIdx, { title: e.target.value })}
                        placeholder="Diseño Vanguardista"
                        className="editor-input"
                      /></UITranslationBoundary>
                    </Field></UITranslationBoundary>
                    <UITranslationBoundary attributes={["label"]}><Field label="Texto descriptivo">
                      <UITranslationBoundary attributes={["placeholder"]}><textarea
                        value={currentSlot.text || ''}
                        onChange={(e) => updateSlot(activeSlotIdx, { text: e.target.value })}
                        rows={3}
                        placeholder="Escribe la descripción de este bloque..."
                        className="editor-textarea"
                      /></UITranslationBoundary>
                    </Field></UITranslationBoundary>
                  </div>
                )}

                {activeType === 'text' && (
                  <UITranslationBoundary attributes={["label"]}><Field label="Párrafo de texto">
                    <UITranslationBoundary attributes={["placeholder"]}><textarea
                      value={currentSlot.text || ''}
                      onChange={(e) => updateSlot(activeSlotIdx, { text: e.target.value })}
                      rows={4}
                      placeholder="Escribe el texto de esta celda..."
                      className="editor-textarea"
                    /></UITranslationBoundary>
                  </Field></UITranslationBoundary>
                )}

                {activeType === 'amenities' && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500"><LocalizedText text={"Amenidades en Celda"} /></span>
                      <div className="flex items-center gap-1">
                        {project?.amenities && project.amenities.length > 0 && (
                          <>
                            <UITranslationBoundary attributes={["title"]}><button
                              type="button"
                              onClick={() => {
                                updateSlot(activeSlotIdx, {
                                  items: project.amenities.length > 6 ? project.amenities.slice(0, 6) : [...project.amenities],
                                });
                              }}
                              className="text-[8px] font-bold text-slate-600 hover:text-blue-700 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md transition"
                              title="Cargar las 6 amenidades principales"
                            ><LocalizedText text={"6 Principales"} /></button></UITranslationBoundary>
                            {project.amenities.length > 6 && (
                              <UITranslationBoundary attributes={["title"]}><button
                                type="button"
                                onClick={() => {
                                  updateSlot(activeSlotIdx, { items: [...project.amenities] });
                                }}
                                className="text-[8px] font-bold text-slate-600 hover:text-blue-700 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md transition"
                                title="Cargar todas las amenidades del proyecto"
                              ><LocalizedText text={"Todas ("} />{project.amenities.length})
                              </button></UITranslationBoundary>
                            )}
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const currentItems = currentSlot.items && currentSlot.items.length > 0
                              ? [...currentSlot.items, 'Nueva Amenidad']
                              : (project?.amenities && project.amenities.length > 0 ? [...project.amenities, 'Nueva Amenidad'] : ['Nueva Amenidad']);
                            updateSlot(activeSlotIdx, { items: currentItems });
                          }}
                          className="text-[8.5px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md"
                        ><LocalizedText text={"+ Agregar"} /></button>
                      </div>
                    </div>

                    <UITranslationBoundary attributes={["label"]}><Field label="Título del bloque (opcional)">
                      <UITranslationBoundary attributes={["placeholder"]}><input
                        value={currentSlot.title || ''}
                        onChange={(e) => updateSlot(activeSlotIdx, { title: e.target.value })}
                        placeholder="Amenidades Principales"
                        className="editor-input"
                      /></UITranslationBoundary>
                    </Field></UITranslationBoundary>

                    {/* Formato visual de la celda */}
                    <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-lg border border-slate-200">
                      {(['cards', 'list', 'pills'] as const).map((styleVal) => (
                        <button
                          key={styleVal}
                          type="button"
                          onClick={() => updateSlot(activeSlotIdx, { amenityStyle: styleVal })}
                          className={cn(
                            'rounded-md py-1 text-[8.5px] font-bold transition capitalize',
                            (currentSlot.amenityStyle || 'cards') === styleVal
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-600 hover:bg-slate-100'
                          )}
                        >
                          {styleVal === 'cards' ? 'Tarjetas' : styleVal === 'list' ? 'Lista' : <LocalizedText text={"Cápsulas"} />}
                        </button>
                      ))}
                    </div>

                    {/* Lista editable de amenidades con selector de icono */}
                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {((currentSlot.items && currentSlot.items.length > 0)
                        ? currentSlot.items
                        : (project?.amenities && project.amenities.length > 0 ? project.amenities : ['Piscina infinity', 'Gimnasio de vanguardia', 'Seguridad 24/7'])
                      ).map((amenity, idx) => {
                        const iconKey = currentSlot.amenityIconMap?.[idx] || resolveIconKey(amenity);
                        const isPickerOpen = activeAmenityPickerIdx === idx;
                        return (
                          <div key={idx} className="flex flex-col gap-1 p-1.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
                            <div className="flex items-center gap-1.5">
                              <UITranslationBoundary attributes={["title"]}><button
                                type="button"
                                title="Cambiar icono"
                                onClick={() => setActiveAmenityPickerIdx(isPickerOpen ? null : idx)}
                                className={cn(
                                  "flex items-center justify-center w-7 h-7 rounded-lg border shrink-0 transition",
                                  isPickerOpen ? "bg-blue-600 text-white border-blue-600" : "bg-slate-50 text-slate-700 hover:bg-blue-50 border-slate-200"
                                )}
                              >
                                <CanaRockAmenityIcon iconKey={iconKey} className="w-3.5 h-3.5" />
                              </button></UITranslationBoundary>

                              <UITranslationBoundary attributes={["placeholder"]}><input
                                value={amenity}
                                onChange={(e) => {
                                  const baseItems = (currentSlot.items && currentSlot.items.length > 0)
                                    ? [...currentSlot.items]
                                    : (project?.amenities ? [...project.amenities] : []);
                                  baseItems[idx] = e.target.value;
                                  updateSlot(activeSlotIdx, { items: baseItems });
                                }}
                                className="editor-input text-xs font-semibold py-1 flex-1 h-7"
                                placeholder="Nombre de amenidad"
                              /></UITranslationBoundary>

                              <UITranslationBoundary attributes={["title"]}><button
                                type="button"
                                onClick={() => {
                                  const baseItems = (currentSlot.items && currentSlot.items.length > 0)
                                    ? [...currentSlot.items]
                                    : (project?.amenities ? [...project.amenities] : []);
                                  baseItems.splice(idx, 1);
                                  const nextMap = removeAmenityIconAtIndex(currentSlot.amenityIconMap, idx);
                                  updateSlot(activeSlotIdx, { items: baseItems, amenityIconMap: nextMap });
                                }}
                                className="p-1 text-slate-400 hover:text-red-600 rounded-md"
                                title="Eliminar"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button></UITranslationBoundary>
                            </div>

                            {/* Desplegable de iconos para este elemento específico */}
                            {isPickerOpen && (
                              <div className="mt-1 grid max-h-24 grid-cols-8 gap-1 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-1.5 animate-in fade-in">
                                {CANA_ROCK_ICON_OPTIONS.map((opt) => (
                                  <button
                                    key={opt.key}
                                    type="button"
                                    title={opt.label}
                                    onClick={() => {
                                      const nextMap = { ...(currentSlot.amenityIconMap || {}) };
                                      nextMap[idx] = opt.key;
                                      updateSlot(activeSlotIdx, { amenityIconMap: nextMap });
                                      setActiveAmenityPickerIdx(null);
                                    }}
                                    className={cn(
                                      'grid h-6 w-6 place-items-center rounded-md transition',
                                      iconKey === opt.key ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-white'
                                    )}
                                  >
                                    <CanaRockAmenityIcon iconKey={opt.key} className="h-3 w-3" />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeType === 'metric' && (
                  <div className="space-y-2">
                    <UITranslationBoundary attributes={["label"]}><Field label="Cifra / Métrica destacada">
                      <UITranslationBoundary attributes={["placeholder"]}><input
                        value={currentSlot.metricValue || ''}
                        onChange={(e) => updateSlot(activeSlotIdx, { metricValue: e.target.value })}
                        placeholder="US$ 180,000"
                        className="editor-input font-bold"
                      /></UITranslationBoundary>
                    </Field></UITranslationBoundary>
                    <UITranslationBoundary attributes={["label"]}><Field label="Etiqueta / Descripción corta">
                      <UITranslationBoundary attributes={["placeholder"]}><input
                        value={currentSlot.metricLabel || ''}
                        onChange={(e) => updateSlot(activeSlotIdx, { metricLabel: e.target.value })}
                        placeholder="Precios desde"
                        className="editor-input"
                      /></UITranslationBoundary>
                    </Field></UITranslationBoundary>
                    <UITranslationBoundary attributes={["label"]}><Field label="Detalle o nota (opcional)">
                      <UITranslationBoundary attributes={["placeholder"]}><input
                        value={currentSlot.text || ''}
                        onChange={(e) => updateSlot(activeSlotIdx, { text: e.target.value })}
                        placeholder="Unidades limitadas"
                        className="editor-input text-xs"
                      /></UITranslationBoundary>
                    </Field></UITranslationBoundary>
                  </div>
                )}
              </div>
            );
          })()}
        </CollapsibleSection></UITranslationBoundary>
      )}
    {block.type === 'cover' && (
      <>
        <UITranslationBoundary attributes={["label"]}><Field label="Subtítulo / Edición">
          <UITranslationBoundary attributes={["placeholder"]}><input
            value={block.subHeader || ''}
            onChange={(event) => update({ subHeader: event.target.value })}
            placeholder={isCanaRock ? 'BROCHURE OFICIAL DE VENTAS' : 'Edición comercial'}
            className="editor-input"
          /></UITranslationBoundary>
        </Field></UITranslationBoundary>
        <div className="grid grid-cols-2 gap-2">
          <UITranslationBoundary attributes={["label"]}><Field label="Ubicación pie (izq)">
            <input
              value={block.locationLeft || ''}
              onChange={(event) => update({ locationLeft: event.target.value })}
              placeholder={project?.location ? cleanProposalLocation(project.location) : 'Ubicación'}
              className="editor-input"
            />
          </Field></UITranslationBoundary>
          <UITranslationBoundary attributes={["label"]}><Field label="Entrega pie (der)">
            <input
              value={block.locationRight || ''}
              onChange={(event) => update({ locationRight: event.target.value })}
              placeholder={project?.delivery || project?.deliveryDate || 'Fecha de entrega'}
              className="editor-input"
            />
          </Field></UITranslationBoundary>
        </div>
        {blocks.filter((b) => b.type === 'cover').length > 1 && remove && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => remove(block)}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50/70 p-2.5 text-xs font-bold text-red-650 hover:bg-red-100 hover:text-red-700 transition"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
              <span><LocalizedText text={"Eliminar esta portada duplicada"} /></span>
            </button>
          </div>
        )}
      </>
    )}
    {(block.type === 'image' || block.type === 'gallery') && (
      <label className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
        <span><span className="block text-[10px] font-bold text-slate-700"><LocalizedText text={"Solo imagen"} /></span><span className="mt-1 block text-[8px] text-slate-400"><LocalizedText text={"Oculta el contenido y deja la imagen, el aviso legal y el pie."} /></span></span>
        <input type="checkbox" checked={!!block.hidePageContent} onChange={(event) => update({ hidePageContent: event.target.checked, ...(event.target.checked ? { backgroundType: 'image' } : {}) })} />
      </label>
    )}
    {block.type === 'index' && (
      <UITranslationBoundary attributes={["title"]}><CollapsibleSection
        title="Índice de Secciones"
        icon={ListOrdered}
        badge={`${block.indexItems?.length || 0} filas`}
        defaultOpen={true}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500"><LocalizedText text={"Filas del índice"} /></span>
            <button
              type="button"
              onClick={() => {
                const next = [...(block.indexItems || [])];
                next.push({ title: 'Nueva Sección', pageNum: `P. ${String(next.length + 3).padStart(2, '0')}` });
                update({ indexItems: next });
              }}
              className="text-[9px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded-md"
            ><LocalizedText text={"+ Agregar fila"} /></button>
          </div>

          {/* Distribución de Columnas */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-1.5">
            <span className="text-[8.5px] font-bold uppercase tracking-wider text-slate-400 block"><LocalizedText text={"Distribución de Columnas"} /></span>
            <div className="grid grid-cols-2 gap-1 bg-white p-1 rounded-lg border border-slate-200">
              {([1, 2] as const).map((colVal) => (
                <button
                  key={colVal}
                  type="button"
                  onClick={() => update({ indexColumns: colVal })}
                  className={cn(
                    'rounded-md py-1.5 text-[9px] font-bold transition flex items-center justify-center gap-1',
                    (block.indexColumns || 2) === colVal
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  )}
                >
                  {colVal === 1 ? '1 Columna (Lista)' : <LocalizedText text={"2 Columnas (Cuadrícula)"} />}
                </button>
              ))}
            </div>
            <p className="text-[8px] text-slate-400 italic"><LocalizedText text={"El modo de 1 columna asigna el ancho completo a cada título para que no se corten los nombres largos."} /></p>
          </div>

          <div className="space-y-2">
            {(block.indexItems || []).map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                <span className="text-[9px] font-bold text-slate-400 w-5 text-center shrink-0">{String(idx + 1).padStart(2, '0')}</span>
                <UITranslationBoundary attributes={["placeholder"]}><input
                  value={item.title}
                  onChange={(e) => {
                    const next = [...(block.indexItems || [])];
                    next[idx] = { ...next[idx], title: e.target.value };
                    update({ indexItems: next });
                  }}
                  placeholder="Título de sección"
                  className="editor-input flex-1 text-xs"
                /></UITranslationBoundary>
                <UITranslationBoundary attributes={["placeholder"]}><input
                  value={item.pageNum}
                  onChange={(e) => {
                    const next = [...(block.indexItems || [])];
                    next[idx] = { ...next[idx], pageNum: e.target.value };
                    update({ indexItems: next });
                  }}
                  placeholder="Pág."
                  className="editor-input w-16 text-xs text-center"
                /></UITranslationBoundary>
                <button
                  type="button"
                  onClick={() => {
                    const next = (block.indexItems || []).filter((_, i) => i !== idx);
                    update({ indexItems: next });
                  }}
                  className="text-slate-400 hover:text-red-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </CollapsibleSection></UITranslationBoundary>
    )}

    {block.type === 'contact' && (
      <UITranslationBoundary attributes={["title"]}><CollapsibleSection title="Datos de Contacto" icon={UserRound} defaultOpen={true}>
        <div className="space-y-3">
          {kind === 'dossier' && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
              <p className="text-[10px] font-bold text-slate-700"><LocalizedText text={"Lámina para copias de asesores"} /></p>
              <p className="text-[9px] leading-relaxed text-slate-500"><LocalizedText text={"El texto de esta página se conserva. El nombre, foto y contacto se reemplazan por los del asesor; el logo y los colores se toman de su empresa. Por defecto, el fondo usa el color claro de la empresa."} /></p>
              <UITranslationBoundary attributes={["label"]}><ColorField
                label="Fondo de la copia"
                value={block.copyContactBackgroundColor || '#f8fafc'}
                onChange={(value) => update({ copyContactBackgroundColor: value })}
              /></UITranslationBoundary>
              {block.copyContactBackgroundColor && (
                <button type="button" onClick={() => update({ copyContactBackgroundColor: undefined })} className="text-[9px] font-bold text-slate-600 underline underline-offset-2"><LocalizedText text={"Usar fondo de la empresa"} /></button>
              )}
            </div>
          )}
          <UITranslationBoundary attributes={["label"]}><Field label="Cargo / Título Profesional">
            <UITranslationBoundary attributes={["placeholder"]}><input
              value={block.agentProfessionalTitle || ''}
              onChange={(e) => update({ agentProfessionalTitle: e.target.value })}
              placeholder="Asesor Inmobiliario Senior"
              className="editor-input"
            /></UITranslationBoundary>
          </Field></UITranslationBoundary>
          <div className="space-y-1.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block"><LocalizedText text={"Foto de Perfil / Avatar"} /></span>
            {block.agentAvatarUrl ? (
              <div className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 bg-white">
                <div className="relative w-12 h-12 rounded-full overflow-hidden border border-slate-200 shrink-0 shadow-2xs">
                  <UITranslationBoundary attributes={["alt"]}><Image
                    src={block.agentAvatarUrl}
                    alt="Foto de perfil"
                    fill
                    unoptimized
                    className="object-cover"
                  /></UITranslationBoundary>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[9.5px] font-bold text-slate-700 block truncate"><LocalizedText text={"Foto asignada"} /></span>
                  <button
                    type="button"
                    onClick={() => update({ agentAvatarUrl: undefined })}
                    className="mt-0.5 text-[9px] font-bold text-rose-600 hover:text-rose-800 transition flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span><LocalizedText text={"Quitar foto"} /></span>
                  </button>
                </div>
              </div>
            ) : null}
            <PresentationImageUploader
              category="avatars"
              buttonLabel={block.agentAvatarUrl ? 'Cambiar foto de perfil' : 'Subir foto de perfil desde tu equipo'}
              uploadingLabel="Subiendo foto..."
              onUpload={(url) => update({ agentAvatarUrl: url })}
            />
          </div>
        </div>
      </CollapsibleSection></UITranslationBoundary>
    )}

    {block.type === 'stats' && (
      <UITranslationBoundary attributes={["title"]}><CollapsibleSection title="Cifras Clave (Métricas)" icon={TrendingUp} defaultOpen={true}>
        <div className="space-y-3">
          {project && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => update({ customStats: computeProjectStats(project) })}
                className="text-[9px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded-md"
              ><LocalizedText text={"Restablecer valores"} /></button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1 bg-slate-50 p-2 rounded-xl border border-slate-200">
              <span className="text-[8px] font-bold text-slate-400 uppercase"><LocalizedText text={"Cifra 1"} /></span>
              <UITranslationBoundary attributes={["placeholder"]}><input
                value={block.customStats?.stat1Label || 'Desde'}
                onChange={(e) => update({ customStats: { ...block.customStats, stat1Label: e.target.value } })}
                placeholder="Etiqueta"
                className="editor-input text-xs"
              /></UITranslationBoundary>
              <UITranslationBoundary attributes={["placeholder"]}><input
                value={block.customStats?.stat1Value || ''}
                onChange={(e) => update({ customStats: { ...block.customStats, stat1Value: e.target.value } })}
                placeholder="Valor (ej. US$ 144,400)"
                className="editor-input text-xs font-bold"
              /></UITranslationBoundary>
            </div>

            <div className="space-y-1 bg-slate-50 p-2 rounded-xl border border-slate-200">
              <span className="text-[8px] font-bold text-slate-400 uppercase"><LocalizedText text={"Cifra 2"} /></span>
              <UITranslationBoundary attributes={["placeholder"]}><input
                value={block.customStats?.stat2Label || 'Ubicación'}
                onChange={(e) => update({ customStats: { ...block.customStats, stat2Label: e.target.value } })}
                placeholder="Etiqueta"
                className="editor-input text-xs"
              /></UITranslationBoundary>
              <UITranslationBoundary attributes={["placeholder"]}><input
                value={block.customStats?.stat2Value || ''}
                onChange={(e) => update({ customStats: { ...block.customStats, stat2Value: e.target.value } })}
                placeholder="Valor (ej. Punta Cana)"
                className="editor-input text-xs font-bold"
              /></UITranslationBoundary>
            </div>

            <div className="space-y-1 bg-slate-50 p-2 rounded-xl border border-slate-200">
              <span className="text-[8px] font-bold text-slate-400 uppercase"><LocalizedText text={"Cifra 3"} /></span>
              <UITranslationBoundary attributes={["placeholder"]}><input
                value={block.customStats?.stat3Label || 'Disponibles'}
                onChange={(e) => update({ customStats: { ...block.customStats, stat3Label: e.target.value } })}
                placeholder="Etiqueta"
                className="editor-input text-xs"
              /></UITranslationBoundary>
              <UITranslationBoundary attributes={["placeholder"]}><input
                value={block.customStats?.stat3Value || ''}
                onChange={(e) => update({ customStats: { ...block.customStats, stat3Value: e.target.value } })}
                placeholder="Valor (ej. 21 unidades)"
                className="editor-input text-xs font-bold"
              /></UITranslationBoundary>
            </div>

            <div className="space-y-1 bg-slate-50 p-2 rounded-xl border border-slate-200">
              <span className="text-[8px] font-bold text-slate-400 uppercase"><LocalizedText text={"Cifra 4"} /></span>
              <UITranslationBoundary attributes={["placeholder"]}><input
                value={block.customStats?.stat4Label || 'Entrega'}
                onChange={(e) => update({ customStats: { ...block.customStats, stat4Label: e.target.value } })}
                placeholder="Etiqueta"
                className="editor-input text-xs"
              /></UITranslationBoundary>
              <UITranslationBoundary attributes={["placeholder"]}><input
                value={block.customStats?.stat4Value || ''}
                onChange={(e) => update({ customStats: { ...block.customStats, stat4Value: e.target.value } })}
                placeholder="Valor (ej. Abril 2028)"
                className="editor-input text-xs font-bold"
              /></UITranslationBoundary>
            </div>
          </div>
        </div>
      </CollapsibleSection></UITranslationBoundary>
    )}
    {/* Editor de amenidades: estas opciones afectan directamente la composición publicada. */}
    {block.type === 'highlights' && (
      <UITranslationBoundary attributes={["title"]}><CollapsibleSection
        title="Amenidades del Proyecto"
        icon={ListChecks}
        badge={`${structuredItems.length} amenidades`}
        defaultOpen={true}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500"><LocalizedText text={"Lista de amenidades"} /></span>
            <button
              type="button"
              onClick={() => {
                update({ body: '', extraList: [...structuredItems, 'Nueva Amenidad'] });
              }}
              className="text-[9px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded-md"
            ><LocalizedText text={"+ Agregar"} /></button>
          </div>

          {/* Opciones de presentación de amenidades: Estilo, Columnas e Iconos */}
          <div className="space-y-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
            <div>
              <span className="text-[8.5px] font-bold uppercase tracking-wider text-slate-400 block mb-1"><LocalizedText text={"Formato Visual"} /></span>
              <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-lg border border-slate-200">
                {(['cards', 'list', 'pills'] as const).map((styleVal) => (
                  <button
                    key={styleVal}
                    type="button"
                    onClick={() => update({ amenityStyle: styleVal })}
                    className={cn(
                      'rounded-md py-1 text-[9px] font-bold transition capitalize',
                      (block.amenityStyle || 'cards') === styleVal
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    )}
                  >
                    {styleVal === 'cards' ? 'Tarjetas' : styleVal === 'list' ? 'Lista' : <LocalizedText text={"Cápsulas"} />}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[8.5px] font-bold uppercase tracking-wider text-slate-400 block mb-1"><LocalizedText text={"Columnas"} /></span>
                <div className="grid grid-cols-4 gap-1 bg-white p-1 rounded-lg border border-slate-200">
                  {([1, 2, 3, 4] as const).map((colVal) => (
                    <button
                      key={colVal}
                      type="button"
                      onClick={() => update({ amenityColumns: colVal })}
                      className={cn(
                        'rounded-md py-1 text-[9px] font-bold transition',
                        (block.amenityColumns || 2) === colVal
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      )}
                    >
                      {colVal}<LocalizedText text={" col"} /></button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[8.5px] font-bold uppercase tracking-wider text-slate-400 block mb-1"><LocalizedText text={"Iconografía"} /></span>
                <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-lg border border-slate-200">
                  {(['auto', 'check', 'number'] as const).map((iconVal) => (
                    <button
                      key={iconVal}
                      type="button"
                      onClick={() => update({ amenityIconMode: iconVal })}
                      className={cn(
                        'rounded-md py-1 text-[8.5px] font-bold transition capitalize',
                        (block.amenityIconMode || 'auto') === iconVal
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      )}
                    >
                      {iconVal === 'auto' ? 'Iconos' : iconVal === 'check' ? 'Checks' : '1, 2...'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Selector de Color de Amenidades */}
            <div className="pt-2 border-t border-slate-200/80">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[8.5px] font-bold uppercase tracking-wider text-slate-400"><LocalizedText text={"Color de Amenidades"} /></span>
                <span className="text-[9px] font-mono font-bold text-slate-500">
                  {block.amenityColor || block.accentColor || '#d4af37'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { name: 'Dorado', hex: '#d4af37' },
                  { name: 'Azul Real', hex: '#2563eb' },
                  { name: 'Azul Marino', hex: '#0a1140' },
                  { name: 'Esmeralda', hex: '#059669' },
                  { name: 'Verde Bosque', hex: '#166534' },
                  { name: 'Terracota', hex: '#c2410c' },
                  { name: 'Carbón', hex: '#0f172a' },
                  { name: 'Slate', hex: '#475569' },
                ].map((colorPreset) => {
                  const activeColor = block.amenityColor || block.accentColor || '#d4af37';
                  const isSelected = activeColor.toLowerCase() === colorPreset.hex.toLowerCase();
                  return (
                    <button
                      key={colorPreset.hex}
                      type="button"
                      title={colorPreset.name}
                      onClick={() => update({ amenityColor: colorPreset.hex })}
                      className={cn(
                        'w-5 h-5 rounded-full border border-slate-300 transition-transform active:scale-95 flex items-center justify-center',
                        isSelected ? 'ring-2 ring-blue-500 ring-offset-1 scale-110' : 'hover:scale-105'
                      )}
                      style={{ backgroundColor: colorPreset.hex }}
                    >
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />}
                    </button>
                  );
                })}

                <UITranslationBoundary attributes={["title"]}><label
                  title="Color personalizado"
                  className="w-5 h-5 rounded-full border border-dashed border-slate-400 flex items-center justify-center cursor-pointer hover:border-slate-600 transition bg-white"
                >
                  <input
                    type="color"
                    value={block.amenityColor || block.accentColor || '#d4af37'}
                    onChange={(e) => update({ amenityColor: e.target.value })}
                    className="sr-only"
                  />
                  <span className="text-[10px] text-slate-500 font-bold leading-none">+</span>
                </label></UITranslationBoundary>

                {block.amenityColor && (
                  <button
                    type="button"
                    onClick={() => update({ amenityColor: undefined })}
                    className="text-[8.5px] text-slate-400 hover:text-red-500 underline ml-1"
                  ><LocalizedText text={"Restablecer"} /></button>
                )}
              </div>
            </div>
          </div>

          {/* Lista de elementos */}
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {structuredItems.map((amenity, idx) => {
              const currentIconKey = block.amenityIconMap?.[idx] || resolveIconKey(amenity);
              const activeAmenityColor = block.amenityColor || block.accentColor || '#d4af37';
              return (
                <div key={idx} className="flex flex-col gap-1 p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="flex items-center justify-center w-7 h-7 rounded-lg bg-white border shrink-0 shadow-2xs"
                      style={{ borderColor: `${activeAmenityColor}60`, color: activeAmenityColor }}
                    >
                      <CanaRockAmenityIcon iconKey={currentIconKey} className="w-4 h-4" style={{ color: activeAmenityColor }} />
                    </div>
                    <UITranslationBoundary attributes={["placeholder"]}><input
                      value={amenity}
                      onChange={(e) => {
                        const currentList = [...structuredItems];
                        currentList[idx] = e.target.value;
                        update({ body: '', extraList: currentList });
                      }}
                      className="editor-input text-xs font-semibold py-1.5 flex-1"
                      placeholder="Nombre de amenidad (ej. Piscina Infinity)"
                    /></UITranslationBoundary>
                    <UITranslationBoundary attributes={["title"]}><button
                      type="button"
                      onClick={() => {
                        const currentList = [...structuredItems];
                        currentList.splice(idx, 1);
                        const nextMap = removeAmenityIconAtIndex(block.amenityIconMap, idx);
                        update({ body: '', extraList: currentList, amenityIconMap: nextMap });
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-white"
                      title="Eliminar amenidad"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button></UITranslationBoundary>
                  </div>

                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="text-[8px] font-bold uppercase text-slate-400"><LocalizedText text={"Icono seleccionado"} /></span>
                    <AmenityIconLibraryButton
                      value={currentIconKey}
                      color={activeAmenityColor}
                      onSelect={(iconKey) => {
                        const nextMap = { ...(block.amenityIconMap || {}) };
                        nextMap[idx] = iconKey;
                        update({ amenityIconMap: nextMap });
                      }}
                    />
                  </div>
                </div>
              );
            })}
            {structuredItems.length === 0 && (
              <p className="text-[9px] text-slate-400 italic py-1"><LocalizedText text={"No hay elementos en la lista. Puedes agregar amenidades o distancias con el botón + Agregar."} /></p>
            )}
          </div>
        </div>
      </CollapsibleSection></UITranslationBoundary>
    )}

    {block.type === 'payment' && (
      <div className="space-y-4 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-blue-700"><LocalizedText text={"Planes y Esquemas de Pago"} /></p>
            <p className="text-[8px] text-slate-400"><LocalizedText text={"Configura los planes del proyecto (estándar, pronto pago, por bloque, etc.)"} /></p>
          </div>
          <div className="flex items-center gap-1.5">
            <UITranslationBoundary attributes={["title"]}><button
              type="button"
              onClick={() => {
                update({ paymentPlans: buildDefaultPaymentPlans(project) });
              }}
              className="text-[8px] font-bold text-slate-500 hover:text-slate-700 bg-slate-100 px-2 py-1 rounded-md"
              title="Restablecer plan por defecto del proyecto"
            ><LocalizedText text={"Restablecer"} /></button></UITranslationBoundary>
            <button
              type="button"
              onClick={() => {
                const current = block.paymentPlans || buildDefaultPaymentPlans(project);
                update({
                  paymentPlans: [
                    ...current,
                    {
                      id: `plan-${Date.now()}`,
                      title: 'Pronto Pago',
                      subtitle: '-Opcional-',
                      steps: [
                        '5% Con la reserva',
                        '45% Con la promesa de comprar',
                        '50% Tras la entrega de la unidad',
                      ],
                      discount: '6% de descuento seleccionando este método de pago.',
                      badge: 'Pronto pago',
                    },
                  ],
                });
              }}
              className="text-[8px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded-md"
            ><LocalizedText text={"+ Añadir Plan"} /></button>
          </div>
        </div>

        {/* Plantillas rápidas */}
        <div className="space-y-1">
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block"><LocalizedText text={"Añadir con fórmula rápida:"} /></span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => {
                const current = block.paymentPlans || buildDefaultPaymentPlans(project);
                update({
                  paymentPlans: [
                    ...current,
                    {
                      id: `plan-${Date.now()}`,
                      title: 'Pago estándar 20/30/50',
                      subtitle: '-Bloque C y D-',
                      steps: [
                        '5% Con la reserva',
                        '15% Con la promesa de comprar',
                        '30% Durante la construcción',
                        '50% Tras la entrega de la unidad',
                      ],
                    },
                  ],
                });
              }}
              className="text-[8px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full shrink-0 transition"
            >
              + 20/30/50
            </button>
            <button
              type="button"
              onClick={() => {
                const current = block.paymentPlans || buildDefaultPaymentPlans(project);
                update({
                  paymentPlans: [
                    ...current,
                    {
                      id: `plan-${Date.now()}`,
                      title: 'Pago estándar 20/80',
                      subtitle: '-Bloque A-',
                      steps: [
                        '5% Con la reserva',
                        '15% Con la promesa de comprar',
                        '80% Tras la entrega de la unidad',
                      ],
                    },
                  ],
                });
              }}
              className="text-[8px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full shrink-0 transition"
            >
              + 20/80
            </button>
            <button
              type="button"
              onClick={() => {
                const current = block.paymentPlans || buildDefaultPaymentPlans(project);
                update({
                  paymentPlans: [
                    ...current,
                    {
                      id: `plan-${Date.now()}`,
                      title: 'Pronto pago 50/50',
                      subtitle: '-Bloque C y D-',
                      steps: [
                        '5% Con la reserva',
                        '45% Con la promesa de comprar',
                        '50% Tras la entrega de la unidad',
                      ],
                      discount: '6% de descuento seleccionando este método de pago.',
                      badge: '6% Desc.',
                    },
                  ],
                });
              }}
              className="text-[8px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full shrink-0 transition"
            ><LocalizedText text={"+ Pronto Pago 50/50"} /></button>
            <button
              type="button"
              onClick={() => {
                const current = block.paymentPlans || buildDefaultPaymentPlans(project);
                update({
                  paymentPlans: [
                    ...current,
                    {
                      id: `plan-${Date.now()}`,
                      title: '100% Pronto pago',
                      steps: [
                        '5% Con la reserva',
                        '95% Con la promesa de comprar',
                      ],
                      discount: '8% de descuento seleccionando este método de pago.',
                      badge: '8% Desc.',
                    },
                  ],
                });
              }}
              className="text-[8px] font-semibold bg-amber-50 hover:bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full shrink-0 transition"
            ><LocalizedText text={"+ 100% Pronto Pago"} /></button>
          </div>
        </div>

        {/* Lista de planes */}
        <div className="space-y-3">
          {(block.paymentPlans || buildDefaultPaymentPlans(project)).map((plan, idx) => (
            <div key={plan.id || idx} className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2 relative">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[8.5px] font-bold uppercase tracking-wider text-slate-500"><LocalizedText text={"Plan #"} />{idx + 1}</span>
                <button
                  type="button"
                  onClick={() => {
                    const current = block.paymentPlans || buildDefaultPaymentPlans(project);
                    const next = [...current];
                    next.splice(idx, 1);
                    update({ paymentPlans: next });
                  }}
                  className="text-[8px] font-bold text-red-500 hover:text-red-700"
                ><LocalizedText text={"Eliminar"} /></button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <UITranslationBoundary attributes={["label"]}><Field label="Nombre del plan">
                  <UITranslationBoundary attributes={["placeholder"]}><input
                    type="text"
                    value={plan.title}
                    onChange={(e) => {
                      const current = block.paymentPlans || buildDefaultPaymentPlans(project);
                      const next = [...current];
                      next[idx] = { ...next[idx], title: e.target.value };
                      update({ paymentPlans: next });
                    }}
                    placeholder="Ej. Pago estándar 20/30/50"
                    className="editor-input text-xs font-bold"
                  /></UITranslationBoundary>
                </Field></UITranslationBoundary>

                <UITranslationBoundary attributes={["label"]}><Field label="Aplica a / Subtítulo (opcional)">
                  <UITranslationBoundary attributes={["placeholder"]}><input
                    type="text"
                    value={plan.subtitle || ''}
                    onChange={(e) => {
                      const current = block.paymentPlans || buildDefaultPaymentPlans(project);
                      const next = [...current];
                      next[idx] = { ...next[idx], subtitle: e.target.value };
                      update({ paymentPlans: next });
                    }}
                    placeholder="Ej. -Bloque C y D-"
                    className="editor-input text-xs"
                  /></UITranslationBoundary>
                </Field></UITranslationBoundary>
              </div>

              <UITranslationBoundary attributes={["label"]}><Field label="Hitos de pago (uno por línea)">
                <UITranslationBoundary attributes={["placeholder"]}><textarea
                  rows={4}
                  value={Array.isArray(plan.steps) ? plan.steps.join('\n') : ''}
                  onChange={(e) => {
                    const current = block.paymentPlans || buildDefaultPaymentPlans(project);
                    const next = [...current];
                    const steps = e.target.value.split('\n').map((s) => s.trim()).filter(Boolean);
                    next[idx] = { ...next[idx], steps };
                    update({ paymentPlans: next });
                  }}
                  placeholder="5% Con la reserva&#10;15% Con la promesa de comprar&#10;30% Durante la construcción&#10;50% Tras la entrega de la unidad"
                  className="editor-input text-xs font-mono leading-relaxed"
                /></UITranslationBoundary>
              </Field></UITranslationBoundary>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <UITranslationBoundary attributes={["label"]}><Field label="Descuento / Nota de pronto pago (opcional)">
                  <UITranslationBoundary attributes={["placeholder"]}><input
                    type="text"
                    value={plan.discount || ''}
                    onChange={(e) => {
                      const current = block.paymentPlans || buildDefaultPaymentPlans(project);
                      const next = [...current];
                      next[idx] = { ...next[idx], discount: e.target.value };
                      update({ paymentPlans: next });
                    }}
                    placeholder="Ej. 6% de descuento seleccionando este método..."
                    className="editor-input text-xs"
                  /></UITranslationBoundary>
                </Field></UITranslationBoundary>

                <UITranslationBoundary attributes={["label"]}><Field label="Etiqueta / Badge (opcional)">
                  <UITranslationBoundary attributes={["placeholder"]}><input
                    type="text"
                    value={plan.badge || ''}
                    onChange={(e) => {
                      const current = block.paymentPlans || buildDefaultPaymentPlans(project);
                      const next = [...current];
                      next[idx] = { ...next[idx], badge: e.target.value };
                      update({ paymentPlans: next });
                    }}
                    placeholder="Ej. Recomendado / 6% OFF"
                    className="editor-input text-xs"
                  /></UITranslationBoundary>
                </Field></UITranslationBoundary>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {block.type === 'typologies' && (
      <UITranslationBoundary attributes={["title"]}><CollapsibleSection
        title="Modelos y Tipologías"
        icon={Home}
        badge={`${block.typologyCards?.length || 0} modelos`}
        defaultOpen={true}
      >
        <div className="space-y-4">
          <div>
            <p className="text-[9px] font-bold text-slate-600"><LocalizedText text={"Disposición en página"} /></p>
            <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1 mt-1.5">
              {([
                [1, '1 por pág.'],
                [2, '2 por pág.'],
                [3, '3 por pág.'],
              ] as const).map(([cols, label]) => (
                <button
                  key={cols}
                  type="button"
                  onClick={() => update({ typologyLayout: cols })}
                  className={cn(
                    'rounded-md px-1.5 py-1.5 text-[8px] font-bold leading-tight text-center',
                    (block.typologyLayout || (block.typologyCards?.length === 1 ? 1 : block.typologyCards?.length === 2 ? 2 : 3)) === cols
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-400'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500"><LocalizedText text={"Modelos y Unidades"} /></span>
              <div className="flex items-center gap-1.5">
                <UITranslationBoundary attributes={["title"]}><button
                  type="button"
                  onClick={() => {
                    if (project) {
                      update({ typologyCards: buildTypologyCards(project) });
                    }
                  }}
                  className="text-[8px] font-bold text-slate-500 hover:text-slate-700 bg-slate-100 px-2 py-1 rounded-md"
                  title="Restablecer desde los datos originales del proyecto"
                ><LocalizedText text={"Restablecer"} /></button></UITranslationBoundary>
                <button
                  type="button"
                  onClick={() => {
                    const next = [...(block.typologyCards || [])];
                    const num = next.length + 1;
                    next.push({
                      id: `custom-${Date.now()}`,
                      name: `Tipo ${String.fromCharCode(64 + num)} - Modelo`,
                      bedrooms: 2,
                      bathrooms: 2,
                      area: 85,
                      parking: 1,
                      minPrice: undefined,
                    });
                    update({ typologyCards: next });
                  }}
                  className="text-[8px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded-md"
                ><LocalizedText text={"+ Añadir Modelo"} /></button>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-2">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-600"><LocalizedText text={"Ajuste general de planos"} /></span>
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-200/70 p-0.5">
                {(['contain', 'cover'] as const).map((fit) => (
                  <button
                    key={fit}
                    type="button"
                    onClick={() => update({ imageFit: fit })}
                    className={cn(
                      'rounded-md px-2.5 py-1 text-[8.5px] font-extrabold transition text-center',
                      (block.imageFit || 'contain') === fit ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                    )}
                  >
                    {fit === 'contain' ? 'Normal (Completo)' : 'Cubrir (Cover)'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {(block.typologyCards || []).map((card, idx) => (
                <div key={card.id || idx} className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2 relative">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-blue-700"><LocalizedText text={"Modelo "} />{idx + 1}</span>
                    <UITranslationBoundary attributes={["title"]}><button
                      type="button"
                      onClick={() => {
                        const next = [...(block.typologyCards || [])];
                        next.splice(idx, 1);
                        update({ typologyCards: next });
                      }}
                      className="p-1 text-slate-400 hover:text-red-600"
                      title="Eliminar tipología"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button></UITranslationBoundary>
                  </div>

                  <UITranslationBoundary attributes={["label"]}><Field label="Nombre del modelo">
                    <UITranslationBoundary attributes={["placeholder"]}><input
                      value={card.name}
                      onChange={(e) => {
                        const next = [...(block.typologyCards || [])];
                        next[idx] = { ...next[idx], name: e.target.value };
                        update({ typologyCards: next });
                      }}
                      placeholder="Ej. Tipo A - 2 Habitaciones"
                      className="editor-input text-xs font-bold"
                    /></UITranslationBoundary>
                  </Field></UITranslationBoundary>

                  <div className="grid grid-cols-4 gap-1.5">
                    <UITranslationBoundary attributes={["label"]}><Field label="Hab.">
                      <input
                        type="number"
                        min={0}
                        value={card.bedrooms}
                        onChange={(e) => {
                          const next = [...(block.typologyCards || [])];
                          next[idx] = { ...next[idx], bedrooms: Number(e.target.value) };
                          update({ typologyCards: next });
                        }}
                        className="editor-input text-xs text-center"
                      />
                    </Field></UITranslationBoundary>
                    <UITranslationBoundary attributes={["label"]}><Field label="Baños">
                      <input
                        type="number"
                        min={0}
                        value={card.bathrooms}
                        onChange={(e) => {
                          const next = [...(block.typologyCards || [])];
                          next[idx] = { ...next[idx], bathrooms: Number(e.target.value) };
                          update({ typologyCards: next });
                        }}
                        className="editor-input text-xs text-center"
                      />
                    </Field></UITranslationBoundary>
                    <UITranslationBoundary attributes={["label"]}><Field label="m²">
                      <input
                        type="number"
                        min={0}
                        value={card.area}
                        onChange={(e) => {
                          const next = [...(block.typologyCards || [])];
                          next[idx] = { ...next[idx], area: Number(e.target.value) };
                          update({ typologyCards: next });
                        }}
                        className="editor-input text-xs text-center"
                      />
                    </Field></UITranslationBoundary>
                    <UITranslationBoundary attributes={["label"]}><Field label="Pq.">
                      <input
                        type="number"
                        min={0}
                        value={card.parking ?? 0}
                        onChange={(e) => {
                          const next = [...(block.typologyCards || [])];
                          next[idx] = { ...next[idx], parking: Number(e.target.value) };
                          update({ typologyCards: next });
                        }}
                        className="editor-input text-xs text-center"
                      />
                    </Field></UITranslationBoundary>
                  </div>

                  <UITranslationBoundary attributes={["label"]}><Field label="Precio mínimo USD (vacío = 'Consultar con asesor')">
                    <UITranslationBoundary attributes={["placeholder"]}><input
                      type="number"
                      min={0}
                      value={card.minPrice || ''}
                      onChange={(e) => {
                        const next = [...(block.typologyCards || [])];
                        const val = e.target.value ? Number(e.target.value) : undefined;
                        next[idx] = { ...next[idx], minPrice: val };
                        update({ typologyCards: next });
                      }}
                      placeholder="Consultar con asesor"
                      className="editor-input text-xs"
                    /></UITranslationBoundary>
                  </Field></UITranslationBoundary>

                  <div className="space-y-1.5 pt-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block"><LocalizedText text={"Plano o Imagen de la tipología"} /></span>
                    {card.image ? (
                      <div className="space-y-2 p-2 rounded-xl bg-white border border-slate-200">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-lg bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
                            <Image
                              src={card.image}
                              alt={card.name}
                              fill
                              unoptimized
                              className={card.imageFit === 'cover' ? 'object-cover' : 'object-contain p-1'}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[9px] font-bold text-slate-700 block truncate"><LocalizedText text={"Plano / Imagen asignada"} /></span>
                            <button
                              type="button"
                              onClick={() => {
                                const next = [...(block.typologyCards || [])];
                                next[idx] = { ...next[idx], image: undefined };
                                update({ typologyCards: next });
                              }}
                              className="text-[8px] font-bold text-red-600 hover:text-red-800 mt-0.5"
                            ><LocalizedText text={"Quitar imagen"} /></button>
                          </div>
                        </div>

                        {/* Cover vs Normal (Contain) Toggle for this card */}
                        <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-2">
                          <span className="text-[8.5px] font-bold text-slate-500"><LocalizedText text={"Ajuste de imagen:"} /></span>
                          <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-0.5">
                            {(['contain', 'cover'] as const).map((fit) => (
                              <button
                                key={fit}
                                type="button"
                                onClick={() => {
                                  const next = [...(block.typologyCards || [])];
                                  next[idx] = { ...next[idx], imageFit: fit };
                                  update({ typologyCards: next });
                                }}
                                className={cn(
                                  'rounded-md px-2 py-1 text-[8.5px] font-extrabold transition text-center',
                                  (card.imageFit || block.imageFit || 'contain') === fit
                                    ? 'bg-white text-blue-700 shadow-xs'
                                    : 'text-slate-500 hover:text-slate-800'
                                )}
                              >
                                {fit === 'contain' ? 'Normal (Completo)' : 'Cubrir (Cover)'}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {projectMedia.length > 0 && (
                      <div className="space-y-1 bg-white p-2 rounded-xl border border-slate-200">
                        <span className="text-[8.5px] font-bold text-slate-400 block">
                          {card.image ? <LocalizedText text={"Cambiar por foto del proyecto:"} /> : <LocalizedText text={"Seleccionar del proyecto:"} />}
                        </span>
                        <div className="flex gap-1.5 overflow-x-auto py-1 scrollbar-none">
                          {projectMedia.slice(0, 10).map((url, mediaIdx) => (
                            <button
                              key={mediaIdx}
                              type="button"
                              onClick={() => {
                                const next = [...(block.typologyCards || [])];
                                next[idx] = { ...next[idx], image: url };
                                update({ typologyCards: next });
                              }}
                              className={cn(
                                'relative w-12 h-10 rounded-lg overflow-hidden border shrink-0 transition hover:opacity-100',
                                card.image === url ? 'ring-2 ring-blue-600 border-transparent' : 'opacity-70 border-slate-200'
                              )}
                            >
                              <Image src={url} alt={`Media ${mediaIdx}`} fill unoptimized className="object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Subir plano directamente desde el equipo sin necesidad de URLs */}
                    <TypologyFileUploader
                      onUpload={(url) => {
                        const next = [...(block.typologyCards || [])];
                        next[idx] = { ...next[idx], image: url };
                        update({ typologyCards: next });
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CollapsibleSection></UITranslationBoundary>
    )}

    {/* Selector y Editor de Tipologías / Precios */}
    {block.pricingCards && block.pricingCards.length > 0 && (
      <UITranslationBoundary attributes={["title"]}><CollapsibleSection
        title="Tipologías y Precios"
        icon={CircleDollarSign}
        badge={`${block.pricingCards?.length || 0} tipologías`}
        defaultOpen={true}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500"><LocalizedText text={"Tarjetas de precio"} /></span>
            <button
              type="button"
              onClick={() => {
                update({
                  pricingCards: [
                    ...(block.pricingCards || []),
                    { title: 'Nueva Tipología', price: 150000, kicker: 'Disponible' },
                  ],
                });
              }}
              className="text-[9px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded-md"
            ><LocalizedText text={"+ Añadir"} /></button>
          </div>
          <p className="text-[8px] text-slate-400"><LocalizedText text={"Puedes quitar o dejar solo una tipología si el cliente busca un tipo específico de unidad."} /></p>
          {block.pricingCards.map((card, idx) => (
            <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 space-y-1.5 relative">
              <div className="flex items-center justify-between gap-2">
                <UITranslationBoundary attributes={["placeholder"]}><input
                  value={card.title}
                  onChange={(e) => {
                    const next = [...(block.pricingCards || [])];
                    next[idx] = { ...next[idx], title: e.target.value };
                    update({ pricingCards: next });
                  }}
                  placeholder="Tipología"
                  className="editor-input text-xs font-bold flex-1"
                /></UITranslationBoundary>
                <UITranslationBoundary attributes={["title"]}><button
                  type="button"
                  onClick={() => {
                    const next = [...(block.pricingCards || [])];
                    next.splice(idx, 1);
                    update({ pricingCards: next });
                  }}
                  className="p-1 text-slate-400 hover:text-red-600"
                  title="Eliminar tipología"
                >
                  <X className="w-3.5 h-3.5" />
                </button></UITranslationBoundary>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <UITranslationBoundary attributes={["placeholder"]}><input
                  type="number"
                  value={card.price}
                  onChange={(e) => {
                    const next = [...(block.pricingCards || [])];
                    next[idx] = { ...next[idx], price: Number(e.target.value) };
                    update({ pricingCards: next });
                  }}
                  placeholder="Precio USD"
                  className="editor-input text-xs"
                /></UITranslationBoundary>
                <UITranslationBoundary attributes={["placeholder"]}><input
                  value={card.kicker || ''}
                  onChange={(e) => {
                    const next = [...(block.pricingCards || [])];
                    next[idx] = { ...next[idx], kicker: e.target.value };
                    update({ pricingCards: next });
                  }}
                  placeholder="Estado (ej. Agotado / Desde)"
                  className="editor-input text-xs"
                /></UITranslationBoundary>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection></UITranslationBoundary>
    )}

    {/* Ajuste de imagen general para diapositivas con imagen (portada, estadísticas, etc.) */}
    {block.type !== 'typologies' && (Boolean(block.image) || (block.type === 'cover' && (project?.image || (project?.gallery && project.gallery.length > 0))) || (block.type === 'stats' && (project?.image || (project?.gallery && project.gallery.length > 0)))) && (
      <UITranslationBoundary attributes={["title"]}><CollapsibleSection title="Ajuste de Imagen" icon={ImageIcon} defaultOpen={false}>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold text-slate-600"><LocalizedText text={"Modo de encuadre"} /></span>
            <span className="text-[8px] text-slate-400"><LocalizedText text={"¿Cortar o mostrar completa?"} /></span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-slate-100 p-1">
            {(['cover', 'contain'] as const).map((fit) => (
              <button
                key={fit}
                type="button"
                onClick={() => update({ imageFit: fit })}
                className={cn(
                  'rounded-lg py-1.5 text-[9px] font-bold transition text-center',
                  (block.imageFit || (block.type === 'cover' ? 'cover' : 'contain')) === fit
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                )}
              >
                {fit === 'contain' ? 'Normal (Completo)' : 'Cubrir (Cover)'}
              </button>
            ))}
          </div>
        </div>
      </CollapsibleSection></UITranslationBoundary>
    )}

    {/* Las marcas se toman del proyecto y de la agencia activa; nunca de una URL pegada. */}
    <UITranslationBoundary attributes={["title"]}><CollapsibleSection title="Marcas y Logos" icon={BadgeCheck} defaultOpen={false}>
      <div className="space-y-2.5">
        <label className="flex items-center justify-between rounded-xl border border-slate-200 p-2.5 text-slate-700 hover:bg-slate-50 cursor-pointer">
          <span className="text-[10px] font-bold"><LocalizedText text={"Mostrar logo del proyecto"} /></span>
          <input
            type="checkbox"
            checked={block.showDeveloperLogo !== false}
            onChange={(e) => update({ showDeveloperLogo: e.target.checked })}
            className="rounded accent-blue-600"
          />
        </label>

        {block.showDeveloperLogo !== false && (
          <UITranslationBoundary attributes={["label"]}><RangeField
            label="Tamaño logo del proyecto"
            value={block.projectLogoSize || 56}
            min={24}
            max={110}
            suffix="px"
            onChange={(val) => update({ projectLogoSize: val })}
          /></UITranslationBoundary>
        )}

        <label className="flex items-center justify-between rounded-xl border border-slate-200 p-2.5 text-slate-700 hover:bg-slate-50 cursor-pointer">
          <span className="text-[10px] font-bold"><LocalizedText text={"Mostrar logo de mi Agencia"} /></span>
          <input
            type="checkbox"
            checked={block.showBrokerLogo !== false}
            onChange={(e) => update({ showBrokerLogo: e.target.checked })}
            className="rounded accent-blue-600"
          />
        </label>

        {block.showBrokerLogo !== false && (
          <>
            <UITranslationBoundary attributes={["label"]}><RangeField
              label="Tamaño logo de mi agencia"
              value={block.brokerLogoSize || 48}
              min={24}
              max={110}
              suffix="px"
              onChange={(val) => update({ brokerLogoSize: val })}
            /></UITranslationBoundary>
            <div className="space-y-1.5 rounded-xl border border-slate-200 p-2.5">
              <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-500"><LocalizedText text={"Versión del logo de agencia"} /></p>
              <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
                {([['normal', 'Normal'], ['white', 'Blanco']] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => update({ brokerLogoVariant: value })}
                    className={cn(
                      'rounded-md px-2 py-1.5 text-[9px] font-bold',
                      (block.brokerLogoVariant || 'normal') === value
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-slate-400'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {kind === 'dossier' && block.type === 'contact' && (
          <label className="flex items-center justify-between rounded-xl border border-slate-200 p-2.5 text-slate-700 hover:bg-slate-50 cursor-pointer">
            <span className="text-[10px] font-bold"><LocalizedText text={"Ocultar datos del agente"} /></span>
            <input type="checkbox" checked={block.hideBrokerDetails === true} onChange={(e) => update({ hideBrokerDetails: e.target.checked })} className="rounded accent-blue-600" />
          </label>
        )}
      </div>
    </CollapsibleSection></UITranslationBoundary>

    {/* Pie de Página */}
    <UITranslationBoundary attributes={["title"]}><CollapsibleSection title="Pie de Página" icon={FileText} defaultOpen={false}>
      <div className="space-y-2">
        <label className="flex items-center justify-between rounded-xl border border-slate-200 p-2.5 text-slate-700 hover:bg-slate-50 cursor-pointer">
          <span className="text-[10px] font-bold"><LocalizedText text={"Ocultar pie en esta página"} /></span>
          <input
            type="checkbox"
            checked={block.hideFooter === true}
            onChange={(e) => update({ hideFooter: e.target.checked })}
            className="rounded accent-blue-600 w-3.5 h-3.5"
          />
        </label>

        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="text-[9px] font-bold text-slate-700 block"><LocalizedText text={"Color del texto"} /></span>
            <span className="text-[8px] text-slate-400 block"><LocalizedText text={"Paginación y disclaimer"} /></span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={block.footerTextColor || block.disclaimerColor || block.accentColor || '#64748b'}
              onChange={(e) => update({ footerTextColor: e.target.value, disclaimerColor: e.target.value })}
              className="h-6 w-7 cursor-pointer border-0 bg-transparent p-0"
            />
            <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">
              {block.footerTextColor || block.disclaimerColor || block.accentColor || '#64748b'}
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[9px] font-bold text-slate-600 block"><LocalizedText text={"Disclaimer legal"} /></span>
              <span className="text-[8px] text-slate-400 block"><LocalizedText text={"Texto junto a la numeración"} /></span>
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={block.showDisclaimer !== false}
                onChange={(e) => update({ showDisclaimer: e.target.checked })}
                className="rounded accent-blue-600 w-3.5 h-3.5"
              />
              <span className="text-[8.5px] font-bold text-slate-500"><LocalizedText text={"Visible"} /></span>
            </label>
          </div>
          {block.showDisclaimer !== false && (
            <div className="space-y-1.5">
              <textarea
                value={block.disclaimer ?? ''}
                onChange={(e) => update({ disclaimer: e.target.value })}
                placeholder={defaultDisclaimer}
                rows={2}
                className="editor-input text-[10px] bg-white w-full rounded-lg border border-slate-200 p-1.5 text-slate-700 focus:outline-none focus:border-blue-500"
              />
              <div className="flex items-center justify-between pt-0.5">
                <span className="text-[8px] text-slate-400"><LocalizedText text={"Color propio disclaimer (opcional)"} /></span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={block.disclaimerColor || block.footerTextColor || block.accentColor || '#64748b'}
                    onChange={(e) => update({ disclaimerColor: e.target.value })}
                    className="h-5 w-6 cursor-pointer border-0 bg-transparent p-0"
                  />
                  <span className="text-[8px] font-mono text-slate-400 uppercase">
                    {block.disclaimerColor || block.footerTextColor || '#64748b'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </CollapsibleSection></UITranslationBoundary>

    <UITranslationBoundary attributes={["title"]}><CollapsibleSection title="Ajustes de Página" icon={Sliders} defaultOpen={false}>
      <label className="flex items-center justify-between rounded-xl border border-slate-200 p-2.5 text-slate-700 hover:bg-slate-50 cursor-pointer">
        <span className="text-[10px] font-bold"><LocalizedText text={"Ocultar página de la presentación"} /></span>
        <input type="checkbox" checked={!!block.hidden} onChange={(event) => update({ hidden: event.target.checked })} className="rounded accent-blue-600" />
      </label>
    </CollapsibleSection></UITranslationBoundary>
    </div>
  );
}

function DesignInspector({ block, update }: { block: Block; update: (update: Partial<Block>) => void }) {
  const layouts: { id: LayoutId; label: string }[] = [
    { id: 'full', label: 'Completo' },
    { id: 'split-left', label: 'Imagen izq.' },
    { id: 'split-right', label: 'Imagen der.' },
    { id: 'vertical-top', label: 'Imagen arriba' },
    { id: 'vertical-bottom', label: 'Imagen abajo' },
  ];

  const isCover = block.type === 'cover' || block.id === 'cr-cover';
  const grid = block.containerGrid || block.galleryGrid;
  const isContainerActive = Boolean(grid && grid !== ('none'));

  return (
    <div className="space-y-4">
      {!isCover && (
        <UITranslationBoundary attributes={["title"]}><CollapsibleSection
          title="Estructura de Contenedor"
          icon={LayoutGrid}
          badge={isContainerActive ? (grid as string) : undefined}
          defaultOpen={true}
        >
          <div className="space-y-3">
            <UITranslationBoundary attributes={["label"]}><Field label="Plantilla de Contenedor / Mosaico">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'none', label: 'Estándar (Libre)' },
                  { id: 'single', label: '1 Grande' },
                  { id: 'two-col', label: '2 Columnas' },
                  { id: 'three-col', label: '3 Columnas' },
                  { id: 'one-top-two', label: '1 + 2 Abajo' },
                  { id: 'two-left-one', label: '2 Izq + 1 Der' },
                  { id: 'panoramic', label: 'Panorámica' },
                  { id: 'mosaic', label: 'Mosaico 4' },
                ].map((tmpl) => {
                  const isSelected = tmpl.id === 'none'
                    ? !isContainerActive
                    : (block.containerGrid || block.galleryGrid) === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => {
                        if (tmpl.id === 'none') {
                          update({ containerGrid: undefined, galleryGrid: undefined });
                        } else {
                          update({
                            containerGrid: tmpl.id as Block['containerGrid'],
                            galleryGrid: tmpl.id as Block['containerGrid'],
                          });
                        }
                      }}
                      className={cn(
                        'rounded-lg border px-2 py-2 text-[9px] font-bold transition text-left',
                        isSelected
                          ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-xs'
                          : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                      )}
                    >
                      {tmpl.label}
                    </button>
                  );
                })}
              </div>
            </Field></UITranslationBoundary>

            {isContainerActive && (
              <div className="space-y-3 bg-blue-50/50 p-3 rounded-xl border border-blue-100/80">
                <UITranslationBoundary attributes={["label"]}><RangeField
                  label="Espaciado (Gap)"
                  value={block.containerGap ?? block.galleryGap ?? 12}
                  min={0}
                  max={32}
                  suffix="px"
                  onChange={(val) => update({ containerGap: val, galleryGap: val })}
                /></UITranslationBoundary>
                <UITranslationBoundary attributes={["label"]}><RangeField
                  label="Margen Lateral / Padding"
                  value={block.containerPadding ?? block.galleryPadding ?? 16}
                  min={0}
                  max={48}
                  suffix="px"
                  onChange={(val) => update({ containerPadding: val, galleryPadding: val })}
                /></UITranslationBoundary>
              </div>
            )}
          </div>
        </CollapsibleSection></UITranslationBoundary>
      )}

      <UITranslationBoundary attributes={["title"]}><CollapsibleSection
        title="Composición de Imagen"
        icon={Layers}
        defaultOpen={!isContainerActive}
      >
        <UITranslationBoundary attributes={["label"]}><Field label="Disposición general">
          <div className="grid grid-cols-2 gap-2">
            {layouts.map((layout) => (
              <button
                key={layout.id}
                type="button"
                onClick={() =>
                  update({
                    layout: layout.id,
                    containerGrid: undefined,
                    galleryGrid: undefined,
                    ...(layout.id === 'full' ? { backgroundType: 'image' } : {}),
                  })
                }
                className={cn(
                  'rounded-lg border px-2 py-2.5 text-[9px] font-bold transition',
                  !isContainerActive && block.layout === layout.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-xs'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                )}
              >
                {layout.label}
              </button>
            ))}
          </div>
        </Field></UITranslationBoundary>
      </CollapsibleSection></UITranslationBoundary>

      <UITranslationBoundary attributes={["title"]}><CollapsibleSection title="Tipografía" icon={Type} defaultOpen={false}>
        <div className="space-y-3">
          <UITranslationBoundary attributes={["label"]}><Field label="Familia tipográfica">
            <div className="grid grid-cols-3 gap-1.5">
              {([['sans', 'Moderna'], ['serif', 'Editorial'], ['mono', 'Técnica']] as const).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => update({ fontFamily: val })}
                  className={cn(
                    'rounded-lg border py-2 text-[9px] font-bold transition',
                    (block.fontFamily || 'sans') === val ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-xs' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </Field></UITranslationBoundary>
          <UITranslationBoundary attributes={["label"]}><RangeField label="Tamaño del antetítulo" value={block.kickerSize || 9} min={7} max={18} suffix="px" onChange={(value) => update({ kickerSize: value })} /></UITranslationBoundary>
          <UITranslationBoundary attributes={["label"]}><RangeField label="Tamaño del título" value={block.titleSize} min={20} max={72} suffix="px" onChange={(value) => update({ titleSize: value })} /></UITranslationBoundary>
          <UITranslationBoundary attributes={["label"]}><RangeField label="Tamaño del texto" value={block.bodySize} min={10} max={24} suffix="px" onChange={(value) => update({ bodySize: value })} /></UITranslationBoundary>
          {block.type === 'stats' && (
            <UITranslationBoundary attributes={["label"]}><RangeField label="Tamaño de las cifras" value={block.metricValueSize || 18} min={12} max={36} suffix="px" onChange={(value) => update({ metricValueSize: value })} /></UITranslationBoundary>
          )}
        </div>
      </CollapsibleSection></UITranslationBoundary>

      <UITranslationBoundary attributes={["title"]}><CollapsibleSection title="Fondo y Colores" icon={Palette} defaultOpen={false}>
        <div className="space-y-3">
          <UITranslationBoundary attributes={["label"]}><Field label="Tipo de Fondo">
            <div className="grid grid-cols-3 gap-2">
              {(['solid', 'gradient', 'image'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => update({ backgroundType: value })}
                  className={cn(
                    'rounded-lg border px-1 py-2 text-[9px] font-bold capitalize transition',
                    block.backgroundType === value ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-xs' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                  )}
                >
                  {value === 'solid' ? 'Color' : value === 'gradient' ? 'Degradado' : 'Imagen'}
                </button>
              ))}
            </div>
          </Field></UITranslationBoundary>

          {block.backgroundType === 'gradient' ? (
            <div className="grid grid-cols-2 gap-2">
              <UITranslationBoundary attributes={["label"]}><ColorField label="Color 1" value={block.backgroundColor} onChange={(value) => update({ backgroundColor: value })} /></UITranslationBoundary>
              <UITranslationBoundary attributes={["label"]}><ColorField label="Color 2" value={block.gradientColor2 || block.accentColor} onChange={(value) => update({ gradientColor2: value })} /></UITranslationBoundary>
            </div>
          ) : block.backgroundType === 'solid' ? (
            <UITranslationBoundary attributes={["label"]}><ColorField label="Color de fondo" value={block.backgroundColor} onChange={(value) => update({ backgroundColor: value })} /></UITranslationBoundary>
          ) : null}

          <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
            <UITranslationBoundary attributes={["label"]}><ColorField label="Color de texto" value={block.textColor} onChange={(value) => update({ textColor: value })} /></UITranslationBoundary>
            <UITranslationBoundary attributes={["label"]}><ColorField label="Color de acento" value={block.accentColor} onChange={(value) => update({ accentColor: value })} /></UITranslationBoundary>
            <UITranslationBoundary attributes={["label"]}><ColorField label="Color pie de página" value={block.footerTextColor || block.disclaimerColor || block.accentColor || '#64748b'} onChange={(value) => update({ footerTextColor: value, disclaimerColor: value })} /></UITranslationBoundary>
            <UITranslationBoundary attributes={["label"]}><ColorField label="Color legal" value={block.disclaimerColor || block.footerTextColor || '#94a3b8'} onChange={(value) => update({ disclaimerColor: value })} /></UITranslationBoundary>
          </div>

          <UITranslationBoundary attributes={["label"]}><RangeField
            label="Oscurecer fondo / Transparencia"
            value={block.overlayOpacity ?? 35}
            min={0}
            max={95}
            suffix="%"
            onChange={(value) => update({ overlayOpacity: value })}
          /></UITranslationBoundary>
        </div>
      </CollapsibleSection></UITranslationBoundary>

      <UITranslationBoundary attributes={["title"]}><CollapsibleSection title="Dimensiones y Espaciado" icon={Sliders} defaultOpen={false}>
        <div className="space-y-3">
          <UITranslationBoundary attributes={["label"]}><RangeField label="Espaciado interno" value={block.padding} min={20} max={88} suffix="px" onChange={(value) => update({ padding: value })} /></UITranslationBoundary>
          <UITranslationBoundary attributes={["label"]}><RangeField label="Altura de página" value={block.minHeight} min={420} max={940} step={20} suffix="px" onChange={(value) => update({ minHeight: value })} /></UITranslationBoundary>
        </div>
      </CollapsibleSection></UITranslationBoundary>
    </div>
  );
}

function MediaInspector({ block, update }: { block: Block; update: (update: Partial<Block>) => void }) {
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const mainInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleUploadFile = async (file: File, isBanner: boolean) => {
    if (isBanner) setUploadingBanner(true);
    else setUploadingMain(true);

    setUploadError('');
    try {
      const publicUrl = await uploadPresentationImage(file, isBanner ? 'banners' : 'slides');
      if (isBanner) update({ secondaryImage: publicUrl });
      else update({ image: publicUrl });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'No fue posible subir la imagen. Inténtalo de nuevo.');
    } finally {
      if (isBanner) setUploadingBanner(false);
      else setUploadingMain(false);
    }
  };

  return (
    <div className="space-y-5">
      {uploadError && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-800"><LocalizedText text={"La imagen no se agregó. "} />{uploadError}</p>}
      {block.type === 'floorplan' && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-[9px] leading-4 text-blue-800"><LocalizedText text={"Selecciona hasta dos imágenes desde la biblioteca. Se mostrarán lado a lado como plano técnico y plano ilustrado."} /></div>
      )}

      {/* SECCIÓN 1: IMAGEN PRINCIPAL */}
      <UITranslationBoundary attributes={["title"]}><CollapsibleSection title="Imagen Principal" icon={ImageIcon} defaultOpen={true}>
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-700"><LocalizedText text={"Estado de la imagen"} /></span>
          {block.image && (
            <button
              type="button"
              onClick={() => update({ image: undefined })}
              className="text-[9px] font-bold text-rose-600 hover:text-rose-800 transition"
            ><LocalizedText text={"Quitar"} /></button>
          )}
        </div>

        <div className="relative h-36 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-inner">
          {block.image ? (
            <UITranslationBoundary attributes={["alt"]}><Image
              src={block.image}
              alt="Imagen seleccionada"
              fill
              unoptimized={block.image.startsWith('data:') || block.image.startsWith('http')}
              sizes="286px"
              className={block.imageFit === 'cover' ? 'object-cover' : 'object-contain'}
              style={{ objectPosition: block.imagePosition || 'center' }}
            /></UITranslationBoundary>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-1.5 text-xs text-slate-400">
              <ImageIcon className="h-6 w-6 stroke-[1.5]" />
              <span className="text-[10px]"><LocalizedText text={"Sin imagen asignada"} /></span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => mainInputRef.current?.click()}
            disabled={uploadingMain}
            className="flex-1 inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 text-[10px] font-bold text-slate-700 hover:bg-slate-100 transition disabled:opacity-50"
          >
            <Upload className="h-3.5 w-3.5 text-slate-500" />
            <span>{uploadingMain ? 'Subiendo...' : <LocalizedText text={"Subir desde PC"} />}</span>
          </button>
          <input
            type="file"
            ref={mainInputRef}
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUploadFile(file, false);
              e.target.value = '';
            }}
          />
        </div>

        <UITranslationBoundary attributes={["label"]}><Field label="Ajuste de imagen">
          <div className="grid grid-cols-2 gap-2">
            {(['cover', 'contain'] as const).map((fit) => (
              <button
                key={fit}
                type="button"
                onClick={() => update({ imageFit: fit })}
                className={cn(
                  'rounded-lg border py-1.5 text-[9px] font-bold transition',
                  block.imageFit === fit
                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-2xs'
                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                )}
              >
                {fit === 'cover' ? 'Cubrir (Cover)' : 'Contener (Contain)'}
              </button>
            ))}
          </div>
        </Field></UITranslationBoundary>

        <UITranslationBoundary attributes={["label"]}><Field label="Posición">
          <select
            value={block.imagePosition || 'center'}
            onChange={(event) => update({ imagePosition: event.target.value })}
            className="editor-input"
          >
            <option value="center"><LocalizedText text={"Centro"} /></option>
            <option value="top"><LocalizedText text={"Arriba"} /></option>
            <option value="bottom"><LocalizedText text={"Abajo"} /></option>
            <option value="left"><LocalizedText text={"Izquierda"} /></option>
            <option value="right"><LocalizedText text={"Derecha"} /></option>
          </select>
        </Field></UITranslationBoundary>

        {(block.layout === 'split-left' || block.layout === 'split-right') && (
          <label className="flex items-center justify-between rounded-xl border border-slate-200 p-2.5">
            <span>
              <span className="block text-[10px] font-bold text-slate-700"><LocalizedText text={"Imagen expandida"} /></span>
              <span className="mt-0.5 block text-[8px] text-slate-400"><LocalizedText text={"Cubre toda la altura del slide sin márgenes."} /></span>
            </span>
            <input type="checkbox" checked={!!block.imageExpand} onChange={(e) => update({ imageExpand: e.target.checked })} />
          </label>
        )}

        <UITranslationBoundary attributes={["label"]}><RangeField
          label="Oscurecer imagen / Overlay"
          value={block.overlayOpacity ?? 35}
          min={0}
          max={85}
          suffix="%"
          onChange={(value) => update({ overlayOpacity: value })}
        /></UITranslationBoundary>
      </CollapsibleSection></UITranslationBoundary>

      {/* SECCIÓN 2: BANNER ESPECIAL / SEGUNDA IMAGEN (SPLIT & COMPOSICIÓN) */}
      <UITranslationBoundary attributes={["title"]}><CollapsibleSection
        title="Banner / Imagen Secundaria"
        icon={Layers}
        defaultOpen={Boolean(block.secondaryImage)}
      >
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-slate-500"><LocalizedText text={"Para diapositivas con diseño dividido (Split)"} /></span>
          {block.secondaryImage && (
            <button
              type="button"
              onClick={() => update({ secondaryImage: undefined })}
              className="text-[9px] font-bold text-rose-600 hover:text-rose-800 transition"
            ><LocalizedText text={"Quitar"} /></button>
          )}
        </div>

        <div className="relative h-28 overflow-hidden rounded-xl border border-blue-200 bg-white shadow-inner">
          {block.secondaryImage ? (
            <UITranslationBoundary attributes={["alt"]}><Image
              src={block.secondaryImage}
              alt="Banner especial"
              fill
              unoptimized={block.secondaryImage.startsWith('data:') || block.secondaryImage.startsWith('http')}
              sizes="286px"
              className={block.secondaryImageFit === 'contain' ? 'object-contain' : 'object-cover'}
              style={{ objectPosition: block.secondaryImagePosition || 'center' }}
            /></UITranslationBoundary>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-1 text-xs text-slate-400 p-2 text-center">
              <ImageIcon className="h-5 w-5 text-blue-400 stroke-[1.5]" />
              <span className="text-[9px] text-slate-500"><LocalizedText text={"Sin banner asignado. Sube una imagen para verla en el lado opuesto."} /></span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => bannerInputRef.current?.click()}
            disabled={uploadingBanner}
            className="w-full inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 text-[10px] font-bold text-blue-800 hover:bg-blue-100 transition disabled:opacity-50"
          >
            <Upload className="h-3.5 w-3.5 text-blue-600" />
            <span>{uploadingBanner ? 'Subiendo banner...' : <LocalizedText text={"Subir Banner Especial (desde PC)"} />}</span>
          </button>
          <input
            type="file"
            ref={bannerInputRef}
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUploadFile(file, true);
              e.target.value = '';
            }}
          />
        </div>

        {block.secondaryImage && (
          <>
            <UITranslationBoundary attributes={["label"]}><Field label="Ajuste del Banner">
              <div className="grid grid-cols-2 gap-2">
                {(['cover', 'contain'] as const).map((fit) => (
                  <button
                    key={fit}
                    type="button"
                    onClick={() => update({ secondaryImageFit: fit })}
                    className={cn(
                      'rounded-lg border py-1.5 text-[9px] font-bold transition',
                      (block.secondaryImageFit || 'cover') === fit
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-2xs'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                    )}
                  >
                    {fit === 'cover' ? 'Cubrir (Cover)' : 'Contener (Contain)'}
                  </button>
                ))}
              </div>
            </Field></UITranslationBoundary>

            <UITranslationBoundary attributes={["label"]}><Field label="Posición del Banner">
              <select
                value={block.secondaryImagePosition || 'center'}
                onChange={(event) => update({ secondaryImagePosition: event.target.value })}
                className="editor-input"
              >
                <option value="center"><LocalizedText text={"Centro"} /></option>
                <option value="top"><LocalizedText text={"Arriba"} /></option>
                <option value="bottom"><LocalizedText text={"Abajo"} /></option>
                <option value="left"><LocalizedText text={"Izquierda"} /></option>
                <option value="right"><LocalizedText text={"Derecha"} /></option>
              </select>
            </Field></UITranslationBoundary>
          </>
        )}
      </CollapsibleSection></UITranslationBoundary>
    </div>
  );
}

function LegalInspector({ block, update }: { block: Block; update: (update: Partial<Block>) => void }) {
  return (
    <div className="space-y-4">
      <UITranslationBoundary attributes={["title"]}><CollapsibleSection title="Aviso Legal de la Página" icon={ShieldAlert} defaultOpen={true}>
        <div className="space-y-3">
          <label className="flex items-center justify-between rounded-xl border border-slate-200 p-2.5 text-slate-700 hover:bg-slate-50 cursor-pointer">
            <div>
              <span className="block text-[10px] font-bold text-slate-700"><LocalizedText text={"Mostrar disclaimer"} /></span>
              <span className="mt-0.5 block text-[8px] text-slate-400"><LocalizedText text={"Se imprime al pie de esta página."} /></span>
            </div>
            <input
              type="checkbox"
              checked={block.showDisclaimer !== false}
              onChange={(event) => update({ showDisclaimer: event.target.checked })}
              className="rounded accent-blue-600 w-3.5 h-3.5"
            />
          </label>
          <UITranslationBoundary attributes={["label"]}><Field label="Texto legal">
            <textarea
              value={block.disclaimer ?? ''}
              onChange={(event) => update({ disclaimer: event.target.value })}
              placeholder={defaultDisclaimer}
              rows={6}
              className="editor-textarea"
            />
          </Field></UITranslationBoundary>
          <UITranslationBoundary attributes={["label"]}><ColorField label="Color legal" value={block.disclaimerColor || '#94a3b8'} onChange={(value) => update({ disclaimerColor: value })} /></UITranslationBoundary>
          <UITranslationBoundary attributes={["label"]}><RangeField label="Tamaño legal" value={block.disclaimerSize || 9} min={7} max={14} suffix="px" onChange={(value) => update({ disclaimerSize: value })} /></UITranslationBoundary>
        </div>
      </CollapsibleSection></UITranslationBoundary>
    </div>
  );
}

function MediaLibrary({ media, onChoose, compact }: { media: string[]; onChoose: (url: string) => void; compact?: boolean }) {
  const [showAll, setShowAll] = useState(false);
  const initialCount = compact ? 6 : 9;
  const displayedMedia = showAll ? media : media.slice(0, initialCount);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400"><LocalizedText text={"Galería del proyecto ("} />{media.length}<LocalizedText text={" fotos)"} /></p>
        {media.length > initialCount && (
          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            className="text-[9px] font-bold text-blue-600 hover:text-blue-800 transition"
          >
            {showAll ? 'Mostrar menos' : `Ver todas (${media.length})`}
          </button>
        )}
      </div>

      <div className={cn('grid gap-2', compact ? 'grid-cols-2' : 'grid-cols-3')}>
        {displayedMedia.map((url, index) => (
          <button
            type="button"
            key={`${url.slice(-28)}-${index}`}
            onClick={() => onChoose(url)}
            className="group relative h-24 overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
          >
            <Image
              src={url}
              alt={`Recurso ${index + 1}`}
              fill
              loading="lazy"
              unoptimized
              sizes="140px"
              className="object-cover transition group-hover:scale-105"
            />
            <span className="absolute inset-0 bg-black/0 transition group-hover:bg-black/15" />
          </button>
        ))}
      </div>

      {media.length > initialCount && (
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={() => setShowAll((prev) => !prev)}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[9px] font-bold text-slate-600 hover:bg-slate-50 transition shadow-2xs"
          >
            {showAll ? (
              <>
                <ChevronUp className="h-3 w-3 text-slate-500" />
                <span><LocalizedText text={"Mostrar menos"} /></span>
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 text-blue-600" />
                <span><LocalizedText text={"+ Ver "} />{media.length - initialCount}<LocalizedText text={" fotos más"} /></span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function PresentationCanvas({
  blocks,
  selectedId,
  onSelect,
  kind,
  template,
  project,
  brand,
  units,
  proposalItems,
  clientName,
  brokerName,
  brokerPhone,
  brokerEmail,
  device,
  canvasRatio = '1120x820',
  previewMode = false,
}: {
  blocks: Block[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  kind: PresentationKind;
  template: TemplateId;
  project: PortalProject;
  brand: ReturnType<typeof useBrand>['theme'];
  units: PortalProject['units'];
  proposalItems?: MultiPropertyProposal['items'];
  clientName?: string;
  brokerName?: string;
  brokerPhone?: string | null;
  brokerEmail?: string;
  device: 'desktop' | 'mobile';
  canvasRatio?: CanvasRatio;
  previewMode?: boolean;
}) {
  const visible = blocks.filter((block) => !block.hidden);
  const isProposal = kind === 'proposal';
  const nativeWidth = isProposal ? 816 : canvasRatio === '1920x1080' ? 1920 : 1120;
  const nativeHeight = isProposal ? 1056 : canvasRatio === '1920x1080' ? 1080 : 820;

  return (
    <div className="space-y-6">
      {visible.map((block, index) => (
        <div
          key={block.id}
          id={`presentation-page-${block.id}`}
          data-presentation-slide="true"
          role="button"
          tabIndex={0}
          onClick={() => onSelect?.(block.id)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onSelect?.(block.id);
            }
          }}
          className={cn(
            'relative block w-full overflow-hidden rounded-2xl border bg-[#fcfbf9] text-left shadow-2xl transition',
            !previewMode && block.id === selectedId
              ? 'border-blue-700 ring-2 ring-blue-200'
              : 'border-white/10 hover:border-blue-300'
          )}
        >
          <ScaledSlideSheet width={nativeWidth} height={nativeHeight}>
            {isProposal ? (
              <ProposalMagazinePage
                block={block}
                index={index}
                total={visible.length}
                projectName={project.name}
                clientName={clientName}
                agencyName={brand.name || ''}
                agencyLogo={brand.logo_url}
                brokerName={brokerName || brand.name || 'Asesor inmobiliario'}
                brokerPhone={brokerPhone || brand.whatsapp_number || ''}
                brokerEmail={brokerEmail || brand.contact_email || ''}
                items={proposalItems}
              />
            ) : (
              <MagazineSlide
                block={block}
                index={index}
                total={visible.length}
                projectName={project.name}
                projectSlug={project.slug}
                brokerName={brand.name || 'Asesor'}
                brokerPhone={brand.whatsapp_number || ''}
                brokerEmail={brand.contact_email || ''}
                agencyName={brand.name || ''}
                agencyLogo={brand.logo_url}
              />
            )}
          </ScaledSlideSheet>
          {!previewMode && block.id === selectedId && (
            <span className="absolute right-3 top-3 z-30 rounded-lg bg-blue-950 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wide text-white shadow-lg pointer-events-none"><LocalizedText text={"Editando"} /></span>
          )}
        </div>
      ))}
    </div>
  );
}

function CanvasBlock({
  block,
  active,
  onClick,
  template,
  project,
  brand,
  units,
  index,
  totalBlocks,
  mobile,
  canvasRatio = '1120x820',
  previewMode,
}: {
  block: Block;
  active: boolean;
  onClick: () => void;
  template: TemplateId;
  project: PortalProject;
  brand: ReturnType<typeof useBrand>['theme'];
  units: PortalProject['units'];
  index: number;
  totalBlocks: number;
  mobile: boolean;
  canvasRatio?: CanvasRatio;
  previewMode: boolean;
}) {
  const background = block.backgroundType === 'gradient' ? `linear-gradient(135deg, ${block.backgroundColor}, ${block.accentColor})` : block.backgroundColor;
  const imageFirst = block.layout === 'split-left' || block.layout === 'vertical-top';
  const split = block.layout === 'split-left' || block.layout === 'split-right';
  const vertical = block.layout === 'vertical-top' || block.layout === 'vertical-bottom';
  const isFullImage = block.backgroundType === 'image' && !!block.image;
  const isCover = block.type === 'cover' || block.id === 'cr-cover';
  const shouldRenderFullBg = isFullImage && !isCover;
  const isFloatingCard = !!block.isFloatingCard;
  const isMasterPlan = !!block.isMasterPlanSlide || block.id === 'cr-master-plan';
  const isPricing = !!block.isPricingSlide || block.id === 'cr-precios';
  const isTypologies = block.type === 'typologies';
  const content = <PageContent block={block} project={project} brand={brand} units={units} mobile={mobile} isFullBg={shouldRenderFullBg} />;

  const isExpanded = !!block.imageExpand && split;
  const expandRounding = isExpanded
    ? (block.layout === 'split-left' ? 'rounded-r-none rounded-l-2xl' : 'rounded-l-none rounded-r-2xl')
    : 'rounded-2xl';

  const media = block.image ? (
    <div
      className={cn(
        'relative overflow-hidden',
        split
          ? isExpanded
            ? cn('absolute inset-y-0 w-1/2 z-0', block.layout === 'split-left' ? 'left-0' : 'right-0', expandRounding)
            : cn('my-auto h-[380px] sm:h-[440px] w-full max-w-[500px] mx-auto', expandRounding)
          : vertical
          ? 'h-[280px] w-full rounded-2xl'
          : 'absolute inset-0 z-0'
      )}
    >
      <Image
        src={block.image}
        alt={block.title}
        fill
        unoptimized={block.image.startsWith('data:') || block.image.startsWith('http')}
        sizes="1120px"
        className={block.imageFit === 'cover' ? 'object-cover' : 'object-contain'}
        style={{ objectPosition: block.imagePosition }}
      />
      {(shouldRenderFullBg || split || vertical) && (
        <div className="absolute inset-0 bg-slate-950 pointer-events-none" style={{ opacity: (block.overlayOpacity ?? 0) / 100 }} />
      )}
    </div>
  ) : null;

  const fontClass = block.fontFamily === 'serif' ? 'font-serif' : block.fontFamily === 'mono' ? 'font-mono' : 'font-sans';
  const effectiveTextColor = shouldRenderFullBg && (block.overlayOpacity ?? 35) >= 30 && block.textColor.toLowerCase() === '#111827' ? '#ffffff' : block.textColor;

  const isLandscape = canvasRatio === '1120x820' || canvasRatio === '1920x1080';
  const aspectClass = canvasRatio === '1120x820' ? 'aspect-[1120/820]' : canvasRatio === '1920x1080' ? 'aspect-[16/9]' : '';

  return (
    <section
      id={`presentation-page-${block.id}`}
      data-presentation-slide="true"
      onClick={onClick}
      className={cn(
        'relative isolate w-full min-w-0 overflow-hidden shadow-xl transition flex flex-col justify-between',
        aspectClass,
        fontClass,
        template === 'minimal' ? 'rounded-2xl' : template === 'panorama' ? 'rounded-[28px]' : 'rounded-2xl',
        !previewMode && 'cursor-pointer border-2',
        active ? 'border-blue-500 ring-4 ring-blue-200' : !previewMode ? 'border-transparent hover:border-blue-300' : 'border-0'
      )}
      style={{
        minHeight: isLandscape ? undefined : mobile ? Math.min(block.minHeight, 680) : block.minHeight,
        background: shouldRenderFullBg ? 'transparent' : (isCover ? '#ffffff' : background),
        color: effectiveTextColor,
      }}
    >
      {shouldRenderFullBg && media}
      {active && (
        <span className="absolute right-3 top-3 z-30 rounded-lg bg-blue-600 px-2 py-1 text-[8px] font-extrabold uppercase tracking-wide text-white shadow-md no-export"><LocalizedText text={"Editando"} /></span>
      )}

      {/* Expanded Split Image — absolute, covers full slide height */}
      {isExpanded && block.image && (
        <div className={cn(
          'absolute inset-y-0 w-1/2 z-0 overflow-hidden',
          imageFirst ? 'left-0' : 'right-0'
        )}>
          <Image
            src={block.image}
            alt={block.title}
            fill
            unoptimized={block.image.startsWith('data:') || block.image.startsWith('http')}
            sizes="560px"
            className={block.imageFit === 'cover' ? 'object-cover' : 'object-contain'}
            style={{ objectPosition: block.imagePosition }}
          />
          {(block.overlayOpacity ?? 0) > 0 && (
            <div className="absolute inset-0 bg-slate-950 pointer-events-none" style={{ opacity: (block.overlayOpacity ?? 0) / 100 }} />
          )}
        </div>
      )}

      {/* Main Slide Content Area */}
      <div className="relative z-10 flex-1 flex flex-col justify-center min-h-0 w-full">
        {isFloatingCard ? (
          (() => {
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
              <div className="w-full h-full flex items-center justify-start p-8 sm:p-14">
                <div className={cn(
                  "bg-white/95 backdrop-blur-md rounded-3xl p-8 sm:p-10 border border-white/60 shadow-2xl text-left",
                  cols > 1 ? "max-w-2xl w-full space-y-4" : "max-w-lg space-y-4"
                )}>
                  <div className="space-y-1">
                    {block.kicker && (
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] block" style={{ color: accent }}>
                        {block.kicker}
                      </span>
                    )}
                    <h2 className="text-2xl sm:text-3xl font-serif italic text-slate-900 leading-tight">
                      {block.title}
                    </h2>
                    <div className="w-12 h-[1.5px] mt-2" style={{ backgroundColor: accent }} />
                  </div>

                  {block.body && (
                    <p className="text-xs text-slate-600 leading-relaxed font-sans">
                      {block.body}
                    </p>
                  )}

                  {items.length > 0 && (
                    <div className={cn("pt-2 max-h-[460px] overflow-y-auto pr-1", style === 'pills' ? 'flex flex-wrap gap-2' : gridClass)}>
                      {items.map((item: string, idx: number) => {
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
          })()
        ) : isMasterPlan ? (
          <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 p-8 sm:p-12 gap-8 items-center">
            {block.layout === 'split-left' ? (
              <>
                <div className="relative w-full h-[460px] rounded-2xl overflow-hidden order-1 md:order-1 flex items-center justify-center">
                  <UITranslationBoundary attributes={["alt"]}><Image
                    src={block.image || '/Cana-Rock-Star-Master-Plan.png'}
                    alt="Master Plan"
                    fill
                    className="object-contain"
                    unoptimized
                  /></UITranslationBoundary>
                </div>
                <div className="space-y-4 text-left flex flex-col justify-center order-2 md:order-2">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#d4af37] block">
                      {block.kicker}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-serif italic text-slate-900 leading-tight">
                      {block.title}
                    </h2>
                    <div className="w-12 h-[1.5px] bg-[#d4af37] mt-2" />
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-sans max-w-md">
                    {block.body}
                  </p>

                  {block.extraList && block.extraList.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      {block.extraList.map((item: string, i: number) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200/80 bg-white/90 shadow-2xs text-[11px] font-semibold text-slate-800"
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d4af37] text-white text-[9px] font-black">
                            {i + 1}
                          </span>
                          <span className="truncate">{item.replace(/^\d+\.\s*/, '')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="space-y-4 text-left flex flex-col justify-center">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#d4af37] block">
                      {block.kicker}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-serif italic text-slate-900 leading-tight">
                      {block.title}
                    </h2>
                    <div className="w-12 h-[1.5px] bg-[#d4af37] mt-2" />
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-sans max-w-md">
                    {block.body}
                  </p>

                  {block.extraList && block.extraList.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      {block.extraList.map((item: string, i: number) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-slate-200/80 bg-white/90 shadow-2xs text-[11px] font-semibold text-slate-800"
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#d4af37] text-white text-[9px] font-black">
                            {i + 1}
                          </span>
                          <span className="truncate">{item.replace(/^\d+\.\s*/, '')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative w-full h-[460px] rounded-2xl overflow-hidden flex items-center justify-center">
                  <UITranslationBoundary attributes={["alt"]}><Image
                    src={block.image || '/Cana-Rock-Star-Master-Plan.png'}
                    alt="Master Plan"
                    fill
                    className="object-contain"
                    unoptimized
                  /></UITranslationBoundary>
                </div>
              </>
            )}
          </div>
        ) : isPricing ? (
          <div className="w-full h-full p-8 sm:p-12 flex flex-col justify-between text-left">
            <div className="space-y-2 bg-white/95 border border-slate-100 shadow-sm rounded-3xl p-6 max-w-xl">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#d4af37] block">
                {block.kicker}
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif italic text-slate-900">
                {block.title}
              </h2>
              <p className="text-xs text-slate-600 font-sans">{block.body}</p>
              <div className="text-[9px] font-black uppercase tracking-wider text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl inline-flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span><LocalizedText text={"Inventario oficial verificado"} /></span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 w-full mt-4">
              {(block.pricingCards && block.pricingCards.length > 0
                ? block.pricingCards
                : derivePricingCards(project)
              ).map((card: { title: string; price: number; kicker?: string }, i: number) => (
                <div
                  key={i}
                  className="rounded-3xl border border-[#d4af37]/35 bg-[#0a1140] p-6 flex flex-col justify-between items-center text-center gap-3 shadow-xl"
                >
                  <div className="w-11 h-11 rounded-full border border-[#d4af37]/35 bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37]">
                    <BedDouble className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-wider text-[#d4af37] font-sans">
                    {card.title}
                  </span>
                  <div className="flex items-center justify-center gap-2 w-full mt-1">
                    <div className="w-4 h-[1px] bg-[#d4af37]/40" />
                    <span className="text-[8px] font-black text-[#d4af37] uppercase tracking-widest">
                      {card.kicker || 'A partir de'}
                    </span>
                    <div className="w-4 h-[1px] bg-[#d4af37]/40" />
                  </div>
                  <span className="text-2xl font-black text-white font-sans mt-0.5 tracking-tight"><LocalizedText text={"US$ "} />{Math.round(card.price).toLocaleString('en-US')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : isTypologies ? (
          (() => {
            const cards = block.typologyCards || [];
            const layout = block.typologyLayout || (cards.length === 1 ? 1 : cards.length === 2 ? 2 : 3);
            const accent = block.accentColor || '#d4af37';

            if (layout === 1 && cards.length > 0) {
              const card = cards[0];
              return (
                <div className="w-full h-full p-8 sm:p-12 flex flex-col justify-between text-left overflow-hidden">
                  <div className="space-y-1">
                    {block.kicker && (
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] block" style={{ color: accent }}>
                        {block.kicker}
                      </span>
                    )}
                    <h2 className="text-2xl sm:text-3xl font-serif italic leading-tight" style={{ color: block.textColor }}>
                      {block.title || card.name}
                    </h2>
                    <div className="w-12 h-[1.5px] mt-1.5" style={{ backgroundColor: accent }} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch flex-1 my-2 min-h-0">
                    <div className="md:col-span-7 h-full min-h-[300px] relative rounded-3xl overflow-hidden shadow-lg bg-slate-100 flex items-center justify-center">
                      {card.image ? (
                        <Image
                          src={card.image}
                          alt={card.name}
                          fill
                          unoptimized={card.image.startsWith('data:') || card.image.startsWith('http')}
                          sizes="(max-width: 768px) 100vw, 650px"
                          className={cn((card.imageFit || block.imageFit) === 'cover' ? 'object-cover object-center' : 'object-contain object-center p-3')}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-300 gap-2">
                          <Maximize2 className="w-10 h-10 stroke-[1.5]" />
                          <span className="text-xs font-bold uppercase tracking-wider"><LocalizedText text={"Plano arquitectónico"} /></span>
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-5 flex flex-col justify-between h-full space-y-4">
                      <div className="space-y-3">
                        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{card.name}</h3>
                        {block.body && <p className="text-xs text-slate-600 leading-relaxed font-sans">{block.body}</p>}

                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div className="rounded-2xl border border-slate-100 bg-white p-3.5 sm:p-4 flex items-center gap-3.5 shadow-xs">
                            <BedDouble className="w-5 h-5 shrink-0" strokeWidth={1.5} style={{ color: accent }} />
                            <div className="flex flex-col">
                              <span className="text-base font-extrabold text-slate-900 leading-none">{card.bedrooms}</span>
                              <span className="text-[8.5px] font-black uppercase tracking-wider text-slate-400 mt-1"><LocalizedText text={"Habitaciones"} /></span>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-slate-100 bg-white p-3.5 sm:p-4 flex items-center gap-3.5 shadow-xs">
                            <Bath className="w-5 h-5 shrink-0" strokeWidth={1.5} style={{ color: accent }} />
                            <div className="flex flex-col">
                              <span className="text-base font-extrabold text-slate-900 leading-none">{card.bathrooms}</span>
                              <span className="text-[8.5px] font-black uppercase tracking-wider text-slate-400 mt-1"><LocalizedText text={"Baños"} /></span>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-slate-100 bg-white p-3.5 sm:p-4 flex items-center gap-3.5 shadow-xs">
                            <Maximize2 className="w-5 h-5 shrink-0" strokeWidth={1.5} style={{ color: accent }} />
                            <div className="flex flex-col">
                              <span className="text-base font-extrabold text-slate-900 leading-none">{card.area ? `${card.area} m²` : '—'}</span>
                              <span className="text-[8.5px] font-black uppercase tracking-wider text-slate-400 mt-1"><LocalizedText text={"Metraje const."} /></span>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-slate-100 bg-white p-3.5 sm:p-4 flex items-center gap-3.5 shadow-xs">
                            <Car className="w-5 h-5 shrink-0" strokeWidth={1.5} style={{ color: accent }} />
                            <div className="flex flex-col">
                              <span className="text-base font-extrabold text-slate-900 leading-none">{card.parking ?? 0}</span>
                              <span className="text-[8.5px] font-black uppercase tracking-wider text-slate-400 mt-1"><LocalizedText text={"Parqueos"} /></span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Clean Price Row */}
                      <div className="pt-3 border-t border-slate-200/80 flex items-baseline justify-between">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                            {card.minPrice && card.minPrice > 0 ? <LocalizedText text={"Inversión desde"} /> : 'Disponibilidad'}
                          </p>
                          <p className="text-2xl sm:text-3xl font-serif italic font-bold tracking-tight text-slate-900 mt-0.5">
                            {card.minPrice && card.minPrice > 0
                              ? `US$ ${Math.round(card.minPrice).toLocaleString('en-US')}`
                              : 'Bajo consulta'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            const displayCards = cards.slice(0, layout);
            const gridCols = layout === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

            return (
              <div className="w-full h-full p-6 sm:p-10 flex flex-col justify-between text-left overflow-hidden">
                <div className="space-y-1 mb-2">
                  {block.kicker && (
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] block" style={{ color: accent }}>
                      {block.kicker}
                    </span>
                  )}
                  <h2 className="text-xl sm:text-2xl font-serif italic leading-tight" style={{ color: block.textColor }}>
                    {block.title || 'Tipologías y Modelos'}
                  </h2>
                  <div className="w-10 h-[1.5px] mt-1" style={{ backgroundColor: accent }} />
                </div>

                <div className={cn('grid gap-4 flex-1 my-2 min-h-0 items-stretch', gridCols)}>
                  {displayCards.map((card, i) => (
                    <div
                      key={card.id || i}
                      className="rounded-3xl border border-slate-200/80 bg-white/95 p-4 flex flex-col justify-between shadow-lg overflow-hidden"
                    >
                      <div className="relative w-full h-[150px] sm:h-[180px] rounded-2xl bg-slate-100 overflow-hidden flex items-center justify-center">
                        {card.image ? (
                          <Image
                            src={card.image}
                            alt={card.name}
                            fill
                            unoptimized={card.image.startsWith('data:') || card.image.startsWith('http')}
                            sizes="400px"
                            className={cn((card.imageFit || block.imageFit) === 'cover' ? 'object-cover object-center' : 'object-contain object-center p-2')}
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-300 gap-1.5">
                            <Maximize2 className="w-7 h-7 stroke-[1.5]" />
                            <span className="text-[9px] font-bold uppercase tracking-wider"><LocalizedText text={"Plano"} /></span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 mt-3 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight">{card.name}</h4>
                        </div>

                        {/* Clean Specs Row */}
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-slate-600 font-medium py-1">
                          <span>{card.bedrooms}<LocalizedText text={" Hab."} /></span>
                          <span className="text-slate-300">·</span>
                          <span>{card.bathrooms}<LocalizedText text={"Baños"} /></span>
                          {card.area ? (
                            <>
                              <span className="text-slate-300">·</span>
                              <span>{card.area}<LocalizedText text={" m²"} /></span>
                            </>
                          ) : null}
                          {card.parking !== undefined && card.parking > 0 ? (
                            <>
                              <span className="text-slate-300">·</span>
                              <span>{card.parking}<LocalizedText text={" Pq."} /></span>
                            </>
                          ) : null}
                        </div>

                        {/* Clean Price Line */}
                        <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between mt-1">
                          <span className="text-[8px] font-black uppercase tracking-[0.16em] text-slate-400">
                            {card.minPrice && card.minPrice > 0 ? <LocalizedText text={"Desde"} /> : 'Disponibilidad'}
                          </span>
                          <span className="text-sm sm:text-base font-serif italic font-bold text-slate-900">
                            {card.minPrice && card.minPrice > 0
                              ? `US$ ${Math.round(card.minPrice).toLocaleString('en-US')}`
                              : 'Bajo consulta'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()
        ) : split ? (
          isExpanded ? (
            <div
              className={cn('relative z-10 flex min-h-[inherit] items-center w-1/2', imageFirst ? 'ml-auto' : 'mr-auto')}
              style={{ padding: `clamp(24px, 6vw, ${block.padding}px)` }}
            >
              {content}
            </div>
          ) : (
            <div className={cn('relative z-10 grid min-h-[inherit] grid-cols-1', !mobile && 'sm:grid-cols-2')}>
              {imageFirst && media}
              <div className="flex min-w-0 items-center" style={{ padding: `clamp(24px, 6vw, ${block.padding}px)` }}>
                {content}
              </div>
              {!imageFirst && media}
            </div>
          )
        ) : vertical ? (
          <div className="relative z-10 flex min-h-[inherit] flex-col">
            {imageFirst && media}
            <div className="flex min-w-0 flex-1 items-center" style={{ padding: `clamp(24px, 6vw, ${block.padding}px)` }}>
              {content}
            </div>
            {!imageFirst && media}
          </div>
        ) : (
          <div
            className={cn(
              'relative z-10 flex min-w-0 min-h-[inherit] w-full h-full',
              isCover ? 'items-stretch p-0' : (block.type === 'stats' ? 'items-stretch' : 'items-center')
            )}
            style={{ padding: isCover ? 0 : `clamp(24px, 6vw, ${block.padding}px)` }}
          >
            {content}
          </div>
        )}
      </div>

      {/* Complex Badge (e.g. Cana Bay or Custom Complex) - Never on Cover */}
      {(block.showComplexBadge ?? (block.id === 'cr-golf-club' || block.id === 'cr-beach-club' || block.id === 'cr-racquet-club')) && !isCover && (
        <div className="absolute top-6 right-6 z-20 flex items-center drop-shadow-md">
          {block.complexBadgeLogoUrl || isCanaRockProject(project) ? (
            <div className="relative h-10 w-32 sm:w-36">
              <Image
                src={block.complexBadgeLogoUrl || '/cana-bay-logo-white.svg'}
                alt={block.complexBadgeText || 'Cana Bay'}
                fill
                className="object-contain object-right"
                unoptimized
              />
            </div>
          ) : (
            <span className="text-[10px] font-black uppercase tracking-widest text-white drop-shadow">
              {block.complexBadgeText || 'Cana Bay'}
            </span>
          )}
        </div>
      )}

      {/* Broker/Agency Logo at Top Right - Aligned with slide header */}
      {block.showBrokerLogo !== false && (block.customBrokerLogoUrl || brand.logo_url) && (
        <div className="absolute top-6 sm:top-8 right-8 sm:right-10 z-20 flex items-center justify-end pointer-events-none">
          <div
            className="relative shrink-0"
            style={{
              height: `${block.brokerLogoSize || 42}px`,
              width: `${Math.round((block.brokerLogoSize || 42) * 3.6)}px`,
              maxWidth: '180px',
            }}
          >
            <Image
              src={block.customBrokerLogoUrl || brand.logo_url!}
              alt={brand.name || 'Broker Inmobiliario'}
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

      {/* Official Slide Footer on Every Page - Never on Cover */}
      {!block.hideFooter && !isCover && (
        <footer
          className={cn(
            'relative z-20 w-full px-8 py-2.5 flex items-center justify-between text-[10px] font-bold tracking-widest uppercase select-none gap-4',
            isFullImage
              ? 'border-t border-white/20 text-white/90 bg-black/40 backdrop-blur-md'
              : 'border-t border-slate-200/60 text-slate-400 bg-[#fcfbf9]'
          )}
        >
          <div className="flex items-center min-w-0 flex-1 overflow-hidden">
            {/* Disclaimer integrated in footer line */}
            {(block.showDisclaimer ?? true) && (block.disclaimer || defaultDisclaimer) && (
              <span
                className="text-[8px] font-normal tracking-normal truncate font-sans normal-case select-text"
                style={{
                  color: block.footerTextColor || block.disclaimerColor || (isFullImage ? '#ffffff' : '#64748b'),
                  fontSize: block.disclaimerSize ? `${block.disclaimerSize}px` : '8px',
                }}
                title={block.disclaimer || defaultDisclaimer}
              >
                {block.disclaimer || defaultDisclaimer}
              </span>
            )}
          </div>
          <span className="shrink-0 font-bold" style={{ color: block.footerTextColor || block.disclaimerColor }}><LocalizedText text={"PÁG. "} />{String(index + 1).padStart(2, '0')}<LocalizedText text={" DE "} />{String(totalBlocks).padStart(2, '0')}
          </span>
        </footer>
      )}
    </section>
  );
}

function PageContent({ block, project, brand, units, mobile, isFullBg = false }: { block: Block; project: PortalProject; brand: ReturnType<typeof useBrand>['theme']; units: PortalProject['units']; mobile: boolean; isFullBg?: boolean }) {
  const isCanaRock = isCanaRockProject(project);
  const isSerif = block.fontFamily === 'serif';
  const titleLimit = block.layout === 'split-left' || block.layout === 'split-right' ? Math.min(block.titleSize, 44) : block.titleSize;
  const heading = (
    <div className="space-y-2">
      <p
        className="font-extrabold uppercase tracking-[0.22em] opacity-85"
        style={{ color: block.accentColor, fontSize: block.kickerSize || 9 }}
      >
        {block.kicker}
      </p>
      <h2
        className={cn(
          "break-words font-normal leading-[1.05] tracking-tight",
          isSerif ? "font-serif italic text-slate-900" : "font-black tracking-[-0.035em]"
        )}
        style={{ color: block.textColor, fontSize: mobile ? Math.min(titleLimit, 28) : `clamp(18px, 3vw, ${titleLimit}px)` }}
      >
        {block.title}
      </h2>
      {isSerif && <div className="w-12 h-[1.5px] bg-[#d4af37] mt-2 mb-3" />}
    </div>
  );

  if (block.type === 'cover') {
    // Luxury editorial cover with side photo and white capsules for all projects
    const specs = block.coverSpecs || computeProjectCoverSpecs(project);
    const hasSpecs = Boolean(
      specs.priceText ||
      specs.bedroomsText ||
      specs.bathroomsText ||
      specs.areaText ||
      specs.parkingText
    );

    const logo = block.projectLogoUrl || projectLogoForProposal(project);
    const showDeveloperLogo = block.showDeveloperLogo !== false && !!logo;

    const detectedSlug = project.slug ||
      (project.name?.toLowerCase().includes('uve') ? 'uve-residences' : undefined) ||
      (project.name?.toLowerCase().includes('palm view') ? 'palm-view' : undefined) ||
      (project.name?.toLowerCase().includes('elements') ? 'elements' : undefined) ||
      (project.name?.toLowerCase().includes('cipr') ? 'cipres-residences' : undefined);

    const fallbackAccent =
      detectedSlug === 'uve-residences'
        ? '#2F9DB8'
        : detectedSlug === 'cipres-residences'
        ? '#B5964A'
        : detectedSlug === 'palm-view'
        ? '#c5a880'
        : '#d4af37';
    const accent = block.accentColor || fallbackAccent;
    const coverImage = block.image || project.image;
    const isImageLeft = block.layout === 'split-left';

    return (
      <div className="w-full h-full relative z-10 flex overflow-hidden bg-white">
        {/* Editorial Content Side */}
        <div
          className={cn(
            'h-full flex flex-col justify-between p-6 sm:p-10 md:p-12 relative z-10',
            coverImage ? 'w-1/2 shrink-0' : 'w-full max-w-2xl mx-auto',
            isImageLeft ? 'order-2' : 'order-1'
          )}
        >
          {/* Top Header: Developer / Project Logo (Left) + Broker / Agency Logo (Right) */}
          <div className="w-full flex items-center justify-between gap-4">
            {showDeveloperLogo && logo ? (
              <div
                className="relative shrink-0"
                style={{
                  height: `${block.projectLogoSize || 48}px`,
                  width: `${Math.round((block.projectLogoSize || 48) * 3.6)}px`,
                  maxWidth: '50%',
                }}
              >
                <Image
                  src={logo}
                  alt={project.name || 'Proyecto'}
                  fill
                  className="object-contain object-left"
                  unoptimized={logo.startsWith('data:') || logo.startsWith('http')}
                />
              </div>
            ) : (
              <div className="h-5" />
            )}

            {/* Agency / Broker Logo on Cover */}
            {block.showBrokerLogo !== false && (block.customBrokerLogoUrl || brand.logo_url) && (
              <div
                className="relative shrink-0"
                style={{
                  height: `${block.brokerLogoSize || 42}px`,
                  width: `${Math.round((block.brokerLogoSize || 42) * 3.6)}px`,
                  maxWidth: '45%',
                }}
              >
                <Image
                  src={block.customBrokerLogoUrl || brand.logo_url!}
                  alt={brand.name || 'Agencia'}
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
          <div className="space-y-3.5 sm:space-y-4 my-auto py-2">
            {block.kicker && (
              <p
                className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em]"
                style={{ color: accent }}
              >
                {block.kicker}
              </p>
            )}

            <h1
              className="font-serif italic tracking-tight text-slate-950 leading-[1.05]"
              style={{
                fontSize: mobile
                  ? '1.85rem'
                  : block.titleSize
                  ? `clamp(2rem, 4vw, ${block.titleSize}px)`
                  : 'clamp(2rem, 4vw, 3.4rem)',
              }}
            >
              {block.title || project.name}
            </h1>

            {block.subHeader && !/^\d+$/.test(block.subHeader.trim()) ? (
              <div className="flex items-center gap-3">
                <div className="h-[2px] w-10 shrink-0" style={{ backgroundColor: accent }} />
                <p
                  className="text-[9.5px] sm:text-[10.5px] font-black uppercase tracking-[0.22em]"
                  style={{ color: accent }}
                >
                  {block.subHeader}
                </p>
              </div>
            ) : (
              <div className="h-[2px] w-12" style={{ backgroundColor: accent }} />
            )}

            {block.body && (
              <p
                className="text-xs sm:text-[13px] leading-relaxed text-slate-600 font-sans whitespace-pre-line"
                style={{ fontSize: block.bodySize ? `${block.bodySize}px` : undefined }}
              >
                {block.body.slice(0, 650)}
              </p>
            )}

            {/* Individual Specs Capsules - Solid White Background with Landing Line Graphic Colors */}
            {hasSpecs && (
              <div className="w-full flex flex-wrap items-center gap-2 pt-1.5">
                {specs.bedroomsText && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200 bg-white text-slate-900 shadow-xs">
                    <BedDouble className="w-4 h-4 shrink-0" style={{ color: accent }} strokeWidth={2} />
                    <span className="text-slate-200 font-light text-xs">|</span>
                    <span className="text-xs sm:text-[12.5px] font-extrabold tracking-tight text-slate-800">{specs.bedroomsText}</span>
                  </div>
                )}

                {specs.bathroomsText && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200 bg-white text-slate-900 shadow-xs">
                    <Bath className="w-4 h-4 shrink-0" style={{ color: accent }} strokeWidth={2} />
                    <span className="text-slate-200 font-light text-xs">|</span>
                    <span className="text-xs sm:text-[12.5px] font-extrabold tracking-tight text-slate-800">{specs.bathroomsText}</span>
                  </div>
                )}

                {specs.parkingText && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200 bg-white text-slate-900 shadow-xs">
                    <Car className="w-4 h-4 shrink-0" style={{ color: accent }} strokeWidth={2} />
                    <span className="text-slate-200 font-light text-xs">|</span>
                    <span className="text-xs sm:text-[12.5px] font-extrabold tracking-tight text-slate-800">{specs.parkingText}</span>
                  </div>
                )}

                {specs.areaText && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200 bg-white text-slate-900 shadow-xs">
                    <Maximize2 className="w-4 h-4 shrink-0" style={{ color: accent }} strokeWidth={2} />
                    <span className="text-slate-200 font-light text-xs">|</span>
                    <span className="text-xs sm:text-[12.5px] font-extrabold tracking-tight text-slate-800">{specs.areaText}</span>
                  </div>
                )}

                {specs.priceText && (
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-200 bg-white text-slate-950 shadow-xs">
                    <CircleDollarSign className="w-4 h-4 shrink-0" style={{ color: accent }} strokeWidth={2} />
                    <span className="text-slate-200 font-light text-xs">|</span>
                    <span className="text-xs sm:text-[12.5px] font-black tracking-tight text-slate-950">
                      {specs.priceText.toLowerCase().startsWith('desde') ? specs.priceText : `Desde ${specs.priceText}`}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Metadata Bar */}
          <div className="w-full border-t border-slate-200/80 pt-3 flex justify-between items-center text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <span className="inline-flex items-center gap-1.5">
              {(block.locationLeft || project.location) && <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: accent }} />}
              <span>{block.locationLeft || cleanProposalLocation(project.location)}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              {(block.locationRight || project.delivery || project.deliveryDate) && <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: accent }} />}
              <span>{block.locationRight || project.delivery || project.deliveryDate || ''}</span>
            </span>
          </div>
        </div>

        {/* Editorial Side Photo - 50% width, full height, object-cover */}
        {coverImage && !mobile && (
          <div
            className={cn(
              'h-full w-1/2 relative overflow-hidden shrink-0',
              isImageLeft ? 'order-1' : 'order-2'
            )}
          >
            <Image
              src={coverImage}
              alt={block.title || project.name || ''}
              fill
              sizes="600px"
              className={cn(block.imageFit === 'contain' ? 'object-contain object-center p-4' : 'object-cover object-center')}
              unoptimized={coverImage.startsWith('data:') || coverImage.startsWith('http')}
            />
          </div>
        )}
      </div>
    );
  }

  if (block.type === 'text' || block.type === 'image') {
    const amenityStyle = block.amenityStyle || 'cards';
    const amenityColumns = block.amenityColumns || 2;
    const amenityColor = block.amenityColor || block.accentColor || '#d4af37';
    const amenityColumnClass = amenityColumns === 1
      ? 'grid-cols-1'
      : amenityColumns === 2
      ? 'grid-cols-2'
      : amenityColumns === 3
      ? 'grid-cols-3'
      : 'grid-cols-4';
    return (
      <div className="max-w-2xl min-w-0">
        {block.partnerLogos && (
          <div className="flex items-center gap-2.5 mb-5 flex-wrap">
            <div className="rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 shadow-2xs flex items-center h-10">
              <UITranslationBoundary attributes={["alt"]}><Image src="/w2m/assets/iberostar-logo.jpg" alt="Iberostar" width={72} height={24} className="h-6 w-auto object-contain" /></UITranslationBoundary>
            </div>
            <span className="text-[#d4af37] font-serif italic text-lg font-bold px-1">+</span>
            <div className="rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 shadow-2xs flex items-center h-10">
              <UITranslationBoundary attributes={["alt"]}><Image src="/w2m/assets/w2m-logo.svg" alt="World2Meet" width={72} height={20} className="h-5 w-auto object-contain" /></UITranslationBoundary>
            </div>
            <span className="text-[#d4af37] text-base font-bold px-1">→</span>
            <div className="rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 shadow-2xs flex items-center h-10">
              <UITranslationBoundary attributes={["alt"]}><Image src="/w2m/assets/canarock-logo.png" alt="Cana Rock" width={72} height={20} className="h-5 w-auto object-contain" /></UITranslationBoundary>
            </div>
          </div>
        )}
        {heading}
        <p className="mt-5 whitespace-pre-line leading-7 opacity-80" style={{ fontSize: block.bodySize }}>{block.body}</p>
        {block.extraList && block.extraList.length > 0 && (
          <div className={cn('mt-6 w-full gap-2.5', amenityStyle === 'pills' ? 'flex flex-wrap' : 'grid', amenityStyle === 'list' ? 'grid-cols-1' : amenityColumnClass)}>
            {block.extraList.map((item, i) => (
              <div key={i} className={cn('flex min-w-0 items-center gap-2.5 text-xs font-medium text-slate-700', amenityStyle === 'cards' && 'rounded-xl border border-slate-100 bg-slate-50/90 p-3 shadow-2xs', amenityStyle === 'list' && 'border-b border-slate-200 px-1 py-2.5', amenityStyle === 'pills' && 'rounded-full border border-slate-200 bg-white px-3 py-2')}>
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${amenityColor}18`, color: amenityColor }}>
                  {block.amenityIconMode === 'number'
                    ? <span className="text-[8px] font-black">{i + 1}</span>
                    : block.amenityIconMode === 'check'
                    ? <Check className="h-2.5 w-2.5 stroke-[3]" />
                    : <CanaRockAmenityIcon iconKey={block.amenityIconMap?.[String(i)] || resolveIconKey(item)} className="h-3.5 w-3.5" />}
                </span>
                <span className="min-w-0 leading-snug">{item}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (block.type === 'gallery') return <div className="w-full">{heading}<p className="mt-4 opacity-70" style={{ fontSize: block.bodySize }}>{block.body}</p><div className="mt-7 grid grid-cols-2 gap-3"><GalleryImage src={block.images?.[0] || project.image} className="col-span-2 h-52" /><GalleryImage src={block.images?.[1] || project.gallery[0] || project.image} className="h-40" /><GalleryImage src={block.images?.[2] || project.gallery[1] || project.image} className="h-40" /></div></div>;

  if (block.type === 'highlights') {
    const isMap = !!block.isMapSlide;
    const isAmenitiesSlide = block.isAmenitiesSlide || block.id === 'cr-amenidades';
    const items = block.extraList && block.extraList.length > 0
      ? block.extraList
      : block.body.split('\n').map((item) => item.trim()).filter(Boolean);

    const activeAmenityColor = block.amenityColor || block.accentColor || '#d4af37';

    if (isAmenitiesSlide) {
      const iconMode = block.amenityIconMode || 'auto';
      const style = block.amenityStyle || 'cards';
      const cols = block.amenityColumns || 2;

      return (
        <div className="w-full min-w-0 space-y-4">
          {/* Top Row: Heading and Description Text */}
          <div className="text-left space-y-2">
            {heading}
          </div>

          {/* Bottom Row: Amenities layout respecting style, columns and custom icon selection */}
          <div className="w-full pt-1">
            <div
              className={cn(
                'w-full',
                style === 'list'
                  ? 'flex flex-col gap-2'
                  : style === 'pills'
                  ? 'flex flex-wrap gap-2 justify-start items-center'
                  : cn(
                      'grid gap-2',
                      cols === 1 ? 'grid-cols-1' : cols === 2 ? 'grid-cols-2' : cols === 3 ? 'grid-cols-3' : 'grid-cols-4'
                    )
              )}
            >
              {items.map((am, i) => {
                const iconKey = block.amenityIconMap?.[i];
                return (
                  <div
                    key={i}
                    style={{ borderColor: `${activeAmenityColor}40` }}
                    className={cn(
                      'flex items-center gap-2 bg-[#faf9f6] border shadow-2xs transition',
                      style === 'pills'
                        ? 'rounded-full px-3 py-1'
                        : style === 'list'
                        ? 'rounded-xl px-3 py-2'
                        : 'rounded-xl px-2.5 py-2'
                    )}
                  >
                    <span className="flex items-center justify-center shrink-0">
                      {iconMode === 'number' ? (
                        <span
                          className="flex h-4 w-4 items-center justify-center rounded-full text-white text-[8px] font-black"
                          style={{ backgroundColor: activeAmenityColor }}
                        >
                          {i + 1}
                        </span>
                      ) : iconMode === 'check' ? (
                        <Check className="w-3.5 h-3.5" style={{ color: activeAmenityColor }} />
                      ) : (
                        <CanaRockAmenityIcon name={am} iconKey={iconKey} className="w-3.5 h-3.5 shrink-0" style={{ color: activeAmenityColor }} />
                      )}
                    </span>
                    <span className="text-[8.5px] sm:text-[9px] font-bold uppercase text-slate-800 tracking-wide whitespace-normal text-left leading-tight truncate">
                      {am}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-w-0 w-full">
        {heading}
        {isMap ? (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs">
                <span
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-black text-white"
                  style={{ backgroundColor: activeAmenityColor }}
                >
                  {i + 1}
                </span>
                <span className="truncate">{item.replace(/^\d+\.\s*/, '')}</span>
              </div>
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className={cn(
            'mt-6 grid gap-2.5 sm:gap-3',
            (block.amenityColumns || 2) === 1 ? 'grid-cols-1' : (block.amenityColumns || 2) === 2 ? 'grid-cols-2' : (block.amenityColumns || 2) === 3 ? 'grid-cols-3' : 'grid-cols-4',
            (block.amenityStyle || 'cards') === 'list' && 'sm:grid-cols-1'
          )}>
            {items.map((item, itemIndex) => (
              <AmenityItem
                key={`${item}-${itemIndex}`}
                item={item}
                index={itemIndex}
                mode={block.amenityIconMode || 'auto'}
                style={block.amenityStyle || 'cards'}
                accent={activeAmenityColor}
                iconKey={block.amenityIconMap?.[String(itemIndex)]}
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  }
  if (block.type === 'stats') {
    const isSplit = block.layout === 'split-left' || block.layout === 'split-right';
    const isImageTop = block.layout === 'vertical-top';
    const s1Label = block.customStats?.stat1Label ?? 'Desde';
    const s1Value = block.customStats?.stat1Value ?? formatCurrency(project.startingPrice, project.currency);
    const s2Label = block.customStats?.stat2Label ?? 'Ubicación';
    const s2Value = block.customStats?.stat2Value ?? (project.location.length > 25 ? 'Bávaro, Punta Cana' : project.location);
    const s3Label = block.customStats?.stat3Label ?? 'Disponibles';
    const s3Value = block.customStats?.stat3Value ?? `${project.availableUnits}`;
    const s4Label = block.customStats?.stat4Label ?? 'Entrega';
    const s4Value = block.customStats?.stat4Value ?? project.delivery ?? 'Diciembre 2027';

    const detectedSlug = project.slug ||
      (project.name?.toLowerCase().includes('uve') ? 'uve-residences' : undefined) ||
      (project.name?.toLowerCase().includes('palm view') ? 'palm-view' : undefined) ||
      (project.name?.toLowerCase().includes('elements') ? 'elements' : undefined) ||
      (project.name?.toLowerCase().includes('cipr') ? 'cipres-residences' : undefined);

    const fallbackAccent =
      detectedSlug === 'uve-residences'
        ? '#2F9DB8'
        : detectedSlug === 'cipres-residences'
        ? '#B5964A'
        : detectedSlug === 'palm-view'
        ? '#c5a880'
        : '#d4af37';
    const accent = block.accentColor || fallbackAccent;

    const statImage = block.image || (project.gallery && project.gallery.length > 0 ? project.gallery[0] : project.image);

    const statsGrid = (
      <div className={cn('grid gap-2 sm:gap-2.5', isSplit ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4')}>
        <Metric label={s1Label} value={s1Value} valueSize={block.metricValueSize} accent={accent} />
        <Metric label={s2Label} value={s2Value} valueSize={block.metricValueSize} accent={accent} />
        <Metric label={s3Label} value={s3Value} valueSize={block.metricValueSize} accent={accent} />
        <Metric label={s4Label} value={s4Value} valueSize={block.metricValueSize} accent={accent} />
      </div>
    );

    const imageCard = statImage ? (
      <div className="relative w-full flex-1 min-h-[190px] sm:min-h-[220px] md:min-h-[250px] rounded-2xl overflow-hidden shadow-md border border-slate-200/80 bg-slate-100 group">
        <Image
          src={statImage}
          alt={block.title || project.name}
          fill
          sizes="(max-width: 1024px) 100vw, 1120px"
          className={cn(block.imageFit === 'contain' ? 'object-contain object-center p-3' : 'object-cover object-center')}
          unoptimized={statImage.startsWith('data:') || statImage.startsWith('http')}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
        <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-none">
          <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-white bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg border border-white/20 shadow-xs">
            {project.name}<LocalizedText text={" · Vista arquitectónica"} /></span>
        </div>
      </div>
    ) : null;

    if (isSplit) {
      return (
        <div className="w-full h-full flex flex-col justify-between py-2 text-left space-y-4">
          <div className="space-y-2">
            {heading}
            {block.body && (
              <p className="text-xs sm:text-sm text-slate-600 font-sans leading-relaxed" style={{ fontSize: block.bodySize }}>
                {block.body}
              </p>
            )}
          </div>
          {statsGrid}
        </div>
      );
    }

    return (
      <div className="w-full h-full flex flex-col justify-between gap-4 sm:gap-5 text-left py-1">
        {isImageTop ? (
          <>
            {imageCard}
            <div className="space-y-3 shrink-0">
              <div>
                {heading}
                {block.body && (
                  <p className="mt-1 text-xs sm:text-sm text-slate-600 font-sans leading-relaxed" style={{ fontSize: block.bodySize }}>
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
                {heading}
                {block.body && (
                  <p className="mt-1 text-xs sm:text-sm text-slate-600 font-sans leading-relaxed" style={{ fontSize: block.bodySize }}>
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
    const isSplit = block.layout === 'split-left' || block.layout === 'split-right';
    const isUve = project.slug === 'uve-residences';
    const isCipres = project.slug === 'cipres-residences';
    if (isCanaRock || isUve || isCipres || block.id === 'cr-precios') {
      const cipresTypologyCards = (project.typologies || []).slice(0, 3).map((typology) => ({
        title: typology.name,
        price: typology.startingPrice || project.startingPrice,
        kicker: 'Disponible por solar',
      }));
      const pricingFallbacks: { title: string; price: number; kicker?: string }[] = isCipres && cipresTypologyCards.length
        ? cipresTypologyCards
        : [
        { title: '1 Habitación (Estándar)', price: project.startingPrice || 149000, kicker: 'A partir de' },
        { title: 'Penthouse (5to Nivel)', price: (project.startingPrice ? project.startingPrice * 1.7 : 260099), kicker: 'A partir de' },
      ];
      const displayUnits = block.pricingCards && block.pricingCards.length > 0
        ? block.pricingCards
        : units && units.length > 0
        ? isCipres ? pricingFallbacks : derivePricingCards({ ...project, units })
        : pricingFallbacks;
      const cardIsDark = isCanaRock;

      return (
        <div className="w-full min-w-0 flex flex-col justify-between h-full text-left space-y-5">
          <div className="space-y-2 bg-white/95 border border-slate-100 shadow-md rounded-3xl p-5 sm:p-6 max-w-xl">
            {heading}
            <p className="text-xs sm:text-sm leading-relaxed text-slate-650 font-sans" style={{ fontSize: block.bodySize }}>
              {block.body}
            </p>
            <div className="text-[9px] font-black uppercase tracking-wider text-slate-600 bg-slate-100/80 border border-slate-200/50 px-3 py-1.5 rounded-xl inline-flex items-center gap-2 mt-1 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span><LocalizedText text={"Inventario oficial verificado"} /></span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            {displayUnits.map((card, i) => (
              <div
                key={i}
                className={cn('rounded-3xl border p-6 flex flex-col justify-between items-center text-center gap-3 shadow-xl transition-transform hover:-translate-y-1', cardIsDark ? 'border-[#d4af37]/35 bg-[#0a1140] text-white' : 'border-slate-200 bg-white text-[#0c094e]')}
              >
                <div className="w-11 h-11 rounded-full border border-[#d4af37]/35 bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37]">
                  <BedDouble className="w-5 h-5" />
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-[#d4af37] font-sans">
                  {card.title}
                </span>
                <div className="flex items-center justify-center gap-2 w-full mt-1">
                  <div className="w-4 h-[1px] bg-[#d4af37]/40" />
                  <span className="text-[8px] font-black text-[#d4af37] uppercase tracking-widest">
                    {card.kicker || 'A partir de'}
                  </span>
                  <div className="w-4 h-[1px] bg-[#d4af37]/40" />
                </div>
                <span className={cn('text-2xl font-black font-sans mt-0.5 tracking-tight', cardIsDark ? 'text-white' : 'text-[#0c094e]')}><LocalizedText text={"US$ "} />{Math.round(card.price).toLocaleString('en-US')}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="w-full min-w-0">
        {heading}
        <div className="mt-3 flex items-center justify-between">
          <p className="opacity-65" style={{ fontSize: block.bodySize }}>
            {block.body}
          </p>
          <p className="text-[9px] opacity-55"><LocalizedText text={"Actualizado "} />{project.updatedAt}</p>
        </div>
        <div
          className={cn(
            'mt-6 grid gap-3 items-stretch',
            isSplit ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2'
          )}
        >
          {units.map((unit) => (
            <div
              key={unit.id}
              className="rounded-2xl border border-current/15 bg-white/10 p-4 flex flex-col justify-between min-h-[105px] shadow-2xs"
            >
              <div className="flex justify-between items-start gap-2">
                <p className="text-sm font-extrabold">{unit.unit}</p>
                <p
                  className="font-black"
                  style={{ fontSize: block.metricValueSize ? Math.min(block.metricValueSize, 20) : 16 }}
                >
                  {formatCurrency(unit.price, unit.currency)}
                </p>
              </div>
              <p className="mt-2 flex items-center gap-1 text-[10px] opacity-65">
                <BedDouble className="h-3.5 w-3.5 shrink-0" />
                <span>{unit.type} · {unit.area}<LocalizedText text={" m² · Piso "} />{unit.floor}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (block.type === 'payment') {
    const plans: PaymentPlanScheme[] = (block.paymentPlans && block.paymentPlans.length > 0)
      ? block.paymentPlans
      : buildDefaultPaymentPlans(project);
    const accent = block.accentColor || '#d4af37';
    const isDark =
      block.textColor === '#ffffff' ||
      block.textColor.toLowerCase().includes('fff') ||
      (block.backgroundColor &&
        ['#000000', '#111827', '#0b1120', '#0f172a'].includes(block.backgroundColor.toLowerCase()));
    const isSplit = block.layout === 'split-left' || block.layout === 'split-right' || block.layout === 'vertical-top' || block.layout === 'vertical-bottom';

    return (
      <div className="w-full min-w-0">
        {heading}
        {block.body && (
          <p className="mt-2 opacity-70 leading-relaxed max-w-2xl text-xs sm:text-sm" style={{ fontSize: block.bodySize }}>
            {block.body}
          </p>
        )}
        <div
          className={cn(
            'grid gap-3 sm:gap-3.5 mt-5',
            isSplit
              ? plans.length === 1
                ? 'grid-cols-1 max-w-lg'
                : 'grid-cols-1 sm:grid-cols-2 max-w-2xl'
              : plans.length === 1
              ? 'grid-cols-1 max-w-md mx-auto'
              : plans.length === 2
              ? 'grid-cols-1 sm:grid-cols-2 max-w-3xl'
              : plans.length === 3
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl'
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
                  'rounded-2xl border p-4 sm:p-5 flex flex-col justify-between shadow-2xs transition text-left min-h-[220px] max-h-[350px]',
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
                          backgroundColor: `${accent}15`,
                          borderColor: `${accent}40`,
                          color: accent,
                        }}
                      >
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <h3
                    className={cn(
                      'text-sm sm:text-[14.5px] font-extrabold tracking-tight leading-snug',
                      isDark ? 'text-white' : 'text-slate-900'
                    )}
                  >
                    {plan.title}
                  </h3>

                  {plan.subtitle && (
                    <p
                      className={cn(
                        'text-[10px] sm:text-[10.5px] font-medium tracking-wide mt-0.5',
                        isDark ? 'text-white/60' : 'text-slate-500'
                      )}
                    >
                      {plan.subtitle}
                    </p>
                  )}

                  <div className="w-6 h-[1.5px] my-2.5" style={{ backgroundColor: `${accent}60` }} />

                  <ul className="space-y-2">
                    {steps.map((step, sIdx) => (
                      <li
                        key={sIdx}
                        className={cn(
                          'text-[11px] sm:text-[11.5px] leading-snug flex items-start gap-2',
                          isDark ? 'text-white/85' : 'text-slate-700'
                        )}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full mt-1 shrink-0"
                          style={{ backgroundColor: accent }}
                        />
                        <span className="font-medium">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {plan.discount && (
                  <div className="mt-3 pt-2.5 border-t border-current/10">
                    <p
                      className="text-[10px] sm:text-[10.5px] font-serif italic leading-tight"
                      style={{ color: accent }}
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
    );
  }

  if (block.type === 'documents') {
    const visibleDocs = (project.documents || [])
      .filter((d) => (!d.status || ['approved', 'published'].includes(d.status)) && (!d.visibility || ['public', 'authorized'].includes(d.visibility)))
      .slice(0, 5);

    return (
      <div className="w-full min-w-0">
        {heading}
        <p className="mt-4 opacity-70 leading-relaxed" style={{ fontSize: block.bodySize }}>{block.body}</p>
        <div className="mt-7 divide-y divide-current/10">
          {visibleDocs.map((document) => (
            <div key={document.id} className="flex items-center gap-3 py-4">
              <span className="rounded-xl bg-white/15 p-2">
                <FileText className="h-4 w-4" style={{ color: block.accentColor }} />
              </span>
              <p className="flex-1 text-xs font-bold">{document.name}</p>
              <span className="text-[9px] opacity-50">{document.format} · {document.updated}</span>
            </div>
          ))}
          {visibleDocs.length === 0 && (
            <p className="py-4 text-xs opacity-60 italic"><LocalizedText text={"No hay documentos aprobados para mostrar."} /></p>
          )}
        </div>
      </div>
    );
  }

  if (block.type === 'banking') {
    return (
      <div className="w-full min-w-0">
        {heading}
        <p className="mt-5 max-w-2xl leading-6 opacity-70" style={{ fontSize: block.bodySize }}>{block.body}</p>
        <div className="mt-7 grid gap-3 rounded-2xl border border-current/15 bg-white/10 p-5 sm:grid-cols-2">
          <UITranslationBoundary attributes={["label"]}><BankRow label="Beneficiario" value={brand.name} /></UITranslationBoundary>
          <UITranslationBoundary attributes={["label"]}><BankRow label="Banco" value="Banco ••••••••" /></UITranslationBoundary>
          <UITranslationBoundary attributes={["label"]}><BankRow label="Cuenta USD" value="•••• •••• •••• 4821" /></UITranslationBoundary>
          <UITranslationBoundary attributes={["label"]}><BankRow label="Referencia" value={project.name} /></UITranslationBoundary>
        </div>
      </div>
    );
  }

  if (block.type === 'disclaimer') {
    return (
      <div className="max-w-2xl min-w-0">
        {heading}
        <p className="mt-8 whitespace-pre-line leading-7 opacity-75" style={{ fontSize: block.bodySize }}>{block.body}</p>
        <div className="mt-8 flex items-center gap-3 rounded-2xl border border-current/15 p-4 text-[10px] font-bold">
          <Scale className="h-5 w-5" style={{ color: block.accentColor }} /><LocalizedText text={"Validar la versión final con el equipo legal antes de enviarla."} /></div>
      </div>
    );
  }

  // Block type: contact / closing
  return (
    <div className="w-full text-center flex flex-col items-center justify-center space-y-6 max-w-xl mx-auto py-8 min-w-0">
      {!isSerif && (
        <div className="mb-2">
          <BrandMark
            src={brand.logo_url}
            name={brand.name}
            invert={block.textColor.toLowerCase() === '#ffffff' || isFullBg}
            center
          />
        </div>
      )}

      <div className="space-y-3">
        <p
          className="font-extrabold uppercase tracking-[0.25em] opacity-85"
          style={{
            color: isFullBg ? '#93c5fd' : block.accentColor,
            fontSize: block.kickerSize || 10,
          }}
        >
          {block.kicker}
        </p>
        <h2
          className={cn(
            "break-words leading-[1.05]",
            isSerif ? "font-serif italic font-normal text-white" : "font-black tracking-[-0.03em]"
          )}
          style={{
            fontSize: mobile
              ? Math.min(titleLimit, 34)
              : `clamp(28px, 4vw, ${titleLimit}px)`,
          }}
        >
          {block.title}
        </h2>
        {isSerif && <div className="w-16 h-[1.5px] bg-[#d4af37] mx-auto mt-2" />}
      </div>

      <p
        className="max-w-md leading-relaxed opacity-85 mx-auto"
        style={{ fontSize: block.bodySize }}
      >
        {block.body}
      </p>

      <div className="pt-2">
        <div className="inline-flex items-center gap-2.5 rounded-full border border-current/25 bg-white/10 backdrop-blur-md px-6 py-3.5 text-xs font-bold shadow-md">
          <Mail className="h-4 w-4" style={{ color: isFullBg ? '#d4af37' : block.accentColor }} />
          <span>{brand.contact_email}</span>
        </div>
      </div>
    </div>
  );
}

function PreviewOverlay({
  onClose,
  canvasRatio = '1120x820',
  blocks,
  kind,
  project,
  brand,
  proposalItems,
  clientName,
  brokerName,
  brokerPhone,
  brokerEmail,
}: {
  onClose: () => void;
  blocks: Block[];
  kind: PresentationKind;
  template: TemplateId;
  project: PortalProject;
  brand: ReturnType<typeof useBrand>['theme'];
  units: PortalProject['units'];
  proposalItems?: MultiPropertyProposal['items'];
  clientName?: string;
  brokerName?: string;
  brokerPhone?: string | null;
  brokerEmail?: string;
  device: 'desktop' | 'mobile';
  canvasRatio?: CanvasRatio;
}) {
  const visibleBlocks = blocks.filter((b) => !b.hidden);
  const total = visibleBlocks.length;
  const isProposal = kind === 'proposal';
  const nativeWidth = isProposal ? 816 : canvasRatio === '1920x1080' ? 1920 : 1120;
  const nativeHeight = isProposal ? 1056 : canvasRatio === '1920x1080' ? 1080 : 820;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-950/90">
      <div className="flex h-14 items-center border-b border-white/10 px-4 text-white">
        <p className="text-xs font-extrabold"><LocalizedText text={"Vista previa del documento"} /></p>
        <UITranslationBoundary attributes={["aria-label"]}><button type="button" onClick={onClose} aria-label="Cerrar vista previa" className="ml-auto rounded-lg p-2 hover:bg-white/10">
          <X className="h-5 w-5" />
        </button></UITranslationBoundary>
      </div>
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-4 sm:p-8">
        <div className={cn('mx-auto transition-all duration-300', kind === 'proposal' ? 'max-w-[816px]' : canvasRatio === '1120x820' ? 'max-w-[1120px]' : canvasRatio === '1920x1080' ? 'max-w-[1280px]' : 'max-w-[816px]')}>
          <div className="space-y-8">
            {visibleBlocks.map((block, idx) => (
              <div
                key={block.id}
                className="w-full shadow-2xl rounded-[2rem] overflow-hidden border border-white/10 bg-[#fcfbf9] relative"
              >
                <ScaledSlideSheet width={nativeWidth} height={nativeHeight}>
                  {kind === 'proposal' ? (
                    <ProposalMagazinePage block={block} index={idx} total={total} projectName={project.name} clientName={clientName} agencyName={brand.name || ''} agencyLogo={brand.logo_url} brokerName={brokerName || brand.name || 'Asesor inmobiliario'} brokerPhone={brokerPhone || brand.whatsapp_number || ''} brokerEmail={brokerEmail || brand.contact_email || ''} items={proposalItems} />
                  ) : (
                    <MagazineSlide block={block} index={idx} total={total} projectName={project.name} projectSlug={project.slug} brokerName={brand.name || 'Asesor'} brokerPhone={brand.whatsapp_number || ''} brokerEmail={brand.contact_email || ''} agencyName={brand.name || ''} agencyLogo={brand.logo_url} />
                  )}
                </ScaledSlideSheet>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AmenityIconLibraryButton({
  value,
  color,
  onSelect,
}: {
  value: string;
  color: string;
  onSelect: (iconKey: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLocaleLowerCase('es');
  const visibleOptions = CANA_ROCK_ICON_OPTIONS.filter((option) => {
    if (!normalizedQuery) return true;
    return `${option.label} ${option.category || ''}`.toLocaleLowerCase('es').includes(normalizedQuery);
  });
  const groups = visibleOptions.reduce<Record<string, typeof visibleOptions>>((result, option) => {
    const category = option.category || 'Esenciales';
    (result[category] ||= []).push(option);
    return result;
  }, {});

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-8 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 text-[9px] font-extrabold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <CanaRockAmenityIcon iconKey={value} className="h-3.5 w-3.5" style={{ color }} /><LocalizedText text={"Abrir biblioteca"} /></button>

      {open && (
        <div className="fixed inset-0 z-[300] grid place-items-center bg-slate-950/45 p-4" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="amenity-library-title" className="flex max-h-[min(720px,88vh)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_70px_rgba(15,23,42,0.3)]">
            <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <h3 id="amenity-library-title" className="text-lg font-extrabold tracking-tight text-slate-950"><LocalizedText text={"Biblioteca de amenidades"} /></h3>
                <p className="mt-1 text-xs leading-5 text-slate-500"><LocalizedText text={"Elige el símbolo que mejor representa esta amenidad."} /></p>
              </div>
              <UITranslationBoundary attributes={["aria-label"]}><button type="button" onClick={() => setOpen(false)} aria-label="Cerrar biblioteca" className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"><X className="h-4 w-4" /></button></UITranslationBoundary>
            </header>

            <div className="border-b border-slate-100 px-5 py-3 sm:px-6">
              <label className="relative block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <UITranslationBoundary attributes={["placeholder"]}><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar piscina, golf, seguridad, coworking…" className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100" /></UITranslationBoundary>
              </label>
            </div>

            <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
              {Object.keys(groups).length ? Object.entries(groups).map(([category, options]) => (
                <div key={category} className="mb-6 last:mb-0">
                  <p className="mb-2 text-[9px] font-extrabold uppercase tracking-[0.14em] text-slate-400">{category}</p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6">
                    {options.map((option) => {
                      const selected = option.key === value;
                      return <button key={option.key} type="button" onClick={() => { onSelect(option.key); setOpen(false); setQuery(''); }} className={cn('flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border p-2 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500', selected ? 'border-blue-500 bg-blue-50 text-blue-900' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-slate-50')}>
                        <CanaRockAmenityIcon iconKey={option.key} className="h-6 w-6" style={{ color: selected ? '#1d4ed8' : color }} />
                        <span className="text-[9px] font-bold leading-3">{option.label}</span>
                      </button>;
                    })}
                  </div>
                </div>
              )) : <div className="py-12 text-center"><p className="text-sm font-bold text-slate-700"><LocalizedText text={"No encontramos ese icono"} /></p><p className="mt-1 text-xs text-slate-500"><LocalizedText text={"Prueba con otra palabra o categoría."} /></p></div>}
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function EditorField({ value, onChange, placeholder, icon: Icon, type = 'text', readOnly = false }: { value: string; onChange: (value: string) => void; placeholder: string; icon: typeof Mail; type?: string; readOnly?: boolean }) { return <label className="relative"><Icon className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" aria-hidden="true" /><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-label={placeholder} readOnly={readOnly} required className={cn('h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-[10px] outline-none focus:border-blue-400 focus:bg-white', readOnly && 'cursor-not-allowed text-slate-500')} /></label>; }
function CollapsibleSection({
  title,
  icon: Icon,
  badge,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon?: typeof ImageIcon;
  badge?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs transition">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-50/80 transition"
      >
        <div className="flex items-center gap-2 min-w-0">
          {Icon && <Icon className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
          <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-800 truncate">
            {title}
          </span>
          {badge && (
            <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100">
              {badge}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn("w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0", open ? "rotate-180" : "")}
        />
      </button>
      {open && <div className="p-3 pt-2.5 border-t border-slate-100 space-y-3">{children}</div>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-1.5 block text-[10px] font-bold text-slate-600">{label}</span>{children}</label>; }
function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label className="block"><span className="mb-1.5 block text-[9px] font-bold text-slate-500">{label}</span><span className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-2"><input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-6 w-7 cursor-pointer border-0 bg-transparent p-0" /><span className="truncate text-[8px] font-bold uppercase text-slate-400">{value}</span></span></label>; }
function RangeField({ label, value, min, max, step = 1, suffix, onChange }: { label: string; value: number; min: number; max: number; step?: number; suffix: string; onChange: (value: number) => void }) { return <label className="block"><span className="mb-2 flex justify-between text-[10px] font-bold text-slate-600"><span>{label}</span><span className="text-blue-600">{value}{suffix}</span></span><input type="range" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} className="w-full accent-blue-600" /></label>; }
function Metric({ label, value, valueSize, accent }: { label: string; value: string; valueSize?: number; accent?: string }) {
  const isLong = value.length > 15;
  const calculatedSize = valueSize || (isLong ? 14 : 19);
  return (
    <div className="rounded-2xl border border-current/15 bg-white/10 p-3 sm:p-4 flex flex-col justify-between min-h-[92px] min-w-0 overflow-hidden shadow-2xs">
      <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider opacity-60 truncate">{label}</p>
      <p className="mt-1.5 font-black leading-tight break-words" style={{ fontSize: calculatedSize, color: accent }}>
        {value}
      </p>
    </div>
  );
}
function BankRow({ label, value }: { label: string; value: string }) { return <div><p className="text-[8px] font-bold uppercase tracking-wide opacity-50">{label}</p><p className="mt-1 text-xs font-extrabold">{value}</p></div>; }
function GalleryImage({ src, className }: { src: string; className: string }) { return <div className={cn('relative overflow-hidden rounded-2xl bg-slate-100', className)}>{src && <UITranslationBoundary attributes={["alt"]}><Image src={src} alt="Galería del proyecto" fill unoptimized={src.startsWith('data:') || src.startsWith('http')} sizes="760px" className="object-cover" /></UITranslationBoundary>}</div>; }
function BrandMark({ src, name, invert, center }: { src: string; name: string; invert: boolean; center?: boolean }) { return <span className={cn('relative block h-12 w-48', center && 'mx-auto')}><Image src={src} alt={name} fill unoptimized={src.startsWith('data:') || src.startsWith('http')} sizes="192px" className={cn('object-contain', center ? 'object-center' : 'object-left', invert && 'brightness-0 invert')} /></span>; }

import { AmenityIcon } from '@/components/branding/AmenityIcon';

function MobileDockButton({ icon: Icon, label, onClick, disabled = false }: { icon: typeof LayoutGrid; label: string; onClick: () => void; disabled?: boolean }) { return <button type="button" onClick={onClick} disabled={disabled} className="flex min-h-12 min-w-16 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[9px] font-extrabold text-slate-600 transition hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"><Icon className="h-4 w-4" />{label}</button>; }

function AmenityItem({ item, index, mode, style, accent, iconKey }: { item: string; index: number; mode: 'auto' | 'check' | 'number'; style: 'cards' | 'list' | 'pills'; accent: string; iconKey?: string }) {
  const icon = mode === 'check'
    ? <Check className="h-[18px] w-[18px]" strokeWidth={1.5} style={{ color: accent }} />
    : iconKey
    ? <CanaRockAmenityIcon name={item} iconKey={iconKey} className="h-[18px] w-[18px]" style={{ color: accent }} />
    : <AmenityIcon name={item} className="h-[18px] w-[18px]" strokeWidth={1.5} style={{ color: accent }} />;
  return <div className={cn('flex min-w-0 items-center gap-3 border border-current/10 bg-white/10', style === 'cards' && 'min-h-[82px] rounded-2xl p-4', style === 'list' && 'rounded-xl px-4 py-3', style === 'pills' && 'rounded-full px-4 py-3')}>
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${accent}18`, color: accent }}>{mode === 'number' ? <span className="text-[10px] font-black" style={{ color: accent }}>{String(index + 1).padStart(2, '0')}</span> : icon}</span>
    <span className="min-w-0 break-words text-[11px] font-extrabold leading-4">{item}</span>
  </div>;
}
