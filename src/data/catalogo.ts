import type { Automata } from '../core/automaton'
import type { Ejercicio } from './tipos'
import { EJERCICIOS, EJERCICIOS_ER } from './banco'
import { FUNCIONAL } from './funcional'

export type Grupo = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
export type Tarea = 'lenguaje' | 'af-er' | 'er-afn' | 'er-minimo' | 'recorrido' | 'lisp'
export interface Actividad {
  id: string
  grupo: Grupo
  numero: number
  titulo: string
  enunciado: string
  tarea: Tarea
  tema: string
  consejo: string
  alfabeto: string[]
  lenguaje?: Ejercicio
  expresion?: string
  automata?: Automata
  soloAutomata?: boolean
}
export const GRUPOS: { id: Grupo; nombre: string; descripcion: string }[] = [
  { id: 'A', nombre: 'Lenguajes', descripcion: 'Construí el autómata y su expresión regular.' },
  { id: 'B', nombre: 'AF → ER', descripcion: 'Diez autómatas del punto A para transformar en ER. Podés cambiar la selección.' },
  { id: 'C', nombre: 'ER → AFN-ε', descripcion: 'Construí el AFN-ε y su tabla de transiciones.' },
  { id: 'D', nombre: 'AFD mínimo', descripcion: 'Transformá cada expresión en un AFD mínimo.' },
  { id: 'E', nombre: 'Integradores', descripcion: 'ER, AFN-ε, AFD y minimización en un mismo ejercicio.' },
  { id: 'F', nombre: 'LISP', descripcion: '54 ejercicios de programación funcional de la práctica 2020.' },
]
export const NOMBRES_TAREA: Record<Tarea, string> = {
  lenguaje: 'Lenguaje → AF + ER', 'af-er': 'Autómata → ER', 'er-afn': 'ER → AFN-ε + tabla',
  'er-minimo': 'ER → AFD mínimo', recorrido: 'Conversión completa', lisp: 'Programación funcional',
}
function temaDe(e: Ejercicio): string {
  const s = e.enunciado.toLowerCase()
  if (/pascal|identificadores|constante|comentarios|formato|reales/.test(s)) return 'Análisis léxico'
  if (/paridad|impar|par de|par\.|múltiplo|cantidad par|cantidad impar/.test(s)) return 'Conteo y paridad'
  if (/palíndrom|forma|cantidad|prefijo|posfijo/.test(s)) return 'Estructura y restricciones'
  if (/longitud/.test(s)) return 'Longitud de cadenas'
  return 'Subcadenas y patrones'
}
export function actividadLenguaje(e: Ejercicio): Actividad {
  return { id: `${e.punto}${e.punto === 'E' ? e.id - 100 : e.id}`, grupo: e.punto as Grupo,
    numero: e.punto === 'E' ? e.id - 100 : e.id, titulo: e.enunciado,
    enunciado: e.enunciado, tarea: e.punto === 'E' ? 'recorrido' : 'lenguaje', tema: temaDe(e), alfabeto: e.alfabeto,
    lenguaje: e, consejo: 'Probá ε, una cadena mínima válida y otra que viole una sola condición. No asumas que todos los lenguajes del banco son regulares.' }
}
export const SELECCION_B = [5, 6, 7, 8, 12, 14, 19, 24, 26, 28]
export function actividadB(numero: number, fuente = SELECCION_B[numero - 1]): Actividad {
  const e = EJERCICIOS.find(e => e.punto === 'A' && e.id === fuente && e.regular) ?? EJERCICIOS.find(e => e.id === SELECCION_B[numero - 1])!
  return { ...actividadLenguaje(e), id: `B${numero}`, grupo: 'B', numero, tarea: 'af-er',
    titulo: `Autómata de A${e.id}`, enunciado: `Convertí a expresión regular el autómata del ejercicio A${e.id}: ${e.enunciado}`,
    consejo: 'Eliminá un estado por vez. Anotá cómo cambian las expresiones de las flechas; verificá al final con cadenas cortas.' }
}
export const ACTIVIDADES: Actividad[] = [
  ...EJERCICIOS.filter(e => e.punto === 'A').map(actividadLenguaje),
  ...SELECCION_B.map((_, i) => actividadB(i + 1)),
  ...EJERCICIOS_ER.map(e => ({ id: `${e.punto}${e.id}`, grupo: e.punto, numero: e.id,
    titulo: e.expresion, expresion: e.expresion, enunciado: `${e.consigna} Expresión: ${e.expresion}`,
    tarea: e.punto === 'C' ? 'er-afn' as const : 'er-minimo' as const, tema: e.punto === 'C' ? 'Thompson y transiciones' : 'Subconjuntos y minimización',
    alfabeto: [], consejo: e.punto === 'C' ? 'Separá unión, concatenación y estrella. Usá ε para conectar fragmentos y revisá la columna ε de la tabla.' : 'Determinizar no es minimizar: quitá estados inaccesibles y comprobá que la partición final sea estable.' })),
  ...EJERCICIOS.filter(e => e.punto === 'E').map(actividadLenguaje),
  ...FUNCIONAL.map(e => ({ ...e, grupo: 'F' as const, titulo: e.enunciado, tarea: 'lisp' as const, alfabeto: [],
    tema: `${e.tema} · Nivel ${e.nivel}`, consejo: 'Escribí el caso base antes del paso recursivo. Probá una lista vacía, un solo elemento y los ejemplos de la consigna. Aclará cómo resolvés los casos ambiguos.' })),
]
