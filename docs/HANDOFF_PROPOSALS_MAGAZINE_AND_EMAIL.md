# Entrega Técnica: Propuestas Revista, Disponibilidad y Envío por Correo

## Propósito

Este documento entrega el contexto para mejorar las propuestas comerciales sin reemplazar ni dañar el editor existente. El objetivo es que una propuesta creada por un agente tenga una sola fuente de verdad: se edita, se previsualiza, se publica, se abre desde el enlace y se exporta a PDF con la misma identidad editorial tipo revista.

Además, al usar **Guardar y Compartir**, la propuesta debe enviarse al correo del lead seleccionado, registrar el resultado del envío y permitir reenvíos controlados.

## Referencias obligatorias

Estas referencias deben abrirse antes de diseñar o programar el nuevo visor:

- Proyecto visual de referencia: [C:\Users\Rony\Downloads\remix\_-propuesta-blueland-properties](</C:/Users/Rony/Downloads/remix/_-propuesta-blueland-properties>)
- PDF de referencia tipo revista: [C:\Users\Rony\Downloads\Propuesta__.pdf](</C:/Users/Rony/Downloads/Propuesta__.pdf>)
- PDF de propuesta generado por la plataforma para comparar errores: [C:\Users\Rony\Downloads\Propuesta_cipres-residences_ES.pdf](</C:/Users/Rony/Downloads/Propuesta_cipres-residences_ES.pdf>)
- Enlace público real para inspección: [Propuesta Cana Rock A504](https://brokers.osvaldobello.com/p/085913d54c0d6ace6dbeddfdb36d611181d265a4)

No usar los nombres, logotipos, textos ni activos de la referencia como contenido final. Se usa exclusivamente como referencia de composición editorial, ritmo visual, jerarquía, presentación de datos y exportación PDF.

## Diagnóstico actual

### 1. El editor y el enlace público no son el mismo documento visual

El editor muestra una composición editorial con páginas, portada, bloques, fotos, marca y opciones de estilo. El enlace público usa un visor de propuesta que construye una presentación distinta. Como consecuencia, el cliente no recibe el mismo resultado que el agente aprobó en el editor.

Puntos de entrada actuales:

- Editor: `components/portal/PresentationEditor.tsx`
- Selección de unidades: `components/portal/proposals/ProposalUnitChooser.tsx`
- Guardado y publicación: `app/portal/proposals/actions.ts` (`saveProposalAction`)
- Página pública: `app/(public)/p/[token]/page.tsx`
- Visor público heredado: `components/proposals/MultiPropertyProposalViewer.tsx`
- Exportación PDF: `lib/export/presentation-pdf.ts`

La solución no debe crear una tercera plantilla aislada. Debe haber un renderer editorial compartido para vista previa, enlace público y PDF.

### 2. Guardar y Compartir no envía correo

`saveProposalAction` persiste `presentations`, `presentation_versions` y `shared_links`, crea telemetría y responde con un enlace. No invoca el módulo de correo. Por eso el aviso de propuesta publicada es correcto, pero el lead no recibe ningún mensaje.

Infraestructura existente reutilizable:

- SMTP Hostinger y transportador: `lib/email/mailer.ts`
- Variables: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- El editor ya exige que la propuesta quede vinculada a un lead registrado y muestra su correo.

### 3. Disponibilidad de Cana Rock incompleta en el selector

La pantalla de selección muestra `0 hab.`, `0 baños`, `0 parqueos` y `0 m²` para unidades Cana Rock. La tarjeta debe resolver la tipología asociada a cada unidad y presentar la ficha completa. Un agente no debe elegir una unidad sin saber su configuración comercial.

## Resultado esperado

### Propuesta editorial tipo revista

- Portada con fotografía dominante, identidad del proyecto, marca de agencia/broker, cliente y precio de referencia.
- Páginas con ritmo editorial: títulos con jerarquía, texto respirable, imágenes de calidad, tablas comerciales claras y cierre de contacto.
- El diseño no debe parecer un panel administrativo ni una plantilla de tarjetas genéricas.
- El mismo contenido y orden de páginas debe verse en editor, vista previa, enlace público y PDF.
- Debe ser responsive: lectura vertical cuidada en móvil, sin escalar una hoja de escritorio ilegible.
- Cada bloque debe conservar edición de contenido, imagen, color, tipografía, logo, legal y visibilidad según las capacidades actuales del editor.
- Las amenidades deben mostrar sus iconos seleccionados y permanecer congeladas en el snapshot de la propuesta.

### Disponibilidad y selección

- Antes de abrir el editor: búsqueda y selección de proyecto, una o varias unidades del mismo proyecto, precio y ficha visible.
- Para Cana Rock: cada tarjeta debe mostrar unidad, precio, tipología, habitaciones, baños, parqueos, m², torre/piso y estado de disponibilidad.
- Para Cipres: mantener el flujo solar -> una de las tres tipologías oficiales. No mostrar `Suite Estándar` ni tipologías heredadas.
- Dentro del editor: `Cambiar unidades` debe abrir el mismo selector, sin una barra horizontal de chips difícil de usar.
- La propuesta debe congelar precio, disponibilidad, tipología y plan de pago al publicarse. Cambios posteriores de inventario no alteran una propuesta ya enviada; deben mostrarse como aviso de disponibilidad sujeta a confirmación.

### Correo al cliente

Al pulsar **Guardar y Compartir** en una propuesta con lead y correo válido:

1. Guardar primero la propuesta, versión y enlace público de forma atómica o compensable.
2. Enviar un correo transaccional al correo del lead con nombre del proyecto, unidades, asesor, vigencia y botón del enlace.
3. Si el correo falla, no perder la propuesta: mostrar estado `Publicada, envío pendiente`, guardar el error y permitir `Reintentar envío`.
4. Si el correo se entrega al proveedor SMTP, mostrar `Correo enviado a nombre@dominio` con fecha y hora.
5. Registrar telemetría/auditoría de `proposal_email_requested`, `proposal_email_sent`, `proposal_email_failed` y `proposal_email_resent`, sin guardar el contenido completo del mensaje en texto plano.
6. Evitar duplicados con una clave de idempotencia por versión y destinatario. Un doble clic no puede mandar dos correos.
7. Añadir un botón explícito de reenvío en el historial de propuestas para administradores autorizados.

Se debe crear una función `sendProposalEmail` en `lib/email/mailer.ts` y una acción de servidor autenticada. El flujo no debe exponer credenciales SMTP al cliente.

## Arquitectura sugerida

### Fuente de verdad editorial

Mantener `presentation_versions.snapshot` como documento congelado. Crear o extraer un componente puro, por ejemplo `components/presentations/MagazineProposalRenderer.tsx`, que reciba el snapshot y una variante de contexto:

- `editor-preview`
- `public-viewer`
- `pdf-export`

El editor mantiene sus controles, pero su lienzo y el enlace público usan este mismo renderer. Las adaptaciones permitidas son de viewport, navegación y controles; nunca de contenido ni de composición base.

### PDF

El PDF debe generarse desde el renderer editorial o desde una representación HTML equivalente estable. Debe verificarse visualmente en tamaño carta/A4 antes de liberarlo. No usar una plantilla resumida diferente.

### Persistencia de envío

Crear una tabla o extensión de auditoría para envíos de propuesta, con:

- `presentation_id`, `presentation_version_id`, `recipient_email`, `status`
- `provider_message_id`, `attempt_count`, `last_attempt_at`, `sent_at`, `failure_reason`
- `created_by`, `idempotency_key`, `created_at`

RLS: solo autor, administradores de agencia/master broker y superadministrador según el alcance de la propuesta. El cliente jamás consulta este historial.

## Restricciones: no romper lo ya logrado

- No eliminar `presentations`, `presentation_versions`, `shared_links`, telemetría, historial o auditoría append-only.
- No volver a permitir texto libre como destinatario: una propuesta debe continuar ligada a un lead existente.
- No cambiar tokens públicos, vencimiento, decisiones del cliente, marca blanca, logos, permisos o dossiers sin pruebas de regresión.
- No eliminar las capacidades de bloques, medios, estilos, legal, cambio de unidades o duplicado de páginas del editor actual.
- No mutar snapshots históricos para "arreglar" su apariencia. El renderer debe poder interpretar versiones anteriores con compatibilidad hacia atrás.
- No usar claves `NEXT_PUBLIC_*` para SMTP, IA o credenciales sensibles.
- No enviar correo antes de que exista una versión y enlace válidos.

## Pruebas de aceptación obligatorias

### Propuesta y revista

1. Crear una propuesta Cana Rock con una unidad y un lead real de prueba.
2. Cambiar título, descripción, color, logo, foto y al menos una amenidad en el editor.
3. Confirmar que la vista previa, enlace público y PDF conservan exactamente la misma portada, contenido y orden de páginas.
4. Repetir con Cipres usando un solar y una de las tres tipologías válidas.
5. Confirmar que móvil no tiene texto cortado, superposiciones ni controles inalcanzables.

### Correo

1. Enviar al correo del lead y confirmar recepción, asunto, logo, enlace, vencimiento y remitente.
2. Simular SMTP inválido o temporalmente fuera de servicio: la propuesta debe quedar publicada y el usuario debe poder reintentar.
3. Pulsar dos veces guardar/enviar: solo un correo debe ser entregado.
4. Reenviar desde historial como administrador y confirmar que queda registro de ambas acciones.

### Datos y seguridad

1. Una agencia solo puede usar sus leads y ver sus propios envíos.
2. Los roles sin permiso no pueden reenviar ni inspeccionar telemetría de terceros.
3. La disponibilidad muestra datos reales de tipología para Cana Rock y no ceros de relleno.
4. El token vencido o revocado no permite vista, PDF ni decisión.
5. Verificar auditoría de creación, publicación, correo y reenvío.

## Orden recomendado de implementación

1. Reproducir el correo faltante y añadir el servicio/registro de envío con pruebas.
2. Resolver la ficha de disponibilidad Cana Rock y probar sus datos contra inventario.
3. Extraer renderer editorial compartido sin cambiar el esquema de snapshots.
4. Migrar enlace público al renderer compartido, con compatibilidad de snapshots antiguos.
5. Hacer que PDF use el mismo renderer y realizar comparación visual con el PDF de referencia.
6. Ejecutar las pruebas de aceptación con roles, escritorio, móvil y correo real.

## Entregables solicitados al programador

- Pull request con cambios limitados, migraciones reversibles y notas de despliegue.
- Capturas comparativas: editor, enlace público y PDF de una misma propuesta.
- Evidencia del correo recibido y de un fallo/reintento controlado.
- Lista de rutas y componentes afectados.
- Plan de reversión si el renderer público muestra una regresión.
