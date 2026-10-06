# Matriz de paridad funcional — Cana Rock → App OB Brokers

**Leyenda:** `Existe`, `Parcial`, `Ausente`, `Reemplazar`, `Posterior`.

| Capacidad en Cana Rock | Estado en App OB Brokers | Decisión inicial | Fase |
|---|---|---|---:|
| Login, usuarios y perfiles | Existe | Migrar identidad mediante invitación/restablecimiento; no copiar contraseñas | 4 |
| Roles de administración, desarrollador y marketing | Parcial | Mapear a rol base + capacidad por proyecto | 1 |
| Organizaciones/master brokers/agencias/desarrolladores | Existe y es más fuerte | Usar el modelo multiempresa del destino | 1 |
| Responsable principal del master broker | Parcial | Añadir relación/responsabilidad explícita, no codificar una persona | 1 |
| Proyectos Star, Universe, Galaxy y Stelar | Existe como modelo | Importar contenido, marca y relaciones | 3 |
| Landing pública Cana Rock | Parcial | Incorporar renderer/experiencia Cana Rock sin rediseñar | 3 |
| Idiomas y textos legales | Parcial | Configurar por experiencia y versión | 3 |
| Galerías, amenidades y activos | Existe | Migrar binarios a Storage y metadatos a tablas actuales | 3 |
| Brochure, fact sheet y documentos | Existe | Usar documentos/versiones; mantener rutas heredadas cuando aplique | 3/5 |
| Disponibilidad desde portal | Ausente como conector genérico | Crear adaptador Cana Rock con secreto de servidor | 2 |
| Respaldo por Google Sheets | Parcial | Mantener solo si negocio confirma que es fuente autorizada | 2 |
| Overrides de tipología/parqueo | Parcial | Modelar excepción auditable y con vencimiento/autor | 2 |
| Snapshots e historial de disponibilidad | Existe parcialmente | Unificar con corridas, fuente, hash y reconciliación | 2 |
| Bloqueos provisionales y reservas | Existe y es más fuerte | Mapear reglas de expiración y estados | 2/4 |
| Propuestas de una propiedad | Existe | Adaptar plantilla Cana Rock | 5 |
| Propuestas multi-propiedad | Existe y es más fuerte | Mantener capacidad del destino | 5 |
| Revisión, corrección y aprobación | Parcial | Añadir flujo explícito/versionado sobre presentaciones | 5 |
| Enlaces públicos y telemetría | Existe | Importar enlaces compatibles y normalizar eventos | 5/7 |
| Dossiers por proyecto | Existe | Permitir plantilla distinta por experiencia de proyecto | 5 |
| CRM de contactos y oportunidades | Existe y es más fuerte | Migrar datos y completar vistas faltantes sin cambiar el shell | 4/6 |
| Estado/actividad de brokers | Parcial | Agregar métricas operativas por organización/proyecto | 6/7 |
| Estadísticas geográficas y tráfico | Parcial | Normalizar eventos con consentimiento y retención | 7 |
| Metas comerciales | Ausente | Incorporar como módulo configurable, después del núcleo | 7 |
| Blog | Ausente | Módulo posterior o integración CMS | 6+ |
| Campañas emergentes | Ausente | Configuración posterior por landing/proyecto | 6+ |
| Email marketing y secuencias | Ausente | Módulo posterior con consentimiento y bajas | 6+ |
| Canva/Instagram/reportes sociales | Parcial | Integrar al estudio creativo por proyecto | 6+ |
| WhatsApp | Ausente | Integración posterior y aislada por organización | 6+ |
| Telegram y asistente | Ausente | Replantear después del CRM; no migrar secretos/sesiones tal cual | 6+ |
| Backup desde ruta web | Reemplazar | Usar respaldo administrado, cifrado y prueba de restauración | 0 |
| Creación/alteración de tablas en rutas | Reemplazar | Convertir a migraciones versionadas | 0–2 |

## Primer recorrido demostrable

El primer recorrido vertical será:

`Master broker Cana Rock → proyecto Star → disponibilidad en sombra → contacto → oportunidad → propuesta con identidad Cana Rock → enlace compartido → evento de apertura → estadística por proyecto`.

Debe funcionar sin agregar condicionales permanentes por nombre de proyecto y sin cambiar el diseño existente.

## Criterio de paridad

Una fila cambia a `Existe` únicamente cuando:

1. el flujo feliz funciona;
2. permisos y acceso directo por URL están probados;
3. estados vacíos, carga y error son claros;
4. datos y eventos quedan auditados;
5. existe evidencia visual cuando hay interfaz;
6. la función opera también con un segundo master broker ficticio.
