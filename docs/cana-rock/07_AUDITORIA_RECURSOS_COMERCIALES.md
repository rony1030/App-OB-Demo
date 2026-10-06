# Auditoría de recursos comerciales — Cana Rock

**Fecha:** 4 de septiembre de 2026  
**Alcance:** repositorio local de referencia `cana-rock.osvaldobello`, modelo de documentos de App OB Brokers y cuatro proyectos Cana Rock.

## Decisión de seguridad

No se publicará ni copiará automáticamente un documento del sistema anterior. Los brochures, fichas técnicas y disponibilidades del portal previo se generan o sirven mediante rutas PDF por proyecto e idioma; por tanto, se deben exportar y aprobar como versiones concretas antes de ingresarlos a App OB Brokers.

El modelo destino ya resuelve la parte sensible:

- `project_documents` registra título, categoría, visibilidad y estado editorial.
- `document_versions` conserva versiones, archivo, MIME, tamaño, checksum, autor y fecha de publicación.
- Los archivos viven en `private-documents` y se entregan a brokers autorizados mediante enlace firmado temporal.
- La base permite únicamente tres visibilidades: `public`, `authorized` y `private`.

## Inventario encontrado en la referencia

| Recurso | Estado | Uso propuesto | Visibilidad inicial |
|---|---|---|---|
| Brochure por proyecto e idioma | Generado/servido desde el portal anterior | Recurso comercial descargable, después de exportación y revisión | `authorized` |
| Ficha técnica por proyecto e idioma | Generada/servida desde el portal anterior | Recurso para brokers y propuestas | `authorized` |
| Disponibilidad PDF | Generada desde el inventario | No migrar como archivo fijo; regenerar desde la fuente canónica | `authorized` |
| Master plan de Cana Rock Star | Archivo de referencia localizado | Activo comercial clasificable para Star | `public` solo tras aprobación |
| Mapa de conectividad | Archivo de referencia localizado | Activo visual clasificable por proyecto | `public` solo tras validación de pertinencia |
| Video corporativo Cana Rock | Archivo de referencia localizado | Video de marca; no usar como video de proyecto sin aprobación | `authorized` hasta decidir uso |
| Formularios KYC, declaraciones, reglamento y datos bancarios | Documentos legales/sensibles | Flujo privado con control de acceso; nunca en landing | `private` |

## Reglas de publicación

1. Cada recurso recibe proyecto, categoría, título comercial, idioma, versión, fecha, autor y checksum.
2. Solo un documento en estado `approved` o `published` puede generar una descarga.
3. Un archivo `public` debe contener solo contenido de marketing aprobado y se entrega desde un bucket público o una ruta pública dedicada; no se convierte `private-documents` en público.
4. Brochure, ficha técnica, lista de precios, disponibilidad y propuesta quedan inicialmente en `authorized`.
5. Formularios KYC, reglamentos, documentación bancaria, contratos y datos de clientes quedan en `private`.
6. La disponibilidad se consume desde unidades y precios canónicos; los PDF serán snapshots generados con fecha, fuente y precio de corte.

## Orden de ejecución del Ciclo 006

1. Crear en CRM el registro editorial por recurso utilizando las tablas y versiones existentes; no crear otra tabla hasta que un campo realmente haga falta.
2. Exportar del origen una muestra aprobada de brochure y ficha técnica de Star y Cosmos Stelar, en español, e inventariar sus hashes y metadatos.
3. Subir las versiones a `private-documents` como `authorized`; probar RLS y el enlace firmado con un broker autorizado y otro sin acceso.
4. Clasificar master plan, mapa, renders y video como recursos visuales, validando el derecho de publicación y proyecto correspondiente.
5. Añadir a la landing una sección de recursos solo para elementos `public` publicados; las descargas de brokers se mantienen dentro del portal autenticado.
6. Conectar propuestas y dossiers a la versión exacta aprobada, dejando el snapshot inmutable.

## Criterios de salida

- Dos proyectos piloto con al menos brochure y ficha técnica versionados.
- Ningún documento legal, bancario, de KYC o de cliente accesible en la landing pública.
- Pruebas positivas y negativas de RLS para descarga autorizada.
- Recurso mostrado en landing únicamente cuando tenga aprobación, visibilidad pública y relación correcta con el proyecto.
- PDF de disponibilidad generado desde el inventario actual, con fecha de corte visible.
