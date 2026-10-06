# Guía de Arquitectura e Implementación: Editor de Dossiers y Propuestas Interactivas

Este documento describe con exactitud técnica la arquitectura, el modelo de datos, la interfaz de usuario y la lógica de estado del **Editor de Presentaciones (Dossiers / Propuestas)** de esta plataforma, permitiendo su replicación modular en cualquier aplicación web construida con React, Next.js, Vite o Node.js.

---

## 1. Concepto y Enfoque Arquitectónico

A diferencia de editores tradicionales basados en `<canvas>` (tipo Figma/Photoshop) o editores de texto enriquecido tradicionales (WYSIWYG), este sistema utiliza un **motor de bloques semánticos responsivos renderizados en HTML/CSS**:

1. **Estado Central Declarativo**: Todo el documento se modela como un arreglo de objetos JSON (`Block[]`).
2. **Lienzo Reactivo en Tiempo Real**: El centro de la pantalla renderiza los bloques de manera nativa con TailwindCSS y propiedades CSS dinámicas (`clamp()`, `fontSize`, `backgroundColor`, `padding`).
3. **Flujo de 3 Columnas Independientes**:
   - **Barra Izquierda (Estructura y Assets):** Ordenar páginas, añadir bloques, galería de medios y estilos globales.
   - **Lienzo Central (Canvas):** Renderizado continuo a escala (816px para hoja vertical / 390px para móvil) con auto-scroll sincronizado.
   - **Barra Derecha (Inspector Contextual):** Edición precisa de texto, diseño, tipografía, imágenes, opacidades y textos legales del bloque activo.
4. **Snapshot Inmutable**: El guardado genera una instantánea completa (`snapshot`) en formato JSON que viaja a la base de datos y permite compartir un visor público interactivo sin alterar datos maestros.

---

## 2. Modelo de Datos y Esquemas TypeScript

Cada diapositiva o página comparte una estructura unificada y fuertemente tipada:

```typescript
export type PresentationKind = 'dossier' | 'proposal';
export type TemplateId = 'editorial' | 'minimal' | 'investment' | 'panorama';

export type BlockType = 
  | 'cover'         // Portada con logotipo e identidad
  | 'text'          // Bloque de narrativa/concepto
  | 'image'         // Imagen destacada inmersiva
  | 'gallery'       // Grilla fotográfica
  | 'highlights'    // Lista/Tarjetas de amenidades
  | 'stats'         // Métricas y cifras clave
  | 'availability'  // Lista de unidades / precios
  | 'payment'       // Cronograma o plan de pagos
  | 'documents'     // Listado de archivos técnicos / legales
  | 'banking'       // Cuentas bancarias protegidas
  | 'disclaimer'    // Advertencias legales
  | 'contact';      // Cierre con datos de contacto

export type LayoutId = 
  | 'full'             // 1 columna completa
  | 'split-left'       // Imagen a la izquierda, contenido a la derecha
  | 'split-right'      // Contenido a la izquierda, imagen a la derecha
  | 'vertical-top'     // Imagen arriba, contenido abajo
  | 'vertical-bottom'; // Contenido arriba, imagen abajo

export interface Block {
  id: string;
  type: BlockType;
  title: string;
  body: string;
  kicker: string;              // Antetítulo / Categoría
  hidden?: boolean;            // Ocultar página sin eliminarla
  layout: LayoutId;
  backgroundType: 'solid' | 'image' | 'gradient';
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  image?: string;
  images?: string[];
  imageFit: 'cover' | 'contain';
  imagePosition: string;       // 'center' | 'top' | 'bottom' | 'left' | 'right'
  overlayOpacity: number;      // 0 a 100% de oscurecimiento
  titleSize: number;           // Tamaño en px del título
  bodySize: number;            // Tamaño en px del cuerpo
  padding: number;             // Espaciado interno en px
  minHeight: number;           // Altura mínima del bloque (ej. 760px)
  showDisclaimer: boolean;
  disclaimer: string;
  disclaimerColor: string;
  disclaimerSize: number;

  // Configuraciones específicas para bloques de amenidades:
  amenityStyle?: 'cards' | 'list' | 'pills';
  amenityColumns?: 2 | 3;
  amenityIconMode?: 'auto' | 'check' | 'number';
}
```

---

## 3. Función Fábrica de Bloques (`makeBlock`)

Permite generar nuevos bloques con valores por defecto contextualizados al proyecto:

```typescript
export function makeBlock(type: BlockType, project: any, seed = Date.now()): Block {
  const defaults: Record<BlockType, Pick<Block, 'title' | 'body' | 'kicker'>> = {
    cover: { title: project.name, body: project.shortDescription || '', kicker: 'Presentación privada' },
    text: { title: 'Narrativa y concepto', body: project.description || '', kicker: 'El proyecto' },
    image: { title: 'Experiencia visual', body: 'Una mirada al estilo de vida y arquitectura.', kicker: 'Galería' },
    gallery: { title: 'Explora cada detalle', body: 'Arquitectura, interiores y amenidades.', kicker: 'Galería' },
    highlights: { title: 'Estilo de vida', body: (project.amenities || []).join('\n'), kicker: 'Servicios' },
    stats: { title: 'Fundamentos de inversión', body: 'Datos principales del proyecto.', kicker: 'Resumen' },
    availability: { title: 'Catálogo de unidades', body: 'Disponibilidad y precios vigentes.', kicker: 'Inventario' },
    payment: { title: 'Plan de pagos', body: 'Esquema flexible de inversión.', kicker: 'Financiamiento' },
    documents: { title: 'Documentos oficiales', body: 'Planos, memorias y permisos.', kicker: 'Documentación' },
    banking: { title: 'Instrucciones bancarias', body: 'Datos sensibles protegidos.', kicker: 'Confidencial' },
    disclaimer: { title: 'Información importante', body: 'Precios y disponibilidades sujetos a cambios.', kicker: 'Legal' },
    contact: { title: 'Atención personalizada', body: 'Nuestro equipo está listo para asesorarte.', kicker: 'Contacto' },
  };

  return {
    id: `${type}-${seed}`,
    type,
    ...defaults[type],
    layout: type === 'cover' ? 'split-right' : type === 'image' ? 'full' : 'vertical-top',
    backgroundType: type === 'cover' || type === 'contact' ? 'image' : 'solid',
    backgroundColor: type === 'cover' || type === 'contact' ? '#0c094e' : '#ffffff',
    textColor: type === 'cover' || type === 'contact' ? '#ffffff' : '#111827',
    accentColor: '#2563eb',
    image: project.image,
    images: [project.image, ...(project.gallery || [])],
    imageFit: 'cover',
    imagePosition: 'center',
    overlayOpacity: type === 'cover' || type === 'contact' ? 58 : 20,
    titleSize: type === 'cover' ? 54 : 34,
    bodySize: 14,
    padding: 48,
    minHeight: type === 'cover' ? 760 : 620,
    showDisclaimer: type === 'availability' || type === 'payment',
    disclaimer: 'Información sujeta a cambios sin previo aviso.',
    disclaimerColor: '#64748b',
    disclaimerSize: 9,
    amenityStyle: 'cards',
    amenityColumns: 2,
    amenityIconMode: 'auto',
  };
}
```

---

## 4. Distribución Visual del Editor (Layout UI)

El contenedor principal ocupa la pantalla completa (`fixed inset-0 z-[70] flex h-screen flex-col overflow-hidden`):

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ HEADER: Regresar | Título del Proyecto | Deshacer/Rehacer | Desktop/Mobile | Guardar │
├─────────────────┬──────────────────────────────────────────────┬─────────────────┤
│ PANEL IZQUIERDO │ LIENZO CENTRAL (Canvas)                      │ PANEL DERECHO   │
│ (238px)         │ (Fondo slate-200, Scroll suave)             │ (318px)         │
│                 │                                              │                 │
│ [Pestañas]      │ [ Medidas: 816px (Carta) / 390px (Móvil) ]   │ [Pestañas]      │
│ • Páginas       │ ┌──────────────────────────────────────────┐ │ • Contenido     │
│ • Bloques       │ │ Página 1: Cover                          │ │ • Diseño        │
│ • Medios        │ └──────────────────────────────────────────┘ │ • Imagen        │
│ • Estilos       │ ┌──────────────────────────────────────────┐ │ • Legal         │
│                 │ │ Página 2: Amenidades (Highlights)        │ │                 │
│ [Reordenar /    │ └──────────────────────────────────────────┘ │ [Formularios y  │
│  Añadir]        │ ┌──────────────────────────────────────────┐ │  Controles]     │
│                 │ │ Página 3: Plan de Pagos                  │ │                 │
│                 │ └──────────────────────────────────────────┘ │                 │
└─────────────────┴──────────────────────────────────────────────┴─────────────────┘
```

---

## 5. Lógicas Principales de Estado (React Hooks)

### A. Sistema de Deshacer / Rehacer (Undo / Redo)
```typescript
const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
const [past, setPast] = useState<Block[][]>([]);
const [future, setFuture] = useState<Block[][]>([]);

function commit(next: Block[]) {
  setPast((items) => [...items.slice(-29), blocks]); // Guarda hasta 30 pasos
  setBlocks(next);
  setFuture([]);
}

function undo() {
  const previous = past[past.length - 1];
  if (!previous) return;
  setFuture((items) => [blocks, ...items].slice(0, 30));
  setBlocks(previous);
  setPast((items) => items.slice(0, -1));
}

function redo() {
  const next = future[0];
  if (!next) return;
  setPast((items) => [...items, blocks].slice(-30));
  setBlocks(next);
  setFuture((items) => items.slice(1));
}
```

### B. Auto-Scroll Sincronizado al Seleccionar Página
```typescript
useEffect(() => {
  const page = document.getElementById(`presentation-page-${selectedId}`);
  if (page) {
    page.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}, [selectedId]);
```

### C. Detección Inteligente de Iconos por Texto
```typescript
function getAmenityIcon(name: string) {
  const text = name.toLowerCase();
  if (text.includes('piscina') || text.includes('pool')) return WavesIcon;
  if (text.includes('gimnasio') || text.includes('gym')) return DumbbellIcon;
  if (text.includes('lobby') || text.includes('recepción')) return DoorOpenIcon;
  if (text.includes('cowork') || text.includes('oficina')) return BriefcaseIcon;
  if (text.includes('seguridad') || text.includes('vigilancia')) return ShieldCheckIcon;
  if (text.includes('playa') || text.includes('beach')) return UmbrellaIcon;
  return BuildingIcon;
}
```

---

## 6. Persistencia y Publicación

Al presionar **"Guardar y Compartir"**, se genera una estructura JSON completa y un hash o UUID único:

```typescript
const snapshot = {
  title: "Dossier Comercial · Cana Rock",
  kind: "dossier",
  project: { name: "Cana Rock", location: "Punta Cana" },
  blocks: blocks,
  branding: {
    name: "Mi Inmobiliaria",
    logo_url: "https://.../logo.png",
    primary_color: "#2563eb"
  },
  created_at: new Date().toISOString()
};

// Guardar en Base de Datos (ej. Supabase / PostgreSQL)
// Insertar en tabla `presentations` y `presentation_versions` (snapshot JSONB)
```

Este snapshot es exactamente el que luego consume la ruta pública (`/p/[token]`) a través de un visor optimizado de sólo lectura.

---

## 7. Archivos de Referencia en este Proyecto

Para revisar la implementación exacta de cada función:
- **Editor Principal**: [`components/portal/PresentationEditor.tsx`](file:///c:/Users/Rony/Documents/GitHub/App%20OB%20Brokers/components/portal/PresentationEditor.tsx)
- **Ruta de Carga**: [`app/portal/projects/[slug]/dossier/page.tsx`](file:///c:/Users/Rony/Documents/GitHub/App%20OB%20Brokers/app/portal/projects/[slug]/dossier/page.tsx)
- **Server Actions de Guardado**: [`app/portal/proposals/actions.ts`](file:///c:/Users/Rony/Documents/GitHub/App%20OB%20Brokers/app/portal/proposals/actions.ts)
- **Visor Público**: [`components/proposals/MultiPropertyProposalViewer.tsx`](file:///c:/Users/Rony/Documents/GitHub/App%20OB%20Brokers/components/proposals/MultiPropertyProposalViewer.tsx)
