import { PRACTICA_A } from './practicaA'
import { PRACTICA_C, PRACTICA_D, PRACTICA_E, type EjercicioExpresion } from './practicaBCDE'
import { REFERENCIAS } from './referencias'
import type { Ejercicio } from './tipos'

/**
 * El banco completo, con las expresiones de referencia ya enganchadas.
 *
 * Los enunciados y los predicados se escriben a mano en practicaA1/A2 y
 * practicaBCDE; las referencias se derivan de los predicados con
 * test/generarReferencias.gen.test.ts y se pegan acá al armar la lista.
 */
function conReferencia(e: Ejercicio): Ejercicio {
  return { ...e, referencia: e.referencia ?? REFERENCIAS[e.id] }
}

/** Ejercicios que se corrigen comparando lenguajes: los puntos A y E. */
export const EJERCICIOS: Ejercicio[] = [...PRACTICA_A, ...PRACTICA_E].map(conReferencia)

/** Ejercicios que parten de una expresión regular dada: los puntos C y D. */
export const EJERCICIOS_ER: EjercicioExpresion[] = [...PRACTICA_C, ...PRACTICA_D]

export function ejercicioPorId(id: number): Ejercicio | undefined {
  return EJERCICIOS.find((e) => e.id === id)
}

/** Los que no son regulares: ahí la respuesta correcta es decir justamente eso. */
export const NO_REGULARES = EJERCICIOS.filter((e) => !e.regular).map((e) => e.id)
