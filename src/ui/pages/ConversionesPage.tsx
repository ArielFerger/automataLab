import { useMemo, useState } from 'react'
import type { Automata } from '../../core/automaton'
import { autoDisponer } from '../../core/layout'
import { convertirER, type Conversion } from '../../core/pipeline'
import { ErrorDeSintaxis } from '../../core/regex/parser'
import { eliminacionDeEstados } from '../../core/stateElimination'
import { subconjuntos } from '../../core/subset'
import { minimizar } from '../../core/minimize'
import { Diagrama } from '../Diagrama'
import { ThompsonSteps } from '../pasos/ThompsonSteps'
import { SubsetTable } from '../pasos/SubsetTable'
import { PartitionSteps } from '../pasos/PartitionSteps'
import { EliminationSteps } from '../pasos/EliminationSteps'

type Etapa = 'thompson' | 'subconjuntos' | 'minimo' | 'aER'
type Origen = 'er' | 'editor'

const ETAPAS: { id: Etapa; texto: string; nota: string }[] = [
  { id: 'thompson', texto: 'AFN-ε', nota: 'construcción de Thompson' },
  { id: 'subconjuntos', texto: 'AFD', nota: 'construcción de subconjuntos' },
  { id: 'minimo', texto: 'AFD mínimo', nota: 'refinamiento de particiones' },
  { id: 'aER', texto: 'ER', nota: 'eliminación de estados' },
]

interface Props {
  /** el autómata que hay cargado en el editor, para poder convertirlo */
  delEditor: Automata
  /** manda un autómata al editor, para seguir trabajándolo a mano */
  onEnviarAlEditor: (a: Automata) => void
}

export function ConversionesPage({ delEditor, onEnviarAlEditor }: Props) {
  const [origen, setOrigen] = useState<Origen>('er')
  const [fuente, setFuente] = useState('b (a* | b) | a')
  const [etapa, setEtapa] = useState<Etapa>('thompson')

  const desdeER = useMemo(() => {
    if (origen !== 'er') return null
    try {
      return { conversion: convertirER(fuente), error: null as ErrorDeSintaxis | null }
    } catch (e) {
      return { conversion: null, error: e instanceof ErrorDeSintaxis ? e : null }
    }
  }, [origen, fuente])

  const desdeEditor = useMemo(() => {
    if (origen !== 'editor' || delEditor.estados.length === 0 || !delEditor.inicial) return null
    const s = subconjuntos(delEditor)
    return { subconjuntos: s, minimizacion: minimizar(s.afd) }
  }, [origen, delEditor])

  // Qué autómata se pasa a ER: el mínimo si venimos de una ER, o el del editor.
  const paraER =
    origen === 'er' ? (desdeER?.conversion?.minimo ?? null) : delEditor.estados.length > 0 ? delEditor : null
  const eliminacion = useMemo(() => (paraER ? eliminacionDeEstados(paraER) : null), [paraER])

  const etapasVisibles = origen === 'er' ? ETAPAS : ETAPAS.filter((e) => e.id !== 'thompson')
  const etapaActual = etapasVisibles.some((e) => e.id === etapa) ? etapa : etapasVisibles[0].id

  return (
    <div className="conversiones">
      <div className="conv-cabecera">
        <div className="fila" style={{ flexWrap: 'wrap' }}>
          <div className="conmutador" role="group" aria-label="De dónde parte la conversión">
            <button aria-pressed={origen === 'er'} onClick={() => setOrigen('er')}>
              Desde una ER
            </button>
            <button aria-pressed={origen === 'editor'} onClick={() => setOrigen('editor')}>
              Desde el autómata del editor
            </button>
          </div>
          {origen === 'er' ? (
            <input
              className="campo mono er-entrada"
              value={fuente}
              onChange={(ev) => setFuente(ev.target.value)}
              placeholder="por ejemplo (a|b)*abb"
              spellCheck={false}
              aria-label="Expresión regular"
            />
          ) : (
            <span className="etiqueta-campo">
              {delEditor.estados.length} estados dibujados en el editor.
            </span>
          )}
        </div>

        {desdeER?.error && (
          <p className="aviso malo" style={{ marginTop: 8 }}>
            {desdeER.error.message} <span className="mono">(posición {desdeER.error.posicion + 1})</span>
          </p>
        )}
        {desdeER?.conversion?.analisis.advertencias.map((a) => (
          <p className="aviso" style={{ marginTop: 8 }} key={a}>
            {a}
          </p>
        ))}

        <nav className="etapas" aria-label="Etapas de la conversión">
          {etapasVisibles.map((e, i) => (
            <button key={e.id} aria-current={etapaActual === e.id ? 'step' : undefined} onClick={() => setEtapa(e.id)}>
              <span className="etapa-orden">{i + 1}</span>
              <span className="etapa-texto">{e.texto}</span>
              <span className="etapa-nota">{e.nota}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="conv-cuerpo">
        {origen === 'er' && !desdeER?.conversion && !desdeER?.error && <p className="vacio">Escribí una expresión regular.</p>}
        {origen === 'editor' && !desdeEditor && (
          <p className="vacio">Dibujá un autómata en el editor, con su estado inicial marcado.</p>
        )}

        {origen === 'er' && desdeER?.conversion && (
          <ContenidoER conversion={desdeER.conversion} etapa={etapaActual} onEnviarAlEditor={onEnviarAlEditor} />
        )}

        {origen === 'editor' && desdeEditor && etapaActual === 'subconjuntos' && (
          <Etapa
            titulo="AFD por construcción de subconjuntos"
            automata={desdeEditor.subconjuntos.afd}
            onEnviarAlEditor={onEnviarAlEditor}
          >
            <SubsetTable resultado={desdeEditor.subconjuntos} alfabeto={delEditor.alfabeto} />
          </Etapa>
        )}

        {origen === 'editor' && desdeEditor && etapaActual === 'minimo' && (
          <Etapa titulo="AFD mínimo" automata={desdeEditor.minimizacion.minimo} onEnviarAlEditor={onEnviarAlEditor}>
            <PartitionSteps resultado={desdeEditor.minimizacion} />
          </Etapa>
        )}

        {etapaActual === 'aER' && eliminacion && (
          <div className="etapa-caja">
            <h2 className="seccion-titulo">Expresión regular por eliminación de estados</h2>
            <EliminationSteps resultado={eliminacion} />
          </div>
        )}
        {etapaActual === 'aER' && !eliminacion && <p className="vacio">No hay autómata para convertir.</p>}
      </div>
    </div>
  )
}

function ContenidoER({
  conversion,
  etapa,
  onEnviarAlEditor,
}: {
  conversion: Conversion
  etapa: Etapa
  onEnviarAlEditor: (a: Automata) => void
}) {
  if (etapa === 'thompson') {
    return (
      <Etapa titulo="AFN-ε por construcción de Thompson" automata={conversion.thompson.automata} onEnviarAlEditor={onEnviarAlEditor}>
        <ThompsonSteps resultado={conversion.thompson} />
      </Etapa>
    )
  }
  if (etapa === 'subconjuntos') {
    return (
      <Etapa titulo="AFD por construcción de subconjuntos" automata={conversion.subconjuntos.afd} onEnviarAlEditor={onEnviarAlEditor}>
        <SubsetTable resultado={conversion.subconjuntos} alfabeto={conversion.analisis.alfabeto} />
      </Etapa>
    )
  }
  if (etapa === 'minimo') {
    return (
      <Etapa titulo="AFD mínimo" automata={conversion.minimo} onEnviarAlEditor={onEnviarAlEditor}>
        <PartitionSteps resultado={conversion.minimizacion} />
      </Etapa>
    )
  }
  return null
}

function Etapa({
  titulo,
  automata,
  onEnviarAlEditor,
  children,
}: {
  titulo: string
  automata: Automata
  onEnviarAlEditor: (a: Automata) => void
  children: React.ReactNode
}) {
  return (
    <div className="etapa-caja">
      <div className="etapa-cabecera">
        <h2 className="seccion-titulo" style={{ margin: 0 }}>
          {titulo}
        </h2>
        <span className="etiqueta-campo">
          {automata.estados.length} estados · {automata.transiciones.length} transiciones
        </span>
        <button className="btn chico" onClick={() => onEnviarAlEditor(autoDisponer(automata))}>
          Abrir en el editor
        </button>
      </div>
      <div className="etapa-diagrama">
        <Diagrama automata={automata} alto={300} />
      </div>
      {children}
    </div>
  )
}
