---
name: AutómataLab
description: "Mesa de trabajo para resolver, verificar y conservar la práctica."
colors:
  papel: "#f6f7f9"
  papel-alto: "#ffffff"
  tinta: "#141b26"
  tinta-suave: "#5b6675"
  tinta-tenue: "#626e7d"
  linea: "#dfe3e9"
  linea-fuerte: "#c3cad4"
  grilla: "#dde2e9"
  azul: "#1b4fa0"
  azul-fuerte: "#17458c"
  azul-suave: "#e8effa"
  sobre-azul: "#ffffff"
  ambar: "#b8690c"
  ambar-suave: "#fdf1dd"
  acepta: "#15704a"
  acepta-suave: "#e4f4ec"
  rechaza: "#b3261e"
  rechaza-suave: "#fdeceb"
  oscuro-papel: "#10141a"
  oscuro-papel-alto: "#181e26"
  oscuro-tinta: "#e7ecf3"
  oscuro-tinta-suave: "#a6b1c2"
  oscuro-tinta-tenue: "#a0adbe"
  oscuro-linea: "#29313c"
  oscuro-linea-fuerte: "#3d4854"
  oscuro-grilla: "#232b35"
  oscuro-azul: "#6ea8fa"
  oscuro-azul-fuerte: "#8dbcff"
  oscuro-azul-suave: "#16263c"
  oscuro-sobre-azul: "#0b1017"
  oscuro-ambar: "#e0a458"
  oscuro-ambar-suave: "#2f2415"
  oscuro-acepta: "#4cc38a"
  oscuro-acepta-suave: "#13291f"
  oscuro-rechaza: "#f2726a"
  oscuro-rechaza-suave: "#321a19"
  papel-papel: "#f1ebdd"
  papel-papel-alto: "#fbf7ed"
  papel-tinta: "#2d2921"
  papel-tinta-suave: "#6a6254"
  papel-tinta-tenue: "#716757"
  papel-linea: "#e2dac8"
  papel-linea-fuerte: "#cabfa7"
  papel-grilla: "#e4dcc9"
  papel-azul: "#2f5d8f"
  papel-azul-fuerte: "#24486f"
  papel-azul-suave: "#e6edf5"
  papel-sobre-azul: "#fbf7ed"
  papel-ambar: "#9a5b12"
  papel-ambar-suave: "#f6e6cd"
  papel-acepta: "#3f6b3a"
  papel-acepta-suave: "#e6efdf"
  papel-rechaza: "#a03a2a"
  papel-rechaza-suave: "#f7e3dd"
typography:
  headline:
    fontFamily: "'Space Grotesk Variable', system-ui, sans-serif"
    fontSize: "clamp(25px, 2.4vw, 34px)"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.035em"
  title:
    fontFamily: "'Space Grotesk Variable', system-ui, sans-serif"
    fontSize: "clamp(19px, 1.75vw, 24px)"
    fontWeight: 550
    lineHeight: 1.45
    letterSpacing: "-0.02em"
  body:
    fontFamily: "'Space Grotesk Variable', system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "'Space Grotesk Variable', system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 550
  mono:
    fontFamily: "'JetBrains Mono Variable', ui-monospace, 'Cascadia Code', monospace"
    fontSize: "12.5px"
rounded:
  chico: "3px"
  campo: "6px"
  panel: "8px"
  chapa: "20px"
spacing:
  junta: "5px"
  fila: "8px"
  campo: "16px"
  seccion: "24px"
  margen: "32px"
  hoja: "40px"
components:
  button-primary:
    backgroundColor: "{colors.azul}"
    textColor: "{colors.sobre-azul}"
    rounded: "{rounded.panel}"
    padding: "8px 14px"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.azul-fuerte}"
  button-secondary:
    backgroundColor: "{colors.papel-alto}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.panel}"
    padding: "8px 14px"
    typography: "{typography.label}"
  button-text:
    backgroundColor: "transparent"
    textColor: "{colors.azul}"
    rounded: "{rounded.panel}"
    padding: "6px 11px"
  input:
    backgroundColor: "{colors.papel-alto}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.campo}"
    padding: "9px 11px"
  nav-active:
    backgroundColor: "{colors.azul-suave}"
    textColor: "{colors.azul}"
    rounded: "{rounded.panel}"
    padding: "9px 14px"
  topic-active:
    backgroundColor: "{colors.azul}"
    textColor: "{colors.sobre-azul}"
    rounded: "{rounded.campo}"
    padding: "9px 14px"
  diagram-panel:
    backgroundColor: "{colors.papel-alto}"
    rounded: "{rounded.panel}"
    padding: "10px"
  chip-verified:
    backgroundColor: "{colors.acepta-suave}"
    textColor: "{colors.acepta}"
    rounded: "{rounded.chapa}"
    padding: "2px 7px"
---
# Design System: AutómataLab

## Overview

**Creative North Star: "Mesa de trabajo sobre papel"**

AutómataLab conserva su mesa de trabajo de tinta azul y papel: una interfaz de operación, con controles precisos y una hoja de resolución como centro de atención. Space Grotesk sostiene la lectura y JetBrains Mono distingue expresiones, estados y cantidades. La densidad permite trabajar con enunciado, respuesta y diagrama sin convertir cada dato en una tarjeta.

Práctica, Parciales y Mi progreso extienden el mismo sistema del editor. Los tonos Claro, Oscuro y Papel cambian los colores sin alterar la geometría; Sistema sigue la preferencia del dispositivo. El carácter es sobrio, legible y orientado a continuar una tarea.

**Key Characteristics:**

- Tinta azul para acciones y selección; color semántico acompañado por texto.
- Planos de papel separados por líneas finas y cambios de tono.
- Jerarquía de enunciado, resolución y comprobación; ayuda y solución bajo demanda.
- Paneles de trabajo en escritorio y hoja de una columna en teléfono.

Captura del sistema implementado en `src/styles.css` y su extensión efectiva `src/estudio.css`, cargada después. Los valores del frontmatter corresponden a Claro; los prefijos `oscuro-` y `papel-` registran las variantes reales. No constituyen paletas nuevas ni reemplazan las variables CSS como fuente de implementación.

## Colors

La paleta distingue tinta, papel, acción y resultado, con las mismas relaciones en los tres tonos.

### Primary

- **Azul de trabajo**: acciones principales, navegación seleccionada, foco y selección de contenido. Su variante fuerte responde al hover y su fondo suave marca contexto sin competir con el enunciado.
- **Sobre azul**: texto del botón principal y del punto de práctica activo; cambia con el tema.

### Secondary

- **Ámbar de recorrido**: control y arcos del reconocimiento; también advertencias y la chapa AFN. El fondo suave sostiene el mensaje sin cubrir la hoja.

### Tertiary

- **Aceptación**: resultados verificados y estados AFD, con fondo suave.
- **Rechazo**: respuestas que requieren revisión y errores, con fondo suave. Las etiquetas escritas explican el estado.

### Neutral

- **Papel / Papel alto**: fondo de aplicación y superficie de hoja, campo o lienzo.
- **Tinta / Tinta suave / Tinta tenue**: contenido principal, apoyo y metadatos. La tinta tenue documentada ya incorpora el ajuste de contraste de la extensión de estudio.
- **Línea / Línea fuerte / Grilla**: divisiones, contornos de controles y cuadrícula del editor.

**The Same Geometry Rule.** Los temas cambian los colores, no las medidas, las familias tipográficas ni la posición de los controles.

**The Working Ink Rule.** El azul identifica acciones y selección; aceptación, rechazo y advertencia conservan sus roles semánticos.

`data-tema='claro'`, `oscuro` y `papel` fijan el tono. Sistema elimina ese atributo y utiliza `prefers-color-scheme`; las preferencias se recuerdan localmente. Los controles nativos reciben `color-scheme` claro u oscuro.

## Typography

**Display / Body Font:** Space Grotesk Variable, system-ui, sans-serif.

**Label / Mono Font:** JetBrains Mono Variable, ui-monospace, Cascadia Code, monospace para expresiones, código, tablas de transiciones y contadores. Los rótulos de formulario y la tabla de progreso permanecen en Space Grotesk.

El contraste tipográfico distingue lectura de notación. No hay una tipografía de campaña independiente.

### Hierarchy

- **Headline**: título de la superficie de estudio; en móvil se fija en (26px) y hasta (20ch).
- **Title**: enunciado principal; ancho máximo (65ch), saltos preservados y corte de palabras largas. En móvil se fija en (20px).
- **Body**: lectura general; introducciones hasta (68ch), consejos hasta (70ch). Las áreas de texto usan interlínea (1.65).
- **Label**: rótulos y botones, con peso intermedio. Los títulos de sección de la extensión de estudio usan caja normal, sin espaciado añadido.
- **Mono**: notación técnica y conteos; los resúmenes usan números tabulares. Los campos de respuesta en móvil suben a (16px).

## Layout

Modo de operación: elegir una tarea, resolverla y comprobar la respuesta. En escritorio la práctica combina un banco lateral de (350px) con una hoja flexible `minmax(0, 1fr)`; la resolución se centra con ancho máximo (900px). El encabezado usa márgenes laterales de (32px), y la hoja (40px). Las áreas de trabajo conservan desplazamiento propio cuando la altura está limitada por la ventana.

A (1150px) el banco baja a (310px) y la hoja usa relleno de (26px). A (1000px) el banco de práctica pasa a (290px); el documento recupera altura natural y la hoja deja de forzar su propio desplazamiento. El editor también pasa a flujo vertical a ese ancho. A (860px), la barra superior se organiza en dos filas: marca y controles, luego navegación horizontal.

A (700px), práctica pasa a una columna y márgenes de (20px). El selector de ejercicios se pliega tras un botón de (52px) con `aria-expanded` y `aria-controls`; al abrirlo el banco tiene un máximo de (360px) y su propio desplazamiento. Elegir un ejercicio vuelve a plegarlo. Los puntos de práctica permanecen en una fila horizontal desplazable.

Parciales usa resumen lateral de (310px) y hoja flexible, con resumen de (260px) a (1000px). En móvil, título e índice de tres ejercicios preceden la hoja y los controles de entrega y respaldo quedan después. El índice se convierte en tres botones contiguos. El progreso presenta respaldo y tabla en flujo vertical. La impresión usa una hoja específica, márgenes de (18mm) y un ejercicio por página.

El ritmo reutiliza espacios cortos entre controles y separaciones mayores entre tareas. Las filas de acciones se envuelven y los campos flexibles pueden encogerse sin desbordar. La solución y los consejos acompañan la tarea bajo demanda; no forman secciones de teoría.

## Elevation & Depth

Las superficies principales son planas, delimitadas por bordes y dos tonos de papel. El editor conserva sombras funcionales para herramientas flotantes, entrada de símbolos y menú contextual. La sombra usa el canal RGB `--sombra` adaptado al tema; sus valores completos están en el sidecar.

**The Flat Worksheet Rule.** La hoja y los paneles permanecen planos; la elevación se reserva para herramientas y elementos que flotan sobre el lienzo.

Los nodos transicionan relleno y trazo en (120ms ease). Con `prefers-reduced-motion: reduce`, transiciones y animaciones se reducen a (0.01ms). La extensión de estudio no introduce movimiento decorativo.

## Shapes

Los controles y paneles comparten esquinas discretamente redondeadas. La extensión efectiva fija el radio general en el token `panel`; campos y filas de ejercicios usan `campo`, y herramientas pequeñas usan `chico`. Las chapas son cápsulas. Bordes sólidos de (1px) separan paneles y campos; el lienzo conserva círculos de estado y arcos dirigidos como geometría funcional.

## Components

### Buttons

Controles compactos y explícitos. El primario usa azul de trabajo y sobre azul; el secundario usa papel alto y contorno de línea fuerte. La variante de texto conserva el azul sin fondo. La altura mínima general es (40px), la pequeña (36px), y ambas llegan a (44px) en móvil. El hover del primario usa azul fuerte; el secundario cambia fondo y contorno. Deshabilitado conserva opacidad (0.42) y cursor de indisponibilidad.

### Inputs / Fields

Campos de papel alto, contorno fino y altura mínima (42px). Cada campo de resolución tiene rótulo asociado; expresiones y LISP usan mono. El foco añade contorno azul de (2px) con desplazamiento interior de (-1px). Los campos bloqueados de una entrega conservan el texto legible. Los checkbox son de (18px) y usan el azul de acento.

### Navigation

La navegación principal usa botones dentro de un `nav` etiquetado y `aria-current='page'`. Su selección es azul sobre fondo azul suave. Los puntos temáticos de práctica son también navegación etiquetada con botones y `aria-current`, visualmente similares a pestañas; no se les atribuye un patrón ARIA de tablist que el código no implementa. El punto activo usa azul sólido. El índice de examen usa `aria-current='step'` y contorno azul sobre fondo suave.

### Chips / Status

Las chapas usan mono y borde semántico; la verificación también muestra texto. Los resultados y los avisos de copia se anuncian con `role='status'`; los errores de guardado usan `role='alert'`. El estado distingue verificación automática, revisión externa y entrega guardada.

### Cards / Containers

Los diagramas se alojan en un contenedor de papel alto con borde de línea y relleno de (10px). La respuesta de cada etapa se separa con líneas, sin añadir una tarjeta elevada. La vista previa de una copia usa el papel base, relleno de (14px) y radio general.

### Worksheet / Diagram attachment

La hoja presenta enunciado, clasificación, campos y acciones. Las soluciones de referencia empiezan ocultas y el botón expone su estado mediante `aria-expanded`; consejos y tablas complementarias usan `details` / `summary` nativos. En examen se ocultan consejos, solución y verificación por ejercicio.

Cada etapa muestra si tiene un diagrama adjunto y su cantidad de estados. Dibujar abre el editor con contexto de retorno; adjuntar muestra una copia previa identificada por ejercicio y etapa. Solo **Guardar esta copia** fija esa versión en la respuesta. Las tablas de transición complementan los diagramas con una representación textual accesible.

### Keyboard / Touch

El enlace **Saltar al contenido** aparece al recibir foco y apunta al `main`. Los controles comparten foco visible azul de (2px), separado (2px) salvo el campo. Los iconos de deshacer y rehacer mantienen nombres accesibles en pantallas angostas. Las celdas editables de transiciones aceptan Enter y Espacio y poseen etiquetas de estado, símbolo y destino. Los botones conservan nombres concretos; `summary`, selección y checkbox utilizan controles nativos.

## Do's and Don'ts

### Do:

- Do usar las variables compartidas de color y las dos familias tipográficas existentes.
- Do conservar el foco visible, los nombres accesibles y los estados escritos junto al color.
- Do mantener la respuesta al centro y las ayudas plegadas hasta que la persona las solicite.
- Do mostrar qué ejercicio y etapa reciben una copia del diagrama antes de guardarla.
- Do probar Claro, Oscuro, Papel y Sistema, además del flujo de una columna.

### Don't:

- Don't fijar blanco o negro en controles que deben adaptarse al tema.
- Don't presentar una solución de referencia como respuesta ya resuelta por el estudiante.
- Don't representar un diagrama del editor como adjunto hasta guardar explícitamente su copia.
- Don't usar solo un color para comunicar verificación, error o selección.
- Don't convertir los paneles funcionales en una colección de tarjetas con sombras decorativas.
