import { useMemo, useState } from 'react'
import { automataVacio, type Automata } from '../core/automaton'
import { type Borrador, etapasDe, evaluarActividad, pideER } from '../core/actividad'
import { textoRespuesta } from '../core/paraIA'
import { erAMinimo, convertirER, normalizar } from '../core/pipeline'
import { eliminacionDeEstados } from '../core/stateElimination'
import { autoDisponer } from '../core/layout'
import { type Actividad, NOMBRES_TAREA } from '../data/catalogo'
import { AccionesIA } from './AccionesIA'
import { Diagrama } from './Diagrama'
import { TransitionTable } from './TransitionTable'

export type AbrirEditor = (a: Automata, titulo?: string, notas?: string) => void
interface Props {
  actividad: Actividad
  borrador: Borrador
  onCambio: (b: Borrador) => void
  delEditor: Automata
  onEditor: AbrirEditor
  examen?: boolean
  bloqueado?: boolean
}
export function RespuestaActividad({ actividad: a, borrador: b, onCambio, delEditor, onEditor, examen, bloqueado }: Props) {
  const [solucionVisible, setSolucionVisible] = useState(false)
  const [capturar, setCapturar] = useState<string | null>(null)
  const etapas = etapasDe(a)
  const alfabeto = useMemo(() => a.alfabeto.length ? a.alfabeto : a.expresion ? erAMinimo(a.expresion).alfabeto : [], [a])
  const original = useMemo(() => a.automata ?? (a.tarea === 'af-er' && a.lenguaje?.referencia ? autoDisponer(erAMinimo(a.lenguaje.referencia)) : null), [a])
  function cambiar(parche: Partial<Borrador>) { onCambio({ ...b, ...parche, resultado: undefined, revisado: false }) }
  const texto = textoRespuesta({ ...a, automata: original ?? undefined }, b)
  return <div className="respuesta-actividad">
    <div className="clasificacion"><span>{NOMBRES_TAREA[a.tarea]}</span><span>{a.tema}</span></div>
    {alfabeto.length > 0 && <p className="detalle-alfabeto">Σ = &#123;{alfabeto.join(', ')}&#125; {a.lenguaje?.convencion}</p>}
    {original && <div className="etapa-diagrama"><Diagrama automata={original} alto={240} /><details><summary>Tabla del enunciado</summary><TransitionTable automata={original} onCambio={() => {}} foco={null} onFoco={() => {}} soloLectura /></details></div>}
    <fieldset disabled={bloqueado} className="respuesta-campos">
      {pideER(a) && <label className="campo-etiqueta" htmlFor={`${a.id}-er`}>Tu expresión regular<input id={`${a.id}-er`} className="campo mono" value={b.expresion} spellCheck={false} autoComplete="off" placeholder="Por ejemplo: (a|b)*abb" onChange={ev => cambiar({ expresion: ev.target.value })} /></label>}
      {a.lenguaje && a.tarea !== 'af-er' && <label className="casilla"><input type="checkbox" checked={b.noRegular ?? false} onChange={ev => cambiar({ noRegular: ev.target.checked })} />Mi respuesta: este lenguaje no es regular</label>}
      {!b.noRegular && etapas.map(etapa => {
        const guardado = b.diagramas[etapa]
        return <section className="respuesta-diagrama" key={etapa}>
          <div className="fila envolver"><h3>{etapa}</h3><span className="ayuda">{guardado ? `${guardado.estados.length} estados adjuntos` : 'Sin adjuntar'}</span></div>
          {guardado && <><div className="etapa-diagrama"><Diagrama automata={guardado} alto={190} /></div><details><summary>Ver tabla de transiciones</summary><TransitionTable automata={guardado} onCambio={() => {}} foco={null} onFoco={() => {}} soloLectura /></details></>}
          <div className="fila junta envolver">
            <button className="btn chico" onClick={() => onEditor(guardado ?? automataVacio(alfabeto), `${a.id} · ${etapa}`, a.enunciado)}>{guardado ? 'Editar este diagrama' : 'Dibujar en el editor'}</button>
            <button className="btn chico" disabled={!delEditor.estados.length} onClick={() => setCapturar(etapa)}>Adjuntar desde el editor</button>
          </div>
          {capturar === etapa && <div className="vista-captura"><p>Esta es la copia del editor que vas a adjuntar a <strong>{a.id} · {etapa}</strong>.</p><Diagrama automata={delEditor} alto={170} /><div className="fila junta envolver"><button className="btn primario chico" onClick={() => { cambiar({ diagramas: { ...b.diagramas, [etapa]: structuredClone(delEditor) } }); setCapturar(null) }}>Guardar esta copia</button><button className="btn chico" onClick={() => setCapturar(null)}>Cancelar</button></div></div>}
        </section>
      })}
      <label className="campo-etiqueta" htmlFor={`${a.id}-desarrollo`}>{a.tarea === 'lisp' ? 'Tu código LISP y casos de prueba' : 'Desarrollo y justificación'}<textarea id={`${a.id}-desarrollo`} className={'campo' + (a.tarea === 'lisp' ? ' mono codigo-lisp' : '')} rows={a.tarea === 'lisp' ? 12 : 4} value={b.desarrollo} spellCheck={false} placeholder={a.tarea === 'lisp' ? '(defun ... )\n\n; Probá acá tus casos base y los ejemplos.' : 'Anotá los pasos, las particiones o la justificación de tu respuesta.'} onChange={ev => cambiar({ desarrollo: ev.target.value })} /></label>
      {!examen && a.tarea !== 'lisp' && <button className="btn primario" onClick={() => onCambio({ ...b, resultado: evaluarActividad(a, b) })}>Verificar respuesta</button>}
      {!examen && a.tarea === 'lisp' && <><p className="aviso">La app guarda tu código. La corrección de LISP se hace con IA o con tu docente; no se ejecuta código aquí.</p><label className="casilla"><input type="checkbox" checked={b.revisado ?? false} onChange={ev => onCambio({ ...b, revisado: ev.target.checked })} />Ya revisé mi resolución externamente</label></>}
    </fieldset>
    {b.resultado && <div role="status" className={`veredicto ${b.resultado.veredicto}`}><strong>{b.resultado.veredicto === 'correcto' ? 'Verificado' : b.resultado.veredicto === 'sin-respuesta' ? 'Falta completar' : 'Revisá tu respuesta'}</strong><p>{b.resultado.mensaje}</p>{b.resultado.advertencia && <p>{b.resultado.advertencia}</p>}</div>}
    {!examen && <details className="consejo"><summary>Consejo para resolverlo</summary><p>{a.consejo}</p>{a.lenguaje?.nota && <p>{a.lenguaje.nota}</p>}</details>}
    {!examen && a.tarea !== 'lisp' && <section className="solucion-control"><button className="btn texto chico" aria-expanded={solucionVisible} onClick={() => setSolucionVisible(v => !v)}>{solucionVisible ? 'Ocultar solución de referencia' : 'Mostrar solución de referencia'}</button>{solucionVisible && <Solucion actividad={a} />}</section>}
    <AccionesIA texto={texto} soloEnunciado={`${a.id}\n${a.enunciado}${original ? '\n\n' + textoRespuesta({ ...a, automata: original }, { expresion: '', desarrollo: '', diagramas: {} }).split('MI RESPUESTA')[0] : ''}`} />
  </div>
}
function Solucion({ actividad: a }: { actividad: Actividad }) {
  const ref = a.expresion ?? a.lenguaje?.referencia
  const calculada = useMemo(() => {
    if (a.automata) return { er: eliminacionDeEstados(normalizar(a.automata)).expresion, automata: null }
    if (!ref) return null
    const c = convertirER(ref)
    return { er: ref, automata: a.tarea === 'er-afn' ? c.thompson.automata : c.minimo }
  }, [a, ref])
  return <div className="solucion">{calculada ? <><p>Una ER equivalente: <code className="er-final">{calculada.er}</code></p>{calculada.automata && <div className="etapa-diagrama"><Diagrama automata={calculada.automata} alto={240} /></div>}<p className="ayuda">Compará el lenguaje y el procedimiento. Hay otras respuestas válidas.</p></> : <p>{a.lenguaje?.porQueNo}</p>}</div>
}
