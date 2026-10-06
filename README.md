# 🏢 App OB Brokers — SaaS Marca Blanca para Master Brokers

Plataforma integral e independiente tipo **SaaS Marca Blanca** desarrollada para la comercialización inmobiliaria de gran escala, gestión de proyectos exclusivos Master Broker, disponibilidad de inventario en tiempo real, red de inmobiliarias aliadas y **propuestas interactivas multi-propiedad**.

---

## 🚀 Módulos Principales

1. **Línea Blanca Dinámica (White-Label)**:
   - Configuración de logotipos, colores corporativos (variables CSS dinámicas) y datos de contacto según el Master Broker o la inmobiliaria aliada.
2. **Propuestas Multi-Propiedad y Comparativas**:
   - Creador interactivo para presentar de 1 a 4 propiedades en un solo enlace para el cliente con comparativas de precios, amenidades, planes de pago y retorno de inversión estimado.
3. **Gestión de Proyectos Master Broker & Matriz de Disponibilidad**:
   - Fichas completas de proyectos y control en tiempo real de unidades (Disponible, Reservado, Vendido, Bloqueado).
4. **Red de Brokers e Inmobiliarias Aliadas**:
   - Directorio de aliados, enlaces co-brandeados de venta y control de comisiones.
5. **CRM de Leads & Pipeline Comercial**:
   - Embudo de ventas desde nuevo prospecto hasta reserva y cierre.
6. **Email Marketing y Seguimientos Automatizados**:
   - Envíos de listas de precios y correos de nutrición de prospectos.
7. **Centro Documental Versionado**:
   - Gestión de brochures, contratos y documentos con versionamiento, control de acceso (público, autorizado, privado) y auditoría.
8. **Dossier y Presentaciones Interactivas**:
   - Generación de dossiers de proyecto con tipologías, specs técnicos, galería y branding dinámico.

---

## Stack Tecnologico

| Capa | Tecnologia |
|------|-----------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS 3 |
| Backend | Server Actions, API Routes, Server Components |
| Base de Datos | PostgreSQL (Supabase) con RLS extensivo |
| Auth | Supabase Auth (GoTrue), JWT, roles multi-tenant |
| Storage | Supabase Storage (public-assets, private-documents) |
| Email | Nodemailer + SMTP Hostinger |
| AI | Gemini API (traducciones, auditoria) |
| CDN | Proxy via Next.js rewrites (reduce egress) |

---

## Estructura del Proyecto

```
app/
  (public)/          # Landing pages publicas
  api/               # API routes (cron, sync)
  portal/            # Portal privado (proyectos, propuestas, documentos)
components/
  portal/            # Componentes del portal (editor, dossier, documentos)
  landing/           # Landings de proyectos
  ui/                # Componentes base (OptimizedImage, etc.)
lib/
  supabase/          # Clientes, storage, middleware, config
  data/              # Queries de datos (projects, developer, etc.)
  auth/              # Permisos y roles
  portal/            # Logica de negocio (specs, dossier)
supabase/
  migrations/        # 109 migraciones SQL
  seed.sql           # Datos iniciales
docs/
  MIGRATION-VPS-HOSTINGER.md  # Plan de migracion a VPS
```

---

## Migracion a VPS Hostinger

Se ha preparado un plan completo para migrar toda la infraestructura desde Supabase Cloud a un VPS propio en Hostinger para reducir costos (~$45-70/mes a ~$10-25/mes) y tener control total.

El documento detalla:
- Inventario completo de la arquitectura actual (BD, Auth, Storage)
- Arquitectura destino con PostgreSQL + Supabase self-hosted + Nginx
- 5 fases de migracion independientes y reversibles
- Comandos concretos para cada paso
- Variables de entorno, cambios de codigo, RLS y funciones criticas
- Costos comparativos, riesgos y checklist del dia de migracion

**[Ver plan completo de migracion](docs/MIGRATION-VPS-HOSTINGER.md)**
