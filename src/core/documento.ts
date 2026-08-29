/**
 * Un autómata con nombre, que es lo que se guarda, se exporta y se comparte.
 *
 * El editor trabajaba con un `Automata` pelado. Para poder guardar "Ejercicio 1"
 * y volver a abrirlo, o mandárselo a alguien, hace falta envolverlo con un título
 * y con los datos que lo acompañan.
 */

import { type Automata, automataVacio } from './automaton'

export const VERSION_FORMATO = 1

export interface Documento {
  version: number
  titulo: string
  automata: Automata
  /** anotaciones del autor: el enunciado, una aclaración, lo que sea */
  notas: string
  /** quién lo hizo, para cuando se publica en la comunidad */
  autor: string
  /** fecha ISO de la última edición */
  editado: string
}

export function documentoNuevo(titulo = 'Autómata sin título', automata?: Automata): Documento {
  return {
    version: VERSION_FORMATO,
    titulo,
    automata: automata ?? automataVacio(['a', 'b']),
    notas: '',
    autor: '',
    editado: new Date().toISOString(),
  }
}

/** Nombre de archivo sano a partir del título. */
export function nombreDeArchivo(titulo: string, extension: string): string {
  // NFD separa las tildes en marcas combinantes (U+0300–U+036F), que se descartan.
  const sinTildes = titulo.normalize('NFD').replace(/[̀-ͯ]/g, '')
  const base =
    sinTildes
      .replace(/[^a-zA-Z0-9 _-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .toLowerCase() || 'automata'
  return base + '.' + extension
}

export function serializar(doc: Documento): string {
  return JSON.stringify({ ...doc, editado: new Date().toISOString() }, null, 2)
}

/**
 * Lee un documento guardado. Acepta también los archivos del formato viejo, que
 * eran un `Automata` suelto sin título.
 */
export function deserializar(texto: string): Documento {
  const crudo = JSON.parse(texto) as unknown
  return desdeObjeto(crudo)
}

export function desdeObjeto(crudo: unknown): Documento {
  if (!crudo || typeof crudo !== 'object') throw new Error('El archivo no tiene un autómata.')
  const o = crudo as Record<string, unknown>

  // Formato viejo: el JSON era directamente el autómata.
  if (Array.isArray(o.estados) && Array.isArray(o.transiciones)) {
    return { ...documentoNuevo('Autómata importado'), automata: validarAutomata(o) }
  }

  const automata = validarAutomata(o.automata)
  return {
    version: typeof o.version === 'number' ? o.version : VERSION_FORMATO,
    titulo: typeof o.titulo === 'string' && o.titulo.trim() ? o.titulo : 'Autómata sin título',
    automata,
    notas: typeof o.notas === 'string' ? o.notas : '',
    autor: typeof o.autor === 'string' ? o.autor : '',
    editado: typeof o.editado === 'string' ? o.editado : new Date().toISOString(),
  }
}

function validarAutomata(crudo: unknown): Automata {
  if (!crudo || typeof crudo !== 'object') throw new Error('El archivo no tiene un autómata.')
  const a = crudo as Record<string, unknown>
  if (!Array.isArray(a.estados) || !Array.isArray(a.transiciones) || !Array.isArray(a.alfabeto)) {
    throw new Error('El archivo no tiene un autómata válido.')
  }
  return {
    estados: (a.estados as Automata['estados']).map((e) => ({
      id: String(e.id),
      nombre: String(e.nombre ?? e.id),
      x: Number(e.x) || 0,
      y: Number(e.y) || 0,
    })),
    alfabeto: (a.alfabeto as string[]).map(String),
    transiciones: (a.transiciones as Automata['transiciones']).map((t) => ({
      desde: String(t.desde),
      hasta: String(t.hasta),
      simbolo: String(t.simbolo ?? ''),
    })),
    inicial: String(a.inicial ?? ''),
    finales: Array.isArray(a.finales) ? (a.finales as string[]).map(String) : [],
  }
}

/** Descarga un contenido como archivo, del lado del navegador. */
export function descargar(contenido: Blob | string, nombre: string, tipo = 'application/json') {
  const blob = typeof contenido === 'string' ? new Blob([contenido], { type: tipo }) : contenido
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Se libera después de que el navegador tomó la descarga.
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
