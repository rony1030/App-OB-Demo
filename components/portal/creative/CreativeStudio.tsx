'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Undo2,
  Redo2,
  Copy,
  Check,
  Download,
  FileJson,
  Images,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ChevronDown,
  Megaphone,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react';
import { cn, formatCurrencyExplicit } from '@/lib/utils';
import type { PortalProject } from '@/lib/portal-projects';
import { useBrand } from '@/components/branding/BrandProvider';
import { CANVAS_SIZES, type AgentProfile, type AspectRatio, type CarouselProjectData, type StylePreset } from './types';
import { mapProjectToCarouselData } from './mapProjectToCarouselData';
import { useCanvasHistory } from './useCanvasHistory';
import { SlideRenderer } from './SlideRenderer';
import { getTotalSlides, getSlideKind, getSlideLabel, getContentSlideIndex, setElementLayout } from './slides';
import { exportAllSlidesAsZip, exportDesignAsJson, exportSlideAsPng } from './exporter';

interface CreativeStudioProps {
  isOpen: boolean;
  onClose: () => void;
  project: PortalProject;
  agent: AgentProfile;
}

const STYLE_OPTIONS: { id: StylePreset; label: string; available: boolean }[] = [
  { id: 'A', label: 'Editorial Clásico', available: true },
  { id: 'B', label: 'Minimal Bold', available: true },
  { id: 'C', label: 'Luxury Dark', available: true },
  { id: 'D', label: 'Preventa Urgente', available: true },
  { id: 'E', label: 'Premium Gold', available: false },
  { id: 'F', label: 'Skyline', available: false },
];

const emptySubscribe = () => () => {};

export { default } from './AdvancedCreativeStudio';

/** Kept as a reference for the version 1 editor and template migration. */
export function LegacyCreativeStudio({ isOpen, onClose, project, agent }: CreativeStudioProps) {
  const { theme } = useBrand();

  const initialData = useMemo<CarouselProjectData>(() => {
    const base = mapProjectToCarouselData(project, agent);
    return { ...base, footerLogoUrl: theme.logo_dark_url || theme.logo_url || null };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.slug, agent]);

  const history = useCanvasHistory<CarouselProjectData>(initialData);
  const { data } = history;

  const [slideIndex, setSlideIndex] = useState(0);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [slideIndexAtSelection, setSlideIndexAtSelection] = useState(0);
  if (slideIndex !== slideIndexAtSelection) {
    setSlideIndexAtSelection(slideIndex);
    setSelectedObjectId(null);
  }
  const [styleMenuOpen, setStyleMenuOpen] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [exporting, setExporting] = useState<'png' | 'zip' | null>(null);
  const [exportProgress, setExportProgress] = useState<{ done: number; total: number } | null>(null);
  const styleMenuRef = useRef<HTMLDivElement>(null);
  const canvasViewportRef = useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = useState<{ width: number; height: number }>({ width: 800, height: 600 });
  const [zoomLevel, setZoomLevel] = useState<'fit' | number>('fit');

  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const totalSlides = getTotalSlides(data);
  const currentKind = getSlideKind(data, slideIndex);
  const canvasDim = CANVAS_SIZES[data.aspectRatio];

  useEffect(() => {
    if (!isOpen) return;
    const el = canvasViewportRef.current;
    if (!el) return;

    const updateSize = () => {
      setViewportSize({
        width: el.clientWidth,
        height: el.clientHeight,
      });
    };

    updateSize();

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setViewportSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [isOpen]);

  const fitScale = useMemo(() => {
    // 48px horizontal margin, 128px vertical margin for top paginator and bottom floating zoom dock
    const marginX = 48;
    const marginY = 128;
    const availW = Math.max(160, viewportSize.width - marginX);
    const availH = Math.max(160, viewportSize.height - marginY);
    const scale = Math.min(availW / canvasDim.width, availH / canvasDim.height);
    return Math.max(0.2, Math.min(1.2, Number(scale.toFixed(2))));
  }, [viewportSize, canvasDim.width, canvasDim.height]);

  const effectiveScale = zoomLevel === 'fit' ? fitScale : zoomLevel;
  const zoomDisplayPct = Math.round(effectiveScale * 100);

  const goToSlide = useCallback((index: number) => {
    setSlideIndex(Math.max(0, Math.min(totalSlides - 1, index)));
  }, [totalSlides]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.05 : -0.05;
      setZoomLevel((prev) => {
        const current = prev === 'fit' ? fitScale : prev;
        return Math.max(0.2, Math.min(1.8, Number((current + delta).toFixed(2))));
      });
    }
  }, [fitScale]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement)?.tagName)) return;

      if ((event.metaKey || event.ctrlKey) && (event.key === '=' || event.key === '+')) {
        event.preventDefault();
        setZoomLevel((prev) => {
          const current = prev === 'fit' ? fitScale : prev;
          return Math.min(1.5, Number((current + 0.1).toFixed(2)));
        });
      } else if ((event.metaKey || event.ctrlKey) && event.key === '-') {
        event.preventDefault();
        setZoomLevel((prev) => {
          const current = prev === 'fit' ? fitScale : prev;
          return Math.max(0.25, Number((current - 0.1).toFixed(2)));
        });
      } else if ((event.metaKey || event.ctrlKey) && event.key === '0') {
        event.preventDefault();
        setZoomLevel('fit');
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goToSlide(slideIndex - 1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goToSlide(slideIndex + 1);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fitScale, goToSlide, isOpen, onClose, slideIndex]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: PointerEvent) {
      if (styleMenuRef.current && !styleMenuRef.current.contains(event.target as Node)) setStyleMenuOpen(false);
    }
    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  function editField(next: CarouselProjectData) {
    history.setDataLive(next);
  }

  function copyCommercialCaption() {
    const text = `OPORTUNIDAD DE INVERSIÓN: ${project.name.toUpperCase()}\n\nUbicación: ${project.location}\nPrecios desde: ${formatCurrencyExplicit(data.slide1.price, data.slide1.currency)}\nEntrega estimada: ${project.delivery}\n\nAmenidades destacadas:\n${project.amenities.slice(0, 4).map((a) => `• ${a}`).join('\n')}\n\nSolicita el dossier oficial interactivo y la disponibilidad vigente por mensaje privado o WhatsApp.`;
    navigator.clipboard.writeText(text);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2500);
  }

  async function handleExportPng() {
    setExporting('png');
    try {
      await exportSlideAsPng(`slide-canvas-export-${slideIndex}`, `${project.slug}-lamina-${slideIndex + 1}.png`);
    } catch (error) {
      console.error('exportSlideAsPng failed', error);
    } finally {
      setExporting(null);
    }
  }

  async function handleExportZip() {
    setExporting('zip');
    setExportProgress({ done: 0, total: totalSlides });
    try {
      await exportAllSlidesAsZip('slide-canvas-export', project.name, totalSlides, (done, total) => setExportProgress({ done, total }));
    } catch (error) {
      console.error('exportAllSlidesAsZip failed', error);
    } finally {
      setExporting(null);
      setExportProgress(null);
    }
  }

  if (!isOpen || !mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex h-[100dvh] w-screen flex-col overflow-hidden bg-slate-900 select-none text-slate-900 antialiased"
      role="dialog"
      aria-modal="true"
      aria-label={`Estudio Creativo - ${project.name}`}
    >
      <header className="flex h-14 shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 z-40">
        <div className="flex items-center gap-3">
          <UITranslationBoundary attributes={["aria-label"]}><button
            type="button"
            onClick={onClose}
            aria-label="Cerrar Estudio Creativo"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 transition"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button></UITranslationBoundary>
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                <Megaphone className="h-3 w-3" strokeWidth={1.5} />
              </span>
              <p className="text-xs font-extrabold text-slate-900"><LocalizedText text={"Estudio Creativo · "} />{project.name}</p>
            </div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400"><LocalizedText text={"Carrusel multi-lámina para Instagram &amp; WhatsApp"} /></p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Selector de estilo A-F */}
          <div className="relative" ref={styleMenuRef}>
            <button
              type="button"
              onClick={() => setStyleMenuOpen((v) => !v)}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50"
            ><LocalizedText text={"Estilo "} />{data.stylePreset}
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {styleMenuOpen && (
              <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl">
                {STYLE_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={data.stylePreset === option.id}
                    disabled={!option.available}
                    onClick={() => {
                      if (!option.available) return;
                      history.setData({ ...data, stylePreset: option.id });
                      setStyleMenuOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-bold transition',
                      data.stylePreset === option.id ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50',
                      !option.available && 'cursor-not-allowed opacity-40 hover:bg-transparent'
                    )}
                  >
                    <span>{option.label}</span>
                    {!option.available && <span className="text-[9px] font-black uppercase tracking-wide"><LocalizedText text={"Próximamente"} /></span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Formato */}
          <div className="hidden sm:flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
            {(['portrait', 'square'] as AspectRatio[]).map((ratio) => (
              <button
                key={ratio}
                type="button"
                onClick={() => history.setData({ ...data, aspectRatio: ratio })}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-[10px] font-extrabold transition',
                  data.aspectRatio === ratio ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                )}
              >
                {ratio === 'portrait' ? '4:5' : '1:1'}
              </button>
            ))}
          </div>

          {/* Deshacer / Rehacer */}
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
            <UITranslationBoundary attributes={["aria-label"]}><button
              type="button"
              onClick={() => history.undo()}
              disabled={!history.canUndo}
              aria-label="Deshacer"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </button></UITranslationBoundary>
            <UITranslationBoundary attributes={["aria-label"]}><button
              type="button"
              onClick={() => history.redo()}
              disabled={!history.canRedo}
              aria-label="Rehacer"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30"
            >
              <Redo2 className="h-3.5 w-3.5" />
            </button></UITranslationBoundary>
          </div>

          <button
            type="button"
            onClick={copyCommercialCaption}
            className={cn(
              'inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition',
              copiedCaption ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            )}
          >
            {copiedCaption ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="hidden md:inline">{copiedCaption ? 'Copiado' : 'Copiar Texto'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportPng}
            disabled={exporting !== null}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {exporting === 'png' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            <span className="hidden md:inline"><LocalizedText text={"Lámina PNG"} /></span>
          </button>

          <button
            type="button"
            onClick={handleExportZip}
            disabled={exporting !== null}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-blue-600 px-3 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {exporting === 'zip' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Images className="h-3.5 w-3.5" />}
            <span>{exportProgress ? `${exportProgress.done}/${exportProgress.total}` : 'Descargar Carrusel'}</span>
          </button>

          <UITranslationBoundary attributes={["aria-label"]}><button
            type="button"
            onClick={() => exportDesignAsJson(data)}
            aria-label="Descargar diseño en JSON"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
          >
            <FileJson className="h-3.5 w-3.5" />
          </button></UITranslationBoundary>
        </div>
      </header>

      <div className="grid h-[calc(100dvh-3.5rem)] min-h-0 flex-1 grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)_320px] overflow-hidden bg-slate-100">
        {/* Navegador de láminas */}
        <aside className="hidden lg:flex h-full flex-col gap-2 overflow-y-auto border-r border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between px-1 pb-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400"><LocalizedText text={"Láminas"} /></span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600">{totalSlides}<LocalizedText text={" total"} /></span>
          </div>
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goToSlide(index)}
              className={cn(
                'flex items-center justify-between rounded-xl border p-2.5 text-left text-xs font-bold transition',
                slideIndex === index
                  ? 'border-blue-600 bg-blue-50/70 text-blue-700 shadow-xs'
                  : 'border-slate-200/80 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              )}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-black',
                    slideIndex === index ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                  )}
                >
                  {index + 1}
                </span>
                <span className="truncate">{getSlideLabel(data, index)}</span>
              </div>
              {slideIndex === index && (
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
              )}
            </button>
          ))}
        </aside>

        {/* Lienzo / Canvas Workspace */}
        <main
          ref={canvasViewportRef}
          onWheel={handleWheel}
          className="relative flex h-full min-h-0 flex-1 flex-col overflow-auto bg-slate-200/70 select-none [background-image:radial-gradient(#cbd5e1_1.2px,transparent_1.2px)] [background-size:18px_18px]"
          style={{ touchAction: 'pan-x pan-y' }}
        >
          {/* Top Pagination Bar - Sticky at top */}
          <div className="sticky top-3 z-30 flex shrink-0 justify-center pointer-events-none px-4">
            <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-slate-200/90 bg-white/95 px-3 py-1 shadow-md backdrop-blur-md">
              <UITranslationBoundary attributes={["aria-label"]}><button
                type="button"
                onClick={() => goToSlide(slideIndex - 1)}
                disabled={slideIndex === 0}
                aria-label="Lámina anterior"
                className="flex h-7 w-7 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 disabled:opacity-25 transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button></UITranslationBoundary>
              <span className="min-w-[140px] text-center text-[10px] font-extrabold uppercase tracking-wide text-slate-700">
                {slideIndex + 1} / {totalSlides} · {getSlideLabel(data, slideIndex)}
              </span>
              <UITranslationBoundary attributes={["aria-label"]}><button
                type="button"
                onClick={() => goToSlide(slideIndex + 1)}
                disabled={slideIndex === totalSlides - 1}
                aria-label="Lámina siguiente"
                className="flex h-7 w-7 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 disabled:opacity-25 transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button></UITranslationBoundary>
            </div>
          </div>

          {/* Scaled Canvas Stage */}
          <div className="flex min-h-full min-w-full items-center justify-center py-6 px-4">
            <div
              className="relative transition-all duration-150 ease-out shrink-0"
              style={{
                width: canvasDim.width * effectiveScale,
                height: canvasDim.height * effectiveScale,
              }}
            >
              <div
                style={{
                  width: canvasDim.width,
                  height: canvasDim.height,
                  transform: `scale(${effectiveScale})`,
                  transformOrigin: 'top left',
                }}
                className="absolute left-0 top-0 origin-top-left rounded-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.35)] ring-1 ring-slate-900/10"
              >
                <SlideRenderer
                  data={data}
                  slideIndex={slideIndex}
                  idPrefix="slide-canvas"
                  editable
                  selectedObjectId={selectedObjectId}
                  onSelectObject={setSelectedObjectId}
                  onBeginEdit={() => history.beginEdit()}
                  onObjectLiveChange={(objectId, layout) =>
                    history.setDataLive(setElementLayout(data, slideIndex, objectId, layout))
                  }
                  onCommitEdit={() => history.commitEdit()}
                />
              </div>
            </div>
          </div>

          {/* Floating Canva-style Zoom Dock - Sticky at bottom */}
          <div className="sticky bottom-3 z-30 flex shrink-0 justify-center pointer-events-none mt-auto px-4 pb-1">
            <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-slate-200/90 bg-white/95 px-3 py-1.5 shadow-lg backdrop-blur-md">
              <UITranslationBoundary attributes={["aria-label","title"]}><button
                type="button"
                onClick={() =>
                  setZoomLevel((prev) => {
                    const current = prev === 'fit' ? fitScale : prev;
                    return Math.max(0.2, Number((current - 0.1).toFixed(2)));
                  })
                }
                aria-label="Reducir zoom"
                title="Reducir zoom (Ctrl -)"
                className="flex h-7 w-7 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 transition"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button></UITranslationBoundary>

              <UITranslationBoundary attributes={["title"]}><button
                type="button"
                onClick={() => setZoomLevel(zoomLevel === 'fit' ? 1 : 'fit')}
                className="rounded-lg px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition"
                title={zoomLevel === 'fit' ? 'Cambiar a 100% (tamaño real)' : 'Ajustar a ventana'}
              >
                {zoomLevel === 'fit' ? `Ajustar (${zoomDisplayPct}%)` : `${zoomDisplayPct}%`}
              </button></UITranslationBoundary>

              <UITranslationBoundary attributes={["aria-label","title"]}><button
                type="button"
                onClick={() =>
                  setZoomLevel((prev) => {
                    const current = prev === 'fit' ? fitScale : prev;
                    return Math.min(1.8, Number((current + 0.1).toFixed(2)));
                  })
                }
                aria-label="Aumentar zoom"
                title="Aumentar zoom (Ctrl +)"
                className="flex h-7 w-7 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 transition"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button></UITranslationBoundary>

              <div className="mx-1 h-3.5 w-px bg-slate-200" />

              <UITranslationBoundary attributes={["title"]}><button
                type="button"
                onClick={() => setZoomLevel('fit')}
                title="Ajustar automáticamente a la pantalla (Ctrl 0)"
                className={cn(
                  'flex h-7 items-center gap-1 rounded-full px-2.5 text-[10px] font-bold transition',
                  zoomLevel === 'fit'
                    ? 'bg-blue-50 text-blue-600 ring-1 ring-blue-200'
                    : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                <Maximize2 className="h-3 w-3" />
                <span><LocalizedText text={"Ajustar"} /></span>
              </button></UITranslationBoundary>
            </div>
          </div>
        </main>

        {/* Inspector */}
        <aside className="hidden lg:flex h-full flex-col gap-4 overflow-y-auto border-l border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400"><LocalizedText text={"Lámina "} />{slideIndex + 1}</p>
              <p className="text-xs font-bold text-slate-800">{getSlideLabel(data, slideIndex)}</p>
            </div>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-600">
              {data.aspectRatio === 'portrait' ? '4:5 IG' : '1:1 IG'}
            </span>
          </div>
          {currentKind === 'cover' && (
            <>
              <UITranslationBoundary attributes={["label"]}><Field label="Titular">
                <input
                  value={data.slide1.title}
                  onFocus={() => history.beginEdit()}
                  onChange={(e) => editField({ ...data, slide1: { ...data.slide1, title: e.target.value } })}
                  onBlur={() => history.commitEdit()}
                  className={inputClass}
                />
              </Field></UITranslationBoundary>
              <UITranslationBoundary attributes={["label"]}><Field label="Ubicación">
                <input
                  value={data.slide1.subtitle}
                  onFocus={() => history.beginEdit()}
                  onChange={(e) => editField({ ...data, slide1: { ...data.slide1, subtitle: e.target.value } })}
                  onBlur={() => history.commitEdit()}
                  className={inputClass}
                />
              </Field></UITranslationBoundary>
              <div className="grid grid-cols-3 gap-2">
                <UITranslationBoundary attributes={["label"]}><Field label="Hab.">
                  <input
                    value={data.slide1.bedrooms}
                    onFocus={() => history.beginEdit()}
                    onChange={(e) => editField({ ...data, slide1: { ...data.slide1, bedrooms: e.target.value } })}
                    onBlur={() => history.commitEdit()}
                    className={inputClass}
                  />
                </Field></UITranslationBoundary>
                <UITranslationBoundary attributes={["label"]}><Field label="Baños">
                  <input
                    value={data.slide1.bathrooms}
                    onFocus={() => history.beginEdit()}
                    onChange={(e) => editField({ ...data, slide1: { ...data.slide1, bathrooms: e.target.value } })}
                    onBlur={() => history.commitEdit()}
                    className={inputClass}
                  />
                </Field></UITranslationBoundary>
                <UITranslationBoundary attributes={["label"]}><Field label="Área">
                  <input
                    value={data.slide1.area}
                    onFocus={() => history.beginEdit()}
                    onChange={(e) => editField({ ...data, slide1: { ...data.slide1, area: e.target.value } })}
                    onBlur={() => history.commitEdit()}
                    className={inputClass}
                  />
                </Field></UITranslationBoundary>
              </div>
              <Field label={`Precio a mostrar (${data.slide1.currency || 'USD'})`}>
                <input
                  type="number"
                  value={data.slide1.price}
                  onFocus={() => history.beginEdit()}
                  onChange={(e) => editField({ ...data, slide1: { ...data.slide1, price: Number(e.target.value) } })}
                  onBlur={() => history.commitEdit()}
                  className={inputClass}
                />
              </Field>
              <ImagePicker
                project={project}
                selected={data.slide1.imageUrl}
                onSelect={(url) => history.setData({ ...data, slide1: { ...data.slide1, imageUrl: url } })}
              />
            </>
          )}

          {currentKind === 'content' && (
            <>
              <UITranslationBoundary attributes={["label"]}><Field label="Título">
                <input
                  value={data.contentSlides[getContentSlideIndex(data, slideIndex)].title}
                  onFocus={() => history.beginEdit()}
                  onChange={(e) => {
                    const slides = [...data.contentSlides];
                    const i = getContentSlideIndex(data, slideIndex);
                    slides[i] = { ...slides[i], title: e.target.value };
                    editField({ ...data, contentSlides: slides });
                  }}
                  onBlur={() => history.commitEdit()}
                  className={inputClass}
                />
              </Field></UITranslationBoundary>
              <UITranslationBoundary attributes={["label"]}><Field label="Descripción">
                <textarea
                  rows={4}
                  value={data.contentSlides[getContentSlideIndex(data, slideIndex)].subtitle}
                  onFocus={() => history.beginEdit()}
                  onChange={(e) => {
                    const slides = [...data.contentSlides];
                    const i = getContentSlideIndex(data, slideIndex);
                    slides[i] = { ...slides[i], subtitle: e.target.value };
                    editField({ ...data, contentSlides: slides });
                  }}
                  onBlur={() => history.commitEdit()}
                  className={inputClass}
                />
              </Field></UITranslationBoundary>
              <ImagePicker
                project={project}
                selected={data.contentSlides[getContentSlideIndex(data, slideIndex)].imageUrl}
                onSelect={(url) => {
                  const slides = [...data.contentSlides];
                  const i = getContentSlideIndex(data, slideIndex);
                  slides[i] = { ...slides[i], imageUrl: url };
                  history.setData({ ...data, contentSlides: slides });
                }}
              />
            </>
          )}

          {currentKind === 'amenities' && (
            <>
              <UITranslationBoundary attributes={["label"]}><Field label="Título">
                <input
                  value={data.slide4.title}
                  onFocus={() => history.beginEdit()}
                  onChange={(e) => editField({ ...data, slide4: { ...data.slide4, title: e.target.value } })}
                  onBlur={() => history.commitEdit()}
                  className={inputClass}
                />
              </Field></UITranslationBoundary>
              <UITranslationBoundary attributes={["label"]}><Field label="Bajada">
                <input
                  value={data.slide4.subtitle}
                  onFocus={() => history.beginEdit()}
                  onChange={(e) => editField({ ...data, slide4: { ...data.slide4, subtitle: e.target.value } })}
                  onBlur={() => history.commitEdit()}
                  className={inputClass}
                />
              </Field></UITranslationBoundary>
              <ImagePicker
                project={project}
                selected={data.slide4.imageUrl}
                onSelect={(url) => history.setData({ ...data, slide4: { ...data.slide4, imageUrl: url } })}
              />
            </>
          )}

          {currentKind === 'closing' && (
            <>
              <UITranslationBoundary attributes={["label"]}><Field label="Titular de cierre">
                <input
                  value={data.slide5.headline}
                  onFocus={() => history.beginEdit()}
                  onChange={(e) => editField({ ...data, slide5: { ...data.slide5, headline: e.target.value } })}
                  onBlur={() => history.commitEdit()}
                  className={inputClass}
                />
              </Field></UITranslationBoundary>
              <UITranslationBoundary attributes={["label"]}><Field label="Texto de llamada a la acción">
                <input
                  value={data.slide5.ctaText}
                  onFocus={() => history.beginEdit()}
                  onChange={(e) => editField({ ...data, slide5: { ...data.slide5, ctaText: e.target.value } })}
                  onBlur={() => history.commitEdit()}
                  className={inputClass}
                />
              </Field></UITranslationBoundary>
              <UITranslationBoundary attributes={["label"]}><Field label="Instagram del asesor">
                <UITranslationBoundary attributes={["placeholder"]}><input
                  value={data.slide5.agent.instagram}
                  onFocus={() => history.beginEdit()}
                  onChange={(e) => {
                    const instagram = e.target.value.replace(/^@/, '');
                    editField({
                      ...data,
                      slide5: {
                        ...data.slide5,
                        agent: {
                          ...data.slide5.agent,
                          instagram,
                          socialLinks: instagram ? [`@${instagram}`] : [],
                        },
                      },
                    });
                  }}
                  onBlur={() => history.commitEdit()}
                  className={inputClass}
                  placeholder="usuario (sin @)"
                /></UITranslationBoundary>
              </Field></UITranslationBoundary>
            </>
          )}

          <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3">
            <span className="text-[10px] font-extrabold uppercase text-slate-500"><LocalizedText text={"Logo de marca"} /></span>
            <button
              type="button"
              onClick={() => history.setData({ ...data, showFooterLogo: !data.showFooterLogo })}
              className={cn(
                'relative h-5 w-9 rounded-full transition',
                data.showFooterLogo ? 'bg-blue-600' : 'bg-slate-200'
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform',
                  data.showFooterLogo ? 'translate-x-[18px]' : 'translate-x-0.5'
                )}
              />
            </button>
          </div>
        </aside>
      </div>

      {/* Contenedor offscreen: todas las láminas montadas para exportación por lote */}
      <div className="pointer-events-none fixed left-[-9999px] top-0 opacity-0" aria-hidden="true">
        {Array.from({ length: totalSlides }).map((_, index) => (
          <SlideRenderer key={index} data={data} slideIndex={index} idPrefix="slide-canvas-export" />
        ))}
      </div>
    </div>,
    document.body
  );
}

const inputClass = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold outline-none focus:border-blue-500 focus:bg-white';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function ImagePicker({ project, selected, onSelect }: { project: PortalProject; selected: string; onSelect: (url: string) => void }) {
  const images = [project.image, ...project.gallery].filter(Boolean);
  return (
    <UITranslationBoundary attributes={["label"]}><Field label="Imagen">
      <div className="grid grid-cols-3 gap-2">
        {images.map((url, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(url)}
            className={cn(
              'relative h-14 overflow-hidden rounded-lg border transition',
              selected === url ? 'border-blue-600 ring-2 ring-blue-200' : 'border-slate-200 opacity-70 hover:opacity-100'
            )}
          >
            <img src={url} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </Field></UITranslationBoundary>
  );
}
