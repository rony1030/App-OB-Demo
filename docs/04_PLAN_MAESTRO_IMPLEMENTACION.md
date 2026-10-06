# Plan maestro de implementación — App OB Brokers

**Estado de referencia:** 15 de agosto de 2026  
**Propósito:** Fuente de verdad técnica, operativa y funcional para convertir la plataforma en el ecosistema inmobiliario multiempresa líder, integrando un CRM de alta profundidad inspirado en las mejores prácticas de GoHighLevel (GHL).

---

## 1. Resumen Ejecutivo del Estado del Proyecto

El proyecto ha completado con éxito las fases fundamentales de su arquitectura técnica:
- **Fase 0 (Fundación Técnica y Base de Datos):** 43 tablas en Supabase Postgres con RLS al 100%, índices optimizados, funciones de rol (`private.has_org_role`) y dos buckets en Supabase Storage (`public-assets` y `private-documents`).
- **Fase A (Identidad y Autenticación SSR):** Login institucional moderno (`/login`), cookies seguras HttpOnly, helper de sesión (`lib/auth/get-user.ts`), guardianes de rutas en Next.js 16 (`proxy.ts`) y menú de usuario activo en `PortalShell`.
- **Fase B (CRM Avanzado estilo GoHighLevel):** **Smart Lists** con filtros avanzados y pestañas guardadas, **Ficha 360 del Contacto en 3 columnas** (`/portal/clientes/[id]`), timeline omnicanal cronológico (notas, llamadas, WhatsApp, reuniones, tareas), gestión DND (Do Not Disturb), acciones masivas con exportación CSV y formulario `/portal/leads/new` conectado a Supabase con protección de 60 días.
- **Fase C (Motor Documental de Propuestas):** Persistencia en `presentations`, snapshots JSONB inmutables en `presentation_versions`, generación de `shared_links` con token y visualizador público en `/p/[token]`.

---

## 2. Matriz de Estado Actualizada

| Módulo / Capacidad | Estado | Implementación / Evidencia |
|---|:---:|---|
| **Repositorio GitHub** |  Completado | Repositorio privado `rony1030/App-OB-Brokers`, rama `main`. |
| **Base de Datos Postgres** |  Completado | 43 tablas, RLS activo, claves foráneas indexadas, `seed.sql`. |
| **Storage (Buckets)** |  Completado | `public-assets` y `private-documents` con políticas por organización. |
| **Catálogo de Proyectos** |  Completado | Lectura dinámica desde Supabase en portal público y fichas técnicas. |
| **Autenticación SSR (Fase A)** |  Completado | Pantalla `/login`, Server Actions, cookies HttpOnly y `proxy.ts`. |
| **CRM estilo GHL (Fase B)** |  Completado | Smart Lists, Ficha 360 en 3 columnas, timeline y `/portal/leads/new`. |
| **Motor de Propuestas (Fase C)** |  Completado | Snapshots JSONB inmutables, `shared_links` y visualizador `/p/[token]`. |
| **Reservas y Comisiones** | ⏳ Próximo | Procedimiento de separación atómica y mesa de liquidación de comisiones. |
| **Despliegue Vercel & Pruebas** | ⏳ Próximo | Configuración de proyecto en Vercel, Staging y suite E2E con Playwright. |

---

## 3. Arquitectura del CRM de Contactos y Leads Estilo GoHighLevel (GHL)

```
┌─────────────────────────┬──────────────────────────────────────────┬─────────────────────────┐
│  COLUMNA 1 (IZQUIERDA)  │           COLUMNA 2 (CENTRAL)            │  COLUMNA 3 (DERECHA)    │
│  Perfil y Atributos     │       Timeline Omnicanal Unificado       │  Pipeline & Tareas      │
├─────────────────────────┼──────────────────────────────────────────┼─────────────────────────┤
│ • Avatar y Datos Base   │ • Acciones Rápidas:                      │ • Selector de Etapa:    │
│   (Nombre, Email, Tel)  │   [+ Nota] [+ Llamada] [+ WhatsApp]      │   [1. Nuevo Lead]       │
│ • Preferencias DND      │   [+ Reunión] [+ Tarea]                  │   [2. Contactado]       │
│   (Do Not Disturb):     │                                          │   [3. Calificado]       │
│   [ Email] [ WhatsApp] │ • Feed Cronológico Unificado:            │   [4. Propuesta]        │
│   [ Llamadas] [ Idioma] │   - Notas internas de seguimiento        │   [5. Negociación]      │
│ • Etiquetas (Tags)      │   - Registro de llamadas salientes       │   [6. Reserva]          │
│ • Campos Personalizados │   - Mensajes WhatsApp enviados           │                         │
│   - Origen / Atribución │   - Generación de propuestas con token   │ • Proyectos de Interés  │
│   - Residencia / País   │                                          │   - Link a disponibilidad│
│   - Protección 60 días  │ • Filtros de Feed:                       │ • Tareas Pendientes     │
│                         │   [Todo] [Notas] [Mensajes] [Tareas]     │   - Checklist dinámico  │
└─────────────────────────┴──────────────────────────────────────────┴─────────────────────────┘
```

---

## 4. Próximos Pasos para Completar la Plataforma

1. **Mesa Transaccional de Reservas:** Función Postgres para bloqueo atómico de unidades e inicio de cuenta regresiva de 48h para validación de depósito.
2. **Panel CRUD de Inventario en `/portal/admin`:** Alta y edición de proyectos y unidades directamente desde la interfaz administrativa.
3. **Despliegue en Vercel:** Conectar la rama `main` al proyecto Vercel, configurar variables de entorno y validar ejecución en Staging.
