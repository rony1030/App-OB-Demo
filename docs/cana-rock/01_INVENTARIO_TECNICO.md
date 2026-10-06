# Inventario técnico verificable de Cana Rock

**Ciclo:** 001<br>
**Corte:** 3 de septiembre de 2026<br>
**Origen:** `C:\Users\Rony\Documents\GitHub\cana-rock.osvaldobello`<br>
**Destino:** App OB Brokers

## Resultado ejecutivo

- El repositorio local de Cana Rock está limpio y coincide con su referencia local `origin/main` en `7f64e4d606568ddf6f77f667fcae036e0a048cce` (`0` commits delante y `0` detrás).
- No fue posible refrescar la referencia desde GitHub durante este ciclo por falta de conexión de red; por eso esta confirmación es válida contra la última referencia descargada, no contra el servidor remoto en tiempo real.
- La base responde correctamente y fue inspeccionada dentro de una transacción declarada de solo lectura.
- Motor: MariaDB `11.8.8`; 48 tablas InnoDB.
- La estructura contiene únicamente 3 claves foráneas declaradas. La mayoría de las relaciones dependen de convenciones y código, lo que aumenta el riesgo de registros huérfanos durante una copia directa.
- Se encontraron 132 coincidencias de creación o alteración de tablas dentro de rutas y librerías de ejecución. En el destino deben reemplazarse por migraciones versionadas.
- Los archivos binarios guardados en base ocupan aproximadamente 1.40 GiB solo en cuatro tablas. Deben migrarse a Storage con hash, MIME, tamaño, visibilidad y versión, no a columnas binarias de PostgreSQL.

## Conteos exactos de tablas

Los conteos siguientes provienen de `COUNT(*)`, no de estimaciones del motor.

| Dominio | Tabla | Filas |
|---|---|---:|
| Brokers | `active_brokers_status` | 28 |
| Brokers | `brokers` | 23 |
| Brokers/social | `broker_instagram_posts` | 25 |
| Actividad | `activity_logs` | 0 |
| Disponibilidad | `availability_change_history` | 149 |
| Disponibilidad | `availability_unit_overrides` | 5 |
| Disponibilidad | `availability_unit_snapshots` | 133 |
| Contenido | `blog_posts` | 0 |
| Bot | `bot_ai_errors` | 0 |
| Bot | `bot_api_usage_logs` | 51 |
| Bot | `bot_availability_requests` | 0 |
| Bot | `bot_pending_requests` | 0 |
| Bot | `bot_system_errors` | 0 |
| Campañas | `campaign_popup_settings` | 1 |
| Creativos | `canva_templates` | 0 |
| CRM | `client_reports` | 0 |
| CRM | `commercial_goals` | 0 |
| Sistema | `db_backups` | 6 |
| Email | `drip_campaigns` | 0 |
| Email | `drip_steps` | 0 |
| Email | `email_logs` | 0 |
| Email | `email_templates` | 0 |
| Email | `email_unsubscribes` | 0 |
| Seguridad | `failed_login_attempts` | 5 |
| Telemetría | `homefest_telemetry` | 218 |
| CRM | `leads` | 0 |
| Operación | `operational_updates` | 0 |
| Telemetría | `page_access_logs` | 480 |
| Telemetría | `page_traffic` | 17 |
| Proyectos | `projects_custom_links` | 4 |
| Proyectos | `project_amenities` | 42 |
| Proyectos | `project_assets` | 136 |
| Proyectos | `project_compiled_documents` | 14 |
| Proyectos | `project_details` | 4 |
| Proyectos | `project_galleries` | 35 |
| Proyectos | `project_typologies` | 0 |
| Proyectos | `project_typology_units` | 0 |
| Propuestas | `proposal_access_logs` | 137 |
| Propuestas | `proposal_links` | 51 |
| Propuestas | `proposal_review_history` | 29 |
| Reservas | `provisional_blocks` | 0 |
| Reservas | `reservations` | 0 |
| Social | `social_media_reports` | 8 |
| Telegram | `telegram_bot_keys` | 1 |
| Telegram | `telegram_chat_logs` | 102 |
| Telegram | `telegram_pending_media_groups` | 0 |
| Telegram | `telegram_processed_updates` | 80 |
| Telegram | `telegram_sessions` | 4 |

## Volumen principal dentro de MariaDB

| Tabla | Filas | Datos aproximados | Tratamiento destino |
|---|---:|---:|---|
| `project_compiled_documents` | 14 | 594 MiB | Storage privado + versión + hash |
| `db_backups` | 6 | 470 MiB | No importar como dato operativo; conservar respaldo externo validado |
| `project_assets` | 136 | 304 MiB | Storage público/privado según visibilidad |
| `projects_custom_links` | 4 | 66 MiB | Separar configuración de cualquier binario embebido |

El volumen combinado aproximado es 1.40 GiB. Antes de transferir archivos se deben detectar duplicados por SHA-256 y definir retención.

## Archivos versionados en `public`

- 41 archivos; 56.8 MiB totales.
- PNG: 21 archivos / 25.7 MiB.
- MP4: 1 archivo / 22.8 MiB.
- PDF: 5 archivos / 6.6 MiB.
- SVG: 3 archivos / 1.0 MiB.
- Otros: JPG, JPEG, WebP, HTML, DOCX y JSON.
- El video principal pesa 22.8 MiB y cuatro PNG superan 3 MiB. Se conservará el aspecto visual, pero se generarán derivados optimizados para entrega web.
- El manifiesto SHA-256 encontró dos grupos duplicados: una imagen del campo de golf repetida en dos rutas y el logo de Cana Rock repetido en tres rutas. Se puede deduplicar el almacenamiento conservando alias/rutas lógicas.

## Disponibilidad: fuente y precedencia observadas

1. API del portal de Cana Rock por identificador de proyecto.
2. Normalización en servidor.
3. Correcciones locales de tipología/parqueos.
4. Snapshots e historial local.
5. Google Sheets como respaldo desde el navegador.
6. Última copia válida en almacenamiento local del navegador.

Hallazgo de seguridad: existe una credencial de la API de disponibilidad incorporada como valor de respaldo en el código. No se reproduce en este documento. Debe rotarse y sustituirse por un secreto exclusivo del servidor antes de activar el nuevo conector.

### Línea base pública en producción

Comprobación resumida del 3 de septiembre de 2026:

| Proyecto | HTTP | Fuente declarada | Unidades | Normalizador nuevo |
|---|---:|---|---:|---|
| Star | 200 | `canarock_portal_api` | 44 | 44 válidas / 0 inválidas |
| Universe | 200 | `canarock_portal_api` | 12 | 12 válidas / 0 inválidas |
| Galaxy | 200 | `canarock_portal_api` | 17 | 17 válidas / 0 inválidas |
| Stelar | 200 | `canarock_portal_api` | 44 | 44 válidas / 0 inválidas |

Esta consulta verificó solo contrato y conteos; no persistió unidades ni datos comerciales en App OB Brokers.

## Relaciones declaradas

Solo se encontraron estas claves foráneas:

- `drip_steps.campaign_id` → `drip_campaigns.id`
- `drip_steps.template_id` → `email_templates.id`
- `email_logs.template_id` → `email_templates.id`

Para el resto, la migración deberá construir un mapa heredado, validar referencias y reportar huérfanos antes de insertar.

## Herramienta reproducible

El script `scripts/migration/cana-rock/inventory-mysql.cjs` consulta servidor, tablas, conteos, columnas y claves foráneas sin leer contenido de negocio. Abre una transacción de solo lectura y la revierte al terminar. El script `scripts/migration/cana-rock/inventory-assets.cjs` genera el manifiesto de tamaño, extensión, proyecto sugerido y SHA-256. Ninguno contiene ni imprime contraseñas.

## Pendientes de cierre

- Repetir `git fetch` de Cana Rock cuando GitHub esté accesible.
- Crear un respaldo cifrado y probar una restauración aislada.
- Guardar el manifiesto completo de archivos como evidencia del lote cuando se autorice la transferencia.
- Rotar la credencial de disponibilidad y confirmar su propietario.
- Definir retención para backups, telemetría, conversaciones y datos personales.
