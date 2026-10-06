# Roadmap y registro de decisiones — App OB Brokers

**Estado de referencia:** 29 de septiembre de 2026
**Progreso Global:** Fundaciones, Autenticación SSR, CRM Avanzado (GoHighLevel) y Persistencia de Propuestas Completadas.

---

## 1. Roadmap de Implementación por Fases

### Fase 0 — Definición y Fundaciones Técnicas
- [x] Crear y versionar documentación viva en `docs/`.
- [x] Repositorio privado en GitHub (`rony1030/App-OB-Brokers`).
- [x] Proyecto Supabase activo en `us-east-1` (`whrimmszdeghblbktivp`).
- [x] Esquema relacional con RLS, claves foráneas e índices; las diferencias detectadas en producción se detallan en `docs/07_AUDITORIA_20260929.md`.
- [x] Buckets de Storage configurados (`public-assets` y `private-documents`).
- [x] Migraciones versionadas y `seed.sql` estructurado.
- [x] Conexión Next.js 16 (React 19, TypeScript) con clientes Supabase (Browser y SSR).
- [x] Carga y migración de recursos de marca y proyectos a Supabase Storage.
- [x] Lectura dinámica del catálogo de proyectos e inventario desde Supabase Postgres.
- [x] Producción en Hostinger con despliegue automático desde Git.

### Fase 1 — Identidad, Autenticación y Multiempresa (Fase A)
- [x] Implementar Supabase Auth SSR con cookies seguras y refresco automático de sesión (`lib/supabase/middleware.ts`).
- [x] Crear pantalla de Login institucional con diseño moderno y validaciones (`app/login/page.tsx`).
- [x] Middleware / Proxy de Next.js (`proxy.ts`) para protección de rutas según rol (`/portal`, `/portal/admin`, `/portal/dev`).
- [x] Server Actions de login, logout y obtención de usuario activo (`lib/auth/get-user.ts` y `app/auth/actions.ts`).
- [x] Actualización del Shell del Portal (`PortalShell.tsx`) con nombre de usuario, rol, organización y menú de cierre de sesión.

### Fase 2 — Catálogo Maestro e Inventario Operativo
- [x] Consulta pública y de portal de proyectos y unidades desde base de datos.
- [ ] CRUD administrativo de proyectos, tipologías, amenidades y planes de pago en `/portal/admin`.
- [ ] Módulo de carga masiva de inventario (CSV/Excel) con validación y reporte de discrepancias.
- [ ] Historial visual de cambios de precio por unidad en la ficha técnica.
- [ ] Centro documental de proyecto: subida de brochures, listas de precios oficiales y planos a Storage privado con URLs firmadas.

### Fase 3 — CRM Avanzado y Contactos 360 (Estilo GoHighLevel) (Fase B)
- [x] Modelo de datos relacional para contactos, oportunidades, reportes, actividades, notas, tags y consentimientos DND.
- [x] **Smart Lists de Contactos:** Interfaz de lista inteligente con filtros combinados multicriterio y guardado de pestañas personalizadas (`components/portal/crm/SmartLists.tsx`).
- [x] **Ficha 360 del Contacto en 3 Columnas (`app/portal/clientes/[id]` y `components/portal/crm/ContactDetail360.tsx`):**
  - Columna 1: Perfil, canales de contacto, switches DND (Email/SMS/WhatsApp/Calls), tags y campos personalizados.
  - Columna 2: Timeline omnicanal (notas, llamadas, WhatsApp, reuniones y tareas) con acciones rápidas.
  - Columna 3: Oportunidades activas en pipeline, proyectos de interés vinculados y tareas con fecha/hora de vencimiento.
- [x] **Acciones Masivas (Bulk Actions):** Selección múltiple, reasignación y exportación a CSV estructurado.
- [x] **Creación y Protección de Leads:** Formulario `/portal/leads/new` conectado a Server Actions (`app/portal/crm/actions.ts`) con inserción en `contacts`, `lead_reports` (60 días de exclusividad) y `opportunities`.
- [x] **Tablero Kanban de Oportunidades:** Pipeline visual en `/portal/leads` con métricas monetarias por columna.

### Fase 4 — Motor Documental (Propuestas y Dossiers Interactivos) (Fase C)
- [x] Interfaz y componentes del editor de presentaciones.
- [x] Persistencia de propuestas en `presentations` y snapshots inmutables en `presentation_versions` (`app/portal/proposals/actions.ts`).
- [x] Generación de enlaces compartibles (`shared_links`) con token criptográfico y expiración a 30 días.
- [x] Visualizador público de propuestas `/p/[token]` conectado a base de datos.
- [x] Telemetría y registro automático de generación de propuestas en el timeline del contacto.

### Fase 5 — Mesa de Cierre, Reservas y Comisiones
- [ ] Flujo transaccional de separación de unidad con subida de comprobante a Storage privado.
- [ ] Bloqueo atómico de inventario para evitar colisiones entre brokers.
- [ ] Panel de validación y aprobación de reservas para Desarrolladores y Master Broker.
- [ ] Módulo de liquidación de comisiones con cálculo automático por participantes.

### Fase 6 — Pruebas, Observabilidad y Producción
- [x] Ocho suites de regresión ejecutables con `npm test`; las pruebas simuladas de aislamiento no sustituyen una verificación real de RLS.
- [ ] Pruebas E2E con Playwright simulando flujos de Broker, Master Broker y Desarrollador.
- [ ] Monitoreo de errores (Sentry) y métricas de rendimiento de base de datos.
- [ ] Backup periódico automatizado y ensayo documentado de recuperación de desastres.
- [ ] Revisar capacidad y planes comerciales de Supabase y Hostinger según el uso real.

---

## 2. Registro Histórico de Decisiones de Arquitectura

### 2026-08-15 — Implementación de Fases A, B y C
- **Decisión:** Implementar autenticación SSR completa con `proxy.ts`, CRM de Contactos y Smart Lists estilo GoHighLevel (GHL) con Ficha 360 en 3 columnas, y motor de persistencia de propuestas con snapshots JSONB inmutables y tokens públicos.
- **Motivo:** Cumplir con los requerimientos funcionales solicitados por el usuario, dotando a la plataforma de una identidad institucional de alto nivel y capacidades operativas reales.
- **Resultado:** Build de producción de Next.js 16 compilando de forma óptima en 3.0s con 0 errores.
