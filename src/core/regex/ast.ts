/**
 * Árbol de una expresión regular, con la misma estructura que la definición
 * recursiva de la teoría: ∅, ε, un símbolo, y las tres operaciones (unión,
 * concatenación y clausura).
 */

export type Nodo =
  | { tipo: 'vacio' }
  | { tipo: 'epsilon' }
  | { tipo: 'simbolo'; valor: string }
  | { tipo: 'union'; izq: Nodo; der: Nodo }
  | { tipo: 'concat'; izq: Nodo; der: Nodo }
  | { tipo: 'estrella'; hijo: Nodo }

export const VACIO: Nodo = { tipo: 'vacio' }
export const EPSILON_NODO: Nodo = { tipo: 'epsilon' }

export function simbolo(valor: string): Nodo {
  return { tipo: 'simbolo', valor }
}

export function union(izq: Nodo, der: Nodo): Nodo {
  return { tipo: 'union', izq, der }
}

export function concat(izq: Nodo, der: Nodo): Nodo {
  return { tipo: 'concat', izq, der }
}

export function estrella(hijo: Nodo): Nodo {
  return { tipo: 'estrella', hijo }
}

/** Símbolos del alfabeto que aparecen en la expresión, en orden de aparición. */
export function simbolosDe(n: Nodo, acc: string[] = []): string[] {
  switch (n.tipo) {
    case 'simbolo':
      if (!acc.includes(n.valor)) acc.push(n.valor)
      break
    case 'union':
    case 'concat':
      simbolosDe(n.izq, acc)
      simbolosDe(n.der, acc)
      break
    case 'estrella':
      simbolosDe(n.hijo, acc)
      break
  }
  return acc
}

const PRIORIDAD: Record<Nodo['tipo'], number> = {
  vacio: 3,
  epsilon: 3,
  simbolo: 3,
  estrella: 2,
  concat: 1,
  union: 0,
}

/**
 * Vuelve a texto, poniendo paréntesis solo donde hacen falta según las
 * prioridades de la cátedra (* > concatenación > |).
 */
export function imprimir(n: Nodo): string {
  switch (n.tipo) {
    case 'vacio':
      return '∅'
    case 'epsilon':
      return 'ε'
    case 'simbolo':
      return n.valor
    case 'estrella': {
      const dentro = imprimir(n.hijo)
      return PRIORIDAD[n.hijo.tipo] < PRIORIDAD.estrella ? `(${dentro})*` : `${dentro}*`
    }
    case 'concat': {
      const i = envolver(n.izq, PRIORIDAD.concat)
      const d = envolver(n.der, PRIORIDAD.concat + 1)
      return i + d
    }
    case 'union': {
      const i = envolver(n.izq, PRIORIDAD.union)
      const d = envolver(n.der, PRIORIDAD.union + 1)
      return `${i}|${d}`
    }
  }
}

function envolver(n: Nodo, minimo: number): string {
  const s = imprimir(n)
  return PRIORIDAD[n.tipo] < minimo ? `(${s})` : s
}
