import { useMemo, useState } from 'react'
import { type Automata, automataVacio, clasificar } from '../../core/automaton'
import { type Correccion, corregir } from '../../core/correccion'
import { autoDisponer } from '../../core/layout'
import { erAMinimo } from '../../core/pipeline'
import { EJERCICIOS, EJERCICIOS_ER } from '../../data/banco'
import type { Ejercicio } from '../../data/tipos'
import type { Progreso } from '../../store/useProgreso'
import { Diagrama } from '../Diagrama'

type Filtro = 'A' | 'C' | 'D' | 'E'

interface Props {
  delEditor: Automata
  onEnviarAlEditor: (a: Automata) => void
  progreso: Progreso
}

export function PracticaPage({ delEditor, onEnviarAlEditor, progreso }: Props) {
  const [punto, setPunto] = useState<Filtro>('A')
  const [soloPendientes, setSoloPendientes] = useState(false)
  const [elegido, setElegido] = useState<number>(1)

  const deLenguaje = punto === 'A' || punto === 'E'
  const lista = useMemo(
    () => EJERCICIOS.filter((e) => e.punto === punto),
    [punto],
  )
  const listaER = useMemo(() => EJERCICIOS_ER.filter((e) => e.punto === punto), [punto])

  const visibles = deLenguaje
    ? lista.filter((e) => !soloPendientes || progreso.avanceDe(e.id)?.veredicto !== 'correcto')
    : []

  const ejercicio = EJERCICIOS.find((e) => e.id === elegido)
  const ids = deLenguaje ? lista.map((e) => e.id) : []

  function cambiarPunto(p: Filtro) {
    setPunto(p)
    const primero = p === 'A' || p === 'E' ? EJERCICIOS.find((e) => e.punto === p) : undefined
    if (primero) setElegido(primero.id)
  }

  return (
    <div className="practica">
      <aside className="practica-lista">
        <div className="practica-filtros">
          <div className="conmutador" role="group" aria-label="Punto de la práctica">
            {(['A', 'C', 'D', 'E'] as Filtro[]).map((p) => (
              <button key={p} aria-pressed={punto === p} onClick={() => cambiarPunto(p)}>
                {p}
              </button>
            ))}
          </div>
          {deLenguaje && (
            <>
              <label className="casilla">
                <input
                  type="checkbox"
                  checked={soloPendientes}
                  onChange={(ev) => setSoloPendientes(ev.target.checked)}
                />
                Solo los que faltan
              </label>
              <p className="ayuda" style={{ margin: 0 }}>
                {progreso.resueltos(ids)} de {ids.length} resueltos
              </p>
            </>
          )}
        </div>

        {deLenguaje ? (
          <ul className="items">
            {visibles.map((e) => {
              const v = progreso.avanceDe(e.id)?.veredicto
              return (
                <li key={e.id}>
                  <button
                    className={'item' + (elegido === e.id ? ' elegido' : '')}
                    onClick={() => setElegido(e.id)}
                  >
                    <span className={'marca-estado ' + (v ?? 'nada')} aria-hidden="true" />
                    <span className="item-numero">{e.id}</span>
                    <span className="item-texto">{e.enunciado}</span>
                  </button>
                </li>
              )
            })}
            {visibles.length === 0 && <li className="vacio">No queda ninguno pendiente.</li>}
          </ul>
        ) : (
          <ul className="items">
            {listaER.map((e) => (
              <li key={e.id}>
                <span className="item item-er">
                  <span className="item-numero">{e.id}</span>
                  <code className="item-texto">{e.expresion}</code>
                </span>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <div className="practica-detalle">
        {deLenguaje && ejercicio ? (
          <Detalle
            key={ejercicio.id}
            ejercicio={ejercicio}
            delEditor={delEditor}
            onEnviarAlEditor={onEnviarAlEditor}
            progreso={progreso}
          />
        ) : (
          <DetalleER punto={punto} onEnviarAlEditor={onEnviarAlEditor} />
        )}
      </div>
    </div>
  )
}

function Detalle({
  ejercicio,
  delEditor,
  onEnviarAlEditor,
  progreso,
}: {
  ejercicio: Ejercicio
  delEditor: Automata
  onEnviarAlEditor: (a: Automata) => void
  progreso: Progreso
}) {
  const guardado = progreso.avanceDe(ejercicio.id)
  const [expresion, setExpresion] = useState(guardado?.expresion ?? '')
  const [correccion, setCorreccion] = useState<Correccion | null>(null)
  const [verSolucion, setVerSolucion] = useState(false)

  const consigna = {
    referencia: ejercicio.referencia,
    regular: ejercicio.regular,
    alfabeto: ejercicio.alfabeto,
    porQueNo: ejercicio.porQueNo,
  }

  function evaluar(respuesta: Parameters<typeof corregir>[1]) {
    const r = corregir(consigna, respuesta)
    setCorreccion(r)
    if (r.veredicto === 'correcto' || r.veredicto === 'incorrecto') {
      progreso.guardar(ejercicio.id, { veredicto: r.veredicto, expresion })
    }
  }

  // Sin memo esto correría Thompson, subconjuntos y minimización en cada tecla
  // que se escribe en el campo de respuesta.
  const solucion = useMemo(
    () => (ejercicio.referencia ? erAMinimo(ejercicio.referencia) : null),
    [ejercicio.referencia],
  )

  return (
    <div className="detalle">
      <header className="detalle-cabecera">
        <span className="detalle-numero">
          {ejercicio.punto}
          {ejercicio.punto === 'E' ? ejercicio.id - 100 : ejercicio.id}
        </span>
        <p className="detalle-enunciado">{ejercicio.enunciado}</p>
      </header>

      <p className="detalle-alfabeto">
        Σ = &#123;{ejercicio.alfabeto.join(', ')}&#125;
        {ejercicio.convencion && <span className="detalle-convencion">{ejercicio.convencion}</span>}
      </p>

      <section className="respuesta">
        <label className="seccion-titulo" htmlFor="respuesta-er">
          Tu expresión regular
        </label>
        <input
          id="respuesta-er"
          className="campo mono"
          style={{ fontSize: 15 }}
          value={expresion}
          spellCheck={false}
          placeholder="escribila acá, o dibujá el autómata en el editor"
          onChange={(ev) => {
            setExpresion(ev.target.value)
            setCorreccion(null)
          }}
          onKeyDown={(ev) => {
            if (ev.key === 'Enter') evaluar({ expresion })
          }}
        />

        <div className="fila junta" style={{ marginTop: 10, flexWrap: 'wrap' }}>
          <button className="btn primario" onClick={() => evaluar({ expresion })} disabled={!expresion.trim()}>
            Corregir la expresión
          </button>
          <button
            className="btn"
            onClick={() => evaluar({ automata: delEditor })}
            disabled={delEditor.estados.length === 0}
            title="Compara el autómata que tenés dibujado en la pestaña Editor"
          >
            Corregir el autómata del editor
          </button>
          <button className="btn" onClick={() => evaluar({ noEsRegular: true })}>
            No es regular
          </button>
          <button
            className="btn chico"
            onClick={() => onEnviarAlEditor(automataVacio(ejercicio.alfabeto))}
            title="Vacía el editor y le pone el alfabeto de este ejercicio"
          >
            Dibujarlo en el editor
          </button>
        </div>
      </section>

      {correccion && (
        <div className={'veredicto ' + correccion.veredicto}>
          <strong>
            {correccion.veredicto === 'correcto'
              ? 'Correcto'
              : correccion.veredicto === 'incorrecto'
                ? 'Todavía no'
                : correccion.veredicto === 'error'
                  ? 'No se entiende la expresión'
                  : 'Falta la respuesta'}
          </strong>
          <p>{correccion.mensaje}</p>
          {correccion.advertencia && <p className="veredicto-aviso">{correccion.advertencia}</p>}
        </div>
      )}

      {(correccion || guardado) && ejercicio.nota && (
        <p className="aviso" style={{ marginTop: 12 }}>
          {ejercicio.nota}
        </p>
      )}

      <section style={{ marginTop: 18 }}>
        <button className="btn chico" onClick={() => setVerSolucion((v) => !v)}>
          {verSolucion ? 'Ocultar la solución' : 'Ver la solución'}
        </button>
        {verSolucion && (
          <div className="solucion">
            {ejercicio.regular && solucion ? (
              <>
                <p className="ayuda" style={{ marginTop: 10 }}>
                  Un AFD mínimo del lenguaje ({solucion.estados.length} estados). El tuyo puede tener los estados
                  con otros nombres o dibujados de otra forma: lo que importa es que reconozca lo mismo.
                </p>
                <div className="etapa-diagrama">
                  <Diagrama automata={solucion} alto={260} />
                </div>
                {(ejercicio.referencia as string).length <= 90 && (
                  <p>
                    Una expresión regular posible: <code className="er-final">{ejercicio.referencia}</code>
                  </p>
                )}
                <p className="ayuda">
                  {clasificar(solucion) === 'AFD' ? 'Es un AFD completo, con el estado muerto incluido.' : ''}
                </p>
              </>
            ) : (
              <p style={{ marginTop: 10 }}>{ejercicio.porQueNo}</p>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

function DetalleER({ punto, onEnviarAlEditor }: { punto: Filtro; onEnviarAlEditor: (a: Automata) => void }) {
  const [elegida, setElegida] = useState<string | null>(null)
  const lista = EJERCICIOS_ER.filter((e) => e.punto === punto)
  const objetivo = elegida ?? lista[0]?.expresion ?? ''
  const automata = objetivo ? erAMinimo(objetivo) : null

  return (
    <div className="detalle">
      <header className="detalle-cabecera">
        <span className="detalle-numero">{punto}</span>
        <p className="detalle-enunciado">
          {punto === 'C'
            ? 'Transformar cada expresión regular en un AFN-ε y graficar su tabla de transiciones.'
            : 'Construir, a partir de cada expresión regular, el AFD mínimo.'}
        </p>
      </header>

      <p className="ayuda" style={{ marginTop: 0 }}>
        Elegí una expresión y resolvela a mano; después compará con el paso a paso de la pestaña Conversiones.
      </p>

      <div className="fila junta" style={{ flexWrap: 'wrap', marginTop: 10 }}>
        {lista.map((e) => (
          <button
            key={e.id}
            className={'btn chico' + (objetivo === e.expresion ? ' primario' : '')}
            onClick={() => setElegida(e.expresion)}
          >
            {e.id}
          </button>
        ))}
      </div>

      <p style={{ marginTop: 14 }}>
        <code className="er-final">{objetivo}</code>
      </p>

      {automata && (
        <>
          <div className="etapa-diagrama" style={{ marginTop: 12 }}>
            <Diagrama automata={automata} alto={280} />
          </div>
          <button className="btn chico" onClick={() => onEnviarAlEditor(autoDisponer(automata))}>
            Abrir el AFD mínimo en el editor
          </button>
        </>
      )}
    </div>
  )
}
