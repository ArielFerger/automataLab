import type { Ejercicio } from './tipos'
import { cuenta, esPalindromo } from './ayuda'

/** Punto A de la práctica, ejercicios 1 a 40. */
export const PARTE_1: Ejercicio[] = [
  {
    id: 1,
    punto: 'A',
    enunciado: 'Identificadores en Pascal.',
    alfabeto: ['L', 'D', 'O'],
    convencion: 'L = letra, D = dígito, O = cualquier otro carácter.',
    regular: true,
    predicado: (w) => /^L[LD]*$/.test(w),
  },
  {
    id: 2,
    punto: 'A',
    enunciado: 'Constante entera en Pascal.',
    alfabeto: ['D', 'O'],
    convencion: 'D = dígito, O = cualquier otro carácter.',
    regular: true,
    predicado: (w) => /^D+$/.test(w),
  },
  {
    id: 3,
    punto: 'A',
    enunciado: 'Operadores relacionales del Pascal.',
    alfabeto: ['<', '>', '='],
    regular: true,
    predicado: (w) => ['<', '>', '=', '<=', '>=', '<>'].includes(w),
  },
  {
    id: 4,
    punto: 'A',
    enunciado: 'Constantes reales.',
    alfabeto: ['D', '.'],
    convencion: 'D = dígito.',
    regular: true,
    predicado: (w) => /^D+\.D+$/.test(w),
  },
  {
    id: 5,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {a, b} de longitud par.',
    alfabeto: ['a', 'b'],
    regular: true,
    predicado: (w) => w.length % 2 === 0,
  },
  {
    id: 6,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {a, b} que terminen con abb.',
    alfabeto: ['a', 'b'],
    regular: true,
    predicado: (w) => w.endsWith('abb'),
  },
  {
    id: 7,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {0, 1} que comiencen y terminen con 0.',
    alfabeto: ['0', '1'],
    regular: true,
    predicado: (w) => w.length >= 1 && w[0] === '0' && w[w.length - 1] === '0',
    nota: 'La cadena "0" cumple: empieza y termina con 0 al mismo tiempo.',
  },
  {
    id: 8,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {0, 1} que contengan como subcadenas a 001 o 100.',
    alfabeto: ['0', '1'],
    regular: true,
    predicado: (w) => w.includes('001') || w.includes('100'),
  },
  {
    id: 9,
    punto: 'A',
    enunciado:
      'Identificadores de cualquier longitud que comiencen con una letra y contengan letras, dígitos o guiones, que no contengan dos guiones seguidos ni terminen con guión.',
    alfabeto: ['L', 'D', 'g'],
    convencion: 'L = letra, D = dígito, g = guión.',
    regular: true,
    predicado: (w) => /^L[LD]*(g[LD]+)*$/.test(w),
  },
  {
    id: 10,
    punto: 'A',
    enunciado: 'Comentarios acotados por (* *) o { }.',
    alfabeto: ['a', 'c', 'e', 'l', 'r', 'o'],
    convencion: 'a = "(", c = ")", e = "*", l = "{", r = "}", o = cualquier otro carácter.',
    regular: true,
    predicado: (w) => {
      if (/^l[acelo]*r$/.test(w)) return true
      // (* … *): abre con "ae", cierra con "ec" y el interior no puede tener "ec",
      // porque el comentario termina en el primer *) que aparece.
      return w.length >= 4 && w.startsWith('ae') && w.endsWith('ec') && !w.slice(2, -2).includes('ec')
    },
  },
  {
    id: 11,
    punto: 'A',
    enunciado:
      'Conjunto de cadenas que representen números reales sin notación exponencial considerando la coma para separar los miles y el punto para los decimales.',
    alfabeto: ['D', ',', '.'],
    convencion: 'D = dígito.',
    regular: true,
    predicado: (w) => /^D{1,3}(,DDD)*\.D+$/.test(w),
    nota: 'Se toma que la parte decimal es obligatoria, que es lo que distingue a un real de un entero.',
  },
  {
    id: 12,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {0, 1} que contengan tres ceros consecutivos.',
    alfabeto: ['0', '1'],
    regular: true,
    predicado: (w) => w.includes('000'),
  },
  {
    id: 13,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {a, b, c} de la forma wcw, con w en {a, b}* y |w| = 2.',
    alfabeto: ['a', 'b', 'c'],
    regular: true,
    predicado: (w) => ['aacaa', 'abcab', 'bacba', 'bbcbb'].includes(w),
    nota: 'Como |w| está fijado en 2, hay solo cuatro cadenas posibles: el lenguaje es finito, y todo lenguaje finito es regular.',
  },
  {
    id: 14,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {0, 1} que no contengan dos unos consecutivos.',
    alfabeto: ['0', '1'],
    regular: true,
    predicado: (w) => !w.includes('11'),
  },
  {
    id: 15,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {0, 1} que no contengan la cadena 101.',
    alfabeto: ['0', '1'],
    regular: true,
    predicado: (w) => !w.includes('101'),
  },
  {
    id: 16,
    punto: 'A',
    enunciado:
      'Conjunto de cadenas sobre {0, 1} que sean, en binario, equivalentes a los múltiplos decimales de 4.',
    alfabeto: ['0', '1'],
    regular: true,
    predicado: (w) => w.length >= 1 && (w.endsWith('00') || w === '0'),
    nota: 'Un binario es múltiplo de 4 exactamente cuando termina en 00. El cero también lo es.',
  },
  {
    id: 17,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {a, b, c} que no contengan como subcadenas a b ni a ac.',
    alfabeto: ['a', 'b', 'c'],
    regular: true,
    predicado: (w) => !w.includes('b') && !w.includes('ac'),
  },
  {
    id: 18,
    punto: 'A',
    enunciado:
      'Conjunto de cadenas sobre {0, 1, 2, 3, 4, 5, 6, 7, 8, 9} donde el 1, 3, 5, 7, si están en la cadena, aparezcan en este orden.',
    alfabeto: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
    regular: true,
    predicado: (w) => /^1*3*5*7*$/.test([...w].filter((c) => '1357'.includes(c)).join('')),
  },
  {
    id: 19,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {0, 1} de longitud menor a 2 o mayor que 4.',
    alfabeto: ['0', '1'],
    regular: true,
    predicado: (w) => w.length < 2 || w.length > 4,
  },
  {
    id: 20,
    punto: 'A',
    enunciado:
      'Conjunto de cadenas sobre {a, b, c} de la forma wxz, donde w comienza y termina con a, x comienza y termina con b y z comienza y termina con c; con w, x, z en {a, b, c}*.',
    alfabeto: ['a', 'b', 'c'],
    regular: true,
    predicado: (w) => {
      for (let i = 1; i <= w.length - 2; i++) {
        for (let j = i + 1; j <= w.length - 1; j++) {
          const p = w.slice(0, i)
          const q = w.slice(i, j)
          const r = w.slice(j)
          if (p[0] === 'a' && p[p.length - 1] === 'a' && q[0] === 'b' && q[q.length - 1] === 'b' && r[0] === 'c' && r[r.length - 1] === 'c') {
            return true
          }
        }
      }
      return false
    },
  },
  {
    id: 21,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {0, 1} que no contengan las cadenas 101, 010, 000 y 111.',
    alfabeto: ['0', '1'],
    regular: true,
    predicado: (w) => !['101', '010', '000', '111'].some((s) => w.includes(s)),
  },
  {
    id: 22,
    punto: 'A',
    enunciado:
      'Conjunto de cadenas sobre {0, 1} que contengan las subcadenas 00 y 11, o que tengan longitud menor a 4.',
    alfabeto: ['0', '1'],
    regular: true,
    predicado: (w) => (w.includes('00') && w.includes('11')) || w.length < 4,
  },
  {
    id: 23,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {r, s, t, u} donde toda s aparece antes que cualquier t.',
    alfabeto: ['r', 's', 't', 'u'],
    regular: true,
    predicado: (w) => {
      const ultimaS = w.lastIndexOf('s')
      const primeraT = w.indexOf('t')
      return ultimaS === -1 || primeraT === -1 || ultimaS < primeraT
    },
  },
  {
    id: 24,
    punto: 'A',
    enunciado: 'Conjunto de cadenas de números binarios impares.',
    alfabeto: ['0', '1'],
    regular: true,
    predicado: (w) => w.endsWith('1'),
  },
  {
    id: 25,
    punto: 'A',
    enunciado:
      'De 1 a 4 letras + símbolo @ + de 1 a 4 letras + punto + cadenas que contienen subcadenas de 1 hasta 4 dígitos o letras, separadas por punto.',
    alfabeto: ['L', 'D', '@', '.'],
    convencion: 'L = letra, D = dígito.',
    regular: true,
    predicado: (w) => /^L{1,4}@L{1,4}\.[LD]{1,4}(\.[LD]{1,4})*$/.test(w),
  },
  {
    id: 26,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {x, y} de longitud múltiplo de 3 o de longitud 0.',
    alfabeto: ['x', 'y'],
    regular: true,
    predicado: (w) => w.length % 3 === 0,
    nota: 'La longitud 0 ya es múltiplo de 3, así que la segunda condición no agrega nada.',
  },
  {
    id: 27,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {a, s} que no posean dos s ni dos a consecutivas.',
    alfabeto: ['a', 's'],
    regular: true,
    predicado: (w) => !w.includes('ss') && !w.includes('aa'),
  },
  {
    id: 28,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {0, 1} con un número impar de 0s y un número par de 1s.',
    alfabeto: ['0', '1'],
    regular: true,
    predicado: (w) => cuenta(w, '0') % 2 === 1 && cuenta(w, '1') % 2 === 0,
  },
  {
    id: 29,
    punto: 'A',
    enunciado:
      'Conjunto de cadenas sobre {0, 1} donde en todo prefijo, la cantidad de 0 difiera de la cantidad de 1 en no más de uno.',
    alfabeto: ['0', '1'],
    regular: true,
    predicado: (w) => {
      let d = 0
      for (const c of w) {
        d += c === '0' ? 1 : -1
        if (Math.abs(d) > 1) return false
      }
      return true
    },
    nota: 'La diferencia está acotada, así que alcanza con un contador finito: por eso sí es regular, a diferencia de los ejercicios que piden igualdad de cantidades sin cota.',
  },
  {
    id: 30,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {0, 1} de la forma ww donde w está en {0, 1}².',
    alfabeto: ['0', '1'],
    regular: true,
    predicado: (w) => ['0000', '0101', '1010', '1111'].includes(w),
    nota: 'Ojo: |w| = 2 está fijo, así que hay exactamente cuatro cadenas. Es finito, y por lo tanto regular. Distinto es el caso general ww con w de largo libre, que no lo es.',
  },
  {
    id: 31,
    punto: 'A',
    enunciado: 'Lenguaje vacío sobre {0, 1}.',
    alfabeto: ['0', '1'],
    regular: true,
    referencia: '∅',
    predicado: () => false,
  },
  {
    id: 32,
    punto: 'A',
    enunciado: 'La cadena vacía sobre {a, b}.',
    alfabeto: ['a', 'b'],
    regular: true,
    referencia: 'ε',
    predicado: (w) => w === '',
    nota: 'Es {ε}, un lenguaje con un elemento. No confundir con ∅, que no tiene ninguno.',
  },
  {
    id: 33,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {0, 1} que no contengan como subcadena a la cadena vacía.',
    alfabeto: ['0', '1'],
    regular: true,
    referencia: '∅',
    predicado: () => false,
    nota: 'Toda cadena contiene a ε como subcadena, incluso la propia ε. Así que ninguna cumple: el lenguaje es ∅.',
  },
  {
    id: 34,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {0, 1} que sean palíndromos.',
    alfabeto: ['0', '1'],
    regular: false,
    porQueNo:
      'Un autómata finito tendría que recordar la primera mitad entera para compararla con la segunda, y la mitad puede ser tan larga como se quiera. Con el lema de bombeo: si el lenguaje fuera regular con constante n, la cadena 0ⁿ10ⁿ se podría bombear en los primeros 0, y al cambiar la cantidad de ceros de la izquierda deja de ser palíndromo.',
  },
  {
    id: 35,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {0, 1} que sean palíndromos de longitud menor o igual a 4.',
    alfabeto: ['0', '1'],
    regular: true,
    predicado: (w) => w.length <= 4 && esPalindromo(w),
    nota: 'Acotar la longitud vuelve finito al lenguaje, y todo lenguaje finito es regular. Sin la cota, el 34 no lo es.',
  },
  {
    id: 36,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {0, 1} que no contengan como prefijo a 0 ni a 1.',
    alfabeto: ['0', '1'],
    regular: true,
    referencia: 'ε',
    predicado: (w) => w === '',
    nota: 'Cualquier cadena no vacía empieza con 0 o con 1. Solo queda ε.',
  },
  {
    id: 37,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {0, 1} de la forma 0ⁿ 1²ⁿ.',
    alfabeto: ['0', '1'],
    regular: false,
    porQueNo:
      'Habría que contar los ceros sin cota para exigir el doble de unos, y un autómata finito tiene memoria acotada. Bombeando 0ⁿ1²ⁿ dentro de los ceros se rompe la relación entre las dos cantidades.',
  },
  {
    id: 38,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {a, b, c, d} de la forma wⁿ xᵐ con n ≠ m, w en {a, b}* y x en {c, d}*.',
    alfabeto: ['a', 'b', 'c', 'd'],
    regular: false,
    porQueNo:
      'Con la lectura habitual — contar repeticiones de un bloque a la izquierda y otro a la derecha, exigiendo que las cantidades sean distintas — hay que comparar dos contadores sin cota, y eso un autómata finito no lo puede hacer.',
    nota: 'El enunciado es ambiguo: no aclara si w y x están fijos o son cualquier cadena. Conviene chequearlo con el profesor.',
  },
  {
    id: 39,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {a, b} de longitud menor o igual a 3 que no sean palíndromos.',
    alfabeto: ['a', 'b'],
    regular: true,
    predicado: (w) => w.length <= 3 && !esPalindromo(w),
  },
  {
    id: 40,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {0, 1, 2} de la forma w2w, donde w es una secuencia de ceros y unos.',
    alfabeto: ['0', '1', '2'],
    regular: false,
    porQueNo:
      'El 2 marca la mitad, y hay que recordar toda la primera parte para compararla con la segunda. Bombeando 0ⁿ120ⁿ1 se rompe la igualdad entre las dos mitades.',
  },
]
