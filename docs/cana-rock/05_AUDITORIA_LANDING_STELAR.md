# Auditoría de paridad — Cana Rock Cosmos Stelar

**Fecha:** 4 de septiembre de 2026  
**Referencia funcional:** `cana-rock.osvaldobello.com/stelar` y su implementación local autorizada  
**Destino:** `app-ob-brokers` → `/proyectos/cana-rock-stelar`

## Evidencia y alcance

La URL pública de referencia requiere correo para acceder al contenido, por lo que no fue posible inspeccionarla autenticada. La comparación se completó contra su implementación local autorizada en `C:\Users\Rony\Documents\GitHub\cana-rock.osvaldobello`, que contiene la misma estructura, contenido y biblioteca de iconos de Stelar.

Esta auditoría no copia usuarios, credenciales ni reglas de acceso. Identifica funciones públicas que deben pasar a la ficha central y al CRM de App OB Brokers antes de sustituir el portal anterior.

## Resultado por sección

| Sección original | Estado en App OB Brokers | Decisión / dependencia |
|---|---|---|
| Encabezado, identidad, hero, llamadas a contacto | Implementada | Encabezado reducido a marca y contacto; incluye menú compacto con el portafolio Cana Rock en móvil y escritorio intermedio. Falta habilitar hero en video cuando el CRM tenga un archivo aprobado. |
| Información editorial del proyecto | Implementada | Usa nombre, descripción, ubicación, desarrollador y galería central. |
| Galería oficial | Implementada con visor completo | La landing presenta portada y dos vistas de apoyo; el tercer bloque abre las ocho imágenes de Storage en un visor a pantalla completa con miniaturas, flechas, teclado y reproducción infinita controlable. |
| Amenidades | Implementada con paridad de iconos | Se incorporó exclusivamente la colección SVG original de Cana Rock. Los iconos se resuelven desde la amenidad central; no se aplican al catálogo principal. |
| Centro de recursos comerciales | Pendiente | Requiere categorías públicas de documentos: brochure, ficha técnica, master plan, renders, videos y avances, con enlaces y permisos por proyecto. |
| Línea blanca incluida | Pendiente | Requiere una lista administrable por proyecto y traducciones opcionales; no debe vivir como texto fijo en la landing. |
| Rentabilidad estimada | No aplica a Stelar | Solo la referencia de Star la muestra. Debe configurarse por proyecto, nunca aparecer como promesa predeterminada. |
| Disponibilidad dinámica | Implementada | App OB Brokers muestra unidades públicas reales en tarjetas o lista, con búsqueda, estado, bloque, tipología, habitaciones, baños, orden y moneda explícita. |
| Master plan / visualización 3D | Pendiente | Requiere activos aprobados por proyecto y una propiedad de configuración para cada experiencia. |
| Mapa de ubicación | Parcial | El modelo de configuración ya admite `locationMapUrl`; la experiencia Cana Rock todavía debe renderizarlo. |
| Calculadora de pagos | Pendiente | Ya existen planes de pago; falta una interfaz que calcule contra una unidad/precio real y conserve el resultado en propuesta, no en datos fijos. |
| Ficha técnica y propuesta | Parcial | La plataforma tiene propuestas y dossiers, pero la landing no presenta aún enlaces o acciones de recursos equivalentes. |
| Idiomas | Pendiente | La referencia contempla español, inglés y francés; se planificará cuando el contenido central tenga campos traducibles aprobados. |

## Principio de iconografía

- **Landing Cana Rock:** usa las siluetas SVG originales de Cana Rock, en su dorado `#CA9F47`, para mantener la identidad visual que ya reconocen los brokers.
- **Catálogo principal App OB Brokers:** usa su propia familia SVG lineal para dormitorios, baños, metraje y parqueos. No mezcla la identidad de una promoción con la interfaz compartida.
- **Amenidades centrales:** mantienen su nombre y datos en el CRM; la representación visual se selecciona por la experiencia de landing, no se duplica el contenido.

## Orden de implementación recomendado

1. Añadir al CRM los activos y metadatos de landing: video, master plan, modelo 3D, mapa, recursos comerciales y línea blanca.
2. Publicar el bloque de recursos con permisos de documento y enlaces trazables.
3. Incorporar el mapa y master plan solo después de validar los archivos oficiales de Stelar.
4. Construir la calculadora usando el plan de pago almacenado y una unidad/precio actual, con salida directa a propuesta.
5. Validar textos y activos en los tres idiomas antes de activar versiones traducidas.

## Criterio de cierre

La landing de Stelar estará lista para sustituir el flujo público anterior cuando cada sección aprobada provenga del CRM, los recursos se puedan administrar por proyecto, el inventario muestre datos sincronizados y ninguna sección publique información ilustrativa como si fuera oficial.

La evaluación se amplió posteriormente a los cuatro proyectos en `docs/cana-rock/06_AUDITORIA_PORTAFOLIO_CANA_ROCK.md`.
