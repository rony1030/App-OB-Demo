# Hostinger production setup

This project is a Node.js/Next.js application, not a static export. In hPanel,
create a **Node.js Web App**, connect this repository, select Node.js 24, and
use these commands:

```text
Install: npm ci
Build: npm run build
Start: npm run start
```

`npm run start` deliberately does not force a port. Hostinger supplies `PORT`
to the running application.

## Environment variables

In the application's **Environment variables** section, choose **Import from
.env file** and paste the values from `.env.example`. Hostinger keeps
these values out of Git; do not upload a completed `.env` file into the
repository.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Yes | Canonical public URL, including `https://`. |
| `NEXT_PUBLIC_APP_URL` | Yes | URL used in invitation and notification links. |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Browser-safe Supabase publishable key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only key for public translation lookup and scheduled audits. Never prefix it with `NEXT_PUBLIC_`. |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | Yes | A stable base64 32-byte key. Generate it once and do not change it between deployments. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Yes for email | Delivery of reservation, payment, lead and confirmation notifications. |
| `AGENCY_REVIEW_EMAIL`, `ADMIN_NOTIFICATION_EMAIL` | Recommended | Fallback operational recipients. Per-project recipients stay configurable in the CRM. |
| `GEMINI_POOL` | Recomendado | JSON privado con `{ alias, key, model }`. Usa la siguiente clave solo si la actual falla. |
| `GEMINI_API_KEY` | Opcional | Respaldo de una sola clave para compatibilidad. |
| `GEMINI_TRANSLATION_MODELS` | Recommended | Ordered fallback list. A failed model falls through to the next one. |
| `GEMINI_INVENTORY_MODEL` | Recommended | Gemini model for optional inventory extraction. |
| `CRON_SECRET` | Yes for automatic audits | Separate secret that authorizes the private audit route. |
| `TRANSLATION_AUDIT_BATCH_SIZE` | Recommended | Maximum new machine translations reviewed per run. Default: `12`. |
| `TRANSLATION_AUDIT_MIN_AGE_DAYS` | Recommended | Do not audit a machine translation again before this age. Default: `7`. |
| `CANA_ROCK_AVAILABILITY_URL`, `CANA_ROCK_AVAILABILITY_API_KEY` | Only if live inventory is enabled | Cana Rock availability connector. |

Do not set `PORT` manually unless hPanel explicitly asks for it.

## Generate the two application secrets

Run each command once in a local terminal, store the result in a password
manager, then paste it into hPanel. The two values must be different.

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Use the first result as `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` and the second as
`CRON_SECRET`.

## Translation memory and quality control

Every translatable field is stored in Supabase under its organization, content
type, content ID, field path, target language and a hash of the source text.
That means:

1. Existing approved or generated translations are returned from Supabase with
   no Gemini request and no new credit use.
2. Gemini is only called when the source is new or changed.
3. A manually edited translation is saved as `reviewed` and is never replaced
   by an automated audit.
4. The scheduled audit reads only `machine_translated` records not reviewed in
   the configured period. It stores score, findings and a suggested correction
   for a human to approve.
5. Customer names, payment information, reservations and private negotiation
   notes must not be submitted to the translation service. Translate templates
   and public/editorial content; keep merge fields such as `{{client_name}}`
   untouched.

The memory accepts `project`, `landing`, `proposal`, `dossier`, `blog` and
`crm` content. The current public project landing already resolves its stored
content at runtime. New blog, proposal and dossier editors should call the
same translation actions when their editable fields are saved, rather than
calling Gemini directly.

## Weekly audit

After deployment, create a weekly Hostinger cron job that performs a GET or
POST request to:

```text
https://YOUR-DOMAIN/api/cron/translation-audit
```

Send either header below with the exact `CRON_SECRET` value:

```text
Authorization: Bearer YOUR_CRON_SECRET
```

or

```text
x-cron-secret: YOUR_CRON_SECRET
```

The endpoint returns counts for passed, needs-review and failed checks. Do not
make it public. A translation issue can also be reported in **Soporte** as an
incidence.

## Before changing DNS

1. Apply the two new Supabase migration files in the Supabase SQL editor.
2. Import the environment variables in hPanel and deploy.
3. Open **Portal > Configuración Global** as an administrator. Every required
   production card should show `Configurado`; this screen never exposes secret
   values.
4. Test sign-in, a reservation notification email, an English landing page,
   the French landing page, and the protected audit endpoint.
5. Only then point the domain DNS to Hostinger.
