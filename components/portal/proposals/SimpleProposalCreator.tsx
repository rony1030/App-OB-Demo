'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, BadgePercent, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Copy, Download, ExternalLink, ImageIcon, LoaderCircle, Mail, Megaphone, MessageCircle, Phone, Save, Search, Upload, UserRound, X } from 'lucide-react';
import { useBrand } from '@/components/branding/BrandProvider';
import { ProposalMagazinePage } from '@/components/presentations/ProposalMagazinePage';
import ScaledProposalSheet from '@/components/presentations/ScaledProposalSheet';
import { saveProposalAction, updateProposalAction, summarizeProposalCoverMessageAction, summarizeProposalConceptAction } from '@/app/portal/proposals/actions';
import { exportPresentationToPdf } from '@/lib/export/presentation-pdf';
import { buildProposalBlocks, buildProposalItems, generateProposalCode, projectLogoForProposal, type ProposalLotSelection } from '@/lib/proposals/proposal-template';
import { createClient } from '@/lib/supabase/client';
import type { PortalProject } from '@/lib/portal-projects';
import type { ProposalPropertyItem } from '@/types/proposals';
import type { Block } from '@/components/portal/PresentationEditor';
import type { Json } from '@/types/database';
import { cn, formatCurrency } from '@/lib/utils';
import type { MarketingOffer } from '@/lib/data/marketing-offers';

export type SimpleProposalRecipient = {
  id: number;
  fullName: string;
  email: string | null;
  phone: string;
  classification?: string | null;
};

export type SimpleProposalEditMode = {
  presentationId: number;
  title: string;
  token?: string;
  url?: string;
  snapshot: Record<string, unknown>;
};

type ShareResult = {
  url: string;
  token: string;
  emailStatus?: 'sent' | 'failed' | 'skipped';
  emailError?: string;
};

type ProposalImagePickerTarget = 'cover' | 'story' | 'storySecondary' | 'gallery' | 'typology' | 'amenities' | 'units' | 'payment';

const PALM_VIEW_SPECIAL_IMAGES = [
  '/projects/palm-view/plans/palm-view-master-plan-3d.png',
  '/projects/palm-view/plans/coral-golf-resort-3d.png',
  '/projects/palm-view/typologies/tipo-a.png',
  '/projects/palm-view/typologies/tipo-b.png',
  '/projects/palm-view/typologies/tipo-c.png',
  '/projects/palm-view/typologies/tipo-d.png',
  '/projects/palm-view/gallery/exteriores-01-palm-view-aerea.jpg',
  '/projects/palm-view/gallery/exteriores-02-palm-view-lago.jpg',
  '/projects/palm-view/gallery/exteriores-03-palm-view-pergola.jpg',
  '/projects/palm-view/gallery/exteriores-04-palm-view-paseo.jpg',
  '/projects/palm-view/gallery/exteriores-05-palm-view-pool-t3.jpg',
  '/projects/palm-view/gallery/exteriores-06-palm-view-torres.jpg',
  '/projects/palm-view/gallery/exteriores-07-palm-view-entrada.jpg',
  '/projects/palm-view/gallery/exteriores-08-palm-view-lago-t1.jpg',
  '/projects/palm-view/gallery/exteriores-09-palm-view-jardin-1er-nivel.jpg',
  '/projects/palm-view/gallery/exteriores-10-palm-view-golf-t1.jpg',
  '/projects/palm-view/gallery/exteriores-11-palm-view-golf-t3.jpg',
  '/projects/palm-view/gallery/exteriores-12-palm-view-jacuzzi.jpg',
  '/projects/palm-view/gallery/exteriores-13-palm-view-t1-golf.jpg',
  '/projects/palm-view/gallery/exteriores-14-palm-view-pool-t1.jpg',
  '/projects/palm-view/gallery/exteriores-15-palm-view-terraza-bbq.jpg',
  '/projects/palm-view/gallery/exteriores-16-palm-view-parking.jpg',
  '/projects/palm-view/gallery/amenidades-10-pasarela-lago.jpg',
  '/projects/palm-view/gallery/amenidades-3-casa-club-green.jpg',
  '/projects/palm-view/gallery/amenidades-8-la-coralina-vista-frente.jpg',
  '/projects/palm-view/gallery/amenidades-casa-club-aerea.jpg',
  '/projects/palm-view/gallery/amenidades-club-raqueta.jpg',
  '/projects/palm-view/gallery/amenidades-gimnasio-01.jpg',
  '/projects/palm-view/gallery/amenidades-gimnasio-02.jpg',
  '/projects/palm-view/gallery/amenidades-lobby-central.jpg',
  '/projects/palm-view/gallery/amenidades-piscina-torre-1.jpg',
  '/projects/palm-view/gallery/amenidades-piscina-torre-3.jpg',
  '/projects/palm-view/gallery/amenidades-restaurante-bar-02.jpg',
  '/projects/palm-view/gallery/amenidades-spa-04.jpg',
  '/projects/palm-view/gallery/amenidades-terraza-piscina-torre-3.jpg',
  '/projects/palm-view/gallery/amenidades-zona-deportiva.jpg',
  '/projects/palm-view/gallery/interiores-01-palm-view-sala.jpg',
  '/projects/palm-view/gallery/interiores-02-palm-view-sala-2.jpg',
  '/projects/palm-view/gallery/interiores-03-palm-view-cocina.jpg',
  '/projects/palm-view/gallery/interiores-04-palm-view-comedor.jpg',
  '/projects/palm-view/gallery/interiores-05-palm-view-cocina-2.jpg',
  '/projects/palm-view/gallery/interiores-06-palm-view-ba-o-visitas.jpg',
  '/projects/palm-view/gallery/interiores-07-palm-view-habitacion-ppal.jpg',
  '/projects/palm-view/gallery/interiores-08-palm-view-ba-o-ppal.jpg',
  '/projects/palm-view/gallery/interiores-09-palm-view-hab-secundaria.jpg',
  '/projects/palm-view/gallery/interiores-10-palm-view-ba-o-secundario.jpg',
  '/projects/palm-view/gallery/interiores-11-palm-view-balcon-terraza.jpg',
];

function getProposalThumbnailUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('/projects/palm-view/gallery/') && !url.includes('/thumbs/')) {
    return url.replace('/gallery/', '/gallery/thumbs/');
  }
  if (url.startsWith('/projects/palm-view/plans/') && !url.includes('/thumbs/')) {
    return url.replace('/plans/', '/plans/thumbs/');
  }
  if (url.startsWith('/projects/palm-view/typologies/') && !url.includes('/thumbs/')) {
    return url.replace('/typologies/', '/typologies/thumbs/');
  }
  if (url.startsWith('/projects/cipres-residences/gallery/') && !url.includes('/thumbs/')) {
    return url.replace('/gallery/', '/gallery/thumbs/');
  }
  return url;
}

export default function SimpleProposalCreator({
  project,
  selectedUnitIds,
  selectedLotTypologies = [],
  recipients,
  activeOffers = [],
  canApplyManualDiscount = false,
  brokerName,
  brokerPhone,
  brokerEmail,
  brokerAvatarUrl,
  brokerProfessionalTitle,
  canUseDirectInvestor = false,
  editMode,
}: {
  project: PortalProject;
  selectedUnitIds: string[];
  selectedLotTypologies?: ProposalLotSelection[];
  recipients: SimpleProposalRecipient[];
  activeOffers?: MarketingOffer[];
  canApplyManualDiscount?: boolean;
  brokerName?: string;
  brokerPhone?: string | null;
  brokerEmail?: string;
  brokerAvatarUrl?: string | null;
  brokerProfessionalTitle?: string | null;
  canUseDirectInvestor?: boolean;
  editMode?: SimpleProposalEditMode;
}) {
  const editBlocks = useMemo(() => (editMode?.snapshot?.blocks as Array<Omit<Block, 'type'> & { type: string } & Record<string, unknown>>) || [], [editMode]);
  const editCoverBlock = useMemo(() => editBlocks.find((b) => b.type === 'cover'), [editBlocks]);
  const editEditorialBlock = useMemo(() => editBlocks.find((b) => b.type === 'editorial' || b.type === 'text'), [editBlocks]);
  const editTypologyBlock = useMemo(() => editBlocks.find((b) => b.type === 'typology'), [editBlocks]);
  const editGalleryImages = useMemo(() => {
    const direct = (editMode?.snapshot)?.gallery_images;
    if (Array.isArray(direct) && direct.length > 0) return direct.filter(Boolean) as string[];
    const slideImages = editBlocks
      .filter((b) => b.galleryPage === true || (typeof b.id === 'string' && b.id.startsWith('proposal-gallery-')))
      .map((b) => (b.image as string) || (Array.isArray(b.images) ? (b.images[0] as string) : ''))
      .filter(Boolean);
    if (slideImages.length > 0) return Array.from(new Set(slideImages));
    const gBlock = editBlocks.find((b) => b.type === 'gallery');
    if (gBlock?.images && Array.isArray(gBlock.images) && gBlock.images.length > 0) {
      return gBlock.images.filter(Boolean) as string[];
    }
    const itemGallery = (editMode?.snapshot?.items as ProposalPropertyItem[] | undefined)?.[0]?.gallery_images;
    if (Array.isArray(itemGallery) && itemGallery.length > 0) {
      return itemGallery.filter(Boolean) as string[];
    }
    return [];
  }, [editBlocks, editMode]);
  const editUnitsBlock = useMemo(() => editBlocks.find((b) => b.type === 'availability'), [editBlocks]);
  const editPaymentBlock = useMemo(() => editBlocks.find((b) => b.type === 'payment'), [editBlocks]);
  const editHighlightsBlock = useMemo(() => editBlocks.find((b) => b.type === 'highlights'), [editBlocks]);
  const editManualDiscount = editMode?.snapshot?.manual_discount as { type?: 'percent' | 'amount'; value?: number } | undefined;

  const { theme } = useBrand();
  type LogoOption = 'ob' | 'project' | 'custom' | 'none';
  const projectLogo = useMemo(() => projectLogoForProposal(project), [project]);

  const [logoOption, setLogoOption] = useState<LogoOption>(() => {
    const savedMode = String((editMode?.snapshot?.branding as { header_logo_mode?: string })?.header_logo_mode || '');
    if (savedMode && ['ob', 'project', 'custom', 'none'].includes(savedMode)) {
      return savedMode as LogoOption;
    }
    if (editBlocks?.[0]?.hideHeaderLogo || editBlocks?.[0]?.headerLogoMode === 'none') {
      return 'none';
    }
    const blockMode = String(editBlocks?.[0]?.headerLogoMode || '');
    if (blockMode && ['ob', 'project', 'custom', 'none'].includes(blockMode)) {
      return blockMode as LogoOption;
    }
    // New proposals identify the agency creating them. Existing proposals keep
    // their saved selection above for backwards compatibility.
    return 'ob';
  });

  const [customLogoUrl, setCustomLogoUrl] = useState<string>(() => {
    return (editMode?.snapshot?.branding as { custom_logo_url?: string })?.custom_logo_url || (editBlocks?.[0]?.customBrokerLogoUrl as string) || '';
  });
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoFileInputRef = useRef<HTMLInputElement | null>(null);

  const proposalTheme = useMemo(() => {
    let resolvedLogo: string | undefined = undefined;
    if (logoOption === 'ob') {
      resolvedLogo = theme.logo_url;
    } else if (logoOption === 'project') {
      resolvedLogo = projectLogo || undefined;
    } else if (logoOption === 'custom') {
      resolvedLogo = customLogoUrl || undefined;
    } else if (logoOption === 'none') {
      resolvedLogo = undefined;
    }

    return {
      ...theme,
      name: theme.name,
      logo_url: resolvedLogo,
      primary_color: project.landingTheme?.primaryColor || project.brandProfile?.primaryColor || theme.primary_color,
      accent_color: project.landingTheme?.accentColor || project.brandProfile?.accentColor || theme.accent_color,
      surface_color: project.brandProfile?.surfaceColor || theme.surface_color,
    };
  }, [theme, logoOption, projectLogo, customLogoUrl, project]);

  async function handleLogoFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    try {
      const extension = file.type === 'image/svg+xml' ? 'svg' : file.type.includes('png') ? 'png' : 'jpg';
      const storagePath = `ob-brokers-team/proposals/logos/logo-${crypto.randomUUID()}.${extension}`;
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from('public-assets')
        .upload(storagePath, file, {
          cacheControl: '3600',
          contentType: file.type || 'image/png',
          upsert: false,
        });

      if (!uploadError) {
        const publicUrl = supabase.storage.from('public-assets').getPublicUrl(storagePath).data.publicUrl;
        setCustomLogoUrl(publicUrl);
        setLogoOption('custom');
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          setCustomLogoUrl(reader.result as string);
          setLogoOption('custom');
        };
        reader.readAsDataURL(file);
      }
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        setCustomLogoUrl(reader.result as string);
        setLogoOption('custom');
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingLogo(false);
      if (logoFileInputRef.current) logoFileInputRef.current.value = '';
    }
  }
  const proposalItems = useMemo(
    () => buildProposalItems(project, selectedUnitIds, selectedLotTypologies),
    [project, selectedLotTypologies, selectedUnitIds],
  );

  const galleryOptions = useMemo(() => {
    const typologyImages = (project.typologies || [])
      .flatMap((t) => [t.image, t.floorPlanImage])
      .filter(Boolean) as string[];
    const specialProjectImages = project.slug === 'palm-view' ? PALM_VIEW_SPECIAL_IMAGES : [];
    return Array.from(new Set([
      ...editGalleryImages,
      project.image,
      ...project.gallery,
      ...typologyImages,
      ...specialProjectImages,
    ].filter(Boolean)));
  }, [editGalleryImages, project.gallery, project.image, project.slug, project.typologies]);
  const [recipient, setRecipient] = useState<SimpleProposalRecipient | null>(() => {
    if (!editMode) return null;
    const snap = editMode.snapshot;
    if (snap.direct_investor) return null;
    if (snap.contact_id) {
      const match = recipients.find((r) => r.id === snap.contact_id);
      if (match) return match;
    }
    if (snap.client_name) {
      return {
        id: (snap.contact_id as number) || 0,
        fullName: String(snap.client_name),
        email: (snap.client_email as string) || null,
        phone: String(snap.client_phone || ''),
      };
    }
    return null;
  });
  const [recipientQuery, setRecipientQuery] = useState('');
  const [recipientExpanded, setRecipientExpanded] = useState(() => !editMode);
  const [directInvestorMode, setDirectInvestorMode] = useState(() => Boolean(editMode?.snapshot?.direct_investor));
  const [hideBrokerDetails, setHideBrokerDetails] = useState(true);
  const [coverImage, setCoverImage] = useState<string>(() => (editCoverBlock?.image as string) || project.image);
  const [storyImage, setStoryImage] = useState<string>(() => (editEditorialBlock?.image as string) || project.gallery[0] || project.image);
  const [storySecondaryImage, setStorySecondaryImage] = useState<string>(() => {
    if (editEditorialBlock?.images && Array.isArray(editEditorialBlock.images)) {
      const sec = (editEditorialBlock.images as string[]).find((img) => img !== editEditorialBlock.image);
      if (sec) return sec;
    }
    return project.gallery.find((image) => image !== (project.gallery[0] || project.image)) || '';
  });
  const [storyImageFit, setStoryImageFit] = useState<'cover' | 'contain'>(() => (editEditorialBlock?.imageFit as 'cover' | 'contain') || 'cover');
  const [storySecondaryImageFit, setStorySecondaryImageFit] = useState<'cover' | 'contain'>(() => (editEditorialBlock?.additionalImageFit as 'cover' | 'contain') || 'contain');
  const [galleryImages, setGalleryImages] = useState<string[]>(() => {
    if (editGalleryImages.length > 0) {
      return editGalleryImages;
    }
    return Array.from(new Set(project.gallery.filter(Boolean))).slice(0, 12);
  });
  const [amenitiesImage, setAmenitiesImage] = useState<string>(() => (editHighlightsBlock?.image as string) || (Array.isArray(editHighlightsBlock?.images) ? (editHighlightsBlock.images[0] as string) : '') || '');
  const [amenitiesImageFit, setAmenitiesImageFit] = useState<'cover' | 'contain'>(() => (editHighlightsBlock?.imageFit as 'cover' | 'contain') || 'cover');
  const [unitsImage, setUnitsImage] = useState<string>(() => (editUnitsBlock?.image as string) || (Array.isArray(editUnitsBlock?.images) ? (editUnitsBlock.images[0] as string) : '') || '');
  const [unitsImageFit, setUnitsImageFit] = useState<'cover' | 'contain'>(() => (editUnitsBlock?.imageFit as 'cover' | 'contain') || 'contain');
  const [paymentImage, setPaymentImage] = useState<string>(() => (editPaymentBlock?.image as string) || (Array.isArray(editPaymentBlock?.images) ? (editPaymentBlock.images[0] as string) : '') || '');
  const [paymentImageFit, setPaymentImageFit] = useState<'cover' | 'contain'>(() => (editPaymentBlock?.imageFit as 'cover' | 'contain') || 'cover');
  const [imagePickerTarget, setImagePickerTarget] = useState<ProposalImagePickerTarget | null>(null);
  const [typologyPickerOpen, setTypologyPickerOpen] = useState(false);
  const [additionalTypologyIds, setAdditionalTypologyIds] = useState<string[]>([]);
  const [typologyPlanImages, setTypologyPlanImages] = useState<Record<string, string | undefined>>(() => Object.fromEntries((project.typologies || []).flatMap((typology) => [
    [typology.id, typology.floorPlanImage || typology.image],
    ...(typology.key ? [[typology.key, typology.floorPlanImage || typology.image]] : []),
  ])));
  const [includeTypologyPage, setIncludeTypologyPage] = useState(() => editMode ? Boolean(editTypologyBlock) : true);
  const [typologyCustomTitle, setTypologyCustomTitle] = useState(() => (editTypologyBlock?.typologyName as string) || (editTypologyBlock?.title as string) || proposalItems[0]?.typology_name || (proposalItems[0]?.unit_name ? `Unidad ${proposalItems[0].unit_name}` : ''));
  const [typologyCustomDetails, setTypologyCustomDetails] = useState(() => (editTypologyBlock?.typologyDetails as string) || (editTypologyBlock?.body as string) || '');
  const [typologyCustomImage, setTypologyCustomImage] = useState(() => (editTypologyBlock?.typologyFloorPlanImage as string) || (editTypologyBlock?.image as string) || '');
  const [typologyCustomImageFit, setTypologyCustomImageFit] = useState<'cover' | 'contain'>(() => (editTypologyBlock?.imageFit as 'cover' | 'contain') || 'contain');

  const isProjectReady = project.slug === 'cana-rock-star' || project.status === 'Listo para entrega' || Boolean(project.delivery && project.delivery.toLowerCase().includes('listo'));
  const hasConstruInPlan = project.paymentPlan.some((step) => step.label.toLowerCase().includes('constru'));
  const defaultPlanConstru = isProjectReady || (project.paymentPlan.length > 0 && !hasConstruInPlan) ? 0 : 40;
  const officialReservation = project.paymentPlan.find((step) => step.label.toLowerCase().includes('reserva'));
  const officialInitial = project.paymentPlan.find((step) => step.label.toLowerCase().includes('inicial') || step.label.toLowerCase().includes('contrato'));
  const officialConstruction = project.paymentPlan.find((step) => step.label.toLowerCase().includes('constru'));
  const parsePlanNumber = (value?: string) => Number(String(value || '').replace(/[^0-9.,-]/g, '').replace(/,(?=\d{3}(?:\D|$))/g, '').replace(',', '.')) || 0;
  const useOfficialPaymentPlan = project.slug === 'cipres-residences' || project.slug === 'uve-residences';
  const isUve = project.slug === 'uve-residences';
  const officialReservationAmount = useOfficialPaymentPlan
    ? (isUve ? 2000 : officialReservation ? parsePlanNumber(officialReservation.value) : 0)
    : 0;
  const officialInitialPercentage = useOfficialPaymentPlan
    ? (isUve ? 20 : officialInitial ? parsePlanNumber(officialInitial.value) : 0)
    : 0;
  const officialConstructionPercentage = useOfficialPaymentPlan
    ? (isUve ? 30 : officialConstruction ? parsePlanNumber(officialConstruction.value) : defaultPlanConstru)
    : defaultPlanConstru;
  const selectedUnitCodes = proposalItems.map((item) => String(item.unit_name || '').toUpperCase());
  const monthsUntilDelivery = (deliveryDate?: string | null) => {
    if (!deliveryDate) return 12;
    const match = String(deliveryDate).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return 12;
    const target = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    const today = new Date();
    const months = (target.getFullYear() - today.getFullYear()) * 12 + target.getMonth() - today.getMonth();
    return Math.max(1, months - (target.getDate() < today.getDate() ? 1 : 0));
  };
  const officialConstructionMonths = isUve
    ? monthsUntilDelivery(project.deliveryDate || project.delivery)
    : useOfficialPaymentPlan
      ? (selectedUnitCodes.some((code) => /(^|[^A-Z])M8([^0-9]|$)/.test(code)) ? 24 : selectedUnitCodes.some((code) => /(^|[^A-Z])M4([^0-9]|$)/.test(code)) ? 12 : 12)
      : 12;
  const [planReservation, setPlanReservation] = useState(() => (editPaymentBlock?.paymentSchedule)?.reservationAmount ?? (officialReservationAmount || 3000));
  const [planInitial, setPlanInitial] = useState(() => (editPaymentBlock?.paymentSchedule)?.initialPercentage ?? (officialInitialPercentage || 20));
  const [planConstruction, setPlanConstruction] = useState(() => (editPaymentBlock?.paymentSchedule)?.constructionPercentage ?? officialConstructionPercentage);
  const [constructionMonths, setConstructionMonths] = useState(() => (editPaymentBlock?.paymentSchedule)?.constructionInstallments ?? officialConstructionMonths);
  const planDelivery = Math.max(0, 100 - planInitial - planConstruction);

  const [message, setMessage] = useState(() => (editCoverBlock?.body as string) || (editEditorialBlock?.body as string) || project.shortDescription || 'Una oportunidad seleccionada especialmente para usted.');
  const [isSummarizingMessage, setIsSummarizingMessage] = useState(false);

  const [storyPart1, setStoryPart1] = useState<string>(() => {
    if (editEditorialBlock?.conceptPart1) return String(editEditorialBlock.conceptPart1).slice(0, 300);
    const bodyText = (editEditorialBlock?.body as string) || project.description || '';
    const paragraphs = bodyText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    return (paragraphs[0] || '').slice(0, 300);
  });

  const [storyPart2, setStoryPart2] = useState<string>(() => {
    if (editEditorialBlock?.conceptPart2) return String(editEditorialBlock.conceptPart2).slice(0, 420);
    const bodyText = (editEditorialBlock?.body as string) || project.description || '';
    const paragraphs = bodyText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    const remaining = paragraphs.slice(1).join(' ').replace(/\s{2,}/g, ' ').trim();
    return remaining.slice(0, 420);
  });

  const [isSummarizingConcept, setIsSummarizingConcept] = useState(false);

  async function handleSummarizeWithAi() {
    if (isSummarizingMessage) return;
    setIsSummarizingMessage(true);
    try {
      const result = await summarizeProposalCoverMessageAction({
        projectName: project.name,
        projectDescription: project.description || project.shortDescription,
        currentMessage: message,
      });
      if (result.success && result.text) {
        setMessage(result.text.slice(0, 400));
      } else if (result.error) {
        alert(result.error);
      }
    } catch {
      alert('No fue posible generar el resumen con IA.');
    } finally {
      setIsSummarizingMessage(false);
    }
  }

  async function handleSummarizeConceptWithAi() {
    if (isSummarizingConcept) return;
    setIsSummarizingConcept(true);
    try {
      const result = await summarizeProposalConceptAction({
        projectName: project.name,
        projectDescription: project.description || project.shortDescription,
        currentPart1: storyPart1,
        currentPart2: storyPart2,
      });
      if (result.success) {
        if (result.part1) setStoryPart1(result.part1.slice(0, 300));
        if (result.part2) setStoryPart2(result.part2.slice(0, 430));
      } else if (result.error) {
        alert(result.error);
      }
    } catch {
      alert('No fue posible generar el concepto con IA.');
    } finally {
      setIsSummarizingConcept(false);
    }
  }
  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(() => (editMode?.snapshot?.applied_offer as { id?: number } | undefined)?.id || null);
  const [manualDiscountType, setManualDiscountType] = useState<'percent' | 'amount'>(() => editManualDiscount?.type || 'percent');
  const [manualDiscountValue, setManualDiscountValue] = useState(() => editManualDiscount?.value ? String(editManualDiscount.value) : '');
  const [pageIndex, setPageIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');
  const [shareResult, setShareResult] = useState<ShareResult | null>(() => {
    if (editMode?.token) {
      return {
        url: editMode.url || `/p/${editMode.token}`,
        token: editMode.token,
      };
    }
    return null;
  });

  useEffect(() => {
    if (shareResult?.token && !shareResult.url.startsWith('http') && typeof window !== 'undefined') {
      let active = true;
      queueMicrotask(() => { if (active) setShareResult((prev) => (prev ? { ...prev, url: `${window.location.origin}/p/${prev.token}` } : null)); });
      return () => { active = false; };
    }
  }, [shareResult?.token, shareResult?.url]);
  const [copied, setCopied] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [error, setError] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    recipient: false,
    identity: false,
    offers: false,
    discount: false,
    content: false,
    payment: false,
  });

  const toggleSection = (key: string) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const collapseAll = () => {
    setCollapsedSections({
      recipient: true,
      identity: true,
      offers: true,
      discount: true,
      content: true,
      payment: true,
    });
  };

  const expandAll = () => {
    setCollapsedSections({
      recipient: false,
      identity: false,
      offers: false,
      discount: false,
      content: false,
      payment: false,
    });
  };
  const appliedOffer = useMemo(() => activeOffers.find((offer) => offer.id === selectedOfferId) || null, [activeOffers, selectedOfferId]);
  const manualDiscount = useMemo(() => {
    const value = Number(manualDiscountValue);
    if (!canApplyManualDiscount || appliedOffer || !Number.isFinite(value) || value <= 0) return null;
    return { type: manualDiscountType, value };
  }, [appliedOffer, canApplyManualDiscount, manualDiscountType, manualDiscountValue]);
  const effectiveProposalItems = useMemo(() => proposalItems.map((item) => {
    const listPrice = item.list_price || item.price;
    const discountAmount = manualDiscount
      ? manualDiscount.type === 'percent'
        ? Math.round(listPrice * manualDiscount.value / 100 * 100) / 100
        : manualDiscount.value
      : 0;
    if (manualDiscount && discountAmount > 0) {
      return {
        ...item,
        hero_image: coverImage,
        gallery_images: galleryImages,
        list_price: listPrice,
        price: Math.round(Math.max(0.01, listPrice - discountAmount) * 100) / 100,
        applied_discount_type: manualDiscount.type as 'percent' | 'amount',
        applied_discount_percent: manualDiscount.type === 'percent' ? manualDiscount.value : undefined,
        applied_discount_amount: discountAmount,
      };
    }
    if (appliedOffer?.offerType !== 'discount' || !appliedOffer.discountPercent) return { ...item, hero_image: coverImage, gallery_images: galleryImages };
    return {
      ...item,
      hero_image: coverImage,
      gallery_images: galleryImages,
      list_price: listPrice,
      price: Math.round(listPrice * (1 - appliedOffer.discountPercent / 100) * 100) / 100,
      applied_discount_type: 'percent' as const,
      applied_discount_percent: appliedOffer.discountPercent,
      applied_discount_amount: Math.round(listPrice * appliedOffer.discountPercent / 100 * 100) / 100,
    };
  }), [appliedOffer, coverImage, galleryImages, manualDiscount, proposalItems]);
  const selectedTypologyIds = useMemo(() => Array.from(new Set([
    ...(effectiveProposalItems.map((item) => item.typology_id).filter(Boolean) as string[]),
    ...additionalTypologyIds,
  ])), [additionalTypologyIds, effectiveProposalItems]);
  const hasOfficialTypology = selectedTypologyIds.length > 0;
  const recipientName = recipient?.fullName || (directInvestorMode ? 'Inversionista' : '');
  const proposalCode = useMemo(() => {
    const existingCode = (editCoverBlock?.proposalCode as string) || (editMode?.snapshot?.proposalCode as string) || (editMode?.snapshot?.proposal_code as string);
    if (existingCode) {
      return existingCode.replace(/-inversio-/gi, '-inversion-');
    }
    return recipientName ? generateProposalCode(proposalTheme.name || '', hideBrokerDetails ? '' : brokerName || '', recipientName) : '';
  }, [brokerName, editCoverBlock?.proposalCode, editMode?.snapshot?.proposalCode, editMode?.snapshot?.proposal_code, hideBrokerDetails, proposalTheme.name, recipientName]);
  const blocks = useMemo(() => {
    const base = buildProposalBlocks(project, {
      coverImage,
      storyImage,
      storySecondaryImage: storySecondaryImage || undefined,
      storyImageFit,
      storySecondaryImageFit,
      amenitiesImage: amenitiesImage || undefined,
      amenitiesImageFit,
      unitsImage: unitsImage || undefined,
      unitsImageFit,
      paymentImage: paymentImage || undefined,
      paymentImageFit,
      galleryImages,
      message,
      storyBody: [storyPart1.trim(), storyPart2.trim()].filter(Boolean).join('\n\n'),
      storyPart1: storyPart1.trim(),
      storyPart2: storyPart2.trim(),
      appliedOffer,
      manualDiscount,
      selectedItems: effectiveProposalItems,
      selectedTypologyIds,
      typologyPlanImages,
      includeTypologyPage,
      headerLogoMode: logoOption,
      hideHeaderLogo: logoOption === 'none',
      brokerLogoUrl: logoOption === 'custom' ? customLogoUrl : (logoOption === 'project' ? projectLogo : undefined),
      customTypology: {
        title: typologyCustomTitle || undefined,
        details: typologyCustomDetails || undefined,
        image: typologyCustomImage || undefined,
        imageFit: typologyCustomImageFit,
      },
      paymentSchedule: {
        reservationAmount: planReservation,
        initialPercentage: planInitial,
        constructionPercentage: planConstruction,
        constructionInstallments: constructionMonths,
      },
    });
    if (proposalCode) base[0] = { ...base[0], proposalCode };
    return hideBrokerDetails ? base.filter((block) => block.type !== 'contact') : base;
  }, [amenitiesImage, amenitiesImageFit, appliedOffer, constructionMonths, coverImage, customLogoUrl, effectiveProposalItems, galleryImages, hideBrokerDetails, includeTypologyPage, logoOption, manualDiscount, message, paymentImage, paymentImageFit, planConstruction, planInitial, planReservation, project, projectLogo, proposalCode, selectedTypologyIds, storyImage, storyImageFit, storyPart1, storyPart2, storySecondaryImage, storySecondaryImageFit, typologyCustomDetails, typologyCustomImage, typologyCustomImageFit, typologyCustomTitle, typologyPlanImages, unitsImage, unitsImageFit]);
  const query = recipientQuery.trim().toLocaleLowerCase();
  const matchingRecipients = useMemo(() => {
    if (!query) return [];
    return recipients
      .filter((item) => `${item.fullName} ${item.email || ''} ${item.phone}`.toLocaleLowerCase().includes(query))
      .slice(0, 6);
  }, [query, recipients]);
  const ready = Boolean((recipient || directInvestorMode) && proposalItems.length);
  const unitLabel = proposalItems.map((item) => item.unit_name).filter(Boolean).join(' · ');

  function chooseRecipient(item: SimpleProposalRecipient) {
    setRecipient(item);
    setRecipientQuery('');
    setRecipientExpanded(false);
    setShareResult(null);
    setError('');
  }

  function toggleGalleryImage(image: string) {
    setGalleryImages((current) => current.includes(image)
      ? current.filter((item) => item !== image)
      : current.length < 12 ? [...current, image] : current);
  }

  function openImagePicker(target: ProposalImagePickerTarget) {
    setImagePickerTarget(target);
  }

  function selectProposalImage(image: string) {
    if (imagePickerTarget === 'cover') setCoverImage(image);
    if (imagePickerTarget === 'story') setStoryImage(image);
    if (imagePickerTarget === 'storySecondary') setStorySecondaryImage(image);
    if (imagePickerTarget === 'typology') setTypologyCustomImage(image);
    if (imagePickerTarget === 'amenities') setAmenitiesImage(image);
    if (imagePickerTarget === 'units') setUnitsImage(image);
    if (imagePickerTarget === 'payment') setPaymentImage(image);
    if (imagePickerTarget === 'gallery') toggleGalleryImage(image);
  }

  function isProposalImageSelected(image: string) {
    if (imagePickerTarget === 'cover') return coverImage === image;
    if (imagePickerTarget === 'story') return storyImage === image;
    if (imagePickerTarget === 'storySecondary') return storySecondaryImage === image;
    if (imagePickerTarget === 'typology') return typologyCustomImage === image;
    if (imagePickerTarget === 'amenities') return amenitiesImage === image;
    if (imagePickerTarget === 'units') return unitsImage === image;
    if (imagePickerTarget === 'payment') return paymentImage === image;
    return galleryImages.includes(image);
  }

  function clearTargetImage() {
    if (imagePickerTarget === 'storySecondary') setStorySecondaryImage('');
    if (imagePickerTarget === 'typology') setTypologyCustomImage('');
    if (imagePickerTarget === 'amenities') setAmenitiesImage('');
    if (imagePickerTarget === 'units') setUnitsImage('');
    if (imagePickerTarget === 'payment') setPaymentImage('');
    setImagePickerTarget(null);
  }

  function getTargetImageFit(target: ProposalImagePickerTarget | null): 'cover' | 'contain' {
    if (target === 'units') return unitsImageFit;
    if (target === 'typology') return typologyCustomImageFit;
    if (target === 'payment') return paymentImageFit;
    if (target === 'amenities') return amenitiesImageFit;
    if (target === 'story') return storyImageFit;
    if (target === 'storySecondary') return storySecondaryImageFit;
    return 'cover';
  }

  function setTargetImageFit(target: ProposalImagePickerTarget | null, fit: 'cover' | 'contain') {
    if (target === 'units') setUnitsImageFit(fit);
    else if (target === 'typology') setTypologyCustomImageFit(fit);
    else if (target === 'payment') setPaymentImageFit(fit);
    else if (target === 'amenities') setAmenitiesImageFit(fit);
    else if (target === 'story') setStoryImageFit(fit);
    else if (target === 'storySecondary') setStorySecondaryImageFit(fit);
  }


  async function handleSave() {
    if (!recipient && !directInvestorMode) {
      setRecipientExpanded(true);
      setError('Selecciona un lead registrado en el CRM para guardar la propuesta.');
      return;
    }
    if (!proposalItems.length) {
      setError('La propuesta necesita al menos una unidad disponible.');
      return;
    }

    setIsSaving(true);
    setError('');
    const title = `${project.name} · Propuesta para ${recipientName}`;
    const snapshot = {
      title,
      kind: 'proposal',
      canvasRatio: 'portrait',
      presentation_mode: 'magazine',
      proposalCode: proposalCode || generateProposalCode(proposalTheme.name || '', hideBrokerDetails ? '' : brokerName || '', recipientName),
      project: project.name,
      project_slug: project.slug,
      client_name: recipientName,
      contact_id: recipient?.id || null,
      client_phone: recipient?.phone || null,
      client_email: recipient?.email || null,
      recipient_type: recipient?.classification === 'Empresa' ? 'company' : 'person',
      direct_investor: directInvestorMode,
      items: effectiveProposalItems,
      gallery_images: galleryImages,
      blocks,
      applied_offer: appliedOffer ? {
        id: appliedOffer.id,
        title: appliedOffer.title,
        offer_type: appliedOffer.offerType,
        discount_percent: appliedOffer.discountPercent,
        promotion_text: appliedOffer.promotionText,
        starts_at: appliedOffer.startsAt,
        ends_at: appliedOffer.endsAt,
      } : null,
      manual_discount: manualDiscount ? {
        type: manualDiscount.type,
        value: manualDiscount.value,
        amount_per_unit: effectiveProposalItems.reduce((sum, item) => sum + Number(item.applied_discount_amount || 0), 0) / Math.max(1, effectiveProposalItems.length),
      } : null,
      branding: {
        name: proposalTheme.name,
        logo_url: proposalTheme.logo_url,
        header_logo_mode: logoOption,
        custom_logo_url: customLogoUrl || undefined,
        primary_color: proposalTheme.primary_color,
        accent_color: proposalTheme.accent_color,
        surface_color: proposalTheme.surface_color,
      },
    };

    try {
      if (editMode) {
        const result = await updateProposalAction({
          presentationId: editMode.presentationId,
          title,
          contactId: recipient?.id,
          directInvestor: directInvestorMode,
          offerId: appliedOffer?.id,
          snapshot: snapshot as unknown as Json,
        });
        if (!result.success || !result.url || !result.token) {
          setError(result.error || 'No fue posible actualizar la propuesta.');
          return;
        }
        setShareResult({
          url: window.location.origin + result.url,
          token: result.token,
        });
        setShowSaveToast(true);
        return;
      }

      const result = await saveProposalAction({
        title,
        kind: 'proposal',
        contactId: recipient?.id,
        directInvestor: directInvestorMode,
        offerId: appliedOffer?.id,
        snapshot: snapshot as unknown as Json,
      });
      if (!result.success || !result.url || !result.token) {
        setError(result.error || 'No fue posible guardar la propuesta. Intenta de nuevo.');
        return;
      }
      setShareResult({
        url: window.location.origin + result.url,
        token: result.token,
        emailStatus: result.emailStatus,
        emailError: result.emailError,
      });
      setShowSaveToast(true);
    } catch {
      setError('La conexión se interrumpió. Recarga la página y vuelve a guardar.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleExport() {
    if (!recipient && !directInvestorMode) {
      setRecipientExpanded(true);
      setError('Selecciona un lead del CRM antes de descargar el PDF.');
      return;
    }
    setIsExporting(true);
    setError('');
    try {
      await new Promise<void>((resolve) => requestAnimationFrame(() => setTimeout(resolve, 300)));
      const rawPdfCode = proposalCode || generateProposalCode(proposalTheme.name || '', hideBrokerDetails ? '' : brokerName || '', recipientName || 'inversion');
      const pdfCode = rawPdfCode.replace(/-inversio-/gi, '-inversion-');
      await exportPresentationToPdf({
        filename: `Propuesta_${pdfCode.replace(/[^a-zA-Z0-9_-]/g, '_')}_ES.pdf`,
        slideSelector: '[data-simple-proposal-slide="true"]',
        aspectRatio: 'portrait',
        scale: 2.0,
        quality: 0.95,
        onProgress: (current, total) => setExportProgress(`${current}/${total}`),
      });
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : 'No fue posible generar el PDF.');
    } finally {
      setIsExporting(false);
      setExportProgress('');
    }
  }

  async function copyShareLink() {
    if (!shareResult) return;
    const fullUrl = shareResult.url.startsWith('http')
      ? shareResult.url
      : typeof window !== 'undefined'
        ? `${window.location.origin}${shareResult.url}`
        : shareResult.url;
    const shareMessage = `Hola, te comparto esta propuesta de inversión de *${project.name}*:\n${fullUrl}`;
    await navigator.clipboard.writeText(shareMessage);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  const page = blocks[pageIndex];

  return (
    <div className="-mx-4 min-h-[calc(100vh-5rem)] bg-[#f4f3ef] sm:-mx-6 lg:-mx-8">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 px-3 py-2 backdrop-blur sm:px-6 sm:py-3">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-1.5 sm:gap-3">
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
            <UITranslationBoundary attributes={["aria-label"]}><Link
              href="/portal/proposals"
              aria-label="Volver a propuestas"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a1140] sm:h-10 sm:w-10 sm:rounded-xl"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Link></UITranslationBoundary>
            <div className="min-w-0 border-l border-slate-200 pl-1.5 sm:pl-3">
              <p className="truncate text-[9px] font-bold uppercase tracking-[0.14em] text-[#8b7657] sm:text-[10px] sm:tracking-[0.18em]">
                {editMode ? `Editar #${editMode.presentationId}` : <LocalizedText text={"Nueva propuesta"} />}
              </p>
              <h1 className="truncate text-xs font-extrabold text-[#0a1140] sm:text-base">{project.name}</h1>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {shareResult && (
              <>
                <UITranslationBoundary attributes={["title","aria-label"]}><button
                  type="button"
                  onClick={copyShareLink}
                  title={copied ? '¡Mensaje copiado!' : 'Copiar mensaje con enlace'}
                  aria-label="Copiar mensaje"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-900 transition hover:bg-emerald-100 sm:h-10 sm:w-auto sm:gap-1.5 sm:rounded-xl sm:px-3"
                >
                  {copied ? <Check className="h-4 w-4 shrink-0 text-emerald-600" /> : <Copy className="h-4 w-4 shrink-0 text-emerald-700" />}
                  <span className="hidden sm:inline text-xs font-bold">{copied ? <LocalizedText text={"¡Mensaje copiado!"} /> : 'Copiar mensaje'}</span>
                </button></UITranslationBoundary>
                <UITranslationBoundary attributes={["title","aria-label"]}><a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    `Hola, te comparto esta propuesta de inversión de *${project.name}*:\n${
                      shareResult.url.startsWith('http')
                        ? shareResult.url
                        : typeof window !== 'undefined'
                          ? `${window.location.origin}${shareResult.url}`
                          : shareResult.url
                    }`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  title="Compartir por WhatsApp"
                  aria-label="Compartir por WhatsApp"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs transition hover:bg-emerald-700 sm:h-10 sm:w-auto sm:gap-1.5 sm:rounded-xl sm:px-3"
                >
                  <MessageCircle className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline text-xs font-bold"><LocalizedText text={"WhatsApp"} /></span>
                </a></UITranslationBoundary>
                <UITranslationBoundary attributes={["title","aria-label"]}><a
                  href={shareResult.url}
                  target="_blank"
                  rel="noreferrer"
                  title="Abrir propuesta"
                  aria-label="Abrir propuesta"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 sm:h-10 sm:w-auto sm:gap-1.5 sm:rounded-xl sm:px-3"
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                  <span className="hidden sm:inline text-xs font-bold"><LocalizedText text={"Abrir"} /></span>
                </a></UITranslationBoundary>
              </>
            )}
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              title={isExporting ? `PDF ${exportProgress}` : 'Descargar PDF'}
              aria-label={isExporting ? `Generando PDF ${exportProgress}` : 'Descargar PDF'}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60 sm:h-10 sm:w-auto sm:gap-1.5 sm:rounded-xl sm:px-3"
            >
              {isExporting ? <LoaderCircle className="h-4 w-4 animate-spin shrink-0" /> : <Download className="h-4 w-4 shrink-0" />}
              <span className="hidden sm:inline text-xs font-bold">{isExporting ? `PDF ${exportProgress}` : 'Descargar PDF'}</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !ready}
              className="inline-flex h-8 items-center justify-center gap-1 rounded-lg bg-[#0a1140] px-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#18205a] disabled:cursor-not-allowed disabled:opacity-45 sm:h-10 sm:rounded-xl sm:px-4 sm:gap-2"
            >
              {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin shrink-0" /> : <Save className="h-4 w-4 shrink-0" />}
              <span className="sm:hidden">{isSaving ? '...' : shareResult ? (editMode ? 'Listo' : 'Listo') : (editMode ? 'Guardar' : 'Guardar')}</span>
              <span className="hidden sm:inline">{isSaving ? 'Guardando' : shareResult ? (editMode ? 'Actualizado ✓' : 'Guardado ✓') : (editMode ? 'Guardar cambios' : 'Guardar y compartir')}</span>
            </button>
          </div>
        </div>
      </header>

      {shareResult && showSaveToast && (
        <div className="border-b border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-900 shadow-xs">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span className="font-extrabold"><LocalizedText text={"Propuesta guardada correctamente."} /></span>
              <span className="hidden sm:inline text-emerald-700"><LocalizedText text={"El enlace privado está listo en la barra superior."} />{shareResult.emailStatus === 'sent' ? <LocalizedText text={" También se envió por correo al cliente."} /> : ''}
              </span>
            </div>
            <UITranslationBoundary attributes={["aria-label"]}><button
              type="button"
              onClick={() => setShowSaveToast(false)}
              className="rounded-lg p-1 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-950"
              aria-label="Cerrar notificación"
            >
              <X className="h-4 w-4" />
            </button></UITranslationBoundary>
          </div>
        </div>
      )}

      <main className="mx-auto grid max-w-[1440px] items-start gap-5 px-4 py-5 lg:grid-cols-[360px_minmax(0,1fr)] lg:px-6 lg:py-7">
        <aside className="space-y-4 lg:sticky lg:top-[84px]">
          {/* BARRA SUPERIOR DE CONTROL DE ACORDEÓN */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400"><LocalizedText text={"Configuración"} /></span>
            <div className="flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={expandAll}
                className="rounded-lg px-2 py-0.5 text-[11px] font-bold text-slate-500 hover:bg-white hover:text-slate-900 transition cursor-pointer"
              ><LocalizedText text={"Expandir todo"} /></button>
              <span className="text-slate-300">·</span>
              <button
                type="button"
                onClick={collapseAll}
                className="rounded-lg px-2 py-0.5 text-[11px] font-bold text-slate-500 hover:bg-white hover:text-slate-900 transition cursor-pointer"
              ><LocalizedText text={"Contraer todo"} /></button>
            </div>
          </div>

          {/* SECCIÓN DESTINATARIO */}
          <section className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm transition-all">
            <button
              type="button"
              onClick={() => toggleSection('recipient')}
              className="flex w-full items-center justify-between gap-3 text-left cursor-pointer select-none"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-[#0a1140]"><LocalizedText text={"Destinatario"} /></h2>
                  {recipient && (
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-50 text-emerald-700">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </div>
                {!collapsedSections.recipient && (
                  <p className="mt-1 text-xs leading-5 text-slate-500"><LocalizedText text={"Debe existir en el CRM antes de crear la propuesta."} /></p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {collapsedSections.recipient && (
                  <span className="max-w-[130px] truncate rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                    {directInvestorMode ? 'Inversionista' : recipient?.fullName || 'Sin asignar'}
                  </span>
                )}
                <span className={cn('grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition-transform duration-200 hover:bg-slate-100 hover:text-slate-700', collapsedSections.recipient ? '-rotate-90' : 'rotate-0')}>
                  <ChevronDown className="h-4 w-4" />
                </span>
              </div>
            </button>

            {!collapsedSections.recipient && (
              <>
                {canUseDirectInvestor && (
                  <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#c5a880]/35 bg-[#fffaf1] p-3">
                      <input type="checkbox" checked={directInvestorMode} onChange={(event) => { setDirectInvestorMode(event.target.checked); setRecipient(event.target.checked ? null : recipient); setRecipientExpanded(!event.target.checked); setError(''); }} className="mt-0.5 rounded accent-[#0a1140]" />
                      <span><span className="block text-xs font-extrabold text-[#0a1140]"><LocalizedText text={"Presentar a inversionista directo"} /></span><span className="mt-1 block text-[11px] leading-5 text-slate-500"><LocalizedText text={"No requiere crear ni seleccionar un lead. El documento usará “Inversionista”."} /></span></span>
                    </label>
                  </div>
                )}

                {directInvestorMode ? (
                  <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f2eee6] font-extrabold text-[#8b7657]"><LocalizedText text={"I"} /></span>
                    <div><p className="text-sm font-extrabold text-slate-900"><LocalizedText text={"Inversionista"} /></p><p className="text-xs text-slate-500"><LocalizedText text={"Destinatario directo"} /></p></div>
                  </div>
                ) : recipient && !recipientExpanded ? (
                  <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#f2eee6] font-extrabold text-[#8b7657]">{recipient.fullName.slice(0, 1).toUpperCase()}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold text-slate-900">{recipient.fullName}</p>
                      <p className="truncate text-xs text-slate-500">{recipient.email || recipient.phone}</p>
                    </div>
                    <button type="button" onClick={() => setRecipientExpanded(true)} className="text-xs font-bold text-[#0a1140] underline decoration-slate-300 underline-offset-4 hover:decoration-[#0a1140]"><LocalizedText text={"Cambiar"} /></button>
                  </div>
                ) : (
                  <div className="mt-4">
                    <label htmlFor="proposal-recipient" className="sr-only"><LocalizedText text={"Buscar lead registrado en CRM"} /></label>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <UITranslationBoundary attributes={["placeholder"]}><input id="proposal-recipient" value={recipientQuery} onChange={(event) => setRecipientQuery(event.target.value)} autoComplete="off" placeholder="Buscar nombre, correo o teléfono" className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0a1140] focus:ring-2 focus:ring-[#0a1140]/10" /></UITranslationBoundary>
                    </div>
                    <div className="mt-2 max-h-60 overflow-y-auto rounded-xl border border-slate-200">
                      {matchingRecipients.length ? matchingRecipients.map((item) => (
                        <button key={item.id} type="button" onClick={() => chooseRecipient(item)} className="flex w-full items-center gap-3 border-b border-slate-100 px-3 py-3 text-left transition last:border-b-0 hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none">
                          <UserRound className="h-4 w-4 shrink-0 text-slate-400" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-bold text-slate-900">{item.fullName}</span>
                            <span className="mt-0.5 flex flex-wrap gap-x-3 text-[11px] text-slate-500">
                              {item.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{item.email}</span>}
                              {item.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{item.phone}</span>}
                            </span>
                          </span>
                        </button>
                      )) : <p className="px-4 py-5 text-center text-xs text-slate-500">{recipientQuery ? 'No encontramos ese lead en el CRM.' : <LocalizedText text={"Escribe un nombre, correo o teléfono para buscar un lead."} />}</p>}
                    </div>
                    {recipient && <button type="button" onClick={() => setRecipientExpanded(false)} className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900"><LocalizedText text={"Ocultar "} /><ChevronDown className="h-3.5 w-3.5" /></button>}
                  </div>
                )}
              </>
            )}
          </section>

          {/* SECCIÓN IDENTIDAD & LOGOTIPO */}
          <section className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm transition-all">
            <button
              type="button"
              onClick={() => toggleSection('identity')}
              className="flex w-full items-center justify-between gap-3 text-left cursor-pointer select-none"
            >
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-extrabold text-[#0a1140]"><LocalizedText text={"Identidad &amp; Logotipo"} /></h2>
                {!collapsedSections.identity && (
                  <p className="mt-1 text-xs leading-5 text-slate-500"><LocalizedText text={"Elige qué logo mostrar en la cabecera de la propuesta o desactívalo."} /></p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {collapsedSections.identity && (
                  <span className="max-w-[130px] truncate rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                    {logoOption === 'ob' ? (theme.name || 'Agencia') : logoOption === 'project' ? <LocalizedText text={"Del Proyecto"} /> : logoOption === 'custom' ? 'Personalizado' : <LocalizedText text={"Sin logo"} />}
                  </span>
                )}
                <span className={cn('grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition-transform duration-200 hover:bg-slate-100 hover:text-slate-700', collapsedSections.identity ? '-rotate-90' : 'rotate-0')}>
                  <ChevronDown className="h-4 w-4" />
                </span>
              </div>
            </button>

            {!collapsedSections.identity && (
              <>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLogoOption('ob')}
                    className={cn(
                      'flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition cursor-pointer',
                      logoOption === 'ob' ? 'border-[#0a1140] bg-[#0a1140]/5 font-extrabold text-[#0a1140] ring-2 ring-[#0a1140]/10' : 'border-slate-200 hover:border-slate-300 text-slate-700 font-bold'
                    )}
                  >
                    <span className="text-xs">{theme.name || 'Agencia'}</span>
                    <span className="text-[10px] text-slate-400 font-normal"><LocalizedText text={"Agencia creadora"} /></span>
                  </button>

                  {projectLogo && (
                    <button
                      type="button"
                      onClick={() => setLogoOption('project')}
                      className={cn(
                        'flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition cursor-pointer',
                        logoOption === 'project' ? 'border-[#0a1140] bg-[#0a1140]/5 font-extrabold text-[#0a1140] ring-2 ring-[#0a1140]/10' : 'border-slate-200 hover:border-slate-300 text-slate-700 font-bold'
                      )}
                    >
                      <span className="text-xs"><LocalizedText text={"Del Proyecto"} /></span>
                      <span className="text-[10px] text-slate-400 font-normal truncate max-w-[120px]">{project.name}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setLogoOption('custom')}
                    className={cn(
                      'flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition cursor-pointer',
                      logoOption === 'custom' ? 'border-[#0a1140] bg-[#0a1140]/5 font-extrabold text-[#0a1140] ring-2 ring-[#0a1140]/10' : 'border-slate-200 hover:border-slate-300 text-slate-700 font-bold'
                    )}
                  >
                    <span className="text-xs"><LocalizedText text={"Personalizado"} /></span>
                    <span className="text-[10px] text-slate-400 font-normal"><LocalizedText text={"Subir o URL"} /></span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLogoOption('none')}
                    className={cn(
                      'flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition cursor-pointer',
                      logoOption === 'none' ? 'border-[#0a1140] bg-[#0a1140]/5 font-extrabold text-[#0a1140] ring-2 ring-[#0a1140]/10' : 'border-slate-200 hover:border-slate-300 text-slate-700 font-bold'
                    )}
                  >
                    <span className="text-xs"><LocalizedText text={"Sin logo"} /></span>
                    <span className="text-[10px] text-slate-400 font-normal"><LocalizedText text={"Marca blanca"} /></span>
                  </button>
                </div>

                {logoOption === 'custom' && (
                  <div className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center gap-2">
                      <UITranslationBoundary attributes={["placeholder"]}><input
                        type="text"
                        placeholder="URL del logo (https://...)"
                        value={customLogoUrl}
                        onChange={(e) => setCustomLogoUrl(e.target.value)}
                        className="h-9 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-900 outline-none focus:border-[#0a1140]"
                      /></UITranslationBoundary>
                      <button
                        type="button"
                        onClick={() => logoFileInputRef.current?.click()}
                        disabled={isUploadingLogo}
                        className="inline-flex h-9 items-center justify-center gap-1 rounded-lg bg-[#0a1140] px-3 text-xs font-bold text-white transition hover:bg-[#152060] cursor-pointer shrink-0"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        <span>{isUploadingLogo ? 'Subiendo...' : 'Subir'}</span>
                      </button>
                      <input
                        ref={logoFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoFileUpload}
                        className="hidden"
                      />
                    </div>
                    {customLogoUrl && (
                      <div className="flex items-center gap-2 pt-1">
                        <div className="h-8 max-w-[90px] bg-white p-1 rounded border border-slate-200 flex items-center justify-center">
                          <UITranslationBoundary attributes={["alt"]}><img src={customLogoUrl} alt="Logo personalizado" className="max-h-full max-w-full object-contain" /></UITranslationBoundary>
                        </div>
                        <span className="text-[11px] text-slate-500 truncate flex-1">{customLogoUrl}</span>
                      </div>
                    )}
                  </div>
                )}

                <label className="mt-3 flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-3 text-xs font-bold text-slate-700">
                  <div>
                    <span><LocalizedText text={"Ocultar datos del agente"} /></span>
                    <span className="block text-[10px] font-normal text-slate-500"><LocalizedText text={"No incluye teléfono, correo ni página de contacto."} /></span>
                  </div>
                  <input
                    type="checkbox"
                    checked={hideBrokerDetails}
                    onChange={(event) => setHideBrokerDetails(event.target.checked)}
                    className="rounded accent-[#0a1140]"
                  />
                </label>
              </>
            )}
          </section>

          {/* SECCIÓN BENEFICIO AUTORIZADO */}
          {activeOffers.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm transition-all">
              <button
                type="button"
                onClick={() => toggleSection('offers')}
                className="flex w-full items-center justify-between gap-3 text-left cursor-pointer select-none"
              >
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-extrabold text-[#0a1140]"><LocalizedText text={"Beneficio autorizado"} /></h2>
                  {!collapsedSections.offers && (
                    <p className="mt-1 text-xs leading-5 text-slate-500"><LocalizedText text={"Opcional. Solo aparecen ofertas preparadas por administración o marketing."} /></p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {selectedOfferId ? (
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-800"><LocalizedText text={"Aplicado"} /></span>
                  ) : collapsedSections.offers ? (
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-500"><LocalizedText text={"Ninguno"} /></span>
                  ) : null}
                  <span className={cn('grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition-transform duration-200 hover:bg-slate-100 hover:text-slate-700', collapsedSections.offers ? '-rotate-90' : 'rotate-0')}>
                    <ChevronDown className="h-4 w-4" />
                  </span>
                </div>
              </button>

              {!collapsedSections.offers && (
                <div className="mt-4 space-y-2">
                  {activeOffers.map((offer) => {
                    const selected = selectedOfferId === offer.id;
                    const actionLabel = offer.offerType === 'discount' ? 'Aplicar descuento' : 'Aplicar promoción';
                    return (
                      <button key={offer.id} type="button" aria-pressed={selected} onClick={() => { setSelectedOfferId(selected ? null : offer.id); setShareResult(null); setError(''); }} className={cn('flex w-full items-center gap-3 rounded-xl border p-3 text-left transition', selected ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-100' : 'border-amber-200 bg-white hover:border-amber-400')}>
                        <span className={cn('grid h-9 w-9 shrink-0 place-items-center rounded-full', selected ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700')}>{offer.offerType === 'discount' ? <BadgePercent className="h-4 w-4" /> : <Megaphone className="h-4 w-4" />}</span>
                        <span className="min-w-0 flex-1"><span className="block text-sm font-extrabold text-slate-900">{offer.title}</span><span className="mt-0.5 block text-xs leading-5 text-slate-500">{offer.offerType === 'discount' ? `${offer.discountPercent}% autorizado` : offer.promotionText}</span></span>
                        <span className="shrink-0 text-[10px] font-extrabold uppercase tracking-wide text-amber-800">{selected ? 'Aplicado' : actionLabel}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* SECCIÓN DESCUENTO DIRECTO */}
          {canApplyManualDiscount && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm transition-all">
              <button
                type="button"
                onClick={() => toggleSection('discount')}
                className="flex w-full items-center justify-between gap-3 text-left cursor-pointer select-none"
              >
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-extrabold text-[#0a1140]"><LocalizedText text={"Descuento directo"} /></h2>
                  {!collapsedSections.discount && (
                    <p className="mt-1 text-xs leading-5 text-slate-500"><LocalizedText text={"Disponible para administración. Se aplicará al precio final de cada unidad."} /></p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {manualDiscount ? (
                    <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-extrabold text-indigo-800">
                      {manualDiscountType === 'percent' ? `${manualDiscountValue}%` : `${formatCurrency(Number(manualDiscountValue) || 0, project.currency)}`}
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-500"><LocalizedText text={"Sin descuento"} /></span>
                  )}
                  <span className={cn('grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition-transform duration-200 hover:bg-slate-100 hover:text-slate-700', collapsedSections.discount ? '-rotate-90' : 'rotate-0')}>
                    <ChevronDown className="h-4 w-4" />
                  </span>
                </div>
              </button>

              {!collapsedSections.discount && (
                <>
                  <div className="mt-4 grid grid-cols-[1fr_1.2fr] gap-2">
                    <label className="sr-only" htmlFor="manual-discount-type"><LocalizedText text={"Tipo de descuento"} /></label>
                    <select
                      id="manual-discount-type"
                      value={manualDiscountType}
                      onChange={(event) => { setManualDiscountType(event.target.value as 'percent' | 'amount'); setSelectedOfferId(null); setShareResult(null); setError(''); }}
                      className="h-11 rounded-xl border border-indigo-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-[#0a1140] focus:ring-2 focus:ring-[#0a1140]/10"
                    >
                      <option value="percent"><LocalizedText text={"Porcentaje (%)"} /></option>
                      <option value="amount"><LocalizedText text={"Monto fijo"} /></option>
                    </select>
                    <label className="relative">
                      <span className="sr-only"><LocalizedText text={"Valor del descuento"} /></span>
                      <UITranslationBoundary attributes={["placeholder"]}><input
                        value={manualDiscountValue}
                        onChange={(event) => { setManualDiscountValue(event.target.value); setSelectedOfferId(null); setShareResult(null); setError(''); }}
                        min="0.01"
                        max={manualDiscountType === 'percent' ? '99.99' : undefined}
                        step="0.01"
                        type="number"
                        inputMode="decimal"
                        placeholder={manualDiscountType === 'percent' ? 'Ej. 5' : 'Ej. 2,500'}
                        className="h-11 w-full rounded-xl border border-indigo-200 bg-white px-3 pr-10 text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#0a1140] focus:ring-2 focus:ring-[#0a1140]/10"
                      /></UITranslationBoundary>
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-400">{manualDiscountType === 'percent' ? '%' : project.currency || 'USD'}</span>
                    </label>
                  </div>
                  {manualDiscount && <p className="mt-2 text-[11px] font-semibold text-indigo-800"><LocalizedText text={"Descuento manual aplicado. Las ofertas autorizadas se desactivan mientras escribes aquí."} /></p>}
                </>
              )}
            </section>
          )}

          {/* SECCIÓN CONTENIDO */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm transition-all">
            <button
              type="button"
              onClick={() => toggleSection('content')}
              className="flex w-full items-center justify-between gap-3 text-left cursor-pointer select-none"
            >
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-extrabold text-[#0a1140]"><LocalizedText text={"Contenido"} /></h2>
                {!collapsedSections.content && (
                  <p className="mt-1 text-xs leading-5 text-slate-500"><LocalizedText text={"La información comercial se toma del proyecto."} /></p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold tabular-nums text-slate-600">
                  {blocks.length}<LocalizedText text={" páginas"} /></span>
                <span className={cn('grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition-transform duration-200 hover:bg-slate-100 hover:text-slate-700', collapsedSections.content ? '-rotate-90' : 'rotate-0')}>
                  <ChevronDown className="h-4 w-4" />
                </span>
              </div>
            </button>

            {!collapsedSections.content && (
              <>
                <div className="order-3 mt-5 border-t border-slate-100 pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: proposalTheme.accent_color }}><LocalizedText text={"Página de tipología / unidad"} /></p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {hasOfficialTypology
                          ? <LocalizedText text={"Puedes usar la información oficial o editar el texto y la imagen para esta propuesta."} />
                          : <LocalizedText text={"Esta unidad no tiene tipología ni render 3D asignado. Puedes agregar fotos reales y personalizar el texto."} />}
                      </p>
                    </div>
                    <label className="flex shrink-0 cursor-pointer items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-600"><LocalizedText text={"Incluir"} /></span>
                      <input
                        type="checkbox"
                        checked={includeTypologyPage}
                        onChange={(e) => setIncludeTypologyPage(e.target.checked)}
                        className="h-4 w-4 rounded accent-[#0a1140]"
                      />
                    </label>
                  </div>

                  {includeTypologyPage && (
                    <div className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500"><LocalizedText text={"Título de la tipología / unidad"} /></label>
                        <UITranslationBoundary attributes={["placeholder"]}><input
                          type="text"
                          value={typologyCustomTitle}
                          onChange={(e) => setTypologyCustomTitle(e.target.value)}
                          placeholder="Ej. Apartamento Penthouse G501"
                          className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 outline-none focus:border-[#0a1140]"
                        /></UITranslationBoundary>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500"><LocalizedText text={"Descripción o terminaciones"} /></label>
                        <UITranslationBoundary attributes={["placeholder"]}><textarea
                          rows={2}
                          value={typologyCustomDetails}
                          onChange={(e) => setTypologyCustomDetails(e.target.value)}
                          placeholder={hasOfficialTypology ? "Detalles de la tipología (deja vacío para usar los datos oficiales)..." : "Ej. Apartamento listo para entrega, pisos en porcelanato, amplia terraza..."}
                          className="mt-1 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-[#0a1140]"
                        /></UITranslationBoundary>
                      </div>

                      {project.typologies && project.typologies.length > 0 && (
                        <div className="border-t border-slate-200/80 pt-2">
                          <button
                            type="button"
                            onClick={() => setTypologyPickerOpen(true)}
                            className="text-[11px] font-bold text-[#0a1140] underline underline-offset-2 hover:text-[#17265b] cursor-pointer"
                          ><LocalizedText text={"Elegir de tipologías registradas en el catálogo ("} />{selectedTypologyIds.length}<LocalizedText text={" seleccionadas)"} /></button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-5 border-t border-slate-100 pt-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8b7657]"><LocalizedText text={"Unidades incluidas"} /></p>
                      <p className="mt-1 truncate text-sm font-extrabold text-slate-900">{unitLabel || 'Sin unidades'}</p>
                      {effectiveProposalItems.length === 1 ? (
                        <p className="mt-1 text-xs text-slate-500">
                          {effectiveProposalItems[0].list_price && effectiveProposalItems[0].list_price > effectiveProposalItems[0].price ? <span className="mr-2 line-through">{formatCurrency(effectiveProposalItems[0].list_price, effectiveProposalItems[0].currency)}</span> : null}
                          <span className={appliedOffer?.offerType === 'discount' ? 'font-extrabold text-amber-700' : ''}>{formatCurrency(effectiveProposalItems[0].price, effectiveProposalItems[0].currency)}</span>
                        </p>
                      ) : <p className="mt-1 text-xs text-slate-500">{effectiveProposalItems.length}<LocalizedText text={" unidades"} /></p>}
                    </div>
                    <Link href={`/portal/proposals/new?project=${encodeURIComponent(project.slug)}`} className="shrink-0 text-xs font-bold text-[#0a1140] underline decoration-slate-300 underline-offset-4 hover:decoration-[#0a1140]"><LocalizedText text={"Cambiar"} /></Link>
                  </div>
                </div>

                <div className="order-5 mt-5 border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor="proposal-message" className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8b7657]"><LocalizedText text={"Mensaje de portada"} /></label>
                    <UITranslationBoundary attributes={["title"]}><button
                      type="button"
                      onClick={handleSummarizeWithAi}
                      disabled={isSummarizingMessage}
                      className={cn(
                        "group relative inline-flex shrink-0 whitespace-nowrap items-center gap-1.5 rounded-full p-[1.5px] text-[10px] font-extrabold uppercase tracking-[0.08em] shadow-2xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer overflow-hidden",
                        "bg-gradient-to-r from-[#0284c7] via-[#a855f7] to-[#ec4899] hover:shadow-md hover:shadow-purple-500/15"
                      )}
                      title="Sintetiza la descripción oficial del proyecto con IA en menos de 400 caracteres enfocado a inversionistas"
                    >
                      <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-slate-800 transition-colors group-hover:bg-slate-50">
                        {isSummarizingMessage ? (
                          <>
                            <LoaderCircle className="h-3 w-3 animate-spin text-purple-600" />
                            <span className="bg-gradient-to-r from-sky-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"><LocalizedText text={"Generando…"} /></span>
                          </>
                        ) : (
                          <span className="bg-gradient-to-r from-sky-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"><LocalizedText text={"Rehacer con IA"} /></span>
                        )}
                      </span>
                    </button></UITranslationBoundary>
                  </div>
                  <textarea id="proposal-message" value={message} onChange={(event) => setMessage(event.target.value.slice(0, 400))} rows={3} className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm leading-5 text-slate-700 outline-none transition focus:border-[#0a1140] focus:ring-2 focus:ring-[#0a1140]/10" />
                  <p className="mt-1 text-right text-[10px] tabular-nums text-slate-400">{message.length}/400</p>
                </div>

                <div className="order-6 mt-5 border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8b7657]"><LocalizedText text={"Concepto (Página 2)"} /></span>
                    <UITranslationBoundary attributes={["title"]}><button
                      type="button"
                      onClick={handleSummarizeConceptWithAi}
                      disabled={isSummarizingConcept}
                      className={cn(
                        "group relative inline-flex shrink-0 whitespace-nowrap items-center gap-1.5 rounded-full p-[1.5px] text-[10px] font-extrabold uppercase tracking-[0.08em] shadow-2xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer overflow-hidden",
                        "bg-gradient-to-r from-[#0284c7] via-[#a855f7] to-[#ec4899] hover:shadow-md hover:shadow-purple-500/15"
                      )}
                      title="Redacta con IA las dos partes del concepto para inversionistas (máx. 300 y 430 caracteres)"
                    >
                      <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-slate-800 transition-colors group-hover:bg-slate-50">
                        {isSummarizingConcept ? (
                          <>
                            <LoaderCircle className="h-3 w-3 animate-spin text-purple-600" />
                            <span className="bg-gradient-to-r from-sky-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"><LocalizedText text={"Generando…"} /></span>
                          </>
                        ) : (
                          <span className="bg-gradient-to-r from-sky-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"><LocalizedText text={"Rehacer con IA"} /></span>
                        )}
                      </span>
                    </button></UITranslationBoundary>
                  </div>

                  <div className="mt-3 space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500">
                        <span><LocalizedText text={"Parte 1 · Concepto y estilo de vida"} /></span>
                        <span className="tabular-nums">{storyPart1.length}/300</span>
                      </div>
                      <UITranslationBoundary attributes={["placeholder"]}><textarea
                        value={storyPart1}
                        onChange={(event) => setStoryPart1(event.target.value.slice(0, 300))}
                        rows={3}
                        placeholder="Esencia arquitectónica, servicios y amenidades..."
                        className="mt-1 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-xs leading-5 text-slate-700 outline-none transition focus:border-[#0a1140] focus:ring-2 focus:ring-[#0a1140]/10"
                      /></UITranslationBoundary>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500">
                        <span><LocalizedText text={"Parte 2 · Ubicación y potencial de inversión"} /></span>
                        <span className="tabular-nums">{storyPart2.length}/430</span>
                      </div>
                      <UITranslationBoundary attributes={["placeholder"]}><textarea
                        value={storyPart2}
                        onChange={(event) => setStoryPart2(event.target.value.slice(0, 430))}
                        rows={3}
                        placeholder="Ubicación estratégica, conectividad y plusvalía..."
                        className="mt-1 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-xs leading-5 text-slate-700 outline-none transition focus:border-[#0a1140] focus:ring-2 focus:ring-[#0a1140]/10"
                      /></UITranslationBoundary>
                    </div>
                  </div>
                </div>
              </>
            )}
          </section>

          {/* SECCIÓN PLAN DE PAGOS */}
          <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm transition-all">
            <button
              type="button"
              onClick={() => toggleSection('payment')}
              className="flex w-full items-center justify-between gap-3 text-left cursor-pointer select-none"
            >
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-extrabold text-[#0a1140]"><LocalizedText text={"Plan de pagos"} /></h2>
                {!collapsedSections.payment && (
                  <p className="mt-1 text-xs leading-5 text-slate-500"><LocalizedText text={"Esquema financiero que se calculará en la propuesta."} /></p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-extrabold text-slate-700">
                  {planConstruction > 0 ? `${planInitial}/${planConstruction}/${planDelivery}` : `${planInitial}/${planDelivery}`}
                </span>
                <span className={cn('grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition-transform duration-200 hover:bg-slate-100 hover:text-slate-700', collapsedSections.payment ? '-rotate-90' : 'rotate-0')}>
                  <ChevronDown className="h-4 w-4" />
                </span>
              </div>
            </button>

            {!collapsedSections.payment && (
              <>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => { setPlanInitial(20); setPlanConstruction(0); }}
                    className={cn('rounded-xl border px-3 py-2 text-xs font-extrabold transition cursor-pointer', planConstruction === 0 && planInitial === 20 ? 'border-[#0a1140] bg-[#0a1140] text-white shadow-xs' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100')}
                  ><LocalizedText text={"Listo para entrega (20/80)"} /></button>
                  <button
                    type="button"
                    onClick={() => { setPlanInitial(20); setPlanConstruction(40); }}
                    className={cn('rounded-xl border px-3 py-2 text-xs font-extrabold transition cursor-pointer', planConstruction === 40 && planInitial === 20 ? 'border-[#0a1140] bg-[#0a1140] text-white shadow-xs' : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100')}
                  ><LocalizedText text={"En construcción (20/40/40)"} /></button>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2.5">
                  <label className="block">
                    <span className="text-[10px] font-bold text-slate-500"><LocalizedText text={"% Inicial"} /></span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={planInitial}
                      onChange={(e) => setPlanInitial(Number(e.target.value) || 0)}
                      className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 outline-none focus:border-[#0a1140]"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-bold text-slate-500"><LocalizedText text={"% Construcción"} /></span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={planConstruction}
                      onChange={(e) => setPlanConstruction(Number(e.target.value) || 0)}
                      className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 outline-none focus:border-[#0a1140]"
                    />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-bold text-slate-500"><LocalizedText text={"% Contra entrega"} /></span>
                    <input
                      type="text"
                      disabled
                      value={`${planDelivery}%`}
                      className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700"
                    />
                  </label>
                </div>
                {planConstruction > 0 && (
                  <label className="mt-3 block max-w-xs">
                    <span className="text-[10px] font-bold text-slate-500"><LocalizedText text={"Meses de construcción"} /></span>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={constructionMonths}
                      onChange={(e) => setConstructionMonths(Math.max(1, Number(e.target.value) || 1))}
                      className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 outline-none focus:border-[#0a1140]"
                    />
                    {useOfficialPaymentPlan && <span className="mt-1 block text-[10px] text-slate-500"><LocalizedText text={"Se establece automáticamente según el solar: M4 = 12 meses · M8 = 24 meses."} /></span>}
                  </label>
                )}

                <div className="mt-3">
                  <label className="block">
                    <span className="text-[10px] font-bold text-slate-500"><LocalizedText text={"Monto de reserva ("} />{project.currency || 'USD'})</span>
                    <input
                      type="number"
                      min="0"
                      step="500"
                      value={planReservation}
                      onChange={(e) => setPlanReservation(Number(e.target.value) || 0)}
                      className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 outline-none focus:border-[#0a1140]"
                    />
                  </label>
                </div>
              </>
            )}
          </section>

          {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-5 text-red-800">{error}</div>}
        </aside>

        <UITranslationBoundary attributes={["aria-label"]}><section aria-label="Vista previa de la propuesta" className="min-w-0 rounded-2xl border border-[#dfd9cd] bg-[#e9e6df] p-3 shadow-sm sm:p-5 lg:p-7">
          <div className="mb-3.5 space-y-2 sm:mb-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <h2 className="text-sm font-extrabold text-[#0a1140]"><LocalizedText text={"Vista previa"} /></h2>
                <span className="truncate rounded-md border border-slate-200 bg-white/80 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  {page.title || (page.type === 'cover' ? 'Portada' : page.type === 'availability' ? 'Unidades' : page.type === 'payment' ? 'Plan de pagos' : page.type === 'highlights' ? 'Amenidades' : page.galleryPage ? 'Galería' : `Pág. ${pageIndex + 1}`)}
                </span>
              </div>
              <span className="shrink-0 rounded-full border border-slate-300/60 bg-white/90 px-2.5 py-0.5 text-xs font-extrabold tabular-nums text-slate-700 shadow-2xs">
                {String(pageIndex + 1).padStart(2, '0')} / {String(blocks.length).padStart(2, '0')}
              </span>
            </div>
            
            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] leading-4 text-slate-500"><LocalizedText text={"Haz clic en los espacios punteados de cada lámina para colocar imágenes o déjalos vacíos."} /></p>
              
              <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
                {page.type === 'cover' && (
                  <button
                    type="button"
                    onClick={() => openImagePicker('cover')}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-50 transition cursor-pointer sm:px-3 sm:py-1.5"
                  >
                    <ImageIcon className="h-3.5 w-3.5 text-amber-600" />
                    <span><LocalizedText text={"Cambiar portada"} /></span>
                  </button>
                )}
                {(page.type === 'editorial' || page.type === 'text') && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openImagePicker('story')}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-50 transition cursor-pointer sm:px-3 sm:py-1.5"
                    >
                      <ImageIcon className="h-3.5 w-3.5 text-amber-600" />
                      <span><LocalizedText text={"Foto superior"} /></span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openImagePicker('storySecondary')}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-50 transition cursor-pointer sm:px-3 sm:py-1.5"
                    >
                      <ImageIcon className="h-3.5 w-3.5 text-amber-600" />
                      <span>{storySecondaryImage ? 'Cambiar inferior' : '+ Foto inferior'}</span>
                    </button>
                    <div className="inline-flex items-center rounded-xl border border-slate-300 bg-white p-0.5 text-xs font-bold shadow-xs">
                      <UITranslationBoundary attributes={["title"]}><button
                        type="button"
                        onClick={() => setStoryImageFit('contain')}
                        className={cn(
                          "rounded-lg px-2 py-0.5 transition cursor-pointer sm:py-1",
                          storyImageFit === 'contain' ? "bg-[#0a1140] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                        )}
                        title="Muestra la foto completa sin recortar bordes"
                      ><LocalizedText text={"Normal"} /></button></UITranslationBoundary>
                      <UITranslationBoundary attributes={["title"]}><button
                        type="button"
                        onClick={() => setStoryImageFit('cover')}
                        className={cn(
                          "rounded-lg px-2 py-0.5 transition cursor-pointer sm:py-1",
                          storyImageFit === 'cover' ? "bg-[#0a1140] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                        )}
                        title="Llena todo el espacio"
                      ><LocalizedText text={"Cubrir"} /></button></UITranslationBoundary>
                    </div>
                  </div>
                )}
                {page.type === 'typology' && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openImagePicker('typology')}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-50 transition cursor-pointer sm:px-3 sm:py-1.5"
                    >
                      <ImageIcon className="h-3.5 w-3.5 text-amber-600" />
                      <span>{typologyCustomImage ? 'Cambiar plano / 3D' : '+ Plano / 3D'}</span>
                    </button>
                    <div className="inline-flex items-center rounded-xl border border-slate-300 bg-white p-0.5 text-xs font-bold shadow-xs">
                      <UITranslationBoundary attributes={["title"]}><button
                        type="button"
                        onClick={() => setTypologyCustomImageFit('contain')}
                        className={cn(
                          "rounded-lg px-2 py-0.5 transition cursor-pointer sm:px-2.5 sm:py-1",
                          typologyCustomImageFit === 'contain' ? "bg-[#0a1140] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                        )}
                        title="Muestra el plano o render completo sin recortes"
                      ><LocalizedText text={"Normal"} /></button></UITranslationBoundary>
                      <UITranslationBoundary attributes={["title"]}><button
                        type="button"
                        onClick={() => setTypologyCustomImageFit('cover')}
                        className={cn(
                          "rounded-lg px-2 py-0.5 transition cursor-pointer sm:px-2.5 sm:py-1",
                          typologyCustomImageFit === 'cover' ? "bg-[#0a1140] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                        )}
                        title="Llena todo el marco de la tipología"
                      ><LocalizedText text={"Cubrir"} /></button></UITranslationBoundary>
                    </div>
                  </div>
                )}
                {page.type === 'availability' && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openImagePicker('units')}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-50 transition cursor-pointer sm:px-3 sm:py-1.5"
                    >
                      <ImageIcon className="h-3.5 w-3.5 text-amber-600" />
                      <span>{unitsImage ? 'Cambiar imagen' : '+ Agregar render'}</span>
                    </button>
                    {unitsImage && (
                      <>
                        <div className="inline-flex items-center rounded-xl border border-slate-300 bg-white p-0.5 text-xs font-bold shadow-xs">
                          <UITranslationBoundary attributes={["title"]}><button
                            type="button"
                            onClick={() => setUnitsImageFit('contain')}
                            className={cn(
                              "rounded-lg px-2 py-0.5 transition cursor-pointer sm:px-2.5 sm:py-1",
                              unitsImageFit === 'contain' ? "bg-[#0a1140] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                            )}
                            title="Muestra el plano o foto completa sin recortar ningún borde"
                          ><LocalizedText text={"Normal"} /></button></UITranslationBoundary>
                          <UITranslationBoundary attributes={["title"]}><button
                            type="button"
                            onClick={() => setUnitsImageFit('cover')}
                            className={cn(
                              "rounded-lg px-2 py-0.5 transition cursor-pointer sm:px-2.5 sm:py-1",
                              unitsImageFit === 'cover' ? "bg-[#0a1140] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                            )}
                            title="Llena toda la caja de la imagen"
                          ><LocalizedText text={"Cubrir"} /></button></UITranslationBoundary>
                        </div>
                        <UITranslationBoundary attributes={["title"]}><button
                          type="button"
                          onClick={() => setUnitsImage('')}
                          className="rounded-xl border border-slate-300 bg-white px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50 transition cursor-pointer sm:px-2.5 sm:py-1.5"
                          title="Dejar espacio limpio"
                        ><LocalizedText text={"Quitar"} /></button></UITranslationBoundary>
                      </>
                    )}
                  </div>
                )}
                {page.type === 'payment' && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openImagePicker('payment')}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-50 transition cursor-pointer sm:px-3 sm:py-1.5"
                    >
                      <ImageIcon className="h-3.5 w-3.5 text-amber-600" />
                      <span>{paymentImage ? 'Cambiar imagen' : '+ Agregar render'}</span>
                    </button>
                    {paymentImage && (
                      <>
                        <div className="inline-flex items-center rounded-xl border border-slate-300 bg-white p-0.5 text-xs font-bold shadow-xs">
                          <UITranslationBoundary attributes={["title"]}><button
                            type="button"
                            onClick={() => setPaymentImageFit('contain')}
                            className={cn(
                              "rounded-lg px-2 py-0.5 transition cursor-pointer sm:px-2.5 sm:py-1",
                              paymentImageFit === 'contain' ? "bg-[#0a1140] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                            )}
                            title="Muestra la imagen completa sin recortes"
                          ><LocalizedText text={"Normal"} /></button></UITranslationBoundary>
                          <UITranslationBoundary attributes={["title"]}><button
                            type="button"
                            onClick={() => setPaymentImageFit('cover')}
                            className={cn(
                              "rounded-lg px-2 py-0.5 transition cursor-pointer sm:px-2.5 sm:py-1",
                              paymentImageFit === 'cover' ? "bg-[#0a1140] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                            )}
                            title="Llena toda la caja"
                          ><LocalizedText text={"Cubrir"} /></button></UITranslationBoundary>
                        </div>
                        <UITranslationBoundary attributes={["title"]}><button
                          type="button"
                          onClick={() => setPaymentImage('')}
                          className="rounded-xl border border-slate-300 bg-white px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50 transition cursor-pointer sm:px-2.5 sm:py-1.5"
                          title="Dejar espacio limpio"
                        ><LocalizedText text={"Quitar"} /></button></UITranslationBoundary>
                      </>
                    )}
                  </div>
                )}
                {page.type === 'highlights' && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openImagePicker('amenities')}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-50 transition cursor-pointer sm:px-3 sm:py-1.5"
                    >
                      <ImageIcon className="h-3.5 w-3.5 text-amber-600" />
                      <span>{amenitiesImage ? 'Cambiar imagen' : '+ Agregar render'}</span>
                    </button>
                    {amenitiesImage && (
                      <>
                        <div className="inline-flex items-center rounded-xl border border-slate-300 bg-white p-0.5 text-xs font-bold shadow-xs">
                          <UITranslationBoundary attributes={["title"]}><button
                            type="button"
                            onClick={() => setAmenitiesImageFit('contain')}
                            className={cn(
                              "rounded-lg px-2 py-0.5 transition cursor-pointer sm:px-2.5 sm:py-1",
                              amenitiesImageFit === 'contain' ? "bg-[#0a1140] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                            )}
                            title="Muestra el plano o foto completa sin recortes"
                          ><LocalizedText text={"Normal"} /></button></UITranslationBoundary>
                          <UITranslationBoundary attributes={["title"]}><button
                            type="button"
                            onClick={() => setAmenitiesImageFit('cover')}
                            className={cn(
                              "rounded-lg px-2 py-0.5 transition cursor-pointer sm:px-2.5 sm:py-1",
                              amenitiesImageFit === 'cover' ? "bg-[#0a1140] text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                            )}
                            title="Llena toda la caja"
                          ><LocalizedText text={"Cubrir"} /></button></UITranslationBoundary>
                        </div>
                        <UITranslationBoundary attributes={["title"]}><button
                          type="button"
                          onClick={() => setAmenitiesImage('')}
                          className="rounded-xl border border-slate-300 bg-white px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50 transition cursor-pointer sm:px-2.5 sm:py-1.5"
                          title="Dejar espacio limpio"
                        ><LocalizedText text={"Quitar"} /></button></UITranslationBoundary>
                      </>
                    )}
                  </div>
                )}
                {page.galleryPage && (
                  <button
                    type="button"
                    onClick={() => openImagePicker('gallery')}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-800 shadow-xs hover:bg-slate-50 transition cursor-pointer sm:px-3 sm:py-1.5"
                  >
                    <ImageIcon className="h-3.5 w-3.5 text-amber-600" />
                    <span><LocalizedText text={"Galería ("} />{galleryImages.length}/12)</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-[816px]">
            <ScaledProposalSheet className="shadow-[0_22px_55px_rgba(43,39,31,0.18)]">
              <ProposalMagazinePage
                block={page}
                index={pageIndex}
                total={blocks.length}
                projectName={project.name}
                clientName={recipientName || 'Inversionista'}
                agencyName={proposalTheme.name}
                agencyLogo={proposalTheme.logo_url}
                brokerName={hideBrokerDetails ? undefined : brokerName || proposalTheme.name}
                brokerPhone={hideBrokerDetails ? undefined : brokerPhone || proposalTheme.whatsapp_number || ''}
                brokerEmail={hideBrokerDetails ? undefined : brokerEmail || proposalTheme.contact_email || ''}
                brokerAvatarUrl={hideBrokerDetails ? undefined : brokerAvatarUrl}
                brokerProfessionalTitle={hideBrokerDetails ? undefined : brokerProfessionalTitle}
                items={effectiveProposalItems}
                interactiveSlots={true}
                onSlotClick={openImagePicker}
              />
            </ScaledProposalSheet>
          </div>

          <UITranslationBoundary attributes={["aria-label"]}><nav aria-label="Páginas de la propuesta" className="mx-auto mt-4 flex max-w-[816px] items-center justify-between gap-2 sm:gap-4">
            <UITranslationBoundary attributes={["aria-label"]}><button
              type="button"
              onClick={() => setPageIndex((index) => Math.max(0, index - 1))}
              disabled={pageIndex === 0}
              aria-label="Página anterior"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-300 bg-white text-[#0a1140] shadow-sm transition hover:bg-slate-50 disabled:opacity-35 cursor-pointer sm:w-12"
            >
              <ChevronLeft className="h-5 w-5" />
            </button></UITranslationBoundary>
            <div className="flex sm:hidden items-center justify-center">
              <span className="rounded-full border border-slate-300/80 bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-2xs"><LocalizedText text={"Pág. "} />{pageIndex + 1}<LocalizedText text={" de "} />{blocks.length}
              </span>
            </div>
            <div className="hidden sm:flex min-w-0 flex-1 items-center justify-center gap-1 sm:gap-1.5 overflow-x-auto py-1">
              {blocks.map((block, index) => (
                <button
                  key={block.id}
                  type="button"
                  onClick={() => setPageIndex(index)}
                  aria-label={`Ir a la página ${index + 1}`}
                  aria-current={pageIndex === index ? 'page' : undefined}
                  className={cn(
                    'h-2 rounded-full transition-all shrink-0 cursor-pointer',
                    pageIndex === index ? 'w-6 sm:w-7 bg-[#0a1140]' : 'w-2 bg-slate-300 hover:bg-slate-400'
                  )}
                />
              ))}
            </div>
            <UITranslationBoundary attributes={["aria-label"]}><button
              type="button"
              onClick={() => setPageIndex((index) => Math.min(blocks.length - 1, index + 1))}
              disabled={pageIndex === blocks.length - 1}
              aria-label="Página siguiente"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-300 bg-white text-[#0a1140] shadow-sm transition hover:bg-slate-50 disabled:opacity-35 cursor-pointer sm:w-12"
            >
              <ChevronRight className="h-5 w-5" />
            </button></UITranslationBoundary>
          </nav></UITranslationBoundary>
        </section></UITranslationBoundary>
      </main>

      {typologyPickerOpen && <UITranslationBoundary attributes={["aria-label"]}><div className="fixed inset-0 z-50 flex items-center justify-center bg-[#07102dcc] p-4" role="dialog" aria-modal="true" aria-label="Seleccionar tipologías">
        <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><h2 className="text-base font-extrabold text-[#0a1140]"><LocalizedText text={"Tipologías de la propuesta"} /></h2><p className="mt-1 text-xs text-slate-500"><LocalizedText text={"Selecciona las tipologías que quieres explicar. Cada una ocupará una página."} /></p></div><UITranslationBoundary attributes={["aria-label"]}><button type="button" onClick={() => setTypologyPickerOpen(false)} aria-label="Cerrar tipologías" className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"><X className="h-4 w-4" /></button></UITranslationBoundary></div>
          <div className="grid gap-2 overflow-y-auto p-5 sm:grid-cols-2">
            {(project.typologies || []).map((typology) => {
              const key = typology.id || typology.key || typology.name;
              const active = selectedTypologyIds.includes(key);
              const plan = typologyPlanImages[key] || typologyPlanImages[typology.id] || typology.floorPlanImage || typology.image;
              return <button key={key} type="button" onClick={() => setAdditionalTypologyIds((current) => current.includes(key) ? current.filter((id) => id !== key) : [...current, key])} aria-pressed={active} className={cn('flex min-h-24 items-center gap-3 rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a1140]', active ? 'border-[#0a1140] bg-[#f5f5fb]' : 'border-slate-200 bg-white hover:border-slate-300')}>
                <span className={cn('grid h-6 w-6 shrink-0 place-items-center rounded-md border', active ? 'border-[#0a1140] bg-[#0a1140] text-white' : 'border-slate-300 bg-white text-transparent')}><Check className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-extrabold text-slate-900">{typology.name}</span><span className="mt-1 block text-[11px] text-slate-500">{[typology.bedrooms ? `${typology.bedrooms} hab.` : '', typology.bathrooms ? `${typology.bathrooms} baños` : '', typology.totalSqm ? `${typology.totalSqm} m²` : ''].filter(Boolean).join(' · ') || 'Datos en configuración'}</span></span>
                {plan && <span className={cn('relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border bg-white', active ? 'border-[#0a1140]/30 shadow-xs' : 'border-slate-200 opacity-90')}><Image src={getProposalThumbnailUrl(plan)} alt={`Plano de ${typology.name}`} fill sizes="80px" className="object-contain p-0.5" /></span>}
              </button>;
            })}
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3"><span className="text-xs font-bold text-slate-500">{selectedTypologyIds.length}<LocalizedText text={" seleccionadas"} /></span><button type="button" onClick={() => setTypologyPickerOpen(false)} className="rounded-xl bg-[#0a1140] px-4 py-2.5 text-xs font-extrabold text-white"><LocalizedText text={"Listo"} /></button></div>
        </div>
      </div></UITranslationBoundary>}

      {imagePickerTarget && <UITranslationBoundary attributes={["aria-label"]}><div className="fixed inset-0 z-50 flex items-center justify-center bg-[#07102dcc] p-4" role="dialog" aria-modal="true" aria-label="Galería de la propuesta">
        <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-base font-extrabold text-[#0a1140]">
                {imagePickerTarget === 'gallery'
                  ? <LocalizedText text={"Fotos de la galería"} />
                  : imagePickerTarget === 'cover'
                  ? 'Imagen de portada'
                  : imagePickerTarget === 'story'
                  ? 'Imagen conceptual'
                  : imagePickerTarget === 'storySecondary'
                  ? 'Imagen inferior'
                  : imagePickerTarget === 'typology'
                  ? <LocalizedText text={"Plano o render de tipología"} />
                  : imagePickerTarget === 'amenities'
                  ? 'Imagen de amenidades'
                  : imagePickerTarget === 'units'
                  ? <LocalizedText text={"Imagen de unidades / inventario"} />
                  : <LocalizedText text={"Imagen de plan de pagos"} />}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {imagePickerTarget === 'gallery'
                  ? <LocalizedText text={"Selecciona las fotos que se incluirán en las páginas de galería (hasta 12)."} />
                  : imagePickerTarget === 'cover'
                  ? <LocalizedText text={"Selecciona una imagen de alto impacto para la portada."} />
                  : <LocalizedText text={"Haz clic en una foto para seleccionarla, o sube nuevas imágenes desde tu equipo."} />}
              </p>
            </div>
            <UITranslationBoundary attributes={["aria-label"]}><button type="button" onClick={() => setImagePickerTarget(null)} aria-label="Cerrar galería" className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer">
              <X className="h-4 w-4" />
            </button></UITranslationBoundary>
          </div>

          <div className="grid grid-cols-3 gap-3 overflow-y-auto p-5 sm:grid-cols-4 md:grid-cols-5">
            {galleryOptions.map((image, index) => {
              const selected = isProposalImageSelected(image);
              const disabled = imagePickerTarget === 'gallery' && !selected && galleryImages.length >= 12;
              const thumbUrl = getProposalThumbnailUrl(image);
              return (
                <button
                  key={`proposal-gallery-${image}-${index}`}
                  type="button"
                  onClick={() => selectProposalImage(image)}
                  disabled={disabled}
                  aria-label={`${selected && imagePickerTarget === 'gallery' ? 'Quitar' : 'Usar'} imagen ${index + 1}`}
                  aria-pressed={selected}
                  className={cn(
                    'group relative block h-28 w-full overflow-hidden rounded-xl border-2 bg-slate-100 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a1140] sm:h-32 cursor-pointer',
                    selected ? 'border-[#0a1140] ring-2 ring-[#0a1140]/20' : 'border-transparent hover:border-slate-300',
                    disabled && 'cursor-not-allowed opacity-35'
                  )}
                >
                  <Image
                    src={thumbUrl}
                    alt={`Imagen ${index + 1} del proyecto`}
                    fill
                    loading="lazy"
                    sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 180px"
                    className="object-cover transition duration-200 group-hover:scale-105"
                    unoptimized={thumbUrl.startsWith('data:')}
                  />
                  {selected && (
                    <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-[#0a1140] text-white shadow-md">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-3">
            <div className="flex items-center gap-3">
              {imagePickerTarget && ['storySecondary', 'typology', 'amenities', 'units', 'payment'].includes(imagePickerTarget) ? (
                <button
                  type="button"
                  onClick={clearTargetImage}
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition cursor-pointer"
                ><LocalizedText text={"Dejar vacío / Quitar imagen"} /></button>
              ) : (
                <span className="text-xs font-bold text-slate-500">
                  {imagePickerTarget === 'gallery' ? `${galleryImages.length} de 12 seleccionadas` : '1 imagen seleccionada'}
                </span>
              )}

              {imagePickerTarget && ['story', 'storySecondary', 'typology', 'amenities', 'units', 'payment'].includes(imagePickerTarget) && (
                <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
                  <span className="text-xs font-bold text-slate-500"><LocalizedText text={"Ajuste:"} /></span>
                  <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-0.5 text-xs font-bold">
                    <UITranslationBoundary attributes={["title"]}><button
                      type="button"
                      onClick={() => setTargetImageFit(imagePickerTarget, 'contain')}
                      className={cn(
                        "rounded-lg px-2.5 py-1 transition cursor-pointer",
                        getTargetImageFit(imagePickerTarget) === 'contain'
                          ? "bg-white text-[#0a1140] shadow-xs font-black"
                          : "text-slate-600 hover:text-slate-900"
                      )}
                      title="Muestra la imagen completa sin recortes"
                    ><LocalizedText text={"Normal (completa)"} /></button></UITranslationBoundary>
                    <UITranslationBoundary attributes={["title"]}><button
                      type="button"
                      onClick={() => setTargetImageFit(imagePickerTarget, 'cover')}
                      className={cn(
                        "rounded-lg px-2.5 py-1 transition cursor-pointer",
                        getTargetImageFit(imagePickerTarget) === 'cover'
                          ? "bg-white text-[#0a1140] shadow-xs font-black"
                          : "text-slate-600 hover:text-slate-900"
                      )}
                      title="Llena todo el espacio"
                    ><LocalizedText text={"Cubrir"} /></button></UITranslationBoundary>
                  </div>
                </div>
              )}
            </div>
            <button type="button" onClick={() => setImagePickerTarget(null)} className="rounded-xl bg-[#0a1140] px-4 py-2.5 text-xs font-extrabold text-white cursor-pointer"><LocalizedText text={"Listo"} /></button>
          </div>
        </div>
      </div></UITranslationBoundary>}

      {isExporting && <div className="pointer-events-none fixed -left-[10000px] top-0 w-[816px]" aria-hidden="true">
        {blocks.map((block, index) => (
          <div key={`proposal-pdf-${block.id}`} data-simple-proposal-slide="true" className="h-[1056px] w-[816px] overflow-hidden bg-white">
            <ProposalMagazinePage block={block} index={index} total={blocks.length} projectName={project.name} clientName={recipientName || 'Inversionista'} agencyName={proposalTheme.name} agencyLogo={proposalTheme.logo_url} brokerName={hideBrokerDetails ? undefined : brokerName || proposalTheme.name} brokerPhone={hideBrokerDetails ? undefined : brokerPhone || proposalTheme.whatsapp_number || ''} brokerEmail={hideBrokerDetails ? undefined : brokerEmail || proposalTheme.contact_email || ''} brokerAvatarUrl={hideBrokerDetails ? undefined : brokerAvatarUrl} brokerProfessionalTitle={hideBrokerDetails ? undefined : brokerProfessionalTitle} items={effectiveProposalItems} />
          </div>
        ))}
      </div>}
    </div>
  );
}
