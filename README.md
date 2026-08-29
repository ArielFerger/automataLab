# AutómataLab

App para practicar autómatas finitos y expresiones regulares de **Paradigmas y Lenguajes**.
Estilo JFLAP, pero en castellano, con los algoritmos tal como los da la cátedra y con los
ejercicios de la práctica cargados y corregidos automáticamente.

## Arrancarla

```bash
npm install
```

```bash
npm run dev
```

Se abre en http://localhost:5173. Para dejarla armada y usarla sin servidor:

```bash
npm run build
```

Eso deja todo en `dist/`; se abre con doble clic en `dist/index.html` y anda sin internet
(las tipografías van incluidas).

## Qué hay

**Documentos.** Cada autómata tiene título, notas y autor. Se guarda como `.automata.json` en la
compu y se vuelve a abrir con el botón Abrir, se exporta como PNG o SVG para mandarlo por chat, y se
comparte por link.

**Editor.** Dibujás AFD, AFN o AFN-ε: doble clic para crear estados, herramienta Transición para
las flechas, arrastre para acomodar, doble clic en un estado para renombrarlo. **Clic derecho** sobre
un estado, sobre una flecha o sobre el lienzo abre el menú con todo lo que se puede hacer ahí. La
tabla de transiciones está al lado y se edita también; señalar una celda resalta su flecha en el
diagrama y al revés.

**Recorrido de una cadena.** Abajo del lienzo está la cinta de entrada con el control que avanza
símbolo por símbolo, como lo describe la teoría. Se puede ir paso a paso con `Leer símbolo`, volver
atrás, o darle `Reproducir` y verlo solo. En cada paso se resalta el conjunto de estados activos y
las flechas que el control atraviesa, y abajo queda escrito el recorrido, `q0 −a→ q1 −b→ q0`, que es
lo que hay que copiar en la hoja para justificar por qué una cadena se acepta o se rechaza.

**Conversiones.** Los cuatro algoritmos, con el procedimiento paso a paso en el formato de las
transparencias:

| Algoritmo | Qué muestra |
|---|---|
| ER → AFN-ε | cada fragmento de Thompson, en el orden de evaluación |
| AFN-ε → AFD | la tabla de subconjuntos, con `mueve(T, a)` y su ε-clausura por separado |
| AFD → AFD mínimo | las particiones P₁, P₂, … hasta que se repiten |
| AF → ER | el autómata generalizado después de sacar cada estado |

**Práctica.** Los 80 lenguajes del punto A, las expresiones de los puntos C y D, y los 6 lenguajes
del punto E. Respondés con una expresión regular o con el autómata que tengas dibujado en el editor.

**Parciales.** Los cuatro exámenes tomados (2023, 2025 y sus recuperatorios) y un generador de
examen con la estructura real 20/60/20, con cronómetro.

**Comunidad.** Una galería donde la gente sube sus autómatas y los demás los miran y los abren. Con
sesión de administrador se puede además editar y borrar cualquier publicación.

**Tonos.** Claro, oscuro, papel, o el que tenga puesto el sistema. Se elige arriba a la derecha.

**En el teléfono.** La app funciona en pantalla chica: una sola columna, la página entera scrollea,
y los controles tienen el tamaño necesario para tocarlos con el dedo. En el lienzo, mantener apretado
un estado o una flecha abre el mismo menú que el clic derecho en la computadora, y hay botones de
zoom porque no hay rueda de mouse.

## Cómo corrige

No compara dibujos: compara lenguajes. Determiniza las dos respuestas, recorre el autómata producto
en anchura y, si difieren, devuelve **la cadena más corta** en la que difieren y de qué lado está el
problema. Así dos autómatas dibujados distinto pero correctos los dos se aceptan igual, y cuando algo
está mal el mensaje dice exactamente con qué cadena falla.

Varios ejercicios de la práctica **no son regulares** a propósito (34, 37, 38, 40, 41, 62, 67, 71,
72, 73, 76 y 79). Ahí la respuesta correcta es apretar "No es regular", y la app devuelve la
justificación por bombeo. Al revés también hay trampas: enunciados que parecen no regulares y sí lo
son porque el lenguaje es finito (13, 30, 35, 48) o porque colapsan a ∅ o a {ε} (33, 36, 47).

## Notación de las expresiones regulares

Las prioridades son las de la cátedra: `*` primero, después la concatenación (implícita) y por
último `|`, todos asociativos por izquierda. Además:

- Los espacios se ignoran, así se pueden tipear las expresiones tal como están impresas.
- Un operando vacío es ε, porque la práctica escribe cosas como `(( | 0 ) 1 *)*`.
- `ε`, `λ` y `&` son la cadena vacía; `∅` y `Ø`, el lenguaje vacío.
- `e` **no** es ε: es un símbolo del alfabeto. El ejercicio D5, `dd*(ddd* | e(mir)d*)`, deletrea
  palabras con la e.
- `+` se lee como unión, según la nota de la teoría. Como se puede confundir con la clausura
  positiva, la app avisa cuando lo usás.

## Compartir y publicar

**Por link.** El botón *Compartir link* arma una URL que lleva el autómata entero adentro, comprimido,
en el fragmento (`#`) — la parte que el navegador nunca manda a ningún servidor. Un autómata de dos
estados da un link de menos de 200 caracteres. Se pega en un chat y quien lo abre ve un cartel que le
ofrece abrirlo, sin pisarle lo que estaba haciendo. No necesita servidor, cuenta ni conexión.

**Por imagen.** *Exportar imagen* genera un PNG con el título arriba, el diagrama, la tabla de
transiciones y las notas, sobre fondo blanco y con tipografías del sistema para que se lea igual en
cualquier lado. También sale en SVG, que no pierde calidad al agrandarlo. Se elige si incluir la tabla
y las notas.

**En la galería.** La pestaña Comunidad muestra lo que subió la gente y deja publicar el autómata que
tengas abierto. Necesita un proyecto de Supabase; mientras no esté configurado, la pestaña explica cómo
encenderlo y ofrece el link, que sirve igual para pasarle algo a un compañero.

## Ponerla en internet

El deploy va a Vercel, que es gratis para esto. Desde la carpeta del proyecto:

```bash
npx vercel
```

La primera vez pide iniciar sesión y confirmar el proyecto; el resto lo detecta solo, porque
`vercel.json` ya declara el framework, el comando de build y la carpeta de salida. Para publicar a
producción:

```bash
npx vercel --prod
```

Si preferís conectarlo a un repositorio, subí el proyecto a GitHub e importalo desde
vercel.com/new: cada push queda desplegado solo.

### Conectar la galería

1. Creá un proyecto gratis en supabase.com.
2. En el editor SQL, pegá y ejecutá `supabase/schema.sql`. Crea las tablas y las políticas: cualquiera
   puede leer y publicar, y solo los administradores pueden editar o borrar.
3. En Settings → API copiá la *Project URL* y la clave *anon public*.
4. Para desarrollo, poné las dos en un `.env.local` (mirá `.env.example`). Para el sitio publicado,
   cargalas en Vercel como variables de entorno con los mismos nombres y volvé a desplegar.

La clave *anon* es pública por diseño: lo que protege los datos son las políticas de la base, no la
clave. Nunca pongas la clave `service_role` en el front.

### Ser administrador

El administrador puede corregir el título, el autor y las notas de cualquier publicación, reemplazar
el diagrama publicado por el que tenga abierto en el editor, y borrar lo que no corresponda.

1. En Supabase, Authentication → Users → **Add user**, con tu mail y una contraseña. Marcá el mail
   como confirmado, así no hace falta el correo de verificación.
2. Copiá el UUID que quedó en la lista y ejecutá en el editor SQL:

   ```sql
   insert into admins (id, nota) values ('EL-UUID-DE-TU-USUARIO', 'tu nombre')
   on conflict (id) do nothing;
   ```

3. En la app, pestaña Comunidad → **Entrar como admin**, con ese mail y contraseña. Aparece una chapa
   que dice `admin` y cada publicación suma los botones Editar y Borrar.

**Por qué esto es seguro y no un adorno.** El permiso no lo decide el navegador: lo deciden las
políticas de la base. Las de `update` y `delete` sobre `automatas` exigen que `auth.uid()` esté en la
tabla `admins`, así que aunque alguien editara el código de la página para mostrarse los botones, la
base rechazaría el cambio igual. La app solo consulta si sos admin para saber si vale la pena
mostrarlos.

Para sumar a otra persona como moderadora, repetí los pasos 1 y 2 con su usuario. Para sacarle el
permiso, borrá su fila de `admins`: la próxima vez que abra la app pierde los botones.

## Cómo está armado

- `src/core/` — el motor, funciones puras sin React: tipos del autómata, parser de ER, Thompson,
  subconjuntos, minimización, eliminación de estados, equivalencia y corrección.
- `src/data/` — los enunciados del banco y las expresiones de referencia.
- `src/ui/` — el lienzo, la tabla, la cinta, el menú contextual y las páginas.
- `src/store/` — el documento con su historial de deshacer, el progreso y el tono elegido.

### El banco de ejercicios

Cada lenguaje está escrito dos veces: como **predicado** (una función que dice si una cadena
pertenece) y como **expresión regular de referencia** (con la que se corrige). Las referencias no se
escriben a mano: se derivan de los predicados por clases de Myhill-Nerode y se pegan en
`src/data/referencias.ts`.

```bash
npm run generar
```

`npm test` después contrasta cada referencia contra su predicado, sobre todas las cadenas cortas más
miles de cadenas largas al azar y caminos aceptadores del propio autómata. Si una referencia estuviera
mal, la app corregiría mal; por eso la doble escritura.

Al generarlas apareció que el ejercicio 71 **no es regular**, aunque esté redactado como si lo fuera.

## Nota sobre el build en Windows

`package.json` fuerza rollup a su versión WebAssembly:

```json
"overrides": { "rollup": "npm:@rollup/wasm-node@^4.63.1" }
```

Es porque App Control de Windows bloquea el binario nativo de rollup (`Una directiva de Control de
aplicaciones bloqueó este archivo`) y sin esto no compila ni corren los tests. La versión WASM hace
exactamente lo mismo, apenas más lento. Si en otra máquina el binario nativo funciona, se puede sacar
el `overrides` y reinstalar.

## Tests

```bash
npm test
```

Cubren el núcleo (ε-clausura, simulación, limpieza), el parser y los cuatro algoritmos contra las 9
expresiones del punto C, las 8 del D y las 4 de los parciales, las vueltas completas ER → AFD → ER, la
verificación del banco entero, y las idas y vueltas de guardar, compartir por link y exportar.

## Lo que falta confirmar

Los autómatas del ítem 1 de los parciales 2025 están transcriptos de fotos y algunas etiquetas se leen
borrosas; están marcados en la app como "a revisar". Los de 2023 están solo como imagen dentro del PDF
y no se pudieron transcribir. Tres enunciados de la práctica son ambiguos y la lectura que se tomó
está anotada en cada uno: el 11 (si la parte decimal es obligatoria), el 38 (qué son w y x) y el 46
(qué significa "entre una a y una c consecutivas").
