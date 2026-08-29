/**
 * Minimización de un AFD por refinamiento de particiones.
 *
 * Sigue el algoritmo de la Parte 3: P1 separa finales de no finales (son
 * distinguibles mediante ε) y cada partición siguiente subdivide los grupos cuyos
 * estados van a parar a grupos distintos con algún símbolo. Cuando la partición
 * deja de cambiar, se elige un representante por grupo.
 */

import {
  type Automata,
  clonar,
  completar,
  destinos,
  esCompleto,
  nombreDe,
  quitarInalcanzables,
} from './automaton'
import { disponerPorCapas } from './layout'

export interface Grupo {
  nombre: string
  /** nombres de los estados del AFD de entrada */
  estados: string[]
  ids: string[]
  /** por qué se separó del grupo del que venía (vacío en P1) */
  motivo?: string
}

export interface Particion {
  indice: number
  grupos: Grupo[]
}

export interface ResultadoMinimizacion {
  minimo: Automata
  /** el AFD de entrada ya completado y podado, que es sobre el que se trabaja */
  preparado: Automata
  particiones: Particion[]
  seCompleto: boolean
  quitoInalcanzables: boolean
}

export function minimizar(entrada: Automata): ResultadoMinimizacion {
  const podado = quitarInalcanzables(entrada)
  const quitoInalcanzables = podado.estados.length !== entrada.estados.length
  const seCompleto = !esCompleto(podado)
  const a = completar(podado)

  const ids = a.estados.map((e) => e.id)
  const finales = new Set(a.finales)

  // P1: los finales por un lado, los no finales por el otro.
  let grupos: string[][] = [ids.filter((id) => finales.has(id)), ids.filter((id) => !finales.has(id))].filter(
    (g) => g.length > 0,
  )
  const particiones: Particion[] = [aParticion(a, 1, grupos, [])]

  for (let vuelta = 2; ; vuelta++) {
    const indiceDe = new Map<string, number>()
    grupos.forEach((g, i) => g.forEach((id) => indiceDe.set(id, i)))

    const nuevos: string[][] = []
    const motivos: (string | undefined)[] = []

    for (const g of grupos) {
      // Dos estados quedan juntos si con todos los símbolos van al mismo grupo.
      const porFirma = new Map<string, string[]>()
      for (const id of g) {
        const firma = a.alfabeto.map((s) => indiceDe.get(destinos(a, id, s)[0] ?? '') ?? -1).join(',')
        const lista = porFirma.get(firma)
        if (lista) lista.push(id)
        else porFirma.set(firma, [id])
      }

      if (porFirma.size === 1) {
        nuevos.push(g)
        motivos.push(undefined)
        continue
      }

      const simbolo = simboloQueSepara(a, g, indiceDe)
      for (const sub of porFirma.values()) {
        nuevos.push(sub)
        motivos.push(simbolo ? 'se separó por ' + simbolo : 'se separó')
      }
    }

    const cambio = nuevos.length !== grupos.length
    grupos = nuevos
    particiones.push(aParticion(a, vuelta, grupos, motivos))
    // La última partición repetida es la señal de corte del algoritmo.
    if (!cambio) break
  }

  const ultima = particiones[particiones.length - 1]
  const grupoDe = new Map<string, Grupo>()
  for (const g of ultima.grupos) for (const id of g.ids) grupoDe.set(id, g)

  // Un representante por grupo: el primero, que conserva su nombre original.
  const representante = new Map<Grupo, string>()
  for (const g of ultima.grupos) representante.set(g, g.ids[0])

  const minimo = disponerPorCapas({
    estados: ultima.grupos.map((g) => ({
      id: representante.get(g) as string,
      nombre: g.estados.join('') || nombreDe(a, g.ids[0]),
      x: 0,
      y: 0,
    })),
    alfabeto: [...a.alfabeto],
    transiciones: ultima.grupos.flatMap((g) =>
      a.alfabeto.map((s) => {
        const destino = destinos(a, g.ids[0], s)[0]
        const grupoDestino = grupoDe.get(destino)
        return {
          desde: representante.get(g) as string,
          hasta: grupoDestino ? (representante.get(grupoDestino) as string) : '',
          simbolo: s,
        }
      }),
    ),
    // Un autómata dibujado a medias puede no tener inicial todavía; ahí el mínimo
    // sale sin inicial en vez de romperse.
    inicial: representante.get(grupoDe.get(a.inicial) as Grupo) ?? '',
    finales: ultima.grupos.filter((g) => g.ids.some((id) => finales.has(id))).map((g) => representante.get(g) as string),
  })

  return { minimo, preparado: clonar(a), particiones, seCompleto, quitoInalcanzables }
}

function aParticion(a: Automata, indice: number, grupos: string[][], motivos: (string | undefined)[]): Particion {
  return {
    indice,
    grupos: grupos.map((g, i) => ({
      nombre: 'G' + (i + 1),
      estados: g.map((id) => nombreDe(a, id)),
      ids: [...g],
      motivo: motivos[i],
    })),
  }
}

/** El primer símbolo con el que dos estados del grupo se van a grupos distintos. */
function simboloQueSepara(a: Automata, grupo: string[], indiceDe: Map<string, number>): string | null {
  for (const s of a.alfabeto) {
    const vistos = new Set(grupo.map((id) => indiceDe.get(destinos(a, id, s)[0] ?? '') ?? -1))
    if (vistos.size > 1) return s
  }
  return null
}
