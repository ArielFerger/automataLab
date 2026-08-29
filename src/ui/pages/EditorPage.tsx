import { useState } from 'react'
import {
  type Automata,
  alternarFinal,
  clasificar,
  clonar,
  motivoNoAFD,
  quitarEstado,
  renumerar,
} from '../../core/automaton'
import { autoDisponer } from '../../core/layout'
import { probarLote } from '../../core/simulate'
import { type Historia, automataNuevo } from '../../store/useAutomaton'
import { BarraDocumento } from '../BarraDocumento'
import { Canvas, type ClaveArco } from '../Canvas'
import { TransitionTable } from '../TransitionTable'
import { StringTester } from '../StringTester'
import type { Foco } from '../foco'

export function EditorPage({ historia }: { historia: Historia }) {
  const { automata, setAutomata, setSinHistoria } = historia
  const [seleccion, setSeleccion] = useState<string | null>(null)
  const [foco, setFoco] = useState<Foco>(null)
  const [reconocimiento, setReconocimiento] = useState<{ activos: string[]; arcos: ClaveArco[] }>({
    activos: [],
    arcos: [],
  })

  const tipo = clasificar(automata)
  const motivo = motivoNoAFD(automata)
  const elegido = automata.estados.find((e) => e.id === seleccion) ?? null

  return (
    <div className="editor-envoltorio">
      <BarraDocumento
        documento={historia.documento}
        onTitulo={historia.setTitulo}
        onNotas={historia.setNotas}
        onAbrir={historia.abrir}
      />
      <div className="editor">
      <div className="editor-izq">
        <Canvas
          automata={automata}
          onCambio={setSinHistoria}
          seleccion={seleccion}
          onSeleccion={setSeleccion}
          foco={foco}
          onFoco={setFoco}
          activos={reconocimiento.activos}
          arcosActivos={reconocimiento.arcos}
        />
        <StringTester automata={automata} onPaso={setReconocimiento} />
      </div>

      <div className="panel">
        <section className="seccion">
          <h2 className="seccion-titulo">
            Autómata
            <span className={'chapa ' + (tipo === 'AFD' ? 'afd' : 'afn')}>{tipo}</span>
          </h2>
          <p className="ayuda" style={{ marginTop: 0 }}>
            {automata.estados.length} estados · {automata.transiciones.length} transiciones
            {motivo && tipo !== 'AFD' ? ' · ' + motivo : ''}
          </p>
          <AlfabetoEditor automata={automata} onCambio={setAutomata} />
          <div className="fila junta" style={{ marginTop: 10, flexWrap: 'wrap' }}>
            <button className="btn chico" onClick={() => setAutomata(autoDisponer(automata))}>
              Acomodar
            </button>
            <button className="btn chico" onClick={() => setAutomata(renumerar(automata))}>
              Renumerar
            </button>
            <button className="btn chico peligro" onClick={() => setAutomata(automataNuevo())}>
              Vaciar el diagrama
            </button>
          </div>
        </section>

        <section className="seccion">
          <h2 className="seccion-titulo">Estado seleccionado</h2>
          {!elegido ? (
            <p className="ayuda" style={{ marginTop: 0 }}>
              Con la herramienta Mover, hacé clic en un estado para editarlo.
            </p>
          ) : (
            <>
              <div className="fila">
                <label className="etiqueta-campo" htmlFor="nombre-estado">
                  Nombre
                </label>
                <input
                  id="nombre-estado"
                  className="campo mono"
                  value={elegido.nombre}
                  onChange={(ev) => {
                    const r = clonar(automata)
                    const e = r.estados.find((s) => s.id === elegido.id)
                    if (e) e.nombre = ev.target.value
                    setSinHistoria(r)
                  }}
                />
              </div>
              <div className="fila junta" style={{ marginTop: 8, flexWrap: 'wrap' }}>
                <button
                  className="btn chico"
                  aria-pressed={automata.inicial === elegido.id}
                  onClick={() => {
                    const r = clonar(automata)
                    r.inicial = elegido.id
                    setAutomata(r)
                  }}
                  disabled={automata.inicial === elegido.id}
                >
                  {automata.inicial === elegido.id ? 'Es el inicial' : 'Marcar inicial'}
                </button>
                <button className="btn chico" onClick={() => setAutomata(alternarFinal(automata, elegido.id))}>
                  {automata.finales.includes(elegido.id) ? 'Quitar de finales' : 'Marcar final'}
                </button>
                <button
                  className="btn chico peligro"
                  onClick={() => {
                    setAutomata(quitarEstado(automata, elegido.id))
                    setSeleccion(null)
                  }}
                >
                  Eliminar
                </button>
              </div>
            </>
          )}
        </section>

        <section className="seccion">
          <h2 className="seccion-titulo">Tabla de transiciones</h2>
          <TransitionTable
            automata={automata}
            onCambio={setAutomata}
            foco={foco}
            onFoco={setFoco}
            activos={reconocimiento.activos}
          />
          <p className="ayuda">
            Hacé clic en una celda para escribir los destinos, separados por coma. Al señalar una celda se
            resalta su flecha en el diagrama, y al revés.
          </p>
        </section>

        <section className="seccion">
          <h2 className="seccion-titulo">Probar varias cadenas</h2>
          <Lote automata={automata} />
        </section>
      </div>
      </div>
    </div>
  )
}

function AlfabetoEditor({ automata, onCambio }: { automata: Automata; onCambio: (a: Automata) => void }) {
  const [texto, setTexto] = useState('')
  return (
    <div className="fila junta" style={{ flexWrap: 'wrap' }}>
      <span className="etiqueta-campo">Σ =</span>
      {automata.alfabeto.map((s) => (
        <span key={s} className="chapa">
          {s}
          <button
            className="quitar-simbolo"
            title={'Quitar ' + s + ' del alfabeto'}
            onClick={() => {
              const r = clonar(automata)
              r.alfabeto = r.alfabeto.filter((x) => x !== s)
              r.transiciones = r.transiciones.filter((t) => t.simbolo !== s)
              onCambio(r)
            }}
          >
            ×
          </button>
        </span>
      ))}
      <input
        className="campo mono"
        style={{ width: 66 }}
        placeholder="+ símbolo"
        value={texto}
        onChange={(ev) => setTexto(ev.target.value)}
        onKeyDown={(ev) => {
          if (ev.key !== 'Enter') return
          const nuevos = texto.split(/[\s,]+/).filter(Boolean)
          if (nuevos.length === 0) return
          const r = clonar(automata)
          for (const s of nuevos) if (!r.alfabeto.includes(s)) r.alfabeto.push(s)
          onCambio(r)
          setTexto('')
        }}
      />
    </div>
  )
}

function Lote({ automata }: { automata: Automata }) {
  const [texto, setTexto] = useState('')
  const cadenas = texto.split('\n')
  const hay = texto.length > 0
  const resultados = hay ? probarLote(automata, cadenas) : []

  return (
    <>
      <textarea
        className="campo mono"
        rows={4}
        placeholder={'una cadena por línea\nla línea vacía es ε'}
        value={texto}
        onChange={(ev) => setTexto(ev.target.value)}
      />
      {hay && (
        <ul className="lista-lote" style={{ marginTop: 8 }}>
          {resultados.map((r, i) => (
            <li key={i} className={r.error ? 'no' : r.acepta ? 'si' : 'no'}>
              <span>{r.cadena === '' ? 'ε' : r.cadena}</span>
              <span>{r.error ? 'símbolo fuera de Σ' : r.acepta ? 'acepta' : 'rechaza'}</span>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
