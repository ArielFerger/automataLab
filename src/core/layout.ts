/**
 * Posicionado automático de estados.
 *
 * Los autómatas que salen de Thompson o de la construcción de subconjuntos no traen
 * coordenadas, así que hay que ubicarlos antes de dibujarlos. Por capas queda mejor
 * para autómatas con flujo claro (izquierda a derecha); circular para los chicos.
 */

import { type Automata, clonar } from './automaton'

export function disponerCircular(a: Automata, cx = 420, cy = 280, radio = 200): Automata {
  const r = clonar(a)
  const n = r.estados.length
  if (n === 0) return r
  if (n === 1) {
    r.estados[0].x = cx
    r.estados[0].y = cy
    return r
  }
  r.estados.forEach((e, i) => {
    const angulo = (2 * Math.PI * i) / n - Math.PI / 2
    e.x = cx + radio * Math.cos(angulo)
    e.y = cy + radio * Math.sin(angulo)
  })
  return r
}

/** Agrupa los estados por distancia (en cantidad de transiciones) al inicial. */
export function capas(a: Automata): string[][] {
  if (!a.inicial) return a.estados.length ? [a.estados.map((e) => e.id)] : []
  const nivel = new Map<string, number>([[a.inicial, 0]])
  const cola = [a.inicial]
  while (cola.length > 0) {
    const s = cola.shift() as string
    const d = nivel.get(s) as number
    for (const t of a.transiciones) {
      if (t.desde === s && !nivel.has(t.hasta)) {
        nivel.set(t.hasta, d + 1)
        cola.push(t.hasta)
      }
    }
  }
  // Los inalcanzables van a una capa extra al final.
  let maximo = 0
  for (const d of nivel.values()) maximo = Math.max(maximo, d)
  const sueltos = a.estados.filter((e) => !nivel.has(e.id))
  for (const e of sueltos) nivel.set(e.id, maximo + 1)

  const grupos: string[][] = []
  for (const e of a.estados) {
    const d = nivel.get(e.id) as number
    if (!grupos[d]) grupos[d] = []
    grupos[d].push(e.id)
  }
  return grupos.filter(Boolean)
}

export function disponerPorCapas(a: Automata, x0 = 110, y0 = 90, dx = 190, dy = 130): Automata {
  const r = clonar(a)
  const grupos = capas(r)
  const altoMaximo = Math.max(...grupos.map((g) => g.length), 1)
  grupos.forEach((grupo, i) => {
    const desplazamiento = ((altoMaximo - grupo.length) * dy) / 2
    grupo.forEach((id, j) => {
      const e = r.estados.find((s) => s.id === id)
      if (e) {
        e.x = x0 + i * dx
        e.y = y0 + desplazamiento + j * dy
      }
    })
  })
  return r
}

/** Elige la disposición que suele quedar mejor según el tamaño del autómata. */
export function autoDisponer(a: Automata): Automata {
  if (a.estados.length === 0) return clonar(a)
  if (a.estados.length <= 3 || !a.inicial) return disponerCircular(a, 400, 250, 150)
  return disponerPorCapas(a)
}

/** Caja que envuelve a todos los estados, con margen. */
export function limites(a: Automata, margen = 90): { x: number; y: number; ancho: number; alto: number } {
  const xs = a.estados.map((e) => e.x)
  const ys = a.estados.map((e) => e.y)

  // Los cuadros de texto también cuentan: si no, uno puesto al costado del
  // diagrama queda afuera del encuadre y se recorta al exportar la imagen.
  for (const t of a.textos ?? []) {
    const lineas = t.contenido.split('\n')
    const ancho = Math.max(...lineas.map((l) => l.length), 1) * 7.4 + 16
    xs.push(t.x, t.x + ancho)
    ys.push(t.y - 8, t.y + lineas.length * 17 + 4)
  }

  if (xs.length === 0) return { x: 0, y: 0, ancho: 800, alto: 500 }

  const x = Math.min(...xs) - margen
  const y = Math.min(...ys) - margen
  return {
    x,
    y,
    ancho: Math.max(...xs) + margen - x,
    alto: Math.max(...ys) + margen - y,
  }
}
