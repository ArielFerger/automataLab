import type { Automata } from '../core/automaton'
import { cuenta } from './ayuda'
import { REFERENCIAS } from './referencias'
import type { Ejercicio } from './tipos'

/**
 * Los parciales tomados, con la estructura que se repite en los cuatro:
 * 20 puntos de AF → ER, 60 de ER → AFD mínimo y 20 de lenguaje → AFD/AFND + ER.
 *
 * Los enunciados de 2023 salen del PDF de la cátedra; los de 2025, de las fotos
 * del examen. En los cuatro casos el autómata del ítem 1 está solo como dibujo:
 * los de 2023 no se pudieron extraer del PDF y los de 2025 son manuscritos, así
 * que la transcripción que va acá está marcada como "a revisar" — conviene
 * compararla con la foto antes de darla por buena.
 */

export type TipoItem = 'af-a-er' | 'er-a-afd' | 'lenguaje'

export interface ItemParcial {
  numero: number
  puntos: number
  tipo: TipoItem
  consigna: string
  /** para el ítem 2: la expresión regular de la que hay que partir */
  expresion?: string
  /** para el ítem 1: el autómata que hay que pasar a ER */
  automata?: Automata
  /** true si el autómata es una transcripción de una foto y hay que verificarlo */
  transcripcion?: boolean
  /** para el ítem 3: el lenguaje, con su referencia para poder corregir */
  ejercicio?: Ejercicio
  /** cuando no se pudo recuperar el dibujo del examen */
  faltaDibujo?: string
}

export interface Parcial {
  id: string
  titulo: string
  items: ItemParcial[]
}

function af(
  estados: string[],
  inicial: string,
  finales: string[],
  transiciones: [string, string, string][],
  alfabeto: string[],
): Automata {
  return {
    estados: estados.map((n, i) => ({ id: n, nombre: n, x: 140 + (i % 2) * 260, y: 110 + Math.floor(i / 2) * 190 })),
    alfabeto,
    transiciones: transiciones.map(([desde, simbolo, hasta]) => ({ desde, hasta, simbolo })),
    inicial,
    finales,
  }
}

/** Ítem 3 del parcial 2023: identificadores sobre {M, N, D, o}. */
const IDENTIFICADORES_2023: Ejercicio = {
  id: 201,
  punto: 'A',
  enunciado:
    'Identificadores sobre {M, N, D, o} que comienzan con mayúscula, pueden contener dígitos o letras mayúsculas o minúsculas, y finalizan con mayúscula. Como mínimo tienen que tener longitud 2. Ejemplos: AA, A5A, HolaS, WoOUuW.',
  alfabeto: ['M', 'N', 'D', 'o'],
  convencion: 'M = mayúscula, N = minúscula, D = dígito, o = otro.',
  regular: true,
  predicado: (w) => /^M[MND]*M$/.test(w),
}

/** Ítem 3 del recuperatorio 2023: el mismo lenguaje que el ejercicio 80 del punto A. */
const SIN_ABBA_NI_BAAB: Ejercicio = {
  id: 202,
  punto: 'A',
  enunciado: 'Conjunto de cadenas sobre {a, b} que no contengan ni abba, ni baab.',
  alfabeto: ['a', 'b'],
  regular: true,
  predicado: (w) => !w.includes('abba') && !w.includes('baab'),
}

/** Ítem 3 del parcial 2025. */
const EMPIEZAN_01_O_2: Ejercicio = {
  id: 203,
  punto: 'A',
  enunciado:
    'Todas las cadenas sobre {0, 1, 2} que comiencen con 01 o 2, y contengan cantidad par de 2. Ejemplos: 01001, 22, 201021.',
  alfabeto: ['0', '1', '2'],
  regular: true,
  predicado: (w) => (w.startsWith('01') || w.startsWith('2')) && cuenta(w, '2') % 2 === 0,
  nota: 'En la foto hay un cuarto ejemplo que se lee borroso y no encaja con el enunciado; los otros tres sí. Conviene chequearlo contra el original.',
}

/** Ítem 3 del recuperatorio 2025. */
const TERMINAN_0_O_2: Ejercicio = {
  id: 204,
  punto: 'A',
  enunciado:
    'Todas las cadenas sobre {0, 1, 2} que finalicen con 0 o 2, y contengan cantidad par de 1. Ejemplos: 0, 2, 01212, 2112, 110.',
  alfabeto: ['0', '1', '2'],
  regular: true,
  predicado: (w) => (w.endsWith('0') || w.endsWith('2')) && cuenta(w, '1') % 2 === 0,
}

function conRef(e: Ejercicio): Ejercicio {
  return { ...e, referencia: e.referencia ?? REFERENCIAS[e.id] }
}

/** Los lenguajes que aparecieron como ítem 3 en los parciales. */
export const LENGUAJES_DE_PARCIAL: Ejercicio[] = [
  IDENTIFICADORES_2023,
  SIN_ABBA_NI_BAAB,
  EMPIEZAN_01_O_2,
  TERMINAN_0_O_2,
]

export const PARCIALES: Parcial[] = [
  {
    id: 'parcial-2023',
    titulo: 'Parcial 2023',
    items: [
      {
        numero: 1,
        puntos: 20,
        tipo: 'af-a-er',
        consigna: 'Dado el siguiente autómata, pasar a ER.',
        faltaDibujo:
          'El autómata está solo como imagen dentro del PDF del parcial y no se pudo transcribir. Abrí Practica_I_-_AutomatasER junto con el PDF del examen, dibujalo en el editor y usá la pestaña Conversiones para verificar tu ER.',
      },
      {
        numero: 2,
        puntos: 60,
        tipo: 'er-a-afd',
        consigna: 'Dada la siguiente ER, pasar a autómata determinístico mínimo.',
        expresion: 'b (a* | b) | a',
      },
      {
        numero: 3,
        puntos: 20,
        tipo: 'lenguaje',
        consigna: 'Realice un AFD o AFND y una expresión regular para el siguiente lenguaje.',
        ejercicio: conRef(IDENTIFICADORES_2023),
      },
    ],
  },
  {
    id: 'recuperatorio-2023',
    titulo: 'Recuperatorio 2023',
    items: [
      {
        numero: 1,
        puntos: 20,
        tipo: 'af-a-er',
        consigna: 'Dado el siguiente autómata, pasar a ER.',
        faltaDibujo:
          'El autómata está solo como imagen dentro del PDF del recuperatorio. Dibujalo en el editor y verificá tu ER desde la pestaña Conversiones.',
      },
      {
        numero: 2,
        puntos: 60,
        tipo: 'er-a-afd',
        consigna: 'Dada la siguiente ER, pasar a autómata determinístico mínimo.',
        expresion: '(a* | b*) | ab*',
      },
      {
        numero: 3,
        puntos: 20,
        tipo: 'lenguaje',
        consigna: 'Realice un AFD o AFND para el siguiente lenguaje.',
        ejercicio: conRef(SIN_ABBA_NI_BAAB),
      },
    ],
  },
  {
    id: 'parcial-2025',
    titulo: 'Parcial 2025',
    items: [
      {
        numero: 1,
        puntos: 20,
        tipo: 'af-a-er',
        consigna: 'Dado el siguiente autómata, pasar a ER.',
        transcripcion: true,
        automata: af(
          ['q0', 'q1', 'q2', 'q3'],
          'q0',
          ['q1', 'q2'],
          [
            ['q0', 'a', 'q1'],
            ['q0', 'b', 'q2'],
            ['q1', 'b', 'q2'],
            ['q2', 'a', 'q1'],
            ['q1', 'a', 'q3'],
            ['q2', 'b', 'q3'],
            ['q3', 'a', 'q3'],
            ['q3', 'b', 'q3'],
          ],
          ['a', 'b'],
        ),
      },
      {
        numero: 2,
        puntos: 60,
        tipo: 'er-a-afd',
        consigna: 'Dada la siguiente ER, pasar a autómata determinístico mínimo.',
        expresion: '(nn*) (k|n) n*',
      },
      {
        numero: 3,
        puntos: 20,
        tipo: 'lenguaje',
        consigna: 'Realice un AFD o AFND y una expresión regular para el siguiente lenguaje.',
        ejercicio: conRef(EMPIEZAN_01_O_2),
      },
    ],
  },
  {
    id: 'recuperatorio-2025',
    titulo: 'Recuperatorio 2025',
    items: [
      {
        numero: 1,
        puntos: 20,
        tipo: 'af-a-er',
        consigna: 'Dado el siguiente autómata, pasar a ER.',
        transcripcion: true,
        automata: af(
          ['q0', 'q1', 'q2', 'q3'],
          'q0',
          ['q1', 'q2'],
          [
            ['q0', 'a', 'q1'],
            ['q1', 'a', 'q0'],
            ['q0', 'b', 'q2'],
            ['q2', 'b', 'q0'],
            ['q0', 'c', 'q3'],
            ['q1', 'c', 'q3'],
            ['q2', 'c', 'q3'],
            ['q1', 'b', 'q2'],
            ['q2', 'a', 'q1'],
            ['q3', 'a', 'q3'],
            ['q3', 'b', 'q3'],
            ['q3', 'c', 'q3'],
          ],
          ['a', 'b', 'c'],
        ),
      },
      {
        numero: 2,
        puntos: 60,
        tipo: 'er-a-afd',
        consigna: 'Dada la siguiente ER, pasar a autómata determinístico mínimo.',
        expresion: 'ab*(a|b|ε)',
      },
      {
        numero: 3,
        puntos: 20,
        tipo: 'lenguaje',
        consigna: 'Realice un AFD o AFND para el siguiente lenguaje.',
        ejercicio: conRef(TERMINAN_0_O_2),
      },
    ],
  },
]
