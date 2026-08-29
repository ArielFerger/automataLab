import type { Automata } from '../src/core/automaton'
import { acepta } from '../src/core/simulate'

/**
 * Compara un autómata contra el predicado del ejercicio.
 *
 * Dos barridos: todas las cadenas cortas, exhaustivamente, y después cadenas
 * largas generadas al azar con una semilla fija. El primero cubre los casos borde
 * (ε, cadenas de uno o dos símbolos); el segundo detecta si el autómata deja de
 * coincidir recién en cadenas que ninguna enumeración razonable alcanzaría.
 */

export interface Discrepancia {
  cadena: string
  segunPredicado: boolean
  segunAutomata: boolean
}

/** Generador con semilla, para que el test dé siempre el mismo resultado. */
function azar(semilla: number): () => number {
  let s = semilla >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function exhaustivo(alfabeto: string[], techo: number): string[] {
  const out = ['']
  let nivel = ['']
  while (out.length < techo) {
    const siguiente: string[] = []
    for (const w of nivel) for (const s of alfabeto) siguiente.push(w + s)
    if (siguiente.length === 0) break
    for (const w of siguiente) {
      out.push(w)
      if (out.length >= techo) break
    }
    nivel = siguiente
  }
  return out
}

export function comparar(
  automata: Automata,
  predicado: (w: string) => boolean,
  alfabeto: string[],
  opciones: { cortas?: number; largas?: number; largoMaximo?: number } = {},
): Discrepancia | null {
  const cortas = opciones.cortas ?? 6000
  const largas = opciones.largas ?? 4000
  const largoMaximo = opciones.largoMaximo ?? 40

  for (const w of exhaustivo(alfabeto, cortas)) {
    const p = predicado(w)
    const a = acepta(automata, w)
    if (p !== a) return { cadena: w, segunPredicado: p, segunAutomata: a }
  }

  const r = azar(20260828)
  for (let i = 0; i < largas; i++) {
    const largo = Math.floor(r() * largoMaximo) + 1
    let w = ''
    for (let j = 0; j < largo; j++) w += alfabeto[Math.floor(r() * alfabeto.length)]
    const p = predicado(w)
    const a = acepta(automata, w)
    if (p !== a) return { cadena: w, segunPredicado: p, segunAutomata: a }
  }

  // En los lenguajes muy escasos (un formato de mail, por ejemplo) casi ninguna
  // cadena al azar cae adentro, así que además se recorren caminos aceptadores
  // del propio autómata: eso encuentra lo que el autómata reconoce de más.
  for (const w of caminosAceptadores(automata, r, Math.min(largas, 1500), largoMaximo)) {
    if (!predicado(w)) return { cadena: w, segunPredicado: false, segunAutomata: true }
  }

  return null
}

/** Camina el autómata al azar y devuelve las cadenas con las que termina en un final. */
function caminosAceptadores(a: Automata, r: () => number, cuantos: number, largoMaximo: number): string[] {
  const out: string[] = []
  if (!a.inicial) return out
  for (let i = 0; i < cuantos; i++) {
    let estado = a.inicial
    let w = ''
    const pasos = Math.floor(r() * largoMaximo) + 1
    for (let j = 0; j < pasos; j++) {
      const salidas = a.transiciones.filter((t) => t.desde === estado)
      if (salidas.length === 0) break
      const t = salidas[Math.floor(r() * salidas.length)]
      w += t.simbolo
      estado = t.hasta
      if (a.finales.includes(estado)) out.push(w)
    }
  }
  return out
}
