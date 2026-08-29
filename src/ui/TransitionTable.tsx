import { useState } from 'react'
import {
  type Automata,
  EPSILON,
  EPSILON_LABEL,
  agregarTransicion,
  clonar,
  destinos,
  nombreDe,
  tieneEpsilon,
} from '../core/automaton'
import { type Foco, celdaEnFoco } from './foco'

interface Props {
  automata: Automata
  onCambio: (a: Automata) => void
  foco: Foco
  onFoco: (f: Foco) => void
  /** estados activos del paso actual del reconocimiento */
  activos?: string[]
  soloLectura?: boolean
}

/**
 * Representación tabular de δ: filas los estados, columnas los símbolos.
 * Es la forma en que la cátedra pide entregar la función de transición, y acá
 * además funciona como editor: cada celda se escribe con los nombres de los
 * estados destino separados por coma.
 */
export function TransitionTable({ automata, onCambio, foco, onFoco, activos = [], soloLectura }: Props) {
  const [editando, setEditando] = useState<{ estado: string; simbolo: string } | null>(null)
  const [borrador, setBorrador] = useState('')

  const columnas = [...automata.alfabeto]
  if (tieneEpsilon(automata)) columnas.push(EPSILON)

  if (automata.estados.length === 0) {
    return <p className="vacio">Todavía no hay estados. Usá la herramienta Estado para crear el primero.</p>
  }

  function abrir(estado: string, simbolo: string) {
    if (soloLectura) return
    setEditando({ estado, simbolo })
    setBorrador(destinos(automata, estado, simbolo).map((id) => nombreDe(automata, id)).join(', '))
  }

  function guardar() {
    if (!editando) return
    const { estado, simbolo } = editando
    const nombres = borrador
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    let r = clonar(automata)
    // Se reemplaza la celda entera: primero se quitan las transiciones viejas.
    r.transiciones = r.transiciones.filter((t) => !(t.desde === estado && t.simbolo === simbolo))
    for (const nombre of nombres) {
      const destino = r.estados.find((e) => e.nombre === nombre || e.id === nombre)
      if (destino) r = agregarTransicion(r, estado, destino.id, simbolo)
    }
    onCambio(r)
    setEditando(null)
  }

  return (
    <table className="tabla">
      <thead>
        <tr>
          <th style={{ width: '1%' }}>δ</th>
          {columnas.map((s) => (
            <th key={s || 'eps'}>{s === EPSILON ? EPSILON_LABEL : s}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {automata.estados.map((e) => (
          <tr key={e.id}>
            <th onMouseEnter={() => onFoco({ tipo: 'arco', desde: e.id, hasta: e.id })} onMouseLeave={() => onFoco(null)}>
              {automata.inicial === e.id && <span className="marca-inicial">→</span>}
              {automata.finales.includes(e.id) && <span className="marca-final">∗</span>}
              {e.nombre}
            </th>
            {columnas.map((s) => {
              const ds = destinos(automata, e.id, s)
              const editandoEsta = editando?.estado === e.id && editando.simbolo === s
              const clases = [
                soloLectura ? '' : 'celda-editable',
                celdaEnFoco(automata, foco, e.id, s) ? 'resaltada' : '',
                activos.includes(e.id) ? 'activa' : '',
                ds.length === 0 ? 'vacia' : '',
              ]
                .filter(Boolean)
                .join(' ')

              return (
                <td
                  key={s || 'eps'}
                  className={clases}
                  onMouseEnter={() => onFoco({ tipo: 'celda', desde: e.id, simbolo: s })}
                  onMouseLeave={() => onFoco(null)}
                  onClick={() => !editandoEsta && abrir(e.id, s)}
                >
                  {editandoEsta ? (
                    <input
                      autoFocus
                      className="campo mono"
                      style={{ padding: '1px 3px', minWidth: 62 }}
                      value={borrador}
                      onChange={(ev) => setBorrador(ev.target.value)}
                      onBlur={guardar}
                      onKeyDown={(ev) => {
                        if (ev.key === 'Enter') guardar()
                        if (ev.key === 'Escape') setEditando(null)
                      }}
                    />
                  ) : ds.length === 0 ? (
                    '–'
                  ) : (
                    ds.map((id) => nombreDe(automata, id)).join(', ')
                  )}
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
