/**
 * Transformación de AF a ER por eliminación de estados.
 *
 * Es el procedimiento de la Parte 2: se sacan los estados muertos, se agrega un
 * inicial y un final nuevos unidos con ε, se unifican las transiciones paralelas
 * en (r1|r2) y se van eliminando los estados intermedios, reemplazando cada uno
 * por las transiciones αᵢ β* γⱼ. Al final queda una sola transición del inicial al
 * final, y su etiqueta es la expresión regular buscada.
 */

import { type Automata, EPSILON, quitarMuertos } from './automaton'
import { disponerPorCapas } from './layout'
import { type Nodo, EPSILON_NODO, VACIO, concat, estrella, imprimir, simbolo, union } from './regex/ast'

export interface PasoEliminacion {
  /** nombre del estado que se eliminó en este paso ('' en el estado de partida) */
  eliminado: string
  titulo: string
  /** el autómata generalizado tras el paso: las etiquetas son expresiones regulares */
  automata: Automata
}

export interface ResultadoEliminacion {
  expresion: string
  nodo: Nodo
  pasos: PasoEliminacion[]
  /** el orden en que se eliminaron los estados */
  orden: string[]
}

type Aristas = Map<string, Map<string, Nodo>>

function obtener(aristas: Aristas, desde: string, hasta: string): Nodo | undefined {
  return aristas.get(desde)?.get(hasta)
}

function poner(aristas: Aristas, desde: string, hasta: string, n: Nodo) {
  let fila = aristas.get(desde)
  if (!fila) {
    fila = new Map()
    aristas.set(desde, fila)
  }
  fila.set(hasta, n)
}

/** Une con la etiqueta que ya hubiera: es el paso "transiciones paralelas → (r1|r2)". */
function unir(aristas: Aristas, desde: string, hasta: string, n: Nodo) {
  const previo = obtener(aristas, desde, hasta)
  poner(aristas, desde, hasta, previo ? simplificar(union(previo, n)) : simplificar(n))
}

export function eliminacionDeEstados(entrada: Automata, ordenPedido?: string[]): ResultadoEliminacion {
  const base = quitarMuertos(entrada)
  const nombres = new Map(base.estados.map((e) => [e.id, e.nombre]))

  const INICIO = '__i'
  const FIN = '__f'
  nombres.set(INICIO, 'i')
  nombres.set(FIN, 'f')

  const aristas: Aristas = new Map()
  for (const t of base.transiciones) {
    unir(aristas, t.desde, t.hasta, t.simbolo === EPSILON ? EPSILON_NODO : simbolo(t.simbolo))
  }
  if (base.inicial) unir(aristas, INICIO, base.inicial, EPSILON_NODO)
  for (const f of base.finales) unir(aristas, f, FIN, EPSILON_NODO)

  let vivos = [INICIO, ...base.estados.map((e) => e.id), FIN]
  const pasos: PasoEliminacion[] = [
    {
      eliminado: '',
      titulo: 'Se agregan un inicial y un final nuevos, unidos con ε, y se unifican las transiciones paralelas.',
      automata: dibujar(aristas, vivos, nombres, INICIO, FIN),
    },
  ]

  const intermedios = base.estados.map((e) => e.id)
  const orden = ordenPedido
    ? ordenPedido.filter((id) => intermedios.includes(id))
    : ordenarPorCosto(aristas, intermedios)
  // Cualquier intermedio que el orden pedido no mencione se elimina igual, al final.
  for (const id of intermedios) if (!orden.includes(id)) orden.push(id)

  for (const t of orden) {
    const entrantes = vivos.filter((q) => q !== t && obtener(aristas, q, t))
    const salientes = vivos.filter((p) => p !== t && obtener(aristas, t, p))
    const bucle = obtener(aristas, t, t)

    for (const q of entrantes) {
      const alfa = obtener(aristas, q, t) as Nodo
      for (const p of salientes) {
        const gama = obtener(aristas, t, p) as Nodo
        const medio = bucle ? concat(concat(alfa, estrella(bucle)), gama) : concat(alfa, gama)
        unir(aristas, q, p, simplificar(medio))
      }
    }

    // Se borran las aristas que tocaban al estado eliminado.
    aristas.delete(t)
    for (const fila of aristas.values()) fila.delete(t)
    vivos = vivos.filter((id) => id !== t)

    pasos.push({
      eliminado: nombres.get(t) ?? t,
      titulo: 'Se elimina ' + (nombres.get(t) ?? t) + ' y se reemplaza por las transiciones α β* γ.',
      automata: dibujar(aristas, vivos, nombres, INICIO, FIN),
    })
  }

  const nodo = simplificar(obtener(aristas, INICIO, FIN) ?? VACIO)
  return { expresion: imprimir(nodo), nodo, pasos, orden: orden.map((id) => nombres.get(id) ?? id) }
}

/** Heurística: primero los estados que generan menos transiciones nuevas. */
function ordenarPorCosto(aristas: Aristas, intermedios: string[]): string[] {
  const costo = (t: string) => {
    let entra = 0
    let sale = 0
    for (const [desde, fila] of aristas) {
      for (const hasta of fila.keys()) {
        if (hasta === t && desde !== t) entra++
        if (desde === t && hasta !== t) sale++
      }
    }
    return entra * sale
  }
  return [...intermedios].sort((a, b) => costo(a) - costo(b))
}

function dibujar(
  aristas: Aristas,
  vivos: string[],
  nombres: Map<string, string>,
  inicial: string,
  final: string,
): Automata {
  const transiciones: { desde: string; hasta: string; simbolo: string }[] = []
  for (const desde of vivos) {
    const fila = aristas.get(desde)
    if (!fila) continue
    for (const [hasta, n] of fila) {
      if (vivos.includes(hasta)) transiciones.push({ desde, hasta, simbolo: imprimir(n) })
    }
  }
  return disponerPorCapas({
    estados: vivos.map((id) => ({ id, nombre: nombres.get(id) ?? id, x: 0, y: 0 })),
    alfabeto: [],
    transiciones,
    inicial,
    finales: [final],
  })
}

/**
 * Si la expresión ya vale ε junto con una clausura — x*, xx* o x*x — devuelve esa
 * clausura, porque unirla con ε no agrega nada. Si no, devuelve null.
 */
function comoClausura(n: Nodo): Nodo | null {
  if (n.tipo === 'estrella') return n
  if (n.tipo === 'concat') {
    const { izq, der } = n
    if (der.tipo === 'estrella' && imprimir(der.hijo) === imprimir(izq)) return der
    if (izq.tipo === 'estrella' && imprimir(izq.hijo) === imprimir(der)) return izq
  }
  return null
}

/**
 * Simplificaciones algebraicas básicas. Sin esto la expresión que sale de la
 * eliminación queda ilegible, llena de ε y de ∅ que no aportan nada.
 */
export function simplificar(n: Nodo): Nodo {
  switch (n.tipo) {
    case 'estrella': {
      const h = simplificar(n.hijo)
      // ε* = ε y ∅* = ε: en los dos casos solo se reconoce la cadena vacía.
      if (h.tipo === 'epsilon' || h.tipo === 'vacio') return EPSILON_NODO
      if (h.tipo === 'estrella') return h
      return estrella(h)
    }
    case 'concat': {
      const i = simplificar(n.izq)
      const d = simplificar(n.der)
      if (i.tipo === 'vacio' || d.tipo === 'vacio') return VACIO
      if (i.tipo === 'epsilon') return d
      if (d.tipo === 'epsilon') return i
      return concat(i, d)
    }
    case 'union': {
      const i = simplificar(n.izq)
      const d = simplificar(n.der)
      if (i.tipo === 'vacio') return d
      if (d.tipo === 'vacio') return i
      if (imprimir(i) === imprimir(d)) return i
      // ε|x* = x* y ε|xx* = x*, que es la forma en que suele quedar la clausura
      // después de eliminar un estado con bucle. Sin esto la ER queda más larga
      // de lo necesario y no se parece a la que uno escribiría a mano.
      if (i.tipo === 'epsilon') {
        const s = comoClausura(d)
        if (s) return s
      }
      if (d.tipo === 'epsilon') {
        const s = comoClausura(i)
        if (s) return s
      }
      return union(i, d)
    }
    default:
      return n
  }
}
