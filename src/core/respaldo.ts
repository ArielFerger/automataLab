import { desdeObjeto } from './documento'
import { esBorrador } from '../store/useProgreso'
import { esSesionExamen } from './examen'

const CLAVES = ['automatalab:practica:v2', 'automatalab:examen:sesiones', 'automatalab:editor'] as const
export function crearRespaldo(): string {
  const datos = Object.fromEntries(CLAVES.map(c => [c, JSON.parse(localStorage.getItem(c) ?? 'null')]))
  return JSON.stringify({ formato: 'automatalab-respaldo', version: 1, fecha: new Date().toISOString(), datos }, null, 2)
}
export function validarRespaldo(texto: string): Record<string, unknown> {
  const x = JSON.parse(texto)
  if (x?.formato !== 'automatalab-respaldo' || x.version !== 1 || !x.datos || typeof x.datos !== 'object' || Array.isArray(x.datos)) throw new Error('Elegí un respaldo de AutómataLab versión 1.')
  const salida: Record<string, unknown> = {}
  for (const clave of CLAVES) {
    const dato = x.datos[clave]
    if (dato == null) continue
    if (clave === 'automatalab:editor') salida[clave] = desdeObjeto(dato)
    else {
      if (typeof dato !== 'object' || Array.isArray(dato)) throw new Error('El respaldo tiene datos de progreso inválidos.')
      if (clave === 'automatalab:practica:v2' && !Object.values(dato).every(esBorrador)) throw new Error('El respaldo contiene respuestas inválidas.')
      if (clave === 'automatalab:examen:sesiones' && !Object.values(dato).every(esSesionExamen)) throw new Error('El respaldo contiene sesiones de examen inválidas.')
      salida[clave] = dato
    }
  }
  return salida
}
export function restaurarRespaldo(datos: Record<string, unknown>) {
  // Mezcla el avance para no borrar los ejercicios o exámenes ausentes del archivo.
  const anteriores = Object.fromEntries(Object.keys(datos).map(c => [c, localStorage.getItem(c)]))
  try {
    for (const [clave, dato] of Object.entries(datos)) {
      if (!CLAVES.includes(clave as typeof CLAVES[number])) throw new Error('Clave de respaldo inválida.')
      const actual = JSON.parse(localStorage.getItem(clave) ?? '{}')
      localStorage.setItem(clave, JSON.stringify(clave === 'automatalab:editor' ? dato : { ...actual, ...dato as object }))
    }
  } catch {
    for (const [clave, dato] of Object.entries(anteriores)) { if (dato === null) localStorage.removeItem(clave); else localStorage.setItem(clave, dato) }
    throw new Error('No se pudo importar. El almacenamiento está lleno o bloqueado. Conservá el archivo de respaldo.')
  }
}
