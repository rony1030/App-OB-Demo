<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Arquitectura Multi-Despliegue Vercel & Supabase

Este repositorio está preparado para funcionar tanto en despliegue unificado (Hostinger / VPS) como en múltiples proyectos independientes de Vercel utilizando el mismo código fuente conectado a GitHub.

## 1. Identificación del Despliegue mediante `NEXT_PUBLIC_APP_SCOPE`

Cada proyecto en Vercel debe definir la variable de entorno `NEXT_PUBLIC_APP_SCOPE`:

| Valor de `NEXT_PUBLIC_APP_SCOPE` | Subdominio Sugerido | Propósito & Rutas Activas |
| :--- | :--- | :--- |
| `demo` | `demo.osvaldobello.com` | **Paso 1:** Entorno para tutoriales/videos con el usuario `soporte@osvaldobello.com` (Proyecto aislado "Villas en Punta Cana") y `/inversionista/demo`. |
| `portals` | `inversionistas.osvaldobello.com` | **Paso 2:** Portal del Inversionista (`/inversionista` con código OTP por email) y Portal del Desarrollador (`/portal/developer`). |
| `crm` | `crm.osvaldobello.com` | **Paso 3:** CRM comercial para brokers y master broker (`/portal`, `/p/[token]`, simulador y propuestas). |
| `public` | `brokers.osvaldobello.com` o `www.` | **Paso 4:** Catálogo general público y landings de proyectos (`/`, `/proyectos`, `/cana-rock`, etc.). |
| `all` *(por defecto)* | Hostinger / Localhost | Ejecuta la suite completa sin filtros de rutas. |

## 2. Variables de Entorno Obligatorias en cada Cuenta de Vercel

En cada proyecto de Vercel (en **Settings > Environment Variables**), deben cargarse:

1. `NEXT_PUBLIC_APP_SCOPE`: `demo` (o `portals`, `crm`, `public` según corresponda).
2. `NEXT_PUBLIC_SUPABASE_URL`: URL del proyecto Supabase.
3. `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anon Key de Supabase.
4. `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key para consultas administrativas seguras.
5. `SMTP_HOST`: `smtp.hostinger.com` (para envío de OTPs y correos transaccionales).
6. `SMTP_PORT`: `465`.
7. `SMTP_USER`: Correo de envío transaccional.
8. `SMTP_PASS`: Contraseña SMTP de Hostinger.
9. `INVESTOR_DEMO_ACCESS_CODE`: Clave de acceso a `/inversionista/demo` (por defecto `DEMO2026`).

## 3. Soporte y Gestión mediante Vercel CLI (para Agentes de IA)

Para que el asistente de IA o CLI pueda inspeccionar despliegues, logs y errores de cada cuenta de Vercel:
- **Token de Acceso:** Puedes generar un Vercel Personal Access Token en `vercel.com/account/tokens` y pasarlo en comandos:
  ```bash
  npx vercel --token <TU_VERCEL_TOKEN>
  npx vercel logs <URL_DEL_DESPLIEGUE> --token <TU_VERCEL_TOKEN>
  ```
- **Identificación de Proyectos:** Cada despliegue de Vercel genera un Project ID (`prj_...`) y Team ID/User ID vinculados al repositorio.
