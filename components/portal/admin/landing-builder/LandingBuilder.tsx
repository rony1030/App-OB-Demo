'use client';
import { UITranslationBoundary, LocalizedText } from '@/components/i18n/UITranslationBoundary';


import React, { useState, useTransition, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  Laptop,
  RefreshCw,
  Save,
  Smartphone,
  UploadCloud,
  Image as ImageIcon,
  Trash2,
  Plus,
  Sparkles,
  MapPin,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  PackageCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PortalProject } from '@/lib/portal-projects';
import type {
  ProjectLandingConfig,
  LandingProfitabilityItem,
} from '@/lib/data/landing-config';
import type { ProjectVillaTypology } from '@/lib/data/cipres-typologies';
import { saveLandingConfigAction, verifyDomainDnsAction } from '@/app/portal/admin/projects/[slug]/landing/actions';
import ProjectSalesLanding from '@/components/landing/ProjectSalesLanding';
import { createClient } from '@/lib/supabase/client';

interface LandingBuilderProps {
  project: PortalProject;
  initialConfig: ProjectLandingConfig;
  customTypologies?: Record<string, ProjectVillaTypology>;
}

type ActiveTab = 'hero' | 'gallery' | 'concept' | 'location' | 'specs' | 'editorial' | 'sections' | 'branding' | 'payment' | 'dns';
type ViewportMode = 'desktop' | 'mobile';

// Images are compressed and placed in Storage before the landing configuration is saved.
// The configuration therefore contains small, durable URLs instead of base64 file contents.
async function compressImageFile(file: File, maxWidth = 1600, quality = 0.78): Promise<File> {
  if (file.type === 'image/svg+xml') return file;

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new window.Image();

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`No se pudo procesar ${file.name}.`));
    };

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(1, maxWidth / img.width);
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');

      if (!context) {
        resolve(file);
        return;
      }

      context.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error(`No se pudo comprimir ${file.name}.`));
            return;
          }
          resolve(new File([blob], `${file.name.replace(/\.[^.]+$/, '') || 'imagen'}.jpg`, { type: 'image/jpeg' }));
        },
        'image/jpeg',
        quality
      );
    };

    img.src = objectUrl;
  });
}

export default function LandingBuilder({ project, initialConfig, customTypologies }: LandingBuilderProps) {
  const [config, setConfig] = useState<ProjectLandingConfig>(() => ({ ...initialConfig }));

  const [activeTab, setActiveTab] = useState<ActiveTab>('hero');
  const [viewportMode, setViewportMode] = useState<ViewportMode>('desktop');
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const galleryFileInputRef = useRef<HTMLInputElement | null>(null);
  const mapFileInputRef = useRef<HTMLInputElement | null>(null);

  // User-managed Image Pool state: if customGallery is already saved, prioritize it completely
  const [imagePool, setImagePool] = useState<string[]>(() => {
    if (initialConfig.customGallery && initialConfig.customGallery.length > 0) {
      return initialConfig.customGallery;
    }
    const galleryUrls = project.gallery || [];
    const initialUrl = initialConfig.theme.heroMediaUrl;
    const combined = initialUrl ? [initialUrl, ...galleryUrls] : galleryUrls;
    return Array.from(new Set(combined.filter((u) => u && !u.includes('whrimmszdeghblbktivp.supabase.co'))));
  });

  const [customUrlInput, setCustomUrlInput] = useState('');

  const uploadLandingImage = async (
    file: File,
    target: 'hero' | 'gallery' | 'map' | 'compactLogo' | 'footerLogo'
  ): Promise<string> => {
    const optimizedFile = await compressImageFile(file);
    const extension = optimizedFile.type === 'image/svg+xml' ? 'svg' : 'jpg';
    const storagePath = `ob-brokers-team/projects/${project.slug}/landing/${target}-${crypto.randomUUID()}.${extension}`;
    const supabase = createClient();
    const { error: uploadError } = await supabase.storage
      .from('public-assets')
      .upload(storagePath, optimizedFile, {
        cacheControl: '3600',
        contentType: optimizedFile.type || 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`No se pudo subir ${file.name}: ${uploadError.message}`);
    }

    return supabase.storage.from('public-assets').getPublicUrl(storagePath).data.publicUrl;
  };

  // Files are uploaded first. The saved landing config only keeps their public URL.
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'hero' | 'gallery' | 'map' | 'compactLogo' | 'footerLogo') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const uploadedUrl = await uploadLandingImage(file, target);

        if (target === 'map') {
          setConfig((c) => ({ ...c, locationMapUrl: uploadedUrl }));
        } else if (target === 'compactLogo') {
          setConfig((c) => ({ ...c, navbarLogoUrl: uploadedUrl }));
        } else if (target === 'footerLogo') {
          setConfig((c) => ({ ...c, navbarLogoTextUrl: uploadedUrl }));
        } else {
          setImagePool((prev) => [uploadedUrl, ...prev]);

          if (target === 'hero') {
            setConfig((c) => ({
              ...c,
              heroSlides: [uploadedUrl, ...(c.heroSlides || [])],
              theme: { ...c.theme, heroMediaUrl: uploadedUrl },
            }));
          } else {
            setConfig((c) => ({
              ...c,
              customGallery: [uploadedUrl, ...(c.customGallery || imagePool)],
            }));
          }
        }
      }
    } catch (err) {
      console.error('Error compressing image:', err);
      setSaveStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'No se pudo subir la imagen.',
      });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrlInput.trim()) return;
    const url = customUrlInput.trim();
    setImagePool((prev) => [url, ...prev]);
    setConfig((c) => ({
      ...c,
      customGallery: [url, ...(c.customGallery || imagePool)],
    }));
    setCustomUrlInput('');
  };

  const handleDeleteImage = (urlToDelete: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setImagePool((prev) => {
      const next = prev.filter((u) => u !== urlToDelete);
      setConfig((c) => ({
        ...c,
        heroSlides: (c.heroSlides || []).filter((u) => u !== urlToDelete),
        customGallery: next,
        theme:
          c.theme.heroMediaUrl === urlToDelete
            ? {
                ...c.theme,
                heroMediaUrl: next[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
              }
            : c.theme,
      }));
      return next;
    });
  };

  const toggleHeroSlide = (url: string) => {
    const currentSlides = config.heroSlides || [];
    const exists = currentSlides.includes(url);
    const next = exists ? currentSlides.filter((u) => u !== url) : [...currentSlides, url];
    setConfig((prev) => ({
      ...prev,
      heroSlides: next.length > 0 ? next : [url],
      theme: { ...prev.theme, heroMediaUrl: next[0] || url },
    }));
  };

  // DNS check state
  const [dnsChecking, setDnsChecking] = useState(false);
  const [dnsResult, setDnsResult] = useState<{ verified: boolean; message: string } | null>(null);

  // Editorial Content Handlers: Línea Blanca & Rentabilidad
  const handleToggleUnitDetail = () => {
    setConfig((prev) => {
      if (prev.unitDetail && (prev.unitDetail.includedEquipment?.length ?? 0) > 0) {
        return { ...prev, unitDetail: undefined };
      }
      return {
        ...prev,
        unitDetail: {
          includedEquipment: ['Nevera', 'Estufa eléctrica', 'Extractor', 'Lavadora-secadora', 'Aires acondicionados'],
          qualificationText: 'CONFOTUR aprobado (exento de impuestos)',
        },
      };
    });
  };

  const handleEquipmentChange = (idx: number, val: string) => {
    setConfig((prev) => {
      const eq = [...(prev.unitDetail?.includedEquipment || [])];
      eq[idx] = val;
      return {
        ...prev,
        unitDetail: {
          includedEquipment: eq,
          qualificationText: prev.unitDetail?.qualificationText,
        },
      };
    });
  };

  const handleEquipmentAdd = () => {
    setConfig((prev) => {
      const eq = [...(prev.unitDetail?.includedEquipment || []), ''];
      return {
        ...prev,
        unitDetail: {
          includedEquipment: eq,
          qualificationText: prev.unitDetail?.qualificationText,
        },
      };
    });
  };

  const handleEquipmentRemove = (idx: number) => {
    setConfig((prev) => {
      const eq = (prev.unitDetail?.includedEquipment || []).filter((_, i) => i !== idx);
      return {
        ...prev,
        unitDetail: {
          includedEquipment: eq,
          qualificationText: prev.unitDetail?.qualificationText,
        },
      };
    });
  };

  const handleEquipmentMove = (fromIdx: number, toIdx: number) => {
    setConfig((prev) => {
      const eq = [...(prev.unitDetail?.includedEquipment || [])];
      if (toIdx < 0 || toIdx >= eq.length) return prev;
      const [moved] = eq.splice(fromIdx, 1);
      eq.splice(toIdx, 0, moved);
      return {
        ...prev,
        unitDetail: {
          includedEquipment: eq,
          qualificationText: prev.unitDetail?.qualificationText,
        },
      };
    });
  };

  const handleQualificationTextChange = (val: string) => {
    setConfig((prev) => ({
      ...prev,
      unitDetail: {
        includedEquipment: prev.unitDetail?.includedEquipment || [],
        qualificationText: val,
      },
    }));
  };

  const handleToggleProfitability = () => {
    setConfig((prev) => {
      const nextActive = !(prev.profitability?.enabled && (prev.visibility.profitability !== false));
      return {
        ...prev,
        visibility: {
          ...prev.visibility,
          profitability: nextActive,
        },
        profitability: nextActive
          ? prev.profitability
            ? { ...prev.profitability, enabled: true }
            : {
                enabled: true,
                title: 'Rentabilidad estimada del proyecto',
                introduction: `Proyecciones oficiales de ocupación y tarifas de mercado para las tipologías de ${project.name}, bajo un escenario de ocupación estimada del 70% (255 noches por año).`,
                source: `Proyección comercial de ${project.name} basada en ocupación y tarifas de mercado.`,
                disclaimer: 'Las tarifas promedio pueden variar según operador, acuerdos de servicio y condiciones del mercado. Esta información no constituye una garantía de rentabilidad.',
                items: [
                  {
                    label: '1 habitación',
                    roi: '10.02% ROI',
                    description: 'Con un precio promedio estimado y tarifa de mercado, genera un retorno atractivo tras costos operativos.',
                  },
                  {
                    label: '2 habitaciones',
                    roi: '8.65% ROI',
                    description: 'Equilibrio óptimo entre plusvalía de capital y renta vacacional.',
                  },
                ],
              }
          : prev.profitability
          ? { ...prev.profitability, enabled: false }
          : undefined,
      };
    });
  };

  const handleProfitabilityFieldChange = (
    field: 'title' | 'introduction' | 'source' | 'disclaimer',
    val: string
  ) => {
    setConfig((prev) => ({
      ...prev,
      profitability: {
        enabled: prev.profitability?.enabled ?? true,
        title: prev.profitability?.title || 'Rentabilidad estimada del proyecto',
        introduction: prev.profitability?.introduction || '',
        source: prev.profitability?.source || '',
        disclaimer: prev.profitability?.disclaimer || '',
        items: prev.profitability?.items || [],
        [field]: val,
      },
    }));
  };

  const handleProfitabilityItemChange = (
    idx: number,
    patch: Partial<LandingProfitabilityItem>
  ) => {
    setConfig((prev) => {
      const items = [...(prev.profitability?.items || [])];
      items[idx] = { ...items[idx], ...patch };
      return {
        ...prev,
        profitability: {
          enabled: prev.profitability?.enabled ?? true,
          title: prev.profitability?.title || 'Rentabilidad estimada del proyecto',
          introduction: prev.profitability?.introduction || '',
          source: prev.profitability?.source || '',
          disclaimer: prev.profitability?.disclaimer || '',
          items,
        },
      };
    });
  };

  const handleProfitabilityItemAdd = () => {
    setConfig((prev) => {
      const items = [
        ...(prev.profitability?.items || []),
        { label: '', roi: '', description: '' },
      ];
      return {
        ...prev,
        profitability: {
          enabled: prev.profitability?.enabled ?? true,
          title: prev.profitability?.title || 'Rentabilidad estimada del proyecto',
          introduction: prev.profitability?.introduction || '',
          source: prev.profitability?.source || '',
          disclaimer: prev.profitability?.disclaimer || '',
          items,
        },
      };
    });
  };

  const handleProfitabilityItemRemove = (idx: number) => {
    setConfig((prev) => {
      const items = (prev.profitability?.items || []).filter((_, i) => i !== idx);
      return {
        ...prev,
        profitability: {
          enabled: prev.profitability?.enabled ?? true,
          title: prev.profitability?.title || 'Rentabilidad estimada del proyecto',
          introduction: prev.profitability?.introduction || '',
          source: prev.profitability?.source || '',
          disclaimer: prev.profitability?.disclaimer || '',
          items,
        },
      };
    });
  };

  const handleProfitabilityItemMove = (fromIdx: number, toIdx: number) => {
    setConfig((prev) => {
      const items = [...(prev.profitability?.items || [])];
      if (toIdx < 0 || toIdx >= items.length) return prev;
      const [moved] = items.splice(fromIdx, 1);
      items.splice(toIdx, 0, moved);
      return {
        ...prev,
        profitability: {
          enabled: prev.profitability?.enabled ?? true,
          title: prev.profitability?.title || 'Rentabilidad estimada del proyecto',
          introduction: prev.profitability?.introduction || '',
          source: prev.profitability?.source || '',
          disclaimer: prev.profitability?.disclaimer || '',
          items,
        },
      };
    });
  };

  function validateEditorialConfig(c: ProjectLandingConfig): string | null {
    if (c.profitability?.enabled) {
      if (!c.profitability.title?.trim()) {
        return 'El título de la sección de rentabilidad no puede estar vacío.';
      }
      if (c.profitability.title.length > 120) {
        return 'El título de rentabilidad no debe superar los 120 caracteres.';
      }
      if (c.profitability.introduction && c.profitability.introduction.length > 500) {
        return 'La introducción de rentabilidad no debe superar los 500 caracteres.';
      }
      const validItems = (c.profitability.items || []).filter(
        (it) => it.label?.trim() || it.roi?.trim()
      );
      if (validItems.length === 0) {
        return 'Debes incluir al menos un escenario de tipología con etiqueta y ROI en la sección de rentabilidad.';
      }
      for (const [idx, item] of (c.profitability.items || []).entries()) {
        if (!item.label?.trim()) {
          return `El escenario #${idx + 1} de rentabilidad requiere una etiqueta o tipología.`;
        }
        if (!item.roi?.trim()) {
          return `El escenario "${item.label}" requiere un porcentaje o valor de ROI.`;
        }
        if (item.description && item.description.length > 400) {
          return `La descripción del escenario "${item.label}" no debe superar los 400 caracteres.`;
        }
      }
      if (c.profitability.source && c.profitability.source.length > 250) {
        return 'La fuente de rentabilidad no debe superar los 250 caracteres.';
      }
      if (c.profitability.disclaimer && c.profitability.disclaimer.length > 500) {
        return 'El descargo legal no debe superar los 500 caracteres.';
      }
    }

    if (c.unitDetail) {
      const validEquipment = (c.unitDetail.includedEquipment || []).filter((e) => e?.trim());
      if (c.unitDetail.includedEquipment?.length > 0 && validEquipment.length === 0) {
        return 'Debes incluir al menos un elemento de equipamiento no vacío en la línea blanca o desactivarla.';
      }
      for (const item of validEquipment) {
        if (item.length > 80) {
          return `El elemento "${item.slice(0, 30)}..." no debe superar los 80 caracteres.`;
        }
      }
      if (c.unitDetail.qualificationText && c.unitDetail.qualificationText.length > 100) {
        return 'El texto de calificación de línea blanca no debe superar los 100 caracteres.';
      }
    }

    return null;
  }

  const handleSave = () => {
    const errorMsg = validateEditorialConfig(config);
    if (errorMsg) {
      setSaveStatus({ type: 'error', message: errorMsg });
      return;
    }

    // Prepare cleaned payload
    const payload: ProjectLandingConfig = {
      ...config,
      unitDetail: config.unitDetail
        ? {
            includedEquipment: (config.unitDetail.includedEquipment || [])
              .map((e) => e.trim())
              .filter(Boolean),
            qualificationText: config.unitDetail.qualificationText?.trim() || undefined,
          }
        : undefined,
      profitability: config.profitability?.enabled
        ? {
            ...config.profitability,
            title: config.profitability.title.trim(),
            introduction: config.profitability.introduction.trim(),
            source: config.profitability.source.trim(),
            disclaimer: config.profitability.disclaimer.trim(),
            items: (config.profitability.items || [])
              .map((it) => ({
                label: it.label.trim(),
                roi: it.roi.trim(),
                description: it.description.trim(),
              }))
              .filter((it) => it.label && it.roi),
          }
        : undefined,
    };

    if (payload.unitDetail && payload.unitDetail.includedEquipment.length === 0) {
      delete payload.unitDetail;
    }
    if (payload.profitability && payload.profitability.items.length === 0) {
      delete payload.profitability;
    }

    startTransition(async () => {
      setSaveStatus(null);
      try {
        const res = await saveLandingConfigAction(project.id, payload);
        if (res.success) {
          setSaveStatus({ type: 'success', message: '¡Landing page guardada y publicada exitosamente!' });
          setTimeout(() => setSaveStatus(null), 4000);
        } else {
          setSaveStatus({ type: 'error', message: res.error || 'Error al guardar la configuración.' });
        }
      } catch (err) {
        setSaveStatus({
          type: 'error',
          message: err instanceof Error ? err.message : 'No se pudo guardar la configuración. Inténtalo de nuevo.',
        });
      }
    });
  };

  const handleCheckDns = async () => {
    if (!config.dns.customDomain) return;
    setDnsChecking(true);
    setDnsResult(null);

    const res = await verifyDomainDnsAction(config.dns.customDomain);
    setDnsResult(res);
    setDnsChecking(false);

    if (res.verified) {
      setConfig((prev) => ({
        ...prev,
        dns: { ...prev.dns, isVerified: true, verifiedAt: new Date().toISOString() },
      }));
    }
  };

  const colorPresets = [
    { name: 'Azul Royal', hex: '#2563eb' },
    { name: 'Esmeralda Natural', hex: '#059669' },
    { name: 'Oro Caribeño', hex: '#d97706' },
    { name: 'Púrpura Imperial', hex: '#7c3aed' },
    { name: 'Rosa Coral', hex: '#e11d48' },
  ];

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* TOP NAVBAR */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-slate-900/90 px-4 sm:px-6 backdrop-blur">
        <div className="flex items-center gap-3">
          <Link
            href="/portal/admin/projects"
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span><LocalizedText text={"Volver a Proyectos"} /></span>
          </Link>

          <div className="h-4 w-px bg-white/10" />

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-white">{project.name}</span>
              <span className="rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-black px-2 py-0.5 border border-blue-500/30"><LocalizedText text={"Diseñador de Landing"} /></span>
            </div>
            <span className="text-[10px] text-slate-400"><LocalizedText text={"Personaliza el diseño comercial, galería y el dominio propio del proyecto"} /></span>
          </div>
        </div>

        {/* Center Viewport Switcher */}
        <div className="hidden sm:flex items-center rounded-xl bg-slate-950 p-1 border border-white/10">
          <button
            type="button"
            onClick={() => setViewportMode('desktop')}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition cursor-pointer',
              viewportMode === 'desktop' ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <Laptop className="h-3.5 w-3.5" />
            <span><LocalizedText text={"Escritorio"} /></span>
          </button>
          <button
            type="button"
            onClick={() => setViewportMode('mobile')}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition cursor-pointer',
              viewportMode === 'mobile' ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-slate-200'
            )}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span><LocalizedText text={"Móvil"} /></span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <Link
            href={`/proyectos/${project.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 hover:text-white transition"
          >
            <span><LocalizedText text={"Ver Landing en Vivo"} /></span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>

          <button
            type="button"
            disabled={isPending || isUploading}
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {isPending ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            <span>{isPending ? 'Guardando...' : 'Publicar Landing'}</span>
          </button>
        </div>
      </header>

      {/* FEEDBACK BANNER */}
      {saveStatus && (
        <div
          className={cn(
            'flex items-center justify-between px-6 py-2.5 text-xs font-bold transition',
            saveStatus.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-rose-600 text-white'
          )}
        >
          <span>{saveStatus.message}</span>
          <button type="button" onClick={() => setSaveStatus(null)} className="underline"><LocalizedText text={"Cerrar"} /></button>
        </div>
      )}

      {/* MAIN SPLIT VIEW (CONTROLS LEFT, PREVIEW RIGHT) */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT SIDEBAR: ACCORDION CONTROLS */}
        <aside className="w-full sm:w-[420px] shrink-0 border-r border-white/10 bg-slate-900/95 overflow-y-auto p-4 sm:p-5 space-y-6">
          {/* Navigation Tabs */}
          <div className="grid grid-cols-3 gap-1 rounded-2xl bg-slate-950 p-1 border border-white/5 text-[9px] font-extrabold text-center">
            <button
              type="button"
              onClick={() => setActiveTab('hero')}
              className={cn(
                'rounded-xl py-2 transition cursor-pointer',
                activeTab === 'hero' ? 'bg-blue-600 text-white shadow-xs' : 'text-white/75 hover:text-white'
              )}
            ><LocalizedText text={"Carrusel Hero"} /></button>
            <button
              type="button"
              onClick={() => setActiveTab('gallery')}
              className={cn(
                'rounded-xl py-2 transition cursor-pointer',
                activeTab === 'gallery' ? 'bg-blue-600 text-white shadow-xs' : 'text-white/75 hover:text-white'
              )}
            ><LocalizedText text={"Galería"} /></button>
            <button
              type="button"
              onClick={() => setActiveTab('location')}
              className={cn(
                'rounded-xl py-2 transition cursor-pointer',
                activeTab === 'location' ? 'bg-blue-600 text-white shadow-xs' : 'text-white/75 hover:text-white'
              )}
            ><LocalizedText text={"Ubicación"} /></button>
            <button
              type="button"
              onClick={() => setActiveTab('specs')}
              className={cn(
                'rounded-xl py-2 transition cursor-pointer',
                activeTab === 'specs' ? 'bg-blue-600 text-white shadow-xs' : 'text-white/75 hover:text-white'
              )}
            ><LocalizedText text={"Especificaciones"} /></button>
            <button
              type="button"
              onClick={() => setActiveTab('concept')}
              className={cn(
                'rounded-xl py-2 transition cursor-pointer',
                activeTab === 'concept' ? 'bg-blue-600 text-white shadow-xs' : 'text-white/75 hover:text-white'
              )}
            ><LocalizedText text={"Bento"} /></button>
            <button
              type="button"
              onClick={() => setActiveTab('editorial')}
              className={cn(
                'rounded-xl py-2 transition cursor-pointer',
                activeTab === 'editorial' ? 'bg-blue-600 text-white shadow-xs' : 'text-white/75 hover:text-white'
              )}
            ><LocalizedText text={"Editorial"} /></button>
            <button
              type="button"
              onClick={() => setActiveTab('sections')}
              className={cn(
                'rounded-xl py-2 transition cursor-pointer',
                activeTab === 'sections' ? 'bg-blue-600 text-white shadow-xs' : 'text-white/75 hover:text-white'
              )}
            ><LocalizedText text={"Bloques"} /></button>
            <button
              type="button"
              onClick={() => setActiveTab('branding')}
              className={cn(
                'rounded-xl py-2 transition cursor-pointer',
                activeTab === 'branding' ? 'bg-blue-600 text-white shadow-xs' : 'text-white/75 hover:text-white'
              )}
            ><LocalizedText text={"Estilo"} /></button>
            <button
              type="button"
              onClick={() => setActiveTab('payment')}
              className={cn(
                'rounded-xl py-2 transition cursor-pointer',
                activeTab === 'payment' ? 'bg-blue-600 text-white shadow-xs' : 'text-white/75 hover:text-white'
              )}
            ><LocalizedText text={"Planes"} /></button>
            <button
              type="button"
              onClick={() => setActiveTab('dns')}
              className={cn(
                'rounded-xl py-2 transition cursor-pointer',
                activeTab === 'dns' ? 'bg-blue-600 text-white shadow-xs' : 'text-white/75 hover:text-white'
              )}
            ><LocalizedText text={"DNS"} /></button>
          </div>

          {/* TAB 1: HERO SETTINGS (CARRUSEL INICIAL INDEPENDIENTE) */}
          {activeTab === 'hero' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="border-b border-white/10 pb-2">
                <h3 className="text-sm font-black text-white"><LocalizedText text={"Carrusel de Portada (Hero)"} /></h3>
                <p className="text-[11px] text-slate-400"><LocalizedText text={"Selecciona qué fotos rotarán en el carrusel de inicio. (Actualmente "} />{(config.heroSlides || []).length}<LocalizedText text={" activas)."} /></p>
              </div>

              {/* VISUAL IMAGE SELECTOR & UPLOADER */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5 text-blue-400" />
                    <span><LocalizedText text={"Fotos para el Carrusel de Inicio"} /></span>
                  </label>
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-300 hover:text-white bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg shadow-sm transition cursor-pointer"
                  >
                    <UploadCloud className="h-3.5 w-3.5" />
                    <span>{isUploading ? 'Comprimiendo...' : 'Subir Foto'}</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileUpload(e, 'hero')}
                    className="hidden"
                  />
                </div>

                {/* Thumbnail Grid with Checkbox Toggle */}
                <div className="grid grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
                  {imagePool.map((imgUrl, i) => {
                    const isInHero = (config.heroSlides || []).includes(imgUrl);
                    return (
                      <div
                        key={i}
                        onClick={() => toggleHeroSlide(imgUrl)}
                        className={cn(
                          'group relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition cursor-pointer bg-slate-900 select-none',
                          isInHero
                            ? 'border-emerald-500 ring-2 ring-emerald-500/50 shadow-md'
                            : 'border-white/10 opacity-50 hover:opacity-90'
                        )}
                      >
                        <img src={imgUrl} alt={`Miniatura ${i + 1}`} className="h-full w-full object-cover" />

                        {/* Top Indicator */}
                        <div className="absolute top-1 left-1">
                          <span
                            className={cn(
                              'text-[8px] font-mono px-1.5 py-0.5 rounded font-bold shadow',
                              isInHero ? 'bg-emerald-600 text-white' : 'bg-slate-950/80 text-white/75'
                            )}
                          >
                            {isInHero ? 'En Carrusel' : 'No incluido'}
                          </span>
                        </div>

                        {/* Delete Button on Hover */}
                        <UITranslationBoundary attributes={["title"]}><button
                          type="button"
                          title="Eliminar imagen"
                          onClick={(e) => handleDeleteImage(imgUrl, e)}
                          className="absolute top-1 right-1 h-5 w-5 rounded-full bg-rose-600 text-white opacity-0 group-hover:opacity-100 hover:bg-rose-500 flex items-center justify-center transition shadow cursor-pointer z-10"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button></UITranslationBoundary>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1"><LocalizedText text={"Titular Principal"} /></label>
                <UITranslationBoundary attributes={["placeholder"]}><input
                  value={config.hero.headline}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      hero: { ...prev.hero, headline: e.target.value },
                    }))
                  }
                  placeholder="Cipres Residences: Exquisite Living, Elevated."
                  className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-xs text-white outline-none focus:border-blue-500"
                /></UITranslationBoundary>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1"><LocalizedText text={"Subtítulo Persuasivo"} /></label>
                <textarea
                  rows={3}
                  value={config.hero.subheadline}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      hero: { ...prev.hero, subheadline: e.target.value },
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* TAB 2: GALLERY MANAGER (GALERÍA OFICIAL) */}
          {activeTab === 'gallery' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="border-b border-white/10 pb-2">
                <h3 className="text-sm font-black text-white"><LocalizedText text={"Galería de Fotos &amp; Renders"} /></h3>
                <p className="text-[11px] text-slate-400"><LocalizedText text={"Administra las fotos que se muestran en la sección “Galería &amp; Renders”."} /></p>
              </div>

              {/* Upload Controls */}
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => galleryFileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition cursor-pointer shadow-md shadow-blue-600/20"
                >
                  <UploadCloud className="h-4 w-4" />
                  <span>{isUploading ? 'Comprimiendo fotos...' : <LocalizedText text={"Subir Fotos a la Galería"} />}</span>
                </button>
                <input
                  ref={galleryFileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileUpload(e, 'gallery')}
                  className="hidden"
                />
              </div>

              {/* Add image by URL */}
              <form onSubmit={handleAddUrl} className="flex gap-2">
                <UITranslationBoundary attributes={["placeholder"]}><input
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  placeholder="O pega una URL de imagen (https://...)"
                  className="h-9 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 text-xs text-white outline-none focus:border-blue-500"
                /></UITranslationBoundary>
                <button
                  type="submit"
                  className="px-3 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition cursor-pointer"
                ><LocalizedText text={"Agregar"} /></button>
              </form>

              {/* Gallery Photos Grid */}
              <div className="space-y-3">
                <span className="text-xs font-mono uppercase tracking-widest text-slate-400 block"><LocalizedText text={"Fotos en Galería ("} />{imagePool.length})
                </span>

                <div className="grid grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
                  {imagePool.map((url, idx) => (
                    <div
                      key={idx}
                      className="group relative aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 bg-slate-900 shadow-sm"
                    >
                      <img src={url} alt={`Foto ${idx + 1}`} className="h-full w-full object-cover" />

                      {/* Delete Action */}
                      <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition flex items-center justify-center p-2.5">
                        <UITranslationBoundary attributes={["title"]}><button
                          type="button"
                          title="Eliminar foto"
                          onClick={(e) => handleDeleteImage(url, e)}
                          className="h-9 w-9 rounded-full bg-rose-600 text-white flex items-center justify-center hover:bg-rose-500 transition cursor-pointer shadow-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button></UITranslationBoundary>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LOCATION & MAP SETTINGS */}
          {activeTab === 'location' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="border-b border-white/10 pb-2">
                <h3 className="text-sm font-black text-white"><LocalizedText text={"Ubicación &amp; Mapa Aéreo"} /></h3>
                <p className="text-[11px] text-slate-400"><LocalizedText text={"Configura la imagen aérea y mapa de conectividad del proyecto."} /></p>
              </div>

              {/* Current Location Map Preview */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                  <span><LocalizedText text={"Mapa Satelital Activo"} /></span>
                </label>

                <div className="relative aspect-[16/9] rounded-xl overflow-hidden border border-white/10 bg-slate-900">
                  {config.locationMapUrl || (project.slug === 'elements' ? '/images/projects/elements/master-plan-3d.jpg' : (project.slug === 'cipres-residences' ? '/projects/cipres-residences/mapa_ubicacion.jpg' : null)) ? (
                    <UITranslationBoundary attributes={["alt"]}><img
                      src={
                        config.locationMapUrl ||
                        (project.slug === 'elements'
                          ? '/images/projects/elements/master-plan-3d.jpg'
                          : project.slug === 'cipres-residences'
                          ? '/projects/cipres-residences/mapa_ubicacion.jpg'
                          : '')
                      }
                      alt="Mapa Ubicacion"
                      className="h-full w-full object-cover"
                    /></UITranslationBoundary>
                  ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center text-slate-500 gap-2 p-4 text-center">
                      <MapPin className="h-8 w-8 text-slate-600" />
                      <p className="text-xs"><LocalizedText text={"No hay mapa asignado a este proyecto."} /></p>
                      <p className="text-[10px] text-slate-600"><LocalizedText text={"Sube una imagen o plano de ubicación con el botón inferior."} /></p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => mapFileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition cursor-pointer"
                  >
                    <UploadCloud className="h-3.5 w-3.5" />
                    <span><LocalizedText text={"Cambiar Mapa / Imagen"} /></span>
                  </button>
                  <input
                    ref={mapFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'map')}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CONCEPT SETTINGS */}
          {activeTab === 'concept' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="border-b border-white/10 pb-2">
                <h3 className="text-sm font-black text-white"><LocalizedText text={"Concepto del Proyecto"} /></h3>
                <p className="text-[11px] text-slate-400"><LocalizedText text={"Personaliza el titular y el texto comercial de esta sección."} /></p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1"><LocalizedText text={"Titular de la Sección"} /></label>
                <UITranslationBoundary attributes={["placeholder"]}><textarea
                  rows={2}
                  value={config.concept.title}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      concept: { ...prev.concept, title: e.target.value },
                    }))
                  }
                  placeholder="Respaldado por constructores y propietarios..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white outline-none focus:border-blue-500"
                /></UITranslationBoundary>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1"><LocalizedText text={"Descripción / Párrafo"} /></label>
                <UITranslationBoundary attributes={["placeholder"]}><textarea
                  rows={3}
                  value={config.concept.description}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      concept: { ...prev.concept, description: e.target.value },
                    }))
                  }
                  placeholder="Un desarrollo concebido para maximizar..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white outline-none focus:border-blue-500"
                /></UITranslationBoundary>
              </div>

            </div>
          )}

          {activeTab === 'specs' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-white/10 pb-2">
                <h3 className="text-sm font-black text-white"><LocalizedText text={"04 / Especificaciones Técnicas"} /></h3>
                <p className="text-[11px] text-slate-400"><LocalizedText text={"Edita el contenido y selecciona hasta 5 imágenes para acompañar la Memoria de Calidades."} /></p>
              </div>
              <div className="space-y-3">
                {[
                  ['specsEyebrow', 'Etiqueta de sección', '04 / Especificaciones Técnicas'],
                  ['specsTitle', 'Título de sección', 'Memoria de Calidades & Acabados.'],
                  ['specsSubtitle', 'Descripción de sección', 'Memoria técnica y terminaciones del proyecto.'],
                ].map(([key, label, placeholder]) => (
                  <label key={key} className="block text-[11px] font-bold text-slate-300">
                    {label}
                    {key === 'specsSubtitle' ? (
                      <textarea rows={2} value={String(config[key as 'specsEyebrow' | 'specsTitle' | 'specsSubtitle'] || '')} onChange={(e) => setConfig((prev) => ({ ...prev, [key]: e.target.value }))} placeholder={placeholder} className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-xs font-normal text-white outline-none focus:border-blue-500" />
                    ) : (
                      <input value={String(config[key as 'specsEyebrow' | 'specsTitle' | 'specsSubtitle'] || '')} onChange={(e) => setConfig((prev) => ({ ...prev, [key]: e.target.value }))} placeholder={placeholder} className="mt-1 h-9 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-normal text-white outline-none focus:border-blue-500" />
                    )}
                  </label>
                ))}
              </div>
              <div className="space-y-3">
                <p className="text-[11px] font-bold text-slate-300"><LocalizedText text={"Tarjetas de especificaciones"} /></p>
                {(config.specs || []).map((item, index) => (
                  <div key={index} className="space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
                    <UITranslationBoundary attributes={["placeholder"]}><input value={item.title} onChange={(e) => setConfig((prev) => ({ ...prev, specs: (prev.specs || []).map((spec, i) => i === index ? { ...spec, title: e.target.value } : spec) }))} placeholder="Título" className="h-9 w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 text-xs text-white outline-none focus:border-blue-500" /></UITranslationBoundary>
                    <UITranslationBoundary attributes={["placeholder"]}><textarea rows={2} value={item.description} onChange={(e) => setConfig((prev) => ({ ...prev, specs: (prev.specs || []).map((spec, i) => i === index ? { ...spec, description: e.target.value } : spec) }))} placeholder="Descripción" className="w-full rounded-lg border border-white/10 bg-slate-950/60 p-3 text-xs text-white outline-none focus:border-blue-500" /></UITranslationBoundary>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {imagePool.map((url) => {
                  const selected = (config.specImages || []).includes(url);
                  return (
                    <button
                      key={url}
                      type="button"
                      onClick={() => setConfig((prev) => {
                        const current = prev.specImages || [];
                        if (selected) return { ...prev, specImages: current.filter((item) => item !== url) };
                        if (current.length >= 5) return prev;
                        return { ...prev, specImages: [...current, url] };
                      })}
                      className={cn('relative aspect-[4/3] overflow-hidden rounded-xl border-2 transition', selected ? 'border-blue-400 ring-2 ring-blue-400/30' : 'border-white/10 opacity-80 hover:opacity-100')}
                      aria-pressed={selected}
                    >
                      <UITranslationBoundary attributes={["alt"]}><img src={url} alt="Imagen para especificaciones" className="h-full w-full object-cover" /></UITranslationBoundary>
                      <span className="absolute bottom-1 left-1 rounded bg-slate-950/80 px-1.5 py-1 text-[9px] font-bold text-white">{selected ? `Seleccionada ${(config.specImages || []).indexOf(url) + 1}` : 'Elegir'}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-400">{(config.specImages || []).length}<LocalizedText text={"/5 seleccionadas. Si no eliges ninguna, se usarán imágenes de la galería automáticamente."} /></p>
            </div>
          )}

          {/* TAB: EDITORIAL CONTENT (LÍNEA BLANCA & RENTABILIDAD) */}
          {activeTab === 'editorial' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-400" />
                  <h3 className="text-sm font-black text-white"><LocalizedText text={"Contenido Editorial de Proyecto"} /></h3>
                </div>
                <p className="mt-1 text-[11px] text-slate-400 leading-relaxed"><LocalizedText text={"Configura la línea blanca para la ficha de unidad y los escenarios de rentabilidad/ROI de este proyecto."} /></p>
              </div>

              {/* BLOQUE 1: LÍNEA BLANCA */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
                <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-8 w-8 place-items-center rounded-xl bg-blue-500/20 text-blue-400">
                      <PackageCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white"><LocalizedText text={"Línea Blanca en Ficha de Unidad"} /></h4>
                      <p className="text-[10px] text-slate-400"><LocalizedText text={"Equipamiento incluido al consultar una unidad disponible."} /></p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleUnitDetail}
                    className={cn(
                      'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                      Boolean(config.unitDetail) ? 'bg-emerald-500' : 'bg-slate-700'
                    )}
                    role="switch"
                    aria-checked={Boolean(config.unitDetail)}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
                        Boolean(config.unitDetail) ? 'translate-x-5' : 'translate-x-0'
                      )}
                    />
                  </button>
                </div>

                {Boolean(config.unitDetail) ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1"><LocalizedText text={"Texto de Calificación o Exención (Opcional)"} /></label>
                      <UITranslationBoundary attributes={["placeholder"]}><input
                        value={config.unitDetail?.qualificationText || ''}
                        onChange={(e) => handleQualificationTextChange(e.target.value)}
                        placeholder="Ej. CONFOTUR aprobado (exento de impuestos)"
                        maxLength={100}
                        className="h-9 w-full rounded-xl border border-white/10 bg-slate-900/90 px-3 text-xs text-white outline-none focus:border-blue-500"
                      /></UITranslationBoundary>
                      <span className="mt-1 block text-[10px] text-slate-400"><LocalizedText text={"Aparece como insignia destacada en la cabecera de la ficha de unidad."} /></span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-300"><LocalizedText text={"Electrodomésticos y Equipamiento ("} />{config.unitDetail?.includedEquipment?.length || 0})
                        </label>
                        <button
                          type="button"
                          onClick={handleEquipmentAdd}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 px-2 py-1 text-[10px] font-bold transition cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                          <span><LocalizedText text={"Añadir"} /></span>
                        </button>
                      </div>

                      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {(config.unitDetail?.includedEquipment || []).map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 rounded-xl border border-white/5 bg-slate-900/60 p-1.5"
                          >
                            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-white/5 text-[10px] font-mono font-bold text-slate-400">
                              {idx + 1}
                            </span>
                            <UITranslationBoundary attributes={["placeholder"]}><input
                              value={item}
                              onChange={(e) => handleEquipmentChange(idx, e.target.value)}
                              placeholder="Ej. Nevera, Extractor, Lavadora..."
                              maxLength={80}
                              className="h-8 flex-1 rounded-lg border border-transparent bg-transparent px-2 text-xs text-white outline-none focus:border-blue-500/50 focus:bg-white/5"
                            /></UITranslationBoundary>
                            <div className="flex items-center gap-0.5 shrink-0">
                              <UITranslationBoundary attributes={["title"]}><button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleEquipmentMove(idx, idx - 1)}
                                className="h-6 w-6 grid place-items-center rounded-md text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                                title="Mover arriba"
                              >
                                <ArrowUp className="h-3 w-3" />
                              </button></UITranslationBoundary>
                              <UITranslationBoundary attributes={["title"]}><button
                                type="button"
                                disabled={idx === (config.unitDetail?.includedEquipment?.length || 1) - 1}
                                onClick={() => handleEquipmentMove(idx, idx + 1)}
                                className="h-6 w-6 grid place-items-center rounded-md text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                                title="Mover abajo"
                              >
                                <ArrowDown className="h-3 w-3" />
                              </button></UITranslationBoundary>
                              <UITranslationBoundary attributes={["title"]}><button
                                type="button"
                                onClick={() => handleEquipmentRemove(idx)}
                                className="h-6 w-6 grid place-items-center rounded-md text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 cursor-pointer"
                                title="Eliminar"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button></UITranslationBoundary>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* VISTA PREVIA MINIATURA DE LÍNEA BLANCA */}
                    <div className="rounded-xl border border-white/10 bg-slate-950 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400"><LocalizedText text={"Vista previa en ficha"} /></span>
                        {config.unitDetail?.qualificationText && (
                          <span className="rounded-full border border-slate-700 bg-white/5 px-2 py-0.5 text-[8px] font-bold text-slate-300">
                            {config.unitDetail.qualificationText}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-300">
                        {(config.unitDetail?.includedEquipment || [])
                          .filter(Boolean)
                          .map((eq, i) => (
                            <div key={i} className="flex items-center gap-1.5 py-0.5">
                              <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                              <span className="truncate">{eq}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 leading-relaxed"><LocalizedText text={"La línea blanca está desactivada para este proyecto. Las fichas de unidad no reservarán espacio vacío."} /></p>
                )}
              </div>

              {/* BLOQUE 2: RENTABILIDAD & RETORNO ESTIMADO */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
                <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/20 text-emerald-400">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white"><LocalizedText text={"Sección de Rentabilidad &amp; ROI"} /></h4>
                      <p className="text-[10px] text-slate-400"><LocalizedText text={"Proyecciones de retorno y tarifas en la landing pública."} /></p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleProfitability}
                    className={cn(
                      'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
                      Boolean(config.profitability?.enabled) ? 'bg-emerald-500' : 'bg-slate-700'
                    )}
                    role="switch"
                    aria-checked={Boolean(config.profitability?.enabled)}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out',
                        Boolean(config.profitability?.enabled) ? 'translate-x-5' : 'translate-x-0'
                      )}
                    />
                  </button>
                </div>

                {Boolean(config.profitability?.enabled) ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1"><LocalizedText text={"Título de la Sección"} /></label>
                      <UITranslationBoundary attributes={["placeholder"]}><input
                        value={config.profitability?.title || ''}
                        onChange={(e) => handleProfitabilityFieldChange('title', e.target.value)}
                        placeholder="Rentabilidad estimada del proyecto"
                        maxLength={120}
                        className="h-9 w-full rounded-xl border border-white/10 bg-slate-900/90 px-3 text-xs text-white outline-none focus:border-blue-500"
                      /></UITranslationBoundary>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1"><LocalizedText text={"Texto Introductorio y Supuestos"} /></label>
                      <UITranslationBoundary attributes={["placeholder"]}><textarea
                        rows={3}
                        value={config.profitability?.introduction || ''}
                        onChange={(e) => handleProfitabilityFieldChange('introduction', e.target.value)}
                        placeholder="Proyecciones oficiales de ocupación y tarifas de mercado..."
                        maxLength={500}
                        className="w-full rounded-xl border border-white/10 bg-slate-900/90 p-2.5 text-xs text-white outline-none focus:border-blue-500 leading-relaxed"
                      /></UITranslationBoundary>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-slate-300"><LocalizedText text={"Escenarios por Tipología ("} />{config.profitability?.items?.length || 0})
                        </label>
                        <button
                          type="button"
                          onClick={handleProfitabilityItemAdd}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 px-2 py-1 text-[10px] font-bold transition cursor-pointer"
                        >
                          <Plus className="h-3 w-3" />
                          <span><LocalizedText text={"Añadir Escenario"} /></span>
                        </button>
                      </div>

                      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                        {(config.profitability?.items || []).map((item, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl border border-white/10 bg-slate-900/70 p-3 space-y-2.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono font-bold text-blue-400"><LocalizedText text={"Escenario #"} />{idx + 1}
                              </span>
                              <div className="flex items-center gap-1">
                                <UITranslationBoundary attributes={["title"]}><button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => handleProfitabilityItemMove(idx, idx - 1)}
                                  className="h-5 w-5 grid place-items-center rounded text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                                  title="Mover arriba"
                                >
                                  <ArrowUp className="h-3 w-3" />
                                </button></UITranslationBoundary>
                                <UITranslationBoundary attributes={["title"]}><button
                                  type="button"
                                  disabled={idx === (config.profitability?.items?.length || 1) - 1}
                                  onClick={() => handleProfitabilityItemMove(idx, idx + 1)}
                                  className="h-5 w-5 grid place-items-center rounded text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                                  title="Mover abajo"
                                >
                                  <ArrowDown className="h-3 w-3" />
                                </button></UITranslationBoundary>
                                <UITranslationBoundary attributes={["title"]}><button
                                  type="button"
                                  onClick={() => handleProfitabilityItemRemove(idx)}
                                  className="h-5 w-5 grid place-items-center rounded text-rose-400 hover:text-rose-300 cursor-pointer ml-1"
                                  title="Eliminar escenario"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button></UITranslationBoundary>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5"><LocalizedText text={"Tipología / Etiqueta"} /></label>
                                <UITranslationBoundary attributes={["placeholder"]}><input
                                  value={item.label}
                                  onChange={(e) =>
                                    handleProfitabilityItemChange(idx, { label: e.target.value })
                                  }
                                  placeholder="Ej. 1 habitación"
                                  maxLength={50}
                                  className="h-8 w-full rounded-lg border border-white/10 bg-slate-950 px-2.5 text-xs text-white outline-none focus:border-emerald-500"
                                /></UITranslationBoundary>
                              </div>
                              <div>
                                <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5"><LocalizedText text={"Retorno / ROI"} /></label>
                                <UITranslationBoundary attributes={["placeholder"]}><input
                                  value={item.roi}
                                  onChange={(e) =>
                                    handleProfitabilityItemChange(idx, { roi: e.target.value })
                                  }
                                  placeholder="Ej. 10.02% ROI"
                                  maxLength={30}
                                  className="h-8 w-full rounded-lg border border-white/10 bg-slate-950 px-2.5 text-xs font-bold text-emerald-400 outline-none focus:border-emerald-500"
                                /></UITranslationBoundary>
                              </div>
                            </div>

                            <div>
                              <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5"><LocalizedText text={"Desglose y Descripción Financiera"} /></label>
                              <UITranslationBoundary attributes={["placeholder"]}><textarea
                                rows={2}
                                value={item.description}
                                onChange={(e) =>
                                  handleProfitabilityItemChange(idx, { description: e.target.value })
                                }
                                placeholder="Precio estimado, tarifa diaria, ingreso bruto y neto anual..."
                                maxLength={400}
                                className="w-full rounded-lg border border-white/10 bg-slate-950 p-2 text-[11px] text-slate-300 outline-none focus:border-emerald-500 leading-relaxed"
                              /></UITranslationBoundary>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1"><LocalizedText text={"Fuente de Información"} /></label>
                      <UITranslationBoundary attributes={["placeholder"]}><input
                        value={config.profitability?.source || ''}
                        onChange={(e) => handleProfitabilityFieldChange('source', e.target.value)}
                        placeholder="Ej. Proyección comercial de Cana Rock basada en ocupación..."
                        maxLength={250}
                        className="h-9 w-full rounded-xl border border-white/10 bg-slate-900/90 px-3 text-xs text-white outline-none focus:border-blue-500"
                      /></UITranslationBoundary>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1"><LocalizedText text={"Descargo Legal (Disclaimer)"} /></label>
                      <UITranslationBoundary attributes={["placeholder"]}><textarea
                        rows={2}
                        value={config.profitability?.disclaimer || ''}
                        onChange={(e) => handleProfitabilityFieldChange('disclaimer', e.target.value)}
                        placeholder="Ej. Las tarifas promedio pueden variar... Esta información no constituye garantía."
                        maxLength={500}
                        className="w-full rounded-xl border border-white/10 bg-slate-900/90 p-2.5 text-xs text-white outline-none focus:border-blue-500 leading-relaxed"
                      /></UITranslationBoundary>
                    </div>

                    {/* VISTA PREVIA MINIATURA DE RENTABILIDAD */}
                    <div className="rounded-xl border border-white/10 bg-slate-950 p-3 space-y-2.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block"><LocalizedText text={"Vista previa en landing"} /></span>
                      <p className="text-xs font-black text-white">{config.profitability?.title}</p>
                      <div className="space-y-1.5">
                        {(config.profitability?.items || []).filter((it) => it.label).map((it, i) => (
                          <div
                            key={i}
                            className="rounded-lg border border-white/5 bg-white/[0.02] p-2 flex items-center justify-between"
                          >
                            <span className="text-[11px] font-bold text-slate-300">{it.label}</span>
                            <span
                              className="text-xs font-black text-emerald-400"
                              style={{ color: config.theme.accentColor || '#d4af37' }}
                            >
                              {it.roi}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 leading-relaxed"><LocalizedText text={"La sección de rentabilidad está desactivada para este proyecto. No se mostrará ni en la landing ni en el menú."} /></p>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: SECTIONS & VISIBILITY */}
          {activeTab === 'sections' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-white/10 pb-2">
                <h3 className="text-sm font-black text-white"><LocalizedText text={"Secciones de la Landing"} /></h3>
                <p className="text-[11px] text-slate-400"><LocalizedText text={"Activa o desactiva las secciones que deseas presentar a tus clientes."} /></p>
              </div>

              <div className="space-y-2">
                {[
                  { key: 'hero', label: 'Portada Principal (Hero)' },
                  { key: 'concept', label: 'Concepto & Bento de Credenciales' },
                  { key: 'typologies', label: 'Modelos de Villa & Planos 📐' },
                  { key: 'specs', label: 'Especificaciones Técnicas' },
                  { key: 'amenities', label: 'Master Plan & Amenidades' },
                  { key: 'location', label: 'Ubicación & Conectividad 🗺️' },
                  { key: 'availability', label: 'Tabla de Disponibilidad de Unidades' },
                  { key: 'gallery', label: 'Galería & Renders' },
                  { key: 'paymentPlan', label: 'Plan de Pagos & Financiamiento' },
                  { key: 'profitability', label: 'Rentabilidad Estimada & ROI 📈' },
                  { key: 'contactForm', label: 'Formulario de Leads & WhatsApp' },
                ].map(({ key, label }) => {
                  const isVisible =
                    key === 'profitability'
                      ? config.visibility.profitability !== false && (config.profitability?.enabled ?? false)
                      : config.visibility[key as keyof typeof config.visibility] !== false;

                  return (
                    <div
                      key={key}
                      onClick={() => {
                        const nextVal = !isVisible;
                        setConfig((prev) => ({
                          ...prev,
                          visibility: {
                            ...prev.visibility,
                            [key]: nextVal,
                          },
                          ...(key === 'profitability'
                            ? {
                                profitability: prev.profitability
                                  ? { ...prev.profitability, enabled: nextVal }
                                  : nextVal
                                  ? {
                                      enabled: true,
                                      title: 'Rentabilidad estimada del proyecto',
                                      introduction: `Proyecciones oficiales de ocupación y tarifas de mercado para las tipologías de ${project.name}.`,
                                      source: `Proyección comercial de ${project.name}.`,
                                      disclaimer:
                                        'Las tarifas promedio pueden variar según operador y condiciones del mercado. Esta información no constituye una garantía de rentabilidad.',
                                      items: [
                                        {
                                          label: '1 habitación',
                                          roi: '10.0% ROI',
                                          description: 'Escenario de retorno estimado anual.',
                                        },
                                      ],
                                    }
                                  : undefined,
                              }
                            : {}),
                        }));
                      }}
                      className={cn(
                        'flex items-center justify-between rounded-xl border p-3 cursor-pointer transition select-none',
                        isVisible
                          ? 'border-blue-500/40 bg-blue-500/10 text-white'
                          : 'border-white/5 bg-white/[0.02] text-slate-500'
                      )}
                    >
                      <span className="text-xs font-bold">{label}</span>
                      <button type="button" className="p-1">
                        {isVisible ? (
                          <Eye className="h-4 w-4 text-blue-400" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-slate-600" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 6: BRANDING & COLORS */}
          {activeTab === 'branding' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-white/10 pb-2">
                <h3 className="text-sm font-black text-white"><LocalizedText text={"Colores &amp; Identidad"} /></h3>
                <p className="text-[11px] text-slate-400"><LocalizedText text={"Alinea la estética con la identidad corporativa del desarrollo."} /></p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1"><LocalizedText text={"Experiencia de la landing"} /></label>
                <select
                  value={config.theme.experiencePreset || 'residential-villas'}
                  onChange={(event) =>
                    setConfig((prev) => ({
                      ...prev,
                      theme: {
                        ...prev.theme,
                        experiencePreset: event.target.value as 'residential-villas' | 'cana-rock-resort',
                      },
                    }))
                  }
                  className="h-10 w-full rounded-xl border border-white/10 bg-slate-900 px-3 text-xs text-white outline-none focus:border-blue-500"
                >
                  <option value="residential-villas"><LocalizedText text={"Residencial editorial"} /></option>
                  <option value="cana-rock-resort"><LocalizedText text={"Cana Rock Resort"} /></option>
                </select>
                <span className="mt-1 block text-[10px] leading-4 text-slate-400"><LocalizedText text={"Cambia la estructura pública sin alterar la información central del proyecto."} /></span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-2"><LocalizedText text={"Color de Acento Principal"} /></label>
                <div className="grid grid-cols-5 gap-2">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() =>
                        setConfig((prev) => ({
                          ...prev,
                          theme: { ...prev.theme, accentColor: preset.hex },
                        }))
                      }
                      style={{ backgroundColor: preset.hex }}
                      className={cn(
                        'h-9 rounded-xl border-2 transition cursor-pointer',
                        config.theme.accentColor === preset.hex
                          ? 'border-white scale-110 shadow-lg'
                          : 'border-transparent opacity-80 hover:opacity-100'
                      )}
                      title={preset.name}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1"><LocalizedText text={"WhatsApp Oficial para Leads"} /></label>
                <UITranslationBoundary attributes={["placeholder"]}><input
                  value={config.theme.contactWhatsapp}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      theme: { ...prev.theme, contactWhatsapp: e.target.value },
                    }))
                  }
                  placeholder="ej: 18097828828"
                  className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-xs text-white outline-none focus:border-blue-500"
                /></UITranslationBoundary>
                <span className="text-[10px] text-slate-400 mt-1 block"><LocalizedText text={"Los prospectos que envíen cotizaciones llegarán a este número (+1 809 782-8828)."} /></span>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                <div>
                  <h4 className="text-xs font-black text-white"><LocalizedText text={"Logos del Proyecto"} /></h4>
                  <p className="text-[10px] text-slate-400"><LocalizedText text={"Controla desde CRM los logos usados en la navegación y en el footer público."} /></p>
                </div>

                <UITranslationBoundary attributes={["label"]}><LogoUploadField
                  label="Isotipo / logo compacto"
                  value={config.navbarLogoUrl}
                  onChange={(event) => handleFileUpload(event, 'compactLogo')}
                /></UITranslationBoundary>
                <UITranslationBoundary attributes={["label"]}><LogoUploadField
                  label="Logo completo / footer"
                  value={config.navbarLogoTextUrl}
                  onChange={(event) => handleFileUpload(event, 'footerLogo')}
                /></UITranslationBoundary>
              </div>
            </div>
          )}

          {/* TAB 7: PAYMENT PLAN */}
          {activeTab === 'payment' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-white/10 pb-2">
                <h3 className="text-sm font-black text-white"><LocalizedText text={"Etapas del Plan de Pago"} /></h3>
                <p className="text-[11px] text-slate-400"><LocalizedText text={"Define los porcentajes y condiciones para los inversionistas."} /></p>
              </div>

              {config.paymentSteps.map((step, idx) => (
                <div key={idx} className="rounded-2xl border border-white/10 bg-white/5 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-blue-400"><LocalizedText text={"Etapa 0"} />{idx + 1}
                    </span>
                    <input
                      value={step.percentage}
                      onChange={(e) => {
                        const next = [...config.paymentSteps];
                        next[idx].percentage = e.target.value;
                        setConfig((prev) => ({ ...prev, paymentSteps: next }));
                      }}
                      className="h-7 w-24 text-right rounded-lg bg-slate-900 border border-white/10 px-2 text-xs font-black text-emerald-400 outline-none"
                    />
                  </div>

                  <input
                    value={step.title}
                    onChange={(e) => {
                      const next = [...config.paymentSteps];
                      next[idx].title = e.target.value;
                      setConfig((prev) => ({ ...prev, paymentSteps: next }));
                    }}
                    className="h-8 w-full rounded-lg bg-slate-900 border border-white/10 px-2.5 text-xs font-bold text-white outline-none"
                  />

                  <textarea
                    rows={2}
                    value={step.description}
                    onChange={(e) => {
                      const next = [...config.paymentSteps];
                      next[idx].description = e.target.value;
                      setConfig((prev) => ({ ...prev, paymentSteps: next }));
                    }}
                    className="w-full rounded-lg bg-slate-900 border border-white/10 p-2 text-[11px] text-slate-300 outline-none"
                  />
                </div>
              ))}
            </div>
          )}

          {/* TAB 8: CUSTOM DOMAIN & DNS */}
          {activeTab === 'dns' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-white/10 pb-2">
                <h3 className="text-sm font-black text-white"><LocalizedText text={"Dominio Propio (DNS)"} /></h3>
                <p className="text-[11px] text-slate-400"><LocalizedText text={"Configura el dominio exclusivo del proyecto para que no use una URL genérica."} /></p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1"><LocalizedText text={"Tu Dominio o Subdominio"} /></label>
                <UITranslationBoundary attributes={["placeholder"]}><input
                  value={config.dns.customDomain}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      dns: { ...prev.dns, customDomain: e.target.value, isVerified: false },
                    }))
                  }
                  placeholder="ej: cipresresidences.com ó ventas.miproyecto.do"
                  className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-xs text-white outline-none focus:border-blue-500"
                /></UITranslationBoundary>
              </div>

              {/* Step-by-step DNS Instructions Box */}
              <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 space-y-3">
                <h4 className="text-xs font-black text-white flex items-center gap-2">
                  <Globe className="h-4 w-4 text-blue-400" />
                  <span><LocalizedText text={"Configuración en tu Proveedor DNS"} /></span>
                </h4>
                <p className="text-[11px] text-slate-300 leading-relaxed"><LocalizedText text={"Agrega este registro en tu registrador de dominio (Cloudflare, GoDaddy, Namecheap o similar):"} /></p>

                <div className="rounded-xl bg-slate-950 p-3 text-xs font-mono space-y-1.5 border border-white/5">
                  <div className="flex justify-between">
                    <span className="text-slate-400"><LocalizedText text={"Tipo:"} /></span>
                    <span className="font-bold text-emerald-400"><LocalizedText text={"CNAME"} /></span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400"><LocalizedText text={"Host / Nombre:"} /></span>
                    <span className="font-bold text-white">
                      {config.dns.customDomain?.startsWith('ventas.')
                        ? 'ventas'
                        : config.dns.customDomain?.startsWith('www.')
                        ? 'www'
                        : '@ (o subdominio)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400"><LocalizedText text={"Destino / Valor:"} /></span>
                    <span className="font-bold text-blue-400"><LocalizedText text={"cname.vercel-dns.com"} /></span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400"><LocalizedText text={"TTL:"} /></span>
                    <span className="text-slate-300"><LocalizedText text={"Automático / 3600"} /></span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={dnsChecking || !config.dns.customDomain}
                  onClick={handleCheckDns}
                  className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-xs font-black text-white hover:bg-blue-500 disabled:opacity-50 transition cursor-pointer"
                >
                  <RefreshCw className={cn('h-3.5 w-3.5', dnsChecking && 'animate-spin')} />
                  <span>{dnsChecking ? 'Comprobando DNS...' : <LocalizedText text={"Verificar Conexión DNS"} />}</span>
                </button>

                {dnsResult && (
                  <div
                    className={cn(
                      'rounded-xl p-3 text-xs leading-relaxed border',
                      dnsResult.verified
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    )}
                  >
                    {dnsResult.message}
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>

        {/* RIGHT CANVAS: RESPONSIVE LIVE PREVIEW */}
        <main className="flex-1 overflow-y-auto bg-stone-100 p-3 sm:p-6 flex justify-center items-start">
          <div
            className={cn(
              'w-full transition-all duration-300 origin-top shadow-2xl rounded-3xl overflow-hidden border border-stone-300 bg-white',
              viewportMode === 'mobile'
                ? 'max-w-[400px] border-4 border-stone-400 rounded-[40px] my-6 ring-8 ring-stone-200/50'
                : 'max-w-full'
            )}
          >
            {/* Embedded Live Interactive Landing */}
            <ProjectSalesLanding
              project={project}
              config={config}
              brokerReferrer={null}
              isAuthenticated={true}
              customTypologies={customTypologies}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

function LogoUploadField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string | null;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div>
      <label className="text-[11px] font-bold text-slate-300 block mb-1">{label}</label>
      <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2">
        <div className="grid h-12 w-24 shrink-0 place-items-center rounded-lg bg-white px-2">
          {value ? <img src={value} alt={label} className="max-h-9 max-w-full object-contain" /> : <ImageIcon className="h-5 w-5 text-slate-400" />}
        </div>
        <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-3 text-[10px] font-extrabold text-white hover:bg-blue-500">
          <UploadCloud className="h-3.5 w-3.5" />
          {value ? 'Cambiar imagen' : 'Subir imagen'}
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onChange} className="sr-only" />
        </label>
      </div>
    </div>
  );
}
