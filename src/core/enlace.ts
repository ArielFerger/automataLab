/**
 * Compartir un autómata por link.
 *
 * El documento entero viaja comprimido dentro del fragmento (#) de la URL, que el
 * navegador nunca manda al servidor. Eso deja compartir sin servidor, sin cuentas
 * y sin que el link deje rastro en ningún lado: se pega en un chat y quien lo abre
 * ve el mismo autómata.
 *
 * El límite práctico es el largo máximo de URL de la app de mensajería; para los
 * autómatas de esta materia, comprimidos, no llega ni cerca.
 */

import { type Documento, desdeObjeto } from './documento'

const PARAMETRO = 'd'

function aBase64Url(bytes: Uint8Array): string {
  let binario = ''
  for (const b of bytes) binario += String.fromCharCode(b)
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function desdeBase64Url(texto: string): Uint8Array {
  const base = texto.replace(/-/g, '+').replace(/_/g, '/')
  const binario = atob(base + '==='.slice((base.length + 3) % 4))
  const bytes = new Uint8Array(binario.length)
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i)
  return bytes
}

async function comprimir(texto: string): Promise<Uint8Array> {
  const datos = new TextEncoder().encode(texto)
  // CompressionStream no está en navegadores viejos; ahí se manda sin comprimir.
  if (typeof CompressionStream === 'undefined') return datos
  const flujo = new Blob([datos as BlobPart]).stream().pipeThrough(new CompressionStream('deflate-raw'))
  return new Uint8Array(await new Response(flujo).arrayBuffer())
}

async function descomprimir(bytes: Uint8Array): Promise<string> {
  if (typeof DecompressionStream === 'undefined') return new TextDecoder().decode(bytes)
  try {
    const flujo = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
    return await new Response(flujo).text()
  } catch {
    // Puede venir sin comprimir, de un navegador que no tenía CompressionStream.
    return new TextDecoder().decode(bytes)
  }
}

/** Versión mínima del documento: lo que hace falta para reconstruirlo. */
function aMinimo(doc: Documento) {
  return {
    t: doc.titulo,
    n: doc.notas || undefined,
    au: doc.autor || undefined,
    a: {
      e: doc.automata.estados.map((e) => [e.id, e.nombre, Math.round(e.x), Math.round(e.y)]),
      s: doc.automata.alfabeto,
      tr: doc.automata.transiciones.map((t) => [t.desde, t.simbolo, t.hasta]),
      i: doc.automata.inicial,
      f: doc.automata.finales,
    },
  }
}

function desdeMinimo(m: ReturnType<typeof aMinimo>): Documento {
  return desdeObjeto({
    titulo: m.t,
    notas: m.n ?? '',
    autor: m.au ?? '',
    automata: {
      estados: m.a.e.map((e) => ({ id: e[0], nombre: e[1], x: e[2], y: e[3] })),
      alfabeto: m.a.s,
      transiciones: m.a.tr.map((t) => ({ desde: t[0], simbolo: t[1], hasta: t[2] })),
      inicial: m.a.i,
      finales: m.a.f,
    },
  })
}

/** Devuelve la URL completa para compartir este documento. */
export async function enlaceDe(doc: Documento, base = location.href): Promise<string> {
  const dato = aBase64Url(await comprimir(JSON.stringify(aMinimo(doc))))
  const url = new URL(base)
  url.hash = PARAMETRO + '=' + dato
  return url.toString()
}

/** Lee el documento que venga en el fragmento de la URL, si hay alguno. */
export async function documentoDelEnlace(hash = location.hash): Promise<Documento | null> {
  const limpio = hash.replace(/^#/, '')
  if (!limpio.startsWith(PARAMETRO + '=')) return null
  try {
    const texto = await descomprimir(desdeBase64Url(limpio.slice(PARAMETRO.length + 1)))
    return desdeMinimo(JSON.parse(texto))
  } catch {
    return null
  }
}

/** Saca el documento de la barra de direcciones sin recargar ni ensuciar el historial. */
export function limpiarEnlace() {
  history.replaceState(null, '', location.pathname + location.search)
}

/** Copia al portapapeles, con respaldo para los navegadores que no lo permiten. */
export async function copiar(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto)
    return true
  } catch {
    try {
      const area = document.createElement('textarea')
      area.value = texto
      area.style.position = 'fixed'
      area.style.opacity = '0'
      document.body.appendChild(area)
      area.select()
      const ok = document.execCommand('copy')
      area.remove()
      return ok
    } catch {
      return false
    }
  }
}
