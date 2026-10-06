# Creador de propuestas V2

Documento vivo para registrar decisiones, implementación, validaciones y pendientes. Se actualizará cada vez que cambie el alcance o una prueba revele una diferencia.

## Objetivo

Reemplazar el editor libre usado al crear propuestas por un flujo simple, guiado y consistente con la propuesta de referencia de Cana Rock. El editor editorial actual se conserva exclusivamente para dossiers.

## Decisiones cerradas

- La propuesta usa formato Carta vertical: 816 × 1056 px para render y exportación.
- El broker no administra páginas, bloques, medios ni estilos libres al crear una propuesta.
- El destinatario debe ser un lead registrado en el CRM.
- Después de seleccionar el lead, el bloque de destinatario se contrae y ofrece “Cambiar”.
- Las unidades se seleccionan antes de entrar al creador y deben pertenecer a la misma desarrolladora.
- Los datos guardados forman una versión inmutable y generan un enlace privado con vencimiento.
- En móvil se muestra la misma composición de escritorio escalada; no se reacomoda el interior de la página.
- Las imágenes de página completa no llevan esquinas dobladas, diamantes ni ornamentos de pliegue.
- Cada proyecto conserva su logo, colores y contenido oficial.
- El broker nunca escribe descuentos ni promociones libres.
- Administración, operaciones o marketing crean los beneficios, eligen proyectos, vigencia, estado, banner y ubicación del anuncio.
- El broker solo ve “Aplicar descuento” o “Aplicar promoción” cuando el beneficio está activo, vigente y asignado al proyecto.
- Los agentes y agencias usan el dossier oficial listo para abrir, descargar o compartir; no reciben el editor editorial avanzado.

## Alcance de la primera versión

- [x] Auditar la ruta actual y confirmar que abre el editor de dossier.
- [x] Registrar la verdad durable del producto en `PRODUCT.md`.
- [x] Crear este documento vivo.
- [x] Extraer la generación de contenido de propuesta a una plantilla compartida.
- [x] Crear el componente `SimpleProposalCreator`.
- [x] Cambiar la ruta `/portal/proposals/new` para usar el nuevo creador.
- [x] Mantener `PresentationEditor` solo para dossiers.
- [x] Hacer obligatorio y contraíble el selector de lead del CRM.
- [x] Mostrar resumen de unidades sin permitir editar datos comerciales.
- [x] Permitir únicamente personalización esencial: portada y mensaje breve.
- [x] Crear vista previa Carta con navegación página a página.
- [x] Escalar la página fija correctamente en móvil.
- [x] Guardar, enviar por correo, copiar enlace y abrir propuesta.
- [x] Exportar el mismo contenido a PDF.
- [x] Eliminar ornamentos de pliegue en imágenes a pantalla completa.
- [x] Corregir espacios de pie de página y desbordes de texto/amenidades.
- [x] Mantener el visor público compatible con snapshots existentes.
- [x] Retirar de la interfaz el simulador antiguo que aceptaba nombres libres y dirigir cada unidad al nuevo creador con CRM obligatorio.
- [x] Cargar solo la página visible durante la edición y montar las seis páginas únicamente al exportar.
- [x] Crear el módulo administrativo “Ofertas y promociones”.
- [x] Permitir crear, editar, activar, pausar y archivar beneficios con fecha inicial/final, banner y proyectos asignados.
- [x] Mostrar anuncios vigentes en el CRM como banner, tarjeta lateral, ventana emergente o pantalla completa.
- [x] Mostrar al agente únicamente beneficios autorizados dentro del creador.
- [x] Aplicar el descuento al precio y al plan de pagos sin exponer un campo libre.
- [x] Validar en el servidor la oferta, vigencia, proyectos, precio oficial y cálculo antes de guardar.
- [x] Congelar el beneficio aplicado dentro del snapshot inmutable.
- [x] Reservar la edición avanzada de dossiers a roles internos del master broker.

## Arquitectura acordada

```text
Selección de proyecto/unidades
          ↓
SimpleProposalCreator
  1. Lead del CRM
  2. Beneficio autorizado opcional
  3. Portada y mensaje
  4. Vista previa / Guardar
          ↓
saveProposalAction
  validación de sesión, permiso, CRM, desarrolladora,
  unidad, precio oficial y oferta vigente
          ↓
Snapshot inmutable + enlace privado + actividad CRM
          ↓
Visor público / PDF
```

## Contrato de experiencia

THESIS: El creador es una secuencia comercial breve que produce una propuesta terminada; rechaza el lienzo libre y sus cuatro paneles editoriales.

OWN-WORLD: Superficie clara, tinta azul marino, acento de la desarrolladora y controles compactos de OB Brokers. La propuesta mantiene el lenguaje editorial de Cana Rock sin trasladar adornos al flujo operativo.

STORY: El broker confirma las unidades, selecciona un lead del CRM, revisa una portada y un mensaje, comprueba las páginas y guarda para compartir.

FIRST VIEWPORT: En escritorio, configuración compacta a la izquierda y una página Carta completa a la derecha. En móvil, acciones y configuración aparecen antes de una página Carta escalada exactamente, con navegación inferior fuera de la hoja.

FORM: Flujo guiado de tres estados dentro del sistema visual existente. Referencia fijada por el usuario: propuesta pública de Cana Rock.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Validación requerida

| Área | Escritorio | Móvil 390–430 px | Resultado |
|---|---:|---:|---|
| Selección obligatoria de lead | Validado en lógica y controles | Validado a 390 px | Pasa |
| Contracción del destinatario | Validado | Validado a 390 px | Pasa |
| Navegación de páginas | Validado, 6 páginas | Validado, 6 páginas | Pasa |
| Texto sin solapamientos | Validado en las 6 páginas | Validado visualmente a 390 px | Pasa |
| Imágenes sin pliegues | Validado | Validado | Pasa |
| Guardado y enlace | Flujo y validaciones compilados | Mismo flujo | Prueba autenticada pendiente tras publicación |
| PDF Carta | Render de 6 páginas completado | Mismo documento fijo | El navegador de prueba no expuso el evento de descarga; validar el archivo publicado |
| Visor público | Usa la misma hoja escalable | Sin desbordamiento horizontal | Prueba con enlace real pendiente tras publicación |
| Descuento manual | Bloqueado en pantalla y servidor | Mismo comportamiento | Pasa en lógica; prueba autenticada pendiente |
| Oferta vigente/asignada | Verificada contra base de datos al guardar | Mismo comportamiento | Pasa en lógica; prueba autenticada pendiente |
| Anuncios del CRM | Banner/tarjeta/modal según configuración | Adaptación sin bloquear navegación | Prueba visual final pendiente |

## Estado de control de calidad

- TypeScript: pasa sin errores.
- Lint dirigido a esta implementación: 0 errores y 0 advertencias.
- El lint global del repositorio conserva deuda previa fuera de este alcance (96 errores y 157 advertencias); la compilación de producción sí pasa completa.
- Compilación de producción con Next.js: pasa.
- Detector de regresiones visuales de Impeccable: sin hallazgos.
- Vista móvil de 390 px: ancho de contenido igual al ancho visible; no existe desplazamiento horizontal.
- Las páginas ocultas del PDF no permanecen montadas durante la edición, reduciendo la carga inicial de imágenes.
- La exportación espera que cada imagen cargue y se decodifique; si una falla, informa el error y evita descargar un PDF incompleto.
- Creador móvil con oferta aplicada: 0 imágenes rotas, sin desplazamiento horizontal y precio base/descontado visibles.
- Migración SQL: archivo y tipos preparados; la prueba automática contra Postgres local queda pendiente porque el servicio local no estaba iniciado.
- Historial Supabase: la comparación solo lectura encontró migraciones locales y remotas desalineadas desde antes de este cambio. No ejecutar un `db push` general sin reconciliar ese historial; publicar esta migración de forma controlada.

## Registro de cambios

### 2026-09-14

- Se fijó la separación entre dossier y propuesta.
- Se documentó la obligación de usar un lead del CRM.
- Se fijó el escalado móvil de la misma composición Carta.
- Se prohibió el efecto de esquina doblada en imágenes de página completa.

### 2026-09-15

- Se creó `SimpleProposalCreator` y la ruta nueva dejó de usar el editor libre de dossiers.
- Se centralizaron las seis páginas y los datos de propuesta en `lib/proposals/proposal-template.ts`.
- Se añadió `ScaledProposalSheet` para conservar la composición Carta de escritorio en móvil.
- Se validó visualmente cada una de las seis páginas a 390 px y se eliminó el desbordamiento horizontal.
- Se compactaron las amenidades y se corrigieron límites de texto, separación del pie e imágenes a sangre sin pliegues.
- Se optimizó la carga: solo se renderiza la página visible y las páginas de exportación aparecen temporalmente al generar el PDF.
- Se reforzó la exportación para esperar imágenes cargadas y rechazar documentos incompletos.
- Se adaptó el visor público para usar el mismo escalado de hoja.
- Se retiró el acceso al simulador antiguo desde la disponibilidad; cada unidad disponible abre el creador nuevo con el identificador de unidad.
- Se documentó el sistema visual vigente en `DESIGN.md` y `.impeccable/design.json`.
- Se creó la migración de base de datos para ofertas y promociones con políticas de acceso por organización y proyecto.
- Se creó el panel de marketing para administrar beneficios, fechas, banners, proyectos y ubicaciones del anuncio.
- Se eliminó el descuento libre del flujo comercial y se añadió validación de precio/oferta en el servidor.
- Se añadió el beneficio autorizado a la portada, inventario, cálculo del plan de pagos y snapshot inmutable.
- Se añadió una zona de comunicación dentro del CRM con banner, tarjeta lateral, popup o pantalla completa; los modales se muestran una vez por sesión y pueden cerrarse.
- Se retiró el permiso de edición editorial de dossier a los roles de agencia; reciben el material oficial terminado.
- Se compactó la acción principal móvil a “Guardar” para que el nombre del proyecto conserve espacio en el encabezado.
- Las miniaturas de portada se solicitan de inmediato para evitar el retraso visual observado al abrir el creador.

### Auditoría de compilación — 2026-09-15

- Se auditó el error reportado después de la actualización con otra IA.
- Se corrigieron los tipos de Supabase para reflejar `agreements.public_code` en `Row`, `Insert` y `Update`. Las consultas de acuerdos ya pueden seleccionar y devolver su código público sin producir `SelectQueryError`.
- Se corrigió el resumen de operaciones de desarrolladoras para conservar `organizations.slug`, que ya venía incluido en la consulta pero se perdía en el casteo local.
- La compilación de producción fue verificada de extremo a extremo: TypeScript, páginas estáticas y optimización finalizaron correctamente.
- La primera ejecución sin red falló únicamente porque `next/font` no pudo descargar fuentes existentes de Google. Con acceso de red, el mismo build terminó correctamente; no se modificaron las fuentes porque no forman parte del error funcional.

## Pendientes o decisiones futuras

- Ajustes posteriores de contenido o estilo que el usuario solicite después de aprobar esta versión uno a uno.
- Definir si en una fase posterior se permiten planes de pago alternativos por propuesta; en V2 se usa el plan oficial del proyecto.
- Después del próximo despliegue, crear una propuesta con un lead real, abrir el enlace privado recibido y descargar el PDF desde un navegador móvil físico.
- Verificar el correo automático con un contacto que tenga una dirección válida; si el envío falla, el enlace debe permanecer disponible para copiarlo manualmente.
- Aplicar la migración `20260915113919_marketing_offers.sql` en el entorno publicado antes de habilitar el menú de ofertas.
- Reconciliar primero el historial de migraciones de Supabase o aplicar únicamente esta migración mediante el procedimiento controlado del proyecto; un envío masivo intentaría incluir migraciones antiguas pendientes.
- Crear una oferta real de prueba, aplicarla a una propuesta y confirmar que al pausarla desaparece inmediatamente para los agentes.
- Si el entorno de CI/CD no tiene salida a Internet, autoalojar las fuentes de Google con `next/font/local` para que el build no dependa de la red.

### Corrección de archivado de propuestas — 2026-09-15

- Se auditó el error `presentations_status_check` al intentar eliminar propuestas antiguas.
- La acción del portal realiza un archivado reversible (`archived`) para conservar enlaces, auditoría e historial; no elimina físicamente el documento.
- Se creó la migración `20260915200224_allow_archived_presentation_status.sql` para volver a admitir ese estado en la base de datos.
- La lista activa ya excluye las propuestas archivadas, por lo que desaparecerán del listado después de aplicar la migración.

### Menú público simplificado — 2026-09-15

- Se redujo la navegación de proyectos al recorrido comercial principal: `03. Modelos`, `04. Ubicación` y `05. Disponibilidad`.
- Se retiraron Concepto, Calidades, Master Plan, Lotes e Inversión del menú; el logo continúa llevando al inicio.
- Se actualizó el encabezado de modelos para hablar de “modelos” y no de “villas”, manteniendo el contenido de la sección.

### Auditoría móvil del detalle de proyecto — 2026-09-15

- La captura mostró desplazamiento horizontal: la vista móvil no estaba contenida por el layout principal.
- Se aisló el desbordamiento en `ProjectDetail` y `PortalShell` con contención horizontal y `min-w-0`.
- La navegación de pestañas ahora conserva cada opción completa y permite desplazamiento horizontal dentro de su propia barra, sin mover toda la página.
- Se añadieron roles y estado seleccionado a las pestañas para mejorar navegación asistida.

### Regla común para headers de landings — 2026-09-15

- UVE, Ciprés y Cana Rock conservan headers propios, con su logo, colores, tipografías y navegación visual independiente.
- La regla compartida es únicamente funcional: no mostrar nombre ni empresa del usuario en el header; ubicar siempre un botón `Proyectos` en la zona de acciones; y abrir desde ahí un selector moderno para cambiar entre proyectos de Cana Rock.
- En escritorio el selector se muestra como desplegable; en móvil se integra dentro del menú de cada landing.
- La acción de contacto continúa disponible dentro del contenido de la landing, sin ocupar el lugar del selector de proyectos en el header.
- El precio editable del calculador se muestra con separadores de miles, pero se convierte nuevamente a número antes de calcular.
- El selector de proyectos no se muestra en landings con un solo proyecto del desarrollador; cuando hay varios, solo lista los proyectos públicos de ese mismo desarrollador. Cana Rock mantiene su selector propio.

### Manuales operativos — requisito registrado — 2026-09-15

- Los dos manuales previstos para agencias y Master Brokers/desarrolladoras se entregarán en PDF.
- La línea gráfica será clara: fondo blanco, texto de alto contraste, pasos numerados, capturas señalizadas y explicaciones detalladas sin fondos oscuros.

### Corrección del editor de proyectos y tipologías — 2026-09-15

- El botón `Editar` enviaba el proyecto mediante `slug`, pero el administrador solo leía `project`; por eso abría el primer proyecto del listado.
- El panel ahora reconoce el `slug` y el `id`, conserva el proyecto seleccionado y reinicia el editor por proyecto.
- El editor recibe las tipologías dinámicas del proyecto seleccionado, de modo que UVE muestra sus modelos en `3. Modelos y Tipologías`.

### Auditoría repetida del flujo desde Centro de operaciones — 2026-09-15

- Se reprodujo el recorrido autenticado `portal/dev → Proyectos → Editar UVE`.
- El entorno publicado mostró que UVE abre con `slug=uve-residences`, proyecto `Uve Residences` y sus 2 tipologías; no se reprodujo que cargara Cana Rock.
- Se eliminó la redirección intermedia del botón `Editar`; ahora abre directamente `/portal/admin/projects?slug=...&tab=edit`.
- Se añadió sincronización de la selección con los parámetros de la URL para impedir que el componente reutilizado vuelva al primer proyecto.
- El acceso `Proyectos e inventario` de `portal/dev` ahora lleva a la administración global de proyectos, no al catálogo de consulta.
- Pendiente tras el despliegue: repetir la prueba en móvil y guardar un cambio de UVE para verificar que el proyecto se conserva.

### Auditoría de responsables de Master Broker — 2026-09-15

- La pantalla `Proceso de reserva` del proyecto solo administra destinatarios operativos por correo; no asigna usuarios del CRM.
- La asignación actual se inicia en `Administración > Equipo`, mediante invitación o asignación de proyectos a una membresía.
- Se detectó una limitación funcional: `Editar agencia y acceso` mueve la membresía y revoca la anterior; no permite que un mismo usuario tenga membresías activas en varios Master Brokers.
- No se debe mover a Osvaldo o Anna sin confirmar, porque podrían perder su organización actual.
- Pendiente recomendado: crear `Agregar miembro existente` y permitir membresías múltiples por organización, con rol independiente y proyectos asignados por cada Master Broker.
- También debe corregirse la vista de detalle de UVE: en la sesión auditada el listado de Equipo muestra una membresía, mientras el detalle de UVE muestra `Miembros (0)`.

### Membresías múltiples para responsables de Master Broker — 2026-09-15

- Se añadió `Agregar miembro existente` en `Administración > Equipo`.
- El superadministrador puede elegir un usuario ya registrado, un Master Broker activo y el rol específico para esa organización.
- La nueva membresía se crea como adicional y no revoca las organizaciones actuales del usuario.
- Se corrigió el detalle de organizaciones para contar las membresías y proyectos mediante `grantee_membership_id`.
- Para UVE se deben agregar Osvaldo Bello y Veronica Pujos como `Administrador del Master Broker`, si ese es el nivel de responsabilidad deseado.

### Centro de administración del Master Broker — 2026-09-15

- La ficha de cada Master Broker deja de presentar `Proyectos asignados` como bloque principal.
- Ahora organiza la información en administradores directos, agencias con acuerdos vigentes, usuarios de desarrolladoras autorizadas y destinatarios de reportes.
- Los destinatarios se leen de las configuraciones existentes de reportes de clientes, acuerdos/pagos y reservas/operaciones.
- La pantalla de UVE queda preparada para centralizar la supervisión de Osvaldo, Veronica, agencias colaboradoras y usuarios de desarrolladoras.
- La compilación fue validada después de este cambio.

### Configuración privada del Master Broker — 2026-09-15

- La ficha del Master Broker ahora incluye el botón `Configurar` para destinatarios de reportes.
- Solo el rol `super_admin` puede ver ese panel y ejecutar altas o bajas de correos.
- Los roles de administración del Master Broker, agencias y desarrolladoras no ven ese bloque ni pueden editarlo.
- Se configuraron tres categorías: reporte de clientes, pagos/acuerdos y reservas/operaciones.
- Las acciones validan el rol en servidor, además de ocultar el panel en la interfaz.

### Compatibilidad para eliminar propuestas antiguas — 2026-09-15

- El entorno publicado aún conserva la restricción antigua de estados de `presentations` y rechazaba `archived`.
- La acción mantiene el archivado reversible cuando la migración está aplicada.
- Mientras exista la restricción antigua, el superadministrador usa un fallback controlado de eliminación física de la propuesta, sus versiones y enlaces relacionados.
- El alcance queda limitado a la organización actual y se registra en auditoría.

### Prueba publicada del centro UVE — 2026-09-15

- Se abrió la ficha publicada de UVE en `/portal/admin/brokers/uve-residences-mu06efy7` con la sesión de superadministrador.
- El botón `Configurar` sí funciona: abre el panel privado con las categorías `Reporte de clientes`, `Pagos y acuerdos` y `Reservas y operaciones`.
- El formulario valida correctamente un correo vacío con el mensaje `Indica un correo válido.` sin guardar datos incompletos.
- La pantalla de Equipo también responde: `Agregar miembro existente` abre el selector y muestra a Rony, Veronica, Anna y Gleivys, además de los Master Brokers disponibles incluido `Uve Residences`.
- Los contadores de UVE permanecen en cero porque todavía no existe una membresía de administrador ni un acuerdo de agencia registrado para UVE; no es un fallo de apertura del panel.
- Para que aparezcan responsables, se debe agregar a Osvaldo y Veronica desde `Administración > Equipo > Agregar miembro existente`, seleccionando `Uve Residences` y el rol `Administrador del Master Broker`. Para que aparezcan agencias, debe existir un acuerdo activo que vincule la agencia con UVE.
- No se creó ningún registro de prueba ni se alteraron accesos durante esta auditoría.

### Corrección de responsables visibles en UVE — 2026-09-15

- Se confirmó que Veronica ya tenía la membresía activa de `Uve Residences` con rol `Master Broker Admin` en Equipo.
- El detalle de UVE seguía mostrando cero porque su consulta dependía de una relación anidada con perfiles y no estaba leyendo de forma robusta las membresías.
- Se corrigió la consulta para leer primero las membresías de la organización y luego resolver sus perfiles por `user_id`, igual que el listado global de Equipo.
- La compilación volvió a pasar correctamente.
- Después del despliegue, la ficha de UVE debe mostrar a Veronica y a cualquier otro administrador asignado; si no aparece inmediatamente, hay que refrescar la página publicada para cargar la nueva versión.

### Selección de imágenes por propuesta — 2026-09-15

- El creador permite elegir una imagen de portada independiente para la primera página.
- Se añadió una galería propia de la propuesta con máximo de 12 imágenes seleccionables.
- La selección se guarda dentro del snapshot de la propuesta y se utiliza también en la vista previa y en la exportación PDF.
- La portada y la galería se muestran con estados seleccionados, contador `n/12`, límite visual al alcanzar 12 imágenes y controles accesibles en móvil.
- El bloque usa los colores principales y de acento definidos por cada proyecto, manteniendo la línea gráfica individual y sus iconos.
- Las propuestas existentes conservan su comportamiento mediante valores de respaldo del proyecto.
