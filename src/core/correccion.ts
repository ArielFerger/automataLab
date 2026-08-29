/**
 * Corrección de un ejercicio.
 *
 * No se compara el dibujo con el dibujo: se compara el lenguaje que reconoce lo
 * que entregó el estudiante contra el lenguaje de la referencia. Dos autómatas
 * completamente distintos pueden estar los dos bien, y eso hay que respetarlo.
 */

import type { Automata } from './automaton'
import { equivalentes, explicar } from './equivalence'
import { erAMinimo, normalizar } from './pipeline'
import { ErrorDeSintaxis, parsear } from './regex/parser'

export type Veredicto = 'correcto' | 'incorrecto' | 'sin-respuesta' | 'error'

export interface Correccion {
  veredicto: Veredicto
  mensaje: string
  /** cadena más corta donde la respuesta difiere del lenguaje pedido */
  contraejemplo?: string
  /** aviso que no invalida la respuesta (símbolos de más, por ejemplo) */
  advertencia?: string
}

export interface Respuesta {
  /** expresión regular tipeada por el estudiante */
  expresion?: string
  /** autómata dibujado en el editor */
  automata?: Automata
  /** marcó el botón "este lenguaje no es regular" */
  noEsRegular?: boolean
}

export interface Consigna {
  /** ER de referencia; ausente cuando el lenguaje no es regular */
  referencia?: string
  regular: boolean
  alfabeto: string[]
  /** por qué no es regular, para explicarlo cuando el estudiante entrega un autómata */
  porQueNo?: string
}

export function corregir(consigna: Consigna, respuesta: Respuesta): Correccion {
  if (respuesta.noEsRegular) {
    return consigna.regular
      ? {
          veredicto: 'incorrecto',
          mensaje: 'El lenguaje sí es regular: hay un autómata finito que lo reconoce.',
        }
      : { veredicto: 'correcto', mensaje: 'Exacto, este lenguaje no es regular. ' + (consigna.porQueNo ?? '') }
  }

  const hayExpresion = (respuesta.expresion ?? '').trim().length > 0
  const hayAutomata = !!respuesta.automata && respuesta.automata.estados.length > 0 && !!respuesta.automata.inicial

  if (!hayExpresion && !hayAutomata) {
    return {
      veredicto: 'sin-respuesta',
      mensaje: 'Escribí una expresión regular, dibujá un autómata, o marcá que el lenguaje no es regular.',
    }
  }

  if (!consigna.regular || !consigna.referencia) {
    return {
      veredicto: 'incorrecto',
      mensaje:
        'Este lenguaje no es regular, así que ningún autómata finito ni expresión regular lo puede describir. ' +
        (consigna.porQueNo ?? ''),
    }
  }

  let entregado: Automata
  let advertencia: string | undefined

  if (hayExpresion) {
    const fuente = (respuesta.expresion ?? '').trim()
    try {
      const analisis = parsear(fuente)
      const sobrantes = analisis.alfabeto.filter((s) => !consigna.alfabeto.includes(s))
      if (sobrantes.length > 0) {
        advertencia =
          'Usaste símbolos que no están en el alfabeto del ejercicio: ' + sobrantes.join(', ') + '.'
      }
      if (analisis.advertencias.length > 0) {
        advertencia = [advertencia, ...analisis.advertencias].filter(Boolean).join(' ')
      }
      entregado = erAMinimo(fuente)
    } catch (e) {
      return {
        veredicto: 'error',
        mensaje:
          e instanceof ErrorDeSintaxis
            ? 'No se pudo leer la expresión: ' + e.message
            : 'No se pudo leer la expresión regular.',
      }
    }
  } else {
    entregado = normalizar(respuesta.automata as Automata)
  }

  const esperado = erAMinimo(consigna.referencia)
  const r = equivalentes(entregado, esperado)

  return r.equivalentes
    ? { veredicto: 'correcto', mensaje: 'Correcto: reconoce exactamente el lenguaje pedido.', advertencia }
    : { veredicto: 'incorrecto', mensaje: explicar(r), contraejemplo: r.contraejemplo, advertencia }
}
