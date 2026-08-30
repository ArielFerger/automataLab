import { describe, expect, it } from 'vitest'
import {
  type Automata,
  EPSILON,
  clasificar,
  completar,
  epsilonClausura,
  esCompleto,
  esSimboloEpsilon,
  motivoNoAFD,
  mueve,
  quitarInalcanzables,
  reconectar,
  quitarMuertos,
  vivos,
} from '../src/core/automaton'
import { acepta, cadenasAceptadas, probarLote, simular } from '../src/core/simulate'
import { minimizar } from '../src/core/minimize'
import { eliminacionDeEstados } from '../src/core/stateElimination'

/** Cadenas sobre {a, b} de longitud par (ejercicio A5). */
function longitudPar(): Automata {
  return {
    estados: [
      { id: 'p', nombre: 'p', x: 0, y: 0 },
      { id: 'i', nombre: 'i', x: 0, y: 0 },
    ],
    alfabeto: ['a', 'b'],
    transiciones: [
      { desde: 'p', hasta: 'i', simbolo: 'a' },
      { desde: 'p', hasta: 'i', simbolo: 'b' },
      { desde: 'i', hasta: 'p', simbolo: 'a' },
      { desde: 'i', hasta: 'p', simbolo: 'b' },
    ],
    inicial: 'p',
    finales: ['p'],
  }
}

/** AFN-ε de a*b construido a mano, con un ε-salto. */
function conEpsilon(): Automata {
  return {
    estados: [
      { id: '0', nombre: '0', x: 0, y: 0 },
      { id: '1', nombre: '1', x: 0, y: 0 },
      { id: '2', nombre: '2', x: 0, y: 0 },
    ],
    alfabeto: ['a', 'b'],
    transiciones: [
      { desde: '0', hasta: '0', simbolo: 'a' },
      { desde: '0', hasta: '1', simbolo: EPSILON },
      { desde: '1', hasta: '2', simbolo: 'b' },
    ],
    inicial: '0',
    finales: ['2'],
  }
}

describe('clasificación', () => {
  it('reconoce un AFD completo', () => {
    expect(clasificar(longitudPar())).toBe('AFD')
    expect(motivoNoAFD(longitudPar())).toBeNull()
  })

  it('marca como AFN al que tiene celdas vacías', () => {
    const a = longitudPar()
    a.transiciones = a.transiciones.filter((t) => !(t.desde === 'p' && t.simbolo === 'b'))
    expect(clasificar(a)).toBe('AFN')
    expect(motivoNoAFD(a)).toBe('falta δ(p, b)')
  })

  it('marca como AFN al que tiene dos destinos para el mismo símbolo', () => {
    const a = longitudPar()
    a.transiciones.push({ desde: 'p', hasta: 'p', simbolo: 'a' })
    expect(clasificar(a)).toBe('AFN')
    expect(motivoNoAFD(a)).toBe('δ(p, a) tiene 2 destinos')
  })

  it('detecta las ε-transiciones', () => {
    expect(clasificar(conEpsilon())).toBe('AFN-ε')
  })
})

describe('ε-clausura y mueve', () => {
  it('sigue las ε-transiciones desde el conjunto de partida', () => {
    const a = conEpsilon()
    expect([...epsilonClausura(a, ['0'])].sort()).toEqual(['0', '1'])
    expect([...epsilonClausura(a, ['2'])]).toEqual(['2'])
  })

  it('mueve no aplica la ε-clausura por su cuenta', () => {
    const a = conEpsilon()
    expect([...mueve(a, ['0', '1'], 'b')]).toEqual(['2'])
    expect([...mueve(a, ['0'], 'b')]).toEqual([])
  })
})

describe('limpieza', () => {
  it('quita los estados inalcanzables', () => {
    const a = longitudPar()
    a.estados.push({ id: 'z', nombre: 'z', x: 0, y: 0 })
    expect(quitarInalcanzables(a).estados.map((e) => e.id)).toEqual(['p', 'i'])
  })

  it('quita los estados muertos pero conserva el inicial', () => {
    const a = longitudPar()
    a.estados.push({ id: 'muerto', nombre: 'muerto', x: 0, y: 0 })
    a.transiciones.push({ desde: 'i', hasta: 'muerto', simbolo: 'a' })
    a.transiciones.push({ desde: 'muerto', hasta: 'muerto', simbolo: 'a' })
    expect(vivos(a).has('muerto')).toBe(false)
    expect(quitarMuertos(a).estados.map((e) => e.id)).toEqual(['p', 'i'])
  })

  it('completar agrega un estado trampa y deja el autómata completo', () => {
    const a = longitudPar()
    a.transiciones = a.transiciones.filter((t) => t.simbolo !== 'b')
    expect(esCompleto(a)).toBe(false)
    const c = completar(a)
    expect(esCompleto(c)).toBe(true)
    expect(clasificar(c)).toBe('AFD')
    // La trampa no cambia el lenguaje: 'b' se rechazaba antes y se rechaza ahora.
    expect(acepta(c, 'b')).toBe(false)
    expect(acepta(c, 'aa')).toBe(true)
  })

  it('completar no toca un autómata que ya es completo', () => {
    const a = longitudPar()
    expect(completar(a).estados).toHaveLength(2)
  })
})

describe('reconocimiento', () => {
  it('acepta las cadenas de longitud par y rechaza las impares', () => {
    const a = longitudPar()
    expect(acepta(a, '')).toBe(true)
    expect(acepta(a, 'ab')).toBe(true)
    expect(acepta(a, 'abab')).toBe(true)
    expect(acepta(a, 'a')).toBe(false)
    expect(acepta(a, 'aba')).toBe(false)
  })

  it('la traza tiene un paso por símbolo más el inicial', () => {
    const r = simular(longitudPar(), 'aba')
    expect(r.pasos).toHaveLength(4)
    expect(r.pasos[0].activos).toEqual(['p'])
    expect(r.pasos[3].activos).toEqual(['i'])
    expect(r.acepta).toBe(false)
    expect(r.camino).toBeNull()
  })

  it('devuelve un camino aceptador cuando acepta', () => {
    const r = simular(longitudPar(), 'ab')
    expect(r.acepta).toBe(true)
    expect(r.camino?.map((p) => p.estado)).toEqual(['p', 'i', 'p'])
  })

  it('avisa cuando la cadena tiene un símbolo fuera del alfabeto', () => {
    const r = simular(longitudPar(), 'axb')
    expect(r.error).toBe('El símbolo "x" no pertenece al alfabeto.')
    expect(r.acepta).toBe(false)
  })

  it('atraviesa las ε-transiciones', () => {
    const a = conEpsilon()
    expect(acepta(a, 'b')).toBe(true)
    expect(acepta(a, 'aaab')).toBe(true)
    expect(acepta(a, 'a')).toBe(false)
    expect(acepta(a, 'ba')).toBe(false)
    // El camino aceptador incluye el ε-salto de 0 a 1.
    const r = simular(a, 'ab')
    expect(r.camino?.map((p) => p.estado)).toEqual(['0', '0', '1', '2'])
  })

  it('el lote marca los símbolos fuera del alfabeto sin romperse', () => {
    const r = probarLote(longitudPar(), ['', 'ab', 'z'])
    expect(r.map((x) => x.acepta)).toEqual([true, true, false])
    expect(r[2].error).toContain('no pertenece')
  })

  it('enumera las cadenas del lenguaje en orden canónico', () => {
    expect(cadenasAceptadas(longitudPar(), 2)).toEqual(['', 'aa', 'ab', 'ba', 'bb'])
  })
})

describe('qué cuenta como ε al escribir una transición', () => {
  it('acepta los símbolos y la palabra eps', () => {
    for (const s of ['ε', 'λ', '&', 'eps', 'EPS', ' ε ']) {
      expect([s, esSimboloEpsilon(s)]).toEqual([s, true])
    }
  })

  it('la e suelta es un símbolo del alfabeto, no ε', () => {
    // El ejercicio D5 deletrea e(mir) y el E3 va sobre {e, b}: si la e se tomara
    // por ε, esos autómatas no se podrían dibujar.
    for (const s of ['e', 'E', 'b', '0', 'l']) {
      expect([s, esSimboloEpsilon(s)]).toEqual([s, false])
    }
  })
})

describe('autómatas a medio dibujar', () => {
  it('minimizar uno sin estado inicial no rompe', () => {
    const a = longitudPar()
    a.inicial = ''
    // Sin inicial no hay nada alcanzable, así que el mínimo queda vacío. Lo que
    // importa es que devuelva eso en vez de explotar mientras se está dibujando.
    const r = minimizar(a)
    expect(r.minimo.inicial).toBe('')
    expect(r.minimo.estados).toEqual([])
  })

  it('pasar a ER uno sin estado inicial da el lenguaje vacío', () => {
    const a = longitudPar()
    a.inicial = ''
    expect(eliminacionDeEstados(a).expresion).toBe('∅')
  })

  it('uno sin estados no rompe ninguna de las dos cosas', () => {
    const vacio = { estados: [], alfabeto: ['a'], transiciones: [], inicial: '', finales: [] }
    expect(() => minimizar(vacio)).not.toThrow()
    expect(eliminacionDeEstados(vacio).expresion).toBe('∅')
  })
})

describe('reenganchar una flecha a otro estado', () => {
  function tres(): Automata {
    return {
      estados: [
        { id: 'a', nombre: 'a', x: 0, y: 0 },
        { id: 'b', nombre: 'b', x: 0, y: 0 },
        { id: 'c', nombre: 'c', x: 0, y: 0 },
      ],
      alfabeto: ['0', '1'],
      transiciones: [
        { desde: 'a', hasta: 'b', simbolo: '0' },
        { desde: 'a', hasta: 'b', simbolo: '1' },
      ],
      inicial: 'a',
      finales: ['b'],
    }
  }

  it('mueve el destino y se lleva todos los símbolos del manojo', () => {
    const r = reconectar(tres(), 'a', 'b', 'hasta', 'c')
    expect(r.transiciones).toEqual([
      { desde: 'a', hasta: 'c', simbolo: '0' },
      { desde: 'a', hasta: 'c', simbolo: '1' },
    ])
  })

  it('mueve también el origen', () => {
    const r = reconectar(tres(), 'a', 'b', 'desde', 'c')
    expect(r.transiciones.every((t) => t.desde === 'c' && t.hasta === 'b')).toBe(true)
  })

  it('al caer sobre un manojo que ya existía, junta los símbolos sin repetir', () => {
    const a = tres()
    a.transiciones.push({ desde: 'a', hasta: 'c', simbolo: '0' })
    const r = reconectar(a, 'a', 'b', 'hasta', 'c')
    // El 0 ya estaba en a→c: queda uno solo, más el 1 que llegó.
    expect(r.transiciones).toEqual([
      { desde: 'a', hasta: 'c', simbolo: '0' },
      { desde: 'a', hasta: 'c', simbolo: '1' },
    ])
  })

  it('soltarla donde ya estaba, o sobre algo que no es un estado, no cambia nada', () => {
    const a = tres()
    expect(reconectar(a, 'a', 'b', 'hasta', 'b')).toBe(a)
    expect(reconectar(a, 'a', 'b', 'hasta', 'inexistente')).toBe(a)
  })

  it('reenganchar a su propio origen deja un bucle', () => {
    const r = reconectar(tres(), 'a', 'b', 'hasta', 'a')
    expect(r.transiciones.every((t) => t.desde === 'a' && t.hasta === 'a')).toBe(true)
  })

  it('la curvatura elegida acompaña a la flecha', () => {
    const a = tres()
    a.curvas = { 'a>b': 40 }
    const r = reconectar(a, 'a', 'b', 'hasta', 'c')
    expect(r.curvas).toEqual({ 'a>c': 40 })
  })

  it('si el destino ya tenía curvatura propia, esa manda', () => {
    const a = tres()
    a.transiciones.push({ desde: 'a', hasta: 'c', simbolo: '0' })
    a.curvas = { 'a>b': 40, 'a>c': -15 }
    const r = reconectar(a, 'a', 'b', 'hasta', 'c')
    expect(r.curvas).toEqual({ 'a>c': -15 })
  })

  it('no toca el lenguaje reconocido cuando el destino es equivalente', () => {
    const a = tres()
    const r = reconectar(a, 'a', 'b', 'hasta', 'c')
    // b era final y c no: el lenguaje cambia, y eso se tiene que notar.
    expect(acepta(a, '0')).toBe(true)
    expect(acepta(r, '0')).toBe(false)
  })
})
