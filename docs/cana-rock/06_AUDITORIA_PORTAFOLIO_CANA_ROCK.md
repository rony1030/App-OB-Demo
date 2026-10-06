# Auditoría de portafolio — Cana Rock

**Fecha:** 4 de septiembre de 2026  
**Alcance:** Star, Universe, Galaxy y Cosmos Stelar en `http://localhost:3006/proyectos/*`  
**Método:** revisión visual de escritorio, respuesta HTTP, inspección de datos migrados, revisión del renderer compartido y contraste con la implementación Cana Rock autorizada.

## Resumen ejecutivo

Las cuatro landings públicas están operativas y consistentes: cargan con HTTP 200, presentan su identidad, portada, galería, amenidades, explorador de inventario completo y contacto. No se encontró un defecto que afecte solo a un proyecto.

La brecha actual es de **paridad funcional común**, no de contenido: la experiencia ya permite explorar el inventario publicado, pero todavía no sustituye todas las herramientas del portal de Cana Rock. Debe evolucionar hacia una landing administrable con recursos, visibilidades y herramientas de venta.

## Matriz verificada por proyecto

| Proyecto | Ruta | Estado comercial visible | Inventario mostrado | Galería | Amenidades | Resultado |
|---|---|---|---:|---:|---:|---|
| Cana Rock Star | `/proyectos/cana-rock-star` | Listo para entrega | 44 unidades | 10 imágenes | 11 | Rentabilidad y línea blanca configuradas; recursos comerciales siguen pendientes de carga y aprobación. |
| Cana Rock Universe | `/proyectos/cana-rock-universe` | Mayo de 2027 | 12 unidades | 11 imágenes | 9 | Correcto; pendiente la capa común de recursos, disponibilidad completa y calculadora. |
| Cana Rock Galaxy | `/proyectos/cana-rock-galaxy` | Agosto de 2026 | 17 unidades | 6 imágenes | 10 | Correcto; las seis imágenes coinciden con el conjunto oficial migrado. Pendiente la capa común. |
| Cana Rock Cosmos Stelar | `/proyectos/cana-rock-stelar` | Diciembre de 2027 | 43 unidades | 8 imágenes | 12 | Correcto; usa la colección SVG original de Cana Rock. El master plan ya existe en galería, pero falta presentarlo como sección administrable. |

**Total validado:** 116 unidades, 35 imágenes de galería y 42 relaciones de amenidades. Las cifras coinciden con la migración vigente.

## Qué ya está hecho

### Datos y operación

- Cuatro proyectos publicados en Supabase con responsable, desarrollador y relación de master broker.
- Inventario inicial de 116 unidades mapeado desde la fuente oficial y expuesto como unidades públicas.
- 43 activos propios en Storage: portadas, logos y galerías.
- Amenidades centralizadas y editables desde el CRM mediante una operación atómica por proyecto.
- Planes de pago almacenados en la ficha de proyecto y disponibles para propuestas/dossiers.

### Experiencia pública

- Landing `cana-rock-resort` exclusiva para Cana Rock, sin modificar la experiencia de otros desarrolladores.
- Encabezado, identidad, héroe, métricas, navegación, galería, amenidades, disponibilidad filtrable y contacto presentes en las cuatro rutas. El menú compacto conserva acceso entre los cuatro proyectos también en móvil y escritorio intermedio.
- Galería editorial con tres imágenes visibles (portada y dos vistas) y visor a pantalla completa para el conjunto completo: miniaturas, flechas, teclado, autoplay infinito y pausa manual.
- Explorador de disponibilidad común con todo el inventario público, búsqueda, estado, modelo, torre, habitaciones, baños, orden y carga progresiva, sin exponer unidades privadas. Inicia en tarjetas y puede alternar a lista; distribuye de una a cuatro tarjetas según pantalla, sin métrica de avance de obra.
- Precios sin ambigüedad: Cana Rock y Ciprés están configurados en USD hoy; la plataforma conserva el código ISO por proyecto/unidad. La migración limitada para admitir nuevas monedas está preparada y requiere confirmación antes de aplicarse en Supabase.
- Las visibilidades existentes del constructor controlan las secciones aplicables de la experiencia Cana Rock; el plan de pago se presenta desde los pasos centralizados cuando está habilitado.
- Nombre visible normalizado a **Cana Rock Cosmos Stelar**; `stelar` permanece solo como slug compatible.
- SVG originales de Cana Rock aplicados únicamente a sus amenidades; iconografía propia y neutra para las tarjetas del catálogo principal.
- Catálogo general refinado: datos de habitaciones, baños, metraje y parqueos sin truncamiento, estados comerciales contextualizados y CTA simplificado. Sus rangos y precio desde se calculan exclusivamente desde el inventario público disponible de cada proyecto, no desde datos maestros.

### Verificación completada

- Las cuatro rutas públicas responden con HTTP 200.
- Nombres, inventario inicial y contacto están presentes en cada respuesta.
- Revisión visual de escritorio completada en las cuatro cabeceras y en la sección de amenidades de Stelar.
- TypeScript, ESLint, compilación de producción y detector Impeccable sin errores para los componentes modificados.

## Brechas y mejora priorizada

| Prioridad | Brecha | Afecta | Por qué importa | Siguiente implementación |
|---|---|---|---|---|
| Resuelto | Disponibilidad completa y filtrable | Los 4 | La muestra fija de ocho unidades fue sustituida por un explorador de todo el inventario público. | Mantener la frescura mediante el conector en sombra y medir el uso de filtros antes del piloto. |
| Resuelto | Visibilidad/configuración de secciones | Los 4 | El renderer Cana Rock ya interpreta las visibilidades aplicables y publica el plan de pago desde la ficha central cuando corresponde. | Extender el modelo solo cuando aparezca una sección nueva con datos y criterio de publicación aprobados. |
| En curso | Recursos comerciales administrables | Los 4 | El CRM ya controla categoría, visibilidad, estado, versiones y checksum antes de una descarga. | Cargar y aprobar los primeros archivos oficiales de Star y Stelar; luego probar RLS positiva y negativamente. |
| P2 | Master plan, modelo y mapa | Star, Stelar y cuando exista en Universe/Galaxy | Hay activos o espacios de referencia, pero faltan campos de clasificación y una presentación consistente. | Extender media/configuración por proyecto y publicar solo activos aprobados. |
| P2 | Calculadora basada en unidad real | Los 4 en construcción | El plan de pago existe, pero no hay calculadora comercial que use precio de unidad vigente y enlace la simulación a una propuesta. | Crear simulador conectado a inventario y propuestas. |
| P2 | Línea blanca y beneficios por proyecto | Los 4 | La referencia los expone; actualmente no tienen modelo administrable común. | Crear listas y bloques condicionales editables desde CRM. |
| P2 | Rentabilidad configurable | Star primero | Es una sección relevante para Star, pero no puede presentarse como una promesa universal. | Modelar fuente, periodo y descargo por proyecto; publicar solo con aprobación. |
| P3 | Idiomas | Los 4 | La referencia contempla ES/EN/FR; el contenido central todavía no conserva traducciones por campo. | Incorporar versiones traducibles después de cerrar contenido y recursos. |
| P3 | Accesibilidad de diálogo y controles compactos | Los 4 | El visor ya tiene controles etiquetados, teclado, pausa y miniaturas; falta retener el foco dentro del diálogo y revisar objetivos táctiles en dispositivo físico. | Endurecer foco y objetivos táctiles al construir la siguiente iteración. |

La clasificación, límites de publicación y orden de migración de recursos comerciales se documentan en `docs/cana-rock/07_AUDITORIA_RECURSOS_COMERCIALES.md`.

## Salud técnica de la experiencia actual

| Dimensión | Puntuación | Evidencia |
|---|---:|---|
| Accesibilidad | 3/4 | Imágenes con texto alternativo, navegación semántica, botones etiquetados, teclado y pausa del visor; queda retención de foco y ajuste de algunos objetivos táctiles. |
| Rendimiento | 3/4 | Portada con `next/image`, galería diferida y una sola imagen activa del héroe; falta medir métricas reales de producción. |
| Responsive | 3/4 | La composición cambia de una a varias columnas, el encabezado se convierte en menú compacto y la disponibilidad pasa de una a cuatro tarjetas; requiere prueba física móvil antes de producción. |
| Theming | 3/4 | La identidad Cana Rock es coherente y el renderer ya interpreta colores, activos y visibilidades aplicables del constructor; faltan nuevas secciones administrables. |
| Integridad de implementación | 3/4 | El detector no encontró desviaciones; quedan secciones configurables y recursos comerciales por conectar. |
| **Total** | **16/20** | **Bueno: preparado para presentar disponibilidad y condiciones comerciales, pendiente de paridad operativa.** |

## Fases: estado y siguiente paso

| Fase | Estado actual | Evidencia | Siguiente paso |
|---|---|---|---|
| 0. Seguridad y línea base | En progreso | Inventario y riesgos documentados; el alcance de datos se mantiene controlado. | Cerrar backup, manifiesto y rotación de credenciales. |
| 1. Organizaciones y permisos | Implementación inicial | Master broker, desarrollador y relación creados. | Completar usuarios/participantes y pruebas de aislamiento por rol. |
| 2. Conector de disponibilidad | Modo sombra | 116 unidades iniciales importadas y mapeadas. | Activar reconciliación programada con monitoreo y excepciones. |
| 3. Catálogo y landing | Base completada; paridad en progreso | Cuatro landings, activos, galería editorial con visor completo, amenidades, catálogo derivado de inventario disponible, moneda explícita y plan de pago configurable verificados. | Cargar los recursos oficiales aprobados y habilitar su superficie pública controlada. |
| 4. Usuarios y CRM | No iniciada | CRM actual puede editar la ficha y amenidades. | Migrar roles, brokers, agencias, leads y propiedad comercial. |
| 5. Propuestas y dossiers | Parcial | La plataforma ya genera propuestas/dossiers; falta paridad de recursos y plantillas Cana Rock. | Vincular recursos y simulaciones a cada propuesta. |
| 6. Estadísticas | No iniciada | Aún no existe diccionario de eventos ni panel consolidado de rendimiento. | Diseñar eventos: vista, recurso, consulta, filtro, propuesta y reserva. |
| 7. Piloto y corte | No iniciada | No se debe retirar el flujo anterior todavía. | Piloto con brokers, comparación de resultados y rollback documentado. |

## Próximo ciclo recomendado

**Ciclo 006 — Recursos comerciales por proyecto**

1. Diseñar categorías de recursos comerciales y la gestión desde CRM sobre el modelo versionado existente.
2. Migrar y clasificar primero los activos oficiales de Star y Stelar: brochure, ficha, master plan, mapa, renders y videos.
3. Publicar solamente recursos aprobados; mantener los documentos de brokers bajo enlace firmado y RLS.
4. Añadir eventos de analítica comercial para vistas, recursos, filtros y solicitudes.
5. Auditar visual y funcionalmente las cuatro rutas antes de abrir el piloto.

No se recomienda publicar recursos, rentabilidad, simulaciones ni mapas hasta que cada archivo, precio y fuente comercial esté validado por Cana Rock.
