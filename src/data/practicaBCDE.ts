import type { Ejercicio } from './tipos'

/**
 * Puntos B, C, D y E de la práctica.
 *
 * B pide tomar diez autómatas del punto A y pasarlos a ER; se resuelve desde la
 * pestaña Conversiones con cualquier ejercicio, así que no necesita datos propios.
 */

export interface EjercicioExpresion {
  id: number
  punto: 'C' | 'D'
  expresion: string
  consigna: string
}

/** Punto C: transformar en AFN-ε y graficar la tabla de transiciones. */
export const PRACTICA_C: EjercicioExpresion[] = [
  '0 (0 | 1) * 0',
  '(( | 0 ) 1 *)*',
  '( c* )*',
  '0* 1 0* 1 0* 1 0*',
  'a* (b | c )*',
  '(((a | b ) | c ) | d )',
  'u(( n ( it | til )) | ses)',
  '(0 | 1 ) 0 (0 | 1) (0 | 1)',
  '(a | (b | )* a*a | b(ba)* )*',
].map((expresion, i) => ({
  id: i + 1,
  punto: 'C' as const,
  expresion,
  consigna: 'Transformar en AFN-ε y graficar su tabla de transiciones.',
}))

/** Punto D: construir el AFD mínimo a partir de la expresión regular. */
export const PRACTICA_D: EjercicioExpresion[] = [
  '( ab | b) | a*',
  'a ( cd )* ( bc | b) ca',
  '(a | b ) (ba | ca )* | (cd | db)',
  '(( aa ) | (bb) | ( ca ) | (cb))*',
  'dd* ( ddd* | e ( mir ) d* )',
  'a ( b | c ) | b | c ( b | a)',
  '(( a* | b*) *) *',
  '((( ab* | b) * (b ( a | )) * ) * a)',
].map((expresion, i) => ({
  id: i + 1,
  punto: 'D' as const,
  expresion,
  consigna: 'Construir el AFD mínimo.',
}))

/**
 * Punto E: construir una ER, pasarla a AFN-ε, a AFD y minimizar.
 * Se corrige igual que el punto A, comparando lenguajes.
 */
export const PRACTICA_E: Ejercicio[] = [
  {
    id: 101,
    punto: 'E',
    enunciado:
      'Conjunto de cadenas de longitud mayor a 0 sobre {x, y} tales que, si comienzan con y, deben terminar con x.',
    alfabeto: ['x', 'y'],
    regular: true,
    predicado: (w) => w.length > 0 && (w[0] !== 'y' || w[w.length - 1] === 'x'),
  },
  {
    id: 102,
    punto: 'E',
    enunciado: 'Conjunto de cadenas sobre {a, s} que no posean dos s o dos a consecutivas.',
    alfabeto: ['a', 's'],
    regular: true,
    predicado: (w) => !w.includes('ss') && !w.includes('aa'),
    nota: 'Es el mismo lenguaje que el ejercicio 27 del punto A.',
  },
  {
    id: 103,
    punto: 'E',
    enunciado: 'Conjunto de cadenas sobre {e, b} que contenga como subcadena a bee o a beb.',
    alfabeto: ['e', 'b'],
    regular: true,
    predicado: (w) => w.includes('bee') || w.includes('beb'),
  },
  {
    id: 104,
    punto: 'E',
    enunciado:
      'Conjunto de cadenas sobre {a, b} que comiencen y terminen con el mismo símbolo, de longitud mayor o igual a 3.',
    alfabeto: ['a', 'b'],
    regular: true,
    predicado: (w) => w.length >= 3 && w[0] === w[w.length - 1],
    nota: 'Acá se compara un símbolo al principio y al final. No es lo mismo que A57: en ese ejercicio x puede ser una cadena de longitud arbitraria.',
  },
  {
    id: 105,
    punto: 'E',
    enunciado: 'Conjunto de cadenas sobre {a, b, c} que comienzan con ab o terminan con ba.',
    alfabeto: ['a', 'b', 'c'],
    regular: true,
    predicado: (w) => w.startsWith('ab') || w.endsWith('ba'),
  },
  {
    id: 106,
    punto: 'E',
    enunciado: 'Conjunto de cadenas sobre {a, b} de longitud mayor o igual a 2 o igual a 0.',
    alfabeto: ['a', 'b'],
    regular: true,
    predicado: (w) => w.length !== 1,
  },
]
