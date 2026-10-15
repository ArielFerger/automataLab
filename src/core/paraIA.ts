import { type Automata, clasificar } from './automaton'
import type { Actividad } from '../data/catalogo'
import type { Borrador } from './actividad'

export function textoAutomata(a: Automata): string {
  const nombre = (id: string) => `${a.estados.find(e => e.id === id)?.nombre ?? id} [${id}]`
  const simbolos = [...new Set([...a.alfabeto, ...a.transiciones.map(t => t.simbolo)])]
  return [
    `Tipo detectado: ${clasificar(a)}`,
    `Σ = {${a.alfabeto.join(', ')}}`, `Estados: ${a.estados.map(e => nombre(e.id)).join(', ')}`,
    `Inicial: ${a.inicial ? nombre(a.inicial) : 'SIN MARCAR'}`, `Finales: ${a.finales.map(nombre).join(', ') || '∅'}`,
    'Tabla de transiciones (∅ significa sin destino; ε es la cadena vacía):',
    ['Estado', ...simbolos.map(s => s || 'ε')].join(' | '),
    ...a.estados.map(e => [nombre(e.id), ...simbolos.map(s => a.transiciones.filter(t => t.desde === e.id && t.simbolo === s).map(t => nombre(t.hasta)).join(', ') || '∅')].join(' | ')),
    'Datos completos del diagrama:', JSON.stringify(a, null, 2),
  ].join('\n')
}
export function textoRespuesta(a: Actividad, b: Borrador): string {
  return [
    `EJERCICIO ${a.id} · ${a.tema}`, 'ENUNCIADO', a.enunciado,
    a.alfabeto.length ? `Alfabeto: {${a.alfabeto.join(', ')}}` : '',
    a.lenguaje?.convencion ?? '',
    a.automata ? `DIAGRAMA DEL ENUNCIADO\n${textoAutomata(a.automata)}` : '',
    'MI RESPUESTA', b.noRegular ? 'Lo clasifico como no regular.' : '',
    b.expresion ? `Expresión regular: ${b.expresion}` : '',
    ...Object.entries(b.diagramas).map(([etapa, diagrama]) => `${etapa.toUpperCase()} ENTREGADO\n${textoAutomata(diagrama)}`),
    `Desarrollo / código / justificación / pruebas:\n${b.desarrollo || '(sin completar)'}`,
  ].filter(Boolean).join('\n\n')
}
export const PEDIDO_IA = 'Actuá como docente de Paradigmas y Lenguajes. Corregí mi entrega contra el enunciado. Separá errores de lenguaje, formato y procedimiento. Para autómatas, verificá equivalencia y buscá la cadena más corta que distingue mi respuesta. Revisá determinismo, completitud y minimalidad cuando se pidan. En LISP revisá casos base, recursión, casos límite y los ejemplos; indicá el dialecto que asumís y no afirmes haber ejecutado código si no lo hiciste. ε, λ y & representan cadena vacía; e es un símbolo literal; + representa unión. Si falta una parte, señalala. No des por correcto un procedimiento que no está escrito. Devolvé un veredicto por parte, un contraejemplo si corresponde y una pista concreta antes de mostrar una solución. Limitá la teoría a lo necesario para reparar mi respuesta.'
