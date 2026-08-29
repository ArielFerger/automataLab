/**
 * La cadena de transformaciones completa: ER → AFN-ε → AFD → AFD mínimo.
 *
 * Es el recorrido que pide el punto E de la práctica y el ítem de 60 puntos del
 * parcial. Cada etapa guarda sus pasos para poder mostrarlos.
 */

import type { Automata } from './automaton'
import { minimizar, type ResultadoMinimizacion } from './minimize'
import { parsear, type Analisis } from './regex/parser'
import { subconjuntos, type ResultadoSubconjuntos } from './subset'
import { thompson, type ResultadoThompson } from './thompson'

export interface Conversion {
  analisis: Analisis
  thompson: ResultadoThompson
  subconjuntos: ResultadoSubconjuntos
  minimizacion: ResultadoMinimizacion
  /** el AFD mínimo, que es el resultado final */
  minimo: Automata
}

/** Corre el pipeline entero desde el texto de una expresión regular. */
export function convertirER(fuente: string): Conversion {
  const analisis = parsear(fuente)
  // El alfabeto se ordena para que las columnas de las tablas salgan siempre igual.
  const alfabeto = [...analisis.alfabeto].sort()
  const t = thompson(analisis.nodo, alfabeto)
  const s = subconjuntos(t.automata)
  const m = minimizar(s.afd)
  return { analisis, thompson: t, subconjuntos: s, minimizacion: m, minimo: m.minimo }
}

/** Atajo: la ER a AFD mínimo, sin los pasos intermedios. */
export function erAMinimo(fuente: string): Automata {
  return convertirER(fuente).minimo
}

/** Determiniza y minimiza un autómata cualquiera, para poder compararlo. */
export function normalizar(a: Automata): Automata {
  return minimizar(subconjuntos(a).afd).minimo
}
