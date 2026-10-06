---
name: OB Brokers Platform
description: Plataforma inmobiliaria editorial, clara y confiable para operaciones comerciales de brokers.
colors:
  broker-navy: "#0c094e"
  broker-indigo: "#24207a"
  pale-indigo: "#e8e8f7"
  portal-canvas: "#f5f8fc"
  proposal-canvas: "#f4f3ef"
  warm-paper: "#fefdf9"
  editorial-gold: "#8b7657"
  ink: "#17233a"
  line: "#e4ebf5"
  white: "#ffffff"
typography:
  display:
    fontFamily: "Fraunces, Georgia, serif"
    fontWeight: 600
    lineHeight: 0.96
    letterSpacing: "-0.055em"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "10px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.16em"
rounded:
  compact: "8px"
  control: "12px"
  card: "16px"
  feature: "24px"
  pill: "999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "24px"
  section: "32px"
components:
  button-primary:
    backgroundColor: "{colors.broker-navy}"
    textColor: "{colors.white}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
    height: "40px"
  button-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
    height: "40px"
  input:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
    height: "44px"
  portal-card:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "20px"
  proposal-sheet:
    backgroundColor: "{colors.warm-paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.feature}"
    width: "816px"
    height: "1056px"
---

# Design System: OB Brokers Platform

## Overview

**Creative North Star: "Editorial inmobiliaria operativa"**

La plataforma combina la precisión de una herramienta comercial con una presentación editorial de alta gama. Las superficies operativas son sobrias, compactas y fáciles de escanear; los dossiers y propuestas conceden más protagonismo a la imagen, la tipografía y la identidad de cada desarrolladora.

La marca de OB Brokers enmarca la experiencia, pero no compite con la marca del proyecto. Los controles deben sentirse seguros y directos. Las composiciones comerciales mantienen una jerarquía fija y predecible, especialmente al escalar a móvil o exportarse a PDF.

**Key Characteristics:**

- Navegación y controles en azul marino con superficies blancas.
- Etiquetas pequeñas en mayúsculas para contexto, no para contenido principal.
- Propuestas en papel cálido con composición Carta fija.
- Marca, colores e imágenes del proyecto preservados en cada documento.
- Movimiento breve y funcional, limitado a transiciones de estado.

## Colors

La paleta base es fría y profesional; el papel cálido y el oro editorial aparecen solo donde ayudan a separar el documento comercial del portal operativo.

### Primary

- **Broker Navy:** acción principal, navegación y texto de énfasis.
- **Broker Indigo:** estados secundarios y variaciones de la marca principal.

### Secondary

- **Pale Indigo:** fondos suaves y selección de controles.
- **Editorial Gold:** etiquetas y acentos discretos dentro del creador y de la propuesta.

### Neutral

- **Portal Canvas:** fondo general del producto.
- **Proposal Canvas:** superficie exterior del creador de propuestas.
- **Warm Paper:** página Carta y exportación.
- **Ink:** texto principal.
- **Line:** divisores y bordes funcionales.
- **White:** tarjetas y controles.

**The Project Accent Rule.** En documentos comerciales, el color de la desarrolladora sustituye al acento editorial sin alterar la legibilidad del texto.

## Typography

Inter sostiene la interfaz, los datos y los controles. Fraunces se reserva para títulos editoriales dentro de páginas públicas, dossiers y propuestas; no se usa para formularios ni navegación.

**The Two-Voice Rule.** La voz sans-serif explica y opera; la serif presenta y persuade.

## Layout

El portal usa contenedores amplios, tarjetas compactas y separación consistente. El creador de propuestas organiza configuración a la izquierda y vista previa a la derecha en escritorio. En móvil, la configuración precede a la página, pero el interior de la propuesta no se redistribuye: la hoja Carta de 816 × 1056 px se escala proporcionalmente al ancho disponible.

**The Fixed Sheet Rule.** Una propuesta debe conservar la misma composición en vista previa, móvil, enlace público y PDF.

**The Guided Flow Rule.** Crear una propuesta es una secuencia de selección, revisión y guardado; la edición libre pertenece exclusivamente al dossier.

## Elevation & Depth

La profundidad es baja y funcional. Bordes suaves distinguen superficies; las sombras pequeñas elevan tarjetas y controles interactivos. Las sombras más amplias se reservan para modales y elementos hero.

**The Quiet Elevation Rule.** Si un borde ya define la superficie, la sombra solo puede aportar separación ambiental, nunca dramatismo.

## Shapes

Los controles usan esquinas de 12 px, las tarjetas operativas 16 px y los contenedores destacados hasta 24 px. Las pastillas completas se limitan a estados, etiquetas y navegación puntual.

Las imágenes editoriales pueden recortarse con radios suaves cuando viven dentro de una tarjeta. Una imagen configurada a pantalla completa debe cubrir la página de borde a borde sin esquinas dobladas, diamantes ni simulaciones de papel.

**The Honest Image Rule.** La forma de la imagen depende de su función; una imagen a sangre no recibe adornos que alteren su encuadre.

## Components

- **Primary Button:** acción principal única por sección; fondo azul marino, texto blanco y estado deshabilitado claramente atenuado.
- **Secondary Button:** superficie blanca con borde tenue; se usa para descargar, cambiar o volver.
- **Input:** control de 44 px, borde neutro y foco visible en azul marino.
- **Portal Card:** tarjeta blanca de 16 px con borde suave, sombra baja y 20 px de espacio interior.
- **Proposal Sheet:** documento Carta de 816 × 1056 px sobre papel cálido, con encabezado, contenido y pie que nunca se solapan.
- **Recipient Summary:** tras seleccionar un contacto del CRM, el buscador se contrae a una fila compacta con estado confirmado y acción “Cambiar”.

## Do's and Don'ts

### Do

- **Do** mantener una sola acción principal visible por bloque.
- **Do** usar datos oficiales del CRM, inventario y perfil de marca.
- **Do** probar toda propuesta a 816 × 1056 px y escalada entre 390 y 430 px.
- **Do** reservar la carga de páginas ocultas para el momento de exportar el PDF.

### Don't

- **Don't** usar el editor de bloques del dossier para crear una propuesta.
- **Don't** permitir propuestas vinculadas a nombres libres fuera del CRM.
- **Don't** reacomodar internamente una página Carta según el ancho del teléfono.
- **Don't** colocar adornos de esquina sobre imágenes a pantalla completa.
- **Don't** mostrar simultáneamente todas las páginas pesadas cuando solo se revisa una.
