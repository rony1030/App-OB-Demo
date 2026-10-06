# Reporte de Auditoría — App OB Brokers

**Fecha:** 2026-09-20  
**Proyecto:** White-Label SaaS Platform for Master Brokers & Real Estate Networks  
**Stack:** Next.js 16 + Supabase + TypeScript + Tailwind CSS

---

## Resumen ejecutivo

Se auditaron 104 archivos en `app/`, 141 componentes, 67 módulos en `lib/` y 7 archivos de tipos. Se identificaron **20 hallazgos** clasificados en 4 categorías de severidad.

| Severidad | Cantidad | Estado |
|-----------|----------|--------|
| Crítico   | 5        | Por corregir |
| Alto      | 5        | Por corregir |
| Medio     | 6        | Por corregir |
| Bajo      | 4        | Mejoras sugeridas |

---

## Hallazgos críticos

### C1. Endpoint sin autenticación — sync-palm-view
- **Archivo:** `app/api/sync-palm-view/route.ts` (líneas 7-14)
- **Descripción:** El handler `GET` ejecuta `syncGoogleSheetInventory` con un project ID y URL de Google Sheet hardcodeados, sin ninguna verificación de autenticación. Cualquier persona puede disparar un sync completo de inventario accediendo a esta URL.
- **Riesgo:** Abuso de API, manipulación de datos de inventario, costos de cómputo no autorizados.
- **Remedio:** Agregar verificación de cron secret o auth de admin.

### C2. Credenciales hardcodeadas como fallback
- **Archivo:** `lib/supabase/config.ts` (líneas 1-2)
- **Descripción:** La URL y anon key de Supabase están hardcodeadas como valores por defecto. Si las variables de entorno no están configuradas, la app se conecta silenciosamente a un proyecto específico. Los valores persisten en el historial de git.
- **Riesgo:** Exposición de credenciales, conexión a proyecto incorrecto en ambientes de desarrollo/staging.
- **Remedio:** Lanzar error si las env vars no están definidas en vez de usar fallbacks.

### C3. IDOR en descarga de image-pack
- **Archivo:** `app/api/projects/[id]/image-pack/download/route.ts` (líneas 6-85)
- **Descripción:** Solo verifica que el proyecto exista, no que el usuario tenga acceso a la organización del proyecto. Cualquier usuario autenticado puede enumerar IDs y descargar metadatos de imágenes de cualquier proyecto.
- **Riesgo:** Fuga de datos entre organizaciones.
- **Remedio:** Verificar que el usuario pertenezca a la organización del proyecto.

### C4. Server action body size limit de 50MB
- **Archivo:** `next.config.js` — `serverActions.bodySizeLimit: '50mb'`
- **Descripción:** Límite excesivamente alto para server actions. El valor por defecto de Next.js es 1MB.
- **Riesgo:** Vector de denegación de servicio (DoS).
- **Remedio:** Reducir a 4-5MB para la mayoría de actions; usar uploads directos a Supabase Storage para archivos grandes.

### C5. Middleware silenciosamente permite acceso en error
- **Archivo:** `lib/supabase/middleware.ts` (línea 64, bloque catch)
- **Descripción:** Si Supabase falla (outage, timeout), el catch silenciosamente llama `next()` permitiendo acceso sin autenticación a rutas `/portal/*`.
- **Riesgo:** Acceso no autenticado durante fallas de Supabase.
- **Remedio:** Redirigir a `/login` en el catch en vez de permitir acceso.

---

## Hallazgos altos

### A1. Sin rate limiting en endpoints públicos
- **Archivos:** `app/api/public/proposals/[token]/decision/route.ts`, `app/api/public/project-inquiries/route.ts`, `app/api/public/proposals/[token]/telemetry/route.ts`
- **Descripción:** Rutas públicas sin limitación de tasa.
- **Remedio:** Implementar rate limiting básico con headers o middleware.

### A2. ~40+ `as any` casts eliminando type safety
- **Archivos principales:** `lib/data/crm.ts` (10), `app/portal/crm/actions.ts` (7+), `lib/data/agreements.ts` (4), `lib/i18n/content-translations.ts` (3), `app/portal/support/actions.ts` (1)
- **Descripción:** Casts `as any` generalizados que anulan la seguridad de tipos en queries a Supabase.
- **Remedio:** Regenerar tipos con `supabase gen types` y eliminar casts progresivamente.

### A3. Validación de entrada insuficiente en server actions
- **Archivos:** 13 de 19 archivos de actions sin `try/catch`
- **Descripción:** Actions aceptan datos del usuario sin validación estructurada. Errores no capturados resultan en 500 genéricos.
- **Remedio:** Agregar `try/catch` y considerar Zod para validación de inputs.

### A4. `dangerouslyAllowSVG: true` en next.config
- **Archivo:** `next.config.js`
- **Descripción:** Permite renderizar SVGs a través del optimizador de imágenes, lo cual es un vector de XSS si se sirven imágenes de fuentes no confiables.
- **Remedio:** Evaluar si es necesario; si sí, agregar `contentDispositionType: 'attachment'`.

### A5. IP almacenada sin consentimiento (GDPR)
- **Archivo:** `app/api/public/proposals/[token]/telemetry/route.ts` (líneas 49, 128-131)
- **Descripción:** Se almacenan IPs sin banner de consentimiento.
- **Remedio:** Hashear/anonimizar IPs o agregar aviso de privacidad.

---

## Hallazgos medios

### M1. 9 paquetes de desarrollo en `dependencies`
- **Archivo:** `package.json`
- **Paquetes:** `@types/jszip`, `@types/leaflet`, `@types/nodemailer`, `@types/node`, `@types/react`, `@types/react-dom`, `typescript`, `autoprefixer`, `postcss`
- **Remedio:** Mover a `devDependencies`.

### M2. Sin tests automatizados
- **Descripción:** Playwright en devDependencies pero sin archivos de test. Sin Jest/Vitest. Cero cobertura.
- **Remedio:** Configurar Vitest y agregar tests para rutas críticas.

### M3. Código duplicado masivo en slide templates
- **Archivos:** `components/portal/creative/templates/` — 17 archivos con 4 variantes (A/B/C/D)
- **Descripción:** `ContentSlide.tsx` vs `ContentSlideB.tsx` son prácticamente idénticos, solo difieren en clases de Tailwind.
- **Remedio:** Refactorizar a componente base con prop `variant`.

### M4. Doble llamada a `getCurrentUser` en portal layout
- **Archivo:** `app/portal/layout.tsx` (líneas 18 y 62)
- **Descripción:** Dos round-trips a Supabase auth por cada request del portal.
- **Remedio:** Llamar una vez y pasar el resultado.

### M5. `robots.ts` no excluye rutas sensibles
- **Archivo:** `app/robots.ts`
- **Descripción:** No excluye `/auth/`, `/login`, `/desarrolladores/` del crawling.
- **Remedio:** Agregar reglas de disallow.

### M6. CSP incompleto en next.config
- **Archivo:** `next.config.js`
- **Descripción:** Solo configura `base-uri`, `form-action` y `frame-ancestors`. Falta `script-src`, `style-src`, `default-src`.
- **Remedio:** Completar la política CSP.

---

## Hallazgos bajos / mejoras

### B1. Sin `.env.example` completo
- **Remedio:** Crear `.env.example` documentando todas las variables requeridas.

### B2. Sin `error.tsx` en rutas del portal
- **Remedio:** Agregar error boundaries en `/portal` y rutas críticas.

### B3. Cron secret comparado con `===`
- **Archivo:** `app/api/cron/translation-audit/route.ts` (línea 12)
- **Remedio:** Usar `crypto.timingSafeEqual`.

### B4. PWA intercepta F5 globalmente
- **Archivo:** `components/pwa/PwaManager.tsx` (líneas 84-88)
- **Remedio:** Condicionar el listener a modo standalone.

---

## Lo que está bien

- TypeScript `strict: true` habilitado
- Supabase SSR correctamente integrado con `@supabase/ssr`
- Separación clara de server/client components
- Arquitectura modular bien organizada (lib/data, lib/auth, lib/integrations)
- Auth flow seguro: no expone si un email existe en password reset/magic link
- File uploads validan tipo, tamaño y sanitizan paths
- Headers de seguridad parcialmente configurados (HSTS, X-Frame-Options, Permissions-Policy)
