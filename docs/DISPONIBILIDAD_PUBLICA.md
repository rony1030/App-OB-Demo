# Disponibilidad pública y PDF

## Uso

- En la ficha del proyecto, abrir «Disponibilidad para compartir».
- El enlace independiente es `/disponibilidad/{slug}`. Permite copiar el enlace, consultar los datos y descargar el PDF.
- La consulta muestra solo unidades disponibles inicialmente. Los filtros de estado, búsqueda y plazo se aplican también al PDF.
- Para Cipres, las entregas de 12 y 24 meses aparecen en tablas separadas, conservando los precios de cada modelo de la hoja importada.

## Datos y privacidad

La página y la descarga consultan el inventario publicado almacenado en la plataforma en cada petición. No importan Google Sheets al abrir el enlace: la actualización de la fuente sigue usando el proceso de sincronización existente. El botón «Actualizar consulta» vuelve a consultar la plataforma.

Solo se admiten proyectos publicados y unidades públicas. Se serializan los campos de inventario necesarios para la tabla; no se envían notas completas, documentos privados ni datos de clientes. Las columnas internas conocidas se excluyen. No se necesitan tablas ni migraciones adicionales.

## PDF

Carta horizontal (792 × 612 puntos), texto vectorial sobre papel blanco y reglas grises. Las cabeceras se repiten al continuar las tablas. Las hojas con muchas columnas se dividen en paneles legibles.

Cada página incluye la fecha de generación en hora de Santo Domingo, la actualización del inventario, el enlace de consulta, el número de página y el aviso para validar precios y disponibilidad con un ejecutivo de Osvaldo Bello. El PDF es una copia del momento de generación; el enlace consulta el inventario de la plataforma.

La interfaz, los controles y el aviso admiten español, inglés y francés. Los códigos, nombres de modelos y valores importados se conservan.

## Dossier del proyecto

La pestaña del proyecto resuelve la plantilla oficial publicada del catálogo, muestra sus páginas y abre su enlace activo. «Crear dossier para mí» envía el identificador de esa plantilla a la acción existente, que valida autor, estado, enlace y correspondencia con el proyecto.

## Revisión realizada

- Tipos y análisis estático de los archivos modificados.
- Página pública con datos reales: 29 unidades disponibles en Cipres; 16 de 12 meses y 13 de 24 meses.
- Filtro de 24 meses y enlace de descarga filtrada.
- Escritorio y móvil de 390 px: desplazamiento horizontal limitado a la tabla.
- PDF de Cipres: dos páginas carta horizontal, revisadas visualmente, con el pie en ambas.
- No se crearon propuestas, reservas ni copias de dossiers durante la revisión.

## Actualización de precios y revisión del catálogo — 29 de septiembre de 2026

Por solicitud del usuario, se verificaron las tipologías del dossier oficial de Cipres: Esmeralda US$116.250, Perla US$123.750 y Ámbar US$140.000. Se corrigieron los valores anteriores exactos (93.000, 99.000 y 112.000) en las columnas del inventario y su precio base. Se preservaron los estados, metrajes, plazos, campos vacíos y otros precios particulares. El precio inicial del proyecto es US$116.250.

La importación de Google Sheets para Cipres corrige exclusivamente esos tres valores obsoletos autorizados. Conserva cualquier otro valor recibido; no aplica un aumento porcentual general. El precio inicial importado se calcula entre unidades disponibles, excluyendo precios históricos de unidades vendidas.

Los ocho enlaces públicos y sus PDF se comprobaron en producción: respuesta 200, botón de descarga, formato carta horizontal y fecha, enlace y aviso en cada página.

| Proyecto | Enlace de disponibilidad y PDF | Dossier oficial |
| --- | --- | --- |
| Cipres Residences | Funciona | Publicado, 33 páginas |
| Uve Residences | Funciona | Publicado, 41 páginas |
| Cana Rock Cosmos Stelar | Funciona | Borrador |
| Cana Rock Galaxy | Funciona | Borrador |
| Cana Rock Star | Funciona | Borrador |
| Cana Rock Universe | Funciona | Borrador |
| Elements Residences & Resort | Funciona | Borrador |
| Palm View | Funciona | Borrador |

La ficha indica cuando el dossier está pendiente de publicación y permite abrir su editor a quienes tienen permiso. Esta revisión no publica los borradores.

La revisión visual detectó que una columna suplementaria (por ejemplo, parqueos en Cana Rock) sustituía la tabla principal y omitía precio y metraje. Se corrigió el generador: los proyectos muestran siempre los campos principales y conservan las columnas adicionales en paneles separados. Cipres conserva su matriz de terreno y precios de las tres villas, en ese orden.

La misma corrección se aplicó a las tarjetas y la lista de inventario en la ficha del proyecto: solo se activa la matriz de precios por modelo cuando hay columnas de tipologías reconocidas. La creación de una copia se deshabilita mientras no exista un dossier oficial publicado. Pasaron las nueve suites de pruebas, incluida la nueva regresión del reporte.
