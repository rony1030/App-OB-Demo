# Progreso del Proyecto — OB Brokers CRM

> Última actualización: 10 de septiembre 2026

---

## 1. Correcciones Rápidas (Completadas)

| Solicitud | Estado | Archivos |
|-----------|--------|----------|
| Cambiar "60 Días" → "180 Días" en Hero y MarqueeTicker | Completado | `components/landing/Hero.tsx`, `components/landing/MarqueeTicker.tsx` |
| Reemplazar dropdown nativo por select moderno en "Perfil Profesional" | Completado | `components/landing/AccessSection.tsx` |
| Agregar logo Cipres (isotipo + texto) en navbar del landing | Completado | `components/landing/ProjectSalesLanding.tsx` |
| Plan de pago: solo 12 y 24 meses (no 6, 18) | Completado | `components/landing/ProjectSalesLanding.tsx` |
| Cambiar "Metraje" → "Metraje Const." en catálogo | Completado | `components/landing/ProjectCatalog.tsx` |
| "OB Brokers" → "OB Brokers Team" en todos los footers y títulos | Completado | `CanaRockDeveloperHub.tsx`, `not-found.tsx`, `login/page.tsx`, `proyectos/[slug]/page.tsx` |
| Agregar link a página principal de OB Brokers Team en footers de landings | Completado | `ProjectSalesLanding.tsx`, `CanaRockProjectLanding.tsx`, `CanaRockDeveloperHub.tsx` |
| "Ver Mapa Ampliado" → "Ver Ubicación en Maps" con link a Google Maps | Completado | `ProjectSalesLanding.tsx`, `landing-config.ts` (campo `googleMapsUrl`) |
| Input "Choose File" nativo → botón estilizado en español | Completado | `MyDocuments.tsx`, `ProjectDocumentsPanel.tsx` |
| Cipres en catálogo interpreta disponibilidad como solares/lotes con 3 tipologías construibles y precio mínimo por opción de villa | Completado | `lib/data/projects.ts`, `lib/portal-projects.ts`, `components/landing/ProjectCatalog.tsx`, `components/landing/ProjectSalesLanding.tsx` |
| Cipres: baños corregidos por tipología, logo texto en footer y defaults auditados contra memoria/FAQ | Completado | `lib/data/cipres-typologies.ts`, `ProjectSalesLanding.tsx`, `LandingBuilder.tsx`, `landing-config.ts` |
| Cipres: rediseño de Calidades, Master Plan, galería dinámica, ZIP con marca de agua y reserva reembolsable | Completado | `ProjectSalesLanding.tsx`, `lib/image-pack-download.ts`, `app/api/projects/[id]/image-pack/download/route.ts`, `landing-config.ts` |
| Cipres: "Precio desde" del portal calculado desde disponibilidad viva, no desde la ficha cargada | Completado | `lib/data/projects.ts` |
| Roles por agencia: administrador, soporte y vendedor con permisos separados y bloqueo de acciones sensibles | Completado | `lib/auth/permissions.ts`, `PortalShell.tsx`, `ProjectDetail.tsx`, `proposals/actions.ts`, `agreements/page.tsx`, `user-actions.ts`, migración Supabase |
| Configuración de agencia: documentos corporativos, soporte operativo y perfil comercial de vendedores para dossiers | Completado | `app/portal/agency`, `lib/data/agency.ts`, `AdminUsersManager.tsx`, `buildAgentProfile.ts`, migración Supabase |

---

## 2. Landing Pages 100% Editables (Plan de 6 Fases)

### Fase A: Expandir tipos de configuración — COMPLETADA

Se agregaron 7 interfaces y 14 campos nuevos al sistema de config:

- `LandingAmenityItem`, `LandingFaqItem`, `LandingFeatureCard`, `LandingSpecCard`
- `LandingStatItem`, `LandingProximityItem`, `LandingFinancialConfig`
- Campos: `amenities`, `faqs`, `features`, `specs`, `stats`, `proximityItems`, `financial`, `locationTitle`, `locationSubtitle`, `footerLocation`, `navbarLogoUrl`, `navbarLogoTextUrl`, `googleMapsUrl`

**Archivo:** `lib/data/landing-config.ts`

### Fase B: Hacer ProjectSalesLanding 100% dinámico — COMPLETADA

Todo el contenido hardcodeado de Cipres Residences fue reemplazado por datos dinámicos del config:

| Sección | Antes (hardcodeado) | Ahora (dinámico) |
|---------|---------------------|-------------------|
| Galería por defecto | 13 imágenes de Cipres | `config.customGallery` → `project.gallery` |
| Stats bento grid | 389 unidades, 204 m², US$500, KYSER CONSTRUCTION | `config.stats[]` |
| Features (3 cards) | Estructura Monolítica, Plaza Comercial, Títulos | `config.features[]` |
| Specs (6 cards) | Hormigón, Porcelanato, Mobiliario, etc. | `config.specs[]` |
| Amenidades (8 items) | Casa Club, Canchas, Seguridad, etc. | `config.amenities[]` |
| Ubicación/proximidad (6 items) | Av. Circunvalación, Hospital, Golf, etc. | `config.proximityItems[]` |
| Título ubicación | "Ubicación Estratégica en Bávaro" | `config.locationTitle` |
| FAQs (6 items) | Preguntas específicas de Cipres | `config.faqs[]` |
| Calculadora financiera | US$500, 10/20/70% | `config.financial` |
| Navbar logo | Check por `project.slug === 'cipres-residences'` | `config.navbarLogoUrl` + `config.navbarLogoTextUrl` |
| Footer ubicación | "Bávaro · Punta Cana · República Dominicana" | `config.footerLocation` |
| Meta description | Texto de Cipres hardcodeado | `project.shortDescription` |
| Concept description | Texto de 143,000 m² | `config.concept.description` |
| Mapa de ubicación | Imagen hardcodeada Cipres | `config.locationMapUrl` + `config.googleMapsUrl` |

Importaciones muertas eliminadas: `CIPRES_RESIDENCES_TYPOLOGIES`, `CIPRES_INTERNAL_GALLERY`, variables `bentoImage1/2`, `exteriorRenders`.

**Archivo principal:** `components/landing/ProjectSalesLanding.tsx`

---

### Fase C: Expandir LandingBuilder con tabs nuevos — PENDIENTE

Agregar al editor del CRM (`LandingBuilder.tsx`) las tabs necesarias para poder editar desde la interfaz todo lo que se dinamizó en Fase B:

- [ ] Tab "Estadísticas" — editor de stats (valor + label)
- [ ] Tab "Amenidades" — lista editable con agregar/eliminar
- [ ] Tab "Características" — features y specs cards editables
- [ ] Tab "FAQs" — preguntas y respuestas editables
- [ ] Tab "Ubicación" (expandir) — título, subtítulo, proximityItems, Google Maps URL, footer location
- [ ] Tab "Calculadora" (expandir payment) — monto reserva, porcentajes, meses disponibles
- [x] Tab "Branding" (expandir) — URLs editables de isotipo + logo texto para navbar/footer
- [ ] Tab "Hero" (expandir) — inputs para badge text, CTA text, starting price text
- [ ] Tab "Concepto" (expandir) — inputs para bullet1, bullet2, bullet3

### Fase D: Tipologías 100% DB-driven — PENDIENTE

- [ ] Eliminar fallback a `CIPRES_RESIDENCES_TYPOLOGIES` en `project-typologies-db.ts`
- [ ] Agregar tab "Tipologías" al LandingBuilder para editar tipologías desde CRM
- [ ] Cada tipología: nombre, tagline, precio, m², habitaciones, baños, parqueos, imagen
- [ ] Guardar como `project_media` con `kind = 'document_preview'`
- [x] Corregir defaults de Cipres: Esmeralda 1 baño, Perla 2 baños, Ámbar 2 baños

### Fase F: Migrar datos existentes de Cipres — PENDIENTE

- [ ] Guardar los datos hardcodeados actuales de Cipres como config en la DB (amenidades, FAQs, stats, specs, features, proximidad, financial)
- [ ] Guardar tipologías como registros `document_preview`
- [ ] Subir logos de Cipres como URLs en el config (`navbarLogoUrl`, `navbarLogoTextUrl`)

### Fase E: Unificar CanaRock al mismo sistema — PENDIENTE

- [ ] `CanaRockProjectLanding.tsx` lee de `config.amenities` si están definidos
- [ ] Mover `CANA_ROCK_APPLIANCES` al config editable
- [ ] Mover rentabilidad hardcodeada de Star al `config.profitability` editable
- [ ] No fusionar los dos componentes aún — son experiencias visuales distintas

---

## 3. Funcionalidades para Página Principal (NO para landings de proyectos) — PENDIENTE

Estas son para la página principal de OB Brokers Team (`/`):

- [ ] Sección de brokers con fotos reales (los que tienen acceso al sistema)
- [ ] Sección de colaboradores/agencias con logos
- [ ] Sección de redes sociales (posts de Instagram, Facebook, TikTok, YouTube de los proyectos)
- [ ] Inspiración: algo similar a cana-rock.osvaldobello pero más moderno

---

## 4. Otros Pendientes

| Tarea | Estado | Prioridad |
|-------|--------|-----------|
| Fixes de seguridad críticos (OWASP) | Pendiente | Alta |
| Pipeline/Negociaciones UI | Pendiente | Media |
| No crear usuario de Verónica Pufol (usuario lo hará) | N/A | — |
| SMTP en `.env.local`, no en código fuente | Verificar | Alta |
| Parqueos mostrando "—" en catálogo | Mitigado en catálogo con lectura de Cipres como solares + tipologías; pendiente edición 100% DB-driven en Fase D | Media |
| Magic Link solo para usuarios activos | Hecho: valida perfil y membresía activa antes de solicitar correo a Supabase | Alta |
| Invitación de agencias con revisión previa | Hecho: formulario público de alta, estado pendiente de revisión y correo interno a OB antes de activar acceso | Alta |
| Solicitud pública de acceso con primer correo | Hecho: confirma por correo al solicitante y notifica internamente para revisión | Alta |

---

## Archivos Clave Modificados

```
lib/data/landing-config.ts              — Tipos + config expandido (Fase A)
components/landing/ProjectSalesLanding.tsx — 100% dinámico (Fase B)
components/landing/ProjectCatalog.tsx    — "Metraje Const.", tarjeta Cana Rock 100% dinámica, cards clickeables, fallback Cipres por tipologías
lib/data/projects.ts                    — Expone tipologías al catálogo y conserva starting_price como respaldo
lib/portal-projects.ts                  — Tipos públicos de tipologías y typologyId de unidades
components/landing/Hero.tsx              — 180 Días
components/landing/MarqueeTicker.tsx     — 180 Días
components/landing/AccessSection.tsx     — Custom select moderno
components/landing/CanaRockProjectLanding.tsx — Footer OB Brokers Team
components/developers/CanaRockDeveloperHub.tsx — OB Brokers Team
components/portal/documents/MyDocuments.tsx — File input estilizado
components/portal/documents/ProjectDocumentsPanel.tsx — File input estilizado
app/not-found.tsx                        — OB Brokers Team
app/login/page.tsx                       — OB Brokers Team + año dinámico
app/proyectos/[slug]/page.tsx            — OB Brokers Team
public/projects/cipres-residences/       — Logos (isotipo, logo, logo-texto)
app/auth/magic-actions.ts                — Magic Link validado contra cuenta/membresía activa
app/(public)/invite/actions.ts           — Alta de agencia pendiente de revisión
components/portal/auth/AcceptInvitationCard.tsx — Formulario especial para agencias invitadas
lib/email/mailer.ts                      — Correos de solicitud recibida y revisión interna
supabase/migrations/20260910133000_agency_onboarding_review.sql — Tabla/estado de onboarding de agencias
```
