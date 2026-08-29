import { describe, expect, it } from 'vitest'
import { clasificar } from '../src/core/automaton'
import { erAMinimo } from '../src/core/pipeline'
import { parsear } from '../src/core/regex/parser'
import { EJERCICIOS, NO_REGULARES } from '../src/data/banco'
import { PRACTICA_A } from '../src/data/practicaA'
import { EJERCICIOS_ER } from '../src/data/banco'
import { LENGUAJES_DE_PARCIAL, PARCIALES } from '../src/data/parciales'
import { REFERENCIAS } from '../src/data/referencias'
import { comparar } from './comparar'

/**
 * La red de seguridad del banco.
 *
 * Si una expresión de referencia está mal, la app corrige mal, y el estudiante
 * estudia mal. Por eso cada referencia se contrasta contra el predicado del
 * ejercicio, que es una segunda escritura independiente del mismo lenguaje.
 */
describe('banco de ejercicios', () => {
  it('están los 80 ejercicios del punto A, sin repetir ni faltar', () => {
    expect(PRACTICA_A).toHaveLength(80)
    expect(PRACTICA_A.map((e) => e.id)).toEqual(Array.from({ length: 80 }, (_, i) => i + 1))
  })

  it('cada ejercicio está completo', () => {
    for (const e of EJERCICIOS) {
      expect([e.id, e.enunciado.length > 10]).toEqual([e.id, true])
      expect([e.id, e.alfabeto.length > 0]).toEqual([e.id, true])
      if (e.regular) {
        expect([e.id, typeof e.referencia]).toEqual([e.id, 'string'])
        expect([e.id, typeof e.predicado]).toEqual([e.id, 'function'])
      } else {
        // Un lenguaje no regular no lleva referencia, lleva la explicación.
        expect([e.id, e.referencia]).toEqual([e.id, undefined])
        expect([e.id, (e.porQueNo ?? '').length > 40]).toEqual([e.id, true])
      }
    }
  })

  it('la referencia usa solo símbolos del alfabeto declarado', () => {
    for (const e of EJERCICIOS) {
      if (!e.referencia) continue
      const usados = parsear(e.referencia).alfabeto
      const sobrantes = usados.filter((s) => !e.alfabeto.includes(s))
      expect([e.id, sobrantes]).toEqual([e.id, []])
    }
  })

  const regulares = [...EJERCICIOS, ...LENGUAJES_DE_PARCIAL.map((e) => ({ ...e, referencia: e.referencia ?? REFERENCIAS[e.id] }))].filter(
    (e) => e.regular && e.predicado && e.referencia,
  )

  it.each(regulares.map((e) => [e.id, e] as const))(
    'la referencia del ejercicio %i reconoce el mismo lenguaje que su predicado',
    (_id, e) => {
      const automata = erAMinimo(e.referencia as string)
      expect(clasificar(automata)).toBe('AFD')
      const fallo = comparar(automata, e.predicado as (w: string) => boolean, e.alfabeto)
      // Si esto falla, el mensaje trae la cadena exacta donde difieren.
      expect(fallo).toBeNull()
    },
  )

  it.each(EJERCICIOS_ER.map((e) => [e.punto + e.id, e.expresion] as const))(
    'la expresión del ejercicio %s se puede parsear y convertir',
    (_id, expresion) => {
      expect(clasificar(erAMinimo(expresion))).toBe('AFD')
    },
  )

  it('los cuatro parciales tienen la estructura 20/60/20', () => {
    expect(PARCIALES).toHaveLength(4)
    for (const p of PARCIALES) {
      expect([p.id, p.items.map((i) => i.puntos)]).toEqual([p.id, [20, 60, 20]])
      expect([p.id, p.items.map((i) => i.tipo)]).toEqual([p.id, ['af-a-er', 'er-a-afd', 'lenguaje']])
      const item2 = p.items[1]
      expect([p.id, clasificar(erAMinimo(item2.expresion as string))]).toEqual([p.id, 'AFD'])
      // El ítem 3 tiene que poder corregirse: necesita referencia.
      expect([p.id, typeof p.items[2].ejercicio?.referencia]).toEqual([p.id, 'string'])
    }
  })

  it('los lenguajes no regulares son los esperados', () => {
    expect(NO_REGULARES).toEqual([34, 37, 38, 40, 41, 62, 67, 71, 72, 73, 76, 79])
  })
})
