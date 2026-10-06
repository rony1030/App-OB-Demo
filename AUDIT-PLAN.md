# Plan de Corrección — Auditoría App OB Brokers

**Fecha:** 2026-09-20  
**Prioridad:** Críticos > Altos > Medios > Bajos

---

## Fase 1 — Seguridad crítica (inmediato)

### 1.1 Proteger endpoint sync-palm-view
- **Archivo:** `app/api/sync-palm-view/route.ts`
- **Acción:** Agregar verificación de `CRON_SECRET` en el header `Authorization`
- **Patrón:** Mismo patrón que `app/api/cron/translation-audit/route.ts` pero con `timingSafeEqual`

### 1.2 Eliminar credenciales hardcodeadas
- **Archivo:** `lib/supabase/config.ts`
- **Acción:** Reemplazar fallbacks hardcodeados por `throw new Error()` si las env vars no están definidas
- **Resultado:** La app falla rápido y explícito en vez de conectarse silenciosamente al proyecto equivocado

### 1.3 Corregir IDOR en image-pack download
- **Archivo:** `app/api/projects/[id]/image-pack/download/route.ts`
- **Acción:** Agregar verificación de pertenencia a organización del usuario autenticado antes de servir datos

### 1.4 Reducir body size limit
- **Archivo:** `next.config.js`
- **Acción:** Cambiar `serverActions.bodySizeLimit` de `'50mb'` a `'4mb'`

### 1.5 Corregir middleware catch silencioso
- **Archivo:** `lib/supabase/middleware.ts`
- **Acción:** En el bloque `catch`, redirigir a `/login` en vez de llamar `next()`

---

## Fase 2 — Seguridad alta

### 2.1 Completar CSP en next.config
- **Archivo:** `next.config.js`
- **Acción:** Agregar `default-src 'self'`, `script-src 'self' 'unsafe-inline' 'unsafe-eval'`, `style-src 'self' 'unsafe-inline'`, `img-src 'self' data: blob: *.supabase.co`

### 2.2 Corregir comparación de cron secret
- **Archivo:** `app/api/cron/translation-audit/route.ts`
- **Acción:** Reemplazar `===` con `crypto.timingSafeEqual`

### 2.3 Agregar `contentDispositionType` para SVGs
- **Archivo:** `next.config.js`
- **Acción:** Agregar `contentDispositionType: 'attachment'` junto a `dangerouslyAllowSVG`

---

## Fase 3 — Calidad de código y configuración

### 3.1 Mover paquetes a devDependencies
- **Archivo:** `package.json`
- **Paquetes a mover:** `@types/jszip`, `@types/leaflet`, `@types/nodemailer`, `@types/node`, `@types/react`, `@types/react-dom`, `typescript`, `autoprefixer`, `postcss`
- **Nota:** Mantener `overrides` de `@types/react` y `@types/react-dom` intactos

### 3.2 Actualizar robots.ts
- **Archivo:** `app/robots.ts`
- **Acción:** Agregar `/auth/*`, `/login`, `/dev/*` a la lista de disallow

### 3.3 Corregir doble getCurrentUser
- **Archivo:** `app/portal/layout.tsx`
- **Acción:** Llamar `getCurrentUser` una sola vez y reutilizar el resultado

### 3.4 Agregar error boundaries
- **Archivos nuevos:** `app/portal/error.tsx`, `app/portal/admin/error.tsx`
- **Acción:** Crear componentes de error boundary con UI amigable y botón de retry

### 3.5 Crear .env.example
- **Archivo nuevo:** `.env.example`
- **Acción:** Documentar todas las variables de entorno requeridas con placeholders

### 3.6 Condicionar PWA refresh handler
- **Archivo:** `components/pwa/PwaManager.tsx`
- **Acción:** Solo registrar el listener de F5 cuando `isStandalone` es true

---

## Fuera de alcance (mejoras futuras)

Las siguientes mejoras se documentan pero no se ejecutarán en esta iteración:

- **Refactorizar slide templates** — requiere QA visual extenso
- **Eliminar `as any` casts** — requiere regenerar tipos de Supabase con acceso al proyecto
- **Agregar validación Zod** — cambio extenso en 19 archivos de actions
- **Implementar rate limiting** — requiere decisión de infraestructura (Vercel Edge, Upstash, etc.)
- **Configurar Vitest** — requiere definición de estrategia de testing
- **Anonimizar IPs en telemetry** — requiere decisión de negocio sobre datos analytics

---

## Orden de ejecución

```
Fase 1 (5 archivos) → Fase 2 (2 archivos) → Fase 3 (6 archivos)
```

**Archivos totales a modificar:** 11  
**Archivos nuevos:** 3 (`app/portal/error.tsx`, `app/portal/admin/error.tsx`, `.env.example`)
