import { type Nodo, EPSILON_NODO, VACIO, concat, estrella, simbolo, union } from './ast'

/**
 * Parser de expresiones regulares con las convenciones de la cátedra:
 *
 *   prioridad     * (clausura) > concatenación > | (unión)
 *   asociatividad todas por izquierda
 *
 * Detalles pensados para poder tipear la práctica tal como está impresa:
 *
 *  - Los espacios se ignoran: `b (a* | b) | a` se lee igual que `b(a*|b)|a`.
 *  - Un operando vacío es ε. La práctica escribe `(( | 0 ) 1 *)*` y
 *    `(a | (b | )* a*a | b(ba)* )*`, donde el hueco es la cadena vacía.
 *  - `ε`, `λ` y `&` son la cadena vacía; `∅` y `Ø` el lenguaje vacío.
 *  - `e` NO es ε: es un símbolo del alfabeto. El ejercicio D5,
 *    `dd*(ddd* | e(mir)d*)`, deletrea palabras con la e.
 *  - `+` se lee como unión, según la nota de la teoría de que algunos libros lo
 *    usan en lugar de `|`. Como puede confundirse con la clausura positiva,
 *    queda avisado en `advertencias`.
 */

export interface Analisis {
  nodo: Nodo
  /** símbolos del alfabeto detectados, en orden de aparición */
  alfabeto: string[]
  advertencias: string[]
}

export class ErrorDeSintaxis extends Error {
  constructor(
    mensaje: string,
    public posicion: number,
  ) {
    super(mensaje)
    this.name = 'ErrorDeSintaxis'
  }
}

const EPSILONES = new Set(['ε', 'λ', '&'])
const VACIOS = new Set(['∅', 'Ø', 'Ø'])

export function parsear(fuente: string): Analisis {
  const advertencias: string[] = []
  if (fuente.includes('+')) {
    advertencias.push('Se leyó + como unión (|), según la convención de la teoría. No es la clausura positiva.')
  }

  // Se conservan las posiciones originales para poder señalar dónde falló.
  const car: string[] = []
  const pos: number[] = []
  for (let i = 0; i < fuente.length; i++) {
    if (!/\s/.test(fuente[i])) {
      car.push(fuente[i])
      pos.push(i)
    }
  }

  let i = 0
  const fin = () => i >= car.length
  const mirar = () => (fin() ? '' : car[i])
  const donde = () => (fin() ? fuente.length : pos[i])

  function parseUnion(): Nodo {
    let izq = parseConcat()
    while (mirar() === '|' || mirar() === '+') {
      i++
      izq = union(izq, parseConcat())
    }
    return izq
  }

  function parseConcat(): Nodo {
    const partes: Nodo[] = []
    while (!fin() && mirar() !== '|' && mirar() !== '+' && mirar() !== ')') {
      partes.push(parseEstrella())
    }
    // Sin operandos, la concatenación vacía es ε: así se leen los huecos de `( | 0 )`.
    if (partes.length === 0) return EPSILON_NODO
    return partes.reduce((a, b) => concat(a, b))
  }

  function parseEstrella(): Nodo {
    let n = parseAtomo()
    while (mirar() === '*') {
      i++
      n = estrella(n)
    }
    return n
  }

  function parseAtomo(): Nodo {
    const c = mirar()
    if (c === '(') {
      const abre = donde()
      i++
      const dentro = parseUnion()
      if (mirar() !== ')') throw new ErrorDeSintaxis('Falta cerrar el paréntesis abierto acá.', abre)
      i++
      return dentro
    }
    if (c === ')') throw new ErrorDeSintaxis('Hay un paréntesis de cierre de más.', donde())
    if (c === '*') throw new ErrorDeSintaxis('La clausura * necesita algo a la izquierda.', donde())
    if (c === '') throw new ErrorDeSintaxis('La expresión terminó antes de tiempo.', fuente.length)
    i++
    if (EPSILONES.has(c)) return EPSILON_NODO
    if (VACIOS.has(c)) return VACIO
    return simbolo(c)
  }

  if (car.length === 0) throw new ErrorDeSintaxis('Escribí una expresión regular.', 0)

  const nodo = parseUnion()
  if (!fin()) throw new ErrorDeSintaxis('Sobra un paréntesis de cierre.', donde())

  const alfabeto: string[] = []
  recolectar(nodo, alfabeto)
  return { nodo, alfabeto, advertencias }
}

function recolectar(n: Nodo, acc: string[]) {
  switch (n.tipo) {
    case 'simbolo':
      if (!acc.includes(n.valor)) acc.push(n.valor)
      break
    case 'union':
    case 'concat':
      recolectar(n.izq, acc)
      recolectar(n.der, acc)
      break
    case 'estrella':
      recolectar(n.hijo, acc)
      break
  }
}
