import { useEffect, useMemo, useState } from 'react'
import { type Automata, nombreDe } from '../core/automaton'
import { arcosUsados, simular } from '../core/simulate'

interface Props {
  automata: Automata
  /** informa al lienzo qué resaltar en el paso actual */
  onPaso: (estado: { activos: string[]; arcos: { desde: string; hasta: string }[] }) => void
}

/**
 * La cinta de entrada con el control.
 *
 * La teoría describe el reconocimiento como un control que apunta a una posición de
 * la cadena y avanza un lugar a la derecha por cada símbolo leído. Eso es
 * literalmente lo que se dibuja acá, en vez de un simple cartel de aceptada/rechazada.
 */
export function StringTester({ automata, onPaso }: Props) {
  const [cadena, setCadena] = useState('')
  const [paso, setPaso] = useState(0)
  const [reproduciendo, setReproduciendo] = useState(false)

  const resultado = useMemo(() => simular(automata, cadena), [automata, cadena])
  const pasoActual = Math.min(paso, Math.max(resultado.pasos.length - 1, 0))
  const actual = resultado.pasos[pasoActual]
  const enElFinal = pasoActual === resultado.pasos.length - 1

  // Reproducción automática: avanza sola hasta el final y se detiene ahí.
  useEffect(() => {
    if (!reproduciendo) return
    if (enElFinal) {
      setReproduciendo(false)
      return
    }
    const t = setTimeout(() => setPaso((p) => p + 1), 700)
    return () => clearTimeout(t)
  }, [reproduciendo, enElFinal, pasoActual])

  // El conjunto activo y las flechas recorridas suben al lienzo. Con el campo vacío
  // y sin haber avanzado no se resalta nada: el diagrama se ve tal como se dibujó.
  useEffect(() => {
    if (!actual || (cadena === '' && pasoActual === 0)) {
      onPaso({ activos: [], arcos: [] })
      return
    }
    const previo = resultado.pasos[pasoActual - 1]
    const arcos =
      previo && actual.simbolo !== null
        ? arcosUsados(automata, previo.activos, actual.simbolo, actual.activos)
        : []
    onPaso({ activos: actual.activos, arcos })
  }, [automata, resultado, pasoActual, cadena])

  useEffect(() => {
    setPaso(0)
    setReproduciendo(false)
  }, [cadena, automata])

  const simbolos = [...cadena]

  return (
    <div className="cinta-caja">
      <div className="fila" style={{ marginBottom: 4 }}>
        <label className="etiqueta-campo" htmlFor="cadena">
          Cadena
        </label>
        <input
          id="cadena"
          className="campo mono"
          placeholder="escribí una cadena (vacía = ε)"
          value={cadena}
          onChange={(ev) => setCadena(ev.target.value)}
          autoComplete="off"
        />
        {resultado.error ? (
          <span className="chapa rechaza">error</span>
        ) : (
          <span className={'chapa ' + (resultado.acepta ? 'acepta' : 'rechaza')}>
            {resultado.acepta ? 'acepta' : 'rechaza'}
          </span>
        )}
      </div>

      {resultado.error ? (
        <p className="aviso malo" style={{ marginTop: 8 }}>
          {resultado.error}
        </p>
      ) : (
        <>
          <div className="cinta">
            {simbolos.length === 0 && <span className="cinta-vacia">ε · cadena vacía</span>}
            {simbolos.map((s, i) => (
              <span
                key={i}
                className={'celda-cinta' + (i < pasoActual ? ' leida' : '') + (i === pasoActual ? ' bajo-control' : '')}
              >
                {i === pasoActual && <span className="control">▼</span>}
                {s}
              </span>
            ))}
            <span className={'celda-cinta fin' + (pasoActual === simbolos.length ? ' bajo-control' : '')}>
              {pasoActual === simbolos.length && <span className="control">▼</span>}⊣
            </span>
          </div>

          <div className="transporte">
            <button className="btn chico" onClick={() => { setReproduciendo(false); setPaso(0) }} disabled={pasoActual === 0}>
              ⏮ Reiniciar
            </button>
            <button className="btn chico" onClick={() => { setReproduciendo(false); setPaso((p) => Math.max(0, p - 1)) }} disabled={pasoActual === 0}>
              ◀ Atrás
            </button>
            <button
              className="btn chico primario"
              onClick={() => {
                setReproduciendo(false)
                setPaso((p) => p + 1)
              }}
              disabled={enElFinal}
            >
              Leer símbolo ▶
            </button>
            <button
              className="btn chico"
              onClick={() => {
                setReproduciendo(false)
                setPaso(resultado.pasos.length - 1)
              }}
              disabled={enElFinal}
            >
              Hasta el final ⏭
            </button>
            <button
              className="btn chico"
              onClick={() => {
                if (enElFinal) setPaso(0)
                setReproduciendo((r) => !r)
              }}
              disabled={resultado.pasos.length <= 1}
              title="Recorre la cadena solo, un símbolo por vez"
            >
              {reproduciendo ? '⏸ Pausar' : '▶ Reproducir'}
            </button>
            <span className="paso-info">
              paso <b>{pasoActual}</b>/{resultado.pasos.length - 1} · activos{' '}
              <b>
                {actual && actual.activos.length > 0
                  ? '{' + actual.activos.map((id) => nombreDe(automata, id)).join(', ') + '}'
                  : '∅'}
              </b>
            </span>
          </div>

          <Recorrido automata={automata} resultado={resultado} hasta={pasoActual} />
        </>
      )}
    </div>
  )
}

/**
 * El recorrido escrito, q0 −a→ q1 −b→ q2, hasta el paso actual.
 *
 * Es lo que hay que copiar en la hoja para justificar por qué una cadena se
 * acepta o se rechaza, así que conviene tenerlo en texto y no solo en el dibujo.
 */
function Recorrido({
  automata,
  resultado,
  hasta,
}: {
  automata: Automata
  resultado: ReturnType<typeof simular>
  hasta: number
}) {
  if (resultado.pasos.length <= 1) return null
  const pasos = resultado.pasos.slice(0, hasta + 1)
  const conjunto = (ids: string[]) =>
    ids.length === 0 ? '∅' : '{' + ids.map((id) => nombreDe(automata, id)).join(', ') + '}'
  const unico = pasos.every((p) => p.activos.length === 1)

  return (
    <p className="recorrido">
      {pasos.map((p, i) => (
        <span key={i}>
          {i > 0 && <span className="recorrido-flecha"> −{p.simbolo}→ </span>}
          <span className={i === hasta ? 'recorrido-actual' : undefined}>
            {unico ? nombreDe(automata, p.activos[0]) : conjunto(p.activos)}
          </span>
        </span>
      ))}
      {hasta === resultado.pasos.length - 1 && (
        <span className={'recorrido-final ' + (resultado.acepta ? 'si' : 'no')}>
          {resultado.acepta ? ' → acepta' : ' → rechaza'}
        </span>
      )}
    </p>
  )
}
