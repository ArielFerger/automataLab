import { useEffect, useMemo, useState } from 'react'
import { type Automata, automataVacio, clasificar } from '../../core/automaton'
import { type Correccion, corregir } from '../../core/correccion'
import { equivalentes, explicar } from '../../core/equivalence'
import { autoDisponer } from '../../core/layout'
import { convertirER, erAMinimo, normalizar } from '../../core/pipeline'
import { ErrorDeSintaxis } from '../../core/regex/parser'
import { eliminacionDeEstados } from '../../core/stateElimination'
import { EJERCICIOS, EJERCICIOS_ER } from '../../data/banco'
import { PARCIALES, type ItemParcial, type Parcial } from '../../data/parciales'
import type { Ejercicio } from '../../data/tipos'
import { Diagrama } from '../Diagrama'

interface Props {
  delEditor: Automata
  onEnviarAlEditor: (a: Automata) => void
}

export function ParcialesPage({ delEditor, onEnviarAlEditor }: Props) {
  const [modo, setModo] = useState<'tomados' | 'generado'>('tomados')
  const [elegido, setElegido] = useState(PARCIALES[0].id)
  const [semilla, setSemilla] = useState(1)

  const generado = useMemo(() => armarExamen(semilla), [semilla])
  const parcial = modo === 'tomados' ? (PARCIALES.find((p) => p.id === elegido) as Parcial) : generado

  return (
    <div className="parciales">
      <div className="conv-cabecera">
        <div className="fila" style={{ flexWrap: 'wrap' }}>
          <div className="conmutador" role="group" aria-label="Qué examen resolver">
            <button aria-pressed={modo === 'tomados'} onClick={() => setModo('tomados')}>
              Parciales tomados
            </button>
            <button aria-pressed={modo === 'generado'} onClick={() => setModo('generado')}>
              Examen generado
            </button>
          </div>
          {modo === 'tomados' ? (
            <div className="fila junta" style={{ flexWrap: 'wrap' }}>
              {PARCIALES.map((p) => (
                <button
                  key={p.id}
                  className={'btn chico' + (elegido === p.id ? ' primario' : '')}
                  onClick={() => setElegido(p.id)}
                >
                  {p.titulo}
                </button>
              ))}
            </div>
          ) : (
            <Cronometro semilla={semilla} onOtro={() => setSemilla((s) => s + 1)} />
          )}
        </div>
        <p className="ayuda" style={{ marginBottom: 12 }}>
          Estructura del parcial: 20 puntos de autómata a ER, 60 de ER a AFD mínimo y 20 de lenguaje a
          AFD/AFND más ER.
        </p>
      </div>

      <div className="conv-cuerpo">
        <div className="etapa-caja">
          <h2 className="detalle-enunciado" style={{ marginBottom: 18 }}>
            {parcial.titulo}
          </h2>
          {parcial.items.map((item) => (
            <Item
              key={parcial.id + '-' + item.numero}
              item={item}
              delEditor={delEditor}
              onEnviarAlEditor={onEnviarAlEditor}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function Cronometro({ semilla, onOtro }: { semilla: number; onOtro: () => void }) {
  const [corriendo, setCorriendo] = useState(false)
  const [segundos, setSegundos] = useState(0)

  useEffect(() => {
    setSegundos(0)
    setCorriendo(false)
  }, [semilla])

  useEffect(() => {
    if (!corriendo) return
    const t = setInterval(() => setSegundos((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [corriendo])

  const mm = String(Math.floor(segundos / 60)).padStart(2, '0')
  const ss = String(segundos % 60).padStart(2, '0')

  return (
    <div className="fila junta">
      <span className="cronometro">
        {mm}:{ss}
      </span>
      <button className="btn chico" onClick={() => setCorriendo((c) => !c)}>
        {corriendo ? 'Pausar' : segundos === 0 ? 'Empezar' : 'Seguir'}
      </button>
      <button className="btn chico" onClick={onOtro}>
        Otro examen
      </button>
    </div>
  )
}

function Item({
  item,
  delEditor,
  onEnviarAlEditor,
}: {
  item: ItemParcial
  delEditor: Automata
  onEnviarAlEditor: (a: Automata) => void
}) {
  return (
    <section className="item-parcial">
      <header className="item-parcial-cabecera">
        <span className="detalle-numero">{item.numero}</span>
        <p className="detalle-enunciado" style={{ fontSize: 15 }}>
          {item.consigna}
        </p>
        <span className="chapa">{item.puntos} pts</span>
      </header>

      {item.tipo === 'af-a-er' && <ItemAFaER item={item} onEnviarAlEditor={onEnviarAlEditor} />}
      {item.tipo === 'er-a-afd' && <ItemERaAFD expresion={item.expresion as string} delEditor={delEditor} />}
      {item.tipo === 'lenguaje' && (
        <ItemLenguaje ejercicio={item.ejercicio as Ejercicio} delEditor={delEditor} onEnviarAlEditor={onEnviarAlEditor} />
      )}
    </section>
  )
}

function ItemAFaER({ item, onEnviarAlEditor }: { item: ItemParcial; onEnviarAlEditor: (a: Automata) => void }) {
  const [respuesta, setRespuesta] = useState('')
  const [resultado, setResultado] = useState<string | null>(null)
  const [verSolucion, setVerSolucion] = useState(false)

  if (item.faltaDibujo) {
    return <p className="aviso">{item.faltaDibujo}</p>
  }
  const automata = item.automata as Automata

  function corregirER() {
    try {
      const mia = erAMinimo(respuesta)
      const r = equivalentes(mia, normalizar(automata))
      setResultado(r.equivalentes ? '✓ ' + explicar(r) : '✗ ' + explicar(r))
    } catch (e) {
      setResultado('✗ ' + (e instanceof ErrorDeSintaxis ? e.message : 'No se pudo leer la expresión.'))
    }
  }

  return (
    <>
      {item.transcripcion && (
        <p className="aviso">
          Este autómata está transcripto de la foto del examen y algunas etiquetas se leen borrosas. Compará el
          dibujo con el original antes de darlo por bueno; si algo no coincide, abrilo en el editor y corregilo.
        </p>
      )}
      <div className="etapa-diagrama">
        <Diagrama automata={automata} alto={260} />
      </div>
      <div className="fila" style={{ marginBottom: 8 }}>
        <input
          className="campo mono"
          placeholder="tu expresión regular"
          value={respuesta}
          spellCheck={false}
          onChange={(ev) => {
            setRespuesta(ev.target.value)
            setResultado(null)
          }}
        />
        <button className="btn primario" onClick={corregirER} disabled={!respuesta.trim()}>
          Corregir
        </button>
      </div>
      {resultado && <div className={'veredicto ' + (resultado.startsWith('✓') ? 'correcto' : 'incorrecto')}>{resultado}</div>}
      <div className="fila junta" style={{ marginTop: 8 }}>
        <button className="btn chico" onClick={() => onEnviarAlEditor(autoDisponer(automata))}>
          Abrir en el editor
        </button>
        <button className="btn chico" onClick={() => setVerSolucion((v) => !v)}>
          {verSolucion ? 'Ocultar una solución' : 'Ver una solución'}
        </button>
      </div>
      {verSolucion && (
        <p style={{ marginTop: 8 }}>
          <code className="er-final">{eliminacionDeEstados(normalizar(automata)).expresion}</code>
        </p>
      )}
    </>
  )
}

function ItemERaAFD({ expresion, delEditor }: { expresion: string; delEditor: Automata }) {
  const [resultado, setResultado] = useState<string | null>(null)
  const [verSolucion, setVerSolucion] = useState(false)
  const conversion = useMemo(() => convertirER(expresion), [expresion])

  function corregirDibujo() {
    if (delEditor.estados.length === 0 || !delEditor.inicial) {
      setResultado('✗ Dibujá el autómata en el editor antes de corregir.')
      return
    }
    const r = equivalentes(delEditor, conversion.minimo)
    if (!r.equivalentes) {
      setResultado('✗ ' + explicar(r))
      return
    }
    // Reconoce el lenguaje correcto; falta que además sea determinístico y mínimo.
    const tipo = clasificar(delEditor)
    const propios = delEditor.estados.length
    const minimos = conversion.minimo.estados.length
    if (tipo !== 'AFD') {
      setResultado('✗ El lenguaje está bien, pero el autómata todavía no es un AFD: ' + tipo + '.')
    } else if (propios > minimos) {
      setResultado(`✗ Reconoce el lenguaje correcto, pero no es mínimo: tiene ${propios} estados y el mínimo tiene ${minimos}.`)
    } else {
      setResultado('✓ Es el AFD mínimo del lenguaje.')
    }
  }

  return (
    <>
      <p>
        <code className="er-final">{expresion}</code>
      </p>
      <div className="fila junta" style={{ marginTop: 10, flexWrap: 'wrap' }}>
        <button className="btn primario" onClick={corregirDibujo}>
          Corregir el autómata del editor
        </button>
        <button className="btn chico" onClick={() => setVerSolucion((v) => !v)}>
          {verSolucion ? 'Ocultar la solución' : 'Ver la solución'}
        </button>
      </div>
      {resultado && <div className={'veredicto ' + (resultado.startsWith('✓') ? 'correcto' : 'incorrecto')}>{resultado}</div>}
      {verSolucion && (
        <>
          <p className="ayuda" style={{ marginTop: 10 }}>
            AFD mínimo, {conversion.minimo.estados.length} estados. El paso a paso completo está en la pestaña
            Conversiones.
          </p>
          <div className="etapa-diagrama">
            <Diagrama automata={conversion.minimo} alto={260} />
          </div>
        </>
      )}
    </>
  )
}

function ItemLenguaje({
  ejercicio,
  delEditor,
  onEnviarAlEditor,
}: {
  ejercicio: Ejercicio
  delEditor: Automata
  onEnviarAlEditor: (a: Automata) => void
}) {
  const [expresion, setExpresion] = useState('')
  const [correccion, setCorreccion] = useState<Correccion | null>(null)
  const [verSolucion, setVerSolucion] = useState(false)

  const consigna = {
    referencia: ejercicio.referencia,
    regular: ejercicio.regular,
    alfabeto: ejercicio.alfabeto,
    porQueNo: ejercicio.porQueNo,
  }

  return (
    <>
      <p style={{ marginTop: 0 }}>{ejercicio.enunciado}</p>
      <p className="detalle-alfabeto">
        Σ = &#123;{ejercicio.alfabeto.join(', ')}&#125;
        {ejercicio.convencion && <span className="detalle-convencion">{ejercicio.convencion}</span>}
      </p>
      {ejercicio.nota && <p className="aviso">{ejercicio.nota}</p>}

      <div className="fila" style={{ marginTop: 10 }}>
        <input
          className="campo mono"
          placeholder="tu expresión regular"
          value={expresion}
          spellCheck={false}
          onChange={(ev) => {
            setExpresion(ev.target.value)
            setCorreccion(null)
          }}
        />
        <button className="btn primario" onClick={() => setCorreccion(corregir(consigna, { expresion }))} disabled={!expresion.trim()}>
          Corregir
        </button>
      </div>

      <div className="fila junta" style={{ marginTop: 8, flexWrap: 'wrap' }}>
        <button className="btn chico" onClick={() => setCorreccion(corregir(consigna, { automata: delEditor }))}>
          Corregir el autómata del editor
        </button>
        <button className="btn chico" onClick={() => onEnviarAlEditor(automataVacio(ejercicio.alfabeto))}>
          Dibujarlo en el editor
        </button>
        <button className="btn chico" onClick={() => setVerSolucion((v) => !v)}>
          {verSolucion ? 'Ocultar la solución' : 'Ver la solución'}
        </button>
      </div>

      {correccion && (
        <div className={'veredicto ' + correccion.veredicto}>
          <p style={{ margin: 0 }}>{correccion.mensaje}</p>
        </div>
      )}

      {verSolucion && ejercicio.referencia && (
        <>
          <p style={{ marginTop: 10 }}>
            Una ER posible: <code className="er-final">{ejercicio.referencia}</code>
          </p>
          <div className="etapa-diagrama">
            <Diagrama automata={erAMinimo(ejercicio.referencia)} alto={240} />
          </div>
        </>
      )}
    </>
  )
}

/**
 * Arma un examen con la estructura real: un autómata del banco para pasar a ER,
 * una expresión del punto D para minimizar y un lenguaje del punto A.
 */
function armarExamen(semilla: number): Parcial {
  const conER = EJERCICIOS.filter((e) => e.regular && e.referencia && e.alfabeto.length <= 3)
  const lenguajes = EJERCICIOS.filter((e) => e.punto === 'A' && e.alfabeto.length <= 3)

  const paraItem1 = conER[(semilla * 7) % conER.length]
  const expresion = EJERCICIOS_ER.filter((e) => e.punto === 'D')[(semilla * 3) % 8].expresion
  const lenguaje = lenguajes[(semilla * 11) % lenguajes.length]

  return {
    id: 'generado-' + semilla,
    titulo: 'Examen generado nº ' + semilla,
    items: [
      {
        numero: 1,
        puntos: 20,
        tipo: 'af-a-er',
        consigna: 'Dado el siguiente autómata, pasar a ER.',
        automata: autoDisponer(erAMinimo(paraItem1.referencia as string)),
      },
      {
        numero: 2,
        puntos: 60,
        tipo: 'er-a-afd',
        consigna: 'Dada la siguiente ER, pasar a autómata determinístico mínimo.',
        expresion,
      },
      {
        numero: 3,
        puntos: 20,
        tipo: 'lenguaje',
        consigna: 'Realice un AFD o AFND y una expresión regular para el siguiente lenguaje.',
        ejercicio: lenguaje,
      },
    ],
  }
}
