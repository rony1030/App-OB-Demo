'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Copy, Trash2, ArrowUp, ArrowDown, Lock, Unlock, Eye, EyeOff, Undo2, Redo2, Download, Upload, ImagePlus, Type, Shapes, Layers, ZoomIn, ZoomOut, RotateCw, Group, Ungroup } from 'lucide-react';
import type { PortalProject } from '@/lib/portal-projects';
import { useBrand } from '@/components/branding/BrandProvider';
import type { AgentProfile, CarouselProjectData, StylePreset } from './types';
import { mapProjectToCarouselData } from './mapProjectToCarouselData';
import { SlideRenderer } from './SlideRenderer';
import { getSlideLabel, getTotalSlides } from './slides';
import { captureTemplate } from './captureTemplate';
import { Artboard, ART_ICONS } from './Artboard';
import { ArtInspector, Field, FillFields, NumberField, buttonClass, controlClass } from './ArtInspector';
import { bounds, duplicateElements, duplicateSlide, newElement, newSlide, parseDocument, resizeDocument, uid, type ArtDocument, type ArtElement, type ArtSlide } from './editorModel';
import { imageFile, readDesign, writeDesign } from './editorStorage';
import { useCanvasHistory } from './useCanvasHistory';
import { exportSlideAsPng, exportAllSlidesAsZip } from './exporter';

interface Props { isOpen: boolean; onClose: () => void; project: PortalProject; agent: AgentProfile }
const errorText = (error: unknown) => error instanceof Error ? error.message : 'Ocurrió un error. Inténtalo de nuevo.';

export default function AdvancedCreativeStudio(props: Props) {
  if (!props.isOpen) return null;
  return <StudioLoader key={`${props.project.slug}:${props.agent.email || props.agent.name}`} {...props} />;
}
function StudioLoader({ project, agent, onClose }: Props) {
  const { theme } = useBrand();
  const seed = useMemo(() => ({ ...mapProjectToCarouselData(project, agent), footerLogoUrl: theme.logo_dark_url || theme.logo_url || null }), [project, agent, theme.logo_dark_url, theme.logo_url]);
  const storageKey = `v2:${project.slug}:${agent.email || agent.phone || agent.name}`;
  const [doc, setDoc] = useState<ArtDocument | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const refs = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        let stored: ArtDocument | null = null;
        try { stored = await readDesign(storageKey); } catch { if (!cancelled) setError('No se pudo recuperar el guardado local. Puedes trabajar y exportar un archivo editable.'); }
        if (stored) { if (!cancelled) setDoc(stored); return; }
        const slides: ArtSlide[] = [];
        const nodes = refs.current?.querySelectorAll<HTMLElement>('[id^="template-init-"]');
        if (!nodes?.length) throw new Error('No se pudieron preparar las plantillas.');
        for (let i = 0; i < nodes.length; i++) slides.push(await captureTemplate(nodes[i], getSlideLabel(seed, i)));
        if (!cancelled) setDoc({ version: 2, projectId: project.slug, name: project.name, width: 540, height: seed.aspectRatio === 'portrait' ? 675 : 540, slides });
      } catch (err) { if (!cancelled) setError(errorText(err)); }
    }
    void load(); return () => { cancelled = true; };
  }, [storageKey, seed, project.slug, project.name, attempt]);
  return createPortal(doc ? <StudioEditor initial={doc} storageKey={storageKey} seed={seed} project={project} onClose={onClose} initialError={error} /> :
    <UITranslationBoundary attributes={["aria-label"]}><div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-100 text-slate-900" role="dialog" aria-modal="true" aria-label="Preparar estudio creativo">
      <div className="max-w-md space-y-4 p-6"><p className="text-lg font-semibold"><LocalizedText text={"Preparando tus láminas editables…"} /></p>{error && <p role="alert">{error}</p>}<button className={buttonClass} onClick={onClose}><LocalizedText text={"Cerrar"} /></button>{error && <button className={buttonClass} onClick={() => { setError(''); setAttempt(n => n + 1); }}><LocalizedText text={"Reintentar"} /></button>}</div>
      <div ref={refs} aria-hidden="true" style={{ position: 'fixed', left: -20000, top: 0, pointerEvents: 'none' }}>{Array.from({ length: getTotalSlides(seed) }, (_, i) => <SlideRenderer key={i} data={seed} slideIndex={i} idPrefix="template-init" />)}</div>
    </div></UITranslationBoundary>, document.body);
}

interface Drag {
  mode: 'move' | 'resize' | 'rotate'; pointerId: number; x: number; y: number;
  elements: ArtElement[]; ids: string[]; frame: ReturnType<typeof bounds>;
}
function StudioEditor({ initial, storageKey, seed, project, onClose, initialError }: { initial: ArtDocument; storageKey: string; seed: CarouselProjectData; project: PortalProject; onClose: () => void; initialError: string }) {
  const history = useCanvasHistory(initial), doc = history.data;
  const [slideId, setSlideId] = useState(initial.slides[0]?.id ?? '');
  const slide = doc.slides.find(s => s.id === slideId) ?? doc.slides[0];
  const [selection, setSelection] = useState<string[]>([]);
  const selected = slide?.elements.filter(e => selection.includes(e.id)) ?? [];
  const editable = selected.filter(e => !e.locked);
  const [panel, setPanel] = useState<'slides' | 'library' | 'layers'>('slides');
  const [mobilePanel, setMobilePanel] = useState<'left' | 'right' | null>(null);
  const [zoom, setZoom] = useState<number | null>(null);
  const [viewport, setViewport] = useState({ width: 800, height: 800 });
  const [error, setError] = useState(initialError);
  const [saved, setSaved] = useState('Guardando…');
  const [busy, setBusy] = useState(false);
  const [focusText, setFocusText] = useState(false);
  const [iconSearch, setIconSearch] = useState('');
  const [templateStyle, setTemplateStyle] = useState<StylePreset>('A');
  const [templateIndex, setTemplateIndex] = useState(0);
  const [guide, setGuide] = useState({ x: false, y: false });
  const viewportRef = useRef<HTMLDivElement>(null), stageRef = useRef<HTMLDivElement>(null), dialogRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const imageInput = useRef<HTMLInputElement>(null), jsonInput = useRef<HTMLInputElement>(null);
  const imageTarget = useRef<{ slideId: string; elementId?: string; background?: boolean } | null>(null);
  const currentDoc = useRef(doc);
  useLayoutEffect(() => { currentDoc.current = doc; }, [doc]);
  const saveQueue = useRef<Promise<void>>(Promise.resolve());
  const clipboard = useRef<ArtElement[]>([]);
  const scale = zoom ?? Math.max(0.2, Math.min((viewport.width - 64) / doc.width, (viewport.height - 80) / doc.height, 1.2));
  const frame = editable.length ? bounds(editable) : null;

  const save = useCallback((value: ArtDocument) => {
    const next = saveQueue.current.catch(() => undefined).then(() => writeDesign(storageKey, value));
    saveQueue.current = next; return next;
  }, [storageKey]);
  useEffect(() => {
    const el = viewportRef.current; if (!el) return;
    const observer = new ResizeObserver(([entry]) => setViewport({ width: entry.contentRect.width, height: entry.contentRect.height })); observer.observe(el); return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => { setSaved('Guardando…'); void save(doc).then(() => { if (!cancelled) setSaved('Guardado en este dispositivo'); }).catch(() => { if (!cancelled) { setSaved('Sin guardar'); setError('No se pudo guardar en este dispositivo. Descarga el archivo editable para conservar tu trabajo.'); } }); }, 500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [doc, save]);
  useEffect(() => {
    const previous = document.body.style.overflow, previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden'; dialogRef.current?.focus();
    const flush = () => { void save(currentDoc.current).catch(() => undefined); };
    const visibility = () => { if (document.visibilityState === 'hidden') flush(); };
    window.addEventListener('pagehide', flush); document.addEventListener('visibilitychange', visibility);
    return () => { document.body.style.overflow = previous; previousFocus?.focus(); window.removeEventListener('pagehide', flush); document.removeEventListener('visibilitychange', visibility); flush(); };
  }, [save]);

  function changeSlide(next: ArtSlide, live = false) { const nextDoc = { ...doc, slides: doc.slides.map(s => s.id === next.id ? next : s) }; if (live) history.setDataLive(nextDoc); else history.setData(nextDoc); }
  function patchElement(patch: Partial<ArtElement>) { if (slide && selected.length === 1 && !selected[0].locked) changeSlide({ ...slide, elements: slide.elements.map(e => e.id === selected[0].id ? { ...e, ...patch } : e) }, true); }
  function chooseSlide(id: string) { history.commitEdit(); setSlideId(id); setSelection([]); setFocusText(false); setMobilePanel(null); }
  function addSlide(next: ArtSlide) { history.setData({ ...doc, slides: [...doc.slides, next] }); chooseSlide(next.id); }
  function addElements(elements: ArtElement[]) { if (!slide) return; changeSlide({ ...slide, elements: [...slide.elements, ...elements] }); setSelection(elements.map(e => e.id)); setMobilePanel('right'); setFocusText(false); }
  function removeSelected() { if (!slide) return; changeSlide({ ...slide, elements: slide.elements.filter(e => !selection.includes(e.id) || e.locked) }); setSelection([]); }
  function duplicateSelected() { addElements(duplicateElements(selected)); }
  function orderSelected(front: boolean) { if (!slide) return; const moving = slide.elements.filter(e => selection.includes(e.id) && !e.locked), rest = slide.elements.filter(e => !moving.includes(e)); changeSlide({ ...slide, elements: front ? [...rest, ...moving] : [...moving, ...rest] }); }
  function imagePicker(elementId?: string, background = false) { if (!slide) return; imageTarget.current = { slideId: slide.id, elementId, background }; imageInput.current?.click(); }
  async function acceptImage(file?: File) {
    if (!file || !imageTarget.current) return;
    const target = imageTarget.current;
    try {
      const src = await imageFile(file), latest = currentDoc.current;
      const newImage = newElement('image', { src, name: file.name, width: 260, height: 200 });
      history.setData({ ...latest, slides: latest.slides.map(s => s.id !== target.slideId ? s : target.background ? { ...s, background: { ...s.background, mode: 'image', src } } : target.elementId ? { ...s, elements: s.elements.map(e => e.id !== target.elementId || e.locked ? e : e.kind === 'shape' ? { ...e, fill: { ...e.fill, mode: 'image', src }, templateGradient: undefined } : { ...e, src }) } : { ...s, elements: [...s.elements, newImage] }) });
      if (!target.background && !target.elementId) setSelection([newImage.id]);
    } catch (err) { setError(errorText(err)); }
  }
  async function close() { try { await save(currentDoc.current); onClose(); } catch { setError('No se pudo guardar. Exporta el archivo editable antes de cerrar.'); } }
  function downloadJson() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = `${project.slug}-editable-v2.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function importJson(file?: File) {
    if (!file) return;
    try {
      if (file.size > 80 * 1024 * 1024) throw new Error('El archivo supera 80 MB.');
      const imported = parseDocument(JSON.parse(await file.text()));
      history.setData({ ...imported, projectId: doc.projectId }); chooseSlide(imported.slides[0]?.id ?? ''); setError('');
    } catch (err) { setError(errorText(err)); }
  }
  async function exportArt(all: boolean) {
    history.commitEdit(); setBusy(true); setError('');
    try {
      if (all) await exportAllSlidesAsZip('art-export', doc.name, doc.slides.length);
      else if (slide) await exportSlideAsPng(`art-export-${doc.slides.findIndex(s => s.id === slide.id)}`, `${project.slug}-${doc.slides.findIndex(s => s.id === slide.id) + 1}.png`);
    } catch (err) { setError(`No se pudo exportar: ${errorText(err)}`); } finally { setBusy(false); }
  }
  async function addTemplate() {
    const root = document.getElementById(`template-add-${templateIndex}`); if (!root) return;
    setBusy(true);
    try { addSlide(await captureTemplate(root, `${getSlideLabel(seed, templateIndex)} · ${templateStyle}`)); } catch (err) { setError(errorText(err)); } finally { setBusy(false); }
  }

  function startDrag(event: ReactPointerEvent<HTMLDivElement | HTMLButtonElement>, element?: ArtElement, mode: Drag['mode'] = 'move') {
    if (!slide || event.button !== 0 || element?.locked) return;
    event.stopPropagation(); event.preventDefault(); setFocusText(false);
    let ids = selection;
    if (element) {
      const clicked = element.groupId && !event.altKey ? slide.elements.filter(e => e.groupId === element.groupId && !e.locked && !e.hidden).map(e => e.id) : [element.id];
      ids = event.shiftKey ? selection.includes(element.id) ? selection.filter(id => !clicked.includes(id)) : [...new Set([...selection, ...clicked])] : selection.includes(element.id) ? selection : clicked;
      setSelection(ids);
    }
    const items = slide.elements.filter(e => ids.includes(e.id) && !e.locked && !e.hidden); if (!items.length) return;
    history.beginEdit(); stageRef.current?.setPointerCapture(event.pointerId);
    drag.current = { mode, pointerId: event.pointerId, x: event.clientX, y: event.clientY, ids: items.map(e => e.id), elements: slide.elements, frame: bounds(items) };
  }
  function moveDrag(event: ReactPointerEvent<HTMLDivElement>) {
    const d = drag.current; if (!d || d.pointerId !== event.pointerId || !slide) return;
    let dx = (event.clientX - d.x) / scale, dy = (event.clientY - d.y) / scale;
    const guides = { x: false, y: false };
    if (d.mode === 'move' && !event.altKey) {
      if (Math.abs(d.frame.x + dx + d.frame.width / 2 - doc.width / 2) < 5) { dx = doc.width / 2 - d.frame.x - d.frame.width / 2; guides.x = true; }
      if (Math.abs(d.frame.y + dy + d.frame.height / 2 - doc.height / 2) < 5) { dy = doc.height / 2 - d.frame.y - d.frame.height / 2; guides.y = true; }
    }
    setGuide(guides);
    let sx = Math.max(0.05, (d.frame.width + dx) / d.frame.width), sy = Math.max(0.05, (d.frame.height + dy) / d.frame.height);
    if (event.shiftKey) sx = sy = Math.max(sx, sy);
    const next = d.elements.map(e => {
      if (!d.ids.includes(e.id)) return e;
      if (d.mode === 'move') return { ...e, x: e.x + dx, y: e.y + dy };
      if (d.mode === 'rotate') return { ...e, rotation: Math.round(e.rotation + dx) };
      return { ...e, x: d.frame.x + (e.x - d.frame.x) * sx, y: d.frame.y + (e.y - d.frame.y) * sy, width: Math.max(1, e.width * sx), height: Math.max(1, e.height * sy), fontSize: d.ids.length > 1 ? e.fontSize * Math.min(sx, sy) : e.fontSize };
    });
    changeSlide({ ...slide, elements: next }, true);
  }
  function endDrag(cancel = false) { const d = drag.current; if (!d) return; if (cancel && slide) changeSlide({ ...slide, elements: d.elements }, true); drag.current = null; setGuide({ x: false, y: false }); history.commitEdit(); }

  useEffect(() => {
    function key(event: KeyboardEvent) {
      if (event.key === 'Tab') {
        const items = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]') ?? []).filter(e => e.getClientRects().length);
        const first = items[0], last = items.at(-1);
        if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
      const target = event.target as HTMLElement;
      if (target.closest('input, textarea, select, [contenteditable="true"]')) return;
      const mod = event.ctrlKey || event.metaKey;
      if (mod && ['c', 'v', 'd', 'a', 's'].includes(event.key.toLowerCase())) {
        event.preventDefault();
        if (event.key.toLowerCase() === 'c') clipboard.current = structuredClone(selected);
        if (event.key.toLowerCase() === 'v' && clipboard.current.length) addElements(duplicateElements(clipboard.current));
        if (event.key.toLowerCase() === 'd') duplicateSelected();
        if (event.key.toLowerCase() === 'a' && slide) setSelection(slide.elements.filter(e => !e.locked && !e.hidden).map(e => e.id));
        if (event.key.toLowerCase() === 's') { void save(doc).then(() => setSaved('Guardado en este dispositivo')).catch(() => setError('No se pudo guardar. Descarga el editable.')); }
      } else if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); removeSelected(); }
      else if (event.key === 'Escape') { setSelection([]); setMobilePanel(null); setFocusText(false); }
      else if (event.key.startsWith('Arrow') && slide && editable.length) {
        event.preventDefault(); const n = event.shiftKey ? 10 : 1;
        changeSlide({ ...slide, elements: slide.elements.map(e => selection.includes(e.id) && !e.locked ? { ...e, x: e.x + (event.key === 'ArrowLeft' ? -n : event.key === 'ArrowRight' ? n : 0), y: e.y + (event.key === 'ArrowUp' ? -n : event.key === 'ArrowDown' ? n : 0) } : e) });
      }
    }
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  });

  const transactionProps = { onFocusCapture: () => history.beginEdit(), onBlurCapture: () => history.commitEdit() };
  return <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={`Estudio Creativo · ${project.name}`} className="fixed inset-0 z-[9999] flex h-[100dvh] flex-col bg-slate-100 text-slate-900 outline-none">
    <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-3 py-2">
      <UITranslationBoundary attributes={["aria-label"]}><button className={buttonClass} onClick={() => void close()} aria-label="Guardar y cerrar"><X size={16} /></button></UITranslationBoundary>
      <div className="mr-auto min-w-0"><h1 className="max-w-[280px] truncate text-sm font-bold"><LocalizedText text={"Estudio Creativo · "} />{project.name}</h1><p className="text-xs text-slate-600" role="status">{saved}</p></div>
      <UITranslationBoundary attributes={["title","aria-label"]}><button className={buttonClass} disabled={!history.canUndo} onClick={history.undo} title="Deshacer (Ctrl Z)" aria-label="Deshacer"><Undo2 size={16} /></button></UITranslationBoundary><UITranslationBoundary attributes={["title","aria-label"]}><button className={buttonClass} disabled={!history.canRedo} onClick={history.redo} title="Rehacer (Ctrl Shift Z)" aria-label="Rehacer"><Redo2 size={16} /></button></UITranslationBoundary>
      <UITranslationBoundary attributes={["aria-label"]}><select aria-label="Formato del carrusel" className={`${controlClass} !w-auto`} value={doc.height} onChange={e => history.setData(resizeDocument(doc, Number(e.target.value)))}><option value={675}>4:5</option><option value={540}>1:1</option></select></UITranslationBoundary>
      <button className={buttonClass} onClick={() => jsonInput.current?.click()}><Upload size={14} /><LocalizedText text={"Abrir editable"} /></button><button className={buttonClass} onClick={downloadJson}><Download size={14} /><LocalizedText text={"Guardar editable"} /></button>
      <button className={buttonClass} disabled={busy || !slide} onClick={() => void exportArt(false)}><LocalizedText text={"Lámina PNG"} /></button><button className={`${buttonClass} !border-indigo-950 !bg-indigo-950 !text-white hover:!bg-indigo-900`} disabled={busy || !doc.slides.length} onClick={() => void exportArt(true)}>{busy ? 'Procesando…' : 'Descargar carrusel'}</button>
    </header>
    {error && <div role="alert" className="flex items-center justify-between gap-3 bg-amber-50 px-4 py-2 text-sm text-amber-900">{error}<UITranslationBoundary attributes={["aria-label"]}><button aria-label="Cerrar aviso" onClick={() => setError('')}><X size={16} /></button></UITranslationBoundary></div>}
    <div className="flex gap-2 border-b border-slate-200 bg-white px-3 py-2 lg:hidden"><button className={buttonClass} onClick={() => setMobilePanel(mobilePanel === 'left' ? null : 'left')}><LocalizedText text={"Láminas y elementos"} /></button><button className={buttonClass} onClick={() => setMobilePanel(mobilePanel === 'right' ? null : 'right')}><LocalizedText text={"Propiedades "} />{selected.length > 0 ? `(${selected.length})` : ''}</button></div>
    <div className="relative flex min-h-0 flex-1">
      <UITranslationBoundary attributes={["aria-label"]}><aside aria-label="Biblioteca y láminas" className={`${mobilePanel === 'left' ? 'flex absolute inset-y-0 left-0 z-40 shadow-xl' : 'hidden'} w-[250px] shrink-0 flex-col border-r border-slate-200 bg-white lg:static lg:flex lg:shadow-none`}>
        <div className="flex border-b border-slate-200 p-2">{(['slides', 'library', 'layers'] as const).map(tab => <button key={tab} className={`min-h-10 flex-1 rounded text-xs font-semibold ${panel === tab ? 'bg-indigo-50 text-indigo-950' : 'text-slate-600 hover:bg-slate-50'}`} onClick={() => setPanel(tab)}>{tab === 'slides' ? <LocalizedText text={"Láminas"} /> : tab === 'library' ? 'Agregar' : 'Capas'}</button>)}</div>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
          {panel === 'slides' && <>
            <button className={`${buttonClass} w-full`} onClick={() => addSlide(newSlide())}><Plus size={16} /><LocalizedText text={"Agregar lámina en blanco"} /></button>
            <div className="space-y-2">{doc.slides.map((s, i) => <div key={s.id} className={`rounded-lg border p-2 ${s.id === slide?.id ? 'border-indigo-800 bg-indigo-50' : 'border-slate-200'}`}>
              <button className="flex w-full items-center gap-2 text-left text-sm font-semibold" onClick={() => chooseSlide(s.id)}><span className="relative block h-[65px] w-[54px] shrink-0 overflow-hidden rounded bg-white"><span style={{ display: 'block', transform: 'scale(0.1)', transformOrigin: 'top left', pointerEvents: 'none' }}><Artboard doc={doc} slide={s} /></span></span><span className="min-w-0 truncate">{i + 1}. {s.name}</span></button>
              <div className="mt-2 flex gap-1"><button className={buttonClass} aria-label={`Duplicar lámina ${i + 1}`} onClick={() => addSlide(duplicateSlide(s))}><Copy size={13} /></button>
                <button className={buttonClass} aria-label={`Subir lámina ${i + 1}`} disabled={i === 0} onClick={() => { const slides = [...doc.slides]; [slides[i - 1], slides[i]] = [slides[i], slides[i - 1]]; history.setData({ ...doc, slides }); }}><ArrowUp size={13} /></button>
                <button className={buttonClass} aria-label={`Bajar lámina ${i + 1}`} disabled={i === doc.slides.length - 1} onClick={() => { const slides = [...doc.slides]; [slides[i + 1], slides[i]] = [slides[i], slides[i + 1]]; history.setData({ ...doc, slides }); }}><ArrowDown size={13} /></button>
                <button className={buttonClass} aria-label={`Eliminar lámina ${i + 1}`} onClick={() => { const slides = doc.slides.filter(item => item.id !== s.id); history.setData({ ...doc, slides }); if (s.id === slide?.id) chooseSlide(slides[Math.min(i, slides.length - 1)]?.id ?? ''); }}><Trash2 size={13} /></button></div>
            </div>)}</div>
            <div className="space-y-2 border-t border-slate-200 pt-3"><p className="text-sm font-semibold"><LocalizedText text={"Desde una plantilla"} /></p><UITranslationBoundary attributes={["aria-label"]}><select aria-label="Estilo de plantilla" className={controlClass} value={templateStyle} onChange={e => setTemplateStyle(e.target.value as StylePreset)}>{['A', 'B', 'C', 'D'].map(s => <option key={s} value={s}>{s}</option>)}</select></UITranslationBoundary><UITranslationBoundary attributes={["aria-label"]}><select aria-label="Lámina de plantilla" className={controlClass} value={templateIndex} onChange={e => setTemplateIndex(Number(e.target.value))}>{Array.from({ length: getTotalSlides(seed) }, (_, i) => <option key={i} value={i}>{getSlideLabel(seed, i)}</option>)}</select></UITranslationBoundary><button className={`${buttonClass} w-full`} disabled={busy} onClick={() => void addTemplate()}><LocalizedText text={"Agregar plantilla"} /></button></div>
          </>}
          {panel === 'library' && <>
            <div className="grid grid-cols-2 gap-2"><button className={buttonClass} disabled={!slide} onClick={() => addElements([newElement('text')])}><Type size={16} /><LocalizedText text={"Texto"} /></button><button className={buttonClass} disabled={!slide} onClick={() => imagePicker()}><ImagePlus size={16} /><LocalizedText text={"Imagen"} /></button><button className={buttonClass} disabled={!slide} onClick={() => addElements([newElement('shape')])}><Shapes size={16} /><LocalizedText text={"Rectángulo"} /></button><button className={buttonClass} disabled={!slide} onClick={() => addElements([newElement('shape', { radius: 999, name: 'Círculo' })])}><LocalizedText text={"Círculo"} /></button><button className={buttonClass} disabled={!slide} onClick={() => addElements([newElement('shape', { height: 3, width: 240, name: 'Línea' })])}><LocalizedText text={"Línea"} /></button></div>
            <p className="text-sm font-semibold"><LocalizedText text={"Fotos del proyecto"} /></p><div className="grid grid-cols-2 gap-2">{[...new Set([project.image, ...project.gallery].filter(Boolean))].map((src, i) => <button key={src} aria-label={`Agregar foto ${i + 1}`} disabled={!slide} onClick={() => addElements([newElement('image', { src, name: `Foto ${i + 1}`, width: 260, height: 200 })])}><img src={src} alt={`Foto ${i + 1}`} className="h-16 w-full rounded object-cover" loading="lazy" /></button>)}</div>
            <UITranslationBoundary attributes={["label"]}><Field label="Buscar iconos"><UITranslationBoundary attributes={["placeholder"]}><input className={controlClass} value={iconSearch} onChange={e => setIconSearch(e.target.value)} placeholder="Casa, piscina, teléfono…" /></UITranslationBoundary></Field></UITranslationBoundary><div className="grid grid-cols-3 gap-2">{Object.entries(ART_ICONS).filter(([, icon]) => icon.label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(iconSearch.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))).map(([id, { label, component: Icon }]) => <button key={id} title={label} aria-label={`Agregar icono ${label}`} className={`${buttonClass} flex-col`} disabled={!slide} onClick={() => addElements([newElement('icon', { icon: id, name: label, width: 48, height: 48 })])}><Icon size={22} /><span className="text-[10px]">{label}</span></button>)}</div>
          </>}
          {panel === 'layers' && <><p className="text-xs leading-relaxed text-slate-600"><LocalizedText text={"La primera capa está al frente. Selecciona aquí una parte de un grupo para editarla individualmente."} /></p>{slide?.elements.toReversed().map(e => <div key={e.id} className={`flex items-center gap-1 rounded border p-1 ${selection.includes(e.id) ? 'border-indigo-700 bg-indigo-50' : 'border-slate-200'}`}><button className="min-w-0 flex-1 truncate p-1 text-left text-xs" onClick={event => { setSelection(event.shiftKey ? [...new Set([...selection, e.id])] : [e.id]); setFocusText(false); setMobilePanel('right'); }}>{e.groupId && <Layers size={12} className="mr-1 inline" />}{e.name}</button><button className="p-1.5" aria-label={`${e.hidden ? 'Mostrar' : 'Ocultar'} ${e.name}`} onClick={() => changeSlide({ ...slide, elements: slide.elements.map(n => n.id === e.id ? { ...n, hidden: !n.hidden } : n) })}>{e.hidden ? <EyeOff size={14} /> : <Eye size={14} />}</button><button className="p-1.5" aria-label={`${e.locked ? 'Desbloquear' : 'Bloquear'} ${e.name}`} onClick={() => changeSlide({ ...slide, elements: slide.elements.map(n => n.id === e.id ? { ...n, locked: !n.locked } : n) })}>{e.locked ? <Lock size={14} /> : <Unlock size={14} />}</button></div>)}</>}
        </div>
      </aside></UITranslationBoundary>
      <main ref={viewportRef} className="relative min-w-0 flex-1 overflow-auto bg-slate-200">
        {slide ? <div className="flex min-h-full min-w-full items-center justify-center p-8"><div ref={stageRef} style={{ position: 'relative', width: doc.width * scale, height: doc.height * scale, flexShrink: 0, touchAction: 'none' }} onPointerMove={moveDrag} onPointerUp={() => endDrag()} onPointerCancel={() => endDrag(true)}>
          <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: doc.width, height: doc.height, boxShadow: '0 12px 35px rgba(15,23,42,0.18)' }}>
            <Artboard doc={doc} slide={slide} onPointerDown={() => { setSelection([]); setFocusText(false); }} onElementPointerDown={startDrag} onElementDoubleClick={e => { if (e.locked) return; setSelection([e.id]); setFocusText(e.kind === 'text'); setMobilePanel('right'); }}>
              {guide.x && <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, borderLeft: '1px solid #d946ef', pointerEvents: 'none' }} />}{guide.y && <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, borderTop: '1px solid #d946ef', pointerEvents: 'none' }} />}
            </Artboard>
            {frame && <div data-selection-frame style={{ position: 'absolute', left: frame.x, top: frame.y, width: frame.width, height: frame.height, transform: editable.length === 1 ? `rotate(${editable[0].rotation}deg)` : undefined, outline: '1.5px solid #4338ca', pointerEvents: 'none' }}>
              <UITranslationBoundary attributes={["aria-label"]}><button aria-label="Redimensionar selección" onPointerDown={e => startDrag(e, undefined, 'resize')} style={{ position: 'absolute', right: -5, bottom: -5, width: 12, height: 12, background: 'white', border: '2px solid #4338ca', pointerEvents: 'auto', cursor: 'nwse-resize' }} /></UITranslationBoundary>
              {editable.length === 1 && <UITranslationBoundary attributes={["aria-label"]}><button aria-label="Girar selección" onPointerDown={e => startDrag(e, undefined, 'rotate')} style={{ position: 'absolute', left: '50%', top: -28, width: 22, height: 22, borderRadius: 20, background: 'white', border: '1px solid #4338ca', pointerEvents: 'auto', cursor: 'grab' }}><RotateCw size={16} /></button></UITranslationBoundary>}
            </div>}
          </div>
        </div></div> : <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center"><h2 className="text-xl font-semibold"><LocalizedText text={"Crea tu primera lámina"} /></h2><p className="text-sm text-slate-600"><LocalizedText text={"Agrega una lámina en blanco o elige una plantilla."} /></p><button className={buttonClass} onClick={() => addSlide(newSlide())}><Plus size={16} /><LocalizedText text={"Agregar lámina"} /></button></div>}
      </main>
      <UITranslationBoundary attributes={["aria-label"]}><aside aria-label="Propiedades" className={`${mobilePanel === 'right' ? 'block absolute inset-y-0 right-0 z-40 shadow-xl' : 'hidden'} w-[300px] shrink-0 overflow-y-auto border-l border-slate-200 bg-white p-4 lg:static lg:block lg:shadow-none`}>
        {slide && <><div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-bold">{selected.length === 1 ? <LocalizedText text={"Editar elemento"} /> : selected.length > 1 ? `${selected.length} elementos` : <LocalizedText text={"Lámina y fondo"} />}</h2>{selected.length > 0 && <button className={buttonClass} onClick={() => setSelection([])}><LocalizedText text={"Fondo"} /></button>}</div>
          {selected.length > 0 && <div className="mb-4 flex flex-wrap gap-1.5"><UITranslationBoundary attributes={["aria-label"]}><button className={buttonClass} onClick={duplicateSelected} aria-label="Duplicar selección"><Copy size={14} /></button></UITranslationBoundary><UITranslationBoundary attributes={["aria-label"]}><button className={buttonClass} disabled={!editable.length} onClick={removeSelected} aria-label="Eliminar selección"><Trash2 size={14} /></button></UITranslationBoundary><UITranslationBoundary attributes={["title"]}><button className={buttonClass} disabled={!editable.length} onClick={() => orderSelected(true)} title="Traer al frente"><ArrowUp size={14} /><LocalizedText text={"Frente"} /></button></UITranslationBoundary><UITranslationBoundary attributes={["title"]}><button className={buttonClass} disabled={!editable.length} onClick={() => orderSelected(false)} title="Enviar al fondo"><ArrowDown size={14} /><LocalizedText text={"Atrás"} /></button></UITranslationBoundary>
            <button className={buttonClass} disabled={editable.length < 2} onClick={() => { const groupId = uid(); changeSlide({ ...slide, elements: slide.elements.map(e => selection.includes(e.id) && !e.locked ? { ...e, groupId } : e) }); }}><Group size={14} /><LocalizedText text={"Agrupar"} /></button><button className={buttonClass} disabled={!selected.some(e => e.groupId)} onClick={() => { const groups = selected.map(e => e.groupId).filter(Boolean); changeSlide({ ...slide, elements: slide.elements.map(e => e.groupId && groups.includes(e.groupId) ? { ...e, groupId: undefined } : e) }); }}><Ungroup size={14} /><LocalizedText text={"Desagrupar"} /></button>
          </div>}
          <div {...transactionProps}>{selected.length === 1 ? <ArtInspector element={selected[0]} patch={patchElement} chooseImage={() => imagePicker(selected[0].id)} focusText={focusText} /> : selected.length > 1 ? <div className="space-y-3"><p className="text-sm text-slate-600"><LocalizedText text={"Mueve o escala la selección desde el lienzo. En Capas puedes elegir cada parte del grupo."} /></p>{frame && <><UITranslationBoundary attributes={["label"]}><NumberField label="Posición X del grupo" value={frame.x} onChange={x => changeSlide({ ...slide, elements: slide.elements.map(e => selection.includes(e.id) && !e.locked ? { ...e, x: e.x + x - frame.x } : e) }, true)} /></UITranslationBoundary><UITranslationBoundary attributes={["label"]}><NumberField label="Posición Y del grupo" value={frame.y} onChange={y => changeSlide({ ...slide, elements: slide.elements.map(e => selection.includes(e.id) && !e.locked ? { ...e, y: e.y + y - frame.y } : e) }, true)} /></UITranslationBoundary></>}</div> : <div className="space-y-4"><UITranslationBoundary attributes={["label"]}><Field label="Nombre de la lámina"><input className={controlClass} value={slide.name} onChange={e => changeSlide({ ...slide, name: e.target.value }, true)} /></Field></UITranslationBoundary><FillFields value={slide.background} onChange={background => changeSlide({ ...slide, background }, true)} onImage={() => imagePicker(undefined, true)} /><p className="text-xs leading-relaxed text-slate-600"><LocalizedText text={"Si una foto de plantilla cubre el fondo, ocúltala o elimínala desde Capas para ver el nuevo relleno."} /></p></div>}</div>
        </>}
      </aside></UITranslationBoundary>
    </div>
    <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white px-3 py-2 text-xs text-slate-600"><span className="hidden sm:block">{doc.slides.length}<LocalizedText text={" láminas · Shift: selección múltiple · Alt: seleccionar una parte"} /></span><div className="ml-auto flex items-center gap-2"><UITranslationBoundary attributes={["aria-label"]}><button className={buttonClass} aria-label="Reducir zoom" onClick={() => setZoom(Math.max(0.2, scale - 0.1))}><ZoomOut size={15} /></button></UITranslationBoundary><button className={buttonClass} onClick={() => setZoom(null)}><LocalizedText text={"Ajustar ("} />{Math.round(scale * 100)}%)</button><UITranslationBoundary attributes={["aria-label"]}><button className={buttonClass} aria-label="Aumentar zoom" onClick={() => setZoom(Math.min(2, scale + 0.1))}><ZoomIn size={15} /></button></UITranslationBoundary></div></footer>
    <input ref={imageInput} hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e => { void acceptImage(e.target.files?.[0]); e.target.value = ''; }} /><input ref={jsonInput} hidden type="file" accept=".json,application/json" onChange={e => { void importJson(e.target.files?.[0]); e.target.value = ''; }} />
    <div aria-hidden="true" style={{ position: 'fixed', left: -20000, top: 0, pointerEvents: 'none' }}><SlideRenderer data={{ ...seed, aspectRatio: doc.height === 675 ? 'portrait' : 'square', stylePreset: templateStyle }} slideIndex={templateIndex} idPrefix="template-add" />{doc.slides.map((s, i) => <Artboard key={s.id} doc={doc} slide={s} id={`art-export-${i}`} />)}</div>
  </div>;
}
