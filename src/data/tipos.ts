/**
 * Un ejercicio del banco.
 *
 * Cada lenguaje regular se guarda dos veces, a propósito:
 *
 *  - `referencia` es la expresión regular con la que la app corrige, comparando
 *    por equivalencia de lenguajes contra lo que entregó el estudiante.
 *  - `predicado` dice, para una cadena cualquiera, si pertenece al lenguaje.
 *
 * El test del banco enumera todas las cadenas hasta cierta longitud y exige que
 * las dos coincidan. Escribir el predicado es mucho más difícil de errar que
 * escribir la ER, así que funciona como control de la ER, que es la que se usa
 * para corregir.
 *
 * Los lenguajes que no son regulares no llevan referencia: llevan la
 * justificación de por qué ningún autómata finito puede reconocerlos.
 */

export interface Ejercicio {
  id: number
  /** de qué punto de la práctica sale */
  punto: 'A' | 'C' | 'D' | 'E'
  enunciado: string
  alfabeto: string[]
  /** aclaración cuando los símbolos representan otra cosa (D = dígito, etc.) */
  convencion?: string
  regular: boolean
  /** expresión regular de referencia; solo si el lenguaje es regular */
  referencia?: string
  /** pertenencia al lenguaje, usada para verificar la referencia */
  predicado?: (w: string) => boolean
  /** por qué no es regular, cuando no lo es */
  porQueNo?: string
  /** aclaración que se revela después de responder */
  nota?: string
}

/** Longitud hasta la que el test compara el predicado con la referencia. */
export const LONGITUD_VERIFICACION = 9
