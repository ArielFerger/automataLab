import { type Automata, EPSILON, EPSILON_LABEL } from '../core/automaton'
import { limites } from '../core/layout'
import { RADIO, RADIO_FINAL, agruparTransiciones, arcoBucle, arcoEntre, flechaInicial } from '../core/geometria'

interface Props {
  automata: Automata
  /** alto máximo en píxeles; el ancho lo toma del contenedor */
  alto?: number
  /** estados a resaltar (por ejemplo, el grupo de una partición) */
  resaltados?: string[]
}

/**
 * Diagrama de solo lectura, encuadrado solo. Es el que aparece en cada paso de
 * las conversiones: no se edita, se mira.
 */
export function Diagrama({ automata, alto = 220, resaltados = [] }: Props) {
  if (automata.estados.length === 0) {
    return <p className="vacio">Sin estados.</p>
  }

  const l = limites(automata, 70)
  const manojos = agruparTransiciones(automata)
  const inicial = automata.estados.find((e) => e.id === automata.inicial)

  return (
    <svg
      className="diagrama"
      viewBox={`${l.x} ${l.y} ${l.ancho} ${l.alto}`}
      style={{ maxHeight: alto }}
      role="img"
      aria-label="Diagrama de transiciones"
    >
      <defs>
        <marker id="d-punta" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--tinta-suave)" />
        </marker>
        <marker id="d-punta-azul" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--azul)" />
        </marker>
      </defs>

      {inicial && (
        <path d={flechaInicial(inicial)} stroke="var(--azul)" strokeWidth={1.6} fill="none" markerEnd="url(#d-punta-azul)" />
      )}

      {manojos.map((m) => {
        const a = automata.estados.find((e) => e.id === m.desde)
        const b = automata.estados.find((e) => e.id === m.hasta)
        if (!a || !b) return null
        const arco = m.desde === m.hasta ? arcoBucle(a, m.curvatura) : arcoEntre(a, b, m.curvatura)
        const texto = m.simbolos.map((s) => (s === EPSILON ? EPSILON_LABEL : s)).join(', ')
        return (
          <g className="arco" key={m.desde + '>' + m.hasta}>
            <path className="arco-linea" d={arco.d} markerEnd="url(#d-punta)" />
            <rect
              className="arco-fondo"
              x={arco.etiqueta.x - (texto.length * 7.2 + 8) / 2}
              y={arco.etiqueta.y - 9}
              width={texto.length * 7.2 + 8}
              height={16}
              rx={3}
            />
            <text className="arco-etiqueta" x={arco.etiqueta.x} y={arco.etiqueta.y + 4}>
              {texto}
            </text>
          </g>
        )
      })}

      {(automata.textos ?? []).map((t) => (
        <text key={t.id} className="texto-contenido" x={t.x} y={t.y + 9}>
          {t.contenido.split('\n')[0]}
        </text>
      ))}

      {automata.estados.map((e) => {
        const marcado = resaltados.includes(e.id)
        return (
          <g key={e.id} className={'nodo' + (marcado ? ' activo' : '')}>
            <circle
              cx={e.x}
              cy={e.y}
              r={RADIO}
              fill={marcado ? 'var(--ambar-suave)' : 'var(--papel-alto)'}
              stroke={marcado ? 'var(--ambar)' : 'var(--tinta)'}
              strokeWidth={marcado ? 2.4 : 1.5}
            />
            {automata.finales.includes(e.id) && (
              <circle
                cx={e.x}
                cy={e.y}
                r={RADIO_FINAL}
                fill="none"
                stroke={marcado ? 'var(--ambar)' : 'var(--tinta)'}
                strokeWidth={1.5}
              />
            )}
            <text className="nodo-etiqueta" x={e.x} y={e.y}>
              {e.nombre}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
