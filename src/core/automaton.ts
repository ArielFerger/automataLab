/**
 * Modelo único para AFD, AFN y AFN-ε.
 *
 * La cátedra define un AF como la 5-upla (Q, Σ, δ, q0, F). Acá se representa con un
 * solo tipo y el "sabor" (AFD / AFN / AFN-ε) se deriva de la forma de las
 * transiciones — así el editor, la tabla y el simulador no se triplican.
 */

/** Una ε-transición se guarda con el símbolo vacío. */
export const EPSILON = ''
/** Cómo se muestra ε en pantalla. */
export const EPSILON_LABEL = 'ε'

/**
 * Qué se escribe para poner una ε-transición.
 *
 * La `e` suelta NO cuenta: es un símbolo del alfabeto en varios ejercicios — el
 * D5 deletrea `e(mir)` y el E3 va sobre {e, b} —, así que tomarla por ε haría
 * imposible dibujar esos autómatas. Se aceptan las mismas formas que el parser
 * de expresiones regulares, más la palabra "eps" para quien no tenga el símbolo.
 */
export function esSimboloEpsilon(s: string): boolean {
  const t = s.trim()
  return t === 'ε' || t === 'λ' || t === '&' || t.toLowerCase() === 'eps'
}

export interface Estado {
  id: string
  nombre: string
  x: number
  y: number
}

export interface Transicion {
  desde: string
  hasta: string
  /** símbolo del alfabeto, o EPSILON ('') para una ε-transición */
  simbolo: string
}

/** Un cuadro de texto suelto sobre el lienzo: una aclaración, un título, una nota. */
export interface Texto {
  id: string
  contenido: string
  x: number
  y: number
}

export interface Automata {
  estados: Estado[]
  /** símbolos del alfabeto de entrada; nunca incluye ε */
  alfabeto: string[]
  transiciones: Transicion[]
  /** id del estado inicial; '' si todavía no se eligió */
  inicial: string
  /** ids de los estados de aceptación */
  finales: string[]
  /**
   * Curvatura elegida a mano para cada manojo de flechas, con la clave
   * "desde>hasta". Sin entrada, la curva se calcula sola. En los bucles el
   * número es el ángulo en grados alrededor del estado; en el resto, cuánto se
   * separa la flecha de la recta.
   */
  curvas?: Record<string, number>
  /** anotaciones libres; no forman parte del autómata, solo del dibujo */
  textos?: Texto[]
}

/** Clave con la que se guarda la curvatura de un manojo de flechas. */
export function claveArco(desde: string, hasta: string): string {
  return desde + '>' + hasta
}

export type TipoAutomata = 'AFD' | 'AFN' | 'AFN-ε'

// ---------------------------------------------------------------- construcción

export function automataVacio(alfabeto: string[] = ['a', 'b']): Automata {
  return { estados: [], alfabeto: [...alfabeto], transiciones: [], inicial: '', finales: [] }
}

export function clonar(a: Automata): Automata {
  return {
    estados: a.estados.map((e) => ({ ...e })),
    alfabeto: [...a.alfabeto],
    transiciones: a.transiciones.map((t) => ({ ...t })),
    inicial: a.inicial,
    finales: [...a.finales],
    ...(a.curvas ? { curvas: { ...a.curvas } } : {}),
    ...(a.textos ? { textos: a.textos.map((t) => ({ ...t })) } : {}),
  }
}

/** Devuelve un id de estado que no esté en uso. */
export function nuevoId(a: Automata, prefijo = 'q'): string {
  let n = 0
  const usados = new Set(a.estados.map((e) => e.id))
  while (usados.has(prefijo + n)) n++
  return prefijo + n
}

/** Nombre libre de la forma q0, q1, … (el que muestra el diagrama). */
export function nuevoNombre(a: Automata): string {
  let n = 0
  const usados = new Set(a.estados.map((e) => e.nombre))
  while (usados.has('q' + n)) n++
  return 'q' + n
}

// ------------------------------------------------------------------ consultas

export function estadoPorId(a: Automata, id: string): Estado | undefined {
  return a.estados.find((e) => e.id === id)
}

export function nombreDe(a: Automata, id: string): string {
  const e = estadoPorId(a, id)
  return e ? e.nombre : id
}

export function esFinal(a: Automata, id: string): boolean {
  return a.finales.includes(id)
}

/** Destinos de δ(estado, símbolo) — puede ser 0, 1 o varios. */
export function destinos(a: Automata, estado: string, simbolo: string): string[] {
  const out: string[] = []
  for (const t of a.transiciones) {
    if (t.desde === estado && t.simbolo === simbolo && !out.includes(t.hasta)) out.push(t.hasta)
  }
  return out
}

export function tieneEpsilon(a: Automata): boolean {
  return a.transiciones.some((t) => t.simbolo === EPSILON)
}

/**
 * Clasifica el autómata. Es AFD solo si es *completo* y determinístico:
 * exactamente un destino por cada par (estado, símbolo) y sin ε-transiciones.
 */
export function clasificar(a: Automata): TipoAutomata {
  if (tieneEpsilon(a)) return 'AFN-ε'
  for (const e of a.estados) {
    for (const s of a.alfabeto) {
      if (destinos(a, e.id, s).length !== 1) return 'AFN'
    }
  }
  return 'AFD'
}

/** Motivo legible por el que un autómata no llega a ser AFD (o null si lo es). */
export function motivoNoAFD(a: Automata): string | null {
  if (tieneEpsilon(a)) return 'tiene ε-transiciones'
  for (const e of a.estados) {
    for (const s of a.alfabeto) {
      const d = destinos(a, e.id, s)
      if (d.length > 1) return 'δ(' + e.nombre + ', ' + s + ') tiene ' + d.length + ' destinos'
      if (d.length === 0) return 'falta δ(' + e.nombre + ', ' + s + ')'
    }
  }
  return null
}

// ------------------------------------------- funciones auxiliares del algoritmo

/**
 * ε-clausura(T): estados alcanzables desde algún estado de T mediante 0 o más
 * ε-transiciones. (Parte 3 de la teoría.)
 */
export function epsilonClausura(a: Automata, conjunto: Iterable<string>): Set<string> {
  const resultado = new Set<string>(conjunto)
  const pila = [...resultado]
  while (pila.length > 0) {
    const s = pila.pop() as string
    for (const t of a.transiciones) {
      if (t.desde === s && t.simbolo === EPSILON && !resultado.has(t.hasta)) {
        resultado.add(t.hasta)
        pila.push(t.hasta)
      }
    }
  }
  return resultado
}

/**
 * mueve(T, a): estados hacia los que hay una a-transición desde algún estado de T.
 * No aplica ε-clausura (eso lo hace quien la llama, tal como en la transparencia).
 */
export function mueve(a: Automata, conjunto: Iterable<string>, simbolo: string): Set<string> {
  const resultado = new Set<string>()
  const origen = new Set(conjunto)
  for (const t of a.transiciones) {
    if (t.simbolo === simbolo && origen.has(t.desde)) resultado.add(t.hasta)
  }
  return resultado
}

// -------------------------------------------------------------------- limpieza

/** Estados alcanzables desde el inicial (siguiendo cualquier símbolo, ε incluido). */
export function alcanzables(a: Automata): Set<string> {
  const vistos = new Set<string>()
  if (!a.inicial) return vistos
  vistos.add(a.inicial)
  const pila = [a.inicial]
  while (pila.length > 0) {
    const s = pila.pop() as string
    for (const t of a.transiciones) {
      if (t.desde === s && !vistos.has(t.hasta)) {
        vistos.add(t.hasta)
        pila.push(t.hasta)
      }
    }
  }
  return vistos
}

/**
 * Estados "vivos": aquellos desde los que se puede llegar a algún estado final.
 * El complemento son los estados muertos (ahí entra el estado trampa del AFD).
 */
export function vivos(a: Automata): Set<string> {
  const conjunto = new Set<string>(a.finales)
  let cambio = true
  while (cambio) {
    cambio = false
    for (const t of a.transiciones) {
      if (conjunto.has(t.hasta) && !conjunto.has(t.desde)) {
        conjunto.add(t.desde)
        cambio = true
      }
    }
  }
  return conjunto
}

function filtrarEstados(a: Automata, conservar: Set<string>): Automata {
  return {
    estados: a.estados.filter((e) => conservar.has(e.id)),
    alfabeto: [...a.alfabeto],
    transiciones: a.transiciones.filter((t) => conservar.has(t.desde) && conservar.has(t.hasta)),
    inicial: conservar.has(a.inicial) ? a.inicial : '',
    finales: a.finales.filter((f) => conservar.has(f)),
  }
}

export function quitarInalcanzables(a: Automata): Automata {
  return filtrarEstados(a, alcanzables(a))
}

/** Elimina los estados muertos — primer paso del pasaje de AF a ER. */
export function quitarMuertos(a: Automata): Automata {
  const conservar = vivos(a)
  // El inicial se conserva siempre: si muere, el lenguaje es vacío pero el
  // autómata tiene que seguir existiendo para poder dibujarlo.
  if (a.inicial) conservar.add(a.inicial)
  return filtrarEstados(a, conservar)
}

export function esCompleto(a: Automata): boolean {
  return a.estados.every((e) => a.alfabeto.every((s) => destinos(a, e.id, s).length > 0))
}

/**
 * Completa el AFD agregando un estado trampa con todas las transiciones faltantes.
 * Si ya es completo lo devuelve intacto.
 */
export function completar(a: Automata, nombreTrampa = '∅'): Automata {
  if (esCompleto(a)) return clonar(a)
  const r = clonar(a)
  const idTrampa = nuevoId(r, 'trampa')
  const ys = r.estados.map((e) => e.y)
  r.estados.push({
    id: idTrampa,
    nombre: nombreTrampa,
    x: 80,
    y: (ys.length ? Math.max(...ys) : 0) + 140,
  })
  for (const e of r.estados) {
    for (const s of r.alfabeto) {
      if (destinos(r, e.id, s).length === 0) {
        r.transiciones.push({ desde: e.id, hasta: idTrampa, simbolo: s })
      }
    }
  }
  return r
}

// --------------------------------------------------------------- edición común

export function agregarEstado(a: Automata, x: number, y: number): { automata: Automata; id: string } {
  const r = clonar(a)
  const id = nuevoId(r)
  const nombre = nuevoNombre(r)
  r.estados.push({ id, nombre, x, y })
  if (!r.inicial) r.inicial = id
  return { automata: r, id }
}

export function quitarEstado(a: Automata, id: string): Automata {
  const r = clonar(a)
  r.estados = r.estados.filter((e) => e.id !== id)
  r.transiciones = r.transiciones.filter((t) => t.desde !== id && t.hasta !== id)
  r.finales = r.finales.filter((f) => f !== id)
  if (r.inicial === id) r.inicial = r.estados.length > 0 ? r.estados[0].id : ''
  return r
}

export function alternarFinal(a: Automata, id: string): Automata {
  const r = clonar(a)
  r.finales = r.finales.includes(id) ? r.finales.filter((f) => f !== id) : [...r.finales, id]
  return r
}

export function agregarTransicion(a: Automata, desde: string, hasta: string, simbolo: string): Automata {
  const r = clonar(a)
  const existe = r.transiciones.some((t) => t.desde === desde && t.hasta === hasta && t.simbolo === simbolo)
  if (!existe) r.transiciones.push({ desde, hasta, simbolo })
  if (simbolo !== EPSILON && !r.alfabeto.includes(simbolo)) r.alfabeto.push(simbolo)
  return r
}

export function quitarTransicion(a: Automata, desde: string, hasta: string, simbolo: string): Automata {
  const r = clonar(a)
  r.transiciones = r.transiciones.filter(
    (t) => !(t.desde === desde && t.hasta === hasta && t.simbolo === simbolo),
  )
  return r
}

/** Renombra los estados a q0, q1, … respetando el orden actual. */
export function renumerar(a: Automata): Automata {
  const r = clonar(a)
  r.estados.forEach((e, i) => {
    e.nombre = 'q' + i
  })
  return r
}
