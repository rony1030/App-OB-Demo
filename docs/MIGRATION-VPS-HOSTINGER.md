# Migración a VPS Hostinger — Plan Completo

> Documento de referencia para migrar OB Brokers desde Supabase Cloud hacia un VPS propio en Hostinger.
> Última actualización: 2026-09-21

---

## 1. Arquitectura actual (Supabase Cloud)

| Componente | Servicio | Detalle |
|------------|----------|---------|
| **App** | Hostinger (Node.js, despliegue desde GitHub) | Next.js 16 (App Router), puerto 3006 dev |
| **Auth** | Supabase Auth (GoTrue) | 9 usuarios, email+password, JWT |
| **Base de datos** | Supabase PostgreSQL | ~30 tablas, 109 migraciones, RLS extensivo |
| **Storage** | Supabase Storage | 2 buckets: `public-assets`, `private-documents` |
| **Email** | SMTP Hostinger | `smtp.hostinger.com:465`, ya configurado |
| **CDN proxy** | Next.js rewrites | `/cdn-storage/*` → Supabase Storage (reduce egress) |
| **Cron** | API route protegida | `/api/cron/translation-audit` |
| **AI** | Gemini API (pool de 3 keys) | Traducciones, auditoría |

### Inventario de datos

| Tabla | Filas | Tabla | Filas |
|-------|-------|-------|-------|
| organizations | 16 | agreements | 1 |
| memberships | 12 | presentations | 4 |
| projects | 8 | presentation_versions | 17 |
| units | 605 | contacts | 2 |
| lots | 12 | engagement_events | 212 |
| typologies | 44 | notifications | 7 |
| project_media | 207 | audit_events | 1,218 |
| project_documents | 3 | invitations | 4 |
| document_versions | 3 | organization_relationships | 9 |
| payment_plans | 9 | brand_profiles | 6 |
| payment_plan_steps | 35 | amenities | 82 |

**Storage:**
- `public-assets`: 4 carpetas org (`bello-valdez-enterprise/`, `cana-rock-osvaldo-bello/`, `cana-rock/`, `ob-brokers-team/`)
- `private-documents`: 3 archivos PDF (brochures Cosmos Stelar, ~3.5 MB c/u)

**Auth:** 9 usuarios registrados

---

## 2. Arquitectura destino (VPS Hostinger)

```
VPS Hostinger
├── PostgreSQL 16+       ← BD propia (sin RLS cost de Supabase)
├── Supabase self-hosted ← Auth (GoTrue) + Storage + PostgREST
│   └── Docker Compose
├── Next.js 16 (standalone)
│   └── Node.js 22 LTS, PM2
├── Nginx reverse proxy
│   ├── :443 → Next.js (:3000)
│   ├── /auth → GoTrue (:9999)
│   ├── /storage → Storage API (:5000)
│   └── /rest → PostgREST (:3001)
└── Certbot (Let's Encrypt SSL)
```

### Alternativa simplificada (sin self-host completo)

Si el objetivo es solo **dejar de pagar Supabase**, se puede mantener Supabase Auth + Storage gratis y solo mover la BD:

```
VPS Hostinger
├── PostgreSQL 16+       ← BD propia
├── Next.js 16 (standalone)
└── Nginx + Certbot

Supabase Cloud (Free tier)
├── Auth (GoTrue)        ← gratis hasta 50K MAU
└── Storage              ← 1 GB gratis, luego $0.021/GB
```

**Ventaja:** mucho más simple, el SDK de Supabase sigue funcionando para auth y storage.
**Desventaja:** dependencia parcial en Supabase, límites del free tier.

---

## 3. Orden de migración recomendado

### Fase 0 — Preparar VPS (Día 1)

- [ ] Comprar VPS Hostinger (mínimo 4 GB RAM, 2 vCPU, 80 GB SSD)
- [ ] Ubuntu 24.04 LTS
- [ ] Instalar: `postgresql-16`, `nginx`, `certbot`, `nodejs` (v22 LTS via nvm), `pm2`
- [ ] Configurar firewall (ufw): solo 22, 80, 443
- [ ] Crear usuario no-root para la app
- [ ] Configurar DNS: `brokers.osvaldobello.com` → IP del VPS

### Fase 1 — Base de datos (Día 2)

**Lo más crítico. Sin downtime.**

1. **Exportar esquema completo de Supabase:**
   ```bash
   # Desde la máquina local con acceso al proyecto Supabase
   pg_dump --schema-only --no-owner --no-privileges \
     "postgresql://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres" \
     > schema.sql
   ```

2. **Exportar datos:**
   ```bash
   pg_dump --data-only --no-owner \
     "postgresql://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres" \
     > data.sql
   ```

3. **Importar en VPS:**
   ```bash
   sudo -u postgres createdb obbrokers
   sudo -u postgres psql obbrokers < schema.sql
   sudo -u postgres psql obbrokers < data.sql
   ```

4. **Verificar funciones `private.*`:**
   Las funciones RLS (`has_org_role`, `has_org_slug_role`, `can_view_project`) viven en el schema `private` y dependen de `auth.uid()` y `auth.jwt()`. Si se mantiene Supabase Auth, estas funciones siguen funcionando con PostgREST. Si se migra auth, hay que adaptar estas funciones.

5. **Crear roles de PostgreSQL:**
   ```sql
   -- Si se usa Supabase self-hosted:
   CREATE ROLE authenticator LOGIN PASSWORD 'xxx';
   CREATE ROLE anon NOLOGIN;
   CREATE ROLE authenticated NOLOGIN;
   GRANT anon TO authenticator;
   GRANT authenticated TO authenticator;
   ```

#### Consideraciones importantes de BD

- **109 migraciones** con RLS extensivo — las policies son el corazón de la seguridad
- Schema `private` con funciones de autorización que dependen de `auth.uid()` y `auth.jwt()`
- Schema `extensions` con `citext`
- Triggers de `set_updated_at()` en todas las tablas
- Trigger de auditoría que inserta en `audit_events`
- Funciones RPC expuestas via PostgREST
- **No hacer `pg_dump` del schema `auth`** — GoTrue lo gestiona

### Fase 2 — Storage (Día 3)

**Opción A: Supabase Storage self-hosted (Docker)**

```yaml
# docker-compose.yml (fragmento)
storage:
  image: supabase/storage-api:latest
  environment:
    STORAGE_BACKEND: file
    FILE_STORAGE_BACKEND_PATH: /var/lib/storage
    PGRST_JWT_SECRET: "tu-jwt-secret"
  volumes:
    - ./storage-data:/var/lib/storage
```

**Opción B: Sistema de archivos local + API propia**

Reemplazar las llamadas a Supabase Storage con un API route de Next.js que lea/escriba del disco del VPS.

**Opción C: S3-compatible (Cloudflare R2, MinIO)**

- Cloudflare R2: sin egress fees, 10 GB gratis
- MinIO: self-hosted en el VPS

**Archivos a migrar:**

| Bucket | Contenido | Tamaño aprox. |
|--------|-----------|---------------|
| `public-assets` | Logos, renders, imágenes de proyectos | ~500 MB |
| `private-documents` | PDFs de brochures (3 archivos) | ~11 MB |

```bash
# Descargar todos los archivos de Supabase Storage
# Para cada archivo en el bucket:
curl -o file.ext \
  "https://whrimmszdeghblbktivp.supabase.co/storage/v1/object/public/public-assets/path/to/file" \
  -H "Authorization: Bearer SERVICE_ROLE_KEY"
```

### Fase 3 — Auth (Día 4)

**Opción A: Supabase Auth self-hosted (GoTrue)**

```yaml
# docker-compose.yml (fragmento)
auth:
  image: supabase/gotrue:latest
  environment:
    GOTRUE_DB_DRIVER: postgres
    GOTRUE_DB_DATABASE_URL: postgres://...
    GOTRUE_JWT_SECRET: "tu-jwt-secret"
    GOTRUE_SMTP_HOST: smtp.hostinger.com
    GOTRUE_SMTP_PORT: 465
    GOTRUE_SMTP_USER: no-reply@osvaldobello.com
    GOTRUE_SMTP_PASS: "xxx"
```

**Opción B: Mantener Supabase Auth (gratis)**

50K MAU gratis. Con 9 usuarios actuales, hay margen de sobra. Solo cambiar la URL de la BD en el proyecto de Supabase no es posible — Supabase Auth está atado a su instancia.

**Opción C: Auth propio con NextAuth / Auth.js**

Reescribir la capa de auth. Mucho trabajo pero elimina toda dependencia.

**Migración de usuarios:**

```sql
-- Exportar de Supabase (schema auth)
-- IMPORTANTE: los passwords están hasheados con bcrypt, son portables
SELECT id, email, encrypted_password, raw_app_meta_data, raw_user_meta_data, created_at
FROM auth.users;
```

### Fase 4 — Despliegue de Next.js (Día 5)

```bash
# Build standalone
cd /opt/obbrokers
npm ci
npm run build

# PM2 ecosystem
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

**ecosystem.config.cjs:**
```js
module.exports = {
  apps: [{
    name: 'obbrokers',
    script: '.next/standalone/server.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOSTNAME: '0.0.0.0',
    },
  }],
};
```

**next.config.js — cambios necesarios:**
```js
// Añadir output standalone
output: 'standalone',

// Cambiar el rewrite del CDN proxy
async rewrites() {
  return [{
    source: '/cdn-storage/:path*',
    // Apuntar al storage local en vez de Supabase
    destination: 'http://localhost:5000/storage/v1/:path*',
  }];
},
```

### Fase 5 — Nginx (Día 5)

```nginx
server {
    listen 443 ssl http2;
    server_name brokers.osvaldobello.com;

    ssl_certificate /etc/letsencrypt/live/brokers.osvaldobello.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/brokers.osvaldobello.com/privkey.pem;

    # Next.js app
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 55m;
    }

    # Static assets con cache largo
    location /_next/static {
        proxy_pass http://127.0.0.1:3000;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 4. Variables de entorno en el VPS

```env
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

NEXT_PUBLIC_SITE_URL=https://brokers.osvaldobello.com
NEXT_PUBLIC_APP_URL=https://brokers.osvaldobello.com

# Si se mantiene Supabase Auth (opción más simple):
NEXT_PUBLIC_SUPABASE_URL=https://whrimmszdeghblbktivp.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_Au-aayWtou-etfPRvaBShg_ksAdxsLa
SUPABASE_SERVICE_ROLE_KEY=...

# Si se usa Supabase self-hosted:
# NEXT_PUBLIC_SUPABASE_URL=https://brokers.osvaldobello.com
# Generar nuevos JWT secrets

# BD directa (para queries que no usen el SDK de Supabase):
DATABASE_URL=postgresql://obbrokers:PASSWORD@127.0.0.1:5432/obbrokers

NEXT_SERVER_ACTIONS_ENCRYPTION_KEY=...  # generar nuevo
CRON_SECRET=...                         # generar nuevo

SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=no-reply@osvaldobello.com
SMTP_PASS=...
SMTP_FROM=no-reply@osvaldobello.com
AGENCY_REVIEW_EMAIL="Osvaldo Bello Group" <clientes@osvaldobello.com>
ADMIN_NOTIFICATION_EMAIL="Osvaldo Bello Group" <clientes@osvaldobello.com>

GEMINI_API_KEY=...
GEMINI_POOL=...
GEMINI_TRANSLATION_MODELS=gemini-3.6-flash,gemini-3.5-flash,gemini-2.5-flash
TRANSLATION_AUDIT_BATCH_SIZE=12
TRANSLATION_AUDIT_MIN_AGE_DAYS=7

CANA_ROCK_AVAILABILITY_URL=https://portal.canarock.info
CANA_ROCK_AVAILABILITY_API_KEY=...
```

---

## 5. Cambios en el código

### 5.1 Si se mantiene Supabase Auth (mínimos cambios)

Solo cambiar la BD subyacente si se conecta via connection string directo. Las queries via SDK siguen igual.

### 5.2 Si se migra todo (cambios significativos)

| Archivo | Cambio |
|---------|--------|
| `lib/supabase/config.ts` | Apuntar a URL local |
| `lib/supabase/storage.ts` | `getCdnPrefix()` apuntar a storage local |
| `lib/supabase/middleware.ts` | Adaptar cookies si cambia el auth provider |
| `next.config.js` | `output: 'standalone'`, rewrites al storage local |
| `next.config.js` | CSP headers: quitar `*.supabase.co`, añadir dominio propio |
| `next.config.js` | `images.remotePatterns`: quitar supabase.co |
| `components/ui/OptimizedImage.tsx` | Adaptar detección de URLs de storage |

### 5.3 RLS y funciones `private.*`

Si se usa PostgREST self-hosted, las funciones `auth.uid()` y `auth.jwt()` funcionan igual. Si se usa un ORM directo (Prisma/Drizzle), hay que **reimplementar la autorización en la capa de aplicación** — esto es el cambio más grande y riesgoso.

**Funciones críticas del schema `private`:**
- `has_org_role(target_organization_id, allowed_roles)` — verifica membresía
- `has_org_slug_role(target_slug, allowed_roles)` — verifica por slug de org
- `can_view_project(target_project_id)` — acceso a proyecto (membresía o acuerdo activo)
- `set_updated_at()` — trigger de timestamp
- Trigger de auditoría en `audit_events`

---

## 6. Backups y rollback

### Antes de migrar

```bash
# Backup completo de Supabase
pg_dump --format=custom \
  "postgresql://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres" \
  > backup_$(date +%Y%m%d).dump

# Backup de Storage (todos los archivos)
# Script que descarga recursivamente ambos buckets
```

### En el VPS

```bash
# Cron de backup diario
0 3 * * * pg_dump --format=custom obbrokers > /backups/obbrokers_$(date +\%Y\%m\%d).dump
0 4 * * * find /backups -name "*.dump" -mtime +30 -delete
```

### Plan de rollback

1. DNS tiene TTL de 300s — revertir el A record a Vercel/hosting anterior
2. Supabase Cloud sigue activo durante la transición (no borrar hasta verificar 7 días)
3. Si falla auth: revertir `NEXT_PUBLIC_SUPABASE_URL` al cloud

---

## 7. Checklist día de migración

- [ ] Backup completo de BD y Storage
- [ ] VPS configurado y accesible por SSH
- [ ] PostgreSQL instalado y configurado
- [ ] Schema + datos importados y verificados
- [ ] GoTrue / auth configurado (si aplica)
- [ ] Storage migrado y accesible
- [ ] Next.js build exitoso en el VPS
- [ ] PM2 corriendo la app
- [ ] Nginx configurado con SSL
- [ ] Variables de entorno configuradas
- [ ] DNS apuntando al VPS
- [ ] Probar login de usuario real
- [ ] Probar carga de página de proyecto
- [ ] Probar descarga de documento
- [ ] Probar subida de documento
- [ ] Probar generación de propuesta/dossier
- [ ] Verificar que el cron de traducciones funciona
- [ ] Monitorear logs 24h después

---

## 8. Costos comparativos

| Concepto | Supabase Cloud (actual) | VPS Hostinger |
|----------|------------------------|---------------|
| BD | $25/mes (Pro) | Incluido en VPS |
| Auth | Incluido | Incluido (GoTrue self-hosted) |
| Storage | $0.021/GB + egress | Incluido (disco VPS) |
| Egress | $0.09/GB (estaba al 260%) | Incluido (ancho de banda VPS) |
| Hosting app | $0-20/mes (Vercel/Hostinger) | Incluido en VPS |
| **VPS** | — | ~$10-25/mes (4GB RAM) |
| **Total estimado** | ~$45-70/mes | ~$10-25/mes |

---

## 9. Riesgos y mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| RLS no funciona igual sin PostgREST | Alta | Crítico | Usar Supabase self-hosted con PostgREST |
| Downtime durante migración | Media | Alto | Migrar en horario bajo, TTL de DNS bajo |
| Pérdida de datos | Baja | Crítico | Backup antes de migrar, no borrar Supabase hasta verificar |
| SSL/certificados | Baja | Medio | Certbot con renovación automática |
| Performance del VPS | Media | Medio | Monitorear con htop/pg_stat, escalar si necesario |
| Uploads grandes fallan | Media | Medio | Nginx `client_max_body_size 55m` |

---

## 10. Recomendación

**Enfoque por fases, mínimo riesgo:**

1. **Fase inmediata** (ya hecho): CDN proxy para reducir egress
2. **Fase 1**: Comprar VPS, instalar PostgreSQL, migrar solo la BD
3. **Fase 2**: Mover Next.js al VPS (dejar auth y storage en Supabase Cloud gratis)
4. **Fase 3** (opcional, cuando el free tier no alcance): Self-host storage con MinIO o Cloudflare R2
5. **Fase 4** (solo si necesario): Self-host auth con GoTrue

Cada fase es independiente y reversible. No hay presión para hacer todo de golpe.
