import { describe, expect, it } from 'vitest'
import { deserializar, documentoNuevo, nombreDeArchivo, serializar } from '../src/core/documento'
import { documentoDelEnlace, enlaceDe } from '../src/core/enlace'
import { svgDelDocumento } from '../src/core/exportar'
import { ejemploLongitudPar } from '../src/store/useAutomaton'

function ejemplo() {
  const d = documentoNuevo('Ejercicio 1', ejemploLongitudPar())
  d.notas = 'Cadenas de longitud par sobre {a, b}.'
  d.autor = 'Ariel'
  return d
}

describe('documento', () => {
  it('guarda y vuelve a abrir sin perder nada', () => {
    const original = ejemplo()
    const vuelta = deserializar(serializar(original))
    expect(vuelta.titulo).toBe(original.titulo)
    expect(vuelta.notas).toBe(original.notas)
    expect(vuelta.autor).toBe(original.autor)
    expect(vuelta.automata).toEqual(original.automata)
  })

  it('abre también los archivos del formato viejo, que eran un autómata suelto', () => {
    const viejo = JSON.stringify(ejemploLongitudPar())
    const doc = deserializar(viejo)
    expect(doc.titulo).toBe('Autómata importado')
    expect(doc.automata.estados).toHaveLength(2)
  })

  it('rechaza un archivo que no tenga un autómata', () => {
    expect(() => deserializar('{"cualquier":"cosa"}')).toThrow()
    expect(() => deserializar('[]')).toThrow()
  })

  it('arma nombres de archivo usables a partir del título', () => {
    expect(nombreDeArchivo('Ejercicio 1', 'png')).toBe('ejercicio-1.png')
    expect(nombreDeArchivo('Autómata Nº3 — práctica', 'json')).toBe('automata-n3-practica.json')
    expect(nombreDeArchivo('   ', 'svg')).toBe('automata.svg')
  })
})

describe('compartir por link', () => {
  it('el autómata sobrevive la ida y vuelta por la URL', async () => {
    const original = ejemplo()
    const url = await enlaceDe(original, 'https://automatalab.app/')
    const vuelta = await documentoDelEnlace(new URL(url).hash)
    expect(vuelta).not.toBeNull()
    expect(vuelta?.titulo).toBe('Ejercicio 1')
    expect(vuelta?.autor).toBe('Ariel')
    expect(vuelta?.automata.estados.map((e) => e.nombre)).toEqual(['q0', 'q1'])
    expect(vuelta?.automata.transiciones).toHaveLength(4)
    expect(vuelta?.automata.finales).toEqual(['q0'])
  })

  it('el link entra cómodo en un mensaje', async () => {
    const url = await enlaceDe(ejemplo(), 'https://automatalab.app/')
    expect(url.length).toBeLessThan(600)
  })

  it('una URL sin autómata no devuelve nada, y una rota tampoco explota', async () => {
    expect(await documentoDelEnlace('')).toBeNull()
    expect(await documentoDelEnlace('#otracosa=1')).toBeNull()
    expect(await documentoDelEnlace('#d=no-es-base64-valido!!')).toBeNull()
  })
})

describe('exportar', () => {
  it('el SVG trae el título, los estados y la tabla', () => {
    const svg = svgDelDocumento(ejemplo(), { conTabla: true, conNotas: true })
    expect(svg.startsWith('<svg')).toBe(true)
    expect(svg).toContain('Ejercicio 1')
    expect(svg).toContain('Cadenas de longitud par')
    expect(svg).toContain('δ')
    expect(svg).toContain('→∗q0')
  })

  it('sin tabla la imagen sale más chica', () => {
    const alto = (svg: string) => Number(svg.match(/height="(\d+(?:\.\d+)?)"/)?.[1])
    const con = svgDelDocumento(ejemplo(), { conTabla: true, conNotas: false })
    const sin = svgDelDocumento(ejemplo(), { conTabla: false, conNotas: false })
    expect(alto(sin)).toBeLessThan(alto(con))
  })

  it('escapa los caracteres que romperían el XML', () => {
    const doc = documentoNuevo('a < b & "c"', ejemploLongitudPar())
    const svg = svgDelDocumento(doc, { conTabla: false, conNotas: false })
    expect(svg).toContain('a &lt; b &amp; &quot;c&quot;')
    expect(svg).not.toContain('a < b &')
  })
})
