/**
 * Trazado de los arcos del diagrama de transiciones.
 *
 * Tres casos: bucle sobre el mismo estado (arco por arriba), par de estados con
 * transiciones en los dos sentidos (se curvan para no pisarse) y el caso normal
 * (recta). El punto de la etiqueta se calcula sobre la curva, no aparte, para que
 * siempre caiga encima del arco.
 */

import type { Automata } from './automaton'

export const RADIO = 23
export const RADIO_FINAL = 18
const PUNTA = 9

/** Todas las flechas que van de un estado a otro, con sus símbolos juntos. */
export interface Manojo {
  desde: string
  hasta: string
  simbolos: string[]
  /** desvío perpendicular; distinto de cero cuando también existe la flecha inversa */
  curvatura: number
}

export function agruparTransiciones(a: Automata): Manojo[] {
  const mapa = new Map<string, string[]>()
  for (const t of a.transiciones) {
    const clave = t.desde + '>' + t.hasta
    const lista = mapa.get(clave)
    if (lista) {
      if (!lista.includes(t.simbolo)) lista.push(t.simbolo)
    } else {
      mapa.set(clave, [t.simbolo])
    }
  }
  const manojos: Manojo[] = []
  for (const [clave, simbolos] of mapa) {
    const corte = clave.indexOf('>')
    const desde = clave.slice(0, corte)
    const hasta = clave.slice(corte + 1)
    const hayInverso = desde !== hasta && mapa.has(hasta + '>' + desde)
    manojos.push({ desde, hasta, simbolos, curvatura: hayInverso ? 26 : 0 })
  }
  return manojos
}

export interface Punto {
  x: number
  y: number
}

export interface Arco {
  d: string
  etiqueta: Punto
}

function bezierCuadratica(p0: Punto, c: Punto, p2: Punto): Punto {
  return { x: (p0.x + 2 * c.x + p2.x) / 4, y: (p0.y + 2 * c.y + p2.y) / 4 }
}

function bezierCubica(p0: Punto, c1: Punto, c2: Punto, p3: Punto): Punto {
  return {
    x: (p0.x + 3 * c1.x + 3 * c2.x + p3.x) / 8,
    y: (p0.y + 3 * c1.y + 3 * c2.y + p3.y) / 8,
  }
}

/** Bucle: arco que sale y vuelve al mismo estado, dibujado por encima. */
export function arcoBucle(centro: Punto): Arco {
  const g = (grados: number) => (grados * Math.PI) / 180
  const en = (ang: number, r: number): Punto => ({
    x: centro.x + r * Math.cos(ang),
    y: centro.y + r * Math.sin(ang),
  })
  const p0 = en(g(-140), RADIO)
  const p3 = en(g(-40), RADIO - PUNTA * 0.35)
  const c1 = en(g(-158), RADIO * 2.9)
  const c2 = en(g(-22), RADIO * 2.9)
  const medio = bezierCubica(p0, c1, c2, p3)
  return {
    d: `M ${p0.x} ${p0.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p3.x} ${p3.y}`,
    etiqueta: { x: medio.x, y: medio.y - 8 },
  }
}

/**
 * Arco entre dos estados distintos.
 * `curvatura` es el desvío perpendicular en píxeles: 0 deja la recta.
 */
export function arcoEntre(a: Punto, b: Punto, curvatura: number): Arco {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const largo = Math.hypot(dx, dy) || 1
  const ux = dx / largo
  const uy = dy / largo
  // perpendicular
  const px = -uy
  const py = ux

  const inicio: Punto = { x: a.x + ux * RADIO, y: a.y + uy * RADIO }
  const fin: Punto = { x: b.x - ux * (RADIO + PUNTA * 0.4), y: b.y - uy * (RADIO + PUNTA * 0.4) }

  if (curvatura === 0) {
    const medio = { x: (inicio.x + fin.x) / 2, y: (inicio.y + fin.y) / 2 }
    return {
      d: `M ${inicio.x} ${inicio.y} L ${fin.x} ${fin.y}`,
      etiqueta: { x: medio.x + px * 12, y: medio.y + py * 12 },
    }
  }

  const control: Punto = {
    x: (a.x + b.x) / 2 + px * curvatura * 2,
    y: (a.y + b.y) / 2 + py * curvatura * 2,
  }
  // Recalcular los extremos apuntando al control, así la flecha entra derecha.
  const haciaControl = (desde: Punto, hacia: Punto, r: number): Punto => {
    const l = Math.hypot(hacia.x - desde.x, hacia.y - desde.y) || 1
    return { x: desde.x + ((hacia.x - desde.x) / l) * r, y: desde.y + ((hacia.y - desde.y) / l) * r }
  }
  const i2 = haciaControl(a, control, RADIO)
  const f2 = haciaControl(b, control, RADIO + PUNTA * 0.4)
  const medio = bezierCuadratica(i2, control, f2)
  return {
    d: `M ${i2.x} ${i2.y} Q ${control.x} ${control.y} ${f2.x} ${f2.y}`,
    etiqueta: { x: medio.x + px * (curvatura > 0 ? 11 : -11), y: medio.y + py * (curvatura > 0 ? 11 : -11) },
  }
}

/** Flecha suelta que marca el estado inicial (viene desde la izquierda). */
export function flechaInicial(centro: Punto): string {
  const x = centro.x - RADIO
  return `M ${x - 30} ${centro.y} L ${x - 2} ${centro.y}`
}
