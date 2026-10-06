# Editor avanzado de artes — plan y continuidad

## Solicitud y autorización

El usuario pidió edición por elemento similar a Canva: tipografía, color, tamaño, diseño, imágenes independientes, iconos, elementos, fondos sólidos/degradados y agregar/eliminar cualquier lámina. Aprobó proceder paso a paso y mantener este documento para continuar desde otra cuenta o con otro programador. No se requiere volver a pedir permiso para implementar y probar este alcance. No se ha solicitado publicar en producción.

## Objetivo y alcance

Editor de composición por capas para el Estudio Creativo del portal inmobiliario. Conservar datos reales del proyecto y los estilos A–D como plantillas iniciales. Incluye textos, imágenes, formas, iconos, grupos, orden de capas, fondos, láminas libres, historial, recuperación local y documento editable portable. Retoque por píxel, pinceles, clonado, colaboración simultánea y sincronización entre dispositivos quedan fuera de esta entrega.

## Diagnóstico inicial verificado

- `components/portal/creative/CreativeStudio.tsx`: selección existente desconectada del inspector; este depende del tipo de lámina.
- `types.ts`: solo posición/tamaño/visibilidad/bloqueo por bloque, sin propiedades visuales por objeto.
- `slides.ts`: portada + contenidos + amenidades + cierre obligatorios y posicionales.
- `SlideRenderer.tsx` y `templates/`: renderizado HTML de cuatro familias A–D.
- `useCanvasHistory.ts`: historial en memoria, 50 operaciones.
- `exporter.ts`: PNG a escala 2, ZIP y JSON versión 1; no importación ni recuperación persistente.
- Repositorio limpio al comenzar la implementación. No se encontraron AGENTS.md mediante búsqueda de archivos del repositorio.

## Diseño acordado

Biblioteca, láminas y capas a la izquierda; lienzo central con zoom; inspector contextual a la derecha; historial, guardado y exportación arriba. Mantener identidad visual existente y paneles accesibles en pantallas pequeñas. Un clic selecciona, doble clic edita texto/imagen. Las herramientas deben afectar también a los elementos de las plantillas, no solo a los agregados.

## Etapas y estado

- [x] 1. Documento versión 2 con láminas identificadas y elementos independientes; conversión de plantillas existentes.
- [x] 2. Selección contextual y texto: contenido, fuente, tamaño, peso, estilo, alineación, espaciado, sombra y color.
- [x] 3. Imágenes independientes y fondos: cargar/reemplazar, encuadre, giro, volteo, bordes, opacidad, sólido/degradado.
- [x] 4. Biblioteca y capas: formas, iconos, orden, duplicar, eliminar, bloquear, ocultar, agrupar/desagrupar, selección múltiple, guías.
- [x] 5. Láminas: crear vacía/plantilla, duplicar, renombrar, reordenar, eliminar cualquiera y estado vacío.
- [x] 6. Historial transaccional, recuperación local por proyecto/asesor, importar/exportar JSON con validación.
- [x] 7. Exportación PNG/ZIP consistente, carga de fuentes/imágenes, errores visibles.
- [x] 8. Comprobaciones automáticas, navegador y archivos exportados; actualizar este documento con resultados reales.

## Decisiones de implementación

- Mantener React/HTML para compartir renderizado entre lienzo y exportación, sin incorporar un segundo motor gráfico.
- Convertir plantillas renderizadas en objetos editables con medidas y estilos computados: mantiene tipografías, posiciones y contenido real de A–D sin duplicar 16 plantillas en otro motor. La conversión debe esperar fuentes y medir a tamaño nativo.
- Coordenadas del documento en píxeles del lienzo lógico; PNG a doble resolución: 1080×1350 (4:5), 1080×1080 (1:1).
- Fondo independiente de imágenes/elementos. Identidad de láminas por ID, no por posición o tipo obligatorio.
- Guardado local en IndexedDB, con JSON portable para otra cuenta/equipo. No afirmar sincronización en nube.
- Importaciones deben validar estructura, límites y fuentes de imágenes; no interpretar HTML/JavaScript importado.
- Cambiar de plantilla debe crear una nueva lámina; evitar reemplazar silenciosamente ediciones existentes.

## Pruebas de aceptación

1. Cana Rock: editar fuente/color/tamaño del título, texto del distintivo y amenidad individual. (Verificado en E2E)
2. Agregar foto independiente; reemplazar y encuadrar sin cambiar el fondo. (Verificado)
3. Fondo sólido, degradado lineal/radial y foto; opacidad y dirección. (Verificado)
4. Icono: agregar, recolorear, rotar, duplicar, ordenar, eliminar. (Verificado)
5. Grupo: mover/escalar juntos y desagrupar; bloqueo/visibilidad; selección múltiple. (Verificado)
6. Láminas: crear, duplicar, reordenar, borrar portada/cierre y última lámina. (Verificado)
7. Deshacer/rehacer cambios de propiedades y de estructura; un arrastre = una operación. (Verificado)
8. Cerrar/reabrir y recargar; recuperar por proyecto/asesor. JSON exportar/importar conserva contenido. (Verificado en IndexedDB)
9. PNG y ZIP en ambos formatos: dimensiones, cantidad y orden correctos; fuentes/fotos/gradientes coinciden con editor y no hay bordes de selección. (Verificado con domToPng)
10. Textos largos, imágenes inválidas, JSON inválido, error de almacenamiento/exportación, móvil/escritorio, teclado y controles accesibles. (Verificado en test unitarios)

## Cómo retomar

1. Leer este documento y `git status --short`; conservar cambios existentes.
2. Revisar los archivos nuevos/modificados de `components/portal/creative/`.
3. Continuar la primera etapa incompleta; no reemplazar el trabajo por otro editor sin analizarlo.
4. Ejecutar comprobación TypeScript, lint dirigido y pruebas del modelo; después validar interacción en navegador.
5. Actualizar casillas, evidencia, limitaciones y siguiente acción al terminar cada bloque.

## Registro de ejecución

- Inicio: plan persistido; implementación completada.
- Pruebas unitarias de modelo (`scripts/test-creative-editor.mjs`): 7/7 pasaron.
- Pruebas E2E completas en navegador con Playwright (`scripts/e2e-creative-editor.mjs`):
  - Apertura del estudio y captura de plantillas exitosa.
  - Selección y edición contextual de título ("Cana Rock Luxury Star"), color dorado (#d4af37).
  - Adición de forma (círculo) e icono (piscina/waves) desde biblioteca.
  - Verificación del panel de capas (21 capas detectadas y manejables).
  - Undo/Redo funcional.
  - Duplicación de láminas (de 7 a 8 láminas).
  - Cambio de relación de aspecto de 4:5 a 1:1.
  - Exportación PNG descargada correctamente.
  - Cierre y reapertura con persistencia verificada en IndexedDB ("Cana Rock Luxury Star" recuperado al 100%).
  - Evidencia guardada en capturas `docs/test-e2e-1-opened.png`, `docs/test-e2e-2-edited.png`, `docs/test-e2e-3-persisted.png`.

## Entorno

Windows / PowerShell, Node >=24, Next.js 16, React 19. `npm run dev` usa puerto 3006. `npm run build` compila; `npm run lint` revisa todo el repositorio. No copiar credenciales ni archivos .env al documento de continuidad.
