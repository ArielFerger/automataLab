import { describe, expect, it, vi } from 'vitest'
import { ACTIVIDADES, actividadB } from '../src/data/catalogo'
import { PARCIALES } from '../src/data/parciales'
import { evaluarActividad, vacio } from '../src/core/actividad'
import { actividadDeItem, armarExamen, entregar, segundosDe, sesionNueva, textoExamen, esSesionExamen } from '../src/core/examen'
import { convertirER, erAMinimo } from '../src/core/pipeline'
import { textoAutomata, textoRespuesta } from '../src/core/paraIA'
import { restaurarRespaldo, validarRespaldo, crearRespaldo } from '../src/core/respaldo'
import { simular } from '../src/core/simulate'

describe('práctica completa y corrección', () => {
  it('cubre A–E y los 54 ejercicios de LISP sin ids repetidos', () => {
    expect(['A', 'B', 'C', 'D', 'E', 'F'].map(g => ACTIVIDADES.filter(a => a.grupo === g).length)).toEqual([80, 10, 9, 8, 6, 54])
    expect(new Set(ACTIVIDADES.map(a => a.id)).size).toBe(167)
  })
  it('no aprueba A con una sola parte ni confunde la copia del editor con una respuesta', () => {
    const a = ACTIVIDADES.find(a => a.id === 'A5')!
    const b = { ...vacio(), expresion: '((a|b)(a|b))*' }
    expect(evaluarActividad(a, b).veredicto).toBe('sin-respuesta')
    b.diagramas.Autómata = erAMinimo(b.expresion)
    expect(evaluarActividad(a, b).veredicto).toBe('correcto')
    b.expresion = '(a|b)*'
    expect(evaluarActividad(a, b).veredicto).toBe('incorrecto')
  })
  it('C verifica el AFN-ε, no muestra por defecto un AFD resuelto', () => {
    const a = ACTIVIDADES.find(a => a.id === 'C1')!
    const c = convertirER(a.expresion!)
    expect(evaluarActividad(a, { ...vacio(), diagramas: { 'AFN-ε': c.thompson.automata } }).veredicto).toBe('correcto')
    expect(evaluarActividad(a, { ...vacio(), diagramas: { 'AFN-ε': c.minimo } }).veredicto).toBe('incorrecto')
  })
  it('rechaza un AFD equivalente con estados inaccesibles cuando se pide mínimo', () => {
    const a = ACTIVIDADES.find(a => a.id === 'D1')!
    const diagrama = erAMinimo(a.expresion!)
    diagrama.estados.push({ id: 'extra', nombre: 'extra', x: 0, y: 0 })
    for (const s of diagrama.alfabeto) diagrama.transiciones.push({ desde: 'extra', hasta: 'extra', simbolo: s })
    expect(evaluarActividad(a, { ...vacio(), diagramas: { 'AFD mínimo': diagrama } }).veredicto).toBe('incorrecto')
  })
  it('un integrador necesita las tres etapas y la expresión', () => {
    const a = ACTIVIDADES.find(a => a.id === 'E1')!
    const c = convertirER(a.lenguaje!.referencia!)
    const b = { ...vacio(), expresion: a.lenguaje!.referencia!, diagramas: { 'AFN-ε': c.thompson.automata, AFD: c.subconjuntos.afd, 'AFD mínimo': c.minimo } }
    expect(evaluarActividad(a, b).veredicto).toBe('correcto')
    expect(evaluarActividad(a, { ...b, diagramas: {} }).veredicto).toBe('sin-respuesta')
  })
  it('B admite la selección de otro ejercicio A sin cambiar la identidad del borrador', () => {
    expect(actividadB(1, 6).id).toBe('B1')
    expect(actividadB(1, 6).lenguaje?.id).toBe(6)
  })
  it('no evalúa LISP automáticamente ni confunde clasificación con demostración', () => {
    expect(evaluarActividad(ACTIVIDADES.find(a => a.id === 'F1')!, { ...vacio(), desarrollo: '(defun cuadrado (x) (* x x))' }).veredicto).toBe('sin-respuesta')
    expect(evaluarActividad(ACTIVIDADES.find(a => a.id === 'A34')!, { ...vacio(), noRegular: true }).veredicto).toBe('sin-respuesta')
  })
  it('la caché no permite que el editor contamine la referencia de corrección', () => {
    const a = erAMinimo('a*b')
    a.estados[0].nombre = 'modificado'
    a.transiciones.length = 0
    expect(erAMinimo('a*b').transiciones.length).toBeGreaterThan(0)
    expect(erAMinimo('a*b').estados[0].nombre).not.toBe('modificado')
  })
  it('corrige las clasificaciones heredadas de A57, A67 y A79 según sus enunciados', () => {
    const a57 = ACTIVIDADES.find(a => a.id === 'A57')!
    expect(a57.lenguaje?.regular).toBe(false)
    expect(a57.lenguaje?.referencia).toBeUndefined()
    const a67 = ACTIVIDADES.find(a => a.id === 'A67')!.lenguaje!
    const a79 = ACTIVIDADES.find(a => a.id === 'A79')!.lenguaje!
    expect(a67.regular).toBe(true)
    expect(simular(erAMinimo(a67.referencia!), 'bbbbbaaaaa').acepta).toBe(true)
    expect(simular(erAMinimo(a67.referencia!), 'baba').acepta).toBe(false)
    expect(a79.regular).toBe(true)
    for (const w of ['ab', 'aabb', 'aaaabbbb', 'abaabbb']) expect(simular(erAMinimo(a79.referencia!), w).acepta).toBe(true)
    expect(simular(erAMinimo(a79.referencia!), 'aab').acepta).toBe(false)
    expect(actividadB(1, 57).lenguaje?.id).toBe(5)
  })
})

describe('parciales y entregas', () => {
  it('los originales incluyen todos los diagramas y los finales correctos del recuperatorio 2025', () => {
    expect(PARCIALES.every(p => p.items[0].automata && !p.items[0].faltaDibujo)).toBe(true)
    expect(PARCIALES[3].items[0].automata?.finales).toEqual(['q0', 'q2'])
  })
  it('los diagramas recuperados de 2023 reconocen recorridos del original', () => {
    expect(simular(PARCIALES[0].items[0].automata!, '10').acepta).toBe(true)
    expect(simular(PARCIALES[0].items[0].automata!, '101').acepta).toBe(false)
    expect(simular(PARCIALES[1].items[0].automata!, 'ba').acepta).toBe(true)
    expect(simular(PARCIALES[1].items[0].automata!, 'aa').acepta).toBe(false)
  })
  it('genera variantes reproducibles con formato 20/60/20 y consignas realizables', () => {
    const firmas = new Set<string>()
    for (let n = 1; n <= 100; n++) {
      const p = armarExamen(n)
      expect(p.items.map(i => i.puntos)).toEqual([20, 60, 20])
      expect(p.items[2].ejercicio?.regular).toBe(true)
      expect(p).toEqual(armarExamen(n))
      firmas.add(JSON.stringify(p.items))
    }
    expect(firmas.size).toBe(100)
  })
  it('entrega una copia independiente, no aprueba partes vacías y conserva el nombre y tiempo', () => {
    const p = armarExamen(1)
    const s = sesionNueva()
    s.alumno = 'Estudiante'
    s.acumulado = 12
    s.inicio = 1000
    s.respuestas[1] = { ...vacio(), expresion: actividadDeItem(p.items[0]).expresion! }
    const e = entregar(p, s, 6000)
    expect(e.puntos).toBe(20)
    expect(e.segundos).toBe(17)
    s.respuestas[1].expresion = 'incorrecta'
    expect(e.respuestas[1].expresion).not.toBe('incorrecta')
    expect(textoExamen(p, { ...s, entrega: e })).toContain('Alumno: Estudiante')
    expect(textoExamen(p, { ...s, entrega: e })).not.toContain('Expresión regular: incorrecta')
  })
  it('el reloj usa tiempo real, incluso sin intervalos montados', () => {
    expect(segundosDe({ ...sesionNueva(), inicio: 1000, acumulado: 5 }, 61000)).toBe(65)
  })
})

describe('texto para IA y respaldo', () => {
  it('exporta el enunciado y los diagramas con ε, inicial, finales y transiciones inequívocas', () => {
    const a = ACTIVIDADES.find(a => a.id === 'C1')!
    const diagrama = convertirER(a.expresion!).thompson.automata
    const texto = textoRespuesta(a, { ...vacio(), diagramas: { 'AFN-ε': diagrama } })
    expect(texto).toContain(a.enunciado)
    expect(texto).toContain('Inicial:')
    expect(texto).toContain('Finales:')
    expect(textoAutomata(diagrama)).toContain('ε')
    expect(texto).toContain(JSON.stringify(diagrama, null, 2))
  })
  it('rechaza archivos ajenos y respuestas incompletas antes de importar', () => {
    expect(() => validarRespaldo('{"version":1}')).toThrow()
    expect(() => validarRespaldo(JSON.stringify({ formato: 'automatalab-respaldo', version: 1, datos: { 'automatalab:practica:v2': { A1: {} } } }))).toThrow()
    expect(esSesionExamen({ ...sesionNueva(), entrega: {} })).toBe(false)
    expect(esSesionExamen({ ...sesionNueva(), historial: [{ fecha: 'no-es-fecha' }] })).toBe(false)
  })
  it('restaura el respaldo sin perder ejercicios ajenos al archivo y sin importar claves arbitrarias', () => {
    const m = new Map<string, string>()
    vi.stubGlobal('localStorage', { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => m.set(k, v), removeItem: (k: string) => m.delete(k) })
    m.set('automatalab:practica:v2', JSON.stringify({ A1: { ...vacio(), expresion: 'a' } }))
    const respaldo = crearRespaldo()
    m.set('automatalab:practica:v2', JSON.stringify({ A2: vacio() }))
    restaurarRespaldo(validarRespaldo(respaldo))
    expect(Object.keys(JSON.parse(m.get('automatalab:practica:v2')!))).toEqual(['A2', 'A1'])
    expect(() => restaurarRespaldo({ cualquiera: 'dato' })).toThrow()
    vi.unstubAllGlobals()
  })
})
