import { describe, expect, it } from 'vitest'
import { deserializar, documentoNuevo, nombreDeArchivo, serializar } from '../src/core/documento'
import { documentoDelEnlace, enlaceDe } from '../src/core/enlace'
import { svgDelDocumento } from '../src/core/exportar'
import { limites } from '../src/core/layout'
import {
  ANGULO_BUCLE,
  CURVA_DOBLE,
  agruparTransiciones,
  anguloHacia,
  curvaturaHacia,
  RADIO,
  RADIO_BUCLE,
  RADIO_BUCLE_MINIMO,
  arcoBucle,
  bucleHacia,
} from '../src/core/geometria'
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

describe('flechas curvadas y cuadros de texto', () => {
  function conAdornos() {
    const d = ejemplo()
    d.automata.curvas = { 'q0>q1': 42.5, 'q1>q1': -90 }
    d.automata.textos = [{ id: 'txt0', contenido: 'Una nota\nen dos renglones', x: 120, y: 400 }]
    return d
  }

  it('sobreviven al guardar y volver a abrir', () => {
    const vuelta = deserializar(serializar(conAdornos()))
    expect(vuelta.automata.curvas).toEqual({ 'q0>q1': 42.5, 'q1>q1': -90 })
    expect(vuelta.automata.textos).toEqual([
      { id: 'txt0', contenido: 'Una nota\nen dos renglones', x: 120, y: 400 },
    ])
  })

  it('sobreviven al link compartido', async () => {
    const url = await enlaceDe(conAdornos(), 'https://automatalab.app/')
    const vuelta = await documentoDelEnlace(new URL(url).hash)
    expect(vuelta?.automata.curvas).toEqual({ 'q0>q1': 42.5, 'q1>q1': -90 })
    expect(vuelta?.automata.textos?.[0].contenido).toBe('Una nota\nen dos renglones')
  })

  it('descarta curvas con valores que no son números', () => {
    const roto = JSON.parse(serializar(ejemplo()))
    roto.automata.curvas = { 'q0>q1': 10, 'q1>q0': 'ochenta', 'q0>q0': null }
    expect(deserializar(JSON.stringify(roto)).automata.curvas).toEqual({ 'q0>q1': 10 })
  })

  it('el texto entra en la imagen exportada', () => {
    const svg = svgDelDocumento(conAdornos(), { conTabla: false, conNotas: false })
    expect(svg).toContain('Una nota')
    expect(svg).toContain('en dos renglones')
  })

  it('el encuadre incluye los textos, para que no se recorten', () => {
    const sin = limites({ ...ejemplo().automata, textos: undefined })
    const con = limites(conAdornos().automata)
    // El texto está bien abajo del diagrama: la caja tiene que crecer para taparlo.
    expect(con.alto).toBeGreaterThan(sin.alto)
    expect(con.y + con.alto).toBeGreaterThan(400)
  })
})

describe('curvatura de las flechas', () => {
  const conCurva = { ...ejemplo().automata, curvas: { 'q0>q1': 55 } }

  it('usa la curva elegida a mano y avisa que lo es', () => {
    const m = agruparTransiciones(conCurva).find((x) => x.desde === 'q0' && x.hasta === 'q1')
    expect(m?.curvatura).toBe(55)
    expect(m?.aMano).toBe(true)
  })

  it('sin elección, dos estados que se apuntan se curvan solos', () => {
    const m = agruparTransiciones(ejemplo().automata).find((x) => x.desde === 'q0')
    expect(m?.curvatura).toBe(CURVA_DOBLE)
    expect(m?.aMano).toBe(false)
  })

  it('un bucle sin elección se apoya arriba del estado', () => {
    const a = ejemplo().automata
    a.transiciones.push({ desde: 'q0', hasta: 'q0', simbolo: 'a' })
    const m = agruparTransiciones(a).find((x) => x.desde === 'q0' && x.hasta === 'q0')
    expect(m?.curvatura).toBe(ANGULO_BUCLE)
  })

  it('curvaturaHacia es la inversa: la flecha pasa por donde se la arrastra', () => {
    const a = { x: 100, y: 200 }
    const b = { x: 400, y: 200 }
    // Perpendicular a un tramo horizontal: mover en y equivale a curvar.
    for (const k of [-80, -20, 30, 120]) {
      const objetivo = { x: 250, y: 200 + k }
      expect(Math.round(curvaturaHacia(a, b, objetivo))).toBe(k)
    }
  })

  it('anguloHacia apunta al lado donde se suelta el bucle', () => {
    const centro = { x: 100, y: 100 }
    expect(Math.round(anguloHacia(centro, { x: 100, y: 40 }))).toBe(-90)
    expect(Math.round(anguloHacia(centro, { x: 160, y: 100 }))).toBe(0)
  })
})

describe('geometría del bucle', () => {
  const centro = { x: 200, y: 200 }
  const lejos = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y)

  it('el vértice queda fuera del estado, no tapado por él', () => {
    // Era el error: con los controles fijos el vértice caía a 22 px del centro
    // y el estado mide 23 de radio, así que el bucle nacía adentro.
    const v = arcoBucle(centro).vertice
    expect(lejos(v, centro)).toBeGreaterThan(RADIO + 10)
  })

  it('el vértice cae exactamente al radio pedido', () => {
    for (const r of [40, 58, 90, 160]) {
      expect(Math.round(lejos(arcoBucle(centro, -90, r).vertice, centro))).toBe(r)
    }
  })

  it('se puede agrandar y achicar', () => {
    const chico = lejos(arcoBucle(centro, -90, 40).vertice, centro)
    const grande = lejos(arcoBucle(centro, -90, 150).vertice, centro)
    expect(grande).toBeGreaterThan(chico * 2)
  })

  it('no se puede achicar hasta quedar adentro del estado', () => {
    const v = arcoBucle(centro, -90, 1).vertice
    expect(lejos(v, centro)).toBeGreaterThanOrEqual(RADIO_BUCLE_MINIMO - 0.5)
  })

  it('el ángulo lo lleva alrededor del estado', () => {
    expect(arcoBucle(centro, -90, 80).vertice.y).toBeLessThan(centro.y)
    expect(arcoBucle(centro, 90, 80).vertice.y).toBeGreaterThan(centro.y)
    expect(arcoBucle(centro, 0, 80).vertice.x).toBeGreaterThan(centro.x)
    expect(arcoBucle(centro, 180, 80).vertice.x).toBeLessThan(centro.x)
  })

  it('bucleHacia es la inversa: el bucle pasa por donde se lo arrastra', () => {
    for (const objetivo of [
      { x: 200, y: 110 },
      { x: 300, y: 200 },
      { x: 140, y: 260 },
    ]) {
      const { angulo, radio } = bucleHacia(centro, objetivo)
      const v = arcoBucle(centro, angulo, radio).vertice
      expect(Math.round(v.x)).toBe(objetivo.x)
      expect(Math.round(v.y)).toBe(objetivo.y)
    }
  })

  it('guarda y recupera el ángulo con el tamaño', () => {
    const d = ejemplo()
    d.automata.transiciones.push({ desde: 'q0', hasta: 'q0', simbolo: 'a' })
    d.automata.curvas = { 'q0>q0': { angulo: 35, radio: 120 } }
    const vuelta = deserializar(serializar(d))
    expect(vuelta.automata.curvas).toEqual({ 'q0>q0': { angulo: 35, radio: 120 } })
    const m = agruparTransiciones(vuelta.automata).find((x) => x.desde === 'q0' && x.hasta === 'q0')
    expect(m?.curvatura).toBe(35)
    expect(m?.radio).toBe(120)
  })

  it('un archivo viejo, con solo el ángulo, se sigue leyendo', () => {
    const d = ejemplo()
    d.automata.transiciones.push({ desde: 'q0', hasta: 'q0', simbolo: 'a' })
    // Formato anterior: el bucle guardaba un número suelto.
    d.automata.curvas = { 'q0>q0': 20 }
    const m = agruparTransiciones(deserializar(serializar(d)).automata).find((x) => x.desde === x.hasta)
    expect(m?.curvatura).toBe(20)
    expect(m?.radio).toBe(RADIO_BUCLE)
  })
})
