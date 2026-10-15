import { type Automata, clasificar, tieneEpsilon } from './automaton'
import type { Actividad } from '../data/catalogo'
import { corregir, type Correccion } from './correccion'
import { equivalentes, explicar } from './equivalence'
import { erAMinimo } from './pipeline'
import { minimizar } from './minimize'
import { subconjuntos } from './subset'

export interface Borrador {
  expresion: string
  desarrollo: string
  noRegular?: boolean
  diagramas: Record<string, Automata>
  resultado?: Correccion
  actualizado?: string
  fuenteB?: number
  revisado?: boolean
}
export const vacio = (): Borrador => ({ expresion: '', desarrollo: '', diagramas: {} })
export function etapasDe(a: Actividad): string[] {
  if (a.tarea === 'lenguaje') return ['Autómata']
  if (a.tarea === 'er-afn') return ['AFN-ε']
  if (a.tarea === 'er-minimo') return ['AFD mínimo']
  if (a.tarea === 'recorrido') return ['AFN-ε', 'AFD', 'AFD mínimo']
  return []
}
export function pideER(a: Actividad): boolean {
  return ['lenguaje', 'af-er', 'recorrido'].includes(a.tarea) && !a.soloAutomata
}
function verificarDiagrama(a: Automata, referencia: string, etapa: string, alfabeto: string[]): Correccion {
  const ids = new Set(a.estados.map(e => e.id))
  if (a.transiciones.some(t => !ids.has(t.desde) || !ids.has(t.hasta) || (t.simbolo !== '' && !a.alfabeto.includes(t.simbolo))) || a.finales.some(id => !ids.has(id))) return { veredicto: 'error', mensaje: `${etapa}: hay estados o símbolos inexistentes. Revisá la tabla antes de corregir.` }
  if (!a.inicial || !a.estados.some(e => e.id === a.inicial)) return { veredicto: 'sin-respuesta', mensaje: `${etapa}: marcá un estado inicial.` }
  const esperado = erAMinimo(referencia)
  const r = equivalentes(a, esperado)
  if (!r.equivalentes) return { veredicto: 'incorrecto', mensaje: `${etapa}: ${explicar(r)}`, contraejemplo: r.contraejemplo }
  if (etapa === 'AFN-ε' && !tieneEpsilon(a)) return { veredicto: 'incorrecto', mensaje: 'El lenguaje coincide, pero esta etapa pide construir un AFN-ε. Mostrá las conexiones ε de los fragmentos de Thompson y su tabla.' }
  if (etapa.startsWith('AFD')) {
    const ampliado = { ...a, alfabeto: [...new Set([...a.alfabeto, ...alfabeto, ...esperado.alfabeto])] }
    if (clasificar(ampliado) !== 'AFD') return { veredicto: 'incorrecto', mensaje: `${etapa}: el lenguaje coincide, pero faltan transiciones o hay no determinismo. Completá una transición por estado y símbolo.` }
    const minimo = minimizar(subconjuntos({ ...esperado, alfabeto: ampliado.alfabeto }).afd).minimo
    if (etapa === 'AFD mínimo' && a.estados.length !== minimo.estados.length) return { veredicto: 'incorrecto', mensaje: `El lenguaje coincide, pero usaste ${a.estados.length} estados; el AFD mínimo completo tiene ${minimo.estados.length}. Revisá estados equivalentes o inaccesibles.` }
  }
  return { veredicto: 'correcto', mensaje: `${etapa}: lenguaje y formato correctos. La tabla se obtiene del diagrama guardado.` }
}
export function evaluarActividad(a: Actividad, b: Borrador): Correccion {
  if (a.tarea === 'lisp') return { veredicto: 'sin-respuesta', mensaje: 'Revisión externa pendiente. Copiá tu código y los casos de prueba para revisarlos con IA o con tu docente.' }
  if (b.noRegular && a.lenguaje) {
    const r = corregir(a.lenguaje, { noEsRegular: true })
    return r.veredicto === 'correcto' && !b.desarrollo.trim()
      ? { veredicto: 'sin-respuesta', mensaje: 'La clasificación es correcta. Agregá tu justificación; su demostración se revisa con IA o con tu docente.' }
      : { ...r, advertencia: r.veredicto === 'correcto' ? 'La clasificación está verificada; la demostración escrita necesita revisión externa.' : undefined }
  }
  const ref = a.expresion ?? a.lenguaje?.referencia
  if (!ref) return { veredicto: 'incorrecto', mensaje: 'Revisá si el lenguaje se puede reconocer con un autómata finito. Justificá tu decisión.' }
  const resultados: Correccion[] = []
  if (pideER(a)) resultados.push(corregir({ regular: true, referencia: ref, alfabeto: a.alfabeto.length ? a.alfabeto : erAMinimo(ref).alfabeto }, { expresion: b.expresion }))
  for (const etapa of etapasDe(a)) {
    const diagrama = b.diagramas[etapa]
    resultados.push(diagrama ? verificarDiagrama(diagrama, ref, etapa, a.alfabeto) : { veredicto: 'sin-respuesta', mensaje: `Falta adjuntar: ${etapa}. Dibujalo en el editor y guardá una copia en esta respuesta.` })
  }
  const fallo = resultados.find(r => r.veredicto === 'error' || r.veredicto === 'incorrecto') ?? resultados.find(r => r.veredicto !== 'correcto')
  return fallo ?? { veredicto: 'correcto', mensaje: 'La respuesta completa reconoce el lenguaje pedido y cumple el formato. Revisá también el procedimiento escrito.', advertencia: resultados.map(r => r.advertencia).filter(Boolean).join(' ') || undefined }
}
