'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import React, { useEffect, useState, useTransition, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  FolderOpen,
  ImageIcon,
  Layers3,
  Loader2,
  Maximize2,
  PackageCheck,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  getReservationWorkflowSettingsAction,
  getOperationalNotificationRecipientsAction,
  saveReservationWorkflowSettingsAction,
  saveOperationalNotificationRecipientsAction,
  type ReservationWorkflowSettings,
} from '@/app/portal/admin/projects/workflow-actions';
import { cn } from '@/lib/utils';
import type { PortalProject } from '@/lib/portal-projects';
import type { ProjectVillaTypology } from '@/lib/data/cipres-typologies';
import { createClient } from '@/lib/supabase/client';
import { validateProjectImage } from '@/lib/supabase/resumable-upload';
import {
  updateProjectFullAction,
  uploadProjectImageAction,
  saveImagePackAction,
  getImagePackAction,
  getProjectPaymentPlanAction,
  type ProjectEditPayload,
} from '@/app/portal/admin/projects/[slug]/edit/actions';

interface ProjectEditorProps {
  project: PortalProject;
  initialTypologies: Record<string, ProjectVillaTypology>;
  orgSlug?: string;
  onClose?: () => void;
}

type TabType = 'general' | 'media' | 'typologies' | 'payment' | 'workflow';

export interface EditablePaymentStep {
  id?: number;
  label: string;
  type: 'fixed' | 'percentage';
  value: number;
  milestone?: string;
}

type GalleryTarget =
  | { type: 'hero' }
  | { type: 'typology-image'; key: string }
  | { type: 'typology-floorplan'; key: string };

export default function ProjectEditor({ project, initialTypologies, orgSlug = 'ob-brokers-team', onClose }: ProjectEditorProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Gallery Picker Modal State
  const [pickerTarget, setPickerTarget] = useState<GalleryTarget | null>(null);

  // 1. General Info State
  const [name, setName] = useState(project.name || '');
  const [location, setLocation] = useState(project.location || '');
  const [zone, setZone] = useState(project.zone || 'Punta Cana');
  const [deliveryDate, setDeliveryDate] = useState(project.delivery || '2027-12-01');
  const [startingPrice, setStartingPrice] = useState<number>(project.startingPrice || 93000);
  const [currency, setCurrency] = useState(project.currency || 'USD');
  const [commissionRate, setCommissionRate] = useState<number>(project.commission || 5);
  const [shortDescription, setShortDescription] = useState(project.shortDescription || '');
  const [description, setDescription] = useState(project.description || '');
  const [digitalFolderUrl, setDigitalFolderUrl] = useState(project.digitalFolderUrl || '');
  const [copiedDriveLink, setCopiedDriveLink] = useState(false);
  const [amenities, setAmenities] = useState<string[]>(() =>
    Array.from(new Set((project.amenities || []).map((item) => String(item ?? '').trim()).filter(Boolean)))
  );
  const [newAmenity, setNewAmenity] = useState('');

  const [workflowSettings, setWorkflowSettings] = useState<ReservationWorkflowSettings | null>(null);
  const [workflowSaving, setWorkflowSaving] = useState(false);
  const [notificationEmails, setNotificationEmails] = useState('');

  // 2. Media State
  const [heroUrl, setHeroUrl] = useState(project.image || '');
  // Deduplicate and combine existing project gallery photos
  const [galleryUrls, setGalleryUrls] = useState<string[]>(() => {
    const existing = project.gallery || [];
    return Array.from(new Set(existing.filter(Boolean)));
  });
  const [isGalleryExpanded, setIsGalleryExpanded] = useState(false);
  const [isImagePackExpanded, setIsImagePackExpanded] = useState(false);
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);

  // 3. Typologies State
  const [typologies, setTypologies] = useState<Record<string, ProjectVillaTypology>>(initialTypologies);
  const [activeTypologyKey, setActiveTypologyKey] = useState<string>(
    Object.keys(initialTypologies)[0] || 'ESMERALDA'
  );
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  // 4. Image Pack State
  const [imagePackUrls, setImagePackUrls] = useState<string[]>([]);
  const [watermarkLogoUrl, setWatermarkLogoUrl] = useState<string>('');
  const [imagePackSaving, setImagePackSaving] = useState(false);
  const imagePackLoadedForProjectRef = useRef<number | null>(null);
  const watermarkFileRef = useRef<HTMLInputElement>(null);
  const imagePackFileRef = useRef<HTMLInputElement>(null);

  // 5. Payment Plan State
  const [paymentPlanName, setPaymentPlanName] = useState('Plan de Pago Estándar');
  const [paymentSteps, setPaymentSteps] = useState<EditablePaymentStep[]>(() => {
    if (project.paymentPlan && project.paymentPlan.length > 0) {
      return project.paymentPlan.map((step, idx) => {
        const val = String(step.value || '');
        const isFixed = val.includes('$') || val.toLowerCase().includes('usd') || val.toLowerCase().includes('dop');
        const num = parseFloat(val.replace(/[^\d.]/g, '')) || 0;
        return {
          id: idx,
          label: step.label,
          type: isFixed ? 'fixed' : 'percentage',
          value: num,
          milestone: '',
        };
      });
    }
    const isReady = project.slug === 'cana-rock-star' || project.status === 'Listo para entrega' || (project.delivery && project.delivery.toLowerCase().includes('listo'));
    if (isReady) {
      return [
        { label: 'Reserva', type: 'fixed', value: 3000, milestone: 'Al separar la unidad' },
        { label: 'Inicial', type: 'percentage', value: 20, milestone: 'A la firma del contrato' },
        { label: 'Contra entrega', type: 'percentage', value: 80, milestone: 'Contra entrega de la unidad' },
      ];
    }
    return [
      { label: 'Reserva', type: 'fixed', value: 3000, milestone: 'Al separar la unidad' },
      { label: 'Inicial', type: 'percentage', value: 20, milestone: 'A la firma de contrato' },
      { label: 'Durante Construcción', type: 'percentage', value: 40, milestone: 'En cuotas mensuales' },
      { label: 'Contra Entrega', type: 'percentage', value: 40, milestone: 'Contra entrega final' },
    ];
  });

  useEffect(() => {
    let active = true;
    getProjectPaymentPlanAction(project.id).then((res) => {
      if (!active || !res.success || !res.steps || res.steps.length === 0) return;
      setPaymentSteps(res.steps.map((s) => ({
        id: s.id,
        label: s.label,
        type: s.fixed_amount !== null && s.fixed_amount !== undefined ? 'fixed' : 'percentage',
        value: s.fixed_amount !== null && s.fixed_amount !== undefined ? Number(s.fixed_amount) : Number(s.percentage ?? 0),
        milestone: s.milestone || '',
      })));
      if (res.planName) setPaymentPlanName(res.planName);
    });
    return () => { active = false; };
  }, [project.id]);

  React.useEffect(() => {
    if (imagePackLoadedForProjectRef.current === project.id) return;
    imagePackLoadedForProjectRef.current = project.id;
    let active = true;
    getImagePackAction(project.id).then((data) => {
      if (!active) return;
      setImagePackUrls(data.imagePackUrls);
      setWatermarkLogoUrl(data.watermarkLogoUrl || '');
    });
    return () => {
      active = false;
    };
  }, [project.id]);

  useEffect(() => {
    let active = true;
    Promise.all([getReservationWorkflowSettingsAction(project.id), getOperationalNotificationRecipientsAction(project.id)]).then(([settings, recipients]) => {
      if (!active) return;
      setWorkflowSettings(settings);
      setNotificationEmails(recipients.map((recipient) => recipient.email).join('\n'));
    });
    return () => { active = false; };
  }, [project.id]);

  const updateWorkflow = (partial: Partial<ReservationWorkflowSettings>) => {
    setWorkflowSettings((current) => current ? { ...current, ...partial } : current);
  };

  const saveWorkflow = async () => {
    if (!workflowSettings) return;
    setWorkflowSaving(true);
    const [result, recipientsResult] = await Promise.all([
      saveReservationWorkflowSettingsAction(project.id, workflowSettings),
      saveOperationalNotificationRecipientsAction(project.id, notificationEmails),
    ]);
    setWorkflowSaving(false);
    const error = result.error || recipientsResult.error;
    setFeedback(!error && result.success && recipientsResult.success
      ? { type: 'success', message: 'Reglas y destinatarios de notificación guardados.' }
      : { type: 'error', message: error || 'No se pudieron guardar las reglas.' });
  };

  const toggleImageInPack = (url: string) => {
    setImagePackUrls((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
  };

  const handleSaveImagePack = async () => {
    setImagePackSaving(true);
    setFeedback(null);
    try {
      const res = await saveImagePackAction(
        project.id,
        imagePackUrls,
        watermarkLogoUrl || null
      );
      if (!res.success) {
        setFeedback({ type: 'error', message: res.error || 'Error al guardar paquete.' });
      } else {
        setFeedback({ type: 'success', message: 'Paquete de imágenes guardado exitosamente.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Error inesperado al guardar el paquete.' });
    } finally {
      setImagePackSaving(false);
    }
  };

  // Hidden File Input Refs
  const heroFileRef = useRef<HTMLInputElement>(null);
  const galleryMultiFileRef = useRef<HTMLInputElement>(null);
  const typologyImageFileRef = useRef<HTMLInputElement>(null);
  const typologyFloorPlanFileRef = useRef<HTMLInputElement>(null);

  const currentTypology = typologies[activeTypologyKey] || null;

  const updateCurrentTypology = (partial: Partial<ProjectVillaTypology>) => {
    if (!activeTypologyKey) return;
    setTypologies((prev) => ({
      ...prev,
      [activeTypologyKey]: {
        ...prev[activeTypologyKey],
        ...partial,
      },
    }));
  };

  const handleAddFeature = (featureText: string) => {
    if (!featureText.trim() || !currentTypology) return;
    updateCurrentTypology({
      features: [...(currentTypology.features || []), featureText.trim()],
    });
  };

  const handleAddAmenity = () => {
    const cleanName = newAmenity.trim();
    if (!cleanName) return;
    setAmenities((current) =>
      current.some((item) => item.toLocaleLowerCase('es') === cleanName.toLocaleLowerCase('es'))
        ? current
        : [...current, cleanName]
    );
    setNewAmenity('');
  };

  const handleRemoveFeature = (index: number) => {
    if (!currentTypology) return;
    updateCurrentTypology({
      features: currentTypology.features.filter((_, i) => i !== index),
    });
  };

  const handleAddTypology = () => {
    const newKey = `MODELO_${Object.keys(typologies).length + 1}`;
    const newTyp: ProjectVillaTypology = {
      id: newKey.toLowerCase(),
      key: newKey,
      name: `Nuevo Modelo ${Object.keys(typologies).length + 1}`,
      tagline: '',
      startingPrice: 0,
      constructionAreaSqm: 0,
      lotRangeSqm: '',
      bedrooms: 0,
      bathrooms: 0,
      parkingSpaces: 0,
      levels: 1,
      image: '',
      floorPlanImage: '',
      badge: 'Nuevo Modelo',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
      description: '',
      features: [],
      spaces: [],
    };
    setTypologies((prev) => ({ ...prev, [newKey]: newTyp }));
    setActiveTypologyKey(newKey);
  };

  const handleRemoveTypology = (keyToDelete: string) => {
    if (Object.keys(typologies).length <= 1) {
      alert('Debe existir al menos un modelo o tipología en el proyecto.');
      return;
    }
    const next = { ...typologies };
    delete next[keyToDelete];
    setTypologies(next);
    setActiveTypologyKey(Object.keys(next)[0]);
  };

  // Direct client-side upload to Supabase Storage
  const uploadSingleImageToSupabase = async (
    file: File,
    kind: 'hero' | 'gallery' | 'typology' | 'floorplan' | 'watermark' | 'banner' | 'logo' = 'gallery'
  ): Promise<string> => {
    const validationError = validateProjectImage(file);
    if (validationError) {
      throw new Error(validationError);
    }

    const supabase = createClient();
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const cleanExt = ['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(ext) ? ext : 'jpg';
    const uniqueId = crypto.randomUUID();
    const sanitizedSlug =
      (project.slug || project.name || 'proyecto')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/(^-+|-+$)/g, '') || 'proyecto';

    const storagePath = `${orgSlug}/projects/${sanitizedSlug}/${kind}-${uniqueId}.${cleanExt}`;

    const { error: uploadError } = await supabase.storage
      .from('public-assets')
      .upload(storagePath, file, {
        contentType: file.type || 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.warn('Direct upload error, trying action fallback:', uploadError.message);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await uploadProjectImageAction(project.id, formData);
        if (res.success && res.url) {
          return res.url;
        }
      } catch {
        // ignore fallback error and throw original error
      }
      throw new Error(`Error al subir ${file.name}: ${uploadError.message}`);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('public-assets').getPublicUrl(storagePath);

    return publicUrl;
  };

  // Upload handler for single files (Hero, Typology render, Typology floorplan, Watermark)
  const handleUploadSingleFile = async (
    file: File,
    onSuccess: (url: string) => void,
    kind: 'hero' | 'gallery' | 'typology' | 'floorplan' | 'watermark' | 'banner' | 'logo' = 'gallery',
    addToGallery = false
  ) => {
    setIsUploading(true);
    setUploadMessage(`Subiendo ${file.name}...`);
    setFeedback(null);
    try {
      const publicUrl = await uploadSingleImageToSupabase(file, kind);
      if (addToGallery) {
        setGalleryUrls((prev) => (prev.includes(publicUrl) ? prev : [publicUrl, ...prev]));
      }
      onSuccess(publicUrl);
      setFeedback({
        type: 'success',
        message: `¡${file.name} subida y asignada con éxito! Recuerda hacer clic en "Guardar Cambios".`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al subir la imagen.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsUploading(false);
      setUploadMessage('');
    }
  };

  // Upload multiple files to gallery
  const handleUploadMultipleToGallery = async (files: FileList | File[] | null) => {
    if (!files) return;
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;
    setIsUploading(true);
    setFeedback(null);
    let successCount = 0;
    const errors: string[] = [];

    try {
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        setUploadMessage(`Subiendo imagen ${i + 1} de ${fileArray.length} (${file.name})...`);
        try {
          const publicUrl = await uploadSingleImageToSupabase(file, 'gallery');
          setGalleryUrls((prev) => (prev.includes(publicUrl) ? prev : [publicUrl, ...prev]));
          successCount++;
        } catch (err: unknown) {
          errors.push(`${file.name}: ${err instanceof Error ? err.message : 'error'}`);
        }
      }

      if (successCount > 0) {
        setFeedback({
          type: 'success',
          message: `Se subieron ${successCount} imagen(es) a la galería con éxito. Recuerda hacer clic en "Guardar Cambios".`,
        });
      }
      if (errors.length > 0) {
        setFeedback({
          type: 'error',
          message: `Error al subir algunas imágenes: ${errors.join(', ')}`,
        });
      }
    } finally {
      setIsUploading(false);
      setUploadMessage('');
    }
  };

  const handleRemoveGalleryImage = (index: number) => {
    setGalleryUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // Selection from Gallery Modal
  const handleSelectFromGallery = (url: string) => {
    if (!pickerTarget) return;

    if (pickerTarget.type === 'hero') {
      setHeroUrl(url);
    } else if (pickerTarget.type === 'typology-image') {
      setTypologies((prev) => ({
        ...prev,
        [pickerTarget.key]: {
          ...prev[pickerTarget.key],
          image: url,
        },
      }));
    } else if (pickerTarget.type === 'typology-floorplan') {
      setTypologies((prev) => ({
        ...prev,
        [pickerTarget.key]: {
          ...prev[pickerTarget.key],
          floorPlanImage: url,
        },
      }));
    }

    setPickerTarget(null);
  };

  // Save handler
  const handleSaveAll = () => {
    startTransition(async () => {
      setFeedback(null);
      const payload: ProjectEditPayload = {
        general: {
          name,
          location,
          zone,
          deliveryDate,
          startingPrice: Number(startingPrice) || 0,
          currency: currency.trim().toUpperCase(),
          commissionRate: Number(commissionRate) || 0,
          shortDescription,
          description,
          digitalFolderUrl: digitalFolderUrl.trim(),
        },
        media: {
          heroUrl,
          galleryUrls,
        },
        amenities,
        typologies,
        paymentPlan: {
          planName: paymentPlanName || 'Plan de Pago Estándar',
          currency: currency.trim().toUpperCase(),
          steps: paymentSteps.map((s, idx) => ({
            label: s.label,
            fixed_amount: s.type === 'fixed' ? Number(s.value) : null,
            percentage: s.type === 'percentage' ? Number(s.value) : null,
            milestone: s.milestone || null,
            sort_order: idx,
          })),
        },
      };

      const res = await updateProjectFullAction(project.id, payload);
      if (!res.success) {
        setFeedback({ type: 'error', message: res.error || 'Error al guardar los cambios.' });
      } else {
        setFeedback({
          type: 'success',
          message: 'Proyecto, imágenes y tipologías actualizados con éxito en todo el sistema.',
        });
        router.refresh();
      }
    });
  };

  // All available project images (gallery + hero)
  const allProjectPhotos = Array.from(new Set([heroUrl, ...galleryUrls].filter(Boolean)));

  return (
    <div className="space-y-6 font-sans">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={heroFileRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUploadSingleFile(file, (url) => setHeroUrl(url), 'hero');
          e.target.value = '';
        }}
      />
      <input
        type="file"
        ref={galleryMultiFileRef}
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const files = e.target.files ? Array.from(e.target.files) : [];
          e.target.value = '';
          if (files.length > 0) {
            handleUploadMultipleToGallery(files);
          }
        }}
      />
      <input
        type="file"
        ref={typologyImageFileRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && activeTypologyKey) {
            handleUploadSingleFile(
              file,
              (url) => updateCurrentTypology({ image: url }),
              'typology'
            );
          }
          e.target.value = '';
        }}
      />
      <input
        type="file"
        ref={typologyFloorPlanFileRef}
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && activeTypologyKey) {
            handleUploadSingleFile(
              file,
              (url) => updateCurrentTypology({ floorPlanImage: url }),
              'floorplan'
            );
          }
          e.target.value = '';
        }}
      />

      {/* Embedded Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          {onClose && (
            <UITranslationBoundary attributes={["title"]}><button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              title="Volver a tabla de inventario"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-slate-500" />
              <span><LocalizedText text={"Volver a Disponibilidad"} /></span>
            </button></UITranslationBoundary>
          )}
          <div>
            <h3 className="text-sm font-black text-slate-950"><LocalizedText text={"Editando Información, Fotos y Tipologías"} /></h3>
            <p className="text-[11px] text-slate-500"><LocalizedText text={"Modifica los títulos reales, fotos de fachada, planos 2D y especificaciones oficiales."} /></p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <Link
            href={`/proyectos/${project.slug}`}
            target="_blank"
            className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 sm:min-h-9 sm:px-3"
          >
            <span className="sm:hidden"><LocalizedText text={"Landing"} /></span>
            <span className="hidden sm:inline"><LocalizedText text={"Landing Pública"} /></span>
            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
          </Link>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isPending || isUploading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-slate-800 disabled:opacity-50 sm:min-h-9 sm:px-5"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            <span>{isPending ? 'Guardando...' : <LocalizedText text={"Guardar Cambios"} />}</span>
          </button>
        </div>
      </div>

      {/* Uploading Status Overlay Bar */}
      {isUploading && (
        <div className="bg-blue-600 text-white rounded-xl px-4 py-2.5 text-center text-xs font-bold flex items-center justify-center gap-2 shadow-sm animate-pulse">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{uploadMessage || 'Subiendo imagen a los servidores de OB Brokers...'}</span>
        </div>
      )}

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={cn(
            'rounded-2xl p-4 flex items-center justify-between text-xs font-bold border animate-in fade-in',
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          )}
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <UITranslationBoundary attributes={["aria-label"]}><div role="tablist" aria-label="Secciones de edición del proyecto" className="-mx-4 flex snap-x snap-mandatory items-center gap-2 overflow-x-auto border-b border-slate-200 px-4 pb-3 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'general'}
          onClick={() => setActiveTab('general')}
          className={cn(
            'inline-flex min-h-11 shrink-0 snap-start items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition sm:px-4',
            activeTab === 'general'
              ? 'bg-slate-950 text-white shadow-xs'
              : 'bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          )}
        >
          <Building2 className="h-3.5 w-3.5" />
          <span className="sm:hidden"><LocalizedText text={"Datos"} /></span>
          <span className="hidden sm:inline"><LocalizedText text={"1. Títulos y Datos Generales"} /></span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'media'}
          onClick={() => setActiveTab('media')}
          className={cn(
            'inline-flex min-h-11 shrink-0 snap-start items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition sm:px-4',
            activeTab === 'media'
              ? 'bg-slate-950 text-white shadow-xs'
              : 'bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          )}
        >
          <ImageIcon className="h-3.5 w-3.5" />
          <span className="sm:hidden"><LocalizedText text={"Galería ("} />{galleryUrls.length})</span>
          <span className="hidden sm:inline"><LocalizedText text={"2. Imágenes y Galería ("} />{galleryUrls.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'typologies'}
          onClick={() => setActiveTab('typologies')}
          className={cn(
            'inline-flex min-h-11 shrink-0 snap-start items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition sm:px-4',
            activeTab === 'typologies'
              ? 'bg-slate-950 text-white shadow-xs'
              : 'bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          )}
        >
          <Layers3 className="h-3.5 w-3.5" />
          <span className="sm:hidden"><LocalizedText text={"Tipos ("} />{Object.keys(typologies).length})</span>
          <span className="hidden sm:inline"><LocalizedText text={"3. Modelos y Tipologías ("} />{Object.keys(typologies).length})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'payment'}
          onClick={() => setActiveTab('payment')}
          className={cn(
            'inline-flex min-h-11 shrink-0 snap-start items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition sm:px-4',
            activeTab === 'payment'
              ? 'bg-slate-950 text-white shadow-xs'
              : 'bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          )}
        >
          <CreditCard className="h-3.5 w-3.5" />
          <span className="sm:hidden"><LocalizedText text={"Pago ("} />{paymentSteps.length})</span>
          <span className="hidden sm:inline"><LocalizedText text={"4. Plan de Pago ("} />{paymentSteps.length})</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'workflow'}
          onClick={() => setActiveTab('workflow')}
          className={cn(
            'inline-flex min-h-11 shrink-0 snap-start items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition sm:px-4',
            activeTab === 'workflow'
              ? 'bg-slate-950 text-white shadow-xs'
              : 'bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          )}
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span className="sm:hidden"><LocalizedText text={"Reserva"} /></span>
          <span className="hidden sm:inline"><LocalizedText text={"5. Proceso de reserva"} /></span>
        </button>
      </div></UITranslationBoundary>

      {/* TAB CONTENT */}
      <div>
        {/* TAB 4: PAYMENT PLAN */}
        {activeTab === 'payment' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header banner */}
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5 text-xs text-blue-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-black text-blue-950 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  <span><LocalizedText text={"Estructura del Plan de Pagos"} /></span>
                </p>
                <p className="mt-1 text-xs leading-relaxed text-blue-900/80 max-w-2xl"><LocalizedText text={"Configura los porcentajes y montos de reserva de "} /><strong>{name || project.name}</strong><LocalizedText text={". Este esquema se refleja en las propuestas comerciales enviadas a inversionistas, la calculadora del simulador y la landing pública."} /></p>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                <label className="text-xs font-bold text-blue-900"><LocalizedText text={"Nombre del plan:"} /><UITranslationBoundary attributes={["placeholder"]}><input
                    type="text"
                    value={paymentPlanName}
                    onChange={(e) => setPaymentPlanName(e.target.value)}
                    className="mt-1 h-9 w-full rounded-xl border border-blue-200 bg-white px-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Plan Estándar"
                  /></UITranslationBoundary>
                </label>
              </div>
            </div>

            {/* Presets de 1 clic */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2.5"><LocalizedText text={"Plantillas Rápidas (1 Clic)"} /></p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentSteps([
                      { label: 'Reserva', type: 'fixed', value: 3000, milestone: 'Al separar la unidad' },
                      { label: 'Inicial', type: 'percentage', value: 20, milestone: 'A la firma del contrato' },
                      { label: 'Contra entrega', type: 'percentage', value: 80, milestone: '80% contra entrega de la unidad' },
                    ]);
                    setPaymentPlanName('Plan Listo para Entrega (20/80)');
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs"
                >
                  <span><LocalizedText text={"🏠 Listo para entrega (20/80)"} /></span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentSteps([
                      { label: 'Reserva', type: 'fixed', value: 3000, milestone: 'Al separar la unidad' },
                      { label: 'Inicial', type: 'percentage', value: 10, milestone: 'A la firma de contrato' },
                      { label: 'Durante Construcción', type: 'percentage', value: 40, milestone: 'En cuotas mensuales' },
                      { label: 'Contra Entrega', type: 'percentage', value: 50, milestone: 'Contra entrega final' },
                    ]);
                    setPaymentPlanName('Plan Construcción Estándar (10/40/50)');
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/80 px-3 py-2 text-xs font-bold text-blue-800 hover:bg-blue-100 transition shadow-2xs"
                >
                  <span><LocalizedText text={"🏗️ Construcción (10/40/50)"} /></span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentSteps([
                      { label: 'Reserva', type: 'fixed', value: 3000, milestone: 'Al separar la unidad' },
                      { label: 'Inicial', type: 'percentage', value: 20, milestone: 'A la firma de contrato' },
                      { label: 'Durante Construcción', type: 'percentage', value: 30, milestone: 'En cuotas mensuales' },
                      { label: 'Contra Entrega', type: 'percentage', value: 50, milestone: 'Contra entrega final' },
                    ]);
                    setPaymentPlanName('Plan Construcción (20/30/50)');
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/80 px-3 py-2 text-xs font-bold text-indigo-800 hover:bg-indigo-100 transition shadow-2xs"
                >
                  <span><LocalizedText text={"🏗️ Construcción (20/30/50)"} /></span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentSteps([
                      { label: 'Reserva', type: 'fixed', value: 3000, milestone: 'Al separar la unidad' },
                      { label: 'Inicial', type: 'percentage', value: 20, milestone: 'A la firma de contrato' },
                      { label: 'Durante Construcción', type: 'percentage', value: 40, milestone: 'En cuotas mensuales' },
                      { label: 'Contra Entrega', type: 'percentage', value: 40, milestone: 'Contra entrega final' },
                    ]);
                    setPaymentPlanName('Plan Construcción (20/40/40)');
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                >
                  <span><LocalizedText text={"🏗️ Construcción (20/40/40)"} /></span>
                </button>
              </div>
            </div>

            {/* Steps List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <p className="text-xs font-black uppercase tracking-wider text-slate-600"><LocalizedText text={"Etapas de Pago ("} />{paymentSteps.length})
                </p>
                {/* Total indicator */}
                {(() => {
                  const totalPct = paymentSteps.filter((s) => s.type === 'percentage').reduce((sum, s) => sum + (Number(s.value) || 0), 0);
                  return totalPct === 100 ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-extrabold text-emerald-800">
                      <CheckCircle2 className="h-3.5 w-3.5" /><LocalizedText text={" Total: 100% de la propiedad"} /></span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-800"><LocalizedText text={"⚠️ Suma actual: "} />{totalPct}<LocalizedText text={"% (se recomienda 100%)"} /></span>
                  );
                })()}
              </div>

              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                {paymentSteps.map((step, idx) => (
                  <div key={idx} className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center gap-3.5 transition hover:bg-slate-50/50">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-black text-slate-700">
                      {idx + 1}
                    </span>

                    <div className="flex-1 min-w-0">
                      <label className="text-[10px] font-extrabold uppercase text-slate-400"><LocalizedText text={"Nombre de la Etapa"} /></label>
                      <UITranslationBoundary attributes={["placeholder"]}><input
                        type="text"
                        value={step.label}
                        onChange={(e) => {
                          const updated = [...paymentSteps];
                          updated[idx] = { ...updated[idx], label: e.target.value };
                          setPaymentSteps(updated);
                        }}
                        className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 focus:border-slate-900 focus:outline-none"
                        placeholder="Ej. Inicial / Firma de Contrato"
                      /></UITranslationBoundary>
                    </div>

                    <div className="w-full md:w-44">
                      <label className="text-[10px] font-extrabold uppercase text-slate-400"><LocalizedText text={"Modalidad"} /></label>
                      <select
                        value={step.type}
                        onChange={(e) => {
                          const updated = [...paymentSteps];
                          updated[idx] = { ...updated[idx], type: e.target.value as 'fixed' | 'percentage' };
                          setPaymentSteps(updated);
                        }}
                        className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 focus:border-slate-900 focus:outline-none"
                      >
                        <option value="percentage"><LocalizedText text={"Porcentaje (%)"} /></option>
                        <option value="fixed"><LocalizedText text={"Monto Fijo ("} />{currency})</option>
                      </select>
                    </div>

                    <div className="w-full md:w-36">
                      <label className="text-[10px] font-extrabold uppercase text-slate-400">
                        {step.type === 'percentage' ? 'Porcentaje (%)' : `Monto (${currency})`}
                      </label>
                      <div className="relative mt-1">
                        <input
                          type="number"
                          step={step.type === 'percentage' ? 'any' : '100'}
                          min={0}
                          value={step.value}
                          onChange={(e) => {
                            const updated = [...paymentSteps];
                            updated[idx] = { ...updated[idx], value: parseFloat(e.target.value) || 0 };
                            setPaymentSteps(updated);
                          }}
                          className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-900 focus:border-slate-900 focus:outline-none"
                        />
                        <span className="pointer-events-none absolute right-3 top-2 text-xs font-bold text-slate-400">
                          {step.type === 'percentage' ? '%' : currency}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <label className="text-[10px] font-extrabold uppercase text-slate-400"><LocalizedText text={"Hito / Momento de Pago (Opcional)"} /></label>
                      <UITranslationBoundary attributes={["placeholder"]}><input
                        type="text"
                        value={step.milestone || ''}
                        onChange={(e) => {
                          const updated = [...paymentSteps];
                          updated[idx] = { ...updated[idx], milestone: e.target.value };
                          setPaymentSteps(updated);
                        }}
                        className="mt-1 h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-600 focus:border-slate-900 focus:outline-none"
                        placeholder="Ej. A la firma del contrato"
                      /></UITranslationBoundary>
                    </div>

                    <div className="pt-4 md:pt-0 shrink-0">
                      <UITranslationBoundary attributes={["title"]}><button
                        type="button"
                        onClick={() => {
                          if (paymentSteps.length <= 1) return;
                          setPaymentSteps(paymentSteps.filter((_, i) => i !== idx));
                        }}
                        disabled={paymentSteps.length <= 1}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition disabled:opacity-30 disabled:pointer-events-none"
                        title="Eliminar etapa"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button></UITranslationBoundary>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentSteps([
                      ...paymentSteps,
                      {
                        label: 'Nuevo Pago',
                        type: 'percentage',
                        value: 0,
                        milestone: '',
                      },
                    ]);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition"
                >
                  <Plus className="h-4 w-4 text-slate-500" />
                  <span><LocalizedText text={"Añadir Etapa de Pago"} /></span>
                </button>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'workflow' && workflowSettings && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-xs text-blue-950">
              <p className="font-black"><LocalizedText text={"Reglas propias de "} />{name || project.name}</p>
              <p className="mt-1 leading-relaxed text-blue-900/75"><LocalizedText text={"Estas reglas aplican solo a este proyecto y permiten que cada Master Broker maneje sus reservas de forma distinta."} /></p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block text-xs font-bold text-slate-700"><LocalizedText text={"Quién puede revisar"} /><select value={workflowSettings.approvalAuthority} onChange={(e) => updateWorkflow({ approvalAuthority: e.target.value as ReservationWorkflowSettings['approvalAuthority'] })} className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs">
                  <option value="master_broker"><LocalizedText text={"Master Broker"} /></option>
                  <option value="developer"><LocalizedText text={"Desarrolladora"} /></option>
                  <option value="either"><LocalizedText text={"Master Broker o desarrolladora"} /></option>
                </select>
              </label>
              <label className="block text-xs font-bold text-slate-700"><LocalizedText text={"Tipo de reserva permitido"} /><select value={workflowSettings.reservationMode} onChange={(e) => updateWorkflow({ reservationMode: e.target.value as ReservationWorkflowSettings['reservationMode'] })} className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs">
                  <option value="temporary_hold"><LocalizedText text={"Bloqueo temporal"} /></option>
                  <option value="payment_confirmed"><LocalizedText text={"Reserva contra pago"} /></option>
                  <option value="both"><LocalizedText text={"Ambos"} /></option>
                </select>
              </label>
              <label className="block text-xs font-bold text-slate-700"><LocalizedText text={"Duración del bloqueo (horas)"} /><input type="number" min={1} max={720} value={workflowSettings.holdDurationHours} onChange={(e) => updateWorkflow({ holdDurationHours: Number(e.target.value) })} className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs" />
              </label>
              <label className="block text-xs font-bold text-slate-700"><LocalizedText text={"Aviso antes de liberar (horas)"} /><input type="number" min={0} max={168} value={workflowSettings.warningHours} onChange={(e) => updateWorkflow({ warningHours: Number(e.target.value) })} className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs" />
              </label>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {([
                ['approvalCreatesHold', 'La aprobación crea el bloqueo automáticamente'],
                ['releaseWithoutPayment', 'Liberar automáticamente si no se completa el proceso'],
                ['requirePaymentForConfirmation', 'Exigir comprobante de pago para confirmar'],
                ['requireDocumentsForConfirmation', 'Exigir documentos para confirmar'],
                ['crmNotificationsEnabled', 'Enviar avisos dentro del CRM'],
                ['emailNotificationsEnabled', 'Enviar avisos por correo'],
                ['allowClientDocumentsBeforeReservation', 'Permitir documentos del cliente desde su perfil'],
              ] as const).map(([key, label]) => (
                <label key={key} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-xs font-semibold text-slate-700">
                  <input type="checkbox" checked={workflowSettings[key]} onChange={(e) => updateWorkflow({ [key]: e.target.checked })} className="h-4 w-4 accent-slate-950" />
                  {label}
                </label>
              ))}
            </div>
            <div className="border-t border-slate-200 pt-5">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <div>
                  <p className="text-sm font-black text-slate-900"><LocalizedText text={"Destinatarios operativos"} /></p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500"><LocalizedText text={"Reciben por correo los reportes de clientes, solicitudes de reserva y comprobantes de pago. Si alguno tiene usuario en el CRM de esta organización, también verá el aviso dentro del sistema."} /></p>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400"><LocalizedText text={"Uno por línea"} /></p>
              </div>
              <textarea value={notificationEmails} onChange={(event) => setNotificationEmails(event.target.value)} rows={4} placeholder={'operaciones@tuempresa.com\nventas@tuempresa.com'} className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs leading-5 text-slate-800 outline-none transition focus:border-slate-950" />
              <p className="mt-2 text-[11px] text-slate-500"><LocalizedText text={"Esta lista se comparte con los reportes de cliente de este Master Broker. Puedes dejarla vacía para no usar notificaciones externas."} /></p>
            </div>
            <button type="button" onClick={saveWorkflow} disabled={workflowSaving} className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-5 text-xs font-bold text-white disabled:opacity-50">
              <Save className="h-3.5 w-3.5" /> {workflowSaving ? 'Guardando...' : <LocalizedText text={"Guardar reglas del proyecto"} />}
            </button>
          </div>
        )}
        {/* TAB 1: GENERAL INFO */}
        {activeTab === 'general' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5"><LocalizedText text={"Nombre Oficial del Proyecto *"} /></label>
                  <UITranslationBoundary attributes={["placeholder"]}><input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition shadow-2xs"
                    placeholder="Ej: Cipres Residences"
                  /></UITranslationBoundary>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5"><LocalizedText text={"Ubicación / Dirección Real *"} /></label>
                  <UITranslationBoundary attributes={["placeholder"]}><input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition shadow-2xs"
                    placeholder="Ej: Av. Barceló, Punta Cana"
                  /></UITranslationBoundary>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5"><LocalizedText text={"Zona / Polo Turístico"} /></label>
                  <UITranslationBoundary attributes={["placeholder"]}><input
                    type="text"
                    value={zone}
                    onChange={(e) => setZone(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition shadow-2xs"
                    placeholder="Ej: Punta Cana"
                  /></UITranslationBoundary>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5"><LocalizedText text={"Fecha de Entrega Estimada"} /></label>
                  <UITranslationBoundary attributes={["placeholder"]}><input
                    type="text"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition shadow-2xs"
                    placeholder="Ej: Diciembre 2027"
                  /></UITranslationBoundary>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5"><LocalizedText text={"Precio inicial"} /></label>
                  <UITranslationBoundary attributes={["placeholder"]}><input
                    type="number"
                    value={startingPrice}
                    onChange={(e) => setStartingPrice(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition shadow-2xs"
                    placeholder="93000"
                  /></UITranslationBoundary>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5"><LocalizedText text={"Moneda (código ISO)"} /></label>
                  <UITranslationBoundary attributes={["placeholder"]}><input
                    type="text"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3))}
                    placeholder="USD"
                    maxLength={3}
                    list="project-editor-currency-codes"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs font-bold uppercase text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition shadow-2xs"
                  /></UITranslationBoundary>
                  <datalist id="project-editor-currency-codes">
                    <option value="USD" />
                    <option value="DOP" />
                    <option value="EUR" />
                    <option value="CAD" />
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5"><LocalizedText text={"Comisión Broker (%)"} /></label>
                  <UITranslationBoundary attributes={["placeholder"]}><input
                    type="number"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition shadow-2xs"
                    placeholder="5"
                  /></UITranslationBoundary>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5"><LocalizedText text={"Titular Comercial / Subtítulo Corto"} /></label>
                <UITranslationBoundary attributes={["placeholder"]}><input
                  type="text"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition shadow-2xs"
                  placeholder="Resumen atractivo en 1 o 2 frases..."
                /></UITranslationBoundary>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5"><LocalizedText text={"Descripción General y Real del Proyecto"} /></label>
                <UITranslationBoundary attributes={["placeholder"]}><textarea
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition leading-relaxed shadow-2xs"
                  placeholder="Describe el concepto real, las amenidades verdaderas y las ventajas del proyecto sin textos innecesarios..."
                /></UITranslationBoundary>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-5 space-y-4">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900"><LocalizedText text={"Amenidades del proyecto ("} />{amenities.length})
                  </h4>
                  <p className="mt-1 text-[11px] leading-5 text-slate-500"><LocalizedText text={"Esta lista alimenta la landing, las propuestas, los dossiers y las piezas del estudio creativo."} /></p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <UITranslationBoundary attributes={["placeholder"]}><input
                    type="text"
                    value={newAmenity}
                    onChange={(event) => setNewAmenity(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleAddAmenity();
                      }
                    }}
                    className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3.5 text-xs text-slate-900 placeholder-slate-400 outline-none transition focus:border-blue-600"
                    placeholder="Ej: Piscina infinita"
                  /></UITranslationBoundary>
                  <button
                    type="button"
                    onClick={handleAddAmenity}
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-4 text-xs font-bold text-white transition hover:bg-slate-800"
                  >
                    <Plus className="h-3.5 w-3.5" /><LocalizedText text={"Añadir amenidad"} /></button>
                </div>

                {amenities.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {amenities.map((amenity, index) => (
                      <span
                        key={`${amenity}-${index}`}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-700 shadow-2xs"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        {amenity}
                        <button
                          type="button"
                          onClick={() => setAmenities((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                          className="ml-1 rounded-md p-0.5 text-rose-500 transition hover:bg-rose-50 hover:text-rose-700"
                          aria-label={`Eliminar ${amenity}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-5 text-center text-[11px] font-semibold text-slate-400"><LocalizedText text={"Aún no hay amenidades registradas para este proyecto."} /></p>
                )}
              </div>
            </div>

            {/* Carpeta Digital / Cloud Drive Card */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-5 space-y-4">
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-amber-500" />
                  <span><LocalizedText text={"Carpeta Digital Compartida (Google Drive / Nube)"} /></span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5"><LocalizedText text={"Enlace a la carpeta externa (Google Drive, Dropbox, OneDrive, etc.) donde se encuentra todo el material bruto o descargable del proyecto (renders en alta resolución, brochures en PDF, listas de precios en Excel y documentos legales). Los brokers podrán acceder a ella con un solo clic desde el portal y CRM."} /></p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700"><LocalizedText text={"URL de la Carpeta Digital"} /></label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <UITranslationBoundary attributes={["placeholder"]}><input
                      type="url"
                      value={digitalFolderUrl}
                      onChange={(e) => setDigitalFolderUrl(e.target.value)}
                      placeholder="https://drive.google.com/drive/folders/... o similar"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none transition shadow-2xs"
                    /></UITranslationBoundary>
                  </div>
                  {digitalFolderUrl.trim() && (
                    <div className="flex items-center gap-2">
                      <a
                        href={digitalFolderUrl.trim()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-blue-600" />
                        <span><LocalizedText text={"Probar Enlace"} /></span>
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(digitalFolderUrl.trim());
                          setCopiedDriveLink(true);
                          setTimeout(() => setCopiedDriveLink(false), 2000);
                        }}
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
                      >
                        {copiedDriveLink ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="text-emerald-700"><LocalizedText text={"¡Copiado!"} /></span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 text-slate-500" />
                            <span><LocalizedText text={"Copiar"} /></span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
                {digitalFolderUrl.trim() ? (
                  <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /><LocalizedText text={"Enlace configurado. Se mostrará a los asesores en el detalle del proyecto y centro documental."} /></p>
                ) : (
                  <p className="text-[10px] text-slate-400"><LocalizedText text={"Opcional. Si no se especifica, los brokers utilizarán exclusivamente el centro documental y dossier del portal."} /></p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MEDIA & GALLERY */}
        {activeTab === 'media' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Hero Image Card */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-5 space-y-4">
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <ImageIcon className="h-3.5 w-3.5 text-slate-500" />
                  <span><LocalizedText text={"Imagen de Portada Principal"} /></span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5"><LocalizedText text={"Imagen principal que encabeza la ficha del broker, el catálogo y la landing page."} /></p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                {/* Live Preview */}
                <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group">
                  {heroUrl ? (
                    <UITranslationBoundary attributes={["alt"]}><img
                      src={heroUrl}
                      alt="Portada Preview"
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                    /></UITranslationBoundary>
                  ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 gap-2">
                      <ImageIcon className="h-7 w-7" />
                      <span className="text-[11px] font-bold"><LocalizedText text={"Sin portada asignada"} /></span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="sm:col-span-2 space-y-2.5">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPickerTarget({ type: 'hero' })}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                    >
                      <FolderOpen className="h-3.5 w-3.5 text-slate-500" />
                      <span><LocalizedText text={"Elegir de Galería ("} />{allProjectPhotos.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => heroFileRef.current?.click()}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                    >
                      <Upload className="h-3.5 w-3.5 text-slate-500" />
                      <span><LocalizedText text={"Subir desde mi equipo"} /></span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500"><LocalizedText text={"Puedes elegir una de las "} />{allProjectPhotos.length}<LocalizedText text={" fotos ya subidas al proyecto o subir un nuevo archivo desde tu dispositivo."} /></p>
                </div>
              </div>
            </div>

            {/* Gallery Images Card */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Layers3 className="h-3.5 w-3.5 text-slate-500" />
                    <span><LocalizedText text={"Galería Fotográfica ("} />{galleryUrls.length}<LocalizedText text={" fotos)"} /></span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5"><LocalizedText text={"Fotos de amenidades y renders para el catálogo y la landing page. Mostrando "} />{isGalleryExpanded ? galleryUrls.length : Math.min(10, galleryUrls.length)}<LocalizedText text={" de "} />{galleryUrls.length}.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {galleryUrls.length > 10 && (
                    <button
                      type="button"
                      onClick={() => setIsGalleryExpanded((prev) => !prev)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                    >
                      {isGalleryExpanded ? <ChevronUp className="h-3.5 w-3.5 text-slate-500" /> : <ChevronDown className="h-3.5 w-3.5 text-blue-600" />}
                      <span>{isGalleryExpanded ? 'Colapsar (10)' : `Ver todas (${galleryUrls.length})`}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => galleryMultiFileRef.current?.click()}
                    className="inline-flex h-8 items-center justify-center gap-1.5 rounded-xl bg-slate-950 px-3.5 text-xs font-bold text-white hover:bg-slate-800 transition shadow-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span><LocalizedText text={"Subir Fotos a Galería"} /></span>
                  </button>
                </div>
              </div>

              {/* Gallery Grid */}
              {galleryUrls.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400 text-xs font-bold"><LocalizedText text={"No hay imágenes en la galería. Haz clic en “Subir Fotos a Galería” para añadir imágenes."} /></div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {(isGalleryExpanded ? galleryUrls : galleryUrls.slice(0, 10)).map((url, displayIdx) => {
                      const realIdx = isGalleryExpanded ? displayIdx : galleryUrls.indexOf(url);
                      const isCurrentHero = heroUrl === url;
                      const finalIdx = realIdx !== -1 ? realIdx : displayIdx;
                      return (
                        <div
                          key={finalIdx}
                          className={cn(
                            'group relative aspect-video rounded-xl overflow-hidden border bg-slate-100 transition shadow-2xs cursor-pointer',
                            isCurrentHero ? 'border-blue-500 ring-2 ring-blue-400/40' : 'border-slate-200 hover:border-slate-400'
                          )}
                          onClick={() => setActiveLightboxIndex(finalIdx)}
                        >
                          <Image
                            src={url}
                            alt={`Galería ${finalIdx + 1}`}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 240px"
                            quality={60}
                            loading="lazy"
                            unoptimized={url.startsWith('blob:') || url.startsWith('data:')}
                            className="object-cover group-hover:scale-105 transition duration-300"
                          />

                          {/* Gallery controls stay visible on touch screens and desktop. */}
                          <div
                            className="absolute top-1.5 right-1.5 flex items-center gap-1 z-10"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <UITranslationBoundary attributes={["title"]}><button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveLightboxIndex(finalIdx);
                              }}
                              className="h-6 w-6 rounded-lg bg-slate-900/90 text-white flex items-center justify-center hover:bg-blue-600 shadow-md transition"
                              title="Ver en alta resolución"
                            >
                              <Maximize2 className="h-3 w-3" />
                            </button></UITranslationBoundary>
                            <UITranslationBoundary attributes={["title"]}><button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveGalleryImage(finalIdx);
                              }}
                              className="h-6 w-6 rounded-lg bg-rose-600 text-white flex items-center justify-center hover:bg-rose-700 shadow-md transition"
                              title="Quitar foto de galería"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button></UITranslationBoundary>
                          </div>

                          {/* Bottom Tag */}
                          <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none z-10">
                            <span className="rounded bg-slate-950/80 px-1 py-0.5 text-[8px] font-bold text-white backdrop-blur">
                              #{finalIdx + 1}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {galleryUrls.length > 10 && (
                    <div className="flex justify-center pt-2">
                      <button
                        type="button"
                        onClick={() => setIsGalleryExpanded((prev) => !prev)}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition shadow-xs"
                      >
                        {isGalleryExpanded ? (
                          <>
                            <ChevronUp className="h-4 w-4 text-slate-500" />
                            <span><LocalizedText text={"Mostrar menos (Ver primeras 10 fotos)"} /></span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 text-blue-600" />
                            <span><LocalizedText text={"Ver todas las fotos (+"} />{galleryUrls.length - 10}<LocalizedText text={" más • Total "} />{galleryUrls.length})</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Image Pack Configuration Card */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <PackageCheck className="h-3.5 w-3.5 text-slate-500" />
                    <span><LocalizedText text={"Paquete de Imágenes para Descarga ("} />{imagePackUrls.length}<LocalizedText text={" seleccionadas)"} /></span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5"><LocalizedText text={"Selecciona las imágenes de la galería que estarán disponibles para descarga con marca de agua."} /></p>
                </div>

                <button
                  type="button"
                  onClick={handleSaveImagePack}
                  disabled={imagePackSaving}
                  className="inline-flex h-8 items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3.5 text-xs font-bold text-white hover:bg-blue-700 transition shadow-xs disabled:opacity-50"
                >
                  {imagePackSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  <span>{imagePackSaving ? 'Guardando...' : <LocalizedText text={"Guardar Paquete"} />}</span>
                </button>
              </div>

              {/* Watermark Logo */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <h5 className="text-[11px] font-black text-slate-700 uppercase tracking-wider"><LocalizedText text={"Marca de Agua (Logo)"} /></h5>
                <div className="flex items-center gap-3">
                  {watermarkLogoUrl ? (
                    <div className="relative h-14 w-14 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                      <UITranslationBoundary attributes={["alt"]}><img src={watermarkLogoUrl} alt="Logo watermark" className="h-full w-full object-contain" /></UITranslationBoundary>
                      <button
                        type="button"
                        onClick={() => setWatermarkLogoUrl('')}
                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[9px] shadow"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-14 w-14 rounded-lg border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                      <ImageIcon className="h-5 w-5" />
                    </div>
                  )}
                  <div className="space-y-1.5 flex-1">
                    <button
                      type="button"
                      onClick={() => watermarkFileRef.current?.click()}
                      className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                    >
                      <Upload className="h-3.5 w-3.5 text-slate-500" />
                      <span><LocalizedText text={"Subir Logo"} /></span>
                    </button>
                    <p className="text-[10px] text-slate-500"><LocalizedText text={"Se aplicará como marca de agua semitransparente en la esquina inferior derecha de cada imagen."} /></p>
                  </div>
                </div>
              </div>

              {/* Hidden watermark file input */}
              <input
                type="file"
                ref={watermarkFileRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleUploadSingleFile(
                      file,
                      (url) => setWatermarkLogoUrl(url),
                      'watermark',
                      false
                    );
                  }
                  e.target.value = '';
                }}
              />

              {/* Hidden image pack file input */}
              <input
                type="file"
                ref={imagePackFileRef}
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const files = e.target.files ? Array.from(e.target.files) : [];
                  e.target.value = '';
                  if (files.length > 0) {
                    handleUploadMultipleToGallery(files);
                  }
                }}
              />

              {/* Gallery Image Selector */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h5 className="text-[11px] font-black text-slate-700 uppercase tracking-wider"><LocalizedText text={"Seleccionar de la Galería ("} />{imagePackUrls.length}<LocalizedText text={" de "} />{galleryUrls.length}<LocalizedText text={" seleccionadas)"} /></h5>
                    <p className="text-[10px] text-slate-500"><LocalizedText text={"Mostrando "} />{isImagePackExpanded ? galleryUrls.length : Math.min(12, galleryUrls.length)}<LocalizedText text={" imágenes."} /></p>
                  </div>
                  <div className="flex items-center gap-2">
                    {galleryUrls.length > 12 && (
                      <button
                        type="button"
                        onClick={() => setIsImagePackExpanded((prev) => !prev)}
                        className="inline-flex h-7 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[10px] font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                      >
                        {isImagePackExpanded ? <ChevronUp className="h-3 w-3 text-slate-500" /> : <ChevronDown className="h-3 w-3 text-blue-600" />}
                        <span>{isImagePackExpanded ? 'Colapsar (12)' : `Ver todas (${galleryUrls.length})`}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setImagePackUrls([...galleryUrls])}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800 transition"
                    ><LocalizedText text={"Seleccionar Todas"} /></button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setImagePackUrls([])}
                      className="text-[10px] font-bold text-slate-500 hover:text-slate-700 transition"
                    ><LocalizedText text={"Deseleccionar"} /></button>
                  </div>
                </div>

                {galleryUrls.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-slate-400 text-xs font-bold"><LocalizedText text={"Sube imágenes a la galería primero para seleccionarlas para el paquete."} /></div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                      {(isImagePackExpanded ? galleryUrls : galleryUrls.slice(0, 12)).map((url, idx) => {
                        const isSelected = imagePackUrls.includes(url);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => toggleImageInPack(url)}
                            className={cn(
                              'relative aspect-video rounded-lg overflow-hidden border-2 transition group',
                              isSelected
                                ? 'border-blue-500 ring-2 ring-blue-400/40'
                                : 'border-slate-200 hover:border-slate-400 opacity-60 hover:opacity-100'
                            )}
                          >
                            <img
                              src={url}
                              alt={`Galería ${idx + 1}`}
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-cover"
                            />
                            {isSelected && (
                              <div className="absolute top-1 right-1 h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              </div>
                            )}
                            <span className="absolute bottom-0.5 left-0.5 rounded bg-slate-950/80 px-1 py-0.5 text-[7px] font-bold text-white backdrop-blur">
                              #{idx + 1}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {galleryUrls.length > 12 && (
                      <div className="flex justify-center pt-1">
                        <button
                          type="button"
                          onClick={() => setIsImagePackExpanded((prev) => !prev)}
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition shadow-xs"
                        >
                          {isImagePackExpanded ? (
                            <>
                              <ChevronUp className="h-3.5 w-3.5 text-slate-500" />
                              <span><LocalizedText text={"Mostrar menos (Ver primeras 12)"} /></span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3.5 w-3.5 text-blue-600" />
                              <span><LocalizedText text={"Ver todas las fotos para seleccionar (+"} />{galleryUrls.length - 12}<LocalizedText text={" más • Total "} />{galleryUrls.length})</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TYPOLOGIES & FLOOR PLANS */}
        {activeTab === 'typologies' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Typologies Selector Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-slate-500 mr-1"><LocalizedText text={"Modelo:"} /></span>
                {Object.keys(typologies).map((key) => {
                  const typ = typologies[key];
                  const isActive = activeTypologyKey === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveTypologyKey(key)}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition',
                        isActive
                          ? 'bg-slate-950 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      )}
                    >
                      <span>{typ.name || key}</span>
                      <span className="text-[10px] opacity-75 font-normal">
                        ({typ.constructionAreaSqm}<LocalizedText text={" m²)"} /></span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleAddTypology}
                  className="inline-flex h-8 items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  <Plus className="h-3 w-3 text-slate-500" />
                  <span><LocalizedText text={"Nuevo Modelo"} /></span>
                </button>

                {currentTypology && (
                  <UITranslationBoundary attributes={["title"]}><button
                    type="button"
                    onClick={() => handleRemoveTypology(activeTypologyKey)}
                    className="inline-flex h-8 items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
                    title="Eliminar este modelo"
                  >
                    <Trash2 className="h-3 w-3 text-rose-500" />
                    <span><LocalizedText text={"Eliminar"} /></span>
                  </button></UITranslationBoundary>
                )}
              </div>
            </div>

            {/* Selected Typology Editor Form */}
            {currentTypology && (
              <div className="space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="text-sm font-black text-slate-950 flex items-center gap-2">
                    <span>{currentTypology.name}</span>
                    <span className="rounded-md bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 text-[9px] font-bold uppercase"><LocalizedText text={"Clave: "} />{currentTypology.key}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5"><LocalizedText text={"Ajusta los metrajes, plano arquitectónico 2D y características de este modelo."} /></p>
                </div>

                {/* Form Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5"><LocalizedText text={"Nombre de la Tipología *"} /></label>
                    <UITranslationBoundary attributes={["placeholder"]}><input
                      type="text"
                      value={currentTypology.name}
                      onChange={(e) => updateCurrentTypology({ name: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition shadow-2xs"
                      placeholder="Ej: Villa Esmeralda"
                    /></UITranslationBoundary>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5"><LocalizedText text={"Metros Construcción (m²) *"} /></label>
                    <UITranslationBoundary attributes={["placeholder"]}><input
                      type="number"
                      value={currentTypology.constructionAreaSqm}
                      onChange={(e) =>
                        updateCurrentTypology({ constructionAreaSqm: Number(e.target.value) })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition shadow-2xs"
                      placeholder="78"
                    /></UITranslationBoundary>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5"><LocalizedText text={"Rango de Solar / Terreno (m²)"} /></label>
                    <UITranslationBoundary attributes={["placeholder"]}><input
                      type="text"
                      value={currentTypology.lotRangeSqm}
                      onChange={(e) => updateCurrentTypology({ lotRangeSqm: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition shadow-2xs"
                      placeholder="Ej: Desde 204 m²"
                    /></UITranslationBoundary>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5"><LocalizedText text={"Habitaciones"} /></label>
                    <UITranslationBoundary attributes={["placeholder"]}><input
                      type="number"
                      value={currentTypology.bedrooms}
                      onChange={(e) => updateCurrentTypology({ bedrooms: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition shadow-2xs"
                      placeholder="2"
                    /></UITranslationBoundary>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5"><LocalizedText text={"Baños"} /></label>
                    <UITranslationBoundary attributes={["placeholder"]}><input
                      type="number"
                      step="0.5"
                      value={currentTypology.bathrooms}
                      onChange={(e) => updateCurrentTypology({ bathrooms: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition shadow-2xs"
                      placeholder="2 o 2.5"
                    /></UITranslationBoundary>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5"><LocalizedText text={"Parqueos"} /></label>
                    <UITranslationBoundary attributes={["placeholder"]}><input
                      type="number"
                      value={currentTypology.parkingSpaces}
                      onChange={(e) =>
                        updateCurrentTypology({ parkingSpaces: Number(e.target.value) })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition shadow-2xs"
                      placeholder="2"
                    /></UITranslationBoundary>
                  </div>
                </div>

                {/* Subtitle / Tagline */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5"><LocalizedText text={"Subtítulo / Resumen Oficial"} /></label>
                  <UITranslationBoundary attributes={["placeholder"]}><input
                    type="text"
                    value={currentTypology.tagline}
                    onChange={(e) => updateCurrentTypology({ tagline: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition shadow-2xs"
                    placeholder="Ej: 78 m² de Construcción · 2 Habitaciones · 2 Baños"
                  /></UITranslationBoundary>
                </div>

                {/* Visual Image Selectors: Fachada & Plano (NO manual URLs) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* Fachada / Render */}
                  <div className="space-y-2.5 rounded-2xl border border-slate-200 p-4 bg-slate-50/40">
                    <label className="block text-xs font-bold text-slate-800"><LocalizedText text={"Foto de Fachada / Render del Modelo"} /></label>

                    <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-white">
                      {currentTypology.image && !brokenImages[currentTypology.image] ? (
                        <UITranslationBoundary attributes={["alt"]}><img
                          src={currentTypology.image}
                          alt="Render Preview"
                          className="h-full w-full object-cover"
                          onError={() => setBrokenImages((prev) => ({ ...prev, [currentTypology.image]: true }))}
                        /></UITranslationBoundary>
                      ) : (
                        <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 gap-1.5 p-4 text-center">
                          <ImageIcon className="h-6 w-6 text-slate-300" />
                          <span className="text-[10px] font-bold">
                            {currentTypology.image ? <LocalizedText text={"⚠️ Imagen no disponible o eliminada"} /> : <LocalizedText text={"Sin foto asignada"} />}
                          </span>
                          {currentTypology.image && (
                            <span className="text-[9px] text-slate-400"><LocalizedText text={"Elige otra foto de la galería o sube una nueva"} /></span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          setPickerTarget({ type: 'typology-image', key: activeTypologyKey })
                        }
                        className="flex-1 inline-flex h-8 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                      >
                        <FolderOpen className="h-3.5 w-3.5 text-slate-500" />
                        <span><LocalizedText text={"Elegir de Galería ("} />{allProjectPhotos.length})</span>
                      </button>

                      <UITranslationBoundary attributes={["title"]}><button
                        type="button"
                        onClick={() => typologyImageFileRef.current?.click()}
                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                        title="Subir foto desde tu equipo"
                      >
                        <Upload className="h-3.5 w-3.5 text-slate-500" />
                        <span><LocalizedText text={"Subir"} /></span>
                      </button></UITranslationBoundary>

                      {currentTypology.image && (
                        <UITranslationBoundary attributes={["title"]}><button
                          type="button"
                          onClick={() => updateCurrentTypology({ image: '' })}
                          className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-rose-500 transition hover:bg-rose-50 hover:text-rose-700"
                          title="Quitar foto"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button></UITranslationBoundary>
                      )}
                    </div>
                  </div>

                  {/* Plano Arquitectónico 2D */}
                  <div className="space-y-2.5 rounded-2xl border border-slate-200 p-4 bg-slate-50/40">
                    <label className="block text-xs font-bold text-slate-800"><LocalizedText text={"Plano Arquitectónico 2D (Con distribución)"} /></label>

                    <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-white p-2 flex items-center justify-center">
                      {currentTypology.floorPlanImage && !brokenImages[currentTypology.floorPlanImage] ? (
                        <UITranslationBoundary attributes={["alt"]}><img
                          src={currentTypology.floorPlanImage}
                          alt="Plano Preview"
                          className="max-h-full max-w-full object-contain"
                          onError={() => setBrokenImages((prev) => ({ ...prev, [currentTypology.floorPlanImage]: true }))}
                        /></UITranslationBoundary>
                      ) : (
                        <div className="h-full w-full flex flex-col items-center justify-center text-slate-400 gap-1.5 p-4 text-center">
                          <ImageIcon className="h-6 w-6 text-slate-300" />
                          <span className="text-[10px] font-bold">
                            {currentTypology.floorPlanImage ? <LocalizedText text={"⚠️ Plano no disponible o eliminado"} /> : <LocalizedText text={"Sin plano asignado"} />}
                          </span>
                          {currentTypology.floorPlanImage && (
                            <span className="text-[9px] text-slate-400"><LocalizedText text={"Elige otro plano de la galería o sube uno nuevo"} /></span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          setPickerTarget({ type: 'typology-floorplan', key: activeTypologyKey })
                        }
                        className="flex-1 inline-flex h-8 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                      >
                        <FolderOpen className="h-3.5 w-3.5 text-slate-500" />
                        <span><LocalizedText text={"Elegir de Galería ("} />{allProjectPhotos.length})</span>
                      </button>

                      <UITranslationBoundary attributes={["title"]}><button
                        type="button"
                        onClick={() => typologyFloorPlanFileRef.current?.click()}
                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                        title="Subir plano desde tu equipo"
                      >
                        <Upload className="h-3.5 w-3.5 text-slate-500" />
                        <span><LocalizedText text={"Subir"} /></span>
                      </button></UITranslationBoundary>

                      {currentTypology.floorPlanImage && (
                        <UITranslationBoundary attributes={["title"]}><button
                          type="button"
                          onClick={() => updateCurrentTypology({ floorPlanImage: '' })}
                          className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-rose-500 transition hover:bg-rose-50 hover:text-rose-700"
                          title="Quitar plano"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button></UITranslationBoundary>
                      )}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5"><LocalizedText text={"Descripción Veraz y Real de la Tipología"} /></label>
                  <UITranslationBoundary attributes={["placeholder"]}><textarea
                    rows={3}
                    value={currentTypology.description}
                    onChange={(e) => updateCurrentTypology({ description: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition leading-relaxed shadow-2xs"
                    placeholder="Describe las características reales del modelo..."
                  /></UITranslationBoundary>
                </div>

                {/* Real Features List (Bullets) */}
                <div className="space-y-2.5">
                  <label className="block text-xs font-bold text-slate-700"><LocalizedText text={"Características Clave (Puntos Destacados Reales)"} /></label>
                  <div className="space-y-2">
                    {(currentTypology.features || []).map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={feat}
                          onChange={(e) => {
                            const updated = [...currentTypology.features];
                            updated[fIdx] = e.target.value;
                            updateCurrentTypology({ features: updated });
                          }}
                          className="flex-1 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none transition"
                        />
                        <UITranslationBoundary attributes={["title"]}><button
                          type="button"
                          onClick={() => handleRemoveFeature(fIdx)}
                          className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-rose-500 transition hover:bg-rose-50 hover:text-rose-700"
                          title="Eliminar característica"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button></UITranslationBoundary>
                      </div>
                    ))}

                    {/* Add new feature input */}
                    <div className="flex items-center gap-2 pt-1">
                      <UITranslationBoundary attributes={["placeholder"]}><input
                        type="text"
                        placeholder="Escribe una nueva característica real y presiona Enter..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddFeature((e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                        id="new-feature-input"
                        className="flex-1 rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:outline-none"
                      /></UITranslationBoundary>
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.getElementById(
                            'new-feature-input'
                          ) as HTMLInputElement;
                          if (input && input.value) {
                            handleAddFeature(input.value);
                            input.value = '';
                          }
                        }}
                        className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                      >
                        <Plus className="h-3.5 w-3.5 text-slate-500" />
                        <span><LocalizedText text={"Añadir"} /></span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Embedded Bottom Actions Bar */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
        <div className="text-[11px] text-slate-500"><LocalizedText text={"Modificaciones para guardar en "} /><strong>{name}</strong>.
        </div>
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
            ><LocalizedText text={"Volver a Disponibilidad"} /></button>
          )}
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isPending || isUploading}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-slate-950 px-6 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            <span>{isPending ? 'Guardando...' : <LocalizedText text={"Guardar Cambios"} />}</span>
          </button>
        </div>
      </div>

      {/* MODAL: GALLERY PHOTO PICKER */}
      {pickerTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[85vh] rounded-3xl border border-slate-200 bg-white shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
              <div>
                <h3 className="text-base font-black text-slate-950"><LocalizedText text={"Galería del Proyecto: "} />{name || project.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5"><LocalizedText text={"Haz clic sobre cualquier foto para asignarla a:"} />{' '}
                  <span className="font-bold text-blue-600">
                    {pickerTarget.type === 'hero'
                      ? 'Portada Principal'
                      : pickerTarget.type === 'typology-image'
                      ? `Render de ${typologies[pickerTarget.key]?.name || pickerTarget.key}`
                      : `Plano de ${typologies[pickerTarget.key]?.name || pickerTarget.key}`}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => galleryMultiFileRef.current?.click()}
                  className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  <Plus className="h-3.5 w-3.5 text-slate-500" />
                  <span><LocalizedText text={"Subir más fotos"} /></span>
                </button>

                <button
                  type="button"
                  onClick={() => setPickerTarget(null)}
                  className="h-8 w-8 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-900 flex items-center justify-center transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Modal Photos Grid */}
            <div className="flex-1 overflow-y-auto p-6">
              {allProjectPhotos.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs font-bold space-y-3">
                  <p><LocalizedText text={"No se encontraron fotos en la galería de este proyecto."} /></p>
                  <button
                    type="button"
                    onClick={() => galleryMultiFileRef.current?.click()}
                    className="inline-flex h-9 items-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-bold text-white hover:bg-slate-800 transition"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span><LocalizedText text={"Subir fotos ahora"} /></span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {allProjectPhotos.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectFromGallery(url)}
                      className="group relative aspect-video rounded-2xl overflow-hidden border-2 border-slate-200 hover:border-blue-600 focus:border-blue-600 bg-slate-100 transition text-left focus:outline-none"
                    >
                      <img
                        src={url}
                        alt={`Foto ${idx + 1}`}
                        className="h-full w-full object-cover group-hover:scale-105 transition duration-200"
                      />
                      <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/20 transition flex items-center justify-center">
                        <span className="opacity-0 group-hover:opacity-100 bg-slate-950/80 text-white rounded-lg px-2.5 py-1 text-[10px] font-bold backdrop-blur shadow-sm transition"><LocalizedText text={"Seleccionar Foto"} /></span>
                      </div>
                      <span className="absolute bottom-1.5 left-1.5 rounded bg-slate-950/70 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur">
                        #{idx + 1}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span>{allProjectPhotos.length}<LocalizedText text={" fotos disponibles en la galería"} /></span>
              <button
                type="button"
                onClick={() => setPickerTarget(null)}
                className="font-bold text-slate-700 hover:text-slate-900"
              ><LocalizedText text={"Cerrar"} /></button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal for High-Resolution Gallery Inspection */}
      {activeLightboxIndex !== null && galleryUrls[activeLightboxIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-3 sm:p-6 backdrop-blur-md animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveLightboxIndex(null);
          }}
        >
          <div className="relative flex flex-col w-full max-w-5xl h-full max-h-[92vh] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            {/* Lightbox Topbar */}
            <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-950/60 px-5 py-3 text-white backdrop-blur">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400"><LocalizedText text={"Foto "} />{activeLightboxIndex + 1}<LocalizedText text={" de "} />{galleryUrls.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <UITranslationBoundary attributes={["title"]}><a
                  href={galleryUrls[activeLightboxIndex]}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 px-3 text-xs font-bold text-white transition"
                  title="Descargar o abrir en pestaña nueva"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline"><LocalizedText text={"Descargar"} /></span>
                </a></UITranslationBoundary>
                <UITranslationBoundary attributes={["title"]}><button
                  type="button"
                  onClick={() => {
                    const toRemove = activeLightboxIndex;
                    handleRemoveGalleryImage(toRemove);
                    if (galleryUrls.length <= 1) {
                      setActiveLightboxIndex(null);
                    } else if (toRemove >= galleryUrls.length - 1) {
                      setActiveLightboxIndex(galleryUrls.length - 2);
                    }
                  }}
                  className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 px-3 text-xs font-bold text-white transition"
                  title="Eliminar de la galería"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline"><LocalizedText text={"Quitar"} /></span>
                </button></UITranslationBoundary>
                <UITranslationBoundary attributes={["aria-label"]}><button
                  type="button"
                  onClick={() => setActiveLightboxIndex(null)}
                  className="h-8 w-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition ml-2"
                  aria-label="Cerrar visor"
                >
                  <X className="h-5 w-5" />
                </button></UITranslationBoundary>
              </div>
            </div>

            {/* Lightbox Main Stage */}
            <div className="relative flex-1 flex items-center justify-center p-4 overflow-hidden bg-slate-950/40">
              {activeLightboxIndex > 0 && (
                <UITranslationBoundary attributes={["aria-label"]}><button
                  type="button"
                  onClick={() => setActiveLightboxIndex((curr) => (curr !== null && curr > 0 ? curr - 1 : 0))}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 h-11 w-11 rounded-2xl bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur shadow-lg transition border border-white/10"
                  aria-label="Foto anterior"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button></UITranslationBoundary>
              )}

              <img
                src={galleryUrls[activeLightboxIndex]}
                alt={`Galería ${activeLightboxIndex + 1}`}
                className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl transition"
              />

              {activeLightboxIndex < galleryUrls.length - 1 && (
                <UITranslationBoundary attributes={["aria-label"]}><button
                  type="button"
                  onClick={() => setActiveLightboxIndex((curr) => (curr !== null && curr < galleryUrls.length - 1 ? curr + 1 : curr))}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 h-11 w-11 rounded-2xl bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur shadow-lg transition border border-white/10"
                  aria-label="Foto siguiente"
                >
                  <ChevronRight className="h-6 w-6" />
                </button></UITranslationBoundary>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
