/**
 * ¿Dos autómatas reconocen el mismo lenguaje?
 *
 * Se determinizan los dos sobre el alfabeto unión, y se recorre el autómata
 * producto en anchura. La primera pareja de estados donde uno acepta y el otro no
 * da el contraejemplo, y como el recorrido es en anchura, esa cadena es la más
 * corta que los distingue. Es exactamente lo que sirve para corregir un ejercicio:
 * no alcanza con decir "está mal", hay que decir con qué cadena falla.
 */

import { type Automata, clonar, destinos } from './automaton'
import { subconjuntos } from './subset'

export interface Equivalencia {
  equivalentes: boolean
  /** cadena más corta en la que difieren */
  contraejemplo?: string
  /**
   * 'sobra': la primera acepta esa cadena y la segunda no (reconoce de más).
   * 'falta': la segunda la acepta y la primera no (reconoce de menos).
   */
  tipo?: 'sobra' | 'falta'
}

interface Determinista {
  automata: Automata
  inicial: string
  finales: Set<string>
}

/** Determiniza sobre el alfabeto indicado, completando lo que falte. */
function determinizar(a: Automata, alfabeto: string[]): Determinista {
  const ampliado = clonar(a)
  ampliado.alfabeto = [...alfabeto]
  const { afd } = subconjuntos(ampliado)
  return { automata: afd, inicial: afd.inicial, finales: new Set(afd.finales) }
}

export function equivalentes(x: Automata, y: Automata): Equivalencia {
  const alfabeto = [...new Set([...x.alfabeto, ...y.alfabeto])].sort()
  const dx = determinizar(x, alfabeto)
  const dy = determinizar(y, alfabeto)

  const visitados = new Set<string>()
  const cola: { a: string; b: string; palabra: string }[] = [
    { a: dx.inicial, b: dy.inicial, palabra: '' },
  ]
  visitados.add(dx.inicial + '#' + dy.inicial)

  while (cola.length > 0) {
    const { a, b, palabra } = cola.shift() as { a: string; b: string; palabra: string }
    const aceptaX = dx.finales.has(a)
    const aceptaY = dy.finales.has(b)
    if (aceptaX !== aceptaY) {
      return { equivalentes: false, contraejemplo: palabra, tipo: aceptaX ? 'sobra' : 'falta' }
    }
    for (const s of alfabeto) {
      const sa = destinos(dx.automata, a, s)[0] ?? ''
      const sb = destinos(dy.automata, b, s)[0] ?? ''
      const clave = sa + '#' + sb
      if (!visitados.has(clave)) {
        visitados.add(clave)
        cola.push({ a: sa, b: sb, palabra: palabra + s })
      }
    }
  }

  return { equivalentes: true }
}

/** Frase lista para mostrarle al estudiante, en sus términos. */
export function explicar(e: Equivalencia): string {
  if (e.equivalentes) return 'Reconoce exactamente el mismo lenguaje.'
  const w = e.contraejemplo === '' ? 'la cadena vacía ε' : '"' + e.contraejemplo + '"'
  return e.tipo === 'sobra'
    ? 'Tu autómata acepta ' + w + ', pero esa cadena no pertenece al lenguaje.'
    : 'Tu autómata rechaza ' + w + ', pero esa cadena sí pertenece al lenguaje.'
}
