/**
 * Genera las expresiones regulares de referencia del banco a partir de los
 * predicados, y las escribe en src/data/referencias.ts.
 *
 * Se corre a mano cuando cambia algún predicado:
 *   npx vitest run test/generarReferencias.gen.test.ts
 *
 * Lo que produce se verifica después, de forma independiente, en banco.test.ts.
 */

import { writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { automataDesdePredicado } from '../src/core/desdePredicado'
import { minimizar } from '../src/core/minimize'
import { erAMinimo } from '../src/core/pipeline'
import { eliminacionDeEstados } from '../src/core/stateElimination'
import { PARTE_1 } from '../src/data/practicaA1'
import { PARTE_2 } from '../src/data/practicaA2'
import { PRACTICA_E } from '../src/data/practicaBCDE'
import { LENGUAJES_DE_PARCIAL } from '../src/data/parciales'
import { comparar } from './comparar'

describe('generación de referencias', () => {
  it('deriva una ER por cada ejercicio regular de los puntos A y E y de los parciales', () => {
    const lineas: string[] = []
    const informe: string[] = []
    const problemas: string[] = []

    for (const ej of [...PARTE_1, ...PARTE_2, ...PRACTICA_E, ...LENGUAJES_DE_PARCIAL]) {
      if (!ej.regular || !ej.predicado) continue
      if (ej.referencia) {
        informe.push(`${String(ej.id).padStart(2)}: a mano — ${ej.referencia}`)
        continue
      }

      const d = automataDesdePredicado(ej.predicado, ej.alfabeto)
      if (!d) {
        problemas.push(`${ej.id}: no se pudo derivar; ¿será que no es regular?`)
        continue
      }
      const minimo = minimizar(d.automata).minimo
      const er = eliminacionDeEstados(minimo).expresion

      // La ER derivada tiene que reconocer lo mismo que el predicado del que salió.
      const fallo = comparar(erAMinimo(er), ej.predicado, ej.alfabeto)
      if (fallo) problemas.push(`${ej.id}: difiere en "${fallo.cadena}"`)

      informe.push(
        `${String(ej.id).padStart(2)}: ${minimo.estados.length} estados, ` +
          `profundidad ${d.profundidad}${d.garantizado ? '' : ' (sin garantía teórica)'} · ${er.length} caract.`,
      )
      lineas.push(`  ${ej.id}: ${JSON.stringify(er)},`)
    }

    const archivo = [
      '/**',
      ' * Expresiones regulares de referencia de los puntos A y E y de los parciales.',
      ' *',
      ' * Generadas a partir del predicado de cada ejercicio, con',
      ' * test/generarReferencias.gen.test.ts, y verificadas contra esos predicados en',
      ' * test/banco.test.ts. No editar a mano: si hay que corregir un lenguaje se',
      ' * corrige el predicado y se vuelve a generar.',
      ' */',
      '',
      'export const REFERENCIAS: Record<number, string> = {',
      ...lineas,
      '}',
      '',
    ].join('\n')

    writeFileSync('src/data/referencias.ts', archivo, 'utf8')
    console.log('\n' + informe.join('\n') + '\n')
    expect(problemas).toEqual([])
  })
})
