# Guía de Integración: Modal del Editor de Dossiers y Propuestas en el Proyecto OsvaldoBello

Este documento es una guía práctica paso a paso para importar, integrar y ejecutar el **Editor Interactivo de Dossiers y Propuestas** dentro del proyecto **OsvaldoBello**, ya sea como una vista de pantalla completa o dentro de un **Modal / Drawer interactivo de alto impacto**.

---

## 1. Arquitectura de Integración (Modal / Full-Screen Overlay)

El editor está concebido para trabajar de forma aislada y no contaminar el layout base del portal o dashboard. La forma más limpia de integrarlo en el proyecto `OsvaldoBello` es mediante un **Modal de Pantalla Completa con Portal / Backdrop Reactivo**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ MODAL CONTENEDOR (fixed inset-0 z-[100] flex flex-col overflow-hidden)     │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. HEADER                                                                   │
│    [✕ Cerrar / Volver]  Título: Cana Rock · Dossier Oficial    [Guardar 💾]│
├───────────────────┬─────────────────────────────────────┬───────────────────┤
│ 2. PANEL IZQ.     │ 3. LIENZO CENTRAL (Canvas)          │ 4. PANEL DER.     │
│    (238px)        │    (816px Carta / 390px Móvil)      │    (318px)        │
│    • Páginas      │    [Página 1: Portada]              │    • Contenido    │
│    • Bloques      │    [Página 2: Amenidades]           │    • Diseño       │
│    • Medios       │    [Página 3: Plan de Pagos]        │    • Imagen       │
│    • Plantillas   │    [Página 4: Contacto]             │    • Legal        │
└───────────────────┴─────────────────────────────────────┴───────────────────┘
```

---

## 2. Dependencias Requeridas en `OsvaldoBello`

Asegúrate de contar con los paquetes base en el `package.json` de OsvaldoBello:

```bash
npm install lucide-react clsx tailwind-merge
```

### Configuración de Utilidades (`src/lib/utils.ts`):
```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(amount);
}
```

---

## 3. Modelo de Datos a Transportar

Copia o importa las definiciones en `src/types/dossier.ts`:

```typescript
export type PresentationKind = 'dossier' | 'proposal';
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
```

---

## 4. Componente Modal: `DossierEditorModal.tsx`

Crea este componente en `src/components/dossier/DossierEditorModal.tsx` dentro de `OsvaldoBello`:

```tsx
'use client';

import React, { useEffect } from 'react';
import PresentationEditor from './PresentationEditor';
import { X } from 'lucide-react';

interface DossierEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  kind?: 'dossier' | 'proposal';
  selectedUnitId?: string;
  brand?: {
    name: string;
    logo_url: string;
    primary_color: string;
    accent_color: string;
  };
  onSave?: (snapshot: any) => Promise<void>;
}

export default function DossierEditorModal({
  isOpen,
  onClose,
  project,
  kind = 'dossier',
  selectedUnitId,
  brand,
  onSave,
}: DossierEditorModalProps) {
  // Bloquear scroll del fondo mientras el editor esté abierto
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Botón flotante para cerrar rápidamente en móvil o esquina */}
      <button
        onClick={onClose}
        aria-label="Cerrar Editor"
        className="absolute top-3 right-3 z-[110] flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/80 text-white shadow-lg hover:bg-slate-900 transition"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Editor Principal */}
      <div className="relative h-full w-full overflow-hidden bg-slate-100">
        <PresentationEditor
          project={project as any}
          kind={kind}
          selectedUnitId={selectedUnitId}
          onClose={onClose}
          customBrand={brand}
          onCustomSave={onSave}
        />
      </div>
    </div>
  );
}
```

---

## 5. Cómo Abrir el Modal desde Cualquier Pantalla de OsvaldoBello

### Ejemplo: Botón en la Ficha de Proyecto o Catálogo (`ProjectDetail.tsx` / `ProjectCard.tsx`):

```tsx
import { useState } from 'react';
import DossierEditorModal from '@/components/dossier/DossierEditorModal';
import { Palette, Share2 } from 'lucide-react';

export function ProjectActions({ project }: { project: any }) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorKind, setEditorKind] = useState<'dossier' | 'proposal'>('dossier');

  return (
    <>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setEditorKind('dossier');
            setEditorOpen(true);
          }}
          className="flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-xs font-bold text-blue-600 shadow-sm hover:bg-blue-50"
        >
          <Palette className="h-4 w-4" />
          <span>Editar Dossier Oficial</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setEditorKind('proposal');
            setEditorOpen(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700"
        >
          <Share2 className="h-4 w-4" />
          <span>Crear Propuesta al Cliente</span>
        </button>
      </div>

      {/* Modal del Editor */}
      <DossierEditorModal
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        project={project}
        kind={editorKind}
        brand={{
          name: 'Osvaldo Bello Master Broker',
          logo_url: '/logo.png',
          primary_color: '#0c094e',
          accent_color: '#2563eb',
        }}
        onSave={async (snapshot) => {
          console.log('Guardando snapshot en OsvaldoBello:', snapshot);
          // Llamada a tu API de Node / Supabase / Express
        }}
      />
    </>
  );
}
```

---

## 6. Adaptación para el Estudio Creativo de Redes Sociales (Social Posts)

Para integrar las **Artes de Redes Sociales** usando exactamente este mismo modal:

1. **Ajustar la Medida del Lienzo Central**:
   - En lugar de fijar 816px de ancho, se pasa una propiedad `format`:
     - **Post Cuadrado (1:1)**: `w-[540px] h-[540px]`
     - **Historia / Reel (9:16)**: `w-[360px] h-[640px]`
     - **Banner Horizontal (16:9)**: `w-[640px] h-[360px]`
2. **Selector de Formato en el Header**:
   - Botones rápidos en el Header: `[1:1 Post]` `[9:16 Story]` `[16:9 Banner]`.
3. **Exportación con `html2canvas` o `dom-to-image`**:
   - Permite descargar la diapositiva directamente en `.png` de alta resolución o copiar la imagen al portapapeles.

---

## 7. Ventajas de esta Integración

1. **Zero Layout Shift**: Al ser un Modal `fixed inset-0`, no altera las rutas ni los encabezados de la aplicación principal.
2. **Marca Blanca Completa**: Inyecta dinámicamente logos y colores corporativos sin tocar el código central del editor.
3. **Reutilizable**: El mismo componente sirve para Dossiers de Proyectos, Propuestas a Inversionistas y Artes para Redes Sociales.
