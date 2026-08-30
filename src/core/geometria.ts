/**
 * Trazado de los arcos del diagrama de transiciones.
 *
 * Tres casos: bucle sobre el mismo estado (arco alrededor del nodo), par de
 * estados con transiciones en los dos sentidos (se curvan para no pisarse) y el
 * caso normal (recta). El punto de la etiqueta se calcula sobre la curva, no
 * aparte, para que siempre caiga encima del arco.
 *
 * La curvatura de cada manojo se puede fijar a mano: si el autómata trae un valor
 * en `curvas` se usa ese, y si no se calcula uno automático.
 */

import { type Automata, claveArco } from './automaton'

export const RADIO = 23
export const RADIO_FINAL = 18
const PUNTA = 9

/** Ángulo por omisión del bucle: arriba del estado. */
export const ANGULO_BUCLE = -90
/** Separación por omisión cuando dos estados se apuntan mutuamente. */
export const CURVA_DOBLE = 26

/** Todas las flechas que van de un estado a otro, con sus símbolos juntos. */
export interface Manojo {
  desde: string
  hasta: string
  simbolos: string[]
  /**
   * En un bucle, el ángulo en grados donde se apoya. En el resto, el desvío
   * perpendicular respecto de la recta que une los dos estados.
   */
  curvatura: number
  /** true si el valor lo eligió la persona y no el cálculo automático */
  aMano: boolean
}

export function agruparTransiciones(a: Automata): Manojo[] {
  const mapa = new Map<string, string[]>()
  for (const t of a.transiciones) {
    const clave = claveArco(t.desde, t.hasta)
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
    const elegida = a.curvas?.[clave]
    manojos.push({
      desde,
      hasta,
      simbolos,
      curvatura: elegida ?? curvaturaAutomatica(mapa, desde, hasta),
      aMano: elegida !== undefined,
    })
  }
  return manojos
}

function curvaturaAutomatica(mapa: Map<string, string[]>, desde: string, hasta: string): number {
  if (desde === hasta) return ANGULO_BUCLE
  // Si también existe el arco inverso, los dos se curvan para no superponerse.
  return mapa.has(claveArco(hasta, desde)) ? CURVA_DOBLE : 0
}

export interface Punto {
  x: number
  y: number
}

export interface Arco {
  d: string
  etiqueta: Punto
  /** dónde nace la flecha, sobre el borde del estado de origen */
  inicio: Punto
  /** dónde termina la punta, sobre el borde del estado de destino */
  fin: Punto
  /** el punto más alejado de la recta: de ahí se agarra para curvarla */
  vertice: Punto
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

/**
 * Bucle: arco que sale y vuelve al mismo estado.
 * `angulo` (en grados) dice de qué lado del estado se apoya.
 */
export function arcoBucle(centro: Punto, angulo: number = ANGULO_BUCLE): Arco {
  const g = (grados: number) => (grados * Math.PI) / 180
  const en = (ang: number, r: number): Punto => ({
    x: centro.x + r * Math.cos(ang),
    y: centro.y + r * Math.sin(ang),
  })
  const p0 = en(g(angulo - 50), RADIO)
  const p3 = en(g(angulo + 50), RADIO - PUNTA * 0.35)
  const c1 = en(g(angulo - 68), RADIO * 2.9)
  const c2 = en(g(angulo + 68), RADIO * 2.9)
  const medio = bezierCubica(p0, c1, c2, p3)
  // La etiqueta se corre un poco más lejos del nodo, en la misma dirección.
  const fuera = en(g(angulo), 1)
  const dx = fuera.x - centro.x
  const dy = fuera.y - centro.y
  return {
    d: `M ${p0.x} ${p0.y} C ${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p3.x} ${p3.y}`,
    etiqueta: { x: medio.x + dx * 10, y: medio.y + dy * 10 },
    inicio: p0,
    fin: p3,
    vertice: medio,
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

  if (Math.abs(curvatura) < 0.5) {
    const medio = { x: (inicio.x + fin.x) / 2, y: (inicio.y + fin.y) / 2 }
    return {
      d: `M ${inicio.x} ${inicio.y} L ${fin.x} ${fin.y}`,
      etiqueta: { x: medio.x + px * 12, y: medio.y + py * 12 },
      inicio,
      fin,
      vertice: medio,
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
  const lado = curvatura > 0 ? 11 : -11
  return {
    d: `M ${i2.x} ${i2.y} Q ${control.x} ${control.y} ${f2.x} ${f2.y}`,
    etiqueta: { x: medio.x + px * lado, y: medio.y + py * lado },
    inicio: i2,
    fin: f2,
    vertice: medio,
  }
}

/**
 * Curvatura que hace que el arco pase por `punto`.
 *
 * Es la inversa de `arcoEntre`: el vértice de la curva queda a `curvatura`
 * píxeles de la recta, medido en perpendicular, así que la flecha sigue al dedo
 * o al mouse mientras se la arrastra.
 */
export function curvaturaHacia(a: Punto, b: Punto, punto: Punto): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const largo = Math.hypot(dx, dy) || 1
  const px = -dy / largo
  const py = dx / largo
  const mx = (a.x + b.x) / 2
  const my = (a.y + b.y) / 2
  return (punto.x - mx) * px + (punto.y - my) * py
}

/** Ángulo, en grados, al que hay que llevar un bucle para que apunte a `punto`. */
export function anguloHacia(centro: Punto, punto: Punto): number {
  return (Math.atan2(punto.y - centro.y, punto.x - centro.x) * 180) / Math.PI
}

/** Flecha suelta que marca el estado inicial (viene desde la izquierda). */
export function flechaInicial(centro: Punto): string {
  const x = centro.x - RADIO
  return `M ${x - 30} ${centro.y} L ${x - 2} ${centro.y}`
}
