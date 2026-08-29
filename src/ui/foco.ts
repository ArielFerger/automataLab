import { type Automata, destinos } from '../core/automaton'

/**
 * Lo que el usuario está señalando, sea en el diagrama o en la tabla.
 *
 * El diagrama y la tabla son dos vistas de la misma función de transición, así que
 * apuntar a una resalta la otra. Ese ida y vuelta es lo que hace visible la
 * correspondencia que el parcial pide escribir a mano.
 */
export type Foco =
  | { tipo: 'celda'; desde: string; simbolo: string }
  | { tipo: 'arco'; desde: string; hasta: string }
  | null

/** ¿Está resaltado el manojo de flechas que va de `desde` a `hasta`? */
export function arcoEnFoco(foco: Foco, desde: string, hasta: string, simbolos: string[]): boolean {
  if (!foco) return false
  if (foco.tipo === 'arco') return foco.desde === desde && foco.hasta === hasta
  return foco.desde === desde && simbolos.includes(foco.simbolo)
}

/** ¿Está resaltada la celda (estado, símbolo) de la tabla? */
export function celdaEnFoco(a: Automata, foco: Foco, estado: string, simbolo: string): boolean {
  if (!foco) return false
  if (foco.tipo === 'celda') return foco.desde === estado && foco.simbolo === simbolo
  return foco.desde === estado && destinos(a, estado, simbolo).includes(foco.hasta)
}
