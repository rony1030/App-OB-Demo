# Plan de seguridad y auditoría

## Objetivo

Evitar que un usuario vea o modifique información fuera de su organización, rol o proyecto asignado, y asegurar que documentos, propuestas, comisiones e invitaciones sigan un flujo verificable.

## Límites de la auditoría

Las pruebas deben ejecutarse primero en local o staging con datos ficticios. No se harán ataques contra producción, fuerza bruta, saturación, ingeniería social, escaneo de terceros ni eliminación de datos. Cada prueba debe tener un usuario de prueba, un resultado esperado y una evidencia que pueda revertirse.

## Prioridad 0: bloqueo inmediato

- Confirmar que todas las mutaciones server-side llaman a `getCurrentUser` y validan rol, organización y proyecto.
- Probar IDOR en documentos, acuerdos, propuestas, clientes, unidades y comisiones cambiando solo el ID o la ruta.
- Verificar que ningún secreto de Supabase, token de invitación o enlace firmado aparece en el cliente, logs o respuestas innecesarias.
- Confirmar que `service_role` solo se importa en acciones de servidor y nunca en componentes cliente.
- Revisar que una función RPC sensible compruebe `auth.uid()`, estado de membresía, organización y transición válida de estado.

## Prioridad 1: datos y archivos

- Revisar RLS para cada tabla sensible: organizaciones, membresías, proyectos, unidades, contactos, propuestas, acuerdos, documentos y comisiones.
- Probar separación entre agencias, master brokers, developers y proyectos asignados.
- Limitar tamaño, MIME real, extensión y ubicación de cada subida; eliminar el objeto si falla el registro posterior.
- Usar buckets privados para documentos legales, facturas, firmas y acuerdos; entregar únicamente URLs firmadas de corta duración.
- Validar que el nombre de archivo nunca controle la ruta final.

## Prioridad 2: autenticación y sesiones

- Mantener `shouldCreateUser: false` para el acceso por magic link.
- Responder igual si el correo existe o no para evitar enumeración de cuentas.
- Hacer que las invitaciones sean de un solo uso, expiren y puedan revocarse.
- Probar sesión suspendida, membresía revocada, cambio de rol y múltiples membresías.
- Revisar límites de solicitudes para login, invitaciones, reenvíos y recuperación de contraseña.

## Prioridad 3: flujos de negocio

- Probar que una agencia no pueda crear proformas antes de que una comisión sea desbloqueada.
- Probar que no pueda modificar el monto, venta, unidad, porcentaje o datos legales del snapshot aprobado.
- Probar que solo el equipo autorizado pueda confirmar pagos, aprobar correcciones y marcar una comisión como pagada.
- Registrar auditoría de cada cambio sensible con actor, organización, objeto, estado anterior y posterior.

## Matriz mínima de pruebas

| Área | Caso | Resultado esperado |
| --- | --- | --- |
| Documentos | Usuario A solicita ruta de documento de B | 404 o rechazo, sin URL firmada |
| Proyectos | Agencia consulta proyecto no asignado | Sin filas ni datos parciales |
| Unidades | Usuario cambia estado de unidad ajena | Rechazado por RPC/RLS |
| Invitaciones | Token usado, vencido o revocado | No crea membresía |
| Comisiones | Proforma antes de desbloqueo | Rechazada |
| Facturas | Archivo no permitido o demasiado grande | No se guarda objeto ni registro |
| Roles | Soporte intenta administrar finanzas | Rechazado |
| Sesión | Membresía suspendida conserva cookie | Acceso bloqueado |

## Criterio de salida

No se considera listo si existe una lectura o mutación fuera de alcance, una URL privada reutilizable indefinidamente, una transición financiera sin validación en base de datos, o una ruta que confía únicamente en controles visuales del frontend.

## Hallazgos iniciales

- **Corregido, alto:** la acción para abrir documentos de brokers aceptaba una ruta enviada por el cliente sin comprobar que perteneciera a un documento de la organización o del propio usuario. Ahora primero localiza el registro por organización y limita la lectura a su dueño o a personal autorizado.
- **Corregido, medio:** la subida de documentos de brokers no tenía límite de tamaño ni lista de formatos. Ahora acepta únicamente PDF, PNG y JPG hasta 15 MB y elimina el objeto si falla el registro en la base de datos.
- **Pendiente, medio:** el MIME declarado por el navegador no demuestra el contenido real. En una siguiente iteración debe añadirse inspección de firma de archivo en servidor y análisis antivirus antes de publicar el documento.
- **Pendiente, medio:** deben añadirse pruebas automatizadas de RLS que intenten leer y modificar datos cruzando organización, proyecto y membresía. Las pruebas SQL existentes cubren parte de proyectos e inventario, pero no todo el flujo documental y financiero.
- **Corregido, medio:** la restricción de eventos de analítica no incluía los eventos comerciales que el CRM ya intentaba registrar. Se amplió mediante migración conservando los eventos de enlaces públicos anteriores.
- **Corregido, medio:** la tabla de presencia tenía RLS sin una política de lectura explícita. Ahora solo los roles operativos autorizados pueden consultar sesiones de su propia organización; las escrituras directas siguen cerradas.

## Medición y privacidad

La medición debe separar tres cosas: eventos comerciales agregados, sesiones activas aproximadas y auditoría de seguridad. Para usuarios autenticados se puede asociar la actividad con su membresía y organización; para visitantes anónimos se deben guardar únicamente un identificador efímero, proyecto, superficie y tiempos, nunca nombres, correos, teléfonos, contraseñas ni contenido de formularios. La presencia debe expirar por heartbeat y no debe usarse como prueba única de identidad.

Las alertas de seguridad deben activarse por señales como múltiples fallos de acceso, cambios bruscos de organización, enumeración de IDs, intentos repetidos de rutas privadas, archivos rechazados y cambios financieros fuera de secuencia. La respuesta recomendada es registrar, limitar temporalmente, notificar al administrador y bloquear de forma reversible; las sanciones manuales requieren revisión y evidencia.
