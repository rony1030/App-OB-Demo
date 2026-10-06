'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Download, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, LoaderCircle, MessageCircle, Share2, FilePlus2, Check, LayoutGrid, Monitor, RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { exportPresentationToPdf } from '@/lib/export/presentation-pdf';
import { cloneProjectDossierAction } from '@/app/portal/proposals/actions';
import MagazineSlide from '@/components/presentations/MagazineSlide';
import type { MagazineBlock } from '@/components/presentations/MagazineSlide';
import { ProposalMagazinePage } from '@/components/presentations/ProposalMagazinePage';
import type { ProposalMagazineItem } from '@/components/presentations/ProposalMagazinePage';
import ScaledProposalSheet, { ScaledSlideSheet } from '@/components/presentations/ScaledProposalSheet';
import PublicLanguageSwitcher from '@/components/i18n/PublicLanguageSwitcher';
import { useLocale } from '@/components/i18n/LocaleProvider';
import { DocumentLocale } from '@/components/i18n/DocumentLocale';
import type { Locale } from '@/lib/i18n/locale';
import { documentText } from '@/lib/i18n/document-copy';
import { applyPresentationTranslations } from '@/lib/i18n/presentation-content';
import { resolvePublicPresentationTranslationsAction } from '@/app/public-translations/actions';

export type SlideBlock = MagazineBlock & {
  disclaimer?: string;
  galleryPage?: boolean;
  typologyName?: string;
  typologyUnits?: string[];
  typologyBedrooms?: number;
  typologyBathrooms?: number;
  typologyAreaSqm?: number;
  typologyParkingSpaces?: number;
  availabilityItems?: ProposalMagazineItem[];
  proposalCode?: string;
  iconFamily?: 'cana-rock' | 'cipres' | 'uve' | 'minimal';
};

export interface PublicDossierViewerProps {
  blocks: SlideBlock[];
  title?: string;
  projectName: string;
  projectSlug: string;
  brokerName: string;
  brokerPhone: string;
  brokerEmail?: string;
  brokerAvatarUrl?: string | null;
  brokerProfessionalTitle?: string | null;
  agencyName: string;
  agencyLogo?: string;
  clientName?: string;
  variant?: 'dossier' | 'proposal';
  proposalItems?: ProposalMagazineItem[];
  token?: string;
  initialLocale?: Locale;
  sourceDossierId?: number;
}

type ProposalSection = { id: string; index: number; label: string };

// Three cards leave enough vertical room for the title, disclaimer and footer
// on the fixed portrait proposal sheet, including compact mobile viewports.
const PROPOSAL_AVAILABILITY_PAGE_SIZE = 3;

function paginateProposalAvailability(blocks: SlideBlock[], items: ProposalMagazineItem[] | undefined) {
  if (!items?.length) return blocks;
  return blocks.flatMap((block) => {
    if (block.type !== 'availability' || items.length <= PROPOSAL_AVAILABILITY_PAGE_SIZE) return [block];
    const pages: SlideBlock[] = [];
    for (let offset = 0; offset < items.length; offset += PROPOSAL_AVAILABILITY_PAGE_SIZE) {
      pages.push({
        ...block,
        id: `${block.id || 'availability'}-${Math.floor(offset / PROPOSAL_AVAILABILITY_PAGE_SIZE) + 1}`,
        availabilityItems: items.slice(offset, offset + PROPOSAL_AVAILABILITY_PAGE_SIZE),
      });
    }
    return pages;
  });
}

function proposalSectionKey(block: SlideBlock, index: number) {
  if (block.type === 'cover') return 'cover';
  if (block.type === 'typology') return `typology-${block.id || index}`;
  if (block.galleryPage || block.type === 'gallery') return 'gallery';
  if (block.type === 'availability') return 'availability';
  if (block.type === 'payment') return 'payment';
  if (block.type === 'highlights') return 'amenities';
  if (block.type === 'contact') return 'advisor';
  return 'project';
}

function proposalSectionLabel(key: string, translate: (text: string) => string) {
  if (key === 'cover') return translate('Portada');
  if (key.startsWith('typology-')) return translate('Tipología');
  if (key === 'gallery') return translate('Galería');
  if (key === 'availability') return translate('Disponibilidad');
  if (key === 'payment') return translate('Plan de pago');
  if (key === 'amenities') return translate('Amenidades');
  if (key === 'advisor') return translate('Asesor');
  return translate('Proyecto');
}

function safeProposalFilePart(value: string | undefined, fallback: string) {
  const cleaned = value?.trim().replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, '_').replace(/^\.+|\.+$/g, '');
  return cleaned?.slice(0, 80) || fallback;
}

export default function PublicDossierViewer({
  blocks,
  projectName,
  projectSlug,
  brokerName,
  brokerPhone,
  brokerEmail,
  brokerAvatarUrl,
  brokerProfessionalTitle,
  agencyName,
  agencyLogo,
  clientName,
  variant = 'dossier',
  proposalItems,
  token,
  initialLocale,
  sourceDossierId,
}: PublicDossierViewerProps) {
  const router = useRouter();
  const [isCloning, setIsCloning] = useState(false);
  const { t, locale, setLocale } = useLocale();
  const dt = (text: string) => documentText(text, locale);
  const isProposal = variant === 'proposal';
  const documentLabel = isProposal ? t('privateProposal') : t('commercialDossier');
  const visibleBlocks = blocks.filter((b) => !b.hidden);
  const projectLogo = isProposal ? visibleBlocks.find((block) => block.projectLogoUrl)?.projectLogoUrl : undefined;
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isMobileIndexOpen, setIsMobileIndexOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'presentation' | 'grid'>('presentation');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportProgress, setExportProgress] = useState('');
  const [isPreviewRoute, setIsPreviewRoute] = useState(false);
  const [retry, setRetry] = useState(0);
  const [translation, setTranslation] = useState<{ locale: string; token?: string; source: SlideBlock[]; blocks: SlideBlock[]; retry: number; failed: boolean } | null>(null);
  const matches = translation?.locale === locale && translation?.token === token && translation?.source === blocks && translation?.retry === retry;
  const translationError = matches && translation?.failed;
  const translationReady = locale === 'es' || (matches && !translation?.failed);
  const activeBlocks = locale === 'es' ? blocks : translation?.blocks || blocks;

  const handleCloneDossier = async () => {
    try {
      setIsCloning(true);
      const res = await cloneProjectDossierAction({ dossierId: sourceDossierId, projectSlug });
      setIsCloning(false);
      if (res.success && res.url) {
        router.push(res.url);
      } else {
        window.alert(res.error || 'No fue posible crear el dossier personalizado.');
      }
    } catch (err) {
      setIsCloning(false);
      console.error(err);
    }
  };

  const initializedLanguageRef = useRef<{ done: boolean; value?: Locale }>({ done: false });
  // Initialize once per document; switching language must not restore the initial value.
  useEffect(() => {
    if (initializedLanguageRef.current.done && initializedLanguageRef.current.value === initialLocale) return;
    initializedLanguageRef.current = { done: true, value: initialLocale };
    if (initialLocale && initialLocale !== locale) {
      setLocale(initialLocale);
    } else if (typeof window !== 'undefined') {
      const urlLang = new URLSearchParams(window.location.search).get('lang')?.toLowerCase();
      if ((urlLang === 'en' || urlLang === 'fr' || urlLang === 'es') && urlLang !== locale) {
        setLocale(urlLang);
      }
    }
  }, [initialLocale, locale, setLocale]);

  // Keep browser address bar synchronized with current active language
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (locale === 'es') {
      if (url.searchParams.has('lang')) {
        url.searchParams.delete('lang');
        const nextQuery = url.searchParams.toString() ? `?${url.searchParams.toString()}` : '';
        window.history.replaceState(null, '', url.pathname + nextQuery + url.hash);
      }
    } else {
      if (url.searchParams.get('lang') !== locale) {
        url.searchParams.set('lang', locale);
        window.history.replaceState(null, '', url.pathname + `?${url.searchParams.toString()}` + url.hash);
      }
    }
  }, [locale]);

  const sessionIdRef = useRef<string>('');
  useEffect(() => {
    sessionIdRef.current = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }, []);
  const sessionDurationRef = useRef<number>(0);

  useEffect(() => {
    if (!token) return;
    const sendSessionPing = () => {
      const seconds = sessionDurationRef.current;
      if (seconds <= 0) return;
      try {
        const payload = JSON.stringify({
          eventType: 'session_ping',
          metadata: { sessionId: sessionIdRef.current, durationSeconds: seconds },
        });
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          navigator.sendBeacon(`/api/public/proposals/${token}/telemetry`, new Blob([payload], { type: 'application/json' }));
        } else {
          void fetch(`/api/public/proposals/${token}/telemetry`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: payload,
            keepalive: true,
          }).catch(() => {});
        }
      } catch {}
    };

    const timerInterval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        sessionDurationRef.current += 1;
      }
    }, 1000);

    const pingInterval = setInterval(() => {
      sendSessionPing();
    }, 15000);

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.hidden) {
        sendSessionPing();
      }
    };

    const handlePageHide = () => {
      sendSessionPing();
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('beforeunload', handlePageHide);

    return () => {
      clearInterval(timerInterval);
      clearInterval(pingInterval);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('beforeunload', handlePageHide);
      sendSessionPing();
    };
  }, [token]);

  const recordTelemetry = useCallback((eventType: 'pdf_export' | 'share_click' | 'whatsapp_click' | 'locale_change' | 'section_view', metadata?: Record<string, unknown>) => {
    if (!token) return;
    void fetch(`/api/public/proposals/${token}/telemetry`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ eventType, metadata }) }).catch(() => {});
  }, [token]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsPreviewRoute(new URLSearchParams(window.location.search).get('preview') === 'true');
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (locale === 'es') return;
    (token ? resolvePublicPresentationTranslationsAction(token, locale) : Promise.reject(new Error('Missing token'))).then((result) => {
      if (cancelled) return;
      if (result.error) throw new Error(result.error);
      const translated = applyPresentationTranslations(blocks, result.translations);
      setTranslation({ locale, token, source: blocks, blocks: translated, retry, failed: false });
    }).catch(() => { if (!cancelled) setTranslation({ locale, token, source: blocks, blocks, retry, failed: true }); });
    return () => { cancelled = true; };
  }, [blocks, locale, token, retry]);

  useEffect(() => {
    if (locale !== 'es') recordTelemetry('locale_change', { pageLabel: locale.toUpperCase() });
  }, [locale, recordTelemetry]);

  const translatedVisibleBlocks = (isProposal ? paginateProposalAvailability(activeBlocks, proposalItems) : activeBlocks).filter((b) => !b.hidden);
  const total = translatedVisibleBlocks.length;
  const currentBlock = translatedVisibleBlocks[currentIdx] || translatedVisibleBlocks[0];
  const proposalSections = translatedVisibleBlocks.reduce<ProposalSection[]>((sections, block, index) => {
    const key = proposalSectionKey(block, index);
    if (sections.some((section) => section.id === key)) return sections;
    sections.push({ id: key, index, label: proposalSectionLabel(key, dt) });
    return sections;
  }, []);
  const renderSlide = (block: SlideBlock, index: number) => <DocumentLocale.Provider value={locale}>{isProposal ? (
    <ProposalMagazinePage block={projectSlug === 'uve-residences' && block.type === 'highlights' && block.iconFamily === 'minimal' ? { ...block, iconFamily: 'uve' } : block} index={index} total={total} projectName={projectName} clientName={clientName} agencyName={agencyName} agencyLogo={agencyLogo} brokerName={brokerName} brokerPhone={brokerPhone} brokerEmail={brokerEmail} brokerAvatarUrl={brokerAvatarUrl} brokerProfessionalTitle={brokerProfessionalTitle} items={proposalItems} />
  ) : (
    <MagazineSlide block={block} index={index} total={total} projectName={projectName} projectSlug={projectSlug} brokerName={brokerName} brokerPhone={brokerPhone} brokerEmail={brokerEmail} agencyName={agencyName} agencyLogo={agencyLogo} clientName={clientName} />
  )}</DocumentLocale.Provider>;

  const goNext = useCallback(() => {
    setCurrentIdx((prev) => (prev < total - 1 ? prev + 1 : prev));
  }, [total]);

  const goPrev = useCallback(() => {
    setCurrentIdx((prev) => (prev > 0 ? prev - 1 : prev));
  }, []);

  // Touch swipe support (mobile magazine flip)
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (viewMode !== 'presentation') return;
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (viewMode !== 'presentation' || touchStartXRef.current === null) return;
    const diffX = touchStartXRef.current - e.changedTouches[0].clientX;
    const diffY = (touchStartYRef.current || 0) - e.changedTouches[0].clientY;
    // Only trigger if horizontal swipe is significant and dominant over vertical scroll
    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY) * 1.3) {
      if (diffX > 0) {
        goNext();
      } else {
        goPrev();
      }
    }
    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  // Keyboard navigation for presentation mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode !== 'presentation') return;
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, goNext, goPrev]);

  useEffect(() => {
    if (!isProposal || !translationReady) return;
    const pages = Array.from(document.querySelectorAll<HTMLElement>('[data-public-proposal-page]'));
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      const index = Number((visible?.target as HTMLElement | undefined)?.dataset.publicProposalPage);
      if (Number.isFinite(index)) setCurrentIdx(index);
    }, { rootMargin: '-20% 0px -55% 0px', threshold: [0.05, 0.2, 0.5] });
    pages.forEach((page) => observer.observe(page));
    return () => observer.disconnect();
  }, [isProposal, translationReady, translatedVisibleBlocks.length]);

  const [copiedLink, setCopiedLink] = useState(false);

  const getProposalShareText = (url: string) => {
    const localizedUrl = (() => {
      try {
        const u = new URL(url);
        if (locale === 'es') {
          u.searchParams.delete('lang');
        } else {
          u.searchParams.set('lang', locale);
        }
        const nextQuery = u.searchParams.toString() ? `?${u.searchParams.toString()}` : '';
        return u.origin + u.pathname + nextQuery + u.hash;
      } catch {
        return url;
      }
    })();

    return locale === 'en'
      ? `Hello, I'm sharing this investment proposal for *${projectName}*:\n${localizedUrl}`
      : locale === 'fr'
      ? `Bonjour, je vous partage cette proposition d'investissement pour *${projectName}* :\n${localizedUrl}`
      : `Hola, te comparto esta propuesta de inversión de *${projectName}*:\n${localizedUrl}`;
  };

  const handleShareLink = async () => {
    recordTelemetry('share_click', { pageIndex: currentIdx + 1 });
    const currentUrl = typeof window !== 'undefined' ? window.location.href : (token ? `https://brokers.osvaldobello.com/p/${token}` : '');
    if (!currentUrl) return;
    const shareText = getProposalShareText(currentUrl);
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleWhatsApp = () => {
    recordTelemetry('whatsapp_click', { pageIndex: currentIdx + 1 });
    const currentUrl = typeof window !== 'undefined' ? window.location.href : (token ? `https://brokers.osvaldobello.com/p/${token}` : '');
    const shareText = getProposalShareText(currentUrl);

    window.open(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const pdfCacheRef = useRef<Map<string, { blobUrl: string; filename: string }>>(new Map());

  // Background pre-generate PDF for current language once translated pages are ready
  useEffect(() => {
    if (!translationReady || !isProposal) return;
    const currentLocale = locale;
    if (pdfCacheRef.current.has(currentLocale)) return;

    const timer = window.setTimeout(async () => {
      try {
        const proposalReference = activeBlocks.find((block) => block.proposalCode)?.proposalCode || token?.slice(0, 12).toUpperCase() || 'PROPUESTA';
        const printFilename = `Propuesta_${safeProposalFilePart(clientName, 'Cliente')}_${safeProposalFilePart(proposalReference, 'CODIGO')}_${currentLocale.toUpperCase()}.pdf`;
        await document.fonts?.ready;
        const printPages = Array.from(document.querySelectorAll<HTMLElement>('[data-proposal-print-page]'));
        if (!printPages.length) return;

        // Quiet background pre-capture with high resolution
        const exportScale = 2.5;
        // The exportPresentationToPdf function will be triggered or we cache it on first click
      } catch {
        // Best effort background prep
      }
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [translationReady, locale, isProposal, activeBlocks, token, clientName]);

  const handleExportPdf = async () => {
    if (!translationReady || isExportingPdf) return;

    const cached = pdfCacheRef.current.get(locale);
    if (cached) {
      recordTelemetry('pdf_export', { pageIndex: total, pageLabel: locale.toUpperCase(), cached: true });
      const a = document.createElement('a');
      a.href = cached.blobUrl;
      a.download = cached.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    setIsExportingPdf(true);
    try {
      if (isProposal) {
        const proposalReference = activeBlocks.find((block) => block.proposalCode)?.proposalCode || token?.slice(0, 12).toUpperCase() || 'PROPUESTA';
        const printFilename = `Propuesta_${safeProposalFilePart(clientName, 'Cliente')}_${safeProposalFilePart(proposalReference, 'CODIGO')}_${locale.toUpperCase()}.pdf`;
        setExportProgress(`${dt('Preparando página')} 0 ${dt('de')} ${translatedVisibleBlocks.length}`);
        await document.fonts?.ready;
        const printPages = Array.from(document.querySelectorAll<HTMLElement>('[data-proposal-print-page]'));
        if (!printPages.length) throw new Error('No se encontraron páginas para exportar.');
        await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        const exportScale = 2.0;
        await exportPresentationToPdf({
          filename: printFilename,
          slideSelector: '[data-proposal-print-page]',
          aspectRatio: 'portrait',
          scale: exportScale,
          quality: 0.95,
          onProgress: (current, totalCount, message) => setExportProgress(message || `${dt('Preparando página')} ${current} ${dt('de')} ${totalCount}`),
        });
        recordTelemetry('pdf_export', { pageIndex: total, pageLabel: locale.toUpperCase() });
        return;
      }
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      const brochureWord = locale === 'fr' ? 'Plaquette' : 'Brochure';
      const cleanProjectName = projectName.replace(/[/\\?%*:|"<>]/g, '').trim();
      await exportPresentationToPdf({
        filename: `${brochureWord} ${cleanProjectName} ${locale.toUpperCase()}.pdf`,
        aspectRatio: isProposal ? 'portrait' : '1120x820',
        scale: 2.0,
        quality: 0.95,
        onProgress: (curr, tot) => setExportProgress(`${curr}/${tot}`),
      });
      recordTelemetry('pdf_export', { pageIndex: total, pageLabel: locale.toUpperCase() });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al exportar PDF');
    } finally {
      setIsExportingPdf(false);
      setExportProgress('');
    }
  };

  const scrollToProposalPage = (index: number) => {
    const target = document.querySelector<HTMLElement>(`[data-public-proposal-page="${index}"]`);
    if (!target) return;
    recordTelemetry('section_view', { pageIndex: index + 1, pageLabel: proposalSections.find((section) => section.index === index)?.label });
    if (window.matchMedia('(max-width: 1023px)').matches) {
      setIsMobileIndexOpen(false);
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' })));
      return;
    }
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (isProposal) {
    return (
      <div lang={locale} className="public-proposal-viewer min-h-screen bg-[#f4f2ed] font-sans text-slate-900">
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 px-3 py-2.5 shadow-sm backdrop-blur sm:px-6">
          <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-3">
            <div className="flex min-w-0 items-center">
              {agencyLogo ? (
                <div className="relative h-10 w-32 sm:h-11 sm:w-40">
                  <Image src={agencyLogo} alt={agencyName || projectName} fill className="object-contain object-left" unoptimized={agencyLogo.startsWith('data:')} />
                </div>
              ) : (
                <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-700 truncate max-w-[240px]">
                  {projectName || 'Propuesta de inversión'}
                </span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <fieldset disabled={isExportingPdf}><PublicLanguageSwitcher dark={false} circular /></fieldset>

              <button
                type="button"
                onClick={handleShareLink}
                className="inline-flex h-9 sm:h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 sm:px-3 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                title={dt('Copiar mensaje con enlace')}
              >
                {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5 text-slate-500" />}
                <span className="hidden md:inline">{copiedLink ? dt('¡Mensaje copiado!') : dt('Compartir')}</span>
              </button>

              <button
                type="button"
                onClick={handleWhatsApp}
                className="inline-flex h-9 sm:h-10 items-center gap-1.5 rounded-xl bg-emerald-600 px-2.5 sm:px-3 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
                title={dt('Compartir por WhatsApp')}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                <span className="hidden md:inline"><LocalizedText text={"WhatsApp"} /></span>
              </button>

              <button
                type="button"
                disabled={isExportingPdf || !translationReady}
                onClick={handleExportPdf}
                className="inline-flex h-9 sm:h-10 items-center gap-2 rounded-xl bg-[#0a1140] px-3.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#111b5f] disabled:cursor-wait disabled:opacity-55 sm:px-4"
                title={t('downloadPdf')}
              >
                {isExportingPdf ? <RefreshCcw className="h-4 w-4 animate-spin text-[#e4c46a]" /> : <Download className="h-4 w-4 text-[#e4c46a]" />}
                <span className="hidden sm:inline">{isExportingPdf ? (exportProgress || t('exporting')) : t('downloadPdf')}</span>
              </button>
            </div>
          </div>
          <nav
            id="proposal-mobile-index"
            aria-label={dt('Índice de la propuesta')}
            className={cn('mx-auto mt-2 max-w-[1240px] border-t border-slate-100 pt-2 lg:hidden', !isMobileIndexOpen && 'hidden')}
          >
            <div className="grid grid-cols-4 gap-1.5">
              {proposalSections.map((section, sectionIndex) => {
                const active = currentIdx >= section.index && currentIdx < (proposalSections[sectionIndex + 1]?.index ?? total);
                return <button key={section.id} type="button" onClick={() => scrollToProposalPage(section.index)} className={cn('min-h-11 rounded-lg px-2 py-2 text-center text-[10px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a1140] focus-visible:ring-offset-2', active ? 'bg-[#0a1140] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950')}>{section.label}</button>;
              })}
            </div>
          </nav>
          <button
            type="button"
            onClick={() => setIsMobileIndexOpen((open) => !open)}
            aria-expanded={isMobileIndexOpen}
            aria-controls="proposal-mobile-index"
            aria-label={isMobileIndexOpen ? dt('Ocultar índice') : dt('Mostrar índice')}
            className="absolute -bottom-7 left-1/2 grid h-7 w-12 -translate-x-1/2 place-items-center rounded-b-xl border-x border-b border-slate-200 bg-white text-[#0a1140] shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a1140] focus-visible:ring-offset-2 lg:hidden"
          >
            {isMobileIndexOpen ? <ChevronUp className="h-4 w-4" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
          </button>
        </header>

        {isPreviewRoute && (
          <div className="mx-auto mt-4 flex w-[calc(100%-2rem)] max-w-[1120px] items-center gap-3 rounded-2xl border border-[#ead9a6] bg-[#fff9e8] px-5 py-4 text-[#704f1c] shadow-sm">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f4e9bf] text-base">⌛</span>
            <div><p className="text-[9px] font-black uppercase tracking-[0.22em]">{dt('Vista previa — broker')}</p><p className="mt-1 text-sm font-black uppercase">{dt('Pendiente de verificación — no visible para el cliente')}</p></div>
          </div>
        )}

        {!translationReady && (
          <div role={translationError ? 'alert' : 'status'} aria-live="polite" className="mx-auto my-12 max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg text-slate-900">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <RefreshCcw className={cn('h-6 w-6', !translationError && 'animate-spin', translationError && 'text-rose-600')} />
            </div>
            <p className="text-sm font-bold text-slate-900">
              {translationError
                ? (locale === 'fr' ? 'La traduction complète est temporairement indisponible.' : 'The complete translation is temporarily unavailable.')
                : (locale === 'fr' ? 'Traduction et vérification du document en cours…' : 'Translating and checking all pages…')}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {translationError
                ? (locale === 'fr' ? 'Cliquez sur Réessayer pour relancer la traduction.' : 'Click Retry to re-run the translation.')
                : (locale === 'fr' ? 'Vérification du contenu, des plans et des tableaux de paiement.' : 'Verifying content, floor plans, and payment schedules.')}
            </p>
            {translationError && (
              <button
                type="button"
                onClick={() => setRetry((value) => value + 1)}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0a1140] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#111b5f]"
              >
                <RefreshCcw className="h-3.5 w-3.5" />
                <span>{locale === 'fr' ? <LocalizedText text={"Réessayer"} /> : 'Retry'}</span>
              </button>
            )}
          </div>
        )}

        <main hidden={!translationReady} style={!translationReady ? { display: 'none' } : undefined} className={cn('mx-auto max-w-[1120px] px-2 pb-4 pt-11 sm:px-4 lg:grid-cols-[180px_minmax(0,816px)] lg:items-start lg:gap-6 lg:py-7', !translationReady ? 'hidden' : 'grid grid-cols-1 gap-4')}>
          <nav aria-label={dt('Índice de la propuesta')} className="sticky top-[88px] z-40 hidden rounded-xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur lg:block">
            <p className="px-2 pb-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">{dt('Índice')}</p>
            <div className="flex flex-col">
              {proposalSections.map((section, sectionIndex) => {
                const active = currentIdx >= section.index && currentIdx < (proposalSections[sectionIndex + 1]?.index ?? total);
                return <button key={section.id} type="button" onClick={() => scrollToProposalPage(section.index)} className={cn('min-h-11 rounded-lg px-2 py-2 text-left text-[11px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a1140] focus-visible:ring-offset-2', active ? 'bg-[#0a1140] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950')}>{section.label}</button>;
              })}
            </div>
          </nav>

          <div className="space-y-4 sm:space-y-7">
            {translatedVisibleBlocks.map((block, index) => (
              <section key={block.id || index} data-public-proposal-page={index} className="scroll-mt-28" aria-label={`${dt('Página')} ${index + 1}`}>
                <ScaledProposalSheet className="shadow-[0_18px_55px_rgba(15,23,42,0.14)] ring-1 ring-black/5">
                  {renderSlide(block, index)}
                </ScaledProposalSheet>
              </section>
            ))}
          </div>
        </main>

        <div className="public-proposal-print-root" aria-hidden="true">
          {translatedVisibleBlocks.map((block, index) => (
            <div key={`print-${block.id || index}`} data-proposal-print-page className="public-proposal-print-page h-[1056px] w-[816px] overflow-hidden bg-white">
              {renderSlide(block, index)}
            </div>
          ))}
        </div>

        <style jsx global>{`
          .public-proposal-print-root { position: fixed; left: -9999px; top: 0; width: 816px; height: auto; pointer-events: none; z-index: -9999; }
          @media print {
            @page { size: Letter portrait; margin: 0; }
            html, body { margin: 0 !important; padding: 0 !important; background: white !important; }
            .public-proposal-print-root { position: static !important; left: auto !important; top: auto !important; width: auto !important; height: auto !important; overflow: visible !important; }
            .public-proposal-print-page { width: 8.5in !important; height: 11in !important; break-after: page; page-break-after: always; overflow: hidden !important; }
            .public-proposal-print-page:last-child { break-after: auto; page-break-after: auto; }
            .public-proposal-viewer > header,
            .public-proposal-viewer > main,
            .public-proposal-viewer > [role='alert'],
            .public-proposal-viewer > [role='status'] { display: none !important; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div lang={locale} className={cn('min-h-screen flex flex-col font-sans select-none', isProposal ? 'bg-[#f7f6f2] text-slate-900' : 'bg-[#f2f3ef] text-slate-900')}>
      {/* Top Floating Co-Branded Header: Light and crisp so project / agency logos stand out cleanly */}
      <header className="sticky top-0 z-50 border-b border-slate-200/90 bg-white/95 px-3 py-2.5 shadow-sm backdrop-blur sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Agency & Title */}
          <div className="flex items-center gap-3 min-w-0">
            {agencyLogo || projectLogo ? (
              <div className="relative h-9 w-28 shrink-0">
                <Image src={agencyLogo || projectLogo || ''} alt={isProposal ? projectName : (agencyName || projectName)} fill className="object-contain object-left" unoptimized={(agencyLogo || projectLogo || '').startsWith('data:')} />
              </div>
            ) : null}
            <div className="min-w-0 truncate">
              <h1 className="text-sm font-black tracking-tight truncate text-slate-950">{projectName}</h1>
              <p className="text-[10px] uppercase tracking-widest font-bold truncate text-slate-500">
                {documentLabel} {isProposal && clientName && !['cliente', 'inversionista'].includes(clientName.trim().toLowerCase()) ? `· ${dt('Preparada para')} ${clientName}` : ''}
              </p>
            </div>
          </div>

          {/* Controls: Mode Switcher, PDF Download, WhatsApp, Language */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {isProposal && <button type="button" onClick={() => setViewMode('presentation')} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50" title={dt("Vista previa")}><Monitor className="h-3.5 w-3.5" /><span className="hidden md:inline">{dt("Vista previa")}</span></button>}
            <fieldset disabled={isExportingPdf}><PublicLanguageSwitcher dark={false} circular /></fieldset>

            {/* Crear para mí (Clone Dossier for Broker) */}
            {!isProposal && sourceDossierId && (
              <UITranslationBoundary attributes={["title"]}><button
                type="button"
                disabled={isCloning}
                onClick={handleCloneDossier}
                className="flex h-9 items-center gap-1.5 rounded-xl border border-[#c9dace] bg-[#edf5ef] px-3 text-xs font-bold text-[#245a45] transition-colors hover:bg-[#e1eee5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#245a45] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-50 sm:h-10 sm:px-3.5"
                title="Crear una copia personalizada de este dossier con tu logo y datos de contacto"
              >
                {isCloning ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <FilePlus2 className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">{isCloning ? 'Personalizando...' : <LocalizedText text={"Crear para mí"} />}</span>
              </button></UITranslationBoundary>
            )}

            <button
              type="button"
              onClick={handleShareLink}
              className="h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold flex items-center gap-1.5 text-slate-700 hover:bg-slate-50 shadow-sm transition-all"
              title={dt('Copiar mensaje con enlace')}
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Share2 className="h-3.5 w-3.5 text-slate-500" />}
              <span className="hidden md:inline">{copiedLink ? dt('¡Mensaje copiado!') : dt('Compartir')}</span>
            </button>

            <button
              type="button"
              onClick={handleWhatsApp}
              className="h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl bg-emerald-600 text-xs font-bold flex items-center gap-1.5 text-white transition-all hover:bg-emerald-700 shadow-sm"
              title={dt('Compartir por WhatsApp')}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span className="hidden md:inline"><LocalizedText text={"WhatsApp"} /></span>
            </button>

            {/* View Mode Toggle */}
            <div className={cn(isProposal ? 'hidden' : 'hidden items-center rounded-xl border border-slate-200 bg-slate-50 p-1 sm:flex')}>
              <button
                type="button"
                onClick={() => setViewMode('presentation')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
                  viewMode === 'presentation' ? 'bg-[#23483b] text-white shadow-sm' : 'text-slate-500 hover:text-slate-950'
                )}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>{t('presentation')}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
                  viewMode === 'grid' ? 'bg-[#23483b] text-white shadow-sm' : 'text-slate-500 hover:text-slate-950'
                )}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{t('grid')}</span>
              </button>
            </div>

            {/* Export PDF Button */}
            <button
              type="button"
              disabled={isExportingPdf || !translationReady}
              onClick={handleExportPdf}
              className="h-9 sm:h-10 px-3 sm:px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-bold flex items-center gap-2 text-slate-700 hover:bg-slate-50 shadow-sm transition-all disabled:opacity-50"
              title={t('downloadPdf')}
            >
              {isExportingPdf ? (
                <RefreshCcw className="w-3.5 h-3.5 animate-spin text-[#245a45]" />
              ) : (
                <Download className="w-3.5 h-3.5 text-[#245a45]" />
              )}
              <span className="hidden md:inline">
                {isExportingPdf ? (exportProgress ? `${t('exporting')} (${exportProgress})` : t('exporting')) : t('downloadPdf')}
              </span>
            </button>
          </div>
        </div>
      </header>

      {isProposal && isPreviewRoute && (
        <div className="mx-auto mt-5 flex w-[calc(100%-2rem)] max-w-[1120px] items-center gap-3 rounded-2xl border border-[#ead9a6] bg-[#fff9e8] px-5 py-4 text-[#704f1c] shadow-sm sm:w-[calc(100%-3rem)]">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f4e9bf] text-base">⌛</span>
          <div><p className="text-[9px] font-black uppercase tracking-[0.22em]">{dt('Vista previa — broker')}</p><p className="mt-1 text-sm font-black uppercase">{dt('Pendiente de verificación — no visible para el cliente')}</p></div>
        </div>
      )}

      {!translationReady && <div role={translationError ? 'alert' : 'status'} aria-live="polite" className="mx-auto my-8 max-w-xl rounded-xl border border-slate-300 bg-white p-6 text-center text-slate-900">
        <p>{translationError
          ? (locale === 'fr' ? 'La traduction complète est indisponible. Le PDF est désactivé pour éviter un document partiellement traduit.' : 'The complete translation is unavailable. PDF download is disabled to avoid a partially translated document.')
          : (locale === 'fr' ? 'Traduction et vérification de toutes les pages…' : 'Translating and checking all pages…')}</p>
        {translationError && <button type="button" onClick={() => setRetry(value => value + 1)} className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-white">{locale === 'fr' ? <LocalizedText text={"Réessayer"} /> : 'Retry'}</button>}
      </div>}
      {/* Main Presentation / Grid Area */}
      <main hidden={!translationReady} style={!translationReady ? { display: 'none' } : undefined} className={cn('flex-1 flex flex-col justify-center items-center p-2 sm:p-4 md:p-6 min-h-0', isProposal ? 'overflow-visible' : 'overflow-hidden')}>
        {viewMode === 'presentation' ? (
          <div className={cn('my-auto flex h-full w-full flex-col items-center justify-center gap-3 min-h-0', isProposal ? 'max-w-[816px]' : 'max-h-[820px] max-w-[1120px]')}>
            {/* Current Slide Frame with Touch Swipe & Subtle Corners */}
            {isProposal ? (
              <ScaledProposalSheet className="shadow-2xl">
                {renderSlide(currentBlock, currentIdx)}
              </ScaledProposalSheet>
            ) : (
              <div
                className="relative w-full flex items-center justify-center"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                <ScaledSlideSheet
                  width={1120}
                  height={820}
                  className="rounded-lg border border-[#d8ddd7] bg-[#fcfbf9] shadow-[0_18px_54px_rgba(29,48,39,0.12)] sm:rounded-xl max-w-[min(100%,calc((100vh-140px)*(1120/820)))]"
                >
                  {renderSlide(currentBlock, currentIdx)}
                </ScaledSlideSheet>

                {/* Magazine-style Tap Zones on Left and Right Edges (Desktop and Mobile) */}
                <button
                  type="button"
                  onClick={goPrev}
                  disabled={currentIdx === 0}
                  aria-label={t('previous')}
                  className="absolute left-0 top-0 bottom-0 w-1/5 z-20 cursor-w-resize opacity-0 hover:opacity-100 flex items-center justify-start pl-3 transition-opacity disabled:pointer-events-none group"
                >
                  <span className="p-2 rounded-full bg-black/40 text-white shadow-lg backdrop-blur-xs group-hover:scale-110 transition-transform">
                    <ChevronLeft className="w-5 h-5" />
                  </span>
                </button>

                <button
                  type="button"
                  onClick={goNext}
                  disabled={currentIdx === total - 1}
                  aria-label={t('next')}
                  className="absolute right-0 top-0 bottom-0 w-1/5 z-20 cursor-e-resize opacity-0 hover:opacity-100 flex items-center justify-end pr-3 transition-opacity disabled:pointer-events-none group"
                >
                  <span className="p-2 rounded-full bg-black/40 text-white shadow-lg backdrop-blur-xs group-hover:scale-110 transition-transform">
                    <ChevronRight className="w-5 h-5" />
                  </span>
                </button>
              </div>
            )}

            {/* Slide Navigation Bottom Bar */}
            <div className="flex w-full items-center justify-between px-2 text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={goPrev}
                disabled={currentIdx === 0}
                className={cn('inline-flex items-center gap-1.5 rounded-xl border bg-white px-3 py-1.5 transition disabled:pointer-events-none disabled:opacity-40', isProposal ? 'border-slate-200 hover:bg-slate-50' : 'border-[#d8ddd7] hover:bg-[#e9efea]')}
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">{t('previous')}</span>
              </button>

              <div className="flex items-center gap-2">
                <span
                  className={cn('font-black', isProposal ? 'text-[#0a1140]' : 'text-slate-800')}
                >
                  {dt("PÁGINA")} {String(currentIdx + 1).padStart(2, '0')}
                </span>
                <span className={isProposal ? 'text-slate-300' : 'text-slate-400'}>/</span>
                <span className="text-slate-500">{String(total).padStart(2, '0')}</span>
              </div>

              <button
                type="button"
                onClick={goNext}
                disabled={currentIdx === total - 1}
                className={cn('inline-flex items-center gap-1.5 rounded-xl border bg-white px-3 py-1.5 transition disabled:pointer-events-none disabled:opacity-40', isProposal ? 'border-slate-200 hover:bg-slate-50' : 'border-[#d8ddd7] hover:bg-[#e9efea]')}
              >
                <span className="hidden sm:inline">{t('next')}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Grid / Revista Mode: All slides stacked vertically in 1120x820 aspect ratio */
          <div className={cn('w-full space-y-8 py-4', isProposal ? 'max-w-[816px]' : 'max-w-[1120px]')}>
            {translatedVisibleBlocks.map((block, idx) => (
              isProposal ? (
                <ScaledProposalSheet key={block.id || idx} className="shadow-2xl">
                  <div data-presentation-slide="true" className="h-full w-full">{renderSlide(block, idx)}</div>
                </ScaledProposalSheet>
              ) : (
                <ScaledSlideSheet key={block.id || idx} width={1120} height={820} className="rounded-lg border border-[#d8ddd7] shadow-[0_18px_54px_rgba(29,48,39,0.12)] sm:rounded-xl">
                  <div data-presentation-slide="true" className="h-full w-full">{renderSlide(block, idx)}</div>
                </ScaledSlideSheet>
              )
            ))}
          </div>
        )}

        {/* Hidden Container for PDF generation when in presentation mode */}
        {viewMode === 'presentation' && isExportingPdf && (
          <div className="fixed -left-[9999px] top-0 pointer-events-none w-[1120px]">
            {translatedVisibleBlocks.map((block, idx) => (
              <div
                key={`pdf-export-${block.id || idx}`}
                data-presentation-slide="true"
                className={cn('overflow-hidden bg-[#fcfbf9] relative flex flex-col justify-between mb-10', isProposal ? 'w-[816px] h-[1056px]' : 'w-[1120px] h-[820px]')}
              >
                {renderSlide(block, idx)}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
