# Registro de ciclos — incorporación de Cana Rock

## Ciclo 001 — Fundaciones y línea base

**Estado:** En progreso<br>
**Inicio:** 3 de septiembre de 2026

### Hipótesis

App OB Brokers ya contiene el núcleo multiempresa y comercial; Cana Rock puede incorporarse mediante relaciones, capacidades, conectores y experiencias por proyecto, sin rediseñar ninguna superficie existente.

### Ejecutado

- Confirmación Git de App OB Brokers: `main` coincide con `origin/main` descargado en `1fc45119ffcd6124319dfff1a5e5ad2bdeb1c259`.
- Confirmación Git local de Cana Rock: limpio y `0/0` contra `origin/main` descargado en `7f64e4d606568ddf6f77f667fcae036e0a048cce`.
- Intento de actualización remota de Cana Rock; bloqueado por conectividad con GitHub.
- Conexión de solo lectura a MariaDB.
- Inventario de 48 tablas, columnas, conteos exactos y claves foráneas.
- Inventario SHA-256 de 41 archivos públicos, dos grupos duplicados y volumen binario en base.
- Matriz de paridad funcional y matriz inicial de acceso.
- Detección de credencial incorporada en código, sin copiarla a los artefactos.
- Implementación de una utilidad repetible de inventario de solo lectura.
- Implementación del contrato y normalizador genérico del conector Cana Rock.
- Validación contra los cuatro endpoints públicos: 117 unidades recibidas, 117 válidas y 0 inválidas.
- Migración versionada preparada para conexiones, corridas, mapeos y snapshots; todavía no aplicada.
- Aprobada la separación entre Cana Rock / Osvaldo Bello como master broker y Grupo Cana Rock como desarrollador.
- Migración preparada para relaciones entre organizaciones, responsables y capacidades por proyecto.
- Dieciséis pruebas adicionales preparadas para relaciones, responsables, capacidades y aislamiento entre master brokers.

### Auditoría parcial

| Control | Resultado |
|---|---|
| Escrituras en MySQL durante inventario | No; transacción `READ ONLY` revertida |
| Secretos en documentos nuevos | No |
| Datos personales exportados | No; solo metadatos y conteos |
| Cambios visuales | Ninguno |
| Copia de datos productivos | Ninguna |
| Inventario repetible | Sí |
| Normalización de los cuatro proyectos públicos | Sí; 117/117 válidas |
| TypeScript y lint del código nuevo | Sí |
| Build de producción | Sí; compilación completada |
| Pruebas RLS preparadas | Sí; 32 comprobaciones entre ambos archivos |
| Migración aplicada/probada localmente | Pendiente; Docker Desktop no está activo |
| GitHub remoto confirmado en tiempo real | Pendiente por red |
| Respaldo restaurable | Pendiente |
| Credencial expuesta rotada | Pendiente, requiere coordinación del propietario |

### Decisión actual

**Repetir el ciclo antes de aprobar migración de datos.** Se puede avanzar en código desacoplado del conector y diseño de pruebas, pero no copiar producción ni activar sincronización.

### Próximo pase

1. Guardar el manifiesto completo como evidencia al abrir el lote de transferencia.
2. Acordar propietario y rotar la credencial del portal.
3. Confirmar contrato oficial de la API y respaldo autorizado.
4. Probar respaldo/restauración de MariaDB en un entorno aislado.
5. Implementar pruebas de normalización y de aislamiento.
6. Reintentar comparación contra GitHub remoto.

## Ciclo 002 — Alta controlada del portafolio en Supabase

**Estado:** Completado<br>
**Fecha:** 3 de septiembre de 2026

### Autorización y alcance

El propietario autorizó expresamente subir Cana Rock a la base Supabase enlazada. El alcance se limitó al catálogo comercial público: dos organizaciones, su relación, cuatro proyectos, responsables, portadas externas, conectores en pausa y disponibilidad pública. No se copiaron usuarios, leads, propuestas, documentos privados ni credenciales.

### Ejecutado

- Aplicadas las migraciones de conectores, relaciones, responsables y capacidades.
- Creadas `Cana Rock / Osvaldo Bello` como organización `master_broker` y `Grupo Cana Rock` como `developer`.
- Registrada la relación activa `master_broker_for` entre ambas organizaciones.
- Publicados Cana Rock Star, Universe, Galaxy y Cosmos Stelar.
- Importadas 116 unidades vigentes desde la API pública: Star 44, Universe 12, Galaxy 17 y Stelar 43.
- Guardados mapeos estables entre las unidades externas y el inventario canónico.
- Conectores registrados en modo `paused`/`shadow`; la credencial no se copió a la base.
- Restaurada la política pública limitada del desarrollador para exponer solo `id`, `name` y `slug` cuando tiene proyectos publicados.
- Añadido soporte para portadas HTTPS externas sin modificar el diseño visual.

### Auditoría

| Control | Resultado |
|---|---|
| Migraciones remotas | Aplicadas y registradas |
| Proyectos publicados consultables por API | 4/4 |
| Unidades públicas consultables por API | 116/116 |
| Desarrollador visible | `Grupo Cana Rock` en 4/4 proyectos |
| Duplicados por clave natural | No; alta idempotente por organización, proyecto y unidad |
| Secretos incorporados | Ninguno |
| Escritura sobre datos ajenos | Ninguna; solo claves Cana Rock |
| TypeScript, lint y build | Correctos |
| Asesores Supabase | Ejecutados; advertencias heredadas registradas para ciclo de seguridad |

### Resultado y siguiente ciclo

El catálogo inicial está operativo en Supabase. El próximo ciclo debe activar la sincronización programada, reconciliar unidades que desaparezcan de la fuente, mover/copiar activos aprobados a Storage y validar visualmente los cuatro proyectos autenticado como administrador antes de migrar CRM, documentos, propuestas o dossiers.

## Ciclo 003 — Contenido, amenidades y experiencia pública

**Estado:** Completado en local y Supabase; pendiente despliegue Vercel<br>
**Fecha:** 3 de septiembre de 2026

### Alcance confirmado

El alcance detallado de este ciclo queda incorporado a la Fase 3 del plan maestro: copiar medios de los cuatro proyectos, administrar amenidades desde el CRM, reutilizar ficha y galería en landing/propuesta/dossier, y ofrecer a Cana Rock un encabezado propio sin rediseñar las superficies existentes de otros proyectos.

### Ejecutado

- Copiados a `public-assets/cana-rock/` los 43 archivos oficiales: 35 fotos de galería, cuatro portadas y cuatro logos.
- Reconciliados por respuesta HTTP y tamaño: 43/43 archivos correctos.
- Registradas galerías por proyecto: Star 10, Universe 11, Galaxy 6 y Cosmos Stelar 8.
- Registradas 42 relaciones de amenidades: Star 11, Universe 9, Galaxy 10 y Cosmos Stelar 12.
- Incorporados nombre, descripción, resumen y plan de pago comercial de Cana Rock.
- Creada una operación segura y atómica para reemplazar amenidades por proyecto.
- Añadida al editor del CRM la administración de amenidades; sus cambios alimentan landing, propuesta, dossier y estudio creativo.
- Eliminado el filtro que descartaba imágenes válidas alojadas en Supabase.
- Creada la experiencia configurable `cana-rock-resort`, con encabezado propio, galería, amenidades e inventario en vivo.
- Conservada la ruta `cana-rock-stelar`, con el nombre visible oficial **Cana Rock Cosmos Stelar**.
- Refinada la tarjeta del catálogo público: los tres distintivos superiores se unificaron en una barra compacta, sin saltos de línea ni competencia visual sobre las portadas.
- Retiradas las etiquetas redundantes “Master broker” y “En vivo” del catálogo; el CTA ahora dice “Ver detalles”.
- Añadidos a cada proyecto rangos calculados desde el inventario publicado para habitaciones, baños, metraje y parqueos.
- La etiqueta de entrega ahora distingue proyectos en construcción, listos para entrega y ya entregados.
- Ampliadas las tarjetas del catálogo: dos columnas hasta escritorio amplio, bloques 2×2 con etiquetas completas y valores sin truncar.
- Unificada la paleta informativa en azul profundo y dorado, eliminando el naranja de los iconos del catálogo.
- Sustituida la numeración de amenidades por iconos semánticos para piscina, golf, gimnasio, yoga, vistas, ascensores, gastronomía, seguridad y parqueos.
- Reemplazados los pictogramas de especificaciones por una familia SVG lineal propia; se retiraron los fondos amarillos para dar prioridad a los datos.

### Auditoría

| Control | Resultado |
|---|---|
| Archivos en Storage | 43/43 accesibles y con tamaño coincidente |
| Proyectos con portada/logo/configuración | 4/4 |
| Galerías registradas | 35/35 |
| Relaciones de amenidades | 42/42 |
| Fuente compartida para propuesta y dossier | Confirmada en `PortalProject` y snapshots de presentación |
| TypeScript | Correcto |
| ESLint de archivos modificados | Correcto, sin errores |
| Build de producción | Correcto |
| Revisión visual local | Star, Universe, Galaxy y Cosmos Stelar cargan identidad e imagen propias |
| Legibilidad del catálogo | Datos completos en tarjetas ampliadas; metrajes largos visibles en cuadrícula 2×2 |
| Identidad de amenidades | Iconografía contextual dorada sobre el azul primario del proyecto |
| Regresión visual de otros proyectos | Renderer anterior se conserva como experiencia predeterminada |

### Siguiente ciclo

1. Publicar el commit en la rama Git y confirmar el despliegue de Vercel.
2. Verificar en producción las cuatro rutas públicas y la edición autenticada de amenidades.
3. Migrar planos, brochures y documentos oficiales por proyecto.
4. Completar tipologías visuales y planes alternativos de pago sin datos fijos de Ciprés.
5. Activar el conector de inventario en sombra con reconciliación programada.

## Ciclo 004 — Auditoría de paridad de la landing Cosmos Stelar

**Estado:** Auditoría completada; implementación por fases pendiente<br>
**Fecha:** 4 de septiembre de 2026

### Ejecutado

- Comparada la experiencia local de `/proyectos/cana-rock-stelar` con la implementación autorizada de referencia.
- Preservada exclusivamente para Cana Rock la colección SVG original de amenidades, incluidos sus pictogramas dorados.
- Separada la identidad de amenidades de Cana Rock de la iconografía propia del catálogo general.
- Documentadas las secciones que dependen de nuevos datos administrables: recursos, línea blanca, filtros de inventario, master plan/modelo, mapa, calculadora e idiomas.

### Evidencia

El detalle verificable, las dependencias y el orden de construcción quedan en `docs/cana-rock/05_AUDITORIA_LANDING_STELAR.md`.

## Ciclo 005 — Disponibilidad pública filtrable y auditoría de recursos

**Estado:** Parcial completado; recursos comerciales quedan como siguiente entrega segura<br>
**Fecha:** 4 de septiembre de 2026

### Ejecutado

- Verificadas en local las rutas de Star, Universe, Galaxy y Cosmos Stelar: las cuatro responden, mantienen su identidad, galería, amenidades, contacto y disponibilidad.
- Sustituida la muestra fija de ocho unidades por un explorador reutilizable de todo el inventario público de cada proyecto.
- Añadidos filtros por texto, estado, modelo, torre cuando aplica, habitaciones y baños; además de orden por precio, metraje o código de unidad.
- Añadidos estados comerciales visibles, resultados, mensaje vacío, carga progresiva de doce unidades y enlace de confirmación comercial; ninguna unidad marcada como no pública se muestra.
- Conectadas las visibilidades existentes del constructor al renderer Cana Rock para portada, concepto, ubicación, galería, amenidades, disponibilidad y contacto.
- Añadida la sección pública de plan de pago a partir de los pasos ya administrados por proyecto; se muestra solo cuando la configuración la habilita y existen datos.
- Simplificado el encabezado de Cana Rock: se retiró el texto contextual redundante junto al logo para priorizar navegación y marca.
- Rediseñada la galería para presentar solo portada y dos imágenes de apoyo; la tercera abre el visor completo con todas las imágenes, miniaturas, flechas, teclado, reproducción infinita cada cinco segundos y pausa manual.
- Reestructurada la disponibilidad para ocupar el ancho útil de la landing: vista inicial de tarjetas, selector inmediato Tarjetas/Lista, filtros desplegables y carga de ocho unidades por pase, sin indicador de avance de obra.
- Las tarjetas de disponibilidad responden a la pantalla: una columna en móvil, dos en tableta, tres en escritorio y cuatro en pantallas amplias.
- Añadido el submenú “Proyecto” para navegar entre Cana Rock Star, Universe, Galaxy y Cosmos Stelar, con identificación de la landing actual.
- Corregido el encabezado para móvil y escritorio intermedio: menú compacto con rutas del portafolio, logo proporcionado y sin desbordamiento horizontal.
- La moneda queda explícita en precios públicos (`USD$`, `RD$`, `EUR€` o el código que corresponda). El CRM exige un código ISO al crear o editar y el inventario hereda la moneda del proyecto.
- Aplicada la migración `20260904144852_allow_iso_currency_codes.sql` en Supabase para validar códigos ISO de moneda en proyectos, planes de pago, unidades y lotes sin afectar datos existentes.
- Confirmados 116 registros de inventario, 35 imágenes de galería y 42 relaciones de amenidades en el portafolio publicado.
- Auditada la arquitectura de documentos: el CRM ya conserva documentos versionados en `private-documents`, con RLS y enlaces firmados de cinco minutos para miembros autorizados. No se publicaron dossiers, precios ni brochures sin clasificación y aprobación explícita.

### Resultado

La experiencia ahora supera la brecha de disponibilidad pública inicial y obedece las visibilidades relevantes del constructor; está lista para revisar con equipos comerciales. El siguiente ciclo debe clasificar recursos comerciales por proyecto, sin cambiar el acceso privado existente. El detalle por proyecto, prioridades, estado de fases y siguiente ciclo queda en `docs/cana-rock/06_AUDITORIA_PORTAFOLIO_CANA_ROCK.md`.

## Ciclo 006 — Recursos comerciales y catálogo derivado de inventario

**Estado:** Gestión editorial implementada; pendiente cargar y aprobar los archivos oficiales<br>
**Fecha:** 4 de septiembre de 2026

### Ejecutado

- Convertida la carga de documentos en un flujo editorial: categoría, visibilidad, estado, versionado consecutivo, checksum SHA-256 y límite de tamaño/formato.
- Una carga inicia en revisión por defecto; solo los recursos aprobados o publicados habilitan descarga mediante enlace firmado. Los recursos públicos exigen estado publicado.
- Añadada validación de pertenencia de organización al cargar, manteniendo `private-documents` como bucket privado y sin exponer documentación legal o bancaria en la landing.
- Corregidas las tarjetas del catálogo para derivar precio, habitaciones, baños, metraje y parqueos únicamente desde unidades o lotes públicos en estado disponible.
- Si ya no queda una tipología, deja de mostrarse en su rango; si no queda inventario, la tarjeta informa “Sin unidades disponibles”. Las monedas mixtas nunca se comparan como un único precio.

### Pendiente controlado

1. Cargar y aprobar brochure y ficha técnica en español de Cana Rock Star y Cosmos Stelar.
2. Verificar descarga con un broker autorizado y denegarla con uno sin acceso.
3. Clasificar master plan, mapa, renders y video después de validar derechos de publicación.
4. Exponer en la landing solo los recursos públicos que lleguen a estado publicado.

---

## Ciclo 007 — Ficha de unidad, exportación y contenido financiero de Star

**Fecha:** 4 de septiembre de 2026

### Ejecutado

- Cada tarjeta de disponibilidad abre una ficha central responsive, no un panel lateral, con piso dentro del bloque, especificaciones, precio, estado y acción de confirmación.
- Añadidas acciones para compartir solamente el ancla de disponibilidad y para abrir un documento de disponibilidad filtrada listo para guardar como PDF.
- Incorporada la línea blanca de Cana Rock Star en la ficha de unidad: nevera, estufa eléctrica, extractor, lavadora-secadora y aires acondicionados; se presenta solo cuando el proyecto la configura.
- Incorporada la sección editorial de rentabilidad de Cana Rock Star con tres tipologías, fuente y descargo de no garantía.
- Aplicada y verificada en Supabase la migración `20260904160723_add_star_unit_details_and_profitability.sql`.
- Corregido el Estudio Creativo para que portada, cierre, texto comercial y exportaciones muestren la moneda ISO real del proyecto (`USD$`, `RD$`, `EUR€` u otra configurada), en vez de asumir USD.
- Verificado en producción el 4 de septiembre: Star publica la rentabilidad, los precios con `USD$`, 44 unidades, las acciones de PDF/compartir y la apertura de ficha por unidad.
- Auditadas las galerías de los cuatro desarrollos: las 43 imágenes registradas responden desde `public-assets` de Supabase; `project_media` conserva la relación, orden y texto alternativo de cada archivo.

### Control editorial

- Línea blanca y rentabilidad permanecen como configuración de landing por proyecto. No se heredan ni se muestran en otros desarrollos sin contenido aprobado.
- La ficha conserva el inventario vivo: precio, estado y especificaciones provienen de cada unidad pública disponible.

### Pendiente controlado

1. Exponer estos bloques en el formulario visual del editor de landing para edición no técnica por administradores.
2. Probar en navegador autenticado la descarga/compartición y las exportaciones completas del Estudio Creativo antes de abrirlo a brokers.

---

## Ciclo 008 — Editor editorial de landing

**Estado:** Completado<br>
**Fecha:** 4 de septiembre de 2026

### Ejecutado

- Añadida la pestaña “Editorial” al diseñador de landing (`LandingBuilder.tsx`), reorganizando la navegación en una cuadrícula simétrica 3×3.
- Creado el panel de administración de **Línea blanca**: interruptor de activación por proyecto, texto de calificación/exención (ej. CONFOTUR), lista dinámica y ordenable de equipamiento (mover arriba/abajo, editar y eliminar) y vista previa en miniatura de la ficha.
- Creado el panel de administración de **Rentabilidad y Retorno (ROI)**: interruptor de activación, título, introducción, escenarios por tipología (etiqueta, porcentaje ROI y desglose descriptivo financiero) con reordenamiento, fuente de datos, descargo legal (disclaimer) y vista previa en miniatura.
- Conectado el interruptor de rentabilidad a la pestaña de “Bloques” (`sections`), sincronizando de forma bidireccional la visibilidad y el estado de la sección.
- En `CanaRockProjectLanding.tsx`, la sección y los enlaces de menú de navegación (escritorio y móvil) ahora respetan estrictamente la visibilidad y el estado habilitado del bloque.
- Reforzada la seguridad multiempresa: `app/portal/admin/projects/[id]/landing/page.tsx` responde `notFound()` ante proyectos no autorizados o inexistentes sin fallbacks ajenos. `saveLandingConfigAction` valida rol permitido, pertenencia organizacional y alianzas antes de persistir en `project_media`.
- Implementadas validaciones de campos obligatorios, longitudes máximas y saneamiento de cadenas vacías tanto en cliente como en servidor para evitar publicar bloques vacíos.
- Verificación técnica: ESLint en archivos modificados sin errores, TypeScript (`tsc --noEmit`) con código 0 y compilación Next.js (`npm run build`) completada exitosamente en las 25 rutas.

### Resultado

Línea blanca y rentabilidad son ahora capacidades reutilizables y administrables visualmente para cualquier proyecto desde el CRM, conservando el aislamiento estricto entre organizaciones y proyectos.

---

## Ciclo 009 — Recursos comerciales controlados

**Estado:** Completado
**Fecha:** 4 de septiembre de 2026

### Ejecutado

- **Flujo editorial en CRM y Centro Documental (`document-actions.ts` y `ProjectDocumentsPanel.tsx`)**:
  - Implementada la acción `updateProjectDocumentAction` para actualizar título, categoría (`commercial`, `legal`, `technical`, `banking`), visibilidad (`authorized`, `private`, `public`) y estado editorial (`draft`, `review`, `approved`, `published`) sin necesidad de re-subir archivos.
  - Implementada la acción `deleteProjectDocumentAction` con validación estricta de roles y tenant antes de eliminar un recurso y sus versiones asociadas.
  - Añadido el visor expandible de versiones inmutables (`getDocumentVersionsAction`) con número consecutivo, formato MIME, tamaño formateado (KB/MB), fecha de publicación y checksum SHA-256 con botón de copiado directo.
  - Incorporados filtros rápidos por categoría en la interfaz: Todos, Comercial, Técnico, Legal y Bancario.
  - Modal de edición editorial rápida accesible para administradores directamente en cada fila de documento.
  - Aislamiento multi-tenant en servidor: validación rigurosa de pertenencia organizacional o alianzas vigentes en `organization_relationships`, impidiendo que usuarios no autorizados administren recursos ajenos.

- **Exposición y Descargas Públicas en Landing (`CanaRockProjectLanding.tsx` y `document-actions.ts`)**:
  - Se implementó la acción `getPublicProjectDocumentUrlAction` para entregar URLs de descarga solo si el documento tiene visibilidad `public` y estado `approved` o `published`.
  - Integrada la sección condicional `CanaRockPublicDocuments` en la landing pública de Cana Rock: se renderiza únicamente cuando el proyecto contiene recursos públicos aprobados/publicados (como el Master Plan oficial), manteniendo cero huella visual cuando no existen documentos públicos.
  - Enlace dinámico "Documentación" en barra de navegación de escritorio y menú móvil sincronizado con la presencia de recursos públicos.
  - Los brochures y fichas técnicas de intermediación se mantienen clasificados como `authorized` para consumo exclusivo de brokers autorizados dentro del portal protegido.

- **Base de Datos y Migración en Supabase**:
  - Creada y aplicada la migración `20260904183000_commercial_resources_foundation.sql`.
  - Permisos de lectura pública controlada para el rol `anon`: policy `document_versions_anon_public` sobre `document_versions` restringida exclusivamente a documentos con `visibility = 'public'` y estado publicado/aprobado.
  - Sembrados los documentos oficiales canónicos para **Cana Rock Star** (Brochure Comercial en `authorized`, Ficha Técnica en `authorized`, Master Plan Oficial en `public`) y **Cosmos Stelar** (Brochure Comercial en `authorized`, Ficha Técnica en `authorized`), con versiones inmutables `v1` y hashes SHA-256.

- **Verificación Técnica**:
  - ESLint en archivos modificados: 0 errores.
  - TypeScript (`tsc --noEmit`): 0 errores (código 0).
  - Next.js build de producción (`npm run build`): compilación y optimización de 25/25 rutas completada con éxito (código 0).

---

## Ciclo 010 — Conector de disponibilidad y reconciliación

**Estado:** Completado
**Fecha:** 4 de septiembre de 2026

### Ejecutado

- **Motor de Reconciliación e Integración Servidor (`lib/integrations/inventory/reconcile.ts` y `service.ts`)**:
  - Implementado el motor de comparación unitaria entre cualquier `InventorySnapshot` (de la API de Cana Rock o fuentes externas) y el inventario canónico en base de datos.
  - Clasificación exhaustiva de diferencias: `new_unit` (altas), `price_changed` (actualizaciones de precio), `status_changed` (cambios de disponibilidad), `specs_changed` (cambios en piso, habitaciones, baños, metraje), `unchanged` (idénticas) y `missing_from_source` (ausentes en la fuente externa).
  - Normalizador bilingüe tolerante a terminología en español e inglés (`codigo`/`code`/`unit`, `precio`/`price`, `habitaciones`/`beds`, `banos`/`baths`, `metraje`/`area`, `estado`/`status`).
  - Protección estricta de secretos: las credenciales (`CANA_ROCK_AVAILABILITY_API_KEY`) residen únicamente en variables de entorno del servidor; los registros en base de datos solo contienen nombres opacos de secretos (`credentials_secret_name`), nunca valores planos.
  - Registro de auditoría completo: cada corrida guarda `source_payload_hash` (SHA-256), fecha de inicio y fin, conteos de cada tipo de cambio y desglose estructurado en `diff_summary`.
  - Captura inmutable de evidencia previa en `inventory_source_snapshots` antes de cualquier mutación canónica.

- **Umbrales de Seguridad y Mecanismos de Cuarentena Automática**:
  - **Umbral de Caída Masiva (>20%)**: si más del 20% de las unidades mapeadas activas desaparecen de la fuente externa, la sincronización se detiene inmediatamente y se marca como `quarantined`, impidiendo modificaciones desastrosas o desabastecimientos involuntarios en producción.
  - **Consistencia de Divisa**: si la fuente externa reporta unidades en una divisa diferente a la moneda configurada en el proyecto (ej: DOP frente a USD), la corrida se clasifica en cuarentena crítica y no se aplican mutaciones.

- **Acciones del Servidor Seguras (`app/portal/admin/inventory-actions.ts`)**:
  - `getProjectIntegrationInfoAction`: consulta estado de la conexión, conteo de mapeos y última corrida registrada.
  - `triggerInventorySyncAction`: ejecuta la corrida con control de acceso (`super_admin`, `master_broker_admin`, `master_broker_operations`, `developer_admin`), permitiendo modo sombra (`shadow`) o modo canónico (`active`), con soporte de escenarios de prueba para validación.
  - `getProjectSyncHistoryAction`: recupera el historial inmutable de ejecuciones previas.
  - Revalidación automática de rutas (`/portal/admin/projects`, `/portal/projects`, `/proyectos`).

- **Interfaz Administrativa de Reconciliación (`InventoryReconciliationCard.tsx` y `AdminProjectsManager.tsx`)**:
  - Tarjeta de conexión integrada en la consola de proyectos para desarrollos con integración externa (Cana Rock).
  - Indicadores clave: unidades mapeadas, timestamp de última corrida, estado de auditoría (Conciliado, En Cuarentena, Pendiente) y moneda canónica estricta.
  - Selector de escenarios de prueba interactivos: "Idéntico (Validar 0 cambios)", "Con Discrepancias", "Alerta Cuarentena: Divisa Inválida" y "Alerta Cuarentena: Caída Masiva >20%".
  - Botones de acción: "Ejecutar Modo Sombra" (auditoría sin tocar la BD) y "Aplicar Cambios Canónicos".
  - Modal detallado de diferencias con tabla comparativa de valores actuales frente a valores de la fuente externa y alertas de cuarentena.
  - Modal de historial con las últimas 10 corridas registradas con sus conteos y motivos de excepción.

- **Base de Datos y Migración en Supabase**:
  - Creada y aplicada la migración `20260904190000_inventory_reconciliation_foundation.sql`.
  - Añadida columna `diff_summary jsonb` a `public.inventory_sync_runs`.
  - Concedidos permisos de lectura y escritura (`select, insert, update`) y secuencias a `authenticated` con políticas RLS basadas en `private.can_manage_inventory_integration(project_id)`.

- **Verificación Técnica**:
  - Pruebas unitarias automatizadas del motor de normalización y reglas de cuarentena aprobadas al 100%.
  - TypeScript (`tsc --noEmit`): 0 errores (código 0).
  - Next.js build de producción (`npm run build`): compilación y optimización de 25/25 rutas completada con éxito (código 0).

---

## Ciclo 011 — Simulador comercial trazable, propuestas congeladas y dossiers

**Estado:** Completado
**Fecha:** 4 de septiembre de 2026

### Ejecutado

- **Motor de Simulación Comercial (`lib/proposals/simulator.ts`)**:
  - Implementada la función `calculateCommercialSchedule` para calcular calendarios de pago con reserva fija, porcentaje inicial menos reserva, porcentaje durante construcción (con cálculo opcional de cuotas mensuales) y pago contra entrega.
  - Soporte multidivisa nativo (`USD`, `DOP`, `EUR`) con validación de suma de hitos equivalente al 100% del precio de la unidad.
  - Implementada la función de congelamiento inmutable `buildFrozenProposalSnapshot`: captura instantánea del estado de la unidad (precio, divisa, nivel, torre, tipología, especificaciones), cliente, calendario de pagos, fecha de corte (`asOfDate`), validez (`validUntil`), documentos aprobados y perfil de marca.

- **Gobernanza e Inmutabilidad de Documentos y Propuestas**:
  - Exclusión de documentos no autorizados: dossiers y propuestas comerciales congelan únicamente documentos en estado `approved` o `published` con visibilidad `public` o `authorized`. Toda documentación clasificada como borrador o privada queda excluida por diseño.
  - Inmutabilidad estricta: cambios posteriores en la tabla `units` o en `payment_plans` no alteran ni recalculan propuestas o dossiers previamente emitidos.

- **Acciones del Servidor y Aislamiento por Broker (`app/portal/proposals/actions.ts`)**:
  - `createCommercialProposalFromSimulatorAction`: crea la propuesta congelada, versiona el snapshot en `presentation_versions`, genera un token criptográfico seguro de 40 caracteres en `shared_links` y revalida las rutas correspondientes.
  - Consulta unificada uniendo `units` con `typologies` para extraer habitaciones, baños y metraje real sin asumir columnas directas inexistentes.
  - Aislamiento de brokers: `getProposalsListAction` aplica filtro estricto por `author_membership_id` cuando el usuario posee el rol `broker_agent`, garantizando que ningún corredor visualice o gestione propuestas emitidas por otros agentes o agencias competidoras.

- **Interfaz de Usuario Interactiva (`ProposalSimulatorModal.tsx` y `ProjectDetail.tsx`)**:
  - Creado modal responsive de simulación comercial con resumen de la unidad (código, precio, metraje, entrega), campos de cliente (nombre, correo, teléfono), configuración de plan de pago con sliders interactivos (inicial, construcción, entrega), desglose detallado de hitos y botón de generación de propuesta con un clic.
  - Al generar la propuesta, la interfaz presenta el enlace público generado, botón para copiar al portapapeles y botón para compartir directamente vía WhatsApp con mensaje preformateado.
  - En `ProjectDetail.tsx`, cada unidad disponible en la tabla de disponibilidad incluye la acción directa "Simular Propuesta", la cual precarga los datos específicos de la unidad en el modal.
  - En el editor de dossier (`PresentationEditor.tsx`), el bloque de documentos filtra en tiempo real para mostrar únicamente archivos aprobados y autorizados.

- **Verificación Técnica**:
  - Suite de pruebas unitarias automatizada (`scripts/test-simulator.ts`): 4/4 pruebas aprobadas al 100% (cálculo en USD, divisas DOP y EUR, gobernanza de documentos y verificación de inmutabilidad del snapshot ante mutaciones de la unidad).
  - ESLint en archivos creados y modificados: 0 errores.
  - TypeScript (`tsc --noEmit`): 0 errores (código 0).
  - Next.js build de producción (`npm run build`): compilación y optimización de 25/25 rutas completada con éxito (código 0).

---

## Ciclo 012 — Roles, acceso y CRM multiempresa

**Estado:** Completado
**Fecha:** 4 de septiembre de 2026

### Ejecutado

- **Sistema de Invitaciones Seguras y Aceptación Pública (`invitations` y `/invite/[token]`)**:
  - Creada la migración `20260904193000_invitations_and_access_control.sql` con la tabla `public.invitations` protegida por RLS (`invitations_manager_select`, `invitations_manager_insert`, `invitations_manager_update` y `invitations_token_lookup`).
  - Implementada la acción `createInvitationAction` con tokens criptográficos aleatorios de 48 caracteres hexadecimales generados con `crypto.randomBytes(24)`, fecha de expiración automática a 7 días y soporte para asociar proyectos específicos autorizados en el momento de la invitación.
  - Generación de enlaces únicos compartibles listos para el onboarding de corredores y aliados.
  - Creada la ruta pública `app/(public)/invite/[token]/page.tsx` y el componente interactivo `AcceptInvitationCard.tsx`: permite al invitado verificar su rol, organización y registrar/activar su cuenta y contraseña de forma transparente y segura.
  - Acciones administrativas para revocar invitaciones pendientes (`revokeInvitationAction`) y listar invitaciones activas con estado y expiración (`getInvitationsListAction`).

- **Gestión de Membresías y Suspensión Temporal Inmediata**:
  - Implementada la acción `updateMembershipStatusAction` para alternar entre estados `active`, `suspended` y `revoked`.
  - Protección de seguridad: un administrador no puede auto-suspenderse.
  - Aislamiento efectivo: cuando una membresía pasa a `suspended`, `lib/auth/get-user.ts` la excluye al requerir `status = 'active'`, denegando el acceso a todas las rutas protegidas del portal de inmediato, mientras que su historial de auditoría, autoría de propuestas y acuerdos firmados se conserva intacto en base de datos.

- **Asignación Explícita de Proyectos (`project_access`)**:
  - Implementada la acción `assignProjectAccessAction` para otorgar comercialización explícita (`access_level: 'sell'`) a un corredor sobre proyectos determinados.
  - Interfaz modal en consola administrativa para conceder o retirar acceso a desarrollos inmobiliarios con un clic.

- **Consola Interactiva de Miembros y Control de Acceso (`AdminUsersManager.tsx` y `app/portal/admin/users/page.tsx`)**:
  - Pestañas dinámicas: "Miembros Activos" e "Invitaciones Pendientes".
  - Métricas clave: Miembros Registrados, Administradores, Brokers/Agentes e Invitaciones Pendientes.
  - Tabla completa con proyectos asignados, insignias de rol coloreadas, estado de cuenta y botones contextuales (Asignar proyecto, Suspender, Reactivar, Copiar enlace de invitación y Revocar).

- **Suite de Pruebas Automatizada de Aislamiento MB-A / MB-B (`scripts/test-multi-tenant-isolation.ts`)**:
  - Ejecutados y aprobados los 10 casos de aislamiento de `03_MATRIZ_ACCESO_BORRADOR.md`:
    1. MB-A Admin tiene acceso válido a Proyecto-A.
    2. MB-A Admin no puede acceder ni modificar Proyecto-B de MB-B.
    3. Aislamiento estricto de propuestas entre brokers independientes (Broker 1 no ve cartera ni propuestas de Broker 2).
    4. Desarrollador no puede acceder al CRM completo del master broker.
    5. Concesión explícita de proyectos a corredores verificada.
    6. Accesos vencidos denegados de inmediato.
    7. Usuario suspendido pierde acceso a sesión y rutas protegidas.
    8. Entropía criptográfica de tokens de invitación verificada.
    9. Exportaciones de inventario y datos restringidas exclusivamente al alcance organizacional.
    10. Errores y excepciones no divulgan nombres, IDs ni existencia de organizaciones ajenas.

- **Verificación Técnica**:
  - 10/10 pruebas de aislamiento aprobadas al 100%.
  - ESLint en todos los archivos del ciclo: 0 errores, 0 advertencias.
  - TypeScript (`tsc --noEmit`): 0 errores (código 0).
  - Next.js build de producción (`npm run build`): compilación y optimización de 26/26 rutas completada con éxito (código 0).

---

## Ciclo 013 — Estadísticas, métricas y operación continua

**Estado:** Completado
**Fecha:** 4 de septiembre de 2026

### Ejecutado

- **Diccionario Canónico de Telemetría y Políticas de Privacidad (`lib/analytics/events.ts`)**:
  - Definido el catálogo oficial de 12 eventos de engagement comercial:
    - `PROJECT_VIEW`: Visualizaciones de ficha técnica del proyecto.
    - `PROJECT_SHARE`: Acciones de compartir ficha o catálogo.
    - `GALLERY_VIEW`: Interacción con carrusel o galería fotográfica.
    - `INVENTORY_VIEW`: Consultas de disponibilidad de unidades o lotes.
    - `DOCUMENT_VIEW` y `DOCUMENT_DOWNLOAD`: Acceso y descarga de brochures, fichas y master plans autorizados.
    - `SIMULATOR_OPEN` y `SIMULATOR_CALCULATE`: Uso del simulador comercial y planes de pago.
    - `PROPOSAL_CREATE` y `PROPOSAL_SHARE`: Emisión y envío de propuestas congeladas.
    - `WHATSAPP_CONTACT`: Solicitud de contacto directo con broker o sala de ventas.
    - `DOSSIER_VIEW`: Visualización de presentaciones comerciales.
  - **Función de Sanitización Estricta (`sanitizeAnalyticsMetadata`)**:
    - Purga y anonimiza proactivamente cualquier dato personal sensible (PII) antes del almacenamiento o agregación: descarta correos electrónicos, números telefónicos, nombres de personas físicas, cédulas/pasaportes y datos de pago/tarjetas.
    - Preserva únicamente datos comerciales anónimos: identificadores de unidad, tipo de tipología, categoría de documento, moneda seleccionada y rangos de precio.
  - **Política de Retención y Gobernanza (`EVENT_RETENTION_POLICY`)**:
    - Telemetría agregada para resúmenes operativos: 365 días.
    - Registro de auditoría cruda: 90 días.

- **Motor de Agregación y Servicio Analítico (`lib/analytics/service.ts`)**:
  - Implementada la función `recordAnalyticsEvent` que registra eventos en la tabla `engagement_events` vinculados al `project_id`, sanitizados automáticamente.
  - Implementada la función de agregación analítica `getProjectAnalyticsSummary`:
    - Métricas globales agregadas: Vistas de proyecto, Descargas de recursos, Simulaciones comerciales y Contactos vía WhatsApp.
    - Ranking de Unidades Más Consultadas: top de unidades con mayor frecuencia de interés comercial.
    - Ranking de Recursos Más Solicitados: desglose de documentos (brochures, fichas técnicas) más descargados.
    - Cronología de Actividad Reciente: registro secuencial de acciones comerciales en los últimos 7 días.

- **Acciones del Servidor con Aislamiento Organizacional (`app/portal/analytics-actions.ts`)**:
  - `recordAnalyticsEventAction`: acción segura que infiere contexto del usuario autenticado o permite registro público anónimo de vistas en landing.
  - `getProjectAnalyticsAction`: acción protegida que valida la membresía activa y membresía en la organización propietaria del proyecto antes de retornar métricas analíticas.

- **Panel de Analítica y Salud Operativa (`components/portal/analytics/ProjectAnalyticsPanel.tsx`)**:
  - Tarjetas de KPIs interactivos con conteo de vistas, descargas, simulaciones y conversiones WhatsApp.
  - Indicador visual de **Salud Operativa** (disponibilidad de sincronización de inventario, centro documental activo, políticas RLS en vigor).
  - Listas de unidades destacadas y recursos con porcentaje de interacción.
  - Timeline de actividad reciente con iconos semánticos.
  - Integrado como pestaña nativa "Métricas & Estadísticas" en el detalle de proyecto del CRM (`ProjectDetail.tsx`).

- **Suite de Pruebas de Privacidad y Aislamiento (`scripts/test-analytics-privacy.ts`)**:
  - 3/3 suites de prueba aprobadas:
    1. Verificación del diccionario canónico y eventos registrados.
    2. Purga y desinfección rigurosa de PII (`email`, `phone`, `client_name`, `id_number`, `card_pan`) en metadatos.
    3. Aislamiento organizacional y entre proyectos: métricas de Proyecto A completamente separadas de Proyecto B.

- **Verificación Técnica**:
  - ESLint: 0 errores en todos los archivos de analítica y CRM.
  - TypeScript (`tsc --noEmit`): 0 errores (código 0).
  - Next.js build de producción (`npm run build`): compilación y optimización completada con éxito (código 0).

---

## Estado Final del Plan Maestro de Continuidad (Ciclos 001 al 013)

Con la culminación del **Ciclo 013**, todos los ciclos planificados en `08_PLAN_MAESTRO_CONTINUIDAD.md` han sido ejecutados, probados, documentados y puestos en operación:

| Ciclo | Nombre / Alcance | Estado |
|---|---|---|
| **001** | Aislamiento y preparación de activos Cana Rock | Completado |
| **002** | Inventario oficial y planes de pago Cana Rock | Completado |
| **003** | Contenido, amenidades y experiencia pública | Completado |
| **004** | Preservación de proyectos existentes (Ciprés) | Completado |
| **005** | Integración del Estudio Creativo Cana Rock | Completado |
| **006** | Identidad visual y selector de marca | Completado |
| **007** | Consistencia de moneda ISO en catálogo y CRM | Completado |
| **008** | Editor editorial de landing (Línea blanca y ROI) | Completado |
| **009** | Recursos comerciales controlados y centro documental | Completado |
| **010** | Conector de disponibilidad y reconciliación | Completado |
| **011** | Simulador comercial, propuestas congeladas y dossiers | Completado |
| **012** | Roles, acceso y CRM multiempresa | Completado |
| **013** | Estadísticas, métricas y operación continua | Completado |


