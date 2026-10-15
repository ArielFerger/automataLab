# AutómataLab

Cuaderno de práctica de **Paradigmas y Lenguajes**. Sin cuentas, comunidad, Supabase ni servidor de datos. React + TypeScript + Vite; tipografías incluidas en el build.

## Usar y desarrollar

Requiere Node.js 22.12 o superior (probado con Node 24).

```sh
npm install
npm run dev
```

Abrir http://localhost:5173. Para producción:

```sh
npm run build
npm run preview
```

`dist/` se sirve como sitio estático. No requiere variables de entorno ni claves de IA. `vercel.json` conserva la configuración de despliegue de Vercel: build `npm run build`, salida `dist`.

## Qué se puede resolver

167 actividades basadas en el material de la cursada:

| Punto | Actividades | Trabajo |
| --- | ---: | --- |
| A | 80 | Lenguaje → autómata y expresión regular; clasificación de casos no regulares |
| B | 10 | Elegir diez autómatas del punto A y transformarlos en ER |
| C | 9 | ER → AFN-ε con tabla de transiciones |
| D | 8 | ER → AFD mínimo |
| E | 6 | ER → AFN-ε → AFD → AFD mínimo |
| LISP | 54 | Programación funcional, organizada por nivel y tipo |

Buscador, filtros por tema y estado, navegación entre ejercicios y consejos específicos de resolución. Las soluciones están ocultas hasta que se solicitan.

El editor permite construir con el mouse o agregar y seleccionar estados con controles de teclado. La tabla de transiciones se edita con Enter y verifica los nombres de destino. Cada etapa se adjunta a la respuesta como una copia independiente: trabajar en otro diagrama no modifica los anteriores.

## Corrección y revisión con IA

El motor compara lenguajes mediante determinización y recorrido del autómata producto. Si hay diferencias, devuelve la cadena más corta que distingue las respuestas. Verifica además que un AFD pedido sea completo y determinístico, que el mínimo tenga la cantidad correcta de estados y que las etapas AFN-ε incluyan las conexiones correspondientes. En A y E se comprueban todas las partes requeridas; una ER sola no completa un ejercicio que también pide diagramas.

La clasificación de un lenguaje no regular se verifica automáticamente; la demostración escrita y los procedimientos necesitan revisión adicional. LISP se guarda sin ejecutar ni afirmar una corrección automática. Puede marcarse como revisado externamente, separado de los resultados verificados.

**Copiar para IA** prepara enunciado, respuesta, desarrollo, inicial, finales, alfabeto, tabla y datos completos de cada diagrama. **Copiar y abrir ChatGPT** abre el sitio y copia el texto: el usuario lo pega y lo envía. No se realiza envío automático ni se usa una API de pago. Si el navegador bloquea el portapapeles, aparece el texto seleccionable. El editor también ofrece esta función; el enunciado se escribe en Notas.

## Parciales y entregas

Los cuatro exámenes originales 2023/2025 tienen diagramas transcritos y cotejados con los originales. Los simulacros conservan el formato **20/60/20**, con variantes reproducibles por número. El ítem que exige AF + ER siempre recibe un lenguaje regular.

Nombre, borradores y reloj se guardan por examen. El reloj usa tiempo real y sigue al salir de la pantalla, salvo que se pause. **Entregar parcial** guarda una copia cerrada con fecha y una verificación automática orientativa por resultado y formato. No equivale a una calificación docente del procedimiento. Es posible reabrir el borrador sin perder el historial de entregas.

La entrega se descarga como texto completo o se imprime/guarda como PDF desde el navegador, con los diagramas y tablas. Se entrega al docente por el medio que indique la cursada; la app no envía trabajos a terceros.

## Guardado y respaldo

Borradores, copias de diagramas, entregas y editor se guardan en `localStorage` en este navegador y dispositivo. La app avisa si el almacenamiento falla. Limpiar los datos del navegador elimina el progreso local.

En **Mi progreso** se puede descargar un respaldo JSON e importarlo en otro dispositivo. La importación muestra qué reemplaza y se aplica explícitamente: mezcla los ejercicios y exámenes del respaldo con los actuales, y reemplaza los coincidentes y el editor. Los guardados antiguos de la práctica recuperan sus expresiones como borradores; se vuelven a verificar con los requisitos completos.

## Notación

`*` tiene prioridad sobre concatenación implícita y unión `|`. `ε`, `λ` y `&` son cadena vacía; `∅` y `Ø` son lenguaje vacío. `e` es un símbolo literal. `+` significa unión según la notación de la cursada y produce una advertencia para evitar confundirlo con clausura positiva.

## Verificación

```sh
npm test
npm run test:ui
npm run build
npm audit
```

Las pruebas unitarias verifican algoritmos, referencias del banco, corrección de partes, variantes de exámenes, copias de entregas, reloj, exportación a IA y respaldo. Las pruebas de navegador cubren persistencia, regreso desde el editor, entregas, teclado, ausencia de soluciones anticipadas, desbordes y accesibilidad WCAG A/AA en los temas claro, oscuro y papel.

Las pruebas de navegador usan Edge instalado. Para otro navegador Chromium instalado por Playwright, usar `PLAYWRIGHT_CHANNEL=chromium`; previamente ejecutar `npx playwright install chromium`. Las capturas de revisión se guardan en `.impeccable/review/` y no se publican.

`npm run generar` regenera referencias desde los predicados; modifica archivos fuente y se ejecuta solo cuando cambia el banco.

El override de Rollup a WebAssembly conserva la compatibilidad con las restricciones de binarios de este Windows.

## Estructura

- `src/core/`: algoritmos, corrección, exámenes, exportación para IA y respaldo.
- `src/data/`: enunciados, referencias y catálogo de actividades.
- `src/store/`: persistencia local, editor y temas.
- `src/ui/`: editor, práctica, parciales y progreso.
- `test/`: pruebas del motor y flujos; `test/e2e/`: navegador y accesibilidad.

Los archivos originales de la cursada y su ZIP permanecen fuera de Git.
