import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'

export function useLocal<T>(clave: string, inicial: () => T, validar?: (x: T) => boolean): [T, Dispatch<SetStateAction<T>>, boolean] {
  const [valor, setValor] = useState<T>(() => {
    try {
      const crudo = localStorage.getItem(clave)
      if (crudo) {
        const dato = JSON.parse(crudo) as T
        if (!validar || validar(dato)) return dato
      }
    } catch { /* Un guardado ilegible no impide estudiar. */ }
    return inicial()
  })
  const [error, setError] = useState(false)
  useEffect(() => {
    try { localStorage.setItem(clave, JSON.stringify(valor)); setError(false) }
    catch { setError(true) }
  }, [clave, valor])
  return [valor, setValor, error]
}
