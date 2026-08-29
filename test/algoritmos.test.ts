import { describe, expect, it } from 'vitest'
import { EPSILON, clasificar } from '../src/core/automaton'
import { equivalentes } from '../src/core/equivalence'
import { convertirER, erAMinimo, normalizar } from '../src/core/pipeline'
import { imprimir } from '../src/core/regex/ast'
import { ErrorDeSintaxis, parsear } from '../src/core/regex/parser'
import { acepta } from '../src/core/simulate'
import { eliminacionDeEstados } from '../src/core/stateElimination'
import { thompson } from '../src/core/thompson'

describe('parser de expresiones regulares', () => {
  it('respeta las prioridades * > concatenación > |', () => {
    expect(imprimir(parsear('a|bc*').nodo)).toBe('a|bc*')
    expect(imprimir(parsear('(a|b)c').nodo)).toBe('(a|b)c')
    expect(imprimir(parsear('ab*').nodo)).toBe('ab*')
    expect(imprimir(parsear('(ab)*').nodo)).toBe('(ab)*')
  })

  it('ignora los espacios de la práctica', () => {
    expect(imprimir(parsear('b (a* | b) | a').nodo)).toBe(imprimir(parsear('b(a*|b)|a').nodo))
    expect(imprimir(parsear('0 (0 | 1) * 0').nodo)).toBe(imprimir(parsear('0(0|1)*0').nodo))
  })

  it('lee el operando vacío como ε, tal como está impresa la práctica', () => {
    // Ejercicio C2: (( | 0 ) 1 *)*
    const a = parsear('(( | 0 ) 1 *)*')
    expect(acepta(erAMinimo('(( | 0 ) 1 *)*'), '')).toBe(true)
    expect(acepta(erAMinimo('(( | 0 ) 1 *)*'), '01')).toBe(true)
    expect(a.alfabeto.sort()).toEqual(['0', '1'])
  })

  it('trata la e como símbolo del alfabeto, no como ε', () => {
    // Ejercicio D5: dd*(ddd* | e(mir)d*) deletrea con la e.
    const a = parsear('dd* ( ddd* | e ( mir ) d* )')
    expect(a.alfabeto.sort()).toEqual(['d', 'e', 'i', 'm', 'r'])
    expect(acepta(erAMinimo('dd* ( ddd* | e ( mir ) d* )'), 'demir')).toBe(true)
  })

  it('reconoce ε y ∅ explícitos', () => {
    expect(parsear('ε').nodo.tipo).toBe('epsilon')
    expect(parsear('∅').nodo.tipo).toBe('vacio')
  })

  it('avisa cuando se usa + como unión', () => {
    expect(parsear('a+b').advertencias[0]).toContain('unión')
    expect(equivalentes(erAMinimo('a+b'), erAMinimo('a|b')).equivalentes).toBe(true)
  })

  it('marca los errores de sintaxis', () => {
    expect(() => parsear('(ab')).toThrow(ErrorDeSintaxis)
    expect(() => parsear('ab)')).toThrow(ErrorDeSintaxis)
    expect(() => parsear('*a')).toThrow(ErrorDeSintaxis)
    expect(() => parsear('   ')).toThrow(ErrorDeSintaxis)
  })
})

describe('construcción de Thompson', () => {
  // Las nueve expresiones del punto C de la práctica.
  const PUNTO_C = [
    '0 (0 | 1) * 0',
    '(( | 0 ) 1 *)*',
    '( c* )*',
    '0* 1 0* 1 0* 1 0*',
    'a* (b | c )*',
    '(((a | b ) | c ) | d )',
    'u(( n ( it | til )) | ses)',
    '(0 | 1 ) 0 (0 | 1) (0 | 1)',
    '(a | (b | )* a*a | b(ba)* )*',
  ]

  it.each(PUNTO_C)('cumple los invariantes del AFN-ε para %s', (er) => {
    const a = parsear(er)
    const { automata } = thompson(a.nodo, a.alfabeto)
    expect(automata.finales).toHaveLength(1)
    const final = automata.finales[0]
    expect(automata.transiciones.filter((t) => t.desde === final)).toHaveLength(0)
    expect(automata.transiciones.filter((t) => t.hasta === automata.inicial)).toHaveLength(0)
    expect(clasificar(automata)).toBe('AFN-ε')
  })

  it('genera un paso por cada subexpresión', () => {
    const a = parsear('ab*')
    const { pasos } = thompson(a.nodo, a.alfabeto)
    expect(pasos.map((p) => p.expresion)).toEqual(['a', 'b', 'b*', 'ab*'])
  })

  it('la concatenación funde el final de la primera con el inicial de la segunda', () => {
    const a = parsear('ab')
    const { automata } = thompson(a.nodo, a.alfabeto)
    expect(automata.estados).toHaveLength(3)
    expect(automata.transiciones.some((t) => t.simbolo === EPSILON)).toBe(false)
  })
})

describe('subconjuntos y minimización', () => {
  it('el AFD que sale de subconjuntos es completo y determinístico', () => {
    const c = convertirER('(a|b)*abb')
    expect(clasificar(c.subconjuntos.afd)).toBe('AFD')
    expect(clasificar(c.minimo)).toBe('AFD')
  })

  it('la tabla de subconjuntos arranca por la ε-clausura del inicial', () => {
    const c = convertirER('ab')
    const primera = c.subconjuntos.filas.find((f) => f.esInicial)
    expect(primera?.nombre).toBe('A')
  })

  it('reconoce el lenguaje de (a|b)*abb', () => {
    const m = erAMinimo('(a|b)*abb')
    expect(acepta(m, 'abb')).toBe(true)
    expect(acepta(m, 'aabb')).toBe(true)
    expect(acepta(m, 'babb')).toBe(true)
    expect(acepta(m, 'ab')).toBe(false)
    expect(acepta(m, 'abba')).toBe(false)
    // El AFD mínimo de (a|b)*abb tiene cuatro estados, más el trampa no hace falta.
    expect(m.estados).toHaveLength(4)
  })

  it('las particiones terminan cuando se repiten', () => {
    const c = convertirER('(a|b)*abb')
    const ps = c.minimizacion.particiones
    expect(ps[0].indice).toBe(1)
    expect(ps[ps.length - 1].grupos).toHaveLength(ps[ps.length - 2].grupos.length)
  })

  it('minimizar un AFD ya mínimo no le cambia la cantidad de estados', () => {
    const m = erAMinimo('(a|b)*abb')
    expect(normalizar(m).estados).toHaveLength(m.estados.length)
  })

  it('colapsa los estados equivalentes', () => {
    // a* escrito de dos formas redundantes tiene que dar el mismo AFD mínimo.
    expect(erAMinimo('a*').estados.length).toBe(erAMinimo('(a|a)*a*').estados.length)
  })
})

describe('las ER de los parciales', () => {
  const CASOS: { er: string; acepta: string[]; rechaza: string[] }[] = [
    // Parcial 2023, ítem 2
    { er: 'b (a* | b) | a', acepta: ['a', 'b', 'ba', 'baa', 'bb'], rechaza: ['', 'ab', 'bba', 'aa'] },
    // Recuperatorio 2023, ítem 2
    { er: '(a* | b*) | ab*', acepta: ['', 'a', 'aa', 'b', 'bb', 'ab', 'abb'], rechaza: ['ba', 'aab', 'bab'] },
    // Parcial 2025, ítem 2
    { er: '(nn*) (k|n) n*', acepta: ['nk', 'nn', 'nkn', 'nnknn'], rechaza: ['', 'k', 'n', 'kn'] },
    // Recuperatorio 2025, ítem 2
    { er: 'ab*(a|b|ε)', acepta: ['a', 'ab', 'aa', 'aba', 'abb'], rechaza: ['', 'b', 'ba', 'abab'] },
  ]

  it.each(CASOS)('$er da un AFD mínimo con el lenguaje correcto', ({ er, acepta: si, rechaza: no }) => {
    const m = erAMinimo(er)
    for (const w of si) expect([w, acepta(m, w)]).toEqual([w, true])
    for (const w of no) expect([w, acepta(m, w)]).toEqual([w, false])
    expect(clasificar(m)).toBe('AFD')
  })

  it.each(CASOS)('$er sobrevive la vuelta completa ER → AFD → ER', ({ er }) => {
    const m = erAMinimo(er)
    const vuelta = eliminacionDeEstados(m)
    expect(equivalentes(m, erAMinimo(vuelta.expresion)).equivalentes).toBe(true)
  })
})

describe('las ER del punto D', () => {
  const PUNTO_D = [
    '( ab | b) | a*',
    'a ( cd )* ( bc | b) ca',
    '(a | b ) (ba | ca )* | (cd | db)',
    '(( aa ) | (bb) | ( ca ) | (cb))*',
    'dd* ( ddd* | e ( mir ) d* )',
    'a ( b | c ) | b | c ( b | a)',
    '(( a* | b*) *) *',
    '((( ab* | b) * (b ( a | )) * ) * a)',
  ]

  it.each(PUNTO_D)('%s llega a un AFD mínimo equivalente a la ER original', (er) => {
    const c = convertirER(er)
    expect(clasificar(c.minimo)).toBe('AFD')
    // El AFD mínimo tiene que reconocer lo mismo que el AFN-ε de Thompson.
    expect(equivalentes(c.thompson.automata, c.minimo).equivalentes).toBe(true)
  })
})

describe('eliminación de estados: AF a ER', () => {
  it('recupera una expresión equivalente a la original', () => {
    for (const er of ['a*', '(a|b)*abb', 'ab*(a|b|ε)', 'b(a*|b)|a']) {
      const m = erAMinimo(er)
      const vuelta = eliminacionDeEstados(m)
      expect([er, equivalentes(m, erAMinimo(vuelta.expresion)).equivalentes]).toEqual([er, true])
    }
  })

  it('deja un paso por estado eliminado, más el de partida', () => {
    const m = erAMinimo('(a|b)*abb')
    const r = eliminacionDeEstados(m)
    expect(r.pasos).toHaveLength(m.estados.length + 1)
    expect(r.pasos[0].eliminado).toBe('')
  })

  it('el orden de eliminación se puede elegir y no cambia el lenguaje', () => {
    const m = erAMinimo('(a|b)*abb')
    const ids = m.estados.map((e) => e.id)
    const a = eliminacionDeEstados(m, ids)
    const b = eliminacionDeEstados(m, [...ids].reverse())
    expect(equivalentes(erAMinimo(a.expresion), erAMinimo(b.expresion)).equivalentes).toBe(true)
  })

  it('simplifica ε|xx* a x*, que es como se escribe a mano', () => {
    // Sin esta simplificación b(a*|b)|a vuelve como a|b(ε|aa*|b).
    const r = eliminacionDeEstados(erAMinimo('b (a* | b) | a'))
    expect(r.expresion).not.toContain('ε')
    expect(equivalentes(erAMinimo(r.expresion), erAMinimo('b(a*|b)|a')).equivalentes).toBe(true)
  })

  it('un autómata sin estados finales alcanzables da el lenguaje vacío', () => {
    const m = erAMinimo('∅')
    expect(eliminacionDeEstados(m).expresion).toBe('∅')
  })
})

describe('equivalencia', () => {
  it('detecta lenguajes iguales escritos distinto', () => {
    expect(equivalentes(erAMinimo('(a|b)*'), erAMinimo('(a*b*)*')).equivalentes).toBe(true)
    expect(equivalentes(erAMinimo('(a|b)*abb'), erAMinimo('(a|b)*abb')).equivalentes).toBe(true)
  })

  it('da el contraejemplo más corto cuando difieren', () => {
    const r = equivalentes(erAMinimo('a*'), erAMinimo('a*b'))
    expect(r.equivalentes).toBe(false)
    expect(r.contraejemplo).toBe('')
  })

  it('distingue si sobra o si falta', () => {
    // a|b acepta 'b'; solo a, no.
    const r = equivalentes(erAMinimo('a|b'), erAMinimo('a'))
    expect(r.equivalentes).toBe(false)
    expect(r.tipo).toBe('sobra')
    expect(r.contraejemplo).toBe('b')

    const s = equivalentes(erAMinimo('a'), erAMinimo('a|b'))
    expect(s.tipo).toBe('falta')
    expect(s.contraejemplo).toBe('b')
  })

  it('compara aunque los alfabetos no coincidan', () => {
    const r = equivalentes(erAMinimo('a'), erAMinimo('a|bb'))
    expect(r.equivalentes).toBe(false)
    expect(r.contraejemplo).toBe('bb')
  })
})
