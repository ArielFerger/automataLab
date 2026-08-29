/**
 * Exportación del documento como imagen.
 *
 * Se arma un SVG completo — título, diagrama y tabla de transiciones — y de ahí
 * sale el PNG. Hacerlo en un solo SVG evita tener que dibujar la tabla a mano
 * sobre un canvas, y de paso deja el SVG disponible para quien lo quiera con
 * calidad de imprenta.
 *
 * Ojo con las tipografías: la imagen se rasteriza desde un blob aislado, donde
 * las fuentes web no cargan. Por eso el SVG exportado pide familias genéricas.
 */

import { type Automata, EPSILON, EPSILON_LABEL, destinos, nombreDe, tieneEpsilon } from './automaton'
import type { Documento } from './documento'
import { limites } from './layout'
import { RADIO, RADIO_FINAL, agruparTransiciones, arcoBucle, arcoEntre, flechaInicial } from './geometria'

/** Paleta fija: la imagen se comparte, así que no sigue el tema de la app. */
const TINTA = '#141b26'
const SUAVE = '#5b6675'
const TENUE = '#8b95a3'
const LINEA = '#dfe3e9'
const AZUL = '#1b4fa0'
const VERDE = '#15704a'
const FONDO = '#ffffff'

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
const SANS = 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif'

function escapar(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** El diagrama, ya trasladado para que arranque en (0, 0). */
function diagrama(a: Automata): { svg: string; ancho: number; alto: number } {
  if (a.estados.length === 0) return { svg: '', ancho: 0, alto: 0 }
  const l = limites(a, 60)
  const partes: string[] = []

  const inicial = a.estados.find((e) => e.id === a.inicial)
  if (inicial) {
    partes.push(
      `<path d="${flechaInicial(inicial)}" stroke="${AZUL}" stroke-width="1.6" fill="none" marker-end="url(#pf)"/>`,
    )
  }

  for (const m of agruparTransiciones(a)) {
    const desde = a.estados.find((e) => e.id === m.desde)
    const hasta = a.estados.find((e) => e.id === m.hasta)
    if (!desde || !hasta) continue
    const arco = m.desde === m.hasta ? arcoBucle(desde) : arcoEntre(desde, hasta, m.curvatura)
    const texto = m.simbolos.map((s) => (s === EPSILON ? EPSILON_LABEL : s)).join(', ')
    const ancho = texto.length * 7.2 + 8
    partes.push(
      `<path d="${arco.d}" stroke="${SUAVE}" stroke-width="1.4" fill="none" marker-end="url(#pn)"/>`,
      `<rect x="${arco.etiqueta.x - ancho / 2}" y="${arco.etiqueta.y - 9}" width="${ancho}" height="16" rx="3" fill="${FONDO}"/>`,
      `<text x="${arco.etiqueta.x}" y="${arco.etiqueta.y + 4}" font-family="${MONO}" font-size="12" fill="${TINTA}" text-anchor="middle">${escapar(texto)}</text>`,
    )
  }

  for (const e of a.estados) {
    partes.push(
      `<circle cx="${e.x}" cy="${e.y}" r="${RADIO}" fill="${FONDO}" stroke="${TINTA}" stroke-width="1.5"/>`,
    )
    if (a.finales.includes(e.id)) {
      partes.push(
        `<circle cx="${e.x}" cy="${e.y}" r="${RADIO_FINAL}" fill="none" stroke="${TINTA}" stroke-width="1.5"/>`,
      )
    }
    partes.push(
      `<text x="${e.x}" y="${e.y}" font-family="${MONO}" font-size="13" fill="${TINTA}" text-anchor="middle" dominant-baseline="central">${escapar(e.nombre)}</text>`,
    )
  }

  return {
    svg: `<g transform="translate(${-l.x} ${-l.y})">${partes.join('')}</g>`,
    ancho: l.ancho,
    alto: l.alto,
  }
}

/** La tabla de transiciones dibujada como SVG. */
function tabla(a: Automata): { svg: string; ancho: number; alto: number } {
  if (a.estados.length === 0) return { svg: '', ancho: 0, alto: 0 }
  const columnas = [...a.alfabeto]
  if (tieneEpsilon(a)) columnas.push(EPSILON)

  const filaAlto = 24
  const anchoEstado = 92
  const anchoCelda = Math.max(
    72,
    ...a.estados.flatMap((e) =>
      columnas.map((s) => destinos(a, e.id, s).map((id) => nombreDe(a, id)).join(', ').length * 7.5 + 18),
    ),
  )
  const ancho = anchoEstado + columnas.length * anchoCelda
  const alto = (a.estados.length + 1) * filaAlto
  const partes: string[] = []

  const celda = (x: number, y: number, w: number, texto: string, opciones: { fondo?: string; color?: string; peso?: string } = {}) => {
    partes.push(
      `<rect x="${x}" y="${y}" width="${w}" height="${filaAlto}" fill="${opciones.fondo ?? FONDO}" stroke="${LINEA}" stroke-width="1"/>`,
      `<text x="${x + 8}" y="${y + filaAlto / 2 + 4}" font-family="${MONO}" font-size="12" fill="${opciones.color ?? TINTA}" font-weight="${opciones.peso ?? 'normal'}">${escapar(texto)}</text>`,
    )
  }

  celda(0, 0, anchoEstado, 'δ', { fondo: '#f6f7f9', color: SUAVE, peso: '600' })
  columnas.forEach((s, i) => {
    celda(anchoEstado + i * anchoCelda, 0, anchoCelda, s === EPSILON ? EPSILON_LABEL : s, {
      fondo: '#f6f7f9',
      color: SUAVE,
      peso: '600',
    })
  })

  a.estados.forEach((e, fila) => {
    const y = (fila + 1) * filaAlto
    const marca = (a.inicial === e.id ? '→' : '') + (a.finales.includes(e.id) ? '∗' : '')
    celda(0, y, anchoEstado, marca + e.nombre, {
      fondo: '#f6f7f9',
      color: a.finales.includes(e.id) ? VERDE : TINTA,
    })
    columnas.forEach((s, i) => {
      const ds = destinos(a, e.id, s).map((id) => nombreDe(a, id)).join(', ')
      celda(anchoEstado + i * anchoCelda, y, anchoCelda, ds || '–', { color: ds ? TINTA : TENUE })
    })
  })

  return { svg: partes.join(''), ancho, alto }
}

export interface OpcionesExportacion {
  /** incluir la tabla de transiciones debajo del diagrama */
  conTabla: boolean
  /** incluir las notas del documento */
  conNotas: boolean
}

/** Arma el SVG completo del documento, listo para guardar o rasterizar. */
export function svgDelDocumento(doc: Documento, opciones: OpcionesExportacion): string {
  const margen = 28
  const d = diagrama(doc.automata)
  const t = opciones.conTabla ? tabla(doc.automata) : { svg: '', ancho: 0, alto: 0 }

  const altoTitulo = 34
  const notas = opciones.conNotas && doc.notas.trim() ? doc.notas.trim().split('\n').slice(0, 6) : []
  const altoNotas = notas.length ? notas.length * 17 + 10 : 0
  const separacion = t.alto ? 22 : 0

  const ancho = Math.max(d.ancho, t.ancho, 420) + margen * 2
  const alto = altoTitulo + altoNotas + d.alto + separacion + t.alto + margen * 2 + 18

  let y = margen + 20
  const cuerpo: string[] = []

  cuerpo.push(
    `<text x="${margen}" y="${y}" font-family="${SANS}" font-size="17" font-weight="700" fill="${TINTA}">${escapar(doc.titulo)}</text>`,
  )
  y += 14

  for (const linea of notas) {
    y += 17
    cuerpo.push(
      `<text x="${margen}" y="${y}" font-family="${SANS}" font-size="12.5" fill="${SUAVE}">${escapar(linea)}</text>`,
    )
  }
  y += notas.length ? 14 : 6

  if (d.svg) {
    cuerpo.push(`<g transform="translate(${margen} ${y})">${d.svg}</g>`)
    y += d.alto + separacion
  }
  if (t.svg) {
    cuerpo.push(`<g transform="translate(${margen} ${y})">${t.svg}</g>`)
    y += t.alto
  }

  cuerpo.push(
    `<text x="${margen}" y="${alto - margen + 4}" font-family="${SANS}" font-size="10.5" fill="${TENUE}">Σ = {${escapar(doc.automata.alfabeto.join(', '))}} · hecho con AutómataLab</text>`,
  )

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}">`,
    '<defs>',
    `<marker id="pn" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 1 L 10 5 L 0 9 z" fill="${SUAVE}"/></marker>`,
    `<marker id="pf" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 1 L 10 5 L 0 9 z" fill="${AZUL}"/></marker>`,
    '</defs>',
    `<rect width="${ancho}" height="${alto}" fill="${FONDO}"/>`,
    cuerpo.join(''),
    '</svg>',
  ].join('')
}

/** Rasteriza el SVG a PNG. `escala` 2 deja una imagen nítida en pantallas retina. */
export async function pngDelDocumento(
  doc: Documento,
  opciones: OpcionesExportacion,
  escala = 2,
): Promise<Blob> {
  const svg = svgDelDocumento(doc, opciones)
  const medidas = svg.match(/width="(\d+(?:\.\d+)?)" height="(\d+(?:\.\d+)?)"/)
  const ancho = Number(medidas?.[1] ?? 800)
  const alto = Number(medidas?.[2] ?? 600)

  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }))
  try {
    const imagen = await new Promise<HTMLImageElement>((resolver, rechazar) => {
      const img = new Image()
      img.onload = () => resolver(img)
      img.onerror = () => rechazar(new Error('No se pudo rasterizar el diagrama.'))
      img.src = url
    })

    const lienzo = document.createElement('canvas')
    lienzo.width = Math.round(ancho * escala)
    lienzo.height = Math.round(alto * escala)
    const ctx = lienzo.getContext('2d')
    if (!ctx) throw new Error('El navegador no permitió crear la imagen.')
    ctx.fillStyle = FONDO
    ctx.fillRect(0, 0, lienzo.width, lienzo.height)
    ctx.drawImage(imagen, 0, 0, lienzo.width, lienzo.height)

    return await new Promise<Blob>((resolver, rechazar) => {
      lienzo.toBlob((b) => (b ? resolver(b) : rechazar(new Error('No se pudo generar el PNG.'))), 'image/png')
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}
