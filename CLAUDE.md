@AGENTS.md

# Despliegue y producción

- **Producción está en Hostinger, no en Vercel.** El flujo es: subir a `main` en GitHub y Hostinger compila y publica automáticamente. No usar Vercel, `vercel` CLI ni `.vercel/` (la carpeta es local y está ignorada por git).
- Dominio de producción: `https://brokers.osvaldobello.com`. Las variables de entorno viven en hPanel (plantilla en `.env.hostinger.example`); nunca se commitean.
- Archivos públicos (imágenes/videos) se sirven desde el almacenamiento persistente de Hostinger por `/api/media/<ruta>` (ver `docs/HOSTINGER_ASSET_CUTOVER.md`). Supabase guarda la base de datos, la autenticación y las URLs/rutas.
- Supabase: el historial remoto de migraciones no coincide con los nombres locales. No usar `supabase db push`; aplicar SQL con `supabase db query --linked -f <archivo>` y registrar con `supabase migration repair --status applied <versión> --linked`.
- Antes de publicar: `npm test`, `npx tsc --noEmit` y `npm run build`.
- Portal del inversionista (login, demos, estado de cuenta, reporte de pagos, pendientes): leer `docs/PORTAL_INVERSIONISTA.md` antes de tocar `/inversionista` o `lib/investor/`.
