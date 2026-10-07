<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Reglas Operativas para el Agente en App-OB-Demo

> **IMPORTANTE**: Este repositorio (`C:\Users\Rony\Documents\GitHub\App-OB-Demo` / `rony1030/App-OB-Demo`) es completamente **independiente** del repositorio principal.
> Cualquier cambio que se realice aquí se destina única y exclusivamente a la aplicación demo pública en **`demo.osvaldobello.com`**.
> **Nunca** aplicar cambios cruzados que afecten las bases de datos ni el código del repositorio principal `App OB Brokers`.

## Plan y Hoja de Ruta
Consulta detallada en [PLAN-DEMO.md](file:///C:/Users/Rony/Documents/GitHub/App-OB-Demo/PLAN-DEMO.md).

## Flujo de Despliegue Vercel
- **Team:** `rony-8f47`
- **Proyecto:** `demo-osvaldobello`
- **Token:** Vercel Personal Access Token
- **Comando:** `npx vercel --prod --yes --token <TU_VERCEL_TOKEN>`

## 1. Identificación del Despliegue mediante `NEXT_PUBLIC_APP_SCOPE`

En este repositorio, el valor siempre es:
- `NEXT_PUBLIC_APP_SCOPE=demo`

## 2. Variables de Entorno en Vercel

1. `NEXT_PUBLIC_APP_SCOPE`: `demo`
2. `NEXT_PUBLIC_SUPABASE_URL`: URL del proyecto Supabase
3. `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anon Key de Supabase
4. `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key
5. `SMTP_HOST`: `smtp.hostinger.com`
6. `SMTP_PORT`: `465`
7. `SMTP_USER`: Correo de envío transaccional
8. `SMTP_PASS`: Contraseña SMTP
9. `INVESTOR_DEMO_ACCESS_CODE`: `DEMO2026`
