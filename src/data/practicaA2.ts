import type { Ejercicio } from './tipos'
import { cuenta, ocurrencias, prefijoDe } from './ayuda'

/** Punto A de la práctica, ejercicios 41 a 80. */
export const PARTE_2: Ejercicio[] = [
  {
    id: 41,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {a, b} donde por cada a existen dos o más b.',
    alfabeto: ['a', 'b'],
    regular: false,
    porQueNo:
      'Pide que la cantidad de b sea al menos el doble que la de a, sin cota. Un autómata finito no puede llevar esa cuenta: bombeando aⁿb²ⁿ dentro de las a aumenta la cantidad de a sin tocar las b.',
  },
  {
    id: 42,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {a, b, c, d} en las que no existan a y b adyacentes.',
    alfabeto: ['a', 'b', 'c', 'd'],
    regular: true,
    predicado: (w) => !w.includes('ab') && !w.includes('ba'),
  },
  {
    id: 43,
    punto: 'A',
    enunciado:
      'Conjunto de cadenas sobre {0, 1} que contengan las subcadenas 01 y 10 a la vez, en cualquier lugar, o las cadenas que no terminen en 11 y comiencen con 00 a la vez.',
    alfabeto: ['0', '1'],
    regular: true,
    predicado: (w) =>
      (w.includes('01') && w.includes('10')) || (!w.endsWith('11') && w.startsWith('00')),
  },
  {
    id: 44,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {a, b} donde para cada a de la cadena exista una b posterior.',
    alfabeto: ['a', 'b'],
    regular: true,
    predicado: (w) => {
      const ultimaA = w.lastIndexOf('a')
      return ultimaA === -1 || w.lastIndexOf('b') > ultimaA
    },
    nota: 'Alcanza con mirar el final: si después de la última b no queda ninguna a, todas las a tienen una b posterior. No hay que contar nada.',
  },
  {
    id: 45,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {a, b, c} que no contengan más de dos símbolos iguales consecutivos.',
    alfabeto: ['a', 'b', 'c'],
    regular: true,
    predicado: (w) => !/(.)\1\1/.test(w),
  },
  {
    id: 46,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {a, b, c} que no posean ninguna b entre una a y una c consecutivas.',
    alfabeto: ['a', 'b', 'c'],
    regular: true,
    predicado: (w) => !/ab+c/.test(w),
    nota: 'Se lee como que está prohibido el patrón a…c con solo b en el medio, o sea ab⁺c. Vale confirmar la lectura con el profesor.',
  },
  {
    id: 47,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {0, 1} que no contengan a 0 ni a 1 como subcadenas.',
    alfabeto: ['0', '1'],
    regular: true,
    referencia: 'ε',
    predicado: (w) => w === '',
    nota: 'Si no puede aparecer ni un 0 ni un 1, no queda ningún símbolo: el lenguaje es {ε}.',
  },
  {
    id: 48,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {a, b} donde la cantidad de a más el doble de la cantidad de b sea igual a 5.',
    alfabeto: ['a', 'b'],
    regular: true,
    predicado: (w) => cuenta(w, 'a') + 2 * cuenta(w, 'b') === 5,
    nota: 'La suma está fijada en 5, así que la longitud está acotada y el lenguaje es finito.',
  },
  {
    id: 49,
    punto: 'A',
    enunciado:
      'Conjunto de cadenas sobre {0, 1} que contengan al menos un par de 1 consecutivos, y a lo sumo un par de 0 consecutivos.',
    alfabeto: ['0', '1'],
    regular: true,
    predicado: (w) => w.includes('11') && ocurrencias(w, '00') <= 1,
    nota: 'En 000 hay dos pares de ceros solapados, así que no cumple.',
  },
  {
    id: 50,
    punto: 'A',
    enunciado:
      'Conjunto de cadenas sobre {a, b}, donde la paridad de la cantidad de b sea la misma que la paridad de la longitud de la cadena.',
    alfabeto: ['a', 'b'],
    regular: true,
    predicado: (w) => cuenta(w, 'a') % 2 === 0,
    nota: 'Como |w| = #a + #b, pedir que #b y |w| tengan la misma paridad es lo mismo que pedir que #a sea par.',
  },
  {
    id: 51,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {0, 1, 2, 3} de la forma ws con w en {0, 2}ⁿ; s en {1, 3}*; n < 3 y |ws| par.',
    alfabeto: ['0', '1', '2', '3'],
    regular: true,
    predicado: (w) => /^[02]{0,2}[13]*$/.test(w) && w.length % 2 === 0,
  },
  {
    id: 52,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {a, b} que no contengan la subcadena abb o que sean de longitud múltiplo de 3.',
    alfabeto: ['a', 'b'],
    regular: true,
    predicado: (w) => !w.includes('abb') || w.length % 3 === 0,
  },
  {
    id: 53,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {0, 1} que no contengan la subcadena 101 y que tengan longitud par.',
    alfabeto: ['0', '1'],
    regular: true,
    predicado: (w) => !w.includes('101') && w.length % 2 === 0,
  },
  {
    id: 54,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {a, b, c, d}, de la forma xw con x en {a, b}ⁿ; w en {c, d}ᵐ; n impar y m ≠ 2.',
    alfabeto: ['a', 'b', 'c', 'd'],
    regular: true,
    predicado: (w) => {
      if (!/^[ab]*[cd]*$/.test(w)) return false
      const n = prefijoDe(w, 'ab')
      return n % 2 === 1 && w.length - n !== 2
    },
  },
  {
    id: 55,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {a, b, c}, que contengan no más de dos b y no más de dos c.',
    alfabeto: ['a', 'b', 'c'],
    regular: true,
    predicado: (w) => cuenta(w, 'b') <= 2 && cuenta(w, 'c') <= 2,
  },
  {
    id: 56,
    punto: 'A',
    enunciado:
      'Conjunto de cadenas sobre {0, 1, 2} que no contengan como subcadena a 012, y siempre contengan al menos un 0 o dos 1 (en cualquier lugar).',
    alfabeto: ['0', '1', '2'],
    regular: true,
    predicado: (w) => !w.includes('012') && (w.includes('0') || cuenta(w, '1') >= 2),
  },
  {
    id: 57,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {0, 1} de la forma xwx, donde x y w en {0, 1}⁺.',
    alfabeto: ['0', '1'],
    regular: true,
    predicado: (w) => w.length >= 3 && w[0] === w[w.length - 1],
    nota: 'Trampa: como x puede ser un solo símbolo, alcanza con que la cadena tenga largo 3 o más y empiece y termine igual. No hay que recordar nada, así que sí es regular.',
  },
  {
    id: 58,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {0, 1, 2} en las cuales toda subcadena contenga al menos un 2.',
    alfabeto: ['0', '1', '2'],
    regular: true,
    predicado: (w) => /^2*$/.test(w),
    nota: 'Cada símbolo suelto es una subcadena, así que todos tienen que ser 2. El lenguaje es 2*. (Si se contara también la subcadena vacía, que nunca tiene un 2, el lenguaje sería ∅.)',
  },
  {
    id: 59,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {a, b, c, d}, de la forma xwx con x en {a, b}²; w en {c, d}⁺.',
    alfabeto: ['a', 'b', 'c', 'd'],
    regular: true,
    predicado: (w) => {
      if (w.length < 5) return false
      const x = w.slice(0, 2)
      return /^[ab]{2}$/.test(x) && w.slice(-2) === x && /^[cd]+$/.test(w.slice(2, -2))
    },
    nota: '|x| = 2 está fijo, así que hay solo cuatro x posibles: se pueden enumerar y el lenguaje es regular.',
  },
  {
    id: 60,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {a, b, c}, donde toda subcadena de longitud 3 contenga al menos una a.',
    alfabeto: ['a', 'b', 'c'],
    regular: true,
    predicado: (w) => !/[bc]{3}/.test(w),
  },
  {
    id: 61,
    punto: 'A',
    enunciado:
      'Conjunto de cadenas sobre {a, b, c} que comiencen con ab o con c, que contengan ca, que no contengan cab y donde todo sufijo de longitud 3 posea al menos una b.',
    alfabeto: ['a', 'b', 'c'],
    regular: true,
    predicado: (w) =>
      (w.startsWith('ab') || w.startsWith('c')) &&
      w.includes('ca') &&
      !w.includes('cab') &&
      (w.length < 3 || w.slice(-3).includes('b')),
  },
  {
    id: 62,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {0, 1, 2, 3, 4, 5, 6, 7, 8, 9} que representen números primos (en base diez).',
    alfabeto: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
    regular: false,
    porQueNo:
      'Los primos no siguen ningún patrón que se pueda decidir con memoria acotada. Con el lema de bombeo: dado n, se toma un primo p con más de n dígitos; bombear un tramo de sus dígitos produce números que casi nunca son primos, y basta uno para romperlo.',
  },
  {
    id: 63,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {0, 1} que representen potencias de 2 o números impares (en binario).',
    alfabeto: ['0', '1'],
    regular: true,
    predicado: (w) => w.length >= 1 && (/^0*10*$/.test(w) || w.endsWith('1')),
    nota: 'Una potencia de 2 en binario es un único 1 (con los ceros que se quieran adelante y atrás), y un impar es cualquier cadena terminada en 1. Nada de eso requiere contar.',
  },
  {
    id: 64,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {a, b, c, d}, de la forma xw con x en {a, b}ⁿ; w en {c, d}ᵐ; n impar y m ≠ 2.',
    alfabeto: ['a', 'b', 'c', 'd'],
    regular: true,
    predicado: (w) => {
      if (!/^[ab]*[cd]*$/.test(w)) return false
      const n = prefijoDe(w, 'ab')
      return n % 2 === 1 && w.length - n !== 2
    },
    nota: 'Es el mismo enunciado que el 54; en la práctica está repetido.',
  },
  {
    id: 65,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {a, b, c}, que contengan no más de dos b y no más de dos c.',
    alfabeto: ['a', 'b', 'c'],
    regular: true,
    predicado: (w) => cuenta(w, 'b') <= 2 && cuenta(w, 'c') <= 2,
    nota: 'Es el mismo enunciado que el 55; en la práctica está repetido.',
  },
  {
    id: 66,
    punto: 'A',
    enunciado:
      'Conjunto de cadenas sobre {a, b}, que comiencen y terminen con a, con cantidad impar de a, y longitud par.',
    alfabeto: ['a', 'b'],
    regular: true,
    predicado: (w) =>
      w.length >= 1 &&
      w[0] === 'a' &&
      w[w.length - 1] === 'a' &&
      cuenta(w, 'a') % 2 === 1 &&
      w.length % 2 === 0,
  },
  {
    id: 67,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {a, b} que contengan al menos una subcadena de la forma bⁿaⁿ con n > 1.',
    alfabeto: ['a', 'b'],
    regular: false,
    porQueNo:
      'Buscar bⁿaⁿ con n sin cota obliga a comparar dos cantidades arbitrariamente grandes. Un autómata finito solo podría chequear un n fijo.',
  },
  {
    id: 68,
    punto: 'A',
    enunciado:
      'Conjunto de cadenas sobre {a, b, c} que no contengan repeticiones consecutivas del mismo símbolo, ni la subcadena bc.',
    alfabeto: ['a', 'b', 'c'],
    regular: true,
    predicado: (w) => !/(.)\1/.test(w) && !w.includes('bc'),
  },
  {
    id: 69,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {0, 1} de la forma 0ⁿ1ᵐ, donde n = (3x + 1), con x > 0, y m es impar.',
    alfabeto: ['0', '1'],
    regular: true,
    predicado: (w) => {
      if (!/^0*1*$/.test(w)) return false
      const n = prefijoDe(w, '0')
      const m = w.length - n
      return n >= 4 && n % 3 === 1 && m % 2 === 1
    },
    nota: 'n y m se piden por separado, sin relacionarlos entre sí: cada uno se resuelve con un contador módulo fijo. Por eso sí es regular, a diferencia de 0ⁿ1²ⁿ.',
  },
  {
    id: 70,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {0, 1} que no comiencen con 01 y que tengan longitud distinta de 3.',
    alfabeto: ['0', '1'],
    regular: true,
    predicado: (w) => !w.startsWith('01') && w.length !== 3,
  },
  {
    id: 71,
    punto: 'A',
    enunciado:
      'Conjunto de cadenas sobre {0, 1}, que no contengan 01, que comiencen con 11 y donde todo prefijo de longitud par tiene más 1 que 0.',
    alfabeto: ['0', '1'],
    regular: false,
    porQueNo:
      'No contener 01 obliga a la forma 1^k 0^m, y comenzar con 11 pide k ≥ 2. Con eso, la condición sobre los prefijos de longitud par se reduce a m < k: hay que comparar la cantidad de unos con la de ceros sin ninguna cota. Bombeando los unos de 1ᵏ0ᵏ⁻¹ se rompe la desigualdad, así que no es regular.',
    nota: 'Parece un ejercicio de patrones, pero la condición sobre los prefijos esconde una comparación de cantidades. Conviene desarrollar qué forma tienen las cadenas antes de dibujar nada.',
  },
  {
    id: 72,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {a, b}, que no contengan ningún posfijo con mayor cantidad de b que de a.',
    alfabeto: ['a', 'b'],
    regular: false,
    porQueNo:
      'Hay que comparar cantidades de a y de b sin ninguna cota, en todos los sufijos a la vez. Bombeando aⁿbⁿ se rompe el balance, y ningún autómata finito puede llevar esa cuenta.',
  },
  {
    id: 73,
    punto: 'A',
    enunciado:
      'Conjunto de cadenas sobre {a, b, c} con cantidad par de a, impar de b, y la cantidad de a más la cantidad de b igual a la cantidad de c.',
    alfabeto: ['a', 'b', 'c'],
    regular: false,
    porQueNo:
      'Las paridades solas sí serían regulares, pero exigir #a + #b = #c obliga a contar sin cota. Bombeando en las a se rompe la igualdad con las c.',
  },
  {
    id: 74,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {a, b} de longitud múltiplo de 3 pero no de 2, o de longitud múltiplo de 4.',
    alfabeto: ['a', 'b'],
    regular: true,
    predicado: (w) => (w.length % 3 === 0 && w.length % 2 !== 0) || w.length % 4 === 0,
  },
  {
    id: 75,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {a, b, c} que contengan ab o ca, y terminen en bc o aa.',
    alfabeto: ['a', 'b', 'c'],
    regular: true,
    predicado: (w) => (w.includes('ab') || w.includes('ca')) && (w.endsWith('bc') || w.endsWith('aa')),
  },
  {
    id: 76,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {a, b} que contengan menor cantidad de a que de b, o que comiencen con b.',
    alfabeto: ['a', 'b'],
    regular: false,
    porQueNo:
      'Mirando solo las cadenas que empiezan con a, la segunda condición no aporta nada y queda #a < #b, que exige contar sin cota. Como los regulares son cerrados por intersección, si el lenguaje fuera regular esa parte también lo sería, y no lo es.',
  },
  {
    id: 77,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {0, 1, 2}, que no contengan 21 y que tengan más de un 0.',
    alfabeto: ['0', '1', '2'],
    regular: true,
    predicado: (w) => !w.includes('21') && cuenta(w, '0') > 1,
  },
  {
    id: 78,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {a, b, c} de longitud igual a (3n + 2), con n >= 0.',
    alfabeto: ['a', 'b', 'c'],
    regular: true,
    predicado: (w) => w.length % 3 === 2,
  },
  {
    id: 79,
    punto: 'A',
    enunciado:
      'Conjunto de cadenas sobre {a, b} de la forma aⁿbⁿ (con n > 0), o que comiencen con a y terminen con bbb.',
    alfabeto: ['a', 'b'],
    regular: false,
    porQueNo:
      'La segunda parte sí es regular, pero la unión no lo es: aⁿbⁿ con n distinto de 3 no queda cubierto por ella, y decidir esa parte exige comparar las dos cantidades sin cota.',
  },
  {
    id: 80,
    punto: 'A',
    enunciado: 'Conjunto de cadenas sobre {a, b} que no contengan ni abba, ni baab.',
    alfabeto: ['a', 'b'],
    regular: true,
    predicado: (w) => !w.includes('abba') && !w.includes('baab'),
    nota: 'Este mismo lenguaje fue el ítem 3 del recuperatorio de 2023.',
  },
]
