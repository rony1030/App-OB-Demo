# Plan maestro de continuidad — Cana Rock en App OB Brokers

**Estado:** vigente para la siguiente iteración  
**Última actualización:** 4 de septiembre de 2026  
**Alcance:** Cana Rock Star, Universe, Galaxy y Cosmos Stelar

Este documento permite retomar el trabajo sin depender de una conversación previa. Resume el estado real, las decisiones que no se deben romper, la hoja de ruta, las pruebas y los criterios de entrega.

## 1. Resultado buscado

App OB Brokers será una plataforma multiempresa: cada master broker administra sus proyectos, activos, inventario, propuestas, documentos y estadísticas; cada proyecto conserva identidad, landing, recursos y propuesta propia.

    OB Brokers Team (plataforma)
    └── Cana Rock / Osvaldo Bello (master broker)
        ├── Grupo Cana Rock (desarrollador relacionado)
        ├── Star
        ├── Universe
        ├── Galaxy
        └── Cosmos Stelar
            ├── landing pública
            ├── inventario y disponibilidad
            ├── activos y recursos comerciales
            ├── propuestas y dossiers
            └── estadísticas

La relación entre master broker y desarrollador es explícita. Nunca se usa el nombre de una persona como llave técnica ni se codifican excepciones permanentes por nombre de proyecto.

## 2. Reglas no negociables

### Datos comerciales

- La unidad disponible es la fuente de verdad para precio, moneda, habitaciones, baños, metraje y parqueos visibles en tarjeta, landing, propuesta, dossier y PDF.
- No sustituir esos datos por precio inicial ni por textos escritos en componentes.
- Si parqueo no existe o no tiene número positivo confirmado, no se muestra icono, etiqueta, guion ni espacio reservado.
- La moneda se guarda como código ISO de tres letras y siempre se muestra de forma explícita: USD$, RD$, EUR€, CAD$ u otra configurada.
- Solo se publican unidades autorizadas. Precios y disponibilidad conservan el aviso de confirmación comercial.

### Activos, imágenes y documentos

- Los binarios viven en Supabase Storage; las tablas guardan metadatos y relaciones.
- project_media guarda proyecto, bucket, ruta, tipo, orden y texto alternativo de portada, logo, galería y configuración de landing.
- public-assets aloja imágenes públicas. private-documents aloja documentos comerciales, legales o privados mediante enlaces firmados.
- No reemplazar imágenes por URLs externas sin aprobación. El 4 de septiembre se verificaron 43 objetos Cana Rock: 4 portadas, 4 logos y 35 imágenes de galería.
- Nunca publicar KYC, bancos, contratos, documentos legales o datos de clientes en una landing.

### Diseño e identidad

- No cambiar el diseño de Ciprés ni de otro master broker al mejorar Cana Rock.
- La experiencia cana-rock-resort es exclusiva de Cana Rock. Nuevas marcas deben usar configuración o experiencia específica, no condicionales por slug dentro de componentes globales.
- Cana Rock usa su familia SVG en amenidades; el catálogo general usa iconos neutros consistentes.
- No usar emojis, datos truncados, iconos de relleno ni valores inventados.
- El encabezado de proyecto conserva identidad propia; no restaurar el encabezado genérico retirado de las landings Cana Rock.

### Seguridad y acceso

- Navegación visible no equivale a permiso: servidor y RLS validan organización, proyecto, rol y capacidad.
- Las descargas respetan el mismo alcance que la pantalla. No se debe inferir información de otra organización por URL, API o exportación.
- Secretos de conectores viven en servidor. No exponer claves de servicio ni de disponibilidad en el navegador.
- Antes de activar sincronización automática, rotar cualquier credencial heredada que haya estado en código anterior.

## 3. Cronología completa de ciclos

| Ciclo | Estado | Qué se hizo | Pendiente que hereda el siguiente ciclo |
|---|---|---|---|
| 001 — Fundaciones y línea base | Base completada; controles de seguridad abiertos | Se auditó el sistema Cana Rock de origen, MariaDB, activos, disponibilidad, paridad funcional, acceso y relaciones multiempresa. Se creó el normalizador del conector y se aprobó la separación master broker/desarrollador. | Rotar credencial heredada, probar respaldo/restauración y terminar pruebas de aislamiento antes de automatizar sincronización. |
| 002 — Alta controlada en Supabase | Completado | Se crearon Cana Rock / Osvaldo Bello, Grupo Cana Rock, la relación comercial, cuatro proyectos, responsabilidades y 116 unidades públicas. Los conectores quedaron en sombra/pausa. | Reconciliación de disponibilidad, activos aprobados y validación operativa autenticada. |
| 003 — Contenido, amenidades y experiencia pública | Completado | Se cargaron 43 activos en Storage, 35 imágenes de galería y 42 relaciones de amenidades. Se creó la experiencia Cana Rock, la administración de amenidades y el catálogo público mejorado. | Recursos comerciales, tipologías/planes sin valores fijos y conector en sombra. |
| 004 — Auditoría de paridad Cosmos Stelar | Auditoría completada | Se contrastó Stelar con la referencia autorizada y se documentaron brechas: recursos, línea blanca, master plan, mapa, calculadora, filtros e idiomas. | Construir cada brecha solo cuando sus datos y criterio de publicación estén definidos. |
| 005 — Disponibilidad pública y auditoría de recursos | Base pública completada | Se incorporaron filtros, tarjetas/lista, galería completa, submenú entre proyectos, responsive, moneda ISO, plan de pagos y visibilidades existentes. | Carga segura de recursos, contenido administrable y verificación autorizada. |
| 006 — Recursos comerciales y catálogo por inventario | Flujo editorial completado; contenido pendiente | Se implementó versionado, visibilidad, checksum, enlace firmado y validación organizacional para documentos. El catálogo quedó derivado de unidades disponibles. | Recibir/aprobar brochure y ficha técnica, probar RLS con broker y clasificar activos comerciales. |
| 007 — Ficha de unidad y contenido Star | Completado, con una comprobación de despliegue pendiente | Se añadieron ficha central de unidad, PDF/compartir, línea blanca, rentabilidad de Star, moneda explícita en Estudio Creativo y auditoría de imágenes en Storage. | Confirmar en producción el ajuste de parqueos/consulta y crear editor visual de contenido adicional. |
| 008 — Editor editorial de landing | Completado | Formulario visual por proyecto para línea blanca y rentabilidad en CRM Landing Builder con validación y aislamiento multi-tenant. | Desplegado y verificado; avanzar a Ciclo 009. |
| 009 — Recursos comerciales controlados | Completado | Carga/versión/aprobación y exposición controlada de brochures, fichas y activos con RLS, versionado y enlaces firmados. | Desplegado y verificado; avanzar a Ciclo 010. |
| 010 — Conector y reconciliación | Completado | Sincronización segura, auditable y programada de disponibilidad con umbral de cuarentena y modo sombra. | Desplegado y verificado; avanzar a Ciclo 011. |
| 011 — Simulador, propuestas y dossiers | Completado | Simulador comercial multidivisa, propuestas congeladas e inmutables, aislamiento por broker y filtrado de documentos. | Desplegado y verificado; avanzar a Ciclo 012. |
| 012 — Roles, acceso y CRM | Completado | Sistema de invitaciones criptográficas, onboarding público `/invite/[token]`, asignación explícita de proyectos, suspensión inmediata y 10 pruebas MB-A/MB-B. | Desplegado y verificado; avanzar a Ciclo 013. |
| 013 — Estadísticas y operación continua | En ejecución | Eventos, paneles y alertas con privacidad y aislamiento. | Depende de los flujos de inventario, recursos y propuestas. |

La evidencia detallada de los ciclos ejecutados está en `04_REGISTRO_CICLOS.md`. Los ciclos 008–013 son el plan de ejecución; no se deben marcar como completados hasta pasar sus criterios de salida.

## 4. Estado al cierre del Ciclo 007

| Proyecto | Ruta | Inventario | Galería | Amenidades | Particularidad aprobada |
|---|---|---:|---:|---:|---|
| Star | /proyectos/cana-rock-star | 44 | 10 | 11 | Línea blanca y rentabilidad. |
| Universe | /proyectos/cana-rock-universe | 12 | 11 | 9 | Landing lista; recursos pendientes. |
| Galaxy | /proyectos/cana-rock-galaxy | 17 | 6 | 10 | Landing y galería migradas. |
| Cosmos Stelar | /proyectos/cana-rock-stelar | 43 | 8 | 12 | Nombre normalizado; stelar sigue como slug. |

**Total:** 116 unidades, 35 imágenes de galería, 42 relaciones de amenidades y 43 objetos públicos de imagen/logotipo.

### Funciones terminadas

- Cuatro landings públicas Cana Rock aisladas de otros desarrollos.
- Galería de tres imágenes visibles y visor completo con miniaturas, flechas, teclado y reproducción infinita.
- Disponibilidad con búsqueda, filtros, tarjetas/lista, carga progresiva, moneda explícita, PDF y compartir.
- Catálogo general derivado de unidades disponibles: tipologías agotadas no se muestran y no se mezclan monedas.
- Ficha central responsive por unidad: bloque/piso, especificaciones, precio, estado, línea blanca condicional y consulta por WhatsApp.
- Parqueos solo aparecen cuando hay dato numérico confirmado.
- Rentabilidad de Star con fuente y descargo de no garantía.
- Estudio Creativo muestra moneda ISO en portada, cierre, textos y exportaciones.
- Imágenes de los cuatro proyectos verificadas físicamente en public-assets.
- Migraciones de moneda ISO y contenido Star aplicadas y comprobadas en Supabase.

### Verificación y límites conocidos

- Compilación de producción y ESLint dirigido completados sin errores en cambios Cana Rock.
- Producción fue validada antes del ajuste menor de parqueos. El commit bc5f673 contiene dicho ajuste y requiere comprobación visual después de que Vercel termine su despliegue.
- El entorno local puede producir fetch failed contra Supabase tras reinicio. No ocultarlo con datos simulados: revisar red, variables y sesión por separado.
- No se ha probado todavía descarga/compartición con un broker autorizado y uno sin autorización.
- Línea blanca y rentabilidad ya son configuración de landing, pero falta un formulario visual para administradores.
- Hay inventario importado, pero no reconciliación programada y auditable contra la fuente oficial.

## 5. Arquitectura y lugar correcto de cada cambio

| Necesidad | Fuente/lugar correcto | Nunca hacer |
|---|---|---|
| Portada o galería | CRM → public-assets → project_media | Pegar URL externa en componente. |
| Orden o alt de imagen | Registro de medios del proyecto | Cambiar solo la representación visual. |
| Precio, moneda, especificaciones | units + conector/importación autorizado | Escribir datos manuales en tarjeta. |
| Amenidad | amenities + project_amenities | Hardcodear texto en landing. |
| Línea blanca/rentabilidad | Configuración editorial del proyecto | Copiar contenido de Star a otro proyecto. |
| Brochure/ficha | project_documents + versiones + private-documents | Añadir PDF en public. |
| Propuesta/dossier | Plantilla por proyecto + snapshot de unidad | Generar desde precio actual sin fecha de corte. |
| Permiso | Organización, proyecto, rol y capacidad | Confiar en que el menú lo oculta. |

## 6. Hoja de ruta detallada para los ciclos pendientes

Las fases se completan con datos, permisos e interfaz probados; no solo porque se ven bien.

### Ciclo 008 — Editor editorial de landing

**Objetivo:** que un administrador gestione línea blanca y rentabilidad sin editar código o JSON.

**Por qué va primero:** ambos bloques ya están listos para presentarse públicamente, pero dependen de valores cargados por desarrollo. Eso no escala a nuevos master brokers ni permite corregir contenido con agilidad y control. Este ciclo convierte una implementación puntual de Star en una capacidad reusable por proyecto.

**Cómo se aborda:** extender el editor de landing existente y la configuración ya guardada en `project_media`; no crear una tabla nueva ni un editor paralelo. La interfaz debe editar únicamente el proyecto abierto, validar antes de publicar y renderizar en la vista previa existente.

**Implementación:**

1. Añadir Contenido adicional al editor de landing por proyecto.
2. Crear interruptores de publicación por bloque.
3. Línea blanca: lista ordenable, texto de calificación y vista previa.
4. Rentabilidad: título, introducción, fuente, descargo, tipologías, ROI y descripción.
5. Guardar solo en la configuración del proyecto actual y evitar bloques públicos vacíos.
6. Validar longitudes, campos obligatorios, porcentajes y número de ítems antes de guardar.

**Pruebas obligatorias:**

- Un administrador autorizado crea, edita, ordena, despublica y publica ambos bloques.
- Un proyecto sin configuración no reserva espacio ni muestra contenido de Star.
- Un administrador externo no puede leer ni escribir la configuración por URL directa.
- Textos largos funcionan en móvil, escritorio y vista previa.
- Guardar y recargar conserva los datos exactos.

**Criterio de salida:** un administrador publica contenido específico de un proyecto nuevo sin intervención de desarrollo y sin afectar otros proyectos.

### Ciclo 009 — Recursos comerciales controlados

**Objetivo:** operar brochures, fichas, master plans, renders y video con versión, aprobación y acceso correcto.

**Por qué sigue:** una landing atractiva no basta para vender. Los brokers necesitan material oficial, pero cargar archivos sin flujo editorial puede publicar versiones equivocadas o información sensible. La plataforma ya tiene el modelo de documentos; ahora debe usarse con contenido real y aprobado.

**Cómo se aborda:** usar `project_documents`, `document_versions` y `private-documents` existentes. Todo archivo ingresa primero en revisión, conserva hash y versión, y solo llega a landing o broker después de aprobar visibilidad y derechos. No migrar PDFs antiguos directamente a una carpeta pública.

**Insumos de negocio necesarios:** brochure y ficha técnica aprobados de Star y Cosmos Stelar en español, confirmación de derechos de publicación y clasificación public, authorized o private.

**Implementación:**

1. Registrar proyecto, categoría, idioma, título, visibilidad y estado editorial.
2. Subir a private-documents con checksum, MIME, tamaño, versión, autor y fecha.
3. Iniciar cada carga en revisión; aprobar/publicar solo tras validación comercial.
4. Mostrar solo recursos públicos publicados en landing.
5. Mantener brochures/fichas autorizados dentro del portal para brokers.
6. Vincular propuestas y dossiers a la versión exacta aprobada.

**Pruebas obligatorias:** broker autorizado descarga; broker no autorizado y anónimo son denegados incluso con URL directa; recursos privados no aparecen en landing/API; nueva carga crea versión sin alterar propuestas antiguas.

**Criterio de salida:** Star y Stelar tienen brochure y ficha versionados, con RLS positiva/negativa probada.

### Ciclo 010 — Conector de disponibilidad y reconciliación

**Objetivo:** actualizar inventario desde Cana Rock sin perder trazabilidad ni sobrescribir decisiones aprobadas.

**Por qué sigue:** hoy los 116 registros son una fotografía válida, no una sincronización continua. Si una unidad se vende, cambia de precio o se retira, la landing podría quedar desactualizada. Activar una integración sin reglas de comparación podría borrar correcciones comerciales o producir cambios masivos silenciosos.

**Cómo se aborda:** mantener el adaptador en servidor, rotar y guardar el secreto fuera del cliente, ejecutar en modo sombra, comparar contra el inventario canónico y presentar diferencias antes de aplicar cambios sensibles. Cada corrida debe guardar evidencia suficiente para reconstruir qué cambió y por qué.

**Implementación:**

1. Adaptador servidor para API con secreto protegido.
2. Corrida con fuente, fecha, hash, conteos, duración y errores.
3. Normalizador de ID externo, bloque, piso, tipo, habitaciones, baños, metraje, parqueos, precio, moneda y estado.
4. Reglas para altas, cambios, desapariciones y overrides auditables.
5. Vista administrativa de diferencias antes de cambios masivos.
6. Programación, alertas de error y alerta por variación masiva o moneda inválida.

**Pruebas obligatorias:** corrida válida no duplica; segunda corrida idéntica no cambia; dato inválido crea excepción; cambios masivos se revisan; cliente nunca recibe secretos; adaptador probado con un segundo master broker ficticio.

**Criterio de salida:** toda unidad pública tiene fuente y fecha de actualización; cada diferencia es auditable y recuperable.

### Ciclo 011 — Simulador, propuestas y dossiers

**Objetivo:** pasar de unidad real a propuesta comercial trazable con marca y documentos del proyecto.

**Por qué sigue:** el equipo comercial no debe copiar precio, plan de pago, moneda, brochure y datos de unidad a mano. Esa práctica introduce errores y vuelve imposible saber qué condición recibió cada cliente. El simulador transforma inventario y recursos aprobados en una operación comercial reproducible.

**Cómo se aborda:** iniciar desde la unidad seleccionada, congelar precio/moneda/fecha de corte y versión del plan de pago, y generar propuesta/dossier con la plantilla aprobada del proyecto. La publicación posterior del inventario no puede modificar una propuesta ya enviada.

**Implementación:** simulador desde unidad y plan de pago vigente; propuesta con precio, moneda y fecha de corte; plantillas de propuesta y dossier por proyecto; enlace compartido con expiración y eventos.

**Pruebas obligatorias:** propuesta conserva snapshot si cambia el inventario; respeta moneda; broker no abre propuesta ajena; dossier usa solo recursos aprobados; probar USD, DOP y una tercera moneda ISO.

**Criterio de salida:** broker autorizado crea y comparte una propuesta sin copiar precios ni documentos manualmente.

### Ciclo 012 — Roles, acceso y CRM

**Objetivo:** operar usuarios, agencias, brokers, leads y responsabilidades de forma segura.

**Por qué sigue:** antes de abrir recursos y propuestas a brokers reales, se debe garantizar que cada persona ve exactamente lo suyo. Un modelo multi-master-broker pierde valor si un desarrollador, agencia o broker puede cruzar información comercial por una ruta directa.

**Cómo se aborda:** crear miembros por invitación, asignar organización, proyecto, rol y capacidad explícitamente, y ejecutar pruebas de aislamiento con dos organizaciones ficticias antes de migrar usuarios o leads reales. RLS y servidor deben negar lo que el menú no muestra.

**Implementación:** invitaciones en vez de contraseñas migradas; asignación explícita de organización, proyecto, rol y capacidad; reglas de propiedad y transferencia de lead; pruebas con dos master brokers ficticios.

**Pruebas obligatorias:** ejecutar casos MB-A/MB-B de 03_MATRIZ_ACCESO_BORRADOR.md por pantalla, URL, API y exportación; usuario suspendido pierde acceso y conserva historial.

### Ciclo 013 — Estadísticas y operación continua

**Objetivo:** medir rendimiento comercial con privacidad y aislamiento.

**Por qué se deja al final:** las métricas solo son útiles cuando los flujos a medir —inventario, recursos, propuestas y consultas— ya son canónicos. Instrumentar antes produciría eventos incompletos y conclusiones engañosas.

**Cómo se aborda:** definir primero un diccionario de eventos con finalidad, propietario, retención y permisos. Registrar eventos de bajo riesgo y asociarlos a proyecto/organización; presentar agregados o detalle según rol, sin almacenar datos personales innecesarios.

**Eventos iniciales:** vista de proyecto, galería, disponibilidad, ficha, filtros, consulta WhatsApp, PDF, compartir, recurso, propuesta, dossier, cambios de inventario y resultado de sincronización.

**Reglas:** definir finalidad, retención y responsable; no guardar datos personales innecesarios; paneles por organización/proyecto según permiso.

## 7. Orden y Estado de Ejecución

1. **Ciclo 009 completado**: centro documental con versionado inmutable, RLS de descarga autorizada y entrega pública selectiva en landing operando para Star y Cosmos Stelar.
2. **Ciclo 010 completado**: conector de disponibilidad y motor de reconciliación en modo sombra y activo, umbrales de seguridad (>20% caída y validación de divisa), auditoría inmutable SHA-256 en Supabase y panel de diferencias en CRM.
3. **Ciclo 011 completado**: simulador comercial trazable, propuestas congeladas e inmutables (congelamiento de precio, moneda ISO, desglose de cuotas y fecha de corte) y dossiers comerciales con filtrado de documentos autorizados.
4. **Ciclo 012 completado**: sistema de invitaciones seguras `/invite/[token]`, control de acceso con suspensión inmediata de membresías sin pérdida de auditoría, asignación explícita de proyectos por broker y suite de pruebas de aislamiento organizacional (10/10 casos MB-A / MB-B).
5. **Ciclo 013 completado**: catálogo de 12 eventos de telemetría comercial, sanitización estricta de datos personales (cero PII), servicio de agregación analítica, panel interactivo de KPIs y salud operativa en CRM (`ProjectAnalyticsPanel`), y pruebas de privacidad (3/3 casos aprobados).

**Todos los ciclos del Plan Maestro de Continuidad han sido completados con éxito y desplegados.**

## 8. Protocolo de pruebas por cambio

### Código

Ejecutar ESLint sobre los archivos modificados, npm run build y git diff --check. Los mensajes conocidos de render dinámico durante build no son un error si la compilación termina correctamente. Errores nuevos deben resolverse antes de publicar.

### Interfaz y operación

1. Probar escritorio ancho, escritorio intermedio y móvil.
2. Probar contenido largo, vacío y dato inexistente.
3. Probar teclado, foco visible, Escape en diálogo y nombres accesibles.
4. Comprobar moneda explícita y que no se mezclen precios de monedas distintas.
5. Confirmar producción después del despliegue: un push no demuestra que Vercel ya publicó.
6. Para permisos, comprobar éxito y denegación con organizaciones distintas.

### Datos y Storage

1. Comprobar que archivos responden desde bucket correcto.
2. Confirmar que el registro está vinculado al proyecto y versión correcta.
3. No borrar/sobrescribir activos sin verificar ruta, dueño y referencias.
4. Para migraciones Supabase: crear migración con CLI, revisar, aplicar remoto y comparar historial local/remoto.

## 9. Definición de terminado

Una tarea está terminada cuando no altera proyectos fuera de alcance; datos válidos pertenecen al proyecto correcto; permisos/RLS son correctos cuando aplica; interfaz funciona en tamaños relevantes; ESLint dirigido, build y revisión de diff pasan; producción fue comprobada si corresponde; la bitácora 04_REGISTRO_CICLOS.md registra evidencia, decisión y pendiente; Git contiene un commit descriptivo.

## 10. Decisiones que requieren negocio

No decidir unilateralmente: integrantes y relación legal de cada alianza; quién publica contenido, acepta propuestas o corrige inventario; propiedad de leads; derechos de publicación de activos; retención de CRM y telemetría; frecuencia de sincronización; reglas de reserva y bloqueo.

## 11. Instrucción de relevo

Al comenzar una sesión: leer este documento; luego 04_REGISTRO_CICLOS.md, 06_AUDITORIA_PORTAFOLIO_CANA_ROCK.md, 03_MATRIZ_ACCESO_BORRADOR.md antes de permisos y 07_AUDITORIA_RECURSOS_COMERCIALES.md antes de documentos. Revisar Git, migraciones y producción. Trabajar una fase a la vez. No inventar contenido, precios, credenciales, permisos ni derechos de publicación.

> Continúa App OB Brokers siguiendo docs/cana-rock/08_PLAN_MAESTRO_CONTINUIDAD.md. Respeta las decisiones no negociables, revisa el estado actual antes de modificarlo, ejecuta una sola fase priorizada, prueba datos/permisos/interfaz, actualiza 04_REGISTRO_CICLOS.md y no publiques contenido comercial sin aprobación.

## 12. Documentos relacionados

- 01_INVENTARIO_TECNICO.md: fuente heredada y hallazgos técnicos.
- 02_MATRIZ_PARIDAD_FUNCIONAL.md: mapa de capacidades origen → destino.
- 03_MATRIZ_ACCESO_BORRADOR.md: roles, capacidades y aislamiento.
- 04_REGISTRO_CICLOS.md: bitácora cronológica y evidencia.
- 05_DECISIONES_APROBADAS.md: decisiones aprobadas.
- 06_AUDITORIA_PORTAFOLIO_CANA_ROCK.md: estado por proyecto y fases.
- 07_AUDITORIA_RECURSOS_COMERCIALES.md: publicación segura de recursos.

El plan se actualiza añadiendo evidencia de cada ciclo; no se debe borrar ni ocultar decisiones anteriores.
