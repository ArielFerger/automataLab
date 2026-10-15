import { useCallback } from 'react'
import { type Borrador, vacio } from '../core/actividad'
import { useLocal } from './useLocal'

export type MapaProgreso = Record<string, Borrador>
function inicial(): MapaProgreso {
  try {
    const viejo = JSON.parse(localStorage.getItem('automatalab:progreso') ?? '{}')
    return Object.fromEntries(Object.entries(viejo).filter(([, v]) => v && typeof v === 'object').map(([id, v]) => {
      const dato = v as { expresion?: string }
      return [Number(id) > 100 ? `E${Number(id) - 100}` : `A${id}`, { ...vacio(), expresion: typeof dato.expresion === 'string' ? dato.expresion : '' }]
    }))
  } catch { return {} }
}
export function useProgreso() {
  const [mapa, setMapa, error] = useLocal<MapaProgreso>('automatalab:practica:v2', inicial, m => !!m && typeof m === 'object' && !Array.isArray(m) && Object.values(m).every(esBorrador))
  const guardar = useCallback((id: string, b: Borrador) => {
    setMapa(m => ({ ...m, [id]: { ...b, actualizado: new Date().toISOString() } }))
  }, [setMapa])
  return { mapa, guardar, error, avanceDe: (id: string) => mapa[id],
    resueltos: (ids: string[]) => ids.filter(id => mapa[id]?.resultado?.veredicto === 'correcto').length }
}
export function esBorrador(b: unknown): b is Borrador {
  if (!b || typeof b !== 'object') return false
  const x = b as Borrador
  return typeof x.expresion === 'string' && typeof x.desarrollo === 'string' && !!x.diagramas && typeof x.diagramas === 'object' && !Array.isArray(x.diagramas) &&
    (x.resultado === undefined || (!!x.resultado && typeof x.resultado.mensaje === 'string' && ['correcto', 'incorrecto', 'error', 'sin-respuesta'].includes(x.resultado.veredicto))) &&
    (x.fuenteB === undefined || (Number.isInteger(x.fuenteB) && x.fuenteB >= 1 && x.fuenteB <= 80)) &&
    Object.values(x.diagramas).every(a => a && Array.isArray(a.estados) && a.estados.every(e => e && typeof e.id === 'string' && typeof e.nombre === 'string' && Number.isFinite(e.x) && Number.isFinite(e.y)) && Array.isArray(a.transiciones) && a.transiciones.every(t => t && typeof t.desde === 'string' && typeof t.hasta === 'string' && typeof t.simbolo === 'string') && Array.isArray(a.alfabeto) && a.alfabeto.every(s => typeof s === 'string') && Array.isArray(a.finales) && a.finales.every(s => typeof s === 'string') && typeof a.inicial === 'string')
}
export type Progreso = ReturnType<typeof useProgreso>
