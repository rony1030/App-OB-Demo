# Auditoría del proyecto — 24 de septiembre de 2026

## Resultado ejecutivo

La aplicación compila y sus rutas principales se generan correctamente. La landing pública de Elements y la vista previa de Palm View cargaron en navegador. Se corrigieron la descripción comercial de Elements, un riesgo de mostrar unidades no disponibles como reservables, un fallo potencial de parámetros URL, el tratamiento de una ruta dinámica y la aceptación de datos arbitrarios en la telemetría pública de propuestas.

Esto **no equivale a certificar que cada flujo de producción funciona**: no se ejecutaron reservas reales, correos, pagos, sesiones de todos los roles ni una prueba completa con datos autenticados. Esas pruebas requieren cuentas de prueba y un entorno aislado para no alterar operaciones reales.

## Cambios realizados

| Área | Hallazgo | Corrección |
| --- | --- | --- |
| Elements, página pública | El paquete base decía “Piscina privada” y podía confundirse con Eco Royal. | Se cambió a “Picuzzi no incluido (solo en Eco Royal)” y se alinearon las traducciones de esa descripción. |
| Elements, catálogo | La amenidad pública aún decía “Piscina privada en cada unidad”. | Se verificó el registro vinculado solo a Elements y se cambió a “Picuzzi privado en Eco Royal”. Se agregó una migración idempotente para instalaciones futuras. |
| Elements, disponibilidad | Una unidad reservada o de estado desconocido podía seguir ofreciendo “Apartar”; la ausencia de unidades podía mostrar 12 unidades ficticias del respaldo local. | “Apartar” aparece solo para unidades disponibles; estados desconocidos se muestran como no disponibles y sin inventario no se publica inventario de respaldo. El precio inicial, rango y conteo se obtienen de unidades disponibles. |
| URL de Elements | Un valor `broker` con `%` inválido podía fallar al decodificarse por segunda vez. | Se usa el parámetro ya decodificado y se limita su longitud. |
| Visitas de propuestas | La API aceptaba y guardaba metadatos arbitrarios enviados por visitantes. | Lista permitida de campos, índice de página validado, título de sección derivado del documento, idioma limitado a ES/EN/FR e ID de sesión validado. Se añadió prueba de regresión. |
| Vista previa Palm View | Durante la compilación aparecía una excepción de uso dinámico al consultar cookies. | La página se marca dinámica por solicitud; compilación posterior sin esa advertencia. |
| Guía Hostinger | Refería un archivo de ejemplo no versionado. | Ahora referencia `.env.example`, incluido en el repositorio. |

## Verificaciones ejecutadas

- `npm run build`: **correcto**, Next.js 16.3.5, 43 páginas estáticas generadas, sin el aviso dinámico de Palm View.
- `npx tsc --noEmit`: **correcto**.
- Pruebas existentes: simulador, aislamiento multiempresa con mocks (10 casos), privacidad analítica (3), traducciones de documentos y PWA: **correctas**.
- Nueva prueba `node scripts/test-public-proposal-events.cjs`: **6 comprobaciones correctas**, incluidos campos privados rechazados.
- API local de telemetría con `metadata` inválido: responde **400** como corresponde.
- Navegador: `https://brokers.osvaldobello.com/elements` abrió y mostró el catálogo público; `http://localhost:3008/preview-palm-view` abrió y mostró el contenido. Tras subir el commit, Hostinger publicó la nueva versión: se confirmó en la página pública “Picuzzi no incluido (solo en Eco Royal)”, la ausencia de la frase antigua y el nuevo conteo “12 de 12 solares disponibles”.
- Consulta de datos Elements: 12 unidades públicas disponibles, precios base de US$95,000 a US$108,000 al momento de la consulta. La amenidad y el destacado corregidos se verificaron en la base conectada.
- `git diff --check`: sin errores de espacios.

## Hallazgos pendientes y prioridades

| Prioridad | Hallazgo | Riesgo / siguiente acción |
| --- | --- | --- |
| Alta | El inventario de Palm View visible en la vista previa indica fuente del 31 de agosto de 2026; además muestra 274 unidades registradas frente a 275 declaradas. | Confirmar con la fuente oficial actualizada antes de presentar precios y disponibilidad como vigentes. No se modificaron datos comerciales sin documento nuevo. |
| Alta | Los flujos completos por rol (administrador, asesor, copia personalizada), guardado de dossier, reserva, correo y PDF no se ejercitaron de punta a punta con cuentas de prueba. | Preparar entorno de pruebas y cuentas por rol; verificar permisos reales de base de datos y publicación antes de considerar la auditoría cerrada. |
| Media | ESLint reporta 174 errores y 246 advertencias en 97 archivos (principalmente variables no usadas, tipos `any` e imágenes sin optimización). | Corregir por módulos en una tarea separada y activar una barrera de calidad gradual. Un arreglo masivo sin revisar comportamiento sería arriesgado. |
| Media | El análisis de interfaz encontró 38 avisos, principalmente tamaños de texto de 9–11 px y colores codificados fuera de un sistema común. | Revisar legibilidad, contraste, jerarquía y móvil de landing y visor en una auditoría visual específica. No se confirmó accesibilidad integral. |
| Media | La política de seguridad de contenido todavía permite `unsafe-inline` y `unsafe-eval`; también hay permisos amplios de SVG remoto. | Endurecer con pruebas de editor, PDF, imágenes y proveedores externos para evitar romper funciones existentes. |
| Media | `npm audit --omit=dev` no pudo consultar el registro por restricción de red. | Ejecutarlo desde CI o un entorno con acceso a npm y revisar alertas antes de declararlo libre de vulnerabilidades. |
| Baja | No existe un comando único `npm test`; varios scripts requieren un cargador TypeScript para ejecutarse en Node 26. | Unificar pruebas y ejecutarlas automáticamente en CI. |

## Alcance y confianza

Revisión estática de rutas públicas y API relevantes, datos de Elements, compilación, tipos, lint, pruebas existentes y exploración básica en navegador. La prueba de aislamiento multiempresa usa mocks y **no** verifica RLS real. No se hicieron escrituras operativas de reservas ni comunicaciones a clientes. Se confirmó el resultado visible de Elements en Hostinger, pero no se inspeccionaron desde esta estación la configuración interna del despliegue ni sus variables secretas.

Calificación orientativa sobre lo verificado (5 = sólido): funcionamiento técnico 4/5; integridad de datos comerciales 3/5; seguridad 3/5; accesibilidad y diseño 3/5; cobertura de pruebas 2/5. Son indicadores de priorización, no una certificación.
