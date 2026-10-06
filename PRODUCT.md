# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Brokers y agentes inmobiliarios que consultan inventario, administran contactos y preparan propuestas para inversionistas desde escritorio o móvil.
- Administradores de agencias y master brokers que mantienen proyectos, disponibilidad, documentos y marcas por desarrolladora.
- Clientes finales que reciben un enlace privado o PDF con una propuesta ya congelada.

## Product Purpose

OB Brokers centraliza proyectos, inventario, CRM y materiales comerciales para que un broker pueda convertir una unidad disponible en una propuesta privada, clara y compartible. El éxito significa que el broker selecciona un lead registrado y una o varias unidades compatibles, genera la propuesta sin trabajo de diseño manual y obtiene un enlace seguro y un PDF consistente.

## Positioning

La propuesta no se arma como un documento genérico: se genera con el inventario vigente, la identidad oficial de la desarrolladora y una copia inmutable de los datos comerciales seleccionados.

## Operating Context

- El broker parte del portal, selecciona proyecto y unidades disponibles, y luego elige un contacto existente del CRM.
- Una propuesta multiunidad solo puede mezclar propiedades de la misma desarrolladora.
- La propuesta se guarda como una versión inmutable, crea un enlace privado con vencimiento y registra actividad comercial.
- El dossier y la propuesta son productos distintos: el dossier admite edición editorial avanzada; la propuesta debe ser rápida, guiada y predecible.
- Los agentes y agencias consumen dossiers oficiales terminados; la edición editorial compleja queda reservada a administración, operaciones y marketing del master broker.
- Ofertas, promociones, descuentos, imágenes y vigencias se preparan centralmente. El agente solo decide si aplica un beneficio autorizado que el sistema le muestra.
- El flujo debe funcionar desde teléfonos sin perder la composición de la propuesta ni superponer textos e imágenes.

## Capabilities and Constraints

- Next.js App Router, React y Supabase.
- El servidor vuelve a validar autenticación, permisos, pertenencia del contacto a la organización y compatibilidad de desarrolladora.
- Para propuestas, el lead registrado en CRM es obligatorio.
- El resultado puede compartirse mediante enlace privado y exportarse a PDF en formato Carta vertical.
- Colores, logo y datos de contacto provienen de la organización o del perfil de marca del proyecto.
- No se deben inventar precios, disponibilidad, amenidades, fechas ni condiciones comerciales.
- Un vendedor nunca puede escribir un descuento libre. El servidor confirma la vigencia, el proyecto autorizado y el cálculo antes de guardar la propuesta.

## Brand Commitments

- Marca principal: OB Brokers Team.
- Las propuestas heredan la identidad oficial de cada desarrolladora.
- La referencia vinculante para la estructura de propuesta es el formato sencillo de Cana Rock compartido por el usuario.
- Las imágenes a pantalla completa deben verse planas y limpias, sin efecto de esquina doblada ni ornamentos que parezcan pliegues.

## Evidence on Hand

- Implementación actual del portal y del editor en `components/portal/PresentationEditor.tsx`.
- Render actual de propuestas en `components/presentations/ProposalMagazinePage.tsx`.
- Flujo de persistencia y seguridad en `app/portal/proposals/actions.ts`.
- Referencia visual y funcional en `C:/Users/Rony/Documents/GitHub/cana-rock.osvaldobello`.
- Capturas móviles suministradas por el usuario con solapamientos de texto, imágenes y controles.

## Product Principles

1. Crear una propuesta debe sentirse como completar una tarea comercial, no diseñar un documento.
2. El CRM y el inventario son la fuente de verdad; la propuesta congela una copia verificable.
3. Una misma composición debe conservarse en web, móvil, enlace compartido y PDF.
4. La identidad de la desarrolladora debe aparecer sin contaminarla con controles editoriales.
5. Menos decisiones manuales producen propuestas más rápidas y consistentes.
6. El trabajo difícil se hace una vez desde administración/marketing; el agente recibe acciones claras de uno o dos clics.
