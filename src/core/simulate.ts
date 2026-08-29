/**
 * Reconocimiento de cadenas, paso a paso.
 *
 * Sigue el comportamiento descrito en la teoría (Parte 1): se arranca en el estado
 * inicial y se aplica δ símbolo por símbolo; al terminar, la cadena se acepta si el
 * estado alcanzado pertenece a F. Para AFN y AFN-ε lo que se lleva no es un estado
 * sino el *conjunto* de estados activos, con la ε-clausura ya aplicada.
 */

import { type Automata, epsilonClausura, mueve, EPSILON } from './automaton'

export interface PasoSimulacion {
  /** 0 = situación inicial, antes de consumir ningún símbolo */
  indice: number
  /** símbolo que se consumió para llegar a este paso (null en el paso 0) */
  simbolo: string | null
  /** estados activos, con ε-clausura aplicada */
  activos: string[]
  consumido: string
  restante: string
}

export interface ResultadoSimulacion {
  cadena: string
  pasos: PasoSimulacion[]
  acepta: boolean
  /** mensaje si la cadena o el autómata no permiten simular */
  error: string | null
  /** camino aceptador concreto (ids de estados), o null si rechaza */
  camino: PasoCamino[] | null
}

export interface PasoCamino {
  estado: string
  /** símbolo usado para salir de este estado; null en el último */
  simbolo: string | null
}

/** Parte la cadena en símbolos. En esta materia todos los alfabetos son de un carácter. */
export function aSimbolos(cadena: string): string[] {
  return [...cadena]
}

/** Valida que todos los símbolos de la cadena pertenezcan al alfabeto. */
function validar(a: Automata, simbolos: string[]): string | null {
  if (!a.inicial) return 'El autómata no tiene estado inicial.'
  for (const s of simbolos) {
    if (!a.alfabeto.includes(s)) return 'El símbolo "' + s + '" no pertenece al alfabeto.'
  }
  return null
}

export function simular(a: Automata, cadena: string): ResultadoSimulacion {
  const simbolos = aSimbolos(cadena)
  const error = validar(a, simbolos)
  if (error) return { cadena, pasos: [], acepta: false, error, camino: null }

  let activos = epsilonClausura(a, [a.inicial])
  const pasos: PasoSimulacion[] = [
    {
      indice: 0,
      simbolo: null,
      activos: [...activos],
      consumido: '',
      restante: cadena,
    },
  ]

  for (let i = 0; i < simbolos.length; i++) {
    const s = simbolos[i]
    activos = epsilonClausura(a, mueve(a, activos, s))
    pasos.push({
      indice: i + 1,
      simbolo: s,
      activos: [...activos],
      consumido: simbolos.slice(0, i + 1).join(''),
      restante: simbolos.slice(i + 1).join(''),
    })
  }

  const acepta = a.finales.some((f) => activos.has(f))
  return { cadena, pasos, acepta, error: null, camino: acepta ? caminoAceptador(a, simbolos) : null }
}

/** Versión rápida, sin traza: la usan la equivalencia y la corrección. */
export function acepta(a: Automata, cadena: string): boolean {
  const simbolos = aSimbolos(cadena)
  if (!a.inicial) return false
  for (const s of simbolos) if (!a.alfabeto.includes(s)) return false
  let activos = epsilonClausura(a, [a.inicial])
  for (const s of simbolos) {
    activos = epsilonClausura(a, mueve(a, activos, s))
    if (activos.size === 0) return false
  }
  return a.finales.some((f) => activos.has(f))
}

/**
 * Busca un camino concreto que acepte la cadena, incluyendo los saltos por
 * ε-transiciones. Sirve para resaltar el recorrido en el diagrama.
 */
export function caminoAceptador(a: Automata, simbolos: string[]): PasoCamino[] | null {
  const visitados = new Set<string>()

  function dfs(estado: string, pos: number, camino: PasoCamino[]): PasoCamino[] | null {
    const clave = estado + '@' + pos
    if (visitados.has(clave)) return null
    visitados.add(clave)

    if (pos === simbolos.length && a.finales.includes(estado)) {
      return [...camino, { estado, simbolo: null }]
    }

    // Primero avanzar consumiendo un símbolo, que es lo que acorta el camino.
    if (pos < simbolos.length) {
      const s = simbolos[pos]
      for (const t of a.transiciones) {
        if (t.desde === estado && t.simbolo === s) {
          const r = dfs(t.hasta, pos + 1, [...camino, { estado, simbolo: s }])
          if (r) return r
        }
      }
    }
    // Después los ε-saltos.
    for (const t of a.transiciones) {
      if (t.desde === estado && t.simbolo === EPSILON) {
        const r = dfs(t.hasta, pos, [...camino, { estado, simbolo: EPSILON }])
        if (r) return r
      }
    }
    return null
  }

  return dfs(a.inicial, 0, [])
}

/**
 * Flechas que el control atraviesa al pasar de un conjunto activo al siguiente:
 * las del símbolo leído, más los ε-saltos que se dan a continuación.
 * Es lo que se resalta en el diagrama mientras se recorre la cadena.
 */
export function arcosUsados(
  a: Automata,
  activosPrevios: string[],
  simbolo: string,
  activosNuevos: string[],
): { desde: string; hasta: string }[] {
  const previos = new Set(activosPrevios)
  const nuevos = new Set(activosNuevos)
  const porSimbolo = mueve(a, previos, simbolo)
  const out: { desde: string; hasta: string }[] = []
  const agregar = (desde: string, hasta: string) => {
    if (!out.some((c) => c.desde === desde && c.hasta === hasta)) out.push({ desde, hasta })
  }
  for (const t of a.transiciones) {
    if (t.simbolo === simbolo && previos.has(t.desde) && porSimbolo.has(t.hasta)) agregar(t.desde, t.hasta)
    if (t.simbolo === EPSILON && nuevos.has(t.desde) && nuevos.has(t.hasta)) agregar(t.desde, t.hasta)
  }
  return out
}

export interface ResultadoLote {
  cadena: string
  acepta: boolean
  error: string | null
}

/** Prueba muchas cadenas de una. Una línea vacía se interpreta como la cadena vacía. */
export function probarLote(a: Automata, cadenas: string[]): ResultadoLote[] {
  return cadenas.map((cadena) => {
    const err = validar(a, aSimbolos(cadena))
    return { cadena, acepta: err ? false : acepta(a, cadena), error: err }
  })
}

/**
 * Genera todas las cadenas del lenguaje hasta cierta longitud, en orden canónico.
 * Útil para ver "qué reconoce" un autómata de un vistazo.
 */
export function cadenasAceptadas(a: Automata, longitudMaxima: number, limite = 50): string[] {
  const out: string[] = []
  let nivel = ['']
  for (let l = 0; l <= longitudMaxima && out.length < limite; l++) {
    for (const w of nivel) {
      if (acepta(a, w)) {
        out.push(w)
        if (out.length >= limite) break
      }
    }
    const siguiente: string[] = []
    for (const w of nivel) for (const s of a.alfabeto) siguiente.push(w + s)
    nivel = siguiente
  }
  return out
}
