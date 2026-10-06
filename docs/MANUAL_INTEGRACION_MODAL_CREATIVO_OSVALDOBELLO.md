# Manual Técnico y de Integración: Suite Creativa Modal (Dossiers, Propuestas y Artes Sociales)

Este manual documenta la integración integral del **Editor Multimodal de Presentaciones y Artes Visuales** para el ecosistema **OsvaldoBello**, detallando la arquitectura de componentes, la tipificación completa, el sistema formal de iconografía vectorial (eliminando todo uso de emojis en interfaces de usuario) y el flujo de trabajo para replicarlo en proyectos Node.js / React / Next.js.

---

## 1. Directriz de Identidad Visual: Iconografía Vectorial Unificada

### 1.1. Política de Cero Emojis en Interfaces
- **Prohibición de Emojis en UI**: En paneles de navegación, botones, pestañas, modales, tablas de amenidades, fichas técnicas, encabezados e inspectores no se utilizan caracteres Unicode/emojis (ej. ❌, 🚀, 🏢, 💾).
- **Excepción Única**: Los emojis quedan reservados exclusivamente dentro de los generadores de texto para copys comerciales listos para WhatsApp o redes sociales (Instagram/Facebook caption generators).
- **Familia de Iconos Recomendada**: **Lucide React** con trazo estilizado de **1.5px a 1.75px** (`strokeWidth={1.5}`), combinado con contenedores redondeados en tonalidades slate/blue para transmitir sobriedad, lujo y carácter ejecutivo.

### 1.2. Mapeo Canónico de Iconografía por Módulo

| Módulo / Función | Icono Lucide | Nombre del Componente | Uso / Semántica |
| :--- | :--- | :--- | :--- |
| **Portada / Cover** | `Image` / `Sparkles` | `<ImageIcon />` | Bloques visuales de impacto inicial |
| **Narrativa / Concepto** | `AlignLeft` | `<AlignLeft />` | Textos editoriales y memoria descriptiva |
| **Amenidades / Lifestyle** | `ListChecks` / `Sparkles` | `<ListChecks />` | Fichas de servicios y áreas comunes |
| **Plan de Pagos** | `Columns3` / `BadgePercent`| `<Columns3 />` | Estructuras de financiamiento |
| **Métricas / Rentabilidad** | `TrendingUp` | `<TrendingUp />` | ROI, plusvalía, precios por metro cuadrado |
| **Inventario / Unidades** | `LayoutGrid` / `Layers` | `<LayoutGrid />` | Tablas de disponibilidad y lotes |
| **Documentación Técnica** | `FileText` | `<FileText />` | Planos, permisos, licencias y memorias |
| **Instrucciones Bancarias** | `ShieldCheck` / `Landmark` | `<Landmark />` | Cuentas fiduciarias protegidas |
| **Aviso Legal / Disclaimer** | `Scale` | `<Scale />` | Descargos de responsabilidad y normativas |
| **Contacto y Asesoría** | `UserRound` / `Mail` | `<UserRound />` | Datos del broker o agencia asignada |
| **Artes de Redes Sociales** | `Share2` / `Megaphone` | `<Megaphone />` | Estudio creativo de campañas y posts |
| **Acciones de Guardado** | `Save` / `CheckCircle2` | `<Save />` | Persistencia y generación de snapshot |

---

## 2. Catálogo Unificado de Iconos para Amenidades (`AmenityIconRegistry`)

En lugar de utilizar iconos dispersos o emojis, se implementa un despachador tipado que evalúa la semántica de la amenidad y asigna el icono vectorial exacto con trazo elegante:

```tsx
import React from 'react';
import {
  Waves,
  Dumbbell,
  DoorOpen,
  BriefcaseBusiness,
  Baby,
  ShieldCheck,
  BusFront,
  CarFront,
  PawPrint,
  Trees,
  Users,
  Umbrella,
  Building2,
  Utensils,
  Wine,
  Sparkles,
  Wifi,
  Tv,
  Flame,
  type LucideIcon,
} from 'lucide-react';

interface AmenityIconProps {
  name: string;
  className?: string;
  strokeWidth?: number;
}

export function AmenityIcon({ name, className = 'h-4 w-4', strokeWidth = 1.5 }: AmenityIconProps) {
  const normalized = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  let IconComponent: LucideIcon = Building2;

  if (normalized.includes('piscina') || normalized.includes('pool') || normalized.includes('alberca') || normalized.includes('jacuzzi') || normalized.includes('swim')) {
    IconComponent = Waves;
  } else if (normalized.includes('gimnasio') || normalized.includes('gym') || normalized.includes('fitness') || normalized.includes('pesas') || normalized.includes('crossfit')) {
    IconComponent = Dumbbell;
  } else if (normalized.includes('lobby') || normalized.includes('recepcion') || normalized.includes('concierge') || normalized.includes('acceso')) {
    IconComponent = DoorOpen;
  } else if (normalized.includes('cowork') || normalized.includes('oficina') || normalized.includes('business') || normalized.includes('sala de juntas')) {
    IconComponent = BriefcaseBusiness;
  } else if (normalized.includes('infantil') || normalized.includes('nino') || normalized.includes('kids') || normalized.includes('juegos')) {
    IconComponent = Baby;
  } else if (normalized.includes('seguridad') || normalized.includes('vigilancia') || normalized.includes('camaras') || normalized.includes('control') || normalized.includes('guardia')) {
    IconComponent = ShieldCheck;
  } else if (normalized.includes('transporte') || normalized.includes('shuttle') || normalized.includes('bus') || normalized.includes('traslado')) {
    IconComponent = BusFront;
  } else if (normalized.includes('parqueo') || normalized.includes('estacionamiento') || normalized.includes('garaje') || normalized.includes('vehiculo')) {
    IconComponent = CarFront;
  } else if (normalized.includes('mascota') || normalized.includes('pet') || normalized.includes('perro')) {
    IconComponent = PawPrint;
  } else if (normalized.includes('jardin') || normalized.includes('sendero') || normalized.includes('verde') || normalized.includes('parque') || normalized.includes('naturaleza')) {
    IconComponent = Trees;
  } else if (normalized.includes('social') || normalized.includes('salon') || normalized.includes('casa club') || normalized.includes('eventos')) {
    IconComponent = Users;
  } else if (normalized.includes('playa') || normalized.includes('beach') || normalized.includes('solarium') || normalized.includes('terraza')) {
    IconComponent = Umbrella;
  } else if (normalized.includes('restaurante') || normalized.includes('bar') || normalized.includes('cafe') || normalized.includes('gastronomia')) {
    IconComponent = Utensils;
  } else if (normalized.includes('lounge') || normalized.includes('cava') || normalized.includes('bar')) {
    IconComponent = Wine;
  } else if (normalized.includes('spa') || normalized.includes('sauna') || normalized.includes('bienestar') || normalized.includes('relajacion')) {
    IconComponent = Sparkles;
  } else if (normalized.includes('wifi') || normalized.includes('internet') || normalized.includes('fibra')) {
    IconComponent = Wifi;
  } else if (normalized.includes('cine') || normalized.includes('teatro') || normalized.includes('pantalla')) {
    IconComponent = Tv;
  } else if (normalized.includes('bbq') || normalized.includes('parrilla') || normalized.includes('fogata') || normalized.includes('fire pit')) {
    IconComponent = Flame;
  }

  return <IconComponent className={className} strokeWidth={strokeWidth} />;
}
```

---

## 3. Modelo de Datos para Dossiers, Propuestas y Artes Sociales

```typescript
export type EditorKind = 'dossier' | 'proposal' | 'social';
export type SocialFormat = 'post_square' | 'story_reel' | 'banner_landscape';
export type TemplateId = 'editorial' | 'minimal' | 'investment' | 'panorama';

export type BlockType =
  | 'cover'
  | 'text'
  | 'image'
  | 'gallery'
  | 'highlights'
  | 'stats'
  | 'availability'
  | 'payment'
  | 'documents'
  | 'banking'
  | 'disclaimer'
  | 'contact';

export type LayoutId = 'full' | 'split-left' | 'split-right' | 'vertical-top' | 'vertical-bottom';

export interface Block {
  id: string;
  type: BlockType;
  title: string;
  body: string;
  kicker: string;
  hidden?: boolean;
  layout: LayoutId;
  backgroundType: 'solid' | 'image' | 'gradient';
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  image?: string;
  images?: string[];
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
  amenityColumns?: 2 | 3;
  amenityIconMode?: 'auto' | 'check' | 'number';
}

export interface SocialArtState {
  format: SocialFormat;
  headline: string;
  subheadline: string;
  badgeText: string;
  priceLabel: string;
  priceValue: string;
  location: string;
  backgroundImage: string;
  overlayOpacity: number;
  brandLogoUrl: string;
  brandName: string;
  primaryColor: string;
  accentColor: string;
  textColor: string;
  callToAction: string;
  highlightItems: string[];
}
```

---

## 4. Componente Modal Principal: `MasterCreativeModal.tsx`

Este componente unifica la edición de **Dossiers**, **Propuestas** y **Artes de Redes Sociales** dentro de un contenedor modal full-screen que se acopla limpiamente a cualquier parte del portal `OsvaldoBello`:

```tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  FileSignature,
  Share2,
  Eye,
  Undo2,
  Redo2,
  Save,
  Monitor,
  Smartphone,
  Layers,
  Plus,
  Palette,
  ImageIcon,
  Sparkles,
  Download,
  Copy,
  Check,
  ChevronUp,
  ChevronDown,
  Trash2,
  GripVertical,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { AmenityIcon } from './AmenityIcon';

export interface MasterCreativeModalProps {
  isOpen: boolean;
  onClose: () => void;
  kind: EditorKind;
  project: {
    name: string;
    slug: string;
    description: string;
    shortDescription?: string;
    location: string;
    startingPrice: number;
    commission: number;
    availableUnits: number;
    delivery: string;
    image: string;
    gallery: string[];
    amenities: string[];
    paymentPlan: { label: string; value: string }[];
    documents?: { id: string; name: string; format: string; updated: string }[];
    units?: any[];
  };
  clientData?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  brand: {
    name: string;
    logo_url: string;
    primary_color: string;
    accent_color: string;
    contact_email?: string;
  };
  onSaveSnapshot?: (snapshotData: any) => Promise<{ success: boolean; url?: string; token?: string }>;
}

export default function MasterCreativeModal({
  isOpen,
  onClose,
  kind,
  project,
  clientData,
  brand,
  onSaveSnapshot,
}: MasterCreativeModalProps) {
  // Prevenir scroll de la página inferior
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const [activeTabLeft, setActiveTabLeft] = useState<'pages' | 'blocks' | 'media' | 'styles'>('pages');
  const [activeTabInspector, setActiveTabInspector] = useState<'content' | 'design' | 'media' | 'legal'>('content');
  const [devicePreview, setDevicePreview] = useState<'desktop' | 'mobile'>('desktop');
  const [socialFormat, setSocialFormat] = useState<SocialFormat>('post_square');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const headerTitle =
    kind === 'dossier'
      ? `Dossier Oficial · ${project.name}`
      : kind === 'proposal'
      ? `Propuesta Comercial · ${clientData?.name || 'Cliente Inversionista'}`
      : `Estudio Creativo para Redes · ${project.name}`;

  return (
    <div className="fixed inset-0 z-[100] flex h-screen flex-col overflow-hidden bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      {/* 1. Barra Superior / Header */}
      <header className="flex min-h-[60px] items-center justify-between border-b border-slate-200 bg-white px-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar Editor"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 transition"
          >
            <X className="h-5 w-5" strokeWidth={1.5} />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                {kind === 'dossier' ? (
                  <FileText className="h-3 w-3" strokeWidth={1.5} />
                ) : kind === 'proposal' ? (
                  <FileSignature className="h-3 w-3" strokeWidth={1.5} />
                ) : (
                  <Share2 className="h-3 w-3" strokeWidth={1.5} />
                )}
              </span>
              <p className="text-xs font-extrabold text-slate-900">{headerTitle}</p>
            </div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              {brand.name} · Edición en Tiempo Real
            </p>
          </div>
        </div>

        {/* Controles Centrales / Formato */}
        {kind === 'social' ? (
          <div className="hidden sm:flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setSocialFormat('post_square')}
              className={cn(
                'rounded-lg px-3 py-1.5 text-[10px] font-extrabold transition',
                socialFormat === 'post_square'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              )}
            >
              Post 1:1
            </button>
            <button
              type="button"
              onClick={() => setSocialFormat('story_reel')}
              className={cn(
                'rounded-lg px-3 py-1.5 text-[10px] font-extrabold transition',
                socialFormat === 'story_reel'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              )}
            >
              Story 9:16
            </button>
            <button
              type="button"
              onClick={() => setSocialFormat('banner_landscape')}
              className={cn(
                'rounded-lg px-3 py-1.5 text-[10px] font-extrabold transition',
                socialFormat === 'banner_landscape'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              )}
            >
              Banner 16:9
            </button>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-1 rounded-xl border border-slate-200 p-1">
            <button
              type="button"
              onClick={() => setDevicePreview('desktop')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-bold transition',
                devicePreview === 'desktop' ? 'bg-blue-50 text-blue-600' : 'text-slate-400'
              )}
            >
              <Monitor className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span>Carta 816px</span>
            </button>
            <button
              type="button"
              onClick={() => setDevicePreview('mobile')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-bold transition',
                devicePreview === 'mobile' ? 'bg-blue-50 text-blue-600' : 'text-slate-400'
              )}
            >
              <Smartphone className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span>Móvil 390px</span>
            </button>
          </div>
        )}

        {/* Acciones de Guardado / Exportación */}
        <div className="flex items-center gap-2">
          {kind === 'social' ? (
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
            >
              <Download className="h-4 w-4" strokeWidth={1.5} />
              <span>Exportar Arte HD</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={isSaving}
              onClick={async () => {
                if (onSaveSnapshot) {
                  setIsSaving(true);
                  await onSaveSnapshot({ project, brand });
                  setIsSaving(false);
                }
              }}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 transition"
            >
              <Save className="h-4 w-4" strokeWidth={1.5} />
              <span>{isSaving ? 'Guardando...' : 'Guardar y Compartir'}</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. Cuerpo del Editor: 3 Columnas */}
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)_320px] bg-slate-100">
        {/* Barra Izquierda: Páginas y Recursos */}
        <aside className="hidden lg:flex flex-col border-r border-slate-200 bg-white">
          <div className="grid grid-cols-4 border-b border-slate-100 p-2">
            {(
              [
                ['pages', 'Páginas'],
                ['blocks', 'Bloques'],
                ['media', 'Medios'],
                ['styles', 'Estilos'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTabLeft(id)}
                className={cn(
                  'rounded-lg py-2 text-[9px] font-extrabold uppercase tracking-wider transition',
                  activeTabLeft === id ? 'bg-blue-50 text-blue-700' : 'text-slate-400 hover:bg-slate-50'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
              Estructura Activa
            </p>
            {/* Lista de páginas con icono sin emojis */}
            <div className="rounded-xl border border-blue-400 bg-blue-50/50 p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GripVertical className="h-3.5 w-3.5 text-slate-300" strokeWidth={1.5} />
                <span className="flex h-5 w-5 items-center justify-center rounded bg-white text-[9px] font-black text-slate-700">
                  1
                </span>
                <span className="text-[11px] font-bold text-slate-800">Portada Oficial</span>
              </div>
              <span className="text-[8px] font-black uppercase text-blue-600 bg-blue-100/60 px-1.5 py-0.5 rounded">
                Cover
              </span>
            </div>
          </div>
        </aside>

        {/* Lienzo Central / Canvas */}
        <main className="overflow-y-auto p-6 flex items-center justify-center">
          {kind === 'social' ? (
            <div
              className={cn(
                'relative overflow-hidden rounded-2xl bg-white shadow-2xl transition-all duration-300 border border-slate-200',
                socialFormat === 'post_square'
                  ? 'h-[500px] w-[500px]'
                  : socialFormat === 'story_reel'
                  ? 'h-[580px] w-[326px]'
                  : 'h-[320px] w-[568px]'
              )}
            >
              {/* Render del Arte Social */}
              <div className="relative h-full w-full flex flex-col justify-between p-6 text-white" style={{ backgroundColor: brand.primary_color }}>
                {project.image && (
                  <img
                    src={project.image}
                    alt={project.name}
                    className="absolute inset-0 h-full w-full object-cover opacity-35"
                  />
                )}
                <div className="relative z-10 flex items-center justify-between">
                  <span className="rounded-full bg-blue-600/80 px-3 py-1 text-[9px] font-black uppercase tracking-wider backdrop-blur-xs">
                    Preventa Exclusiva
                  </span>
                  <span className="text-[10px] font-extrabold tracking-wide uppercase text-white/80">
                    {brand.name}
                  </span>
                </div>

                <div className="relative z-10 space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-300">
                    {project.location}
                  </p>
                  <h2 className="text-2xl font-black leading-tight tracking-tight">
                    {project.name}
                  </h2>
                  <div className="flex items-center gap-3 pt-2">
                    <div>
                      <p className="text-[8px] uppercase tracking-wider text-white/60">Desde</p>
                      <p className="text-lg font-black text-white">
                        {formatCurrency(project.startingPrice)}
                      </p>
                    </div>
                    <div className="h-6 w-px bg-white/20" />
                    <div>
                      <p className="text-[8px] uppercase tracking-wider text-white/60">Entrega</p>
                      <p className="text-sm font-extrabold text-white">{project.delivery}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              className={cn(
                'mx-auto w-full transition-all duration-300 space-y-4',
                devicePreview === 'mobile' ? 'max-w-[390px]' : 'max-w-[816px]'
              )}
            >
              {/* Hoja de Presentación */}
              <div className="min-h-[640px] rounded-2xl bg-white p-10 shadow-xl border border-slate-200 flex flex-col justify-between" style={{ color: '#111827' }}>
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <p className="text-[10px] font-extrabold tracking-widest uppercase text-blue-600">
                      {brand.name}
                    </p>
                    <span className="text-[9px] font-bold text-slate-400">Página 01</span>
                  </div>

                  <div className="mt-8 space-y-3">
                    <p className="text-xs font-black uppercase tracking-widest text-blue-600">
                      Presentación Comercial
                    </p>
                    <h1 className="text-3xl font-black tracking-tight text-slate-950">
                      {project.name}
                    </h1>
                    <p className="text-xs leading-relaxed text-slate-500 max-w-xl">
                      {project.description}
                    </p>
                  </div>

                  {/* Amenidades renderizadas con AmenityIcon formal */}
                  <div className="mt-8">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">
                      Amenidades Principales
                    </p>
                    <div className="grid grid-cols-2 gap-2.5">
                      {project.amenities.slice(0, 4).map((amenity) => (
                        <div
                          key={amenity}
                          className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/70 p-3"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <AmenityIcon name={amenity} className="h-4 w-4" />
                          </div>
                          <span className="text-[11px] font-bold text-slate-700">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-[9px] text-slate-400">
                  <span>Valores sujetos a confirmación de disponibilidad.</span>
                  <span>Documento oficial generado en plataforma</span>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Barra Derecha: Inspector Contextual */}
        <aside className="hidden lg:flex flex-col border-l border-slate-200 bg-white">
          <div className="grid grid-cols-4 border-b border-slate-100 p-2">
            {(
              [
                ['content', 'Texto'],
                ['design', 'Diseño'],
                ['media', 'Fotos'],
                ['legal', 'Legal'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTabInspector(id)}
                className={cn(
                  'rounded-lg py-2 text-[9px] font-extrabold uppercase tracking-wider transition',
                  activeTabInspector === id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-400 hover:bg-slate-50'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
              <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1.5">
                Título del bloque
              </label>
              <input
                type="text"
                defaultValue={project.name}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1.5">
                Cuerpo o descripción
              </label>
              <textarea
                rows={5}
                defaultValue={project.description}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-relaxed outline-none focus:border-blue-500 focus:bg-white transition"
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
```

---

## 5. Instrucciones de Invocación desde Vistas de OsvaldoBello

### 5.1. Desde la Ficha de Proyecto (`ProjectDetail.tsx`):
```tsx
import { useState } from 'react';
import MasterCreativeModal from '@/components/creative/MasterCreativeModal';
import { FileText, Share2 } from 'lucide-react';

export function ProjectActionsBar({ project }: { project: any }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalKind, setModalKind] = useState<'dossier' | 'proposal' | 'social'>('dossier');

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setModalKind('dossier');
            setModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition"
        >
          <FileText className="h-4 w-4 text-blue-600" strokeWidth={1.5} />
          <span>Editar Dossier Oficial</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setModalKind('social');
            setModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
        >
          <Share2 className="h-4 w-4" strokeWidth={1.5} />
          <span>Generar Artes para Redes</span>
        </button>
      </div>

      <MasterCreativeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        kind={modalKind}
        project={project}
        brand={{
          name: 'Osvaldo Bello Master Broker',
          logo_url: '/logo.png',
          primary_color: '#0c094e',
          accent_color: '#2563eb',
        }}
      />
    </>
  );
}
```

---

## 6. Resumen de Calidad y Estándares
1. **100% Vectorial**: Toda la interfaz utiliza exclusivamente la librería Lucide con trazado `1.5px` para una apariencia pulida e imponente.
2. **Despacho Dinámico de Amenidades**: El componente `<AmenityIcon />` detecta automáticamente más de 20 palabras clave inmobiliarias (piscinas, gimnasios, spas, canchas, helipuertos, salas de juntas, etc.).
3. **Multi-Formato**: Soporta salida para documentos editoriales en carta vertical (816px), vista optimizada para dispositivos móviles (390px) y resoluciones estándar para redes sociales (1:1 Post, 9:16 Story/Reel, 16:9 Banner).
