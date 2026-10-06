# Portal del inversionista — traspaso y guía de continuidad

Estado al 2026-10-03. Producción: Hostinger (`https://brokers.osvaldobello.com`), se despliega al hacer push a `main`.
Este documento permite retomar el trabajo en otra PC o sesión sin contexto previo.

## 1. Qué existe

| Ruta | Qué es |
|---|---|
| `/inversionista` | Login por código de acceso + 3 botones de demostración |
| `/inversionista/[code]` | Portal del cliente (4 pestañas: Mi unidad, Estado de cuenta, Documentos, Avances de obra) |
| `/inversionista/pasarela-demo` | Página que simula el portal externo de un desarrollador (solo demo del modo «redirección») |

Códigos demo (no existen en la base de datos; viven en código):

| Código | Cliente | Escenario |
|---|---|---|
| `CLI-ALDIA-001` | Carlos Mendoza | 1 unidad, Cana Rock, al día |
| `CLI-MIXTO-002` | Dra. Elena Ramos | 3 unidades: Ciprés (al día), UVE (vencida), Palm View (legal) |
| `CLI-ENTREGA-003` | Ing. Roberto Valenzuela | 3 unidades: Cana Rock (entregada), Palm View (en construcción), UVE (en entrega con Pago Insoluto) |

Cifras de referencia (las valida `scripts/test-investor-account.ts`): UVE-115 → 2 cuotas vencidas US$ 7,000 + mora US$ 650; UVE-108 → Insoluto US$ 120,000 + 3 cuotas US$ 12,000 + mora US$ 1,800 = **US$ 133,800** para recibir llaves.

## 2. Mapa de archivos

```
app/(public)/inversionista/
  page.tsx                 Login + demos
  actions.ts               checkInvestorCodeAction (límite 12 intentos / 10 min por IP)
  [code]/page.tsx          Portal (force-dynamic, noindex)
  [code]/actions.ts        reportPaymentAction (reporte de pago)
  pasarela-demo/page.tsx   Demo del modo redirección
components/portal/InvestorPortalDashboard.tsx   Orquestador: cabecera fija, portada, tarjetas, pestañas, barra inferior móvil
components/portal/investor/
  UnitPicker.tsx           Tarjetas de inmueble (swipe en móvil)
  UnitOverview.tsx         Resumen, barra de liquidación, plan de pagos
  AccountStatement.tsx     KPIs, cronograma, comprobantes
  PaymentReport.tsx        Formulario / guía de reporte de pago según el modo
  AttentionNotice.tsx      Avisos: vencida, legal, entrega (Insoluto), entregada
  DocumentsPanel.tsx · ConstructionReports.tsx · AdvisorCard.tsx · AccessForm.tsx · status.ts
lib/investor/account.ts          Motor de cálculo (puro): estados, mora, insoluto, plan
lib/investor/payment-report.ts   Tipos y validación del reporte (cliente + servidor)
lib/data/investor-portal.ts      Lee BD o demo y arma los datos del portal
lib/data/investor-demo.ts        Clientes demo (fechas relativas: nunca caducan)
lib/data/investor-demo-construction.ts   Bitácora de obra demo con fotos reales
lib/data/payment-flows.ts        Flujos de pago: demo en código; reales desde la BD
scripts/test-investor-account.ts Pruebas (se ejecutan con `npm test`)
supabase/migrations/20261003120000_investor_account_statements.sql
supabase/migrations/20261003180000_investor_payment_reports.sql
```

## 3. Cómo funciona el estado de cuenta

Nada se guarda agregado. Todo se calcula en `computeAccount` desde las filas de `reservation_installments` y dos columnas de `reservations`:

- `delivery_status`: `negotiation` | `in_construction` | `ready_for_delivery` | `delivered`
- `collection_status`: `normal` | `legal`
- `contract_price` (opcional; si no, se usa `units.list_price`)

Estado operativo (prioridad): entregada → legal → proceso de entrega → vencida (hay cuotas impagas con fecha pasada) → negociación → al día.
Mora: suma de `mora_amount` de las cuotas impagas (la carga operaciones; no se calcula por tasa).
Insoluto: saldo pendiente de la cuota `kind = 'delivery_balance'`.

Para dar de alta un cliente real: crear contacto con `public_code`, su oportunidad, solicitud de reserva aprobada y reserva; luego insertar sus cuotas en `reservation_installments` (tipos: `reservation`, `initial`, `construction`, `delivery_balance`, `other`). El portal lee: contacto → oportunidades → `reservation_requests` (approved) → `reservations` (active/converted).

Documentos del cliente: tabla `client_documents` con `visible_to_client = true` (por defecto es `false`). **Pendiente:** hoy generan enlace firmado de Supabase Storage; los archivos privados ahora llegan al almacenamiento persistente de Hostinger. Falta la ruta protegida que los sirva (ver §7).

## 4. Reporte de pagos: 4 modos por proyecto

Configuración en la tabla `project_payment_report_config` (clave `project_slug`). Solo la lee el servidor (RLS sin políticas). Si un proyecto no tiene fila → instrucciones genéricas + WhatsApp al asesor.

| Modo | Qué hace | Campos requeridos |
|---|---|---|
| `email` | Formulario; envía correo al desarrollador con el comprobante adjunto | `email_to` |
| `redirect` | Botón que abre el portal de pagos del desarrollador | `redirect_url` (https) |
| `instructions` | Pasos + botón de WhatsApp al asesor | `instructions` |
| `api` | POST JSON firmado a la API del desarrollador | `api_url` (https), `api_secret_env` |

Ejemplos de alta (ejecutar con `npx supabase db query --linked "<sql>"`):

```sql
-- Correo
insert into project_payment_report_config (project_slug, mode, developer_name, email_to, instructions)
values ('palm-view', 'email', 'Entorno Group', array['cobros@desarrollador.com'],
        '["Realice el pago a la cuenta de su contrato.","Complete el reporte con su comprobante.","Recibirá confirmación."]'::jsonb);

-- Redirección
insert into project_payment_report_config (project_slug, mode, developer_name, redirect_url, instructions)
values ('cana-rock-star', 'redirect', 'Grupo Cana Rock', 'https://pagos.ejemplo.com', '["Ingrese con su contrato.","Pague.","Se actualiza su estado."]'::jsonb);

-- API (el secreto va en hPanel como variable de entorno, NUNCA en la BD)
insert into project_payment_report_config (project_slug, mode, developer_name, api_url, api_secret_env, instructions)
values ('uve-residences', 'api', 'Dominican Condos', 'https://api.ejemplo.com/pagos', 'UVE_PAYMENTS_API_SECRET', '["Pague.","Reporte aquí.","Se concilia."]'::jsonb);
```

Contrato de la API: `POST` con cabeceras `X-OB-Report-Id` y `X-OB-Signature: sha256=<hmac hex del cuerpo con el secreto>`. Cuerpo: `reportId, project, unit, amount, currency, paidAt, method, reference, note, investor{name,email,phone,code}, receipt{fileName,contentType,base64}|null`. Responder 2xx para dar por recibido. Timeout 10 s.

Cada reporte real se guarda en `investor_payment_reports` con `delivery_status` (`pending`/`sent`/`failed`) y `delivery_error`. Si falla la entrega, el cliente ve que quedó registrado y que su asesor dará seguimiento.
El correo sale por el SMTP de Hostinger (`SMTP_USER`/`SMTP_PASS` en hPanel).

**Los clientes demo nunca envían nada**: la acción simula el resultado.

## 5. Despliegue (Hostinger)

1. `npm test` · `npx tsc --noEmit` · `npm run build` (detener antes `npm run dev`: comparten `.next`).
2. `git push origin main` → Hostinger compila y publica (~3 min).
3. Verificar: esperar a que `https://brokers.osvaldobello.com/inversionista` muestre «Su inversión, siempre a la vista».

Migraciones de Supabase: el historial remoto no coincide con los nombres locales, así que **no usar `supabase db push`**. Aplicar y registrar:

```bash
npx supabase db query --linked -f supabase/migrations/<archivo>.sql
npx supabase migration repair --status applied <version> --linked
```

Requiere `supabase login` y el proyecto vinculado (`supabase/.temp/project-ref`; si falta: `npx supabase link --project-ref whrimmszdeghblbktivp`). Las 36 migraciones que solo existían en remoto se recuperaron en `supabase/migrations/` (cabecera «Recuperada del historial remoto»); ya están aplicadas, no re-ejecutarlas.

## 6. Retomar en otra PC

```bash
git clone https://github.com/rony1030/App-OB-Brokers.git && cd App-OB-Brokers
npm install
# copiar .env.local (no está en git; plantilla: .env.hostinger.example)
npm run dev          # http://localhost:3006
```

Probar: `/inversionista`, y los 3 códigos demo. Si algo falla:

| Síntoma | Causa probable |
|---|---|
| El servidor local «se cae» al terminar un turno de Claude | La app lo cierra sola; correr `npm run dev` en tu propia terminal |
| Imágenes en blanco al cargar | Primera compilación de Next en dev; esperar unos segundos |
| `Error: ... hydration` en consola tras editar | Normal con recarga en caliente; recargar la página |
| `db push` falla con «Remote migration versions not found» | Es esperado (ver §5); usar `db query` + `migration repair` |
| `reportPaymentAction` devuelve «no se pudo registrar» en un cliente real | Falta `contacts.organization_id` o la fila de la reserva; revisar logs del servidor |
| Correo no sale | `SMTP_USER`/`SMTP_PASS` en hPanel, o `email_to` vacío en la configuración del proyecto |
| Pruebas fallan por `server-only` | Los tests importan solo `lib/investor/*` y `lib/data/investor-demo.ts` (no llevan `server-only`) |

## 7. Pendientes conocidos

1. **Documentos privados desde Hostinger.** Necesita: ruta de la carpeta persistente de privados, cómo llegan los archivos, y una ruta protegida (valida código + unidad + `visible_to_client`) que los lea del disco. Hasta entonces las descargas usan Supabase Storage.
2. **Cargar `project_payment_report_config`** de cada proyecto real (§4) y **probar un reporte real** de correo y de API.
3. **Cargar cuotas reales** de cada cliente en `reservation_installments`.
4. **Códigos de acceso largos y aleatorios** para clientes reales (el acceso es solo por código; hay límite de intentos pero no un segundo factor).
5. **Dominios propios de landings:** el verificador DNS (`lib/data/landing-config.ts`, `app/portal/admin/projects/[slug]/landing/actions.ts`, `LandingBuilder.tsx`) aún pide `cname.vercel-dns.com`. Hay que cambiarlo al destino de Hostinger.
6. **Resto de la propuesta Costa Paraíso** (págs. 7–8): proyecto Costa Paraíso, calendario de actividades, aprobaciones en línea, KPIs por proyecto, ranking de brokers, recordatorios y notificaciones por WhatsApp.
7. Limpieza de Vercel: ramas remotas `vercel/install-*` y `VERCEL_OIDC_TOKEN` en `.env.local`.
