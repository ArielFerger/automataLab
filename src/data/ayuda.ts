/** Utilidades para escribir los predicados de los ejercicios sin repetirse. */

export function cuenta(w: string, c: string): number {
  let n = 0
  for (const x of w) if (x === c) n++
  return n
}

/** Ocurrencias de `s` en `w`, contando las que se solapan. */
export function ocurrencias(w: string, s: string): number {
  let n = 0
  for (let i = 0; i + s.length <= w.length; i++) if (w.startsWith(s, i)) n++
  return n
}

export function invertida(w: string): string {
  return [...w].reverse().join('')
}

export function esPalindromo(w: string): boolean {
  return w === invertida(w)
}

/** Largo del prefijo formado solo por símbolos de `conjunto`. */
export function prefijoDe(w: string, conjunto: string): number {
  let i = 0
  while (i < w.length && conjunto.includes(w[i])) i++
  return i
}

export function esPrimo(n: number): boolean {
  if (n < 2) return false
  for (let d = 2; d * d <= n; d++) if (n % d === 0) return false
  return true
}
