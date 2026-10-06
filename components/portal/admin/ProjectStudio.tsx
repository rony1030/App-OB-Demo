'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import React, { useEffect, useState, useTransition, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bot, Building2, CheckCircle2, CircleDollarSign, FileSpreadsheet, ImageIcon, MapPin, Plus, RefreshCw, Send, Sparkles, Star, Trash2, UploadCloud } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { createProjectWithFullSuiteAction, parseInventoryWithGeminiAction } from '@/app/portal/admin/projects/actions';
import type { ExtractedUnit, ChatMessage } from '@/lib/ai/inventory-gemini';
import { createProjectMediaPath, removeUploadedProjectImages, uploadProjectImageResumable, validateProjectImage } from '@/lib/supabase/resumable-upload';

interface GalleryItem {
  id: string;
  url: string;
  name: string;
  tag: string;
  file: File;
}

type StudioTab = 'info' | 'media' | 'payment' | 'inventory';
type NewUnitStatus = 'available' | 'reserved' | 'sold';

type ProjectStudioProps = {
  organizationSlug: string;
};

type UploadStatus = {
  current: number;
  total: number;
  percentage: number;
  fileName: string;
};

export default function ProjectStudio({ organizationSlug }: ProjectStudioProps) {
  const router = useRouter();
  // Wizard Tab
  const [activeTab, setActiveTab] = useState<StudioTab>('info');

  // Form State: always starts clean
  const [name, setName] = useState('');
  const [developerName, setDeveloperName] = useState('');
  const [location, setLocation] = useState('');
  const [zone, setZone] = useState('Punta Cana');
  const [lifecycleStatus, setLifecycleStatus] = useState('under_construction');
  const [deliveryDate, setDeliveryDate] = useState('2026-12');
  const [startingPrice, setStartingPrice] = useState<number | ''>('');
  const [currency, setCurrency] = useState('USD');
  const [commissionRate, setCommissionRate] = useState<number | ''>(6);
  const [hasConfotur, setHasConfotur] = useState(true);
  const [description, setDescription] = useState('');
  const [shortDescription, setShortDescription] = useState('');

  // Media State: Interactive Hero & Gallery Upload
  const heroFileInputRef = useRef<HTMLInputElement>(null);
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  const pdfFileInputRef = useRef<HTMLInputElement>(null);

  const previewUrlsRef = useRef(new Set<string>());
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);

  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);

  // Payment Plan
  const [reservationAmount, setReservationAmount] = useState(5000);
  const [initialPercentage, setInitialPercentage] = useState(20);
  const [duringConstruction, setDuringConstruction] = useState(40);
  const [uponDelivery, setUponDelivery] = useState(40);

  // Inventory Ingestion Mode: 'gemini' | 'manual' | 'sheets'
  const [inventoryMode, setInventoryMode] = useState<'gemini' | 'manual' | 'sheets'>('gemini');

  // Google Sheets URL
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [externalAvailabilityUrl, setExternalAvailabilityUrl] = useState('');

  // Units list parsed or entered
  const [units, setUnits] = useState<ExtractedUnit[]>([]);

  // Manual Unit Entry Modal/Form
  const [newUnitCode, setNewUnitCode] = useState('');
  const [newUnitTypology, setNewUnitTypology] = useState('2 Habitaciones');
  const [newUnitFloor, setNewUnitFloor] = useState<number>(1);
  const [newUnitSqm, setNewUnitSqm] = useState<number>(85);
  const [newUnitPrice, setNewUnitPrice] = useState<number>(185000);
  const [newUnitStatus, setNewUnitStatus] = useState<NewUnitStatus>('available');

  // Gemini AI Ingestion & Chat State
  const [rawTextInventory, setRawTextInventory] = useState('');
  const [geminiChat, setGeminiChat] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        '¡Hola! Soy tu asistente de inventario Gemini. Puedes subir un PDF de lista de precios, pegar un listado de unidades o escribirme los datos. Te ayudaré a estructurar la disponibilidad de este desarrollo y te consultaré cualquier duda.',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const [notice, setNotice] = useState('');
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const previewUrls = previewUrlsRef.current;
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
      previewUrls.clear();
    };
  }, []);

  const notify = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3500);
  };

  const createPreviewUrl = (file: File) => {
    const url = URL.createObjectURL(file);
    previewUrlsRef.current.add(url);
    return url;
  };

  const releasePreviewUrl = (url: string) => {
    if (!url) return;
    URL.revokeObjectURL(url);
    previewUrlsRef.current.delete(url);
  };

  const removeHeroImage = () => {
    releasePreviewUrl(heroImageUrl);
    setHeroImageUrl('');
    setHeroImageFile(null);
    if (heroFileInputRef.current) heroFileInputRef.current.value = '';
  };

  // Handle Hero Image Upload
  const handleHeroFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateProjectImage(file);
    if (validationError) {
      notify(validationError);
      e.target.value = '';
      return;
    }

    releasePreviewUrl(heroImageUrl);
    setHeroImageFile(file);
    setHeroImageUrl(createPreviewUrl(file));
    notify('Imagen de portada lista para subir.');
    e.target.value = '';
  };

  // Handle Multiple Gallery Images Upload
  const handleGalleryFilesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validItems: GalleryItem[] = [];
    const rejected: string[] = [];

    files.forEach((file) => {
      const validationError = validateProjectImage(file);
      if (validationError) {
        rejected.push(validationError);
        return;
      }

      validItems.push({
        id: crypto.randomUUID(),
        url: createPreviewUrl(file),
        name: file.name.replace(/\.[^/.]+$/, ''),
        tag: 'Renders',
        file,
      });
    });

    if (validItems.length > 0) {
      setGalleryItems((prev) => [...prev, ...validItems]);
    }

    if (rejected.length > 0) {
      notify(`${validItems.length} agregada(s). ${rejected.length} rechazada(s): ${rejected[0]}`);
    } else {
      notify(`${validItems.length} imagen(es) agregada(s) a la galería.`);
    }
    e.target.value = '';
  };

  const removeGalleryItem = (id: string) => {
    setGalleryItems((prev) => {
      const item = prev.find((candidate) => candidate.id === id);
      if (item) releasePreviewUrl(item.url);
      return prev.filter((candidate) => candidate.id !== id);
    });
  };

  const setAsHero = (item: GalleryItem) => {
    releasePreviewUrl(heroImageUrl);
    setHeroImageFile(item.file);
    setHeroImageUrl(createPreviewUrl(item.file));
    notify('Imagen establecida como portada principal.');
  };

  // Handle Manual Add Unit
  const handleAddManualUnit = () => {
    if (!newUnitCode.trim()) {
      notify('Ingresa el código o número de la unidad (ej. A-101).');
      return;
    }

    const newUnit: ExtractedUnit = {
      id: `manual-${Date.now()}`,
      unit_code: newUnitCode.trim().toUpperCase(),
      typology: newUnitTypology,
      floor_level: Number(newUnitFloor) || 1,
      surface_sqm: Number(newUnitSqm) || 85,
      price: Number(newUnitPrice) || 185000,
      status: newUnitStatus,
    };

    setUnits((prev) => [newUnit, ...prev]);
    setNewUnitCode('');
    notify(`Unidad ${newUnit.unit_code} agregada.`);
  };

  const removeUnit = (id?: string, code?: string) => {
    setUnits((prev) => prev.filter((u) => (id ? u.id !== id : u.unit_code !== code)));
  };

  // Handle Gemini Processing (From Text or PDF)
  const handleAnalyzeWithGemini = async (textToAnalyze?: string) => {
    const text = textToAnalyze || rawTextInventory;
    if (!text.trim()) {
      notify('Pega o escribe el listado de unidades antes de analizar.');
      return;
    }

    setIsAiProcessing(true);
    setGeminiChat((prev) => [
      ...prev,
      { role: 'user', content: text.length > 200 ? `${text.slice(0, 180)}… [Documento adjunto]` : text },
    ]);

    try {
      const response = await parseInventoryWithGeminiAction(text, geminiChat);

      if (response.hasDoubts && response.questionForUser) {
        setGeminiChat((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: response.questionForUser!,
          },
        ]);
        notify('Gemini necesita una aclaración sobre el formato.');
      } else {
        if (response.units.length > 0) {
          setUnits(response.units);
          setGeminiChat((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: `${response.summaryText} He cargado ${response.units.length} unidades en la tabla de vista previa. Puedes revisarlas y editarlas antes de guardar.`,
            },
          ]);
          notify(`¡Listo! Se estructuraron ${response.units.length} unidades.`);
        } else {
          setGeminiChat((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: 'No logré identificar unidades válidas en el texto proporcionado. Por favor, asegúrate de incluir el número de unidad y su precio.',
            },
          ]);
        }
      }
    } catch (err) {
      console.error(err);
      notify('Error comunicando con Gemini.');
    } finally {
      setIsAiProcessing(false);
      setRawTextInventory('');
    }
  };

  // Handle Interactive Chat Message
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isAiProcessing) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setGeminiChat((prev) => [...prev, { role: 'user', content: userMsg }]);
    setIsAiProcessing(true);

    try {
      const response = await parseInventoryWithGeminiAction(userMsg, geminiChat);
      if (response.units.length > 0) {
        setUnits(response.units);
      }
      setGeminiChat((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.hasDoubts && response.questionForUser ? response.questionForUser : response.summaryText,
        },
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAiProcessing(false);
    }
  };

  // Handle PDF Upload for Gemini Analysis
  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    notify(`Leyendo documento: ${file.name}…`);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        // Feed text or summary to Gemini
        handleAnalyzeWithGemini(`Documento PDF adjunto: ${file.name}. Contenido:\n${event.target.result.slice(0, 3000)}`);
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = () => {
    if (!name.trim() || !location.trim() || !/^[A-Z]{3}$/.test(currency.trim().toUpperCase())) {
      notify('Indica nombre, ubicación y una moneda ISO de tres letras (por ejemplo, USD).');
      return;
    }

    startTransition(async () => {
      const uploadedPaths: string[] = [];

      try {
        const totalImages = (heroImageFile ? 1 : 0) + galleryItems.length;
        const uploadedPathByFile = new Map<File, string>();
        let completedImages = 0;

        const uploadImage = async (
          file: File,
          kind: 'hero' | 'gallery',
          index = 0
        ) => {
          const cachedPath = uploadedPathByFile.get(file);
          if (cachedPath) {
            completedImages += 1;
            setUploadStatus({
              current: completedImages,
              total: totalImages,
              percentage: 100,
              fileName: file.name,
            });
            return cachedPath;
          }

          const storagePath = createProjectMediaPath(
            organizationSlug,
            name,
            kind,
            file,
            index
          );

          setUploadStatus({
            current: completedImages + 1,
            total: totalImages,
            percentage: 0,
            fileName: file.name,
          });

          const uploadedPath = await uploadProjectImageResumable({
            file,
            storagePath,
            onProgress: (percentage) => {
              setUploadStatus({
                current: completedImages + 1,
                total: totalImages,
                percentage,
                fileName: file.name,
              });
            },
          });

          uploadedPathByFile.set(file, uploadedPath);
          uploadedPaths.push(uploadedPath);
          completedImages += 1;
          return uploadedPath;
        };

        const heroStoragePath = heroImageFile
          ? await uploadImage(heroImageFile, 'hero')
          : '';
        const galleryStoragePaths: string[] = [];

        for (let index = 0; index < galleryItems.length; index += 1) {
          galleryStoragePaths.push(
            await uploadImage(galleryItems[index].file, 'gallery', index)
          );
        }

        setUploadStatus(null);

        const formData = new FormData();
        formData.append('name', name);
        formData.append('developerName', developerName || 'Desarrollador Oficial');
        formData.append('location', location);
        formData.append('zone', zone);
        formData.append('lifecycleStatus', lifecycleStatus);
        formData.append('deliveryDate', deliveryDate);
        formData.append('startingPrice', String(startingPrice || 0));
        formData.append('currency', currency.trim().toUpperCase());
        formData.append('commissionRate', String(commissionRate || 6));
        formData.append('description', description);
        formData.append('shortDescription', shortDescription);
        formData.append('heroStoragePath', heroStoragePath);
        formData.append('galleryStoragePaths', JSON.stringify(galleryStoragePaths));
        formData.append('reservationAmount', String(reservationAmount));
        formData.append('initialPercentage', String(initialPercentage));
        formData.append('duringConstructionPercentage', String(duringConstruction));
        formData.append('uponDeliveryPercentage', String(uponDelivery));
        formData.append('googleSheetUrl', googleSheetUrl);
        formData.append('externalAvailabilityUrl', externalAvailabilityUrl);
        if (units.length > 0) {
          formData.append('unitsJson', JSON.stringify(units));
        }

        const res = await createProjectWithFullSuiteAction(formData);
        if (res.error) {
          await removeUploadedProjectImages(uploadedPaths);
          notify(`Error: ${res.error}`);
          return;
        }

        notify('Proyecto publicado y sincronizado en PostgreSQL con éxito.');
        router.push('/portal/admin');
      } catch (error) {
        setUploadStatus(null);
        await removeUploadedProjectImages(uploadedPaths);
        notify(error instanceof Error ? error.message : 'No se pudieron subir las imágenes.');
      }
    });
  };

  const totalPaymentPct = initialPercentage + duringConstruction + uponDelivery;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Hidden File Inputs */}
      <input
        ref={heroFileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleHeroFileUpload}
      />
      <input
        ref={galleryFileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleGalleryFilesUpload}
      />
      <input
        ref={pdfFileInputRef}
        type="file"
        accept="application/pdf,text/plain,text/csv"
        className="hidden"
        onChange={handlePdfUpload}
      />

      {/* Top Header */}
      <section className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-4">
          <UITranslationBoundary attributes={["title"]}><Link
            href="/portal/admin"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition shadow-xs"
            title="Volver a Administración"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link></UITranslationBoundary>
          <div>
            <div className="flex items-center gap-2 text-blue-700 font-extrabold text-[10px] uppercase tracking-wider">
              <Building2 className="h-3.5 w-3.5" />
              <span><LocalizedText text={"Estudio de Desarrollos Master Broker"} /></span>
            </div>
            <h1 className="text-2xl font-black text-slate-950 tracking-tight">
              {name || 'Nuevo Proyecto Master'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/portal/admin"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition shadow-xs"
          ><LocalizedText text={"Cancelar"} /></Link>
          <button
            type="button"
            disabled={isPending || !name.trim()}
            onClick={handleSubmit}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-6 text-xs font-extrabold text-white shadow-md hover:bg-blue-700 disabled:opacity-50 transition active:scale-[0.98]"
          >
            {isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <span>
              {uploadStatus
                ? `Subiendo ${uploadStatus.current}/${uploadStatus.total} · ${uploadStatus.percentage}%`
                : isPending
                  ? 'Guardando…'
                  : <LocalizedText text={"Publicar y Guardar Proyecto"} />}
            </span>
          </button>
        </div>
      </section>

      {uploadStatus && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3" role="status" aria-live="polite">
          <div className="mb-2 flex items-center justify-between gap-4 text-xs font-bold text-blue-950">
            <span className="truncate"><LocalizedText text={"Subiendo "} />{uploadStatus.fileName}</span>
            <span className="shrink-0">{uploadStatus.percentage}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-blue-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-[width] duration-200"
              style={{ width: `${uploadStatus.percentage}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-blue-800"><LocalizedText text={"Archivo "} />{uploadStatus.current}<LocalizedText text={" de "} />{uploadStatus.total}<LocalizedText text={". Si la conexión se interrumpe, la carga puede continuar."} /></p>
        </div>
      )}

      {/* Main Studio Grid */}
      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Left Column: Form Editor (7 cols) */}
        <div className="space-y-6 lg:col-span-7">
          {/* Tabs */}
          <div className="flex rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xs gap-1">
            {[
              { id: 'info', label: '1. Información', icon: Building2 },
              { id: 'media', label: `2. Galería (${galleryItems.length + (heroImageUrl ? 1 : 0)})`, icon: ImageIcon },
              { id: 'payment', label: '3. Plan de Pagos', icon: CircleDollarSign },
              { id: 'inventory', label: `4. Inventario (${units.length})`, icon: FileSpreadsheet },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as StudioTab)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition',
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <tab.icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* TAB 1: INFORMACION */}
          {activeTab === 'info' && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-5">
              <div>
                <h2 className="text-base font-black text-slate-950"><LocalizedText text={"Datos Principales del Desarrollo"} /></h2>
                <p className="text-xs text-slate-500 mt-0.5"><LocalizedText text={"Información oficial que se mostrará en el catálogo para la red de brokers."} /></p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-slate-700"><LocalizedText text={"Nombre del Proyecto *"} /></span>
                  <UITranslationBoundary attributes={["placeholder"]}><input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. Palma Real Residences"
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-xs text-slate-900 font-bold outline-none focus:border-blue-600"
                  /></UITranslationBoundary>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-slate-700"><LocalizedText text={"Empresa Desarrolladora"} /></span>
                  <UITranslationBoundary attributes={["placeholder"]}><input
                    value={developerName}
                    onChange={(e) => setDeveloperName(e.target.value)}
                    placeholder="Ej. Constructora del Caribe"
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-xs text-slate-900 outline-none focus:border-blue-600"
                  /></UITranslationBoundary>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-slate-700"><LocalizedText text={"Ubicación Completa *"} /></span>
                  <UITranslationBoundary attributes={["placeholder"]}><input
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ej. Cana Bay Golf Club, Punta Cana"
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-xs text-slate-900 outline-none focus:border-blue-600"
                  /></UITranslationBoundary>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-slate-700"><LocalizedText text={"Zona Comercial"} /></span>
                  <select
                    value={zone}
                    onChange={(e) => setZone(e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-xs font-bold text-slate-800 outline-none focus:border-blue-600"
                  >
                    <option value="Punta Cana"><LocalizedText text={"Punta Cana"} /></option>
                    <option value="Cap Cana"><LocalizedText text={"Cap Cana"} /></option>
                    <option value="Bávaro"><LocalizedText text={"Bávaro"} /></option>
                    <option value="Las Terrenas"><LocalizedText text={"Las Terrenas"} /></option>
                    <option value="Santo Domingo"><LocalizedText text={"Santo Domingo"} /></option>
                    <option value="La Romana"><LocalizedText text={"La Romana"} /></option>
                  </select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-slate-700"><LocalizedText text={"Precio desde"} /></span>
                  <UITranslationBoundary attributes={["placeholder"]}><input
                    type="number"
                    value={startingPrice}
                    onChange={(e) => setStartingPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="185000"
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-xs font-bold text-slate-900 outline-none focus:border-blue-600"
                  /></UITranslationBoundary>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-slate-700"><LocalizedText text={"Moneda (código ISO)"} /></span>
                  <UITranslationBoundary attributes={["placeholder"]}><input
                    type="text"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3))}
                    placeholder="USD"
                    maxLength={3}
                    required
                    list="project-currency-codes"
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-xs font-bold uppercase text-slate-900 outline-none focus:border-blue-600"
                  /></UITranslationBoundary>
                  <datalist id="project-currency-codes">
                    <option value="USD" />
                    <option value="DOP" />
                    <option value="EUR" />
                    <option value="CAD" />
                  </datalist>
                  <span className="mt-1 block text-[10px] text-slate-500"><LocalizedText text={"Ej.: USD, DOP, EUR o CAD."} /></span>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-slate-700"><LocalizedText text={"Comisión Broker (%)"} /></span>
                  <UITranslationBoundary attributes={["placeholder"]}><input
                    type="number"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="6"
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-xs font-bold text-blue-700 outline-none focus:border-blue-600"
                  /></UITranslationBoundary>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-slate-700"><LocalizedText text={"Fecha de Entrega"} /></span>
                  <input
                    type="month"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-xs font-bold text-slate-800 outline-none focus:border-blue-600"
                  />
                </label>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div>
                  <p className="text-xs font-bold text-slate-900"><LocalizedText text={"Ley CONFOTUR Aplicable"} /></p>
                  <p className="text-[11px] text-slate-500"><LocalizedText text={"Exención del 3% de impuesto de transferencia y 1% de IPI anual durante 15 años."} /></p>
                </div>
                <input
                  type="checkbox"
                  checked={hasConfotur}
                  onChange={(e) => setHasConfotur(e.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                />
              </div>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-slate-700"><LocalizedText text={"Descripción Comercial Completa"} /></span>
                <UITranslationBoundary attributes={["placeholder"]}><textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe las características principales, ubicación y amenidades..."
                  className="w-full rounded-2xl border border-slate-300 bg-white p-3.5 text-xs text-slate-900 leading-relaxed outline-none focus:border-blue-600"
                /></UITranslationBoundary>
              </label>
            </div>
          )}

          {/* TAB 2: GALERIA & SUBIDA DE IMAGENES */}
          {activeTab === 'media' && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-8">
              <div>
                <h2 className="text-base font-black text-slate-950"><LocalizedText text={"Galería de Renders & Fotografía"} /></h2>
                <p className="text-xs text-slate-500 mt-0.5"><LocalizedText text={"Sube fotografías y renders de alta resolución para la ficha oficial del proyecto y los dossiers interactivos."} /></p>
              </div>

              {/* 1. HERO / PORTADA PRINCIPAL UPLOADER */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900"><LocalizedText text={"1. Imagen Principal / Portada Hero *"} /></span>
                  {heroImageUrl && (
                    <button
                      type="button"
                      onClick={removeHeroImage}
                      className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" />
                      <span><LocalizedText text={"Quitar portada"} /></span>
                    </button>
                  )}
                </div>

                {heroImageUrl ? (
                  <div className="relative h-48 sm:h-64 w-full overflow-hidden rounded-2xl border-2 border-blue-200 bg-slate-100 group">
                    <UITranslationBoundary attributes={["alt"]}><img src={heroImageUrl} alt="Hero Preview" className="h-full w-full object-cover" /></UITranslationBoundary>
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition duration-200 flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => heroFileInputRef.current?.click()}
                        className="rounded-xl bg-white px-4 py-2 text-xs font-extrabold text-slate-950 shadow-md hover:bg-slate-100 transition"
                      ><LocalizedText text={"Cambiar Imagen"} /></button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => heroFileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 p-8 text-center hover:border-blue-500 hover:bg-blue-50 transition cursor-pointer"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-xs text-blue-700 mb-3">
                      <UploadCloud className="h-6 w-6" />
                    </div>
                    <p className="text-xs font-black text-slate-900"><LocalizedText text={"Haz clic para subir la Imagen de Portada"} /></p>
                    <p className="text-[11px] text-slate-500 mt-1"><LocalizedText text={"JPG, PNG o WebP de hasta 50 MB por imagen · carga reanudable"} /></p>
                  </div>
                )}
              </div>

              {/* 2. GALLERY MULTI-UPLOAD DROPZONE */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900"><LocalizedText text={"2. Renders y Fotos de Amenidades"} /></span>
                    <p className="text-[11px] text-slate-500"><LocalizedText text={"Sube múltiples imágenes para el carrusel y dossier."} /></p>
                  </div>
                  <button
                    type="button"
                    onClick={() => galleryFileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-extrabold text-white shadow-xs hover:bg-blue-700 transition"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span><LocalizedText text={"+ Subir Fotos"} /></span>
                  </button>
                </div>

                <div
                  onClick={() => galleryFileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition cursor-pointer"
                >
                  <ImageIcon className="h-6 w-6 text-blue-600 mb-2" />
                  <p className="text-xs font-bold text-slate-800"><LocalizedText text={"Arrastra fotos aquí o haz clic para explorar"} /></p>
                  <p className="text-[10px] text-slate-400 mt-0.5"><LocalizedText text={"Puedes seleccionar varias imágenes a la vez"} /></p>
                </div>

                {galleryItems.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                    {galleryItems.map((item) => (
                      <div
                        key={item.id}
                        className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs"
                      >
                        <div className="relative h-32 w-full bg-slate-100">
                          <img src={item.url} alt={item.name} className="h-full w-full object-cover" />
                          <div className="absolute top-2 left-2">
                            <span className="rounded-md bg-white/90 backdrop-blur px-2 py-0.5 text-[9px] font-extrabold uppercase text-slate-800 shadow-xs">
                              {item.tag}
                            </span>
                          </div>
                          <UITranslationBoundary attributes={["title"]}><button
                            type="button"
                            onClick={() => removeGalleryItem(item.id)}
                            className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-red-600 opacity-0 group-hover:opacity-100 hover:bg-red-50 transition shadow-md"
                            title="Eliminar render"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button></UITranslationBoundary>
                        </div>

                        <div className="p-2.5 flex items-center justify-between gap-1 text-[11px]">
                          <span className="font-bold text-slate-800 truncate">{item.name}</span>
                          <UITranslationBoundary attributes={["title"]}><button
                            type="button"
                            onClick={() => setAsHero(item)}
                            className="text-[10px] font-extrabold text-blue-700 hover:underline shrink-0 flex items-center gap-0.5"
                            title="Establecer como imagen principal"
                          >
                            <Star className="h-3 w-3" />
                            <span><LocalizedText text={"Portada"} /></span>
                          </button></UITranslationBoundary>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PLAN DE PAGOS */}
          {activeTab === 'payment' && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <h2 className="text-base font-black text-slate-950"><LocalizedText text={"Estructura Comercial y Esquema de Pagos"} /></h2>
                <p className="text-xs text-slate-500 mt-0.5"><LocalizedText text={"Estos porcentajes alimentan el generador de propuestas de los brokers."} /></p>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <div className="flex items-center justify-between text-xs font-bold text-blue-950 mb-2">
                  <span><LocalizedText text={"Desglose Total de Pagos:"} /></span>
                  <span className={cn(totalPaymentPct === 100 ? 'text-emerald-700 font-extrabold' : 'text-amber-700 font-extrabold')}>
                    {totalPaymentPct}<LocalizedText text={"% del valor "} />{totalPaymentPct === 100 ? '✓ (100% balanceado)' : '(! debe sumar 100%)'}
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-blue-200 overflow-hidden flex">
                  <UITranslationBoundary attributes={["title"]}><div style={{ width: `${initialPercentage}%` }} className="bg-blue-600 h-full" title="Inicial" /></UITranslationBoundary>
                  <UITranslationBoundary attributes={["title"]}><div style={{ width: `${duringConstruction}%` }} className="bg-indigo-600 h-full" title="Durante Construcción" /></UITranslationBoundary>
                  <UITranslationBoundary attributes={["title"]}><div style={{ width: `${uponDelivery}%` }} className="bg-emerald-600 h-full" title="Contra Entrega" /></UITranslationBoundary>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-slate-700"><LocalizedText text={"Monto de Reserva Fijo (USD)"} /></span>
                  <input
                    type="number"
                    value={reservationAmount}
                    onChange={(e) => setReservationAmount(Number(e.target.value))}
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-xs font-bold text-slate-900 outline-none focus:border-blue-600"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-slate-700"><LocalizedText text={"Inicial / Firma Contrato (%)"} /></span>
                  <input
                    type="number"
                    value={initialPercentage}
                    onChange={(e) => setInitialPercentage(Number(e.target.value))}
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-xs font-bold text-slate-900 outline-none focus:border-blue-600"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-slate-700"><LocalizedText text={"Durante la Construcción (%)"} /></span>
                  <input
                    type="number"
                    value={duringConstruction}
                    onChange={(e) => setDuringConstruction(Number(e.target.value))}
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-xs font-bold text-slate-900 outline-none focus:border-blue-600"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-slate-700"><LocalizedText text={"Contra Entrega / Llaves (%)"} /></span>
                  <input
                    type="number"
                    value={uponDelivery}
                    onChange={(e) => setUponDelivery(Number(e.target.value))}
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-xs font-bold text-slate-900 outline-none focus:border-blue-600"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 4: INVENTARIO & ASISTENTE IA GEMINI MULTIFORMATO */}
          {activeTab === 'inventory' && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <h2 className="text-base font-black text-slate-950"><LocalizedText text={"Gestor de Disponibilidad & Unidades"} /></h2>
                <p className="text-xs text-slate-500 mt-0.5"><LocalizedText text={"Elige cómo deseas cargar el inventario: con el Asistente IA Gemini (PDF/Texto/Chat), manualmente o con Google Sheets."} /></p>
              </div>

              {/* Mode Selector Tabs */}
              <div className="flex rounded-2xl border border-slate-200 bg-slate-50 p-1.5 gap-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setInventoryMode('gemini')}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 transition',
                    inventoryMode === 'gemini'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  <Bot className="h-4 w-4 text-blue-300" />
                  <span><LocalizedText text={"Asistente IA Gemini (PDF & Chat)"} /></span>
                </button>
                <button
                  type="button"
                  onClick={() => setInventoryMode('manual')}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 transition',
                    inventoryMode === 'manual'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  <Plus className="h-4 w-4" />
                  <span><LocalizedText text={"Editor Manual ("} />{units.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInventoryMode('sheets')}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 transition',
                    inventoryMode === 'sheets'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span><LocalizedText text={"Google Sheets en Vivo"} /></span>
                </button>
              </div>

              {/* MODE 1: ASISTENTE IA GEMINI */}
              {inventoryMode === 'gemini' && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  {/* Dropzone PDF / Documentos */}
                  <div
                    onClick={() => pdfFileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50 p-6 text-center hover:border-blue-600 transition cursor-pointer"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-xs text-blue-700 mb-2">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-black text-slate-900"><LocalizedText text={"Arrastra un PDF de Lista de Precios o haz clic para explorar"} /></p>
                    <p className="text-[11px] text-slate-500 mt-0.5"><LocalizedText text={"Gemini analizará el documento, extraerá las unidades y te consultará cualquier duda"} /></p>
                  </div>

                  {/* Text Paste Area */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700"><LocalizedText text={"O pega texto / tabla de disponibilidad aquí:"} /></label>
                    <UITranslationBoundary attributes={["placeholder"]}><textarea
                      rows={3}
                      value={rawTextInventory}
                      onChange={(e) => setRawTextInventory(e.target.value)}
                      placeholder="Ej: A-101 | 2 Hab | 85 m2 | $189,000 | Disponible&#10;A-102 | 1 Hab | 60 m2 | $145,000 | Reservada..."
                      className="w-full rounded-2xl border border-slate-300 bg-white p-3.5 font-mono text-xs text-slate-900 outline-none focus:border-blue-600"
                    /></UITranslationBoundary>
                    <button
                      type="button"
                      disabled={isAiProcessing || !rawTextInventory.trim()}
                      onClick={() => handleAnalyzeWithGemini()}
                      className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-5 text-xs font-extrabold text-white shadow-xs hover:bg-blue-700 disabled:opacity-50 transition"
                    >
                      {isAiProcessing ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5 text-blue-300" />
                      )}
                      <span>{isAiProcessing ? 'Analizando con Gemini…' : 'Analizar y Estructurar con IA'}</span>
                    </button>
                  </div>

                  {/* Interactive Clarification Chat with Gemini */}
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden">
                    <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-900">
                      <Bot className="h-4 w-4 text-blue-700" />
                      <span><LocalizedText text={"Chat de Aclaración con Gemini sobre Disponibilidad"} /></span>
                    </div>

                    <div className="p-4 space-y-3 max-h-56 overflow-y-auto custom-scrollbar">
                      {geminiChat.map((msg, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            'flex gap-2.5 text-xs',
                            msg.role === 'user' ? 'justify-end' : 'justify-start'
                          )}
                        >
                          <div
                            className={cn(
                              'max-w-[85%] rounded-2xl p-3.5 shadow-xs leading-relaxed',
                              msg.role === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border border-slate-200 text-slate-800'
                            )}
                          >
                            <p className="text-[10px] font-extrabold uppercase tracking-wider opacity-60 mb-1">
                              {msg.role === 'user' ? <LocalizedText text={"Tú"} /> : 'Gemini AI'}
                            </p>
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        </div>
                      ))}
                      {isAiProcessing && (
                        <div className="flex items-center gap-2 text-xs text-blue-700 font-bold p-2">
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span><LocalizedText text={"Gemini está procesando la disponibilidad…"} /></span>
                        </div>
                      )}
                    </div>

                    <form onSubmit={handleSendChatMessage} className="flex items-center gap-2 border-t border-slate-200 bg-white p-2.5">
                      <UITranslationBoundary attributes={["placeholder"]}><input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Escribe una indicación (ej. 'Las unidades en piso 3 están vendidas')..."
                        className="flex-1 rounded-xl bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:bg-white"
                      /></UITranslationBoundary>
                      <button
                        type="submit"
                        disabled={isAiProcessing || !chatInput.trim()}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white disabled:opacity-50 hover:bg-blue-700 transition"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* MODE 2: EDITOR MANUAL */}
              {inventoryMode === 'manual' && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4">
                    <p className="text-xs font-black text-slate-900"><LocalizedText text={"Agregar Nueva Unidad Manualmente"} /></p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <label className="block">
                        <span className="text-[11px] font-bold text-slate-700"><LocalizedText text={"Código / Número *"} /></span>
                        <UITranslationBoundary attributes={["placeholder"]}><input
                          value={newUnitCode}
                          onChange={(e) => setNewUnitCode(e.target.value)}
                          placeholder="Ej. A-101"
                          className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold outline-none focus:border-blue-600"
                        /></UITranslationBoundary>
                      </label>
                      <label className="block">
                        <span className="text-[11px] font-bold text-slate-700"><LocalizedText text={"Tipología"} /></span>
                        <select
                          value={newUnitTypology}
                          onChange={(e) => setNewUnitTypology(e.target.value)}
                          className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold outline-none focus:border-blue-600"
                        >
                          <option value="1 Habitación"><LocalizedText text={"1 Habitación"} /></option>
                          <option value="2 Habitaciones"><LocalizedText text={"2 Habitaciones"} /></option>
                          <option value="3 Habitaciones"><LocalizedText text={"3 Habitaciones"} /></option>
                          <option value="Penthouse"><LocalizedText text={"Penthouse"} /></option>
                          <option value="Estudio / Suite"><LocalizedText text={"Estudio / Suite"} /></option>
                        </select>
                      </label>
                      <label className="block">
                        <span className="text-[11px] font-bold text-slate-700"><LocalizedText text={"Piso / Nivel"} /></span>
                        <input
                          type="number"
                          value={newUnitFloor}
                          onChange={(e) => setNewUnitFloor(Number(e.target.value))}
                          className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold outline-none focus:border-blue-600"
                        />
                      </label>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <label className="block">
                        <span className="text-[11px] font-bold text-slate-700"><LocalizedText text={"Metraje (m²)"} /></span>
                        <input
                          type="number"
                          value={newUnitSqm}
                          onChange={(e) => setNewUnitSqm(Number(e.target.value))}
                          className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold outline-none focus:border-blue-600"
                        />
                      </label>
                      <label className="block">
                        <span className="text-[11px] font-bold text-slate-700"><LocalizedText text={"Precio USD *"} /></span>
                        <input
                          type="number"
                          value={newUnitPrice}
                          onChange={(e) => setNewUnitPrice(Number(e.target.value))}
                          className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-blue-700 outline-none focus:border-blue-600"
                        />
                      </label>
                      <label className="block">
                        <span className="text-[11px] font-bold text-slate-700"><LocalizedText text={"Estado"} /></span>
                        <select
                          value={newUnitStatus}
                          onChange={(e) => setNewUnitStatus(e.target.value as NewUnitStatus)}
                          className="mt-1 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold outline-none focus:border-blue-600"
                        >
                          <option value="available"><LocalizedText text={"Disponible"} /></option>
                          <option value="reserved"><LocalizedText text={"Reservada"} /></option>
                          <option value="sold"><LocalizedText text={"Vendida"} /></option>
                        </select>
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddManualUnit}
                      className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-5 text-xs font-extrabold text-white shadow-xs hover:bg-blue-700 transition"
                    >
                      <Plus className="h-4 w-4" />
                      <span><LocalizedText text={"+ Agregar a Lista"} /></span>
                    </button>
                  </div>
                </div>
              )}

              {/* MODE 3: GOOGLE SHEETS */}
              {inventoryMode === 'sheets' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-950 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-emerald-900">
                      <FileSpreadsheet className="h-4 w-4 text-emerald-700" />
                      <span><LocalizedText text={"Conexión Directa a Google Sheets"} /></span>
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-relaxed"><LocalizedText text={"Al guardar, el sistema descargará el archivo CSV y registrará automáticamente todas las unidades con su piso, metros cuadrados, precio y estado actual."} /></p>
                  </div>

                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold text-slate-700"><LocalizedText text={"URL de Google Sheets (o enlace CSV público)"} /></span>
                    <UITranslationBoundary attributes={["placeholder"]}><input
                      value={googleSheetUrl}
                      onChange={(e) => setGoogleSheetUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/tu-id-de-hoja/edit..."
                      className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-xs text-slate-900 outline-none focus:border-blue-600"
                    /></UITranslationBoundary>
                  </label>

                </div>
              )}

              <div className="rounded-2xl border border-violet-200 bg-violet-50/70 p-4 space-y-2">
                <div className="text-xs font-bold text-violet-950"><LocalizedText text={"Enlace externo de disponibilidad"} /></div>
                <p className="text-[11px] leading-relaxed text-violet-900"><LocalizedText text={"Este enlace no crea unidades ni altera el inventario del CRM. Solo dirige a la fuente oficial, como AlterEstate."} /></p>
                <UITranslationBoundary attributes={["placeholder"]}><input
                  value={externalAvailabilityUrl}
                  onChange={(e) => setExternalAvailabilityUrl(e.target.value)}
                  placeholder="https://brokers.alterestate.com/disponibilidad/..."
                  className="h-11 w-full rounded-xl border border-violet-200 bg-white px-3.5 text-xs text-slate-900 outline-none focus:border-violet-600"
                /></UITranslationBoundary>
              </div>

              {/* SHARED LIVE UNITS TABLE PREVIEW */}
              {units.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-slate-900"><LocalizedText text={"Unidades Detectadas ("} />{units.length})
                      </span>
                      <p className="text-[11px] text-slate-500">
                        {units.filter((u) => u.status === 'available').length}<LocalizedText text={" Disponibles · "} />{units.filter((u) => u.status === 'reserved').length}<LocalizedText text={" Reservadas · "} />{units.filter((u) => u.status === 'sold').length}<LocalizedText text={" Vendidas"} /></p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUnits([])}
                      className="text-xs font-bold text-red-600 hover:underline"
                    ><LocalizedText text={"Limpiar lista"} /></button>
                  </div>

                  <div className="max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 bg-slate-50 text-[10px] font-extrabold uppercase text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="px-3.5 py-2.5"><LocalizedText text={"Unidad"} /></th>
                          <th className="px-3 py-2.5"><LocalizedText text={"Tipología"} /></th>
                          <th className="px-3 py-2.5"><LocalizedText text={"Piso"} /></th>
                          <th className="px-3 py-2.5"><LocalizedText text={"M²"} /></th>
                          <th className="px-3 py-2.5"><LocalizedText text={"Precio USD"} /></th>
                          <th className="px-3 py-2.5"><LocalizedText text={"Estado"} /></th>
                          <th className="px-3 py-2.5 text-right"><LocalizedText text={"Acción"} /></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {units.map((u) => (
                          <tr key={u.id || u.unit_code} className="hover:bg-slate-50/70">
                            <td className="px-3.5 py-2 font-black text-slate-900">{u.unit_code}</td>
                            <td className="px-3 py-2 text-slate-600">{u.typology}</td>
                            <td className="px-3 py-2 text-slate-700">{u.floor_level}</td>
                            <td className="px-3 py-2 text-slate-700">{u.surface_sqm}<LocalizedText text={" m²"} /></td>
                            <td className="px-3 py-2 font-bold text-blue-700">{formatCurrency(u.price, currency)}</td>
                            <td className="px-3 py-2">
                              <span
                                className={cn(
                                  'rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase',
                                  u.status === 'available'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : u.status === 'reserved'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                )}
                              >
                                {u.status === 'available' ? <LocalizedText text={"Disponible"} /> : u.status === 'reserved' ? 'Reservada' : 'Vendida'}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right">
                              <UITranslationBoundary attributes={["title"]}><button
                                type="button"
                                onClick={() => removeUnit(u.id, u.unit_code)}
                                className="text-slate-400 hover:text-red-600 transition"
                                title="Eliminar unidad"
                              >
                                <Trash2 className="h-3.5 w-3.5 inline" />
                              </button></UITranslationBoundary>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Live Interactive Card Preview (5 cols) */}
        <div className="space-y-4 lg:col-span-5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400"><LocalizedText text={"Vista Previa en Tiempo Real"} /></span>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[9px] font-bold text-emerald-800"><LocalizedText text={"Ficha Oficial"} /></span>
          </div>

          {/* Project Executive Card (Luminous Light Theme) */}
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-md">
            <div className="relative h-56 w-full bg-slate-100 border-b border-slate-100">
              {heroImageUrl ? (
                <img
                  src={heroImageUrl}
                  alt={name || 'Proyecto'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400 bg-slate-50 text-xs font-semibold">
                  <ImageIcon className="h-6 w-6 mr-2 opacity-40 text-blue-600" />
                  <span><LocalizedText text={"Sin imagen de portada"} /></span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />

              <div className="absolute top-4 left-4 flex gap-2">
                <span className="rounded-full bg-blue-600 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-md"><LocalizedText text={"Master Broker ("} />{commissionRate || 6}<LocalizedText text={"% Comisión)"} /></span>
                {hasConfotur && (
                  <span className="rounded-full bg-amber-500/90 backdrop-blur px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-white shadow-md"><LocalizedText text={"CONFOTUR"} /></span>
                )}
              </div>

              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h3 className="text-lg font-black">{name || 'Nombre del Proyecto'}</h3>
                <p className="text-xs text-white/90 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="h-3.5 w-3.5 text-blue-300" />
                  <span>{location || 'Ubicación'}</span>
                </p>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                {description || 'Sin descripción comercial...'}
              </p>

              <div className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-center">
                <div>
                  <p className="text-[9px] font-extrabold uppercase text-slate-400"><LocalizedText text={"Desde"} /></p>
                  <p className="text-xs font-black text-slate-900">{formatCurrency(Number(startingPrice) || 0, currency)}</p>
                </div>
                <div>
                  <p className="text-[9px] font-extrabold uppercase text-slate-400"><LocalizedText text={"Entrega"} /></p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">{deliveryDate || 'Por definir'}</p>
                </div>
                <div>
                  <p className="text-[9px] font-extrabold uppercase text-slate-400"><LocalizedText text={"Reserva"} /></p>
                  <p className="text-xs font-bold text-blue-700 mt-0.5">{formatCurrency(reservationAmount, currency)}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 text-slate-900 flex items-center justify-between text-xs">
                <div>
                  <p className="text-[10px] font-extrabold uppercase text-slate-400"><LocalizedText text={"Desarrollado por"} /></p>
                  <p className="font-bold text-slate-900 mt-0.5">{developerName || 'Por definir'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-extrabold uppercase text-blue-700"><LocalizedText text={"Esquema"} /></p>
                  <p className="font-bold text-slate-900 mt-0.5">{initialPercentage}% / {duringConstruction}% / {uponDelivery}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {notice && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-blue-600 px-5 py-3.5 text-xs font-extrabold text-white shadow-2xl animate-in fade-in slide-in-from-bottom-2">
          {notice}
        </div>
      )}
    </div>
  );
}
