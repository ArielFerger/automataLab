import type { Parcial, ItemParcial } from '../data/parciales'
import { EJERCICIOS, EJERCICIOS_ER } from '../data/banco'
import { type Actividad, actividadLenguaje } from '../data/catalogo'
import { autoDisponer } from './layout'
import { erAMinimo } from './pipeline'
import { eliminacionDeEstados } from './stateElimination'
import { normalizar } from './pipeline'
import { type Borrador, evaluarActividad, vacio } from './actividad'
import { textoRespuesta } from './paraIA'
import { esBorrador } from '../store/useProgreso'

export interface Entrega {
  fecha: string
  alumno: string
  segundos: number
  respuestas: Record<number, Borrador>
  puntos: number
}
export interface SesionExamen {
  alumno: string
  respuestas: Record<number, Borrador>
  acumulado: number
  inicio: number | null
  entrega?: Entrega
  historial: Entrega[]
}
export const sesionNueva = (): SesionExamen => ({ alumno: '', respuestas: {}, acumulado: 0, inicio: null, historial: [] })

export function esSesionExamen(x: unknown): x is SesionExamen {
  if (!x || typeof x !== 'object') return false
  const s = x as SesionExamen
  const respuestasValidas = (r: unknown) => !!r && typeof r === 'object' && !Array.isArray(r) && Object.values(r).every(esBorrador)
  const entregaValida = (e: Entrega) => e && typeof e.alumno === 'string' && typeof e.fecha === 'string' && Number.isFinite(Date.parse(e.fecha)) && Number.isFinite(e.segundos) && e.segundos >= 0 && Number.isFinite(e.puntos) && e.puntos >= 0 && e.puntos <= 100 && respuestasValidas(e.respuestas)
  return typeof s.alumno === 'string' && Number.isFinite(s.acumulado) && s.acumulado >= 0 && (s.inicio === null || (Number.isFinite(s.inicio) && s.inicio > 0)) && respuestasValidas(s.respuestas) && Array.isArray(s.historial) && s.historial.every(entregaValida) && (s.entrega === undefined || entregaValida(s.entrega))
}

export function armarExamen(semilla: number): Parcial {
  let estado = Math.max(1, Math.trunc(semilla)) >>> 0
  const elegir = <T,>(lista: T[]): T => {
    estado = (Math.imul(1664525, estado) + 1013904223) >>> 0
    return lista[estado % lista.length]
  }
  const regulares = EJERCICIOS.filter(e => e.punto === 'A' && e.regular && e.referencia && e.alfabeto.length <= 3 && e.referencia.length < 500)
  const fuente = elegir(regulares)
  const expresion = elegir(EJERCICIOS_ER.filter(e => e.punto === 'D')).expresion
  // El ítem 3 exige AF + ER: un lenguaje no regular sería una consigna imposible.
  const lenguaje = elegir(regulares.filter(e => e.id !== fuente.id))
  return { id: `generado-${semilla}`, titulo: `Simulacro ${semilla}`, items: [
    { numero: 1, puntos: 20, tipo: 'af-a-er', consigna: 'Dado el siguiente autómata, pasar a ER.', automata: autoDisponer(erAMinimo(fuente.referencia!)) },
    { numero: 2, puntos: 60, tipo: 'er-a-afd', consigna: 'Dada la siguiente ER, pasar a autómata determinístico mínimo.', expresion },
    { numero: 3, puntos: 20, tipo: 'lenguaje', consigna: 'Realice un AFD o AFND y una expresión regular para el siguiente lenguaje.', ejercicio: lenguaje },
  ] }
}
export function actividadDeItem(item: ItemParcial): Actividad {
  const base: Actividad = item.ejercicio ? actividadLenguaje(item.ejercicio) : {
    id: `item${item.numero}`, grupo: 'A', numero: item.numero, titulo: item.consigna, enunciado: item.consigna,
    tarea: item.tipo === 'af-a-er' ? 'af-er' : 'er-minimo', tema: 'Parcial', alfabeto: item.automata?.alfabeto ?? [], consejo: '',
  }
  return { ...base, id: `item${item.numero}`, tarea: item.tipo === 'af-a-er' ? 'af-er' : item.tipo === 'er-a-afd' ? 'er-minimo' : 'lenguaje',
    enunciado: [item.consigna, item.expresion ? `Expresión: ${item.expresion}` : '', item.ejercicio?.enunciado].filter(Boolean).join('\n'),
    automata: item.automata,
    expresion: item.expresion ?? (item.automata ? eliminacionDeEstados(normalizar(item.automata)).expresion : undefined),
    soloAutomata: item.tipo === 'lenguaje' && !/expresi[oó]n regular/i.test(item.consigna),
  }
}
export function segundosDe(s: SesionExamen, ahora = Date.now()): number {
  return s.acumulado + (s.inicio ? Math.max(0, Math.floor((ahora - s.inicio) / 1000)) : 0)
}
export function entregar(p: Parcial, s: SesionExamen, ahora = Date.now()): Entrega {
  const respuestas = Object.fromEntries(p.items.map(i => {
    const b = structuredClone(s.respuestas[i.numero] ?? vacio())
    b.resultado = evaluarActividad(actividadDeItem(i), b)
    return [i.numero, b]
  }))
  return { fecha: new Date(ahora).toISOString(), alumno: s.alumno, segundos: segundosDe(s, ahora), respuestas,
    puntos: p.items.reduce((total, i) => total + (respuestas[i.numero].resultado?.veredicto === 'correcto' ? i.puntos : 0), 0) }
}
export function textoExamen(p: Parcial, s: SesionExamen): string {
  const entrega = s.entrega
  return [p.titulo, `Alumno: ${(entrega?.alumno ?? s.alumno) || '(sin nombre)'}`, `Formato: 20 / 60 / 20 puntos`,
    entrega ? `Entrega local: ${entrega.fecha}` : 'BORRADOR SIN ENTREGAR',
    `Tiempo: ${entrega?.segundos ?? segundosDe(s)} segundos`,
    ...p.items.map(i => `${i.numero}. (${i.puntos} puntos)\n${textoRespuesta(actividadDeItem(i), (entrega?.respuestas ?? s.respuestas)[i.numero] ?? vacio())}`),
    entrega ? `Verificación automática: ${entrega.puntos}/100. Puntaje orientativo por resultado y formato; el procedimiento requiere revisión docente o con IA.` : '',
  ].filter(Boolean).join('\n\n')
}
