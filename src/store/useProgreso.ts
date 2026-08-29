import { useCallback, useState } from 'react'
import type { Veredicto } from '../core/correccion'

const CLAVE = 'automatalab:progreso'

export interface Avance {
  /** último veredicto guardado del ejercicio */
  veredicto: Veredicto
  /** lo último que escribió el estudiante, para no perderlo al cambiar de ejercicio */
  expresion: string
}

type Mapa = Record<number, Avance>

function leer(): Mapa {
  try {
    const crudo = localStorage.getItem(CLAVE)
    return crudo ? (JSON.parse(crudo) as Mapa) : {}
  } catch {
    return {}
  }
}

function escribir(m: Mapa) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(m))
  } catch {
    // Sin localStorage la app anda igual, solo que no recuerda el avance.
  }
}

export interface Progreso {
  avanceDe: (id: number) => Avance | undefined
  guardar: (id: number, avance: Avance) => void
  olvidar: (id: number) => void
  limpiar: () => void
  /** cuántos ejercicios están resueltos, de una lista de ids */
  resueltos: (ids: number[]) => number
}

export function useProgreso(): Progreso {
  const [mapa, setMapa] = useState<Mapa>(leer)

  const guardar = useCallback((id: number, avance: Avance) => {
    setMapa((m) => {
      const nuevo = { ...m, [id]: avance }
      escribir(nuevo)
      return nuevo
    })
  }, [])

  const olvidar = useCallback((id: number) => {
    setMapa((m) => {
      const nuevo = { ...m }
      delete nuevo[id]
      escribir(nuevo)
      return nuevo
    })
  }, [])

  const limpiar = useCallback(() => {
    setMapa({})
    escribir({})
  }, [])

  return {
    avanceDe: (id) => mapa[id],
    guardar,
    olvidar,
    limpiar,
    resueltos: (ids) => ids.filter((id) => mapa[id]?.veredicto === 'correcto').length,
  }
}
