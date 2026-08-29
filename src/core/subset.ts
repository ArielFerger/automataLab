/**
 * Transformación de AFN-ε a AFD: construcción de subconjuntos.
 *
 * Es el algoritmo de la Parte 3, tal cual: el estado inicial del AFD es la
 * ε-clausura del inicial del AFN, y cada estado "no tratado" se expande con
 * U := ε-clausura(mueve(T, a)) para cada símbolo del alfabeto.
 */

import { type Automata, epsilonClausura, mueve, nombreDe } from './automaton'
import { disponerPorCapas } from './layout'

export interface DestinoSubconjunto {
  /** nombre del estado del AFD al que se llega (A, B, C, …) */
  nombre: string
  /** mueve(T, a), antes de la ε-clausura */
  mueve: string
  /** ε-clausura(mueve(T, a)), que es el conjunto resultante */
  clausura: string
}

export interface FilaSubconjuntos {
  nombre: string
  /** el conjunto de estados del AFN, escrito con llaves */
  conjunto: string
  ids: string[]
  esInicial: boolean
  esFinal: boolean
  destinos: Record<string, DestinoSubconjunto>
}

export interface ResultadoSubconjuntos {
  afd: Automata
  filas: FilaSubconjuntos[]
  /** true si hizo falta el conjunto vacío como estado trampa */
  usaVacio: boolean
}

/** A, B, …, Z, A1, B1, … para nombrar los estados del AFD. */
function nombrePorIndice(i: number): string {
  const letra = String.fromCharCode(65 + (i % 26))
  const vuelta = Math.floor(i / 26)
  return vuelta === 0 ? letra : letra + vuelta
}

function comoConjunto(a: Automata, ids: string[]): string {
  if (ids.length === 0) return '∅'
  return '{' + ids.map((id) => nombreDe(a, id)).join(', ') + '}'
}

export function subconjuntos(afn: Automata): ResultadoSubconjuntos {
  // El orden de los ids sigue el orden de los estados del AFN, para que los
  // conjuntos se escriban siempre igual y sean comparables como clave.
  const orden = new Map(afn.estados.map((e, i) => [e.id, i]))
  const ordenar = (ids: Iterable<string>) =>
    [...ids].sort((x, y) => (orden.get(x) ?? 0) - (orden.get(y) ?? 0))
  const clave = (ids: string[]) => ids.join('|')

  const inicial = ordenar(epsilonClausura(afn, afn.inicial ? [afn.inicial] : []))
  const porClave = new Map<string, { nombre: string; ids: string[] }>()
  const filas: FilaSubconjuntos[] = []
  const pendientes: string[][] = []
  let usaVacio = false

  function registrar(ids: string[]): string {
    const k = clave(ids)
    const ya = porClave.get(k)
    if (ya) return ya.nombre
    const nombre = ids.length === 0 ? '∅' : nombrePorIndice(porClave.size)
    if (ids.length === 0) usaVacio = true
    porClave.set(k, { nombre, ids })
    pendientes.push(ids)
    return nombre
  }

  registrar(inicial)

  while (pendientes.length > 0) {
    const T = pendientes.shift() as string[]
    const entrada = porClave.get(clave(T))
    if (!entrada) continue

    const destinos: Record<string, DestinoSubconjunto> = {}
    for (const a of afn.alfabeto) {
      const m = ordenar(mueve(afn, T, a))
      const U = ordenar(epsilonClausura(afn, m))
      destinos[a] = {
        nombre: registrar(U),
        mueve: comoConjunto(afn, m),
        clausura: comoConjunto(afn, U),
      }
    }

    filas.push({
      nombre: entrada.nombre,
      conjunto: comoConjunto(afn, T),
      ids: T,
      esInicial: clave(T) === clave(inicial),
      // Es final el conjunto que contenga al menos un estado final del AFN.
      esFinal: T.some((id) => afn.finales.includes(id)),
      destinos,
    })
  }

  // El conjunto vacío se trata al final para que quede como última fila.
  filas.sort((x, y) => (x.nombre === '∅' ? 1 : y.nombre === '∅' ? -1 : 0))

  const afd = disponerPorCapas({
    estados: filas.map((f) => ({ id: f.nombre, nombre: f.nombre, x: 0, y: 0 })),
    alfabeto: [...afn.alfabeto],
    transiciones: filas.flatMap((f) =>
      afn.alfabeto.map((a) => ({ desde: f.nombre, hasta: f.destinos[a].nombre, simbolo: a })),
    ),
    inicial: filas.find((f) => f.esInicial)?.nombre ?? '',
    finales: filas.filter((f) => f.esFinal).map((f) => f.nombre),
  })

  return { afd, filas, usaVacio }
}
