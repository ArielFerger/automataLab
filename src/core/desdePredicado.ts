/**
 * Construye el AFD mínimo de un lenguaje a partir de un predicado de pertenencia,
 * por clases de Myhill-Nerode.
 *
 * Dos prefijos son el mismo estado si tienen el mismo residual, es decir si para
 * toda continuación posible el predicado responde igual. Acá los residuales se
 * comparan con las continuaciones de hasta `profundidad` símbolos.
 *
 * Eso es exacto siempre que `profundidad` alcance: si el AFD mínimo verdadero
 * tiene n estados, dos residuales distintos se distinguen con alguna cadena de
 * largo menor que n. O sea que si el resultado tiene m estados y m ≤ profundidad+1,
 * la construcción es la correcta. Se usa solo para generar el banco de
 * ejercicios, con verificación exhaustiva posterior — no en la app.
 */

import { type Automata } from './automaton'
import { disponerPorCapas } from './layout'

/** Continuaciones de hasta `profundidad` símbolos, en orden canónico. */
function sufijos(alfabeto: string[], profundidad: number): string[] {
  const out = ['']
  let nivel = ['']
  for (let i = 0; i < profundidad; i++) {
    const siguiente: string[] = []
    for (const w of nivel) for (const s of alfabeto) siguiente.push(w + s)
    out.push(...siguiente)
    nivel = siguiente
  }
  return out
}

/** Profundidad que deja la cantidad de continuaciones por debajo de `techo`. */
export function profundidadRazonable(alfabeto: string[], techo = 200000): number {
  let total = 1
  let nivel = 1
  let k = 0
  while (k < 40) {
    nivel *= alfabeto.length
    if (total + nivel > techo) break
    total += nivel
    k++
  }
  return Math.max(k, 1)
}

export interface Derivacion {
  automata: Automata
  /** true si la profundidad usada alcanza para garantizar que el AFD es el mínimo */
  garantizado: boolean
  profundidad: number
}

export function automataDesdePredicado(
  predicado: (w: string) => boolean,
  alfabeto: string[],
  maximoEstados = 80,
): Derivacion | null {
  const profundidad = profundidadRazonable(alfabeto)
  const conts = sufijos(alfabeto, profundidad)

  const firma = (prefijo: string) => {
    let s = ''
    for (const c of conts) s += predicado(prefijo + c) ? '1' : '0'
    return s
  }

  const porFirma = new Map<string, string>() // firma -> id de estado
  const representante: string[] = [] // id -> prefijo representante
  const transiciones: { desde: string; hasta: string; simbolo: string }[] = []

  function idDe(prefijo: string): string | null {
    const f = firma(prefijo)
    const ya = porFirma.get(f)
    if (ya !== undefined) return ya
    if (representante.length >= maximoEstados) return null
    const id = 'q' + representante.length
    porFirma.set(f, id)
    representante.push(prefijo)
    return id
  }

  const inicial = idDe('')
  if (inicial === null) return null

  for (let i = 0; i < representante.length; i++) {
    const prefijo = representante[i]
    for (const s of alfabeto) {
      const destino = idDe(prefijo + s)
      if (destino === null) return null
      transiciones.push({ desde: 'q' + i, hasta: destino, simbolo: s })
    }
  }

  const automata = disponerPorCapas({
    estados: representante.map((_, i) => ({ id: 'q' + i, nombre: 'q' + i, x: 0, y: 0 })),
    alfabeto: [...alfabeto],
    transiciones,
    inicial,
    finales: representante.map((p, i) => (predicado(p) ? 'q' + i : '')).filter(Boolean),
  })

  return { automata, garantizado: representante.length <= profundidad + 1, profundidad }
}
